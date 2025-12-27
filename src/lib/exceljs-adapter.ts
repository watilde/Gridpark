/**
 * ExcelJS Integration Layer
 * 
 * Provides a clean interface for reading/writing Excel files with full styling support
 * Integrates with in-memory database for data persistence
 */

import ExcelJS from 'exceljs';
import { 
  CellValue, 
  CellType, 
  CellData,
  StoredCellData 
} from './db';
import {
  ExcelCellStyle,
  ExcelJSCellData,
  ExcelSheetProperties,
  ExcelRichTextFragment,
  ExcelConditionalFormatting,
  ExcelDataValidation,
  ExcelImage,
} from './exceljs-types';

// ============================================================================
// Type Conversions
// ============================================================================

/**
 * Convert ExcelJS cell type to our CellType
 */
function convertExcelJSType(cell: ExcelJS.Cell): CellType {
  if (cell.formula) return 'formula';
  if (cell.type === ExcelJS.ValueType.Null) return 'empty';
  if (cell.type === ExcelJS.ValueType.String) return 'string';
  if (cell.type === ExcelJS.ValueType.Number) return 'number';
  if (cell.type === ExcelJS.ValueType.Boolean) return 'boolean';
  if (cell.type === ExcelJS.ValueType.Date) return 'date';
  if (cell.type === ExcelJS.ValueType.Error) return 'error';
  if (cell.type === ExcelJS.ValueType.RichText) return 'richText';
  return 'string';
}

/**
 * Convert ExcelJS cell value to our CellValue
 */
function convertExcelJSValue(cell: ExcelJS.Cell): CellValue {
  if (cell.value === null || cell.value === undefined) return null;
  
  // Handle Date type
  if (cell.value instanceof Date) {
    return cell.value;
  }
  
  // Handle rich text
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    // For now, concatenate rich text as plain string
    return cell.value.richText.map((t: { text: string }) => t.text).join('');
  }
  
  // Handle hyperlinks
  if (typeof cell.value === 'object' && 'text' in cell.value) {
    return cell.value.text;
  }
  
  // Handle formula results
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return (cell.value as { result: CellValue }).result;
  }
  
  // Basic types
  if (typeof cell.value === 'string' || 
      typeof cell.value === 'number' || 
      typeof cell.value === 'boolean') {
    return cell.value;
  }
  
  return null;
}

/**
 * Convert ExcelJS style to our ExcelCellStyle
 */
function convertExcelJSStyle(cell: ExcelJS.Cell): ExcelCellStyle | undefined {
  if (!cell.style) return undefined;
  
  const style: ExcelCellStyle = {};
  
  if (cell.style.font) {
    style.font = {
      name: cell.style.font.name,
      size: cell.style.font.size,
      bold: cell.style.font.bold,
      italic: cell.style.font.italic,
      underline: cell.style.font.underline as any,
      strike: cell.style.font.strike,
      color: cell.style.font.color as any,
    };
  }
  
  if (cell.style.fill) {
    style.fill = cell.style.fill as any;
  }
  
  if (cell.style.border) {
    style.border = cell.style.border as any;
  }
  
  if (cell.style.alignment) {
    style.alignment = cell.style.alignment as any;
  }
  
  if (cell.style.numFmt) {
    style.numFmt = cell.style.numFmt;
  }
  
  if (cell.style.protection) {
    style.protection = cell.style.protection;
  }
  
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Apply ExcelCellStyle to ExcelJS cell
 */
function applyStyleToCell(cell: ExcelJS.Cell, style: ExcelCellStyle): void {
  if (style.font) {
    cell.font = style.font as any;
  }
  
  if (style.fill) {
    cell.fill = style.fill as any;
  }
  
  if (style.border) {
    cell.border = style.border as any;
  }
  
  if (style.alignment) {
    cell.alignment = style.alignment as any;
  }
  
  if (style.numFmt) {
    cell.numFmt = style.numFmt;
  }
  
  if (style.protection) {
    cell.protection = style.protection;
  }
}

// ============================================================================
// ExcelJS Adapter
// ============================================================================

export class ExcelJSAdapter {
  /**
   * Read workbook metadata only (NO data loading)
   * Fast: Only sheet names and dimensions
   */
  static async readWorkbookMetadata(
    buffer: ArrayBuffer
  ): Promise<{
    sheets: Array<{
      name: string;
      rowCount: number;
      colCount: number;
      properties?: ExcelSheetProperties;
    }>;
  }> {
    console.time('[ExcelJS] Load metadata');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    console.timeLog('[ExcelJS] Load metadata', 'Workbook loaded');
    
    const sheets = workbook.worksheets.map(worksheet => {
      // Find actual data dimensions (fast scan, no data extraction)
      let maxRow = 0;
      let maxCol = 0;
      
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        maxRow = Math.max(maxRow, rowNumber);
        row.eachCell({ includeEmpty: false }, (_cell, colNumber) => {
          maxCol = Math.max(maxCol, colNumber);
        });
      });
      
      // Extract sheet properties (lightweight)
      const properties: ExcelSheetProperties = {
        columns: worksheet.columns?.map(col => ({
          width: col.width,
          hidden: col.hidden,
          style: undefined,
        })),
        views: worksheet.views?.map(view => ({
          state: view.state,
          xSplit: view.xSplit,
          ySplit: view.ySplit,
          topLeftCell: view.topLeftCell,
          activeCell: view.activeCell,
          showGridLines: view.showGridLines,
          showRowColHeaders: view.showRowColHeaders,
          zoomScale: view.zoomScale,
        })),
        autoFilter: worksheet.autoFilter ? {
          ref: typeof worksheet.autoFilter === 'string' 
            ? worksheet.autoFilter 
            : (worksheet.autoFilter as any).ref,
        } : undefined,
      };
      
      return {
        name: worksheet.name,
        rowCount: maxRow,
        colCount: maxCol,
        properties,
      };
    });
    
    console.timeEnd('[ExcelJS] Load metadata');
    return { sheets };
  }

  /**
   * Read Excel file from ArrayBuffer and convert to CellData format
   */
  static async readWorkbook(
    buffer: ArrayBuffer
  ): Promise<{
    sheets: Array<{
      name: string;
      data: CellData[][];
      properties?: ExcelSheetProperties;
    }>;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const sheets = workbook.worksheets.map(worksheet => {
      // Find actual data dimensions
      let maxRow = 0;
      let maxCol = 0;
      
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        maxRow = Math.max(maxRow, rowNumber);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          maxCol = Math.max(maxCol, colNumber);
        });
      });
      
      // Create 2D array (DO NOT use default 100x100 - only actual size!)
      // CRITICAL: Old code created 100x100 minimum, causing memory issues
      const rows = Math.max(10, maxRow); // Minimum 10 rows (not 100!)
      const cols = Math.max(10, maxCol); // Minimum 10 cols (not 100!)
      
      const data: CellData[][] = Array(rows)
        .fill(null)
        .map(() =>
          Array(cols)
            .fill(null)
            .map((): CellData => ({
              value: null,
              type: 'empty',
            }))
        );
      
      // Fill with actual data
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const rowIndex = rowNumber - 1;  // ExcelJS uses 1-based indexing
          const colIndex = colNumber - 1;
          
          if (rowIndex < rows && colIndex < cols) {
            const cellType = convertExcelJSType(cell);
            const value = convertExcelJSValue(cell);
            const style = convertExcelJSStyle(cell);
            
            data[rowIndex][colIndex] = {
              value,
              type: cellType,
              formula: cell.formula ? String(cell.formula) : undefined,
              style: style as any,  // Convert to legacy style format
            };
          }
        });
      });
      
      // Extract sheet properties
      const properties: ExcelSheetProperties = {
        merges: (worksheet as any).model?.merges || [],
        columns: worksheet.columns?.map(col => ({
          width: col.width,
          hidden: col.hidden,
          style: undefined,  // TODO: Extract column styles
        })),
        views: worksheet.views?.map(view => ({
          state: view.state,
          xSplit: view.xSplit,
          ySplit: view.ySplit,
          topLeftCell: view.topLeftCell,
          activeCell: view.activeCell,
          showGridLines: view.showGridLines,
          showRowColHeaders: view.showRowColHeaders,
          zoomScale: view.zoomScale,
        })),
        autoFilter: worksheet.autoFilter ? {
          ref: typeof worksheet.autoFilter === 'string' 
            ? worksheet.autoFilter 
            : (worksheet.autoFilter as any).ref,
        } : undefined,
      };
      
      return {
        name: worksheet.name,
        data,
        properties,
      };
    });
    
    return { sheets };
  }
  
  /**
   * Write CellData to Excel file and return ArrayBuffer
   */
  static async writeWorkbook(
    sheets: Array<{
      name: string;
      data: CellData[][];
      properties?: ExcelSheetProperties;
    }>
  ): Promise<ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Gridpark';
    workbook.lastModifiedBy = 'Gridpark';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    for (const sheetData of sheets) {
      const worksheet = workbook.addWorksheet(sheetData.name);
      
      // Apply column widths
      if (sheetData.properties?.columns) {
        worksheet.columns = sheetData.properties.columns.map((col, index) => ({
          key: String.fromCharCode(65 + index),  // A, B, C, ...
          width: col.width || 10,
          hidden: col.hidden,
        }));
      }
      
      // Write cell data
      sheetData.data.forEach((row, rowIndex) => {
        row.forEach((cellData, colIndex) => {
          // Skip empty cells
          if (!cellData || 
              (cellData.value === null && 
               !cellData.formula && 
               !cellData.style)) {
            return;
          }
          
          const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
          
          // Set value or formula
          if (cellData.formula) {
            cell.value = { formula: cellData.formula, result: cellData.value };
          } else if (cellData.type === 'richText' && (cellData as any).richText) {
            cell.value = { richText: (cellData as any).richText };
          } else {
            cell.value = cellData.value as any;
          }
          
          // Apply style
          if (cellData.style) {
            applyStyleToCell(cell, cellData.style as any);
          }
          
          // Apply data validation
          if ((cellData as any).dataValidation) {
            cell.dataValidation = (cellData as any).dataValidation;
          }
          
          // Apply hyperlink
          if ((cellData as any).hyperlink) {
            cell.value = {
              text: cellData.value as string,
              hyperlink: (cellData as any).hyperlink.hyperlink,
            };
          }
          
          // Apply note/comment
          if ((cellData as any).note) {
            cell.note = (cellData as any).note;
          }
        });
      });
      
      // Apply views (freeze panes)
      if (sheetData.properties?.views) {
        worksheet.views = sheetData.properties.views as any;
      }
      
      // Apply auto filter
      if (sheetData.properties?.autoFilter) {
        worksheet.autoFilter = sheetData.properties.autoFilter.ref;
      }
      
      // Apply conditional formatting
      if (sheetData.properties?.conditionalFormattings) {
        sheetData.properties.conditionalFormattings.forEach(cf => {
          worksheet.addConditionalFormatting(cf as any);
        });
      }
      
      // Apply images
      if (sheetData.properties?.images) {
        sheetData.properties.images.forEach(img => {
          // TODO: Implement image adding
          console.warn('[ExcelJS] Image support not yet implemented', img);
        });
      }
      
      // Apply sheet protection
      if (sheetData.properties?.protection) {
        worksheet.protect(
          sheetData.properties.protection.password || '',
          sheetData.properties.protection as any
        );
      }
    }
    
    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
  
  /**
   * Convert StoredCellData to CellData with ExcelJS style support
   */
  static storedCellToCellData(stored: StoredCellData): CellData {
    return {
      value: stored.value,
      type: stored.type,
      formula: stored.formula,
      style: stored.style,
    };
  }
  
  /**
   * Convert CellData to StoredCellData
   */
  static cellDataToStoredCell(
    tabId: string,
    row: number,
    col: number,
    cell: CellData
  ): Omit<StoredCellData, 'id' | 'updatedAt' | 'version'> {
    return {
      tabId,
      row,
      col,
      value: cell.value,
      type: cell.type,
      formula: cell.formula,
      style: cell.style,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a default ExcelCellStyle
 */
export function createDefaultCellStyle(): ExcelCellStyle {
  return {
    font: {
      name: 'Calibri',
      size: 11,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      color: { argb: 'FF000000' },  // Black
    },
    fill: {
      type: 'pattern',
      pattern: 'none',
    },
    alignment: {
      horizontal: 'left',
      vertical: 'bottom',
      wrapText: false,
    },
  };
}

/**
 * Merge two cell styles (override with second style)
 */
export function mergeCellStyles(
  base: ExcelCellStyle | undefined,
  override: ExcelCellStyle | undefined
): ExcelCellStyle | undefined {
  if (!base) return override;
  if (!override) return base;
  
  return {
    font: { ...base.font, ...override.font },
    fill: override.fill || base.fill,
    border: { ...base.border, ...override.border },
    alignment: { ...base.alignment, ...override.alignment },
    numFmt: override.numFmt || base.numFmt,
    protection: { ...base.protection, ...override.protection },
  };
}

/**
 * Check if a cell style has any formatting
 */
export function hasStyle(style: ExcelCellStyle | undefined): boolean {
  if (!style) return false;
  
  return !!(
    style.font ||
    style.fill ||
    style.border ||
    style.alignment ||
    style.numFmt ||
    style.protection
  );
}

/**
 * Clone a cell style
 */
export function cloneCellStyle(style: ExcelCellStyle | undefined): ExcelCellStyle | undefined {
  if (!style) return undefined;
  
  return JSON.parse(JSON.stringify(style));
}
