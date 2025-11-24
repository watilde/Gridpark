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

  const saveManifest = useCallback(async (workbookId: string, file: ExcelFile) => {
    console.log('[SaveManager] saveManifest:', workbookId);
    const key = getManifestSessionKey(file);
    
    await saveManifestHandler(workbookId, file);
    
    // Clear dirty state AFTER successful save
    markClean(key);
    console.log('[SaveManager] Manifest saved successfully:', key);
  }, [getManifestSessionKey, saveManifestHandler, markClean]);

  const saveCode = useCallback(async (codeFile: GridparkCodeFile) => {
    console.log('[SaveManager] saveCode:', codeFile.absolutePath);
    const key = codeFile.absolutePath;
    
    await saveCodeHandler(codeFile);
    
    // Clear dirty state AFTER successful save
    markClean(key);
    console.log('[SaveManager] Code saved successfully:', key);
  }, [saveCodeHandler, markClean]);

  // ============================================
  // Unified save function
  // ============================================

  const save = useCallback(async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    try {
      if (tab.kind === 'sheet') {
        await saveSheet(tabId);
      } else if (tab.kind === 'manifest') {
        await saveManifest(tab.workbookId, tab.file);
      } else if (tab.kind === 'code') {
        await saveCode(tab.codeFile);
      }
    } catch (error) {
      console.error('[SaveManager] Save failed:', error);
      throw error;
    }
  }, [openTabs, saveSheet, saveManifest, saveCode]);

  // Save all dirty files
  const saveAll = useCallback(async () => {
    console.log('[SaveManager] saveAll: saving', dirtyIds.length, 'files');
    const results = await Promise.allSettled(
      dirtyIds.map(id => {
        // Find tab by various ID types
        const tab = openTabs.find(t => {
          if (t.id === id) return true;
          if (t.kind === 'manifest') {
            return getManifestSessionKey(t.file) === id;
          }
          if (t.kind === 'code') {
            return t.codeFile.absolutePath === id;
          }
          return false;
        });

        if (!tab) {
          console.warn('[SaveManager] No tab found for dirty id:', id);
          return Promise.resolve();
        }

        return save(tab.id);
      })
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('[SaveManager] Some saves failed:', failed);
    }
  }, [dirtyIds, openTabs, save, getManifestSessionKey]);

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
