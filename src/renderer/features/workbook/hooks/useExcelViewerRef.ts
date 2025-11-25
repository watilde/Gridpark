import { useImperativeHandle, useCallback, Ref } from 'react';
import { CellPosition, CellData } from '../../../types/excel';

/**
 * ExcelViewer Ref API
 * Exposes methods for parent components to interact with ExcelViewer
 */
export interface ExcelViewerRef {
  /**
   * Focus on a specific cell
   */
  focusCell: (address: string) => void;

  /**
   * Get the value of a cell
   */
  getCellValue: (address: string) => CellData | null;

  /**
   * Set the value of a cell
   */
  setCellValue: (address: string, value: any) => void;

  /**
   * Get current selection
   */
  getSelection: () => { start: CellPosition; end: CellPosition } | null;

  /**
   * Set selection range
   */
  setSelection: (start: CellPosition, end: CellPosition) => void;

  /**
   * Clear selection
   */
  clearSelection: () => void;

  /**
   * Scroll to a specific cell
   */
  scrollToCell: (address: string) => void;

  /**
   * Get grid dimensions
   */
  getGridDimensions: () => { rows: number; cols: number };

  /**
   * Export current sheet data
   */
  exportData: () => CellData[][];

  /**
   * Undo last action
   */
  undo: () => void;

  /**
   * Redo last undone action
   */
  redo: () => void;
}

/**
 * Helper to convert Excel address (e.g., "A1") to position
 */
const parseAddress = (address: string): CellPosition | null => {
  const match = /^([A-Z]+)(\d+)$/.exec(address.toUpperCase());
  if (!match) return null;

  const col = match[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
  const row = parseInt(match[2], 10) - 1;

  return { row, col };
};

/**
 * Helper to convert position to Excel address
 */
const _toAddress = (pos: CellPosition): string => {
  const colLabel = String.fromCharCode(65 + pos.col);
  return `${colLabel}${pos.row + 1}`;
};

/**
 * Hook to create ExcelViewer ref API using useImperativeHandle
 */
export const useExcelViewerRef = (
  ref: Ref<ExcelViewerRef>,
  deps: {
    data: CellData[][];
    selection: { start: CellPosition; end: CellPosition } | null;
    onCellChange: (row: number, col: number, value: any) => void;
    onSelectionChange: (start: CellPosition, end: CellPosition) => void;
    gridRef: React.RefObject<HTMLDivElement>;
  }
) => {
  const { data, selection, onCellChange, onSelectionChange, gridRef } = deps;

  const focusCell = useCallback(
    (address: string) => {
      const pos = parseAddress(address);
      if (!pos) return;

      // Find and focus the cell element
      if (gridRef.current) {
        const cellElement = gridRef.current.querySelector(
          `[data-row="${pos.row}"][data-col="${pos.col}"]`
        ) as HTMLElement;
        if (cellElement) {
          cellElement.focus();
          onSelectionChange(pos, pos);
        }
      }
    },
    [gridRef, onSelectionChange]
  );

  const getCellValue = useCallback(
    (address: string): CellData | null => {
      const pos = parseAddress(address);
      if (!pos) return null;
      return data[pos.row]?.[pos.col] ?? null;
    },
    [data]
  );

  const setCellValue = useCallback(
    (address: string, value: any) => {
      const pos = parseAddress(address);
      if (!pos) return;
      onCellChange(pos.row, pos.col, value);
    },
    [onCellChange]
  );

  const getSelection = useCallback(() => {
    return selection;
  }, [selection]);

  const setSelection = useCallback(
    (start: CellPosition, end: CellPosition) => {
      onSelectionChange(start, end);
    },
    [onSelectionChange]
  );

  const clearSelection = useCallback(() => {
    if (selection) {
      onSelectionChange(selection.start, selection.start);
    }
  }, [selection, onSelectionChange]);

  const scrollToCell = useCallback(
    (address: string) => {
      const pos = parseAddress(address);
      if (!pos || !gridRef.current) return;

      const cellElement = gridRef.current.querySelector(
        `[data-row="${pos.row}"][data-col="${pos.col}"]`
      ) as HTMLElement;
      if (cellElement) {
        cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [gridRef]
  );

  const getGridDimensions = useCallback(() => {
    return {
      rows: data.length,
      cols: data[0]?.length ?? 0,
    };
  }, [data]);

  const exportData = useCallback(() => {
    return data.map(row => row.map(cell => ({ ...cell })));
  }, [data]);

  const undo = useCallback(() => {
    // TODO: Implement undo functionality
    console.log('Undo not yet implemented');
  }, []);

  const redo = useCallback(() => {
    // TODO: Implement redo functionality
    console.log('Redo not yet implemented');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focusCell,
      getCellValue,
      setCellValue,
      getSelection,
      setSelection,
      clearSelection,
      scrollToCell,
      getGridDimensions,
      exportData,
      undo,
      redo,
    }),
    [
      focusCell,
      getCellValue,
      setCellValue,
      getSelection,
      setSelection,
      clearSelection,
      scrollToCell,
      getGridDimensions,
      exportData,
      undo,
      redo,
    ]
  );
};
