import { useCallback, useEffect, useMemo, useReducer, useTransition } from "react";
import { ExcelFile, GridparkCodeFile } from "../types/excel";
import { FileNode } from "../features/file-explorer/FileTree";
import { WorkbookTab } from "../types/tabs";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";
import { createWorkbookNode, createSheetTab, createManifestTabInstance } from "../utils/workbookUtils";

/**
 * Workspace state managed by reducer
 */
interface WorkspaceState {
  workbookNodes: FileNode[];
  currentDirectoryName: string;
  openTabs: WorkbookTab[];
  activeTabId: string;
  selectedNodeId: string;
}

type WorkspaceAction =
  | { type: "SET_WORKBOOKS"; payload: { nodes: FileNode[]; directoryName: string } }
  | { type: "UPDATE_WORKBOOK"; payload: { workbookId: string; updatedFile: ExcelFile } }
  | { type: "OPEN_TAB"; payload: WorkbookTab }
  | { type: "CLOSE_TAB"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_SELECTED_NODE"; payload: string }
  | { type: "FOCUS_TAB"; payload: WorkbookTab }
  | { type: "RESET_WORKSPACE"; payload: { nodes: FileNode[]; directoryName: string; firstTab: WorkbookTab | null } };

/**
 * Workspace reducer for centralized state management
 */
const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case "SET_WORKBOOKS":
      return {
        ...state,
        workbookNodes: action.payload.nodes,
        currentDirectoryName: action.payload.directoryName,
      };

    case "UPDATE_WORKBOOK": {
      const { workbookId, updatedFile } = action.payload;
      const cloneNodeWithFile = (node: FileNode): FileNode => {
        const next: FileNode = { ...node };
        if (node.file) {
          next.file = updatedFile;
        }
        if (node.type === "workbook") {
          next.name = updatedFile.name;
        }
        if (node.children) {
          next.children = node.children.map((child) => cloneNodeWithFile(child));
        }
        return next;
      };

      return {
        ...state,
        workbookNodes: state.workbookNodes.map((node) =>
          node.id === workbookId ? cloneNodeWithFile(node) : node
        ),
        openTabs: state.openTabs.map((tab) =>
          tab.workbookId === workbookId
            ? { ...tab, file: updatedFile, fileName: updatedFile.name }
            : tab
        ),
      };
    }

    case "OPEN_TAB": {
      const existingTab = state.openTabs.find((t) => t.id === action.payload.id);
      if (existingTab) {
        return {
          ...state,
          activeTabId: action.payload.id,
          selectedNodeId: action.payload.treeNodeId,
        };
      }
      return {
        ...state,
        openTabs: [...state.openTabs, action.payload],
        activeTabId: action.payload.id,
        selectedNodeId: action.payload.treeNodeId,
      };
    }

    case "CLOSE_TAB": {
      const nextTabs = state.openTabs.filter((tab) => tab.id !== action.payload);
      let nextActiveTabId = state.activeTabId;
      let nextSelectedNodeId = state.selectedNodeId;

      if (action.payload === state.activeTabId) {
        const nextActive = nextTabs[nextTabs.length - 1];
        if (nextActive) {
          nextActiveTabId = nextActive.id;
          nextSelectedNodeId = nextActive.treeNodeId;
        } else {
          nextActiveTabId = "";
          nextSelectedNodeId = "";
        }
      }

      return {
        ...state,
        openTabs: nextTabs,
        activeTabId: nextActiveTabId,
        selectedNodeId: nextSelectedNodeId,
      };
    }

    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.payload };

    case "SET_SELECTED_NODE":
      return { ...state, selectedNodeId: action.payload };

    case "FOCUS_TAB":
      return {
        ...state,
        activeTabId: action.payload.id,
        selectedNodeId: action.payload.treeNodeId,
      };

    case "RESET_WORKSPACE": {
      const { nodes, directoryName, firstTab } = action.payload;
      return {
        ...state,
        workbookNodes: nodes,
        currentDirectoryName: directoryName,
        openTabs: firstTab ? [firstTab] : [],
        activeTabId: firstTab?.id ?? "",
        selectedNodeId: firstTab?.treeNodeId ?? "",
      };
    }

    default:
      return state;
  }
};

/**
 * Parameters for dirty tracking
 */
export interface DirtyTrackingDeps {
  sheetSessions: Record<string, SheetSessionState>;
  sheetDirtyMap: Record<string, boolean>;
  codeSessions: Record<
    string,
    {
      content: string;
      originalContent: string;
      loading: boolean;
      saving: boolean;
      error?: string;
    }
  >;
  manifestDirtyMap: Record<string, boolean>;
  getManifestSessionKey: (file: ExcelFile) => string;
}

/**
 * Parameters for tab operations
 */
export interface TabOperationsDeps {
  ensureManifestSession: (file: ExcelFile) => void;
  ensureCodeSession: (codeFile: GridparkCodeFile) => void;
  setSheetSessions: React.Dispatch<React.SetStateAction<Record<string, SheetSessionState>>>;
  setSheetDirtyMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/**
 * Unified workspace hook that consolidates:
 * - useWorkspaceManager
 * - useTabManagement
 * - useDirtyTracking
 * - useTabOperations
 */
export const useWorkspace = (
  dirtyTrackingDeps: DirtyTrackingDeps,
  tabOperationsDeps: TabOperationsDeps
) => {
  const [state, dispatch] = useReducer(workspaceReducer, {
    workbookNodes: [],
    currentDirectoryName: "",
    openTabs: [],
    activeTabId: "",
    selectedNodeId: "",
  });

  const { workbookNodes, currentDirectoryName, openTabs, activeTabId, selectedNodeId } = state;

  // useTransition for non-blocking file operations
  const [isLoadingFiles, startFileTransition] = useTransition();

  // ==========================================
  // Workspace Manager Functions
  // ==========================================

  const findWorkbookNode = useCallback(
    (workbookId: string) => workbookNodes.find((node) => node.id === workbookId),
    [workbookNodes]
  );

  const updateWorkbookReferences = useCallback(
    (workbookId: string, updatedFile: ExcelFile) => {
      dispatch({ type: "UPDATE_WORKBOOK", payload: { workbookId, updatedFile } });
    },
    []
  );

  const resetWorkbooks = useCallback(
    (files: ExcelFile[], directoryName?: string) => {
      // Use startTransition to keep UI responsive during heavy file processing
      startFileTransition(() => {
        const timestamp = Date.now();
        const nodes = files.map((file, index) =>
          createWorkbookNode(file, `workbook-${timestamp}-${index}`)
        );

        // Open first sheet by default
        const firstSheetNode = nodes[0]?.children?.find((child) => child.type === "sheet");
        const firstTab = firstSheetNode ? createSheetTab(firstSheetNode) : null;

        dispatch({
          type: "RESET_WORKSPACE",
          payload: { nodes, directoryName: directoryName ?? "", firstTab },
        });
      });
    },
    [startFileTransition]
  );

  // Listen for file opening events
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onFilesOpened?.(
      ({ files, directoryName }: { files: ExcelFile[]; directoryName?: string }) => {
        resetWorkbooks(files, directoryName);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, [resetWorkbooks]);

  // ==========================================
  // Tab Management Functions
  // ==========================================

  const focusTab = useCallback((tab: WorkbookTab) => {
    dispatch({ type: "FOCUS_TAB", payload: tab });
  }, []);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent | null, value: string | number | null) => {
      if (!value || typeof value !== "string") return;
      const tab = openTabs.find((t) => t.id === value);
      if (tab) {
        focusTab(tab);
      }
    },
    [openTabs, focusTab]
  );

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: "CLOSE_TAB", payload: tabId });
  }, []);

  // ==========================================
  // Dirty Tracking Functions
  // ==========================================

  const {
    sheetSessions,
    sheetDirtyMap,
    codeSessions,
    manifestDirtyMap,
    getManifestSessionKey,
  } = dirtyTrackingDeps;

  const tabIsDirty = useCallback(
    (tab: WorkbookTab): boolean => {
      if (tab.kind === "sheet") {
        return Boolean(sheetDirtyMap[tab.id] ?? sheetSessions[tab.id]?.dirty);
      }
      if (tab.kind === "code") {
        const session = codeSessions[tab.codeFile.absolutePath];
        return Boolean(session && session.content !== session.originalContent);
      }
      if (tab.kind === "manifest") {
        const key = getManifestSessionKey(tab.file);
        return Boolean(key && manifestDirtyMap[key]);
      }
      return false;
    },
    [codeSessions, getManifestSessionKey, manifestDirtyMap, sheetDirtyMap, sheetSessions]
  );

  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};

    const visit = (node: FileNode): boolean => {
      let dirty = false;

      if (node.type === "sheet") {
        dirty = Boolean(sheetDirtyMap[node.id]);
      } else if (node.type === "code" && node.codeFile) {
        const session = codeSessions[node.codeFile.absolutePath];
        dirty = Boolean(session && session.content !== session.originalContent);
      } else if (node.type === "manifest" && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
      } else if (node.type === "workbook" && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
      }

      if (node.children?.length) {
        const childDirty = node.children.map((child) => visit(child));
        dirty = dirty || childDirty.some(Boolean);
      }

      if (dirty) {
        map[node.id] = true;
      }

      return dirty;
    };

    workbookNodes.forEach(visit);
    return map;
  }, [workbookNodes, sheetDirtyMap, codeSessions, manifestDirtyMap, getManifestSessionKey]);

  // ==========================================
  // Tab Operations Functions
  // ==========================================

  const {
    ensureManifestSession,
    ensureCodeSession,
    setSheetSessions,
    setSheetDirtyMap,
  } = tabOperationsDeps;

  const openTabForSheetNode = useCallback(
    (sheetNode: FileNode) => {
      const tab = createSheetTab(sheetNode);
      if (!tab) return;
      dispatch({ type: "OPEN_TAB", payload: tab });
    },
    []
  );

  const openTabForManifest = useCallback(
    (workbookNode: FileNode, treeNodeId?: string) => {
      const tab = createManifestTabInstance(workbookNode, treeNodeId);
      if (!tab) return;
      dispatch({ type: "OPEN_TAB", payload: tab });
      if (workbookNode.file) {
        ensureManifestSession(workbookNode.file);
      }
    },
    [ensureManifestSession]
  );

  const openTabForCodeNode = useCallback(
    (codeNode: FileNode) => {
      if (codeNode.type !== "code" || !codeNode.codeFile) {
        return;
      }
      const workbook = findWorkbookNode(codeNode.workbookId ?? codeNode.parentId ?? "");
      if (!workbook || !workbook.file) {
        return;
      }
      const tab: WorkbookTab = {
        kind: "code",
        id: `${codeNode.id}-tab`,
        workbookId: workbook.id,
        treeNodeId: codeNode.id,
        fileName: workbook.file.name,
        file: workbook.file,
        codeFile: codeNode.codeFile,
      };
      dispatch({ type: "OPEN_TAB", payload: tab });
      ensureCodeSession(codeNode.codeFile);
    },
    [findWorkbookNode, ensureCodeSession]
  );

  const handleNodeSelect = useCallback(
    (node: FileNode) => {
      if (node.type === "sheet") {
        openTabForSheetNode(node);
        return;
      }
      if (node.type === "workbook") {
        openTabForManifest(node, node.id);
        return;
      }
      if (node.type === "manifest") {
        const workbook = findWorkbookNode(node.workbookId ?? node.parentId ?? "");
        if (workbook) {
          openTabForManifest(workbook, node.id);
        }
        return;
      }
      if (node.type === "code") {
        openTabForCodeNode(node);
      }
    },
    [openTabForSheetNode, openTabForManifest, openTabForCodeNode, findWorkbookNode]
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tabToClose = openTabs.find((tab) => tab.id === tabId);
      if (tabToClose?.kind === "sheet") {
        setSheetSessions((sessions) => {
          if (!sessions[tabToClose.id]) return sessions;
          const next = { ...sessions };
          delete next[tabToClose.id];
          return next;
        });
        setSheetDirtyMap((dirty) => {
          if (!dirty[tabToClose.id]) return dirty;
          const next = { ...dirty };
          delete next[tabToClose.id];
          return next;
        });
      }
      closeTab(tabId);
    },
    [openTabs, closeTab, setSheetSessions, setSheetDirtyMap]
  );

  return {
    // State
    workbookNodes,
    currentDirectoryName,
    openTabs,
    activeTabId,
    selectedNodeId,

    // Loading State (from useTransition)
    isLoadingFiles,

    // Workspace Manager
    findWorkbookNode,
    updateWorkbookReferences,

    // Tab Management
    focusTab,
    handleTabChange,
    closeTab,

    // Dirty Tracking
    tabIsDirty,
    dirtyNodeIds,

    // Tab Operations
    handleNodeSelect,
    handleCloseTab,
  };
};
