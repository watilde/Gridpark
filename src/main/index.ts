import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

// Injected by Electron Forge's Vite plugin at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const WINDOW_TITLE_FALLBACK = 'Gridpark';

const createMainWindow = (): void => {
  const window = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
    title: WINDOW_TITLE_FALLBACK,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

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

ipcMain.on('app:set-title', (event, title: string) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) {
    senderWindow.setTitle(title || WINDOW_TITLE_FALLBACK);
  }
});
