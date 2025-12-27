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
import { db, StoredCellData, CellStyleData, ConditionalFormattingRule, SheetMetadata } from '../../../../lib/db';
import { FormulaEngine } from '../utils/FormulaEngine';
import { ConditionalFormattingEngine } from '../utils/ConditionalFormattingEngine';

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
  before: { value: any; formula?: string; type: string; style?: CellStyleData } | null;
  after: { value: any; formula?: string; type: string; style?: CellStyleData };
}

export function useSpreadsheet({ tabId, workbookId, sheetName }: UseSpreadsheetParams) {
  // Formula engine instance (one per sheet)
  const [formulaEngine] = useState(() => new FormulaEngine());
  
  // Conditional formatting engine instance
  const [cfEngine] = useState(() => new ConditionalFormattingEngine());

  // Selected cell
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  
  // Selected range
  const [selectedRange, setSelectedRange] = useState<{ start: CellPosition; end: CellPosition } | null>(null);
  
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  
  // Flag to prevent recording history during undo/redo
  const isUndoRedoRef = useRef(false);

  // State for cells, metadata, and CF rules (replacing useLiveQuery)
  const [cells, setCells] = useState<Map<string, StoredCellData>>(new Map());
  const [metadata, setMetadata] = useState<SheetMetadata | undefined>(undefined);
  const [conditionalFormattingRules, setConditionalFormattingRules] = useState<ConditionalFormattingRule[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Load data from DB
  useEffect(() => {
    const loadData = async () => {
      // Load cells
      const cellArray = await db.getCells(tabId);
      const cellMap = new Map<string, StoredCellData>();
      cellArray.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        cellMap.set(key, cell);
      });
      setCells(cellMap);

      // Load metadata
      const meta = await db.getSheetMetadata(tabId);
      setMetadata(meta);

      // Load CF rules
      const cfRules = await db.getConditionalFormatting(tabId);
      setConditionalFormattingRules(cfRules);
    };

    loadData();
  }, [tabId, reloadTrigger]);

  // Trigger reload manually
  const reloadData = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
  }, []);

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

  // Compute cell styles with conditional formatting
  const cellStylesWithCF = useMemo(() => {
    if (!cells) return new Map<string, CellStyleData>();
    
    const styles = new Map<string, CellStyleData>();
    
    // Apply conditional formatting to all cells
    cells.forEach((cell, key) => {
      // Base style from cell
      let style = { ...cell.style };
      
      // Apply conditional formatting
      if (conditionalFormattingRules.length > 0) {
        const cfStyle = cfEngine.evaluateCell(
          cell.row,
          cell.col,
          cell,
          conditionalFormattingRules,
          cells
        );
        
        if (cfStyle) {
          // Merge CF style with base style (CF takes precedence)
          style = { ...style, ...cfStyle };
        }
      }
      
      styles.set(key, style);
    });
    
    return styles;
  }, [cells, conditionalFormattingRules, cfEngine]);

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
  const updateCell = useCallback(async (
    row: number,
    col: number,
    value: string,
    style?: CellStyleData
  ) => {
    // Get current cell value for history
    const key = `${row},${col}`;
    const currentCell = cells?.get(key);
    const before = currentCell 
      ? { value: currentCell.value, formula: currentCell.formula, type: currentCell.type, style: currentCell.style }
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
    
    // Use provided style or keep existing
    const finalStyle = style || currentCell?.style || {};
    
    // After state for history
    const after = { value: rawValue, formula, type, style: finalStyle };
    
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
      style: finalStyle,
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
    
    // Reload data to reflect changes
    reloadData();
  }, [tabId, formulaEngine, cells, reloadData]);

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
          style: item.before.style || {},
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
      
      // Reload data to reflect changes
      reloadData();
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [tabId, undoStack, formulaEngine, reloadData]);

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
        style: item.after.style || {},
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
      
      // Reload data to reflect changes
      reloadData();
    } finally {
      isUndoRedoRef.current = false;
    }
  }, [tabId, redoStack, formulaEngine, reloadData]);

  // Copy selected cell or range to clipboard
  const copyCell = useCallback(async () => {
    // If range is selected, copy range
    if (selectedRange) {
      const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);
      
      const rangeData: any[][] = [];
      for (let row = minRow; row <= maxRow; row++) {
        const rowData: any[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const key = `${row},${col}`;
          const cell = cells?.get(key);
          rowData.push(cell ? {
            value: cell.value,
            formula: cell.formula,
            type: cell.type,
            style: cell.style,
          } : null);
        }
        rangeData.push(rowData);
      }
      
      try {
        await navigator.clipboard.writeText(JSON.stringify({ type: 'range', data: rangeData }));
        console.log(`[Copy] Range copied: ${rangeData.length}x${rangeData[0]?.length || 0}`);
      } catch (err) {
        console.error('[Copy] Failed to copy range:', err);
      }
      return;
    }
    
    // Single cell copy
    if (!selectedCell) return;
    
    const key = `${selectedCell.row},${selectedCell.col}`;
    const cell = cells?.get(key);
    
    if (!cell) return;
    
    const clipboardData = {
      type: 'cell',
      data: {
        value: cell.value,
        formula: cell.formula,
        type: cell.type,
        style: cell.style,
      },
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(clipboardData));
      console.log('[Copy] Cell copied to clipboard');
    } catch (err) {
      console.error('[Copy] Failed to copy:', err);
    }
  }, [selectedCell, selectedRange, cells]);

  // Paste from clipboard to selected cell or range
  const pasteCell = useCallback(async () => {
    if (!selectedCell) return;
    
    try {
      const text = await navigator.clipboard.readText();
      
      // Try to parse as JSON
      try {
        const clipboardData = JSON.parse(text);
        
        // Range paste
        if (clipboardData.type === 'range' && Array.isArray(clipboardData.data)) {
          const rangeData = clipboardData.data;
          const baseRow = selectedCell.row;
          const baseCol = selectedCell.col;
          
          for (let r = 0; r < rangeData.length; r++) {
            for (let c = 0; c < rangeData[r].length; c++) {
              const cellData = rangeData[r][c];
              if (cellData) {
                const value = cellData.formula || cellData.value?.toString() || '';
                await updateCell(baseRow + r, baseCol + c, value, cellData.style);
              }
            }
          }
          console.log(`[Paste] Range pasted: ${rangeData.length}x${rangeData[0]?.length || 0}`);
          return;
        }
        
        // Single cell paste
        if (clipboardData.type === 'cell' && clipboardData.data) {
          const cellData = clipboardData.data;
          const value = cellData.formula || cellData.value?.toString() || '';
          await updateCell(selectedCell.row, selectedCell.col, value, cellData.style);
          console.log('[Paste] Cell pasted from clipboard');
          return;
        }
        
        // Legacy format (backwards compatibility)
        if (clipboardData && typeof clipboardData === 'object' && !clipboardData.type) {
          const value = clipboardData.formula || clipboardData.value?.toString() || '';
          await updateCell(selectedCell.row, selectedCell.col, value, clipboardData.style);
          console.log('[Paste] Cell pasted (legacy format)');
          return;
        }
      } catch {
        // Not JSON, treat as plain text
      }
      
      // Plain text paste
      await updateCell(selectedCell.row, selectedCell.col, text);
      console.log('[Paste] Plain text pasted');
    } catch (err) {
      console.error('[Paste] Failed to paste:', err);
    }
  }, [selectedCell, updateCell]);

  // Update style for entire range
  const updateRangeStyle = useCallback(async (style: CellStyleData) => {
    // Apply to range if selected
    if (selectedRange) {
      const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);
      
      // Batch update all cells in range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const key = `${row},${col}`;
          const cell = cells?.get(key);
          
          // Merge existing style with new style
          const mergedStyle = { ...(cell?.style || {}), ...style };
          
          // Get current value or empty string
          const currentValue = cell?.formula || cell?.value?.toString() || '';
          
          // Update cell with new style
          await updateCell(row, col, currentValue, mergedStyle);
        }
      }
      
      console.log(`[Style] Range styled: ${maxRow - minRow + 1}x${maxCol - minCol + 1} cells`);
      return;
    }
    
    // Apply to single cell if selected
    if (selectedCell) {
      const key = `${selectedCell.row},${selectedCell.col}`;
      const cell = cells?.get(key);
      
      // Merge existing style with new style
      const mergedStyle = { ...(cell?.style || {}), ...style };
      
      // Get current value or empty string
      const currentValue = cell?.formula || cell?.value?.toString() || '';
      
      // Update cell with new style
      await updateCell(selectedCell.row, selectedCell.col, currentValue, mergedStyle);
      
      console.log('[Style] Cell styled');
    }
  }, [selectedCell, selectedRange, cells, updateCell]);

  // Delete range (set all cells in range to empty)
  const deleteRange = useCallback(async () => {
    // Delete range if selected
    if (selectedRange) {
      const minRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      const maxRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      const minCol = Math.min(selectedRange.start.col, selectedRange.end.col);
      const maxCol = Math.max(selectedRange.start.col, selectedRange.end.col);
      
      // Batch delete all cells in range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          await updateCell(row, col, '');
        }
      }
      
      console.log(`[Delete] Range deleted: ${maxRow - minRow + 1}x${maxCol - minCol + 1} cells`);
      return;
    }
    
    // Delete single cell if selected
    if (selectedCell) {
      await updateCell(selectedCell.row, selectedCell.col, '');
      console.log('[Delete] Cell deleted');
    }
  }, [selectedCell, selectedRange, updateCell]);

  // Conditional Formatting Management
  const addConditionalFormattingRule = useCallback(async (rule: ConditionalFormattingRule) => {
    await db.addConditionalFormattingRule(tabId, rule);
    console.log('[CF] Rule added:', rule.id);
    reloadData();
  }, [tabId, reloadData]);

  const removeConditionalFormattingRule = useCallback(async (ruleId: string) => {
    await db.removeConditionalFormattingRule(tabId, ruleId);
    console.log('[CF] Rule removed:', ruleId);
    reloadData();
  }, [tabId, reloadData]);

  const updateConditionalFormattingRule = useCallback(
    async (ruleId: string, updates: Partial<ConditionalFormattingRule>) => {
      await db.updateConditionalFormattingRule(tabId, ruleId, updates);
      console.log('[CF] Rule updated:', ruleId);
      reloadData();
    },
    [tabId, reloadData]
  );

  return {
    // Data
    cells: cells ?? new Map(),
    computedValues,
    cellStylesWithCF,
    metadata,
    
    // State
    selectedCell,
    setSelectedCell,
    selectedRange,
    setSelectedRange,
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
    
    // Copy/Paste
    copyCell,
    pasteCell,
    
    // Range operations
    updateRangeStyle,
    deleteRange,
    
    // Conditional Formatting
    conditionalFormattingRules,
    addConditionalFormattingRule,
    removeConditionalFormattingRule,
    updateConditionalFormattingRule,
  };
}
