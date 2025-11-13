import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';

import {
  createThemeFromPreset,
  DEFAULT_THEME_ID,
  themeOptions,
  themePresetList,
  themePresets,
  type ThemePreset,
  type ThemePresetId,
} from './theme';

type ThemeContextValue = {
  presetId: ThemePresetId;
  preset: ThemePreset;
  presets: ThemePreset[];
  setPresetId: (id: ThemePresetId) => void;
};

const STORAGE_KEY = 'gridpark.themePreset';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoragePreset = (): ThemePresetId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = window.localStorage?.getItem(STORAGE_KEY) as ThemePresetId | null;
  if (stored && themePresets[stored]) {
    return stored;
  }
  return DEFAULT_THEME_ID;
};

export const ThemeProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [presetId, setPresetIdState] = useState<ThemePresetId>(readStoragePreset);

  const setPresetId = useCallback((next: ThemePresetId) => {
    setPresetIdState(next);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(STORAGE_KEY, next);
    }
  }, []);

  const preset = themePresets[presetId];
  const theme = useMemo(() => createThemeFromPreset(preset), [preset]);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onThemePresetChange?.((next) => {
      if (next && themePresets[next as ThemePresetId]) {
        setPresetId(next as ThemePresetId);
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [setPresetId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      presetId,
      preset,
      presets: themePresetList,
      setPresetId,
    }),
    [presetId, preset, setPresetId],
  );

  return (
    <ThemeContext.Provider value={value}>
      <CssVarsProvider theme={theme} defaultMode="system">
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </ThemeContext.Provider>
  );
};

export const useThemePreset = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreset must be used within ThemeProvider');
  }
  return ctx;
};

export { themeOptions };
