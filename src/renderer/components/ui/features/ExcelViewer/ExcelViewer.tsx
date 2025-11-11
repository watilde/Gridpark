import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Sheet, Typography } from '@mui/joy';
import { ExcelFile, CellData, CellRange, CellPosition, CellStyle } from '../../../types/excel';

const ViewerContainer = styled(Sheet)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  borderRadius: 0,
});

const GridContainer = styled(Box)({
  flex: 1,
  overflow: 'auto',
  position: 'relative',
  backgroundColor: '#ffffff',
});

const Grid = styled('table')({
  borderCollapse: 'collapse',
  fontSize: '13px',
  fontFamily: 'inherit',
  minWidth: '100%',
  userSelect: 'none',
  color: '#000000',
});

const HeaderCell = styled('th')({
  position: 'sticky',
  top: 0,
  left: 0,
  backgroundColor: '#ffffff',
  border: '1px solid #d1d1d1',
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: '12px',
  textAlign: 'center',
  minWidth: '64px',
  zIndex: 2,
});

const RowHeaderCell = styled('th')({
  position: 'sticky',
  left: 0,
  backgroundColor: '#ffffff',
  border: '1px solid #d1d1d1',
  padding: '4px 8px',
  fontWeight: 600,
  fontSize: '12px',
  textAlign: 'center',
  minWidth: '28px',
  maxWidth: '28px',
  width: '28px',
  zIndex: 1,
});

interface StyledCellProps {
  selected: boolean;
  inRange: boolean;
  customStyle?: CellStyle;
}

const Cell = styled('td', {
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'inRange' && prop !== 'customStyle',
})<StyledCellProps>(({ selected, inRange, customStyle }) => ({
  border: '1px solid #e0e0e0',
  padding: '4px 8px',
  cursor: 'cell',
  backgroundColor: selected
    ? '#cfe8ff'
    : inRange
    ? '#e5f2ff'
    : customStyle?.backgroundColor || '#ffffff',
  color: customStyle?.color || '#000000',
  fontWeight: customStyle?.fontWeight || 'normal',
  fontStyle: customStyle?.fontStyle || 'normal',
  textAlign: (customStyle?.textAlign as any) || 'left',
  fontSize: customStyle?.fontSize || 'inherit',
  ...(customStyle?.border && { border: customStyle.border }),
  '&:hover': {
    backgroundColor: selected ? '#cfe8ff' : '#f5f5f5',
  },
}));

const CellInput = styled('input')({
  width: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  font: 'inherit',
  color: 'inherit',
});

const getColumnWidth = (colIndex: number) => (colIndex === 0 ? 56 : 96);
const calculateRowHeaderWidth = (rowCount: number) => {
  const digits = rowCount > 0 ? Math.floor(Math.log10(rowCount)) + 1 : 1;
  return Math.max(20, 8 + digits * 8);
};

const columnStyle = (colIndex: number) => {
  const width = getColumnWidth(colIndex);
  return {
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
    width: `${width}px`,
  };
};

export interface ExcelViewerProps {
  file: ExcelFile | null;
  sheetIndex?: number;
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
export const ExcelViewer: React.FC<ExcelViewerProps> = ({ file, sheetIndex = 0, onCellSelect, onRangeSelect }) => {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyle>>(new Map());
  const [gridData, setGridData] = useState<CellData[][]>([]);
  const gridRef = useRef<HTMLTableElement>(null);

  const normalizedSheetIndex = useMemo(() => {
    if (!file || file.sheets.length === 0) return 0;
    const clampedIndex = Math.max(0, Math.min(sheetIndex, file.sheets.length - 1));
    return clampedIndex;
  }, [file, sheetIndex]);

  const currentSheet = file?.sheets[normalizedSheetIndex] || null;
  const rowHeaderWidth = useMemo(
    () => calculateRowHeaderWidth(currentSheet?.rowCount ?? 1),
    [currentSheet?.rowCount],
  );
  const rowHeaderStyle = useMemo(
    () => ({
      minWidth: `${rowHeaderWidth}px`,
      maxWidth: `${rowHeaderWidth}px`,
      width: `${rowHeaderWidth}px`,
    }),
    [rowHeaderWidth],
  );

  const sheetData = useMemo(() => {
    if (gridData.length > 0) return gridData;
    return currentSheet?.data ?? [];
  }, [gridData, currentSheet]);

  useEffect(() => {
    if (currentSheet) {
      const copied = currentSheet.data.map((row) => row.map((cell) => ({ ...cell })));
      setGridData(copied);
    } else {
      setGridData([]);
    }
  }, [currentSheet]);

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

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setGridData((prev) => {
      if (!prev.length) return prev;
      return prev.map((rowData, rowIndex) =>
        rowIndex === row
          ? rowData.map((cellData, colIndex) =>
              colIndex === col
                ? {
                    ...cellData,
                    value,
                    type: value === '' ? 'empty' : isNaN(Number(value)) ? 'string' : 'number',
                  }
                : cellData,
            )
          : rowData,
      );
    });
  }, []);

  // Public API: Get cell value
  const getCellValue = useCallback((row: number, col: number): CellData | null => {
    if (!sheetData || row < 0 || col < 0) return null;
    if (row >= sheetData.length || col >= sheetData[row].length) return null;
    return sheetData[row][col];
  }, [sheetData]);

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
    <ViewerContainer variant="plain">
      <GridContainer>
        <Grid ref={gridRef}>
          <thead>
            <tr>
              <HeaderCell style={rowHeaderStyle} />
              {Array.from({ length: currentSheet.colCount }, (_, i) => (
                <HeaderCell key={i} style={columnStyle(i)}>
                  {getColumnLabel(i)}
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.map((row: CellData[], rowIndex: number) => (
              <tr key={rowIndex}>
                <RowHeaderCell style={rowHeaderStyle}>{rowIndex + 1}</RowHeaderCell>
                {row.map((cell: CellData, colIndex: number) => (
                  <Cell
                    key={colIndex}
                    style={columnStyle(colIndex)}
                    selected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
                    inRange={isCellInRange(rowIndex, colIndex)}
                    customStyle={cellStyles.get(getCellKey(rowIndex, colIndex))}
                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  >
                    <CellInput
                      value={cell.value !== null && cell.value !== undefined ? String(cell.value) : ''}
                      onChange={(event) => handleCellChange(rowIndex, colIndex, event.target.value)}
                    />
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
