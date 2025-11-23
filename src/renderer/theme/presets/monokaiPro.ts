import type { ThemePreset } from '../types';

export const monokaiProPreset: ThemePreset = {
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
};

export default monokaiProPreset;
