import React, { useState, useEffect, useRef } from 'react';
import { _CellData, CellStyle, _CellPosition, _CellRange } from '../../../types/excel';
import type { ExcelCellStyle, ExcelColor, ExcelPatternFill } from '../../../../lib/exceljs-types';
import { styled } from '@mui/joy/styles';
import { excelPalette } from './theme';

/**
 * Convert ExcelCellStyle to CSS-like CellStyle for rendering.
 * Handles both ExcelCellStyle (structured) and legacy CellStyle (CSS-like) formats.
 */
function excelStyleToCellStyle(style: ExcelCellStyle | CellStyle | undefined): CellStyle | undefined {
  if (!style) return undefined;

  // If it already looks like a CellStyle (has CSS-like properties), return as-is
  if ('backgroundColor' in style || 'color' in style || 'fontWeight' in style ||
      'fontStyle' in style || 'textAlign' in style || 'fontSize' in style) {
    return style as CellStyle;
  }

  // Convert ExcelCellStyle to CellStyle
  const excelStyle = style as ExcelCellStyle;
  const cellStyle: CellStyle = {};

  // Font properties
  if (excelStyle.font) {
    if (excelStyle.font.color) {
      cellStyle.color = excelColorToCss(excelStyle.font.color);
    }
    if (excelStyle.font.bold) {
      cellStyle.fontWeight = 'bold';
    }
    if (excelStyle.font.italic) {
      cellStyle.fontStyle = 'italic';
    }
    if (excelStyle.font.size) {
      cellStyle.fontSize = excelStyle.font.size + 'px';
    }
  }

  // Fill (background color)
  if (excelStyle.fill && excelStyle.fill.type === 'pattern') {
    const patternFill = excelStyle.fill as ExcelPatternFill;
    if (patternFill.pattern === 'solid' && patternFill.fgColor) {
      cellStyle.backgroundColor = excelColorToCss(patternFill.fgColor);
    }
  }

  // Alignment
  if (excelStyle.alignment?.horizontal) {
    cellStyle.textAlign = excelStyle.alignment.horizontal;
  }

  // Border (simplified: use first available border segment as representative)
  if (excelStyle.border) {
    const segment = excelStyle.border.top || excelStyle.border.bottom ||
                    excelStyle.border.left || excelStyle.border.right;
    if (segment?.style) {
      const width = segment.style === 'thin' ? '1px' : segment.style === 'medium' ? '2px' : segment.style === 'thick' ? '3px' : '1px';
      const color = segment.color ? excelColorToCss(segment.color) : '#000000';
      cellStyle.border = width + ' solid ' + color;
    }
  }

  return Object.keys(cellStyle).length > 0 ? cellStyle : undefined;
}

/**
 * Convert ExcelColor to CSS color string.
 */
function excelColorToCss(color: ExcelColor): string | undefined {
  if (color.argb) {
    // ARGB format: 'FFRRGGBB' -> '#RRGGBB'
    const hex = color.argb.length === 8 ? color.argb.substring(2) : color.argb;
    return '#' + hex;
  }
  return undefined;
}

const Cell = styled('div', {
  shouldForwardProp: prop =>
    prop !== 'selected' && prop !== 'inRange' && prop !== 'customStyle' && prop !== 'matchState',
})<{
  selected: boolean;
  inRange: boolean;
  customStyle?: CellStyle;
  matchState?: 'current' | 'match' | null;
}>(({ selected, inRange, customStyle, matchState, theme }) => {
  const baseBackground = customStyle?.backgroundColor || excelPalette.gridBackground;
  let backgroundColor = baseBackground;
  let border = `1px solid ${excelPalette.cellBorder}`;

  if (matchState === 'current') {
    backgroundColor = excelPalette.cellCurrent;
  } else if (matchState === 'match') {
    backgroundColor = excelPalette.cellMatch;
  }
  if (inRange) {
    backgroundColor = excelPalette.cellHover;
  }
  if (selected) {
    backgroundColor = excelPalette.cellSelected;
    border = `2px solid ${theme.palette.primary.solidBg}`; // Use primary color for selected border
  }
  return {
    border,
    padding: '4px 8px',
    cursor: 'cell',
    backgroundColor,
    color: customStyle?.color || excelPalette.gridText,
    fontWeight: customStyle?.fontWeight || 'normal',
    fontStyle: customStyle?.fontStyle || 'normal',
    textAlign: (customStyle?.textAlign as any) || 'left',
    fontSize: customStyle?.fontSize || 'inherit',
    ...(customStyle?.border && { border: customStyle.border }),
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: selected ? excelPalette.cellSelected : excelPalette.cellHover,
    },
  };
});

const CellInput = styled('input')({
  width: '100%',
  height: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  font: 'inherit',
  color: 'inherit',
  padding: 0,
  margin: 0,
});

// Let's define the component cleanly assuming props are spread
export const CellItem = React.memo(
  (props: any) => {
    const {
      columnIndex,
      rowIndex,
      style,
      sheetData,
      selectedCell,
      selectionRange,
      cellStyles,
      searchMatchMap,
      currentSearchMatch,
      currentSheetName,
      onCellMouseDown,
      onCellMouseEnter,
      onCellChange,
      getColumnLabel,
      getCellKey,
      createEmptyCell,
    } = props;

    const cellKey = getCellKey(rowIndex, columnIndex);
    let matchState: 'current' | 'match' | null = null;
    if (
      currentSearchMatch &&
      currentSearchMatch.row === rowIndex &&
      currentSearchMatch.col === columnIndex
    ) {
      matchState = 'current';
    } else if (searchMatchMap.has(cellKey)) {
      matchState = 'match';
    }

    const cell = sheetData?.[rowIndex]?.[columnIndex] || createEmptyCell();

    const isCellInRange = (row: number, col: number): boolean => {
      if (!selectionRange) return false;
      return (
        row >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
        row <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
        col >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
        col <= Math.max(selectionRange.startCol, selectionRange.endCol)
      );
    };

    const cellAddress = `${getColumnLabel(columnIndex)}${rowIndex + 1}`;
    const isActive = selectedCell?.row === rowIndex && selectedCell?.col === columnIndex;
    const isInRange = isCellInRange(rowIndex, columnIndex);
    const hasError = cell.value === '#ERROR'; // Assuming #ERROR signifies an error cell
    
    // Get style from cell data (database) instead of separate cellStyles map
    const cellStyle = excelStyleToCellStyle(cell.style);

    // ========================================================================
    // FIX: Use local state for editing to prevent first character loss
    // ========================================================================
    // PROBLEM: Controlled input + debounced save = first character disappears
    // SOLUTION: Use uncontrolled input with local state during editing

    const [editValue, setEditValue] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const _isEditing = editValue !== null;

    // Update edit value when cell changes externally (e.g., formula recalculation)
    useEffect(() => {
      if (
        !_isEditing &&
        isActive &&
        inputRef.current &&
        document.activeElement === inputRef.current
      ) {
        // If this cell becomes active and input is focused, enter edit mode
        const cellValue = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
        setEditValue(cellValue);
      }
    }, [isActive, cell.value, _isEditing]);

    // Handle input focus (start editing)
    const handleFocus = () => {
      const cellValue = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
      setEditValue(cellValue);
    };

    // Handle input blur (commit changes)
    const handleBlur = () => {
      if (editValue !== null) {
        const cellValue = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
        // Only trigger change if value actually changed
        if (editValue !== cellValue) {
          console.log('[CellRenderer] Committing change', {
            row: rowIndex,
            col: columnIndex,
            oldValue: cellValue,
            newValue: editValue,
          });
          onCellChange(rowIndex, columnIndex, editValue);
        }
        setEditValue(null);
      }
    };

    // Handle input change (update local state)
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(event.target.value);
    };

    // Handle Enter key (commit and stay in cell)
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        inputRef.current?.blur(); // Trigger blur to commit
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setEditValue(null); // Cancel edit
        inputRef.current?.blur();
      }
    };

    // Determine display value
    const displayValue = _isEditing
      ? editValue
      : cell.value !== null && cell.value !== undefined
        ? String(cell.value)
        : '';

    return (
      <Cell
        key={cellKey}
        style={style}
        className="cell" // Generalized class name
        data-sheet-name={currentSheetName}
        data-row-num={rowIndex + 1}
        data-col-id={getColumnLabel(columnIndex)}
        data-cell-address={cellAddress}
        data-cell-value={
          cell.value !== null && cell.value !== undefined ? String(cell.value) : undefined
        }
        data-cell-type={cell.type === 'empty' ? undefined : cell.type} // Only include if not empty
        data-in-range={isInRange ? 'true' : undefined}
        data-active={isActive ? 'true' : undefined}
        data-selected={isActive ? 'true' : undefined} // Add data-selected attribute
        data-error={hasError ? 'true' : undefined}
        selected={isActive} // 'selected' prop already covers this for styling
        inRange={isInRange} // 'inRange' prop already covers this for styling
        customStyle={cellStyle}
        matchState={matchState}
        onMouseDown={() => onCellMouseDown(rowIndex, columnIndex)}
        onMouseEnter={() => onCellMouseEnter(rowIndex, columnIndex)}
      >
        <CellInput
          ref={inputRef}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </Cell>
    );
  },
  (prevProps, nextProps) => {
    // Compare positional props
    if (prevProps.rowIndex !== nextProps.rowIndex) return false;
    if (prevProps.columnIndex !== nextProps.columnIndex) return false;

    // Compare react-window style (position/size)
    const prevStyle = prevProps.style;
    const nextStyle = nextProps.style;
    if (
      prevStyle?.top !== nextStyle?.top ||
      prevStyle?.left !== nextStyle?.left ||
      prevStyle?.width !== nextStyle?.width ||
      prevStyle?.height !== nextStyle?.height
    ) {
      return false;
    }

    // Compare cell data (shallow comparison of the cell at this position)
    const prevCell = prevProps.sheetData?.[prevProps.rowIndex]?.[prevProps.columnIndex];
    const nextCell = nextProps.sheetData?.[nextProps.rowIndex]?.[nextProps.columnIndex];
    if (prevCell !== nextCell) {
      if (!prevCell || !nextCell) return false;
      if (prevCell.value !== nextCell.value) return false;
      if (prevCell.type !== nextCell.type) return false;
      if (prevCell.formula !== nextCell.formula) return false;
      if (prevCell.style !== nextCell.style) {
        if (!prevCell.style || !nextCell.style) return false;
        const ps = excelStyleToCellStyle(prevCell.style);
        const ns = excelStyleToCellStyle(nextCell.style);
        if (
          ps.backgroundColor !== ns.backgroundColor ||
          ps.color !== ns.color ||
          ps.fontWeight !== ns.fontWeight ||
          ps.fontStyle !== ns.fontStyle ||
          ps.textAlign !== ns.textAlign ||
          ps.border !== ns.border ||
          ps.fontSize !== ns.fontSize
        ) {
          return false;
        }
      }
    }

    // Compare whether this cell's selected (active) state changed
    const prevActive =
      prevProps.selectedCell?.row === prevProps.rowIndex &&
      prevProps.selectedCell?.col === prevProps.columnIndex;
    const nextActive =
      nextProps.selectedCell?.row === nextProps.rowIndex &&
      nextProps.selectedCell?.col === nextProps.columnIndex;
    if (prevActive !== nextActive) return false;

    // Compare whether this cell's in-range state changed
    const inRange = (range: any, row: number, col: number): boolean => {
      if (!range) return false;
      return (
        row >= Math.min(range.startRow, range.endRow) &&
        row <= Math.max(range.startRow, range.endRow) &&
        col >= Math.min(range.startCol, range.endCol) &&
        col <= Math.max(range.startCol, range.endCol)
      );
    };
    const prevInRange = inRange(prevProps.selectionRange, prevProps.rowIndex, prevProps.columnIndex);
    const nextInRange = inRange(nextProps.selectionRange, nextProps.rowIndex, nextProps.columnIndex);
    if (prevInRange !== nextInRange) return false;

    // Compare search match state for this cell
    const prevCellKey = prevProps.getCellKey(prevProps.rowIndex, prevProps.columnIndex);
    const nextCellKey = nextProps.getCellKey(nextProps.rowIndex, nextProps.columnIndex);
    const prevIsMatch = prevProps.searchMatchMap?.has(prevCellKey) ?? false;
    const nextIsMatch = nextProps.searchMatchMap?.has(nextCellKey) ?? false;
    if (prevIsMatch !== nextIsMatch) return false;

    // Compare current search match state for this cell
    const prevIsCurrent =
      prevProps.currentSearchMatch?.row === prevProps.rowIndex &&
      prevProps.currentSearchMatch?.col === prevProps.columnIndex;
    const nextIsCurrent =
      nextProps.currentSearchMatch?.row === nextProps.rowIndex &&
      nextProps.currentSearchMatch?.col === nextProps.columnIndex;
    if (prevIsCurrent !== nextIsCurrent) return false;

    // Compare sheet name
    if (prevProps.currentSheetName !== nextProps.currentSheetName) return false;

    // All relevant props are equal — skip re-render
    return true;
  }
);

// Export CellItemData type for ExcelGrid
export interface CellItemData {
  currentSheetName: string;
  sheetData: any[][];
  selectedCell: any;
  selectionRange: any;
  searchMatchMap: Map<string, boolean>;
  currentSearchMatch: { row: number; col: number } | null;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
  getColumnLabel: (index: number) => string;
  getCellKey: (row: number, col: number) => string;
  createEmptyCell: () => any;
}
