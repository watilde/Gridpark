/**
 * Data Migration Utilities
 *
 * Handles migration from legacy useState storage to Dexie.js:
 * - Converts 2D arrays to sparse matrix
 * - Initializes sheet metadata
 * - Preserves dirty state
 * - Handles errors gracefully
 */

import { db } from './db';

// ============================================================================
// Types
// ============================================================================

export interface LegacySheetSession {
  data: any[][];
  dirty: boolean;
}

export interface MigrationResult {
  success: boolean;
  tabsProcessed: number;
  cellsMigrated: number;
  errors: Array<{ tabId: string; error: string }>;
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate a single sheet session from legacy format to Dexie
 */
export async function migrateLegacySheetSession(
  tabId: string,
  session: LegacySheetSession,
  metadata: {
    workbookId: string;
    sheetName: string;
    sheetIndex: number;
  }
): Promise<{ cellCount: number }> {
  console.log(`[Migration] Migrating sheet session: ${tabId}`);

  try {
    // 1. Create sheet metadata
    await db.upsertSheetMetadata({
      tabId,
      workbookId: metadata.workbookId,
      sheetName: metadata.sheetName,
      sheetIndex: metadata.sheetIndex,
      maxRow: 0,
      maxCol: 0,
      cellCount: 0,
      dirty: session.dirty,
    });

    // 2. Convert 2D array to sparse format and save
    await db.save2DArrayAsCells(tabId, session.data);

    // 3. Get cell count
    const cells = await db.getCellsForSheet(tabId);

    console.log(`[Migration] Successfully migrated ${cells.length} cells for ${tabId}`);

    return { cellCount: cells.length };
  } catch (error) {
    console.error(`[Migration] Failed to migrate ${tabId}:`, error);
    throw error;
  }
}

/**
 * Migrate multiple sheet sessions at once
 */
export async function migrateLegacySheetSessions(
  sessions: Record<string, LegacySheetSession>,
  metadataMap: Record<
    string,
    {
      workbookId: string;
      sheetName: string;
      sheetIndex: number;
    }
  >
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    tabsProcessed: 0,
    cellsMigrated: 0,
    errors: [],
  };

  console.log(`[Migration] Starting migration of ${Object.keys(sessions).length} sheet sessions`);

  for (const [tabId, session] of Object.entries(sessions)) {
    try {
      const metadata = metadataMap[tabId];

      if (!metadata) {
        console.warn(`[Migration] No metadata found for ${tabId}, skipping`);
        result.errors.push({
          tabId,
          error: 'No metadata provided',
        });
        continue;
      }

      const { cellCount } = await migrateLegacySheetSession(tabId, session, metadata);

      result.tabsProcessed++;
      result.cellsMigrated += cellCount;
    } catch (error) {
      result.success = false;
      result.errors.push({
        tabId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    `[Migration] Completed. Processed: ${result.tabsProcessed}, Cells: ${result.cellsMigrated}, Errors: ${result.errors.length}`
  );

  return result;
}

/**
 * Check if migration is needed for a specific tab
 */
export async function needsMigration(tabId: string): Promise<boolean> {
  const metadata = await db.getSheetMetadata(tabId);
  return !metadata;
}

/**
 * Check if any migrations are needed
 */
export async function needsAnyMigration(tabIds: string[]): Promise<boolean> {
  for (const tabId of tabIds) {
    if (await needsMigration(tabId)) {
      return true;
    }
  }
  return false;
}

/**
 * Initialize sheet from ExcelFile (for newly opened workbooks)
 */
export async function initializeSheetFromFile(
  tabId: string,
  workbookId: string,
  sheetName: string,
  sheetIndex: number,
  sheetData: any[][]
): Promise<void> {
  console.log(`[Migration] Initializing new sheet: ${tabId}`);

  // Create metadata
  await db.upsertSheetMetadata({
    tabId,
    workbookId,
    sheetName,
    sheetIndex,
    maxRow: 0,
    maxCol: 0,
    cellCount: 0,
    dirty: false,
  });

  // Save data
  await db.save2DArrayAsCells(tabId, sheetData);

  console.log(`[Migration] Sheet initialized: ${tabId}`);
}

/**
 * Clear all migration data (for testing)
 */
export async function clearAllMigrationData(): Promise<void> {
  console.log('[Migration] Clearing all migration data...');

  await db.transaction('rw', [db.sheetMetadata, db.cells], async () => {
    await db.sheetMetadata.clear();
    await db.cells.clear();
  });

  console.log('[Migration] Migration data cleared');
}

/**
 * Get migration statistics
 */
export async function getMigrationStats() {
  const [sheetCount, cellCount] = await Promise.all([db.sheetMetadata.count(), db.cells.count()]);

  const sheets = await db.sheetMetadata.toArray();
  const dirtySheets = sheets.filter(s => s.dirty).length;
  const totalCells = sheets.reduce((sum, s) => sum + s.cellCount, 0);

  return {
    sheetsInDB: sheetCount,
    cellsInDB: cellCount,
    dirtySheets,
    totalCellsInMetadata: totalCells,
    averageCellsPerSheet: sheetCount > 0 ? totalCells / sheetCount : 0,
  };
}
