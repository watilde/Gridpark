import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box } from "@mui/joy";
import { AppLayout } from "../components/layout/AppLayout";
import { FileNode } from "../features/FileTree/FileTree";
import {
  SearchNavigationCommand,
  ReplaceCommand,
} from "../features/ExcelViewer/ExcelViewer";
import { useThemePreset } from "../theme/ThemeProvider";
import { getPlatformCapabilities } from "../utils/platform";

// New Imports
import { Header } from "./Home/Header";
import { FormulaBar } from "./Home/FormulaBar";
import { SettingsDrawer } from "./Home/SettingsDrawer";
import { SidebarExplorer } from "./Home/SidebarExplorer";
import { TabContentArea } from "./Home/TabContentArea";
import { GridparkPlayground } from "../components/layout/GridparkPlayground";
import { createSheetTab, createManifestTabInstance as createManifestTab, createWorkbookNode } from "../utils/workbookUtils";
import { WorkbookTab } from "../types/tabs";

// Hooks
import { useWorkspaceManager } from "../hooks/useWorkspaceManager";
import { useTabManagement } from "../hooks/useTabManagement";
import { useSheetSessions, useManifestSessions, useCodeSessions } from "../hooks/useFileSessions";
import { useFormulaBar } from "../hooks/useFormulaBar";
import { useSettings } from "../hooks/useSettings";

export const Home: React.FC = () => {
  const settings = useSettings();
  const { presetId } = settings;
  const isGridparkTheme = presetId === "gridpark";

  const {
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    selectedNodeId,
    setSelectedNodeId,
    focusTab,
    handleTabChange,
    closeTab,
  } = useTabManagement();

  const {
    workbookNodes,
    findWorkbookNode,
    updateWorkbookReferences,
  } = useWorkspaceManager(setOpenTabs, setActiveTabId, setSelectedNodeId);

  const {
    sheetSessions,
    sheetDirtyMap,
    setSheetDirtyMap,
    setSheetSessions,
    handlePersistSheetSession,
    saveWorkbookFile,
  } = useSheetSessions();

  const {
    manifestSessions,
    manifestDirtyMap,
    getManifestSessionKey,
    ensureManifestSession,
    readManifestFile,
    createDefaultManifest,
    cloneManifest,
    setManifestSessions,
  } = useManifestSessions();

  const {
    codeSessions,
    ensureCodeSession,
    handleCodeChange,
    onSaveCode: handleSaveCode, // Rename for consistency if needed, or just use directly
    getCodeSessionKey,
  } = useCodeSessions();

  // Local state for search/navigation that didn't warrant a full hook yet
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>("");
  const [sheetSearchQuery] = useState<string>("");
  const [searchNavigation] = useState<SearchNavigationCommand | undefined>(undefined);
  const [replaceCommand] = useState<ReplaceCommand | null>(null);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId) || null;
  const formulaBarState = useFormulaBar(activeTab?.kind);
  const { handleActiveCellDetails, formulaCommitCommand } = formulaBarState;

  // -- Platform Capabilities --
  const platformCapabilities = useMemo(() => getPlatformCapabilities(), []);

  // -- Tab / Node Handling --
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

  const handleNodeSelect = (node: FileNode) => {
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
  };

  // -- Dirty Tracking Helpers --
  const tabIsDirty = useCallback(
    (tab: WorkbookTab) => {
      if (tab.kind === "sheet") {
        return Boolean(
          sheetDirtyMap[tab.id] ?? sheetSessions[tab.id]?.dirty,
        );
      }
      if (tab.kind === "code") {
        const session = codeSessions[tab.codeFile.absolutePath];
        return Boolean(
          session && session.content !== session.originalContent,
        );
      }
      if (tab.kind === "manifest") {
        const key = getManifestSessionKey(tab.file);
        return Boolean(key && manifestDirtyMap[key]);
      }
      return false;
    },
    [
      codeSessions,
      getManifestSessionKey,
      manifestDirtyMap,
      sheetDirtyMap,
      sheetSessions,
    ],
  );

  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    const visit = (node: FileNode): boolean => {
      let dirty = false;
      if (node.type === "sheet") {
        dirty = Boolean(sheetDirtyMap[node.id]);
      } else if (node.type === "code" && node.codeFile) {
        const session = codeSessions[node.codeFile.absolutePath];
        dirty = Boolean(
          session && session.content !== session.originalContent,
        );
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
  }, [
    workbookNodes,
    sheetDirtyMap,
    sheetSessions,
    codeSessions,
    manifestDirtyMap,
    getManifestSessionKey,
  ]);

  // -- Handlers passed to EditorPanel --
  const handleCloseTab = useCallback(
    (tabId: string) => {
      // Clean up sessions if needed
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

  const handleSaveSheetSession = useCallback(
    (tabId: string, state: any) => {
      handlePersistSheetSession(tabId, state);
      const tab = openTabs.find(
        (candidate): candidate is WorkbookTab & { kind: "sheet" } =>
          candidate.id === tabId && candidate.kind === "sheet",
      );
      if (!tab) return;
      const workbookNode = findWorkbookNode(tab.workbookId);
      const workbookFile = workbookNode?.file;
      if (!workbookFile) return;

      const updatedSheets = workbookFile.sheets.map((sheet) =>
        sheet.name === tab.sheetName
          ? {
              ...sheet,
              data: state.data,
              rowCount: state.data.length,
              colCount: state.data[0]?.length ?? sheet.colCount,
            }
          : sheet,
      );
      const updatedFile = { ...workbookFile, sheets: updatedSheets };
      updateWorkbookReferences(tab.workbookId, updatedFile);
      saveWorkbookFile(updatedFile);
    },
    [findWorkbookNode, handlePersistSheetSession, openTabs, saveWorkbookFile, updateWorkbookReferences]
  );

  const handleSheetDirtyChange = useCallback((tabId: string, dirty: boolean) => {
      setSheetDirtyMap((prev) => {
          if (dirty) {
              if (prev[tabId]) return prev;
              return { ...prev, [tabId]: true };
          }
          if (!prev[tabId]) return prev;
          const next = { ...prev };
          delete next[tabId];
          return next;
      });
  }, [setSheetDirtyMap]);

  const handleManifestChange = useCallback(
    (workbookId: string, file: any, nextManifest: any) => {
       const key = getManifestSessionKey(file);
       const sanitized = cloneManifest(nextManifest);

      setManifestSessions((prev) => {
        const existing = prev[key];
        if (existing) {
          return {
            ...prev,
            [key]: {
              ...existing,
              data: sanitized,
              error: undefined,
            },
          };
        }
        return {
          ...prev,
          [key]: {
            data: sanitized,
            originalData: sanitized,
            loading: false,
            saving: false,
          },
        };
      });

      if (nextManifest.name && nextManifest.name !== file.name) {
        const updatedFile: any = { ...file, name: nextManifest.name };
        updateWorkbookReferences(workbookId, updatedFile);
      }
    },
    [getManifestSessionKey, cloneManifest, updateWorkbookReferences, setManifestSessions]
  );

  const activeTitle = activeTab
    ? activeTab.kind === "sheet"
      ? `${activeTab.sheetName} - ${activeTab.fileName}`
      : activeTab.kind === "manifest"
        ? `${activeTab.fileName} (Manifest)`
        : `${activeTab.codeFile.name} - ${activeTab.fileName}`
    : "Gridpark";

  useEffect(() => {
    window.electronAPI?.setWindowTitle(activeTitle);
  }, [activeTitle]);

  // -- CSS Injection --
  useEffect(() => {
    let workbookStyleElement: HTMLStyleElement | null = null;
    const sheetStyleElements: Map<string, HTMLStyleElement> = new Map();

    const currentFile = activeTab?.file;
    const manifestKey = currentFile ? getManifestSessionKey(currentFile) : null;
    const manifestSession = manifestKey ? manifestSessions[manifestKey] : undefined;

    // Inject workbook-level CSS
    if (manifestSession?.workbookCssContent) {
      workbookStyleElement = document.createElement('style');
      workbookStyleElement.type = 'text/css';
      workbookStyleElement.innerHTML = manifestSession.workbookCssContent;
      workbookStyleElement.setAttribute('data-gridpark-style-scope', 'workbook');
      document.head.appendChild(workbookStyleElement);
    }

    // Inject sheet-level CSS for the active sheet
    if (activeTab?.kind === 'sheet' && manifestSession?.sheetCssContents && activeTab.sheetName) {
      const sheetCss = manifestSession.sheetCssContents[activeTab.sheetName];
      if (sheetCss) {
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML = sheetCss;
        styleElement.setAttribute('data-gridpark-style-scope', 'sheet');
        styleElement.setAttribute('data-gridpark-sheet-name', activeTab.sheetName);
        document.head.appendChild(styleElement);
        sheetStyleElements.set(activeTab.sheetName, styleElement);
      }
    }

    // Cleanup function
    return () => {
      if (workbookStyleElement && workbookStyleElement.parentNode) {
        workbookStyleElement.parentNode.removeChild(workbookStyleElement);
      }
      sheetStyleElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [activeTab, manifestSessions, getManifestSessionKey]); // Dependencies for useEffect


  // Derived state for EditorPanel
  const activeCodeSession =
    activeTab?.kind === "code"
      ? codeSessions[activeTab.codeFile.absolutePath]
      : undefined;
  const activeManifestKey =
    activeTab?.kind === "manifest"
      ? getManifestSessionKey(activeTab.file)
      : null;
  const activeManifestSession = activeManifestKey
    ? manifestSessions[activeManifestKey]
    : undefined;
  const activeSheetSession =
    activeTab?.kind === "sheet" ? sheetSessions[activeTab.id] : undefined;
  
  const manifestEditorData =
    activeTab?.kind === "manifest"
      ? (activeManifestSession?.data ??
        (activeTab.file.manifest
          ? cloneManifest(activeTab.file.manifest)
          : createDefaultManifest(activeTab.file)))
      : null;
  const manifestIsDirty = activeManifestKey
    ? Boolean(manifestDirtyMap[activeManifestKey])
    : false;
  const canEditManifest = Boolean(window.electronAPI?.gridpark);


  // Re-implementing the complex handlers that cross hook boundaries
  const onManifestChangeHandler = (workbookId: string, file: any, nextManifest: any) => {
      handleManifestChange(workbookId, file, nextManifest);
  };

  const onSaveManifestHandler = async (workbookId: string, file: any) => {
      const key = getManifestSessionKey(file);
      const session = manifestSessions[key];
      if (!session) {
        await readManifestFile(file);
        return;
      }
      setManifestSessions((prev) => ({
        ...prev,
        [key]: { ...prev[key]!, saving: true, error: undefined },
      }));
      try {
        const gridparkApi = window.electronAPI?.gridpark;
        if (!gridparkApi?.writeFile) throw new Error("Manifest editing is only available in the desktop application.");
        const pkg = file.gridparkPackage;
        if (!pkg) throw new Error("Missing Gridpark package metadata.");
        
        const content = JSON.stringify(session.data, null, 2);
        const response = await gridparkApi.writeFile({
          path: pkg.manifestPath,
          rootDir: pkg.rootDir,
          content,
        });
        if (!response?.success) throw new Error(response?.error ?? "Failed to save manifest.");
        
        const updatedManifest = cloneManifest(session.data);
        const updatedFile = { ...file, manifest: updatedManifest };
        setManifestSessions((prev) => ({
          ...prev,
          [key]: { ...prev[key]!, saving: false, originalData: updatedManifest, error: undefined },
        }));
        updateWorkbookReferences(workbookId, updatedFile);
      } catch (error) {
        setManifestSessions((prev) => ({
          ...prev,
          [key]: { ...prev[key]!, saving: false, error: error instanceof Error ? error.message : String(error) },
        }));
      }
  };

  const handleBack = () => { console.log("Navigate back"); };
  const handleProceed = () => { console.log("Proceed action"); };
  const handleCellSelect = (pos: any) => { console.log("Cell selected:", pos); };
  const handleRangeSelect = (range: any) => { console.log("Range selected:", range); };

  const layout = (
    <AppLayout
      header={
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <Header
            onBack={handleBack}
            onProceed={handleProceed}
            searchQuery={treeSearchQuery}
            onSearchChange={setTreeSearchQuery}
            onOpenSettings={() => settings.setSettingsOpen(true)}
          />
          <FormulaBar formulaBarState={formulaBarState} />
        </Box>
      }
      sidebar={
        <SidebarExplorer
            workbookNodes={workbookNodes}
            searchQuery={treeSearchQuery}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            dirtyNodeIds={dirtyNodeIds}
        />
      }
    >
      <TabContentArea
        openTabs={openTabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onCloseTab={handleCloseTab}
        tabIsDirty={tabIsDirty}
        activeTab={activeTab}
        activeSheetSession={activeSheetSession}
        activeCodeSession={activeCodeSession}
        activeManifestSession={activeManifestSession}
        manifestEditorData={manifestEditorData}
        manifestIsDirty={manifestIsDirty}
        canEditManifest={canEditManifest}
        platformCapabilities={platformCapabilities}
        onSessionChange={(state) => handlePersistSheetSession(activeTab!.id, state)}
        onSaveSession={(state) => handleSaveSheetSession(activeTab!.id, state)}
        onDirtyChange={(dirty) => handleSheetDirtyChange(activeTab!.id, dirty)}
        onCellSelect={handleCellSelect}
        onRangeSelect={handleRangeSelect}
        onActiveCellDetails={handleActiveCellDetails}
        onManifestChange={onManifestChangeHandler}
        onSaveManifest={onSaveManifestHandler}
        onReloadManifest={readManifestFile}
        onCodeChange={handleCodeChange}
        onSaveCode={handleSaveCode}
        onCloseCodeTab={handleCloseTab}
        sheetSearchQuery={sheetSearchQuery}
        searchNavigation={searchNavigation}
        replaceCommand={replaceCommand}
        formulaCommitCommand={formulaCommitCommand}
      />
    </AppLayout>
  );

  return (
    <>
      {isGridparkTheme ? (
        <GridparkPlayground>{layout}</GridparkPlayground>
      ) : (
        layout
      )}
      <SettingsDrawer settings={settings} />
    </>
  );
};
