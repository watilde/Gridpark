import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  
  // Code-first experience: Focus management
  '&:focus-within': {
    boxShadow: `0 0 0 2px ${theme.palette.primary[300]}40`,
  },
}));

const GridScrollContainer = styled('div')(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  position: 'relative',
  backgroundColor: theme.palette.background.surface,
  // Smooth scrolling for better UX
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.neutral[100],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.neutral[300],
    borderRadius: '6px',
    '&:hover': {
      backgroundColor: theme.palette.neutral[400],
    },
  },
}));

const GridTable = styled('div')({
  display: 'grid',
  position: 'relative',
  width: 'fit-content',
  minWidth: '100%',
});

const GridRow = styled('div')({
  display: 'contents',
});

const HeaderCell = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.neutral[100],
  border: `1px solid ${theme.palette.divider}`,
  padding: '8px',
  textAlign: 'center',
  fontWeight: 600,
  fontSize: '12px',
  color: theme.palette.text.secondary,
  minWidth: '100px',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const RowHeader = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.neutral[100],
  border: `1px solid ${theme.palette.divider}`,
  padding: '8px',
  textAlign: 'center',
  fontWeight: 600,
  fontSize: '12px',
  color: theme.palette.text.secondary,
  width: '60px',
  minWidth: '60px',
  position: 'sticky',
  left: 0,
  zIndex: 9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

interface CellProps {
  isSelected?: boolean;
  isEditing?: boolean;
}

const CellBase = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CellProps>(
  ({ isSelected, isEditing, ...rest }, ref) => <div ref={ref} {...rest} />
);

const Cell = styled(CellBase)<CellProps>(({ theme, isSelected, isEditing }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: '0',
  position: 'relative',
  height: '32px',
  minHeight: '32px',
  minWidth: '100px',
  backgroundColor: theme.palette.background.surface,
  
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
    boxSizing: 'border-box',
  },

  '& .cell-content': {
    padding: '4px 8px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'cell',
    backgroundColor: isSelected ? theme.palette.primary[100] : 'transparent',
    border: isSelected ? `2px solid ${theme.palette.primary[400]}` : '2px solid transparent',
    boxSizing: 'border-box',
    
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
   * @default 1000 (US-001 requirement)
   */
  rows?: number;
  /**
   * Number of columns to display
   * @default 26 (A-Z, US-001 requirement)
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
  /**
   * Enable virtualization for large grids
   * @default true for performance
   */
  virtualized?: boolean;
}

/**
 * Gridpark SpreadsheetGrid Component
 * 
 * Excel-compatible spreadsheet grid with familiar navigation:
 * - Code-first: Keyboard navigation (arrows, Tab, Enter)
 * - Excel compatibility: A1 notation, familiar cell editing
 * - Immediate feedback: Visual selection and editing states
 * - Developer-friendly: Monospace font, clear grid structure
 * - Performance: Virtualized rendering for large datasets
 * 
 * US-001: Basic Spreadsheet Grid
 * - 26 columns (A-Z) × 1000 rows
 * - Cell selection with keyboard navigation
 * - Cell editing with double-click or F2
 * - Basic data types: text, numbers, booleans
 * - Performance: <500ms render time
 */
export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows = 1000,
  columns = 26,
  initialData = {},
  onCellChange,
  onCellSelect,
  readOnly = false,
  virtualized = true,
}) => {
  const [selectedCell, setSelectedCell] = useState<GridPosition>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<GridPosition | null>(null);
  const [data, setData] = useState<Record<string, CellData>>(initialData);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedCellRef = useRef<HTMLDivElement>(null);
  
  // Virtualization state
  const [visibleRange, setVisibleRange] = useState({
    startRow: 0,
    endRow: Math.min(50, rows),
    startCol: 0,
    endCol: Math.min(columns, 26)
  });

  const getCellKey = (row: number, col: number) => `${getColumnName(col)}${row + 1}`;
  
  const getCellValue = (row: number, col: number): string => {
    const key = getCellKey(row, col);
    const cellData = data[key];
    if (!cellData) return '';
    return cellData.value?.toString() || '';
  };

  // Scroll selected cell into view
  useEffect(() => {
    if (selectedCellRef.current && scrollContainerRef.current) {
      const cellRect = selectedCellRef.current.getBoundingClientRect();
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      
      if (cellRect.bottom > containerRect.bottom || cellRect.top < containerRect.top) {
        selectedCellRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      if (cellRect.right > containerRect.right || cellRect.left < containerRect.left) {
        selectedCellRef.current.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedCell]);
  
  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (!virtualized || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rowHeight = 32;
    const colWidth = 100;
    const overscan = 10; // Rows/cols to render beyond visible area
    
    const startRow = Math.max(0, Math.floor(container.scrollTop / rowHeight) - overscan);
    const endRow = Math.min(rows, Math.ceil((container.scrollTop + container.clientHeight) / rowHeight) + overscan);
    const startCol = Math.max(0, Math.floor(container.scrollLeft / colWidth) - overscan);
    const endCol = Math.min(columns, Math.ceil((container.scrollLeft + container.clientWidth) / colWidth) + overscan);
    
    setVisibleRange({ startRow, endRow, startCol, endCol });
  }, [virtualized, rows, columns]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !virtualized) return;
    
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, virtualized]);

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
        ref={isSelected ? selectedCellRef : undefined}
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
  
  // Determine which rows and columns to render
  const rowsToRender = virtualized 
    ? Array.from({ length: visibleRange.endRow - visibleRange.startRow }, (_, i) => i + visibleRange.startRow)
    : Array.from({ length: rows }, (_, i) => i);
    
  const colsToRender = virtualized
    ? Array.from({ length: visibleRange.endCol - visibleRange.startCol }, (_, i) => i + visibleRange.startCol)
    : Array.from({ length: columns }, (_, i) => i);

  return (
    <GridContainer>
      <GridScrollContainer ref={scrollContainerRef}>
        <GridTable
          style={{
            gridTemplateColumns: `60px repeat(${columns}, 100px)`,
            gridTemplateRows: `32px repeat(${rows}, 32px)`,
          }}
        >
          {/* Corner cell */}
          <RowHeader style={{ position: 'sticky', top: 0, left: 0, zIndex: 11 }}></RowHeader>
          
          {/* Column headers */}
          {Array.from({ length: columns }, (_, col) => (
            <HeaderCell key={`header-${col}`}>
              {getColumnName(col)}
            </HeaderCell>
          ))}
          
          {/* Grid rows */}
          {rowsToRender.map(row => (
            <React.Fragment key={`row-${row}`}>
              {/* Row header */}
              <RowHeader style={{ gridRow: row + 2 }}>{row + 1}</RowHeader>
              
              {/* Row cells */}
              {virtualized ? (
                colsToRender.map(col => (
                  <div key={`${row}-${col}`} style={{ gridRow: row + 2, gridColumn: col + 2 }}>
                    {renderCell(row, col)}
                  </div>
                ))
              ) : (
                Array.from({ length: columns }, (_, col) => (
                  <div key={`${row}-${col}`} style={{ gridRow: row + 2, gridColumn: col + 2 }}>
                    {renderCell(row, col)}
                  </div>
                ))
              )}
            </React.Fragment>
          ))}
        </GridTable>
      </GridScrollContainer>
      
      <div style={{ 
        padding: '8px 12px', 
        borderTop: '1px solid var(--joy-palette-divider)',
        backgroundColor: 'var(--joy-palette-neutral-50)',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography level="body-xs">
          Selected: {getColumnName(selectedCell.col)}{selectedCell.row + 1}
          {editingCell && ' (Editing)'}
        </Typography>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
          {rows} rows × {columns} cols {virtualized && '(virtualized)'}
        </Typography>
      </div>
    </GridContainer>
  );
};

SpreadsheetGrid.displayName = 'GridparkSpreadsheetGrid';
