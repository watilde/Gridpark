import { useSyncExternalStore, useCallback } from 'react';

/**
 * Electron API state snapshot
 */
interface ElectronAPISnapshot {
  isAvailable: boolean;
  hasGridpark: boolean;
  hasFileSystem: boolean;
  platform: string;
}

// Cache the snapshot to avoid infinite loops
let cachedElectronSnapshot: ElectronAPISnapshot | null = null;

/**
 * Get current Electron API snapshot (cached)
 */
const getElectronSnapshot = (): ElectronAPISnapshot => {
  if (cachedElectronSnapshot) {
    return cachedElectronSnapshot;
  }

  const electronAPI = window.electronAPI;
  cachedElectronSnapshot = {
    isAvailable: Boolean(electronAPI),
    hasGridpark: Boolean(electronAPI?.gridpark),
    hasFileSystem: Boolean(electronAPI?.fs),
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  };

  return cachedElectronSnapshot;
};

/**
 * Subscribe to Electron API changes
 * Since window.electronAPI is relatively static, we just return an empty unsubscribe function
 * In a more dynamic scenario, you would listen to window events
 */
const subscribeToElectron = (callback: () => void): (() => void) => {
  // Listen for potential runtime changes (if any)
  // For now, electronAPI is set once at initialization, so no dynamic subscription needed
  // But we keep the structure for future extensibility

  // Example: if electronAPI could change dynamically
  // window.addEventListener('electron-api-changed', callback);
  // return () => window.removeEventListener('electron-api-changed', callback);

  return () => {
    // No-op unsubscribe for now
  };
};

/**
 * Hook to sync with Electron API state using useSyncExternalStore
 * This ensures React is aware of external Electron API changes
 */
export const useElectronAPI = () => {
  const snapshot = useSyncExternalStore(
    subscribeToElectron,
    getElectronSnapshot,
    getElectronSnapshot // Server snapshot (for SSR, same as client)
  );

  return snapshot;
};

/**
 * Hook to subscribe to Electron file events with useSyncExternalStore
 */
interface FileEventState {
  lastOpenedFiles: string[];
  lastOpenedTime: number;
}

let fileEventState: FileEventState = {
  lastOpenedFiles: [],
  lastOpenedTime: 0,
};

const getFileEventSnapshot = (): FileEventState => fileEventState;

const subscribeToFileEvents = (callback: () => void): (() => void) => {
  const unsubscribe = window.electronAPI?.onFilesOpened?.(({ files }: { files: any[] }) => {
    fileEventState = {
      lastOpenedFiles: files.map(f => f.name),
      lastOpenedTime: Date.now(),
    };
    callback();
  });

  return () => {
    unsubscribe?.();
  };
};

/**
 * Hook to sync with Electron file events
 */
export const useElectronFileEvents = () => {
  const snapshot = useSyncExternalStore(
    subscribeToFileEvents,
    getFileEventSnapshot,
    getFileEventSnapshot
  );

  return snapshot;
};

/**
 * Hook to subscribe to theme preset changes with useSyncExternalStore
 */
interface ThemeEventState {
  currentPreset: string;
  lastChangeTime: number;
}

let themeEventState: ThemeEventState = {
  currentPreset: '',
  lastChangeTime: 0,
};

const getThemeEventSnapshot = (): ThemeEventState => themeEventState;

const subscribeToThemeEvents = (callback: () => void): (() => void) => {
  const unsubscribe = window.electronAPI?.onThemePresetChange?.((preset: string) => {
    themeEventState = {
      currentPreset: preset,
      lastChangeTime: Date.now(),
    };
    callback();
  });

  return () => {
    unsubscribe?.();
  };
};

/**
 * Hook to sync with Electron theme events
 */
export const useElectronThemeEvents = () => {
  const snapshot = useSyncExternalStore(
    subscribeToThemeEvents,
    getThemeEventSnapshot,
    getThemeEventSnapshot
  );

  return snapshot;
};

/**
 * Combined Electron integration hook
 */
export const useElectronIntegration = () => {
  const api = useElectronAPI();
  const fileEvents = useElectronFileEvents();
  const themeEvents = useElectronThemeEvents();

  const getGridparkAPI = useCallback(() => {
    return window.electronAPI?.gridpark;
  }, []);

  const getFileSystemAPI = useCallback(() => {
    return window.electronAPI?.fs;
  }, []);

  const setWindowTitle = useCallback((title: string) => {
    window.electronAPI?.setWindowTitle?.(title);
  }, []);

  return {
    // API availability
    ...api,

    // Event states
    fileEvents,
    themeEvents,

    // Helper functions
    getGridparkAPI,
    getFileSystemAPI,
    setWindowTitle,
  };
};
