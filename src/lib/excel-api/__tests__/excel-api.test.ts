import { Excel } from '../context';
import { db } from '../../db';

describe('Excel JavaScript API Core Objects', () => {
  beforeEach(async () => {
    // Clear and prepare Sheet1
    await db.upsertSheetMetadata({
      tabId: 'Sheet1',
      workbookId: 'main',
      sheetName: 'Sheet1',
      sheetIndex: 0,
      maxRow: 0,
      maxCol: 0,
      cellCount: 0,
      dirty: false
    });
    await db.clearSheetCells('Sheet1');
  });

  it('should set and get values in a range via Excel.run', async () => {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('A1:B2');
      range.values = [[1, 2], [3, 4]];
      await context.sync();
    });

    const cells = await db.getCellsAs2DArray('Sheet1', 2, 2);
    expect(cells[0][0].value).toBe(1);
    expect(cells[0][1].value).toBe(2);
    expect(cells[1][0].value).toBe(3);
    expect(cells[1][1].value).toBe(4);
  });

  it('should load properties from the database after sync', async () => {
    // Pre-populate data
    await db.save2DArrayAsCells('Sheet1', [
      [{ value: 'API Test', type: 'string' }]
    ]);

    let loadedValue = '';
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('A1');
      range.load('values');
      await context.sync();
      loadedValue = range.values[0][0];
    });

    expect(loadedValue).toBe('API Test');
  });

  it('should support formulas and loading them', async () => {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('C1');
      range.formulas = [['=A1+B1']];
      await context.sync();
    });

    let loadedFormula = '';
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('C1');
      range.load('formulas');
      await context.sync();
      loadedFormula = range.formulas[0][0];
    });

    expect(loadedFormula).toBe('=A1+B1');
  });

  it('should throw error if property is accessed before load/sync', async () => {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('A1');
      
      expect(() => {
        const v = range.values;
      }).toThrow(/Property 'values' is not loaded/);
    });
  });

  it('should support range metadata properties', async () => {
    let rowCount = 0;
    let colCount = 0;
    
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('A1:C5');
      range.load(['rowCount', 'columnCount']);
      await context.sync();
      rowCount = range.rowCount;
      colCount = range.columnCount;
    });

    expect(rowCount).toBe(5);
    expect(colCount).toBe(3);
  });

  it('should support range formatting (font and fill)', async () => {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange('A1');
      range.format.font.bold = true;
      range.format.fill.color = '#FF0000';
      await context.sync();
    });

    const cell = await db.getCell('Sheet1', 0, 0);
    expect(cell?.style?.font?.bold).toBe(true);
    expect((cell?.style as any)?.backgroundColor).toBe('#FF0000');
  });
});
