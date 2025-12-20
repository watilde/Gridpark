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
  properties?: any;  // ExcelSheetProperties from exceljs-types
}

export interface CellData {
  value: string | number | boolean | null | Date;
  type: 'string' | 'number' | 'boolean' | 'formula' | 'empty' | 'date' | 'error' | 'richText';
  formula?: string;
  style?: CellStyle;  // Legacy CSS-style (for backwards compatibility)
  // ExcelJS extensions (imported lazily to avoid circular deps)
  richText?: any[];  // ExcelRichTextFragment[]
  merge?: any;  // ExcelMergeInfo
  dataValidation?: any;  // ExcelDataValidation
  note?: any;  // Note/Comment
  hyperlink?: any;  // Hyperlink info
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
