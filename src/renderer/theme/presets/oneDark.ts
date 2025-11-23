import type { ThemePreset } from '../types';

export const oneDarkPreset: ThemePreset = {
  id: 'oneDark',
  name: 'One Dark',
  description: 'Atom inspired classic',
  schemes: {
    light: {
      background: { body: '#F2F3F5', surface: '#E7E8EB' },
      text: { primary: '#1E2229', secondary: '#4C566A' },
      border: '#D1D4DA',
      primary: { base: '#61AFEF', hover: '#528BFF' },
      success: '#98C379',
      warning: '#E5C07B',
      info: '#56B6C2',
      danger: '#E06C75',
    },
    dark: {
      background: { body: '#282C34', surface: '#21252B' },
      text: { primary: '#F8F8F2', secondary: '#ABB2BF' },
      border: '#2F333D',
      primary: { base: '#61AFEF', hover: '#528BFF' },
      success: '#98C379',
      warning: '#E5C07B',
      info: '#56B6C2',
      danger: '#E06C75',
    },
  },
};

export default oneDarkPreset;
