import { app, BrowserWindow, ipcMain, Menu, dialog, nativeImage } from 'electron';
import type { AboutPanelOptionsOptions } from 'electron';
import { join, basename, extname, dirname } from 'path';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { parseExcelFile, serializeExcelFile } from '../renderer/utils/excelUtils';
import { ExcelFile } from '../renderer/types/excel';
import ExcelJS from 'exceljs';
import { themeOptions, DEFAULT_THEME_ID } from '../renderer/theme/theme';

// ============================================================================
// Suppress Chromium Console Logging
// ============================================================================
// This prevents [ERROR:CONSOLE:1] messages from appearing in terminal
// Specifically suppresses DevTools Autofill protocol errors
// NOTE: This must be set BEFORE app.whenReady() or any Chromium initialization

// Completely disable Chromium's internal console logging to stderr
// This is the nuclear option but necessary for DevTools Autofill errors
// which cannot be suppressed any other way
if (!process.env.ELECTRON_ENABLE_LOGGING) {
  process.env.ELECTRON_ENABLE_LOGGING = '0';
}

// Disable hardware acceleration to prevent GPU errors in sandbox environments
app.disableHardwareAcceleration();

// Suppress GPU process error logs
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Suppress DevTools Autofill errors
// These are harmless Chrome DevTools protocol messages that Electron doesn't implement
app.commandLine.appendSwitch('disable-features', 'Autofill');

// Suppress Chromium internal logging (keeps console clean for development)
if (process.env.NODE_ENV === 'development') {
  // Only show errors and fatal messages, hide info/warning noise
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

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
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    center: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
    title: WINDOW_TITLE_FALLBACK,
    icon: ICON_IMAGE ?? ICON_PATH,
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererIndex = join(app.getAppPath(), '.vite', 'renderer', 'index.html');
    window.loadFile(rendererIndex);
  }

  if (process.env.NODE_ENV === 'development') {
    // Open DevTools in detached mode
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
    console.log('[Main] ========================================');
    console.log('[Main] Environment:', {
      platform: process.platform,
      arch: process.arch,
      isWSL: process.env.WSL_DISTRO_NAME || process.platform === 'linux' && require('fs').existsSync('/proc/version') && require('fs').readFileSync('/proc/version', 'utf8').includes('microsoft'),
      nodePath: process.execPath,
    });
    console.log('[Main] Loading file:', filePath);
    console.log('[Main] File path type:', {
      isWindowsPath: /^[A-Za-z]:/.test(filePath),
      isMountedPath: filePath.startsWith('/mnt/'),
      isWSLPath: filePath.startsWith('/home/') || filePath.startsWith('/root/'),
    });
    console.time(`[Main] Load Excel: ${basename(filePath)}`);
    
    const buffer = readFileSync(filePath);
    console.timeLog(`[Main] Load Excel: ${basename(filePath)}`, 'File read complete');
    
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    
    const workbook = await parseExcelFile(arrayBuffer, basename(filePath));
    console.timeLog(`[Main] Load Excel: ${basename(filePath)}`, 'Parse complete');
    
    console.timeEnd(`[Main] Load Excel: ${basename(filePath)}`);
    console.log('[Main] ========================================');
    
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
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => window.webContents.send('menu:save'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => window.webContents.send('menu:save-as'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' as const },
    { role: 'viewMenu' as const },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Center Window',
          click: () => window.center(),
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
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
    console.log('[Main] ===== OPEN FILE DIALOG START =====');
    console.log('[Main] Environment:', {
      platform: process.platform,
      isWSL: process.env.WSL_DISTRO_NAME !== undefined,
      display: process.env.DISPLAY,
      wayland: process.env.WAYLAND_DISPLAY,
    });
    
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      console.error('[Main] No active window');
      return { success: false, error: 'No active window' };
    }

    console.log('[Main] Showing dialog...');
    console.time('[Main] Dialog duration');
    
    // WSL-specific warning
    const isWSL = process.env.WSL_DISTRO_NAME !== undefined || 
                  (process.platform === 'linux' && require('fs').existsSync('/proc/version') && 
                   require('fs').readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft'));
    
    if (isWSL) {
      console.warn('[Main] ⚠️ Running in WSL - File dialog may be slow or unresponsive');
      console.warn('[Main] 💡 Recommendation: Run Gridpark natively on Windows for better performance');
    }
    
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Excel File',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });
    
    console.timeEnd('[Main] Dialog duration');
    console.log('[Main] Dialog result:', { canceled, fileCount: filePaths.length });

    if (canceled || !filePaths.length) {
      console.log('[Main] Dialog canceled or no files selected');
      return { success: false, canceled: true };
    }

    console.log('[Main] Loading files:', filePaths);
    console.time('[Main] Total file loading');
    
    const files = (await Promise.all(filePaths.map(loadExcelFileFromPath)))
      .filter((file): file is ExcelFile => Boolean(file));
    
    console.timeEnd('[Main] Total file loading');
    console.log('[Main] Files loaded:', files.length);

    if (!files.length) {
      console.error('[Main] No valid Excel files found');
      return { success: false, error: 'No valid Excel files found' };
    }

    console.log('[Main] Sending files to renderer...');
    console.time('[Main] Send to renderer');
    
    // Send to renderer
    sendFilesToRenderer(mainWindow, { files });
    
    console.timeEnd('[Main] Send to renderer');
    console.log('[Main] ===== OPEN FILE DIALOG COMPLETE =====');

    return {
      success: true,
      files,
      count: files.length,
    };
  } catch (error) {
    console.error('[Main] Failed to open file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Save Excel File
 * Saves the current workbook data to a file
 */
ipcMain.handle('excel:save-file', async (_event, excelFile: ExcelFile) => {
  try {
    if (!excelFile || !excelFile.path) {
      return { success: false, error: 'Invalid file or no file path provided' };
    }

    console.log(`[Main] === SAVE FILE START ===`, {
      path: excelFile.path,
      sheetCount: excelFile.sheets.length,
    });

    // Log first sheet data for debugging
    if (excelFile.sheets[0]?.data) {
      const firstSheet = excelFile.sheets[0];
      const nonEmptyCells = firstSheet.data.flatMap((row, r) => 
        row.map((cell, c) => ({ r, c, cell }))
      ).filter(({ cell }) => cell && cell.value !== null && cell.value !== '');
      console.log(`[Main] First sheet "${firstSheet.name}" has ${nonEmptyCells.length} non-empty cells`);
      console.log(`[Main] First 5 cells:`, nonEmptyCells.slice(0, 5));
    }

    // Serialize the ExcelFile to ArrayBuffer using ExcelJS
    const buffer = await serializeExcelFile(excelFile);
    
    console.log(`[Main] Serialized to buffer of ${buffer.byteLength} bytes`);
    
    // Write to file system
    writeFileSync(excelFile.path, Buffer.from(buffer));

    console.log(`[Main] === SAVE FILE COMPLETE === ${excelFile.path}`);
    
    return {
      success: true,
      path: excelFile.path,
    };
  } catch (error) {
    console.error('[Main] Failed to save file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Save Excel File As
 * Shows save dialog and saves to a new location
 */
ipcMain.handle('excel:save-file-as', async (_event, excelFile: ExcelFile) => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      return { success: false, error: 'No active window' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Excel File As',
      defaultPath: excelFile.name || 'Untitled.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Serialize the ExcelFile to ArrayBuffer using ExcelJS
    const buffer = await serializeExcelFile(excelFile);
    
    // Write to file system
    writeFileSync(filePath, Buffer.from(buffer));

    console.log(`[Main] Saved file as: ${filePath}`);
    
    return {
      success: true,
      path: filePath,
      name: basename(filePath),
    };
  } catch (error) {
    console.error('Failed to save file as:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
