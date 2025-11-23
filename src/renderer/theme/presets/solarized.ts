import type { ThemePreset } from '../types';

export const solarizedPreset: ThemePreset = {
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
      success: '#2AA198',
      warning: '#B58900',
      info: '#268BD2',
      danger: '#DC322F',
    },
  },
};

export default solarizedPreset;
