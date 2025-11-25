/**
 * useFormulaCalculation Hook
 *
 * Simple formula calculation using IndexedDB
 * Supports basic functions: SUM, AVERAGE, COUNT, MIN, MAX
 *
 * Future: Integrate with HyperFormula for full Excel compatibility
 */

import { useCallback } from 'react';
import { db } from '../../../lib/db';

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * Parse range reference (e.g., "A1:D10" -> {startRow: 0, startCol: 0, endRow: 9, endCol: 3})
 */
function parseRangeReference(ref: string): CellRange {
  const match = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid range reference: ${ref}`);
  }

  const [, startCol, startRow, endCol, endRow] = match;

  return {
    startRow: parseInt(startRow) - 1,
    startCol: columnToIndex(startCol),
    endRow: parseInt(endRow) - 1,
    endCol: columnToIndex(endCol),
  };
}

/**
 * Convert column letter to index (A=0, B=1, ..., Z=25, AA=26)
 */
function columnToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

/**
 * Parse formula (e.g., "=SUM(A1:D10)" -> {function: 'SUM', range: {...}})
 */
function parseFormula(formula: string): { function: string; range: CellRange } | null {
  if (!formula.startsWith('=')) return null;

  const match = formula.match(/^=([A-Z]+)\(([A-Z0-9:]+)\)$/);
  if (!match) return null;

  const [, func, rangeRef] = match;
  const range = parseRangeReference(rangeRef);

  return { function: func, range };
}

/**
 * Hook for formula calculation
 */
export function useFormulaCalculation(tabId: string) {
  /**
   * Get cells in range from IndexedDB
   */
  const getCellsInRange = useCallback(
    async (range: CellRange) => {
      const cells = await db.cells
        .where('[tabId+row]')
        .between([tabId, range.startRow], [tabId, range.endRow])
        .and(cell => cell.col >= range.startCol && cell.col <= range.endCol)
        .toArray();

      return cells;
    },
    [tabId]
  );

  /**
   * Calculate SUM
   */
  const calculateSUM = useCallback(
    async (range: CellRange): Promise<number> => {
      const cells = await getCellsInRange(range);
      return cells.reduce((sum, cell) => {
        const value = Number(cell.value);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    },
    [getCellsInRange]
  );

  /**
   * Calculate AVERAGE
   */
  const calculateAVERAGE = useCallback(
    async (range: CellRange): Promise<number> => {
      const cells = await getCellsInRange(range);
      const numericCells = cells.filter(cell => !isNaN(Number(cell.value)));

      if (numericCells.length === 0) return 0;

      const sum = numericCells.reduce((acc, cell) => acc + Number(cell.value), 0);
      return sum / numericCells.length;
    },
    [getCellsInRange]
  );

  /**
   * Calculate COUNT
   */
  const calculateCOUNT = useCallback(
    async (range: CellRange): Promise<number> => {
      const cells = await getCellsInRange(range);
      return cells.filter(cell => cell.value != null && cell.value !== '').length;
    },
    [getCellsInRange]
  );

  /**
   * Calculate MIN
   */
  const calculateMIN = useCallback(
    async (range: CellRange): Promise<number> => {
      const cells = await getCellsInRange(range);
      const numericValues = cells.map(cell => Number(cell.value)).filter(val => !isNaN(val));

      return numericValues.length > 0 ? Math.min(...numericValues) : 0;
    },
    [getCellsInRange]
  );

  /**
   * Calculate MAX
   */
  const calculateMAX = useCallback(
    async (range: CellRange): Promise<number> => {
      const cells = await getCellsInRange(range);
      const numericValues = cells.map(cell => Number(cell.value)).filter(val => !isNaN(val));

      return numericValues.length > 0 ? Math.max(...numericValues) : 0;
    },
    [getCellsInRange]
  );

  /**
   * Calculate formula
   * Example: "=SUM(A1:D10)" -> 150
   */
  const calculate = useCallback(
    async (formula: string): Promise<number | string> => {
      try {
        const parsed = parseFormula(formula);
        if (!parsed) {
          return '#ERROR!';
        }

        const { function: func, range } = parsed;

        switch (func) {
          case 'SUM':
            return await calculateSUM(range);
          case 'AVERAGE':
          case 'AVG':
            return await calculateAVERAGE(range);
          case 'COUNT':
            return await calculateCOUNT(range);
          case 'MIN':
            return await calculateMIN(range);
          case 'MAX':
            return await calculateMAX(range);
          default:
            return '#NAME?'; // Unknown function
        }
      } catch (error) {
        console.error('[useFormulaCalculation] Error:', error);
        return '#ERROR!';
      }
    },
    [calculateSUM, calculateAVERAGE, calculateCOUNT, calculateMIN, calculateMAX]
  );

  return {
    calculate,
    calculateSUM,
    calculateAVERAGE,
    calculateCOUNT,
    calculateMIN,
    calculateMAX,
  };
}

/**
 * Example usage:
 *
 * const { calculate } = useFormulaCalculation(tabId);
 *
 * // Calculate SUM
 * const sum = await calculate('=SUM(A1:A100)');
 * console.log(sum); // 4500
 *
 * // Calculate AVERAGE
 * const avg = await calculate('=AVERAGE(B1:B10)');
 * console.log(avg); // 75.5
 */
