import React from 'react';
import { styled } from "@mui/joy/styles";
import { Sheet, Box } from "@mui/joy";
import { excelPalette } from "./theme";
import { VirtualizedGrid, VirtualizedGridRef } from "./VirtualizedGrid";
import { CellItem, CellItemData } from "./CellRenderer";

const ViewerContainer = styled(Sheet)({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  backgroundColor: excelPalette.gridBackground,
  borderRadius: 0,
});

const GridContainer = styled(Box)({
  flex: 1,
  overflow: "hidden",
  position: "relative",
  backgroundColor: excelPalette.gridBackground,
});

const HeaderCell = styled("div")({
  backgroundColor: excelPalette.gridBackground,
  border: `1px solid ${excelPalette.headerBorder}`,
  color: excelPalette.gridText,
  fontWeight: 600,
  fontSize: "12px",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
}) as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 'data-col-id'?: string; 'data-col-index'?: number; className?: string }>;

const RowHeaderCell = styled("div")({
  backgroundColor: excelPalette.gridBackground,
  border: `1px solid ${excelPalette.headerBorder}`,
  color: excelPalette.gridText,
  fontWeight: 600,
  fontSize: "12px",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
}) as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 'data-row-num'?: number; 'data-row-index'?: number; className?: string }>;

interface ExcelGridProps {
  currentSheetName: string;
  renderColCount: number;
  renderRowCount: number;
  getColumnWidth: (index: number) => number;
  getRowHeight: () => number;
  headerHeight: number;
  rowHeaderWidth: number;
  itemData: CellItemData; // Or any
  getColumnLabel: (index: number) => string;
  handleColumnHeaderClick: (colIndex: number) => void;
  handleRowHeaderClick: (rowIndex: number) => void;
  handleScroll: (scrollInfo: { scrollLeft: number; scrollTop: number }) => void;
  handleSelectAll: () => void;
}

export const ExcelGrid: React.FC<ExcelGridProps> = ({
  currentSheetName,
  renderColCount,
  renderRowCount,
  getColumnWidth,
  getRowHeight,
  headerHeight,
  rowHeaderWidth,
  itemData,
  getColumnLabel,
  handleColumnHeaderClick,
  handleRowHeaderClick,
  handleScroll,
  handleSelectAll,
}) => {
  const gridRef = React.useRef<VirtualizedGridRef>(null);

  const renderColumnHeader = ({ columnIndex, style }: { columnIndex: number; style: React.CSSProperties }) => {
    const isColumnSelected = itemData.selectionRange && columnIndex >= itemData.selectionRange.startCol && columnIndex <= itemData.selectionRange.endCol;
    const isColumnActive = itemData.selectedCell && itemData.selectedCell.col === columnIndex;
    return (
        <HeaderCell
          style={{ ...style, cursor: "pointer" }}
          onClick={() => handleColumnHeaderClick(columnIndex)}
          className="col"
          data-col-id={getColumnLabel(columnIndex)}
          data-col-index={columnIndex}
          data-selected={isColumnSelected ? "true" : undefined}
          data-active={isColumnActive ? "true" : undefined}
        >
            {getColumnLabel(columnIndex)}
        </HeaderCell>
    );
  };

  const renderRowHeader = ({ rowIndex, style }: { rowIndex: number; style: React.CSSProperties }) => {
    const isRowSelected = itemData.selectionRange && rowIndex >= itemData.selectionRange.startRow && rowIndex <= itemData.selectionRange.endRow;
    const isRowActive = itemData.selectedCell && itemData.selectedCell.row === rowIndex;
    return (
        <RowHeaderCell
          style={{ ...style, cursor: "pointer" }}
          onClick={() => handleRowHeaderClick(rowIndex)}
          className="row"
          data-row-num={rowIndex + 1}
          data-row-index={rowIndex}
          data-selected={isRowSelected ? "true" : undefined}
          data-active={isRowActive ? "true" : undefined}
        >
            {rowIndex + 1}
        </RowHeaderCell>
    );
  };

  return (
    <ViewerContainer variant="plain">
      <GridContainer>
          <Box className="sheet" data-sheet-name={currentSheetName} sx={{ height: '100%', width: '100%' }}>
              <VirtualizedGrid
                  ref={gridRef}
                  columnCount={renderColCount}
                  rowCount={renderRowCount}
                  columnWidth={getColumnWidth}
                  rowHeight={getRowHeight}
                  renderCell={CellItem}
                  itemData={itemData}
                  renderColumnHeader={renderColumnHeader}
                  renderRowHeader={renderRowHeader}
                  headerHeight={headerHeight}
                  rowHeaderWidth={rowHeaderWidth}
                  onScroll={handleScroll}
                  onCornerHeaderClick={handleSelectAll}
              />
          </Box>
      </GridContainer>
    </ViewerContainer>
  );
};
