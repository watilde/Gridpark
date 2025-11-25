import type { Meta, StoryObj } from '@storybook/react';
import { FormulaBar } from './FormulaBar';
import { Card } from '../../components/ui/Card/Card';
import { useState } from 'react';

const meta: Meta<typeof FormulaBar> = {
  title: 'UI/Features/FormulaBar',
  component: FormulaBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Excel-style formula bar for entering and editing formulas and cell values.
Features real-time validation, function suggestions, and familiar Excel-like interactions.

**Features:**
- Cell reference display (A1, B5, etc.)
- Formula/value input with monospace font
- Real-time syntax validation for formulas
- Function suggestions and autocomplete
- Execute button for formula evaluation
- Clear button for quick reset

**Design Principles Applied:**
- Code-first: Monospace font, developer-friendly input patterns
- Excel compatibility: Familiar formula bar layout and behavior
- Immediate feedback: Real-time validation with color-coded status
- Developer-friendly: Syntax highlighting concepts and helpful suggestions
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ width: '800px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormulaBar>;

// Mock validation function for stories
const mockValidateFormula = (formula: string) => {
  if (!formula.startsWith('=')) {
    return { isValid: true };
  }

  // Simple validation examples
  if (formula === '=SUM(A1:A10)') {
    return {
      isValid: true,
      suggestions: ['=SUM(A1:B10)', '=AVERAGE(A1:A10)', '=COUNT(A1:A10)'],
    };
  }

  if (formula.includes('SUM(') && !formula.includes(')')) {
    return {
      isValid: false,
      error: 'Missing closing parenthesis',
      suggestions: ['=SUM(A1:A10)', '=SUM(B1:B5)'],
    };
  }

  if (formula.includes('VLOOKUP')) {
    return {
      isValid: true,
      suggestions: ['=VLOOKUP(A1,B:D,2,FALSE)', '=VLOOKUP(A1,Table1,3,TRUE)'],
    };
  }

  if (formula.startsWith('=') && formula.length > 1) {
    return {
      isValid: true,
      suggestions: ['=SUM()', '=AVERAGE()', '=COUNT()', '=IF()', '=VLOOKUP()'],
    };
  }

  return { isValid: true };
};

export const Default: Story = {
  args: {
    cellReference: 'A1',
    placeholder: 'Enter formula or value...',
  },
};

export const WithValue: Story = {
  args: {
    cellReference: 'B5',
    value: 'Product Revenue',
    placeholder: 'Enter formula or value...',
  },
};

export const WithFormula: Story = {
  args: {
    cellReference: 'C10',
    value: '=SUM(C1:C9)',
    onValidateFormula: mockValidateFormula,
  },
};

export const WithValidation: Story = {
  args: {
    cellReference: 'D3',
    value: '=SUM(A1:A10', // Missing closing parenthesis
    onValidateFormula: mockValidateFormula,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Formula bar showing validation error for malformed formula (missing closing parenthesis).',
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    cellReference: 'E7',
    value: '=VLOOKUP(A7,Products!B:D,3,FALSE)',
    readOnly: true,
    onValidateFormula: mockValidateFormula,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only formula bar for viewing formulas without editing capability.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [cellRef, setCellRef] = useState('A1');
    const [formula, setFormula] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const handleFormulaChange = (newFormula: string) => {
      setFormula(newFormula);
    };

    const handleFormulaExecute = (formula: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLog(prev => [...prev, `${timestamp}: Executed "${formula}" in cell ${cellRef}`]);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card title="Interactive Formula Bar Demo" subtitle="Try entering formulas and values">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Cell Reference:
            </label>
            <select
              value={cellRef}
              onChange={e => setCellRef(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px' }}
            >
              <option value="A1">A1</option>
              <option value="B5">B5</option>
              <option value="C10">C10</option>
              <option value="D3">D3</option>
            </select>
          </div>
        </Card>

        <FormulaBar
          cellReference={cellRef}
          value={formula}
          onFormulaChange={handleFormulaChange}
          onFormulaExecute={handleFormulaExecute}
          onValidateFormula={mockValidateFormula}
          showSuggestions={true}
        />

        {log.length > 0 && (
          <Card title="Execution Log" variant="soft">
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
              {log.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: '4px',
                    color: '#666',
                  }}
                >
                  {entry}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo with cell selection and execution logging. Try different formulas and see real-time validation.',
      },
    },
  },
};

export const ExcelFormulas: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <FormulaBar
        cellReference="A1"
        value="=SUM(B1:B10)"
        onValidateFormula={mockValidateFormula}
        readOnly={true}
      />
      <FormulaBar
        cellReference="B1"
        value="=AVERAGE(C1:C20)"
        onValidateFormula={mockValidateFormula}
        readOnly={true}
      />
      <FormulaBar
        cellReference="C1"
        value={'=IF(D1>100,"High","Low")'}
        onValidateFormula={mockValidateFormula}
        readOnly={true}
      />
      <FormulaBar
        cellReference="D1"
        value="=VLOOKUP(A1,Products!A:D,4,FALSE)"
        onValidateFormula={mockValidateFormula}
        readOnly={true}
      />
      <FormulaBar
        cellReference="E1"
        value={'=CONCATENATE(F1," ",G1)'}
        onValidateFormula={mockValidateFormula}
        readOnly={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Collection of common Excel formulas showing various function types and syntax patterns.',
      },
    },
  },
};

export const DeveloperWorkflow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Custom Function Development" subtitle="Formula bar in developer context">
        <div style={{ fontSize: '14px', marginBottom: '12px' }}>
          Testing custom GRIDPARK functions with familiar Excel syntax:
        </div>
      </Card>

      <FormulaBar
        cellReference="A1"
        value="=GRIDPARK.CALCULATE_ROI(B1,C1,D1)"
        onValidateFormula={formula => ({
          isValid: true,
          suggestions: [
            '=GRIDPARK.CALCULATE_ROI(revenue, cost, period)',
            '=GRIDPARK.FETCH_API_DATA(endpoint)',
            '=GRIDPARK.TRANSFORM_JSON(data, path)',
          ],
        })}
      />

      <FormulaBar
        cellReference="A2"
        value="=GRIDPARK.FETCH_API"
        onValidateFormula={formula => ({
          isValid: false,
          error: 'Incomplete function call',
          suggestions: [
            '=GRIDPARK.FETCH_API_DATA("https://api.example.com/data")',
            '=GRIDPARK.FETCH_API_AUTH("endpoint", "token")',
          ],
        })}
      />

      <Card variant="soft">
        <div style={{ fontSize: '12px' }}>
          <strong>💡 Developer Tip:</strong> Custom functions use the GRIDPARK namespace and support
          the same parameter patterns as Excel Custom Functions.
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Formula bar in developer context with custom GRIDPARK functions and development-focused suggestions.',
      },
    },
  },
};
