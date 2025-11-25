/**
 * Platform Detection Utilities
 *
 * Provides helpers to detect if the app is running in Electron or Web,
 * and conditionally access platform-specific features.
 */

/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
  // Check multiple indicators for Electron
  const hasProcessElectron = typeof process !== 'undefined' && (process as any).versions?.electron;
  return !!(
    typeof window !== 'undefined' &&
    ((window as any).electron ||
      (window as any).__IS_ELECTRON__ ||
      hasProcessElectron ||
      navigator.userAgent.toLowerCase().indexOf('electron') > -1)
  );
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return !isElectron() || !!(window as any).__IS_WEB__;
};

/**
 * Get platform-specific capabilities
 */
export const getPlatformCapabilities = () => {
  const electron = isElectron();
  const _web = isWeb();

  return {
    // File system access
    canAccessFileSystem: electron || 'showOpenFilePicker' in window,

    // Native menus
    hasNativeMenus: electron,

    // Window management
    canManageWindows: electron,

    // System integration
    hasSystemIntegration: electron,

    // Offline capability
    canWorkOffline: electron || 'serviceWorker' in navigator,

    // Auto-updates
    canAutoUpdate: electron,

    // Native notifications
    hasNativeNotifications: 'Notification' in window,

    // Clipboard access
    canAccessClipboard: 'navigator' in window && 'clipboard' in navigator,

    // Platform type
    platform: electron ? 'electron' : 'web',
  };
};

/**
 * Safely access Electron APIs with fallbacks
 */
export const getElectronAPI = () => {
  if (!isElectron()) {
    return null;
  }

  return (window as any).electron || {};
};

/**
 * Execute platform-specific code
 */
export const whenElectron = <T>(callback: () => T): T | null => {
  return isElectron() ? callback() : null;
};

export const whenWeb = <T>(callback: () => T): T | null => {
  return isWeb() ? callback() : null;
};

/**
 * Get appropriate file operations for current platform
 */
export const getFileOperations = () => {
  const electronAPI = getElectronAPI();

  return {
    async openFile(options?: { extensions?: string[] }) {
      if (isElectron() && electronAPI?.fs) {
        return electronAPI.fs.readFile();
      }

      // Web File System Access API fallback
      if ('showOpenFilePicker' in window) {
        try {
          const [fileHandle] = await (window as any).showOpenFilePicker({
            types: options?.extensions
              ? [
                  {
                    description: 'Files',
                    accept: options.extensions.reduce(
                      (acc, ext) => {
                        acc[`application/${ext}`] = [`.${ext}`];
                        return acc;
                      },
                      {} as Record<string, string[]>
                    ),
                  },
                ]
              : undefined,
          });
          return await fileHandle.getFile();
        } catch (error) {
          console.log('File picker cancelled or failed:', error);
          return null;
        }
      }

      // Legacy file input fallback
      return new Promise<File | null>(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        if (options?.extensions) {
          input.accept = options.extensions.map(ext => `.${ext}`).join(',');
        }
        input.onchange = e => {
          const file = (e.target as HTMLInputElement).files?.[0];
          resolve(file || null);
        };
        input.click();
      });
    },

    async saveFile(content: string, filename?: string) {
      if (isElectron() && electronAPI?.fs) {
        return electronAPI.fs.writeFile(filename || 'untitled.xlsx', content);
      }

      // Web File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename || 'untitled.xlsx',
          });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          return true;
        } catch (error) {
          console.log('Save cancelled or failed:', error);
          return false;
        }
      }

      // Download fallback
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'untitled.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return true;
    },
  };
};
