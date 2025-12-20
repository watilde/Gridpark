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
  // File operations
  createNewFile: () => ipcRenderer.invoke('excel:create-new-file'),
  openFile: () => ipcRenderer.invoke('excel:open-file'),
  openFolder: () => ipcRenderer.invoke('excel:open-folder'),
  gridpark: {
    readFile: (payload: { path: string; rootDir: string }) =>
      ipcRenderer.invoke('gridpark:read-file', payload),
    writeFile: (payload: { path: string; rootDir: string; content: string }) =>
      ipcRenderer.invoke('gridpark:write-file', payload),
    writeBinaryFile: (payload: { path: string; rootDir: string; data: Uint8Array }) =>
      ipcRenderer.invoke('gridpark:write-binary-file', payload),
  },
});
