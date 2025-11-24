/**
 * Redux Store Configuration
 * 
 * Manages application state using Redux Toolkit with persistence:
 * - UI state (tabs, active selections, settings)
 * - Dirty state tracking
 * - Auto-save configuration
 * - Workspace metadata
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

// Import slices
import spreadsheetReducer from './spreadsheetSlice';

// ============================================================================
// Persist Configuration
// ============================================================================

const spreadsheetPersistConfig = {
  key: 'spreadsheet',
  storage,
  version: 1,
  // Only persist UI preferences, not workspace/tab state
  whitelist: ['autoSaveEnabled', 'autoSaveInterval'],
  // Don't persist tabs, workbook nodes, or selections (lost on app restart)
  blacklist: ['openTabs', 'activeTabId', 'workbookNodes', 'selectedNodeId', 'dirtyMap', 'currentDirectoryName'],
};

// ============================================================================
// Root Reducer
// ============================================================================

const rootReducer = combineReducers({
  spreadsheet: persistReducer(spreadsheetPersistConfig, spreadsheetReducer),
  // Add more slices here as needed:
  // workspace: workspaceReducer,
  // settings: settingsReducer,
});

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// ============================================================================
// TypeScript Types
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================================================
// Typed Hooks (use these instead of plain useDispatch/useSelector)
// ============================================================================

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
