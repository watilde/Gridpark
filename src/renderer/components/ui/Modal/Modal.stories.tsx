import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Card } from '../Card/Card';
import { Typography } from '@mui/joy';
import { useState } from 'react';
import { Code, Save, Cancel, Delete } from '@mui/icons-material';

const meta: Meta<typeof Modal> = {
  title: 'UI/Base/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Gridpark Modal component for dialogs, forms, and focused interactions.
Built with accessibility and developer experience in mind.

**Design Principles Applied:**
- Code-first: Keyboard navigation and ESC key support
- Immediate feedback: Clear open/close animations
- Hackable: Flexible composition for various use cases
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Helper component for interactive stories
const ModalDemo = ({ modalProps }: { modalProps: any }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal {...modalProps} open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: 'Basic Modal',
        children: (
          <Typography>
            This is a basic modal with default styling. It includes a header with title, scrollable
            content area, and proper focus management.
          </Typography>
        ),
      }}
    />
  ),
};

export const WithActions: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: 'Confirm Action',
        children: (
          <Typography>
            Are you sure you want to delete this custom function? This action cannot be undone. All
            dependent formulas will show #NAME? errors.
          </Typography>
        ),
        actions: (
          <>
            <Button variant="soft" startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button color="danger" startIcon={<Delete />}>
              Delete Function
            </Button>
          </>
        ),
      }}
    />
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <ModalDemo
        modalProps={{
          title: 'Small Modal',
          size: 'sm',
          children: <Typography>Small modal for quick confirmations.</Typography>,
        }}
      />
      <ModalDemo
        modalProps={{
          title: 'Medium Modal',
          size: 'md',
          children: <Typography>Medium modal for standard dialogs (default).</Typography>,
        }}
      />
      <ModalDemo
        modalProps={{
          title: 'Large Modal',
          size: 'lg',
          children: <Typography>Large modal for complex forms and content.</Typography>,
        }}
      />
      <ModalDemo
        modalProps={{
          title: 'Extra Large Modal',
          size: 'xl',
          children: (
            <Typography>Extra large modal for detailed views and advanced workflows.</Typography>
          ),
        }}
      />
    </div>
  ),
};

export const FunctionEditor: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: 'Edit Custom Function',
        size: 'lg',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Function Name"
              value="CALCULATE_ROI"
              code={true}
              helperText="Must be valid JavaScript identifier"
            />
            <Input
              label="Description"
              placeholder="Calculates return on investment..."
              helperText="User-friendly description for autocomplete"
            />
            <Input
              label="Parameters"
              value="revenue: number, cost: number, period: number"
              code={true}
              helperText="TypeScript-style parameter definitions"
            />
            <div
              style={{
                height: '200px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <Typography level="body-sm" sx={{ mb: 1 }}>
                Function Implementation:
              </Typography>
              <Typography
                component="pre"
                sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}
              >
                {`function CALCULATE_ROI(revenue, cost, period) {
  const profit = revenue - cost;
  const roi = (profit / cost) * 100;
  return roi / period;  // Annual ROI
}`}
              </Typography>
            </div>
          </div>
        ),
        actions: (
          <>
            <Button variant="soft">Cancel</Button>
            <Button variant="outlined" startIcon={<Code />}>
              Test Function
            </Button>
            <Button startIcon={<Save />}>Save & Deploy</Button>
          </>
        ),
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex function editor modal demonstrating developer workflow patterns',
      },
    },
  },
};

export const DataSourceConfig: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: 'Configure Data Source',
        size: 'md',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="API Endpoint"
              placeholder="https://api.example.com/data"
              helperText="Full URL to your data source"
            />
            <Input
              label="API Key"
              type="password"
              placeholder="Enter API key..."
              helperText="Will be stored securely locally"
            />
            <Input
              label="Refresh Interval"
              value="60"
              endDecorator="seconds"
              helperText="How often to update data (0 = manual only)"
            />
            <Card variant="soft" title="⚡ Rate Limiting" subtitle="API usage protection">
              <Typography level="body-sm">
                Requests will be automatically throttled to respect API limits. Current limit: 100
                requests/hour.
              </Typography>
            </Card>
          </div>
        ),
        actions: (
          <>
            <Button variant="soft">Cancel</Button>
            <Button variant="outlined">Test Connection</Button>
            <Button>Save Configuration</Button>
          </>
        ),
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Data source configuration modal with API integration features',
      },
    },
  },
};

export const NoCloseButton: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: 'Processing...',
        showCloseButton: false,
        size: 'sm',
        children: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Typography>Importing Excel file and converting formulas...</Typography>
            <div style={{ marginTop: '16px' }}>
              <Button loading disabled>
                Processing
              </Button>
            </div>
          </div>
        ),
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal without close button for non-cancelable operations',
      },
    },
  },
};

export const PlayfulFeedback: Story = {
  render: () => (
    <ModalDemo
      modalProps={{
        title: '🎉 Function Deployed Successfully!',
        children: (
          <div style={{ textAlign: 'center' }}>
            <Typography sx={{ mb: 2 }}>
              Your custom function <code>CALCULATE_ROI</code> is now available in all spreadsheets.
            </Typography>
            <Card variant="soft">
              <Typography level="body-sm">
                💡 <strong>Tip:</strong> Use <code>=GRIDPARK.CALCULATE_ROI(D2, E2, 12)</code> to
                call your function.
              </Typography>
            </Card>
          </div>
        ),
        actions: (
          <>
            <Button variant="soft">View Documentation</Button>
            <Button color="success">Create Another Function</Button>
          </>
        ),
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success modal with playful productivity elements and helpful tips',
      },
    },
  },
};
