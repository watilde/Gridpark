import React, {
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import { styled } from '@mui/joy/styles';
import { Box } from '@mui/joy';

// Local AutoSizer implementation to avoid import issues
const AutoSizer = ({
  children,
  disableHeight,
  disableWidth,
}: {
  children: (size: { height: number; width: number }) => React.ReactNode;
  disableHeight?: boolean;
  disableWidth?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {size.height > 0 &&
        size.width > 0 &&
        children({
          height: disableHeight ? size.height : size.height,
          width: disableWidth ? size.width : size.width,
        })}
    </div>
  );
};

// Styled components for virtualization (div-based)
const GridWrapper = styled(Box)({
  flex: 1,
  height: '100%',
  width: '100%',
  overflow: 'auto',
  position: 'relative',
});

const GridContent = styled(Box)({
  position: 'relative',
});

const SelectAllIcon = styled('div')(({ theme }) => ({
  width: 0,
  height: 0,
  borderBottom: `10px solid ${theme.palette.neutral.solidBg}`, // Darker triangle
  borderLeft: '10px solid transparent',
  position: 'absolute',
  bottom: 4,
  right: 4,
}));

const CornerHeader = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 3,
  backgroundColor: theme.palette.primary.softBg,
  borderRight: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.primary.softHoverBg,
  },
}));

const HeaderRow = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  zIndex: 2,
});

const HeaderColumn = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 2,
});

const CellsContainer = styled(Box)({
  position: 'absolute',
});

interface VirtualizedGridProps {
  columnCount: number;
  rowCount: number;
  columnWidth: (index: number) => number;
  rowHeight: (index: number) => number;
  renderCell: (props: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  renderColumnHeader: (props: {
    columnIndex: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  renderRowHeader: (props: { rowIndex: number; style: React.CSSProperties }) => React.ReactNode;
  headerHeight: number;
  rowHeaderWidth: number;
  onScroll?: (scrollInfo: { scrollLeft: number; scrollTop: number }) => void;
  itemData?: any;
  onCornerHeaderClick?: () => void;
}

export interface VirtualizedGridRef {
  scrollToItem: (params: {
    align?: 'start' | 'center' | 'end' | 'smart';
    columnIndex?: number;
    rowIndex?: number;
  }) => void;
}

export const VirtualizedGrid = forwardRef<VirtualizedGridRef, VirtualizedGridProps>(
  (
    {
      columnCount,
      rowCount,
      columnWidth,
      rowHeight,
      renderCell,
      renderColumnHeader,
      renderRowHeader,
      headerHeight,
      rowHeaderWidth,
      onScroll,
      itemData,
      onCornerHeaderClick,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({ scrollLeft: 0, scrollTop: 0 });
    const [visibleRange, setVisibleRange] = useState({
      startCol: 0,
      endCol: Math.min(20, columnCount),
      startRow: 0,
      endRow: Math.min(50, rowCount),
    });

    // Calculate total dimensions
    let totalWidth = rowHeaderWidth;
    for (let i = 0; i < columnCount; i++) {
      totalWidth += columnWidth(i);
    }

    let totalHeight = headerHeight;
    for (let i = 0; i < rowCount; i++) {
      totalHeight += rowHeight(i);
    }

    useImperativeHandle(ref, () => ({
      scrollToItem: params => {
        if (!containerRef.current) return;

        let scrollLeft = 0;
        let scrollTop = 0;

        if (params.columnIndex !== undefined) {
          for (let i = 0; i < params.columnIndex; i++) {
            scrollLeft += columnWidth(i);
          }
          scrollLeft += rowHeaderWidth;
        }

        if (params.rowIndex !== undefined) {
          for (let i = 0; i < params.rowIndex; i++) {
            scrollTop += rowHeight(i);
          }
          scrollTop += headerHeight;
        }

        containerRef.current.scrollLeft = scrollLeft;
        containerRef.current.scrollTop = scrollTop;
      },
    }));

    const handleScroll = useCallback(() => {
      if (!containerRef.current) return;

      const { scrollLeft, scrollTop, clientWidth, clientHeight } = containerRef.current;
      setScrollState({ scrollLeft, scrollTop });

      // Calculate visible range with overscan
      const overscanCount = 5;

      // Calculate visible columns
      let currentX = rowHeaderWidth;
      let startCol = 0;
      let endCol = columnCount;

      for (let i = 0; i < columnCount; i++) {
        const width = columnWidth(i);
        if (currentX + width < scrollLeft) {
          startCol = i + 1;
        }
        if (currentX > scrollLeft + clientWidth) {
          endCol = Math.min(i, columnCount);
          break;
        }
        currentX += width;
      }

      // Calculate visible rows
      let currentY = headerHeight;
      let startRow = 0;
      let endRow = rowCount;

      for (let i = 0; i < rowCount; i++) {
        const height = rowHeight(i);
        if (currentY + height < scrollTop) {
          startRow = i + 1;
        }
        if (currentY > scrollTop + clientHeight) {
          endRow = Math.min(i, rowCount);
          break;
        }
        currentY += height;
      }

      setVisibleRange({
        startCol: Math.max(0, startCol - overscanCount),
        endCol: Math.min(columnCount, endCol + overscanCount),
        startRow: Math.max(0, startRow - overscanCount),
        endRow: Math.min(rowCount, endRow + overscanCount),
      });

      onScroll?.({ scrollLeft, scrollTop });
    }, [columnCount, rowCount, columnWidth, rowHeight, headerHeight, rowHeaderWidth, onScroll]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial calculation

      return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Render cells
    const CellComponent = renderCell as React.ComponentType<any>;
    const cells: React.ReactNode[] = [];
    for (let rowIndex = visibleRange.startRow; rowIndex < visibleRange.endRow; rowIndex++) {
      let left = rowHeaderWidth;
      for (let i = 0; i < visibleRange.startCol; i++) {
        left += columnWidth(i);
      }

      let top = headerHeight;
      for (let i = 0; i < rowIndex; i++) {
        top += rowHeight(i);
      }

      for (
        let columnIndex = visibleRange.startCol;
        columnIndex < visibleRange.endCol;
        columnIndex++
      ) {
        const width = columnWidth(columnIndex);
        const height = rowHeight(rowIndex);

        cells.push(
          <CellComponent
            key={`cell-${rowIndex}-${columnIndex}`}
            columnIndex={columnIndex}
            rowIndex={rowIndex}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
            }}
            {...itemData}
          />
        );

        left += width;
      }
    }

    // Render column headers
    const columnHeaders: React.ReactNode[] = [];
    let headerLeft = rowHeaderWidth;
    for (let i = 0; i < visibleRange.startCol; i++) {
      headerLeft += columnWidth(i);
    }

    for (
      let columnIndex = visibleRange.startCol;
      columnIndex < visibleRange.endCol;
      columnIndex++
    ) {
      const width = columnWidth(columnIndex);

      // Check if renderColumnHeader is a function or component
      const columnHeaderElement =
        typeof renderColumnHeader === 'function'
          ? renderColumnHeader({
              columnIndex,
              style: {
                position: 'absolute',
                left: headerLeft,
                top: 0,
                width,
                height: headerHeight,
              },
            })
          : null;

      columnHeaders.push(<div key={`col-header-${columnIndex}`}>{columnHeaderElement}</div>);
      headerLeft += width;
    }

    // Render row headers
    const rowHeaders: React.ReactNode[] = [];
    let headerTop = headerHeight;
    for (let i = 0; i < visibleRange.startRow; i++) {
      headerTop += rowHeight(i);
    }

    for (let rowIndex = visibleRange.startRow; rowIndex < visibleRange.endRow; rowIndex++) {
      const height = rowHeight(rowIndex);

      // Check if renderRowHeader is a function or component
      const rowHeaderElement =
        typeof renderRowHeader === 'function'
          ? renderRowHeader({
              rowIndex,
              style: {
                position: 'absolute',
                left: 0,
                top: headerTop,
                width: rowHeaderWidth,
                height,
              },
            })
          : null;

      rowHeaders.push(<div key={`row-header-${rowIndex}`}>{rowHeaderElement}</div>);
      headerTop += height;
    }

    return (
      <GridWrapper ref={containerRef}>
        <GridContent style={{ width: totalWidth, height: totalHeight }}>
          {/* Corner Header */}
          <CornerHeader
            style={{ width: rowHeaderWidth, height: headerHeight }}
            onClick={onCornerHeaderClick}
          >
            <SelectAllIcon />
          </CornerHeader>

          {/* Column Headers */}
          <HeaderRow>{columnHeaders}</HeaderRow>

          {/* Row Headers */}
          <HeaderColumn>{rowHeaders}</HeaderColumn>

          {/* Cells */}
          <CellsContainer>{cells}</CellsContainer>
        </GridContent>
      </GridWrapper>
    );
  }
);

VirtualizedGrid.displayName = 'VirtualizedGrid';
