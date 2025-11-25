import React, { useState, useEffect, useRef } from 'react';
import { _CellData, CellStyle, _CellPosition, _CellRange } from '../../../types/excel';
import { styled } from '@mui/joy/styles';
import { excelPalette } from './theme';

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
        customStyle={cellStyles.get(cellKey)}
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
  (__prevProps, __nextProps) => {
    // Custom comparison to avoid re-renders if not necessary
    // This is optimization, but for now let's rely on React.memo with default shallow comparison
    // However, 'sheetData' prop changes ref every edit. Shallow compare will fail.
    // We might need granular comparison if performance is bad.
    // For now, default is fine to ensure correctness (it will re-render, but input focus should be preserved if component tree is stable).
    return false; // Always re-render for now to ensure updates
  }
);
