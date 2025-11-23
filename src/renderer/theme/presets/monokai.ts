import type { ThemePreset } from '../types';

export const monokaiPreset: ThemePreset = {
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
};

export default monokaiPreset;
