/**
 * useWorkspaceState Hook
 *
 * Central state management hook for the workspace.
 * Aggregates ALL workspace-related state and logic:
 * - File sessions
 * - Workspace management (tabs, nodes, selections)
 * - Save management
 * - Auto-save
 * - Formula bar
 * - Manifest handlers
 *
 * This is the SINGLE hook that pages should use.
 * All business logic is encapsulated here.
 */

import { useMemo, useCallback, useReducer } from 'react';
import { useWorkspace } from '../../../renderer/hooks/useWorkspace';
import {
  useSaveWorkbook,
  useManifestSessions,
  useCodeSessions,
} from '../../../renderer/hooks/useFileSessions';
import { useFormulaBarOptimized } from '../../../renderer/hooks/useFormulaBarOptimized';
import { useElectronIntegration } from '../../../renderer/hooks/useElectronAPI';
import { useAutoSave } from './useAutoSave';
import { cloneManifest, createDefaultManifest } from '../../../renderer/utils/sessionHelpers';
import type { ExcelFile, GridparkCodeFile } from '../../../renderer/types/excel';
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

  // File sessions (manifest & code only - sheets are in Dexie)
  manifestSessions: Record<string, any>;
  codeSessions: Record<string, any>;

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

  // File operations
  handleManifestChange: (workbookId: string, file: ExcelFile, data: any) => void;
  handleCodeChange: (codeFile: GridparkCodeFile, value: string) => void;
  readManifestFile: (file: ExcelFile) => Promise<void>;
  createDefaultManifest: (file: ExcelFile) => any;

  // Formula bar
  formulaBarState: any;

  // Computed values
  activeManifestSession: any;
  activeCodeSession: any;
  manifestEditorData: any;
  manifestIsDirty: boolean;
  canEditManifest: boolean;
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

  const {
    manifestSessions,
    manifestDirtyMap,
    getManifestSessionKey,
    ensureManifestSession,
    readManifestFile,
    // createDefaultManifest,
    setManifestSessions,
  } = useManifestSessions();

  const { codeSessions, ensureCodeSession, handleCodeChange, onSaveCode } = useCodeSessions();

  // ============================================
  // Workspace Management
  // ============================================

  const workspace = useWorkspace(
    {
      codeSessions,
      manifestDirtyMap,
      getManifestSessionKey,
    },
    {
      ensureManifestSession,
      ensureCodeSession,
    }
  );

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
  // Manifest Handlers
  // ============================================


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

  // NOTE: activeSheetSession is removed - use useExcelSheet hook in components

  const activeManifestKey = useMemo(
    () => (activeTab?.kind === 'manifest' ? getManifestSessionKey(activeTab.file) : null),
    [activeTab, getManifestSessionKey]
  );

  const activeManifestSession = useMemo(
    () => (activeManifestKey ? manifestSessions[activeManifestKey] : undefined),
    [activeManifestKey, manifestSessions]
  );

  const activeCodeSession = useMemo(
    () => (activeTab?.kind === 'code' ? codeSessions[activeTab.codeFile.absolutePath] : undefined),
    [activeTab, codeSessions]
  );

  const manifestEditorData = useMemo(() => {
    if (activeTab?.kind !== 'manifest') return null;
    return (
      activeManifestSession?.data ??
      (activeTab.file.manifest
        ? cloneManifest(activeTab.file.manifest)
        : createDefaultManifest(activeTab.file.name))
    );
  }, [activeTab, activeManifestSession]);

  const manifestIsDirty = useMemo(
    () => (activeManifestKey ? Boolean(manifestDirtyMap[activeManifestKey]) : false),
    [activeManifestKey, manifestDirtyMap]
  );

  const canEditManifest = useMemo(() => Boolean(window.electronAPI?.gridpark), []);

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

    // File sessions
    manifestSessions,
    codeSessions,

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

    // File operations
    handleManifestChange,
    handleCodeChange,
    readManifestFile,
    // createDefaultManifest,

    // Formula bar
    formulaBarState,

    // Computed values
    activeManifestSession,
    activeCodeSession,
    manifestEditorData,
    manifestIsDirty,
    canEditManifest,
    dirtyNodeIds,

    // Electron
    electron,
  };
}
