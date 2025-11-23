import type { ThemePreset } from '../types';

export const tokyoNightPreset: ThemePreset = {
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
};

export default tokyoNightPreset;
