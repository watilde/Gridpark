import type { Meta, StoryObj } from '@storybook/react';
import { VSCodeLayoutDemo } from './VSCodeLayoutDemo';

const meta: Meta<typeof VSCodeLayoutDemo> = {
  title: 'Demo/VSCodeLayoutDemo',
  component: VSCodeLayoutDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Complete VSCode-style layout demonstration showcasing:

- **Activity Bar**: Left navigation with 6 views (Excel, Commit, History, Branch, Git Config, Settings)
- **Sidebar**: Context-aware sidebar that changes based on active view
- **Excel View Sidebar**: File explorer with workbook tree, sheet navigation, and recent files
- **Status Bar**: VSCode-style bottom bar with branch info and cursor position

**Features:**
- Click Activity Bar icons to switch between views
- Expand/collapse workbook files to see sheets
- Star/unstar files for quick access
- Recent files section shows last 5 opened files
- Fully keyboard accessible with ARIA labels

**Design:**
- VSCode color palette (#1e1e1e, #252526, #007acc)
- 48px Activity Bar + 280px Sidebar + flex main content
- 22px Status Bar
- Authentic VSCode interaction patterns
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VSCodeLayoutDemo>;

export const Default: Story = {};

export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
};
