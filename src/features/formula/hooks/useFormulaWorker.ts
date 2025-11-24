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

interface LoadSheetMessage {
  type: 'LOAD_SHEET';
  id: string;
  tabId: string;
}

interface LoadSheetResponseMessage {
  type: 'SHEET_LOADED';
  id: string;
  tabId: string;
  sheetId: number;
}

interface GetDependenciesMessage {
  type: 'GET_DEPENDENCIES';
  id: string;
  tabId: string;
  cellRef: string;
}

interface DependenciesResponseMessage {
  type: 'DEPENDENCIES';
  id: string;
  cellRef: string;
  dependencies: string[];
  dependents: string[];
}

interface InvalidateCacheMessage {
  type: 'INVALIDATE_CACHE';
  id: string;
  tabId: string;
  row: number;
  col: number;
}

interface CheckCircularRefsMessage {
  type: 'CHECK_CIRCULAR_REFS';
  id: string;
  tabId: string;
}

interface CircularRefsResponseMessage {
  type: 'CIRCULAR_REFS';
  id: string;
  hasCircularRefs: boolean;
  circularCells: string[];
}

interface CacheStatsMessage {
  type: 'GET_CACHE_STATS';
  id: string;
}

interface CacheStatsResponseMessage {
  type: 'CACHE_STATS';
  id: string;
  stats: {
    cacheSize: number;
    dirtyCellsCount: number;
    hitRate: number;
  };
}

type WorkerResponse = 
  | ResultMessage 
  | BatchResultMessage 
  | ErrorMessage 
  | LoadSheetResponseMessage
  | DependenciesResponseMessage
  | CircularRefsResponseMessage
  | CacheStatsResponseMessage
  | { type: 'READY' }
  | { type: 'CACHE_INVALIDATED'; id: string };

interface PendingCalculation {
  resolve: (result: number | string) => void;
  reject: (error: Error) => void;
}

interface PendingBatchCalculation {
  resolve: (results: Array<{ cellRef: string; result: number | string }>) => void;
  reject: (error: Error) => void;
}

interface PendingSheetLoad {
  resolve: (sheetId: number) => void;
  reject: (error: Error) => void;
}

interface PendingDependencyRequest {
  resolve: (data: { dependencies: string[]; dependents: string[] }) => void;
  reject: (error: Error) => void;
}

interface PendingCircularRefCheck {
  resolve: (data: { hasCircularRefs: boolean; circularCells: string[] }) => void;
  reject: (error: Error) => void;
}

interface PendingCacheStatsRequest {
  resolve: (stats: { cacheSize: number; dirtyCellsCount: number; hitRate: number }) => void;
  reject: (error: Error) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFormulaWorker(tabId: string) {
  const workerRef = useRef<Worker | null>(null);
  const pendingCalculationsRef = useRef<Map<string, PendingCalculation>>(new Map());
  const pendingBatchCalculationsRef = useRef<Map<string, PendingBatchCalculation>>(new Map());
  const pendingSheetLoadsRef = useRef<Map<string, PendingSheetLoad>>(new Map());
  const pendingDependencyRequestsRef = useRef<Map<string, PendingDependencyRequest>>(new Map());
  const pendingCircularRefChecksRef = useRef<Map<string, PendingCircularRefCheck>>(new Map());
  const pendingCacheStatsRef = useRef<Map<string, PendingCacheStatsRequest>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [isSheetLoaded, setIsSheetLoaded] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    cacheSize: 0,
    dirtyCellsCount: 0,
    hitRate: 0,
  });
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
        
      } else if (message.type === 'SHEET_LOADED') {
        const { id, tabId: loadedTabId, sheetId } = message;
        console.log('[useFormulaWorker] Sheet loaded:', { tabId: loadedTabId, sheetId });
        
        const pending = pendingSheetLoadsRef.current.get(id);
        if (pending) {
          pending.resolve(sheetId);
          pendingSheetLoadsRef.current.delete(id);
        }
        
        setIsSheetLoaded(true);
        
      } else if (message.type === 'DEPENDENCIES') {
        const { id, cellRef, dependencies, dependents } = message;
        console.log('[useFormulaWorker] Dependencies:', { cellRef, dependencies, dependents });
        
        const pending = pendingDependencyRequestsRef.current.get(id);
        if (pending) {
          pending.resolve({ dependencies, dependents });
          pendingDependencyRequestsRef.current.delete(id);
        }
        
      } else if (message.type === 'CIRCULAR_REFS') {
        const { id, hasCircularRefs, circularCells } = message;
        console.log('[useFormulaWorker] Circular references:', { hasCircularRefs, circularCells });
        
        const pending = pendingCircularRefChecksRef.current.get(id);
        if (pending) {
          pending.resolve({ hasCircularRefs, circularCells });
          pendingCircularRefChecksRef.current.delete(id);
        }
        
      } else if (message.type === 'CACHE_STATS') {
        const { id, stats: workerStats } = message;
        console.log('[useFormulaWorker] Cache stats:', workerStats);
        
        const pending = pendingCacheStatsRef.current.get(id);
        if (pending) {
          pending.resolve(workerStats);
          pendingCacheStatsRef.current.delete(id);
        }
        
        // Update local cache stats
        setCacheStats(workerStats);
        
      } else if (message.type === 'CACHE_INVALIDATED') {
        console.log('[useFormulaWorker] Cache invalidated');
        // No action needed, just logging
        
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
        
        const pendingLoad = pendingSheetLoadsRef.current.get(id);
        if (pendingLoad) {
          pendingLoad.reject(new Error(error));
          pendingSheetLoadsRef.current.delete(id);
        }
        
        const pendingDep = pendingDependencyRequestsRef.current.get(id);
        if (pendingDep) {
          pendingDep.reject(new Error(error));
          pendingDependencyRequestsRef.current.delete(id);
        }
        
        const pendingCircular = pendingCircularRefChecksRef.current.get(id);
        if (pendingCircular) {
          pendingCircular.reject(new Error(error));
          pendingCircularRefChecksRef.current.delete(id);
        }
        
        const pendingCacheStats = pendingCacheStatsRef.current.get(id);
        if (pendingCacheStats) {
          pendingCacheStats.reject(new Error(error));
          pendingCacheStatsRef.current.delete(id);
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
  // Load Sheet into HyperFormula (Phase 3)
  // ============================================================================
  
  const loadSheet = useCallback((): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `load-${tabId}-${Date.now()}`;
      
      // Store pending request
      pendingSheetLoadsRef.current.set(id, { resolve, reject });
      
      // Send message to worker
      const message: LoadSheetMessage = {
        type: 'LOAD_SHEET',
        id,
        tabId,
      };
      
      workerRef.current.postMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingSheetLoadsRef.current.has(id)) {
          pendingSheetLoadsRef.current.delete(id);
          reject(new Error('Sheet load timeout'));
        }
      }, 30000);
    });
  }, [tabId, isReady]);
  
  // ============================================================================
  // Get Cell Dependencies (Phase 3)
  // ============================================================================
  
  const getDependencies = useCallback((cellRef: string): Promise<{ dependencies: string[]; dependents: string[] }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `deps-${cellRef}-${Date.now()}`;
      
      // Store pending request
      pendingDependencyRequestsRef.current.set(id, { resolve, reject });
      
      // Send message to worker
      const message: GetDependenciesMessage = {
        type: 'GET_DEPENDENCIES',
        id,
        tabId,
        cellRef,
      };
      
      workerRef.current.postMessage(message);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingDependencyRequestsRef.current.has(id)) {
          pendingDependencyRequestsRef.current.delete(id);
          reject(new Error('Dependency request timeout'));
        }
      }, 10000);
    });
  }, [tabId, isReady]);
  
  // ============================================================================
  // Phase 4: Cache Management & Optimization
  // ============================================================================
  
  const invalidateCache = useCallback((row: number, col: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `invalidate-${row}-${col}-${Date.now()}`;
      
      // Send message to worker
      const message: InvalidateCacheMessage = {
        type: 'INVALIDATE_CACHE',
        id,
        tabId,
        row,
        col,
      };
      
      workerRef.current.postMessage(message);
      
      // Resolve immediately (fire and forget)
      setTimeout(() => resolve(), 100);
    });
  }, [tabId, isReady]);
  
  const checkCircularReferences = useCallback((): Promise<{ hasCircularRefs: boolean; circularCells: string[] }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `circular-${Date.now()}`;
      
      // Store pending request
      pendingCircularRefChecksRef.current.set(id, { resolve, reject });
      
      // Send message to worker
      const message: CheckCircularRefsMessage = {
        type: 'CHECK_CIRCULAR_REFS',
        id,
        tabId,
      };
      
      workerRef.current.postMessage(message);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingCircularRefChecksRef.current.has(id)) {
          pendingCircularRefChecksRef.current.delete(id);
          reject(new Error('Circular reference check timeout'));
        }
      }, 10000);
    });
  }, [tabId, isReady]);
  
  const getCacheStats = useCallback((): Promise<{ cacheSize: number; dirtyCellsCount: number; hitRate: number }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }
      
      const id = `cache-stats-${Date.now()}`;
      
      // Store pending request
      pendingCacheStatsRef.current.set(id, { resolve, reject });
      
      // Send message to worker
      const message: CacheStatsMessage = {
        type: 'GET_CACHE_STATS',
        id,
      };
      
      workerRef.current.postMessage(message);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (pendingCacheStatsRef.current.has(id)) {
          pendingCacheStatsRef.current.delete(id);
          reject(new Error('Cache stats request timeout'));
        }
      }, 5000);
    });
  }, [isReady]);
  
  // ============================================================================
  // Return API
  // ============================================================================
  
  return {
    // Core calculation API (Phase 2)
    calculate,
    calculateBatch,
    
    // Advanced features (Phase 3)
    loadSheet,
    getDependencies,
    
    // Optimization features (Phase 4)
    invalidateCache,
    checkCircularReferences,
    getCacheStats,
    
    // Status
    isReady,
    isSheetLoaded,
    cacheStats,
    stats,
  };
}

/**
 * Example usage (Phase 4 - With Caching & Optimization):
 * 
 * const { 
 *   calculate, 
 *   calculateBatch, 
 *   loadSheet, 
 *   getDependencies,
 *   invalidateCache,
 *   checkCircularReferences,
 *   getCacheStats,
 *   isReady, 
 *   cacheStats,
 *   stats 
 * } = useFormulaWorker(tabId);
 * 
 * // Load sheet into HyperFormula (optional - auto-loads on first calculation)
 * await loadSheet();
 * 
 * // Single calculation - Now supports 400+ Excel functions with caching!
 * const sum = await calculate('=SUM(A1:A100)', 'B1');
 * const vlookup = await calculate('=VLOOKUP(A1, B1:D10, 3, FALSE)', 'E1');
 * const ifResult = await calculate('=IF(A1>10, "High", "Low")', 'F1');
 * const sumif = await calculate('=SUMIF(A1:A10, ">5", B1:B10)', 'G1');
 * 
 * // Batch calculation (multiple formulas at once)
 * const results = await calculateBatch([
 *   { cellRef: 'B1', formula: '=SUM(A1:A100)' },
 *   { cellRef: 'B2', formula: '=AVERAGE(A1:A100)' },
 *   { cellRef: 'B3', formula: '=VLOOKUP(A1, C1:E10, 2, FALSE)' },
 *   { cellRef: 'B4', formula: '=IF(A1>10, "High", "Low")' },
 * ]);
 * console.log(results); // [{ cellRef: 'B1', result: 4500 }, ...]
 * 
 * // Get dependencies for a cell (what it depends on and what depends on it)
 * const { dependencies, dependents } = await getDependencies('B1');
 * console.log('B1 depends on:', dependencies); // ['A1', 'A2', ..., 'A100']
 * console.log('Cells that depend on B1:', dependents); // ['C1', 'D5', ...]
 * 
 * // Phase 4: Cache management
 * // When a cell changes, invalidate its cache (automatic dependency invalidation)
 * await invalidateCache(0, 0); // Invalidate A1
 * 
 * // Check for circular references
 * const { hasCircularRefs, circularCells } = await checkCircularReferences();
 * if (hasCircularRefs) {
 *   console.warn('Circular references detected:', circularCells);
 * }
 * 
 * // Get cache statistics
 * const stats = await getCacheStats();
 * console.log('Cache size:', stats.cacheSize);
 * console.log('Dirty cells:', stats.dirtyCellsCount);
 * console.log('Cache hit rate:', stats.hitRate, '%');
 * 
 * // Check worker status
 * console.log('Worker ready:', isReady);
 * console.log('Sheet loaded:', isSheetLoaded);
 * console.log('Average calculation time:', stats.averageDuration, 'ms');
 */
