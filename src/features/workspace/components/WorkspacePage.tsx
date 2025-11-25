/**
 * WorkspacePage Component
 *
 * This is the SMART component that contains all business logic.
 * It uses the useWorkspaceState hook to get all data and actions.
 *
 * Pages should import THIS component, not implement logic directly.
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { AppLayout } from '../../../renderer/components/layout/AppLayout';
import { SidebarExplorer } from '../../../renderer/components/layout/SidebarExplorer';
import { WorkspaceHeader } from '../../../renderer/features/workspace/components/WorkspaceHeader';
import { TabContentArea } from '../../../renderer/features/workspace/components/TabContentArea';
import { EditorPanelHandle } from '../../../renderer/features/workspace/components/EditorPanel';
import { getPlatformCapabilities } from '../../../renderer/utils/platform';
import { useWorkspaceState } from '../hooks/useWorkspaceState';
import type { ExcelFile, GridparkCodeFile } from '../../../renderer/types/excel';

export interface WorkspacePageProps {
  // Optional props for customization
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenSettings?: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onUndo, onRedo, onOpenSettings }) => {
  // ============================================
  // Get ALL state from single hook
  // ============================================

  const state = useWorkspaceState();
  const editorPanelRef = useRef<EditorPanelHandle>(null);

  // Track undo/redo availability
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
    handleManifestChange,
    handleCodeChange,
    readManifestFile,
    formulaBarState,
    activeManifestSession,
    activeCodeSession,
    manifestEditorData,
    manifestIsDirty,
    canEditManifest,
    dirtyNodeIds,
    electron,
  } = state;

  // ============================================
  // Wrapper functions to match component API
  // ============================================

  const handleNodeSelect = useCallback(
    (node: any) => {
      handleNodeSelectRaw(node);
    },
    [handleNodeSelectRaw]
  );

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, value: string | number) => {
      handleTabChangeRaw(event, value);
    },
    [handleTabChangeRaw]
  );

  // ============================================
  // Platform Capabilities (memoized once)
  // ============================================

  const platformCapabilities = useMemo(() => {
    const caps = getPlatformCapabilities();
    // Transform to TabContentArea expected format
    return {
      isMac: typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'),
      isWindows:
        typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('win'),
      isLinux:
        typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('linux'),
      isWeb: caps.platform === 'web',
      hasFilesystem: caps.canAccessFileSystem,
      hasShell: caps.hasSystemIntegration,
    };
  }, []);

  // ============================================
  // Event Handlers
  // ============================================

  const handleSave = useCallback(async () => {
    console.log('[WorkspacePage] handleSave called', {
      hasActiveTab: !!activeTab,
      tabKind: activeTab?.kind,
    });

    if (!activeTab) {
      console.warn('[WorkspacePage] No active tab to save');
      return;
    }

    try {
      await saveManager.saveTab(activeTab.id);
      console.log('[WorkspacePage] Save completed');
    } catch (error) {
      console.error('[WorkspacePage] Save failed:', error);
    }
  }, [activeTab, saveManager]);

  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo();
    } else {
      editorPanelRef.current?.undo();
      // Update undo/redo state after operation
      setTimeout(() => {
        setCanUndo(editorPanelRef.current?.canUndo() ?? false);
        setCanRedo(editorPanelRef.current?.canRedo() ?? false);
      }, 0);
    }
  }, [onUndo]);

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo();
    } else {
      editorPanelRef.current?.redo();
      // Update undo/redo state after operation
      setTimeout(() => {
        setCanUndo(editorPanelRef.current?.canUndo() ?? false);
        setCanRedo(editorPanelRef.current?.canRedo() ?? false);
      }, 0);
    }
  }, [onRedo]);

  const handleCellSelect = useCallback((pos: any) => {
    // TODO: Implement cell selection handling
  }, []);

  const handleRangeSelect = useCallback((range: any) => {
    // TODO: Implement range selection handling
  }, []);

  // ============================================================================
  // Save handlers for different content types
  // ============================================================================

  const handleSaveManifest = useCallback(
    async (workbookId: string, file: ExcelFile) => {
      const tab = openTabs.find(t => t.kind === 'manifest' && t.workbookId === workbookId);
      if (tab) {
        await saveManager.saveTab(tab.id);
      }
    },
    [openTabs, saveManager]
  );

  const handleSaveCode = useCallback(
    async (codeFile: GridparkCodeFile) => {
      const tab = openTabs.find(
        t => t.kind === 'code' && t.codeFile.absolutePath === codeFile.absolutePath
      );
      if (tab) {
        await saveManager.saveTab(tab.id);
      }
    },
    [openTabs, saveManager]
  );

  // ============================================================================
  // Sheet dirty tracking (Dexie-powered)
  // ============================================================================

  // ExcelViewerDexie calls this directly when sheet is edited
  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      if (!activeTab) return;
      console.log('[WorkspacePage] Sheet dirty state changed', { tabId: activeTab.id, dirty });
      if (dirty) {
        saveManager.markTabDirty(activeTab.id);
      } else {
        saveManager.markTabClean(activeTab.id);
      }
    },
    [activeTab, saveManager]
  );

  // ============================================================================
  // Global keyboard shortcuts
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+S (Mac) or Ctrl+S (Windows/Linux) for save
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        console.log('[WorkspacePage] Ctrl+S / Cmd+S pressed');
        event.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // ============================================================================
  // Update window title
  // ============================================================================

  const activeTitle = useMemo(() => {
    if (!activeTab) return 'Gridpark';
    if (activeTab.kind === 'sheet') {
      return `${activeTab.sheetName} - ${activeTab.fileName}`;
    }
    if (activeTab.kind === 'manifest') {
      return `${activeTab.fileName} (Manifest)`;
    }
    return `${activeTab.codeFile.name} - ${activeTab.fileName}`;
  }, [activeTab]);

  useEffect(() => {
    electron.setWindowTitle(activeTitle);
  }, [activeTitle, electron]);

  // ============================================================================
  // Update undo/redo availability when active tab changes
  // ============================================================================

  useEffect(() => {
    // Update undo/redo state when active tab changes
    const updateUndoRedoState = () => {
      const newCanUndo = editorPanelRef.current?.canUndo() ?? false;
      const newCanRedo = editorPanelRef.current?.canRedo() ?? false;
      setCanUndo(newCanUndo);
      setCanRedo(newCanRedo);
    };

    updateUndoRedoState();

    // Poll for updates (Monaco editor doesn't provide change events for undo stack)
    const interval = setInterval(updateUndoRedoState, 200);

    return () => clearInterval(interval);
  }, [activeTab]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AppLayout
      header={
        <WorkspaceHeader
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          searchQuery={searchState.treeSearchQuery}
          onSearchChange={setTreeSearchQuery}
          onOpenSettings={
            onOpenSettings ||
            (() => {
              /* noop */
            })
          }
          autoSaveEnabled={autoSave.autoSaveEnabled}
          onAutoSaveToggle={autoSave.toggleAutoSave}
          canUndo={canUndo}
          canRedo={canRedo}
          hasUnsavedChanges={saveManager.dirtyIds.length > 0}
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
        ref={editorPanelRef}
        openTabs={openTabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onCloseTab={handleCloseTab}
        tabIsDirty={saveManager.tabIsDirty}
        activeTab={activeTab}
        activeCodeSession={activeCodeSession}
        activeManifestSession={activeManifestSession}
        manifestEditorData={manifestEditorData}
        manifestIsDirty={manifestIsDirty}
        canEditManifest={canEditManifest}
        platformCapabilities={platformCapabilities}
        onDirtyChange={handleDirtyChange}
        onCellSelect={handleCellSelect}
        onRangeSelect={handleRangeSelect}
        onActiveCellDetails={formulaBarState.handleActiveCellDetails}
        onManifestChange={handleManifestChange}
        onSaveManifest={handleSaveManifest}
        onReloadManifest={readManifestFile}
        onCodeChange={handleCodeChange}
        onSaveCode={handleSaveCode}
        onCloseCodeTab={handleCloseTab}
        sheetSearchQuery={searchState.sheetSearchQuery}
        searchNavigation={searchState.searchNavigation}
        replaceCommand={searchState.replaceCommand}
        formulaCommitCommand={formulaBarState.formulaCommitCommand}
        formulaBarState={formulaBarState}
      />
    </AppLayout>
  );
};
