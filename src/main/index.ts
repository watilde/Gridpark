import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  nativeImage,
} from "electron";
import type { AboutPanelOptionsOptions } from "electron";
import {
  join,
  basename,
  extname,
  dirname,
  normalize,
  relative,
  isAbsolute,
} from "path";
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { parseExcelFile } from "../renderer/utils/excelUtils";
import {
  ExcelFile,
  GridparkManifest,
  GridparkPackage,
  GridparkCodeFile,
  GridparkCodeLanguage,
} from "../renderer/types/excel";
import { themeOptions, DEFAULT_THEME_ID } from "../renderer/theme/theme";

// Injected by Electron Forge's Vite plugin at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

if (process.platform === 'win32') {
  try {
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
  } catch (e) {
    console.warn('Squirrel startup skipped on macOS/Linux');
  }
}

app.setName("Gridpark");

const WINDOW_TITLE_FALLBACK = "Gridpark";

const GRIDPARK_DIRNAME = ".gridpark";
const resolveAssetPath = (...paths: string[]) => {
  if (app.isPackaged) {
    return join(process.resourcesPath, ...paths);
  }
  return join(__dirname, "../../", ...paths);
};
const getIconFileNames = () => {
  if (process.platform === "darwin") {
    return ["assets/icon.icns", "assets/icon.png"];
  }
  if (process.platform === "win32") {
    return ["assets/icon.ico", "assets/icon.png"];
  }
  return ["assets/icon.png"];
};

const resolveIconAsset = () => {
  const resolvedFiles = getIconFileNames().map((file) =>
    resolveAssetPath(file),
  );

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
    console.warn(
      "No platform icon could be loaded; falling back to last candidate.",
    );
    return { iconImage: undefined, iconPath: fallbackPath };
  }

  return { iconImage: undefined, iconPath: undefined };
};

const { iconImage: ICON_IMAGE, iconPath: ICON_PATH } = resolveIconAsset();

const getWorkbookName = (filePath: string) =>
  basename(filePath, extname(filePath));

const getGridparkRoot = (filePath: string) =>
  join(dirname(filePath), GRIDPARK_DIRNAME, getWorkbookName(filePath));

const normalizeRelativePath = (relativePath: string) =>
  relativePath.replace(/^[./\\]+/, "").replace(/\\/g, "/");

const detectLanguageFromExtension = (
  fileName: string,
): GridparkCodeLanguage => {
  if (fileName.endsWith(".css")) return "css";
  if (fileName.endsWith(".json")) return "json";
  if (fileName.endsWith(".txt")) return "text";
  return "javascript";
};

const ensurePathInsideRoot = (targetPath: string, rootDir: string) => {
  const normalizedRoot = normalize(rootDir);
  const normalizedTarget = normalize(targetPath);
  const rel = relative(normalizedRoot, normalizedTarget);
  return rel !== "" ? !rel.startsWith("..") && !isAbsolute(rel) : true;
};

const createGridparkPackage = (
  filePath: string,
  manifest?: GridparkManifest,
): GridparkPackage | undefined => {
  if (!manifest) return undefined;
  const rootDir = getGridparkRoot(filePath);
  const files: GridparkCodeFile[] = [];
  const manifestPath = join(rootDir, "manifest.json");

  const pushFile = (
    scope: GridparkCodeFile["scope"],
    role: GridparkCodeFile["role"],
    relativePath: string,
    sheetName?: string,
  ) => {
    if (!relativePath) return;
    const sanitizedRelative = normalizeRelativePath(relativePath);
    const absolutePath = normalize(join(rootDir, sanitizedRelative));
    files.push({
      id: `${scope}-${role}-${sheetName || "root"}-${sanitizedRelative}`,
      name: sanitizedRelative.split("/").pop() || sanitizedRelative,
      relativePath: sanitizedRelative,
      absolutePath,
      rootDir,
      scope,
      role,
      sheetName,
      language: detectLanguageFromExtension(sanitizedRelative),
      exists: existsSync(absolutePath),
    });
  };

  if (manifest.script) {
    pushFile("workbook", "main", manifest.script);
  }
  if (manifest.style) {
    pushFile("workbook", "style", manifest.style);
  }

  Object.values(manifest.sheets ?? {}).forEach((sheet) => {
    if (sheet.script) pushFile("sheet", "main", sheet.script, sheet.name);
    if (sheet.style) pushFile("sheet", "style", sheet.style, sheet.name);
  });

  return { rootDir, manifestPath, files };
};

const createMainWindow = (): void => {
  const window = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
    title: WINDOW_TITLE_FALLBACK,
    icon: ICON_IMAGE ?? ICON_PATH,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      const rendererIndex = join(app.getAppPath(), ".vite", "renderer", "index.html");
      window.loadFile(rendererIndex);
    }

  if (process.env.NODE_ENV === "development") {
    window.webContents.openDevTools({ mode: "detach" });
  }
  setupMenu(window);
};

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock && (ICON_IMAGE || ICON_PATH)) {
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

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Add additional listeners and IPC setup here as the app grows.

ipcMain.on("app:set-title", (event, title: string) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) {
    senderWindow.setTitle(title || WINDOW_TITLE_FALLBACK);
  }
});

type GridparkFilePayload = {
  path: string;
  rootDir: string;
};

type GridparkWritePayload = GridparkFilePayload & { content: string };
type GridparkBinaryWritePayload = GridparkFilePayload & { data: Uint8Array };

ipcMain.handle(
  "gridpark:read-file",
  async (_event, payload: GridparkFilePayload) => {
    try {
      if (!payload?.path || !payload?.rootDir) {
        return { success: false, error: "Invalid file payload." };
      }
      if (!ensurePathInsideRoot(payload.path, payload.rootDir)) {
        return { success: false, error: "Access denied for requested file." };
      }
      if (!existsSync(payload.path)) {
        return { success: true, content: "" };
      }
      const content = readFileSync(payload.path, "utf-8");
      return { success: true, content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
);

ipcMain.handle(
  "gridpark:write-file",
  async (_event, payload: GridparkWritePayload) => {
    try {
      if (!payload?.path || !payload?.rootDir) {
        return { success: false, error: "Invalid file payload." };
      }
      if (!ensurePathInsideRoot(payload.path, payload.rootDir)) {
        return { success: false, error: "Access denied for requested file." };
      }
      const targetDir = dirname(payload.path);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      writeFileSync(payload.path, payload.content ?? "", "utf-8");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
);

ipcMain.handle(
  "gridpark:write-binary-file",
  async (_event, payload: GridparkBinaryWritePayload) => {
    try {
      if (!payload?.path || !payload?.rootDir || !payload?.data) {
        return { success: false, error: "Invalid file payload." };
      }
      if (!ensurePathInsideRoot(payload.path, payload.rootDir)) {
        return { success: false, error: "Access denied for requested file." };
      }
      const targetDir = dirname(payload.path);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      const buffer = Buffer.from(payload.data);
      writeFileSync(payload.path, buffer);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
);

const loadManifestForFile = (
  filePath: string,
): GridparkManifest | undefined => {
  try {
    const manifestPath = join(getGridparkRoot(filePath), "manifest.json");
    if (!existsSync(manifestPath)) return undefined;
    const raw = readFileSync(manifestPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to load manifest for", filePath, error);
    return undefined;
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "sheet";

const ensureManifestForFile = (filePath: string, workbook: ExcelFile) => {
  try {
    const manifestDir = getGridparkRoot(filePath);
    const manifestPath = join(manifestDir, "manifest.json");
    if (existsSync(manifestPath)) {
      return;
    }
    if (!existsSync(manifestDir)) {
      mkdirSync(manifestDir, { recursive: true });
    }

    const sheets: Record<
      string,
      { name: string; main: string; style: string }
    > = {};
    workbook.sheets.forEach((sheet, index) => {
      const slug = slugify(sheet.name);
      const key = `sheet-${index + 1}`;
      sheets[key] = {
        name: sheet.name,
        script: `sheets/${slug}/script.js`,
        style: `sheets/${slug}/style.css`,
      };
    });

    const manifest = {
      name: workbook.name || workbookName,
      version: "1.0.0",
      description: "",
      apiVersion: 1,
      script: "index.js",
      style: "style.css",
      sheets,
      permissions: {
        filesystem: "workbook",
        network: false,
        runtime: [],
      },
    };

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("Generated manifest for", workbookName);
  } catch (error) {
    console.warn("Failed to ensure manifest for", filePath, error);
  }
};

const loadExcelFileFromPath = (filePath: string): ExcelFile | null => {
  try {
    const buffer = readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    const workbook = parseExcelFile(arrayBuffer, basename(filePath));
    ensureManifestForFile(filePath, workbook);
    const manifest = loadManifestForFile(filePath);
    const gridparkPackage = createGridparkPackage(filePath, manifest);
    return { ...workbook, path: filePath, manifest, gridparkPackage };
  } catch (error) {
    console.error("Failed to load Excel file:", filePath, error);
    return null;
  }
};

const sendFilesToRenderer = (
  window: BrowserWindow,
  payload: { files: ExcelFile[]; directoryName?: string },
) => {
  if (!payload.files.length) return;
  window.webContents.send("app:files-opened", payload);
};

const handleOpenFiles = async (window: BrowserWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
  });
  if (canceled || !filePaths.length) return;
  const files = filePaths
    .map(loadExcelFileFromPath)
    .filter((file): file is ExcelFile => Boolean(file));
  sendFilesToRenderer(window, { files, directoryName: undefined });
};

const handleOpenFolder = async (window: BrowserWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
  });
  if (canceled || !filePaths.length) return;
  const folderPath = filePaths[0];
  const excelPaths = readdirSync(folderPath)
    .map((entry) => join(folderPath, entry))
    .filter((fullPath) => {
      try {
        const stats = statSync(fullPath);
        return (
          stats.isFile() &&
          [".xlsx", ".xls"].includes(extname(fullPath).toLowerCase())
        );
      } catch {
        return false;
      }
    });
  const files = excelPaths
    .map(loadExcelFileFromPath)
    .filter((file): file is ExcelFile => Boolean(file));
  sendFilesToRenderer(window, { files, directoryName: basename(folderPath) });
};

const setupMenu = (window: BrowserWindow) => {
  const isMac = process.platform === "darwin";
  const themeSubmenu: Electron.MenuItemConstructorOptions[] = themeOptions.map(
    (option) => ({
      label: option.name,
      type: "radio",
      checked: option.id === DEFAULT_THEME_ID,
      click: () => window.webContents.send("settings:theme", option.id),
    }),
  );
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: "Gridpark",
            submenu: [
              { role: "about" },
              { type: "separator" },
              {
                label: "Settings",
                submenu: [
                  {
                    label: "Themes",
                    submenu: themeSubmenu,
                  },
                ],
              },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open File…",
          accelerator: "CmdOrCtrl+O",
          click: () => handleOpenFiles(window),
        },
        {
          label: "Open Folder…",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => handleOpenFolder(window),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" as const },
    { role: "viewMenu" as const },
    { role: "windowMenu" as const },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
