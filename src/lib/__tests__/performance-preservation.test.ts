/**
 * Preservation Property Test — 既存のパフォーマンス関連動作の保持（修正前に実施）
 *
 * Property 2: Preservation — DB操作・レンダリングの正常動作
 *
 * 観察優先方法論に従い、未修正コードでの正常動作をベースラインとして記録する。
 * 実際に値が変更された場合の DB 更新、レンダリング、データ変換が正しく動作すること。
 *
 * 未修正コードでテスト実行 — **成功が期待される**（ベースライン動作の確認）
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

import * as fc from 'fast-check';
import { AppDatabase, CellData, StoredCellData } from '../db';

// ============================================================================
// Observation Tests — 個別の動作確認
// ============================================================================

describe('Preservation: DB操作・レンダリングの正常動作', () => {
  // ==========================================================================
  // 観察: upsertCell が新しい値で呼ばれた場合に正しく更新される
  // ==========================================================================

  describe('観察: upsertCell が新しい値で正しく更新される', () => {
    /**
     * 観察: upsertCell が新しい値で呼ばれた場合に正しく更新される（未修正コード）
     *
     * **Validates: Requirements 2.2**
     */
    it('新しい値で upsertCell を呼ぶとセルが正しく更新される', async () => {
      const database = new AppDatabase();
      const tabId = 'test-tab';

      await database.upsertSheetMetadata({
        tabId,
        workbookId: 'test-wb',
        sheetName: 'Sheet1',
        sheetIndex: 0,
        maxRow: 0,
        maxCol: 0,
        cellCount: 0,
        dirty: false,
      });

      // Insert initial value
      await database.upsertCell(tabId, 0, 0, { value: 'hello', type: 'string' });
      const cell1 = await database.getCell(tabId, 0, 0);
      expect(cell1!.value).toBe('hello');
      expect(cell1!.type).toBe('string');

      // Update with new value
      await database.upsertCell(tabId, 0, 0, { value: 'world', type: 'string' });
      const cell2 = await database.getCell(tabId, 0, 0);
      expect(cell2!.value).toBe('world');
      expect(cell2!.type).toBe('string');
      expect(cell2!.version).toBeGreaterThan(cell1!.version);
    });

    it('異なる型の値で upsertCell を呼ぶとセルが正しく更新される', async () => {
      const database = new AppDatabase();
      const tabId = 'test-tab';

      await database.upsertSheetMetadata({
        tabId,
        workbookId: 'test-wb',
        sheetName: 'Sheet1',
        sheetIndex: 0,
        maxRow: 0,
        maxCol: 0,
        cellCount: 0,
        dirty: false,
      });

      // Insert string
      await database.upsertCell(tabId, 0, 0, { value: 'text', type: 'string' });
      const cell1 = await database.getCell(tabId, 0, 0);
      expect(cell1!.value).toBe('text');

      // Update to number
      await database.upsertCell(tabId, 0, 0, { value: 42, type: 'number' });
      const cell2 = await database.getCell(tabId, 0, 0);
      expect(cell2!.value).toBe(42);
      expect(cell2!.type).toBe('number');
    });
  });

  // ==========================================================================
  // 観察: save2DArrayAsCells が非空セルを正しく保存する
  // ==========================================================================

  describe('観察: save2DArrayAsCells が非空セルを正しく保存する', () => {
    /**
     * 観察: save2DArrayAsCells が非空セルを正しく保存する（未修正コード）
     *
     * **Validates: Requirements 2.3**
     */
    it('非空セルを含む2D配列を保存すると正しくDBに格納される', async () => {
      const database = new AppDatabase();
      const tabId = 'test-tab';

      await database.upsertSheetMetadata({
        tabId,
        workbookId: 'test-wb',
        sheetName: 'Sheet1',
        sheetIndex: 0,
        maxRow: 0,
        maxCol: 0,
        cellCount: 0,
        dirty: false,
      });

      const data: CellData[][] = [
        [
          { value: 'A1', type: 'string' },
          { value: 42, type: 'number' },
        ],
        [
          { value: null, type: 'empty' },
          { value: 'B2', type: 'string' },
        ],
      ];

      await database.save2DArrayAsCells(tabId, data);

      const cells = await database.getCellsForSheet(tabId);
      // Only non-empty cells should be saved (3 cells: A1, B1=42, B2)
      expect(cells.length).toBe(3);

      const a1 = await database.getCell(tabId, 0, 0);
      expect(a1!.value).toBe('A1');
      expect(a1!.type).toBe('string');

      const b1 = await database.getCell(tabId, 0, 1);
      expect(b1!.value).toBe(42);
      expect(b1!.type).toBe('number');

      const b2 = await database.getCell(tabId, 1, 1);
      expect(b2!.value).toBe('B2');
      expect(b2!.type).toBe('string');

      // Empty cell should not be stored
      const a2 = await database.getCell(tabId, 1, 0);
      expect(a2).toBeUndefined();
    });
  });

  // ==========================================================================
  // 観察: CellRenderer が props 変更時に正しく再レンダリングされる
  // ==========================================================================

  describe('観察: CellRenderer が props 変更時に正しく再レンダリングされる', () => {
    /**
     * 観察: CellRenderer の memo 比較関数が props 変更時に false を返す（再レンダリングを許可）
     *
     * 現在の実装では arePropsEqual が常に false を返すため、
     * props が変更された場合も当然 false を返す（再レンダリングされる）。
     * これは正しい動作 — props が変わったら再レンダリングすべき。
     *
     * **Validates: Requirements 2.1**
     */
    it('props が変更された場合、arePropsEqual は false を返す（再レンダリングを許可）', () => {
      const CellRendererModule = require('../../renderer/features/workbook/components/CellRenderer');
      const CellItem = CellRendererModule.CellItem;
      const compareFunction = (CellItem as any).compare;

      expect(compareFunction).toBeDefined();

      const baseProps = {
        columnIndex: 0,
        rowIndex: 0,
        style: { top: 0, left: 0, width: 100, height: 30 },
        sheetData: [[{ value: 'old', type: 'string' }]],
        selectedCell: null,
        selectionRange: null,
        cellStyles: {},
        searchMatchMap: new Map(),
        currentSearchMatch: null,
        currentSheetName: 'Sheet1',
        onCellMouseDown: () => {},
        onCellMouseEnter: () => {},
        onCellChange: () => {},
        getColumnLabel: (i: number) => String.fromCharCode(65 + i),
        getCellKey: (r: number, c: number) => `${r},${c}`,
        createEmptyCell: () => ({ value: null, type: 'empty' }),
      };

      const changedProps = {
        ...baseProps,
        sheetData: [[{ value: 'new', type: 'string' }]],
      };

      // When props change, arePropsEqual should return false (allow re-render)
      const result = compareFunction(baseProps, changedProps);
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // 観察: data2D がセルデータを正しく2D配列に変換する
  // ==========================================================================

  describe('観察: data2D がセルデータを正しく2D配列に変換する', () => {
    /**
     * 観察: getCellsAs2DArray がセルデータを正しく2D配列に変換する（未修正コード）
     *
     * data2D は useExcelSheet フック内の useMemo で計算されるが、
     * 基本的なロジックは getCellsAs2DArray と同等。
     * ここでは getCellsAs2DArray を直接テストしてデータ変換の正確性を確認する。
     *
     * **Validates: Requirements 2.4**
     */
    it('セルデータが正しい位置に配置された2D配列が返される', async () => {
      const database = new AppDatabase();
      const tabId = 'test-tab';

      await database.upsertSheetMetadata({
        tabId,
        workbookId: 'test-wb',
        sheetName: 'Sheet1',
        sheetIndex: 0,
        maxRow: 2,
        maxCol: 1,
        cellCount: 2,
        dirty: false,
      });

      await database.upsertCell(tabId, 0, 0, { value: 'A1', type: 'string' });
      await database.upsertCell(tabId, 2, 1, { value: 99, type: 'number' });

      const result = await database.getCellsAs2DArray(tabId, 5, 5);

      // Check dimensions
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result[0].length).toBeGreaterThanOrEqual(5);

      // Check cell data at correct positions
      expect(result[0][0].value).toBe('A1');
      expect(result[0][0].type).toBe('string');
      expect(result[2][1].value).toBe(99);
      expect(result[2][1].type).toBe('number');

      // Check empty cells
      expect(result[1][0].value).toBeNull();
      expect(result[1][0].type).toBe('empty');
    });
  });

  // ============================================================================
  // Property-Based Tests — 値が変更された場合の正常動作検証
  // ============================================================================

  /**
   * プロパティベーステスト: 実際に値が変更された場合の DB 更新、
   * レンダリング、データ変換が正しく動作すること
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   */
  describe('PBT: 値変更時の DB 更新が正しく動作する', () => {
    it('property: 異なる値で upsertCell を呼ぶと値が正しく更新される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            oldValue: fc.oneof(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.integer({ min: -10000, max: 10000 })
            ),
            newValue: fc.oneof(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.integer({ min: -10000, max: 10000 })
            ),
          }),
          fc.nat({ max: 49 }),
          fc.nat({ max: 25 }),
          async ({ oldValue, newValue }, row, col) => {
            const database = new AppDatabase();
            const tabId = 'test-pbt-upsert';

            await database.upsertSheetMetadata({
              tabId,
              workbookId: 'test-wb',
              sheetName: 'Sheet1',
              sheetIndex: 0,
              maxRow: 0,
              maxCol: 0,
              cellCount: 0,
              dirty: false,
            });

            const oldType = typeof oldValue === 'string' ? 'string' as const : 'number' as const;
            const newType = typeof newValue === 'string' ? 'string' as const : 'number' as const;

            // Insert initial value
            await database.upsertCell(tabId, row, col, { value: oldValue, type: oldType });
            const cellBefore = await database.getCell(tabId, row, col);
            expect(cellBefore).toBeDefined();
            expect(cellBefore!.value).toBe(oldValue);

            // Update with new value
            await database.upsertCell(tabId, row, col, { value: newValue, type: newType });
            const cellAfter = await database.getCell(tabId, row, col);
            expect(cellAfter).toBeDefined();
            expect(cellAfter!.value).toBe(newValue);
            expect(cellAfter!.type).toBe(newType);

            // Version should increase on any upsert (current behavior)
            expect(cellAfter!.version).toBeGreaterThan(cellBefore!.version);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('PBT: save2DArrayAsCells が非空セルを正しく保存する', () => {
    it('property: 任意の非空セルを含む2D配列が正しく保存される', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.array(
              fc.oneof(
                fc.record({
                  value: fc.string({ minLength: 1, maxLength: 20 }),
                  type: fc.constant('string' as const),
                }),
                fc.record({
                  value: fc.integer({ min: -1000, max: 1000 }),
                  type: fc.constant('number' as const),
                }),
                fc.record({
                  value: fc.constant(null),
                  type: fc.constant('empty' as const),
                })
              ),
              { minLength: 1, maxLength: 5 }
            ),
            { minLength: 1, maxLength: 5 }
          ),
          async (data2D: CellData[][]) => {
            const database = new AppDatabase();
            const tabId = 'test-pbt-save';

            await database.upsertSheetMetadata({
              tabId,
              workbookId: 'test-wb',
              sheetName: 'Sheet1',
              sheetIndex: 0,
              maxRow: data2D.length,
              maxCol: data2D[0]?.length || 0,
              cellCount: 0,
              dirty: false,
            });

            await database.save2DArrayAsCells(tabId, data2D);

            // Count expected non-empty cells
            let expectedNonEmpty = 0;
            data2D.forEach((row, rowIdx) => {
              row.forEach((cell, colIdx) => {
                if (cell && cell.value !== null && cell.value !== undefined) {
                  expectedNonEmpty++;
                }
              });
            });

            const savedCells = await database.getCellsForSheet(tabId);
            expect(savedCells.length).toBe(expectedNonEmpty);

            // Verify each non-empty cell is correctly saved
            for (let r = 0; r < data2D.length; r++) {
              for (let c = 0; c < data2D[r].length; c++) {
                const inputCell = data2D[r][c];
                const savedCell = await database.getCell(tabId, r, c);

                if (inputCell && inputCell.value !== null && inputCell.value !== undefined) {
                  expect(savedCell).toBeDefined();
                  expect(savedCell!.value).toBe(inputCell.value);
                  expect(savedCell!.type).toBe(inputCell.type);
                } else {
                  expect(savedCell).toBeUndefined();
                }
              }
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('PBT: CellRenderer が props 変更時に再レンダリングを許可する', () => {
    it('property: 異なる sheetData で arePropsEqual は false を返す', () => {
      const CellRendererModule = require('../../renderer/features/workbook/components/CellRenderer');
      const CellItem = CellRendererModule.CellItem;
      const compareFunction = (CellItem as any).compare;

      expect(compareFunction).toBeDefined();

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (oldValue, newValue) => {
            // Only test when values are actually different
            fc.pre(oldValue !== newValue);

            const prevProps = {
              columnIndex: 0,
              rowIndex: 0,
              style: { top: 0, left: 0, width: 100, height: 30 },
              sheetData: [[{ value: oldValue, type: 'string' }]],
              selectedCell: null,
              selectionRange: null,
              cellStyles: {},
              searchMatchMap: new Map(),
              currentSearchMatch: null,
              currentSheetName: 'Sheet1',
              onCellMouseDown: () => {},
              onCellMouseEnter: () => {},
              onCellChange: () => {},
              getColumnLabel: (i: number) => String.fromCharCode(65 + i),
              getCellKey: (r: number, c: number) => `${r},${c}`,
              createEmptyCell: () => ({ value: null, type: 'empty' }),
            };

            const nextProps = {
              ...prevProps,
              sheetData: [[{ value: newValue, type: 'string' }]],
            };

            // When props change, should return false (allow re-render)
            const result = compareFunction(prevProps, nextProps);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('PBT: data2D (getCellsAs2DArray) がセルデータを正しく2D配列に変換する', () => {
    it('property: 任意のセルデータが正しい位置に配置される', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a list of cells with unique (row, col) positions
          fc.array(
            fc.record({
              row: fc.nat({ max: 20 }),
              col: fc.nat({ max: 10 }),
              value: fc.oneof(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer({ min: -1000, max: 1000 })
              ),
            }),
            { minLength: 1, maxLength: 15 }
          ),
          async (cellInputs) => {
            const database = new AppDatabase();
            const tabId = 'test-pbt-2d';

            await database.upsertSheetMetadata({
              tabId,
              workbookId: 'test-wb',
              sheetName: 'Sheet1',
              sheetIndex: 0,
              maxRow: 0,
              maxCol: 0,
              cellCount: 0,
              dirty: false,
            });

            // Deduplicate by (row, col) — keep last
            const cellMap = new Map<string, typeof cellInputs[0]>();
            cellInputs.forEach(c => cellMap.set(`${c.row},${c.col}`, c));
            const uniqueCells = Array.from(cellMap.values());

            // Insert cells
            for (const cell of uniqueCells) {
              const type = typeof cell.value === 'string' ? 'string' as const : 'number' as const;
              await database.upsertCell(tabId, cell.row, cell.col, {
                value: cell.value,
                type,
              });
            }

            const result = await database.getCellsAs2DArray(tabId, 5, 5);

            // Verify each inserted cell appears at the correct position
            for (const cell of uniqueCells) {
              const type = typeof cell.value === 'string' ? 'string' : 'number';
              expect(result[cell.row][cell.col].value).toBe(cell.value);
              expect(result[cell.row][cell.col].type).toBe(type);
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
