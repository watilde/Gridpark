import React, { useState, useRef } from 'react';
import { Box, Button, Typography, Stack } from '@mui/joy';
import { AppLayout } from '../components/ui/layout/AppLayout';
import { FileTree, FileNode } from '../components/ui/features/FileTree/FileTree';
import { ExcelViewer } from '../components/ui/features/ExcelViewer/ExcelViewer';
import { ExcelFile, CellPosition, CellRange } from '../types/excel';
import { createSampleExcelFile, loadExcelFile } from '../utils/excelUtils';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export const Home: React.FC = () => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: 'sample',
      name: 'Sample.xlsx',
      type: 'file',
      file: createSampleExcelFile(),
    },
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string>('sample');
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(createSampleExcelFile());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (node: FileNode) => {
    if (node.type === 'file' && node.file) {
      setSelectedFileId(node.id);
      setSelectedFile(node.file);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const excelFile = await loadExcelFile(file);
      const newNode: FileNode = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: 'file',
        file: excelFile,
      };

      setFiles((prev) => [...prev, newNode]);
      setSelectedFileId(newNode.id);
      setSelectedFile(excelFile);
    } catch (error) {
      console.error('Failed to load Excel file:', error);
      alert('Failed to load Excel file. Please make sure it is a valid .xlsx file.');
    }
  };

  const handleCellSelect = (position: CellPosition) => {
    console.log('Cell selected:', position);
  };

  const handleRangeSelect = (range: CellRange) => {
    console.log('Range selected:', range);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTestStyling = () => {
    // Test the styling API
    if (typeof window !== 'undefined' && (window as any).gridparkAPI) {
      const api = (window as any).gridparkAPI;
      
      // Style header row (row 0) with blue background
      api.setRangeStyle(
        { startRow: 0, startCol: 0, endRow: 0, endCol: 3 },
        {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
        }
      );

      // Style some cells with different colors
      api.setCellStyle(1, 3, { backgroundColor: '#10b981', color: '#ffffff' });
      api.setCellStyle(2, 3, { backgroundColor: '#f59e0b', color: '#ffffff' });
      api.setCellStyle(3, 3, { backgroundColor: '#ef4444', color: '#ffffff' });

      alert('Styling applied! Check the spreadsheet.');
    }
  };

  return (
    <AppLayout
      header={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography level="h4" sx={{ fontWeight: 'bold' }}>
            Gridpark
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="sm"
              onClick={handleTestStyling}
            >
              Test Styling
            </Button>
            <Button
              variant="solid"
              size="sm"
              startDecorator={<UploadFileIcon />}
              onClick={handleUploadClick}
            >
              Upload Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Stack>
        </Box>
      }
      sidebar={
        <FileTree
          files={files}
          selectedFileId={selectedFileId}
          onFileSelect={handleFileSelect}
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
      <ExcelViewer
        file={selectedFile}
        onCellSelect={handleCellSelect}
        onRangeSelect={handleRangeSelect}
      />
    </AppLayout>
  );
};

export default Home;
