/**
 * HyperFormula Adapter
 *
 * Bridges HyperFormula calculation engine with Dexie.js IndexedDB storage.
 *
 * Features:
 * - Excel-compatible formula calculation (400+ functions)
 * - Dependency graph for automatic recalculation
 * - Circular reference detection
 * - Efficient sparse matrix integration
 * - Support for VLOOKUP, IF, SUMIF, INDEX/MATCH, and more
 *
 * Usage:
 * ```typescript
 * const adapter = new HyperFormulaAdapter(db);
 * await adapter.loadSheet(tabId);
 * const result = adapter.calculateFormula('=SUM(A1:A100)', 0, 0);
 * ```
 */

import { HyperFormula, ConfigParams, SimpleCellAddress } from 'hyperformula';
import { AppDatabase, CellData, CellValue } from './db';

// ============================================================================
// Types
// ============================================================================

export interface SheetData {
  tabId: string;
  sheetName: string;
  data: CellData[][];
}

export interface CalculationResult {
  value: CellValue;
  error?: string;
}

export interface DependencyInfo {
  cellRef: string;
  dependencies: string[];
}

// ============================================================================
// HyperFormula Adapter
// ============================================================================

export class HyperFormulaAdapter {
  private engine: HyperFormula;
  private db: AppDatabase;
  private sheetIdMap: Map<string, number>; // tabId -> HyperFormula sheet ID
  private reverseSheetIdMap: Map<number, string>; // HyperFormula sheet ID -> tabId

  constructor(db: AppDatabase, config?: Partial<ConfigParams>) {
    this.db = db;
    this.sheetIdMap = new Map();
    this.reverseSheetIdMap = new Map();

    // Initialize HyperFormula with optimal configuration
    this.engine = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
      // Performance optimizations
      useArrayArithmetic: true,
      useColumnIndex: true,
      // Precision settings
      precisionRounding: 14,
      precisionEpsilon: 1e-13,
      // Date settings
      nullDate: { year: 1899, month: 12, day: 30 },
      // Language (can be changed to support other locales)
      language: 'en-US',
      // Custom configuration overrides
      ...config,
    });
  }

  // ==========================================================================
  // Sheet Management
  // ==========================================================================

  /**
   * Load a sheet from IndexedDB into HyperFormula
   * Returns the HyperFormula sheet ID
   */
  async loadSheet(tabId: string, sheetName?: string): Promise<number> {
    // Check if sheet is already loaded
    const existingSheetId = this.sheetIdMap.get(tabId);
    if (existingSheetId !== undefined) {
      return existingSheetId;
    }

    // Get sheet metadata
    const metadata = await this.db.getSheetMetadata(tabId);
    const finalSheetName = sheetName || metadata?.sheetName || `Sheet_${tabId}`;

    // Load cell data from IndexedDB as 2D array
    const data2D = await this.db.getCellsAs2DArray(tabId);

    // Convert to HyperFormula format (values only)
    const hyperFormulaData = this.convert2DArrayToHyperFormulaFormat(data2D);

    // Add sheet to HyperFormula
    const sheetId = this.engine.addSheet(finalSheetName);

    // Set sheet content
    this.engine.setSheetContent(sheetId, hyperFormulaData);

    // Store mapping
    this.sheetIdMap.set(tabId, sheetId);
    this.reverseSheetIdMap.set(sheetId, tabId);

    return sheetId;
  }

  /**
   * Unload a sheet from HyperFormula
   */
  unloadSheet(tabId: string): void {
    const sheetId = this.sheetIdMap.get(tabId);
    if (sheetId !== undefined) {
      this.engine.removeSheet(sheetId);
      this.sheetIdMap.delete(tabId);
      this.reverseSheetIdMap.delete(sheetId);
    }
  }

  /**
   * Get HyperFormula sheet ID for a tab
   */
  getSheetId(tabId: string): number | undefined {
    return this.sheetIdMap.get(tabId);
  }

  /**
   * Get tab ID from HyperFormula sheet ID
   */
  getTabId(sheetId: number): string | undefined {
    return this.reverseSheetIdMap.get(sheetId);
  }

  // ==========================================================================
  // Formula Calculation
  // ==========================================================================

  /**
   * Calculate a formula and return the result
   * Formula should include '=' prefix (e.g., '=SUM(A1:A100)')
   */
  calculateFormula(formula: string, row: number, col: number, tabId: string): CalculationResult {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return {
        value: '#REF!',
        error: 'Sheet not loaded',
      };
    }

    try {
      // Build cell address
      const cellAddress: SimpleCellAddress = {
        sheet: sheetId,
        row,
        col,
      };

      // Calculate formula
      const result = this.engine.calculateFormula(formula, cellAddress);

      return {
        value: result,
      };
    } catch (error) {
      return {
        value: '#ERROR!',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the calculated value of a cell
   */
  getCellValue(tabId: string, row: number, col: number): CellValue {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return null;
    }

    const cellAddress: SimpleCellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    return this.engine.getCellValue(cellAddress) as CellValue;
  }

  /**
   * Get the formula of a cell (if it has one)
   */
  getCellFormula(tabId: string, row: number, col: number): string | undefined {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return undefined;
    }

    const cellAddress: SimpleCellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    const formula = this.engine.getCellFormula(cellAddress);
    return formula || undefined;
  }

  /**
   * Set a cell value (can be a value or a formula)
   */
  setCellContent(tabId: string, row: number, col: number, content: CellValue | string): void {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      throw new Error('Sheet not loaded');
    }

    const cellAddress: SimpleCellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    this.engine.setCellContents(cellAddress, content);
  }

  /**
   * Batch set cell contents (more efficient than individual sets)
   */
  batchSetCellContents(
    tabId: string,
    updates: Array<{ row: number; col: number; content: CellValue | string }>
  ): void {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      throw new Error('Sheet not loaded');
    }

    this.engine.batch(() => {
      updates.forEach(({ row, col, content }) => {
        const cellAddress: SimpleCellAddress = {
          sheet: sheetId,
          row,
          col,
        };
        this.engine.setCellContents(cellAddress, content);
      });
    });
  }

  // ==========================================================================
  // Dependency Tracking
  // ==========================================================================

  /**
   * Get all cells that depend on a specific cell
   */
  getDependentCells(tabId: string, row: number, col: number): DependencyInfo[] {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return [];
    }

    const cellAddress: SimpleCellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    // Get cells that depend on this cell
    const dependents = this.engine.getCellDependents(cellAddress);

    return dependents.map(dependent => ({
      cellRef: this.addressToA1Notation(dependent),
      dependencies: [], // HyperFormula doesn't directly expose this
    }));
  }

  /**
   * Get all cells that a specific cell depends on
   */
  getCellDependencies(tabId: string, row: number, col: number): string[] {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return [];
    }

    const cellAddress: SimpleCellAddress = {
      sheet: sheetId,
      row,
      col,
    };

    // Get cells this cell depends on
    const precedents = this.engine.getCellPrecedents(cellAddress);

    return precedents.map(precedent => this.addressToA1Notation(precedent));
  }

  /**
   * Check if there are circular references in the sheet
   */
  hasCircularReferences(tabId: string): boolean {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      return false;
    }

    // Check for errors in the sheet
    const sheetErrors = this.engine.getSheetSerialized(sheetId);

    // Look for circular reference errors
    for (const row of sheetErrors) {
      for (const cell of row) {
        if (cell && typeof cell === 'object' && 'error' in cell) {
          if ((cell as any).error === '#CYCLE!') {
            return true;
          }
        }
      }
    }

    return false;
  }

  // ==========================================================================
  // Data Synchronization
  // ==========================================================================

  /**
   * Sync changes from HyperFormula back to IndexedDB
   */
  async syncToDatabase(tabId: string): Promise<void> {
    const sheetId = this.sheetIdMap.get(tabId);

    if (sheetId === undefined) {
      throw new Error('Sheet not loaded');
    }

    // Get serialized data from HyperFormula
    const serialized = this.engine.getSheetSerialized(sheetId);

    // Convert back to our 2D array format
    const data2D = serialized.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell === null || cell === undefined) {
          return { value: null, type: 'empty' };
        }

        // Handle formula cells
        const formula = this.getCellFormula(tabId, rowIndex, colIndex);

        return {
          value: cell,
          type: this.detectCellType(cell, formula),
          formula,
        };
      })
    );

    // Save to IndexedDB
    await this.db.save2DArrayAsCells(tabId, data2D);
  }

  /**
   * Reload sheet data from IndexedDB
   */
  async reloadSheet(tabId: string): Promise<void> {
    this.unloadSheet(tabId);
    await this.loadSheet(tabId);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Convert our 2D array format to HyperFormula format
   * HyperFormula expects raw values or formulas starting with '='
   */
  private convert2DArrayToHyperFormulaFormat(data: CellData[][]): (CellValue | string)[][] {
    return data.map(row =>
      row.map(cell => {
        if (!cell || cell.value === null || cell.value === undefined) {
          return null;
        }

        // If cell has a formula, use it
        if (cell.formula) {
          return cell.formula;
        }

        // Otherwise, use the value
        return cell.value;
      })
    );
  }

  /**
   * Convert SimpleCellAddress to A1 notation (e.g., "A1", "B5")
   */
  private addressToA1Notation(address: SimpleCellAddress): string {
    const sheetName = this.engine.getSheetName(address.sheet);
    const col = this.columnIndexToLetter(address.col);
    const row = address.row + 1; // HyperFormula uses 0-based, Excel uses 1-based

    return `${sheetName}!${col}${row}`;
  }

  /**
   * Convert column index to letter (0=A, 1=B, ..., 25=Z, 26=AA)
   */
  private columnIndexToLetter(index: number): string {
    let result = '';
    let num = index;

    while (num >= 0) {
      result = String.fromCharCode((num % 26) + 65) + result;
      num = Math.floor(num / 26) - 1;
    }

    return result;
  }

  /**
   * Detect cell type from value
   */
  private detectCellType(value: CellValue, formula?: string): string {
    if (formula) return 'formula';
    if (value === null || value === undefined || value === '') return 'empty';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && value.startsWith('#')) return 'error';
    return 'string';
  }

  /**
   * Get statistics about the HyperFormula engine
   */
  getStats() {
    return {
      numberOfSheets: this.engine.countSheets(),
      loadedSheets: Array.from(this.sheetIdMap.keys()),
      isValid: this.engine.isItPossibleToSetCellContents({ sheet: 0, row: 0, col: 0 }, '=1+1'),
    };
  }

  /**
   * Destroy the adapter and clean up resources
   */
  destroy(): void {
    // Clear all sheets
    Array.from(this.sheetIdMap.keys()).forEach(tabId => {
      this.unloadSheet(tabId);
    });

    this.sheetIdMap.clear();
    this.reverseSheetIdMap.clear();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new HyperFormulaAdapter instance
 */
export function createHyperFormulaAdapter(
  db: AppDatabase,
  config?: Partial<ConfigParams>
): HyperFormulaAdapter {
  return new HyperFormulaAdapter(db, config);
}
