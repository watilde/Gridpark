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
import type { FileNode } from '../../../renderer/features/file-explorer/FileTree';
import type {
  SearchNavigationCommand,
  ReplaceCommand,
} from '../../../renderer/features/spreadsheet-v2/components/SpreadsheetContainerV2';

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
    saveTabAs: (tabId: string, formatHint?: string) => Promise<void>;
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
  resetWorkbooks: (files: ExcelFile[], directoryName?: string) => void;

  // Formula bar
  formulaBarState: any;

  // Computed values
  dirtyNodeIds: Record<string, boolean>;

  // Electron
  electron: any;
}

export function useWorkspaceState(): UseWorkspaceStateReturn {
  const electron = useElectronIntegration();

  const { saveWorkbookFile, saveWorkbookFileAs } = useSaveWorkbook();

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
    resetWorkbooks,
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

  // Load dirty state from database (event-driven, no polling!)
  // OPTIMIZED: Only subscribe to metadata changes (not cells)
  const [allSheetMetadata, setAllSheetMetadata] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    const loadMetadata = async () => {
      const metadata = await db.getAllSheetMetadata();
      setAllSheetMetadata(metadata);
    };

    loadMetadata();

    const unsubscribe = db.subscribe(() => {
      loadMetadata();
    }, { type: 'metadata' });

    return unsubscribe;
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
    await db.markSheetDirty(id, true);
  }, []);

  const markTabClean = useCallback(async (id: string) => {
    await db.markSheetDirty(id, false);
  }, []);

  const saveTab = useCallback(async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) throw new Error(`Tab not found: ${tabId}`);

    if (tab.kind === 'sheet') {
      const workbookNode = findWorkbookNode(tab.workbookId);
      if (!workbookNode?.file) throw new Error(`Workbook not found for tab: ${tabId}`);
      await saveWorkbookFile(workbookNode.file, tab.workbookId);
    }
  }, [openTabs, findWorkbookNode, saveWorkbookFile]);

  const saveTabAs = useCallback(async (tabId: string, formatHint?: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) throw new Error(`Tab not found: ${tabId}`);

    if (tab.kind === 'sheet') {
      const workbookNode = findWorkbookNode(tab.workbookId);
      if (!workbookNode?.file) throw new Error(`Workbook not found for tab: ${tabId}`);
      await saveWorkbookFileAs(workbookNode.file, tab.workbookId, formatHint);
    }
  }, [openTabs, findWorkbookNode, saveWorkbookFileAs]);

  const saveAllDirtyTabs = useCallback(async () => {
    const savePromises = Array.from(dirtyTabIds).map(async tabId => {
      const tab = openTabs.find(t => t.id === tabId);
      if (!tab || tab.kind !== 'sheet') return;
      const workbookNode = findWorkbookNode(tab.workbookId);
      if (workbookNode?.file) {
        await saveWorkbookFile(workbookNode.file, tab.workbookId);
      }
    });
    await Promise.all(savePromises);
  }, [dirtyTabIds, openTabs, findWorkbookNode, saveWorkbookFile]);

  const saveManager = useMemo(
    () => ({
      // Simplified: just expose the Set directly
      dirtyTabIds,
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
      saveTabAs,
      saveAllDirtyTabs,
      tabIsDirty: (tab: any) => dirtyTabIds.has(tab?.id || ''),
    }),
    [dirtyTabIds, markTabDirty, markTabClean, saveTab, saveTabAs, saveAllDirtyTabs]
  );

  // ============================================
  // Auto-Save
  // ============================================

  const autoSave = useAutoSave({
    dirtyCount: dirtyTabIds.size,
    onSaveAll: saveManager.saveAllDirtyTabs,
    hasOpenFiles: openTabs.length > 0, // Only auto-save when files are open
  });

  // ============================================
  // Active Tab Computed Values
  // ============================================

  const activeTab = useMemo(
    () => openTabs.find(tab => tab.id === activeTabId) || null,
    [openTabs, activeTabId]
  );

  // ============================================
  // Dirty Node IDs (computed from dirtyTabIds and workbookNodes)
  // ============================================

  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};

    const visit = (node: FileNode): boolean => {
      let dirty = false;

      if (node.type === 'sheet') {
        // Check if this sheet's tabId is dirty
        dirty = dirtyTabIds.has(node.id);
      }

      if (node.children?.length) {
        const childDirty = node.children.map(child => visit(child));
        dirty = dirty || childDirty.some(Boolean);
      }

      if (dirty) {
        map[node.id] = true;
      }

      return dirty;
    };

    workbookNodes.forEach(visit);
    return map;
  }, [dirtyTabIds, workbookNodes]);

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
    resetWorkbooks,

    // Formula bar
    formulaBarState,

    // Computed values
    dirtyNodeIds,

    // Electron
    electron,
  };
}
