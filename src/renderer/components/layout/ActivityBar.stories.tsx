import type { Meta, StoryObj } from '@storybook/react';
import { ActivityBar } from './ActivityBar';
import { Box } from '@mui/joy';

const meta: Meta<typeof ActivityBar> = {
  title: 'Layout/ActivityBar',
  component: ActivityBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
VSCode-inspired Activity Bar for Gridpark.

**Top Section (Git Operations):**
- Git Commit View (staging, split/inline diff)
- Git History View (commit timeline)
- Git Branch View (merge support)
- Git Configuration

**Bottom Section (Main Features):**
- Excel View (spreadsheet viewer) ⭐
- Settings ⚙️

Default active view is \`excel\`.
        `,
      },
    },
  },
  decorators: [
    Story => (
      <Box sx={{ display: 'flex', height: '600px' }}>
        <Story />
        <Box sx={{ flex: 1, p: 2, bgcolor: 'background.body' }}>
          <h2>Main Content Area</h2>
          <p>Click the Activity Bar icons to see the active state.</p>
          <p><strong>Top:</strong> Git operations (Commit, History, Branch, Config)</p>
          <p><strong>Bottom:</strong> Excel View ⭐ and Settings ⚙️</p>
        </Box>
      </Box>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityBar>;

export const Default: Story = {
  args: {
    activeView: 'excel',
  },
};

export const CommitView: Story = {
  args: {
    activeView: 'commit',
  },
};

export const HistoryView: Story = {
  args: {
    activeView: 'history',
  },
};

export const BranchView: Story = {
  args: {
    activeView: 'branch',
  },
};

export const GitConfigView: Story = {
  args: {
    activeView: 'git-config',
  },
};

export const SettingsView: Story = {
  args: {
    activeView: 'settings',
  },
};

export const Interactive: Story = {
  args: {
    activeView: 'excel',
    onViewChange: (view) => {
      console.log('View changed to:', view);
    },
  },
};
