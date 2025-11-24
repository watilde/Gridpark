import { useState, useCallback, useMemo } from "react";
import { ExcelFile, GridparkManifest, GridparkCodeFile } from "../types/excel";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";
import { serializeExcelFile } from "../utils/excelUtils";
import {
  cloneManifest,
  createDefaultManifest as createDefaultManifestHelper,
  sheetSessionEqual,
} from "../utils/sessionHelpers";

export type ManifestSession = {
  data: GridparkManifest;
  originalData: GridparkManifest;
  loading: boolean;
  saving: boolean;
  error?: string;
  workbookCssContent?: string; // Workbook-level CSS content
  sheetCssContents?: Record<string, string>; // Sheet-level CSS contents, keyed by sheet name
};

// Helper functions
const isManifestSessionDirty = (session?: ManifestSession) => {
  if (!session) return false;
  return (
    JSON.stringify(session.data) !== JSON.stringify(session.originalData)
  );
};


export const useSheetSessions = () => {
  const [sheetSessions, setSheetSessions] = useState<Record<string, SheetSessionState>>({});
  const [sheetDirtyMap, setSheetDirtyMap] = useState<Record<string, boolean>>({});

  const handlePersistSheetSession = useCallback(
    (tabId: string, state: SheetSessionState) => {
      setSheetSessions((prev) => {
        const prevSession = prev[tabId];
        if (sheetSessionEqual(prevSession, state)) {
          return prev;
        }
        return { ...prev, [tabId]: state };
      });
      // Note: dirty state is now managed by SaveManager in Home.tsx
      // via onDirtyChange callback, not here
    },
    [],
  );

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

  return {
    sheetSessions,
    setSheetSessions,
    sheetDirtyMap,
    setSheetDirtyMap,
    handlePersistSheetSession,
    saveWorkbookFile,
  };
};

export const useManifestSessions = () => {
  const [manifestSessions, setManifestSessions] = useState<Record<string, ManifestSession>>({});

  const getManifestSessionKey = useCallback((file: ExcelFile) => {
    if (file.gridparkPackage?.manifestPath)
      return file.gridparkPackage.manifestPath;
    if (file.path) return `memory:${file.path}`;
    return `memory:${file.name}`;
  }, []);

  const manifestDirtyMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(manifestSessions).forEach(([key, session]) => {
      map[key] = isManifestSessionDirty(session);
    });
    return map;
  }, [manifestSessions]);

  const createDefaultManifest = useCallback((file: ExcelFile): GridparkManifest => 
    createDefaultManifestHelper(file.name), []);

  const readManifestFile = useCallback(async (file: ExcelFile) => {
    const key = getManifestSessionKey(file);
    const fallbackManifest = file.manifest
      ? cloneManifest(file.manifest)
      : createDefaultManifest(file);
    
    setManifestSessions((prev) => {
        // Optimistic loading state
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
        }
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

      let workbookCssContent: string | undefined;
      if (parsed.style && pkg.rootDir) {
        // Assuming parsed.style is a relative path
        const styleFilePath = `${pkg.rootDir}/${parsed.style}`; // Using string concat for relative path in renderer context
        const styleResponse = await gridparkApi.readFile({ path: styleFilePath, rootDir: pkg.rootDir });
        if (styleResponse?.success) {
          workbookCssContent = styleResponse.content;
        } else {
          console.warn(`Failed to load workbook style file: ${styleFilePath}`, styleResponse?.error);
        }
      }

      const sheetCssContents: Record<string, string> = {};
      if (parsed.sheets && pkg.rootDir) {
        for (const sheetKey in parsed.sheets) {
          const sheet = parsed.sheets[sheetKey];
          if (sheet.style) {
            // Assuming sheet.style is a relative path
            const sheetStyleFilePath = `${pkg.rootDir}/${sheet.style}`; // Using string concat for relative path in renderer context
            const sheetStyleResponse = await gridparkApi.readFile({ path: sheetStyleFilePath, rootDir: pkg.rootDir });
            if (sheetStyleResponse?.success) {
              sheetCssContents[sheet.name] = sheetStyleResponse.content || "";
            } else {
              console.warn(`Failed to load sheet style file: ${sheetStyleFilePath}`, sheetStyleResponse?.error);
            }
          }
        }
      }

      setManifestSessions((prev) => ({
        ...prev,
        [key]: {
          data: sanitized,
          originalData: sanitized,
          loading: false,
          saving: false,
          error: undefined,
          workbookCssContent,
          sheetCssContents,
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
  }, [getManifestSessionKey]);

  const ensureManifestSession = useCallback(
    (file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      setManifestSessions((prev) => {
        if (prev[key]) return prev;
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
    [getManifestSessionKey, readManifestFile],
  );

  return {
    manifestSessions,
    setManifestSessions,
    manifestDirtyMap,
    getManifestSessionKey,
    readManifestFile,
    ensureManifestSession,
    createDefaultManifest,
    cloneManifest,
  };
};

export const useCodeSessions = () => {
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

  const onSaveCode = useCallback(async (codeFile: GridparkCodeFile) => {
    const key = getCodeSessionKey(codeFile);
    const session = codeSessions[key];
    if (!session) {
      throw new Error("No code session found for file");
    }

    setCodeSessions((prev) => ({
      ...prev,
      [key]: { ...prev[key]!, saving: true, error: undefined },
    }));

    try {
      const gridparkApi = window.electronAPI?.gridpark;
      if (!gridparkApi?.writeFile) {
        throw new Error(
          "Code file editing is only available in the desktop application.",
        );
      }

      const response = await gridparkApi.writeFile({
        path: codeFile.absolutePath,
        rootDir: codeFile.rootDir,
        content: session.content,
      });

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to save code file.");
      }

      setCodeSessions((prev) => ({
        ...prev,
        [key]: {
          ...prev[key]!,
          originalContent: session.content,
          saving: false,
          error: undefined,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCodeSessions((prev) => ({
        ...prev,
        [key]: { ...prev[key]!, saving: false, error: message },
      }));
      throw error;
    }
  }, [codeSessions]);

  return {
    codeSessions,
    setCodeSessions,
    readCodeFile,
    ensureCodeSession,
    handleCodeChange,
    onSaveCode,
    getCodeSessionKey,
  };
};
