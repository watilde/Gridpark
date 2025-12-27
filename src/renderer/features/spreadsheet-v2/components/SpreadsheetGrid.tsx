/**
 * SpreadsheetGrid - Lightweight virtualized grid component with editing
 * 
 * Design principles:
 * 1. Virtual scrolling for performance
 * 2. Minimal re-renders
 * 3. Direct cell updates (no full grid clones)
 * 4. Sparse data structure
 * 5. Inline editing support
 */

import React, { useRef, useCallback, useMemo, CSSProperties, useState, useEffect } from 'react';
import { Box, Input } from '@mui/joy';
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
  computedValues: Map<string, any>;
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
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Get raw cell value for editing (formula or value)
  const getRawCellValue = useCallback((row: number, col: number): string => {
    const key = `${row},${col}`;
    const cell = cells.get(key);
    
    if (!cell) return '';
    
    // If formula, return formula (with =)
    if (cell.formula) {
      return cell.formula; // Already includes '='
    }
    
    // Otherwise return raw value
    return cell.value !== null ? String(cell.value) : '';
  }, [cells]);

  // Start editing
  const startEditing = useCallback((row: number, col: number) => {
    const rawValue = getRawCellValue(row, col);
    setEditingCell({ row, col });
    setEditValue(rawValue);
    
    // Focus input after render
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [getRawCellValue]);

  // Commit edit
  const commitEdit = useCallback(() => {
    if (editingCell) {
      onCellChange(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onCellChange]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle double-click to edit
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    startEditing(row, col);
  }, [startEditing]);

  // Handle Enter key on selected cell (start editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If already editing, don't interfere
      if (editingCell) return;
      
      // If no cell selected, ignore
      if (!selectedCell) return;
      
      // Enter: start editing
      if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
      }
      
      // F2: start editing
      if (e.key === 'F2') {
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
      }
      
      // Typing any printable character: start editing
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEditingCell(selectedCell);
        setEditValue(e.key);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, startEditing]);

  // Handle keyboard in edit mode
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }, [commitEdit, cancelEdit]);

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
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const isEditing = editingCell?.row === row && editingCell?.col === col;
        
        if (isEditing) {
          // Render input for editing cell
          const style: CSSProperties = {
            position: 'absolute',
            left: HEADER_WIDTH + col * CELL_WIDTH,
            top: HEADER_HEIGHT + row * CELL_HEIGHT,
            width: CELL_WIDTH,
            height: CELL_HEIGHT,
            zIndex: 100,
          };

          cellElements.push(
            <Box key={key} sx={style}>
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                sx={{
                  width: '100%',
                  height: '100%',
                  '--Input-minHeight': `${CELL_HEIGHT}px`,
                  fontSize: '13px',
                  padding: '4px 8px',
                }}
              />
            </Box>
          );
        } else {
          // Render regular cell
          const value = getCellValue(row, col);
          
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
            fontSize: '13px',
          };

          cellElements.push(
            <div
              key={key}
              style={style}
              onClick={() => onCellSelect({ row, col })}
              onDoubleClick={() => handleCellDoubleClick(row, col)}
            >
              {value}
            </div>
          );
        }
      }
    }

    return cellElements;
  }, [viewport, getCellValue, selectedCell, editingCell, editValue, onCellSelect, handleCellDoubleClick, handleEditKeyDown, commitEdit]);

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
