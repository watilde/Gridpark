import { ExcelFile, GridparkCodeFile } from "./excel";

export type SheetTab = {
  kind: "sheet";
  id: string;
  workbookId: string;
  treeNodeId: string;
  sheetIndex: number;
  sheetName: string;
  fileName: string;
  file: ExcelFile;
};

export type ManifestTab = {
  kind: "manifest";
  id: string;
  workbookId: string;
  treeNodeId: string;
  fileName: string;
  file: ExcelFile;
};

export type CodeTab = {
  kind: "code";
  id: string;
  workbookId: string;
  treeNodeId: string;
  fileName: string;
  file: ExcelFile;
  codeFile: GridparkCodeFile;
};

export type WorkbookTab = SheetTab | ManifestTab | CodeTab;
