import { useCallback, useEffect, useMemo, useTransition } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { ExcelFile } from '../types/excel';
import { FileNode } from '../features/file-explorer/FileTree';
import { WorkbookTab } from '../types/tabs';
import {
  createWorkbookNode,
  createSheetTab,
} from '../utils/workbookUtils';
import { useAppDispatch, useAppSelector } from '../../stores';
import {
  selectWorkbookNodes,
  selectCurrentDirectoryName,
  selectOpenTabs,
  selectActiveTabId,
  selectSelectedNodeId,
  updateWorkbook,
  openTab,
  closeTab,
  focusTab,
  resetWorkspace as resetWorkspaceAction,
} from '../../stores/spreadsheetSlice';

// ============================================================================
// NOTE: Workspace state is now managed by Redux (spreadsheetSlice)
// Dirty tracking for sheets is now EXCLUSIVELY in Dexie (sheetMetadata.dirty)
// This hook serves as an adapter layer between Redux/Dexie and the component API
// ============================================================================

/**
 * Parameters for dirty tracking (OPTIMIZED - Dexie Only)
 * Note: Code and manifest dirty tracking removed - sheets only
 */
export interface DirtyTrackingDeps {
  // Empty for now - dirty tracking is in Dexie
}

/**
 * Unified workspace hook that consolidates workspace state management
 * NOW USING REDUX for state management instead of useReducer
 */
export const useWorkspace = (
  dirtyTrackingDeps: DirtyTrackingDeps
) => {
  // ✅ Use Redux instead of useReducer
  const dispatch = useAppDispatch();
  const workbookNodes = useAppSelector(selectWorkbookNodes);
  const currentDirectoryName = useAppSelector(selectCurrentDirectoryName);
  const openTabs = useAppSelector(selectOpenTabs);
  const activeTabId = useAppSelector(selectActiveTabId);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);

  // useTransition for non-blocking file operations
  const [isLoadingFiles, startFileTransition] = useTransition();

  // ==========================================
  // Workspace Manager Functions
  // ==========================================

  const findWorkbookNode = useCallback(
    (workbookId: string) => workbookNodes.find(node => node.id === workbookId),
    [workbookNodes]
  );

  const updateWorkbookReferences = useCallback(
    (workbookId: string, updatedFile: ExcelFile) => {
      dispatch(updateWorkbook({ workbookId, updatedFile }));
    },
    [dispatch]
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
        const firstSheetNode = nodes[0]?.children?.find(child => child.type === 'sheet');
        const firstTab = firstSheetNode ? createSheetTab(firstSheetNode) : null;

        dispatch(
          resetWorkspaceAction({
            nodes,
            directoryName: directoryName ?? '',
            firstTab,
          })
        );
      });
    },
    [startFileTransition, dispatch]
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

  const focusTabAction = useCallback(
    (tab: WorkbookTab) => {
      dispatch(focusTab(tab));
    },
    [dispatch]
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent | null, value: string | number | null) => {
      if (!value || typeof value !== 'string') return;
      const tab = openTabs.find(t => t.id === value);
      if (tab) {
        focusTabAction(tab);
      }
    },
    [openTabs, focusTabAction]
  );

  const closeTabAction = useCallback(
    (tabId: string) => {
      dispatch(closeTab(tabId));
    },
    [dispatch]
  );

  // ==========================================
  // Dirty Tracking Functions (OPTIMIZED - Dexie Only)
  // ==========================================

  const { codeSessions, manifestDirtyMap, getManifestSessionKey } = dirtyTrackingDeps;

  // Load all sheet metadata from Dexie (reactive)
  const allSheetMetadata = useLiveQuery(() => db.sheetMetadata.toArray(), []);

  // Build dirty map from Dexie metadata
  const sheetDirtyMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    allSheetMetadata?.forEach(metadata => {
      if (metadata.dirty) {
        map[metadata.tabId] = true;
      }
    });
    return map;
  }, [allSheetMetadata]);

  const tabIsDirty = useCallback(
    (tab: WorkbookTab): boolean => {
      if (tab.kind === 'sheet') {
        // Check Dexie dirty map
        return Boolean(sheetDirtyMap[tab.id]);
      }
      if (tab.kind === 'code') {
        const session = codeSessions[tab.codeFile.absolutePath];
        return Boolean(session && session.content !== session.originalContent);
      }
      if (tab.kind === 'manifest') {
        const key = getManifestSessionKey(tab.file);
        return Boolean(key && manifestDirtyMap[key]);
      }
      return false;
    },
    [codeSessions, getManifestSessionKey, manifestDirtyMap, sheetDirtyMap]
  );

  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};

    const visit = (node: FileNode): boolean => {
      let dirty = false;

      if (node.type === 'sheet') {
        // Check Dexie dirty map
        dirty = Boolean(sheetDirtyMap[node.id]);
      } else if (node.type === 'code' && node.codeFile) {
        const session = codeSessions[node.codeFile.absolutePath];
        dirty = Boolean(session && session.content !== session.originalContent);
      } else if (node.type === 'manifest' && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
      } else if (node.type === 'workbook' && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
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
  }, [workbookNodes, sheetDirtyMap, codeSessions, manifestDirtyMap, getManifestSessionKey]);

  // ==========================================
  // Tab Operations Functions
  // ==========================================

  const openTabForSheetNode = useCallback(
    (sheetNode: FileNode) => {
      const tab = createSheetTab(sheetNode);
      if (!tab) return;
      dispatch(openTab(tab));
    },
    [dispatch]
  );

  const handleNodeSelect = useCallback(
    (node: FileNode) => {
      if (node.type === 'sheet') {
        openTabForSheetNode(node);
      }
    },
    [openTabForSheetNode]
  );

  const handleCloseTab = useCallback(
    async (tabId: string) => {
      const tabToClose = openTabs.find(tab => tab.id === tabId);

      // Clean up Dexie data for sheet tabs
      if (tabToClose?.kind === 'sheet') {
        try {
          const { db: _db } = await import('../../lib/db');
          // Optional: Keep data in DB for later, or delete it
          // await db.deleteSheet(tabId);
          console.log(`[useWorkspace] Sheet tab closed: ${tabId}, data kept in Dexie`);
        } catch (error) {
          console.error(`[useWorkspace] Failed to clean up sheet data:`, error);
        }
      }

      closeTabAction(tabId);
    },
    [openTabs, closeTabAction]
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
    focusTab: focusTabAction,
    handleTabChange,
    closeTab: closeTabAction,

    // Dirty Tracking
    tabIsDirty,
    dirtyNodeIds,

    // Tab Operations
    handleNodeSelect,
    handleCloseTab,
  };
};
