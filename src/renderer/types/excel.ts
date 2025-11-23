/**
 * Excel file and worksheet types
 */

export interface GridparkManifest {
  name: string;
  version: string;
  description?: string;
  apiVersion?: number;
  script?: string;
  style?: string;
  permissions?: {
    filesystem?: 'none' | 'workbook';
    network?: boolean;
    runtime?: string[];
  };
  sheets?: Record<
    string,
    {
      name: string;
      script: string;
      style?: string;
    }
  >;
}

export type GridparkCodeLanguage = 'javascript' | 'css' | 'json' | 'text';

export interface GridparkCodeFile {
  id: string;
  name: string;
  relativePath: string;
  absolutePath: string;
  rootDir: string;
  scope: 'workbook' | 'sheet';
  role: 'main' | 'style' | 'asset';
  sheetName?: string;
  language: GridparkCodeLanguage;
  exists: boolean;
}

export interface GridparkPackage {
  rootDir: string;
  manifestPath: string;
  files: GridparkCodeFile[];
}

export interface ExcelFile {
  name: string;
  path: string;
  sheets: ExcelSheet[];
  lastModified?: Date;
  manifest?: GridparkManifest;
  gridparkPackage?: GridparkPackage;
}

export interface ExcelSheet {
  name: string;
  data: CellData[][];
  rowCount: number;
  colCount: number;
}

export interface CellData {
  value: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'formula' | 'empty';
  formula?: string;
  style?: CellStyle;
}

export interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  border?: string;
  fontSize?: string;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface CellPosition {
  row: number;
  col: number;
}
