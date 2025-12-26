/**
 * Cell Styling Hook
 * 
 * Manages cell styling with ExcelJS integration
 * - Apply styles to selected cells
 * - Retrieve current cell styles
 * - Batch style updates
 * - Integration with in-memory database storage
 */

import { useCallback, useMemo } from 'react';
import { db, CellStyleData } from '../../lib/db';
import { ExcelCellStyle, ExcelFont, ExcelFill, ExcelBorder, ExcelAlignment } from '../../lib/exceljs-types';

// ============================================================================
// Convert between ExcelJS style and our storage format
// ============================================================================

/**
 * Convert ExcelCellStyle to our simplified CellStyleData format
 * This is a bridge until we fully migrate to ExcelJS styles in DB
 */
function excelStyleToStorageStyle(excelStyle: ExcelCellStyle): CellStyleData {
  const style: CellStyleData = {};
  
  // Font
  if (excelStyle.font) {
    if (excelStyle.font.name) style.fontFamily = excelStyle.font.name;
    if (excelStyle.font.size) style.fontSize = `${excelStyle.font.size}px`;
    if (excelStyle.font.bold) style.fontWeight = 'bold';
    if (excelStyle.font.italic) style.fontStyle = 'italic';
    if (excelStyle.font.color?.argb) {
      // Convert ARGB to RGB hex
      const argb = excelStyle.font.color.argb;
      const rgb = argb.length === 8 ? `#${argb.substring(2)}` : argb;
      style.color = rgb;
    }
  }
  
  // Fill (background color)
  if (excelStyle.fill && excelStyle.fill.type === 'pattern') {
    const patternFill = excelStyle.fill;
    if (patternFill.fgColor?.argb) {
      const argb = patternFill.fgColor.argb;
      const rgb = argb.length === 8 ? `#${argb.substring(2)}` : argb;
      style.backgroundColor = rgb;
    }
  }
  
  // Alignment
  if (excelStyle.alignment) {
    if (excelStyle.alignment.horizontal) {
      style.textAlign = excelStyle.alignment.horizontal;
    }
    if (excelStyle.alignment.vertical) {
      style.verticalAlign = excelStyle.alignment.vertical;
    }
  }
  
  // Border (simplified - just set all borders)
  if (excelStyle.border) {
    const borderParts: string[] = [];
    
    if (excelStyle.border.top) {
      const weight = excelStyle.border.top.style === 'thin' ? '1px' : 
                     excelStyle.border.top.style === 'medium' ? '2px' : '3px';
      borderParts.push(weight, 'solid');
      
      if (excelStyle.border.top.color?.argb) {
        const argb = excelStyle.border.top.color.argb;
        const rgb = argb.length === 8 ? `#${argb.substring(2)}` : argb;
        borderParts.push(rgb);
      } else {
        borderParts.push('#000000');
      }
    }
    
    if (borderParts.length > 0) {
      style.border = borderParts.join(' ');
    }
  }
  
  return style;
}

/**
 * Convert our CellStyleData to ExcelCellStyle
 */
function storageStyleToExcelStyle(storageStyle: CellStyleData): ExcelCellStyle {
  const excelStyle: ExcelCellStyle = {};
  
  // Font
  const font: ExcelFont = {};
  if (storageStyle.fontFamily) font.name = storageStyle.fontFamily;
  if (storageStyle.fontSize) {
    const size = parseInt(storageStyle.fontSize);
    if (!isNaN(size)) font.size = size;
  }
  if (storageStyle.fontWeight === 'bold') font.bold = true;
  if (storageStyle.fontStyle === 'italic') font.italic = true;
  if (storageStyle.color) {
    // Convert RGB hex to ARGB
    const rgb = storageStyle.color.replace('#', '');
    font.color = { argb: `FF${rgb}` };
  }
  
  if (Object.keys(font).length > 0) {
    excelStyle.font = font;
  }
  
  // Fill
  if (storageStyle.backgroundColor) {
    const rgb = storageStyle.backgroundColor.replace('#', '');
    excelStyle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${rgb}` },
    };
  }
  
  // Alignment
  const alignment: ExcelAlignment = {};
  if (storageStyle.textAlign) {
    alignment.horizontal = storageStyle.textAlign as any;
  }
  if (storageStyle.verticalAlign) {
    alignment.vertical = storageStyle.verticalAlign as any;
  }
  
  if (Object.keys(alignment).length > 0) {
    excelStyle.alignment = alignment;
  }
  
  return excelStyle;
}

// ============================================================================
// Hook
// ============================================================================

export interface UseCellStylingOptions {
  tabId: string;
}

export interface UseCellStylingReturn {
  /**
   * Apply font style to a cell
   */
  applyFontStyle: (row: number, col: number, font: Partial<ExcelFont>) => Promise<void>;
  
  /**
   * Apply fill style to a cell
   */
  applyFillStyle: (row: number, col: number, fill: ExcelFill) => Promise<void>;
  
  /**
   * Apply border style to a cell
   */
  applyBorderStyle: (row: number, col: number, border: ExcelBorder) => Promise<void>;
  
  /**
   * Apply alignment to a cell
   */
  applyAlignment: (row: number, col: number, alignment: ExcelAlignment) => Promise<void>;
  
  /**
   * Apply complete style to a cell
   */
  applyCellStyle: (row: number, col: number, style: ExcelCellStyle) => Promise<void>;
  
  /**
   * Get current style of a cell
   */
  getCellStyle: (row: number, col: number) => Promise<ExcelCellStyle | undefined>;
  
  /**
   * Apply style to multiple cells (batch)
   */
  applyStyleToRange: (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    style: ExcelCellStyle
  ) => Promise<void>;
  
  /**
   * Clear all styles from a cell
   */
  clearCellStyle: (row: number, col: number) => Promise<void>;
}

export function useCellStyling({ tabId }: UseCellStylingOptions): UseCellStylingReturn {
  // ========================================================================
  // Apply font style
  // ========================================================================
  
  const applyFontStyle = useCallback(
    async (row: number, col: number, font: Partial<ExcelFont>) => {
      const cell = await db.getCell(tabId, row, col);
      const currentStyle = cell?.style ? storageStyleToExcelStyle(cell.style) : {};
      
      const newStyle: ExcelCellStyle = {
        ...currentStyle,
        font: {
          ...currentStyle.font,
          ...font,
        },
      };
      
      const storageStyle = excelStyleToStorageStyle(newStyle);
      
      await db.upsertCell(tabId, row, col, { style: storageStyle });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Apply fill style
  // ========================================================================
  
  const applyFillStyle = useCallback(
    async (row: number, col: number, fill: ExcelFill) => {
      const cell = await db.getCell(tabId, row, col);
      const currentStyle = cell?.style ? storageStyleToExcelStyle(cell.style) : {};
      
      const newStyle: ExcelCellStyle = {
        ...currentStyle,
        fill,
      };
      
      const storageStyle = excelStyleToStorageStyle(newStyle);
      
      await db.upsertCell(tabId, row, col, { style: storageStyle });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Apply border style
  // ========================================================================
  
  const applyBorderStyle = useCallback(
    async (row: number, col: number, border: ExcelBorder) => {
      const cell = await db.getCell(tabId, row, col);
      const currentStyle = cell?.style ? storageStyleToExcelStyle(cell.style) : {};
      
      const newStyle: ExcelCellStyle = {
        ...currentStyle,
        border,
      };
      
      const storageStyle = excelStyleToStorageStyle(newStyle);
      
      await db.upsertCell(tabId, row, col, { style: storageStyle });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Apply alignment
  // ========================================================================
  
  const applyAlignment = useCallback(
    async (row: number, col: number, alignment: ExcelAlignment) => {
      const cell = await db.getCell(tabId, row, col);
      const currentStyle = cell?.style ? storageStyleToExcelStyle(cell.style) : {};
      
      const newStyle: ExcelCellStyle = {
        ...currentStyle,
        alignment,
      };
      
      const storageStyle = excelStyleToStorageStyle(newStyle);
      
      await db.upsertCell(tabId, row, col, { style: storageStyle });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Apply complete style
  // ========================================================================
  
  const applyCellStyle = useCallback(
    async (row: number, col: number, style: ExcelCellStyle) => {
      const storageStyle = excelStyleToStorageStyle(style);
      
      await db.upsertCell(tabId, row, col, { style: storageStyle });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Get cell style
  // ========================================================================
  
  const getCellStyle = useCallback(
    async (row: number, col: number): Promise<ExcelCellStyle | undefined> => {
      const cell = await db.getCell(tabId, row, col);
      if (!cell?.style) return undefined;
      
      return storageStyleToExcelStyle(cell.style);
    },
    [tabId]
  );
  
  // ========================================================================
  // Apply style to range (batch)
  // ========================================================================
  
  const applyStyleToRange = useCallback(
    async (
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      style: ExcelCellStyle
    ) => {
      const storageStyle = excelStyleToStorageStyle(style);
      const updates: Array<{ row: number; col: number; data: any }> = [];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          updates.push({
            row,
            col,
            data: { style: storageStyle },
          });
        }
      }
      
      await db.bulkUpsertCells(tabId, updates);
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Clear cell style
  // ========================================================================
  
  const clearCellStyle = useCallback(
    async (row: number, col: number) => {
      await db.upsertCell(tabId, row, col, { style: undefined });
      await db.markSheetDirty(tabId, true);
    },
    [tabId]
  );
  
  // ========================================================================
  // Return memoized object to prevent infinite re-renders
  // ========================================================================
  
  return useMemo(
    () => ({
      applyFontStyle,
      applyFillStyle,
      applyBorderStyle,
      applyAlignment,
      applyCellStyle,
      getCellStyle,
      applyStyleToRange,
      clearCellStyle,
    }),
    [
      applyFontStyle,
      applyFillStyle,
      applyBorderStyle,
      applyAlignment,
      applyCellStyle,
      getCellStyle,
      applyStyleToRange,
      clearCellStyle,
    ]
  );
}
