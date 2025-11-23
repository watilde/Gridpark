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
    onSaveCode,
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
  const handleUndo = useCallback(() => {
    // TODO: Implement undo functionality
  }, []);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo functionality
  }, []);

  const handleSave = useCallback(() => {
    console.log('[Home] handleSave called', { 
      hasActiveTab: !!activeTab, 
      tabKind: activeTab?.kind,
      hasSession: activeTab?.kind === 'sheet' ? !!sheetSessions[activeTab.id] : true
    });
    
    if (!activeTab) {
      console.warn('[Home] No active tab to save');
      return;
    }
    
    if (activeTab.kind === "sheet") {
      // Save sheet data
      const session = sheetSessions[activeTab.id];
      if (session) {
        console.log('[Home] Saving sheet session', activeTab.id);
        handleSaveSheetSession(activeTab.id, session);
      } else {
        console.warn('[Home] No sheet session found for', activeTab.id);
      }
    } else if (activeTab.kind === "manifest") {
      // Save manifest
      console.log('[Home] Saving manifest', activeTab.workbookId);
      handleSaveManifest(activeTab.workbookId, activeTab.file);
    } else if (activeTab.kind === "code") {
      // Save code file
      console.log('[Home] Saving code file', activeTab.codeFile.absolutePath);
      onSaveCode(activeTab.codeFile).catch((error) => {
        console.error("Failed to save code file:", error);
      });
    }
  }, [activeTab, sheetSessions, handleSaveSheetSession, handleSaveManifest, onSaveCode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+S (Mac) or Ctrl+S (Windows/Linux) for save
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        console.log('[Home] Ctrl+S / Cmd+S pressed', { 
          metaKey: event.metaKey, 
          ctrlKey: event.ctrlKey 
        });
        event.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleAutoSaveToggle = useCallback((enabled: boolean) => {
    // TODO: Implement auto-save toggle
  }, []);

  const handleCellSelect = useCallback((pos: any) => {
    // TODO: Implement cell selection handling
  }, []);

  const handleRangeSelect = useCallback((range: any) => {
    // TODO: Implement range selection handling
  }, []);

  // Debug: Log dirty state
  const dirtyCount = Object.keys(dirtyNodeIds).length;
  useEffect(() => {
    console.log('[Home] Dirty state changed:', { 
      dirtyCount, 
      dirtyIds: Object.keys(dirtyNodeIds) 
    });
  }, [dirtyNodeIds, dirtyCount]);

  const layout = (
    <AppLayout
      header={
        <WorkspaceHeader
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          searchQuery={searchState.treeSearchQuery}
          onSearchChange={setTreeSearchQuery}
          onOpenSettings={() => settings.setSettingsOpen(true)}
          autoSaveEnabled={false}
          onAutoSaveToggle={handleAutoSaveToggle}
          canUndo={false}
          canRedo={false}
          hasUnsavedChanges={dirtyCount > 0}
        />
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
        onSaveCode={onSaveCode}
        onCloseCodeTab={handleCloseTab}
        sheetSearchQuery={searchState.sheetSearchQuery}
        searchNavigation={searchState.searchNavigation}
        replaceCommand={searchState.replaceCommand}
        formulaCommitCommand={formulaCommitCommand}
        formulaBarState={formulaBarState}
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
