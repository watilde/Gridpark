import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import {
  PlayArrow,
  Stop,
  Settings,
  Code,
  TableChart,
  Functions,
  Speed,
  Save,
  Delete,
  Edit,
  Download,
  Upload,
  Search,
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';

const meta: Meta<typeof Icon> = {
  title: 'UI/Base/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Gridpark Icon component for consistent icon presentation across the application.
Supports Material UI icons, custom SVGs, and interactive states.

**Design Principles Applied:**
- Code-first: Predictable sizing system (xs, sm, md, lg, xl)
- Immediate feedback: Interactive hover and active states
- Accessible: Proper focus management and ARIA labeling
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'neutral', 'inherit'],
    },
    interactive: {
      control: 'boolean',
      description: 'Enable hover and click interactions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    children: <Code />,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon size="xs">
        <Settings />
      </Icon>
      <Icon size="sm">
        <Settings />
      </Icon>
      <Icon size="md">
        <Settings />
      </Icon>
      <Icon size="lg">
        <Settings />
      </Icon>
      <Icon size="xl">
        <Settings />
      </Icon>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon sizes from extra small (12px) to extra large (32px)',
      },
    },
  },
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Icon color="primary">
        <CheckCircle />
      </Icon>
      <Icon color="success">
        <CheckCircle />
      </Icon>
      <Icon color="warning">
        <Warning />
      </Icon>
      <Icon color="danger">
        <Error />
      </Icon>
      <Icon color="neutral">
        <Info />
      </Icon>
      <Icon color="inherit">
        <Settings />
      </Icon>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon colors using Gridpark brand palette',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Icon interactive onClick={() => alert('Play clicked!')} aria-label="Play">
        <PlayArrow />
      </Icon>
      <Icon interactive onClick={() => alert('Stop clicked!')} aria-label="Stop">
        <Stop />
      </Icon>
      <Icon interactive onClick={() => alert('Settings clicked!')} aria-label="Settings">
        <Settings />
      </Icon>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive icons with hover effects and click handlers. Try hovering and clicking!',
      },
    },
  },
};

export const DeveloperWorkflow: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        padding: '16px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Icon size="lg" color="success" interactive aria-label="Execute function">
          <PlayArrow />
        </Icon>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Execute</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon size="lg" color="danger" interactive aria-label="Stop execution">
          <Stop />
        </Icon>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Stop</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon size="lg" color="primary" interactive aria-label="Edit code">
          <Code />
        </Icon>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Code</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icon size="lg" color="neutral" interactive aria-label="Open settings">
          <Settings />
        </Icon>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Settings</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common developer workflow icons with consistent sizing and colors',
      },
    },
  },
};

export const FeatureIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon color="primary">
          <TableChart />
        </Icon>
        <span>Spreadsheet Grid</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon color="success">
          <Functions />
        </Icon>
        <span>Custom Functions</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon color="warning">
          <Speed />
        </Icon>
        <span>Performance Monitor</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon color="primary">
          <Code />
        </Icon>
        <span>Monaco Editor</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Feature icons representing key Gridpark capabilities',
      },
    },
  },
};

export const FileActions: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}
    >
      <Icon size="sm" interactive aria-label="Save file">
        <Save />
      </Icon>
      <Icon size="sm" interactive aria-label="Edit file">
        <Edit />
      </Icon>
      <Icon size="sm" interactive aria-label="Download file">
        <Download />
      </Icon>
      <Icon size="sm" interactive aria-label="Upload file">
        <Upload />
      </Icon>
      <Icon size="sm" interactive aria-label="Search">
        <Search />
      </Icon>
      <Icon size="sm" interactive color="danger" aria-label="Delete file">
        <Delete />
      </Icon>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'File action toolbar with small interactive icons',
      },
    },
  },
};

export const StatusIndicators: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size="sm" color="success">
          <CheckCircle />
        </Icon>
        <span>Function validated successfully</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size="sm" color="warning">
          <Warning />
        </Icon>
        <span>Performance warning: slow execution</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size="sm" color="danger">
          <Error />
        </Icon>
        <span>Syntax error in custom function</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size="sm" color="primary">
          <Info />
        </Icon>
        <span>Hot reload enabled for development</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status indicators with appropriate colors for different states',
      },
    },
  },
};

export const CustomSVG: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon size="md" color="primary">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z" />
        </svg>
      </Icon>
      <span>Custom SVG icon</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom SVG icons work seamlessly with the Icon component',
      },
    },
  },
};
