import { useMemo, useCallback } from "react";
import { WorkbookTab } from "../types/tabs";
import { FileNode } from "../features/file-explorer/FileTree";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";
import { GridparkCodeFile, ExcelFile } from "../types/excel";
import { ManifestSession } from "./useFileSessions";

export interface DirtyTrackingParams {
  workbookNodes: FileNode[];
  sheetSessions: Record<string, SheetSessionState>;
  sheetDirtyMap: Record<string, boolean>;
  codeSessions: Record<
    string,
    {
      content: string;
      originalContent: string;
      loading: boolean;
      saving: boolean;
      error?: string;
    }
  >;
  manifestDirtyMap: Record<string, boolean>;
  getManifestSessionKey: (file: ExcelFile) => string;
}

export const useDirtyTracking = ({
  workbookNodes,
  sheetSessions,
  sheetDirtyMap,
  codeSessions,
  manifestDirtyMap,
  getManifestSessionKey,
}: DirtyTrackingParams) => {
  /**
   * Check if a specific tab is dirty
   */
  const tabIsDirty = useCallback(
    (tab: WorkbookTab): boolean => {
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

  /**
   * Compute dirty node IDs across the entire file tree
   */
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

  return {
    tabIsDirty,
    dirtyNodeIds,
  };
};
