/**
 * AppProvider
 *
 * Root provider that wraps the application with:
 * - Redux store provider
 * - Redux persist gate
 * - Theme provider (existing)
 * - Any other global providers
 */

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from '../stores';
import { ThemeProvider } from '../renderer/theme/ThemeProvider';
import { setSyncListener } from '../lib/excel-api/context';
import { addTransientHighlight, removeTransientHighlight } from '../stores/spreadsheetSlice';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Global API listener setup for US-002 Sync Highlight
 */
const APIListener: React.FC = () => {
  useEffect(() => {
    setSyncListener((changes) => {
      changes.forEach(change => {
        const id = Math.random().toString(36).substring(7);
        store.dispatch(addTransientHighlight({
          id,
          tabId: change.tabId,
          address: change.address
        }));
        
        // Auto-remove after 200ms as per design spec for immediate feedback
        setTimeout(() => {
          store.dispatch(removeTransientHighlight(id));
        }, 200);
      });
    });
  }, []);

  return null;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <APIListener />
          {children}
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};
