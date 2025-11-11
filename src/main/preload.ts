import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowTitle: (title: string) => ipcRenderer.send('app:set-title', title),
});
