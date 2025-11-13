import { extendTheme, type CssVarsThemeOptions } from '@mui/joy/styles';

import { radius, shadow } from './tokens';

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
  | 'ayu';

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

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  schemes: {
    light: ThemeScheme;
    dark: ThemeScheme;
  };
};

const createScheme = (scheme: ThemeScheme): CssVarsThemeOptions['colorSchemes']['light'] => ({
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

const presets: Record<ThemePresetId, ThemePreset> = {
  gridpark: {
    id: 'gridpark',
    name: 'Gridpark',
    description: 'Brand playground palette',
    schemes: {
      light: {
        background: { body: '#F9F8FF', surface: '#FFFFFF' },
        text: { primary: '#1C2541', secondary: '#3E475A' },
        border: '#E1E4EB',
        primary: { base: '#B197FC', hover: '#9E83FB' },
        success: '#4EFD8A',
        warning: '#FF6B35',
        info: '#3DD6F5',
        danger: '#FF4DA6',
      },
      dark: {
        background: { body: '#121826', surface: '#1C2541' },
        text: { primary: '#F9F8FF', secondary: '#A0A6B8' },
        border: '#3E475A',
        primary: { base: '#9E83FB', hover: '#8C72F7' },
        success: '#35F57B',
        warning: '#FF7B4C',
        info: '#34CFEF',
        danger: '#FF5AAE',
      },
    },
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    description: 'Classic hacking palette',
    schemes: {
      light: {
        background: { body: '#F9F8F2', surface: '#FFFDF0' },
        text: { primary: '#2D2A2E', secondary: '#6E7050' },
        border: '#E6E2C7',
        primary: { base: '#FD971F', hover: '#F92672' },
        success: '#A6E22E',
        warning: '#FD971F',
        info: '#66D9EF',
        danger: '#F92672',
      },
      dark: {
        background: { body: '#272822', surface: '#1E1F1C' },
        text: { primary: '#F8F8F2', secondary: '#A6E22E' },
        border: '#3B3C35',
        primary: { base: '#FD971F', hover: '#F92672' },
        success: '#A6E22E',
        warning: '#FD971F',
        info: '#66D9EF',
        danger: '#F92672',
      },
    },
  },
  monokaiPro: {
    id: 'monokaiPro',
    name: 'Monokai Pro',
    description: 'Studio hues',
    schemes: {
      light: {
        background: { body: '#F7F1F9', surface: '#EFE4F0' },
        text: { primary: '#2D2A2E', secondary: '#7E7A84' },
        border: '#E2D4E5',
        primary: { base: '#FF6188', hover: '#FC9867' },
        success: '#A9DC76',
        warning: '#FFD866',
        info: '#78DCE8',
        danger: '#FF6188',
      },
      dark: {
        background: { body: '#2D2A2E', surface: '#221F22' },
        text: { primary: '#FCFCFA', secondary: '#C1C0C0' },
        border: '#3A363A',
        primary: { base: '#FF6188', hover: '#FC9867' },
        success: '#A9DC76',
        warning: '#FFD866',
        info: '#78DCE8',
        danger: '#FF6188',
      },
    },
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    description: 'Vibrant midnight',
    schemes: {
      light: {
        background: { body: '#F8F8FF', surface: '#ECEFF7' },
        text: { primary: '#1E1F29', secondary: '#6D6F8A' },
        border: '#D0D4E3',
        primary: { base: '#BD93F9', hover: '#FF79C6' },
        success: '#50FA7B',
        warning: '#FFB86C',
        info: '#8BE9FD',
        danger: '#FF5555',
      },
      dark: {
        background: { body: '#282A36', surface: '#1E1F29' },
        text: { primary: '#F8F8F2', secondary: '#BD93F9' },
        border: '#343549',
        primary: { base: '#BD93F9', hover: '#FF79C6' },
        success: '#50FA7B',
        warning: '#FFB86C',
        info: '#8BE9FD',
        danger: '#FF5555',
      },
    },
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized',
    description: 'Ethan Schoonover classic',
    schemes: {
      light: {
        background: { body: '#FDF6E3', surface: '#F5EBD6' },
        text: { primary: '#586E75', secondary: '#657B83' },
        border: '#E1DCC8',
        primary: { base: '#268BD2', hover: '#2AA198' },
        success: '#2AA198',
        warning: '#B58900',
        info: '#268BD2',
        danger: '#DC322F',
      },
      dark: {
        background: { body: '#002B36', surface: '#073642' },
        text: { primary: '#EEE8D5', secondary: '#93A1A1' },
        border: '#0F3A42',
        primary: { base: '#268BD2', hover: '#2AA198' },
        success: '#859900',
        warning: '#B58900',
        info: '#268BD2',
        danger: '#DC322F',
      },
    },
  },
  oneDark: {
    id: 'oneDark',
    name: 'One Dark',
    description: 'Atom inspired classic',
    schemes: {
      light: {
        background: { body: '#F2F3F5', surface: '#E7E8EB' },
        text: { primary: '#1E2229', secondary: '#4C566A' },
        border: '#D1D4DA',
        primary: { base: '#61AFEF', hover: '#528BFF' },
        success: '#98C379',
        warning: '#E5C07B',
        info: '#56B6C2',
        danger: '#E06C75',
      },
      dark: {
        background: { body: '#282C34', surface: '#21252B' },
        text: { primary: '#F8F8F2', secondary: '#ABB2BF' },
        border: '#2F333D',
        primary: { base: '#61AFEF', hover: '#528BFF' },
        success: '#98C379',
        warning: '#E5C07B',
        info: '#56B6C2',
        danger: '#E06C75',
      },
    },
  },
  gruvbox: {
    id: 'gruvbox',
    name: 'Gruvbox',
    description: 'Warm retro terminal',
    schemes: {
      light: {
        background: { body: '#FBF1C7', surface: '#F2E5BC' },
        text: { primary: '#3C3836', secondary: '#7C6F64' },
        border: '#E0D4B0',
        primary: { base: '#D79921', hover: '#B57614' },
        success: '#689D6A',
        warning: '#FABD2F',
        info: '#458588',
        danger: '#CC241D',
      },
      dark: {
        background: { body: '#282828', surface: '#32302F' },
        text: { primary: '#EBDBB2', secondary: '#D5C4A1' },
        border: '#3C3836',
        primary: { base: '#D79921', hover: '#FABD2F' },
        success: '#B8BB26',
        warning: '#FABD2F',
        info: '#83A598',
        danger: '#FB4934',
      },
    },
  },
  tokyoNight: {
    id: 'tokyoNight',
    name: 'Tokyo Night',
    description: 'Neon dusk ambience',
    schemes: {
      light: {
        background: { body: '#F5F6FB', surface: '#E8EBFB' },
        text: { primary: '#1A1B26', secondary: '#5A5F7C' },
        border: '#D7DAF2',
        primary: { base: '#7AA2F7', hover: '#9ECE6A' },
        success: '#9ECE6A',
        warning: '#E0AF68',
        info: '#7DCFFF',
        danger: '#F7768E',
      },
      dark: {
        background: { body: '#1A1B26', surface: '#24283B' },
        text: { primary: '#C0CAF5', secondary: '#9AA5CE' },
        border: '#2F344C',
        primary: { base: '#7AA2F7', hover: '#9ECE6A' },
        success: '#9ECE6A',
        warning: '#E0AF68',
        info: '#7DCFFF',
        danger: '#F7768E',
      },
    },
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    description: 'Arctic, north-bluish',
    schemes: {
      light: {
        background: { body: '#ECEFF4', surface: '#E5E9F0' },
        text: { primary: '#2E3440', secondary: '#4C566A' },
        border: '#D8DEE9',
        primary: { base: '#5E81AC', hover: '#81A1C1' },
        success: '#A3BE8C',
        warning: '#EBCB8B',
        info: '#81A1C1',
        danger: '#BF616A',
      },
      dark: {
        background: { body: '#2E3440', surface: '#3B4252' },
        text: { primary: '#ECEFF4', secondary: '#D8DEE9' },
        border: '#434C5E',
        primary: { base: '#88C0D0', hover: '#81A1C1' },
        success: '#A3BE8C',
        warning: '#EBCB8B',
        info: '#81A1C1',
        danger: '#BF616A',
      },
    },
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    description: 'Pastel comfort vibes',
    schemes: {
      light: {
        background: { body: '#EFF1F5', surface: '#E6E9F0' },
        text: { primary: '#4C4F69', secondary: '#6C6F85' },
        border: '#D7DAE3',
        primary: { base: '#7287FD', hover: '#8839EF' },
        success: '#40A02B',
        warning: '#DF8E1D',
        info: '#209FB5',
        danger: '#D20F39',
      },
      dark: {
        background: { body: '#1E1E2E', surface: '#242437' },
        text: { primary: '#F5E0DC', secondary: '#BAC2DE' },
        border: '#2F2F44',
        primary: { base: '#B4BEFE', hover: '#C6AAFE' },
        success: '#A6E3A1',
        warning: '#FAB387',
        info: '#89DCEB',
        danger: '#F38BA8',
      },
    },
  },
  ayu: {
    id: 'ayu',
    name: 'Ayu',
    description: 'Calm seaside tones',
    schemes: {
      light: {
        background: { body: '#FCFCFA', surface: '#F3F4F2' },
        text: { primary: '#5C6166', secondary: '#8A8F98' },
        border: '#E0E2DD',
        primary: { base: '#FFB454', hover: '#F2A272' },
        success: '#B8CC52',
        warning: '#FFC44C',
        info: '#59C2FF',
        danger: '#F07178',
      },
      dark: {
        background: { body: '#0F1419', surface: '#141B21' },
        text: { primary: '#E6E1CF', secondary: '#B3B1AA' },
        border: '#1F262C',
        primary: { base: '#FFB454', hover: '#F2A272' },
        success: '#B8CC52',
        warning: '#FFC44C',
        info: '#59C2FF',
        danger: '#F07178',
      },
    },
  },
};

export const themePresets = presets;
export const themePresetList = Object.values(presets);
export const themeOptions = themePresetList.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
}));
export const DEFAULT_THEME_ID: ThemePresetId = 'gridpark';

export const createThemeFromPreset = (preset: ThemePreset) =>
  extendTheme({
    radius,
    shadow,
    fontFamily: {
      body: '"Noto Sans", system-ui, sans-serif',
      display: '"Caveat", cursive',
    },
    colorSchemes: {
      light: createScheme(preset.schemes.light),
      dark: createScheme(preset.schemes.dark),
    },
  });
