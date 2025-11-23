import { FileNode } from "../features/file-explorer/FileTree";
import { ExcelFile, GridparkCodeFile } from "../types/excel";
import { WorkbookTab } from "../types/tabs";

// Ensure createManifestTab is properly exported.
export const sortCodeFiles = (files: GridparkCodeFile[]) =>
  [...files].sort((a, b) => {
    if (a.role === b.role) {
      return a.name.localeCompare(b.name);
    }
    return a.role.localeCompare(b.role);
  });

const createCodeNode = (
  parentId: string,
  workbookId: string,
  codeFile: GridparkCodeFile,
  displayName?: string,
): FileNode => {
  return {
    id: `${parentId}-${codeFile.id}`,
    name: displayName ?? codeFile.name,
    type: "code",
    parentId,
    workbookId,
    codeFile,
  };
};

export const createWorkbookNode = (excelFile: ExcelFile, id: string): FileNode => {
  const codeFiles = excelFile.gridparkPackage?.files ?? [];
  const workbookJs = codeFiles.find(
    (file) => file.scope === "workbook" && file.role === "main",
  );
  const workbookCss = codeFiles.find(
    (file) => file.scope === "workbook" && file.role === "style",
  );

  const sheetNodes: FileNode[] = excelFile.sheets.map((sheet, index) => {
    const sheetId = `${id}-sheet-${index}`;
    const sheetCodeFiles = codeFiles.filter(
      (file) => file.scope === "sheet" && file.sheetName === sheet.name,
    );
    const jsFile = sheetCodeFiles.find((file) => file.role === "main");
    const cssFile = sheetCodeFiles.find((file) => file.role === "style");
    const sheetChildren: FileNode[] = [];
    if (jsFile) {
      sheetChildren.push(createCodeNode(sheetId, id, jsFile, "JavaScript"));
    }
    if (cssFile) {
      sheetChildren.push(createCodeNode(sheetId, id, cssFile, "CSS"));
    }

    return {
      id: sheetId,
      name: sheet.name,
      type: "sheet",
      parentId: id,
      workbookId: id,
      file: excelFile,
      sheetIndex: index,
      children: sheetChildren,
    };
  });

  const sheetsFolder: FileNode = {
    id: `${id}-sheets-folder`,
    name: "Sheets",
    type: "folder",
    parentId: id,
    workbookId: id,
    children: sheetNodes,
  };

  const workbookChildren: FileNode[] = [sheetsFolder];
  if (workbookJs) {
    workbookChildren.push(createCodeNode(id, id, workbookJs, "JavaScript"));
  }
  if (workbookCss) {
    workbookChildren.push(createCodeNode(id, id, workbookCss, "CSS"));
  }

  return {
    id,
    name: excelFile.name,
    type: "workbook",
    workbookId: id,
    file: excelFile,
    children: workbookChildren,
  };
};

export const createSheetTab = (sheetNode: FileNode): WorkbookTab | null => {
  if (
    sheetNode.type !== "sheet" ||
    !sheetNode.file ||
    typeof sheetNode.sheetIndex !== "number"
  ) {
    return null;
  }
  return {
    kind: "sheet",
    id: sheetNode.id,
    workbookId: sheetNode.parentId ?? sheetNode.id,
    treeNodeId: sheetNode.id,
    sheetIndex: sheetNode.sheetIndex,
    sheetName: sheetNode.name,
    fileName: sheetNode.file.name,
    file: sheetNode.file,
  };
};

export const createManifestTabInstance = (
  workbookNode: FileNode,
  treeNodeId?: string,
): WorkbookTab | null => {
  if (workbookNode.type !== "workbook" || !workbookNode.file) {
    return null;
  }
  return {
    kind: "manifest",
    id: `${workbookNode.id}-manifest`,
    workbookId: workbookNode.id,
    treeNodeId: treeNodeId ?? workbookNode.id,
    fileName: workbookNode.file.name,
    file: workbookNode.file,
  };
};
