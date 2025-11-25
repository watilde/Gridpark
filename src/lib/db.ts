/**
 * Dexie.js Database Configuration
 *
 * Manages all table data using IndexedDB for:
 * - Sheet data (cells, formulas, formatting)
 * - Large datasets with reactive queries
 * - Offline-first data persistence
 *
 * OPTIMIZED SCHEMA:
 * - Sparse matrix storage (only non-empty cells)
 * - Compound indexes for fast range queries
 * - Separate metadata for efficient sheet-level operations
 * - Version tracking for undo/redo support
 */

import Dexie, { Table } from 'dexie';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cell value types matching ExcelViewer CellData
 */
export type CellType = 'empty' | 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula';

/**
 * Cell style data (subset of CSSProperties)
 */
export interface CellStyleData {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  verticalAlign?: string;
  fontSize?: string;
  fontFamily?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  // Add more as needed
}

/**
 * Stored cell data (sparse matrix - only non-empty cells)
 * Matches ExcelViewer's CellData structure
 */
export interface StoredCellData {
  id?: number;
  // Composite key: tabId + row + col
  tabId: string; // Tab ID (unique per sheet in workspace)
  row: number; // 0-based row index
  col: number; // 0-based column index

  // Cell content
  value: any; // Cell value (string | number | boolean | null)
  type: CellType; // Cell type
  formula?: string; // Formula if present

  // Styling
  style?: CellStyleData; // Cell-specific styles

  // Metadata
  updatedAt: Date; // Last update timestamp
  version: number; // Version for undo/redo
}

/**
 * Sheet metadata (for quick lookups without loading all cells)
 */
export interface SheetMetadata {
  id?: number;
  tabId: string; // Unique tab ID
  workbookId: string; // Workbook identifier
  sheetName: string; // Sheet name
  sheetIndex: number; // Sheet position in workbook

  // Dimensions (for efficient rendering)
  maxRow: number; // Highest row with data
  maxCol: number; // Highest column with data
  cellCount: number; // Total non-empty cells

  // State
  dirty: boolean; // Has unsaved changes

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

/**
 * Workbook metadata
 */
export interface WorkbookMetadata {
  id?: number;
  workbookId: string;
  fileName: string;
  filePath: string;
  lastOpened: Date;
  createdAt: Date;
}

// ============================================================================
// Database Class
// ============================================================================

export class AppDatabase extends Dexie {
  // Tables
  sheetMetadata!: Table<SheetMetadata, number>;
  cells!: Table<StoredCellData, number>;
  workbooks!: Table<WorkbookMetadata, number>;

  constructor() {
    super('ExcelAppDatabase');

    // Database schema versioning
    // Version 1: Initial schema (deprecated)
    this.version(1).stores({
      sheets: '++id, workbookId, sheetName, sheetIndex',
      cells: '++id, sheetId, [sheetId+row+col], row, col',
      workbooks: '++id, workbookId, filePath, lastOpened',
    });

    // Version 2: Optimized schema with sparse matrix and tab-based indexing
    this.version(2)
      .stores({
        // Sheet metadata for quick lookups
        sheetMetadata: '++id, tabId, workbookId, &[tabId], lastAccessedAt',

        // Cell data with compound index for range queries
        // Primary index: tabId + row + col (unique per cell)
        // Secondary indexes: tabId (for all cells in sheet), row, col
        cells: '++id, &[tabId+row+col], tabId, [tabId+row], [tabId+col], version',

        // Workbook metadata
        workbooks: '++id, &workbookId, filePath, lastOpened',
      })
      .upgrade(async _tx => {
        // Migration from v1 to v2
        // This will be implemented when we have data to migrate
        console.log('[DB] Upgrading database from v1 to v2...');

        // For now, just log - actual migration will copy data from old schema
        // In production, we'd copy from sheets/cells(v1) to sheetMetadata/cells(v2)
      });
  }

  // ==========================================================================
  // Sheet Metadata Operations
  // ==========================================================================

  /**
   * Get sheet metadata by tab ID
   */
  async getSheetMetadata(tabId: string): Promise<SheetMetadata | undefined> {
    return await this.sheetMetadata.where('tabId').equals(tabId).first();
  }

  /**
   * Create or update sheet metadata
   */
  async upsertSheetMetadata(
    data: Omit<SheetMetadata, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>
  ): Promise<number> {
    // Use transaction to prevent race conditions (React Strict Mode double invoke)
    return await this.transaction('rw', this.sheetMetadata, async () => {
      const existing = await this.getSheetMetadata(data.tabId);

      if (existing) {
        await this.sheetMetadata.update(existing.id!, {
          ...data,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        });
        return existing.id!;
      } else {
        return await this.sheetMetadata.add({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      }
    });
  }

  /**
   * Update sheet metadata dimensions after cell changes
   */
  async updateSheetDimensions(tabId: string): Promise<void> {
    const cells = await this.getCellsForSheet(tabId);

    let maxRow = 0;
    let maxCol = 0;

    cells.forEach(cell => {
      maxRow = Math.max(maxRow, cell.row);
      maxCol = Math.max(maxCol, cell.col);
    });

    const metadata = await this.getSheetMetadata(tabId);
    if (metadata) {
      await this.sheetMetadata.update(metadata.id!, {
        maxRow,
        maxCol,
        cellCount: cells.length,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Mark sheet as dirty (has unsaved changes)
   */
  async markSheetDirty(tabId: string, dirty = true): Promise<void> {
    const metadata = await this.getSheetMetadata(tabId);
    if (metadata) {
      await this.sheetMetadata.update(metadata.id!, {
        dirty,
        updatedAt: new Date(),
      });
    }
  }

  // ==========================================================================
  // Cell Operations (Optimized for Sparse Matrix)
  // ==========================================================================

  /**
   * Get all cells for a sheet (returns sparse array)
   */
  async getCellsForSheet(tabId: string): Promise<StoredCellData[]> {
    return await this.cells.where('tabId').equals(tabId).toArray();
  }

  /**
   * Get cells in a specific range (efficient range query)
   */
  async getCellsInRange(
    tabId: string,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Promise<StoredCellData[]> {
    return await this.cells
      .where('tabId')
      .equals(tabId)
      .and(
        cell =>
          cell.row >= startRow && cell.row <= endRow && cell.col >= startCol && cell.col <= endCol
      )
      .toArray();
  }

  /**
   * Get a specific cell
   */
  async getCell(tabId: string, row: number, col: number): Promise<StoredCellData | undefined> {
    return await this.cells.where('[tabId+row+col]').equals([tabId, row, col]).first();
  }

  /**
   * Update or insert a single cell
   */
  async upsertCell(
    tabId: string,
    row: number,
    col: number,
    data: Partial<StoredCellData>
  ): Promise<number> {
    const existing = await this.getCell(tabId, row, col);
    const now = new Date();

    if (existing) {
      await this.cells.update(existing.id!, {
        ...data,
        updatedAt: now,
        version: (existing.version || 0) + 1,
      });
      return existing.id!;
    } else {
      return await this.cells.add({
        tabId,
        row,
        col,
        value: null,
        type: 'empty',
        ...data,
        updatedAt: now,
        version: 1,
      });
    }
  }

  /**
   * Bulk upsert cells (highly optimized for large updates)
   * Returns number of cells updated
   */
  async bulkUpsertCells(
    tabId: string,
    cellUpdates: Array<{ row: number; col: number; data: Partial<StoredCellData> }>
  ): Promise<number> {
    console.log('[db] bulkUpsertCells: preparing bulk insert', {
      tabId,
      count: cellUpdates.length,
    });

    await this.transaction('rw', [this.cells, this.sheetMetadata], async () => {
      // Use Dexie's bulkPut for maximum performance
      const now = new Date();
      const cellsToInsert: StoredCellData[] = cellUpdates.map(({ row, col, data }) => ({
        tabId,
        row,
        col,
        value: data.value ?? null,
        type: data.type ?? 'empty',
        formula: data.formula ?? undefined,
        style: data.style ?? undefined,
        updatedAt: now,
        version: 1,
      }));

      console.log('[db] bulkUpsertCells: calling bulkPut', {
        tabId,
        count: cellsToInsert.length,
      });

      // bulkPut is much faster than individual upserts
      await this.cells.bulkPut(cellsToInsert);

      console.log('[db] bulkUpsertCells: bulkPut completed, updating dimensions', { tabId });

      // Update sheet dimensions within same transaction
      let maxRow = 0;
      let maxCol = 0;

      cellUpdates.forEach(({ row, col }) => {
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      });

      // Use put to ensure useLiveQuery picks up the change
      const metadata = await this.sheetMetadata.where('tabId').equals(tabId).first();

      if (metadata?.id) {
        await this.sheetMetadata.update(metadata.id, {
          maxRow,
          maxCol,
          cellCount: cellUpdates.length,
          updatedAt: now,
        });
        console.log('[db] bulkUpsertCells: metadata updated', {
          tabId,
          metadataId: metadata.id,
          maxRow,
          maxCol,
          cellCount: cellUpdates.length,
        });
      } else {
        console.warn('[db] bulkUpsertCells: metadata not found for', tabId);
      }
    });

    console.log('[db] bulkUpsertCells: transaction completed', { tabId });

    return cellUpdates.length;
  }

  /**
   * Delete a specific cell (convert to empty)
   */
  async deleteCell(tabId: string, row: number, col: number): Promise<void> {
    const cell = await this.getCell(tabId, row, col);
    if (cell?.id) {
      await this.cells.delete(cell.id);
    }
  }

  /**
   * Clear all cells for a sheet
   */
  async clearSheetCells(tabId: string): Promise<void> {
    await this.cells.where('tabId').equals(tabId).delete();

    // Reset dimensions
    await this.updateSheetDimensions(tabId);
  }

  /**
   * Delete sheet and all its cells
   */
  async deleteSheet(tabId: string): Promise<void> {
    await this.transaction('rw', [this.sheetMetadata, this.cells], async () => {
      await this.clearSheetCells(tabId);

      const metadata = await this.getSheetMetadata(tabId);
      if (metadata?.id) {
        await this.sheetMetadata.delete(metadata.id);
      }
    });
  }

  /**
   * Convert sparse cell data to 2D array (for ExcelViewer compatibility)
   */
  async getCellsAs2DArray(tabId: string, minRows = 100, minCols = 100): Promise<any[][]> {
    const cells = await this.getCellsForSheet(tabId);
    const metadata = await this.getSheetMetadata(tabId);

    // Determine dimensions
    const rows = Math.max(minRows, metadata?.maxRow ?? 0) + 1;
    const cols = Math.max(minCols, metadata?.maxCol ?? 0) + 1;

    // Create empty 2D array
    const result: any[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ value: null as any, type: 'empty' }))
      );

    // Fill with actual cell data
    cells.forEach(cell => {
      if (cell.row < rows && cell.col < cols) {
        result[cell.row][cell.col] = {
          value: cell.value,
          type: cell.type,
          formula: cell.formula,
          style: cell.style,
        };
      }
    });

    return result;
  }

  /**
   * Save 2D array to sparse cell storage (for migration from useState)
   */
  async save2DArrayAsCells(tabId: string, data: any[][]): Promise<void> {
    console.log('[db] save2DArrayAsCells called', {
      tabId,
      dataRows: data.length,
      dataCols: data[0]?.length || 0,
    });

    await this.transaction('rw', [this.cells, this.sheetMetadata], async () => {
      // Clear existing cells
      await this.clearSheetCells(tabId);
      console.log('[db] Cleared existing cells for', tabId);

      // Convert to sparse format (only save non-empty cells)
      const cellUpdates: Array<{ row: number; col: number; data: Partial<StoredCellData> }> = [];

      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          // Skip null/undefined cells
          if (!cell) return;

          // Save cells that:
          // 1. Have a non-empty value, OR
          // 2. Have a formula, OR
          // 3. Have a type other than 'empty'
          const hasValue = cell.value !== null && cell.value !== undefined && cell.value !== '';
          const hasFormula =
            cell.formula !== null && cell.formula !== undefined && cell.formula !== '';
          const hasType = cell.type && cell.type !== 'empty';

          if (hasValue || hasFormula || hasType) {
            cellUpdates.push({
              row: rowIndex,
              col: colIndex,
              data: {
                value: cell.value,
                type: cell.type || 'string',
                formula: cell.formula,
                style: cell.style,
              },
            });
          }
        });
      });

      console.log('[db] Prepared', cellUpdates.length, 'cells to save');

      // Bulk insert
      await this.bulkUpsertCells(tabId, cellUpdates);

      console.log('[db] Bulk upsert completed for', tabId);
    });
  }

  /**
   * Get or create workbook metadata
   */
  async getOrCreateWorkbook(
    workbookId: string,
    fileName: string,
    filePath: string
  ): Promise<WorkbookMetadata> {
    const existing = await this.workbooks.where('workbookId').equals(workbookId).first();

    if (existing) {
      // Update last opened
      await this.workbooks.update(existing.id!, {
        lastOpened: new Date(),
      });
      return existing;
    } else {
      const id = await this.workbooks.add({
        workbookId,
        fileName,
        filePath,
        lastOpened: new Date(),
        createdAt: new Date(),
      });
      return (await this.workbooks.get(id))!;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const db = new AppDatabase();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Reset database (for testing or clearing data)
 */
export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}

/**
 * Export database statistics
 */
export async function getDatabaseStats() {
  const [sheetCount, cellCount, workbookCount] = await Promise.all([
    db.sheetMetadata.count(),
    db.cells.count(),
    db.workbooks.count(),
  ]);

  const sheets = await db.sheetMetadata.toArray();
  const totalCellsInMetadata = sheets.reduce((sum, sheet) => sum + sheet.cellCount, 0);

  return {
    sheets: sheetCount,
    cells: cellCount,
    workbooks: workbookCount,
    totalCellsInMetadata,
    averageCellsPerSheet: sheetCount > 0 ? totalCellsInMetadata / sheetCount : 0,
  };
}
