/**
 * useSaveManager Hook
 * 
 * Manages all save-related logic:
 * - Dirty state tracking (via Redux)
 * - Save operations (sheets, manifests, code)
 * - Save all functionality
 * 
 * This hook encapsulates ALL save logic so that components/pages
 * don't need to know about Redux, file operations, or save strategies.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../stores';
import {
  markDirty,
  markClean,
  selectDirtyTabs,
  selectDirtyMap,
} from '../../../stores/spreadsheetSlice';
import type { ExcelFile, GridparkCodeFile } from '../../../renderer/types/excel';
import type { WorkbookTab } from '../../../renderer/types/tabs';

export interface UseSaveManagerParams {
  // Workspace functions
  findWorkbookNode: (workbookId: string) => any;
  updateWorkbookReferences: (workbookId: string, file: ExcelFile) => void;
  
  // File operations
  saveWorkbookFile: (file: ExcelFile) => Promise<void>;
  manifestSaveHandler: (workbookId: string, file: ExcelFile) => Promise<void>;
  onSaveCode: (codeFile: GridparkCodeFile) => Promise<void>;
  
  // Tabs
  openTabs: WorkbookTab[];
}

export interface UseSaveManagerReturn {
  // Dirty state
  dirtyMap: Record<string, boolean>;
  dirtyIds: string[];
  isDirty: (id: string) => boolean;
  
  // Mark operations
  markTabDirty: (id: string) => void;
  markTabClean: (id: string) => void;
  
  // Save operations
  saveTab: (tabId: string) => Promise<void>;
  saveAllDirtyTabs: () => Promise<void>;
  
  // Helper
  tabIsDirty: (tab: WorkbookTab) => boolean;
}

export function useSaveManager(params: UseSaveManagerParams): UseSaveManagerReturn {
  const {
    findWorkbookNode,
    updateWorkbookReferences,
    saveWorkbookFile,
    manifestSaveHandler,
    onSaveCode,
    openTabs,
  } = params;
  
  const dispatch = useAppDispatch();
  const dirtyMap = useAppSelector(selectDirtyMap);
  const dirtyIds = useAppSelector(selectDirtyTabs);
  
  // ============================================
  // Dirty State Helpers
  // ============================================
  
  const isDirty = useCallback((id: string) => Boolean(dirtyMap[id]), [dirtyMap]);
  
  const markTabDirty = useCallback((id: string) => {
    console.log('[SaveManager] markDirty:', id);
    dispatch(markDirty(id));
  }, [dispatch]);
  
  const markTabClean = useCallback((id: string) => {
    console.log('[SaveManager] markClean:', id);
    dispatch(markClean(id));
  }, [dispatch]);
  
  const tabIsDirty = useCallback((tab: WorkbookTab): boolean => {
    return Boolean(dirtyMap[tab.id]);
  }, [dirtyMap]);
  
  // ============================================
  // Save Operations
  // ============================================
  
  const saveSheet = useCallback(async (tabId: string) => {
    console.log('[SaveManager] saveSheet:', tabId);
    const tab = openTabs.find(t => t.id === tabId && t.kind === 'sheet');
    if (!tab || tab.kind !== 'sheet') return;

    const workbookNode = findWorkbookNode(tab.workbookId);
    const workbookFile = workbookNode?.file;
    if (!workbookFile) return;

    // Save workbook (will load data from Dexie)
    await saveWorkbookFile(workbookFile);
    
    // Mark as clean in both Redux and Dexie
    markTabClean(tabId);
    
    // Also mark clean in Dexie
    const { db } = await import('../../../lib/db');
    await db.markSheetDirty(tabId, false);
  }, [openTabs, findWorkbookNode, saveWorkbookFile, markTabClean]);
  
  const saveTab = useCallback(async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    try {
      if (tab.kind === 'sheet') {
        await saveSheet(tabId);
      } else if (tab.kind === 'manifest') {
        await manifestSaveHandler(tab.workbookId, tab.file);
        markTabClean(tabId);
      } else if (tab.kind === 'code') {
        await onSaveCode(tab.codeFile);
        markTabClean(tabId);
      }
    } catch (error) {
      console.error('[SaveManager] Save failed:', error);
      throw error;
    }
  }, [openTabs, saveSheet, manifestSaveHandler, onSaveCode, markTabClean]);
  
  const saveAllDirtyTabs = useCallback(async () => {
    console.log('[SaveManager] saveAll:', dirtyIds.length, 'files');
    await Promise.allSettled(dirtyIds.map(id => saveTab(id)));
  }, [dirtyIds, saveTab]);
  
  // ============================================
  // Return API
  // ============================================
  
  return {
    // Dirty state
    dirtyMap,
    dirtyIds,
    isDirty,
    
    // Mark operations
    markTabDirty,
    markTabClean,
    
    // Save operations
    saveTab,
    saveAllDirtyTabs,
    
    // Helper
    tabIsDirty,
  };
}
