import React, { useCallback, useMemo, useEffect, useReducer, useState, useRef } from "react";
import { Box } from "@mui/joy";
import { AppLayout } from "../components/layout/AppLayout";
import {
  SearchNavigationCommand,
  ReplaceCommand,
} from "../features/workbook/components/ExcelViewer";
import { getPlatformCapabilities } from "../utils/platform";
import { ExcelFile, GridparkCodeFile } from "../types/excel";

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
import { useSaveManager } from "../hooks/useSaveManager";
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

  // AutoSave state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  // Note: We pass empty sheetDirtyMap because SaveManager will override it later
  const workspace = useWorkspace(
    {
      sheetSessions,
      sheetDirtyMap: {}, // Placeholder, SaveManager will override
      codeSessions,
      manifestDirtyMap,
      getManifestSessionKey,
    },
    {
      ensureManifestSession,
      ensureCodeSession,
      setSheetSessions,
      setSheetDirtyMap: (updater) => {
        // Ignore - dirty state managed by SaveManager
        console.warn('[Home] setSheetDirtyMap called but ignored (use SaveManager)');
      },
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
    tabIsDirty: _tabIsDirty, // Ignore, use SaveManager instead
    dirtyNodeIds: _dirtyNodeIds, // Ignore, use SaveManager instead
    handleNodeSelect,
    handleCloseTab,
  } = workspace;

  // Use SaveManager's dirty state for tabs
  const tabIsDirty = useCallback((tab: WorkbookTab) => {
    return isDirty(tab.id);
  }, [isDirty]);

  // Use SaveManager's dirty state for tree nodes
  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    // Mark tabs as dirty based on SaveManager
    openTabs.forEach(tab => {
      if (isDirty(tab.id)) {
        map[tab.treeNodeId] = true;
        // Also mark parent workbook as dirty
        const workbook = workbookNodes.find(n => n.id === tab.workbookId);
        if (workbook) {
          map[workbook.id] = true;
        }
      }
    });
    return map;
  }, [openTabs, workbookNodes, isDirty]);

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

  // Manifest Handlers (still needed for editing)
  const { handleManifestChange, handleSaveManifest: manifestSaveHandler } = useManifestHandlers({
    manifestSessions,
    setManifestSessions,
    getManifestSessionKey,
    readManifestFile,
    updateWorkbookReferences,
    createDefaultManifest,
  });

  // Unified Save Manager
  const saveManager = useSaveManager(
    {
      sheetSessions,
      findWorkbookNode,
      updateWorkbookReferences,
      saveWorkbookFile,
      manifestSessions,
      getManifestSessionKey,
      codeSessions,
      openTabs,
    },
    {
      handleSaveSheetSession: async () => {}, // Dummy, useSaveManager handles internally
      handleSaveManifest: manifestSaveHandler,
      onSaveCode,
    }
  );

  const { dirtyMap, dirtyIds, isDirty, markDirty, markClean, save, saveAll } = saveManager;

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

  const handleSave = useCallback(async () => {
    console.log('[Home] handleSave called', { 
      hasActiveTab: !!activeTab, 
      tabKind: activeTab?.kind,
    });
    
    if (!activeTab) {
      console.warn('[Home] No active tab to save');
      return;
    }
    
    try {
      await save(activeTab.id);
      console.log('[Home] Save completed');
    } catch (error) {
      console.error('[Home] Save failed:', error);
    }
  }, [activeTab, save]);

  // Sheet dirty change handler (memoized to prevent infinite loops)
  const handleSheetDirtyChange = useCallback((tabId: string, dirty: boolean) => {
    console.log('[Home] Sheet dirty change:', tabId, dirty);
    if (dirty) {
      markDirty(tabId);
    } else {
      markClean(tabId);
    }
  }, [markDirty, markClean]);

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

  // Compute dirty count for auto-save (use SaveManager's dirtyIds)
  const dirtyCount = dirtyIds.length;

  // Auto-save logic: debounce and save after 2 seconds of inactivity
  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    const hasDirtyChanges = dirtyCount > 0;
    
    if (!hasDirtyChanges) {
      // No changes to save, clear any pending timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 2 seconds
    console.log('[Home] AutoSave: scheduling save in 2 seconds');
    autoSaveTimerRef.current = setTimeout(async () => {
      console.log('[Home] AutoSave: executing saveAll');
      try {
        await saveAll();
        console.log('[Home] AutoSave: completed successfully');
      } catch (error) {
        console.error('[Home] AutoSave: failed', error);
      }
      autoSaveTimerRef.current = null;
    }, 2000);

    // Cleanup on unmount or dependency change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autoSaveEnabled, dirtyCount, saveAll]);

  const handleAutoSaveToggle = useCallback((enabled: boolean) => {
    console.log('[Home] AutoSave toggled:', enabled);
    setAutoSaveEnabled(enabled);
    
    // Clear any pending auto-save timer when toggling off
    if (!enabled && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const handleCellSelect = useCallback((pos: any) => {
    // TODO: Implement cell selection handling
  }, []);

  const handleRangeSelect = useCallback((range: any) => {
    // TODO: Implement range selection handling
  }, []);

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
          autoSaveEnabled={autoSaveEnabled}
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
        onSaveManifest={async (workbookId: string, file: ExcelFile) => {
          const tab = openTabs.find(t => t.kind === 'manifest' && t.workbookId === workbookId);
          if (tab) {
            await save(tab.id);
          }
        }}
        onReloadManifest={readManifestFile}
        onCodeChange={handleCodeChange}
        onSaveCode={async (codeFile: GridparkCodeFile) => {
          const tab = openTabs.find(t => t.kind === 'code' && t.codeFile.absolutePath === codeFile.absolutePath);
          if (tab) {
            await save(tab.id);
          }
        }}
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
