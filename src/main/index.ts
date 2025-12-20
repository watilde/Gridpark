import { app, BrowserWindow, ipcMain, Menu, dialog, nativeImage } from 'electron';
import type { AboutPanelOptionsOptions } from 'electron';
import { join, basename, extname, dirname } from 'path';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { parseExcelFile, serializeExcelFile } from '../renderer/utils/excelUtils';
import { ExcelFile } from '../renderer/types/excel';
import { themeOptions, DEFAULT_THEME_ID } from '../renderer/theme/theme';

// Injected by Electron Forge's Vite plugin at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const _MAIN_WINDOW_VITE_NAME: string;

if (process.platform === 'win32') {
  try {
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
  } catch (e) {
    console.warn('Squirrel startup skipped on macOS/Linux');
  }
}

app.setName('Gridpark');

const WINDOW_TITLE_FALLBACK = 'Gridpark';

const resolveAssetPath = (...paths: string[]) => {
  if (app.isPackaged) {
    return join(process.resourcesPath, ...paths);
  }
  return join(__dirname, '../../', ...paths);
};
const getIconFileNames = () => {
  if (process.platform === 'darwin') {
    return ['assets/icon.icns', 'assets/icon.png'];
  }
  if (process.platform === 'win32') {
    return ['assets/icon.ico', 'assets/icon.png'];
  }
  return ['assets/icon.png'];
};

const resolveIconAsset = () => {
  const resolvedFiles = getIconFileNames().map(_file => resolveAssetPath(_file));

  for (const iconPath of resolvedFiles) {
    if (!existsSync(iconPath)) continue;
    try {
      const image = nativeImage.createFromPath(iconPath);
      if (!image.isEmpty()) {
        return { iconImage: image, iconPath };
      }
    } catch (error) {
      console.warn(`Failed to load icon at ${iconPath}`, error);
    }
  }

  if (resolvedFiles.length > 0) {
    const fallbackPath = resolvedFiles[resolvedFiles.length - 1];
    console.warn('No platform icon could be loaded; falling back to last candidate.');
    return { iconImage: undefined, iconPath: fallbackPath };
  }

  return { iconImage: undefined, iconPath: undefined };
};

const { iconImage: ICON_IMAGE, iconPath: ICON_PATH } = resolveIconAsset();

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
    icon: ICON_IMAGE ?? ICON_PATH,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererIndex = join(app.getAppPath(), '.vite', 'renderer', 'index.html');
    window.loadFile(rendererIndex);
  }

  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools({ mode: 'detach' });
  }
  setupMenu(window);
};

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock && (ICON_IMAGE || ICON_PATH)) {
    app.dock.setIcon(ICON_IMAGE ?? ICON_PATH);
  }
  const aboutPanelOptions: AboutPanelOptionsOptions = {
    applicationName: app.getName(),
    applicationVersion: app.getVersion(),
  };

  if (ICON_PATH) {
    aboutPanelOptions.iconPath = ICON_PATH;
  }

  app.setAboutPanelOptions(aboutPanelOptions);
  createMainWindow();
});

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

const loadExcelFileFromPath = async (filePath: string): Promise<ExcelFile | null> => {
  try {
    const buffer = readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const workbook = await parseExcelFile(arrayBuffer, basename(filePath));
    return { ...workbook, path: filePath };
  } catch (error) {
    console.error('Failed to load Excel file:', filePath, error);
    return null;
  }
};

const sendFilesToRenderer = (
  window: BrowserWindow,
  payload: { files: ExcelFile[]; directoryName?: string }
) => {
  if (!payload.files.length) return;
  window.webContents.send('app:files-opened', payload);
};

const handleOpenFiles = async (window: BrowserWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });
  if (canceled || !filePaths.length) return;
  const files = (await Promise.all(filePaths.map(loadExcelFileFromPath)))
    .filter((_file): file is ExcelFile => Boolean(_file));
  sendFilesToRenderer(window, { files, directoryName: undefined });
};

const handleOpenFolder = async (window: BrowserWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ['openDirectory'],
  });
  if (canceled || !filePaths.length) return;
  const folderPath = filePaths[0];
  const excelPaths = readdirSync(folderPath)
    .map(entry => join(folderPath, entry))
    .filter(fullPath => {
      try {
        const stats = statSync(fullPath);
        return stats.isFile() && ['.xlsx', '.xls'].includes(extname(fullPath).toLowerCase());
      } catch {
        return false;
      }
    });
  const files = (await Promise.all(excelPaths.map(loadExcelFileFromPath)))
    .filter((_file): file is ExcelFile => Boolean(_file));
  sendFilesToRenderer(window, { files, directoryName: basename(folderPath) });
};

const setupMenu = (window: BrowserWindow) => {
  const isMac = process.platform === 'darwin';
  const themeSubmenu: Electron.MenuItemConstructorOptions[] = themeOptions.map(option => ({
    label: option.name,
    type: 'radio',
    checked: option.id === DEFAULT_THEME_ID,
    click: () => window.webContents.send('settings:theme', option.id),
  }));
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'Gridpark',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Settings',
                submenu: [
                  {
                    label: 'Themes',
                    submenu: themeSubmenu,
                  },
                ],
              },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenFiles(window),
        },
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => handleOpenFolder(window),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' as const },
    { role: 'viewMenu' as const },
    { role: 'windowMenu' as const },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// ============================================================================
// New File Operations (ExcelJS Integration)
// ============================================================================

/**
 * Create New Excel File
 * Shows save dialog and creates an empty workbook with one sheet
 */
ipcMain.handle('excel:create-new-file', async () => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      return { success: false, error: 'No active window' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Create New Excel File',
      defaultPath: 'Untitled.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Create a new workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gridpark';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add a default sheet
    const worksheet = workbook.addWorksheet('Sheet1');

    // Write the file
    await workbook.xlsx.writeFile(filePath);

    // Load the created file and return it
    const createdFile = await loadExcelFileFromPath(filePath);
    if (!createdFile) {
      return { success: false, error: 'Failed to load created file' };
    }

    // Send to renderer
    sendFilesToRenderer(mainWindow, { files: [createdFile] });

    return {
      success: true,
      file: createdFile,
    };
  } catch (error) {
    console.error('Failed to create new file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Open Excel File(s)
 * Shows open dialog and loads selected files
 */
ipcMain.handle('excel:open-file', async () => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      return { success: false, error: 'No active window' };
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Excel File',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });

    if (canceled || !filePaths.length) {
      return { success: false, canceled: true };
    }

    const files = (await Promise.all(filePaths.map(loadExcelFileFromPath)))
      .filter((file): file is ExcelFile => Boolean(file));

    if (!files.length) {
      return { success: false, error: 'No valid Excel files found' };
    }

    // Send to renderer
    sendFilesToRenderer(mainWindow, { files });

    return {
      success: true,
      files,
      count: files.length,
    };
  } catch (error) {
    console.error('Failed to open file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Open Folder
 * Shows folder dialog and loads all Excel files in the folder
 */
ipcMain.handle('excel:open-folder', async () => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      return { success: false, error: 'No active window' };
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Folder',
      properties: ['openDirectory'],
    });

    if (canceled || !filePaths.length) {
      return { success: false, canceled: true };
    }

    const folderPath = filePaths[0];
    const folderName = basename(folderPath);

    // Find all Excel files in the folder (non-recursive)
    const excelPaths = readdirSync(folderPath)
      .map(entry => join(folderPath, entry))
      .filter(fullPath => {
        try {
          const stats = statSync(fullPath);
          return stats.isFile() && ['.xlsx', '.xls'].includes(extname(fullPath).toLowerCase());
        } catch {
          return false;
        }
      });

    if (!excelPaths.length) {
      return {
        success: false,
        error: 'No Excel files found in the selected folder',
      };
    }

    const files = (await Promise.all(excelPaths.map(loadExcelFileFromPath)))
      .filter((file): file is ExcelFile => Boolean(file));

    if (!files.length) {
      return { success: false, error: 'Failed to load Excel files' };
    }

    // Send to renderer
    sendFilesToRenderer(mainWindow, { files, directoryName: folderName });

    return {
      success: true,
      files,
      folderName,
      count: files.length,
    };
  } catch (error) {
    console.error('Failed to open folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
