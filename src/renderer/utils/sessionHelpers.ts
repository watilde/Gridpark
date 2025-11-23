import { GridparkManifest, CellData } from "../types/excel";
import { SheetSessionState } from "../features/workbook/components/ExcelViewer";

/**
 * Deep clone a manifest object
 */
export const cloneManifest = (manifest: GridparkManifest): GridparkManifest =>
  JSON.parse(JSON.stringify(manifest));

/**
 * Create a default manifest for a workbook
 */
export const createDefaultManifest = (fileName: string): GridparkManifest => ({
  name: fileName.replace(/\.[^.]+$/, ""),
  version: "1.0.0",
  description: "",
  apiVersion: 1,
  main: "index.js",
  style: "style.css",
  permissions: {
    filesystem: "workbook",
    network: false,
    runtime: [],
  },
  sheets: {},
});

/**
 * Check if two cell data objects are equal
 */
export const cellDataEqual = (a?: CellData, b?: CellData): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.value === b.value &&
    a.type === b.type &&
    a.formula === b.formula &&
    JSON.stringify(a.style ?? null) === JSON.stringify(b.style ?? null)
  );
};

/**
 * Check if two sheet session states are equal
 */
export const sheetSessionEqual = (
  a?: SheetSessionState,
  b?: SheetSessionState,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.dirty !== b.dirty) return false;
  if (a.data.length !== b.data.length) return false;
  for (let row = 0; row < a.data.length; row++) {
    const rowA = a.data[row];
    const rowB = b.data[row];
    if (rowA.length !== rowB.length) return false;
    for (let col = 0; col < rowA.length; col++) {
      if (!cellDataEqual(rowA[col], rowB[col])) {
        return false;
      }
    }
  }
  return true;
};
