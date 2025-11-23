import type { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from './AppLayout';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';
import { SpreadsheetGrid } from '../../features/workbook/components/SpreadsheetGrid';
import { FormulaBar } from '../../features/formula-bar/FormulaBar';
import { 
  TableChart, Functions, Code, Settings, Save, PlayArrow, 
  FolderOpen, Description, Speed 
} from '@mui/icons-material';
import { Typography } from '@mui/joy';

const meta: Meta<typeof AppLayout> = {
  title: 'UI/Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Main application layout component providing the foundational structure for Gridpark.
Features header, sidebar, main content area, and footer with proper overflow handling.

**Layout Zones:**
- Header: Application branding, navigation, and global actions
- Sidebar: Feature panels, navigation, and tool windows
- Content: Main workspace area with scrolling support
- Footer: Status bar, information, and secondary actions

**Design Principles Applied:**
- Code-first: IDE-inspired layout with familiar developer tool zones
- Flexible: Optional sidebar and footer for different use cases
- Responsive: Proper overflow and scrolling behavior
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

const sampleSidebarSections = [
  {
    title: 'Workspace',
    items: [
      { id: 'spreadsheet', label: 'Spreadsheet', icon: <TableChart />, active: true },
      { id: 'functions', label: 'Functions', icon: <Functions />, badge: '12' },
      { id: 'code-editor', label: 'Code Editor', icon: <Code /> },
    ],
  },
  {
    title: 'Files',
    items: [
      { id: 'recent', label: 'Recent Files', icon: <Description />, badge: '5' },
      { id: 'templates', label: 'Templates', icon: <FolderOpen /> },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'performance', label: 'Performance', icon: <Speed /> },
      { id: 'settings', label: 'Settings', icon: <Settings /> },
    ],
  },
];

export const Default: Story = {
  args: {
    header: (
      <Header 
        title="Gridpark"
        breadcrumbs={[
          { label: 'Workspace' },
          { label: 'My Project' },
          { label: 'Sheet1', current: true },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="soft" size="sm" startIcon={<Save />}>Save</Button>
            <Button size="sm" startIcon={<PlayArrow />}>Run</Button>
          </div>
        }
      />
    ),
    sidebar: <Sidebar sections={sampleSidebarSections} />,
    children: (
      <div style={{ padding: '20px' }}>
        <Typography level="h2" sx={{ mb: 2 }}>Main Content Area</Typography>
        <Typography>
          This is the main content area where spreadsheets, editors, and other primary
          application content would be displayed.
        </Typography>
      </div>
    ),
    footer: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Ready • 1,024 cells • Auto-save enabled</span>
        <span>Gridpark v1.0.0</span>
      </div>
    ),
  },
};

export const FullSpreadsheetApp: Story = {
  args: {
    header: (
      <Header 
        title="Gridpark"
        breadcrumbs={[
          { label: 'Projects' },
          { label: 'Financial Model' },
          { label: 'Q4 Analysis', current: true },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="soft" size="sm">Import</Button>
            <Button variant="soft" size="sm">Export</Button>
            <Button size="sm" color="success" startIcon={<Save />}>Save</Button>
          </div>
        }
      />
    ),
    sidebar: <Sidebar sections={sampleSidebarSections} />,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--joy-palette-divider)' }}>
          <FormulaBar 
            cellReference="B5"
            value="=SUM(B1:B4)"
            placeholder="Enter formula or value..."
          />
        </div>
        <div style={{ flex: 1, padding: '16px' }}>
          <SpreadsheetGrid 
            rows={20}
            columns={10}
            initialData={{
              'A1': { value: 'Revenue' },
              'B1': { value: 125000 },
              'A2': { value: 'Expenses' },
              'B2': { value: 87500 },
              'A3': { value: 'Profit' },
              'B3': { value: 37500 },
              'B5': { value: '=B1-B2' },
            }}
          />
        </div>
      </div>
    ),
    footer: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🟢 Connected • Last saved: 2 minutes ago • 247 formulas calculated</span>
        <span>Cell: B5 • Formula: =B1-B2 • Result: 37,500</span>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete spreadsheet application layout with formula bar, grid, and status information.',
      },
    },
  },
};

export const MinimalLayout: Story = {
  args: {
    header: (
      <Header 
        title="Gridpark"
        actions={<Button size="sm">Menu</Button>}
      />
    ),
    hideSidebar: true,
    children: (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Typography level="h1" sx={{ mb: 2 }}>Welcome to Gridpark</Typography>
        <Typography level="body-lg" sx={{ mb: 4 }}>
          Transform spreadsheets into playgrounds
        </Typography>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button size="lg">Create New Spreadsheet</Button>
          <Button size="lg" variant="soft">Import Excel File</Button>
        </div>
      </div>
    ),
    hideFooter: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal layout without sidebar and footer, suitable for welcome screens or simple views.',
      },
    },
  },
};

export const DeveloperWorkspace: Story = {
  args: {
    header: (
      <Header 
        title="Gridpark"
        breadcrumbs={[
          { label: 'Functions' },
          { label: 'Custom' },
          { label: 'CALCULATE_ROI.js', current: true },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="soft" size="sm">Debug</Button>
            <Button variant="soft" size="sm">Test</Button>
            <Button size="sm" color="success" startIcon={<PlayArrow />}>Deploy</Button>
          </div>
        }
      />
    ),
    sidebar: (
      <Sidebar sections={[
        {
          title: 'Explorer',
          items: [
            { id: 'functions', label: 'Custom Functions', icon: <Functions />, active: true },
            { id: 'templates', label: 'Function Templates', icon: <Code /> },
          ],
        },
        {
          title: 'Development',
          items: [
            { id: 'debugger', label: 'Debugger', icon: <Settings /> },
            { id: 'console', label: 'Debug Console', icon: <Description /> },
            { id: 'performance', label: 'Performance', icon: <Speed />, badge: '3' },
          ],
        },
      ]} />
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, padding: '20px' }}>
          <Card title="Function Editor" subtitle="CALCULATE_ROI.js">
            <div style={{ 
              backgroundColor: '#1e1e1e', 
              color: '#d4d4d4', 
              padding: '16px', 
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
{`/**
 * @customfunction
 * @param {number} revenue Total revenue amount
 * @param {number} cost Total cost amount  
 * @param {number} period Time period in months
 * @returns {number} Monthly ROI percentage
 */
function CALCULATE_ROI(revenue, cost, period) {
  if (cost <= 0 || period <= 0) {
    throw new Error("#NUM!");
  }
  
  const profit = revenue - cost;
  const roi = (profit / cost) * 100;
  return roi / period;
}`}
            </div>
          </Card>
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--joy-palette-divider)' }}>
          <Card variant="soft" title="Test Function">
            <FormulaBar 
              cellReference="A1"
              value="=GRIDPARK.CALCULATE_ROI(125000, 87500, 12)"
              placeholder="Test your function here..."
            />
          </Card>
        </div>
      </div>
    ),
    footer: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>✅ Function validated • No errors • Ready for deployment</span>
        <span>Hot reload: ON • Last test: 30s ago</span>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Developer-focused layout for custom function development with code editor and testing tools.',
      },
    },
  },
};