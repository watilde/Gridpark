/**
 * Simple In-Memory Data Store (Simplified in-memory storage)
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
  // Background and foreground
  backgroundColor?: string;
  color?: string;
  
  // Font styling
  fontWeight?: string | number; // 'normal' | 'bold' | 100-900
  fontStyle?: string; // 'normal' | 'italic'
  textDecoration?: string; // 'none' | 'underline' | 'line-through'
  fontSize?: string; // '12px', '14px', etc.
  fontFamily?: string; // 'Arial', 'Helvetica', etc.
  
  // Text alignment
  textAlign?: string; // 'left' | 'center' | 'right'
  verticalAlign?: string; // 'top' | 'middle' | 'bottom'
  
  // Borders
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  
  // Number formatting
  numberFormat?: string; // '0.00', '#,##0', etc.
  
  // Additional properties
  [key: string]: string | number | undefined;
}

/**
 * Conditional formatting rule types
 */
export type ConditionalFormattingType = 
  | 'cellIs' // Compare cell value
  | 'expression' // Formula-based
  | 'top10' // Top/bottom N values
  | 'aboveAverage' // Above/below average
  | 'colorScale' // Color gradient
  | 'iconSet' // Icon indicators
  | 'dataBar' // Horizontal bars
  | 'containsText' // Text pattern
  | 'timePeriod'; // Date-based

/**
 * Conditional formatting operators
 */
export type ConditionalFormattingOperator =
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'equal'
  | 'notEqual'
  | 'between'
  | 'notBetween'
  | 'containsText'
  | 'notContainsText'
  | 'beginsWith'
  | 'endsWith';

/**
 * Conditional formatting rule
 */
export interface ConditionalFormattingRule {
  id: string; // Unique rule ID
  type: ConditionalFormattingType;
  priority: number; // Higher priority = evaluated first
  
  // Range to apply rule
  ranges: Array<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>;
  
  // Rule-specific config
  operator?: ConditionalFormattingOperator;
  formula?: string; // For expression type
  value?: string | number; // For comparison
  value2?: string | number; // For between operator
  
  // Formatting to apply
  style?: CellStyleData;
  
  // Color scale config
  colorScale?: {
    min?: { value?: number; color: string };
    mid?: { value?: number; color: string };
    max?: { value?: number; color: string };
  };
  
  // Icon set config
  iconSet?: {
    icons: string[]; // Icon names
    reverse?: boolean; // Reverse icon order
    showValue?: boolean; // Show cell value
  };
  
  // Data bar config
  dataBar?: {
    color: string;
    showValue?: boolean;
    minLength?: number;
    maxLength?: number;
  };
  
  // Stop if true (don't evaluate lower priority rules)
  stopIfTrue?: boolean;
}

/**
 * Sheet conditional formatting rules
 */
export interface SheetConditionalFormatting {
  tabId: string;
  rules: ConditionalFormattingRule[];
  updatedAt: Date;
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
  merges?: string[]; // Merged cell ranges (e.g., "A1:B2")

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
// Database Class (In-Memory Storage with Event System)
// ============================================================================

type ChangeEvent = {
  type: 'metadata' | 'cells';
  tabId: string;
  action: 'create' | 'update' | 'delete';
};

type ChangeListener = (event: ChangeEvent) => void;

type SubscriptionOptions = {
  tabId?: string; // Subscribe to specific tabId only
  type?: 'metadata' | 'cells'; // Subscribe to specific type only
};

export class AppDatabase {
  // In-memory storage
  private sheetMetadataStore: Map<string, SheetMetadata> = new Map();
  private cellsStore: Map<string, StoredCellData> = new Map();
  private workbooksStore: Map<string, WorkbookMetadata> = new Map();
  private nextId = 1;

  // Event system for reactive updates (replaces polling)
  // Optimized: Store listeners with their filter options
  private listeners: Map<ChangeListener, SubscriptionOptions> = new Map();

  constructor() {
    console.log('[DB] In-memory database initialized with optimized event system');
  }

  // ==========================================================================
  // Event System (Observer Pattern with Selective Subscription)
  // ==========================================================================

  /**
   * Subscribe to database changes with optional filters
   * @param listener - Callback function
   * @param options - Filter options (tabId, type)
   * @returns Unsubscribe function
   */
  subscribe(listener: ChangeListener, options: SubscriptionOptions = {}): () => void {
    this.listeners.set(listener, options);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify listeners of a change (only matching filters)
   */
  private notify(event: ChangeEvent) {
    this.listeners.forEach((options, listener) => {
      // Filter: only notify if event matches subscription options
      // Special case: _batch_ events match ALL tabId filters for that type
      const isBatchEvent = event.tabId === '_batch_';
      const matchesTabId = !options.tabId || options.tabId === event.tabId || isBatchEvent;
      const matchesType = !options.type || options.type === event.type;
      
      if (matchesTabId && matchesType) {
        try {
          listener(event);
        } catch (error) {
          console.error('[DB] Error in change listener:', error);
        }
      }
    });
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
    data: Omit<SheetMetadata, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options: { silent?: boolean } = {}
  ): Promise<number> {
    const existing = this.sheetMetadataStore.get(data.tabId);
    const action = existing ? 'update' : 'create';

    if (existing) {
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      };
      this.sheetMetadataStore.set(data.tabId, updated);
      
      // Notify listeners (unless silent mode)
      if (!options.silent) {
        this.notify({ type: 'metadata', tabId: data.tabId, action: 'update' });
      }
      
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
      
      // Notify listeners (unless silent mode)
      if (!options.silent) {
        this.notify({ type: 'metadata', tabId: data.tabId, action: 'create' });
      }
      
      return newMetadata.id!;
    }
  }

  /**
   * Batch initialize sheet metadata for multiple sheets
   * Optimized: Single event notification after all inserts
   */
  async batchUpsertSheetMetadata(
    dataArray: Array<Omit<SheetMetadata, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>>
  ): Promise<number[]> {
    console.log(`[db] Batch upsert started: ${dataArray.length} sheets`);
    
    const ids: number[] = [];
    
    // Insert all metadata WITHOUT triggering events
    for (const data of dataArray) {
      const id = await this.upsertSheetMetadata(data, { silent: true });
      ids.push(id);
    }
    
    // Single event notification after all inserts (for refresh)
    // Use first tabId as representative (listeners should refresh all)
    if (dataArray.length > 0) {
      this.notify({ type: 'metadata', tabId: '_batch_', action: 'create' });
    }
    
    console.log(`[db] Batch upsert completed: ${ids.length} sheets`);
    return ids;
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
    
    // Notify listeners of dirty state change
    this.notify({ type: 'metadata', tabId, action: 'update' });
    
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
    const action = existing ? 'update' : 'create';

    if (existing) {
      const updated = {
        ...existing,
        ...data,
        updatedAt: now,
        version: (existing.version || 0) + 1,
      };
      this.cellsStore.set(key, updated);
      
      // Notify listeners
      this.notify({ type: 'cells', tabId, action: 'update' });
      
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
      
      // Notify listeners
      this.notify({ type: 'cells', tabId, action: 'create' });
      
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

      // Update sheet dimensions (preserve existing max if larger)
      const metadata = this.sheetMetadataStore.get(tabId);
      let maxRow = metadata?.maxRow ?? 0;
      let maxCol = metadata?.maxCol ?? 0;

      // Calculate max from current updates
      cellUpdates.forEach(({ row, col }) => {
        if (row > maxRow) maxRow = row;
        if (col > maxCol) maxCol = col;
      });

      if (metadata) {
        metadata.maxRow = maxRow;
        metadata.maxCol = maxCol;
        // NOTE: cellCount should be total cells in sheet, not just updates
        // It will be calculated correctly by updateSheetDimensions if needed
        // For now, we don't update it here to avoid incorrect counts
        metadata.updatedAt = now;
        this.sheetMetadataStore.set(tabId, metadata);
        
        console.log('[db] bulkUpsertCells: metadata updated', {
          tabId,
          maxRow,
          maxCol,
          updatesCount: cellUpdates.length,
        });
      } else {
        console.warn('[db] bulkUpsertCells: metadata not found for', tabId);
      }

      console.log('[db] bulkUpsertCells: completed', { tabId });

      // Notify listeners (single event for bulk operation)
      this.notify({ type: 'cells', tabId, action: 'update' });

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

    // Calculate ACTUAL dimensions from cells (don't trust metadata - it may be stale!)
    let actualMaxRow = metadata?.maxRow ?? 0;
    let actualMaxCol = metadata?.maxCol ?? 0;
    
    cells.forEach(cell => {
      if (cell.row > actualMaxRow) actualMaxRow = cell.row;
      if (cell.col > actualMaxCol) actualMaxCol = cell.col;
    });

    // Determine dimensions (use actual cell data, not just metadata)
    const rows = Math.max(minRows, actualMaxRow + 1);
    const cols = Math.max(minCols, actualMaxCol + 1);

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
          // 1. Have a non-null/non-undefined value (including empty string ''), OR
          // 2. Have a formula, OR
          // 3. Have a non-empty type
          // NOTE: We save empty strings because they're explicit user input
          const hasValue = cell.value !== null && cell.value !== undefined;
          const hasFormula =
            cell.formula !== null && cell.formula !== undefined && cell.formula !== '';
          const hasNonEmptyType = cell.type && cell.type !== 'empty';

          // Save if any of these conditions are true
          if (hasValue || hasFormula || hasNonEmptyType) {
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

  // ============================================================================
  // Conditional Formatting Methods
  // ============================================================================

  /**
   * Store for conditional formatting rules (in-memory)
   */
  private conditionalFormattingStore = new Map<string, SheetConditionalFormatting>();

  /**
   * Get conditional formatting rules for a sheet
   */
  async getConditionalFormatting(tabId: string): Promise<ConditionalFormattingRule[]> {
    const cf = this.conditionalFormattingStore.get(tabId);
    return cf?.rules || [];
  }

  /**
   * Set conditional formatting rules for a sheet
   */
  async setConditionalFormatting(tabId: string, rules: ConditionalFormattingRule[]): Promise<void> {
    this.conditionalFormattingStore.set(tabId, {
      tabId,
      rules,
      updatedAt: new Date(),
    });
  }

  /**
   * Add a conditional formatting rule
   */
  async addConditionalFormattingRule(tabId: string, rule: ConditionalFormattingRule): Promise<void> {
    const existing = await this.getConditionalFormatting(tabId);
    const updated = [...existing, rule].sort((a, b) => b.priority - a.priority);
    await this.setConditionalFormatting(tabId, updated);
  }

  /**
   * Remove a conditional formatting rule
   */
  async removeConditionalFormattingRule(tabId: string, ruleId: string): Promise<void> {
    const existing = await this.getConditionalFormatting(tabId);
    const updated = existing.filter(r => r.id !== ruleId);
    await this.setConditionalFormatting(tabId, updated);
  }

  /**
   * Update a conditional formatting rule
   */
  async updateConditionalFormattingRule(
    tabId: string,
    ruleId: string,
    updates: Partial<ConditionalFormattingRule>
  ): Promise<void> {
    const existing = await this.getConditionalFormatting(tabId);
    const updated = existing.map(r => (r.id === ruleId ? { ...r, ...updates } : r));
    await this.setConditionalFormatting(tabId, updated.sort((a, b) => b.priority - a.priority));
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
