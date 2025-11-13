import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Input,
  Button,
  Tabs,
  TabList,
  Tab,
  IconButton,
  Sheet,
} from "@mui/joy";
import { styled } from "@mui/joy/styles";
import { AppLayout } from "../components/ui/layout/AppLayout";
import {
  FileTree,
  FileNode,
} from "../components/ui/features/FileTree/FileTree";
import { ExcelViewer } from "../components/ui/features/ExcelViewer/ExcelViewer";
import type { SheetSessionState } from "../components/ui/features/ExcelViewer/ExcelViewer";
import { useThemePreset, themeOptions } from "../theme/ThemeProvider";
import type { ThemePresetId } from "../theme/theme";
import {
  ExcelFile,
  CellData,
  CellPosition,
  CellRange,
  GridparkCodeFile,
  GridparkManifest,
} from "../types/excel";
import { serializeExcelFile } from "../utils/excelUtils";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import { CodeEditorPanel } from "../components/ui/features/Monaco/CodeEditorPanel";
import { ManifestEditorPanel } from "../components/ui/features/Manifest/ManifestEditorPanel";
import { getPlatformCapabilities } from "../utils/platform";
import Drawer from "@mui/joy/Drawer";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Divider from "@mui/joy/Divider";

const sortCodeFiles = (files: GridparkCodeFile[]) =>
  [...files].sort((a, b) => {
    if (a.role === b.role) {
      return a.name.localeCompare(b.name);
    }
    return a.role.localeCompare(b.role);
  });

const createCodeNode = (
  parentId: string,
  workbookId: string,
  codeFile: GridparkCodeFile,
  displayName?: string,
): FileNode => ({
  id: `${parentId}-${codeFile.id}`,
  name: displayName ?? codeFile.name,
  type: "code",
  parentId,
  workbookId,
  codeFile,
});

const createWorkbookNode = (excelFile: ExcelFile, id: string): FileNode => {
  const codeFiles = excelFile.gridparkPackage?.files ?? [];
  const workbookJs = codeFiles.find(
    (file) => file.scope === "workbook" && file.role === "main",
  );
  const workbookCss = codeFiles.find(
    (file) => file.scope === "workbook" && file.role === "style",
  );

  const sheetNodes: FileNode[] = excelFile.sheets.map((sheet, index) => {
    const sheetId = `${id}-sheet-${index}`;
    const sheetCodeFiles = codeFiles.filter(
      (file) => file.scope === "sheet" && file.sheetName === sheet.name,
    );
    const jsFile = sheetCodeFiles.find((file) => file.role === "main");
    const cssFile = sheetCodeFiles.find((file) => file.role === "style");
    const sheetChildren: FileNode[] = [];
    if (jsFile) {
      sheetChildren.push(createCodeNode(sheetId, id, jsFile, "JavaScript"));
    }
    if (cssFile) {
      sheetChildren.push(createCodeNode(sheetId, id, cssFile, "CSS"));
    }

    return {
      id: sheetId,
      name: sheet.name,
      type: "sheet",
      parentId: id,
      workbookId: id,
      file: excelFile,
      sheetIndex: index,
      children: sheetChildren,
    };
  });

  const sheetsFolder: FileNode = {
    id: `${id}-sheets-folder`,
    name: "Sheets",
    type: "folder",
    parentId: id,
    workbookId: id,
    children: sheetNodes,
  };

  const workbookChildren: FileNode[] = [sheetsFolder];
  if (workbookJs) {
    workbookChildren.push(createCodeNode(id, id, workbookJs, "JavaScript"));
  }
  if (workbookCss) {
    workbookChildren.push(createCodeNode(id, id, workbookCss, "CSS"));
  }

  return {
    id,
    name: excelFile.name,
    type: "workbook",
    workbookId: id,
    file: excelFile,
    children: workbookChildren,
  };
};

type SheetTab = {
  kind: "sheet";
  id: string;
  workbookId: string;
  treeNodeId: string;
  sheetIndex: number;
  sheetName: string;
  fileName: string;
  file: ExcelFile;
};

type ManifestTab = {
  kind: "manifest";
  id: string;
  workbookId: string;
  treeNodeId: string;
  fileName: string;
  file: ExcelFile;
};

type CodeTab = {
  kind: "code";
  id: string;
  workbookId: string;
  treeNodeId: string;
  fileName: string;
  file: ExcelFile;
  codeFile: GridparkCodeFile;
};

type WorkbookTab = SheetTab | ManifestTab | CodeTab;

type ManifestSession = {
  data: GridparkManifest;
  originalData: GridparkManifest;
  loading: boolean;
  saving: boolean;
  error?: string;
};

const cloneManifest = (manifest: GridparkManifest): GridparkManifest =>
  JSON.parse(JSON.stringify(manifest));

const createDefaultManifest = (file: ExcelFile): GridparkManifest => ({
  name: file.name.replace(/\.[^.]+$/, ""),
  version: "1.0.0",
  description: "",
  apiVersion: 1,
  main: "index.js",
  style: "style.css",
  permissions: {
    filesystem: "workbook",
    network: false,
    runtime: [],
  },
  sheets: {},
});

const createSheetTab = (sheetNode: FileNode): WorkbookTab | null => {
  if (
    sheetNode.type !== "sheet" ||
    !sheetNode.file ||
    typeof sheetNode.sheetIndex !== "number"
  ) {
    return null;
  }
  return {
    kind: "sheet",
    id: sheetNode.id,
    workbookId: sheetNode.parentId ?? sheetNode.id,
    treeNodeId: sheetNode.id,
    sheetIndex: sheetNode.sheetIndex,
    sheetName: sheetNode.name,
    fileName: sheetNode.file.name,
    file: sheetNode.file,
  };
};

const createManifestTab = (
  workbookNode: FileNode,
  treeNodeId?: string,
): WorkbookTab | null => {
  if (workbookNode.type !== "workbook" || !workbookNode.file) {
    return null;
  }
  return {
    kind: "manifest",
    id: `${workbookNode.id}-manifest`,
    workbookId: workbookNode.id,
    treeNodeId: treeNodeId ?? workbookNode.id,
    fileName: workbookNode.file.name,
    file: workbookNode.file,
  };
};

const isManifestSessionDirty = (session?: ManifestSession) => {
  if (!session) return false;
  return (
    JSON.stringify(session.data) !== JSON.stringify(session.originalData)
  );
};

const unsavedDotSx = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--joy-palette-warning-400)",
  display: "inline-block",
  animation: "gridparkPulse 1.5s ease-in-out infinite",
  boxShadow: "0 0 8px rgba(255,107,53,0.4)",
  "@keyframes gridparkPulse": {
    "0%": { transform: "scale(0.9)", opacity: 0.7 },
    "50%": { transform: "scale(1.2)", opacity: 1 },
    "100%": { transform: "scale(0.9)", opacity: 0.7 },
  },
};

const cellDataEqual = (a?: CellData, b?: CellData) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.value === b.value &&
    a.type === b.type &&
    a.formula === b.formula &&
    JSON.stringify(a.style ?? null) === JSON.stringify(b.style ?? null)
  );
};

const sheetSessionEqual = (
  a?: SheetSessionState,
  b?: SheetSessionState,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.dirty !== b.dirty) return false;
  if (a.data.length !== b.data.length) return false;
  for (let row = 0; row < a.data.length; row++) {
    const rowA = a.data[row];
    const rowB = b.data[row];
    if (rowA.length !== rowB.length) return false;
    for (let col = 0; col < rowA.length; col++) {
      if (!cellDataEqual(rowA[col], rowB[col])) {
        return false;
      }
    }
  }
  return true;
};

const PlaygroundWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: `radial-gradient(circle at 15% 20%, ${theme.palette.primary.solidBg}33, transparent 45%),
               radial-gradient(circle at 80% 15%, ${theme.palette.info.solidBg}33, transparent 45%),
               radial-gradient(circle at 20% 80%, ${theme.palette.success.solidBg}33, transparent 45%),
               linear-gradient(135deg,
                 ${theme.palette.primary.solidBg},
                 ${theme.palette.info.solidBg},
                 ${theme.palette.success.solidBg},
                 ${theme.palette.warning.solidBg})`,
  backgroundSize: "500% 500%",
  animation: "gridparkGradient 24s ease infinite",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(transparent 96%, rgba(255,255,255,0.05) 96%), linear-gradient(90deg, transparent 96%, rgba(255,255,255,0.05) 96%)",
    backgroundSize: "48px 48px",
    mixBlendMode: "soft-light",
    opacity: 0.8,
    pointerEvents: "none",
  },
  "@keyframes gridparkGradient": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" },
  },
}));

const PlaygroundBackdrop = styled("div")({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0,
});

const PlaygroundContent = styled("div")({
  position: "relative",
  zIndex: 1,
  flex: 1,
  width: "100%",
});

const Bubble = styled("span")(({ theme }) => ({
  position: "absolute",
  borderRadius: "50%",
  opacity: 0.35,
  background: theme.palette.primary.solidBg,
  mixBlendMode: "screen",
  animation: "gridparkBubble 18s ease-in-out infinite",
  filter: "blur(0.5px)",
  "@keyframes gridparkBubble": {
    "0%": { transform: "translate3d(0,0,0) scale(0.9)" },
    "50%": { transform: "translate3d(-30px,-25px,0) scale(1.2)" },
    "100%": { transform: "translate3d(0,0,0) scale(0.9)" },
  },
}));

const Polygon = styled("span")(({ theme }) => ({
  position: "absolute",
  width: 36,
  height: 36,
  opacity: 0.25,
  border: `2px solid ${theme.palette.info.solidBg}`,
  transformOrigin: "center",
  animation: "gridparkSpin 20s linear infinite",
  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  "@keyframes gridparkSpin": {
    "0%": { transform: "rotate(0deg) scale(1)" },
    "50%": { transform: "rotate(180deg) scale(1.1)" },
    "100%": { transform: "rotate(360deg) scale(1)" },
  },
}));

const Sparkle = styled("span")(({ theme }) => ({
  position: "absolute",
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: theme.palette.success.solidBg,
  opacity: 0.6,
  animation: "gridparkSparkle 3.2s ease-in-out infinite",
  mixBlendMode: "screen",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    border: `1px solid ${theme.palette.warning.solidBg}`,
    opacity: 0.7,
  },
  "&::after": {
    filter: "blur(2px)",
  },
  "@keyframes gridparkSparkle": {
    "0%": { transform: "scale(0) translateY(0)", opacity: 0 },
    "25%": { transform: "scale(1) translateY(-4px)", opacity: 1 },
    "100%": { transform: "scale(0) translateY(-10px)", opacity: 0 },
  },
}));

const playgroundShapes = [
  { top: "12%", left: "8%", size: 240, type: "bubble" },
  { top: "65%", left: "15%", size: 180, type: "bubble" },
  { top: "25%", left: "78%", size: 260, type: "bubble" },
  { top: "70%", left: "75%", type: "polygon" },
  { top: "18%", left: "55%", type: "polygon" },
  { top: "40%", left: "30%", type: "polygon" },
  { top: "35%", left: "12%", type: "sparkle" },
  { top: "58%", left: "60%", type: "sparkle" },
  { top: "72%", left: "42%", type: "sparkle" },
];

const GridparkPlayground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <PlaygroundWrapper>
    <PlaygroundBackdrop>
      {playgroundShapes.map((shape, index) => {
        if (shape.type === "bubble") {
          return (
            <Bubble
              key={`bubble-${index}`}
              sx={{
                top: shape.top,
                left: shape.left,
                width: shape.size,
                height: shape.size,
                animationDelay: `${index * 1.1}s`,
              }}
            />
          );
        }
        if (shape.type === "polygon") {
          return (
            <Polygon
              key={`polygon-${index}`}
              sx={{
                top: shape.top,
                left: shape.left,
                animationDelay: `${index * 1.4}s`,
              }}
            />
          );
        }
        return (
          <Sparkle
            key={`sparkle-${index}`}
            sx={{
              top: shape.top,
              left: shape.left,
              animationDelay: `${index * 0.7}s`,
            }}
          />
        );
      })}
    </PlaygroundBackdrop>
    <PlaygroundContent>{children}</PlaygroundContent>
  </PlaygroundWrapper>
);

export const Home: React.FC = () => {
  const { presetId, setPresetId } = useThemePreset();
  const [workbookNodes, setWorkbookNodes] = useState<FileNode[]>([]);
  const [openTabs, setOpenTabs] = useState<WorkbookTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string>("");
  const [codeSessions, setCodeSessions] = useState<
    Record<
      string,
      {
        content: string;
        originalContent: string;
        loading: boolean;
        saving: boolean;
        error?: string;
      }
    >
  >({});
  const [manifestSessions, setManifestSessions] = useState<
    Record<string, ManifestSession>
  >({});
  const [sheetSessions, setSheetSessions] = useState<
    Record<string, SheetSessionState>
  >({});
  const [sheetDirtyMap, setSheetDirtyMap] = useState<Record<string, boolean>>(
    {},
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isGridparkTheme = presetId === "gridpark";
  const saveWorkbookFile = useCallback(async (file: ExcelFile) => {
    if (!file.path) {
      console.warn("Cannot save workbook without an origin path.");
      return;
    }
    const gridparkApi = window.electronAPI?.gridpark;
    if (!gridparkApi?.writeBinaryFile) {
      console.warn("Binary file saving is only available in the desktop app.");
      return;
    }
    try {
      const buffer = serializeExcelFile(file);
      await gridparkApi.writeBinaryFile({
        path: file.path,
        rootDir: file.path,
        data: new Uint8Array(buffer),
      });
    } catch (error) {
      console.error("Failed to save workbook to disk:", error);
    }
  }, []);

  const manifestDirtyMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(manifestSessions).forEach(([key, session]) => {
      map[key] = isManifestSessionDirty(session);
    });
    return map;
  }, [manifestSessions]);

  const treeNodes = workbookNodes;
  const treeTitle = "Explore";
  const activeTab = openTabs.find((tab) => tab.id === activeTabId) || null;
  const platformCapabilities = useMemo(() => getPlatformCapabilities(), []);
  const findWorkbookNode = useCallback(
    (workbookId: string) =>
      workbookNodes.find((node) => node.id === workbookId),
    [workbookNodes],
  );

  const focusTab = useCallback((tab: WorkbookTab) => {
    setActiveTabId(tab.id);
    setSelectedNodeId(tab.treeNodeId);
  }, []);

  const getCodeSessionKey = (codeFile: GridparkCodeFile) =>
    codeFile.absolutePath;

  const readCodeFile = useCallback(async (codeFile: GridparkCodeFile) => {
    const key = getCodeSessionKey(codeFile);
    setCodeSessions((prev) => ({
      ...prev,
      [key]: {
        content: prev[key]?.content ?? "",
        originalContent: prev[key]?.originalContent ?? "",
        loading: true,
        saving: false,
        error: undefined,
      },
    }));
    try {
      const gridparkApi = window.electronAPI?.gridpark;
      if (!gridparkApi?.readFile) {
        throw new Error(
          "Gridpark files can only be edited in the desktop application.",
        );
      }
      const response = await gridparkApi.readFile({
        path: codeFile.absolutePath,
        rootDir: codeFile.rootDir,
      });
      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to load file.");
      }
      const content = response.content ?? "";
      setCodeSessions((prev) => ({
        ...prev,
        [key]: {
          content,
          originalContent: content,
          loading: false,
          saving: false,
          error: undefined,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCodeSessions((prev) => ({
        ...prev,
        [key]: {
          content: prev[key]?.content ?? "",
          originalContent: prev[key]?.originalContent ?? "",
          loading: false,
          saving: false,
          error: message,
        },
      }));
    }
  }, []);

  const ensureCodeSession = useCallback(
    (codeFile: GridparkCodeFile) => {
      const key = getCodeSessionKey(codeFile);
      setCodeSessions((prev) => {
        if (prev[key]) {
          return prev;
        }
        return {
          ...prev,
          [key]: {
            content: "",
            originalContent: "",
            loading: true,
            saving: false,
          },
        };
      });
      readCodeFile(codeFile);
    },
    [readCodeFile],
  );

  const handleCodeChange = useCallback(
    (codeFile: GridparkCodeFile, value: string) => {
      const key = getCodeSessionKey(codeFile);
      setCodeSessions((prev) => {
        const current = prev[key] ?? {
          content: "",
          originalContent: "",
          loading: false,
          saving: false,
        };
        return {
          ...prev,
          [key]: {
            ...current,
            content: value,
            error: undefined,
          },
        };
      });
    },
    [],
  );

  const handleSaveCode = useCallback(
    async (codeFile: GridparkCodeFile) => {
      const key = getCodeSessionKey(codeFile);
      const currentSession = codeSessions[key];
      if (!currentSession) {
        await readCodeFile(codeFile);
        return;
      }
      setCodeSessions((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] ?? currentSession),
          saving: true,
          error: undefined,
        },
      }));
      try {
        const gridparkApi = window.electronAPI?.gridpark;
        if (!gridparkApi?.writeFile) {
          throw new Error(
            "Saving is only available in the desktop application.",
          );
        }
        const response = await gridparkApi.writeFile({
          path: codeFile.absolutePath,
          rootDir: codeFile.rootDir,
          content: currentSession.content,
        });
        if (!response?.success) {
          throw new Error(response?.error ?? "Failed to save file.");
        }
        setCodeSessions((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? currentSession),
            saving: false,
            originalContent: prev[key]?.content ?? currentSession.content,
            error: undefined,
          },
        }));
      } catch (error) {
        setCodeSessions((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? currentSession),
            saving: false,
            error: error instanceof Error ? error.message : String(error),
          },
        }));
      }
    },
    [codeSessions, readCodeFile],
  );

  const getManifestSessionKey = useCallback((file: ExcelFile) => {
    if (file.gridparkPackage?.manifestPath)
      return file.gridparkPackage.manifestPath;
    if (file.path) return `memory:${file.path}`;
    return `memory:${file.name}`;
  }, []);

  const readManifestFile = useCallback(async (file: ExcelFile) => {
    const key = getManifestSessionKey(file);
    const fallbackManifest = file.manifest
      ? cloneManifest(file.manifest)
      : createDefaultManifest(file);
    setManifestSessions((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: existing
          ? { ...existing, loading: true, error: undefined }
          : {
              data: fallbackManifest,
              originalData: fallbackManifest,
              loading: true,
              saving: false,
            },
      };
    });
    try {
      const gridparkApi = window.electronAPI?.gridpark;
      if (!gridparkApi?.readFile) {
        throw new Error(
          "Manifest editing is only available in the desktop application.",
        );
      }
      const pkg = file.gridparkPackage;
      if (!pkg) {
        throw new Error(
          "This workbook is missing its Gridpark package metadata.",
        );
      }
      const response = await gridparkApi.readFile({
        path: pkg.manifestPath,
        rootDir: pkg.rootDir,
      });
      if (!response?.success || typeof response.content !== "string") {
        throw new Error(response?.error ?? "Failed to load manifest.");
      }
      const parsed = JSON.parse(response.content) as GridparkManifest;
      const sanitized = cloneManifest(parsed);
      setManifestSessions((prev) => ({
        ...prev,
        [key]: {
          data: sanitized,
          originalData: sanitized,
          loading: false,
          saving: false,
          error: undefined,
        },
      }));
    } catch (error) {
      setManifestSessions((prev) => {
        const existing = prev[key];
        return {
          ...prev,
          [key]: {
            data: existing?.data ?? fallbackManifest,
            originalData: existing?.originalData ?? fallbackManifest,
            loading: false,
            saving: existing?.saving ?? false,
            error: error instanceof Error ? error.message : String(error),
          },
        };
      });
    }
  }, []);

  const ensureManifestSession = useCallback(
    (file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      setManifestSessions((prev) => {
        if (prev[key]) {
          return prev;
        }
        const fallbackManifest = file.manifest
          ? cloneManifest(file.manifest)
          : createDefaultManifest(file);
        return {
          ...prev,
          [key]: {
            data: fallbackManifest,
            originalData: fallbackManifest,
            loading: true,
            saving: false,
          },
        };
      });
      readManifestFile(file);
    },
    [readManifestFile],
  );

  const handleReloadManifest = useCallback(
    (file: ExcelFile) => {
      readManifestFile(file);
    },
    [readManifestFile],
  );

  const updateWorkbookReferences = useCallback(
    (workbookId: string, updatedFile: ExcelFile) => {
      const cloneNodeWithFile = (node: FileNode): FileNode => {
        const next: FileNode = { ...node };
        if (node.file) {
          next.file = updatedFile;
        }
        if (node.type === "workbook") {
          next.name = updatedFile.name;
        }
        if (node.children) {
          next.children = node.children.map((child) =>
            cloneNodeWithFile(child),
          );
        }
        return next;
      };

      setWorkbookNodes((prev) =>
        prev.map((node) =>
          node.id === workbookId ? cloneNodeWithFile(node) : node,
        ),
      );
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.workbookId === workbookId
            ? { ...tab, file: updatedFile, fileName: updatedFile.name }
            : tab,
        ),
      );
    },
    [setOpenTabs, setWorkbookNodes],
  );

  const handleManifestChange = useCallback(
    (workbookId: string, file: ExcelFile, nextManifest: GridparkManifest) => {
      const key = getManifestSessionKey(file);
      const sanitized = cloneManifest(nextManifest);
      setManifestSessions((prev) => {
        const existing = prev[key];
        if (existing) {
          return {
            ...prev,
            [key]: {
              ...existing,
              data: sanitized,
              error: undefined,
            },
          };
        }
        return {
          ...prev,
          [key]: {
            data: sanitized,
            originalData: sanitized,
            loading: false,
            saving: false,
          },
        };
      });

      if (nextManifest.name && nextManifest.name !== file.name) {
        const updatedFile: ExcelFile = { ...file, name: nextManifest.name };
        updateWorkbookReferences(workbookId, updatedFile);
      }
    },
    [updateWorkbookReferences],
  );

  const handleSaveManifest = useCallback(
    async (workbookId: string, file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      const session = manifestSessions[key];
      if (!session) {
        await readManifestFile(file);
        return;
      }
      setManifestSessions((prev) => ({
        ...prev,
        [key]: {
          ...prev[key]!,
          saving: true,
          error: undefined,
        },
      }));
      try {
        const gridparkApi = window.electronAPI?.gridpark;
        if (!gridparkApi?.writeFile) {
          throw new Error(
            "Manifest editing is only available in the desktop application.",
          );
        }
        const pkg = file.gridparkPackage;
        if (!pkg) {
          throw new Error(
            "This workbook is missing its Gridpark package metadata.",
          );
        }
        const content = JSON.stringify(session.data, null, 2);
        const response = await gridparkApi.writeFile({
          path: pkg.manifestPath,
          rootDir: pkg.rootDir,
          content,
        });
        if (!response?.success) {
          throw new Error(response?.error ?? "Failed to save manifest.");
        }
        const updatedManifest = cloneManifest(session.data);
        const updatedFile: ExcelFile = { ...file, manifest: updatedManifest };
        setManifestSessions((prev) => ({
          ...prev,
          [key]: {
            ...prev[key]!,
            saving: false,
            originalData: updatedManifest,
            error: undefined,
          },
        }));
        updateWorkbookReferences(workbookId, updatedFile);
      } catch (error) {
        setManifestSessions((prev) => ({
          ...prev,
          [key]: {
            ...prev[key]!,
            saving: false,
            error: error instanceof Error ? error.message : String(error),
          },
        }));
      }
    },
    [manifestSessions, readManifestFile, updateWorkbookReferences],
  );

  const openTabForSheetNode = useCallback(
    (sheetNode: FileNode) => {
      const tab = createSheetTab(sheetNode);
      if (!tab) return;
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      focusTab(tab);
    },
    [focusTab],
  );

  const openTabForManifest = useCallback(
    (workbookNode: FileNode, treeNodeId?: string) => {
      const tab = createManifestTab(workbookNode, treeNodeId);
      if (!tab) return;
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      focusTab(tab);
      if (workbookNode.file) {
        ensureManifestSession(workbookNode.file);
      }
    },
    [ensureManifestSession, focusTab],
  );

  const openTabForCodeNode = useCallback(
    (codeNode: FileNode) => {
      if (codeNode.type !== "code" || !codeNode.codeFile) return;
      const workbook = findWorkbookNode(
        codeNode.workbookId ?? codeNode.parentId ?? "",
      );
      if (!workbook || !workbook.file) return;
      const tab: WorkbookTab = {
        kind: "code",
        id: `${codeNode.id}-tab`,
        workbookId: workbook.id,
        treeNodeId: codeNode.id,
        fileName: workbook.file.name,
        file: workbook.file,
        codeFile: codeNode.codeFile,
      };
      setOpenTabs((prev) => {
        if (prev.some((existing) => existing.id === tab.id)) {
          return prev;
        }
        return [...prev, tab];
      });
      ensureCodeSession(codeNode.codeFile);
      focusTab(tab);
    },
    [ensureCodeSession, findWorkbookNode, focusTab],
  );

  const handleNodeSelect = (node: FileNode) => {
    if (node.type === "sheet") {
      openTabForSheetNode(node);
      return;
    }

    if (node.type === "workbook") {
      openTabForManifest(node, node.id);
      return;
    }

    if (node.type === "manifest") {
      const workbook = findWorkbookNode(node.workbookId ?? node.parentId ?? "");
      if (workbook) {
        openTabForManifest(workbook, node.id);
      }
      return;
    }

    if (node.type === "code") {
      openTabForCodeNode(node);
    }
  };

  const handleCellSelect = (position: CellPosition) => {
    console.log("Cell selected:", position);
  };

  const handleRangeSelect = (range: CellRange) => {
    console.log("Range selected:", range);
  };

  const handleBack = () => {
    console.log("Navigate back");
  };

  const handleProceed = () => {
    console.log("Proceed action");
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search query:", event.target.value);
  };

  const activeTitle = activeTab
    ? activeTab.kind === "sheet"
      ? `${activeTab.sheetName} - ${activeTab.fileName}`
      : activeTab.kind === "manifest"
        ? `${activeTab.fileName} (Manifest)`
        : `${activeTab.codeFile.name} - ${activeTab.fileName}`
    : "Gridpark";

  useEffect(() => {
    window.electronAPI?.setWindowTitle(activeTitle);
  }, [activeTitle]);

  const activeCodeSession =
    activeTab?.kind === "code"
      ? codeSessions[activeTab.codeFile.absolutePath]
      : undefined;
  const activeManifestKey =
    activeTab?.kind === "manifest"
      ? getManifestSessionKey(activeTab.file)
      : null;
  const activeManifestSession = activeManifestKey
    ? manifestSessions[activeManifestKey]
    : undefined;
  const activeSheetSession =
    activeTab?.kind === "sheet" ? sheetSessions[activeTab.id] : undefined;
  const manifestEditorData =
    activeTab?.kind === "manifest"
      ? (activeManifestSession?.data ??
        (activeTab.file.manifest
          ? cloneManifest(activeTab.file.manifest)
          : createDefaultManifest(activeTab.file)))
      : null;
  const manifestIsDirty = activeManifestKey
    ? Boolean(manifestDirtyMap[activeManifestKey])
    : false;
  const canEditManifest = Boolean(window.electronAPI?.gridpark);
  const tabIsDirty = useCallback(
    (tab: WorkbookTab) => {
      if (tab.kind === "sheet") {
        return Boolean(
          sheetDirtyMap[tab.id] ?? sheetSessions[tab.id]?.dirty,
        );
      }
      if (tab.kind === "code") {
        const session = codeSessions[tab.codeFile.absolutePath];
        return Boolean(
          session && session.content !== session.originalContent,
        );
      }
      if (tab.kind === "manifest") {
        const key = getManifestSessionKey(tab.file);
        return Boolean(key && manifestDirtyMap[key]);
      }
      return false;
    },
    [
      codeSessions,
      getManifestSessionKey,
      manifestDirtyMap,
      sheetDirtyMap,
      sheetSessions,
    ],
  );
  const dirtyNodeIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    const visit = (node: FileNode): boolean => {
      let dirty = false;
      if (node.type === "sheet") {
        dirty = Boolean(sheetDirtyMap[node.id]);
      } else if (node.type === "code" && node.codeFile) {
        const session = codeSessions[node.codeFile.absolutePath];
        dirty = Boolean(
          session && session.content !== session.originalContent,
        );
      } else if (node.type === "manifest" && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
      } else if (node.type === "workbook" && node.file) {
        const key = getManifestSessionKey(node.file);
        dirty = Boolean(key && manifestDirtyMap[key]);
      }
      if (node.children?.length) {
        const childDirty = node.children.map((child) => visit(child));
        dirty = dirty || childDirty.some(Boolean);
      }
      if (dirty) {
        map[node.id] = true;
      }
      return dirty;
    };
    workbookNodes.forEach(visit);
    return map;
  }, [
    workbookNodes,
    sheetDirtyMap,
    sheetSessions,
    codeSessions,
    manifestDirtyMap,
    getManifestSessionKey,
  ]);

  const handleTabChange = (
    _event: React.SyntheticEvent | null,
    value: string | number | null,
  ) => {
    if (!value || typeof value !== "string") return;
    const tab = openTabs.find((t) => t.id === value);
    if (tab) {
      focusTab(tab);
    }
  };

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        const tabToClose = prev.find((tab) => tab.id === tabId);
        if (tabToClose?.kind === "sheet") {
          setSheetSessions((sessions) => {
            if (!sessions[tabToClose.id]) {
              return sessions;
            }
            const next = { ...sessions };
            delete next[tabToClose.id];
            return next;
          });
          setSheetDirtyMap((dirty) => {
            if (!dirty[tabToClose.id]) {
              return dirty;
            }
            const next = { ...dirty };
            delete next[tabToClose.id];
            return next;
          });
        }
        const nextTabs = prev.filter((tab) => tab.id !== tabId);
        if (tabId === activeTabId) {
          const nextActive = nextTabs[nextTabs.length - 1];
          if (nextActive) {
            focusTab(nextActive);
          } else {
            setActiveTabId("");
            setSelectedNodeId("");
          }
        }
        return nextTabs;
      });
    },
    [activeTabId, focusTab],
  );

  const handlePersistSheetSession = useCallback(
    (tabId: string, state: SheetSessionState) => {
      setSheetSessions((prev) => {
        const prevSession = prev[tabId];
        if (sheetSessionEqual(prevSession, state)) {
          return prev;
        }
        return {
          ...prev,
          [tabId]: state,
        };
      });
      setSheetDirtyMap((prev) => {
        if (!state.dirty) {
          if (!prev[tabId]) return prev;
          const next = { ...prev };
          delete next[tabId];
          return next;
        }
        if (prev[tabId]) return prev;
        return {
          ...prev,
          [tabId]: true,
        };
      });
    },
    [],
  );

  const handleSaveSheetSession = useCallback(
    (tabId: string, state: SheetSessionState) => {
      handlePersistSheetSession(tabId, state);
      const tab = openTabs.find(
        (candidate): candidate is SheetTab =>
          candidate.id === tabId && candidate.kind === "sheet",
      );
      if (!tab) {
        return;
      }
      const workbookNode = findWorkbookNode(tab.workbookId);
      const workbookFile = workbookNode?.file;
      if (!workbookFile) {
        return;
      }
      const updatedSheets = workbookFile.sheets.map((sheet) =>
        sheet.name === tab.sheetName
          ? {
              ...sheet,
              data: state.data,
              rowCount: state.data.length,
              colCount: state.data[0]?.length ?? sheet.colCount,
            }
          : sheet,
      );
      const updatedFile: ExcelFile = { ...workbookFile, sheets: updatedSheets };
      updateWorkbookReferences(tab.workbookId, updatedFile);
      saveWorkbookFile(updatedFile);
    },
    [
      findWorkbookNode,
      handlePersistSheetSession,
      openTabs,
      saveWorkbookFile,
      updateWorkbookReferences,
    ],
  );

  const handleSheetDirtyChange = useCallback((tabId: string, dirty: boolean) => {
    setSheetDirtyMap((prev) => {
      if (dirty) {
        if (prev[tabId]) return prev;
        return {
          ...prev,
          [tabId]: true,
        };
      }
      if (!prev[tabId]) return prev;
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, []);

  const resetWorkbooks = useCallback(
    (files: ExcelFile[], directoryName?: string) => {
      const timestamp = Date.now();
      const nodes = files.map((file, index) =>
        createWorkbookNode(file, `workbook-${timestamp}-${index}`),
      );
      setWorkbookNodes(nodes);
      setCodeSessions({});
      setManifestSessions({});
      setSheetSessions({});
      setSheetDirtyMap({});
      setCurrentDirectoryName(directoryName ?? "");
      const firstSheetNode = nodes[0]?.children?.find(
        (child) => child.type === "sheet",
      );
      const firstTab = firstSheetNode ? createSheetTab(firstSheetNode) : null;
      if (firstTab) {
        setOpenTabs([firstTab]);
        setActiveTabId(firstTab.id);
        setSelectedNodeId(firstTab.treeNodeId);
      } else {
        setOpenTabs([]);
        setActiveTabId("");
        setSelectedNodeId("");
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onFilesOpened?.(
      ({
        files,
        directoryName,
      }: {
        files: ExcelFile[];
        directoryName?: string;
      }) => {
        resetWorkbooks(files, directoryName);
      },
    );
    return () => {
      unsubscribe?.();
    };
  }, [resetWorkbooks]);

  const layout = (
    <AppLayout
      header={
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}
        >
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={handleProceed}
              aria-label="Go forward"
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Input
            placeholder="Search files or sheets"
            size="sm"
            startDecorator={<SearchIcon fontSize="small" />}
            sx={{ flex: 1, minWidth: 200 }}
            onChange={handleSearchChange}
          />
          <IconButton
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      }
      sidebar={
        treeNodes.length ? (
          <FileTree
            files={treeNodes}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            title={treeTitle}
            dirtyNodeIds={dirtyNodeIds}
            fullHeight
          />
        ) : null
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {openTabs.length > 0 && (
          <Tabs
            value={activeTabId}
            onChange={handleTabChange}
            sx={{
              backgroundColor: "background.surface",
              borderRadius: "sm",
              boxShadow: "sm",
            }}
          >
            <TabList
              variant="soft"
              sx={{
                gap: 0.5,
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { height: 4 },
              }}
            >
              {openTabs.map((tab) => {
                const dirty = tabIsDirty(tab);
                return (
                  <Tab
                    key={tab.id}
                    value={tab.id}
                    sx={{
                      textTransform: "none",
                      minHeight: "28px",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                      px: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <span>
                        {tab.kind === "sheet"
                          ? tab.sheetName
                          : tab.kind === "manifest"
                            ? `${tab.fileName} Manifest`
                            : tab.codeFile.name}
                      </span>
                      {dirty && (
                        <Box
                          component="span"
                          aria-hidden="true"
                          sx={{ ...unsavedDotSx, ml: 0.5 }}
                        />
                      )}
                      <IconButton
                        component="span"
                        tabIndex={-1}
                        size="sm"
                        variant="plain"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                        role="button"
                        aria-label="Close tab"
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </Tab>
                );
              })}
            </TabList>
          </Tabs>
        )}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {activeTab && activeTab.kind === "sheet" ? (
            <ExcelViewer
              file={activeTab.file}
              sheetIndex={activeTab.sheetIndex}
              sessionState={activeSheetSession}
              onSessionChange={(state) =>
                handlePersistSheetSession(activeTab.id, state)
              }
              onSaveSession={(state) =>
                handleSaveSheetSession(activeTab.id, state)
              }
              onDirtyChange={(dirty) =>
                handleSheetDirtyChange(activeTab.id, dirty)
              }
              onCellSelect={handleCellSelect}
              onRangeSelect={handleRangeSelect}
            />
          ) : activeTab &&
              activeTab.kind === "manifest" &&
              manifestEditorData ? (
            <ManifestEditorPanel
              manifest={manifestEditorData}
              loading={
                Boolean(activeManifestSession?.loading) && !manifestIsDirty
              }
              saving={Boolean(activeManifestSession?.saving)}
              isDirty={manifestIsDirty}
              error={activeManifestSession?.error}
              editable={canEditManifest}
              platformCapabilities={{
                platform: platformCapabilities.platform as "electron" | "web",
                canAccessFileSystem: platformCapabilities.canAccessFileSystem,
                canWorkOffline: platformCapabilities.canWorkOffline,
                hasNativeMenus: platformCapabilities.hasNativeMenus,
                canManageWindows: platformCapabilities.canManageWindows,
                hasSystemIntegration: platformCapabilities.hasSystemIntegration,
                canAutoUpdate: platformCapabilities.canAutoUpdate,
                hasNativeNotifications:
                  platformCapabilities.hasNativeNotifications,
                canAccessClipboard: platformCapabilities.canAccessClipboard,
              }}
              onChange={(next) =>
                handleManifestChange(activeTab.workbookId, activeTab.file, next)
              }
              onSave={() =>
                handleSaveManifest(activeTab.workbookId, activeTab.file)
              }
              onReload={() => handleReloadManifest(activeTab.file)}
            />
          ) : activeTab && activeTab.kind === "code" ? (
            <CodeEditorPanel
              codeFile={activeTab.codeFile}
              content={activeCodeSession?.content ?? ""}
              loading={activeCodeSession ? activeCodeSession.loading : true}
              saving={activeCodeSession ? activeCodeSession.saving : false}
              isDirty={
                activeCodeSession
                  ? activeCodeSession.content !==
                    activeCodeSession.originalContent
                  : false
              }
              error={activeCodeSession?.error}
              onChange={(value) => handleCodeChange(activeTab.codeFile, value)}
              onSave={() => handleSaveCode(activeTab.codeFile)}
              onCloseTab={() => handleCloseTab(activeTab.id)}
            />
          ) : (
            <Sheet
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
              }}
            >
              <Typography level="body-md" sx={{ color: "neutral.500" }}>
                Open a sheet, manifest, or code file from the file tree.
              </Typography>
            </Sheet>
          )}
        </Box>
      </Box>
    </AppLayout>
  );

  return (
    <>
      {isGridparkTheme ? (
        <GridparkPlayground>{layout}</GridparkPlayground>
      ) : (
        layout
      )}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        size="md"
        sx={{ "& .MuiDrawer-paper": { borderRadius: 0, maxWidth: 360 } }}
      >
        <Sheet
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
          }}
        >
          <Typography level="title-lg">Settings</Typography>
          <Divider />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography level="title-sm">Theme</Typography>
            <Select
              size="sm"
              value={presetId}
              onChange={(_event, value) => {
                if (value && typeof value === "string") {
                  setPresetId(value as ThemePresetId);
                }
              }}
            >
              {themeOptions.map((option) => (
                <Option key={option.id} value={option.id}>
                  {option.name}
                </Option>
              ))}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="soft"
              color="neutral"
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </Button>
          </Box>
        </Sheet>
      </Drawer>
    </>
  );
};

export default Home;
