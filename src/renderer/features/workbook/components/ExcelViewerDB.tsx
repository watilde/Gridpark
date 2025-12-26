/**
 * ExcelViewerDB - Database-powered Excel Viewer
 *
 * This is a wrapper around the existing ExcelViewer that:
 * 1. Uses useExcelSheet hook to load/save data from in-memory database
 * 2. Automatically tracks dirty state in Redux
 * 3. Provides backward-compatible API
 *
 * This component replaces the old session-based ExcelViewer.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react';
import { ExcelFile } from '../../../types/excel';
// import { CellData, CellPosition, CellRange } from '../../../types/excel';
import { useExcelSheet } from '../../../../features/spreadsheet/hooks/useExcelSheet';
import { ExcelViewer } from './ExcelViewer';
import type {
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
  ActiveCellDetails,
} from './ExcelViewer';

export interface ExcelViewerDBProps {
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
 * Ref handle exposed by ExcelViewerDB
 */
export interface ExcelViewerDBHandle {
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
  /**
   * Force save immediately (flush pending changes)
   */
  save: () => Promise<void>;
}

/**
 * Database-powered Excel Viewer
 */
export const ExcelViewerDB = forwardRef<ExcelViewerDBHandle, ExcelViewerDBProps>(
  (
    {
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
    },
    ref
  ) => {
    // ============================================================================
    // Database Integration
    // ============================================================================

    const sheet = file?.sheets?.[sheetIndex];

    // Keep onDirtyChange ref to always call the latest version
    const onDirtyChangeRef = useRef(onDirtyChange);
    useEffect(() => {
      onDirtyChangeRef.current = onDirtyChange;
    }, [onDirtyChange]);

    // PERFORMANCE FIX: Reduce initial array size to prevent memory issues
    // - Old: 1000×100 = 100,000 cells (caused DataCloneError in React DevTools)
    // - New: 100×26 = 2,600 cells (reasonable default)
    // - ExcelViewer will dynamically expand as user scrolls/edits
    const excelSheet = useExcelSheet({
      tabId,
      workbookId: file?.path || 'unknown',
      sheetName: sheet?.name || 'Sheet1',
      sheetIndex,
      minRows: 100, // Reduced from 1000 (10x smaller)
      minCols: 26, // Reduced from 100 (A-Z columns)
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
    // Performance Optimization - Debounce saves
    // ============================================================================

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingDataRef = useRef<any[][] | null>(null);
    const lastSavedDataRef = useRef<any[][] | null>(null);

    // ============================================================================
    // Expose undo/redo/save methods via ref
    // ============================================================================

    useImperativeHandle(
      ref,
      () => ({
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
        save: async () => {
          // Force save pending data immediately
          if (pendingDataRef.current) {
            console.log('[ExcelViewerDB] Forcing immediate save', { tabId });
            try {
              await save2DArray(pendingDataRef.current);
              lastSavedDataRef.current = pendingDataRef.current;
              pendingDataRef.current = null;
              
              // Clear timeout if exists
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
              }
            } catch (error) {
              console.error('[ExcelViewerDB] Force save error:', error);
            }
          }
        },
      }),
      [undo, redo, canUndo, canRedo, tabId, save2DArray]
    );

    // Debounced save function
    const debouncedSave = useCallback(
      (newData: any[][]) => {
        pendingDataRef.current = newData;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(async () => {
          const dataToSave = pendingDataRef.current;
          if (dataToSave && dataToSave !== lastSavedDataRef.current) {
            // Count non-empty cells for debugging
            const nonEmptyCells = dataToSave.flatMap((row, r) => 
              row.map((cell, c) => ({ r, c, cell }))
            ).filter(({ cell }) => 
              cell && (cell.value !== null && cell.value !== '' && cell.value !== undefined)
            );
            
            console.log('[ExcelViewerDB] Debounced save executing', {
              tabId,
              rows: dataToSave.length,
              cols: dataToSave[0]?.length || 0,
              nonEmptyCellCount: nonEmptyCells.length,
              sampleCells: nonEmptyCells.slice(0, 5).map(({ r, c, cell }) => ({
                position: `[${r}, ${c}]`,
                value: cell.value,
                type: cell.type,
              })),
            });

            try {
              await save2DArray(dataToSave);
              lastSavedDataRef.current = dataToSave;
              console.log('[ExcelViewerDB] Save completed successfully');
            } catch (error) {
              console.error('[ExcelViewerDB] Error saving data:', error);
            }
          } else {
            console.log('[ExcelViewerDB] Skipping save (no changes or same data)', {
              tabId,
              hasData: !!dataToSave,
              isSame: dataToSave === lastSavedDataRef.current,
            });
          }

          pendingDataRef.current = null;
          saveTimeoutRef.current = null;
        }, 500); // 500ms debounce
      },
      [save2DArray, tabId]
    );

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

    // Track if initial data has been loaded PER TAB to prevent re-loading
    const initialDataLoadedRef = useRef<Record<string, boolean>>({});

    // Track loading state for UI
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

    // Load initial data from file into database (if not already loaded)
    useEffect(() => {
      if (!file || !sheet || isLoading) return;

      // Prevent re-running if already loaded for THIS specific tabId
      if (initialDataLoadedRef.current[tabId]) {
        return;
      }

      // Check if we need to load initial data
      const loadInitialData = async () => {
        const { db: _db } = await import('../../../../lib/db');
        
        // CRITICAL: Ensure metadata exists first (lazy initialization)
        const metadata = await _db.getSheetMetadata(tabId);
        if (!metadata) {
          console.log('[ExcelViewerDB] Creating metadata for sheet', { tabId, sheetName: sheet.name });
          await _db.upsertSheetMetadata({
            tabId,
            workbookId: file.path || 'unknown',
            sheetName: sheet.name,
            sheetIndex: sheetIndex,
            maxRow: sheet.rowCount || 100,
            maxCol: sheet.colCount || 26,
            cellCount: 0,
            dirty: false,
          });
        }
        
        // Check if database already has data for this sheet
        const existingCells = await _db.getCellsForSheet(tabId);
        const hasCellsInDB = existingCells.length > 0;

        if (!hasCellsInDB && sheet.data && sheet.data.length > 0) {
          console.log('[ExcelViewerDB] Loading initial data from file into database', {
            tabId,
            sheetName: sheet.name,
            rows: sheet.data.length,
            cols: sheet.data[0]?.length || 0,
          });

          // Set loading state
          setIsLoadingInitialData(true);

          // Mark as loaded BEFORE calling save2DArray to prevent re-entry
          initialDataLoadedRef.current[tabId] = true;

          // Initial load should NOT record history or mark dirty (it's not a user edit)
          try {
            await save2DArray(sheet.data, { recordHistory: false, markDirty: false });

            console.log('[ExcelViewerDB] Initial data saved to database', {
              tabId,
              cellsLoaded: sheet.data.length * (sheet.data[0]?.length || 0),
            });

            // Wait a bit for state to update
            await new Promise(resolve => setTimeout(resolve, 100));

            setIsLoadingInitialData(false);
          } catch (error) {
            console.error('[ExcelViewerDB] Failed to save initial data:', error);
            initialDataLoadedRef.current[tabId] = false;
            setIsLoadingInitialData(false);
          }
        } else if (hasCellsInDB) {
          // Data already exists in database, mark as loaded
          console.log('[ExcelViewerDB] Data already exists in database, skipping initial load', {
            tabId,
            cellCount: existingCells.length,
          });
          initialDataLoadedRef.current[tabId] = true;
        } else {
          // No data in file or database, just mark as loaded
          initialDataLoadedRef.current[tabId] = true;
        }
      };

      loadInitialData();
    }, [file, sheet, isLoading, save2DArray, tabId, sheetIndex]);

    // ============================================================================
    // Dirty State Synchronization
    // ============================================================================

    const prevIsDirtyRef = useRef<boolean>(isDirty);

    useEffect(() => {
      // Only notify if dirty state actually changed
      if (prevIsDirtyRef.current !== isDirty) {
        console.log('[ExcelViewerDB] Dirty state changed', { tabId, isDirty });
        onDirtyChangeRef.current?.(isDirty);
        prevIsDirtyRef.current = isDirty;
      }
    }, [isDirty, tabId]);

    // ============================================================================
    // Session State for ExcelViewer (backward compatibility)
    // ============================================================================

    // FIX: Pass data2D directly to sessionState to ensure changes are reflected
    // PROBLEM: Using data2DRef caused stale data - sessionState didn't update when data2D changed
    // SOLUTION: Include data2D in useMemo dependencies
    const sessionState = useMemo(
      () => ({
        data: data2D,
        dirty: isDirty,
        scrollTop: 0,
        scrollLeft: 0,
        selectedCell: null,
        selectionRange: null,
      }),
      [data2D, isDirty]
    );

    // ============================================================================
    // Callbacks
    // ============================================================================

    /**
     * Handle session changes from ExcelViewer
     * OPTIMIZATION: Use debounced save to prevent saving on every cell click
     */
    const handleSessionChange = useCallback(
      (newState: any) => {
        if (!newState?.data) {
          console.log('[ExcelViewerDB] handleSessionChange: no data', { tabId });
          return;
        }

        console.log('[ExcelViewerDB] handleSessionChange called', {
          tabId,
          dirty: newState.dirty,
          dataRows: newState.data.length,
          dataCols: newState.data[0]?.length || 0,
        });

        // Only trigger save if data actually changed (dirty flag is true)
        if (newState.dirty) {
          // Use debounced save instead of immediate save
          debouncedSave(newState.data);
        } else {
          console.log('[ExcelViewerDB] Skipping save (not dirty)');
        }
      },
      [debouncedSave, tabId]
    );

    /**
     * Handle save session (when user explicitly saves)
     * This is a no-op now since saves are handled at the workspace level
     */
    const handleSaveSession = useCallback(
      (state: any) => {
        console.log('[ExcelViewerDB] Save session (no-op, handled by workspace)', {
          tabId,
          dirty: state?.dirty,
        });
      },
      [tabId]
    );

    // ============================================================================
    // Loading State
    // ============================================================================

    if (isLoading || !file) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading sheet data...</div>;
    }

    // Show loading state while initial data is being saved
    if (isLoadingInitialData) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading initial data...</div>;
    }

    // ============================================================================
    // Render ExcelViewer with database data
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
  }
);
