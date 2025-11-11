import React, { useState, useRef, useCallback, useEffect } from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Sheet, Typography, Select, Option } from '@mui/joy';
import { ExcelFile, ExcelSheet, CellData, CellRange, CellPosition, CellStyle } from '../../../types/excel';

const ViewerContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

const SheetSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const GridContainer = styled(Box)({
  flex: 1,
  overflow: 'auto',
  position: 'relative',
});

const Grid = styled('table')(({ theme }) => ({
  borderCollapse: 'collapse',
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  minWidth: '100%',
  userSelect: 'none',
}));

const HeaderCell = styled('th')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  left: 0,
  backgroundColor: theme.palette.background.surface,
  border: `1px solid ${theme.palette.divider}`,
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: '12px',
  textAlign: 'center',
  minWidth: '80px',
  zIndex: 2,
}));

const RowHeaderCell = styled('th')(({ theme }) => ({
  position: 'sticky',
  left: 0,
  backgroundColor: theme.palette.background.surface,
  border: `1px solid ${theme.palette.divider}`,
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: '12px',
  textAlign: 'center',
  minWidth: '40px',
  zIndex: 1,
}));

interface StyledCellProps {
  selected: boolean;
  inRange: boolean;
  customStyle?: CellStyle;
}

const Cell = styled('td', {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'inRange' && prop !== 'customStyle',
})<StyledCellProps>(({ theme, selected, inRange, customStyle }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: '4px 8px',
  minWidth: '80px',
  cursor: 'cell',
  backgroundColor: selected
    ? theme.palette.primary.softBg
    : inRange
    ? theme.palette.primary.softBg + '40'
    : customStyle?.backgroundColor || 'transparent',
  color: customStyle?.color || theme.palette.text.primary,
  fontWeight: customStyle?.fontWeight || 'normal',
  fontStyle: customStyle?.fontStyle || 'normal',
  textAlign: (customStyle?.textAlign as any) || 'left',
  fontSize: customStyle?.fontSize || 'inherit',
  ...(customStyle?.border && { border: customStyle.border }),
  '&:hover': {
    backgroundColor: selected
      ? theme.palette.primary.softBg
      : theme.palette.neutral.softHoverBg,
  },
}));

export interface ExcelViewerProps {
  file: ExcelFile | null;
  onCellSelect?: (position: CellPosition) => void;
  onRangeSelect?: (range: CellRange) => void;
}

/**
 * ExcelViewer Component with Cell Selection and Styling
 * 
 * Features:
 * - Display Excel file content in a grid
 * - Single cell selection (click)
 * - Range selection (click and drag)
 * - Sheet selector
 * - JavaScript API for cell operations
 * - CSS API for cell styling
 */
export const ExcelViewer: React.FC<ExcelViewerProps> = ({ file, onCellSelect, onRangeSelect }) => {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyle>>(new Map());
  const gridRef = useRef<HTMLTableElement>(null);

  const currentSheet = file?.sheets[currentSheetIndex] || null;

  // Generate column headers (A, B, C, ...)
  const getColumnLabel = (index: number): string => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  // Get cell key for styling
  const getCellKey = (row: number, col: number): string => {
    return `${row}-${col}`;
  };

  // Check if cell is in selection range
  const isCellInRange = (row: number, col: number): boolean => {
    if (!selectionRange) return false;
    return (
      row >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
      row <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
      col >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
      col <= Math.max(selectionRange.startCol, selectionRange.endCol)
    );
  };

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = (row: number, col: number) => {
    const position = { row, col };
    setSelectedCell(position);
    setSelectionRange({ startRow: row, startCol: col, endRow: row, endCol: col });
    setIsSelecting(true);
    onCellSelect?.(position);
  };

  // Handle cell mouse enter (during selection)
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionRange) return;
    setSelectionRange({
      ...selectionRange,
      endRow: row,
      endCol: col,
    });
  };

  // Handle mouse up (end selection)
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionRange) {
      setIsSelecting(false);
      onRangeSelect?.(selectionRange);
    }
  }, [isSelecting, selectionRange, onRangeSelect]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Public API: Get cell value
  const getCellValue = useCallback((row: number, col: number): CellData | null => {
    if (!currentSheet || row < 0 || col < 0) return null;
    if (row >= currentSheet.data.length || col >= currentSheet.data[row].length) return null;
    return currentSheet.data[row][col];
  }, [currentSheet]);

  // Public API: Set cell style
  const setCellStyle = useCallback((row: number, col: number, style: CellStyle) => {
    setCellStyles((prev) => {
      const newStyles = new Map(prev);
      newStyles.set(getCellKey(row, col), style);
      return newStyles;
    });
  }, []);

  // Public API: Set range style
  const setRangeStyle = useCallback((range: CellRange, style: CellStyle) => {
    setCellStyles((prev) => {
      const newStyles = new Map(prev);
      for (let row = Math.min(range.startRow, range.endRow); row <= Math.max(range.startRow, range.endRow); row++) {
        for (let col = Math.min(range.startCol, range.endCol); col <= Math.max(range.startCol, range.endCol); col++) {
          newStyles.set(getCellKey(row, col), style);
        }
      }
      return newStyles;
    });
  }, []);

  // Public API: Clear cell style
  const clearCellStyle = useCallback((row: number, col: number) => {
    setCellStyles((prev) => {
      const newStyles = new Map(prev);
      newStyles.delete(getCellKey(row, col));
      return newStyles;
    });
  }, []);

  // Public API: Clear all styles
  const clearAllStyles = useCallback(() => {
    setCellStyles(new Map());
  }, []);

  // Expose API via ref (for external JavaScript access)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gridparkAPI = {
        getCellValue,
        setCellStyle,
        setRangeStyle,
        clearCellStyle,
        clearAllStyles,
        getSelectedCell: () => selectedCell,
        getSelectionRange: () => selectionRange,
      };
    }
  }, [getCellValue, setCellStyle, setRangeStyle, clearCellStyle, clearAllStyles, selectedCell, selectionRange]);

  if (!file || !currentSheet) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'sm',
        }}
      >
        <Typography level="body-md" sx={{ color: 'neutral.500' }}>
          No file selected. Please select an Excel file from the file tree.
        </Typography>
      </Sheet>
    );
  }

  return (
    <ViewerContainer>
      <SheetSelector>
        <Typography level="title-sm">Sheet:</Typography>
        <Select
          value={currentSheetIndex}
          onChange={(_, value) => setCurrentSheetIndex(value as number)}
          size="sm"
          sx={{ minWidth: 200 }}
        >
          {file.sheets.map((sheet, index) => (
            <Option key={index} value={index}>
              {sheet.name}
            </Option>
          ))}
        </Select>
        <Typography level="body-sm" sx={{ color: 'neutral.500', ml: 'auto' }}>
          {currentSheet.rowCount} rows × {currentSheet.colCount} columns
        </Typography>
      </SheetSelector>

      <GridContainer>
        <Grid ref={gridRef}>
          <thead>
            <tr>
              <HeaderCell />
              {Array.from({ length: currentSheet.colCount }, (_, i) => (
                <HeaderCell key={i}>{getColumnLabel(i)}</HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentSheet.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <RowHeaderCell>{rowIndex + 1}</RowHeaderCell>
                {row.map((cell, colIndex) => (
                  <Cell
                    key={colIndex}
                    selected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
                    inRange={isCellInRange(rowIndex, colIndex)}
                    customStyle={cellStyles.get(getCellKey(rowIndex, colIndex))}
                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  >
                    {cell.value !== null && cell.value !== undefined ? String(cell.value) : ''}
                  </Cell>
                ))}
              </tr>
            ))}
          </tbody>
        </Grid>
      </GridContainer>
    </ViewerContainer>
  );
};

ExcelViewer.displayName = 'GridparkExcelViewer';
