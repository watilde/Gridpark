import type { ThemePreset } from '../types';

export const catppuccinPreset: ThemePreset = {
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
};

export default catppuccinPreset;
