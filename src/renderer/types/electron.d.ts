/**
 * Type definitions for Electron API exposed to renderer
 */

import type { ExcelFile } from './excel';

export interface ElectronAPI {
  // Window management
  setWindowTitle: (title: string) => void;

  // File events
  onFilesOpened: (
    callback: (payload: { files: ExcelFile[]; directoryName?: string }) => void
  ) => () => void;

  // Theme events
  onThemePresetChange: (callback: (presetId: string) => void) => () => void;

  // Menu events
  onMenuSave: (callback: () => void) => () => void;
  onMenuSaveAs: (callback: () => void) => () => void;

  // Platform info
  isWSL: boolean;

  // Excel file operations
  createNewFile: () => Promise<{
    success: boolean;
    file?: ExcelFile;
    canceled?: boolean;
    error?: string;
  }>;

  openFile: () => Promise<{
    success: boolean;
    files?: ExcelFile[];
    count?: number;
    canceled?: boolean;
    error?: string;
  }>;

  openFileFromBuffer: (
    files: Array<{ buffer: ArrayBuffer; name: string; path: string }>
  ) => Promise<{
    success: boolean;
    files?: ExcelFile[];
    count?: number;
    error?: string;
  }>;

  saveFile: (excelFile: ExcelFile) => Promise<{
    success: boolean;
    canceled?: boolean;
    error?: string;
  }>;

  saveFileAs: (excelFile: ExcelFile) => Promise<{
    success: boolean;
    file?: ExcelFile;
    path?: string;
    name?: string;
    canceled?: boolean;
    error?: string;
  }>;

  saveFileAsToPath: (
    excelFile: ExcelFile,
    filePath: string
  ) => Promise<{
    success: boolean;
    file?: ExcelFile;
    path?: string;
    name?: string;
    error?: string;
  }>;

  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
