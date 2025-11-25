import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Search, Lock, Code } from '@mui/icons-material';

const meta: Meta<typeof Input> = {
  title: 'UI/Base/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Gridpark Input component for form inputs, formula entry, and code editing.
Designed with developer-first experience and immediate feedback principles.

**Design Principles Applied:**
- Code-first: Monospace font option for formulas and code
- Immediate feedback: Clear focus states and validation
- Hackable: Built on Joy UI for extensive customization
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'soft', 'plain'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'neutral', 'danger', 'success', 'warning'],
    },
    code: {
      control: 'boolean',
      description: 'Enable monospace font for code/formula input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter value...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Function Name',
    placeholder: 'e.g., CALCULATE_TOTAL',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'API Endpoint',
    placeholder: 'https://api.example.com/data',
    helperText: 'Enter the full URL including protocol',
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
      <Input label="Valid Input" value="SUM(A1:B10)" success="Formula syntax is correct" />
      <Input label="Invalid Input" value="SUM(A1:B10" error="Missing closing parenthesis" />
      <Input
        label="Normal Input"
        placeholder="Enter formula..."
        helperText="Use Excel-compatible syntax"
      />
    </div>
  ),
};

export const CodeMode: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
      <Input
        label="Formula Input"
        code={true}
        value="=SUM(FILTER(A1:A100, B1:B100>50))"
        placeholder="Enter Excel formula..."
        helperText="Monospace font for better readability"
      />
      <Input
        label="JavaScript Code"
        code={true}
        placeholder="function calculate(data) { return data.sum(); }"
        helperText="Custom function implementation"
      />
      <Input
        label="Regular Text"
        code={false}
        placeholder="Enter description..."
        helperText="Standard font for text input"
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
      <Input variant="outlined" placeholder="Outlined (default)" />
      <Input variant="soft" placeholder="Soft background" />
      <Input variant="plain" placeholder="Plain, no border" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
      <Input
        startDecorator={<Search />}
        placeholder="Search functions..."
        label="Function Search"
      />
      <Input
        startDecorator={<Lock />}
        type="password"
        placeholder="Enter API key..."
        label="API Authentication"
      />
      <Input
        startDecorator={<Code />}
        code={true}
        placeholder="Enter formula..."
        label="Formula Builder"
      />
    </div>
  ),
};

export const DeveloperWorkflow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
      <Input label="Cell Reference" value="A1:B10" code={true} success="Valid range selected" />
      <Input
        label="Function Parameters"
        code={true}
        placeholder="value, criteria, sum_range"
        helperText="Comma-separated parameter names"
      />
      <Input
        label="Description"
        placeholder="Calculates weighted average of values..."
        helperText="User-friendly function description"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common input patterns in spreadsheet and function development workflows',
      },
    },
  },
};

export const FormulaBuilder: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '500px' }}>
      <Input
        label="Excel Formula"
        code={true}
        value={'=SUMIFS(D:D, A:A, "Product A", B:B, ">100")'}
        success="✅ Formula validated successfully"
      />
      <Input
        label="Custom Function Call"
        code={true}
        placeholder="GRIDPARK.CALCULATE_ROI(revenue, cost, time_period)"
        helperText="Call your custom functions with GRIDPARK namespace"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Formula and function input specifically designed for Excel compatibility',
      },
    },
  },
};
