/**
 * ExcelViewerDexie - Dexie-powered Excel Viewer
 * 
 * This is a wrapper around the existing ExcelViewer that:
 * 1. Uses useExcelSheet hook to load/save data from Dexie
 * 2. Automatically tracks dirty state in Redux
 * 3. Provides backward-compatible API
 * 
 * This component replaces the old session-based ExcelViewer.
 */

import React, { useCallback, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { ExcelFile, CellData, CellPosition, CellRange } from '../../../types/excel';
import { useExcelSheet } from '../../../../features/spreadsheet/hooks/useExcelSheet';
import { ExcelViewer } from './ExcelViewer';
import type { 
  SearchNavigationCommand, 
  ReplaceCommand, 
  FormulaCommitCommand,
  ActiveCellDetails,
} from './ExcelViewer';

export interface ExcelViewerDexieProps {
  // Tab identification
  tabId: string;
  
  // File data
  file: ExcelFile | null;
  sheetIndex?: number;
  
  // Dirty change callback (called when sheet is edited)
  onDirtyChange?: (dirty: boolean) => void;
  
  // Cell selection callbacks
  onCellSelect?: (position: CellPosition) => void;
  onRangeSelect?: (range: CellRange) => void;
  
  // Search and formula
  searchQuery?: string;
  searchNavigation?: SearchNavigationCommand;
  replaceCommand?: ReplaceCommand | null;
  formulaCommit?: FormulaCommitCommand | null;
  onActiveCellDetails?: (details: ActiveCellDetails) => void;
}

/**
 * Ref handle exposed by ExcelViewerDexie
 */
export interface ExcelViewerDexieHandle {
  /**
   * Execute undo operation
   */
  undo: () => void;
  /**
   * Execute redo operation
   */
  redo: () => void;
  /**
   * Check if undo is available
   */
  canUndo: () => boolean;
  /**
   * Check if redo is available
   */
  canRedo: () => boolean;
}

/**
 * Dexie-powered Excel Viewer
 */
export const ExcelViewerDexie = forwardRef<ExcelViewerDexieHandle, ExcelViewerDexieProps>(({
  tabId,
  file,
  sheetIndex = 0,
  onDirtyChange,
  onCellSelect,
  onRangeSelect,
  searchQuery,
  searchNavigation,
  replaceCommand,
  formulaCommit,
  onActiveCellDetails,
}, ref) => {
  // ============================================================================
  // Dexie Integration
  // ============================================================================
  
  const sheet = file?.sheets?.[sheetIndex];
  
  // PERFORMANCE FIX: Reduce initial array size to prevent memory issues
  // - Old: 1000×100 = 100,000 cells (caused DataCloneError in React DevTools)
  // - New: 100×26 = 2,600 cells (reasonable default)
  // - ExcelViewer will dynamically expand as user scrolls/edits
  const excelSheet = useExcelSheet({
    tabId,
    workbookId: file?.path || 'unknown',
    sheetName: sheet?.name || 'Sheet1',
    sheetIndex,
    minRows: 100,   // Reduced from 1000 (10x smaller)
    minCols: 26,    // Reduced from 100 (A-Z columns)
  });
  
  const {
    data: data2D,
    isDirty,
    save2DArray,
    isLoading,
    undo,
    redo,
    canUndo,
    canRedo,
  } = excelSheet;
  
  // ============================================================================
  // Expose undo/redo methods via ref
  // ============================================================================
  
  useImperativeHandle(ref, () => ({
    undo: () => undo(),
    redo: () => redo(),
    canUndo: () => {
      // No logging here - called every 200ms
      return canUndo;
    },
    canRedo: () => {
      // No logging here - called every 200ms
      return canRedo;
    },
  }), [undo, redo, canUndo, canRedo, tabId]);
  
  // ============================================================================
  // Performance Optimization - Debounce saves
  // ============================================================================
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<any[][] | null>(null);
  const lastSavedDataRef = useRef<any[][] | null>(null);
  
  // Debounced save function
  const debouncedSave = useCallback((newData: any[][]) => {
    pendingDataRef.current = newData;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      const dataToSave = pendingDataRef.current;
      if (dataToSave && dataToSave !== lastSavedDataRef.current) {
        console.log('[ExcelViewerDexie] Debounced save executing', {
          tabId,
          rows: dataToSave.length,
          cols: dataToSave[0]?.length || 0,
        });
        
        try {
          await save2DArray(dataToSave);
          lastSavedDataRef.current = dataToSave;
        } catch (error) {
          console.error('[ExcelViewerDexie] Error saving data:', error);
        }
      }
      
      pendingDataRef.current = null;
      saveTimeoutRef.current = null;
    }, 500); // 500ms debounce
  }, [save2DArray, tabId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // ============================================================================
  // Initial Data Load
  // ============================================================================
  
  // Track if initial data has been loaded to prevent re-loading
  const initialDataLoadedRef = useRef(false);
  
  // Load initial data from file into Dexie (if not already loaded)
  useEffect(() => {
    if (!file || !sheet || isLoading) return;
    
    // Prevent re-running if already loaded
    if (initialDataLoadedRef.current) return;
    
    // Check if we need to load initial data
    const loadInitialData = async () => {
      // If Dexie has no data yet, load from file
      if (excelSheet.cellCount === 0 && sheet.data && sheet.data.length > 0) {
        console.log('[ExcelViewerDexie] Loading initial data from file into Dexie', {
          tabId,
          sheetName: sheet.name,
          rows: sheet.data.length,
          cols: sheet.data[0]?.length || 0,
        });
        
        // Mark as loaded BEFORE calling save2DArray to prevent re-entry
        initialDataLoadedRef.current = true;
        
        // Initial load should NOT record history or mark dirty (it's not a user edit)
        await save2DArray(sheet.data, { recordHistory: false, markDirty: false });
        
        console.log('[ExcelViewerDexie] Initial data saved to Dexie', {
          tabId,
          cellCount: excelSheet.cellCount,
        });
      } else if (excelSheet.cellCount > 0) {
        // Data already exists in Dexie, mark as loaded
        initialDataLoadedRef.current = true;
      }
    };
    
    loadInitialData();
  }, [file, sheet, isLoading, excelSheet.cellCount, save2DArray, tabId]);
  
  // ============================================================================
  // Dirty State Synchronization
  // ============================================================================
  
  const prevIsDirtyRef = useRef<boolean>(isDirty);
  
  useEffect(() => {
    // Only notify if dirty state actually changed
    if (prevIsDirtyRef.current !== isDirty) {
      console.log('[ExcelViewerDexie] Dirty state changed', { tabId, isDirty });
      onDirtyChange?.(isDirty);
      prevIsDirtyRef.current = isDirty;
    }
  }, [isDirty, onDirtyChange, tabId]);
  
  // ============================================================================
  // Session State for ExcelViewer (backward compatibility)
  // ============================================================================
  
  // FIX: Pass data2D directly to sessionState to ensure changes are reflected
  // PROBLEM: Using data2DRef caused stale data - sessionState didn't update when data2D changed
  // SOLUTION: Include data2D in useMemo dependencies
  const sessionState = useMemo(() => {
    console.log('[ExcelViewerDexie] sessionState updated', {
      tabId,
      dataRows: data2D?.length || 0,
      dataCols: data2D?.[0]?.length || 0,
      isDirty,
      cellCount: excelSheet.cellCount,
    });
    return {
      data: data2D,
      dirty: isDirty,
      scrollTop: 0,
      scrollLeft: 0,
      selectedCell: null,
      selectionRange: null,
    };
  }, [data2D, isDirty, tabId, excelSheet.cellCount]);
  
  // ============================================================================
  // Callbacks
  // ============================================================================
  
  /**
   * Handle session changes from ExcelViewer
   * OPTIMIZATION: Use debounced save to prevent saving on every cell click
   */
  const handleSessionChange = useCallback((newState: any) => {
    if (!newState?.data) return;
    
    // Only trigger save if data actually changed (dirty flag is true)
    if (newState.dirty) {
      // Use debounced save instead of immediate save
      debouncedSave(newState.data);
    }
  }, [debouncedSave]);
  
  /**
   * Handle save session (when user explicitly saves)
   * This is a no-op now since saves are handled at the workspace level
   */
  const handleSaveSession = useCallback((state: any) => {
    console.log('[ExcelViewerDexie] Save session (no-op, handled by workspace)', {
      tabId,
      dirty: state?.dirty,
    });
  }, [tabId]);
  
  // ============================================================================
  // Loading State
  // ============================================================================
  
  if (isLoading || !file) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading sheet data...
      </div>
    );
  }
  
  // ============================================================================
  // Render ExcelViewer with Dexie data
  // ============================================================================
  
  return (
    <ExcelViewer
      file={file}
      sheetIndex={sheetIndex}
      sessionState={sessionState}
      onSessionChange={handleSessionChange}
      onSaveSession={handleSaveSession}
      onDirtyChange={onDirtyChange}
      onCellSelect={onCellSelect}
      onRangeSelect={onRangeSelect}
      searchQuery={searchQuery}
      searchNavigation={searchNavigation}
      replaceCommand={replaceCommand}
      formulaCommit={formulaCommit}
      onActiveCellDetails={onActiveCellDetails}
    />
  );
});
