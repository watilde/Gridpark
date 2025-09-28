import type { Preview } from '@storybook/react-webpack5';
import type { Decorator } from '@storybook/react';
import { CssVarsProvider } from '@mui/joy/styles';
import { theme } from '../src/renderer/theme/theme';
import React from 'react';

// Import Fontsource fonts for Storybook
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';

// Theme decorator for Joy UI integration
const withTheme: Decorator = (Story) => {
  return React.createElement(
    CssVarsProvider, 
    { 
      theme,
      defaultMode: 'dark',
      modeStorageKey: 'gridpark-storybook-mode'
    }, 
    React.createElement(Story)
  );
};

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'workspace',
      values: [
        { name: 'workspace', value: '#121826' },
        { name: 'violet haze', value: '#1C2541' },
        { name: 'light desk', value: '#F9F8FF' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['UI', 'Components', 'Features', 'Layout'],
      },
    },
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'Gridpark UI Components',
        brandUrl: 'https://github.com/watilde/Gridpark',
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
