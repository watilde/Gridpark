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
import {
  db,
  StoredCellData,
  CellStyleData,
  ConditionalFormattingRule,
  SheetMetadata,
} from '../../../../lib/db';
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
  const [selectedRange, setSelectedRange] = useState<{
    start: CellPosition;
    end: CellPosition;
  } | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);

  // Flag to prevent recording history during undo/redo
  const isUndoRedoRef = useRef(false);

  // State for cells, metadata, and CF rules (replacing useLiveQuery)
  const [cells, setCells] = useState<Map<string, StoredCellData>>(new Map());
  const [metadata, setMetadata] = useState<SheetMetadata | undefined>(undefined);
  const [conditionalFormattingRules, setConditionalFormattingRules] = useState<
    ConditionalFormattingRule[]
  >([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Tracks whether we're still waiting for the initial bulk-write that happens
  // asynchronously after file open (resetWorkbooks defers DB writes via setTimeout).
  // Kept as a ref so reads/writes don't trigger re-renders.
  const awaitingInitialData = useRef(true);

  // Reset the flag whenever the tab changes so every new tab gets a fresh wait.
  useEffect(() => {
    awaitingInitialData.current = true;
  }, [tabId]);

  // Load data from DB
  useEffect(() => {
    const loadData = async () => {
      console.log('[useSpreadsheet] Loading data for tabId:', tabId);

      // Load cells
      const cellArray = await db.getCellsForSheet(tabId);
      console.log('[useSpreadsheet] Loaded cells:', cellArray.length);

      // Data is already in DB — no need to wait for the async bulk-write.
      if (cellArray.length > 0) {
        awaitingInitialData.current = false;
      }

      const cellMap = new Map<string, StoredCellData>();
      cellArray.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        cellMap.set(key, cell);
      });

      // Populate Formula Engine (Batch)
      formulaEngine.clear();
      const cellUpdates = cellArray.map(cell => ({
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

      // Set cells state after engine is ready
      setCells(cellMap);

      // Load metadata
      const meta = await db.getSheetMetadata(tabId);
      console.log('[useSpreadsheet] Loaded metadata:', meta);
      setMetadata(meta);

      // Load CF rules
      const cfRules = await db.getConditionalFormatting(tabId);
      console.log('[useSpreadsheet] Loaded CF rules:', cfRules.length);
      setConditionalFormattingRules(cfRules);
    };

    loadData();
  }, [tabId, reloadTrigger, formulaEngine]);

  // Trigger reload manually
  const reloadData = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
  }, []);

  // Subscribe to DB cell events so we can detect when the async bulk-write
  // (triggered by resetWorkbooks via setTimeout) completes after a file open.
  // User edits go through updateCell which updates local state directly, so
  // we only trigger a reload while awaitingInitialData is still true.
  useEffect(() => {
    const unsubscribe = db.subscribe(
      () => {
        if (awaitingInitialData.current) {
          awaitingInitialData.current = false;
          reloadData();
        }
      },
      { tabId, type: 'cells' }
    );
    return unsubscribe;
  }, [tabId, reloadData]);

  // Compute all formulas when cells change (READ-ONLY from Engine)
  const computedValues = useMemo(() => {
    if (!cells) return new Map<string, any>();

    // Engine is already updated by loadData or updateCell
    // We just read the computed values

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
      cols: Math.max(26, maxCol + 5), // +5 col buffer
    };
  }, [metadata]);

  // Update a single cell
  const updateCell = useCallback(
    async (row: number, col: number, value: string, style?: CellStyleData) => {
      // Get current cell value for history
      const key = `${row},${col}`;
      const currentCell = cells?.get(key);
      const before = currentCell
        ? {
            value: currentCell.value,
            formula: currentCell.formula,
            type: currentCell.type,
            style: currentCell.style,
          }
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

      // Update DB (Async)
      await db.upsertCell(tabId, row, col, {
        value: rawValue,
        type,
        formula,
        style: finalStyle,
      });

      // Update formula engine (Synchronous & Incremental)
      formulaEngine.setCell(row, col, {
        row,
        col,
        value: rawValue,
        formula,
        type,
      });

      // Mark dirty
      await db.markSheetDirty(tabId, true);

      // Update Local State (Incremental) - Avoid full reload
      const newCell: StoredCellData = {
        id: currentCell?.id, // Keep ID if exists
        tabId,
        row,
        col,
        value: rawValue,
        type,
        formula,
        style: finalStyle,
        updatedAt: new Date(),
        version: (currentCell?.version || 0) + 1,
      };

      setCells(prev => {
        const next = new Map(prev);
        next.set(key, newCell);
        return next;
      });
    },
    [tabId, formulaEngine, cells]
  );

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
          rowData.push(
            cell
              ? {
                  value: cell.value,
                  formula: cell.formula,
                  type: cell.type,
                  style: cell.style,
                }
              : null
          );
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
  const updateRangeStyle = useCallback(
    async (style: CellStyleData) => {
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
    },
    [selectedCell, selectedRange, cells, updateCell]
  );

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
  const addConditionalFormattingRule = useCallback(
    async (rule: ConditionalFormattingRule) => {
      await db.addConditionalFormattingRule(tabId, rule);
      console.log('[CF] Rule added:', rule.id);
      reloadData();
    },
    [tabId, reloadData]
  );

  const removeConditionalFormattingRule = useCallback(
    async (ruleId: string) => {
      await db.removeConditionalFormattingRule(tabId, ruleId);
      console.log('[CF] Rule removed:', ruleId);
      reloadData();
    },
    [tabId, reloadData]
  );

  const updateConditionalFormattingRule = useCallback(
    async (ruleId: string, updates: Partial<ConditionalFormattingRule>) => {
      await db.updateConditionalFormattingRule(tabId, ruleId, updates);
      console.log('[CF] Rule updated:', ruleId);
      reloadData();
    },
    [tabId, reloadData]
  );

  // Insert text (typically a formula) into the currently selected cell
  const insertFormula = useCallback(
    async (text: string) => {
      if (!selectedCell) return false;
      await updateCell(selectedCell.row, selectedCell.col, text);
      return true;
    },
    [selectedCell, updateCell]
  );

  // Force a full formula recompute by rebuilding the engine from current cells
  const recalculate = useCallback(() => {
    formulaEngine.clear();
    const updates = Array.from(cells.values()).map(cell => ({
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
    formulaEngine.batchUpdate(updates);
    reloadData();
  }, [formulaEngine, cells, reloadData]);

  // AutoSum: insert =SUM(<contiguous numeric range above OR to the left>) into selected cell
  const autoSum = useCallback(async () => {
    if (!selectedCell) return false;
    const { row, col } = selectedCell;

    const isNumeric = (r: number, c: number) => {
      const cell = cells.get(`${r},${c}`);
      if (!cell) return false;
      if (cell.type === 'number') return true;
      if (cell.formula) return true;
      const n = Number(cell.value);
      return cell.value !== null && cell.value !== '' && Number.isFinite(n);
    };

    // Prefer scanning above; fall back to scanning left
    let startRow = row;
    while (startRow - 1 >= 0 && isNumeric(startRow - 1, col)) startRow--;

    if (startRow < row) {
      const range = `${columnLetter(col)}${startRow + 1}:${columnLetter(col)}${row}`;
      await updateCell(row, col, `=SUM(${range})`);
      return true;
    }

    let startCol = col;
    while (startCol - 1 >= 0 && isNumeric(row, startCol - 1)) startCol--;

    if (startCol < col) {
      const range = `${columnLetter(startCol)}${row + 1}:${columnLetter(col - 1)}${row + 1}`;
      await updateCell(row, col, `=SUM(${range})`);
      return true;
    }

    // No adjacent numbers: insert empty SUM stub for user to fill
    await updateCell(row, col, '=SUM()');
    return true;
  }, [selectedCell, cells, updateCell]);

  // Sort selected range ascending by its first column. Operates only on values
  // currently in the range; styles and formulas are kept aligned with their row.
  const sortRangeAscending = useCallback(async () => {
    const range = selectedRange;
    if (!range) return false;

    const minRow = Math.min(range.start.row, range.end.row);
    const maxRow = Math.max(range.start.row, range.end.row);
    const minCol = Math.min(range.start.col, range.end.col);
    const maxCol = Math.max(range.start.col, range.end.col);

    if (maxRow === minRow) return false;

    type RowSnapshot = Array<{ value: any; formula?: string; type: any; style?: CellStyleData }>;
    const rows: Array<{ key: any; data: RowSnapshot }> = [];
    for (let r = minRow; r <= maxRow; r++) {
      const data: RowSnapshot = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cell = cells.get(`${r},${c}`);
        data.push({
          value: cell?.value ?? null,
          formula: cell?.formula,
          type: cell?.type ?? 'empty',
          style: cell?.style,
        });
      }
      rows.push({ key: data[0]?.value ?? null, data });
    }

    rows.sort((a, b) => {
      const av = a.key;
      const bv = b.key;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const an = Number(av);
      const bn = Number(bv);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return String(av).localeCompare(String(bv));
    });

    for (let i = 0; i < rows.length; i++) {
      const targetRow = minRow + i;
      const data = rows[i].data;
      for (let j = 0; j < data.length; j++) {
        const targetCol = minCol + j;
        const snap = data[j];
        const value =
          snap.formula ??
          (snap.value === null || snap.value === undefined ? '' : String(snap.value));
        await updateCell(targetRow, targetCol, value, snap.style);
      }
    }
    return true;
  }, [selectedRange, cells, updateCell]);

  // Apply lightweight table styling to the selected range (header row + zebra)
  const applyTableStyle = useCallback(async () => {
    const range =
      selectedRange ?? (selectedCell ? { start: selectedCell, end: selectedCell } : null);
    if (!range) return false;

    const minRow = Math.min(range.start.row, range.end.row);
    const maxRow = Math.max(range.start.row, range.end.row);
    const minCol = Math.min(range.start.col, range.end.col);
    const maxCol = Math.max(range.start.col, range.end.col);

    const border = '1px solid #c0c0c0';
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const isHeader = r === minRow;
        const isZebra = !isHeader && (r - minRow) % 2 === 1;
        const cell = cells.get(`${r},${c}`);
        const merged: CellStyleData = {
          ...(cell?.style ?? {}),
          backgroundColor: isHeader ? '#1f6feb' : isZebra ? '#f5f7fa' : '#ffffff',
          color: isHeader ? '#ffffff' : '#000000',
          fontWeight: isHeader ? 'bold' : 'normal',
          borderTop: border,
          borderRight: border,
          borderBottom: border,
          borderLeft: border,
        };
        const value =
          cell?.formula ??
          (cell?.value === null || cell?.value === undefined ? '' : String(cell.value));
        await updateCell(r, c, value, merged);
      }
    }
    return true;
  }, [selectedRange, selectedCell, cells, updateCell]);

  // Sort range descending (mirror of ascending)
  const sortRangeDescending = useCallback(async () => {
    const range = selectedRange;
    if (!range) return false;
    const minRow = Math.min(range.start.row, range.end.row);
    const maxRow = Math.max(range.start.row, range.end.row);
    const minCol = Math.min(range.start.col, range.end.col);
    const maxCol = Math.max(range.start.col, range.end.col);
    if (maxRow === minRow) return false;

    type RowSnapshot = Array<{ value: any; formula?: string; type: any; style?: CellStyleData }>;
    const rows: Array<{ key: any; data: RowSnapshot }> = [];
    for (let r = minRow; r <= maxRow; r++) {
      const data: RowSnapshot = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cell = cells.get(`${r},${c}`);
        data.push({
          value: cell?.value ?? null,
          formula: cell?.formula,
          type: cell?.type ?? 'empty',
          style: cell?.style,
        });
      }
      rows.push({ key: data[0]?.value ?? null, data });
    }

    rows.sort((a, b) => {
      const av = a.key;
      const bv = b.key;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const an = Number(av);
      const bn = Number(bv);
      if (Number.isFinite(an) && Number.isFinite(bn)) return bn - an;
      return String(bv).localeCompare(String(av));
    });

    for (let i = 0; i < rows.length; i++) {
      const targetRow = minRow + i;
      const data = rows[i].data;
      for (let j = 0; j < data.length; j++) {
        const targetCol = minCol + j;
        const snap = data[j];
        const value =
          snap.formula ??
          (snap.value === null || snap.value === undefined ? '' : String(snap.value));
        await updateCell(targetRow, targetCol, value, snap.style);
      }
    }
    return true;
  }, [selectedRange, cells, updateCell]);

  // Apply named number format to current selection (toggles off if same format)
  const applyNumberFormat = useCallback(
    async (format: string) => {
      const target =
        selectedRange ?? (selectedCell ? { start: selectedCell, end: selectedCell } : null);
      if (!target) return false;
      const minRow = Math.min(target.start.row, target.end.row);
      const maxRow = Math.max(target.start.row, target.end.row);
      const minCol = Math.min(target.start.col, target.end.col);
      const maxCol = Math.max(target.start.col, target.end.col);

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const cell = cells.get(`${r},${c}`);
          const current = cell?.style?.numberFormat;
          const next = current === format ? undefined : format;
          const merged: CellStyleData = { ...(cell?.style ?? {}), numberFormat: next };
          const value =
            cell?.formula ??
            (cell?.value === null || cell?.value === undefined ? '' : String(cell.value));
          await updateCell(r, c, value, merged);
        }
      }
      return true;
    },
    [selectedRange, selectedCell, cells, updateCell]
  );

  // Shift cells by (deltaRow, deltaCol) starting at the given threshold and rebuild storage.
  // For inserts: delta = +1 on cells with row/col >= threshold.
  // For deletes: delta = -1 on cells with row/col > threshold; cells AT threshold are dropped.
  const rebuildAfterShift = useCallback(
    async (predicate: (cell: StoredCellData) => { keep: boolean; row: number; col: number }) => {
      const newCells: Array<{
        row: number;
        col: number;
        data: Partial<StoredCellData>;
      }> = [];
      for (const cell of cells.values()) {
        const result = predicate(cell);
        if (!result.keep) continue;
        newCells.push({
          row: result.row,
          col: result.col,
          data: {
            value: cell.value,
            type: cell.type,
            formula: cell.formula,
            style: cell.style,
          },
        });
      }
      await db.clearSheetCells(tabId);
      if (newCells.length > 0) {
        await db.bulkUpsertCells(tabId, newCells);
      }
      await db.markSheetDirty(tabId, true);
      reloadData();
    },
    [cells, tabId, reloadData]
  );

  const insertRow = useCallback(
    async (rowIndex: number) => {
      formulaEngine.insertRow(rowIndex);
      await rebuildAfterShift(cell => ({
        keep: true,
        row: cell.row >= rowIndex ? cell.row + 1 : cell.row,
        col: cell.col,
      }));
    },
    [formulaEngine, rebuildAfterShift]
  );

  const deleteRow = useCallback(
    async (rowIndex: number) => {
      formulaEngine.removeRow(rowIndex);
      await rebuildAfterShift(cell => {
        if (cell.row === rowIndex) return { keep: false, row: 0, col: 0 };
        return {
          keep: true,
          row: cell.row > rowIndex ? cell.row - 1 : cell.row,
          col: cell.col,
        };
      });
    },
    [formulaEngine, rebuildAfterShift]
  );

  const insertColumn = useCallback(
    async (colIndex: number) => {
      formulaEngine.insertColumn(colIndex);
      await rebuildAfterShift(cell => ({
        keep: true,
        row: cell.row,
        col: cell.col >= colIndex ? cell.col + 1 : cell.col,
      }));
    },
    [formulaEngine, rebuildAfterShift]
  );

  const deleteColumn = useCallback(
    async (colIndex: number) => {
      formulaEngine.removeColumn(colIndex);
      await rebuildAfterShift(cell => {
        if (cell.col === colIndex) return { keep: false, row: 0, col: 0 };
        return {
          keep: true,
          row: cell.row,
          col: cell.col > colIndex ? cell.col - 1 : cell.col,
        };
      });
    },
    [formulaEngine, rebuildAfterShift]
  );

  // ----- Cell merges (round-trip via sheetMetadata.merges A1 strings) -----
  type MergedRange = { startRow: number; startCol: number; endRow: number; endCol: number };

  const merges: MergedRange[] = useMemo(() => {
    const list = metadata?.merges ?? [];
    return list.map(parseA1Range).filter((r): r is MergedRange => r !== null);
  }, [metadata?.merges]);

  const findMergeAt = useCallback(
    (row: number, col: number): MergedRange | undefined =>
      merges.find(
        m => row >= m.startRow && row <= m.endRow && col >= m.startCol && col <= m.endCol
      ),
    [merges]
  );

  const persistMerges = useCallback(
    async (next: MergedRange[]) => {
      const a1 = next.map(rangeToA1);
      await db.setMerges(tabId, a1);
      setMetadata(prev => (prev ? { ...prev, merges: a1 } : prev));
    },
    [tabId]
  );

  const mergeSelectedRange = useCallback(async () => {
    if (!selectedRange) return false;
    const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
    const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
    const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
    const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);
    if (startRow === endRow && startCol === endCol) return false;

    // Drop overlapping merges, then add the new one.
    const next = merges
      .filter(m => {
        const overlaps =
          !(m.endRow < startRow || m.startRow > endRow) &&
          !(m.endCol < startCol || m.startCol > endCol);
        return !overlaps;
      })
      .concat([{ startRow, startCol, endRow, endCol }]);
    await persistMerges(next);
    return true;
  }, [selectedRange, merges, persistMerges]);

  const unmergeAtSelection = useCallback(async () => {
    if (!selectedCell) return false;
    const merge = findMergeAt(selectedCell.row, selectedCell.col);
    if (!merge) return false;
    await persistMerges(merges.filter(m => m !== merge));
    return true;
  }, [selectedCell, findMergeAt, merges, persistMerges]);

  // ----- Column widths / row heights (round-trip via sheetMetadata) -----
  const columnWidths = useMemo(
    () => new Map(Object.entries(metadata?.columnWidths ?? {}).map(([k, v]) => [Number(k), v])),
    [metadata?.columnWidths]
  );
  const rowHeights = useMemo(
    () => new Map(Object.entries(metadata?.rowHeights ?? {}).map(([k, v]) => [Number(k), v])),
    [metadata?.rowHeights]
  );

  const setColumnWidth = useCallback(
    async (col: number, width: number) => {
      await db.setColumnWidth(tabId, col, width);
      setMetadata(prev => {
        if (!prev) return prev;
        const next = { ...(prev.columnWidths ?? {}) };
        next[col] = width;
        return { ...prev, columnWidths: next };
      });
    },
    [tabId]
  );

  const setRowHeight = useCallback(
    async (row: number, height: number) => {
      await db.setRowHeight(tabId, row, height);
      setMetadata(prev => {
        if (!prev) return prev;
        const next = { ...(prev.rowHeights ?? {}) };
        next[row] = height;
        return { ...prev, rowHeights: next };
      });
    },
    [tabId]
  );

  // Find all matches of `query` (case-insensitive) across cell display values,
  // returning positions sorted by row/col (Excel-style scan order).
  const findMatches = useCallback(
    (query: string): CellPosition[] => {
      if (!query || query.trim() === '') return [];
      const q = query.toLowerCase();
      const matches: CellPosition[] = [];
      cells.forEach(cell => {
        const display =
          cell.formula !== undefined && cell.formula !== null
            ? String(cell.formula)
            : cell.value !== null && cell.value !== undefined
              ? String(cell.value)
              : '';
        if (display.toLowerCase().includes(q)) {
          matches.push({ row: cell.row, col: cell.col });
        }
      });
      matches.sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
      return matches;
    },
    [cells]
  );

  // ----- Filter (Excel-like AutoFilter) -----
  // A filter range covers a contiguous block of rows under a header row. Each
  // column inside it can have a Set of excluded values; rows whose value in
  // any active column is excluded get hidden.
  type FilterRange = { startRow: number; endRow: number; startCol: number; endCol: number };
  const [filterRange, setFilterRange] = useState<FilterRange | null>(null);
  const [columnFilters, setColumnFilters] = useState<Map<number, Set<string>>>(new Map());

  // ----- Manual hide (separate from filter) -----
  const [manualHiddenRows, setManualHiddenRows] = useState<Set<number>>(new Set());
  const [manualHiddenCols, setManualHiddenCols] = useState<Set<number>>(new Set());

  const cellDisplayValue = useCallback(
    (row: number, col: number): string => {
      const cell = cells.get(`${row},${col}`);
      if (!cell) return '';
      if (cell.formula) {
        const computed = computedValues.get(`${row},${col}`);
        return computed === null || computed === undefined ? '' : String(computed);
      }
      return cell.value === null || cell.value === undefined ? '' : String(cell.value);
    },
    [cells, computedValues]
  );

  const hiddenRowsByFilter = useMemo(() => {
    const hidden = new Set<number>();
    if (!filterRange || columnFilters.size === 0) return hidden;
    // Header row (filterRange.startRow) is always visible.
    for (let r = filterRange.startRow + 1; r <= filterRange.endRow; r++) {
      for (const [col, excluded] of columnFilters) {
        if (col < filterRange.startCol || col > filterRange.endCol) continue;
        const value = cellDisplayValue(r, col);
        if (excluded.has(value)) {
          hidden.add(r);
          break;
        }
      }
    }
    return hidden;
  }, [filterRange, columnFilters, cellDisplayValue]);

  const hiddenRows = useMemo(() => {
    const s = new Set<number>(manualHiddenRows);
    hiddenRowsByFilter.forEach(r => s.add(r));
    return s;
  }, [manualHiddenRows, hiddenRowsByFilter]);

  const hiddenCols = useMemo(() => new Set<number>(manualHiddenCols), [manualHiddenCols]);

  const enableFilter = useCallback(() => {
    if (selectedRange) {
      setFilterRange({
        startRow: Math.min(selectedRange.start.row, selectedRange.end.row),
        endRow: Math.max(selectedRange.start.row, selectedRange.end.row),
        startCol: Math.min(selectedRange.start.col, selectedRange.end.col),
        endCol: Math.max(selectedRange.start.col, selectedRange.end.col),
      });
      setColumnFilters(new Map());
      return true;
    }
    return false;
  }, [selectedRange]);

  const disableFilter = useCallback(() => {
    setFilterRange(null);
    setColumnFilters(new Map());
  }, []);

  const setColumnFilterExcluded = useCallback((col: number, excluded: Set<string>) => {
    setColumnFilters(prev => {
      const next = new Map(prev);
      if (excluded.size === 0) next.delete(col);
      else next.set(col, excluded);
      return next;
    });
  }, []);

  const getUniqueValuesInColumn = useCallback(
    (col: number): string[] => {
      if (!filterRange) return [];
      const seen = new Set<string>();
      for (let r = filterRange.startRow + 1; r <= filterRange.endRow; r++) {
        seen.add(cellDisplayValue(r, col));
      }
      return Array.from(seen).sort((a, b) => a.localeCompare(b));
    },
    [filterRange, cellDisplayValue]
  );

  const hideRows = useCallback((rows: number[]) => {
    setManualHiddenRows(prev => {
      const next = new Set(prev);
      rows.forEach(r => next.add(r));
      return next;
    });
  }, []);
  const showRows = useCallback((rows: number[]) => {
    setManualHiddenRows(prev => {
      const next = new Set(prev);
      rows.forEach(r => next.delete(r));
      return next;
    });
  }, []);
  const hideColumns = useCallback((cols: number[]) => {
    setManualHiddenCols(prev => {
      const next = new Set(prev);
      cols.forEach(c => next.add(c));
      return next;
    });
  }, []);
  const showColumns = useCallback((cols: number[]) => {
    setManualHiddenCols(prev => {
      const next = new Set(prev);
      cols.forEach(c => next.delete(c));
      return next;
    });
  }, []);

  // Replace `find` with `replacement` in matching cells. If a single cell is
  // given, only that cell is touched; otherwise all matches in the sheet.
  const replaceMatches = useCallback(
    async (find: string, replacement: string, target?: CellPosition) => {
      if (!find) return 0;
      const q = find.toLowerCase();
      let count = 0;
      const cellsToUpdate = target
        ? ([cells.get(`${target.row},${target.col}`)].filter(Boolean) as StoredCellData[])
        : Array.from(cells.values());

      for (const cell of cellsToUpdate) {
        const source =
          cell.formula !== undefined && cell.formula !== null
            ? String(cell.formula)
            : cell.value !== null && cell.value !== undefined
              ? String(cell.value)
              : '';
        if (!source.toLowerCase().includes(q)) continue;
        // Replace all occurrences in the cell, preserving case of replacement
        const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const next = source.replace(re, replacement);
        await updateCell(cell.row, cell.col, next, cell.style);
        count++;
      }
      return count;
    },
    [cells, updateCell]
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

    // Excel-like toolbar actions
    insertFormula,
    recalculate,
    autoSum,
    sortRangeAscending,
    sortRangeDescending,
    applyTableStyle,
    applyNumberFormat,

    // Row/column structural ops
    insertRow,
    deleteRow,
    insertColumn,
    deleteColumn,

    // Find / Replace
    findMatches,
    replaceMatches,

    // Cell merges
    merges,
    findMergeAt,
    mergeSelectedRange,
    unmergeAtSelection,

    // Column / row sizes (db-backed)
    columnWidths,
    rowHeights,
    setColumnWidth,
    setRowHeight,

    // Filter
    filterRange,
    columnFilters,
    enableFilter,
    disableFilter,
    setColumnFilterExcluded,
    getUniqueValuesInColumn,

    // Manual hide / show
    hiddenRows,
    hiddenCols,
    hideRows,
    showRows,
    hideColumns,
    showColumns,
  };
}

function columnLetter(col: number): string {
  let label = '';
  let n = col;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

// "AA" -> 26, "B" -> 1
function columnIndex(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

function rangeToA1(r: {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}): string {
  return `${columnLetter(r.startCol)}${r.startRow + 1}:${columnLetter(r.endCol)}${r.endRow + 1}`;
}

function parseA1Range(
  s: string
): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(s.trim());
  if (!m) return null;
  return {
    startCol: columnIndex(m[1].toUpperCase()),
    startRow: parseInt(m[2], 10) - 1,
    endCol: columnIndex(m[3].toUpperCase()),
    endRow: parseInt(m[4], 10) - 1,
  };
}
