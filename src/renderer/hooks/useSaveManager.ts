import { useState, useCallback, useMemo } from 'react';
import { ExcelFile, GridparkCodeFile } from '../types/excel';
import { SheetSessionState } from '../features/workbook/components/ExcelViewer';
import { WorkbookTab } from '../types/tabs';

/**
 * Unified save and dirty state manager
 * 
 * This hook provides a single source of truth for:
 * - Dirty state tracking
 * - Save operations
 * - State cleanup after save
 * 
 * Design principles:
 * 1. Single dirty map for all file types
 * 2. Simple save methods that handle cleanup
 * 3. No duplicate state tracking
 */

export interface SaveManagerParams {
  // Sheet save dependencies
  sheetSessions: Record<string, SheetSessionState>;
  findWorkbookNode: (workbookId: string) => any;
  updateWorkbookReferences: (workbookId: string, updatedFile: ExcelFile) => void;
  saveWorkbookFile: (file: ExcelFile) => Promise<void>;
  
  // Manifest save dependencies
  manifestSessions: Record<string, any>;
  getManifestSessionKey: (file: ExcelFile) => string;
  
  // Code save dependencies
  codeSessions: Record<string, any>;
  
  // Tab information
  openTabs: WorkbookTab[];
}

export interface SaveHandlers {
  handleSaveSheetSession: (tabId: string, state: SheetSessionState) => Promise<void>;
  handleSaveManifest: (workbookId: string, file: ExcelFile) => Promise<void>;
  onSaveCode: (codeFile: GridparkCodeFile) => Promise<void>;
}

export const useSaveManager = (params: SaveManagerParams, handlers: SaveHandlers) => {
  const {
    sheetSessions,
    findWorkbookNode,
    updateWorkbookReferences,
    saveWorkbookFile,
    manifestSessions,
    getManifestSessionKey,
    codeSessions,
    openTabs,
  } = params;

  const {
    handleSaveSheetSession: saveSheetHandler,
    handleSaveManifest: saveManifestHandler,
    onSaveCode: saveCodeHandler,
  } = handlers;

  // ============================================
  // Single source of truth for dirty state
  // ============================================
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  // ============================================
  // Dirty state operations
  // ============================================
  
  const markDirty = useCallback((id: string) => {
    console.log('[SaveManager] markDirty:', id);
    setDirtyMap(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
  }, []);

  const markClean = useCallback((id: string) => {
    console.log('[SaveManager] markClean:', id);
    setDirtyMap(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const isDirty = useCallback((id: string) => {
    return Boolean(dirtyMap[id]);
  }, [dirtyMap]);

  const dirtyIds = useMemo(() => {
    return Object.keys(dirtyMap);
  }, [dirtyMap]);

  // ============================================
  // Save operations
  // ============================================

  const saveSheet = useCallback(async (tabId: string) => {
    console.log('[SaveManager] saveSheet:', tabId);
    const session = sheetSessions[tabId];
    if (!session) {
      console.warn('[SaveManager] No sheet session found:', tabId);
      return;
    }

    const tab = openTabs.find(t => t.id === tabId && t.kind === 'sheet');
    if (!tab || tab.kind !== 'sheet') {
      console.warn('[SaveManager] Sheet tab not found:', tabId);
      return;
    }

    const workbookNode = findWorkbookNode(tab.workbookId);
    const workbookFile = workbookNode?.file;
    if (!workbookFile) {
      console.warn('[SaveManager] Workbook file not found:', tab.workbookId);
      return;
    }

    // Update workbook with sheet data
    const updatedSheets = workbookFile.sheets.map((sheet) =>
      sheet.name === tab.sheetName
        ? {
            ...sheet,
            data: session.data,
            rowCount: session.data.length,
            colCount: session.data[0]?.length ?? sheet.colCount,
          }
        : sheet,
    );
    const updatedFile = { ...workbookFile, sheets: updatedSheets };
    
    updateWorkbookReferences(tab.workbookId, updatedFile);
    await saveWorkbookFile(updatedFile);
    
    // Clear dirty state AFTER successful save
    markClean(tabId);
    console.log('[SaveManager] Sheet saved successfully:', tabId);
  }, [sheetSessions, openTabs, findWorkbookNode, updateWorkbookReferences, saveWorkbookFile, markClean]);

  const saveManifest = useCallback(async (tabId: string, workbookId: string, file: ExcelFile) => {
    console.log('[SaveManager] saveManifest:', tabId, workbookId);
    
    await saveManifestHandler(workbookId, file);
    
    // Clear dirty state AFTER successful save (use tabId)
    markClean(tabId);
    console.log('[SaveManager] Manifest saved successfully:', tabId);
  }, [saveManifestHandler, markClean]);

  const saveCode = useCallback(async (tabId: string, codeFile: GridparkCodeFile) => {
    console.log('[SaveManager] saveCode:', tabId, codeFile.absolutePath);
    
    await saveCodeHandler(codeFile);
    
    // Clear dirty state AFTER successful save (use tabId)
    markClean(tabId);
    console.log('[SaveManager] Code saved successfully:', tabId);
  }, [saveCodeHandler, markClean]);

  // ============================================
  // Unified save function
  // ============================================

  const save = useCallback(async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) {
      console.warn('[SaveManager] Tab not found:', tabId);
      return;
    }

    try {
      if (tab.kind === 'sheet') {
        await saveSheet(tabId);
      } else if (tab.kind === 'manifest') {
        await saveManifest(tabId, tab.workbookId, tab.file);
      } else if (tab.kind === 'code') {
        await saveCode(tabId, tab.codeFile);
      }
    } catch (error) {
      console.error('[SaveManager] Save failed:', error);
      throw error;
    }
  }, [openTabs, saveSheet, saveManifest, saveCode]);

  // Save all dirty files
  const saveAll = useCallback(async () => {
    console.log('[SaveManager] saveAll: saving', dirtyIds.length, 'files');
    
    // dirtyIds are all tabIds now
    const results = await Promise.allSettled(
      dirtyIds.map(tabId => save(tabId))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('[SaveManager] Some saves failed:', failed);
    }
  }, [dirtyIds, save]);

  return {
    // Dirty state
    dirtyMap,
    dirtyIds,
    isDirty,
    markDirty,
    markClean,
    
    // Save operations
    save,
    saveAll,
    saveSheet,
    saveManifest,
    saveCode,
  };
};
