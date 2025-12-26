import { useCallback, useEffect, useMemo, useTransition } from 'react';
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
// Dirty tracking for sheets is now EXCLUSIVELY in database (sheetMetadata.dirty)
// This hook serves as an adapter layer between Redux/database and the component API
// ============================================================================

/**
 * Parameters for dirty tracking (OPTIMIZED - Database Only)
 * Note: Code and manifest dirty tracking removed - sheets only
 */
export interface DirtyTrackingDeps {
  // Empty for now - dirty tracking is in database
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

        // Initialize metadata for ALL sheets in ALL workbooks in BACKGROUND (non-blocking)
        // This prevents UI freeze when opening large files
        setTimeout(() => {
          const initPromises: Promise<void>[] = [];
          
          for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            const workbookId = `workbook-${timestamp}-${fileIndex}`;
            
            for (let sheetIndex = 0; sheetIndex < file.sheets.length; sheetIndex++) {
              const sheet = file.sheets[sheetIndex];
              const tabId = `${workbookId}-sheet-${sheetIndex}`;
              
              // Queue initialization (parallel)
              const initPromise = db.upsertSheetMetadata({
                tabId,
                workbookId,
                sheetName: sheet.name,
                sheetIndex,
                maxRow: sheet.rowCount || 100,
                maxCol: sheet.colCount || 26,
                cellCount: 0,
                dirty: false,
              }).then(() => {
                console.log('[useWorkspace] Initialized metadata for', { tabId, sheetName: sheet.name });
              }).catch(error => {
                console.error('[useWorkspace] Failed to initialize metadata', { tabId, error });
              });
              
              initPromises.push(initPromise);
            }
          }
          
          // Wait for all initializations (in background)
          Promise.all(initPromises).then(() => {
            console.log('[useWorkspace] All sheet metadata initialized');
          });
        }, 0); // Run after UI update
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
  // Dirty Tracking Functions (OPTIMIZED - Database Only)
  // ==========================================

  // Dirty tracking is handled in useWorkspaceState via database events
  // No local state needed here - just return empty for compatibility
  const tabIsDirty = useCallback((_tab: WorkbookTab): boolean => {
    // This will be called from useWorkspaceState which has the real dirty tracking
    return false;
  }, []);

  // dirtyNodeIds should be computed in useWorkspaceState, not here
  // Return empty map for now (will be removed once useWorkspaceState handles this)
  const dirtyNodeIds = useMemo(() => {
    return {} as Record<string, boolean>;
  }, []);

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

      // Clean up database data for sheet tabs
      if (tabToClose?.kind === 'sheet') {
        try {
          const { db: _db } = await import('../../lib/db');
          // Optional: Keep data in DB for later, or delete it
          // await db.deleteSheet(tabId);
          console.log(`[useWorkspace] Sheet tab closed: ${tabId}, data kept in database`);
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
