# Calculation Strategy for Gridpark

## 現状の課題

IndexedDB は**ストレージ**であり、**計算エンジン**ではありません。
Excel の SUM、AVERAGE、VLOOKUP などの関数を実装するには、別のアプローチが必要です。

## 推奨アーキテクチャ

### Option A: Web Worker + IndexedDB（推奨）

```
┌──────────────────────────────────────────────────────────┐
│                     Main Thread                          │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │ ExcelViewer │ ───> │  useFormula  │                  │
│  │  (UI)       │      │   Hook       │                  │
│  └─────────────┘      └──────┬───────┘                  │
│                              │                           │
│                              │ postMessage               │
└──────────────────────────────┼───────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────┐
│                    Formula Worker                        │
│  ┌────────────────────────────────────────────────┐      │
│  │  Formula Engine (HyperFormula or Custom)      │      │
│  │  - Parse: =SUM(A1:A100)                       │      │
│  │  - Resolve: Get cells from IndexedDB          │      │
│  │  - Calculate: Sum values                      │      │
│  │  - Return: Result                             │      │
│  └────────────────────────────────────────────────┘      │
│                       ↓                                  │
│  ┌────────────────────────────────────────────────┐      │
│  │  IndexedDB (in Worker)                        │      │
│  │  - Efficient range queries                    │      │
│  │  - No UI blocking                             │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

**実装例:**

```typescript
// src/workers/formula.worker.ts
import { db } from '../lib/db';
import { HyperFormula } from 'hyperformula';

const engine = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});

self.onmessage = async (e) => {
  const { type, tabId, formula, cellRef } = e.data;
  
  if (type === 'CALCULATE') {
    // 1. Parse formula
    const parsed = parseFormula(formula); // =SUM(A1:A100)
    
    // 2. Get data from IndexedDB
    const range = parsed.range; // {start: {row:0, col:0}, end: {row:99, col:0}}
    const cells = await db.cells
      .where('[tabId+row]')
      .between([tabId, range.start.row], [tabId, range.end.row])
      .and(cell => cell.col === range.start.col)
      .toArray();
    
    // 3. Calculate
    const values = cells.map(c => c.value);
    const result = calculateSUM(values);
    
    // 4. Return result
    self.postMessage({ type: 'RESULT', cellRef, result });
  }
};
```

```typescript
// src/features/formula/hooks/useFormula.ts
import { useCallback, useEffect, useState } from 'react';

const worker = new Worker(new URL('../workers/formula.worker.ts', import.meta.url));

export function useFormula(tabId: string) {
  const [results, setResults] = useState<Record<string, any>>({});
  
  useEffect(() => {
    worker.onmessage = (e) => {
      const { type, cellRef, result } = e.data;
      if (type === 'RESULT') {
        setResults(prev => ({ ...prev, [cellRef]: result }));
      }
    };
  }, []);
  
  const calculate = useCallback((cellRef: string, formula: string) => {
    worker.postMessage({ type: 'CALCULATE', tabId, formula, cellRef });
  }, [tabId]);
  
  return { results, calculate };
}
```

### Option B: HyperFormula Integration

**HyperFormula** は Excel 互換の計算エンジンです。
IndexedDB と組み合わせて使用できます。

```bash
npm install hyperformula
```

```typescript
// src/lib/hyperformula-adapter.ts
import { HyperFormula } from 'hyperformula';
import { db } from './db';

export class HyperFormulaAdapter {
  private engine: HyperFormula;
  
  constructor() {
    this.engine = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
    });
  }
  
  async loadSheet(tabId: string) {
    // IndexedDB からデータを取得
    const cells = await db.getCellsAs2DArray(tabId);
    
    // HyperFormula にロード
    const sheetName = `sheet_${tabId}`;
    this.engine.addSheet(sheetName, cells);
    
    return sheetName;
  }
  
  async calculateFormula(tabId: string, formula: string) {
    const sheetName = await this.loadSheet(tabId);
    
    // 数式を計算
    const result = this.engine.calculateFormula(formula, sheetName);
    
    return result;
  }
  
  async getCellValue(tabId: string, row: number, col: number) {
    const sheetName = `sheet_${tabId}`;
    return this.engine.getCellValue({ sheet: this.engine.getSheetId(sheetName), row, col });
  }
}
```

### Option C: SQL.js (SQLite in Browser)

もし **SQL クエリ**でデータを処理したい場合：

```typescript
import initSqlJs from 'sql.js';

// IndexedDB のデータを SQLite にロード
const SQL = await initSqlJs();
const db = new SQL.Database();

// テーブル作成
db.run(`
  CREATE TABLE cells (
    row INTEGER,
    col INTEGER,
    value REAL,
    PRIMARY KEY (row, col)
  )
`);

// データ挿入
const cells = await indexedDB.getCells(tabId);
cells.forEach(cell => {
  db.run('INSERT INTO cells VALUES (?, ?, ?)', [cell.row, cell.col, cell.value]);
});

// SQL クエリで計算
const result = db.exec('SELECT SUM(value) FROM cells WHERE col = 0');
```

---

## 性能比較

| 方式 | メモリ使用量 | 計算速度 | 複雑な関数 | 推奨度 |
|------|------------|---------|-----------|--------|
| **IndexedDB + Web Worker** | 低 | 速い | ✅ カスタム実装 | ⭐⭐⭐⭐⭐ |
| **HyperFormula** | 中 | 超高速 | ✅ Excel互換 | ⭐⭐⭐⭐⭐ |
| **SQL.js** | 高 | 速い | ❌ SQL のみ | ⭐⭐⭐ |
| **純粋JS（メモリ）** | 超高 | 最速 | ✅ 自由 | ⭐⭐（巨大データ❌） |

---

## 推奨実装ステップ

### Phase 1: 基本的な SUM/AVERAGE（現在）
```typescript
// シンプルな実装（小規模データ向け）
const cells = await db.cells.where('[tabId+col]').equals([tabId, colIndex]).toArray();
const sum = cells.reduce((acc, cell) => acc + (Number(cell.value) || 0), 0);
```

### Phase 2: Web Worker 対応 ✅ (完了)
```typescript
// Worker 内で IndexedDB を使った計算
const { calculate, calculateBatch } = useFormulaWorker(tabId);

// 単一計算（非ブロッキング）
const sum = await calculate('=SUM(A1:A100000)', 'B1');

// バッチ計算（複数の数式を一度に）
const results = await calculateBatch([
  { cellRef: 'B1', formula: '=SUM(A1:A100000)' },
  { cellRef: 'B2', formula: '=AVERAGE(A1:A100000)' },
  { cellRef: 'B3', formula: '=MAX(A1:A100000)' },
]);
```
- ✅ 計算を別スレッドに移動
- ✅ UI ブロッキングなし
- ✅ 10万行でも快適
- ✅ パフォーマンス統計機能

### Phase 3: HyperFormula 統合 ✅ (完了)
```typescript
// HyperFormula 統合により 400+ の Excel 関数をサポート
const { calculate, loadSheet, getDependencies } = useFormulaWorker(tabId);

// シートをロード（自動的にロードされますが、明示的にも可能）
await loadSheet();

// 高度な関数をサポート
const vlookup = await calculate('=VLOOKUP(A1, B1:D10, 3, FALSE)', 'E1');
const ifResult = await calculate('=IF(A1>10, "High", "Low")', 'F1');
const sumif = await calculate('=SUMIF(A1:A10, ">5", B1:B10)', 'G1');
const index = await calculate('=INDEX(A1:C10, 5, 2)', 'H1');

// 依存関係の追跡
const { dependencies, dependents } = await getDependencies('E1');
console.log('E1 depends on:', dependencies); // ['A1', 'B1', 'B2', ...]
console.log('Cells that depend on E1:', dependents); // ['F1', 'G1', ...]
```

**実装済み機能:**
- ✅ **400+ Excel 関数** - VLOOKUP, HLOOKUP, IF, SUMIF, COUNTIF, INDEX/MATCH など
- ✅ **依存関係の追跡** - どのセルがどのセルに依存しているか自動検出
- ✅ **循環参照の検出** - エラーを防ぐための自動検出
- ✅ **Web Worker 統合** - UI をブロックせずに計算
- ✅ **IndexedDB 連携** - 大規模データでも高速アクセス
- ✅ **バッチ計算** - 複数の数式を一度に計算

**対応関数カテゴリ:**
- **Math & Trig**: SUM, AVERAGE, ROUND, ABS, SQRT, POWER など
- **Logical**: IF, AND, OR, NOT, IFS, SWITCH など
- **Lookup**: VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP など
- **Statistical**: COUNT, COUNTA, COUNTIF, MIN, MAX, MEDIAN など
- **Text**: CONCATENATE, LEFT, RIGHT, MID, UPPER, LOWER など
- **Date & Time**: TODAY, NOW, YEAR, MONTH, DAY など
- **その他多数** (合計 400+ 関数)

### Phase 4: 最適化
- 計算結果のキャッシュ
- Incremental calculation (変更セルのみ再計算)
- Virtual scrolling との統合

---

## 結論

### ✅ IndexedDB は**正解**です！

**理由:**
1. **巨大データに強い** - Sparse matrix + efficient indexing
2. **オフライン対応** - ローカルストレージ
3. **拡張性** - Web Worker と組み合わせて計算エンジンを構築可能
4. **トランザクション** - データ整合性の保証

### 🎯 次のステップ

1. **今すぐ**: 基本的な SUM/AVERAGE を IndexedDB クエリで実装
2. **近い将来**: Web Worker で計算を非同期化
3. **将来**: HyperFormula で Excel 互換の全機能

---

## 参考リソース

- **HyperFormula**: https://hyperformula.handsontable.com/
- **Dexie.js Best Practices**: https://dexie.org/docs/Tutorial/Best-Practices
- **Web Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
