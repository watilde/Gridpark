/**
 * Bug Condition Exploration Test — コード品質問題
 *
 * Property 1: Bug Condition — デッドコード・型不整合
 *
 * このテストは修正後のコードでコード品質問題が解決されたことを確認する。
 * 修正後コードでは成功が期待される（問題が修正されたことを証明）。
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { ExcelJSAdapter } from '../exceljs-adapter';
import { StoredCellData } from '../db';

// ============================================================================
// Bug 10: storedCellToCellData の style が ExcelCellStyle | CellStyle union型に
//         統一され、as any キャストが不要になった
// ============================================================================

describe('Bug 10: storedCellToCellData の style 型統一（修正後）', () => {

  /**
   * Bug 10 修正後: readWorkbook 経由で取得した CellData.style は ExcelCellStyle 構造を
   * 正しく保持する。CellData.style の型が ExcelCellStyle | CellStyle に変更されたため、
   * ExcelCellStyle のフィールド（font, fill等）がそのまま格納されるのが正しい動作。
   *
   * **Validates: Requirements 4.2**
   */
  it('property: readWorkbook 経由で取得した CellData.style は ExcelCellStyle 構造を正しく保持する', async () => {
    const hexChars = '0123456789ABCDEF';
    const hexCharArb = fc.constantFrom(...hexChars.split(''));
    const colorArb = fc.tuple(hexCharArb, hexCharArb, hexCharArb, hexCharArb, hexCharArb, hexCharArb)
      .map(chars => chars.join(''));

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bold: fc.boolean(),
          italic: fc.boolean(),
          size: fc.integer({ min: 8, max: 72 }),
          name: fc.constantFrom('Arial', 'Calibri', 'Times New Roman'),
        }),
        colorArb,
        async (fontProps, colorHex) => {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sheet1');
          const cell = worksheet.getCell(1, 1);
          cell.value = 'styled text';
          cell.font = {
            name: fontProps.name,
            size: fontProps.size,
            bold: fontProps.bold,
            italic: fontProps.italic,
            color: { argb: 'FF' + colorHex },
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' },
          };

          const buffer = await workbook.xlsx.writeBuffer();
          const result = await ExcelJSAdapter.readWorkbook(buffer);
          const cellData = result.sheets[0].data[0][0];

          expect(cellData.style).toBeDefined();

          if (cellData.style) {
            const style = cellData.style as Record<string, unknown>;

            // After Bug 10 fix: CellData.style is ExcelCellStyle | CellStyle
            // ExcelCellStyle has structured objects (font, fill, border, etc.)
            // This is now the CORRECT behavior — ExcelCellStyle is properly typed
            const hasFontAsObject = typeof style['font'] === 'object' && style['font'] !== null;
            const hasFillAsObject = typeof style['fill'] === 'object' && style['fill'] !== null;

            // Fixed: style correctly contains ExcelCellStyle fields
            expect(hasFontAsObject).toBe(true);
            expect(hasFillAsObject).toBe(true);
          }
        }
      ),
      { numRuns: 15 }
    );
  });



  it('property: storedCellToCellData のラウンドトリップで style が ExcelCellStyle 構造を維持する', () => {
    fc.assert(
      fc.property(
        fc.record({
          font: fc.option(
            fc.record({
              name: fc.constantFrom('Arial', 'Calibri'),
              size: fc.integer({ min: 8, max: 36 }),
              bold: fc.boolean(),
              italic: fc.boolean(),
            }),
            { nil: undefined }
          ),
          fill: fc.option(
            fc.record({
              type: fc.constant('pattern' as const),
              pattern: fc.constant('solid' as const),
              fgColor: fc.option(
                fc.record({ argb: fc.constant('FFFF0000') }),
                { nil: undefined }
              ),
            }),
            { nil: undefined }
          ),
        }),
        (excelStyle) => {
          // After Bug 10 fix: StoredCellData.style accepts ExcelCellStyle directly
          const stored: StoredCellData = {
            tabId: 'test',
            row: 0,
            col: 0,
            value: 'test',
            type: 'string',
            style: excelStyle as any, // ExcelCellStyle is now a valid type for style
            updatedAt: new Date(),
            version: 1,
          };

          const cellData = ExcelJSAdapter.storedCellToCellData(stored);

          if (cellData.style) {
            const style = cellData.style as Record<string, unknown>;
            const hasFontObject = typeof style['font'] === 'object' && style['font'] !== null;
            const hasFillObject = typeof style['fill'] === 'object' && style['fill'] !== null;

            // Fixed: storedCellToCellData correctly passes through ExcelCellStyle
            // The type system now properly supports this
            if (excelStyle.font) {
              expect(hasFontObject).toBe(true);
            }
            if (excelStyle.fill) {
              expect(hasFillObject).toBe(true);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});


// ============================================================================
// Bug 9: SpreadsheetGrid.tsx の CellData インターフェースが削除され、
//        excel.ts の CellData を使用するようになった
// ============================================================================

describe('Bug 9: SpreadsheetGrid.tsx の CellData 重複が解消（修正後）', () => {
  /**
   * Bug 9 修正後: SpreadsheetGrid.tsx (v1) は独自の CellData インターフェースを
   * 定義しなくなり、excel.ts の CellData をインポートして使用する。
   *
   * **Validates: Requirements 4.1**
   */
  it('property: SpreadsheetGrid.tsx は独自の CellData インターフェースを定義していない', () => {
    const spreadsheetGridPath = path.resolve(
      __dirname,
      '../../renderer/features/workbook/components/SpreadsheetGrid.tsx'
    );

    const spreadsheetGridSource = fs.readFileSync(spreadsheetGridPath, 'utf-8');

    // After Bug 9 fix: SpreadsheetGrid.tsx should NOT have a local CellData interface
    const sgCellDataMatch = spreadsheetGridSource.match(
      /interface\s+CellData\s*\{([^}]+)\}/
    );

    // Fixed: No duplicate CellData interface exists
    expect(sgCellDataMatch).toBeNull();
  });

  it('property: SpreadsheetGrid.tsx は excel.ts の CellData をインポートしている', () => {
    const spreadsheetGridPath = path.resolve(
      __dirname,
      '../../renderer/features/workbook/components/SpreadsheetGrid.tsx'
    );

    const spreadsheetGridSource = fs.readFileSync(spreadsheetGridPath, 'utf-8');

    // After Bug 9 fix: SpreadsheetGrid.tsx imports CellData from the canonical location
    const importMatch = spreadsheetGridSource.match(
      /import\s+.*CellData.*from\s+['"].*types\/excel['"]/
    );

    // Fixed: CellData is imported from the canonical types/excel module
    expect(importMatch).not.toBeNull();
  });

  it('property: SpreadsheetGrid.tsx は deprecated マークが付いている', () => {
    const spreadsheetGridPath = path.resolve(
      __dirname,
      '../../renderer/features/workbook/components/SpreadsheetGrid.tsx'
    );

    const spreadsheetGridSource = fs.readFileSync(spreadsheetGridPath, 'utf-8');

    // After Bug 9 fix: SpreadsheetGrid.tsx should be marked as deprecated
    const hasDeprecated = spreadsheetGridSource.includes('@deprecated');

    expect(hasDeprecated).toBe(true);
  });
});
