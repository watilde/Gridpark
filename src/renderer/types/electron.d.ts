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
  
  // File operations
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
  
  openFolder: () => Promise<{
    success: boolean;
    files?: ExcelFile[];
    folderName?: string;
    count?: number;
    canceled?: boolean;
    error?: string;
  }>;
  
  // Gridpark file operations
  gridpark: {
    readFile: (payload: { path: string; rootDir: string }) => Promise<{
      success: boolean;
      content?: string;
      error?: string;
    }>;
    
    writeFile: (payload: {
      path: string;
      rootDir: string;
      content: string;
    }) => Promise<{
      success: boolean;
      error?: string;
    }>;
    
    writeBinaryFile: (payload: {
      path: string;
      rootDir: string;
      data: Uint8Array;
    }) => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
