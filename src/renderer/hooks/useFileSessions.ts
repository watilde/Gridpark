/**
 * File Sessions (OPTIMIZED - Direct Dexie + File System)
 *
 * NO MORE useState! Data flows:
 * - Sheet data: Dexie.js (use useExcelSheet hook)
 * - Manifest: File system (read/write on demand)
 * - Code: File system (read/write on demand)
 *
 * This file provides:
 * - saveWorkbookFile: Writes Dexie data to .xlsx file
 * - Manifest operations: Direct file system access
 * - Code operations: Direct file system access
 */

import { useCallback, useMemo, useState } from 'react';
import { ExcelFile, GridparkManifest, GridparkCodeFile } from '../types/excel';
import { serializeExcelFile } from '../utils/excelUtils';
import {
  cloneManifest,
  createDefaultManifest as createDefaultManifestHelper,
} from '../utils/sessionHelpers';
import { db } from '../../lib/db';

// ============================================================================
// Manifest Session Type
// ============================================================================

export type ManifestSession = {
  data: GridparkManifest;
  originalData: GridparkManifest;
  loading: boolean;
  saving: boolean;
  error?: string;
  workbookCssContent?: string;
  sheetCssContents?: Record<string, string>;
};

const isManifestSessionDirty = (session?: ManifestSession) => {
  if (!session) return false;
  return JSON.stringify(session.data) !== JSON.stringify(session.originalData);
};

// ============================================================================
// Sheet Operations (Dexie-powered)
// ============================================================================

/**
 * Save workbook file to disk
 * Loads all sheet data from Dexie and serializes to .xlsx
 */
export const useSaveWorkbook = () => {
  const saveWorkbookFile = useCallback(async (file: ExcelFile) => {
    if (!file.path) {
      throw new Error('Cannot save workbook without a file path');
    }

    const gridparkApi = window.electronAPI?.gridpark;
    if (!gridparkApi?.writeBinaryFile) {
      throw new Error('Binary file saving is only available in the desktop app');
    }

    try {
      console.log(`[useSaveWorkbook] Saving workbook: ${file.path}`);

      // Load all sheets from Dexie
      const updatedSheets = await Promise.all(
        file.sheets.map(async (sheet: any, index: number) => {
          // Generate tabId (must match the ID used when opening the file)
          const tabId = `${file.path}-sheet-${index}`;

          try {
            // Load 2D array from Dexie
            const data = await db.getCellsAs2DArray(tabId);

            // Mark sheet as clean in DB
            await db.markSheetDirty(tabId, false);

            return {
              ...sheet,
              data,
              rowCount: data.length,
              colCount: data[0]?.length ?? sheet.colCount,
            };
          } catch (error) {
            console.warn(
              `[useSaveWorkbook] No data in Dexie for ${sheet.name}, using original`,
              error
            );
            return sheet;
          }
        })
      );

      const updatedFile = { ...file, sheets: updatedSheets };

      // Serialize and write
      const buffer = serializeExcelFile(updatedFile);
      await gridparkApi.writeBinaryFile({
        path: file.path,
        rootDir: file.path,
        data: new Uint8Array(buffer),
      });

      console.log(`[useSaveWorkbook] Successfully saved: ${file.path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[useSaveWorkbook] Failed to save workbook:', error);
      throw new Error(`Failed to save workbook ${file.name}: ${message}`);
    }
  }, []);

  return { saveWorkbookFile };
};

// ============================================================================
// Manifest Operations (File System)
// ============================================================================

export const useManifestSessions = () => {
  // useState for manifest sessions (these are NOT persisted, loaded on demand)
  const [manifestSessions, setManifestSessions] = useState<Record<string, ManifestSession>>({});

  const getManifestSessionKey = useCallback((file: ExcelFile) => {
    if (file.gridparkPackage?.manifestPath) return file.gridparkPackage.manifestPath;
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

  const createDefaultManifest = useCallback(
    (file: ExcelFile): GridparkManifest => createDefaultManifestHelper(file.name),
    []
  );

  const readManifestFile = useCallback(
    async (file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      const fallbackManifest = file.manifest
        ? cloneManifest(file.manifest)
        : createDefaultManifest(file);

      setManifestSessions(prev => {
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
          throw new Error('Manifest editing is only available in the desktop application');
        }

        const pkg = file.gridparkPackage;
        if (!pkg) {
          throw new Error('This workbook is missing its Gridpark package metadata');
        }

        const response = await gridparkApi.readFile({
          path: pkg.manifestPath,
          rootDir: pkg.rootDir,
        });

        if (!response?.success || typeof response.content !== 'string') {
          throw new Error(response?.error ?? 'Failed to load manifest');
        }

        const parsed = JSON.parse(response.content) as GridparkManifest;
        const sanitized = cloneManifest(parsed);

        // Load CSS files
        let workbookCssContent: string | undefined;
        if (parsed.style && pkg.rootDir) {
          const styleFilePath = `${pkg.rootDir}/${parsed.style}`;
          const styleResponse = await gridparkApi.readFile({
            path: styleFilePath,
            rootDir: pkg.rootDir,
          });
          if (styleResponse?.success) {
            workbookCssContent = styleResponse.content;
          }
        }

        const sheetCssContents: Record<string, string> = {};
        if (parsed.sheets && pkg.rootDir) {
          for (const sheetKey in parsed.sheets) {
            const sheet = parsed.sheets[sheetKey];
            if (sheet.style) {
              const sheetStyleFilePath = `${pkg.rootDir}/${sheet.style}`;
              const sheetStyleResponse = await gridparkApi.readFile({
                path: sheetStyleFilePath,
                rootDir: pkg.rootDir,
              });
              if (sheetStyleResponse?.success) {
                sheetCssContents[sheet.name] = sheetStyleResponse.content || '';
              }
            }
          }
        }

        setManifestSessions(prev => ({
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
        setManifestSessions(prev => {
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
    },
    [getManifestSessionKey, createDefaultManifest]
  );

  const ensureManifestSession = useCallback(
    (file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      setManifestSessions(prev => {
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
    [getManifestSessionKey, readManifestFile, createDefaultManifest]
  );

  return {
    manifestSessions,
    setManifestSessions,
    manifestDirtyMap,
    getManifestSessionKey,
    readManifestFile,
    ensureManifestSession,
    // createDefaultManifest,
    cloneManifest,
  };
};

// ============================================================================
// Code Operations (File System)
// ============================================================================

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

  const getCodeSessionKey = (codeFile: GridparkCodeFile) => codeFile.absolutePath;

  const readCodeFile = useCallback(async (codeFile: GridparkCodeFile) => {
    const key = getCodeSessionKey(codeFile);

    setCodeSessions(prev => ({
      ...prev,
      [key]: {
        content: prev[key]?.content ?? '',
        originalContent: prev[key]?.originalContent ?? '',
        loading: true,
        saving: false,
        error: undefined,
      },
    }));

    try {
      const gridparkApi = window.electronAPI?.gridpark;
      if (!gridparkApi?.readFile) {
        throw new Error('Gridpark files can only be edited in the desktop application');
      }

      const response = await gridparkApi.readFile({
        path: codeFile.absolutePath,
        rootDir: codeFile.rootDir,
      });

      if (!response?.success) {
        throw new Error(response?.error ?? 'Failed to load file');
      }

      const content = response.content ?? '';

      setCodeSessions(prev => ({
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
      setCodeSessions(prev => ({
        ...prev,
        [key]: {
          content: prev[key]?.content ?? '',
          originalContent: prev[key]?.originalContent ?? '',
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
      setCodeSessions(prev => {
        if (prev[key]) return prev;

        return {
          ...prev,
          [key]: {
            content: '',
            originalContent: '',
            loading: true,
            saving: false,
          },
        };
      });
      readCodeFile(codeFile);
    },
    [readCodeFile]
  );

  const handleCodeChange = useCallback((codeFile: GridparkCodeFile, value: string) => {
    const key = getCodeSessionKey(codeFile);
    setCodeSessions(prev => {
      const current = prev[key] ?? {
        content: '',
        originalContent: '',
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
  }, []);

  const onSaveCode = useCallback(
    async (codeFile: GridparkCodeFile) => {
      const key = getCodeSessionKey(codeFile);
      const session = codeSessions[key];

      if (!session) {
        throw new Error('No code session found for file');
      }

      setCodeSessions(prev => ({
        ...prev,
        [key]: { ...prev[key]!, saving: true, error: undefined },
      }));

      try {
        const gridparkApi = window.electronAPI?.gridpark;
        if (!gridparkApi?.writeFile) {
          throw new Error('Code file editing is only available in the desktop application');
        }

        const response = await gridparkApi.writeFile({
          path: codeFile.absolutePath,
          rootDir: codeFile.rootDir,
          content: session.content,
        });

        if (!response?.success) {
          throw new Error(response?.error ?? 'Failed to save code file');
        }

        setCodeSessions(prev => ({
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
        setCodeSessions(prev => ({
          ...prev,
          [key]: { ...prev[key]!, saving: false, error: message },
        }));
        throw error;
      }
    },
    [codeSessions]
  );

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
