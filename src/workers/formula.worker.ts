/**
 * Formula Worker
 * 
 * Calculates formulas in a separate thread to avoid blocking the UI.
 * Uses IndexedDB for data access (Dexie works in Workers!)
 * 
 * Supported functions:
 * - SUM, AVERAGE, COUNT, MIN, MAX
 * - Future: Full Excel compatibility with HyperFormula
 */

import Dexie from 'dexie';

// ============================================================================
// IndexedDB Setup (Same schema as main thread)
// ============================================================================

interface StoredCellData {
  id?: number;
  tabId: string;
  row: number;
  col: number;
  value: any;
  type: string;
  formula?: string;
  style?: any;
  updatedAt: Date;
  version: number;
}

class WorkerDatabase extends Dexie {
  cells!: Dexie.Table<StoredCellData, number>;
  sheetMetadata!: Dexie.Table<any, number>;

  constructor() {
    super('ExcelAppDatabase');
    
    this.version(2).stores({
      sheetMetadata: '++id, tabId, workbookId, &[tabId], lastAccessedAt',
      cells: '++id, &[tabId+row+col], tabId, [tabId+row], [tabId+col], version',
    });
  }
}

const db = new WorkerDatabase();

// ============================================================================
// Types
// ============================================================================

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface CalculateMessage {
  type: 'CALCULATE';
  id: string;
  tabId: string;
  formula: string;
  cellRef: string;
}

interface BatchCalculateMessage {
  type: 'BATCH_CALCULATE';
  id: string;
  tabId: string;
  formulas: Array<{ cellRef: string; formula: string }>;
}

interface ResultMessage {
  type: 'RESULT';
  id: string;
  cellRef: string;
  result: number | string;
  duration: number;
}

interface BatchResultMessage {
  type: 'BATCH_RESULT';
  id: string;
  results: Array<{ cellRef: string; result: number | string }>;
  duration: number;
}

interface ErrorMessage {
  type: 'ERROR';
  id: string;
  error: string;
}

// ============================================================================
// Formula Parsing
// ============================================================================

/**
 * Convert column letter to index (A=0, B=1, ..., Z=25, AA=26)
 */
function columnToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

/**
 * Parse range reference (e.g., "A1:D10")
 */
function parseRangeReference(ref: string): CellRange {
  const match = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid range reference: ${ref}`);
  }
  
  const [, startCol, startRow, endCol, endRow] = match;
  
  return {
    startRow: parseInt(startRow) - 1,
    startCol: columnToIndex(startCol),
    endRow: parseInt(endRow) - 1,
    endCol: columnToIndex(endCol),
  };
}

/**
 * Parse formula (e.g., "=SUM(A1:D10)")
 */
function parseFormula(formula: string): { function: string; range: CellRange } | null {
  if (!formula.startsWith('=')) return null;
  
  const match = formula.match(/^=([A-Z]+)\(([A-Z0-9:]+)\)$/);
  if (!match) return null;
  
  const [, func, rangeRef] = match;
  const range = parseRangeReference(rangeRef);
  
  return { function: func, range };
}

// ============================================================================
// Data Access
// ============================================================================

/**
 * Get cells in range from IndexedDB
 */
async function getCellsInRange(tabId: string, range: CellRange): Promise<StoredCellData[]> {
  const cells = await db.cells
    .where('[tabId+row]')
    .between([tabId, range.startRow], [tabId, range.endRow])
    .and(cell => cell.col >= range.startCol && cell.col <= range.endCol)
    .toArray();
  
  return cells;
}

// ============================================================================
// Calculation Functions
// ============================================================================

async function calculateSUM(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  return cells.reduce((sum, cell) => {
    const value = Number(cell.value);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

async function calculateAVERAGE(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  const numericCells = cells.filter(cell => !isNaN(Number(cell.value)));
  
  if (numericCells.length === 0) return 0;
  
  const sum = numericCells.reduce((acc, cell) => acc + Number(cell.value), 0);
  return sum / numericCells.length;
}

async function calculateCOUNT(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  return cells.filter(cell => cell.value != null && cell.value !== '').length;
}

async function calculateMIN(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  const numericValues = cells
    .map(cell => Number(cell.value))
    .filter(val => !isNaN(val));
  
  return numericValues.length > 0 ? Math.min(...numericValues) : 0;
}

async function calculateMAX(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  const numericValues = cells
    .map(cell => Number(cell.value))
    .filter(val => !isNaN(val));
  
  return numericValues.length > 0 ? Math.max(...numericValues) : 0;
}

// ============================================================================
// Main Calculation Function
// ============================================================================

async function calculate(tabId: string, formula: string): Promise<number | string> {
  try {
    const parsed = parseFormula(formula);
    if (!parsed) {
      return '#ERROR!';
    }
    
    const { function: func, range } = parsed;
    
    switch (func) {
      case 'SUM':
        return await calculateSUM(tabId, range);
      case 'AVERAGE':
      case 'AVG':
        return await calculateAVERAGE(tabId, range);
      case 'COUNT':
        return await calculateCOUNT(tabId, range);
      case 'MIN':
        return await calculateMIN(tabId, range);
      case 'MAX':
        return await calculateMAX(tabId, range);
      default:
        return '#NAME?'; // Unknown function
    }
  } catch (error) {
    console.error('[FormulaWorker] Error:', error);
    return '#ERROR!';
  }
}

// ============================================================================
// Message Handler
// ============================================================================

self.addEventListener('message', async (event: MessageEvent) => {
  const message = event.data;
  const startTime = performance.now();
  
  try {
    if (message.type === 'CALCULATE') {
      const { id, tabId, formula, cellRef } = message as CalculateMessage;
      
      console.log('[FormulaWorker] Calculating:', { cellRef, formula });
      
      const result = await calculate(tabId, formula);
      const duration = performance.now() - startTime;
      
      const response: ResultMessage = {
        type: 'RESULT',
        id,
        cellRef,
        result,
        duration,
      };
      
      self.postMessage(response);
      
    } else if (message.type === 'BATCH_CALCULATE') {
      const { id, tabId, formulas } = message as BatchCalculateMessage;
      
      console.log('[FormulaWorker] Batch calculating:', formulas.length, 'formulas');
      
      const results = await Promise.all(
        formulas.map(async ({ cellRef, formula }) => ({
          cellRef,
          result: await calculate(tabId, formula),
        }))
      );
      
      const duration = performance.now() - startTime;
      
      const response: BatchResultMessage = {
        type: 'BATCH_RESULT',
        id,
        results,
        duration,
      };
      
      self.postMessage(response);
      
    } else {
      console.warn('[FormulaWorker] Unknown message type:', message.type);
    }
    
  } catch (error) {
    console.error('[FormulaWorker] Fatal error:', error);
    
    const errorResponse: ErrorMessage = {
      type: 'ERROR',
      id: message.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    self.postMessage(errorResponse);
  }
});

// ============================================================================
// Worker Ready Signal
// ============================================================================

console.log('[FormulaWorker] Worker initialized and ready');
self.postMessage({ type: 'READY' });
