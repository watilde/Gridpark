import React, { useState, useCallback } from 'react';
import { styled } from '@mui/joy/styles';
import { Typography } from '@mui/joy';

interface CellData {
  value: string | number | null;
  formula?: string;
  isSelected?: boolean;
}

interface GridPosition {
  row: number;
  col: number;
}

const GridContainer = styled('div')(({ theme }) => ({
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '14px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.radius.sm,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.surface,
  
  // Code-first experience: Focus management
  '&:focus-within': {
    boxShadow: `0 0 0 2px ${theme.palette.primary[300]}40`,
  },
}));

const GridTable = styled('table')({
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
});

const HeaderCell = styled('th')(({ theme }) => ({
  backgroundColor: theme.palette.neutral[100],
  border: `1px solid ${theme.palette.divider}`,
  padding: '8px',
  textAlign: 'center',
  fontWeight: 600,
  fontSize: '12px',
  color: theme.palette.text.secondary,
  minWidth: '80px',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

const RowHeader = styled(HeaderCell)({
  width: '60px',
  minWidth: '60px',
  position: 'sticky',
  left: 0,
  zIndex: 2,
});

const Cell = styled('td')<{ isSelected?: boolean; isEditing?: boolean }>(({ theme, isSelected, isEditing }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: '0',
  position: 'relative',
  height: '32px',
  
  '& input': {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    padding: '4px 8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
  },

  '& .cell-content': {
    padding: '4px 8px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'cell',
    backgroundColor: isSelected ? theme.palette.primary[100] : 'transparent',
    border: isSelected ? `2px solid ${theme.palette.primary[400]}` : '2px solid transparent',
    
    '&:hover': {
      backgroundColor: theme.palette.neutral[50],
    },
  },

  ...(isEditing && {
    '& .cell-content': {
      display: 'none',
    },
  }),
}));

const getColumnName = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

export interface SpreadsheetGridProps {
  /**
   * Number of rows to display
   */
  rows?: number;
  /**
   * Number of columns to display
   */
  columns?: number;
  /**
   * Initial data for the grid
   */
  initialData?: Record<string, CellData>;
  /**
   * Cell value change handler
   */
  onCellChange?: (position: GridPosition, value: string) => void;
  /**
   * Cell selection change handler
   */
  onCellSelect?: (position: GridPosition) => void;
  /**
   * Read-only mode
   */
  readOnly?: boolean;
}

/**
 * Gridpark SpreadsheetGrid Component
 * 
 * Excel-compatible spreadsheet grid with familiar navigation:
 * - Code-first: Keyboard navigation (arrows, Tab, Enter)
 * - Excel compatibility: A1 notation, familiar cell editing
 * - Immediate feedback: Visual selection and editing states
 * - Developer-friendly: Monospace font, clear grid structure
 */
export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows = 20,
  columns = 10,
  initialData = {},
  onCellChange,
  onCellSelect,
  readOnly = false,
}) => {
  const [selectedCell, setSelectedCell] = useState<GridPosition>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<GridPosition | null>(null);
  const [data, setData] = useState<Record<string, CellData>>(initialData);

  const getCellKey = (row: number, col: number) => `${getColumnName(col)}${row + 1}`;
  
  const getCellValue = (row: number, col: number): string => {
    const key = getCellKey(row, col);
    const cellData = data[key];
    if (!cellData) return '';
    return cellData.value?.toString() || '';
  };

  const handleCellClick = useCallback((row: number, col: number) => {
    const position = { row, col };
    setSelectedCell(position);
    onCellSelect?.(position);
  }, [onCellSelect]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    if (readOnly) return;
    setEditingCell({ row, col });
  }, [readOnly]);

  const handleCellValueChange = useCallback((row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    const newData = {
      ...data,
      [key]: { value: value || null }
    };
    setData(newData);
    onCellChange?.({ row, col }, value);
  }, [data, onCellChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (editingCell) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) handleCellClick(row - 1, col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < rows - 1) handleCellClick(row + 1, col);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) handleCellClick(row, col - 1);
        break;
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault();
        if (col < columns - 1) handleCellClick(row, col + 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (!readOnly) setEditingCell({ row, col });
        break;
      case 'F2':
        e.preventDefault();
        if (!readOnly) setEditingCell({ row, col });
        break;
    }
  }, [editingCell, readOnly, rows, columns, handleCellClick]);

  const renderCell = (row: number, col: number) => {
    const isSelected = selectedCell.row === row && selectedCell.col === col;
    const isEditing = editingCell?.row === row && editingCell?.col === col;
    const cellValue = getCellValue(row, col);

    return (
      <Cell
        key={`${row}-${col}`}
        isSelected={isSelected}
        isEditing={isEditing}
        onClick={() => handleCellClick(row, col)}
        onDoubleClick={() => handleCellDoubleClick(row, col)}
        tabIndex={isSelected ? 0 : -1}
        onKeyDown={(e) => handleKeyDown(e, row, col)}
      >
        {isEditing ? (
          <input
            type="text"
            defaultValue={cellValue}
            autoFocus
            onBlur={(e) => {
              handleCellValueChange(row, col, e.target.value);
              setEditingCell(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleCellValueChange(row, col, e.currentTarget.value);
                setEditingCell(null);
              }
              if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
          />
        ) : (
          <div className="cell-content">
            {cellValue}
          </div>
        )}
      </Cell>
    );
  };

  return (
    <GridContainer>
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <GridTable>
          <thead>
            <tr>
              <RowHeader></RowHeader>
              {Array.from({ length: columns }, (_, col) => (
                <HeaderCell key={col}>
                  {getColumnName(col)}
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                <RowHeader>{row + 1}</RowHeader>
                {Array.from({ length: columns }, (_, col) => renderCell(row, col))}
              </tr>
            ))}
          </tbody>
        </GridTable>
      </div>
      
      <div style={{ 
        padding: '8px 12px', 
        borderTop: '1px solid var(--joy-palette-divider)',
        backgroundColor: 'var(--joy-palette-neutral-50)',
        fontSize: '12px'
      }}>
        <Typography level="body-xs">
          Selected: {getColumnName(selectedCell.col)}{selectedCell.row + 1}
          {editingCell && ' (Editing)'}
        </Typography>
      </div>
    </GridContainer>
  );
};

SpreadsheetGrid.displayName = 'GridparkSpreadsheetGrid';