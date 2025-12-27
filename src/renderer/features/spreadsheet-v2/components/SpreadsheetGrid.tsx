/**
 * SpreadsheetGrid - Lightweight virtualized grid component
 * 
 * Design principles:
 * 1. Virtual scrolling for performance
 * 2. Minimal re-renders
 * 3. Direct cell updates (no full grid clones)
 * 4. Sparse data structure
 */

import React, { useRef, useCallback, useMemo, CSSProperties } from 'react';
import { Box } from '@mui/joy';
import { StoredCellData } from '../../../lib/db';

// Constants
const CELL_WIDTH = 100;
const CELL_HEIGHT = 28;
const HEADER_HEIGHT = 30;
const HEADER_WIDTH = 50;
const OVERSCAN_COUNT = 5; // Render 5 extra rows/cols outside viewport

interface CellPosition {
  row: number;
  col: number;
}

interface SpreadsheetGridProps {
  // Sparse cell data (only non-empty cells)
  cells: Map<string, StoredCellData>;
  
  // Grid dimensions
  visibleRows: number;
  visibleCols: number;
  
  // Selection
  selectedCell: CellPosition | null;
  onCellSelect: (position: CellPosition) => void;
  
  // Editing
  onCellChange: (row: number, col: number, value: string) => void;
  
  // Computed values from formula engine
  computedValues: Map<string, number>;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  cells,
  visibleRows,
  visibleCols,
  selectedCell,
  onCellSelect,
  onCellChange,
  computedValues,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  // Calculate viewport
  const viewport = useMemo(() => {
    const containerHeight = containerRef.current?.clientHeight || 600;
    const containerWidth = containerRef.current?.clientWidth || 800;
    
    const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - OVERSCAN_COUNT);
    const endRow = Math.min(
      visibleRows,
      Math.ceil((scrollTop + containerHeight) / CELL_HEIGHT) + OVERSCAN_COUNT
    );
    
    const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - OVERSCAN_COUNT);
    const endCol = Math.min(
      visibleCols,
      Math.ceil((scrollLeft + containerWidth) / CELL_WIDTH) + OVERSCAN_COUNT
    );
    
    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, visibleRows, visibleCols]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Get cell value (computed or raw)
  const getCellValue = useCallback((row: number, col: number): string => {
    const key = `${row},${col}`;
    const cell = cells.get(key);
    
    if (!cell) return '';
    
    // If formula, use computed value
    if (cell.formula) {
      const computed = computedValues.get(key);
      return computed !== undefined ? String(computed) : '#ERROR';
    }
    
    // Otherwise use raw value
    return cell.value !== null ? String(cell.value) : '';
  }, [cells, computedValues]);

  // Convert column index to letter (0 -> A, 25 -> Z, 26 -> AA)
  const getColumnLabel = useCallback((col: number): string => {
    let label = '';
    let num = col;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }, []);

  // Render cells
  const renderCells = useMemo(() => {
    const { startRow, endRow, startCol, endCol } = viewport;
    const cellElements: JSX.Element[] = [];

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = `${row},${col}`;
        const value = getCellValue(row, col);
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        
        const style: CSSProperties = {
          position: 'absolute',
          left: HEADER_WIDTH + col * CELL_WIDTH,
          top: HEADER_HEIGHT + row * CELL_HEIGHT,
          width: CELL_WIDTH,
          height: CELL_HEIGHT,
          border: '1px solid #e0e0e0',
          padding: '4px 8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          backgroundColor: isSelected ? '#e3f2fd' : 'white',
          cursor: 'cell',
        };

        cellElements.push(
          <div
            key={key}
            style={style}
            onClick={() => onCellSelect({ row, col })}
          >
            {value}
          </div>
        );
      }
    }

    return cellElements;
  }, [viewport, getCellValue, selectedCell, onCellSelect]);

  // Render column headers
  const renderColumnHeaders = useMemo(() => {
    const { startCol, endCol } = viewport;
    const headers: JSX.Element[] = [];

    for (let col = startCol; col < endCol; col++) {
      const style: CSSProperties = {
        position: 'absolute',
        left: HEADER_WIDTH + col * CELL_WIDTH,
        top: 0,
        width: CELL_WIDTH,
        height: HEADER_HEIGHT,
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
      };

      headers.push(
        <div key={`col-${col}`} style={style}>
          {getColumnLabel(col)}
        </div>
      );
    }

    return headers;
  }, [viewport, getColumnLabel]);

  // Render row headers
  const renderRowHeaders = useMemo(() => {
    const { startRow, endRow } = viewport;
    const headers: JSX.Element[] = [];

    for (let row = startRow; row < endRow; row++) {
      const style: CSSProperties = {
        position: 'absolute',
        left: 0,
        top: HEADER_HEIGHT + row * CELL_HEIGHT,
        width: HEADER_WIDTH,
        height: CELL_HEIGHT,
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
      };

      headers.push(
        <div key={`row-${row}`} style={style}>
          {row + 1}
        </div>
      );
    }

    return headers;
  }, [viewport]);

  // Total content dimensions
  const contentWidth = HEADER_WIDTH + visibleCols * CELL_WIDTH;
  const contentHeight = HEADER_HEIGHT + visibleRows * CELL_HEIGHT;

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: contentWidth,
          height: contentHeight,
        }}
      >
        {/* Corner cell */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />
        
        {/* Headers */}
        {renderColumnHeaders}
        {renderRowHeaders}
        
        {/* Cells */}
        {renderCells}
      </div>
    </Box>
  );
};
