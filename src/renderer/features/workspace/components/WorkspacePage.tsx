/**
 * WorkspacePage Component
 *
 * This is the SMART component that contains all business logic.
 * It uses the useWorkspaceState hook to get all data and actions.
 *
 * Pages should import THIS component, not implement logic directly.
 */

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../stores';
import { updateUndoRedo, selectCanUndo, selectCanRedo } from '../../../../stores/spreadsheetSlice';
import { AppLayout } from '../../../components/layout/AppLayout';
import { SidebarExplorer } from '../../../components/layout/SidebarExplorer';
import { WorkspaceHeader } from './WorkspaceHeader';
import { TabContentArea } from './TabContentArea';
import { EditorPanelHandle } from './EditorPanel';
import { getPlatformCapabilities } from '../../../utils/platform';
import { useWorkspaceState } from '../hooks/useWorkspaceState';
import { parseExcelFile } from '../../../utils/excelUtils';
import type { ExcelFile } from '../../../types/excel';

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

  // Get undo/redo state from Redux
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  const {
    workbookNodes,
    openTabs,
    activeTabId,
    selectedNodeId,
    activeTab,
    searchState,
    setTreeSearchQuery: _setTreeSearchQuery,
    setSheetSearchQuery,
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
    loadFiles,
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
  // WSL-safe file open
  // ============================================

  const handleOpenFile = useCallback(() => {
    const electronAPI = window.electronAPI;

    // WSL: native dialog freezes — use Chromium file picker, parse in renderer
    if (!electronAPI || electronAPI.isWSL) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      input.multiple = true;
      document.body.appendChild(input);
      input.onchange = async () => {
        document.body.removeChild(input);
        const picked = Array.from(input.files || []);
        if (!picked.length) return;
        const excelFiles = (
          await Promise.all(
            picked.map(async f => {
              try {
                return await parseExcelFile(await f.arrayBuffer(), f.name);
              } catch {
                return null;
              }
            })
          )
        ).filter((f): f is ExcelFile => Boolean(f));
        if (excelFiles.length) loadFiles(excelFiles);
      };
      input.click();
    } else {
      // Non-WSL Electron: native dialog via IPC
      electronAPI.openFile();
    }
  }, [loadFiles]);

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
      hasFilesystem: caps.canAccessFileSystem,
      hasShell: caps.hasSystemIntegration,
    };
  }, []);

  // ============================================
  // Event Handlers
  // ============================================

  const handleSave = useCallback(async () => {
    console.log('[WorkspacePage] === SAVE REQUESTED ===', {
      hasActiveTab: !!activeTab,
      tabKind: activeTab?.kind,
      tabId: activeTab?.id,
    });

    if (!activeTab) {
      console.warn('[WorkspacePage] No active tab to save');
      return;
    }

    try {
      // Force immediate save through EditorPanel
      console.log('[WorkspacePage] Calling EditorPanel.save()...');
      await editorPanelRef.current?.save();
      console.log('[WorkspacePage] EditorPanel.save() completed');

      // Then save through saveManager (which writes to file)
      console.log('[WorkspacePage] Calling saveManager.saveTab()...');
      await saveManager.saveTab(activeTab.id);
      console.log('[WorkspacePage] saveManager.saveTab() completed');

      console.log('[WorkspacePage] === SAVE SUCCESS ===');
    } catch (error) {
      console.error('[WorkspacePage] === SAVE ERROR ===', error);

      // Show error to user (you can replace this with a toast/snackbar)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save: ${errorMessage}`);
    }
  }, [activeTab, saveManager]);

  const handleSaveAs = useCallback(async () => {
    console.log('[WorkspacePage] Save As requested');

    if (!activeTab) {
      console.warn('[WorkspacePage] No active tab to export');
      return;
    }

    try {
      await saveManager.saveTabAs(activeTab.id);
    } catch (error) {
      console.error('[WorkspacePage] Failed to export:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to export: ${errorMessage}`);
    }
  }, [activeTab, saveManager]);

  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo();
    } else {
      editorPanelRef.current?.undo();
      // Update undo/redo state after operation
      setTimeout(() => {
        const newCanUndo = editorPanelRef.current?.canUndo() ?? false;
        const newCanRedo = editorPanelRef.current?.canRedo() ?? false;
        if (newCanUndo !== canUndo || newCanRedo !== canRedo) {
          dispatch(updateUndoRedo({ canUndo: newCanUndo, canRedo: newCanRedo }));
        }
      }, 0);
    }
  }, [onUndo, canUndo, canRedo, dispatch]);

  const handleRedo = useCallback(() => {
    if (onRedo) {
      onRedo();
    } else {
      editorPanelRef.current?.redo();
      // Update undo/redo state after operation
      setTimeout(() => {
        const newCanUndo = editorPanelRef.current?.canUndo() ?? false;
        const newCanRedo = editorPanelRef.current?.canRedo() ?? false;
        if (newCanUndo !== canUndo || newCanRedo !== canRedo) {
          dispatch(updateUndoRedo({ canUndo: newCanUndo, canRedo: newCanRedo }));
        }
      }, 0);
    }
  }, [onRedo, canUndo, canRedo, dispatch]);

  const handleCellSelect = useCallback((_pos: any) => {
    // TODO: Implement cell selection handling
  }, []);

  const handleRangeSelect = useCallback((_range: any) => {
    // TODO: Implement range selection handling
  }, []);

  // ============================================================================
  // Save handlers for different content types
  // ============================================================================

  const handleSaveManifest = useCallback(
    async (workbookId: string, _file: ExcelFile) => {
      const tab = openTabs.find(t => t.kind === 'manifest' && t.workbookId === workbookId);
      if (tab) {
        await saveManager.saveTab(tab.id);
      }
    },
    [openTabs, saveManager]
  );

  const handleSaveCode = useCallback(
    async (_codeFile: GridparkCodeFile) => {
      const tab = openTabs.find(
        t => t.kind === 'code' && t._codeFile.absolutePath === _codeFile.absolutePath
      );
      if (tab) {
        await saveManager.saveTab(tab.id);
      }
    },
    [openTabs, saveManager]
  );

  // ============================================================================
  // Sheet dirty tracking (Database-powered)
  // ============================================================================

  // ExcelViewerDB calls this directly when sheet is edited
  const handleDirtyChange = useCallback(
    async (dirty: boolean) => {
      if (!activeTab) return;
      console.log('[WorkspacePage] Sheet dirty state changed', { tabId: activeTab.id, dirty });

      // Await to ensure state is updated before next call
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
  // Menu Save/Save As handlers
  // ============================================================================

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    // Listen for menu save event
    const unsubscribeSave = electronAPI.onMenuSave?.(() => {
      console.log('[WorkspacePage] Menu Save triggered');
      handleSave();
    });

    // Listen for menu save as event
    const unsubscribeSaveAs = electronAPI.onMenuSaveAs?.(() => {
      console.log('[WorkspacePage] Menu Save As triggered');
      // TODO: Implement Save As functionality
    });

    return () => {
      unsubscribeSave?.();
      unsubscribeSaveAs?.();
    };
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
    return `${activeTab._codeFile.name} - ${activeTab.fileName}`;
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

      // Only update Redux if values actually changed
      if (newCanUndo !== canUndo || newCanRedo !== canRedo) {
        dispatch(updateUndoRedo({ canUndo: newCanUndo, canRedo: newCanRedo }));
      }
    };

    updateUndoRedoState();

    // Poll for updates (Monaco editor doesn't provide change events for undo stack)
    const interval = setInterval(updateUndoRedoState, 200);

    return () => clearInterval(interval);
  }, [activeTab, canUndo, canRedo, dispatch]);

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
          onSaveAs={handleSaveAs}
          searchQuery={searchState.sheetSearchQuery}
          onSearchChange={setSheetSearchQuery}
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
          disabled={!activeTab}
        />
      }
      sidebar={
        <SidebarExplorer
          workbookNodes={workbookNodes}
          searchQuery=""
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          dirtyNodeIds={dirtyNodeIds}
          onOpenFile={handleOpenFile}
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
