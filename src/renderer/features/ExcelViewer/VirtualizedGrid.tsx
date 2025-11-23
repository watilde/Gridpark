import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from "react";
import { Grid } from "react-window";
import { styled } from "@mui/joy/styles";
import { Box } from "@mui/joy";

// Local AutoSizer implementation to avoid import issues
const AutoSizer = ({ children, disableHeight, disableWidth }: { 
  children: (size: { height: number; width: number }) => React.ReactNode;
  disableHeight?: boolean;
  disableWidth?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {size.height > 0 && size.width > 0 && children({
        height: disableHeight ? size.height : size.height,
        width: disableWidth ? size.width : size.width
      })}
    </div>
  );
};

// Styled components for virtualization (div-based)
const GridWrapper = styled(Box)({
  flex: 1,
  height: "100%",
  width: "100%",
  overflow: "hidden",
  position: "relative",
});

// Separate header containers to sync scroll
const TopHeaderWrapper = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  overflow: "hidden",
  zIndex: 2,
  // Background color to cover scrolling grid
  backgroundColor: "#fff", 
  display: "flex",
});

const LeftHeaderWrapper = styled(Box)({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  overflow: "hidden",
  zIndex: 2,
  backgroundColor: "#fff",
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
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 3,
  backgroundColor: theme.palette.primary.softBg, // Use a soft primary background
  borderRight: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": { // Add a hover effect for interactivity
    backgroundColor: theme.palette.primary.softHoverBg,
  },
}));

interface VirtualizedGridProps {
  columnCount: number;
  rowCount: number;
  columnWidth: (index: number) => number;
  rowHeight: (index: number) => number;
  renderCell: (props: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => React.ReactNode;
  renderColumnHeader: (props: { columnIndex: number; style: React.CSSProperties }) => React.ReactNode;
  renderRowHeader: (props: { rowIndex: number; style: React.CSSProperties }) => React.ReactNode;
  headerHeight: number;
  rowHeaderWidth: number;
  onScroll?: (scrollInfo: { scrollLeft: number; scrollTop: number }) => void;
  itemData?: any;
  onCornerHeaderClick?: () => void;
}

export interface VirtualizedGridRef {
  scrollToItem: (params: { align?: "start" | "center" | "end" | "smart"; columnIndex?: number; rowIndex?: number }) => void;
}

interface ReactWindowGridRef {
  scrollToItem: (params: { align?: "start" | "center" | "end" | "smart"; columnIndex?: number; rowIndex?: number }) => void;
  scrollTo: (params: { scrollLeft: number; scrollTop: number }) => void;
  element?: HTMLElement; // Custom property for this build
}

export const VirtualizedGrid = forwardRef<VirtualizedGridRef, VirtualizedGridProps>( ({
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
}, ref) => {
  const gridRef = useRef<ReactWindowGridRef>(null);
  const topHeaderRef = useRef<ReactWindowGridRef>(null);
  const leftHeaderRef = useRef<ReactWindowGridRef>(null);
  const topHeaderOuterRef = useRef<HTMLDivElement>(null);
  const leftHeaderOuterRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToItem: (params) => gridRef.current?.scrollToItem(params),
  }));

  const handleScroll = ({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
    // Sync headers - robust check
    if (topHeaderOuterRef.current) {
        topHeaderOuterRef.current.scrollLeft = scrollLeft;
    } else {
        // Fallback for custom react-window if outerRef fails
        const topGrid = topHeaderRef.current as any;
        if (topGrid?.element) {
            topGrid.element.scrollLeft = scrollLeft;
        }
    }

    if (leftHeaderOuterRef.current) {
        leftHeaderOuterRef.current.scrollTop = scrollTop;
    } else {
        const leftGrid = leftHeaderRef.current as any;
        if (leftGrid?.element) {
            leftGrid.element.scrollTop = scrollTop;
        }
    }
    
    onScroll?.({ scrollLeft, scrollTop });
  };

  return (
    <GridWrapper>
      {/* Corner Header (Fixed) */}
      <CornerHeader
        style={{ width: rowHeaderWidth, height: headerHeight, cursor: onCornerHeaderClick ? "pointer" : "default" }}
        onClick={onCornerHeaderClick}
      >
        <SelectAllIcon />
      </CornerHeader>

      {/* Top Header (Syncs Horizontal Scroll) */}
      <TopHeaderWrapper style={{ height: headerHeight, left: rowHeaderWidth }}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <Grid
              ref={topHeaderRef}
              outerRef={topHeaderOuterRef}
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={headerHeight}
              rowCount={1}
              rowHeight={() => headerHeight}
              width={width}
              style={{ overflow: "hidden" }}
              cellComponent={({ columnIndex, style }: any) => renderColumnHeader({ columnIndex, style })}
              cellProps={{}}
            />
          )}
        </AutoSizer>
      </TopHeaderWrapper>

      {/* Left Header (Syncs Vertical Scroll) */}
      <LeftHeaderWrapper style={{ width: rowHeaderWidth, top: headerHeight }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <Grid
              ref={leftHeaderRef}
              outerRef={leftHeaderOuterRef}
              columnCount={1}
              columnWidth={() => rowHeaderWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={rowHeaderWidth}
              style={{ overflow: "hidden" }}
              cellComponent={({ rowIndex, style }: any) => renderRowHeader({ rowIndex, style })}
              cellProps={{}}
            />
          )}
        </AutoSizer>
      </LeftHeaderWrapper>

      {/* Main Grid (Scrollable) */}
      <Box style={{ position: "absolute", top: headerHeight, left: rowHeaderWidth, right: 0, bottom: 0 }}>
        <AutoSizer>
          {({ height, width }) => (
            <Grid
              ref={gridRef}
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              onScroll={handleScroll}
              cellComponent={renderCell as any}
              cellProps={itemData || {}}
            />
          )}
        </AutoSizer>
      </Box>
    </GridWrapper>
  );
});

VirtualizedGrid.displayName = "VirtualizedGrid";
