/**
 * Unit Tests for File Import/Export Formats
 * 
 * Verifies roundtrip fidelity for:
 * - .csv (values only)
 * - .gridpark (full fidelity)
 */

import { CSVAdapter } from '../csv-adapter';
import { GridparkAdapter } from '../gridpark-adapter';
import { ExcelJSAdapter } from '../exceljs-adapter';
import { CellData } from '../db';

describe('File Import/Export Formats', () => {
  const sampleData: CellData[][] = [
    [
      { value: 'Name', type: 'string' },
      { value: 'Score', type: 'string' },
      { value: 'Pass', type: 'string' }
    ],
    [
      { value: 'Alice', type: 'string' },
      { value: 95, type: 'number' },
      { value: true, type: 'boolean' }
    ],
    [
      { value: 'Bob', type: 'string' },
      { value: 82, type: 'number' },
      { value: false, type: 'boolean' }
    ]
  ];

  const sheets = [{
    name: 'TestSheet',
    data: sampleData
  }];

  describe('CSVAdapter', () => {
    it('should successfully roundtrip CSV data (values only)', async () => {
      const buffer = await CSVAdapter.writeCSV(sheets);
      const result = await CSVAdapter.readCSV(buffer, 'test.csv');
      
      expect(result.sheets.length).toBe(1);
      const resultData = result.sheets[0].data;
      
      // Check values
      expect(resultData[0][0].value).toBe('Name');
      expect(resultData[1][1].value).toBe(95);
      expect(resultData[2][2].value).toBe(false);
    });
  });

  describe('GridparkAdapter', () => {
    it('should successfully roundtrip Gridpark data (full fidelity)', async () => {
      // Add some style to test fidelity
      const styledSheets = [{
        name: 'StyledSheet',
        data: [
          [
            { 
              value: 'Styled', 
              type: 'string', 
              style: { font: { bold: true } } as any
            }
          ]
        ]
      }];

      const buffer = await GridparkAdapter.writeWorkbook(styledSheets);
      const result = await GridparkAdapter.readWorkbook(buffer);
      
      expect(result.sheets.length).toBe(1);
      expect(result.sheets[0].name).toBe('StyledSheet');
      expect(result.sheets[0].data[0][0].value).toBe('Styled');
      expect(result.sheets[0].data[0][0].style?.font?.bold).toBe(true);
    });
  });

  describe('ExcelJSAdapter', () => {
    it('should successfully roundtrip XLSX data', async () => {
      const buffer = await ExcelJSAdapter.writeWorkbook(sheets);
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      
      expect(result.sheets.length).toBe(1);
      expect(result.sheets[0].name).toBe('TestSheet');
      
      const resultData = result.sheets[0].data;
      expect(resultData[0][0].value).toBe('Name');
      expect(resultData[1][1].value).toBe(95);
      expect(resultData[2][2].value).toBe(false);
    });

    it('should successfully export and import workbooks with many columns', async () => {
      const COL_COUNT = 100; // More than A-Z (26)
      const manyColumnData: CellData[][] = [
        Array(COL_COUNT).fill(null).map((_, i) => ({
          value: `Col${i}`,
          type: 'string'
        }))
      ];
      
      const manyColSheets = [{
        name: 'ManyColumns',
        data: manyColumnData
      }];

      const buffer = await ExcelJSAdapter.writeWorkbook(manyColSheets);
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      
      expect(result.sheets[0].data[0].length).toBeGreaterThanOrEqual(COL_COUNT);
      expect(result.sheets[0].data[0][COL_COUNT - 1].value).toBe(`Col${COL_COUNT - 1}`);
    });
  });
});
