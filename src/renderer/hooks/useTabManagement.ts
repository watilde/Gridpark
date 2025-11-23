import { useState, useCallback } from "react";
import { WorkbookTab } from "../types/tabs";
import { FileNode } from "../features/FileTree/FileTree";
import { createSheetTab, createManifestTabInstance, createWorkbookNode } from "../utils/workbookUtils";

// Need to define or import WorkbookTab type properly first.
// Since I haven't extracted types yet, I'll define them here for now or assume they will be in types/tabs.
// I should probably create types/tabs.ts first.

export const useTabManagement = () => {
  const [openTabs, setOpenTabs] = useState<WorkbookTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  const focusTab = useCallback((tab: WorkbookTab) => {
    setActiveTabId(tab.id);
    setSelectedNodeId(tab.treeNodeId);
  }, []);

  const handleTabChange = (
    _event: React.SyntheticEvent | null,
    value: string | number | null,
  ) => {
    if (!value || typeof value !== "string") return;
    const tab = openTabs.find((t) => t.id === value);
    if (tab) {
      focusTab(tab);
    }
  };

  const closeTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        const nextTabs = prev.filter((tab) => tab.id !== tabId);
        if (tabId === activeTabId) {
          const nextActive = nextTabs[nextTabs.length - 1];
          if (nextActive) {
            setActiveTabId(nextActive.id);
            setSelectedNodeId(nextActive.treeNodeId);
          } else {
            setActiveTabId("");
            setSelectedNodeId("");
          }
        }
        return nextTabs;
      });
    },
    [activeTabId],
  );

  return {
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    selectedNodeId,
    setSelectedNodeId,
    focusTab,
    handleTabChange,
    closeTab,
  };
};
