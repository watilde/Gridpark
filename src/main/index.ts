import { app, BrowserWindow } from 'electron';

// These constants are injected by Electron Forge's Webpack plugin at build time.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createMainWindow = (): void => {
  const window = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools({ mode: 'detach' });
  }
};

app.on('ready', createMainWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Add additional listeners and IPC setup here as the app grows.
