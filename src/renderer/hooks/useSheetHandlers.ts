import { useCallback } from "react";
import { ExcelFile } from "../types/excel";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";
import { WorkbookTab } from "../types/tabs";
import { FileNode } from "../features/file-explorer/FileTree";

export interface SheetHandlersParams {
  openTabs: WorkbookTab[];
  findWorkbookNode: (workbookId: string) => FileNode | undefined;
  updateWorkbookReferences: (workbookId: string, updatedFile: ExcelFile) => void;
  handlePersistSheetSession: (tabId: string, state: SheetSessionState) => void;
  saveWorkbookFile: (file: ExcelFile) => Promise<void>;
  setSheetDirtyMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/**
 * Hook to manage sheet-related operations
 */
export const useSheetHandlers = ({
  openTabs,
  findWorkbookNode,
  updateWorkbookReferences,
  handlePersistSheetSession,
  saveWorkbookFile,
  setSheetDirtyMap,
}: SheetHandlersParams) => {
  /**
   * Save sheet session state and update workbook
   */
  const handleSaveSheetSession = useCallback(
    (tabId: string, state: SheetSessionState) => {
      const tab = openTabs.find(
        (candidate): candidate is WorkbookTab & { kind: "sheet" } =>
          candidate.id === tabId && candidate.kind === "sheet",
      );
      if (!tab) return;

      const workbookNode = findWorkbookNode(tab.workbookId);
      const workbookFile = workbookNode?.file;
      if (!workbookFile) return;

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
      const updatedFile = { ...workbookFile, sheets: updatedSheets };
      updateWorkbookReferences(tab.workbookId, updatedFile);
      saveWorkbookFile(updatedFile);
      
      // Clear dirty state after successful save
      // Only update dirtyMap, don't touch the session state
      // to avoid triggering re-renders
      setSheetDirtyMap((prev) => {
        console.log('[useSheetHandlers] Clearing dirty state for', tabId, 'exists:', !!prev[tabId]);
        if (!prev[tabId]) return prev;
        const next = { ...prev };
        delete next[tabId];
        console.log('[useSheetHandlers] Dirty state cleared for', tabId);
        return next;
      });
    },
    [
      findWorkbookNode,
      openTabs,
      saveWorkbookFile,
      updateWorkbookReferences,
      setSheetDirtyMap,
    ],
  );

  /**
   * Handle dirty state changes for sheets
   */
  const handleSheetDirtyChange = useCallback(
    (tabId: string, dirty: boolean) => {
      console.log('[useSheetHandlers] handleSheetDirtyChange called', { tabId, dirty });
      setSheetDirtyMap((prev) => {
        if (dirty) {
          if (prev[tabId]) return prev;
          console.log('[useSheetHandlers] Setting dirty for', tabId);
          return { ...prev, [tabId]: true };
        }
        if (!prev[tabId]) return prev;
        const next = { ...prev };
        delete next[tabId];
        console.log('[useSheetHandlers] Clearing dirty for', tabId);
        return next;
      });
    },
    [setSheetDirtyMap],
  );

  return {
    handleSaveSheetSession,
    handleSheetDirtyChange,
  };
};
