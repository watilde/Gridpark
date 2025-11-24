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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// Types
// ============================================================================

export interface Tab {
  id: string;
  kind: 'sheet' | 'manifest' | 'code';
  workbookId: string;
  label: string;
  sheetName?: string;
  file?: any;
  codeFile?: any;
}

export interface SheetSession {
  scrollTop: number;
  scrollLeft: number;
  selectedCell?: { row: number; col: number };
  dirty: boolean;
}

export interface SpreadsheetState {
  // Tabs
  openTabs: Tab[];
  activeTabId: string | null;
  
  // Dirty state (single source of truth)
  dirtyMap: Record<string, boolean>;
  
  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  
  // Sessions (per tab)
  sheetSessions: Record<string, SheetSession>;
  manifestSessions: Record<string, any>;
  codeSessions: Record<string, any>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: SpreadsheetState = {
  openTabs: [],
  activeTabId: null,
  dirtyMap: {},
  autoSaveEnabled: false,
  autoSaveInterval: 2000,
  sheetSessions: {},
  manifestSessions: {},
  codeSessions: {},
};

// ============================================================================
// Slice Definition
// ============================================================================

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    // ========================================================================
    // Tab Management
    // ========================================================================
    
    addTab: (state, action: PayloadAction<Tab>) => {
      const exists = state.openTabs.find(tab => tab.id === action.payload.id);
      if (!exists) {
        state.openTabs.push(action.payload);
      }
      state.activeTabId = action.payload.id;
    },
    
    removeTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      state.openTabs = state.openTabs.filter(tab => tab.id !== tabId);
      
      // Clean up related state
      delete state.dirtyMap[tabId];
      delete state.sheetSessions[tabId];
      delete state.manifestSessions[tabId];
      delete state.codeSessions[tabId];
      
      // Update active tab
      if (state.activeTabId === tabId) {
        state.activeTabId = state.openTabs.length > 0 ? state.openTabs[0].id : null;
      }
    },
    
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    
    updateTab: (state, action: PayloadAction<{ id: string; updates: Partial<Tab> }>) => {
      const tab = state.openTabs.find(t => t.id === action.payload.id);
      if (tab) {
        Object.assign(tab, action.payload.updates);
      }
    },
    
    // ========================================================================
    // Dirty State Management (Single Source of Truth)
    // ========================================================================
    
    markDirty: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      if (!state.dirtyMap[tabId]) {
        state.dirtyMap[tabId] = true;
      }
    },
    
    markClean: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      if (state.dirtyMap[tabId]) {
        delete state.dirtyMap[tabId];
      }
    },
    
    markAllClean: (state) => {
      state.dirtyMap = {};
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
    // Session Management
    // ========================================================================
    
    updateSheetSession: (state, action: PayloadAction<{ tabId: string; session: Partial<SheetSession> }>) => {
      const { tabId, session } = action.payload;
      state.sheetSessions[tabId] = {
        ...state.sheetSessions[tabId],
        ...session,
      };
    },
    
    updateManifestSession: (state, action: PayloadAction<{ key: string; session: any }>) => {
      const { key, session } = action.payload;
      state.manifestSessions[key] = session;
    },
    
    updateCodeSession: (state, action: PayloadAction<{ path: string; session: any }>) => {
      const { path, session } = action.payload;
      state.codeSessions[path] = session;
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
  // Tabs
  addTab,
  removeTab,
  setActiveTab,
  updateTab,
  
  // Dirty state
  markDirty,
  markClean,
  markAllClean,
  
  // Auto-save
  setAutoSaveEnabled,
  setAutoSaveInterval,
  
  // Sessions
  updateSheetSession,
  updateManifestSession,
  updateCodeSession,
  
  // Bulk
  resetSpreadsheetState,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;

// ============================================================================
// Selectors (for convenience and memoization)
// ============================================================================

import { RootState } from './index';

export const selectOpenTabs = (state: RootState) => state.spreadsheet.openTabs;
export const selectActiveTabId = (state: RootState) => state.spreadsheet.activeTabId;
export const selectActiveTab = (state: RootState) => {
  const { openTabs, activeTabId } = state.spreadsheet;
  return openTabs.find(tab => tab.id === activeTabId) || null;
};

export const selectDirtyMap = (state: RootState) => state.spreadsheet.dirtyMap;
export const selectDirtyTabs = (state: RootState) => Object.keys(state.spreadsheet.dirtyMap);
export const selectIsDirty = (tabId: string) => (state: RootState) => 
  Boolean(state.spreadsheet.dirtyMap[tabId]);

export const selectAutoSaveEnabled = (state: RootState) => state.spreadsheet.autoSaveEnabled;
export const selectAutoSaveInterval = (state: RootState) => state.spreadsheet.autoSaveInterval;

export const selectSheetSession = (tabId: string) => (state: RootState) => 
  state.spreadsheet.sheetSessions[tabId];
export const selectManifestSession = (key: string) => (state: RootState) => 
  state.spreadsheet.manifestSessions[key];
export const selectCodeSession = (path: string) => (state: RootState) => 
  state.spreadsheet.codeSessions[path];
