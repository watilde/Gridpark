import type { CssVarsThemeOptions } from '@mui/joy/styles';

type PaletteColor = {
  base: string;
  hover: string;
};

type ThemeScheme = {
  background: { body: string; surface: string };
  text: { primary: string; secondary: string };
  border: string;
  primary: PaletteColor;
  success: string;
  warning: string;
  info: string;
  danger: string;
};

export type ThemePresetId =
  | 'gridpark'
  | 'monokai'
  | 'monokaiPro'
  | 'dracula'
  | 'solarized'
  | 'oneDark'
  | 'gruvbox'
  | 'tokyoNight'
  | 'nord'
  | 'catppuccin'
  | 'ayu'
  | 'vscode';

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  schemes: {
    light: ThemeScheme;
    dark: ThemeScheme;
  };
};

export const createScheme = (
  scheme: ThemeScheme
): CssVarsThemeOptions['colorSchemes']['light'] => ({
  palette: {
    primary: {
      solidBg: scheme.primary.base,
      solidHoverBg: scheme.primary.hover,
      plainColor: scheme.primary.base,
      outlinedColor: scheme.primary.base,
    },
    success: { solidBg: scheme.success },
    warning: { solidBg: scheme.warning },
    info: { solidBg: scheme.info },
    danger: { solidBg: scheme.danger },
    background: {
      body: scheme.background.body,
      surface: scheme.background.surface,
      popup: scheme.background.surface,
      level1: scheme.background.surface,
      level2: scheme.background.body,
    },
    text: {
      primary: scheme.text.primary,
      secondary: scheme.text.secondary,
      tertiary: scheme.text.secondary,
    },
    divider: scheme.border,
    focusVisible: scheme.primary.base,
  },
});
