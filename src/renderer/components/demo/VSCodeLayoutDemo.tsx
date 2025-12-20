/**
 * Complete VSCode-Style Layout Demo
 * 
 * Demonstrates the full integration of:
 * - Activity Bar (left navigation)
 * - Excel View Sidebar (file explorer)
 * - Main Content Area (spreadsheet viewer)
 * - Status Bar (bottom info)
 */

import React, { useState } from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Typography } from '@mui/joy';
import { ActivityBar, ActivityBarView } from '../layout/ActivityBar';
import { ExcelViewSidebar, ExcelFile } from '../sidebar/ExcelViewSidebar';

// ============================================================================
// Demo Data
// ============================================================================

const demoFiles: ExcelFile[] = [
  {
    id: 'file1',
    name: 'Q4_Financial_Report.xlsx',
    path: '/projects/finance/Q4_Financial_Report.xlsx',
    starred: true,
    lastOpened: new Date('2024-12-20T10:30:00'),
    sheets: [
      { id: 'sheet1-1', name: 'Summary', index: 0 },
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
];

// ============================================================================
// Styled Components
// ============================================================================

const LayoutContainer = styled(Box)({
  display: 'flex',
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
});

const Sidebar = styled(Box)(({ theme }) => ({
  width: '280px',
  height: '100%',
  backgroundColor: theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#454545' : '#d0d0d0'}`,
  flexShrink: 0,
}));

const MainArea = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: '24px',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  overflow: 'auto',
}));

const StatusBar = styled(Box)(({ theme }) => ({
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  backgroundColor: theme.palette.mode === 'dark' ? '#007acc' : '#0066bf',
  color: '#ffffff',
  fontSize: '11px',
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#005a9e' : '#00509e'}`,
}));

const StatusItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

// ============================================================================
// Component
// ============================================================================

export const VSCodeLayoutDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<ActivityBarView>('excel');
  const [activeFileId, setActiveFileId] = useState<string>('file1');
  const [activeSheetId, setActiveSheetId] = useState<string>('sheet1-1');

  const activeFile = demoFiles.find(f => f.id === activeFileId);
  const activeSheet = activeFile?.sheets.find(s => s.id === activeSheetId);

  const renderSidebar = () => {
    switch (activeView) {
      case 'excel':
        return (
          <ExcelViewSidebar
            files={demoFiles}
            activeFileId={activeFileId}
            activeSheetId={activeSheetId}
            onFileSelect={setActiveFileId}
            onSheetSelect={(fileId, sheetId) => {
              setActiveFileId(fileId);
              setActiveSheetId(sheetId);
            }}
            onFileCreate={() => console.log('Create file')}
            onFileOpen={() => console.log('Open file')}
            onFileStar={(fileId, starred) => console.log('Star:', fileId, starred)}
          />
        );
      case 'commit':
        return (
          <Box sx={{ p: 2 }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>Git Commit</Typography>
            <Typography level="body-sm">Commit view coming soon...</Typography>
          </Box>
        );
      case 'history':
        return (
          <Box sx={{ p: 2 }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>Git History</Typography>
            <Typography level="body-sm">History view coming soon...</Typography>
          </Box>
        );
      case 'branch':
        return (
          <Box sx={{ p: 2 }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>Git Branches</Typography>
            <Typography level="body-sm">Branch view coming soon...</Typography>
          </Box>
        );
      case 'git-config':
        return (
          <Box sx={{ p: 2 }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>Git Config</Typography>
            <Typography level="body-sm">Git configuration coming soon...</Typography>
          </Box>
        );
      case 'settings':
        return (
          <Box sx={{ p: 2 }}>
            <Typography level="title-lg" sx={{ mb: 2 }}>Settings</Typography>
            <Typography level="body-sm">Settings panel coming soon...</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutContainer>
      {/* Activity Bar */}
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />

      {/* Sidebar */}
      <Sidebar>{renderSidebar()}</Sidebar>

      {/* Main Area */}
      <MainArea>
        {/* Content */}
        <ContentArea>
          <Typography level="h2" sx={{ mb: 2 }}>
            {activeFile?.name || 'No File Selected'}
          </Typography>
          {activeSheet && (
            <Typography level="h4" sx={{ mb: 3, color: 'text.secondary' }}>
              Sheet: {activeSheet.name}
            </Typography>
          )}
          <Typography sx={{ mb: 2 }}>
            <strong>Active View:</strong> {activeView.toUpperCase()}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>File:</strong> {activeFile?.path || 'None'}
          </Typography>
          <Typography>
            <strong>Sheet:</strong> {activeSheet?.name || 'None'} (Index: {activeSheet?.index ?? 'N/A'})
          </Typography>

          <Box
            sx={{
              mt: 4,
              p: 3,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: '8px',
            }}
          >
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              📊 Spreadsheet viewer will be rendered here
            </Typography>
          </Box>
        </ContentArea>

        {/* Status Bar */}
        <StatusBar>
          <StatusItem>
            <span>🌿 main</span>
            <span>0↓ 0↑</span>
          </StatusItem>
          <StatusItem>
            <span>Ln 1, Col 1</span>
            <span>UTF-8</span>
            <span>Excel</span>
          </StatusItem>
        </StatusBar>
      </MainArea>
    </LayoutContainer>
  );
};

VSCodeLayoutDemo.displayName = 'VSCodeLayoutDemo';
