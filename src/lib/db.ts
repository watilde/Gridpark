/**
 * Dexie.js Database Configuration
 * 
 * Manages all table data using IndexedDB for:
 * - Sheet data (cells, formulas, formatting)
 * - Large datasets with reactive queries
 * - Offline-first data persistence
 */

import Dexie, { Table } from 'dexie';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SheetData {
  id?: number;
  workbookId: string;
  sheetName: string;
  sheetIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CellData {
  id?: number;
  sheetId: number;
  row: number;
  col: number;
  value?: string | number | boolean;
  formula?: string;
  style?: Record<string, any>;
  updatedAt: Date;
}

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
  sheets!: Table<SheetData, number>;
  cells!: Table<CellData, number>;
  workbooks!: Table<WorkbookMetadata, number>;

  constructor() {
    super('ExcelAppDatabase');

    // Database schema
    this.version(1).stores({
      sheets: '++id, workbookId, sheetName, sheetIndex',
      cells: '++id, sheetId, [sheetId+row+col], row, col',
      workbooks: '++id, workbookId, filePath, lastOpened',
    });
  }

  /**
   * Get all cells for a specific sheet
   */
  async getCellsForSheet(sheetId: number): Promise<CellData[]> {
    return await this.cells.where('sheetId').equals(sheetId).toArray();
  }

  /**
   * Get a specific cell
   */
  async getCell(sheetId: number, row: number, col: number): Promise<CellData | undefined> {
    return await this.cells
      .where('[sheetId+row+col]')
      .equals([sheetId, row, col])
      .first();
  }

  /**
   * Update or insert a cell
   */
  async upsertCell(sheetId: number, row: number, col: number, data: Partial<CellData>): Promise<number> {
    const existing = await this.getCell(sheetId, row, col);
    
    if (existing) {
      await this.cells.update(existing.id!, {
        ...data,
        updatedAt: new Date(),
      });
      return existing.id!;
    } else {
      return await this.cells.add({
        sheetId,
        row,
        col,
        ...data,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Bulk upsert cells (optimized for large updates)
   */
  async bulkUpsertCells(cells: Array<{ sheetId: number; row: number; col: number; data: Partial<CellData> }>): Promise<void> {
    await this.transaction('rw', this.cells, async () => {
      for (const { sheetId, row, col, data } of cells) {
        await this.upsertCell(sheetId, row, col, data);
      }
    });
  }

  /**
   * Clear all cells for a sheet
   */
  async clearSheetCells(sheetId: number): Promise<void> {
    await this.cells.where('sheetId').equals(sheetId).delete();
  }

  /**
   * Get sheet by workbook and name
   */
  async getSheet(workbookId: string, sheetName: string): Promise<SheetData | undefined> {
    return await this.sheets
      .where({ workbookId, sheetName })
      .first();
  }

  /**
   * Get all sheets for a workbook
   */
  async getSheetsForWorkbook(workbookId: string): Promise<SheetData[]> {
    return await this.sheets
      .where('workbookId')
      .equals(workbookId)
      .sortBy('sheetIndex');
  }

  /**
   * Create or update sheet
   */
  async upsertSheet(workbookId: string, sheetName: string, sheetIndex: number): Promise<number> {
    const existing = await this.getSheet(workbookId, sheetName);
    
    if (existing) {
      await this.sheets.update(existing.id!, {
        sheetIndex,
        updatedAt: new Date(),
      });
      return existing.id!;
    } else {
      return await this.sheets.add({
        workbookId,
        sheetName,
        sheetIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Delete sheet and all its cells
   */
  async deleteSheet(sheetId: number): Promise<void> {
    await this.transaction('rw', [this.sheets, this.cells], async () => {
      await this.clearSheetCells(sheetId);
      await this.sheets.delete(sheetId);
    });
  }

  /**
   * Get or create workbook metadata
   */
  async getOrCreateWorkbook(workbookId: string, fileName: string, filePath: string): Promise<WorkbookMetadata> {
    const existing = await this.workbooks
      .where('workbookId')
      .equals(workbookId)
      .first();

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
    db.sheets.count(),
    db.cells.count(),
    db.workbooks.count(),
  ]);

  return {
    sheets: sheetCount,
    cells: cellCount,
    workbooks: workbookCount,
  };
}
