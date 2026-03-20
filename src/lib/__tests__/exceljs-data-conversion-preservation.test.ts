/**
 * Preservation Property Test — 既存の正常なデータ変換動作の保持（修正前に実施）
 *
 * Property 2: Preservation — 非バグ条件でのデータ変換の正常動作
 *
 * 観察優先方法論に従い、未修正コードでの正常動作をベースラインとして記録する。
 * バグ条件に該当しない全入力（string, number, null, error, richText）に対して、
 * 変換結果が期待通りであることを検証する。
 *
 * 未修正コードでテスト実行 — **成功が期待される**（ベースライン動作の確認）
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import * as fc from 'fast-check';
import ExcelJS from 'exceljs';
import { ExcelJSAdapter } from '../exceljs-adapter';
import { CellData } from '../db';

// ============================================================================
// Observation Tests — 個別の動作確認
// ============================================================================

describe('Preservation: 非バグ条件でのデータ変換の正常動作', () => {
  /**
   * 観察: convertExcelJSValue(stringCell) が文字列値を正しく返す（未修正コード）
   */
  describe('観察: 文字列セルの変換', () => {
    it('文字列セルを読み込むと string 型・string 値で返される', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sheet1');
      ws.getCell(1, 1).value = 'hello world';

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('string');
      expect(cell.value).toBe('hello world');
      expect(typeof cell.value).toBe('string');
    });
  });

  /**
   * 観察: convertExcelJSValue(numberCell) が数値を正しく返す（未修正コード）
   */
  describe('観察: 数値セルの変換', () => {
    it('数値セルを読み込むと number 型・number 値で返される', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sheet1');
      ws.getCell(1, 1).value = 42;

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('number');
      expect(cell.value).toBe(42);
      expect(typeof cell.value).toBe('number');
    });
  });

  /**
   * 観察: convertExcelJSType が string/number/empty/error/richText を正しく判定する（未修正コード）
   */
  describe('観察: セル型の判定', () => {
    it('空セルは empty 型として判定される', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sheet1');
      // Write a value in row 2 to ensure row 1 exists in the sheet
      ws.getCell(2, 1).value = 'anchor';

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      // Cell (1,2) should be empty since we only wrote to (2,1)
      const emptyCell = result.sheets[0].data[0][1];

      expect(emptyCell.type).toBe('empty');
      expect(emptyCell.value).toBeNull();
    });

    it('エラーセルは error 型として判定される', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sheet1');
      ws.getCell(1, 1).value = { error: { message: '#DIV/0!' } } as any;

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('error');
    });

    it('リッチテキストセルはプレーンテキストに変換される', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sheet1');
      ws.getCell(1, 1).value = {
        richText: [
          { text: 'Hello ' },
          { text: 'World', font: { bold: true } },
        ],
      } as any;

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      // richText is converted to plain string by convertExcelJSValue
      expect(cell.value).toBe('Hello World');
    });
  });

  /**
   * 観察: writeWorkbook が string/number セルを正しく書き出す（未修正コード）
   */
  describe('観察: writeWorkbook の string/number 書き出し', () => {
    it('string セルを書き出して再読み込みすると同じ値が返される', async () => {
      const cellData: CellData = { value: 'test string', type: 'string' };
      const buffer = await ExcelJSAdapter.writeWorkbook([
        { name: 'Sheet1', data: [[cellData]] },
      ]);

      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('string');
      expect(cell.value).toBe('test string');
    });

    it('number セルを書き出して再読み込みすると同じ値が返される', async () => {
      const cellData: CellData = { value: 99.5, type: 'number' };
      const buffer = await ExcelJSAdapter.writeWorkbook([
        { name: 'Sheet1', data: [[cellData]] },
      ]);

      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('number');
      expect(cell.value).toBe(99.5);
    });
  });


  // ============================================================================
  // Property-Based Tests — 非バグ条件の全入力に対する保持検証
  // ============================================================================

  /**
   * プロパティベーステスト: バグ条件に該当しない全入力に対して、
   * 変換結果が期待通りであること
   *
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  describe('PBT: 非バグ条件での read→write→read ラウンドトリップ', () => {
    it('property: 任意の string 値は read→write→read で保持される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (strValue) => {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Sheet1');
            ws.getCell(1, 1).value = strValue;

            const buffer1 = await workbook.xlsx.writeBuffer();
            const readResult = await ExcelJSAdapter.readWorkbook(buffer1);
            const sheetData = readResult.sheets[0];

            // Verify read
            expect(sheetData.data[0][0].type).toBe('string');
            expect(sheetData.data[0][0].value).toBe(strValue);

            // Write back and re-read
            const buffer2 = await ExcelJSAdapter.writeWorkbook([
              { name: sheetData.name, data: sheetData.data, properties: sheetData.properties },
            ]);
            const roundTrip = await ExcelJSAdapter.readWorkbook(buffer2);
            const cell = roundTrip.sheets[0].data[0][0];

            expect(cell.type).toBe('string');
            expect(cell.value).toBe(strValue);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('property: 任意の number 値は read→write→read で保持される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.integer({ min: -100000, max: 100000 }),
            fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true })
          ),
          async (numValue) => {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Sheet1');
            ws.getCell(1, 1).value = numValue;

            const buffer1 = await workbook.xlsx.writeBuffer();
            const readResult = await ExcelJSAdapter.readWorkbook(buffer1);
            const sheetData = readResult.sheets[0];

            // Verify read
            expect(sheetData.data[0][0].type).toBe('number');
            expect(typeof sheetData.data[0][0].value).toBe('number');

            // Write back and re-read
            const buffer2 = await ExcelJSAdapter.writeWorkbook([
              { name: sheetData.name, data: sheetData.data, properties: sheetData.properties },
            ]);
            const roundTrip = await ExcelJSAdapter.readWorkbook(buffer2);
            const cell = roundTrip.sheets[0].data[0][0];

            expect(cell.type).toBe('number');
            expect(typeof cell.value).toBe('number');
            // Use approximate comparison for floating point
            expect(cell.value).toBeCloseTo(numValue as number, 10);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('property: null/empty セルは read→write→read で empty のまま保持される', async () => {
      const cellData: CellData = { value: null, type: 'empty' };
      const buffer = await ExcelJSAdapter.writeWorkbook([
        { name: 'Sheet1', data: [[cellData, { value: 'anchor', type: 'string' }]] },
      ]);

      const result = await ExcelJSAdapter.readWorkbook(buffer);
      const cell = result.sheets[0].data[0][0];

      expect(cell.type).toBe('empty');
      expect(cell.value).toBeNull();
    });

    it('property: richText セルはプレーンテキスト文字列として保持される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (textParts) => {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Sheet1');
            ws.getCell(1, 1).value = {
              richText: textParts.map(text => ({ text })),
            } as any;

            const buffer = await workbook.xlsx.writeBuffer();
            const result = await ExcelJSAdapter.readWorkbook(buffer);
            const cell = result.sheets[0].data[0][0];

            const expectedText = textParts.join('');
            expect(cell.value).toBe(expectedText);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('PBT: writeWorkbook の string/number 書き出し保持', () => {
    it('property: 任意の string CellData を writeWorkbook で書き出すと正しく保存される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (strValue) => {
            const cellData: CellData = { value: strValue, type: 'string' };
            const buffer = await ExcelJSAdapter.writeWorkbook([
              { name: 'Sheet1', data: [[cellData]] },
            ]);

            const result = await ExcelJSAdapter.readWorkbook(buffer);
            const cell = result.sheets[0].data[0][0];

            expect(cell.type).toBe('string');
            expect(cell.value).toBe(strValue);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('property: 任意の number CellData を writeWorkbook で書き出すと正しく保存される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.integer({ min: -100000, max: 100000 }),
            fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true })
          ),
          async (numValue) => {
            const cellData: CellData = { value: numValue, type: 'number' };
            const buffer = await ExcelJSAdapter.writeWorkbook([
              { name: 'Sheet1', data: [[cellData]] },
            ]);

            const result = await ExcelJSAdapter.readWorkbook(buffer);
            const cell = result.sheets[0].data[0][0];

            expect(cell.type).toBe('number');
            expect(typeof cell.value).toBe('number');
            expect(cell.value).toBeCloseTo(numValue as number, 10);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
