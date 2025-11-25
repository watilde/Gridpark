import { useCallback } from 'react';
import { ExcelFile, GridparkManifest } from '../types/excel';
import { ManifestSession } from './useFileSessions';
import { cloneManifest } from '../utils/sessionHelpers';

export interface ManifestHandlersParams {
  manifestSessions: Record<string, ManifestSession>;
  setManifestSessions: React.Dispatch<React.SetStateAction<Record<string, ManifestSession>>>;
  getManifestSessionKey: (file: ExcelFile) => string;
  readManifestFile: (file: ExcelFile) => Promise<void>;
  updateWorkbookReferences: (workbookId: string, updatedFile: ExcelFile) => void;
  createDefaultManifest: (file: ExcelFile) => GridparkManifest;
}

/**
 * Hook to manage manifest-related operations
 */
export const useManifestHandlers = ({
  manifestSessions,
  setManifestSessions,
  getManifestSessionKey,
  readManifestFile,
  updateWorkbookReferences,
  createDefaultManifest,
}: ManifestHandlersParams) => {
  /**
   * Handle manifest changes (edit operations)
   */
  const handleManifestChange = useCallback(
    (workbookId: string, file: ExcelFile, nextManifest: GridparkManifest) => {
      const key = getManifestSessionKey(file);
      const sanitized = cloneManifest(nextManifest);

      setManifestSessions(prev => {
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
        const updatedFile = { ...file, name: nextManifest.name };
        updateWorkbookReferences(workbookId, updatedFile);
      }
    },
    [getManifestSessionKey, updateWorkbookReferences, setManifestSessions]
  );

  /**
   * Save manifest to disk
   */
  const handleSaveManifest = useCallback(
    async (workbookId: string, file: ExcelFile) => {
      const key = getManifestSessionKey(file);
      const session = manifestSessions[key];
      if (!session) {
        await readManifestFile(file);
        return;
      }

      setManifestSessions(prev => ({
        ...prev,
        [key]: { ...prev[key]!, saving: true, error: undefined },
      }));

      try {
        const gridparkApi = window.electronAPI?.gridpark;
        if (!gridparkApi?.writeFile) {
          throw new Error('Manifest editing is only available in the desktop application.');
        }
        const pkg = file.gridparkPackage;
        if (!pkg) {
          throw new Error('Missing Gridpark package metadata.');
        }

        const content = JSON.stringify(session.data, null, 2);
        const response = await gridparkApi.writeFile({
          path: pkg.manifestPath,
          rootDir: pkg.rootDir,
          content,
        });
        if (!response?.success) {
          throw new Error(response?.error ?? 'Failed to save manifest.');
        }

        const updatedManifest = cloneManifest(session.data);
        const updatedFile = { ...file, manifest: updatedManifest };
        setManifestSessions(prev => ({
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
        setManifestSessions(prev => ({
          ...prev,
          [key]: {
            ...prev[key]!,
            saving: false,
            error: error instanceof Error ? error.message : String(error),
          },
        }));
      }
    },
    [
      manifestSessions,
      getManifestSessionKey,
      readManifestFile,
      setManifestSessions,
      updateWorkbookReferences,
    ]
  );

  return {
    handleManifestChange,
    handleSaveManifest,
  };
};
