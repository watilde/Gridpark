/**
 * useSpreadsheet - Simplified spreadsheet state management
 * 
 * Key improvements over useExcelSheet:
 * 1. Direct DB integration (no intermediate state)
 * 2. Formula engine integration
 * 3. Incremental updates only
 * 4. No dense 2D arrays
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

// Undo/Redo history item
interface HistoryItem {
  row: number;
  col: number;
  before: { value: any; formula?: string; type: string } | null;
  after: { value: any; formula?: string; type: string };
}

export function useSpreadsheet({ tabId, workbookId, sheetName }: UseSpreadsheetParams) {
  // Formula engine instance (one per sheet)
  const [formulaEngine] = useState(() => new FormulaEngine());

  // Selected cell
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  
  // Flag to prevent recording history during undo/redo
  const isUndoRedoRef = useRef(false);

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
    // Get current cell value for history
    const key = `${row},${col}`;
    const currentCell = cells?.get(key);
    const before = currentCell 
      ? { value: currentCell.value, formula: currentCell.formula, type: currentCell.type }
      : null;
    
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
    
    // After state for history
    const after = { value: rawValue, formula, type };
    
    // Record history (if not undo/redo operation)
    if (!isUndoRedoRef.current) {
      const historyItem: HistoryItem = { row, col, before, after };
      setUndoStack(prev => [...prev, historyItem]);
      setRedoStack([]); // Clear redo stack on new change
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
  }, [tabId, formulaEngine, cells]);

  // Save to disk (mark as clean)
  const save = useCallback(async () => {
    await db.markSheetDirty(tabId, false);
  }, [tabId]);

  // Undo
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    
    const item = undoStack[undoStack.length - 1];
    isUndoRedoRef.current = true;
    
    try {
      // Restore previous value
      if (item.before) {
        await db.upsertCell(tabId, item.row, item.col, {
          value: item.before.value,
          type: item.before.type,
          formula: item.before.formula,
          style: {},
        });
        
        formulaEngine.setCell(item.row, item.col, {
          row: item.row,
          col: item.col,
          value: item.before.value,
          formula: item.before.formula,
          type: item.before.type,
        });
      } else {
        // Delete cell (was empty before)
        await db.deleteCell(tabId, item.row, item.col);
      }
      
      // Move to redo stack
      setRedoStack(prev => [...prev, item]);
      setUndoStack(prev => prev.slice(0, -1));
      
      await db.markSheetDirty(tabId, true);
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [tabId, undoStack, formulaEngine]);

  // Redo
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    
    const item = redoStack[redoStack.length - 1];
    isUndoRedoRef.current = true;
    
    try {
      // Restore next value
      await db.upsertCell(tabId, item.row, item.col, {
        value: item.after.value,
        type: item.after.type,
        formula: item.after.formula,
        style: {},
      });
      
      formulaEngine.setCell(item.row, item.col, {
        row: item.row,
        col: item.col,
        value: item.after.value,
        formula: item.after.formula,
        type: item.after.type,
      });
      
      // Move to undo stack
      setUndoStack(prev => [...prev, item]);
      setRedoStack(prev => prev.slice(0, -1));
      
      await db.markSheetDirty(tabId, true);
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [tabId, redoStack, formulaEngine]);

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
    
    // Undo/Redo
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
