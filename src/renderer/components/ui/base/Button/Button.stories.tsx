import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { PlayArrow, Stop, Settings, Code } from '@mui/icons-material';

const meta: Meta<typeof Button> = {
  title: 'UI/Base/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Gridpark Button component extending Joy UI with brand-specific styling.
Designed for developer-first experience with immediate feedback and playful productivity.

**Design Principles Applied:**
- Code-first experience: Familiar hover/active states
- Immediate feedback: Visual state changes on interaction
- Playful productivity: Subtle animations enhance rather than distract
- Hackable: Built on Joy UI system for customization
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outlined', 'plain'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'neutral'],
      description: 'Color scheme using Gridpark brand colors',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary Stories
export const Default: Story = {
  args: {
    children: 'Execute Function',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="solid">Solid</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="plain">Plain</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button color="primary">Primary</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="danger">Danger</Button>
      <Button color="neutral">Neutral</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button startIcon={<PlayArrow />}>Run Function</Button>
        <Button endIcon={<Code />}>Edit Code</Button>
        <Button startIcon={<Settings />} endIcon={<Code />}>Configure</Button>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button>Default</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
      <Button loading disabled>Loading + Disabled</Button>
    </div>
  ),
};

// Developer-focused examples
export const DeveloperWorkflow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button startIcon={<PlayArrow />} color="success">Execute</Button>
        <Button startIcon={<Stop />} variant="soft" color="danger">Stop</Button>
        <Button variant="outlined">Debug</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="soft" size="sm">Save</Button>
        <Button variant="soft" size="sm">Load</Button>
        <Button variant="soft" size="sm">Export</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common button patterns in developer workflows - execute, debug, file operations',
      },
    },
  },
};

export const PlayfulFeedback: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Button color="success" variant="soft">✨ Formula Works!</Button>
      <Button color="warning">⚡ Optimizing...</Button>
      <Button color="primary">🚀 Deploy</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Playful productivity - buttons with delightful feedback and emojis',
      },
    },
  },
};