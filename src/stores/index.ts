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

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Whitelist: only persist these slices
  whitelist: ['spreadsheet'],
  // Blacklist: never persist these
  blacklist: [],
};

// ============================================================================
// Root Reducer
// ============================================================================

const rootReducer = combineReducers({
  spreadsheet: spreadsheetReducer,
  // Add more slices here as needed:
  // workspace: workspaceReducer,
  // settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: persistedReducer,
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
