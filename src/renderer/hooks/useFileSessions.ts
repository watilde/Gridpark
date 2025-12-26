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
  const saveWorkbookFile = useCallback(async (file: ExcelFile, workbookId?: string) => {
    if (!file.path) {
      throw new Error('Cannot save workbook without a file path');
    }

    // Use the new electron API for saving
    const electronAPI = window.electronAPI;
    if (!electronAPI?.saveFile) {
      throw new Error('File saving is only available in the desktop app');
    }

    console.log('[useSaveWorkbook] === SAVE START ===', { 
      path: file.path, 
      workbookId,
      sheetCount: file.sheets.length 
    });

    // Keep track of which sheets were marked clean for rollback on error
    const cleanedSheets: string[] = [];

    try {
      // STEP 1: Load all sheets from database and prepare for save
      const updatedSheets = await Promise.all(
        file.sheets.map(async (sheet: any, index: number) => {
          // Generate tabId (must match the ID used in createWorkbookNode)
          const tabId = workbookId 
            ? `${workbookId}-sheet-${index}`
            : `${file.path}-sheet-${index}`;

          console.log(`[useSaveWorkbook] Processing sheet ${index}`, {
            sheetName: sheet.name,
            tabId,
          });

          try {
            // Load 2D array from database
            const data = await db.getCellsAs2DArray(tabId);
            console.log(`[useSaveWorkbook] Loaded ${data.length} rows for sheet ${index}`);
            
            // DEBUG: Log first few cells to verify data
            const nonEmptyCells = data.flatMap((row, r) => 
              row.map((cell, c) => ({ r, c, cell }))
            ).filter(({ cell }) => cell.value !== null && cell.value !== '');
            console.log(`[useSaveWorkbook] Non-empty cells in sheet ${index}:`, nonEmptyCells.slice(0, 10));

            return {
              ...sheet,
              data,
              rowCount: data.length,
              colCount: data[0]?.length ?? sheet.colCount,
            };
          } catch (error) {
            console.warn(
              `[useSaveWorkbook] No data in database for ${sheet.name}, using original`,
              error
            );
            return sheet;
          }
        })
      );

      const updatedFile = { ...file, sheets: updatedSheets };

      // STEP 2: Save to file system
      console.log('[useSaveWorkbook] Writing to file system...');
      const result = await electronAPI.saveFile(updatedFile);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save file');
      }

      console.log('[useSaveWorkbook] File written successfully');

      // STEP 3: Mark all sheets as clean ONLY after successful file write
      console.log('[useSaveWorkbook] Marking sheets as clean...');
      await Promise.all(
        file.sheets.map(async (sheet: any, index: number) => {
          const tabId = workbookId 
            ? `${workbookId}-sheet-${index}`
            : `${file.path}-sheet-${index}`;

          try {
            await db.markSheetDirty(tabId, false);
            cleanedSheets.push(tabId);
            console.log(`[useSaveWorkbook] Marked sheet ${index} (${tabId}) as clean`);
          } catch (error) {
            console.error(`[useSaveWorkbook] Failed to mark sheet ${index} as clean:`, error);
          }
        })
      );

      console.log('[useSaveWorkbook] === SAVE COMPLETE ===', { 
        path: file.path,
        cleanedSheets: cleanedSheets.length 
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[useSaveWorkbook] === SAVE FAILED ===', {
        path: file.path,
        error: message,
        cleanedSheets: cleanedSheets.length,
      });

      // Rollback: Mark any cleaned sheets as dirty again
      if (cleanedSheets.length > 0) {
        console.warn('[useSaveWorkbook] Rolling back cleaned sheets...');
        await Promise.all(
          cleanedSheets.map(tabId => db.markSheetDirty(tabId, true))
        );
      }

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
