/**
 * useFormulaWorker Hook
 * 
 * Manages Web Worker for formula calculation.
 * Provides non-blocking calculation API.
 * 
 * Benefits:
 * - UI never freezes (calculations in separate thread)
 * - Can calculate millions of cells without blocking
 * - Automatic worker lifecycle management
 * - Batch calculation support
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface CalculateMessage {
  type: 'CALCULATE';
  id: string;
  tabId: string;
  formula: string;
  cellRef: string;
}

interface BatchCalculateMessage {
  type: 'BATCH_CALCULATE';
  id: string;
  tabId: string;
  formulas: Array<{ cellRef: string; formula: string }>;
}

interface ResultMessage {
  type: 'RESULT';
  id: string;
  cellRef: string;
  result: number | string;
  duration: number;
}

interface BatchResultMessage {
  type: 'BATCH_RESULT';
  id: string;
  results: Array<{ cellRef: string; result: number | string }>;
  duration: number;
}

interface ErrorMessage {
  type: 'ERROR';
  id: string;
  error: string;
}

type WorkerResponse = ResultMessage | BatchResultMessage | ErrorMessage | { type: 'READY' };

interface PendingCalculation {
  resolve: (result: number | string) => void;
  reject: (error: Error) => void;
}

interface PendingBatchCalculation {
  resolve: (results: Array<{ cellRef: string; result: number | string }>) => void;
  reject: (error: Error) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFormulaWorker(tabId: string) {
  const workerRef = useRef<Worker | null>(null);
  const pendingCalculationsRef = useRef<Map<string, PendingCalculation>>(new Map());
  const pendingBatchCalculationsRef = useRef<Map<string, PendingBatchCalculation>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState({
    totalCalculations: 0,
    totalDuration: 0,
    averageDuration: 0,
  });
  
  // ============================================================================
  // Worker Initialization
  // ============================================================================
  
  useEffect(() => {
    console.log('[useFormulaWorker] Initializing worker');
    
    // Create worker
    const worker = new Worker(
      new URL('../../../workers/formula.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current = worker;
    
    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      
      if (message.type === 'READY') {
        console.log('[useFormulaWorker] Worker ready');
        setIsReady(true);
        return;
      }
      
      if (message.type === 'RESULT') {
        const { id, cellRef, result, duration } = message;
        console.log('[useFormulaWorker] Result:', { cellRef, result, duration: `${duration.toFixed(2)}ms` });
        
        const pending = pendingCalculationsRef.current.get(id);
        if (pending) {
          pending.resolve(result);
          pendingCalculationsRef.current.delete(id);
        }
        
        // Update stats
        setStats(prev => ({
          totalCalculations: prev.totalCalculations + 1,
          totalDuration: prev.totalDuration + duration,
          averageDuration: (prev.totalDuration + duration) / (prev.totalCalculations + 1),
        }));
        
      } else if (message.type === 'BATCH_RESULT') {
        const { id, results, duration } = message;
        console.log('[useFormulaWorker] Batch result:', { count: results.length, duration: `${duration.toFixed(2)}ms` });
        
        const pending = pendingBatchCalculationsRef.current.get(id);
        if (pending) {
          pending.resolve(results);
          pendingBatchCalculationsRef.current.delete(id);
        }
        
        // Update stats
        setStats(prev => ({
          totalCalculations: prev.totalCalculations + results.length,
          totalDuration: prev.totalDuration + duration,
          averageDuration: (prev.totalDuration + duration) / (prev.totalCalculations + results.length),
        }));
        
      } else if (message.type === 'ERROR') {
        const { id, error } = message;
        console.error('[useFormulaWorker] Error:', error);
        
        const pending = pendingCalculationsRef.current.get(id);
        if (pending) {
          pending.reject(new Error(error));
          pendingCalculationsRef.current.delete(id);
        }
        
        const pendingBatch = pendingBatchCalculationsRef.current.get(id);
        if (pendingBatch) {
          pendingBatch.reject(new Error(error));
          pendingBatchCalculationsRef.current.delete(id);
        }
      }
    };
    
    worker.onerror = (error) => {
      console.error('[useFormulaWorker] Worker error:', error);
      setIsReady(false);
    };
    
    // Cleanup on unmount
    return () => {
      console.log('[useFormulaWorker] Terminating worker');
      worker.terminate();
      workerRef.current = null;
    };
  }, []);
  
  // ============================================================================
  // Calculate Single Formula
  // ============================================================================
  
  const calculate = useCallback((formula: string, cellRef: string): Promise<number | string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `${cellRef}-${Date.now()}`;
      
      // Store pending calculation
      pendingCalculationsRef.current.set(id, { resolve, reject });
      
      // Send message to worker
      const message: CalculateMessage = {
        type: 'CALCULATE',
        id,
        tabId,
        formula,
        cellRef,
      };
      
      workerRef.current.postMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingCalculationsRef.current.has(id)) {
          pendingCalculationsRef.current.delete(id);
          reject(new Error('Calculation timeout'));
        }
      }, 30000);
    });
  }, [tabId, isReady]);
  
  // ============================================================================
  // Calculate Multiple Formulas (Batch)
  // ============================================================================
  
  const calculateBatch = useCallback(
    (formulas: Array<{ cellRef: string; formula: string }>): Promise<Array<{ cellRef: string; result: number | string }>> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isReady) {
          reject(new Error('Worker not ready'));
          return;
        }
        
        const id = `batch-${Date.now()}`;
        
        // Store pending calculation
        pendingBatchCalculationsRef.current.set(id, { resolve, reject });
        
        // Send message to worker
        const message: BatchCalculateMessage = {
          type: 'BATCH_CALCULATE',
          id,
          tabId,
          formulas,
        };
        
        workerRef.current.postMessage(message);
        
        // Timeout after 60 seconds for batch
        setTimeout(() => {
          if (pendingBatchCalculationsRef.current.has(id)) {
            pendingBatchCalculationsRef.current.delete(id);
            reject(new Error('Batch calculation timeout'));
          }
        }, 60000);
      });
    },
    [tabId, isReady]
  );
  
  // ============================================================================
  // Return API
  // ============================================================================
  
  return {
    calculate,
    calculateBatch,
    isReady,
    stats,
  };
}

/**
 * Example usage:
 * 
 * const { calculate, calculateBatch, isReady, stats } = useFormulaWorker(tabId);
 * 
 * // Single calculation
 * const sum = await calculate('=SUM(A1:A100)', 'B1');
 * console.log(sum); // 4500
 * 
 * // Batch calculation (multiple formulas at once)
 * const results = await calculateBatch([
 *   { cellRef: 'B1', formula: '=SUM(A1:A100)' },
 *   { cellRef: 'B2', formula: '=AVERAGE(A1:A100)' },
 *   { cellRef: 'B3', formula: '=MAX(A1:A100)' },
 * ]);
 * console.log(results); // [{ cellRef: 'B1', result: 4500 }, ...]
 * 
 * // Check worker status
 * console.log('Worker ready:', isReady);
 * console.log('Average calculation time:', stats.averageDuration, 'ms');
 */
