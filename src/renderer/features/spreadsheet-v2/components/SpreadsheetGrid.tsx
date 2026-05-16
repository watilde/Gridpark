/**
 * SpreadsheetGrid - Lightweight virtualized grid component with editing
 */

import React, { useRef, useCallback, useMemo, CSSProperties, useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/joy';
import { StoredCellData, CellStyleData } from '../../../../lib/db';
import { useSelector } from 'react-redux';
import { selectTransientHighlights } from '../../../../stores/spreadsheetSlice';
import { parseA1Range, isCellInRange } from '../../../../lib/utils';

// Constants
const CELL_WIDTH = 100;
const CELL_HEIGHT = 28;
const HEADER_HEIGHT = 30;
const HEADER_WIDTH = 50;
const OVERSCAN_COUNT = 5;

interface CellPosition {
  row: number;
  col: number;
}

interface SpreadsheetGridProps {
  cells: Map<string, StoredCellData>;
  cellStylesWithCF?: Map<string, CellStyleData>;
  visibleRows: number;
  visibleCols: number;
  selectedCell: CellPosition | null;
  onCellSelect: (position: CellPosition) => void;
  selectedRange: { start: CellPosition; end: CellPosition } | null;
  onRangeSelect?: (range: { start: CellPosition; end: CellPosition }) => void;
  onCellChange: (row: number, col: number, value: string) => void;
  onDelete?: () => void;
  computedValues: Map<string, any>;
  searchQuery?: string;
  activeDrawTool?: 'pen' | 'highlighter' | 'eraser' | null;
  penColor?: string;
  tabId?: string;
}

const colToLabel = (col: number): string => {
  let label = '';
  let n = col + 1;
  while (n > 0) {
    label = String.fromCharCode(64 + ((n - 1) % 26 + 1)) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
};

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
  tabId,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (isEditing) return;

      switch (e.key) {
        case 'ArrowDown':
          if (row + 1 < visibleRows) onCellSelect({ row: row + 1, col });
          break;
        case 'ArrowUp':
          if (row > 0) onCellSelect({ row: row - 1, col });
          break;
        case 'ArrowRight':
          if (col + 1 < visibleCols) onCellSelect({ row, col: col + 1 });
          break;
        case 'ArrowLeft':
          if (col > 0) onCellSelect({ row, col: col - 1 });
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            if (col > 0) onCellSelect({ row, col: col - 1 });
          } else {
            if (col + 1 < visibleCols) onCellSelect({ row, col: col + 1 });
          }
          break;
        case 'F2':
        case 'Enter':
          setIsEditing(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, visibleRows, visibleCols, onCellSelect, isEditing]);

  // Transient highlights for API sync feedback
  const allHighlights = useSelector(selectTransientHighlights);
  const activeHighlights = useMemo(() => {
    if (!tabId) return [];
    return allHighlights
      .filter(h => h.tabId === tabId)
      .map(h => parseA1Range(h.address));
  }, [allHighlights, tabId]);

  // Calculate viewport
  const viewport = useMemo(() => {
    const containerHeight = containerRef.current?.clientHeight || 600;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - OVERSCAN_COUNT);
    const endRow = Math.min(visibleRows, Math.ceil((scrollTop + containerHeight) / CELL_HEIGHT) + OVERSCAN_COUNT);
    const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - OVERSCAN_COUNT);
    const endCol = Math.min(visibleCols, Math.ceil((scrollLeft + containerWidth) / CELL_WIDTH) + OVERSCAN_COUNT);
    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, visibleRows, visibleCols]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  const getCellValue = useCallback((row: number, col: number): string => {
    const key = `${row},${col}`;
    const cell = cells.get(key);
    if (!cell) return '';
    if (cell.formula) {
      const computed = computedValues.get(key);
      return computed !== undefined ? String(computed) : '#ERROR';
    }
    return cell.value !== null ? String(cell.value) : '';
  }, [cells, computedValues]);

  const getCellStyle = useCallback((row: number, col: number): CSSProperties => {
    const key = `${row},${col}`;
    const style = cellStylesWithCF?.get(key) || cells.get(key)?.style;
    if (!style) return {};
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
    };
  }, [cells, cellStylesWithCF]);

  // Row/column headers with sticky-via-scroll positioning
  const renderHeaders = useMemo(() => {
    const { startCol, endCol, startRow, endRow } = viewport;
    const primaryColor = theme.palette.primary.outlinedColor as string;
    const dividerColor = theme.palette.divider as string;
    const headerBg = theme.palette.background.level1 as string;
    const textSecondary = theme.palette.text.secondary as string;
    const gridBorder = `1px solid ${dividerColor}`;
    const elements: JSX.Element[] = [];

    // Corner box
    elements.push(
      <Box key="corner" sx={{
        position: 'absolute',
        left: scrollLeft,
        top: scrollTop,
        width: HEADER_WIDTH,
        height: HEADER_HEIGHT,
        zIndex: 4,
        backgroundColor: headerBg,
        borderRight: gridBorder,
        borderBottom: gridBorder,
      }} />
    );

    // Column headers (A, B, C...)
    for (let col = startCol; col < endCol; col++) {
      const isActive = selectedCell?.col === col;
      elements.push(
        <Box key={`ch-${col}`} sx={{
          position: 'absolute',
          left: HEADER_WIDTH + col * CELL_WIDTH,
          top: scrollTop,
          width: CELL_WIDTH,
          height: HEADER_HEIGHT,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: isActive ? 700 : 500,
          letterSpacing: '0.04em',
          backgroundColor: isActive ? `${primaryColor}1A` : headerBg,
          color: isActive ? primaryColor : textSecondary,
          borderRight: gridBorder,
          borderBottom: isActive ? `2px solid ${primaryColor}` : gridBorder,
          userSelect: 'none',
          cursor: 'default',
          transition: 'background-color 0.1s, color 0.1s',
        }}>
          {colToLabel(col)}
        </Box>
      );
    }

    // Row headers (1, 2, 3...)
    for (let row = startRow; row < endRow; row++) {
      const isActive = selectedCell?.row === row;
      elements.push(
        <Box key={`rh-${row}`} sx={{
          position: 'absolute',
          left: scrollLeft,
          top: HEADER_HEIGHT + row * CELL_HEIGHT,
          width: HEADER_WIDTH,
          height: CELL_HEIGHT,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: isActive ? 700 : 400,
          backgroundColor: isActive ? `${primaryColor}1A` : headerBg,
          color: isActive ? primaryColor : textSecondary,
          borderRight: isActive ? `2px solid ${primaryColor}` : gridBorder,
          borderBottom: gridBorder,
          userSelect: 'none',
          cursor: 'default',
          transition: 'background-color 0.1s, color 0.1s',
        }}>
          {row + 1}
        </Box>
      );
    }

    return elements;
  }, [viewport, scrollTop, scrollLeft, selectedCell, theme]);

  const renderCells = useMemo(() => {
    const { startRow, endRow, startCol, endCol } = viewport;
    const primaryColor = theme.palette.primary.outlinedColor as string;
    const dividerColor = theme.palette.divider as string;
    const gridBorder = `1px solid ${dividerColor}`;
    const cellElements: JSX.Element[] = [];
    const lowerQuery = searchQuery?.toLowerCase();

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = `${row},${col}`;
        const isHighlighted = activeHighlights.some(range => isCellInRange(row, col, range));
        const isInRange = selectedRange &&
          row >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
          row <= Math.max(selectedRange.start.row, selectedRange.end.row) &&
          col >= Math.min(selectedRange.start.col, selectedRange.end.col) &&
          col <= Math.max(selectedRange.start.col, selectedRange.end.col);
        const cellStyle = getCellStyle(row, col);
        const value = getCellValue(row, col);
        const isSearchMatch = lowerQuery && value.toLowerCase().includes(lowerQuery);

        let bgOverride: string | undefined;
        if (isHighlighted) bgOverride = 'rgba(45, 90, 241, 0.30)';
        else if (isSearchMatch) bgOverride = 'rgba(255, 200, 0, 0.28)';
        else if (isInRange) bgOverride = `${primaryColor}14`;

        cellElements.push(
          <Box
            key={key}
            onClick={() => onCellSelect({ row, col })}
            onDoubleClick={() => { onCellSelect({ row, col }); setIsEditing(true); }}
            sx={{
              position: 'absolute',
              left: HEADER_WIDTH + col * CELL_WIDTH,
              top: HEADER_HEIGHT + row * CELL_HEIGHT,
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              borderRight: gridBorder,
              borderBottom: gridBorder,
              padding: '0 8px',
              fontSize: '13px',
              lineHeight: `${CELL_HEIGHT}px`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              cursor: 'cell',
              boxSizing: 'border-box',
              ...cellStyle,
              ...(bgOverride ? { backgroundColor: bgOverride } : {}),
              transition: isHighlighted ? 'none' : 'background-color 0.15s ease-out',
              zIndex: isHighlighted ? 1 : 0,
            }}
          >
            {value}
          </Box>
        );
      }
    }
    return cellElements;
  }, [viewport, activeHighlights, selectedRange, getCellStyle, getCellValue, searchQuery, onCellSelect, theme]);

  const primaryColor = theme.palette.primary.outlinedColor as string;
  const dividerColor = theme.palette.divider as string;
  const surfaceBg = theme.palette.background.surface as string;
  const textPrimary = theme.palette.text.primary as string;
  const textSecondary = theme.palette.text.secondary as string;

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: surfaceBg,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { width: 8, height: 8 },
        '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: dividerColor,
          borderRadius: 4,
          border: `2px solid ${surfaceBg}`,
          '&:hover': { backgroundColor: textSecondary },
        },
      }}
    >
      <Box
        sx={{
          width: HEADER_WIDTH + visibleCols * CELL_WIDTH,
          height: HEADER_HEIGHT + visibleRows * CELL_HEIGHT,
          position: 'relative',
        }}
      >
        {renderCells}
        {renderHeaders}

        {/* Selected cell border overlay */}
        {selectedCell && !isEditing && (
          <>
            <Box sx={{
              position: 'absolute',
              left: HEADER_WIDTH + selectedCell.col * CELL_WIDTH - 1,
              top: HEADER_HEIGHT + selectedCell.row * CELL_HEIGHT - 1,
              width: CELL_WIDTH + 2,
              height: CELL_HEIGHT + 2,
              border: `2px solid ${primaryColor}`,
              zIndex: 5,
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }} />
            {/* Fill handle */}
            <Box sx={{
              position: 'absolute',
              left: HEADER_WIDTH + (selectedCell.col + 1) * CELL_WIDTH - 5,
              top: HEADER_HEIGHT + (selectedCell.row + 1) * CELL_HEIGHT - 5,
              width: 7,
              height: 7,
              backgroundColor: primaryColor,
              zIndex: 6,
              cursor: 'crosshair',
              border: `1.5px solid ${surfaceBg}`,
            }} />
          </>
        )}

        {/* Inline editor */}
        {isEditing && selectedCell && (
          <input
            style={{
              position: 'absolute',
              left: HEADER_WIDTH + selectedCell.col * CELL_WIDTH,
              top: HEADER_HEIGHT + selectedCell.row * CELL_HEIGHT,
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              border: `2px solid ${primaryColor}`,
              padding: '0 8px',
              fontSize: '13px',
              outline: 'none',
              zIndex: 10,
              backgroundColor: surfaceBg,
              color: textPrimary,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            autoFocus
            defaultValue={getCellValue(selectedCell.row, selectedCell.col)}
            onBlur={e => {
              onCellChange(selectedCell.row, selectedCell.col, e.target.value);
              setIsEditing(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') setIsEditing(false);
              if (e.key === 'Enter') {
                onCellChange(selectedCell.row, selectedCell.col, (e.target as HTMLInputElement).value);
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
          />
        )}
      </Box>
    </Box>
  );
};
