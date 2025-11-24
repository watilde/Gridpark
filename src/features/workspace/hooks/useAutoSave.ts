/**
 * useAutoSave Hook
 * 
 * Manages auto-save functionality:
 * - Auto-save toggle state (via Redux)
 * - Debounced save timer
 * - Automatic save when dirty files exist
 * 
 * This hook encapsulates ALL auto-save logic.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../stores';
import {
  setAutoSaveEnabled,
  selectAutoSaveEnabled,
  selectAutoSaveInterval,
} from '../../../stores/spreadsheetSlice';

export interface UseAutoSaveParams {
  dirtyCount: number;
  onSaveAll: () => Promise<void>;
}

export interface UseAutoSaveReturn {
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  toggleAutoSave: (enabled: boolean) => void;
}

export function useAutoSave(params: UseAutoSaveParams): UseAutoSaveReturn {
  const { dirtyCount, onSaveAll } = params;
  
  const dispatch = useAppDispatch();
  const autoSaveEnabled = useAppSelector(selectAutoSaveEnabled);
  const autoSaveInterval = useAppSelector(selectAutoSaveInterval);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================
  // Toggle Auto-Save
  // ============================================
  
  const toggleAutoSave = useCallback((enabled: boolean) => {
    console.log('[AutoSave] toggled:', enabled);
    dispatch(setAutoSaveEnabled(enabled));
    
    // Clear any pending auto-save timer when toggling off
    if (!enabled && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [dispatch]);
  
  // ============================================
  // Auto-Save Logic (Debounced)
  // ============================================
  
  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    const hasDirtyChanges = dirtyCount > 0;
    
    if (!hasDirtyChanges) {
      // No changes to save, clear any pending timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    console.log(`[AutoSave] scheduling save in ${autoSaveInterval}ms`);
    autoSaveTimerRef.current = setTimeout(async () => {
      console.log('[AutoSave] executing saveAll');
      try {
        await onSaveAll();
        console.log('[AutoSave] completed successfully');
      } catch (error) {
        console.error('[AutoSave] failed', error);
      }
      autoSaveTimerRef.current = null;
    }, autoSaveInterval);

    // Cleanup on unmount or dependency change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autoSaveEnabled, dirtyCount, onSaveAll, autoSaveInterval]);
  
  // ============================================
  // Return API
  // ============================================
  
  return {
    autoSaveEnabled,
    autoSaveInterval,
    toggleAutoSave,
  };
}
