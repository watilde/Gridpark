/**
 * Bug Condition Exploration Test — ExcelJSデータ変換の欠陥
 *
 * Property 1: Bug Condition — ExcelJS読み込み・書き出し時のデータ損失
 *
 * このテストは修正前のコードでバグの存在を証明するために作成される。
 * 未修正コードでは失敗が期待される（バグの存在を証明）。
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import * as fc from 'fast-check';
import ExcelJS from 'exceljs';
import { ExcelJSAdapter } from '../exceljs-adapter';
import { CellData } from '../db';

describe('Bug Condition Exploration: ExcelJSデータ変換の欠陥', () => {
  /**
   * Bug 2: 数式セルの結果型情報テスト
   *
   * 数式セルを読み込んだ際、数式の計算結果の型情報が保持されるべき。
   * バグ: ExcelJSがfalsy結果（0, false, ""）をシリアライズ時に落とすため、
   * convertExcelJSValueがnullを返し、数式結果が失われる。
   *
   * **Validates: Requirements 1.2**
   */
  describe('Bug 2: 数式セルの結果型情報保持', () => {
    it('property: 数式セルの number 結果（0を含む）は number 型として保持されるべき', async () => {
      // Use oneof to ensure 0 is always tested (0 is the key falsy value)
      const numArb = fc.oneof(
        fc.constant(0),
        fc.integer({ min: -1000, max: 1000 })
      );

      await fc.assert(
        fc.asyncProperty(numArb, async (numResult) => {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sheet1');
          worksheet.getCell(1, 1).value = { formula: 'SUM(1,2)', result: numResult };

          const buffer = await workbook.xlsx.writeBuffer();
          const result = await ExcelJSAdapter.readWorkbook(buffer);
          const formulaCell = result.sheets[0].data[0][0];

          expect(formulaCell.type).toBe('formula');
          expect(formulaCell.formula).toBeDefined();
          // The value (formula result) should be a number, not null
          expect(formulaCell.value).not.toBeNull();
          expect(typeof formulaCell.value).toBe('number');
          expect(formulaCell.value).toBe(numResult);
        }),
        { numRuns: 20 }
      );
    });

    it('property: 数式セルの boolean 結果（falseを含む）は boolean 型として保持されるべき', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (boolResult) => {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sheet1');
          worksheet.getCell(1, 1).value = { formula: 'A1=B1', result: boolResult };

          const buffer = await workbook.xlsx.writeBuffer();
          const result = await ExcelJSAdapter.readWorkbook(buffer);
          const formulaCell = result.sheets[0].data[0][0];

          expect(formulaCell.type).toBe('formula');
          expect(formulaCell.formula).toBeDefined();
          // The value should be boolean, not null
          expect(formulaCell.value).not.toBeNull();
          expect(typeof formulaCell.value).toBe('boolean');
          expect(formulaCell.value).toBe(boolResult);
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Bug 8: writeWorkbook での boolean/Date 型復元テスト
   *
   * writeWorkbook で CellData を書き出す際、boolean/Date 値が
   * 正しい型で ExcelJS セルに設定されるべき。
   * バグ: cellData.value が文字列化されている場合（例: JSON経由）、
   * writeWorkbook はそのまま文字列として書き込み、型情報が失われる。
   *
   * **Validates: Requirements 1.3**
   */
  describe('Bug 8: writeWorkbook での文字列化された boolean/Date の型復元', () => {
    it('property: type=boolean のセルは、value が文字列 "true"/"false" でも boolean として書き出されるべき', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (boolValue) => {
          // Simulate a scenario where boolean was stringified
          const cellData: CellData = {
            value: String(boolValue) as any, // "true" or "false"
            type: 'boolean',
          };

          const buffer = await ExcelJSAdapter.writeWorkbook([
            { name: 'Sheet1', data: [[cellData]] },
          ]);

          const result = await ExcelJSAdapter.readWorkbook(buffer);
          const readCell = result.sheets[0].data[0][0];

          // writeWorkbook should detect type='boolean' and convert string back to boolean
          expect(typeof readCell.value).toBe('boolean');
          expect(readCell.value).toBe(boolValue);
          expect(readCell.type).toBe('boolean');
        }),
        { numRuns: 10 }
      );
    });

    it('property: type=date のセルは、value が ISO文字列でも Date として書き出されるべき', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({
            min: new Date('2000-01-01T00:00:00.000Z'),
            max: new Date('2030-12-31T23:59:59.999Z'),
          }),
          async (dateValue) => {
            // Simulate a scenario where Date was stringified
            const cellData: CellData = {
              value: dateValue.toISOString() as any, // ISO string
              type: 'date',
            };

            const buffer = await ExcelJSAdapter.writeWorkbook([
              { name: 'Sheet1', data: [[cellData]] },
            ]);

            const result = await ExcelJSAdapter.readWorkbook(buffer);
            const readCell = result.sheets[0].data[0][0];

            // writeWorkbook should detect type='date' and convert string back to Date
            expect(readCell.value).toBeInstanceOf(Date);
            expect(readCell.type).toBe('date');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Bug 1/8: boolean値のラウンドトリップ型保持テスト（参考）
   *
   * boolean セルの直接的な read→write→read ラウンドトリップ。
   * 現在のコードでは boolean/Date の直接読み書きは正しく動作するが、
   * 文字列化経路を通った場合に型が失われることを上記テストで証明する。
   *
   * **Validates: Requirements 1.1, 1.3**
   */
  describe('Bug 1/8: boolean/Date 直接ラウンドトリップ（参考ベースライン）', () => {
    it('property: boolean セルの直接 read→write→read ラウンドトリップで型が保持される', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (boolValue) => {
          const originalWorkbook = new ExcelJS.Workbook();
          const originalSheet = originalWorkbook.addWorksheet('Sheet1');
          originalSheet.getCell(1, 1).value = boolValue;

          const buffer1 = await originalWorkbook.xlsx.writeBuffer();
          const readResult = await ExcelJSAdapter.readWorkbook(buffer1);
          const sheetData = readResult.sheets[0];

          const buffer2 = await ExcelJSAdapter.writeWorkbook([
            { name: sheetData.name, data: sheetData.data, properties: sheetData.properties },
          ]);

          const roundTripResult = await ExcelJSAdapter.readWorkbook(buffer2);
          const roundTripCell = roundTripResult.sheets[0].data[0][0];

          expect(typeof roundTripCell.value).toBe('boolean');
          expect(roundTripCell.value).toBe(boolValue);
          expect(roundTripCell.type).toBe('boolean');
        }),
        { numRuns: 10 }
      );
    });

    it('property: Date セルの直接 read→write→read ラウンドトリップで型が保持される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({
            min: new Date('2000-01-01T00:00:00.000Z'),
            max: new Date('2030-12-31T23:59:59.999Z'),
          }),
          async (dateValue) => {
            const originalWorkbook = new ExcelJS.Workbook();
            const originalSheet = originalWorkbook.addWorksheet('Sheet1');
            originalSheet.getCell(1, 1).value = dateValue;

            const buffer1 = await originalWorkbook.xlsx.writeBuffer();
            const readResult = await ExcelJSAdapter.readWorkbook(buffer1);
            const sheetData = readResult.sheets[0];

            const buffer2 = await ExcelJSAdapter.writeWorkbook([
              { name: sheetData.name, data: sheetData.data, properties: sheetData.properties },
            ]);

            const roundTripResult = await ExcelJSAdapter.readWorkbook(buffer2);
            const roundTripCell = roundTripResult.sheets[0].data[0][0];

            expect(roundTripCell.value).toBeInstanceOf(Date);
            expect(roundTripCell.type).toBe('date');
            if (roundTripCell.value instanceof Date) {
              const diffMs = Math.abs(roundTripCell.value.getTime() - dateValue.getTime());
              expect(diffMs).toBeLessThan(1000);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
