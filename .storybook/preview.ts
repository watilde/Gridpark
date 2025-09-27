import type { Preview } from '@storybook/react-webpack5';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
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
        order: ['Foundations', 'Components'],
      },
    },
  },
};

export default preview;
