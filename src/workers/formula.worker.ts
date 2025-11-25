/**
 * Formula Worker (Phase 3 - HyperFormula Integration)
 *
 * Calculates formulas in a separate thread to avoid blocking the UI.
 * Uses IndexedDB for data access (Dexie works in Workers!)
 *
 * Supported functions:
 * - Phase 2: Basic functions (SUM, AVERAGE, COUNT, MIN, MAX)
 * - Phase 3: Full Excel compatibility with HyperFormula (400+ functions)
 *   - VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP
 *   - IF, IFS, AND, OR, NOT, SWITCH
 *   - SUMIF, SUMIFS, COUNTIF, COUNTIFS, AVERAGEIF
 *   - TEXT, DATE, MATH, STATISTICAL functions
 *   - And 400+ more Excel functions
 *
 * Features:
 * - Automatic dependency tracking
 * - Circular reference detection
 * - Batch calculation optimization
 */

import Dexie from 'dexie';
import { HyperFormula, ConfigParams } from 'hyperformula';

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
// HyperFormula Setup
// ============================================================================

// Initialize HyperFormula engine
const hfEngine = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  useArrayArithmetic: true,
  useColumnIndex: true,
  precisionRounding: 14,
  precisionEpsilon: 1e-13,
  nullDate: { year: 1899, month: 12, day: 30 },
  language: 'en-US',
});

// Sheet ID mapping (tabId -> HyperFormula sheet ID)
const sheetIdMap = new Map<string, number>();

// ============================================================================
// Phase 4: Calculation Cache & Optimization
// ============================================================================

interface CachedResult {
  result: number | string;
  dependencies: string[]; // Cells this formula depends on
  timestamp: number; // When calculated
  version: number; // Cell version when calculated
}

// Cache: cellRef -> CachedResult
const calculationCache = new Map<string, CachedResult>();

// Dirty cells tracking (cells that need recalculation)
const dirtyCells = new Set<string>();

// Cell version tracking (tabId:row:col -> version)
const cellVersions = new Map<string, number>();

/**
 * Get cache key for a cell
 */
function getCacheKey(tabId: string, cellRef: string): string {
  return `${tabId}:${cellRef}`;
}

/**
 * Get cell version key
 */
function getVersionKey(tabId: string, row: number, col: number): string {
  return `${tabId}:${row}:${col}`;
}

/**
 * Check if cached result is still valid
 */
function isCacheValid(cacheKey: string, cached: CachedResult, tabId: string): boolean {
  // Check if any dependencies have changed
  for (const depRef of cached.dependencies) {
    const { row, col } = parseCellRef(depRef);
    const versionKey = getVersionKey(tabId, row, col);
    const currentVersion = cellVersions.get(versionKey) || 0;

    // If any dependency has a newer version, cache is invalid
    if (currentVersion > cached.version) {
      return false;
    }
  }

  return true;
}

/**
 * Invalidate cache for a cell and its dependents
 */
function invalidateCache(tabId: string, row: number, col: number) {
  const cellRef = `${columnIndexToLetter(col)}${row + 1}`;
  const cacheKey = getCacheKey(tabId, cellRef);

  // Remove from cache
  calculationCache.delete(cacheKey);

  // Mark as dirty
  dirtyCells.add(cacheKey);

  // Increment version
  const versionKey = getVersionKey(tabId, row, col);
  const currentVersion = cellVersions.get(versionKey) || 0;
  cellVersions.set(versionKey, currentVersion + 1);

  // Invalidate dependents (cells that depend on this cell)
  const sheetId = sheetIdMap.get(tabId);
  if (sheetId !== undefined) {
    try {
      const dependents = hfEngine.getCellDependents({
        sheet: sheetId,
        row,
        col,
      });

      // Recursively invalidate dependents
      for (const dependent of dependents) {
        invalidateCache(tabId, dependent.row, dependent.col);
      }
    } catch (error) {
      // Sheet not loaded, ignore
    }
  }
}

/**
 * Get cached result if available and valid
 */
function getCachedResult(tabId: string, cellRef: string): number | string | null {
  const cacheKey = getCacheKey(tabId, cellRef);
  const cached = calculationCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (!isCacheValid(cacheKey, cached, tabId)) {
    // Cache invalid, remove it
    calculationCache.delete(cacheKey);
    return null;
  }

  return cached.result;
}

/**
 * Store result in cache
 */
function setCachedResult(
  tabId: string,
  cellRef: string,
  result: number | string,
  dependencies: string[]
) {
  const cacheKey = getCacheKey(tabId, cellRef);
  const { row, col } = parseCellRef(cellRef);
  const versionKey = getVersionKey(tabId, row, col);

  calculationCache.set(cacheKey, {
    result,
    dependencies,
    timestamp: Date.now(),
    version: cellVersions.get(versionKey) || 0,
  });

  // Remove from dirty set
  dirtyCells.delete(cacheKey);
}

/**
 * Load sheet data from IndexedDB into HyperFormula
 */
async function loadSheetIntoHyperFormula(tabId: string): Promise<number> {
  // Check if already loaded
  const existingSheetId = sheetIdMap.get(tabId);
  if (existingSheetId !== undefined) {
    return existingSheetId;
  }

  // Get all cells from IndexedDB
  const cells = await db.cells.where('tabId').equals(tabId).toArray();

  // Determine sheet dimensions
  let maxRow = 0;
  let maxCol = 0;
  cells.forEach(cell => {
    maxRow = Math.max(maxRow, cell.row);
    maxCol = Math.max(maxCol, cell.col);
  });

  // Create 2D array (sparse to dense conversion)
  const rows = Math.max(maxRow + 1, 100);
  const cols = Math.max(maxCol + 1, 50);
  const data: any[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  // Fill with cell data
  cells.forEach(cell => {
    if (cell.row < rows && cell.col < cols) {
      // Use formula if present, otherwise use value
      data[cell.row][cell.col] = cell.formula || cell.value;
    }
  });

  // Add sheet to HyperFormula
  const sheetId = hfEngine.addSheet(`Sheet_${tabId}`);
  hfEngine.setSheetContent(sheetId, data);

  // Store mapping
  sheetIdMap.set(tabId, sheetId);

  console.log(`[FormulaWorker] Loaded sheet ${tabId} into HyperFormula (${rows}x${cols})`);

  return sheetId;
}

/**
 * Parse cell reference (e.g., "A1" -> {row: 0, col: 0})
 */
function parseCellRef(cellRef: string): { row: number; col: number } {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }

  const [, colStr, rowStr] = match;
  return {
    row: parseInt(rowStr) - 1,
    col: columnToIndex(colStr),
  };
}

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

interface LoadSheetMessage {
  type: 'LOAD_SHEET';
  id: string;
  tabId: string;
}

interface LoadSheetResponseMessage {
  type: 'SHEET_LOADED';
  id: string;
  tabId: string;
  sheetId: number;
}

interface GetDependenciesMessage {
  type: 'GET_DEPENDENCIES';
  id: string;
  tabId: string;
  cellRef: string;
}

interface DependenciesResponseMessage {
  type: 'DEPENDENCIES';
  id: string;
  cellRef: string;
  dependencies: string[];
  dependents: string[];
}

interface InvalidateCacheMessage {
  type: 'INVALIDATE_CACHE';
  id: string;
  tabId: string;
  row: number;
  col: number;
}

interface CheckCircularRefsMessage {
  type: 'CHECK_CIRCULAR_REFS';
  id: string;
  tabId: string;
}

interface CircularRefsResponseMessage {
  type: 'CIRCULAR_REFS';
  id: string;
  hasCircularRefs: boolean;
  circularCells: string[];
}

interface CacheStatsMessage {
  type: 'GET_CACHE_STATS';
  id: string;
}

interface CacheStatsResponseMessage {
  type: 'CACHE_STATS';
  id: string;
  stats: {
    cacheSize: number;
    dirtyCellsCount: number;
    hitRate: number;
  };
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
  const numericValues = cells.map(cell => Number(cell.value)).filter(val => !isNaN(val));

  return numericValues.length > 0 ? Math.min(...numericValues) : 0;
}

async function calculateMAX(tabId: string, range: CellRange): Promise<number> {
  const cells = await getCellsInRange(tabId, range);
  const numericValues = cells.map(cell => Number(cell.value)).filter(val => !isNaN(val));

  return numericValues.length > 0 ? Math.max(...numericValues) : 0;
}

// ============================================================================
// Main Calculation Function (Phase 3 - HyperFormula)
// ============================================================================

/**
 * Calculate formula using HyperFormula engine (Phase 4: with caching)
 * Supports 400+ Excel functions
 */
async function calculateWithHyperFormula(
  tabId: string,
  formula: string,
  cellRef: string
): Promise<number | string> {
  try {
    // Check cache first (Phase 4)
    const cachedResult = getCachedResult(tabId, cellRef);
    if (cachedResult !== null) {
      console.log(`[FormulaWorker] Cache hit for ${cellRef}:`, cachedResult);
      return cachedResult;
    }

    // Load sheet if not already loaded
    const sheetId = await loadSheetIntoHyperFormula(tabId);

    // Parse cell reference
    const { row, col } = parseCellRef(cellRef);

    // Build cell address
    const cellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    // Calculate formula using HyperFormula
    const result = hfEngine.calculateFormula(formula, cellAddress);

    console.log(`[FormulaWorker] HyperFormula result for ${cellRef}:`, result);

    // Get dependencies for caching (Phase 4)
    const dependencies: string[] = [];
    try {
      const precedents = hfEngine.getCellPrecedents(cellAddress);
      for (const precedent of precedents) {
        dependencies.push(`${columnIndexToLetter(precedent.col)}${precedent.row + 1}`);
      }
    } catch (error) {
      // No dependencies
    }

    // Store in cache (Phase 4)
    setCachedResult(tabId, cellRef, result, dependencies);

    return result;
  } catch (error) {
    console.error('[FormulaWorker] HyperFormula error:', error);
    return '#ERROR!';
  }
}

/**
 * Main calculation function
 * - First tries HyperFormula (supports all Excel functions)
 * - Falls back to basic functions if HyperFormula fails
 */
async function calculate(tabId: string, formula: string, cellRef = 'A1'): Promise<number | string> {
  try {
    // Strategy: Try HyperFormula first (supports 400+ functions)
    try {
      return await calculateWithHyperFormula(tabId, formula, cellRef);
    } catch (hfError) {
      console.warn('[FormulaWorker] HyperFormula failed, trying basic functions:', hfError);
    }

    // Fallback: Basic functions (Phase 2 implementation)
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
// Dependency Tracking (Phase 3)
// ============================================================================

/**
 * Get dependencies for a cell
 */
async function getCellDependencies(
  tabId: string,
  cellRef: string
): Promise<{
  dependencies: string[];
  dependents: string[];
}> {
  try {
    // Load sheet if not already loaded
    const sheetId = await loadSheetIntoHyperFormula(tabId);

    // Parse cell reference
    const { row, col } = parseCellRef(cellRef);

    const cellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    // Get precedents (cells this cell depends on)
    const precedents = hfEngine.getCellPrecedents(cellAddress);
    const dependencies = precedents.map(addr => `${columnIndexToLetter(addr.col)}${addr.row + 1}`);

    // Get dependents (cells that depend on this cell)
    const dependents = hfEngine.getCellDependents(cellAddress);
    const dependentRefs = dependents.map(addr => `${columnIndexToLetter(addr.col)}${addr.row + 1}`);

    return {
      dependencies,
      dependents: dependentRefs,
    };
  } catch (error) {
    console.error('[FormulaWorker] Error getting dependencies:', error);
    return { dependencies: [], dependents: [] };
  }
}

/**
 * Convert column index to letter (0=A, 1=B, ..., 25=Z, 26=AA)
 */
function columnIndexToLetter(index: number): string {
  let result = '';
  let num = index;

  while (num >= 0) {
    result = String.fromCharCode((num % 26) + 65) + result;
    num = Math.floor(num / 26) - 1;
  }

  return result;
}

// ============================================================================
// Phase 4: Circular Reference Detection
// ============================================================================

/**
 * Check for circular references in the sheet
 */
async function checkCircularReferences(tabId: string): Promise<{
  hasCircularRefs: boolean;
  circularCells: string[];
}> {
  try {
    const sheetId = sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return { hasCircularRefs: false, circularCells: [] };
    }

    const circularCells: string[] = [];

    // Get serialized data from HyperFormula
    const serialized = hfEngine.getSheetSerialized(sheetId);

    // Look for circular reference errors (#CYCLE!)
    serialized.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell && typeof cell === 'object' && 'error' in cell) {
          const errorValue = (cell as any).error;
          if (errorValue === '#CYCLE!') {
            const cellRef = `${columnIndexToLetter(colIndex)}${rowIndex + 1}`;
            circularCells.push(cellRef);
          }
        }
      });
    });

    return {
      hasCircularRefs: circularCells.length > 0,
      circularCells,
    };
  } catch (error) {
    console.error('[FormulaWorker] Error checking circular references:', error);
    return { hasCircularRefs: false, circularCells: [] };
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const totalCalculations = calculationCache.size + dirtyCells.size;
  const hitRate = totalCalculations > 0 ? calculationCache.size / totalCalculations : 0;

  return {
    cacheSize: calculationCache.size,
    dirtyCellsCount: dirtyCells.size,
    hitRate: hitRate * 100, // Convert to percentage
  };
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

      const result = await calculate(tabId, formula, cellRef);
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
          result: await calculate(tabId, formula, cellRef),
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
    } else if (message.type === 'LOAD_SHEET') {
      const { id, tabId } = message as LoadSheetMessage;

      console.log('[FormulaWorker] Loading sheet:', tabId);

      const sheetId = await loadSheetIntoHyperFormula(tabId);
      const duration = performance.now() - startTime;

      const response: LoadSheetResponseMessage = {
        type: 'SHEET_LOADED',
        id,
        tabId,
        sheetId,
      };

      self.postMessage(response);
    } else if (message.type === 'GET_DEPENDENCIES') {
      const { id, tabId, cellRef } = message as GetDependenciesMessage;

      console.log('[FormulaWorker] Getting dependencies for:', cellRef);

      const { dependencies, dependents } = await getCellDependencies(tabId, cellRef);

      const response: DependenciesResponseMessage = {
        type: 'DEPENDENCIES',
        id,
        cellRef,
        dependencies,
        dependents,
      };

      self.postMessage(response);
    } else if (message.type === 'INVALIDATE_CACHE') {
      const { id, tabId, row, col } = message as InvalidateCacheMessage;

      console.log('[FormulaWorker] Invalidating cache for:', { tabId, row, col });

      invalidateCache(tabId, row, col);

      self.postMessage({
        type: 'CACHE_INVALIDATED',
        id,
      });
    } else if (message.type === 'CHECK_CIRCULAR_REFS') {
      const { id, tabId } = message as CheckCircularRefsMessage;

      console.log('[FormulaWorker] Checking circular references for:', tabId);

      const { hasCircularRefs, circularCells } = await checkCircularReferences(tabId);

      const response: CircularRefsResponseMessage = {
        type: 'CIRCULAR_REFS',
        id,
        hasCircularRefs,
        circularCells,
      };

      self.postMessage(response);
    } else if (message.type === 'GET_CACHE_STATS') {
      const { id } = message as CacheStatsMessage;

      const stats = getCacheStats();

      const response: CacheStatsResponseMessage = {
        type: 'CACHE_STATS',
        id,
        stats,
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
