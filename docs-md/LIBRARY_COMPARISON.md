# Excel Library 比較: xlsx vs ExcelJS

## 📊 現在の状況

Gridparkは現在 **`xlsx`** (SheetJS) を使用しています。

```json
"dependencies": {
  "xlsx": "^0.18.5"
}
```

## 🔍 ライブラリ比較

### 1. **xlsx (SheetJS)** - 現在使用中

**公式**: https://sheetjs.com/  
**GitHub**: https://github.com/SheetJS/sheetjs  
**NPM**: https://npmjs.com/package/xlsx

#### ✅ 強み
- **超高速な読み込み・書き込み**
- **軽量** (~500KB minified)
- **幅広いフォーマット対応**
  - XLSX, XLSB, XLS, XLSM, ODS, CSV, TSV, HTML など
- **豊富なユーティリティ関数**
  - `XLSX.utils.sheet_to_json()`
  - `XLSX.utils.aoa_to_sheet()` (2D配列 → Sheet)
  - `XLSX.utils.json_to_sheet()`
- **ブラウザ & Node.js両対応**
- **Apache License 2.0** (オープンソース)

#### ❌ 制限事項
- **スタイル・書式設定が標準で非対応**
  - セルの色、フォント、罫線などは読み書きできない
  - コミュニティフォーク `xlsx-js-style` が必要
- **画像・チャートの書き込みは非対応**
- **リッチテキストのサポートが限定的**

#### 📦 スタイル対応のためのフォーク

**`xlsx-js-style`** (コミュニティフォーク)
```bash
npm install xlsx-js-style
```
- SheetJSにスタイル機能を追加
- セルの色、フォント、罫線、塗りつぶしを設定可能
- GitHub: https://github.com/gitbrent/xlsx-js-style

---

### 2. **ExcelJS** - 代替候補

**GitHub**: https://github.com/exceljs/exceljs  
**NPM**: https://npmjs.com/package/exceljs

#### ✅ 強み（フル機能）
- **完全なスタイル・書式設定**
  - セルの色、フォント、罫線、塗りつぶし
  - 条件付き書式
  - リッチテキスト（セル内の複数フォント）
  - セルの結合
  - 列幅・行高の設定
- **画像の埋め込み**
- **データバリデーション**
- **コメント機能**
- **ワークシート保護**
- **チャート作成（基本的なもの）**
- **MIT License** (オープンソース)

#### ❌ 制限事項
- **ファイルサイズが大きい** (~2MB minified)
- **読み込み・書き込みがxlsxより遅い**
- **複雑なAPIと学習コスト**
- **高度なチャートは非対応**

---

## 🎯 実装への影響分析

### Gridparkの現在の使用箇所

1. **ファイル読み込み** (`useFileSessions.ts`)
   ```typescript
   // XLSXファイル → 2D配列
   const workbook = XLSX.read(arrayBuffer);
   const worksheet = workbook.Sheets[sheetName];
   const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
   ```

2. **ファイル書き込み** (`useFileSessions.ts`)
   ```typescript
   // 2D配列 → XLSXファイル
   const worksheet = XLSX.utils.aoa_to_sheet(data2D);
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
   const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
   ```

---

## 💡 推奨戦略

### オプション A: **現在の `xlsx` を維持** ⭐ 推奨

#### 理由:
1. **現在の実装で十分機能している**
   - 読み込み・書き込みのコア機能は完璧に動作
   - パフォーマンスが優れている
   
2. **スタイル機能は段階的に追加可能**
   - 必要になったら `xlsx-js-style` へ移行
   - API互換性が高いため移行が容易
   
3. **バンドルサイズを小さく保てる**
   - Electronアプリの起動速度に影響

#### 実装例（スタイルが必要になった場合）:

```typescript
// 1. package.json を更新
// "xlsx": "^0.18.5" → "xlsx-js-style": "^1.2.0"

// 2. インポートを変更（APIは同じ）
import * as XLSX from 'xlsx-js-style';

// 3. スタイル付きセルを作成
const worksheet = XLSX.utils.aoa_to_sheet(data2D);
worksheet['A1'].s = {
  font: { bold: true, color: { rgb: "FF0000" } },
  fill: { fgColor: { rgb: "FFFF00" } },
  border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } }
  }
};
```

---

### オプション B: **ExcelJSへ移行**

#### 検討すべき条件:
- ✅ **リッチな書式設定が必須要件**になる
- ✅ **画像・チャートの埋め込み**が必要
- ✅ **条件付き書式**や**データバリデーション**が必要
- ✅ パフォーマンスよりも機能性を優先

#### 移行コスト:
- **高**: API構造が全く異なる
- **影響範囲**: `useFileSessions.ts` の全面書き換え
- **開発時間**: 2-3日の工数

#### 実装例:

```typescript
import ExcelJS from 'exceljs';

// 読み込み
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(arrayBuffer);
const worksheet = workbook.worksheets[0];
const data2D = worksheet.getSheetValues().slice(1); // ヘッダー除く

// 書き込み（スタイル付き）
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet1');
worksheet.getCell('A1').value = 'Hello';
worksheet.getCell('A1').font = { bold: true, color: { argb: 'FFFF0000' } };
worksheet.getCell('A1').fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' }
};
const buffer = await workbook.xlsx.writeBuffer();
```

---

## 🎯 最終推奨

### **Phase 1 (現在)**: `xlsx` (SheetJS) を維持

```
理由:
- ✅ シンプルで高速
- ✅ 現在の実装が安定している
- ✅ バンドルサイズが小さい
- ✅ パフォーマンス最優先
```

### **Phase 2 (将来的)**: スタイル機能が必要になったら `xlsx-js-style` へ移行

```
理由:
- ✅ API互換性が高い（移行が容易）
- ✅ 最小限のコード変更で済む
- ✅ スタイル機能を段階的に追加できる
```

### **Phase 3 (検討中)**: フル機能が必要なら ExcelJS を検討

```
条件:
- 画像・チャート埋め込みが必須
- リッチテキスト・条件付き書式が必須
- パフォーマンスよりも機能性を優先
```

---

## 📊 機能比較表

| 機能 | xlsx (SheetJS) | xlsx-js-style | ExcelJS |
|------|----------------|---------------|---------|
| **読み込み速度** | ⚡⚡⚡ 最速 | ⚡⚡⚡ 最速 | ⚡⚡ やや遅い |
| **書き込み速度** | ⚡⚡⚡ 最速 | ⚡⚡⚡ 最速 | ⚡⚡ やや遅い |
| **バンドルサイズ** | ~500KB | ~500KB | ~2MB |
| **基本的な読み書き** | ✅ | ✅ | ✅ |
| **セルスタイル（色・フォント）** | ❌ | ✅ | ✅ |
| **罫線・塗りつぶし** | ❌ | ✅ | ✅ |
| **リッチテキスト** | ❌ | ⚠️ 限定的 | ✅ |
| **画像埋め込み** | ❌ | ❌ | ✅ |
| **チャート作成** | ❌ | ❌ | ⚠️ 基本のみ |
| **条件付き書式** | ❌ | ❌ | ✅ |
| **データバリデーション** | ❌ | ❌ | ✅ |
| **シート保護** | ❌ | ❌ | ✅ |
| **API の単純さ** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **ライセンス** | Apache 2.0 | Apache 2.0 | MIT |

---

## 🚀 実装方針

### 即座に実行すべきこと: **何もしない**

```
現在の xlsx 実装は:
- ✅ 安定している
- ✅ 高速である
- ✅ 要件を満たしている
```

### 将来的に検討すべきこと:

1. **ユーザーからスタイル機能のリクエストがあれば**
   → `xlsx-js-style` への移行を検討

2. **画像・チャートの埋め込みが必要になれば**
   → ExcelJS への移行を検討

3. **パフォーマンスボトルネックが発生すれば**
   → Apache Arrow の統合を再検討

---

**結論**: **現状維持が最適解** 🎯

Gridparkの現在の要件（基本的なExcel読み書き + HyperFormula計算エンジン）には、xlsxが最適です。スタイル機能が必要になった時点で、段階的に `xlsx-js-style` へ移行する戦略が現実的です。

---

**Last Updated**: 2025-12-20  
**Status**: ✅ Recommendation: Keep `xlsx` (SheetJS)
