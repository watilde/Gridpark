import { contextBridge, ipcRenderer } from 'electron';

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
  // Excel file operations
  createNewFile: () => ipcRenderer.invoke('excel:create-new-file'),
  openFile: () => ipcRenderer.invoke('excel:open-file'),
  openFolder: () => ipcRenderer.invoke('excel:open-folder'),
});
