import type { Meta, StoryObj } from '@storybook/react';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { Card } from '../../../components/ui/Card/Card';

const meta: Meta<typeof SpreadsheetGrid> = {
  title: 'UI/Features/SpreadsheetGrid',
  component: SpreadsheetGrid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Excel-compatible spreadsheet grid component with familiar keyboard navigation and cell editing.
Core component for Gridpark's spreadsheet functionality.

**Features:**
- Excel-style cell navigation (arrows, Tab, Enter, F2)
- A1 notation with column headers (A, B, C...) and row numbers
- In-place cell editing with double-click or F2
- Visual selection feedback with primary color highlighting
- Monospace font for consistent data alignment

**Design Principles Applied:**
- Code-first: Familiar keyboard shortcuts from Excel/spreadsheet apps
- Immediate feedback: Visual selection states and editing indicators
- Developer-friendly: Monospace font, clear grid structure
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ width: '800px', height: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SpreadsheetGrid>;

export const Default: Story = {
  args: {
    rows: 10,
    columns: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic spreadsheet grid with default 10 rows and 8 columns. Click cells to select, double-click to edit.',
      },
    },
  },
};

export const WithInitialData: Story = {
  args: {
    rows: 10,
    columns: 8,
    initialData: {
      A1: { value: 'Product' },
      B1: { value: 'Quantity' },
      C1: { value: 'Price' },
      D1: { value: 'Total' },
      A2: { value: 'Widget A' },
      B2: { value: 10 },
      C2: { value: 25.5 },
      D2: { value: 255 },
      A3: { value: 'Widget B' },
      B3: { value: 5 },
      C3: { value: 45.0 },
      D3: { value: 225 },
      A4: { value: 'Widget C' },
      B4: { value: 8 },
      C4: { value: 30.75 },
      D4: { value: 246 },
      B5: { value: '=SUM(B2:B4)' },
      D5: { value: '=SUM(D2:D4)' },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Grid with sample data showing a product inventory with calculations. Demonstrates typical Excel-style data entry.',
      },
    },
  },
};

export const LargeGrid: Story = {
  args: {
    rows: 1000,
    columns: 26, // A through Z
    virtualized: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'US-001: Large grid with 1000 rows and 26 columns (A-Z). Demonstrates virtualized rendering for optimal performance (<500ms). Scroll to explore the full dataset.',
      },
    },
  },
};

export const FullV1Grid: Story = {
  args: {
    rows: 1000,
    columns: 26,
    virtualized: true,
    initialData: {
      A1: { value: 'v1.0.0 Requirements' },
      A2: { value: '✓ 26 columns (A-Z)' },
      A3: { value: '✓ 1000 rows' },
      A4: { value: '✓ Cell selection' },
      A5: { value: '✓ Keyboard navigation' },
      A6: { value: '✓ Cell editing (F2/double-click)' },
      A7: { value: '✓ Text, numbers, booleans' },
      A8: { value: '✓ Performance <500ms' },
      A9: { value: '✓ Virtualized rendering' },
      B1: { value: 'Status' },
      B2: { value: '✓ Complete' },
      B3: { value: '✓ Complete' },
      B4: { value: '✓ Complete' },
      B5: { value: '✓ Complete' },
      B6: { value: '✓ Complete' },
      B7: { value: '✓ Complete' },
      B8: { value: '✓ Complete' },
      B9: { value: '✓ Complete' },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'US-001 acceptance criteria demonstration: Full 1000×26 grid with all v1.0.0 features implemented.',
      },
    },
  },
};

export const SmallGrid: Story = {
  args: {
    rows: 5,
    columns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact 5×4 grid for embedded use cases or limited space scenarios.',
      },
    },
  },
};

export const ReadOnlyGrid: Story = {
  args: {
    rows: 8,
    columns: 6,
    readOnly: true,
    initialData: {
      A1: { value: 'Q1 Results' },
      A2: { value: 'Revenue' },
      B2: { value: '$125,000' },
      A3: { value: 'Expenses' },
      B3: { value: '$87,500' },
      A4: { value: 'Profit' },
      B4: { value: '$37,500' },
      A5: { value: 'Margin' },
      B5: { value: '30%' },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Read-only grid for displaying calculated results or reports. Cells cannot be edited.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const handleCellChange = (position: any, value: string) => {
      console.log(
        `Cell ${String.fromCharCode(65 + position.col)}${position.row + 1} changed to: ${value}`
      );
    };

    const handleCellSelect = (position: any) => {
      console.log(`Selected cell: ${String.fromCharCode(65 + position.col)}${position.row + 1}`);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card
          title="Interactive Spreadsheet Grid"
          subtitle="Try keyboard navigation and cell editing"
        >
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
            <strong>Keyboard shortcuts:</strong>
            <br />
            • Arrow keys: Navigate between cells
            <br />
            • Tab: Move to next cell
            <br />
            • Enter or F2: Start editing
            <br />
            • Double-click: Start editing
            <br />• Escape: Cancel editing
          </div>
        </Card>

        <SpreadsheetGrid
          rows={12}
          columns={8}
          onCellChange={handleCellChange}
          onCellSelect={handleCellSelect}
          initialData={{
            A1: { value: 'Try editing me!' },
            B1: { value: 42 },
            C1: { value: '=B1*2' },
            A2: { value: 'Navigate with' },
            B2: { value: 'arrow keys' },
          }}
        />

        <Card variant="soft">
          <div style={{ fontSize: '12px' }}>
            <strong>💡 Tip:</strong> Check the browser console to see cell change and selection
            events.
          </div>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo with event handlers. Open browser console to see cell interactions logged.',
      },
    },
  },
};

export const ExcelCompatibilityDemo: Story = {
  args: {
    rows: 15,
    columns: 10,
    initialData: {
      // Headers
      A1: { value: 'Excel Formula Examples' },
      A3: { value: 'Basic Math' },
      A4: { value: '=2+3' },
      B4: { value: 5 },
      A5: { value: '=B4*10' },
      B5: { value: 50 },

      A7: { value: 'Text Functions' },
      A8: { value: '=CONCATENATE("Hello",", ","World")' },
      B8: { value: 'Hello, World' },

      A10: { value: 'Range Operations' },
      A11: { value: '=SUM(C11:C13)' },
      C11: { value: 10 },
      C12: { value: 20 },
      C13: { value: 30 },
      B11: { value: 60 },

      D1: { value: 'Data Table' },
      D3: { value: 'Name' },
      E3: { value: 'Score' },
      D4: { value: 'Alice' },
      E4: { value: 95 },
      D5: { value: 'Bob' },
      E5: { value: 87 },
      D6: { value: 'Carol' },
      E6: { value: 92 },
      D7: { value: 'Average' },
      E7: { value: '=AVERAGE(E4:E6)' },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Excel compatibility demonstration with formulas, ranges, and typical spreadsheet patterns.',
      },
    },
  },
};
