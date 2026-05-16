/**
 * CSV Integration Layer
 * 
 * Provides a clean interface for reading/writing CSV files.
 * Utilizes the 'xlsx' (SheetJS) library for robust CSV handling across environments.
 */

import * as XLSX from 'xlsx';
import { CellData } from './db';

export class CSVAdapter {
  /**
   * Read CSV from ArrayBuffer
   */
  static async readCSV(
    buffer: ArrayBuffer,
    fileName: string = 'Sheet1'
  ): Promise<{
    sheets: Array<{
      name: string;
      data: CellData[][];
    }>;
  }> {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to 2D array of values
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // Map to Gridpark CellData format
    const data: CellData[][] = jsonData.map(row => 
      row.map((value): CellData => {
        if (value === null || value === undefined) {
          return { value: null, type: 'empty' };
        }
        
        const type = typeof value;
        if (type === 'number') return { value: value as number, type: 'number' };
        if (type === 'boolean') return { value: value as boolean, type: 'boolean' };
        if (value instanceof Date) return { value, type: 'date' };
        
        return { value: String(value), type: 'string' };
      })
    );
    
    return {
      sheets: [{
        name: fileName.replace(/\.csv$/i, '') || 'Sheet1',
        data
      }]
    };
  }

  /**
   * Write CellData to CSV and return ArrayBuffer
   */
  static async writeCSV(
    sheets: Array<{
      name: string;
      data: CellData[][];
    }>
  ): Promise<ArrayBuffer> {
    // CSV only supports one sheet, so we take the first one
    const sheetData = sheets[0];
    if (!sheetData) {
      throw new Error('No sheet data provided for CSV export');
    }

    // Convert CellData[][] to simple values[][] for SheetJS
    const values = sheetData.data.map(row => 
      row.map(cell => cell.value)
    );

    const worksheet = XLSX.utils.aoa_to_sheet(values);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    return encoder.encode(csvContent).buffer;
  }
}
