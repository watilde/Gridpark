/**
 * Gridpark Native Format Adapter
 * 
 * Provides a high-fidelity serialization for the .gridpark format.
 * Currently uses a structured JSON-based bundle to ensure 100% data preservation.
 */

import { CellData } from './db';
import { ExcelSheetProperties } from './exceljs-types';

export interface GridparkWorkbookState {
  formatVersion: string;
  application: string;
  timestamp: string;
  sheets: Array<{
    name: string;
    data: CellData[][];
    properties?: ExcelSheetProperties;
  }>;
}

export class GridparkAdapter {
  private static FORMAT_VERSION = '1.0.0';

  /**
   * Serialize workbook data to .gridpark format (ArrayBuffer)
   */
  static async writeWorkbook(
    sheets: Array<{
      name: string;
      data: CellData[][];
      properties?: ExcelSheetProperties;
    }>
  ): Promise<ArrayBuffer> {
    const state: GridparkWorkbookState = {
      formatVersion: this.FORMAT_VERSION,
      application: 'Gridpark',
      timestamp: new Date().toISOString(),
      sheets
    };

    const jsonString = JSON.stringify(state);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString).buffer;
  }

  /**
   * Deserialize .gridpark format back to workbook data
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
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(buffer);
    
    try {
      const state = JSON.parse(jsonString) as GridparkWorkbookState;
      
      // Basic validation
      if (state.application !== 'Gridpark') {
        console.warn('[GridparkAdapter] File might not be a valid Gridpark file');
      }

      return {
        sheets: state.sheets
      };
    } catch (error) {
      console.error('[GridparkAdapter] Failed to parse .gridpark file', error);
      throw new Error('Invalid .gridpark file format');
    }
  }
}
