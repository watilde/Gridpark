import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button/Button';
import { Code, TableChart, Functions, Speed } from '@mui/icons-material';
import { Typography } from '@mui/joy';

const meta: Meta<typeof Card> = {
  title: 'UI/Base/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Gridpark Card component for organizing content into focused containers.
Supports interactive states, actions, and follows developer-first design principles.

**Design Principles Applied:**
- Code-first: Clean, minimal design with developer-friendly spacing
- Immediate feedback: Clear hover and focus states for interactive cards
- Hackable: Flexible composition with header, content, and actions
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <Typography>
        This is a basic card with default styling. Perfect for organizing content 
        into focused, scannable sections.
      </Typography>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Function Library',
    children: (
      <Typography>
        A collection of custom functions for data analysis and calculations.
        Import or create your own functions to extend spreadsheet capabilities.
      </Typography>
    ),
  },
};

export const WithTitleAndSubtitle: Story = {
  args: {
    title: 'Excel API Integration',
    subtitle: 'Compatible with Excel JavaScript API',
    children: (
      <Typography>
        Use familiar Excel programming patterns with our compatible API.
        Your existing knowledge transfers directly to Gridpark development.
      </Typography>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: 'Custom Function',
    subtitle: 'CALCULATE_ROI.js',
    children: (
      <Typography>
        Calculates return on investment based on revenue, cost, and time period.
        Supports multiple calculation methods and date ranges.
      </Typography>
    ),
    actions: (
      <>
        <Button variant="soft" size="sm">Edit</Button>
        <Button variant="solid" size="sm">Execute</Button>
      </>
    ),
  },
};

export const Interactive: Story = {
  args: {
    title: 'Data Source',
    subtitle: 'Click to configure',
    interactive: true,
    children: (
      <Typography>
        Connect to external APIs, databases, or file sources. 
        Hover and click to see interactive feedback.
      </Typography>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
      <Card variant="outlined" title="Outlined Card">
        <Typography>Default outlined variant with border</Typography>
      </Card>
      <Card variant="soft" title="Soft Card">
        <Typography>Soft background variant</Typography>
      </Card>
      <Card variant="solid" title="Solid Card">
        <Typography>Solid background variant</Typography>
      </Card>
      <Card variant="plain" title="Plain Card">
        <Typography>Minimal plain variant</Typography>
      </Card>
    </div>
  ),
};

export const DeveloperWorkflow: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      minWidth: '600px'
    }}>
      <Card 
        title="Spreadsheet Grid"
        subtitle="Excel-compatible interface"
        interactive={true}
        actions={<Button size="sm" startIcon={<TableChart />}>Open</Button>}
      >
        <Typography>
          26-column × 1000-row grid with familiar Excel navigation and cell editing.
        </Typography>
      </Card>

      <Card 
        title="Formula Editor"
        subtitle="Monaco-powered"
        interactive={true}
        actions={<Button size="sm" startIcon={<Code />}>Edit</Button>}
      >
        <Typography>
          VS Code-like editor for custom functions with syntax highlighting and autocomplete.
        </Typography>
      </Card>

      <Card 
        title="Function Library"
        subtitle="Built-in + Custom"
        actions={<Button size="sm" startIcon={<Functions />}>Browse</Button>}
      >
        <Typography>
          Excel functions plus your custom JavaScript functions in a unified library.
        </Typography>
      </Card>

      <Card 
        title="Performance Monitor"
        subtitle="Real-time metrics"
        actions={<Button size="sm" startIcon={<Speed />}>Monitor</Button>}
      >
        <Typography>
          Track calculation performance and function execution times.
        </Typography>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards representing key components in the Gridpark developer workflow',
      },
    },
  },
};

export const FeatureCards: Story = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      minWidth: '400px'
    }}>
      <Card 
        title="🚀 Excel JavaScript API"
        subtitle="v1.0.0 - Ready"
        variant="soft"
        actions={<Button color="success" size="sm">Available</Button>}
      >
        <Typography>
          Core Excel.run() pattern with Workbook, Worksheet, and Range objects.
        </Typography>
      </Card>

      <Card 
        title="⚡ Custom Functions"
        subtitle="v2.0.0 - In Progress"
        variant="outlined"
        actions={<Button color="primary" size="sm" loading>Building</Button>}
      >
        <Typography>
          Excel Custom Functions API with @customfunction annotations.
        </Typography>
      </Card>

      <Card 
        title="🔧 Hot Reload"
        subtitle="v3.0.0 - Planned"
        variant="plain"
        actions={<Button variant="soft" size="sm" disabled>Planned</Button>}
      >
        <Typography>
          Instant function updates during development with preservation of sheet state.
        </Typography>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Feature status cards with playful productivity elements like emojis and status indicators',
      },
    },
  },
};