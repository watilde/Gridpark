import type { ThemePreset } from '../types';

export const nordPreset: ThemePreset = {
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
};

export default nordPreset;
