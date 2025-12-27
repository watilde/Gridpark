/**
 * useSpreadsheet - Simplified spreadsheet state management
 * 
 * Key improvements over useExcelSheet:
 * 1. Direct DB integration (no intermediate state)
 * 2. Formula engine integration
 * 3. Incremental updates only
 * 4. No dense 2D arrays
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, StoredCellData } from '../../../lib/db';
import { FormulaEngine } from '../utils/FormulaEngine';

interface CellPosition {
  row: number;
  col: number;
}

interface UseSpreadsheetParams {
  tabId: string;
  workbookId: string;
  sheetName: string;
}

export function useSpreadsheet({ tabId, workbookId, sheetName }: UseSpreadsheetParams) {
  // Formula engine instance (one per sheet)
  const [formulaEngine] = useState(() => new FormulaEngine());

  // Selected cell
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);

  // Live query for cells (sparse data only)
  const cells = useLiveQuery(
    async () => {
      const cellArray = await db.getCells(tabId);
      
      // Convert to Map for O(1) lookup
      const cellMap = new Map<string, StoredCellData>();
      cellArray.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        cellMap.set(key, cell);
      });
      
      return cellMap;
    },
    [tabId]
  );

  // Live query for metadata
  const metadata = useLiveQuery(
    () => db.getSheetMetadata(tabId),
    [tabId]
  );

  // Compute all formulas when cells change
  const computedValues = useMemo(() => {
    if (!cells) return new Map<string, any>();
    
    // Clear previous data
    formulaEngine.clear();
    
    // Batch update all cells (optimized)
    const cellUpdates = Array.from(cells.entries()).map(([key, cell]) => ({
      row: cell.row,
      col: cell.col,
      cell: {
        row: cell.row,
        col: cell.col,
        value: cell.value,
        formula: cell.formula,
        type: cell.type,
      },
    }));
    
    formulaEngine.batchUpdate(cellUpdates);
    
    // Get computed values
    const computed = new Map<string, any>();
    cells.forEach((cell, key) => {
      const result = formulaEngine.getCell(cell.row, cell.col);
      computed.set(key, result.value);
    });
    
    return computed;
  }, [cells, formulaEngine]);

  // Dirty flag
  const isDirty = useMemo(() => metadata?.dirty ?? false, [metadata]);

  // Grid dimensions (with buffer for infinite scroll)
  const dimensions = useMemo(() => {
    const maxRow = metadata?.maxRow ?? 0;
    const maxCol = metadata?.maxCol ?? 0;
    
    return {
      rows: Math.max(100, maxRow + 50), // +50 row buffer
      cols: Math.max(26, maxCol + 5),   // +5 col buffer
    };
  }, [metadata]);

  // Update a single cell
  const updateCell = useCallback(async (row: number, col: number, value: string) => {
    // Parse value
    const isFormula = value.startsWith('=');
    const formula = isFormula ? value : undefined;
    const rawValue = isFormula ? null : value;
    
    // Determine type
    let type: 'empty' | 'string' | 'number' = 'empty';
    if (rawValue) {
      const num = parseFloat(rawValue);
      type = !isNaN(num) ? 'number' : 'string';
    }
    
    // Update DB
    await db.upsertCell(tabId, row, col, {
      value: rawValue,
      type,
      formula,
      style: {},
    });
    
    // Update formula engine (incremental) - HyperFormula does this automatically
    formulaEngine.setCell(row, col, {
      row,
      col,
      value: rawValue,
      formula,
      type,
    });
    
    // Mark dirty
    await db.markSheetDirty(tabId, true);
  }, [tabId, formulaEngine]);

  // Save to disk (mark as clean)
  const save = useCallback(async () => {
    await db.markSheetDirty(tabId, false);
  }, [tabId]);

  return {
    // Data
    cells: cells ?? new Map(),
    computedValues,
    metadata,
    
    // State
    selectedCell,
    setSelectedCell,
    isDirty,
    
    // Dimensions
    dimensions,
    
    // Actions
    updateCell,
    save,
  };
}
