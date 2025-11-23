import { useCallback } from "react";
import { FileNode } from "../features/file-explorer/FileTree";
import { WorkbookTab } from "../types/tabs";
import { ExcelFile, GridparkCodeFile } from "../types/excel";
import {
  createSheetTab,
  createManifestTabInstance as createManifestTab,
} from "../utils/workbookUtils";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";

export interface TabOperationsParams {
  openTabs: WorkbookTab[];
  setOpenTabs: React.Dispatch<React.SetStateAction<WorkbookTab[]>>;
  focusTab: (tab: WorkbookTab) => void;
  closeTab: (tabId: string) => void;
  findWorkbookNode: (workbookId: string) => FileNode | undefined;
  ensureManifestSession: (file: ExcelFile) => void;
  ensureCodeSession: (codeFile: GridparkCodeFile) => void;
  setSheetSessions: React.Dispatch<React.SetStateAction<Record<string, SheetSessionState>>>;
  setSheetDirtyMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/**
 * Hook to manage tab opening and closing operations
 */
export const useTabOperations = ({
  openTabs,
  setOpenTabs,
  focusTab,
  closeTab,
  findWorkbookNode,
  ensureManifestSession,
  ensureCodeSession,
  setSheetSessions,
  setSheetDirtyMap,
}: TabOperationsParams) => {
  /**
   * Open a tab for a sheet node
   */
  const openTabForSheetNode = useCallback(
    (sheetNode: FileNode) => {
      const tab = createSheetTab(sheetNode);
      if (!tab) return;
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      focusTab(tab);
    },
    [focusTab, setOpenTabs],
  );

  /**
   * Open a tab for a manifest
   */
  const openTabForManifest = useCallback(
    (workbookNode: FileNode, treeNodeId?: string) => {
      const tab = createManifestTab(workbookNode, treeNodeId);
      if (!tab) return;
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      focusTab(tab);
      if (workbookNode.file) {
        ensureManifestSession(workbookNode.file);
      }
    },
    [ensureManifestSession, focusTab, setOpenTabs],
  );

  /**
   * Open a tab for a code file node
   */
  const openTabForCodeNode = useCallback(
    (codeNode: FileNode) => {
      if (codeNode.type !== "code" || !codeNode.codeFile) return;
      const workbook = findWorkbookNode(
        codeNode.workbookId ?? codeNode.parentId ?? "",
      );
      if (!workbook || !workbook.file) return;
      const tab: WorkbookTab = {
        kind: "code",
        id: `${codeNode.id}-tab`,
        workbookId: workbook.id,
        treeNodeId: codeNode.id,
        fileName: workbook.file.name,
        file: workbook.file,
        codeFile: codeNode.codeFile,
      };
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      ensureCodeSession(codeNode.codeFile);
      focusTab(tab);
    },
    [ensureCodeSession, findWorkbookNode, focusTab, setOpenTabs],
  );

  /**
   * Handle node selection and open appropriate tab
   */
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
    [openTabForSheetNode, openTabForManifest, openTabForCodeNode, findWorkbookNode],
  );

  /**
   * Handle tab close with cleanup
   */
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
    [openTabs, closeTab, setSheetSessions, setSheetDirtyMap],
  );

  return {
    openTabForSheetNode,
    openTabForManifest,
    openTabForCodeNode,
    handleNodeSelect,
    handleCloseTab,
  };
};
