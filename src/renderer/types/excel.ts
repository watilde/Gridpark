/**
 * Excel file and worksheet types
 */

export interface ExcelFile {
  name: string;
  path: string;
  sheets: ExcelSheet[];
  lastModified?: Date;
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
