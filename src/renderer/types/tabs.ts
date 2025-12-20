import { ExcelFile } from './excel';

export type SheetTab = {
  kind: 'sheet';
  id: string;
  workbookId: string;
  treeNodeId: string;
  sheetIndex: number;
  sheetName: string;
  fileName: string;
  file: ExcelFile;
};

export type WorkbookTab = SheetTab;
