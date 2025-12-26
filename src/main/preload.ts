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
  // Excel file operations
  createNewFile: () => ipcRenderer.invoke('excel:create-new-file'),
  openFile: () => ipcRenderer.invoke('excel:open-file'),
  saveFile: (excelFile: unknown) => ipcRenderer.invoke('excel:save-file', excelFile),
  saveFileAs: (excelFile: unknown) => ipcRenderer.invoke('excel:save-file-as', excelFile),
});
