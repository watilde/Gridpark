import React from 'react';
import { CellData, CellStyle, CellPosition, CellRange } from '../../../types/excel';
import { styled } from "@mui/joy/styles";
import { excelPalette } from "./theme";

const Cell = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "selected" &&
    prop !== "inRange" &&
    prop !== "customStyle" &&
    prop !== "matchState",
})<{ selected: boolean; inRange: boolean; customStyle?: CellStyle; matchState?: "current" | "match" | null }>(({ selected, inRange, customStyle, matchState, theme }) => {
  const baseBackground = customStyle?.backgroundColor || excelPalette.gridBackground;
  let backgroundColor = baseBackground;
  let border = `1px solid ${excelPalette.cellBorder}`;

  if (matchState === "current") {
    backgroundColor = excelPalette.cellCurrent;
  } else if (matchState === "match") {
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
    padding: "4px 8px",
    cursor: "cell",
    backgroundColor,
    color: customStyle?.color || excelPalette.gridText,
    fontWeight: customStyle?.fontWeight || "normal",
    fontStyle: customStyle?.fontStyle || "normal",
    textAlign: (customStyle?.textAlign as any) || "left",
    fontSize: customStyle?.fontSize || "inherit",
    ...(customStyle?.border && { border: customStyle.border }),
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      backgroundColor: selected ? excelPalette.cellSelected : excelPalette.cellHover,
    },
  };
});

const CellInput = styled("input")({
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  font: "inherit",
  color: "inherit",
  padding: 0,
  margin: 0,
});

// Let's define the component cleanly assuming props are spread
export const CellItem = React.memo((props: any) => {
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
    let matchState: "current" | "match" | null = null;
    if (
      currentSearchMatch &&
      currentSearchMatch.row === rowIndex &&
      currentSearchMatch.col === columnIndex
    ) {
      matchState = "current";
    } else if (searchMatchMap.has(cellKey)) {
      matchState = "match";
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
    const hasError = cell.value === "#ERROR"; // Assuming #ERROR signifies an error cell

    return (
      <Cell
          key={cellKey}
          style={style}
          className="cell" // Generalized class name
          data-sheet-name={currentSheetName}
          data-row-num={rowIndex + 1}
          data-col-id={getColumnLabel(columnIndex)}
          data-cell-address={cellAddress}
          data-cell-value={cell.value !== null && cell.value !== undefined ? String(cell.value) : undefined}
          data-cell-type={cell.type === "empty" ? undefined : cell.type} // Only include if not empty
          data-in-range={isInRange ? "true" : undefined}
          data-active={isActive ? "true" : undefined}
          data-selected={isActive ? "true" : undefined} // Add data-selected attribute
          data-error={hasError ? "true" : undefined}
          selected={isActive} // 'selected' prop already covers this for styling
          inRange={isInRange} // 'inRange' prop already covers this for styling
          customStyle={cellStyles.get(cellKey)}
          matchState={matchState}
          onMouseDown={() => onCellMouseDown(rowIndex, columnIndex)}
          onMouseEnter={() => onCellMouseEnter(rowIndex, columnIndex)}
      >
          <CellInput
              value={cell.value !== null && cell.value !== undefined ? String(cell.value) : ""}
              onChange={(event) => onCellChange(rowIndex, columnIndex, event.target.value)}
          />
      </Cell>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to avoid re-renders if not necessary
    // This is optimization, but for now let's rely on React.memo with default shallow comparison
    // However, 'sheetData' prop changes ref every edit. Shallow compare will fail.
    // We might need granular comparison if performance is bad.
    // For now, default is fine to ensure correctness (it will re-render, but input focus should be preserved if component tree is stable).
    return false; // Always re-render for now to ensure updates
});
