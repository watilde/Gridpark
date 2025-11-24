/**
 * useExcelSheet Hook (OPTIMIZED v2)
 * 
 * This is the STATE LAYER that bridges:
 * - Dexie.js v2 (sparse matrix storage with useLiveQuery)
 * - Redux (UI state and dirty tracking)
 * 
 * Provides a clean API for components to:
 * - Read/write cell data reactively
 * - Track dirty state automatically
 * - Handle save operations
 * - Convert between sparse matrix and 2D array formats
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Sparse matrix storage (only non-empty cells)
 * - Efficient range queries
 * - Memoized cell lookups
 * - Batch updates
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, StoredCellData } from '../../../lib/db';
import { useAppDispatch, useAppSelector } from '../../../stores';
import { 
  markDirty, 
  markClean,
  selectIsDirty,
} from '../../../stores/spreadsheetSlice';
import { useExcelUndoRedo, CellChange } from './useExcelUndoRedo';

// ============================================================================
// Types
// ============================================================================

export interface UseExcelSheetParams {
  tabId: string;           // Unique tab ID (primary key)
  workbookId: string;      // Workbook identifier
  sheetName: string;       // Sheet name
  sheetIndex: number;      // Sheet position in workbook
  minRows?: number;        // Minimum rows to render (default: 100)
  minCols?: number;        // Minimum columns to render (default: 26 = A-Z)
}

export interface CellUpdate {
  row: number;
  col: number;
  value?: any;
  type?: string;
  formula?: string;
  style?: Record<string, any>;
}

export interface SheetSessionState {
  data: any[][];           // 2D array format (for ExcelViewer compatibility)
  dirty: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExcelSheet(params: UseExcelSheetParams) {
  const { 
    tabId, 
    workbookId, 
    sheetName, 
    sheetIndex,
    minRows = 100,   // Default: 100 rows (reasonable for most sheets)
    minCols = 26,    // Default: 26 cols (A-Z, standard Excel columns)
  } = params;
  
  const dispatch = useAppDispatch();
  
  // ========================================================================
  // Undo/Redo History
  // ========================================================================
  
  const undoRedo = useExcelUndoRedo();
  
  // ========================================================================
  // Redux State (UI state - dirty tracking only)
  // ========================================================================
  
  const isDirty = useAppSelector(selectIsDirty(tabId));
  
  // ========================================================================
  // Dexie State (Table data with reactive queries)
  // ========================================================================
  
  // Initialize sheet metadata on mount (separate from useLiveQuery)
  useEffect(() => {
    let cancelled = false;
    
    const initMetadata = async () => {
      try {
        const existing = await db.getSheetMetadata(tabId);
        if (!existing && !cancelled) {
          // Create initial metadata
          await db.upsertSheetMetadata({
            tabId,
            workbookId,
            sheetName,
            sheetIndex,
            maxRow: 0,
            maxCol: 0,
            cellCount: 0,
            dirty: false,
          });
        }
      } catch (error: any) {
        // Ignore ConstraintError (likely from React Strict Mode double invoke)
        if (error?.name === 'ConstraintError') {
          console.log('[useExcelSheet] ConstraintError ignored (expected in Strict Mode):', tabId);
        } else {
          console.error('[useExcelSheet] Error initializing metadata:', error);
        }
      }
    };
    
    initMetadata();
    
    return () => {
      cancelled = true;
    };
  }, [tabId, workbookId, sheetName, sheetIndex]);
  
  // Get sheet metadata (read-only reactive query)
  const metadata = useLiveQuery(
    async () => {
      return await db.getSheetMetadata(tabId);
    },
    [tabId]
  );
  
  // Get all cells for this sheet (read-only reactive query)
  const cells = useLiveQuery(
    async () => {
      return await db.getCellsForSheet(tabId);
    },
    [tabId]
  );
  
  // ========================================================================
  // Computed Values
  // ========================================================================
  
  // Convert sparse cell array to 2D array (for ExcelViewer compatibility)
  const data2D = useMemo(() => {
    if (!cells) return [];
    
    const rows = Math.max(minRows, (metadata?.maxRow ?? 0) + 1);
    const cols = Math.max(minCols, (metadata?.maxCol ?? 0) + 1);
    
    // Create empty 2D array
    const result: any[][] = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({ value: null as any, type: 'empty' }))
    );
    
    // Fill with actual cell data
    cells.forEach(cell => {
      if (cell.row < rows && cell.col < cols) {
        result[cell.row][cell.col] = {
          value: cell.value,
          type: cell.type,
          formula: cell.formula,
          style: cell.style,
        };
      }
    });
    
    return result;
  }, [cells, metadata?.maxRow, metadata?.maxCol, minRows, minCols]);
  
  // Convert cell array to map for fast lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, StoredCellData>();
    cells?.forEach(cell => {
      const key = `${cell.row},${cell.col}`;
      map.set(key, cell);
    });
    return map;
  }, [cells]);
  
  // ========================================================================
  // Cell Operations
  // ========================================================================
  
  /**
   * Get cell data at specific position
   */
  const getCell = useCallback((row: number, col: number): StoredCellData | undefined => {
    const key = `${row},${col}`;
    return cellMap.get(key);
  }, [cellMap]);
  
  /**
   * Update a single cell
   */
  const updateCell = useCallback(async (update: CellUpdate) => {
    const { row, col, ...data } = update;
    
    // Get old cell value for history
    const oldCell = getCell(row, col);
    const oldData = oldCell ? {
      value: oldCell.value,
      type: oldCell.type,
      formula: oldCell.formula,
      style: oldCell.style,
    } : { value: null, type: 'empty' };
    
    // Update database
    await db.upsertCell(tabId, row, col, data as Partial<StoredCellData>);
    
    // Record history
    undoRedo.pushHistory([{
      row,
      col,
      before: oldData,
      after: data,
    }]);
    
    // Mark sheet as dirty in DB and Redux
    await db.markSheetDirty(tabId, true);
    dispatch(markDirty(tabId));
  }, [tabId, dispatch, getCell, undoRedo]);
  
  /**
   * Update multiple cells at once (optimized)
   */
  const updateCells = useCallback(async (updates: CellUpdate[]) => {
    // Collect history for all changes
    const changes: CellChange[] = updates.map(({ row, col, ...data }) => {
      const oldCell = getCell(row, col);
      const oldData = oldCell ? {
        value: oldCell.value,
        type: oldCell.type,
        formula: oldCell.formula,
        style: oldCell.style,
      } : { value: null, type: 'empty' };
      
      return {
        row,
        col,
        before: oldData,
        after: data,
      };
    });
    
    const cellUpdates = updates.map(({ row, col, ...data }) => ({
      row,
      col,
      data: data as Partial<StoredCellData>,
    }));
    
    // Bulk update database
    await db.bulkUpsertCells(tabId, cellUpdates);
    
    // Record history
    undoRedo.pushHistory(changes);
    
    // Mark sheet as dirty in DB and Redux
    await db.markSheetDirty(tabId, true);
    dispatch(markDirty(tabId));
  }, [tabId, dispatch, getCell, undoRedo]);
  
  /**
   * Clear a cell
   */
  const clearCell = useCallback(async (row: number, col: number) => {
    await db.deleteCell(tabId, row, col);
    
    // Mark as dirty
    await db.markSheetDirty(tabId, true);
    dispatch(markDirty(tabId));
  }, [tabId, dispatch]);
  
  /**
   * Save entire 2D array (for compatibility with existing code)
   * Converts 2D array to sparse matrix and saves to DB
   */
  const save2DArray = useCallback(async (data: any[][]) => {
    await db.save2DArrayAsCells(tabId, data);
    
    // Mark as dirty after initial save (user hasn't persisted to file yet)
    await db.markSheetDirty(tabId, true);
    dispatch(markDirty(tabId));
  }, [tabId, dispatch]);
  
  /**
   * Load 2D array from DB (for compatibility with existing code)
   */
  const load2DArray = useCallback(async () => {
    return await db.getCellsAs2DArray(tabId, minRows, minCols);
  }, [tabId, minRows, minCols]);
  
  // ========================================================================
  // Save Operation
  // ========================================================================
  
  /**
   * Mark sheet as saved (clean)
   * Called after successful file system write
   */
  const markSaved = useCallback(async () => {
    await db.markSheetDirty(tabId, false);
    dispatch(markClean(tabId));
  }, [tabId, dispatch]);
  
  // ========================================================================
  // Undo/Redo Operations
  // ========================================================================
  
  /**
   * Apply cell changes (used by undo/redo)
   */
  const applyChanges = useCallback(async (changes: CellChange[]) => {
    const cellUpdates = changes.map(({ row, col, after }) => ({
      row,
      col,
      data: after as Partial<StoredCellData>,
    }));
    
    // Bulk update database (without recording history)
    await db.bulkUpsertCells(tabId, cellUpdates);
    
    // Mark sheet as dirty in DB and Redux
    await db.markSheetDirty(tabId, true);
    dispatch(markDirty(tabId));
  }, [tabId, dispatch]);
  
  /**
   * Undo last change
   */
  const undo = useCallback(async () => {
    const changes = undoRedo.undo();
    if (changes) {
      await applyChanges(changes);
    }
  }, [undoRedo, applyChanges]);
  
  /**
   * Redo previously undone change
   */
  const redo = useCallback(async () => {
    const changes = undoRedo.redo();
    if (changes) {
      await applyChanges(changes);
    }
  }, [undoRedo, applyChanges]);
  
  /**
   * Clear undo/redo history
   */
  const clearHistory = useCallback(() => {
    undoRedo.clear();
  }, [undoRedo]);
  
  // NOTE: Session state (scroll, selection) removed from Redux
  // Components should manage their own UI state with useState if needed
  
  // ========================================================================
  // Auto-update sheet metadata last accessed time
  // ========================================================================
  
  useEffect(() => {
    if (metadata) {
      // Update last accessed time (debounced)
      const timer = setTimeout(() => {
        db.sheetMetadata.update(metadata.id!, {
          lastAccessedAt: new Date(),
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [metadata]);
  
  // ========================================================================
  // Return API
  // ========================================================================
  
  return {
    // Metadata
    metadata,
    
    // Data (multiple formats)
    cells: cells || [],      // Sparse array (original format)
    cellMap,                 // Map for O(1) lookup
    data: data2D,            // 2D array (ExcelViewer format)
    
    // Cell operations
    getCell,
    updateCell,
    updateCells,
    clearCell,
    
    // Batch operations
    save2DArray,             // Save entire 2D array
    load2DArray,             // Load as 2D array
    
    // State
    isDirty,
    
    // Actions
    markSaved,
    
    // Undo/Redo
    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    clearHistory,
    
    // Loading state
    isLoading: !metadata,
    
    // Stats
    cellCount: metadata?.cellCount ?? 0,
    maxRow: metadata?.maxRow ?? 0,
    maxCol: metadata?.maxCol ?? 0,
  };
}
