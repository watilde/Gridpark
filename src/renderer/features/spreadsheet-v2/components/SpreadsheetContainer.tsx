/**
 * SpreadsheetContainer - Main container for the v2 spreadsheet
 * 
 * This is the NEW implementation that replaces ExcelViewerDB.
 * 
 * Improvements:
 * - ~100 lines (vs 1,633 in ExcelViewer.tsx)
 * - Direct DB integration
 * - No intermediate state
 * - Incremental formula calculation
 * - Virtual scrolling
 */

import React from 'react';
import { Box, CircularProgress } from '@mui/joy';
import { ExcelFile } from '../../../../types/excel';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { useSpreadsheet } from '../hooks/useSpreadsheet';

interface SpreadsheetContainerProps {
  file: ExcelFile | null;
  sheetIndex?: number;
  
  // Callbacks
  onDirtyChange?: (dirty: boolean) => void;
  onCellSelect?: (row: number, col: number) => void;
}

export const SpreadsheetContainer: React.FC<SpreadsheetContainerProps> = ({
  file,
  sheetIndex = 0,
  onDirtyChange,
  onCellSelect,
}) => {
  // Get current sheet
  const currentSheet = file?.sheets?.[sheetIndex];
  
  // Generate tabId
  const tabId = file && currentSheet 
    ? `${file.path}-sheet-${sheetIndex}`
    : '';

  // Use spreadsheet hook
  const {
    cells,
    computedValues,
    selectedCell,
    setSelectedCell,
    isDirty,
    dimensions,
    updateCell,
  } = useSpreadsheet({
    tabId,
    workbookId: file?.path ?? '',
    sheetName: currentSheet?.name ?? '',
  });

  // Notify dirty changes
  React.useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Handle cell selection
  const handleCellSelect = React.useCallback((position: { row: number; col: number }) => {
    setSelectedCell(position);
    if (onCellSelect) {
      onCellSelect(position.row, position.col);
    }
  }, [setSelectedCell, onCellSelect]);

  // Handle cell change
  const handleCellChange = React.useCallback(async (row: number, col: number, value: string) => {
    await updateCell(row, col, value);
  }, [updateCell]);

  // Loading state
  if (!file || !currentSheet) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render grid
  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <SpreadsheetGrid
        cells={cells}
        visibleRows={dimensions.rows}
        visibleCols={dimensions.cols}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
        onCellChange={handleCellChange}
        computedValues={computedValues}
      />
    </Box>
  );
};
