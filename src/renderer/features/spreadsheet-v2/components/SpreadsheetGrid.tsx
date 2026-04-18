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
import { Box, Input, useTheme } from '@mui/joy';
import { StoredCellData, CellStyleData } from '../../../../lib/db';
import { TransientHighlight } from '../../../../stores/spreadsheetSlice';

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

  // Deleting
  onDelete?: () => void;

  // Computed values from formula engine
  computedValues: Map<string, any>;

  // Search
  searchQuery?: string;

  // Drawing
  activeDrawTool?: 'pen' | 'highlighter' | 'eraser' | null;
  penColor?: string;

  // Transient UI State
  transientHighlights?: TransientHighlight[];
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
  onDelete,
  computedValues,
  searchQuery,
  activeDrawTool,
  penColor = '#000000',
  transientHighlights = [],
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Editing state
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);

  // Drawing state
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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

  // Total content dimensions
  const contentWidth = HEADER_WIDTH + visibleCols * CELL_WIDTH;
  const contentHeight = HEADER_HEIGHT + visibleRows * CELL_HEIGHT;

  // Handle canvas drawing
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activeDrawTool || !canvasRef.current) return;
    
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [activeDrawTool]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing.current || !activeDrawTool || !canvasRef.current || !lastPos.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentX, currentY);
    
    if (activeDrawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeDrawTool === 'highlighter' ? `${penColor}50` : penColor; // 50% opacity for highlighter
      ctx.lineWidth = activeDrawTool === 'highlighter' ? 15 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    
    ctx.stroke();
    lastPos.current = { x: currentX, y: currentY };
  }, [activeDrawTool, penColor]);

  const handleCanvasMouseUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  // Get cell value (computed or raw)
  const getCellValue = useCallback(
    (row: number, col: number): string => {
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
    },
    [cells, computedValues]
  );

  // Get cell style (with conditional formatting applied)
  const getCellStyle = useCallback(
    (row: number, col: number): CSSProperties => {
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
        borderTop: style.borderTop,
        borderRight: style.borderRight,
        borderBottom: style.borderBottom,
        borderLeft: style.borderLeft,
        border: style.border,
      };
    },
    [cells, cellStylesWithCF]
  );

  // Check if cell matches search query
  const isSearchMatch = useCallback(
    (row: number, col: number): boolean => {
      if (!searchQuery || searchQuery.trim() === '') return false;

      const value = getCellValue(row, col);
      return value.toLowerCase().includes(searchQuery.toLowerCase());
    },
    [searchQuery, getCellValue]
  );

  // Check if cell is in selected range
  const isInRange = useCallback(
    (row: number, col: number): boolean => {
      if (!selectedRange) return false;

      const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);

      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    },
    [selectedRange]
  );

  // Get raw cell value for editing (formula or value)
  const getRawCellValue = useCallback(
    (row: number, col: number): string => {
      const key = `${row},${col}`;
      const cell = cells.get(key);

      if (!cell) return '';

      // If formula, return formula (with =)
      if (cell.formula) {
        return cell.formula; // Already includes '='
      }

      // Otherwise return raw value
      return cell.value !== null ? String(cell.value) : '';
    },
    [cells]
  );

  // Start editing
  const startEditing = useCallback(
    (row: number, col: number) => {
      const rawValue = getRawCellValue(row, col);
      setEditingCell({ row, col });
      setEditValue(rawValue);

      // Focus and select input after render
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    },
    [getRawCellValue]
  );

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
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      if (activeDrawTool) return; // Disable edit when drawing
      startEditing(row, col);
    },
    [startEditing, activeDrawTool]
  );

  const getColumnLabel = useCallback((col: number): string => {
    let label = '';
    let num = col;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }, []);

  // Copy as Markdown Table (Developer delight feature)
  const copyAsMarkdown = useCallback(async () => {
    const range = selectedRange || (selectedCell ? { start: selectedCell, end: selectedCell } : null);
    if (!range) return;

    const minRow = Math.min(range.start.row, range.end.row);
    const maxRow = Math.max(range.start.row, range.end.row);
    const minCol = Math.min(range.start.col, range.end.col);
    const maxCol = Math.max(range.start.col, range.end.col);

    let markdown = '| ';
    for (let c = minCol; c <= maxCol; c++) {
      markdown += getColumnLabel(c) + ' | ';
    }
    markdown += '\n| ';
    for (let c = minCol; c <= maxCol; c++) {
      markdown += '--- | ';
    }
    markdown += '\n';

    for (let r = minRow; r <= maxRow; r++) {
      markdown += '| ';
      for (let c = minCol; c <= maxCol; c++) {
        markdown += getCellValue(r, c) + ' | ';
      }
      markdown += '\n';
    }

    try {
      await navigator.clipboard.writeText(markdown);
      console.log('[Grid] Copied as Markdown Table');
    } catch (err) {
      console.error('[Grid] Failed to copy markdown:', err);
    }
  }, [selectedRange, selectedCell, getCellValue, getColumnLabel]);

  // Handle Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If already editing, don't interfere
      if (editingCell) return;

      // If no cell selected, ignore
      if (!selectedCell) return;

      // Delete / Backspace: clear cell(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (onDelete) onDelete();
        else onCellChange(selectedCell.row, selectedCell.col, '');
        return;
      }

      // Copy as Markdown: Ctrl/Cmd + Shift + C
      if (e.key === 'C' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        copyAsMarkdown();
        return;
      }

      // Navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
        let newRow = selectedCell.row;
        let newCol = selectedCell.col;

        if (e.key === 'ArrowUp') newRow = Math.max(0, newRow - 1);
        if (e.key === 'ArrowDown') newRow = Math.min(visibleRows - 1, newRow + 1);
        if (e.key === 'ArrowLeft') newCol = Math.max(0, newCol - 1);
        if (e.key === 'ArrowRight') newCol = Math.min(visibleCols - 1, newCol + 1);
        
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            newCol = Math.max(0, newCol - 1);
          } else {
            newCol = Math.min(visibleCols - 1, newCol + 1);
          }
        }

        if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
          onCellSelect({ row: newRow, col: newCol });
        }
        return;
      }

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

      // Typing any printable character: start editing (Type-to-Overwrite)
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
  }, [selectedCell, editingCell, startEditing, onCellSelect, visibleRows, visibleCols, onDelete, onCellChange, copyAsMarkdown]);

  // Auto-scroll to keep selected cell in view
  useEffect(() => {
    if (!selectedCell || !containerRef.current) return;

    const { row, col } = selectedCell;
    const container = containerRef.current;
    
    const cellTop = HEADER_HEIGHT + row * CELL_HEIGHT;
    const cellBottom = cellTop + CELL_HEIGHT;
    const cellLeft = HEADER_WIDTH + col * CELL_WIDTH;
    const cellRight = cellLeft + CELL_WIDTH;

    const viewportTop = container.scrollTop;
    const viewportBottom = viewportTop + container.clientHeight;
    const viewportLeft = container.scrollLeft;
    const viewportRight = viewportLeft + container.clientWidth;

    const effectiveViewportTop = viewportTop + HEADER_HEIGHT;
    const effectiveViewportLeft = viewportLeft + HEADER_WIDTH;

    let newScrollTop = viewportTop;
    let newScrollLeft = viewportLeft;

    if (cellTop < effectiveViewportTop) {
      newScrollTop = cellTop - HEADER_HEIGHT;
    } else if (cellBottom > viewportBottom) {
      newScrollTop = cellBottom - container.clientHeight;
    }

    if (cellLeft < effectiveViewportLeft) {
      newScrollLeft = cellLeft - HEADER_WIDTH;
    } else if (cellRight > viewportRight) {
      newScrollLeft = cellRight - container.clientWidth;
    }

    if (newScrollTop !== viewportTop || newScrollLeft !== viewportLeft) {
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          top: Math.max(0, newScrollTop),
          left: Math.max(0, newScrollLeft),
          behavior: 'auto',
        });
      } else {
        container.scrollTop = Math.max(0, newScrollTop);
        container.scrollLeft = Math.max(0, newScrollLeft);
      }
    }
  }, [selectedCell]);

  // Handle keyboard in edit mode
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (activeDrawTool) return;
      
      e.preventDefault();

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
        setIsSelecting(true);
        setSelectionStart({ row, col });
        onCellSelect({ row, col });
      }
    },
    [selectedCell, onCellSelect, onRangeSelect, activeDrawTool]
  );

  // Handle cell mouse enter (extend selection)
  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (activeDrawTool) return;
      
      if (isSelecting && selectionStart) {
        const range = {
          start: selectionStart,
          end: { row, col },
        };
        if (onRangeSelect) {
          onRangeSelect(range);
        }
      }
    },
    [isSelecting, selectionStart, onRangeSelect, activeDrawTool]
  );

  // Handle mouse up (end selection)
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Parse A1 address to row/col ranges for highlight check
  const highlightedRanges = useMemo(() => {
    return transientHighlights.map(h => {
      const parts = h.address.split(':');
      const start = parseA1(parts[0]);
      const end = parts[1] ? parseA1(parts[1]) : start;
      return {
        startRow: Math.min(start.row, end.row),
        startCol: Math.min(start.col, end.col),
        endRow: Math.max(start.row, end.row),
        endCol: Math.max(start.col, end.col)
      };
    });
    
    function parseA1(address: string) {
      const match = address.match(/^([A-Z]+)([0-9]+)$/);
      if (!match) return { row: -1, col: -1 };
      const letters = match[1];
      const row = parseInt(match[2], 10) - 1;
      let col = 0;
      for (let i = 0; i < letters.length; i++) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
      }
      return { row, col: col - 1 };
    }
  }, [transientHighlights]);

  const isCellHighlighted = useCallback((row: number, col: number) => {
    return highlightedRanges.some(r => 
      row >= r.startRow && row <= r.endRow && col >= r.startCol && col <= r.endCol
    );
  }, [highlightedRanges]);

  // Render cells
  const renderCells = useMemo(() => {
    const { startRow, endRow, startCol, endCol } = viewport;
    const cellElements: JSX.Element[] = [];

    const borderColor = '#E1E4EB';
    const cellBg = theme.palette.background.surface;
    const rangeBg = theme.palette.primary.softHoverBg;
    const matchBg = theme.palette.warning.softBg;
    const textColor = theme.palette.text.primary;
    const neonGreen = '#39FF14';
    const highlightColor = 'rgba(45, 90, 241, 0.3)';

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = `${row},${col}`;
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const isEditing = editingCell?.row === row && editingCell?.col === col;
        const isHighlighted = isCellHighlighted(row, col);

        if (isEditing) {
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
                slotProps={{ input: { ref: inputRef } }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
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
            border: `1px solid ${borderColor}`,
            padding: '4px 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            backgroundColor: inRange ? rangeBg : isMatch ? matchBg : cellBg,
            color: textColor,
            cursor: 'cell',
            fontSize: '13px',
            ...cellStyle,
            ...(isSelected && {
              outline: `2px solid ${neonGreen}`,
              outlineOffset: '-2px',
              zIndex: 10,
              backgroundColor: 'transparent',
            }),
            ...(inRange && !isSelected && { backgroundColor: rangeBg }),
            ...(isMatch && !isSelected && !inRange && { backgroundColor: matchBg }),
          };

          cellElements.push(
            <div
              key={key}
              style={style}
              onMouseDown={e => handleCellMouseDown(row, col, e)}
              onMouseEnter={() => handleCellMouseEnter(row, col)}
              onDoubleClick={() => handleCellDoubleClick(row, col)}
            >
              {value}
              {/* Sync Highlight Overlay */}
              {isHighlighted && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: highlightColor,
                    animation: 'fadeout 0.2s ease-out forwards',
                    '@keyframes fadeout': {
                      from: { opacity: 1 },
                      to: { opacity: 0 },
                    },
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              )}
              {/* Chunky Handle for selected cell (DA/PO spec) */}
              {isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -3,
                    right: -3,
                    width: '6px',
                    height: '6px',
                    backgroundColor: neonGreen,
                    border: '1px solid white',
                    zIndex: 11,
                    cursor: 'nwse-resize', // Correct cursor per DA spec
                  }}
                />
              )}
            </div>
          );
        }
      }
    }

    return cellElements;
  }, [
    viewport, getCellValue, getCellStyle, isSearchMatch, isInRange, selectedCell,
    editingCell, editValue, handleCellMouseDown, handleCellMouseEnter,
    handleCellDoubleClick, handleEditKeyDown, commitEdit, theme, isCellHighlighted
  ]);

  // Render column headers
  const renderColumnHeaders = useMemo(() => {
    const { startCol, endCol } = viewport;
    const headers: JSX.Element[] = [];
    const headerBg = theme.palette.background.level1;
    const borderColor = '#E1E4EB';
    const textColor = theme.palette.text.secondary;
    const violet = '#7C3AED';

    for (let col = startCol; col < endCol; col++) {
      const isColumnSelected = selectedCell?.col === col;
      const style: CSSProperties = {
        position: 'absolute', 
        left: HEADER_WIDTH + col * CELL_WIDTH,
        top: 0,
        width: CELL_WIDTH,
        height: HEADER_HEIGHT,
        border: `1px solid ${borderColor}`,
        backgroundColor: isColumnSelected ? violet : headerBg,
        color: isColumnSelected ? '#FFFFFF' : textColor,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontFamily: "'Caveat', cursive",
      };

      headers.push(
        <div key={`col-${col}`} style={style}>
          {getColumnLabel(col)}
        </div>
      );
    }

    return headers;
  }, [viewport, getColumnLabel, theme, selectedCell]);

  // Render row headers
  const renderRowHeaders = useMemo(() => {
    const { startRow, endRow } = viewport;
    const headers: JSX.Element[] = [];
    const headerBg = theme.palette.background.level1;
    const borderColor = '#E1E4EB';
    const textColor = theme.palette.text.secondary;
    const violet = '#7C3AED';

    for (let row = startRow; row < endRow; row++) {
      const isRowSelected = selectedCell?.row === row;
      const style: CSSProperties = {
        position: 'absolute', 
        left: 0,
        top: HEADER_HEIGHT + row * CELL_HEIGHT,
        width: HEADER_WIDTH,
        height: CELL_HEIGHT,
        border: `1px solid ${borderColor}`,
        backgroundColor: isRowSelected ? violet : headerBg,
        color: isRowSelected ? '#FFFFFF' : textColor,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontFamily: "'Caveat', cursive",
      };

      headers.push(
        <div key={`row-${row}`} style={style}>
          {row + 1}
        </div>
      );
    }

    return headers;
  }, [viewport, theme, selectedCell]);

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: theme.palette.background.body,
        cursor: activeDrawTool ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewport="0 0 24 24" fill="black"><circle cx="12" cy="12" r="6" /></svg>') 12 12, auto` : 'default',
      }}
    >
      <div style={{ position: 'relative', width: contentWidth, height: contentHeight }}>
        <canvas
          ref={canvasRef}
          width={contentWidth}
          height={contentHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: activeDrawTool ? 'auto' : 'none', zIndex: 50 }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
        <div style={{ position: 'absolute', left: 0, top: 0, width: HEADER_WIDTH, height: HEADER_HEIGHT, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.level1, zIndex: 10 }} />
        {renderColumnHeaders}
        {renderRowHeaders}
        {renderCells}
      </div>
    </Box>
  );
};
