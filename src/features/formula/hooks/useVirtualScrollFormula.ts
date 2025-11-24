/**
 * useVirtualScrollFormula Hook
 * 
 * Integrates formula calculation with virtual scrolling.
 * Only calculates formulas for visible cells to optimize performance.
 * 
 * Phase 4 Optimization:
 * - Lazy calculation (calculate only when scrolled into view)
 * - Prioritize visible cells
 * - Background calculation for off-screen cells
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useFormulaWorker } from './useFormulaWorker';

interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface CellFormula {
  row: number;
  col: number;
  cellRef: string;
  formula: string;
}

interface UseVirtualScrollFormulaOptions {
  tabId: string;
  visibleRange: VisibleRange;
  formulas: CellFormula[]; // All formulas in the sheet
  onFormulaResult?: (cellRef: string, result: number | string) => void;
  priorityMode?: 'visible-first' | 'all-parallel';
}

export function useVirtualScrollFormula({
  tabId,
  visibleRange,
  formulas,
  onFormulaResult,
  priorityMode = 'visible-first',
}: UseVirtualScrollFormulaOptions) {
  const {
    calculate,
    calculateBatch,
    isReady,
    isSheetLoaded,
    stats,
    cacheStats,
  } = useFormulaWorker(tabId);

  const [visibleResults, setVisibleResults] = useState<Record<string, number | string>>({});
  const [offScreenResults, setOffScreenResults] = useState<Record<string, number | string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatingRef = useRef(false);
  const pendingCalculationsRef = useRef<Set<string>>(new Set());

  /**
   * Check if a cell is within the visible range
   */
  const isInVisibleRange = useCallback((row: number, col: number): boolean => {
    return (
      row >= visibleRange.startRow &&
      row <= visibleRange.endRow &&
      col >= visibleRange.startCol &&
      col <= visibleRange.endCol
    );
  }, [visibleRange]);

  /**
   * Split formulas into visible and off-screen groups
   */
  const splitFormulasByVisibility = useCallback(() => {
    const visible: CellFormula[] = [];
    const offScreen: CellFormula[] = [];

    formulas.forEach(formula => {
      if (isInVisibleRange(formula.row, formula.col)) {
        visible.push(formula);
      } else {
        offScreen.push(formula);
      }
    });

    return { visible, offScreen };
  }, [formulas, isInVisibleRange]);

  /**
   * Calculate formulas with priority for visible cells
   */
  const calculateWithPriority = useCallback(async () => {
    if (!isReady || !isSheetLoaded || calculatingRef.current) {
      return;
    }

    calculatingRef.current = true;
    setIsCalculating(true);

    try {
      const { visible, offScreen } = splitFormulasByVisibility();

      // Filter out already calculated formulas
      const visibleToCalculate = visible.filter(
        f => !visibleResults[f.cellRef] && !pendingCalculationsRef.current.has(f.cellRef)
      );
      const offScreenToCalculate = offScreen.filter(
        f => !offScreenResults[f.cellRef] && !pendingCalculationsRef.current.has(f.cellRef)
      );

      // Mark as pending
      visibleToCalculate.forEach(f => pendingCalculationsRef.current.add(f.cellRef));
      offScreenToCalculate.forEach(f => pendingCalculationsRef.current.add(f.cellRef));

      if (priorityMode === 'visible-first') {
        // Calculate visible cells first (blocking)
        if (visibleToCalculate.length > 0) {
          const visibleBatch = visibleToCalculate.map(f => ({
            cellRef: f.cellRef,
            formula: f.formula,
          }));

          const visibleResults = await calculateBatch(visibleBatch);

          // Store results
          const newVisibleResults: Record<string, number | string> = {};
          visibleResults.forEach(({ cellRef, result }) => {
            newVisibleResults[cellRef] = result;
            pendingCalculationsRef.current.delete(cellRef);
            onFormulaResult?.(cellRef, result);
          });

          setVisibleResults(prev => ({ ...prev, ...newVisibleResults }));
        }

        // Calculate off-screen cells in background (non-blocking)
        if (offScreenToCalculate.length > 0) {
          // Split into smaller batches to avoid blocking
          const batchSize = 20;
          for (let i = 0; i < offScreenToCalculate.length; i += batchSize) {
            const batch = offScreenToCalculate.slice(i, i + batchSize);
            const batchFormulas = batch.map(f => ({
              cellRef: f.cellRef,
              formula: f.formula,
            }));

            // Calculate in background (don't await)
            calculateBatch(batchFormulas).then(results => {
              const newOffScreenResults: Record<string, number | string> = {};
              results.forEach(({ cellRef, result }) => {
                newOffScreenResults[cellRef] = result;
                pendingCalculationsRef.current.delete(cellRef);
                onFormulaResult?.(cellRef, result);
              });

              setOffScreenResults(prev => ({ ...prev, ...newOffScreenResults }));
            });

            // Small delay between batches to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // Calculate all cells in parallel
        const allToCalculate = [...visibleToCalculate, ...offScreenToCalculate];
        if (allToCalculate.length > 0) {
          const allBatch = allToCalculate.map(f => ({
            cellRef: f.cellRef,
            formula: f.formula,
          }));

          const allResults = await calculateBatch(allBatch);

          const newVisibleResults: Record<string, number | string> = {};
          const newOffScreenResults: Record<string, number | string> = {};

          allResults.forEach(({ cellRef, result }) => {
            const formula = allToCalculate.find(f => f.cellRef === cellRef);
            if (formula && isInVisibleRange(formula.row, formula.col)) {
              newVisibleResults[cellRef] = result;
            } else {
              newOffScreenResults[cellRef] = result;
            }
            pendingCalculationsRef.current.delete(cellRef);
            onFormulaResult?.(cellRef, result);
          });

          setVisibleResults(prev => ({ ...prev, ...newVisibleResults }));
          setOffScreenResults(prev => ({ ...prev, ...newOffScreenResults }));
        }
      }
    } catch (error) {
      console.error('[useVirtualScrollFormula] Calculation error:', error);
    } finally {
      calculatingRef.current = false;
      setIsCalculating(false);
    }
  }, [
    isReady,
    isSheetLoaded,
    splitFormulasByVisibility,
    calculateBatch,
    visibleResults,
    offScreenResults,
    priorityMode,
    isInVisibleRange,
    onFormulaResult,
  ]);

  /**
   * Recalculate when visible range or formulas change
   */
  useEffect(() => {
    if (isReady && isSheetLoaded && formulas.length > 0) {
      calculateWithPriority();
    }
  }, [isReady, isSheetLoaded, visibleRange, formulas.length]);

  /**
   * Get result for a specific cell
   */
  const getResult = useCallback((cellRef: string): number | string | undefined => {
    return visibleResults[cellRef] || offScreenResults[cellRef];
  }, [visibleResults, offScreenResults]);

  /**
   * Check if a cell result is available
   */
  const hasResult = useCallback((cellRef: string): boolean => {
    return cellRef in visibleResults || cellRef in offScreenResults;
  }, [visibleResults, offScreenResults]);

  /**
   * Get all results
   */
  const getAllResults = useCallback((): Record<string, number | string> => {
    return { ...offScreenResults, ...visibleResults };
  }, [visibleResults, offScreenResults]);

  return {
    // Results
    getResult,
    hasResult,
    getAllResults,
    visibleResults,
    offScreenResults,

    // Status
    isCalculating,
    isReady,
    isSheetLoaded,

    // Stats
    stats,
    cacheStats,

    // Manual controls
    recalculate: calculateWithPriority,
  };
}

/**
 * Example usage:
 * 
 * const formulas = [
 *   { row: 0, col: 1, cellRef: 'B1', formula: '=SUM(A1:A10)' },
 *   { row: 1, col: 1, cellRef: 'B2', formula: '=AVERAGE(A1:A10)' },
 *   // ... more formulas
 * ];
 * 
 * const { 
 *   getResult, 
 *   hasResult, 
 *   isCalculating,
 *   recalculate 
 * } = useVirtualScrollFormula({
 *   tabId: 'sheet1',
 *   visibleRange: { startRow: 0, endRow: 20, startCol: 0, endCol: 10 },
 *   formulas,
 *   onFormulaResult: (cellRef, result) => {
 *     console.log(`${cellRef} = ${result}`);
 *   },
 *   priorityMode: 'visible-first', // Calculate visible cells first
 * });
 * 
 * // Get result for a cell
 * const b1Result = getResult('B1');
 * 
 * // Check if result is available
 * if (hasResult('B1')) {
 *   console.log('B1 calculated:', getResult('B1'));
 * }
 * 
 * // Manually trigger recalculation
 * recalculate();
 */
