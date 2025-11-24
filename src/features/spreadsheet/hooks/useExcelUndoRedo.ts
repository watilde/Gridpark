/**
 * useExcelUndoRedo Hook
 * 
 * Manages undo/redo history for Excel sheet edits.
 * Uses a simple command pattern to track changes.
 * 
 * Each history entry represents a snapshot of changed cells.
 * This is memory-efficient as we only store deltas, not full sheet snapshots.
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CellChange {
  row: number;
  col: number;
  before: any;  // Cell data before change
  after: any;   // Cell data after change
}

export interface HistoryEntry {
  changes: CellChange[];
  timestamp: number;
}

export interface UseExcelUndoRedoReturn {
  // History state
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  pushHistory: (changes: CellChange[]) => void;
  undo: () => CellChange[] | null;
  redo: () => CellChange[] | null;
  clear: () => void;
  
  // Stats
  historySize: number;
  currentIndex: number;
}

const MAX_HISTORY_SIZE = 100; // Maximum number of undo steps

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExcelUndoRedo(): UseExcelUndoRedoReturn {
  // History stack (array of history entries)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Current position in history (-1 = no history, 0 = first entry, etc.)
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Track if we're currently applying undo/redo (to prevent recursive history pushes)
  const isApplyingRef = useRef(false);
  
  // ========================================================================
  // Computed State
  // ========================================================================
  
  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;
  
  // ========================================================================
  // Actions
  // ========================================================================
  
  /**
   * Push new history entry
   * This is called after user makes a change
   */
  const pushHistory = useCallback((changes: CellChange[]) => {
    // Don't push history if we're applying undo/redo
    if (isApplyingRef.current) return;
    
    // Ignore empty changes
    if (changes.length === 0) return;
    
    setHistory(prev => {
      // Remove any history after current index (when undoing then making new changes)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new entry
      newHistory.push({
        changes,
        timestamp: Date.now(),
      });
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, MAX_HISTORY_SIZE - 1);
      return newIndex;
    });
  }, [currentIndex]);
  
  /**
   * Undo last change
   * Returns the changes to apply (inverse of original change)
   */
  const undo = useCallback((): CellChange[] | null => {
    if (!canUndo) return null;
    
    const entry = history[currentIndex];
    if (!entry) return null;
    
    isApplyingRef.current = true;
    
    // Move index back
    setCurrentIndex(prev => prev - 1);
    
    // Return inverse changes (swap before/after)
    const inverseChanges = entry.changes.map(change => ({
      row: change.row,
      col: change.col,
      before: change.after,
      after: change.before,
    }));
    
    // Reset flag after a tick
    setTimeout(() => {
      isApplyingRef.current = false;
    }, 0);
    
    return inverseChanges;
  }, [canUndo, currentIndex, history]);
  
  /**
   * Redo previously undone change
   * Returns the changes to apply (original change)
   */
  const redo = useCallback((): CellChange[] | null => {
    if (!canRedo) return null;
    
    const nextIndex = currentIndex + 1;
    const entry = history[nextIndex];
    if (!entry) return null;
    
    isApplyingRef.current = true;
    
    // Move index forward
    setCurrentIndex(nextIndex);
    
    // Return original changes
    const changes = entry.changes.map(change => ({
      row: change.row,
      col: change.col,
      before: change.before,
      after: change.after,
    }));
    
    // Reset flag after a tick
    setTimeout(() => {
      isApplyingRef.current = false;
    }, 0);
    
    return changes;
  }, [canRedo, currentIndex, history]);
  
  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);
  
  // ========================================================================
  // Return API
  // ========================================================================
  
  return {
    // State
    canUndo,
    canRedo,
    
    // Actions
    pushHistory,
    undo,
    redo,
    clear,
    
    // Stats
    historySize: history.length,
    currentIndex,
  };
}
