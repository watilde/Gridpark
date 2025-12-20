/**
 * Spreadsheet Slice
 *
 * Manages spreadsheet-related UI state:
 * - Dirty state tracking (which tabs/files have unsaved changes)
 * - Open tabs management
 * - Active tab selection
 * - Auto-save configuration
 * - Session state (scroll position, selections, etc.)
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { WorkbookTab } from '../renderer/types/tabs';
import type { FileNode } from '../renderer/features/file-explorer/FileTree';

// ============================================================================
// Types
// ============================================================================

// Use the actual WorkbookTab type from the application
export type { WorkbookTab };

/**
 * OPTIMIZED Redux State: UI State ONLY
 *
 * Data persistence is handled by Dexie.js:
 * - Sheet data → Dexie cells table (including dirty flags)
 * - Manifest/Code → File system (via Electron)
 *
 * Redux manages UI state:
 * - Workspace navigation (tabs, nodes, selection)
 * - UI preferences (auto-save, settings)
 *
 * NOTE: Dirty tracking is now EXCLUSIVELY in Dexie (sheetMetadata.dirty)
 * Use useLiveQuery to reactively read dirty state from Dexie
 */
export interface SpreadsheetState {
  // ========================================================================
  // Workspace State (Navigation & Structure)
  // ========================================================================
  workbookNodes: FileNode[];
  currentDirectoryName: string;
  selectedNodeId: string;

  // ========================================================================
  // Tabs (Open Files)
  // ========================================================================
  openTabs: WorkbookTab[];
  activeTabId: string;

  // ========================================================================
  // UI Preferences
  // ========================================================================
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: SpreadsheetState = {
  workbookNodes: [],
  currentDirectoryName: '',
  selectedNodeId: '',
  openTabs: [],
  activeTabId: '',
  autoSaveEnabled: false,
  autoSaveInterval: 2000,
};

// ============================================================================
// Slice Definition
// ============================================================================

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    // ========================================================================
    // Workspace Management
    // ========================================================================

    setWorkbooks: (state, action: PayloadAction<{ nodes: FileNode[]; directoryName: string }>) => {
      state.workbookNodes = action.payload.nodes;
      state.currentDirectoryName = action.payload.directoryName;
    },

    updateWorkbook: (state, action: PayloadAction<{ workbookId: string; updatedFile: any }>) => {
      const { workbookId, updatedFile } = action.payload;

      const cloneNodeWithFile = (node: FileNode): FileNode => {
        const next: FileNode = { ...node };
        if (node.file) {
          next.file = updatedFile;
        }
        if (node.type === 'workbook') {
          next.name = updatedFile.name;
        }
        if (node.children) {
          next.children = node.children.map(child => cloneNodeWithFile(child));
        }
        return next;
      };

      state.workbookNodes = state.workbookNodes.map(node =>
        node.id === workbookId ? cloneNodeWithFile(node) : node
      );

      state.openTabs = state.openTabs.map(tab =>
        tab.workbookId === workbookId
          ? { ...tab, file: updatedFile, fileName: updatedFile.name }
          : tab
      );
    },

    setSelectedNode: (state, action: PayloadAction<string>) => {
      state.selectedNodeId = action.payload;
    },

    resetWorkspace: (
      state,
      action: PayloadAction<{
        nodes: FileNode[];
        directoryName: string;
        firstTab: WorkbookTab | null;
      }>
    ) => {
      const { nodes, directoryName, firstTab } = action.payload;
      state.workbookNodes = nodes;
      state.currentDirectoryName = directoryName;
      state.openTabs = firstTab ? [firstTab] : [];
      state.activeTabId = firstTab?.id ?? '';
      state.selectedNodeId = firstTab?.treeNodeId ?? '';
    },

    // ========================================================================
    // Tab Management
    // ========================================================================

    openTab: (state, action: PayloadAction<WorkbookTab>) => {
      const exists = state.openTabs.find(tab => tab.id === action.payload.id);
      if (!exists) {
        state.openTabs.push(action.payload);
      }
      state.activeTabId = action.payload.id;
      state.selectedNodeId = action.payload.treeNodeId;
    },

    closeTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const nextTabs = state.openTabs.filter(tab => tab.id !== tabId);

      // Update active tab
      if (state.activeTabId === tabId) {
        const nextActive = nextTabs[nextTabs.length - 1];
        if (nextActive) {
          state.activeTabId = nextActive.id;
          state.selectedNodeId = nextActive.treeNodeId;
        } else {
          state.activeTabId = '';
          state.selectedNodeId = '';
        }
      }

      state.openTabs = nextTabs;
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
      const tab = state.openTabs.find(t => t.id === action.payload);
      if (tab) {
        state.selectedNodeId = tab.treeNodeId;
      }
    },

    focusTab: (state, action: PayloadAction<WorkbookTab>) => {
      state.activeTabId = action.payload.id;
      state.selectedNodeId = action.payload.treeNodeId;
    },

    // ========================================================================
    // Auto-save Configuration
    // ========================================================================

    setAutoSaveEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload;
    },

    setAutoSaveInterval: (state, action: PayloadAction<number>) => {
      state.autoSaveInterval = action.payload;
    },

    // ========================================================================
    // Bulk Operations
    // ========================================================================

    resetSpreadsheetState: () => initialState,
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  // Workspace
  // setWorkbooks,
  updateWorkbook,
  setSelectedNode,
  resetWorkspace,

  // Tabs
  openTab,
  closeTab,
  setActiveTab,
  focusTab,

  // Auto-save
  setAutoSaveEnabled,
  setAutoSaveInterval,

  // Bulk
  resetSpreadsheetState,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;

// ============================================================================
// Selectors (for convenience and memoization)
// ============================================================================

import { RootState } from './index';

// Workspace selectors
export const selectWorkbookNodes = (state: RootState) => state.spreadsheet.workbookNodes;
export const selectCurrentDirectoryName = (state: RootState) =>
  state.spreadsheet.currentDirectoryName;
export const selectSelectedNodeId = (state: RootState) => state.spreadsheet.selectedNodeId;

// Tab selectors
export const selectOpenTabs = (state: RootState) => state.spreadsheet.openTabs;
export const selectActiveTabId = (state: RootState) => state.spreadsheet.activeTabId;
export const selectActiveTab = (state: RootState) => {
  const { openTabs, activeTabId } = state.spreadsheet;
  return openTabs.find(tab => tab.id === activeTabId) || null;
};

// Auto-save selectors
export const selectAutoSaveEnabled = (state: RootState) => state.spreadsheet.autoSaveEnabled;
export const selectAutoSaveInterval = (state: RootState) => state.spreadsheet.autoSaveInterval;
