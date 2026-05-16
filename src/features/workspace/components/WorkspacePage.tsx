/**
 * WorkspacePage Component
 *
 * Smart component containing all workspace business logic.
 * Uses useWorkspaceState for all data and actions.
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../../stores';
import { selectCanUndo, selectCanRedo } from '../../../stores/spreadsheetSlice';
import { AppLayout } from '../../../renderer/components/layout/AppLayout';
import { ActivityBar, ActivityBarView } from '../../../renderer/components/layout/ActivityBar';
import { SidebarExplorer } from '../../../renderer/components/layout/SidebarExplorer';
import { GitPlaceholderSidebar } from '../../../renderer/components/sidebar/GitPlaceholderSidebar';
import { WorkspaceHeader } from '../../../renderer/features/workspace/components/WorkspaceHeader';
import { TabContentArea } from '../../../renderer/features/workspace/components/TabContentArea';
import { EditorPanelHandle } from '../../../renderer/features/workspace/components/EditorPanel';
import { getPlatformCapabilities } from '../../../renderer/utils/platform';
import { useWorkspaceState } from '../hooks/useWorkspaceState';
import { useExcelFileOperations } from '../../../renderer/hooks/useExcelFileOperations';

export interface WorkspacePageProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenSettings?: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onUndo, onRedo, onOpenSettings }) => {
  const state = useWorkspaceState();
  const editorPanelRef = useRef<EditorPanelHandle>(null);
  const [activeView, setActiveView] = useState<ActivityBarView>('excel');
  const { createNewFile, openFile, lastCreatedFile, lastOpenedFiles } = useExcelFileOperations();

  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  const {
    workbookNodes,
    openTabs,
    activeTabId,
    selectedNodeId,
    activeTab,
    searchState,
    setTreeSearchQuery,
    saveManager,
    autoSave,
    handleTabChange: handleTabChangeRaw,
    handleCloseTab,
    handleNodeSelect: handleNodeSelectRaw,
    formulaBarState,
    dirtyNodeIds,
    resetWorkbooks,
    electron,
  } = state;

  // ============================================
  // Wrapper functions to match component API
  // ============================================

  const handleNodeSelect = useCallback(
    (node: any) => handleNodeSelectRaw(node),
    [handleNodeSelectRaw]
  );

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, value: string | number) => handleTabChangeRaw(event, value),
    [handleTabChangeRaw]
  );

  const handleViewChange = useCallback((view: ActivityBarView) => {
    setActiveView(view);
    if (view === 'settings' && onOpenSettings) {
      onOpenSettings();
      setTimeout(() => setActiveView('excel'), 200);
    }
  }, [onOpenSettings]);

  // ============================================
  // Platform Capabilities (memoized once)
  // ============================================

  const platformCapabilities = useMemo(() => {
    const caps = getPlatformCapabilities();
    return {
      isMac: typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'),
      isWindows: typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('win'),
      isLinux: typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('linux'),
      isWeb: caps.platform === 'web',
      hasFilesystem: caps.canAccessFileSystem,
      hasShell: caps.hasSystemIntegration,
    };
  }, []);

  // ============================================
  // Event Handlers
  // ============================================

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    try {
      await editorPanelRef.current?.save();
      await saveManager.saveTab(activeTab.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save: ${errorMessage}`);
    }
  }, [activeTab, saveManager]);

  const handleSaveAs = useCallback(async (formatHint?: string) => {
    if (!activeTab) return;
    try {
      await saveManager.saveTabAs(activeTab.id, formatHint);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to export: ${errorMessage}`);
    }
  }, [activeTab, saveManager]);

  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo();
    } else {
      editorPanelRef.current?.undo();
    }
  }, [onUndo]);

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo();
    } else {
      editorPanelRef.current?.redo();
    }
  }, [onRedo]);

  const handleCellSelect = useCallback((_pos: any) => {}, []);
  const handleRangeSelect = useCallback((_range: any) => {}, []);

  // ============================================================================
  // Sheet dirty tracking
  // ============================================================================

  const handleDirtyChange = useCallback(
    async (dirty: boolean) => {
      if (!activeTab) return;
      if (dirty) {
        await saveManager.markTabDirty(activeTab.id);
      } else {
        await saveManager.markTabClean(activeTab.id);
      }
    },
    [activeTab?.id, saveManager.markTabDirty, saveManager.markTabClean]
  );

  // ============================================================================
  // Global keyboard shortcuts
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs]);

  // ============================================================================
  // Menu handlers (Electron)
  // ============================================================================

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;
    const unsubscribeSave = electronAPI.onMenuSave?.(() => handleSave());
    const unsubscribeSaveAs = electronAPI.onMenuSaveAs?.(() => handleSaveAs());
    return () => {
      unsubscribeSave?.();
      unsubscribeSaveAs?.();
    };
  }, [handleSave, handleSaveAs]);

  useEffect(() => {
    const unsubscribeNewFile = window.electronAPI?.onMenuNewFile?.(() => createNewFile());
    return () => unsubscribeNewFile?.();
  }, [createNewFile]);

  // ============================================================================
  // New File / Import integration
  // ============================================================================

  useEffect(() => {
    if (lastCreatedFile) {
      resetWorkbooks([lastCreatedFile]);
      electron.setWindowTitle(lastCreatedFile.name);
    }
  }, [lastCreatedFile, resetWorkbooks, electron]);

  useEffect(() => {
    if (lastOpenedFiles.length > 0) {
      resetWorkbooks(lastOpenedFiles);
      electron.setWindowTitle(lastOpenedFiles[0].name);
    }
  }, [lastOpenedFiles, resetWorkbooks, electron]);

  // ============================================================================
  // Window title
  // ============================================================================

  const activeTitle = useMemo(() => {
    if (!activeTab) return 'Gridpark';
    if (activeTab.kind === 'sheet') return `${activeTab.sheetName} - ${activeTab.fileName}`;
    return 'Gridpark';
  }, [activeTab]);

  useEffect(() => {
    electron.setWindowTitle(activeTitle);
  }, [activeTitle, electron]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AppLayout
      activityBar={
        <ActivityBar activeView={activeView} onViewChange={handleViewChange} />
      }
      header={
        <WorkspaceHeader
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onImport={openFile}
          searchQuery={searchState.treeSearchQuery}
          onSearchChange={setTreeSearchQuery}
          onOpenSettings={onOpenSettings || (() => {})}
          autoSaveEnabled={autoSave.autoSaveEnabled}
          onAutoSaveToggle={autoSave.toggleAutoSave}
          canUndo={canUndo}
          canRedo={canRedo}
          hasUnsavedChanges={saveManager.dirtyIds.length > 0}
          disabled={!activeTab}
        />
      }
      sidebar={
        activeView === 'excel' ? (
          <SidebarExplorer
            workbookNodes={workbookNodes}
            searchQuery={searchState.treeSearchQuery}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            dirtyNodeIds={dirtyNodeIds}
            onFileCreate={createNewFile}
            onFileImport={openFile}
          />
        ) : activeView === 'branch' ? (
          <GitPlaceholderSidebar viewType="branch" />
        ) : null
      }
      hideSidebar={activeView !== 'excel' && activeView !== 'branch'}
    >
      <TabContentArea
        ref={editorPanelRef}
        openTabs={openTabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onCloseTab={handleCloseTab}
        tabIsDirty={saveManager.tabIsDirty}
        activeTab={activeTab}
        platformCapabilities={platformCapabilities}
        onDirtyChange={handleDirtyChange}
        onCellSelect={handleCellSelect}
        onRangeSelect={handleRangeSelect}
        onActiveCellDetails={formulaBarState.handleActiveCellDetails}
        sheetSearchQuery={searchState.sheetSearchQuery}
        searchNavigation={searchState.searchNavigation}
        replaceCommand={searchState.replaceCommand}
        formulaCommitCommand={formulaBarState.formulaCommitCommand}
        formulaBarState={formulaBarState}
      />
    </AppLayout>
  );
};
