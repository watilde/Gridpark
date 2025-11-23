import React, { useCallback, useMemo, useEffect, useReducer } from "react";
import { Box } from "@mui/joy";
import { AppLayout } from "../components/layout/AppLayout";
import {
  SearchNavigationCommand,
  ReplaceCommand,
} from "../features/workbook/components/ExcelViewer";
import { getPlatformCapabilities } from "../utils/platform";

// Layout Components
import { GridparkPlayground } from "../components/layout/GridparkPlayground";
import { SidebarExplorer } from "../components/layout/SidebarExplorer";
import { SettingsDrawer } from "../components/layout/SettingsDrawer";

// Workspace Components
import { WorkspaceHeader } from "../features/workspace/components/WorkspaceHeader";
import { TabContentArea } from "../features/workspace/components/TabContentArea";

// Feature Components
import { FormulaBar } from "../features/formula-bar/FormulaBar";

// Hooks
import { useWorkspace } from "../hooks/useWorkspace";
import { useSheetSessions, useManifestSessions, useCodeSessions } from "../hooks/useFileSessions";
import { useFormulaBarOptimized } from "../hooks/useFormulaBarOptimized";
import { useSettings } from "../hooks/useSettings";
import { useManifestHandlers } from "../hooks/useManifestHandlers";
import { useSheetHandlers } from "../hooks/useSheetHandlers";
import { useElectronIntegration } from "../hooks/useElectronAPI";
import { cloneManifest } from "../utils/sessionHelpers";

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
  | { type: "SET_TREE_SEARCH"; payload: string }
  | { type: "SET_SHEET_SEARCH"; payload: string }
  | { type: "SET_SEARCH_NAVIGATION"; payload: SearchNavigationCommand | undefined }
  | { type: "SET_REPLACE_COMMAND"; payload: ReplaceCommand | null };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case "SET_TREE_SEARCH":
      return { ...state, treeSearchQuery: action.payload };
    case "SET_SHEET_SEARCH":
      return { ...state, sheetSearchQuery: action.payload };
    case "SET_SEARCH_NAVIGATION":
      return { ...state, searchNavigation: action.payload };
    case "SET_REPLACE_COMMAND":
      return { ...state, replaceCommand: action.payload };
    default:
      return state;
  }
};

export const Home: React.FC = () => {
  const settings = useSettings();
  const { presetId } = settings;
  const isGridparkTheme = presetId === "gridpark";

  // Electron API integration with useSyncExternalStore
  const electron = useElectronIntegration();

  // File sessions
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
    onSaveCode: handleSaveCode,
  } = useCodeSessions();

  // Unified workspace hook (consolidates 4 previous hooks)
  const workspace = useWorkspace(
    {
      sheetSessions,
      sheetDirtyMap,
      codeSessions,
      manifestDirtyMap,
      getManifestSessionKey,
    },
    {
      ensureManifestSession,
      ensureCodeSession,
      setSheetSessions,
      setSheetDirtyMap,
    }
  );

  const {
    workbookNodes,
    openTabs,
    activeTabId,
    selectedNodeId,
    isLoadingFiles, // from useTransition
    findWorkbookNode,
    updateWorkbookReferences,
    handleTabChange,
    tabIsDirty,
    dirtyNodeIds,
    handleNodeSelect,
    handleCloseTab,
  } = workspace;

  // Search state using reducer
  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    treeSearchQuery: "",
    sheetSearchQuery: "",
    searchNavigation: undefined,
    replaceCommand: null,
  });

  const setTreeSearchQuery = useCallback(
    (query: string) => dispatchSearch({ type: "SET_TREE_SEARCH", payload: query }),
    []
  );

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId) || null,
    [openTabs, activeTabId]
  );

  // Optimized formula bar with useReducer
  const formulaBarState = useFormulaBarOptimized(activeTab?.kind);
  const { handleActiveCellDetails, formulaCommitCommand } = formulaBarState;

  // Platform Capabilities (memoized once)
  const platformCapabilities = useMemo(() => getPlatformCapabilities(), []);

  // Sheet Handlers
  const { handleSaveSheetSession, handleSheetDirtyChange } = useSheetHandlers({
    openTabs,
    findWorkbookNode,
    updateWorkbookReferences,
    handlePersistSheetSession,
    saveWorkbookFile,
    setSheetDirtyMap,
  });

  // Manifest Handlers
  const { handleManifestChange, handleSaveManifest } = useManifestHandlers({
    manifestSessions,
    setManifestSessions,
    getManifestSessionKey,
    readManifestFile,
    updateWorkbookReferences,
    createDefaultManifest,
  });

  // Update window title
  const activeTitle = useMemo(() => {
    if (!activeTab) return "Gridpark";
    if (activeTab.kind === "sheet") {
      return `${activeTab.sheetName} - ${activeTab.fileName}`;
    }
    if (activeTab.kind === "manifest") {
      return `${activeTab.fileName} (Manifest)`;
    }
    return `${activeTab.codeFile.name} - ${activeTab.fileName}`;
  }, [activeTab]);

  useEffect(() => {
    electron.setWindowTitle(activeTitle);
  }, [activeTitle, electron]);

  // Derived state for EditorPanel (memoized)
  const activeCodeSession = useMemo(
    () => (activeTab?.kind === "code" ? codeSessions[activeTab.codeFile.absolutePath] : undefined),
    [activeTab, codeSessions]
  );

  const activeManifestKey = useMemo(
    () => (activeTab?.kind === "manifest" ? getManifestSessionKey(activeTab.file) : null),
    [activeTab, getManifestSessionKey]
  );

  const activeManifestSession = useMemo(
    () => (activeManifestKey ? manifestSessions[activeManifestKey] : undefined),
    [activeManifestKey, manifestSessions]
  );

  const activeSheetSession = useMemo(
    () => (activeTab?.kind === "sheet" ? sheetSessions[activeTab.id] : undefined),
    [activeTab, sheetSessions]
  );

  const manifestEditorData = useMemo(() => {
    if (activeTab?.kind !== "manifest") return null;
    return (
      activeManifestSession?.data ??
      (activeTab.file.manifest
        ? cloneManifest(activeTab.file.manifest)
        : createDefaultManifest(activeTab.file))
    );
  }, [activeTab, activeManifestSession, createDefaultManifest]);

  const manifestIsDirty = useMemo(
    () => (activeManifestKey ? Boolean(manifestDirtyMap[activeManifestKey]) : false),
    [activeManifestKey, manifestDirtyMap]
  );

  const canEditManifest = useMemo(() => Boolean(window.electronAPI?.gridpark), []);

  // Placeholder handlers for future implementation
  const handleBack = useCallback(() => {
    console.log("Navigate back");
  }, []);

  const handleProceed = useCallback(() => {
    console.log("Proceed action");
  }, []);

  const handleCellSelect = useCallback((pos: any) => {
    console.log("Cell selected:", pos);
  }, []);

  const handleRangeSelect = useCallback((range: any) => {
    console.log("Range selected:", range);
  }, []);

  const layout = (
    <AppLayout
      header={
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <WorkspaceHeader
            onBack={handleBack}
            onProceed={handleProceed}
            searchQuery={searchState.treeSearchQuery}
            onSearchChange={setTreeSearchQuery}
            onOpenSettings={() => settings.setSettingsOpen(true)}
          />
          <FormulaBar formulaBarState={formulaBarState} />
        </Box>
      }
      sidebar={
        <SidebarExplorer
          workbookNodes={workbookNodes}
          searchQuery={searchState.treeSearchQuery}
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
        sheetSearchQuery={searchState.sheetSearchQuery}
        searchNavigation={searchState.searchNavigation}
        replaceCommand={searchState.replaceCommand}
        formulaCommitCommand={formulaCommitCommand}
      />
    </AppLayout>
  );

  return (
    <>
      {isGridparkTheme ? <GridparkPlayground>{layout}</GridparkPlayground> : layout}
      <SettingsDrawer settings={settings} />
    </>
  );
};
