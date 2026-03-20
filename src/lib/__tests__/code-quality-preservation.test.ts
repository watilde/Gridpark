/**
 * 保存プロパティテスト — 既存のコード品質関連動作の保持（修正前に実施）
 *
 * Property 2: Preservation — 型変換・データフローの正常動作
 *
 * 観察優先方法論に従い、未修正コードでの正常動作をベースラインとして記録する。
 * storedCellToCellData / cellDataToStoredCell の変換が正しく動作することを検証する。
 *
 * 未修正コードでテスト実行 — **成功が期待される**（ベースライン動作の確認）
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import * as fc from 'fast-check';
import { ExcelJSAdapter } from '../exceljs-adapter';
import { StoredCellData, CellData, CellType, CellValue } from '../db';

// ============================================================================
// Observation Tests — 個別の動作確認
// ============================================================================

describe('Preservation: 型変換・データフローの正常動作', () => {

  // --------------------------------------------------------------------------
  // 観察: storedCellToCellData が StoredCellData を CellData に正しく変換する
  // --------------------------------------------------------------------------

  describe('観察: storedCellToCellData の変換', () => {
    it('string セルの StoredCellData を CellData に正しく変換する', () => {
      const stored: StoredCellData = {
        tabId: 'tab1',
        row: 0,
        col: 0,
        value: 'hello',
        type: 'string',
        updatedAt: new Date(),
        version: 1,
      };

      const cellData = ExcelJSAdapter.storedCellToCellData(stored);

      expect(cellData.value).toBe('hello');
      expect(cellData.type).toBe('string');
      expect(cellData.formula).toBeUndefined();
      expect(cellData.style).toBeUndefined();
    });

    it('number セルの StoredCellData を CellData に正しく変換する', () => {
      const stored: StoredCellData = {
        tabId: 'tab1',
        row: 1,
        col: 2,
        value: 42.5,
        type: 'number',
        updatedAt: new Date(),
        version: 1,
      };

      const cellData = ExcelJSAdapter.storedCellToCellData(stored);

      expect(cellData.value).toBe(42.5);
      expect(cellData.type).toBe('number');
    });


    it('formula セルの StoredCellData を CellData に正しく変換する', () => {
      const stored: StoredCellData = {
        tabId: 'tab1',
        row: 0,
        col: 0,
        value: 100,
        type: 'formula',
        formula: 'SUM(A1:A10)',
        updatedAt: new Date(),
        version: 1,
      };

      const cellData = ExcelJSAdapter.storedCellToCellData(stored);

      expect(cellData.value).toBe(100);
      expect(cellData.type).toBe('formula');
      expect(cellData.formula).toBe('SUM(A1:A10)');
    });

    it('empty セルの StoredCellData を CellData に正しく変換する', () => {
      const stored: StoredCellData = {
        tabId: 'tab1',
        row: 0,
        col: 0,
        value: null,
        type: 'empty',
        updatedAt: new Date(),
        version: 1,
      };

      const cellData = ExcelJSAdapter.storedCellToCellData(stored);

      expect(cellData.value).toBeNull();
      expect(cellData.type).toBe('empty');
    });

    it('style 付き StoredCellData を CellData に正しく変換する', () => {
      const stored: StoredCellData = {
        tabId: 'tab1',
        row: 0,
        col: 0,
        value: 'styled',
        type: 'string',
        style: { backgroundColor: '#FF0000', color: '#FFFFFF' },
        updatedAt: new Date(),
        version: 1,
      };

      const cellData = ExcelJSAdapter.storedCellToCellData(stored);

      expect(cellData.value).toBe('styled');
      expect(cellData.style).toBeDefined();
      expect(cellData.style).toEqual({ backgroundColor: '#FF0000', color: '#FFFFFF' });
    });
  });

  // --------------------------------------------------------------------------
  // 観察: cellDataToStoredCell が CellData を StoredCellData に正しく変換する
  // --------------------------------------------------------------------------

  describe('観察: cellDataToStoredCell の変換', () => {
    it('string CellData を StoredCellData に正しく変換する', () => {
      const cellData: CellData = { value: 'world', type: 'string' };

      const stored = ExcelJSAdapter.cellDataToStoredCell('tab1', 3, 5, cellData);

      expect(stored.tabId).toBe('tab1');
      expect(stored.row).toBe(3);
      expect(stored.col).toBe(5);
      expect(stored.value).toBe('world');
      expect(stored.type).toBe('string');
      expect(stored.formula).toBeUndefined();
      expect(stored.style).toBeUndefined();
    });

    it('number CellData を StoredCellData に正しく変換する', () => {
      const cellData: CellData = { value: -99.9, type: 'number' };

      const stored = ExcelJSAdapter.cellDataToStoredCell('tab2', 0, 0, cellData);

      expect(stored.tabId).toBe('tab2');
      expect(stored.value).toBe(-99.9);
      expect(stored.type).toBe('number');
    });

    it('formula CellData を StoredCellData に正しく変換する', () => {
      const cellData: CellData = {
        value: 50,
        type: 'formula',
        formula: 'A1+B1',
      };

      const stored = ExcelJSAdapter.cellDataToStoredCell('tab1', 2, 3, cellData);

      expect(stored.value).toBe(50);
      expect(stored.type).toBe('formula');
      expect(stored.formula).toBe('A1+B1');
    });

    it('style 付き CellData を StoredCellData に正しく変換する', () => {
      const cellData: CellData = {
        value: 'styled',
        type: 'string',
        style: { backgroundColor: '#00FF00' },
      };

      const stored = ExcelJSAdapter.cellDataToStoredCell('tab1', 0, 0, cellData);

      expect(stored.style).toEqual({ backgroundColor: '#00FF00' });
    });
  });


  // ============================================================================
  // Property-Based Tests — ラウンドトリップ保持検証
  // ============================================================================

  /**
   * プロパティベーステスト: 変換のラウンドトリップ
   * （StoredCellData → CellData → StoredCellData）でデータが保持されること
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('PBT: StoredCellData → CellData → StoredCellData ラウンドトリップ', () => {

    // Arbitrary for CellType
    const cellTypeArb: fc.Arbitrary<CellType> = fc.constantFrom(
      'empty', 'string', 'number', 'boolean', 'date', 'error', 'formula'
    );

    // Arbitrary for CellValue matching the type
    const cellValueForType = (type: CellType): fc.Arbitrary<CellValue> => {
      switch (type) {
        case 'empty':
          return fc.constant(null);
        case 'string':
          return fc.string({ minLength: 0, maxLength: 100 });
        case 'number':
          return fc.oneof(
            fc.integer({ min: -100000, max: 100000 }),
            fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true })
          );
        case 'boolean':
          return fc.boolean();
        case 'date':
          return fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') });
        case 'error':
          return fc.constantFrom('#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#N/A');
        case 'formula':
          return fc.oneof(
            fc.integer({ min: -1000, max: 1000 }),
            fc.string({ minLength: 1, maxLength: 50 })
          );
        default:
          return fc.constant(null);
      }
    };

    // Arbitrary for optional formula
    const formulaForType = (type: CellType): fc.Arbitrary<string | undefined> => {
      if (type === 'formula') {
        return fc.constantFrom('SUM(A1:A10)', 'A1+B1', 'IF(A1>0,1,0)', 'VLOOKUP(A1,B:C,2,FALSE)');
      }
      return fc.constant(undefined);
    };

    // Arbitrary for hex color
    const hexChars = '0123456789abcdef';
    const hexCharArb = fc.constantFrom(...hexChars.split(''));
    const hexColorArb = fc.tuple(
      hexCharArb, hexCharArb, hexCharArb,
      hexCharArb, hexCharArb, hexCharArb,
    ).map(chars => '#' + chars.join(''));

    // Arbitrary for optional simple style (CellStyleData-compatible)
    const simpleStyleArb = fc.option(
      fc.record({
        backgroundColor: fc.option(hexColorArb, { nil: undefined }),
        color: fc.option(hexColorArb, { nil: undefined }),
        fontWeight: fc.option(fc.constantFrom('normal', 'bold'), { nil: undefined }),
      }),
      { nil: undefined }
    );

    it('property: 任意の StoredCellData → CellData → StoredCellData でコアフィールドが保持される', () => {
      fc.assert(
        fc.property(
          cellTypeArb.chain(type =>
            fc.tuple(
              fc.constant(type),
              cellValueForType(type),
              formulaForType(type),
              simpleStyleArb,
              fc.string({ minLength: 1, maxLength: 10 }).map(s => 'tab-' + s),
              fc.integer({ min: 0, max: 999 }),
              fc.integer({ min: 0, max: 99 }),
            )
          ),
          ([type, value, formula, style, tabId, row, col]) => {
            // Step 1: Create StoredCellData
            const stored: StoredCellData = {
              tabId,
              row,
              col,
              value,
              type,
              formula,
              style,
              updatedAt: new Date(),
              version: 1,
            };

            // Step 2: StoredCellData → CellData
            const cellData = ExcelJSAdapter.storedCellToCellData(stored);

            // Step 3: CellData → StoredCellData (with same tabId, row, col)
            const roundTripped = ExcelJSAdapter.cellDataToStoredCell(tabId, row, col, cellData);

            // Verify core fields are preserved
            expect(roundTripped.tabId).toBe(tabId);
            expect(roundTripped.row).toBe(row);
            expect(roundTripped.col).toBe(col);
            expect(roundTripped.value).toEqual(stored.value);
            expect(roundTripped.type).toBe(stored.type);
            expect(roundTripped.formula).toBe(stored.formula);

            // Style comparison
            if (stored.style) {
              expect(roundTripped.style).toEqual(stored.style);
            } else {
              expect(roundTripped.style).toBeUndefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('property: CellData → StoredCellData → CellData でコアフィールドが保持される', () => {
      fc.assert(
        fc.property(
          cellTypeArb.chain(type =>
            fc.tuple(
              fc.constant(type),
              cellValueForType(type),
              formulaForType(type),
              simpleStyleArb,
            )
          ),
          ([type, value, formula, style]) => {
            // Step 1: Create CellData
            const cellData: CellData = {
              value,
              type,
              formula,
              style,
            };

            // Step 2: CellData → StoredCellData
            const stored = ExcelJSAdapter.cellDataToStoredCell('test-tab', 5, 10, cellData);

            // Step 3: StoredCellData → CellData
            const fullStored: StoredCellData = {
              ...stored,
              updatedAt: new Date(),
              version: 1,
            };
            const roundTripped = ExcelJSAdapter.storedCellToCellData(fullStored);

            // Verify core fields are preserved
            expect(roundTripped.value).toEqual(cellData.value);
            expect(roundTripped.type).toBe(cellData.type);
            expect(roundTripped.formula).toBe(cellData.formula);

            if (cellData.style) {
              expect(roundTripped.style).toEqual(cellData.style);
            } else {
              expect(roundTripped.style).toBeUndefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
