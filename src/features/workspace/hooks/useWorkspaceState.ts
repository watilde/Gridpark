/**
 * useWorkspaceState Hook
 *
 * Central state management hook for the workspace.
 * Aggregates ALL workspace-related state and logic:
 * - File sessions (Excel sheets only)
 * - Workspace management (tabs, nodes, selections)
 * - Save management
 * - Auto-save
 * - Formula bar
 *
 * This is the SINGLE hook that pages should use.
 * All business logic is encapsulated here.
 */

import { useMemo, useCallback, useReducer, useState, useEffect } from 'react';
import { useWorkspace } from '../../../renderer/hooks/useWorkspace';
import { useSaveWorkbook } from '../../../renderer/hooks/useFileSessions';
import { useFormulaBarOptimized } from '../../../renderer/hooks/useFormulaBarOptimized';
import { useElectronIntegration } from '../../../renderer/hooks/useElectronAPI';
import { useAutoSave } from './useAutoSave';
import { db } from '../../../lib/db';
import type { ExcelFile } from '../../../renderer/types/excel';
import type {
  SearchNavigationCommand,
  ReplaceCommand,
} from '../../../renderer/features/workbook/components/ExcelViewer';

/**
 * Search state managed by reducer
 */
interface SearchState {
  treeSearchQuery: string;
  sheetSearchQuery: string;
  searchNavigation: SearchNavigationCommand | undefined;
  replaceCommand: ReplaceCommand | null;
}

type SearchAction =
  | { type: 'SET_TREE_SEARCH'; payload: string }
  | { type: 'SET_SHEET_SEARCH'; payload: string }
  | { type: 'SET_SEARCH_NAVIGATION'; payload: SearchNavigationCommand | undefined }
  | { type: 'SET_REPLACE_COMMAND'; payload: ReplaceCommand | null };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_TREE_SEARCH':
      return { ...state, treeSearchQuery: action.payload };
    case 'SET_SHEET_SEARCH':
      return { ...state, sheetSearchQuery: action.payload };
    case 'SET_SEARCH_NAVIGATION':
      return { ...state, searchNavigation: action.payload };
    case 'SET_REPLACE_COMMAND':
      return { ...state, replaceCommand: action.payload };
    default:
      return state;
  }
};

export interface UseWorkspaceStateReturn {
  // Workspace data
  workbookNodes: any[];
  openTabs: any[];
  activeTabId: string;
  selectedNodeId: string;
  activeTab: any;
  isLoadingFiles: boolean;

  // Search state
  searchState: SearchState;
  setTreeSearchQuery: (query: string) => void;

  // Save manager
  saveManager: {
    dirtyMap: Record<string, boolean>;
    dirtyIds: string[];
    isDirty: (id: string) => boolean;
    markTabDirty: (id: string) => void;
    markTabClean: (id: string) => void;
    saveTab: (tabId: string) => Promise<void>;
    saveAllDirtyTabs: () => Promise<void>;
    tabIsDirty: (tab: any) => boolean;
  };

  // Auto-save
  autoSave: {
    autoSaveEnabled: boolean;
    autoSaveInterval: number;
    toggleAutoSave: (enabled: boolean) => void;
  };

  // Workspace actions (matching useWorkspace signatures)
  handleTabChange: (_event: React.SyntheticEvent | null, value: string | number | null) => void;
  handleCloseTab: (tabId: string) => void;
  handleNodeSelect: (node: any) => void;
  findWorkbookNode: (workbookId: string) => any;
  updateWorkbookReferences: (workbookId: string, file: ExcelFile) => void;

  // Formula bar
  formulaBarState: any;

  // Computed values
  dirtyNodeIds: Record<string, boolean>;

  // Electron
  electron: any;
}

export function useWorkspaceState(): UseWorkspaceStateReturn {
  const electron = useElectronIntegration();

  // ============================================
  // File Sessions (OPTIMIZED - Direct Database + File System)
  // ============================================

  // Sheet data: Managed by database (use useExcelSheet hook in components)
  const { saveWorkbookFile } = useSaveWorkbook();

  // Manifest & Code: File system access only (no useState caching)


  // ============================================
  // Workspace Management
  // ============================================

  const workspace = useWorkspace({});

  const {
    workbookNodes,
    openTabs,
    activeTabId,
    selectedNodeId,
    isLoadingFiles,
    findWorkbookNode,
    updateWorkbookReferences,
    handleTabChange,
    handleNodeSelect,
    handleCloseTab,
  } = workspace;

  // ============================================
  // Search State
  // ============================================

  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    treeSearchQuery: '',
    sheetSearchQuery: '',
    searchNavigation: undefined,
    replaceCommand: null,
  });

  const setTreeSearchQuery = useCallback(
    (query: string) => dispatchSearch({ type: 'SET_TREE_SEARCH', payload: query }),
    []
  );

  // ============================================
  // Save Manager (Single Source of Truth: Database only)
  // ============================================

  // Load dirty state from database (reactive)
  const [allSheetMetadata, setAllSheetMetadata] = useState<any[]>([]);

  useEffect(() => {
    const refreshMetadata = async () => {
      const metadata = await db.getAllSheetMetadata();
      setAllSheetMetadata(metadata);
    };

    refreshMetadata();
    const interval = setInterval(refreshMetadata, 1000); // Refresh every 1s (reduced from 300ms)

    return () => clearInterval(interval);
  }, []);

  // Compute dirty tab IDs from database metadata
  const dirtyTabIds = useMemo(() => {
    return new Set(
      allSheetMetadata
        .filter(meta => meta.dirty)
        .map(meta => meta.tabId)
    );
  }, [allSheetMetadata]);

  // Individual callbacks that work directly with database
  const markTabDirty = useCallback(async (id: string) => {
    console.log('[useWorkspaceState] markTabDirty', { id });
    await db.markSheetDirty(id, true);
  }, []);

  const markTabClean = useCallback(async (id: string) => {
    console.log('[useWorkspaceState] markTabClean', { id });
    await db.markSheetDirty(id, false);
  }, []);

  const saveTab = useCallback(async (tabId: string) => {
    console.log('[useWorkspaceState] === SAVING TAB ===', { tabId });
    
    // Find the tab to determine what to save
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) {
      console.warn('[useWorkspaceState] Tab not found:', tabId);
      throw new Error(`Tab not found: ${tabId}`);
    }

    // For sheet tabs, save the workbook file
    if (tab.kind === 'sheet') {
      const workbookNode = findWorkbookNode(tab.workbookId);
      if (!workbookNode?.file) {
        console.error('[useWorkspaceState] Workbook node or file not found', {
          workbookId: tab.workbookId,
          hasNode: !!workbookNode,
        });
        throw new Error(`Workbook not found for tab: ${tabId}`);
      }

      try {
        console.log('[useWorkspaceState] Saving workbook file...', {
          path: workbookNode.file.path,
          workbookId: tab.workbookId,
        });
        
        // Pass workbookId so the correct tabIds are used
        await saveWorkbookFile(workbookNode.file, tab.workbookId);
        
        console.log('[useWorkspaceState] Workbook saved successfully');
      } catch (error) {
        console.error('[useWorkspaceState] Failed to save workbook:', error);
        throw error; // Re-throw to prevent marking as clean
      }
    }
    
    // No need to markTabClean - saveWorkbookFile already does it
    
    console.log('[useWorkspaceState] === TAB SAVED ===', { tabId });
  }, [openTabs, findWorkbookNode, saveWorkbookFile]);

  const saveAllDirtyTabs = useCallback(async () => {
    console.log('[useWorkspaceState] saveAllDirtyTabs called', {
      dirtyCount: dirtyTabIds.size,
    });
    
    // Save all dirty tabs
    const savePromises = Array.from(dirtyTabIds).map(async tabId => {
      const tab = openTabs.find(t => t.id === tabId);
      if (!tab) return;

      if (tab.kind === 'sheet') {
        const workbookNode = findWorkbookNode(tab.workbookId);
        if (workbookNode?.file) {
          try {
            // Pass workbookId so the correct tabIds are used
            await saveWorkbookFile(workbookNode.file, tab.workbookId);
          } catch (error) {
            console.error('[useWorkspaceState] Failed to save workbook:', error);
          }
        }
      }
    });

    await Promise.all(savePromises);
    
    console.log('[useWorkspaceState] All tabs saved');
  }, [dirtyTabIds, openTabs, findWorkbookNode, saveWorkbookFile]);

  const saveManager = useMemo(
    () => ({
      dirtyMap: Array.from(dirtyTabIds).reduce(
        (acc, id) => {
          acc[id] = true;
          return acc;
        },
        {} as Record<string, boolean>
      ),
      dirtyIds: Array.from(dirtyTabIds),
      isDirty: (id: string) => dirtyTabIds.has(id),
      markTabDirty,
      markTabClean,
      saveTab,
      saveAllDirtyTabs,
      tabIsDirty: (tab: any) => dirtyTabIds.has(tab?.id || ''),
    }),
    [dirtyTabIds, markTabDirty, markTabClean, saveTab, saveAllDirtyTabs]
  );

  // ============================================
  // Auto-Save
  // ============================================

  const autoSave = useAutoSave({
    dirtyCount: dirtyTabIds.size,
    onSaveAll: saveManager.saveAllDirtyTabs,
  });

  // ============================================
  // Active Tab Computed Values
  // ============================================

  const activeTab = useMemo(
    () => openTabs.find(tab => tab.id === activeTabId) || null,
    [openTabs, activeTabId]
  );

  // ============================================
  // Dirty Node IDs
  // ============================================

  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    // TODO: Query database sheetMetadata.dirty to populate this map
    return map;
  }, []);

  // ============================================
  // Formula Bar
  // ============================================

  const formulaBarState = useFormulaBarOptimized(activeTab?.kind);

  // ============================================
  // Return Complete State
  // ============================================

  return {
    // Workspace data
    workbookNodes,
    openTabs,
    activeTabId,
    selectedNodeId,
    activeTab,
    isLoadingFiles,

    // Search state
    searchState,
    setTreeSearchQuery,

    // Save manager
    saveManager,

    // Auto-save
    autoSave,

    // Workspace actions
    handleTabChange,
    handleCloseTab,
    handleNodeSelect,
    findWorkbookNode,
    updateWorkbookReferences,

    // Formula bar
    formulaBarState,

    // Computed values
    dirtyNodeIds,

    // Electron
    electron,
  };
}
