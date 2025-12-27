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
import { StoredCellData, CellStyleData } from '../../../../lib/db';

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
  
  // Cell styles with conditional formatting applied
  cellStylesWithCF?: Map<string, CellStyleData>;
  
  // Grid dimensions
  visibleRows: number;
  visibleCols: number;
  
  // Selection
  selectedCell: CellPosition | null;
  onCellSelect: (position: CellPosition) => void;
  
  // Range selection
  selectedRange: { start: CellPosition; end: CellPosition } | null;
  onRangeSelect?: (range: { start: CellPosition; end: CellPosition }) => void;
  
  // Editing
  onCellChange: (row: number, col: number, value: string) => void;
  
  // Computed values from formula engine
  computedValues: Map<string, any>;
  
  // Search
  searchQuery?: string;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  cells,
  cellStylesWithCF,
  visibleRows,
  visibleCols,
  selectedCell,
  onCellSelect,
  selectedRange,
  onRangeSelect,
  onCellChange,
  computedValues,
  searchQuery,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);

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

  // Get cell style (with conditional formatting applied)
  const getCellStyle = useCallback((row: number, col: number): CSSProperties => {
    const key = `${row},${col}`;
    
    // Use cellStylesWithCF if available (includes conditional formatting)
    const style = cellStylesWithCF?.get(key) || cells.get(key)?.style;
    
    if (!style) return {};
    
    // Convert CellStyleData to CSSProperties
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textDecoration: style.textDecoration,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      textAlign: style.textAlign as any,
      verticalAlign: style.verticalAlign as any,
      border: style.border,
      borderTop: style.borderTop,
      borderRight: style.borderRight,
      borderBottom: style.borderBottom,
      borderLeft: style.borderLeft,
    };
  }, [cells, cellStylesWithCF]);

  // Check if cell matches search query
  const isSearchMatch = useCallback((row: number, col: number): boolean => {
    if (!searchQuery || searchQuery.trim() === '') return false;
    
    const value = getCellValue(row, col);
    return value.toLowerCase().includes(searchQuery.toLowerCase());
  }, [searchQuery, getCellValue]);

  // Check if cell is in selected range
  const isInRange = useCallback((row: number, col: number): boolean => {
    if (!selectedRange) return false;
    
    const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
    const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
    const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
    const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectedRange]);

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

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    // If shift is held, extend selection from current selected cell
    if (e.shiftKey && selectedCell) {
      setSelectionStart(selectedCell);
      const range = {
        start: selectedCell,
        end: { row, col },
      };
      if (onRangeSelect) {
        onRangeSelect(range);
      }
    } else {
      // Start new selection
      setIsSelecting(true);
      setSelectionStart({ row, col });
      onCellSelect({ row, col });
    }
  }, [selectedCell, onCellSelect, onRangeSelect]);

  // Handle cell mouse enter (extend selection)
  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (isSelecting && selectionStart) {
      const range = {
        start: selectionStart,
        end: { row, col },
      };
      if (onRangeSelect) {
        onRangeSelect(range);
      }
    }
  }, [isSelecting, selectionStart, onRangeSelect]);

  // Handle mouse up (end selection)
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Global mouse up listener
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);
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
          const cellStyle = getCellStyle(row, col);
          const isMatch = isSearchMatch(row, col);
          const inRange = isInRange(row, col);
          
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
            backgroundColor: isSelected ? '#e3f2fd' : (inRange ? '#e8f5e9' : (isMatch ? '#fff59d' : 'white')),
            cursor: 'cell',
            fontSize: '13px',
            // Apply cell-specific styles (override defaults)
            ...cellStyle,
            // But always keep selection/range/search background
            ...(isSelected && { backgroundColor: '#e3f2fd' }),
            ...(inRange && !isSelected && { backgroundColor: '#e8f5e9' }),
            ...(isMatch && !isSelected && !inRange && { backgroundColor: '#fff59d' }),
          };

          cellElements.push(
            <div
              key={key}
              style={style}
              onMouseDown={(e) => handleCellMouseDown(row, col, e)}
              onMouseEnter={() => handleCellMouseEnter(row, col)}
              onDoubleClick={() => handleCellDoubleClick(row, col)}
            >
              {value}
            </div>
          );
        }
      }
    }

    return cellElements;
  }, [viewport, getCellValue, getCellStyle, isSearchMatch, isInRange, selectedCell, editingCell, editValue, handleCellMouseDown, handleCellMouseEnter, handleCellDoubleClick, handleEditKeyDown, commitEdit]);

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
