import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ExcelFile,
  CellData,
  CellRange,
  CellPosition,
  CellStyle,
  GridparkCodeFile,
} from '../../../types/excel';
import { parseGridSelector, ParsedGridSelector } from '../../../utils/selectorUtils'; // New import

import { excelTheme } from './theme';
import { ExcelGrid } from './ExcelGrid';

// Interface for the controlled GridElement proxy object (simplified for direct DOM element access for now)
// Note: Actual implementation will involve creating a Proxy object to mediate access.
export interface GridElement {
  // Read-only properties
  readonly id: string; // Internal ID for React reconciliation, potentially based on cell address/sheet
  readonly className: string;
  readonly dataset: DOMStringMap;
  readonly value: any; // Displayed value of a cell
  readonly address: string; // Excel-style address (e.g., "A1")
  readonly name?: string; // Name of sheet/column/row
  readonly rowIndex?: number; // 0-based index
  readonly columnIndex?: number; // 0-based index
  readonly sheetName?: string; // Name of the sheet this element belongs to

  // Writable properties (visual only, data changes require grid.setRange)
  style: Partial<CSSStyleDeclaration>; // Subset of style properties for visual manipulation

  // Event handling (delegated to actual DOM element)
  addEventListener(event: string, handler: EventListener): void;
  removeEventListener(event: string, handler: EventListener): void;

  // Attributes (delegated to actual DOM element)
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;

  // Data interaction methods (will delegate to ExcelViewer's props/functions)
  setValue(value: any): void; // Changes displayed value, potentially triggers cell change event
  // Add other methods like setRange, clearRange etc. as needed

  // Internal reference to the actual DOM element (for controlled access)
  _domElement: HTMLElement;
}

const cloneSheetData = (data: CellData[][]): CellData[][] =>
  data.map(row => row.map(cell => ({ ...cell })));

const DEFAULT_RENDERED_ROWS = 100; // Increased default for better UX with virtualization
const DEFAULT_RENDERED_COLUMNS = 100; // Start with many columns to ensure horizontal scrollbar and show beyond AZ (A-Z, AA-AZ, BA-CV)

const createEmptyCell = (): CellData => ({
  value: null,
  type: 'empty',
});

const getMaxColumnCount = (rows: CellData[][]): number =>
  rows.reduce((max, row) => Math.max(max, row?.length ?? 0), 0);

const ensureGridDimensions = (data: CellData[][], targetRows: number, targetCols: number) => {
  const rows = Math.max(targetRows, data.length);
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    if (!data[rowIndex]) {
      data[rowIndex] = [];
    }
    const row = data[rowIndex];
    for (let colIndex = row.length; colIndex < targetCols; colIndex += 1) {
      if (!row[colIndex]) {
        row[colIndex] = createEmptyCell();
      }
    }
  }
};

// Dynamic expansion
const _EXPANSION_THRESHOLD = 5; // Expand when within 5 rows/cols of edge
const EXPANSION_BATCH_ROWS = 50;
const EXPANSION_BATCH_COLS = 10;

export type SheetSessionState = {
  data: CellData[][];
  dirty: boolean;
};

export type SearchNavigationCommand = {
  requestId: number;
  direction: 1 | -1;
};

export type ReplaceCommand = {
  requestId: number;
  mode: 'single' | 'all';
  replacement: string;
};

export type FormulaCommitCommand = {
  requestId: number;
  value: string;
};

export interface ActiveCellDetails {
  position: CellPosition;
  address: string;
  displayValue: string;
  formula?: string;
}

interface GridparkCellEvent {
  ref: string;
  value: string;
  row: number;
  col: number;
  sheet: string;
  element: HTMLElement | null;
}

const getColumnWidth = (colIndex: number) => (colIndex === 0 ? 56 : 96);
const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;
const ROW_HEADER_WIDTH = 40;

const inferCellType = (value: string): CellData['type'] => {
  if (value === '') return 'empty';
  return isNaN(Number(value)) ? 'string' : 'number';
};

const columnLabelToIndex = (label: string): number => {
  let result = 0;
  for (let i = 0; i < label.length; i++) {
    result *= 26;
    result += label.charCodeAt(i) - 64;
  }
  return result - 1;
};

const parseCellRef = (ref: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase());
  if (!match) return null;
  const [, colLabel, rowLabel] = match;
  return {
    row: Number(rowLabel) - 1,
    col: columnLabelToIndex(colLabel),
  };
};

// Helper function to create a GridElement proxy
const createGridElement = (
  domElement: HTMLElement,
  currentSheetName: string, // Pass currentSheetName to derive sheetName for GridElement
  onCellChange: (row: number, col: number, value: any) => void,
  setCellStyle: (row: number, col: number, style: CellStyle) => void,
  setRangeStyle: (range: CellRange, style: CellStyle) => void,
  getColumnLabel: (colIndex: number) => string,
  parseCellRef: (ref: string) => { row: number; col: number } | null
): GridElement | null => {
  if (!domElement) return null;

  const getCellPosition = (element: HTMLElement) => {
    const rowNumStr = element.dataset.rowNum;
    const colId = element.dataset.colId;
    const address = element.dataset.cellAddress;

    if (!rowNumStr || !colId || !address) return null;

    return {
      row: parseInt(rowNumStr, 10) - 1,
      col: columnLabelToIndex(colId),
      address,
    };
  };

  const _getRangeFromAddresses = (startAddress: string, endAddress: string): CellRange | null => {
    const startPos = parseCellRef(startAddress);
    const endPos = parseCellRef(endAddress);
    if (!startPos || !endPos) return null;
    return {
      startRow: startPos.row,
      startCol: startPos.col,
      endRow: endPos.row,
      endCol: endPos.col,
    };
  };

  const internalGridElement: GridElement = {
    _domElement: domElement,
    get id() {
      return domElement.id;
    },
    get className() {
      return domElement.className;
    },
    get dataset() {
      return domElement.dataset;
    },
    get style() {
      // Return a proxy for style to ensure mediated access
      return new Proxy({} as CSSStyleDeclaration, {
        get: (target, prop) => {
          if (typeof prop === 'string' && domElement.style[prop as any] !== undefined) {
            return domElement.style[prop as any];
          }
          return (domElement.style as any)[prop];
        },
        set: (target, prop, value) => {
          if (typeof prop === 'string') {
            (domElement.style as any)[prop] = value;
          }
          return true;
        },
      }) as CSSStyleDeclaration;
    },
    addEventListener: (event, handler) =>
      domElement.addEventListener(event, handler as EventListener),
    removeEventListener: (event, handler) =>
      domElement.removeEventListener(event, handler as EventListener),
    setAttribute: (name, value) => domElement.setAttribute(name, value),
    getAttribute: name => domElement.getAttribute(name),

    // Spreadsheet-specific properties (read-only from DOM attributes)
    get value() {
      return domElement.dataset.cellValue || null;
    },
    get address() {
      return domElement.dataset.cellAddress || '';
    },
    get name() {
      return (
        domElement.dataset.sheetName || domElement.dataset.colId || domElement.dataset.rowNum || ''
      );
    },
    get rowIndex() {
      const r = domElement.dataset.rowNum;
      return r ? parseInt(r, 10) - 1 : undefined;
    },
    get columnIndex() {
      const c = domElement.dataset.colId;
      return c ? columnLabelToIndex(c) : undefined;
    },
    get sheetName() {
      return domElement.dataset.sheetName || currentSheetName;
    }, // Use data-sheet-name or fallback to currentSheetName

    // Methods for data interaction
    setValue: (value: any) => {
      const pos = getCellPosition(domElement);
      if (pos) {
        onCellChange(pos.row, pos.col, value);
      }
    },
    setRange: (startAddress: string, endAddress: string, values: any[][]) => {
      const targetSelector = `Sheet:${internalGridElement.sheetName || currentSheetName}!Range:${startAddress}:${endAddress}`;
      if (typeof window !== 'undefined' && (window as any).gridparkAPI?.grid?.setRange) {
        (window as any).gridparkAPI.grid.setRange(targetSelector, values);
      } else {
        console.error('Gridpark API not available to set range via GridElement.');
      }
    },
  };

  return internalGridElement;
};

const evaluateExpression = (
  expr: string,
  getCellValue: (row: number, col: number) => number,
  rowCount: number,
  colCount: number
): number => {
  const sumRegex = /SUM\(([^()]+)\)/gi;
  const cellRegex = /([A-Z]+\d+)/gi;

  const resolveRange = (rangeExpr: string): number => {
    let currentTotal = 0;
    const segments = rangeExpr.split(',').map(part => part.trim());

    segments.forEach(segment => {
      if (segment.includes(':')) {
        const [start, end] = segment.split(':').map(s => s.trim());

        const isStartColLabel = isColumnLabel(start);
        const isEndColLabel = isColumnLabel(end);
        const isStartRowNum = isRowNumber(start);
        const isEndRowNum = isRowNumber(end);

        // Case 1: Full column range (e.g., A:A or A:C)
        if (isStartColLabel && isEndColLabel) {
          const startColIdx = columnLabelToIndex(start);
          const endColIdx = columnLabelToIndex(end);

          if (startColIdx >= 0 && endColIdx >= 0) {
            for (
              let c = Math.min(startColIdx, endColIdx);
              c <= Math.max(startColIdx, endColIdx);
              c++
            ) {
              for (let r = 0; r < rowCount; r++) {
                currentTotal += getCellValue(r, c);
              }
            }
            return;
          }
        }

        // Case 2: Partial column range (e.g., B2:B or B2:C)
        const startCellMatch = /^([A-Z]+)(\d+)$/.exec(start.toUpperCase()); // "B2"
        const endColMatch = /^([A-Z]+)$/.exec(end.toUpperCase()); // "B" or "C"

        if (startCellMatch && endColMatch) {
          const startColLabel = startCellMatch[1];
          const startRowIdx = parseInt(startCellMatch[2]) - 1;
          const endColLabel = endColMatch[1];

          const startColIdx = columnLabelToIndex(startColLabel);
          const endColIdx = columnLabelToIndex(endColLabel);

          if (startColIdx >= 0 && endColIdx >= 0) {
            for (
              let c = Math.min(startColIdx, endColIdx);
              c <= Math.max(startColIdx, endColIdx);
              c++
            ) {
              for (let r = startRowIdx; r < rowCount; r++) {
                // From startRow to maxRow
                currentTotal += getCellValue(r, c);
              }
            }
            return;
          }
        }

        // Case 3: Full row range (e.g., 2:2 or 2:4)
        if (isStartRowNum && isEndRowNum) {
          const startRowIdx = parseInt(start) - 1;
          const endRowIdx = parseInt(end) - 1;
          for (
            let r = Math.min(startRowIdx, endRowIdx);
            r <= Math.max(startRowIdx, endRowIdx);
            r++
          ) {
            for (let c = 0; c < colCount; c++) {
              currentTotal += getCellValue(r, c);
            }
          }
          return;
        }

        // Default Case: Standard Cell Range (e.g., A1:B2)
        const startRef = parseCellRef(start);
        const endRef = parseCellRef(end);
        if (!startRef || !endRef) {
          // Handle error or return 0 for invalid range syntax
          console.warn(`Invalid cell range format: ${segment}`);
          return;
        }
        for (
          let r = Math.min(startRef.row, endRef.row);
          r <= Math.max(startRef.row, endRef.row);
          r++
        ) {
          for (
            let c = Math.min(startRef.col, endRef.col);
            c <= Math.max(startRef.col, endRef.col);
            c++
          ) {
            currentTotal += getCellValue(r, c);
          }
        }
        return;
      } else {
        // Case 4: Single Cell Reference (e.g., A1)
        const ref = parseCellRef(segment);
        if (!ref) {
          console.warn(`Invalid cell reference: ${segment}`);
          return;
        }
        currentTotal += getCellValue(ref.row, ref.col);
      }
    });
    return currentTotal;
  };

  let sanitized = expr.replace(sumRegex, (_, range) => `${resolveRange(range)}`);
  sanitized = sanitized.replace(cellRegex, match => {
    const ref = parseCellRef(match);
    if (!ref) return '0';
    const value = getCellValue(ref.row, ref.col);
    return Number.isFinite(value) ? `${value}` : '0';
  });

  if (/[^0-9+\-*/().\s]/.test(sanitized)) {
    throw new Error('Invalid characters in formula');
  }

  // eslint-disable-next-line no-new-func
  const evaluator = new Function(`return (${sanitized || 0});`);
  const result = evaluator();
  if (typeof result === 'number' && Number.isFinite(result)) {
    return result;
  }
  throw new Error('Formula evaluation failed');
};

const recalculateSheetData = (data: CellData[][]): CellData[][] => {
  const cloned = cloneSheetData(data);
  const cache = new Map<string, number>();
  const visiting = new Set<string>();

  const getNumericValue = (row: number, col: number): number => {
    const key = `${row}-${col}`;
    if (cache.has(key)) {
      return cache.get(key) ?? 0;
    }
    const cell = cloned[row]?.[col];
    if (!cell) {
      cache.set(key, 0);
      return 0;
    }
    if (cell.formula && cell.formula.startsWith('=')) {
      if (visiting.has(key)) {
        throw new Error('Circular reference detected');
      }
      visiting.add(key);
      const expr = cell.formula.slice(1);
      const evaluated = evaluateExpression(expr, getNumericValue);
      visiting.delete(key);
      cache.set(key, evaluated);
      cell.value = evaluated;
      cell.type = 'number';
      return evaluated;
    }
    const numeric = Number(cell.value);
    const finalValue = Number.isFinite(numeric) ? numeric : 0;
    cache.set(key, finalValue);
    return finalValue;
  };

  cloned.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.formula && cell.formula.startsWith('=')) {
        try {
          const evaluated = getNumericValue(rowIndex, colIndex);
          cell.value = evaluated;
          cell.type = 'number';
        } catch (error) {
          cell.value = '#ERROR';
          cell.type = 'string';
        }
      }
    });
  });

  return cloned;
};

function getColumnLabel(index: number): string {
  // Excel column labels: A, B, ..., Z, AA, AB, ..., AZ, BA, BB, ...
  // Excel uses 1-indexed columns internally (A=1, Z=26, AA=27, AZ=52, BA=53, ZZ=702, AAA=703)
  // We convert from 0-indexed (A=0, Z=25, AA=26, etc.)
  let result = '';
  let num = index + 1; // Convert to 1-indexed

  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }

  return result;
}

function getCellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

const _gridQuerySelector = (
  root: HTMLElement,
  selector: string,
  currentSheetName: string,
  onCellChange: (row: number, col: number, value: any) => void,
  setCellStyle: (row: number, col: number, style: CellStyle) => void,
  setRangeStyle: (range: CellRange, style: CellStyle) => void,
  getColumnLabel: (colIndex: number) => string,
  parseCellRef: (ref: string) => { row: number; col: number } | null
): GridElement | null => {
  const parsed = parseGridSelector(selector);
  if (!parsed.elementType) {
    console.warn('Invalid or unparseable selector for grid.querySelector:', selector);
    return null;
  }
  const foundElement = findElements(root, parsed, currentSheetName)[0];
  if (!foundElement) return null;
  return createGridElement(
    foundElement,
    currentSheetName,
    onCellChange,
    setCellStyle,
    setRangeStyle,
    getColumnLabel,
    parseCellRef
  );
};

const _gridQuerySelectorAll = (
  root: HTMLElement,
  selector: string,
  currentSheetName: string,
  onCellChange: (row: number, col: number, value: any) => void,
  setCellStyle: (row: number, col: number, style: CellStyle) => void,
  setRangeStyle: (range: CellRange, style: CellStyle) => void,
  getColumnLabel: (colIndex: number) => string
): GridElement[] => {
  const parsed = parseGridSelector(selector);
  if (!parsed.elementType) {
    console.warn('Invalid or unparseable selector for grid.querySelectorAll:', selector);
    return [];
  }
  const foundElements = findElements(root, parsed, currentSheetName);
  return foundElements
    .map(el =>
      createGridElement(
        el,
        currentSheetName,
        onCellChange,
        setCellStyle,
        setRangeStyle,
        getColumnLabel,
        parseCellRef
      )
    )
    .filter(Boolean) as GridElement[];
};

const isColumnLabel = (str: string) => /^[A-Z]+$/.test(str);
const isRowNumber = (str: string) => /^\d+$/.test(str);

// Helper to check if a DOM element matches a parsed selector part
const matchesParsedSelector = (
  element: HTMLElement,
  parsed: ParsedGridSelector,
  currentSheetName: string
): boolean => {
  // 1. Check element type (class name)
  if (parsed.elementType) {
    let expectedClassName: string;
    switch (parsed.elementType) {
      case 'Sheet':
        expectedClassName = 'sheet';
        break;
      case 'Row':
        expectedClassName = 'row';
        break;
      case 'Col':
        expectedClassName = 'col';
        break;
      case 'Cell':
        expectedClassName = 'cell';
        break;
      case 'Range':
        expectedClassName = 'cell';
        break; // Range targets cells
      default:
        return false; // Unknown element type
    }
    if (!element.classList.contains(expectedClassName)) {
      return false;
    }
  }

  // 2. Check sheetName
  const elementSheetName =
    element.dataset.sheetName || element.closest('.sheet')?.dataset.sheetName;
  if (parsed.sheetName) {
    const targetSheetName = parsed.sheetName === 'Active' ? currentSheetName : parsed.sheetName;
    if (elementSheetName !== targetSheetName) {
      return false;
    }
  } else {
    // If no sheetName is specified in selector, assume active sheet context
    if (elementSheetName && elementSheetName !== currentSheetName) {
      return false;
    }
  }

  // 3. Check identifier (address, colId, rowNum for direct match)
  if (parsed.identifier) {
    switch (parsed.elementType) {
      case 'Cell':
        if (element.dataset.cellAddress !== parsed.identifier) return false;
        break;
      case 'Range':
        if (element.dataset.inRange !== 'true') return false; // For now, if the selector specified a _range, we check for data-in-range="true"
        break;
      case 'Col':
        if (element.dataset.colId !== parsed.identifier) return false;
        break;
      case 'Row':
        if (element.dataset.rowNum !== parsed.identifier) return false;
        break;
      case 'Sheet':
        if (element.dataset.sheetName !== parsed.identifier) return false;
        break;
    }
  }

  // 4. Check conditions (data attributes and pseudo-selectors)
  if (parsed.conditions && parsed.conditions.length > 0) {
    for (const condition of parsed.conditions) {
      const dataAttr = condition.attribute.toLowerCase(); // e.g., value
      const elementValue = element.dataset[dataAttr]; // e.g., element.dataset.value

      // Handle pseudo-selectors that might not have a direct data attribute or have special logic
      if (condition.attribute === 'active') {
        if (element.dataset.active !== 'true') return false;
        continue;
      }
      if (condition.attribute === 'selected') {
        if (element.dataset.selected !== 'true') return false;
        continue;
      }
      if (condition.attribute === 'dirty') {
        if (element.dataset.dirty !== 'true') return false;
        continue;
      }
      if (condition.attribute === 'error') {
        if (element.dataset.error !== 'true') return false;
        continue;
      }

      if (elementValue === undefined) return false; // Attribute not present on element

      switch (condition.operator) {
        case '=': // Exact match
          if (elementValue !== condition.value) return false;
          break;
        case '^=': // Starts with
          if (!elementValue.startsWith(condition.value)) return false;
          break;
        case '$=': // Ends with
          if (!elementValue.endsWith(condition.value)) return false;
          break;
        case '*=': // Contains
          if (!elementValue.includes(condition.value)) return false;
          break;
        case '~=': // Contains word (case-insensitive)
          const regex = new RegExp(`\\b${condition.value}\\b`, 'i');
          if (!regex.test(elementValue)) return false;
          break;
        // Future: Numerical comparisons (e.g., <, >, <=, >=) would require parsing values as numbers
        // For now, these are not directly handled in matchesParsedSelector for simplicity.
        default:
          console.warn(`Unsupported operator for condition filtering: ${condition.operator}`);
          return false;
      }
    }
  }

  return true;
};

const findElements = (
  root: HTMLElement,
  parsed: ParsedGridSelector,
  currentSheetName: string
): HTMLElement[] => {
  if (!root || !parsed.elementType) return [];

  let queryScope: HTMLElement | Document = root;
  const cssSelectorParts: string[] = [];

  let baseElementClass = parsed.elementType.toLowerCase();
  if (parsed.elementType === 'Range') baseElementClass = 'cell'; // Range targets cells

  if (parsed.sheetName) {
    const targetSheetName = parsed.sheetName === 'Active' ? currentSheetName : parsed.sheetName;
    if (root.classList.contains('sheet') && root.dataset.sheetName === targetSheetName) {
      // Query within this root
    } else {
      const sheetElement = root.querySelector(`.sheet[data-sheet-name="${targetSheetName}"]`);
      if (!sheetElement) return [];
      queryScope = sheetElement as HTMLElement;
    }
  } else {
    const activeSheetElement = root.querySelector(`.sheet[data-sheet-name="${currentSheetName}"]`);
    if (!activeSheetElement) return []; // No active sheet found
    queryScope = activeSheetElement as HTMLElement;
  }

  cssSelectorParts.push(`.${baseElementClass}`);

  if (parsed.identifier) {
    switch (parsed.elementType) {
      case 'Cell':
        cssSelectorParts.push(`[data-cell-address="${parsed.identifier}"]`);
        break;
      case 'Col':
        cssSelectorParts.push(`[data-col-id="${parsed.identifier}"]`);
        break;
      case 'Row':
        cssSelectorParts.push(`[data-row-num="${parsed.identifier}"]`);
        break;
      case 'Sheet':
        break;
      case 'Range':
        cssSelectorParts.push(`[data-in-range="true"]`);
        break;
    }
  }

  if (parsed.conditions) {
    for (const condition of parsed.conditions) {
      if (!['active', 'selected', 'dirty', 'error'].includes(condition.attribute)) {
        if (['=', '^=', '$=', '*='].includes(condition.operator || '=')) {
          cssSelectorParts.push(
            `[data-${condition.attribute.toLowerCase()}${condition.operator || '='}"${condition.value}"]`
          );
        }
      }
    }
  }

  if (parsed.selectorString?.includes(':active')) cssSelectorParts.push('[data-active="true"]');
  if (parsed.selectorString?.includes(':selected')) cssSelectorParts.push('[data-selected="true"]');
  if (parsed.selectorString?.includes(':dirty')) cssSelectorParts.push('[data-dirty="true"]');
  if (parsed.selectorString?.includes(':error')) cssSelectorParts.push('[data-error="true"]');

  const finalCssSelector = cssSelectorParts.join('');

  const domElements = Array.from(queryScope.querySelectorAll(finalCssSelector)) as HTMLElement[];

  return domElements.filter(el => matchesParsedSelector(el, parsed, currentSheetName));
};

export interface ExcelViewerProps {
  file: ExcelFile | null;
  sheetIndex?: number;
  sessionState?: SheetSessionState;
  _onSessionChange?: (state: SheetSessionState) => void;
  _onSaveSession?: (state: SheetSessionState) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onCellSelect?: (position: CellPosition) => void;
  onRangeSelect?: (range: CellRange) => void;
  searchQuery?: string;
  searchNavigation?: SearchNavigationCommand;
  replaceCommand?: ReplaceCommand | null;
  formulaCommit?: FormulaCommitCommand | null;
  onActiveCellDetails?: (details: ActiveCellDetails) => void;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  file,
  sheetIndex = 0,
  sessionState,
  _onSessionChange,
  _onSaveSession,
  onDirtyChange,
  onCellSelect,
  onRangeSelect,
  searchQuery,
  searchNavigation,
  replaceCommand,
  formulaCommit,
  onActiveCellDetails,
}) => {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyle>>(new Map());
  const [gridData, setGridData] = useState<CellData[][]>([]);
  // Dimensions state for dynamic expansion
  const [renderRowCount, setRenderRowCount] = useState(DEFAULT_RENDERED_ROWS);
  const [renderColCount, setRenderColCount] = useState(DEFAULT_RENDERED_COLUMNS);

  const _gridRef = useRef<VirtualizedGridRef>(null);
  const watchersRef = useRef<Array<(event: GridparkCellEvent) => void>>([]);
  const latestGridDataRef = useRef<CellData[][]>([]);
  const dirtyRef = useRef<boolean>(sessionState?.dirty ?? false);
  const formulaCommitRef = useRef<number>(0);
  const [hasLocalChanges, setHasLocalChanges] = useState<boolean>(sessionState?.dirty ?? false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const navigationRef = useRef<number>(0);
  const replaceRequestRef = useRef<number>(0);

  const notifyWatchers = useCallback((event: GridparkCellEvent) => {
    watchersRef.current.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Gridpark watcher error', error);
      }
    });
  }, []);

  const normalizedSheetIndex = useMemo(() => {
    if (!file || file.sheets.length === 0) return 0;
    return Math.max(0, Math.min(sheetIndex, file.sheets.length - 1));
  }, [file, sheetIndex]);

  const currentSheet = file?.sheets[normalizedSheetIndex] || null;

  const sheetData = useMemo(() => {
    const baseData = gridData.length > 0 ? gridData : (currentSheet?.data ?? []);
    if (!currentSheet && gridData.length === 0) {
      return [] as CellData[][];
    }
    // Ensure dimensions cover at least the data + buffer
    const _maxDataCol = getMaxColumnCount(baseData);

    // We use state values renderRowCount/ColCount to drive the virtual grid size
    // But we also need to ensure the underlying data array is big enough to avoid index out of bounds
    // However, we don't want to resize the array on every render.
    // The `gridData` state holds the full dataset.
    // If `gridData` is smaller than `renderRowCount`, we treat missing rows as empty.
    return baseData;
  }, [gridData, currentSheet]);

  // Sync render counts with data
  useEffect(() => {
    const baseData = gridData.length > 0 ? gridData : (currentSheet?.data ?? []);
    const dataRows = baseData.length;
    const dataCols = getMaxColumnCount(baseData);
    setRenderRowCount(Math.max(DEFAULT_RENDERED_ROWS, dataRows + EXPANSION_BATCH_ROWS));
    setRenderColCount(Math.max(DEFAULT_RENDERED_COLUMNS, dataCols + EXPANSION_BATCH_COLS));
  }, [gridData, currentSheet]);

  const _readGridparkFile = useCallback(async (_codeFile?: GridparkCodeFile) => {
    // Placeholder for reading files if needed for scripts/styles later
    return '';
  }, []);

  const normalizedSearchTerm = (searchQuery ?? '').trim();

  const getCellValue = useCallback(
    (row: number, col: number): CellData | null => {
      if (!sheetData || row < 0 || col < 0) return null;
      return sheetData[row]?.[col] ?? createEmptyCell();
    },
    [sheetData]
  );

  const emitActiveCellDetails = useCallback(
    (row: number, col: number) => {
      if (!onActiveCellDetails) return;
      const cell = getCellValue(row, col);
      if (!cell) return;
      const address = `${getColumnLabel(col)}${row + 1}`;
      const displayValue = cell.formula
        ? cell.formula
        : cell.value !== null && cell.value !== undefined
          ? String(cell.value)
          : '';
      onActiveCellDetails({
        position: { row, col },
        address,
        displayValue,
        formula: cell.formula,
      });
    },
    [onActiveCellDetails, getCellValue]
  );

  const searchMatches = useMemo(() => {
    if (!normalizedSearchTerm || !sheetData.length) {
      return [] as Array<{ row: number; col: number }>;
    }
    const query = normalizedSearchTerm.toLowerCase();
    const matches: Array<{ row: number; col: number }> = [];
    // Search optimization: only search populated cells in data
    sheetData.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) return;
      row.forEach((cell, colIndex) => {
        const value = cell?.value;
        if (value === null || value === undefined) return;
        const cellText = typeof value === 'string' ? value : String(value);
        if (cellText.toLowerCase().includes(query)) {
          matches.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    return matches;
  }, [sheetData, normalizedSearchTerm]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [normalizedSearchTerm, normalizedSheetIndex]);

  useEffect(() => {
    if (activeMatchIndex >= searchMatches.length) {
      setActiveMatchIndex(searchMatches.length > 0 ? searchMatches.length - 1 : 0);
    }
  }, [searchMatches.length, activeMatchIndex]);

  const currentSearchMatch = useMemo(() => {
    if (!searchMatches.length) return null;
    return searchMatches[Math.min(activeMatchIndex, searchMatches.length - 1)];
  }, [searchMatches, activeMatchIndex]);

  const searchMatchMap = useMemo(() => {
    const map = new Map<string, 'match'>();
    searchMatches.forEach(match => {
      map.set(getCellKey(match.row, match.col), 'match');
    });
    return map;
  }, [searchMatches]);

  useEffect(() => {
    if (!searchNavigation) return;
    const { requestId, direction } = searchNavigation;
    if (requestId === 0 || navigationRef.current === requestId) return;
    navigationRef.current = requestId;
    if (!searchMatches.length) return;
    setActiveMatchIndex(prev => {
      if (!searchMatches.length) return 0;
      let next = prev + direction;
      if (next < 0) next = searchMatches.length - 1;
      if (next >= searchMatches.length) next = 0;
      return next;
    });
  }, [searchNavigation, searchMatches.length]);

  // Track if we're in the process of updating to prevent circular updates
  const isUpdatingFromGridDataRef = useRef(false);

  useEffect(() => {
    // Only update gridData from sessionState if we're not currently pushing changes
    // This prevents the circular update: gridData -> sessionState -> gridData
    if (isUpdatingFromGridDataRef.current) {
      return;
    }

    if (sessionState && sessionState.data.length) {
      setGridData(recalculateSheetData(sessionState.data));
      setHasLocalChanges(sessionState.dirty);
      return;
    }
    if (currentSheet) {
      setGridData(recalculateSheetData(currentSheet.data));
      setHasLocalChanges(false);
    } else {
      setGridData([]);
      setHasLocalChanges(false);
    }
  }, [currentSheet, sessionState]);

  useEffect(() => {
    latestGridDataRef.current = gridData;

    // FIX: Call _onSessionChange immediately when gridData changes
    // This ensures ExcelViewerDexie always has the latest data
    // Set flag to prevent circular updates (gridData -> sessionState -> gridData)
    if (__onSessionChange) {
      isUpdatingFromGridDataRef.current = true;
      _onSessionChange({
        data: gridData,
        dirty: hasLocalChanges,
      });
      // Reset flag after a short delay to allow sessionState to update
      setTimeout(() => {
        isUpdatingFromGridDataRef.current = false;
      }, 100);
    }
  }, [gridData, hasLocalChanges, _onSessionChange]);

  useEffect(() => {
    dirtyRef.current = hasLocalChanges;
    onDirtyChange?.(hasLocalChanges);
  }, [hasLocalChanges, onDirtyChange]);

  useEffect(() => {
    if (!selectedCell) return;
    emitActiveCellDetails(selectedCell.row, selectedCell.col);
  }, [selectedCell, sheetData, emitActiveCellDetails]);

  // Cleanup: ensure final state is saved on unmount
  useEffect(() => {
    return () => {
      if (__onSessionChange) {
        _onSessionChange({
          data: latestGridDataRef.current,
          dirty: dirtyRef.current,
        });
      }
    };
  }, [_onSessionChange]);

  // -- Dynamic Expansion on Scroll --
  const handleScroll = useCallback(
    ({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
      // Calculate total scrollable dimensions
      const currentMaxRowHeight = renderRowCount * ROW_HEIGHT;
      const currentMaxColWidth = renderColCount * 96; // Approx average column width

      // Infinite expansion: expand when within threshold pixels of edge
      const SCROLL_THRESHOLD = 500; // pixels from edge to trigger expansion

      // Expand rows if scrolled near bottom
      if (scrollTop + SCROLL_THRESHOLD > currentMaxRowHeight) {
        setRenderRowCount(prev => prev + EXPANSION_BATCH_ROWS);
      }

      // Expand columns if scrolled near right
      if (scrollLeft + SCROLL_THRESHOLD > currentMaxColWidth) {
        setRenderColCount(prev => prev + EXPANSION_BATCH_COLS);
      }

      // Dynamic pruning: check if we should remove empty trailing rows/columns
      // Only prune when scrolled back and user hasn't been near the edges recently
      const isScrolledAwayFromBottom = scrollTop < currentMaxRowHeight * 0.7;
      const isScrolledAwayFromRight = scrollLeft < currentMaxColWidth * 0.7;

      if (isScrolledAwayFromBottom && renderRowCount > DEFAULT_RENDERED_ROWS) {
        // Check if trailing rows are empty
        const checkStartRow = Math.max(DEFAULT_RENDERED_ROWS, Math.floor(renderRowCount * 0.8));
        let hasDataInTrailingRows = false;

        for (let row = checkStartRow; row < Math.min(sheetData.length, renderRowCount); row++) {
          for (let col = 0; col < Math.min(sheetData[row]?.length || 0, renderColCount); col++) {
            const cell = sheetData[row]?.[col];
            if (cell && cell.value !== null && cell.value !== undefined && cell.value !== '') {
              hasDataInTrailingRows = true;
              break;
            }
          }
          if (hasDataInTrailingRows) break;
        }

        if (!hasDataInTrailingRows) {
          setRenderRowCount(prev => Math.max(DEFAULT_RENDERED_ROWS, Math.floor(prev * 0.8)));
        }
      }

      if (isScrolledAwayFromRight && renderColCount > DEFAULT_RENDERED_COLUMNS) {
        // Check if trailing columns are empty
        const checkStartCol = Math.max(DEFAULT_RENDERED_COLUMNS, Math.floor(renderColCount * 0.8));
        let hasDataInTrailingCols = false;

        for (let col = checkStartCol; col < renderColCount; col++) {
          for (let row = 0; row < Math.min(sheetData.length, renderRowCount); row++) {
            const cell = sheetData[row]?.[col];
            if (cell && cell.value !== null && cell.value !== undefined && cell.value !== '') {
              hasDataInTrailingCols = true;
              break;
            }
          }
          if (hasDataInTrailingCols) break;
        }

        if (!hasDataInTrailingCols) {
          setRenderColCount(prev => Math.max(DEFAULT_RENDERED_COLUMNS, Math.floor(prev * 0.8)));
        }
      }
    },
    [renderRowCount, renderColCount, sheetData]
  );

  // -- Render Helpers --

  const _isCellInRange = (row: number, col: number): boolean => {
    if (!selectionRange) return false;
    return (
      row >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
      row <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
      col >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
      col <= Math.max(selectionRange.startCol, selectionRange.endCol)
    );
  };

  const dispatchGridparkEvent = useCallback(
    (name: string, detail: GridparkCellEvent | { sheet: string }) => {
      document.dispatchEvent(new CustomEvent(name, { detail }));
    },
    []
  );

  const createGridparkEventDetail = useCallback(
    (row: number, col: number, value: string): GridparkCellEvent | null => {
      if (!currentSheet) return null;
      const ref = `${getColumnLabel(col)}${row + 1}`;
      // Note: Element lookup is broken with virtualization if the element is not rendered
      // We pass null for now or need a way to get ref from VirtualGrid if visible
      return {
        ref,
        value,
        row,
        col,
        sheet: currentSheet.name,
        element: null,
      };
    },
    [currentSheet]
  );

  const handleCellMouseDown = (row: number, col: number) => {
    const position = { row, col };
    setSelectedCell(position);
    setSelectionRange({
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    });
    setIsSelecting(true);
    onCellSelect?.(position);
    emitActiveCellDetails(row, col);

    const cell = getCellValue(row, col);
    const cellValue = cell?.value;
    const eventDetail =
      cellValue !== undefined
        ? createGridparkEventDetail(row, col, cellValue != null ? String(cellValue) : '')
        : null;
    if (eventDetail) {
      dispatchGridparkEvent('gridpark:cell-select', eventDetail);
    }
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionRange) return;
    setSelectionRange({
      ...selectionRange,
      endRow: row,
      endCol: col,
    });
  };

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionRange) {
      setIsSelecting(false);
      onRangeSelect?.(selectionRange);
    }
  }, [isSelecting, selectionRange, onRangeSelect]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      setGridData(prev => {
        const updated = cloneSheetData(prev);
        const targetRows = Math.max(updated.length, row + 1);
        const targetCols = Math.max(getMaxColumnCount(updated), col + 1);
        ensureGridDimensions(updated, targetRows, targetCols);
        const cell = updated[row]?.[col];
        if (!cell) return prev;
        if (value.startsWith('=')) {
          cell.formula = value;
        } else {
          cell.formula = undefined;
          cell.value = value;
          cell.type = inferCellType(value);
        }
        return recalculateSheetData(updated);
      });
      dirtyRef.current = true;
      setHasLocalChanges(true);

      const detail = createGridparkEventDetail(row, col, value);
      if (detail) {
        notifyWatchers(detail);
        dispatchGridparkEvent('gridpark:cell-change', detail);
      }
    },
    [createGridparkEventDetail, dispatchGridparkEvent, notifyWatchers]
  );

  // -- API for Insert/Delete --
  // These will modify the gridData state directly
  const insertRow = useCallback((index: number) => {
    setGridData(prev => {
      const next = cloneSheetData(prev);
      const colCount = getMaxColumnCount(next);
      const newRow = Array.from({ length: colCount }, () => createEmptyCell());
      if (index >= next.length) {
        next.push(newRow);
      } else {
        next.splice(index, 0, newRow);
      }
      return recalculateSheetData(next);
    });
    setHasLocalChanges(true);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setGridData(prev => {
      const next = cloneSheetData(prev);
      if (index >= 0 && index < next.length) {
        next.splice(index, 1);
      }
      return recalculateSheetData(next);
    });
    setHasLocalChanges(true);
  }, []);

  const insertCol = useCallback((index: number) => {
    setGridData(prev => {
      const next = cloneSheetData(prev);
      next.forEach(row => {
        row.splice(index, 0, createEmptyCell());
      });
      return recalculateSheetData(next);
    });
    setHasLocalChanges(true);
  }, []);

  const deleteCol = useCallback((index: number) => {
    setGridData(prev => {
      const next = cloneSheetData(prev);
      next.forEach(row => {
        if (index >= 0 && index < row.length) {
          row.splice(index, 1);
        }
      });
      return recalculateSheetData(next);
    });
    setHasLocalChanges(true);
  }, []);

  useEffect(() => {
    if (!replaceCommand) return;
    if (replaceCommand.requestId === 0 || replaceRequestRef.current === replaceCommand.requestId) {
      return;
    }
    replaceRequestRef.current = replaceCommand.requestId;
    if (!normalizedSearchTerm || !searchMatches.length) return;
    if (replaceCommand.mode === 'all') {
      searchMatches.forEach(match => {
        handleCellChange(match.row, match.col, replaceCommand.replacement);
      });
      return;
    }
    const targetMatch = currentSearchMatch ?? searchMatches[0];
    if (targetMatch) {
      handleCellChange(targetMatch.row, targetMatch.col, replaceCommand.replacement);
    }
  }, [replaceCommand, normalizedSearchTerm, searchMatches, currentSearchMatch, handleCellChange]);

  useEffect(() => {
    if (!formulaCommit || formulaCommit.requestId === 0) return;
    if (formulaCommitRef.current === formulaCommit.requestId) return;
    if (!selectedCell) return;
    formulaCommitRef.current = formulaCommit.requestId;
    handleCellChange(selectedCell.row, selectedCell.col, formulaCommit.value);
  }, [formulaCommit, selectedCell, handleCellChange]);

  // Public API: Set cell style
  const setCellStyle = useCallback((row: number, col: number, style: CellStyle) => {
    setCellStyles(prev => {
      const newStyles = new Map(prev);
      newStyles.set(getCellKey(row, col), style);
      return newStyles;
    });
  }, []);

  // Public API: Set range style
  const setRangeStyle = useCallback((range: CellRange, style: CellStyle) => {
    setCellStyles(prev => {
      const newStyles = new Map(prev);
      for (
        let row = Math.min(range.startRow, range.endRow);
        row <= Math.max(range.startRow, range.endRow);
        row++
      ) {
        for (
          let col = Math.min(range.startCol, range.endCol);
          col <= Math.max(range.startCol, range.endCol);
          col++
        ) {
          newStyles.set(getCellKey(row, col), style);
        }
      }
      return newStyles;
    });
  }, []);

  // Public API: Clear cell style
  const clearCellStyle = useCallback((row: number, col: number) => {
    setCellStyles(prev => {
      const newStyles = new Map(prev);
      newStyles.delete(getCellKey(row, col));
      return newStyles;
    });
  }, []);

  // Public API: Clear all styles
  const clearAllStyles = useCallback(() => {
    setCellStyles(new Map());
  }, []);

  // Expose API via ref
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the root element of the Excel grid to scope queries
      // We assume the ExcelGrid component is the primary container for the sheet
      const gridRootElement = document.querySelector('.sheet');

      (window as any).gridparkAPI = {
        getCellValue,
        setCellStyle,
        setRangeStyle,
        clearCellStyle,
        clearAllStyles,
        getSelectedCell: () => selectedCell,
        getSelectionRange: () => selectionRange,
        // New CRUD
        insertRow,
        deleteRow,
        insertCol,
        deleteCol,
        // Gridpark Semantic Selector API
        grid: {
          querySelector: (selector: string) => {
            if (!gridRootElement) {
              console.error('Grid root element not found for selector query.');
              return null;
            }
            return _gridQuerySelector(
              gridRootElement as HTMLElement,
              selector,
              currentSheet?.name || '',
              handleCellChange,
              setCellStyle,
              setRangeStyle,
              getColumnLabel,
              parseCellRef
            );
          },
          querySelectorAll: (selector: string) => {
            if (!gridRootElement) {
              console.error('Grid root element not found for selector query.');
              return [];
            }
            return _gridQuerySelectorAll(
              gridRootElement as HTMLElement,
              selector,
              currentSheet?.name || '',
              handleCellChange,
              setCellStyle,
              setRangeStyle,
              getColumnLabel,
              parseCellRef
            );
          },
          setRange: (selector: string, values: any[][]) => {
            if (!gridRootElement) {
              console.error(
                'Grid root element not found for selector query when calling setRange.'
              );
              return;
            }
            const elements = _gridQuerySelectorAll(
              gridRootElement as HTMLElement,
              selector,
              currentSheet?.name || '',
              handleCellChange,
              setCellStyle,
              setRangeStyle,
              getColumnLabel,
              parseCellRef
            );
            elements.forEach((el, index) => {
              // Ensure we have a value for this element and it's a cell type
              if (
                el.rowIndex !== undefined &&
                el.columnIndex !== undefined &&
                values[index] !== undefined
              ) {
                // Assuming `values` is a 2D array or can be flattened/indexed correctly
                // For simplicity, this assumes a flat array of values or a single value per matched element.
                // A more robust implementation might require matching shape or explicit row/col for values.
                const val = Array.isArray(values[index]) ? values[index][0] : values[index];
                handleCellChange(el.rowIndex, el.columnIndex, val);
              }
            });
          },
        },
      };
    }
  }, [
    getCellValue,
    setCellStyle,
    setRangeStyle,
    clearCellStyle,
    clearAllStyles,
    selectedCell,
    selectionRange,
    insertRow,
    deleteRow,
    insertCol,
    deleteCol,
    currentSheet?.name, // Added for grid.querySelector/All
    handleCellChange,
    setCellStyle,
    setRangeStyle,
    getColumnLabel,
    parseCellRef, // Added for grid.querySelector/All
  ]);

  // -- Render Render Props --

  const handleColumnHeaderClick = useCallback(
    (colIndex: number) => {
      // Use renderRowCount to select all visible/virtualized cells in the column
      // Use the larger of data or render count to mimic "infinite" selection
      const maxRow = Math.max(sheetData.length, renderRowCount) - 1;

      const range = {
        startRow: 0,
        endRow: maxRow,
        startCol: colIndex,
        endCol: colIndex,
      };
      setSelectionRange(range);
      // Set active cell to the top of the column
      setSelectedCell({ row: 0, col: colIndex });
      setIsSelecting(false);
      onRangeSelect?.(range);
      emitActiveCellDetails(0, colIndex);
    },
    [sheetData.length, renderRowCount, onRangeSelect, emitActiveCellDetails]
  );

  const handleRowHeaderClick = useCallback(
    (rowIndex: number) => {
      // Use renderColCount to select all visible/virtualized cells in the row
      const maxCol = Math.max(getMaxColumnCount(sheetData), renderColCount) - 1;

      const range = {
        startRow: rowIndex,
        endRow: rowIndex,
        startCol: 0,
        endCol: maxCol,
      };
      setSelectionRange(range);
      // Set active cell to the start of the row
      setSelectedCell({ row: rowIndex, col: 0 });
      setIsSelecting(false);
      onRangeSelect?.(range);
      emitActiveCellDetails(rowIndex, 0);
    },
    [sheetData, renderColCount, onRangeSelect, emitActiveCellDetails]
  );

  const itemData = useMemo(
    () => ({
      currentSheetName: currentSheet?.name || '', // Add currentSheetName here
      sheetData,
      selectedCell,
      selectionRange,
      cellStyles,
      searchMatchMap,
      currentSearchMatch,
      onCellMouseDown: handleCellMouseDown,
      onCellMouseEnter: handleCellMouseEnter,
      onCellChange: handleCellChange,
      getColumnLabel,
      getCellKey,
      createEmptyCell,
    }),
    [
      currentSheet?.name, // Add currentSheet.name to dependencies
      sheetData,
      selectedCell,
      selectionRange,
      cellStyles,
      searchMatchMap,
      currentSearchMatch,
      handleCellMouseDown,
      handleCellMouseEnter,
      handleCellChange,
    ]
  );

  if (!file || !currentSheet) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'sm',
        }}
      >
        <Typography level="body-md" sx={{ color: 'neutral.500' }}>
          No file selected. Please select an Excel file from the file tree.
        </Typography>
      </Sheet>
    );
  }

  const handleSelectAll = useCallback(() => {
    // Use renderRowCount/ColCount to select all *visible/virtualized* cells,
    // or use sheetData dimensions for actual data.
    const maxRow = Math.max(sheetData.length, renderRowCount) - 1;
    const maxCol = Math.max(getMaxColumnCount(sheetData), renderColCount) - 1;

    if (maxRow < 0 || maxCol < 0) return;

    const range = {
      startRow: 0,
      startCol: 0,
      endRow: maxRow,
      endCol: maxCol,
    };

    setSelectionRange(range);
    setSelectedCell({ row: 0, col: 0 });
    setIsSelecting(false);
    onRangeSelect?.(range);
    emitActiveCellDetails(0, 0);
  }, [sheetData, renderRowCount, renderColCount, onRangeSelect, emitActiveCellDetails]);

  return (
    <CssVarsProvider theme={excelTheme} defaultMode="light">
      <ExcelGrid
        currentSheetName={currentSheet.name}
        renderColCount={renderColCount}
        renderRowCount={renderRowCount}
        getColumnWidth={getColumnWidth}
        getRowHeight={() => ROW_HEIGHT}
        headerHeight={HEADER_HEIGHT}
        rowHeaderWidth={ROW_HEADER_WIDTH}
        itemData={itemData as any}
        getColumnLabel={getColumnLabel}
        handleColumnHeaderClick={handleColumnHeaderClick}
        handleRowHeaderClick={handleRowHeaderClick}
        handleScroll={handleScroll}
        handleSelectAll={handleSelectAll}
      />
    </CssVarsProvider>
  );
};

ExcelViewer.displayName = 'GridparkExcelViewer';
