import type { Meta, StoryObj } from '@storybook/react';
import { ExcelViewSidebar } from './ExcelViewSidebar';
import { Box } from '@mui/joy';

const meta: Meta<typeof ExcelViewSidebar> = {
  title: 'Sidebar/ExcelViewSidebar',
  component: ExcelViewSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <Box sx={{ display: 'flex', height: '600px' }}>
        <Box sx={{ width: '280px', height: '100%', borderRight: '1px solid', borderColor: 'divider' }}>
          <Story />
        </Box>
        <Box sx={{ flex: 1, p: 3, bgcolor: 'background.body' }}>
          <h2>Main Content Area</h2>
          <p>Select a file or sheet from the sidebar to view its content here.</p>
        </Box>
      </Box>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExcelViewSidebar>;

const sampleFiles = [
  {
    id: 'file1',
    name: 'Q4_Financial_Report.xlsx',
    path: '/projects/finance/Q4_Financial_Report.xlsx',
    starred: true,
    lastOpened: new Date('2024-12-20T10:30:00'),
    sheets: [
      { id: 'sheet1-1', name: 'Summary', index: 0, active: true },
      { id: 'sheet1-2', name: 'Revenue', index: 1 },
      { id: 'sheet1-3', name: 'Expenses', index: 2 },
      { id: 'sheet1-4', name: 'Charts', index: 3 },
    ],
  },
  {
    id: 'file2',
    name: 'Sales_Data_2024.xlsx',
    path: '/projects/sales/Sales_Data_2024.xlsx',
    starred: false,
    lastOpened: new Date('2024-12-19T15:45:00'),
    sheets: [
      { id: 'sheet2-1', name: 'Q1', index: 0 },
      { id: 'sheet2-2', name: 'Q2', index: 1 },
      { id: 'sheet2-3', name: 'Q3', index: 2 },
      { id: 'sheet2-4', name: 'Q4', index: 3 },
      { id: 'sheet2-5', name: 'Annual Summary', index: 4 },
    ],
  },
  {
    id: 'file3',
    name: 'Budget_Planning.xlsx',
    path: '/projects/planning/Budget_Planning.xlsx',
    starred: true,
    lastOpened: new Date('2024-12-18T09:15:00'),
    sheets: [
      { id: 'sheet3-1', name: '2025 Budget', index: 0 },
      { id: 'sheet3-2', name: 'Departments', index: 1 },
    ],
  },
  {
    id: 'file4',
    name: 'Inventory_Tracking.xlsx',
    path: '/projects/operations/Inventory_Tracking.xlsx',
    starred: false,
    lastOpened: new Date('2024-12-17T14:20:00'),
    sheets: [
      { id: 'sheet4-1', name: 'Main Warehouse', index: 0 },
      { id: 'sheet4-2', name: 'Distribution Center', index: 1 },
      { id: 'sheet4-3', name: 'Reports', index: 2 },
    ],
  },
  {
    id: 'file5',
    name: 'Employee_Records.xlsx',
    path: '/projects/hr/Employee_Records.xlsx',
    starred: false,
    sheets: [
      { id: 'sheet5-1', name: 'Active', index: 0 },
      { id: 'sheet5-2', name: 'Archive', index: 1 },
    ],
  },
];

export const Default: Story = {
  args: {
    files: sampleFiles,
    activeFileId: 'file1',
    activeSheetId: 'sheet1-1',
  },
};

export const NoActiveSelection: Story = {
  args: {
    files: sampleFiles,
  },
};

export const EmptyState: Story = {
  args: {
    files: [],
  },
};

export const SingleFile: Story = {
  args: {
    files: [sampleFiles[0]],
    activeFileId: 'file1',
  },
};

export const ManySheets: Story = {
  args: {
    files: [
      {
        id: 'bigfile',
        name: 'Large_Workbook.xlsx',
        path: '/projects/Large_Workbook.xlsx',
        starred: false,
        sheets: Array.from({ length: 20 }, (_, i) => ({
          id: `sheet-${i}`,
          name: `Sheet ${i + 1}`,
          index: i,
        })),
      },
    ],
    activeFileId: 'bigfile',
    activeSheetId: 'sheet-5',
  },
};

export const Interactive: Story = {
  args: {
    files: sampleFiles,
    activeFileId: 'file1',
    activeSheetId: 'sheet1-1',
    onFileSelect: (fileId) => {
      console.log('File selected:', fileId);
    },
    onSheetSelect: (fileId, sheetId) => {
      console.log('Sheet selected:', fileId, sheetId);
    },
    onFileCreate: () => {
      console.log('Create new file');
    },
    onFileOpen: () => {
      console.log('Open file dialog');
    },
    onFileStar: (fileId, starred) => {
      console.log('Toggle star:', fileId, starred);
    },
  },
};

export const AllStarred: Story = {
  args: {
    files: sampleFiles.map(f => ({ ...f, starred: true })),
    activeFileId: 'file2',
  },
};
