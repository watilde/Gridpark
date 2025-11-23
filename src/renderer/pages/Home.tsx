import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box } from "@mui/joy";
import { AppLayout } from "../components/layout/AppLayout";
import { FileNode } from "../features/file-explorer/FileTree";
import {
  SearchNavigationCommand,
  ReplaceCommand,
} from "../features/workbook/components/ExcelViewer";
import { getPlatformCapabilities } from "../utils/platform";

// New Imports
import { Header } from "./Home/Header";
import { FormulaBar } from "./Home/FormulaBar";
import { SettingsDrawer } from "./Home/SettingsDrawer";
import { SidebarExplorer } from "./Home/SidebarExplorer";
import { TabContentArea } from "./Home/TabContentArea";
import { GridparkPlayground } from "../components/layout/GridparkPlayground";

// Hooks
import { useWorkspaceManager } from "../hooks/useWorkspaceManager";
import { useTabManagement } from "../hooks/useTabManagement";
import { useSheetSessions, useManifestSessions, useCodeSessions } from "../hooks/useFileSessions";
import { useFormulaBar } from "../hooks/useFormulaBar";
import { useSettings } from "../hooks/useSettings";
import { useDirtyTracking } from "../hooks/useDirtyTracking";
import { useStyleInjection } from "../hooks/useStyleInjection";
import { useManifestHandlers } from "../hooks/useManifestHandlers";
import { useSheetHandlers } from "../hooks/useSheetHandlers";
import { useTabOperations } from "../hooks/useTabOperations";
import { cloneManifest } from "../utils/sessionHelpers";

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

  // -- Tab Operations --
  const { handleNodeSelect, handleCloseTab } = useTabOperations({
    openTabs,
    setOpenTabs,
    focusTab,
    closeTab,
    findWorkbookNode,
    ensureManifestSession,
    ensureCodeSession,
    setSheetSessions,
    setSheetDirtyMap,
  });

  // -- Dirty Tracking --
  const { tabIsDirty, dirtyNodeIds } = useDirtyTracking({
    workbookNodes,
    sheetSessions,
    sheetDirtyMap,
    codeSessions,
    manifestDirtyMap,
    getManifestSessionKey,
  });

  // -- Sheet Handlers --
  const { handleSaveSheetSession, handleSheetDirtyChange } = useSheetHandlers({
    openTabs,
    findWorkbookNode,
    updateWorkbookReferences,
    handlePersistSheetSession,
    saveWorkbookFile,
    setSheetDirtyMap,
  });

  // -- Manifest Handlers --
  const { handleManifestChange, handleSaveManifest } = useManifestHandlers({
    manifestSessions,
    setManifestSessions,
    getManifestSessionKey,
    readManifestFile,
    updateWorkbookReferences,
    createDefaultManifest,
  });

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
  useStyleInjection({
    activeTab,
    manifestSessions,
    getManifestSessionKey,
  });


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


  // Placeholder handlers for future implementation
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
        onManifestChange={handleManifestChange}
        onSaveManifest={handleSaveManifest}
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
