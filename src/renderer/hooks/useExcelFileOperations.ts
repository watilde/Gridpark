/**
 * React Hook for Excel File Operations
 * 
 * Provides easy access to Electron file operations:
 * - Create new Excel file
 * - Open existing Excel file(s)
 * - Open folder with Excel files
 */

import { useCallback, useState } from 'react';
import type { ExcelFile } from '../types/excel';

export interface UseExcelFileOperationsReturn {
  // Operations
  createNewFile: () => Promise<void>;
  openFile: () => Promise<void>;
  openFolder: () => Promise<void>;
  
  // State
  isProcessing: boolean;
  lastError: string | null;
  lastOperation: 'create' | 'open-file' | 'open-folder' | null;
  
  // Results
  lastCreatedFile: ExcelFile | null;
  lastOpenedFiles: ExcelFile[];
  lastFolderName: string | null;
}

export const useExcelFileOperations = (): UseExcelFileOperationsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<'create' | 'open-file' | 'open-folder' | null>(null);
  const [lastCreatedFile, setLastCreatedFile] = useState<ExcelFile | null>(null);
  const [lastOpenedFiles, setLastOpenedFiles] = useState<ExcelFile[]>([]);
  const [lastFolderName, setLastFolderName] = useState<string | null>(null);

  const createNewFile = useCallback(async () => {
    if (!window.electronAPI?.createNewFile) {
      setLastError('File operations not available in this environment');
      return;
    }

    try {
      setIsProcessing(true);
      setLastError(null);
      setLastOperation('create');

      const result = await window.electronAPI.createNewFile();

      if (result.canceled) {
        setLastError(null);
        return;
      }

      if (!result.success || !result.file) {
        setLastError(result.error || 'Failed to create file');
        return;
      }

      setLastCreatedFile(result.file);
      console.log('New file created:', result.file.path);
    } catch (error) {
      console.error('Create file error:', error);
      setLastError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const openFile = useCallback(async () => {
    if (!window.electronAPI?.openFile) {
      setLastError('File operations not available in this environment');
      return;
    }

    try {
      setIsProcessing(true);
      setLastError(null);
      setLastOperation('open-file');

      const result = await window.electronAPI.openFile();

      if (result.canceled) {
        setLastError(null);
        return;
      }

      if (!result.success || !result.files) {
        setLastError(result.error || 'Failed to open file');
        return;
      }

      setLastOpenedFiles(result.files);
      console.log(`Opened ${result.count} file(s)`);
    } catch (error) {
      console.error('Open file error:', error);
      setLastError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const openFolder = useCallback(async () => {
    if (!window.electronAPI?.openFolder) {
      setLastError('File operations not available in this environment');
      return;
    }

    try {
      setIsProcessing(true);
      setLastError(null);
      setLastOperation('open-folder');

      const result = await window.electronAPI.openFolder();

      if (result.canceled) {
        setLastError(null);
        return;
      }

      if (!result.success || !result.files) {
        setLastError(result.error || 'Failed to open folder');
        return;
      }

      setLastOpenedFiles(result.files);
      setLastFolderName(result.folderName || null);
      console.log(`Opened folder "${result.folderName}" with ${result.count} file(s)`);
    } catch (error) {
      console.error('Open folder error:', error);
      setLastError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    createNewFile,
    openFile,
    openFolder,
    isProcessing,
    lastError,
    lastOperation,
    lastCreatedFile,
    lastOpenedFiles,
    lastFolderName,
  };
};
