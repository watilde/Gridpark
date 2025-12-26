/**
 * Simple In-Memory Data Store (Simplified from Dexie)
 *
 * Manages all table data using in-memory storage for:
 * - Sheet data (cells, formulas, formatting)
 * - Simplified storage without IndexedDB complexity
 *
 * SIMPLIFIED SCHEMA:
 * - Sparse matrix storage (only non-empty cells)
 * - Fast lookups using Map data structures
 * - Separate metadata for efficient sheet-level operations
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cell value types (strictly typed)
 */
export type CellValue = string | number | boolean | null | Date;

/**
 * Cell value types matching ExcelViewer CellData
 */
export type CellType = 'empty' | 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula';

/**
 * Cell data format for 2D array representation
 */
export interface CellData {
  value: CellValue;
  type: CellType;
  formula?: string;
  style?: CellStyleData;
}

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

  // Cell content (strictly typed)
  value: CellValue; // Cell value (string | number | boolean | null | Date)
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
// Database Class (In-Memory Storage)
// ============================================================================

export class AppDatabase {
  // In-memory storage
  private sheetMetadataStore: Map<string, SheetMetadata> = new Map();
  private cellsStore: Map<string, StoredCellData> = new Map();
  private workbooksStore: Map<string, WorkbookMetadata> = new Map();
  private nextId = 1;

  constructor() {
    console.log('[DB] In-memory database initialized');
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private getCellKey(tabId: string, row: number, col: number): string {
    return `${tabId}:${row}:${col}`;
  }

  // ==========================================================================
  // Sheet Metadata Operations
  // ==========================================================================

  /**
   * Get sheet metadata by tab ID
   */
  async getSheetMetadata(tabId: string): Promise<SheetMetadata | undefined> {
    return this.sheetMetadataStore.get(tabId);
  }

  /**
   * Create or update sheet metadata
   */
  async upsertSheetMetadata(
    data: Omit<SheetMetadata, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>
  ): Promise<number> {
    const existing = this.sheetMetadataStore.get(data.tabId);

    if (existing) {
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      };
      this.sheetMetadataStore.set(data.tabId, updated);
      return existing.id!;
    } else {
      const newMetadata: SheetMetadata = {
        ...data,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      };
      this.sheetMetadataStore.set(data.tabId, newMetadata);
      return newMetadata.id!;
    }
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
      metadata.maxRow = maxRow;
      metadata.maxCol = maxCol;
      metadata.cellCount = cells.length;
      metadata.updatedAt = new Date();
      this.sheetMetadataStore.set(tabId, metadata);
    }
  }

  /**
   * Mark sheet as dirty (has unsaved changes)
   */
  async markSheetDirty(tabId: string, dirty = true): Promise<void> {
    console.log('[db] === MARK SHEET DIRTY ===', { tabId, dirty });
    
    const metadata = await this.getSheetMetadata(tabId);
    
    if (!metadata) {
      console.warn('[db] No metadata found for tabId (skipping):', tabId);
      console.warn('[db] Available tabIds:', Array.from(this.sheetMetadataStore.keys()));
      return; // Silently skip if metadata doesn't exist
    }

    const oldDirty = metadata.dirty;
    
    if (oldDirty === dirty) {
      console.log('[db] Dirty flag unchanged, skipping update', { tabId, dirty });
      return;
    }

    console.log('[db] Updating dirty flag', { 
      tabId, 
      oldDirty, 
      newDirty: dirty 
    });
    
    metadata.dirty = dirty;
    metadata.updatedAt = new Date();
    this.sheetMetadataStore.set(tabId, metadata);
    
    // Verify the update
    const verified = await this.getSheetMetadata(tabId);
    console.log('[db] === DIRTY FLAG UPDATED ===', { 
      tabId, 
      dirty: verified?.dirty,
      success: verified?.dirty === dirty 
    });
  }

  // ==========================================================================
  // Cell Operations (Optimized for Sparse Matrix)
  // ==========================================================================

  /**
   * Get all cells for a sheet (returns sparse array)
   */
  async getCellsForSheet(tabId: string): Promise<StoredCellData[]> {
    const cells: StoredCellData[] = [];
    for (const [key, cell] of this.cellsStore.entries()) {
      if (cell.tabId === tabId) {
        cells.push(cell);
      }
    }
    return cells;
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
    const cells = await this.getCellsForSheet(tabId);
    return cells.filter(
      cell =>
        cell.row >= startRow && cell.row <= endRow && cell.col >= startCol && cell.col <= endCol
    );
  }

  /**
   * Get a specific cell
   */
  async getCell(tabId: string, row: number, col: number): Promise<StoredCellData | undefined> {
    const key = this.getCellKey(tabId, row, col);
    return this.cellsStore.get(key);
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
    const key = this.getCellKey(tabId, row, col);
    const existing = this.cellsStore.get(key);
    const now = new Date();

    if (existing) {
      const updated = {
        ...existing,
        ...data,
        updatedAt: now,
        version: (existing.version || 0) + 1,
      };
      this.cellsStore.set(key, updated);
      return existing.id!;
    } else {
      const newCell: StoredCellData = {
        id: this.nextId++,
        tabId,
        row,
        col,
        value: null,
        type: 'empty',
        ...data,
        updatedAt: now,
        version: 1,
      };
      this.cellsStore.set(key, newCell);
      return newCell.id!;
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

    try {
      const now = new Date();
      
      cellUpdates.forEach(({ row, col, data }) => {
        const key = this.getCellKey(tabId, row, col);
        const existing = this.cellsStore.get(key);
        
        const cellData: StoredCellData = {
          id: existing?.id || this.nextId++,
          tabId,
          row,
          col,
          value: data.value ?? null,
          type: data.type ?? 'empty',
          formula: data.formula ?? undefined,
          style: data.style ?? undefined,
          updatedAt: now,
          version: existing ? (existing.version || 0) + 1 : 1,
        };
        
        this.cellsStore.set(key, cellData);
      });

      console.log('[db] bulkUpsertCells: completed, updating dimensions', { tabId });

      // Update sheet dimensions
      let maxRow = 0;
      let maxCol = 0;

      cellUpdates.forEach(({ row, col }) => {
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      });

      const metadata = this.sheetMetadataStore.get(tabId);

      if (metadata) {
        metadata.maxRow = maxRow;
        metadata.maxCol = maxCol;
        metadata.cellCount = cellUpdates.length;
        metadata.updatedAt = now;
        this.sheetMetadataStore.set(tabId, metadata);
        
        console.log('[db] bulkUpsertCells: metadata updated', {
          tabId,
          maxRow,
          maxCol,
          cellCount: cellUpdates.length,
        });
      } else {
        console.warn('[db] bulkUpsertCells: metadata not found for', tabId);
      }

      console.log('[db] bulkUpsertCells: completed', { tabId });

      return cellUpdates.length;
    } catch (error) {
      console.error('[db] bulkUpsertCells: failed', { tabId, error });
      throw new Error(
        `Failed to bulk upsert cells for tab ${tabId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a specific cell (convert to empty)
   */
  async deleteCell(tabId: string, row: number, col: number): Promise<void> {
    const key = this.getCellKey(tabId, row, col);
    this.cellsStore.delete(key);
  }

  /**
   * Clear all cells for a sheet
   */
  async clearSheetCells(tabId: string): Promise<void> {
    const keys: string[] = [];
    for (const [key, cell] of this.cellsStore.entries()) {
      if (cell.tabId === tabId) {
        keys.push(key);
      }
    }
    keys.forEach(key => this.cellsStore.delete(key));

    // Reset dimensions
    await this.updateSheetDimensions(tabId);
  }

  /**
   * Delete sheet and all its cells
   */
  async deleteSheet(tabId: string): Promise<void> {
    try {
      await this.clearSheetCells(tabId);
      this.sheetMetadataStore.delete(tabId);
    } catch (error) {
      console.error('[db] deleteSheet: failed', { tabId, error });
      throw new Error(
        `Failed to delete sheet ${tabId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert sparse cell data to 2D array (for ExcelViewer compatibility)
   */
  async getCellsAs2DArray(tabId: string, minRows = 100, minCols = 100): Promise<CellData[][]> {
    const cells = await this.getCellsForSheet(tabId);
    const metadata = await this.getSheetMetadata(tabId);

    // Determine dimensions
    const rows = Math.max(minRows, metadata?.maxRow ?? 0) + 1;
    const cols = Math.max(minCols, metadata?.maxCol ?? 0) + 1;

    // Create empty 2D array
    const result: CellData[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(
            (): CellData => ({
              value: null,
              type: 'empty',
            })
          )
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
  async save2DArrayAsCells(tabId: string, data: CellData[][]): Promise<void> {
    console.log('[db] save2DArrayAsCells called', {
      tabId,
      dataRows: data.length,
      dataCols: data[0]?.length || 0,
    });

    try {
      // Clear existing cells
      await this.clearSheetCells(tabId);
      console.log('[db] Cleared existing cells for', tabId);

      // Convert to sparse format (only save non-empty cells)
      const cellUpdates: Array<{ row: number; col: number; data: Partial<StoredCellData> }> =
        [];

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
    } catch (error) {
      console.error('[db] save2DArrayAsCells: failed', { tabId, error });
      throw new Error(
        `Failed to save 2D array as cells for tab ${tabId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get or create workbook metadata
   */
  async getOrCreateWorkbook(
    workbookId: string,
    fileName: string,
    filePath: string
  ): Promise<WorkbookMetadata> {
    const existing = this.workbooksStore.get(workbookId);

    if (existing) {
      // Update last opened
      existing.lastOpened = new Date();
      this.workbooksStore.set(workbookId, existing);
      return existing;
    } else {
      const newWorkbook: WorkbookMetadata = {
        id: this.nextId++,
        workbookId,
        fileName,
        filePath,
        lastOpened: new Date(),
        createdAt: new Date(),
      };
      this.workbooksStore.set(workbookId, newWorkbook);
      return newWorkbook;
    }
  }

  /**
   * Get all sheet metadata (for compatibility with useLiveQuery)
   */
  async getAllSheetMetadata(): Promise<SheetMetadata[]> {
    return Array.from(this.sheetMetadataStore.values());
  }

  /**
   * Update sheet metadata (for compatibility)
   */
  async updateSheetMetadata(id: number, updates: Partial<SheetMetadata>): Promise<void> {
    for (const metadata of this.sheetMetadataStore.values()) {
      if (metadata.id === id) {
        Object.assign(metadata, updates);
        this.sheetMetadataStore.set(metadata.tabId, metadata);
        break;
      }
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
  // For in-memory, just create a new instance
  // Note: This won't affect the exported singleton
  console.log('[DB] Database reset requested (in-memory)');
}

/**
 * Export database statistics
 */
export async function getDatabaseStats() {
  const sheets = await db.getAllSheetMetadata();
  const sheetCount = sheets.length;
  const totalCellsInMetadata = sheets.reduce((sum, sheet) => sum + sheet.cellCount, 0);

  return {
    sheets: sheetCount,
    cells: totalCellsInMetadata,
    workbooks: 0, // Not tracked separately
    totalCellsInMetadata,
    averageCellsPerSheet: sheetCount > 0 ? totalCellsInMetadata / sheetCount : 0,
  };
}
