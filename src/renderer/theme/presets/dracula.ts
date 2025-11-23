import type { ThemePreset } from '../types';

export const draculaPreset: ThemePreset = {
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
};

export default draculaPreset;
