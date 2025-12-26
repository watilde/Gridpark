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
 * Data persistence is handled by in-memory database:
 * - Sheet data → database cells table (including dirty flags)
 * - Manifest/Code → File system (via Electron)
 *
 * Redux manages UI state:
 * - Workspace navigation (tabs, nodes, selection)
 * - UI preferences (auto-save, settings)
 * - Formula bar state (centralized)
 * - Undo/redo state (centralized)
 *
 * NOTE: Dirty tracking is now EXCLUSIVELY in database (sheetMetadata.dirty)
 * Use db.subscribe to reactively read dirty state from database
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
  // Formula Bar State (Centralized)
  // ========================================================================
  formulaBar: {
    activeCellAddress: string;
    formulaBarValue: string;
    formulaBaselineValue: string;
    isEditing: boolean;
  };

  // ========================================================================
  // Undo/Redo State (Centralized)
  // ========================================================================
  undoRedo: {
    canUndo: boolean;
    canRedo: boolean;
  };

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
  formulaBar: {
    activeCellAddress: '',
    formulaBarValue: '',
    formulaBaselineValue: '',
    isEditing: false,
  },
  undoRedo: {
    canUndo: false,
    canRedo: false,
  },
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
    // Formula Bar Actions
    // ========================================================================

    setFormulaBarAddress: (state, action: PayloadAction<string>) => {
      state.formulaBar.activeCellAddress = action.payload;
    },

    setFormulaBarValue: (state, action: PayloadAction<string>) => {
      state.formulaBar.formulaBarValue = action.payload;
    },

    setFormulaBaselineValue: (state, action: PayloadAction<string>) => {
      state.formulaBar.formulaBaselineValue = action.payload;
    },

    setFormulaBarEditing: (state, action: PayloadAction<boolean>) => {
      state.formulaBar.isEditing = action.payload;
    },

    updateFormulaBar: (
      state,
      action: PayloadAction<{
        address?: string;
        value?: string;
        baseline?: string;
        isEditing?: boolean;
      }>
    ) => {
      const { address, value, baseline, isEditing } = action.payload;
      if (address !== undefined) state.formulaBar.activeCellAddress = address;
      if (value !== undefined) state.formulaBar.formulaBarValue = value;
      if (baseline !== undefined) state.formulaBar.formulaBaselineValue = baseline;
      if (isEditing !== undefined) state.formulaBar.isEditing = isEditing;
    },

    // ========================================================================
    // Undo/Redo Actions
    // ========================================================================

    setCanUndo: (state, action: PayloadAction<boolean>) => {
      state.undoRedo.canUndo = action.payload;
    },

    setCanRedo: (state, action: PayloadAction<boolean>) => {
      state.undoRedo.canRedo = action.payload;
    },

    updateUndoRedo: (
      state,
      action: PayloadAction<{ canUndo: boolean; canRedo: boolean }>
    ) => {
      state.undoRedo = action.payload;
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

  // Formula Bar
  setFormulaBarAddress,
  setFormulaBarValue,
  setFormulaBaselineValue,
  setFormulaBarEditing,
  updateFormulaBar,

  // Undo/Redo
  setCanUndo,
  setCanRedo,
  updateUndoRedo,

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

// Formula Bar selectors
export const selectFormulaBar = (state: RootState) => state.spreadsheet.formulaBar;
export const selectFormulaBarAddress = (state: RootState) =>
  state.spreadsheet.formulaBar.activeCellAddress;
export const selectFormulaBarValue = (state: RootState) =>
  state.spreadsheet.formulaBar.formulaBarValue;
export const selectFormulaBarEditing = (state: RootState) =>
  state.spreadsheet.formulaBar.isEditing;

// Undo/Redo selectors
export const selectUndoRedo = (state: RootState) => state.spreadsheet.undoRedo;
export const selectCanUndo = (state: RootState) => state.spreadsheet.undoRedo.canUndo;
export const selectCanRedo = (state: RootState) => state.spreadsheet.undoRedo.canRedo;
