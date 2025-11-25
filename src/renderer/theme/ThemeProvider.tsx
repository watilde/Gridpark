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
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';

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
  colorScheme: ColorSchemePreference;
  setColorScheme: (mode: ColorSchemePreference) => void;
};

const PRESET_STORAGE_KEY = 'gridpark.themePreset';
const MODE_STORAGE_KEY = 'gridpark.colorScheme';
export type ColorSchemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoragePreset = (): ThemePresetId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = window.localStorage?.getItem(PRESET_STORAGE_KEY) as ThemePresetId | null;
  if (stored && themePresets[stored]) {
    return stored;
  }
  return DEFAULT_THEME_ID;
};

const readStorageColorScheme = (): ColorSchemePreference => {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage?.getItem(MODE_STORAGE_KEY) as ColorSchemePreference | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
};

const ColorSchemeSync = ({ preference }: { preference: ColorSchemePreference }): null => {
  const { setMode } = useColorScheme();
  useEffect(() => {
    setMode(preference);
  }, [preference, setMode]);
  return null;
};

export const ThemeProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [presetId, setPresetIdState] = useState<ThemePresetId>(readStoragePreset);
  const [colorScheme, setColorSchemeState] =
    useState<ColorSchemePreference>(readStorageColorScheme);

  const setPresetId = useCallback((next: ThemePresetId) => {
    setPresetIdState(next);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(PRESET_STORAGE_KEY, next);
    }
  }, []);

  const setColorScheme = useCallback((next: ColorSchemePreference) => {
    setColorSchemeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(MODE_STORAGE_KEY, next);
    }
  }, []);

  const preset = themePresets[presetId];
  const theme = useMemo(() => createThemeFromPreset(preset), [preset]);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onThemePresetChange?.(next => {
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
      colorScheme,
      setColorScheme,
    }),
    [presetId, preset, setPresetId, colorScheme, setColorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <CssVarsProvider theme={theme} defaultMode="system">
        <ColorSchemeSync preference={colorScheme} />
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
