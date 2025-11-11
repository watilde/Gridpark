import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Stack, Input, Tabs, TabList, Tab, IconButton } from '@mui/joy';
import { AppLayout } from '../components/ui/layout/AppLayout';
import { FileTree, FileNode } from '../components/ui/features/FileTree/FileTree';
import { ExcelViewer } from '../components/ui/features/ExcelViewer/ExcelViewer';
import { ExcelFile, CellPosition, CellRange } from '../types/excel';
import { createSampleExcelFile } from '../utils/excelUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const cloneSheetData = (data: ExcelFile['sheets'][number]['data']) =>
  data.map((row) => row.map((cell) => ({ ...cell })));

const createDemoExcelFile = (name: string): ExcelFile => {
  const base = createSampleExcelFile();
  return {
    ...base,
    name,
    path: `/sample/${name}`,
    sheets: base.sheets.map((sheet) => ({
      ...sheet,
      data: cloneSheetData(sheet.data),
    })),
  };
};

const createFileNodeWithSheets = (excelFile: ExcelFile, id: string, parentId?: string): FileNode => ({
  id,
  name: excelFile.name,
  type: 'file',
  parentId,
  file: excelFile,
  children: excelFile.sheets.map((sheet, index) => ({
    id: `${id}-sheet-${index}`,
    name: sheet.name,
    type: 'sheet',
    parentId: id,
    file: excelFile,
    sheetIndex: index,
  })),
});

type SheetTab = {
  id: string;
  sheetNodeId: string;
  fileNodeId: string;
  sheetIndex: number;
  fileName: string;
  sheetName: string;
  file: ExcelFile;
};

const createTabFromSheetNode = (sheetNode: FileNode): SheetTab | null => {
  if (sheetNode.type !== 'sheet' || !sheetNode.file || typeof sheetNode.sheetIndex !== 'number') {
    return null;
  }
  return {
    id: sheetNode.id,
    sheetNodeId: sheetNode.id,
    fileNodeId: sheetNode.parentId ?? '',
    sheetIndex: sheetNode.sheetIndex,
    fileName: sheetNode.file.name,
    sheetName: sheetNode.name,
    file: sheetNode.file,
  };
};

export const Home: React.FC = () => {
  const demoFiles = useMemo(
    () => [
      createDemoExcelFile('Sample.xlsx'),
      createDemoExcelFile('Sales Forecast.xlsx'),
      createDemoExcelFile('Inventory.xlsx'),
    ],
    []
  );
  const demoFileNodes = useMemo(
    () => demoFiles.map((file, index) => createFileNodeWithSheets(file, `demo-${index}`, 'workspace-root')),
    [demoFiles]
  );

  const initialSheetNode = demoFileNodes[0]?.children?.[0] ?? null;
  const initialTab = initialSheetNode ? createTabFromSheetNode(initialSheetNode) : null;

  const [workbookNodes] = useState<FileNode[]>(demoFileNodes);
  const [openTabs, setOpenTabs] = useState<SheetTab[]>(initialTab ? [initialTab] : []);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab?.id ?? '');
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(initialTab?.file ?? demoFiles[0] ?? null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(initialTab?.sheetIndex ?? 0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialTab?.sheetNodeId ?? initialSheetNode?.id ?? '');
  const treeData = useMemo<FileNode[]>(() => [
    {
      id: 'workspace-root',
      name: 'Workspace',
      type: 'folder',
      children: workbookNodes,
    },
  ], [workbookNodes]);

  const focusTab = useCallback((tab: SheetTab) => {
    setActiveTabId(tab.id);
    setSelectedFile(tab.file);
    setSelectedSheetIndex(tab.sheetIndex);
    setSelectedNodeId(tab.sheetNodeId);
  }, []);

  const openTabForSheetNode = useCallback(
    (sheetNode: FileNode) => {
      const tab = createTabFromSheetNode(sheetNode);
      if (!tab) return;
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      focusTab(tab);
    },
    [createTabFromSheetNode, focusTab]
  );

  const handleNodeSelect = (node: FileNode) => {
    if (node.type === 'sheet') {
      openTabForSheetNode(node);
      return;
    }

    if (node.type === 'file' && node.children && node.children.length > 0) {
      openTabForSheetNode(node.children[0]);
    }
  };

  const handleCellSelect = (position: CellPosition) => {
    console.log('Cell selected:', position);
  };

  const handleRangeSelect = (range: CellRange) => {
    console.log('Range selected:', range);
  };

  const handleBack = () => {
    console.log('Navigate back');
  };

  const handleProceed = () => {
    console.log('Proceed action');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search query:', event.target.value);
  };

  const activeTitle = selectedFile
    ? `${selectedFile.sheets[selectedSheetIndex]?.name ?? 'Sheet'} - ${selectedFile.name}`
    : 'Gridpark';

  useEffect(() => {
    window.electronAPI?.setWindowTitle(activeTitle);
  }, [activeTitle]);

  const handleTabChange = (_event: React.SyntheticEvent | null, value: string | number | null) => {
    if (!value || typeof value !== 'string') return;
    const tab = openTabs.find((t) => t.id === value);
    if (tab) {
      focusTab(tab);
    }
  };

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        const nextTabs = prev.filter((tab) => tab.id !== tabId);
        if (tabId === activeTabId) {
          const nextActive = nextTabs[nextTabs.length - 1];
          if (nextActive) {
            focusTab(nextActive);
          } else {
            setActiveTabId('');
            setSelectedFile(null);
            setSelectedSheetIndex(0);
            setSelectedNodeId('');
          }
        }
        return nextTabs;
      });
    },
    [activeTabId, focusTab]
  );

  useEffect(() => {
    if (!openTabs.length) {
      const fallbackSheet = demoFileNodes[0]?.children?.[0];
      if (fallbackSheet) {
        const tab = createTabFromSheetNode(fallbackSheet);
        if (tab) {
          setOpenTabs([tab]);
          focusTab(tab);
        }
      }
    }
  }, [openTabs.length, demoFileNodes, focusTab]);

  return (
    <AppLayout
      header={
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={handleProceed}
              aria-label="Go forward"
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Input
            placeholder="Search files or sheets"
            size="sm"
            startDecorator={<SearchIcon fontSize="small" />}
            sx={{ flex: 1, minWidth: 200 }}
            onChange={handleSearchChange}
          />
        </Box>
      }
      sidebar={
        <FileTree
          files={treeData}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
        />
      }
      footer={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography level="body-sm">
            Ready
          </Typography>
          {selectedFile && (
            <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
              File: {selectedFile.name} | Sheets: {selectedFile.sheets.length}
            </Typography>
          )}
          <Typography level="body-sm" sx={{ ml: 'auto', color: 'neutral.500' }}>
            Gridpark v1.0.0
          </Typography>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {openTabs.length > 0 && (
          <Tabs
            value={activeTabId}
            onChange={handleTabChange}
            sx={{ backgroundColor: 'background.surface', borderRadius: 'sm', boxShadow: 'sm' }}
          >
            <TabList
              variant="soft"
              sx={{
                gap: 0.5,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { height: 4 },
              }}
            >
              {openTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  sx={{
                    textTransform: 'none',
                    minHeight: '28px',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    px: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{tab.sheetName}</span>
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </Tab>
              ))}
            </TabList>
          </Tabs>
        )}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ExcelViewer
            file={selectedFile}
            sheetIndex={selectedSheetIndex}
            onCellSelect={handleCellSelect}
            onRangeSelect={handleRangeSelect}
          />
        </Box>
      </Box>
    </AppLayout>
  );
};

export default Home;
