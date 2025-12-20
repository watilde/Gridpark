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

import { useMemo, useCallback, useReducer } from 'react';
import { useWorkspace } from '../../../renderer/hooks/useWorkspace';
import { useSaveWorkbook } from '../../../renderer/hooks/useFileSessions';
import { useFormulaBarOptimized } from '../../../renderer/hooks/useFormulaBarOptimized';
import { useElectronIntegration } from '../../../renderer/hooks/useElectronAPI';
import { useAutoSave } from './useAutoSave';
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
  // File Sessions (OPTIMIZED - Direct Dexie + File System)
  // ============================================

  // Sheet data: Managed by Dexie (use useExcelSheet hook in components)
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
  // Save Manager (Simplified - Dirty tracking is now in Dexie)
  // ============================================

  // TODO: Refactor to use Dexie dirty state instead of Redux
  const saveManager = {
    dirtyMap: {},
    dirtyIds: [],
    isDirty: (_id: string) => false,
    markTabDirty: (_id: string) => {},
    markTabClean: (_id: string) => {},
    saveTab: async (_tabId: string) => {},
    saveAllDirtyTabs: async () => {},
    tabIsDirty: (_tab: any) => false,
  };

  // ============================================
  // Auto-Save
  // ============================================

  const autoSave = useAutoSave({
    dirtyCount: 0, // TODO: Use Dexie dirty state
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
    // TODO: Query Dexie sheetMetadata.dirty to populate this map
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
