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
import { useT } from '../../../i18n/I18nProvider';

// Constants
const CELL_WIDTH = 100;
const CELL_HEIGHT = 28;
const HEADER_HEIGHT = 30;
const HEADER_WIDTH = 50;
const OVERSCAN_COUNT = 5; // Render 5 extra rows/cols outside viewport

// Render a number under one of our named formats. Unknown formats fall through
// to the default number toString (callers should keep the set small).
function formatNumber(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'currency_jpy':
      return value.toLocaleString('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      });
    case 'percent':
      return (
        (value * 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + '%'
      );
    case 'comma':
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    default:
      return String(value);
  }
}

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
  // Cell to highlight as the "current" match (separate from selectedCell so the
  // formula bar doesn't fight Find navigation)
  activeMatch?: CellPosition | null;

  // Drawing
  activeDrawTool?: 'pen' | 'highlighter' | 'eraser' | null;
  penColor?: string;

  // Structural ops (row/column insert/delete)
  onInsertRow?: (row: number) => void;
  onDeleteRow?: (row: number) => void;
  onInsertColumn?: (col: number) => void;
  onDeleteColumn?: (col: number) => void;

  // Hide / show
  onHideRow?: (row: number) => void;
  onHideColumn?: (col: number) => void;
  onShowAllRows?: () => void;
  onShowAllColumns?: () => void;

  // Clipboard ops triggered from context menu
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onClear?: () => void;

  // Freeze panes: number of rows/cols to keep visible while scrolling.
  // 0 = no freeze, 1 = freeze first row / first column.
  frozenRows?: number;
  frozenCols?: number;

  // Cell merges: list of rectangular ranges treated as a single visual cell.
  merges?: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>;

  // Per-column / per-row size overrides (controlled). When provided, the grid
  // delegates persistence to the parent via the setters below.
  columnWidths?: Map<number, number>;
  rowHeights?: Map<number, number>;
  onColumnWidthChange?: (col: number, width: number) => void;
  onRowHeightChange?: (row: number, height: number) => void;

  // Rows / columns that should be skipped entirely (filter or manual hide).
  hiddenRows?: ReadonlySet<number>;
  hiddenCols?: ReadonlySet<number>;

  // Filter range — when set, render a dropdown arrow overlay on each header
  // cell (column at filterRange.startRow) within the column span.
  filterRange?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  } | null;
  filteredColumns?: ReadonlySet<number>; // cols with active exclusion (badge)
  onFilterArrowClick?: (col: number, x: number, y: number) => void;

  // Show / hide gridlines (default true).
  showGridlines?: boolean;
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
  activeMatch,
  activeDrawTool,
  penColor = '#000000',
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  onHideRow,
  onHideColumn,
  onShowAllRows,
  onShowAllColumns,
  onCopy,
  onCut,
  onPaste,
  onClear,
  frozenRows = 0,
  frozenCols = 0,
  merges = [],
  columnWidths: columnWidthsProp,
  rowHeights: rowHeightsProp,
  onColumnWidthChange,
  onRowHeightChange,
  hiddenRows,
  hiddenCols,
  filterRange,
  filteredColumns,
  onFilterArrowClick,
  showGridlines = true,
}) => {
  const theme = useTheme();
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Per-column / per-row size overrides. When `columnWidthsProp` is provided
  // the parent controls persistence (db-backed). Otherwise we keep ephemeral
  // local state so the grid still works in isolation (e.g. Storybook).
  const [localColWidths, setLocalColWidths] = useState<Map<number, number>>(() => new Map());
  const [localRowHeights, setLocalRowHeights] = useState<Map<number, number>>(() => new Map());
  const columnWidths = columnWidthsProp ?? localColWidths;
  const rowHeights = rowHeightsProp ?? localRowHeights;

  const colWidth = useCallback(
    (col: number) => columnWidths.get(col) ?? CELL_WIDTH,
    [columnWidths]
  );
  const rowH = useCallback((row: number) => rowHeights.get(row) ?? CELL_HEIGHT, [rowHeights]);

  // Prefix sums for fast cell positioning. Hidden rows/cols contribute 0 so
  // visible cells collapse together visually while keeping their original
  // row/col indices.
  const colLefts = useMemo(() => {
    const arr = new Array<number>(visibleCols + 1);
    arr[0] = HEADER_WIDTH;
    for (let c = 0; c < visibleCols; c++) {
      const isHidden = hiddenCols?.has(c) ?? false;
      arr[c + 1] = arr[c] + (isHidden ? 0 : (columnWidths.get(c) ?? CELL_WIDTH));
    }
    return arr;
  }, [columnWidths, visibleCols, hiddenCols]);

  const rowTops = useMemo(() => {
    const arr = new Array<number>(visibleRows + 1);
    arr[0] = HEADER_HEIGHT;
    for (let r = 0; r < visibleRows; r++) {
      const isHidden = hiddenRows?.has(r) ?? false;
      arr[r + 1] = arr[r] + (isHidden ? 0 : (rowHeights.get(r) ?? CELL_HEIGHT));
    }
    return arr;
  }, [rowHeights, visibleRows, hiddenRows]);

  // Find the row/col index whose start position is just <= a given px coordinate
  const findColAt = useCallback(
    (x: number) => {
      // binary search on colLefts
      let lo = 0;
      let hi = colLefts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (colLefts[mid + 1] <= x) lo = mid + 1;
        else hi = mid;
      }
      return Math.min(lo, visibleCols - 1);
    },
    [colLefts, visibleCols]
  );
  const findRowAt = useCallback(
    (y: number) => {
      let lo = 0;
      let hi = rowTops.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (rowTops[mid + 1] <= y) lo = mid + 1;
        else hi = mid;
      }
      return Math.min(lo, visibleRows - 1);
    },
    [rowTops, visibleRows]
  );

  // Active resize gesture (drives live updates during drag)
  const resizeRef = useRef<
    | { kind: 'col'; index: number; startClient: number; startSize: number }
    | { kind: 'row'; index: number; startClient: number; startSize: number }
    | null
  >(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const delta = (r.kind === 'col' ? e.clientX : e.clientY) - r.startClient;
      const next = Math.max(20, r.startSize + delta);
      if (r.kind === 'col') {
        if (onColumnWidthChange) onColumnWidthChange(r.index, next);
        else
          setLocalColWidths(prev => {
            const m = new Map(prev);
            m.set(r.index, next);
            return m;
          });
      } else {
        if (onRowHeightChange) onRowHeightChange(r.index, next);
        else
          setLocalRowHeights(prev => {
            const m = new Map(prev);
            m.set(r.index, next);
            return m;
          });
      }
    };
    const onUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onColumnWidthChange, onRowHeightChange]);

  const startColResize = useCallback(
    (col: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        kind: 'col',
        index: col,
        startClient: e.clientX,
        startSize: colWidth(col),
      };
      document.body.style.cursor = 'col-resize';
    },
    [colWidth]
  );

  const startRowResize = useCallback(
    (row: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        kind: 'row',
        index: row,
        startClient: e.clientY,
        startSize: rowH(row),
      };
      document.body.style.cursor = 'row-resize';
    },
    [rowH]
  );

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

  // Scroll active find match into view when it changes
  useEffect(() => {
    if (!activeMatch || !containerRef.current) return;
    const c = containerRef.current;
    const cellTop = rowTops[activeMatch.row];
    const cellLeft = colLefts[activeMatch.col];
    const cellBottom = rowTops[activeMatch.row + 1];
    const cellRight = colLefts[activeMatch.col + 1];
    const viewTop = c.scrollTop + HEADER_HEIGHT;
    const viewBottom = c.scrollTop + c.clientHeight;
    const viewLeft = c.scrollLeft + HEADER_WIDTH;
    const viewRight = c.scrollLeft + c.clientWidth;
    if (cellTop < viewTop) c.scrollTop = cellTop - HEADER_HEIGHT;
    else if (cellBottom > viewBottom) c.scrollTop = cellBottom - c.clientHeight;
    if (cellLeft < viewLeft) c.scrollLeft = cellLeft - HEADER_WIDTH;
    else if (cellRight > viewRight) c.scrollLeft = cellRight - c.clientWidth;
  }, [activeMatch, colLefts, rowTops]);

  // Context menu state
  type ContextMenuState =
    | { x: number; y: number; kind: 'cell'; row: number; col: number }
    | { x: number; y: number; kind: 'row'; row: number }
    | { x: number; y: number; kind: 'col'; col: number };
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', close);
    };
  }, [contextMenu]);

  // Calculate viewport
  const viewport = useMemo(() => {
    const containerHeight = containerRef.current?.clientHeight || 600;
    const containerWidth = containerRef.current?.clientWidth || 800;

    const startRow = Math.max(0, findRowAt(scrollTop) - OVERSCAN_COUNT);
    const endRow = Math.min(
      visibleRows,
      findRowAt(scrollTop + containerHeight) + OVERSCAN_COUNT + 1
    );
    const startCol = Math.max(0, findColAt(scrollLeft) - OVERSCAN_COUNT);
    const endCol = Math.min(
      visibleCols,
      findColAt(scrollLeft + containerWidth) + OVERSCAN_COUNT + 1
    );

    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, visibleRows, visibleCols, findRowAt, findColAt]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Total content dimensions
  const contentWidth = colLefts[visibleCols];
  const contentHeight = rowTops[visibleRows];

  // Handle canvas drawing
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!activeDrawTool || !canvasRef.current) return;

      isDrawing.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      lastPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [activeDrawTool]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [activeDrawTool, penColor]
  );

  const handleCanvasMouseUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  // Get cell value (computed or raw, with optional number format applied)
  const getCellValue = useCallback(
    (row: number, col: number): string => {
      const key = `${row},${col}`;
      const cell = cells.get(key);

      if (!cell) return '';

      let raw: any;
      if (cell.formula) {
        const computed = computedValues.get(key);
        if (computed === undefined) return '#ERROR';
        raw = computed;
      } else {
        raw = cell.value;
      }

      if (raw === null || raw === undefined) return '';

      const fmt = cell.style?.numberFormat;
      if (fmt && typeof raw !== 'string') {
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isFinite(num)) return formatNumber(num, fmt);
      } else if (fmt && typeof raw === 'string') {
        const num = Number(raw);
        if (Number.isFinite(num) && raw.trim() !== '') return formatNumber(num, fmt);
      }

      return String(raw);
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

      // Expand shorthand `border` into four longhand sides so we never mix
      // shorthand + longhand in the rendered style object (React warns on it).
      // Per-side values win over the shorthand fallback. Omit undefined keys
      // so spreading this onto a default style doesn't blank out the defaults.
      const sideDefault = style.border;
      const top = style.borderTop ?? sideDefault;
      const right = style.borderRight ?? sideDefault;
      const bottom = style.borderBottom ?? sideDefault;
      const left = style.borderLeft ?? sideDefault;

      const out: CSSProperties = {};
      if (style.backgroundColor !== undefined) out.backgroundColor = style.backgroundColor;
      if (style.color !== undefined) out.color = style.color;
      if (style.fontWeight !== undefined) out.fontWeight = style.fontWeight;
      if (style.fontStyle !== undefined) out.fontStyle = style.fontStyle;
      if (style.textDecoration !== undefined) out.textDecoration = style.textDecoration;
      if (style.fontSize !== undefined) out.fontSize = style.fontSize;
      if (style.fontFamily !== undefined) out.fontFamily = style.fontFamily;
      if (style.textAlign !== undefined) out.textAlign = style.textAlign as any;
      if (style.verticalAlign !== undefined) out.verticalAlign = style.verticalAlign as any;
      if (top !== undefined) out.borderTop = top;
      if (right !== undefined) out.borderRight = right;
      if (bottom !== undefined) out.borderBottom = bottom;
      if (left !== undefined) out.borderLeft = left;
      return out;
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

  // Move selected cell by (dRow, dCol), clamped to grid; clears range selection.
  // Skips hidden rows/cols (filtered or manually hidden) so navigation tracks
  // what the user actually sees. Snaps to merge anchors as Excel does.
  const moveSelection = useCallback(
    (dRow: number, dCol: number) => {
      if (!selectedCell) return;
      let nextRow = selectedCell.row + dRow;
      let nextCol = selectedCell.col + dCol;
      // Skip past hidden rows in the direction of motion
      if (dRow !== 0) {
        while (nextRow >= 0 && nextRow < visibleRows && (hiddenRows?.has(nextRow) ?? false)) {
          nextRow += dRow;
        }
      }
      if (dCol !== 0) {
        while (nextCol >= 0 && nextCol < visibleCols && (hiddenCols?.has(nextCol) ?? false)) {
          nextCol += dCol;
        }
      }
      nextRow = Math.max(0, Math.min(visibleRows - 1, nextRow));
      nextCol = Math.max(0, Math.min(visibleCols - 1, nextCol));

      const merge = merges.find(
        m =>
          nextRow >= m.startRow &&
          nextRow <= m.endRow &&
          nextCol >= m.startCol &&
          nextCol <= m.endCol
      );
      if (merge && (nextRow !== merge.startRow || nextCol !== merge.startCol)) {
        nextRow = merge.startRow;
        nextCol = merge.startCol;
      }

      if (nextRow === selectedCell.row && nextCol === selectedCell.col) return;
      onCellSelect({ row: nextRow, col: nextCol });
    },
    [selectedCell, visibleRows, visibleCols, onCellSelect, merges, hiddenRows, hiddenCols]
  );

  // Handle key events on selected cell (navigation, editing entry)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If already editing, don't interfere
      if (editingCell) return;

      // Skip when focus is on an input/textarea elsewhere (e.g. formula bar)
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      // Skip when shortcut handled elsewhere (Ctrl/Cmd combos go to container)
      if (e.ctrlKey || e.metaKey) return;

      // If no cell selected, ignore
      if (!selectedCell) return;

      // Arrow / Tab / Enter navigation
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection(-1, 0);
          return;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection(1, 0);
          return;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection(0, -1);
          return;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection(0, 1);
          return;
        case 'Tab':
          e.preventDefault();
          moveSelection(0, e.shiftKey ? -1 : 1);
          return;
        case 'Enter':
          // Shift+Enter: move up; Enter alone: start editing
          if (e.shiftKey) {
            e.preventDefault();
            moveSelection(-1, 0);
            return;
          }
          e.preventDefault();
          startEditing(selectedCell.row, selectedCell.col);
          return;
        case 'F2':
          e.preventDefault();
          startEditing(selectedCell.row, selectedCell.col);
          return;
      }

      // Typing any printable character: start editing
      if (e.key.length === 1 && !e.altKey) {
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
  }, [selectedCell, editingCell, startEditing, moveSelection]);

  // Handle keyboard in edit mode (commit + move per Excel behavior)
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        moveSelection(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        moveSelection(0, e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit, moveSelection]
  );

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (activeDrawTool) return; // Disable selection when drawing

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
    },
    [selectedCell, onCellSelect, onRangeSelect, activeDrawTool]
  );

  // Handle cell mouse enter (extend selection)
  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (activeDrawTool) return; // Disable selection when drawing

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

    // Theme colors
    const borderColor = theme.palette.divider;
    const cellBg = theme.palette.background.surface;
    const selectedBg = theme.palette.primary.softBg;
    const rangeBg = theme.palette.primary.softHoverBg; // slightly darker/different than selected
    const matchBg = theme.palette.warning.softBg;
    const activeMatchBg = theme.palette.warning.solidBg;
    const textColor = theme.palette.text.primary;

    // Compose row/col index sets with frozen prefixes always included
    const rowSet = new Set<number>();
    for (let r = 0; r < frozenRows; r++) rowSet.add(r);
    for (let r = startRow; r < endRow; r++) rowSet.add(r);
    const colSet = new Set<number>();
    for (let c = 0; c < frozenCols; c++) colSet.add(c);
    for (let c = startCol; c < endCol; c++) colSet.add(c);
    const rowList = Array.from(rowSet).sort((a, b) => a - b);
    const colList = Array.from(colSet).sort((a, b) => a - b);

    // Pre-index merges by their top-left and by membership for fast checks
    const mergeAt = (r: number, c: number) =>
      merges.find(m => r >= m.startRow && r <= m.endRow && c >= m.startCol && c <= m.endCol);

    for (const row of rowList) {
      if (hiddenRows?.has(row)) continue;
      for (const col of colList) {
        if (hiddenCols?.has(col)) continue;
        const key = `${row},${col}`;
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const isEditing = editingCell?.row === row && editingCell?.col === col;

        // Skip merged-away cells (only the anchor renders)
        const merge = mergeAt(row, col);
        if (merge && (merge.startRow !== row || merge.startCol !== col)) continue;

        let cw = colWidth(col);
        let rh = rowH(row);
        if (merge) {
          // Anchor cell spans the merged range
          cw = colLefts[merge.endCol + 1] - colLefts[merge.startCol];
          rh = rowTops[merge.endRow + 1] - rowTops[merge.startRow];
        }
        const isFrozenRow = row < frozenRows;
        const isFrozenCol = col < frozenCols;
        const left = isFrozenCol ? scrollLeft + colLefts[col] : colLefts[col];
        const top = isFrozenRow ? scrollTop + rowTops[row] : rowTops[row];
        const frozenZ = isFrozenRow && isFrozenCol ? 10 : isFrozenRow || isFrozenCol ? 5 : 1;

        if (isEditing) {
          // Render input for editing cell
          const style: CSSProperties = {
            position: 'absolute',
            left,
            top,
            width: cw,
            height: rh,
            zIndex: 100,
          };

          cellElements.push(
            <Box key={key} sx={style}>
              <Input
                slotProps={{
                  input: {
                    ref: inputRef,
                  },
                }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                sx={{
                  width: '100%',
                  height: '100%',
                  '--Input-minHeight': `${rh}px`,
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
          const isActiveMatch = activeMatch?.row === row && activeMatch?.col === col;

          const defaultBorder = showGridlines ? `1px solid ${borderColor}` : 'none';
          const style: CSSProperties = {
            position: 'absolute',
            left,
            top,
            width: cw,
            height: rh,
            zIndex: frozenZ,
            borderTop: defaultBorder,
            borderRight: defaultBorder,
            borderBottom: defaultBorder,
            borderLeft: defaultBorder,
            padding: '4px 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            backgroundColor: isSelected
              ? selectedBg
              : inRange
                ? rangeBg
                : isMatch
                  ? matchBg
                  : cellBg,
            color: textColor,
            cursor: 'cell',
            fontSize: '13px',
            // Apply cell-specific styles (override defaults)
            ...cellStyle,
            // But always keep selection/range/search background if specific priority needed
            // Actually standard Excel behavior is selection overlay on top of cell styles
            // But here we're mixing background color.
            ...(isSelected && { backgroundColor: selectedBg }),
            ...(inRange && !isSelected && { backgroundColor: rangeBg }),
            ...(isMatch && !isSelected && !inRange && { backgroundColor: matchBg }),
            ...(isActiveMatch && { backgroundColor: activeMatchBg, color: '#fff' }),
          };

          cellElements.push(
            <div
              key={key}
              style={style}
              onMouseDown={e => handleCellMouseDown(row, col, e)}
              onMouseEnter={() => handleCellMouseEnter(row, col)}
              onDoubleClick={() => handleCellDoubleClick(row, col)}
              onContextMenu={e => {
                e.preventDefault();
                onCellSelect({ row, col });
                setContextMenu({ x: e.clientX, y: e.clientY, kind: 'cell', row, col });
              }}
            >
              {value}
            </div>
          );

          // Filter arrow on top-row header cells of the filter range
          if (
            filterRange &&
            onFilterArrowClick &&
            row === filterRange.startRow &&
            col >= filterRange.startCol &&
            col <= filterRange.endCol
          ) {
            const isActive = filteredColumns?.has(col) ?? false;
            cellElements.push(
              <div
                key={`filter-arrow-${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: left + cw - 18,
                  top: top + 4,
                  width: 16,
                  height: rh - 8,
                  zIndex: frozenZ + 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#1f6feb' : '#ffffffee',
                  color: isActive ? '#ffffff' : '#444',
                  border: '1px solid #c0c0c0',
                  borderRadius: 3,
                  fontWeight: 700,
                  userSelect: 'none',
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onFilterArrowClick(col, rect.left, rect.bottom);
                }}
              >
                ▼
              </div>
            );
          }
        }
      }
    }

    return cellElements;
  }, [
    viewport,
    getCellValue,
    getCellStyle,
    isSearchMatch,
    isInRange,
    selectedCell,
    activeMatch,
    onCellSelect,
    editingCell,
    editValue,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellDoubleClick,
    handleEditKeyDown,
    commitEdit,
    theme,
    colLefts,
    rowTops,
    colWidth,
    rowH,
    frozenRows,
    frozenCols,
    scrollLeft,
    scrollTop,
    merges,
    hiddenRows,
    hiddenCols,
    filterRange,
    filteredColumns,
    onFilterArrowClick,
    showGridlines,
  ]);

  // Render column headers
  const renderColumnHeaders = useMemo(() => {
    const { startCol, endCol } = viewport;
    const headers: JSX.Element[] = [];

    // Theme colors
    const headerBg = theme.palette.background.level1;
    const borderColor = theme.palette.divider;
    const textColor = theme.palette.text.secondary;

    for (let col = startCol; col < endCol; col++) {
      if (hiddenCols?.has(col)) continue;
      const style: CSSProperties = {
        position: 'absolute',
        left: colLefts[col],
        top: scrollTop, // sticky to top of viewport
        width: colWidth(col),
        height: HEADER_HEIGHT,
        border: `1px solid ${borderColor}`,
        backgroundColor: headerBg,
        color: textColor,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        zIndex: 20,
      };

      headers.push(
        <div
          key={`col-${col}`}
          style={style}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, kind: 'col', col });
          }}
        >
          {getColumnLabel(col)}
          <div
            onMouseDown={e => startColResize(col, e)}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 5,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 11,
            }}
          />
        </div>
      );
    }

    return headers;
  }, [viewport, getColumnLabel, theme, colLefts, colWidth, startColResize, scrollTop, hiddenCols]);

  // Render row headers
  const renderRowHeaders = useMemo(() => {
    const { startRow, endRow } = viewport;
    const headers: JSX.Element[] = [];

    // Theme colors
    const headerBg = theme.palette.background.level1;
    const borderColor = theme.palette.divider;
    const textColor = theme.palette.text.secondary;

    for (let row = startRow; row < endRow; row++) {
      if (hiddenRows?.has(row)) continue;
      const style: CSSProperties = {
        position: 'absolute',
        left: scrollLeft, // sticky to left of viewport
        top: rowTops[row],
        width: HEADER_WIDTH,
        height: rowH(row),
        border: `1px solid ${borderColor}`,
        backgroundColor: headerBg,
        color: textColor,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        zIndex: 20,
      };

      headers.push(
        <div
          key={`row-${row}`}
          style={style}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, kind: 'row', row });
          }}
        >
          {row + 1}
          <div
            onMouseDown={e => startRowResize(row, e)}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: 5,
              cursor: 'row-resize',
              zIndex: 11,
            }}
          />
        </div>
      );
    }

    return headers;
  }, [viewport, theme, rowTops, rowH, startRowResize, scrollLeft, hiddenRows]);

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
        cursor: activeDrawTool
          ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewport="0 0 24 24" fill="black"><circle cx="12" cy="12" r="6" /></svg>') 12 12, auto`
          : 'default',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: contentWidth,
          height: contentHeight,
        }}
      >
        {/* Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={contentWidth}
          height={contentHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: activeDrawTool ? 'auto' : 'none',
            zIndex: 50, // Above cells
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />

        {/* Corner cell (sticky to top-left of viewport) */}
        <div
          style={{
            position: 'absolute',
            left: scrollLeft,
            top: scrollTop,
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.level1,
            zIndex: 30,
          }}
        />

        {/* Headers */}
        {renderColumnHeaders}
        {renderRowHeaders}

        {/* Cells */}
        {renderCells}
      </div>
      {contextMenu && (
        <Box
          onMouseDown={e => e.stopPropagation()}
          sx={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1300,
            minWidth: 200,
            backgroundColor: 'background.body',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 'sm',
            boxShadow: 'md',
            py: 0.5,
            fontSize: '13px',
          }}
        >
          {contextMenu.kind === 'cell' && (
            <>
              <ContextMenuItem
                label={t('menu.cut')}
                onClick={() => {
                  onCut?.();
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.copy')}
                onClick={() => {
                  onCopy?.();
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.paste')}
                onClick={() => {
                  onPaste?.();
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.clear')}
                onClick={() => {
                  onClear?.();
                  setContextMenu(null);
                }}
              />
              <ContextMenuDivider />
              <ContextMenuItem
                label={t('menu.insert_row_above')}
                onClick={() => {
                  onInsertRow?.(contextMenu.row);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.insert_row_below')}
                onClick={() => {
                  onInsertRow?.(contextMenu.row + 1);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.insert_col_left')}
                onClick={() => {
                  onInsertColumn?.(contextMenu.col);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.insert_col_right')}
                onClick={() => {
                  onInsertColumn?.(contextMenu.col + 1);
                  setContextMenu(null);
                }}
              />
            </>
          )}
          {contextMenu.kind === 'row' && (
            <>
              <ContextMenuItem
                label={t('menu.insert_row_above')}
                onClick={() => {
                  onInsertRow?.(contextMenu.row);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.insert_row_below')}
                onClick={() => {
                  onInsertRow?.(contextMenu.row + 1);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.delete_row', { n: contextMenu.row + 1 })}
                onClick={() => {
                  onDeleteRow?.(contextMenu.row);
                  setContextMenu(null);
                }}
              />
              <ContextMenuDivider />
              <ContextMenuItem
                label={t('menu.hide_row')}
                onClick={() => {
                  onHideRow?.(contextMenu.row);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.show_all_rows')}
                onClick={() => {
                  onShowAllRows?.();
                  setContextMenu(null);
                }}
              />
            </>
          )}
          {contextMenu.kind === 'col' && (
            <>
              <ContextMenuItem
                label={t('menu.insert_col_left')}
                onClick={() => {
                  onInsertColumn?.(contextMenu.col);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.insert_col_right')}
                onClick={() => {
                  onInsertColumn?.(contextMenu.col + 1);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.delete_col', { n: getColumnLabel(contextMenu.col) })}
                onClick={() => {
                  onDeleteColumn?.(contextMenu.col);
                  setContextMenu(null);
                }}
              />
              <ContextMenuDivider />
              <ContextMenuItem
                label={t('menu.hide_col')}
                onClick={() => {
                  onHideColumn?.(contextMenu.col);
                  setContextMenu(null);
                }}
              />
              <ContextMenuItem
                label={t('menu.show_all_cols')}
                onClick={() => {
                  onShowAllColumns?.();
                  setContextMenu(null);
                }}
              />
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

const ContextMenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      px: 1.5,
      py: 0.75,
      cursor: 'pointer',
      userSelect: 'none',
      '&:hover': { backgroundColor: 'background.level1' },
    }}
  >
    {label}
  </Box>
);

const ContextMenuDivider: React.FC = () => (
  <Box sx={{ height: '1px', backgroundColor: 'divider', my: 0.5 }} />
);
