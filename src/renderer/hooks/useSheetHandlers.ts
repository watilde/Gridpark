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
      handlePersistSheetSession(tabId, state);
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
    },
    [
      findWorkbookNode,
      handlePersistSheetSession,
      openTabs,
      saveWorkbookFile,
      updateWorkbookReferences,
    ],
  );

  /**
   * Handle dirty state changes for sheets
   */
  const handleSheetDirtyChange = useCallback(
    (tabId: string, dirty: boolean) => {
      setSheetDirtyMap((prev) => {
        if (dirty) {
          if (prev[tabId]) return prev;
          return { ...prev, [tabId]: true };
        }
        if (!prev[tabId]) return prev;
        const next = { ...prev };
        delete next[tabId];
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
