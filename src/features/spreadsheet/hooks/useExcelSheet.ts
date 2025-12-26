/**
 * useExcelSheet Hook (OPTIMIZED v3 - Database Only)
 *
 * This is the STATE LAYER that bridges:
 * - In-memory database (sparse matrix storage with useLiveQuery)
 *
 * Provides a clean API for components to:
 * - Read/write cell data reactively
 * - Track dirty state automatically (via Database only)
 * - Handle save operations
 * - Convert between sparse matrix and 2D array formats
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Sparse matrix storage (only non-empty cells)
 * - Efficient range queries
 * - Memoized cell lookups
 * - Batch updates
 *
 * ARCHITECTURE:
 * - Dirty tracking: database sheetMetadata.dirty (single source of truth)
 * - No Redux dirty state (removed to prevent data inconsistency)
 */

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { db, StoredCellData, CellData, CellValue, CellStyleData } from '../../../lib/db';
import { useExcelUndoRedo, CellChange } from './useExcelUndoRedo';
import { debounce } from '../../../lib/utils';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Shallow equality check for cell style objects
 */
function shallowEqual(
  a: CellStyleData | undefined,
  b: CellStyleData | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;

  const keysA = Object.keys(a) as Array<keyof CellStyleData>;
  const keysB = Object.keys(b) as Array<keyof CellStyleData>;

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => a[key] === b[key]);
}

/**
 * Check if two cell data objects are equal (optimized for performance)
 */
function cellDataEquals(
  a: { value: CellValue; type: string; formula?: string; style?: CellStyleData },
  b: { value: CellValue; type: string; formula?: string; style?: CellStyleData }
): boolean {
  return (
    a.value === b.value &&
    a.type === b.type &&
    a.formula === b.formula &&
    shallowEqual(a.style, b.style)
  );
}

// ============================================================================
// Types
// ============================================================================

export interface UseExcelSheetParams {
  tabId: string; // Unique tab ID (primary key)
  workbookId: string; // Workbook identifier
  sheetName: string; // Sheet name
  sheetIndex: number; // Sheet position in workbook
  minRows?: number; // Minimum rows to render (default: 100)
  minCols?: number; // Minimum columns to render (default: 26 = A-Z)
}

export interface CellUpdate {
  row: number;
  col: number;
  value?: CellValue;
  type?: string;
  formula?: string;
  style?: Record<string, any>;
}

export interface SheetSessionState {
  data: CellData[][]; // 2D array format (for ExcelViewer compatibility)
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
    minRows = 100, // Default: 100 rows (reasonable for most sheets)
    minCols = 26, // Default: 26 cols (A-Z, standard Excel columns)
  } = params;

  // ========================================================================
  // Undo/Redo History
  // ========================================================================

  const undoRedo = useExcelUndoRedo();

  // ========================================================================
  // Database State (Single source of truth for both data and dirty flag)
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

  // Get sheet metadata (using state for reactivity with event-driven updates)
  const [metadata, setMetadata] = useState<any>();
  const [cells, setCells] = useState<StoredCellData[]>([]);

  // Subscribe to database changes (event-driven, no polling!)
  // OPTIMIZED: Only subscribe to changes for THIS specific tabId
  useEffect(() => {
    // Initial load
    const loadData = async () => {
      const meta = await db.getSheetMetadata(tabId);
      const cellData = await db.getCellsForSheet(tabId);
      setMetadata(meta);
      setCells(cellData);
    };
    
    loadData();

    // Subscribe to changes for this specific tabId only (filtered)
    const unsubscribe = db.subscribe((event) => {
      console.log('[useExcelSheet] Database change detected', { 
        tabId, 
        eventTabId: event.tabId,
        type: event.type, 
        action: event.action 
      });
      
      // Reload data immediately (only called for matching tabId)
      loadData();
    }, { tabId }); // ← FILTER: Only listen to this tabId

    return unsubscribe;
  }, [tabId]);

  // ========================================================================
  // Computed Values
  // ========================================================================

  // Convert sparse cell array to 2D array (for ExcelViewer compatibility)
  const data2D = useMemo((): CellData[][] => {
    if (!cells) {
      return [];
    }

    // Use metadata dimensions (more efficient than calculating from cells)
    const metaMaxRow = metadata?.maxRow ?? 0;
    const metaMaxCol = metadata?.maxCol ?? 0;

    // Ensure minimum dimensions
    const rows = Math.max(minRows, metaMaxRow + 1);
    const cols = Math.max(minCols, metaMaxCol + 1);

    // Create empty 2D array
    const result: CellData[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(
            (): CellData => ({
              value: null,
              type: 'empty',
            })
          )
      );

    // Fill with actual cell data (single loop)
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
  const getCell = useCallback(
    (row: number, col: number): StoredCellData | undefined => {
      const key = `${row},${col}`;
      return cellMap.get(key);
    },
    [cellMap]
  );

  /**
   * Update a single cell
   */
  const updateCell = useCallback(
    async (update: CellUpdate) => {
      const { row, col, ...data } = update;

      // Get old cell value for history
      const oldCell = getCell(row, col);
      const oldData = oldCell
        ? {
            value: oldCell.value,
            type: oldCell.type,
            formula: oldCell.formula,
            style: oldCell.style,
          }
        : { value: null, type: 'empty' };

      // Update database
      await db.upsertCell(tabId, row, col, data as Partial<StoredCellData>);

      // Record history
      undoRedo.pushHistory([
        {
          row,
          col,
          before: oldData,
          after: data,
        },
      ]);

      // Mark sheet as dirty in Database only
      await db.markSheetDirty(tabId, true);
    },
    [tabId, getCell, undoRedo]
  );

  /**
   * Update multiple cells at once (optimized)
   */
  const updateCells = useCallback(
    async (updates: CellUpdate[]) => {
      // Collect history for all changes
      const changes: CellChange[] = updates.map(({ row, col, ...data }) => {
        const oldCell = getCell(row, col);
        const oldData = oldCell
          ? {
              value: oldCell.value,
              type: oldCell.type,
              formula: oldCell.formula,
              style: oldCell.style,
            }
          : { value: null, type: 'empty' };

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

      // Mark sheet as dirty in Database only
      await db.markSheetDirty(tabId, true);
    },
    [tabId, getCell, undoRedo]
  );

  /**
   * Clear a cell
   */
  const clearCell = useCallback(
    async (row: number, col: number) => {
      await db.deleteCell(tabId, row, col);

      // Mark as dirty in Database only
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );

  /**
   * Save entire 2D array (for compatibility with existing code)
   * Converts 2D array to sparse matrix and saves to DB
   *
   * @param data - 2D array to save
   * @param options - Save options
   * @param options.recordHistory - Whether to record changes in undo/redo history (default: true)
   * @param options.markDirty - Whether to mark the sheet as dirty (default: true)
   */
  const save2DArray = useCallback(
    async (data: CellData[][], options: { recordHistory?: boolean; markDirty?: boolean } = {}) => {
      const { recordHistory = true, markDirty: shouldMarkDirty = true } = options;

      // Calculate changes for history (only if recordHistory is true)
      if (recordHistory) {
        const changes: CellChange[] = [];

        for (let row = 0; row < data.length; row++) {
          for (let col = 0; col < data[row].length; col++) {
            const newCell = data[row][col];
            const oldCell = getCell(row, col);

            const oldData = oldCell
              ? {
                  value: oldCell.value,
                  type: oldCell.type,
                  formula: oldCell.formula,
                  style: oldCell.style,
                }
              : { value: null, type: 'empty' as const };

            const newData = {
              value: newCell?.value ?? null,
              type: newCell?.type ?? 'empty',
              formula: newCell?.formula,
              style: newCell?.style,
            };

            // Use optimized equality check instead of JSON.stringify
            if (!cellDataEquals(oldData, newData)) {
              changes.push({
                row,
                col,
                before: oldData,
                after: newData,
              });
            }
          }
        }

        // Record history if there are changes
        if (changes.length > 0) {
          undoRedo.pushHistory(changes);
        }
      }

      await db.save2DArrayAsCells(tabId, data);

      // Mark as dirty only if requested (skip for initial load)
      if (shouldMarkDirty) {
        await db.markSheetDirty(tabId, true);
      }
    },
    [tabId, getCell, undoRedo]
  );

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
  }, [tabId]);

  // ========================================================================
  // Undo/Redo Operations
  // ========================================================================

  /**
   * Apply cell changes (used by undo/redo)
   */
  const applyChanges = useCallback(
    async (changes: CellChange[]) => {
      const cellUpdates = changes.map(({ row, col, after }) => ({
        row,
        col,
        data: after as Partial<StoredCellData>,
      }));

      // Bulk update database (without recording history)
      await db.bulkUpsertCells(tabId, cellUpdates);

      // Mark sheet as dirty in Database only
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );

  /**
   * Undo last change
   */
  const undo = useCallback(async () => {
    console.log('[useExcelSheet] Undo called', {
      tabId,
      canUndo: undoRedo.canUndo,
      historySize: undoRedo.historySize,
      currentIndex: undoRedo.currentIndex,
    });
    const changes = undoRedo.undo();
    if (changes) {
      console.log('[useExcelSheet] Applying undo changes', { changeCount: changes.length });
      await applyChanges(changes);
    } else {
      console.log('[useExcelSheet] No changes to undo');
    }
  }, [undoRedo, applyChanges, tabId]);

  /**
   * Redo previously undone change
   */
  const redo = useCallback(async () => {
    console.log('[useExcelSheet] Redo called', {
      tabId,
      canRedo: undoRedo.canRedo,
      historySize: undoRedo.historySize,
      currentIndex: undoRedo.currentIndex,
    });
    const changes = undoRedo.redo();
    if (changes) {
      console.log('[useExcelSheet] Applying redo changes', { changeCount: changes.length });
      await applyChanges(changes);
    } else {
      console.log('[useExcelSheet] No changes to redo');
    }
  }, [undoRedo, applyChanges, tabId]);

  /**
   * Clear undo/redo history
   */
  const clearHistory = useCallback(() => {
    undoRedo.clear();
  }, [undoRedo]);

  // ========================================================================
  // Auto-update sheet metadata last accessed time (with debounce)
  // ========================================================================

  // Update last accessed time when metadata changes
  useEffect(() => {
    if (!metadata?.tabId) return;

    const updateLastAccessed = async () => {
      try {
        const currentMetadata = await db.getSheetMetadata(metadata.tabId);
        if (currentMetadata) {
          await db.upsertSheetMetadata({
            ...currentMetadata,
            lastAccessedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('[useExcelSheet] Failed to update lastAccessedAt:', error);
      }
    };

    // Debounce: update at most once every 2 seconds
    const timeout = setTimeout(updateLastAccessed, 2000);

    return () => clearTimeout(timeout);
  }, [metadata?.tabId]);

  // ========================================================================
  // Return API
  // ========================================================================

  return {
    // Metadata
    metadata,

    // Data (multiple formats)
    cells: cells || [], // Sparse array (original format)
    cellMap, // Map for O(1) lookup
    data: data2D, // 2D array (ExcelViewer format)

    // Cell operations
    getCell,
    updateCell,
    updateCells,
    clearCell,

    // Batch operations
    save2DArray, // Save entire 2D array
    load2DArray, // Load as 2D array

    // State (from Database only)
    isDirty: metadata?.dirty ?? false,

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
