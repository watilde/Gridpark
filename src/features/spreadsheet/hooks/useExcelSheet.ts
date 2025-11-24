/**
 * useExcelSheet Hook
 * 
 * This is the STATE LAYER that bridges:
 * - Dexie.js (table data with useLiveQuery)
 * - Redux (UI state and dirty tracking)
 * 
 * Provides a clean API for components to:
 * - Read/write cell data reactively
 * - Track dirty state automatically
 * - Handle save operations
 */

import { useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CellData } from '../../../lib/db';
import { useAppDispatch, useAppSelector } from '../../../stores';
import { 
  markDirty, 
  markClean,
  selectIsDirty,
  selectSheetSession,
  updateSheetSession,
} from '../../../stores/spreadsheetSlice';

// ============================================================================
// Types
// ============================================================================

export interface UseExcelSheetParams {
  workbookId: string;
  sheetName: string;
  tabId: string;
}

export interface CellUpdate {
  row: number;
  col: number;
  value?: string | number | boolean;
  formula?: string;
  style?: Record<string, any>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExcelSheet({ workbookId, sheetName, tabId }: UseExcelSheetParams) {
  const dispatch = useAppDispatch();
  
  // ========================================================================
  // Redux State (UI state)
  // ========================================================================
  
  const isDirty = useAppSelector(selectIsDirty(tabId));
  const session = useAppSelector(selectSheetSession(tabId));
  
  // ========================================================================
  // Dexie State (Table data with reactive queries)
  // ========================================================================
  
  // Get sheet metadata
  const sheet = useLiveQuery(
    async () => {
      const existing = await db.getSheet(workbookId, sheetName);
      if (!existing) {
        // Auto-create sheet if it doesn't exist
        const sheetId = await db.upsertSheet(workbookId, sheetName, 0);
        return await db.sheets.get(sheetId);
      }
      return existing;
    },
    [workbookId, sheetName]
  );
  
  // Get all cells for this sheet (reactive)
  const cells = useLiveQuery(
    async () => {
      if (!sheet?.id) return [];
      return await db.getCellsForSheet(sheet.id);
    },
    [sheet?.id]
  );
  
  // ========================================================================
  // Computed Values
  // ========================================================================
  
  // Convert cell array to map for fast lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
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
  const getCell = useCallback((row: number, col: number): CellData | undefined => {
    const key = `${row},${col}`;
    return cellMap.get(key);
  }, [cellMap]);
  
  /**
   * Update a single cell
   */
  const updateCell = useCallback(async (update: CellUpdate) => {
    if (!sheet?.id) return;
    
    const { row, col, ...data } = update;
    
    // Update database
    await db.upsertCell(sheet.id, row, col, data);
    
    // Mark as dirty
    dispatch(markDirty(tabId));
  }, [sheet?.id, tabId, dispatch]);
  
  /**
   * Update multiple cells at once (optimized)
   */
  const updateCells = useCallback(async (updates: CellUpdate[]) => {
    if (!sheet?.id) return;
    
    const cellUpdates = updates.map(({ row, col, ...data }) => ({
      sheetId: sheet.id!,
      row,
      col,
      data,
    }));
    
    // Bulk update database
    await db.bulkUpsertCells(cellUpdates);
    
    // Mark as dirty
    dispatch(markDirty(tabId));
  }, [sheet?.id, tabId, dispatch]);
  
  /**
   * Clear a cell
   */
  const clearCell = useCallback(async (row: number, col: number) => {
    await updateCell({ row, col, value: undefined, formula: undefined });
  }, [updateCell]);
  
  // ========================================================================
  // Save Operation
  // ========================================================================
  
  /**
   * Save sheet data (mark as clean)
   * 
   * Note: Actual file system save should be handled by the caller
   * This just updates the dirty state after successful save
   */
  const markSaved = useCallback(() => {
    dispatch(markClean(tabId));
  }, [tabId, dispatch]);
  
  // ========================================================================
  // Session Management (scroll, selection, etc.)
  // ========================================================================
  
  /**
   * Update session state (scroll position, selection, etc.)
   */
  const updateSession = useCallback((updates: Partial<typeof session>) => {
    dispatch(updateSheetSession({ tabId, session: updates }));
  }, [tabId, dispatch]);
  
  // ========================================================================
  // Return API
  // ========================================================================
  
  return {
    // Data
    sheet,
    cells: cells || [],
    cellMap,
    
    // Cell operations
    getCell,
    updateCell,
    updateCells,
    clearCell,
    
    // State
    isDirty,
    session: session || { scrollTop: 0, scrollLeft: 0, dirty: false },
    
    // Actions
    markSaved,
    updateSession,
    
    // Loading state
    isLoading: !sheet,
  };
}
