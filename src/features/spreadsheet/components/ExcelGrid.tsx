/**
 * ExcelGrid Component
 *
 * Example component demonstrating how to use the new state layer:
 * - Uses useExcelSheet hook for all data operations
 * - Automatic dirty state tracking
 * - Reactive updates via useLiveQuery
 * - No manual state management needed
 */

import React, { useState } from 'react';
import { Box, TextField, Typography, Button } from '@mui/material';
import { useExcelSheet } from '../hooks/useExcelSheet';

interface ExcelGridProps {
  workbookId: string;
  sheetName: string;
  tabId: string;
}

export const ExcelGrid: React.FC<ExcelGridProps> = ({ workbookId, sheetName, tabId }) => {
  const { cells, getCell, updateCell, isDirty, markSaved, isLoading } = useExcelSheet({
    workbookId,
    sheetName,
    tabId,
  });

  const [editRow, setEditRow] = useState<number>(0);
  const [editCol, setEditCol] = useState<number>(0);
  const [editValue, setEditValue] = useState<string>('');

  const handleCellEdit = async () => {
    await updateCell({
      row: editRow,
      col: editCol,
      value: editValue,
    });
  };

  const handleSave = () => {
    // Here you would actually save to file system
    // For now, just mark as saved
    markSaved();
  };

  if (isLoading) {
    return <Typography>Loading sheet...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {sheetName} {isDirty && '(Unsaved)'}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">Total cells: {cells.length}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Row"
          type="number"
          size="small"
          value={editRow}
          onChange={e => setEditRow(Number(e.target.value))}
        />
        <TextField
          label="Col"
          type="number"
          size="small"
          value={editCol}
          onChange={e => setEditCol(Number(e.target.value))}
        />
        <TextField
          label="Value"
          size="small"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
        />
        <Button variant="contained" onClick={handleCellEdit}>
          Update Cell
        </Button>
      </Box>

      {isDirty && (
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Cell Data:</Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(cells.slice(0, 10), null, 2)}
        </pre>
      </Box>
    </Box>
  );
};
