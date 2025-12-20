import { FileNode } from '../features/file-explorer/FileTree';
import { ExcelFile } from '../types/excel';
import { WorkbookTab } from '../types/tabs';

export const createWorkbookNode = (excelFile: ExcelFile, id: string): FileNode => {
  const sheetNodes: FileNode[] = excelFile.sheets.map((sheet, index) => {
    const sheetId = `${id}-sheet-${index}`;
    
    return {
      id: sheetId,
      name: sheet.name,
      type: 'sheet',
      parentId: id,
      workbookId: id,
      file: excelFile,
      sheetIndex: index,
      children: [],
    };
  });

  const sheetsFolder: FileNode = {
    id: `${id}-sheets-folder`,
    name: 'Sheets',
    type: 'folder',
    parentId: id,
    workbookId: id,
    children: sheetNodes,
  };

  return {
    id,
    name: excelFile.name,
    type: 'workbook',
    workbookId: id,
    file: excelFile,
    children: [sheetsFolder],
  };
};

export const createSheetTab = (sheetNode: FileNode): WorkbookTab | null => {
  if (sheetNode.type !== 'sheet' || !sheetNode.file || typeof sheetNode.sheetIndex !== 'number') {
    return null;
  }
  return {
    kind: 'sheet',
    id: sheetNode.id,
    workbookId: sheetNode.parentId ?? sheetNode.id,
    treeNodeId: sheetNode.id,
    sheetIndex: sheetNode.sheetIndex,
    sheetName: sheetNode.name,
    fileName: sheetNode.file.name,
    file: sheetNode.file,
  };
};
