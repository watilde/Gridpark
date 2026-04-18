/**
 * Spreadsheet Slice
 *
 * Manages spreadsheet-related UI state:
 * - Dirty state tracking (which tabs/files have unsaved changes)
 * - Open tabs management
 * - Active tab selection
 * - Auto-save configuration
 * - Session state (scroll position, selections, etc.)
 * - Transient UI states (highlights, etc.)
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { WorkbookTab } from '../renderer/types/tabs';
import type { FileNode } from '../renderer/features/file-explorer/FileTree';

// ============================================================================
// Types
// ============================================================================

export type { WorkbookTab };

export interface TransientHighlight {
  id: string;
  tabId: string;
  address: string;
  timestamp: number;
}

export interface SpreadsheetState {
  workbookNodes: FileNode[];
  currentDirectoryName: string;
  selectedNodeId: string;
  openTabs: WorkbookTab[];
  activeTabId: string;
  dirtyTabIds: string[];
  
  // Transient UI State
  transientHighlights: TransientHighlight[];

  formulaBar: {
    activeCellAddress: string;
    formulaBarValue: string;
    formulaBaselineValue: string;
    isEditing: boolean;
  };

  undoRedo: {
    canUndo: boolean;
    canRedo: boolean;
  };

  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}

const initialState: SpreadsheetState = {
  workbookNodes: [],
  currentDirectoryName: '',
  selectedNodeId: '',
  openTabs: [],
  activeTabId: '',
  dirtyTabIds: [],
  transientHighlights: [],
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

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    updateWorkbook: (state, action: PayloadAction<{ workbookId: string; updatedFile: any }>) => {
      const { workbookId, updatedFile } = action.payload;
      const cloneNodeWithFile = (node: FileNode): FileNode => {
        const next: FileNode = { ...node };
        if (node.file) next.file = updatedFile;
        if (node.type === 'workbook') next.name = updatedFile.name;
        if (node.children) next.children = node.children.map(child => cloneNodeWithFile(child));
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

    resetWorkspace: (state, action: PayloadAction<{ nodes: FileNode[]; directoryName: string; firstTab: WorkbookTab | null; }>) => {
      const { nodes, directoryName, firstTab } = action.payload;
      state.workbookNodes = nodes;
      state.currentDirectoryName = directoryName;
      state.openTabs = firstTab ? [firstTab] : [];
      state.activeTabId = firstTab?.id ?? '';
      state.selectedNodeId = firstTab?.treeNodeId ?? '';
    },

    openTab: (state, action: PayloadAction<WorkbookTab>) => {
      const exists = state.openTabs.find(tab => tab.id === action.payload.id);
      if (!exists) state.openTabs.push(action.payload);
      state.activeTabId = action.payload.id;
      state.selectedNodeId = action.payload.treeNodeId;
    },

    closeTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const nextTabs = state.openTabs.filter(tab => tab.id !== tabId);
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
      if (tab) state.selectedNodeId = tab.treeNodeId;
    },

    addTransientHighlight: (state, action: PayloadAction<Omit<TransientHighlight, 'timestamp'>>) => {
      state.transientHighlights.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },

    removeTransientHighlight: (state, action: PayloadAction<string>) => {
      state.transientHighlights = state.transientHighlights.filter(h => h.id !== action.payload);
    },

    clearTransientHighlights: (state) => {
      state.transientHighlights = [];
    },

    setDirtyTabIds: (state, action: PayloadAction<string[]>) => {
      state.dirtyTabIds = action.payload;
    },

    updateFormulaBar: (state, action: PayloadAction<{ address?: string; value?: string; baseline?: string; isEditing?: boolean; }>) => {
      const { address, value, baseline, isEditing } = action.payload;
      if (address !== undefined) state.formulaBar.activeCellAddress = address;
      if (value !== undefined) state.formulaBar.formulaBarValue = value;
      if (baseline !== undefined) state.formulaBar.formulaBaselineValue = baseline;
      if (isEditing !== undefined) state.formulaBar.isEditing = isEditing;
    },

    updateUndoRedo: (state, action: PayloadAction<{ canUndo: boolean; canRedo: boolean }>) => {
      state.undoRedo = action.payload;
    },

    resetSpreadsheetState: () => initialState,
  },
});

export const {
  updateWorkbook,
  setSelectedNode,
  resetWorkspace,
  openTab,
  closeTab,
  setActiveTab,
  addTransientHighlight,
  removeTransientHighlight,
  clearTransientHighlights,
  setDirtyTabIds,
  updateFormulaBar,
  updateUndoRedo,
  resetSpreadsheetState,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;

import { RootState } from './index';
export const selectActiveTab = (state: RootState) => state.spreadsheet.openTabs.find(tab => tab.id === state.spreadsheet.activeTabId) || null;
export const selectTransientHighlights = (state: RootState) => state.spreadsheet.transientHighlights;