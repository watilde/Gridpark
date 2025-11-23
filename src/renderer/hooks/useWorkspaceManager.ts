import { useState, useCallback, useEffect } from "react";
import { ExcelFile } from "../types/excel";
import { FileNode } from "../features/FileTree/FileTree";
import { createWorkbookNode, createSheetTab } from "../utils/workbookUtils";
import { WorkbookTab } from "../types/tabs";

export const useWorkspaceManager = (
  setOpenTabs: (tabs: WorkbookTab[]) => void,
  setActiveTabId: (id: string) => void,
  setSelectedNodeId: (id: string) => void
) => {
  const [workbookNodes, setWorkbookNodes] = useState<FileNode[]>([]);
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string>("");

  const findWorkbookNode = useCallback(
    (workbookId: string) =>
      workbookNodes.find((node) => node.id === workbookId),
    [workbookNodes],
  );

  const updateWorkbookReferences = useCallback(
    (workbookId: string, updatedFile: ExcelFile) => {
      const cloneNodeWithFile = (node: FileNode): FileNode => {
        const next: FileNode = { ...node };
        if (node.file) {
          next.file = updatedFile;
        }
        if (node.type === "workbook") {
          next.name = updatedFile.name;
        }
        if (node.children) {
          next.children = node.children.map((child) =>
            cloneNodeWithFile(child),
          );
        }
        return next;
      };

      setWorkbookNodes((prev) =>
        prev.map((node) =>
          node.id === workbookId ? cloneNodeWithFile(node) : node,
        ),
      );
      setOpenTabs((prev: any) => // Using any temporarily to bypass strict type check if setOpenTabs comes from a different context, but normally it matches.
        prev.map((tab: WorkbookTab) =>
          tab.workbookId === workbookId
            ? { ...tab, file: updatedFile, fileName: updatedFile.name }
            : tab,
        ),
      );
    },
    [setOpenTabs],
  );

  const resetWorkbooks = useCallback(
    (files: ExcelFile[], directoryName?: string) => {
      const timestamp = Date.now();
      const nodes = files.map((file, index) =>
        createWorkbookNode(file, `workbook-${timestamp}-${index}`),
      );
      setWorkbookNodes(nodes);
      setCurrentDirectoryName(directoryName ?? "");
      
      // Open first sheet by default
      const firstSheetNode = nodes[0]?.children?.find(
        (child) => child.type === "sheet",
      );
      const firstTab = firstSheetNode ? createSheetTab(firstSheetNode) : null;
      if (firstTab) {
        setOpenTabs([firstTab]);
        setActiveTabId(firstTab.id);
        setSelectedNodeId(firstTab.treeNodeId);
      } else {
        setOpenTabs([]);
        setActiveTabId("");
        setSelectedNodeId("");
      }
    },
    [setOpenTabs, setActiveTabId, setSelectedNodeId],
  );

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onFilesOpened?.(
      ({
        files,
        directoryName,
      }: {
        files: ExcelFile[];
        directoryName?: string;
      }) => {
        resetWorkbooks(files, directoryName);
      },
    );
    return () => {
      unsubscribe?.();
    };
  }, [resetWorkbooks]);

  return {
    workbookNodes,
    setWorkbookNodes,
    currentDirectoryName,
    findWorkbookNode,
    updateWorkbookReferences,
  };
};
