import type { ThemePreset } from '../types';

export const ayuPreset: ThemePreset = {
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
};

export default ayuPreset;
