import type { ThemePreset } from '../types';

export const gruvboxPreset: ThemePreset = {
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
};

export default gruvboxPreset;
