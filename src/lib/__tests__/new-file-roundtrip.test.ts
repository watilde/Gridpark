/**
 * Property-Based Test — 新規Workbookのラウンドトリップ整合性
 *
 * Feature: new-file-excel-creation
 * Property 1: 新規Workbookのラウンドトリップ整合性
 *
 * 任意の有効なシート名で ExcelJSAdapter.writeWorkbook → ExcelJSAdapter.readWorkbook の
 * ラウンドトリップを検証し、シート名が保持されること、データが空であることを確認する。
 *
 * **Validates: Requirements 1.4**
 */

import * as fc from 'fast-check';
import { ExcelJSAdapter } from '../exceljs-adapter';

describe('Property 1: 新規Workbookのラウンドトリップ整合性', () => {
  // Feature: new-file-excel-creation, Property 1: 新規Workbookのラウンドトリップ整合性
  it('property: 任意のシート名で作成したWorkbookはラウンドトリップで構造が保持される', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 31 })
          .filter(name => !/[:\\/?*\[\]]/.test(name))
          .filter(name => name.trim().length > 0)
          .filter(name => !name.startsWith("'") && !name.endsWith("'")),
        async (sheetName) => {
          const buffer = await ExcelJSAdapter.writeWorkbook([{
            name: sheetName,
            data: [],
          }]);
          const result = await ExcelJSAdapter.readWorkbook(buffer);
          expect(result.sheets.length).toBe(1);
          expect(result.sheets[0].name).toBe(sheetName);
          for (const row of result.sheets[0].data) {
            for (const cell of row) {
              expect(cell.type).toBe('empty');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
