import { contextBridge, ipcRenderer } from 'electron';

// Detect WSL without fs — avoid any import that may fail in sandboxed preload context
const isWSL = (() => {
  try {
    return (
      process.env.WSL_DISTRO_NAME !== undefined ||
      process.env.WSL_INTEROP !== undefined ||
      (process.platform === 'linux' &&
        typeof process.env.PATH === 'string' &&
        process.env.PATH.includes('/mnt/c'))
    );
  } catch {
    return false;
  }
})();

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowTitle: (title: string) => ipcRenderer.send('app:set-title', title),
  onFilesOpened: (callback: (payload: { files: unknown; directoryName?: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { files: unknown; directoryName?: string }
    ) => callback(payload);
    ipcRenderer.on('app:files-opened', handler);
    return () => ipcRenderer.removeListener('app:files-opened', handler);
  },
  onThemePresetChange: (callback: (presetId: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, presetId: string) => callback(presetId);
    ipcRenderer.on('settings:theme', handler);
    return () => ipcRenderer.removeListener('settings:theme', handler);
  },
  onMenuSave: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save', handler);
    return () => ipcRenderer.removeListener('menu:save', handler);
  },
  onMenuSaveAs: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save-as', handler);
    return () => ipcRenderer.removeListener('menu:save-as', handler);
  },
  isWSL,
  // Excel file operations
  createNewFile: () => ipcRenderer.invoke('excel:create-new-file'),
  openFile: () => ipcRenderer.invoke('excel:open-file'),
  openFileFromBuffer: (files: Array<{ buffer: ArrayBuffer; name: string; path: string }>) =>
    ipcRenderer.invoke('excel:open-file-from-buffer', files),
  saveFile: (excelFile: unknown) => ipcRenderer.invoke('excel:save-file', excelFile),
  saveFileAs: (excelFile: unknown) => ipcRenderer.invoke('excel:save-file-as', excelFile),
  saveFileAsToPath: (excelFile: unknown, filePath: string) =>
    ipcRenderer.invoke('excel:save-file-as-to-path', { excelFile, filePath }),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
});
