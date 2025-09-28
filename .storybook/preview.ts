import type { Preview } from '@storybook/react-webpack5';
import { CssVarsProvider } from '@mui/joy/styles';
import { theme } from '../src/renderer/theme/theme';
import React from 'react';


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
        order: ['UI'],
      },
    },
  },
  decorators: [
    (Story) => (
      React.createElement(CssVarsProvider, { theme }, React.createElement(Story))
    ),
  ],
};

export default preview;
