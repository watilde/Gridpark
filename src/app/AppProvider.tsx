/**
 * AppProvider
 * 
 * Root provider that wraps the application with:
 * - Redux store provider
 * - Redux persist gate
 * - Theme provider (existing)
 * - Any other global providers
 */

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from '../stores';
import { ThemeProvider } from '../renderer/theme/ThemeProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};
