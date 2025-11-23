import type { ThemePreset } from '../types';

export const gridparkPreset: ThemePreset = {
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
};

export default gridparkPreset;
