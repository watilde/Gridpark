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

import React, { useCallback, useEffect, useMemo } from 'react';
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
 * Dexie-powered Excel Viewer
 */
export const ExcelViewerDexie: React.FC<ExcelViewerDexieProps> = ({
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
}) => {
  // ============================================================================
  // Dexie Integration
  // ============================================================================
  
  const sheet = file?.sheets?.[sheetIndex];
  
  const excelSheet = useExcelSheet({
    tabId,
    workbookId: file?.path || 'unknown',
    sheetName: sheet?.name || 'Sheet1',
    sheetIndex,
    minRows: 1000,
    minCols: 100,
  });
  
  const {
    data: data2D,
    isDirty,
    save2DArray,
    isLoading,
  } = excelSheet;
  
  // ============================================================================
  // Initial Data Load
  // ============================================================================
  
  // Load initial data from file into Dexie (if not already loaded)
  useEffect(() => {
    if (!file || !sheet || isLoading) return;
    
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
        
        await save2DArray(sheet.data);
      }
    };
    
    loadInitialData();
  }, [file, sheet, isLoading, excelSheet.cellCount, save2DArray, tabId]);
  
  // ============================================================================
  // Dirty State Synchronization
  // ============================================================================
  
  useEffect(() => {
    console.log('[ExcelViewerDexie] Dirty state changed', { tabId, isDirty });
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange, tabId]);
  
  // ============================================================================
  // Session State for ExcelViewer (backward compatibility)
  // ============================================================================
  
  const sessionState = useMemo(() => ({
    data: data2D,
    dirty: isDirty,
    scrollTop: 0,
    scrollLeft: 0,
    selectedCell: null,
    selectionRange: null,
  }), [data2D, isDirty]);
  
  // ============================================================================
  // Callbacks
  // ============================================================================
  
  /**
   * Handle session changes from ExcelViewer
   * This saves the 2D array back to Dexie
   */
  const handleSessionChange = useCallback(async (newState: any) => {
    if (!newState?.data) return;
    
    console.log('[ExcelViewerDexie] Session changed, saving to Dexie', {
      tabId,
      rows: newState.data.length,
      cols: newState.data[0]?.length || 0,
      dirty: newState.dirty,
    });
    
    // Save to Dexie (this will automatically mark as dirty)
    await save2DArray(newState.data);
  }, [save2DArray, tabId]);
  
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
};
