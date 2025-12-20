# ExcelJS フル機能UI実装計画

## 🎯 プロジェクト目標

GridparkをExcelJSに移行し、すべてのスタイル機能と高度な機能をUIで利用可能にする。

---

## 📋 実装フェーズ

### **Phase 1: ExcelJS 統合とコア機能移行** ⚡ 最優先

#### 1.1 ライブラリ移行
- [ ] `exceljs` パッケージのインストール
- [ ] `xlsx` → `exceljs` への段階的移行
- [ ] 既存の読み込み・書き込みロジックの書き換え

#### 1.2 データ層の更新
- [ ] `db.ts` - セルスタイル情報の保存スキーマ追加
- [ ] `CellData` インターフェース拡張（style情報追加）
- [ ] `useExcelSheet` - スタイル情報の読み書き対応

#### 1.3 ファイルI/O更新
- [ ] `useFileSessions.ts` - ExcelJS統合
- [ ] スタイル情報の永続化
- [ ] 既存XLSXファイルのスタイル読み込み

---

### **Phase 2: 基本スタイル機能UI** 🎨 高優先度

#### 2.1 フォントスタイル
```typescript
interface FontStyle {
  name?: string;        // 'Arial', 'Times New Roman', etc.
  size?: number;        // 10, 12, 14, etc.
  bold?: boolean;
  italic?: boolean;
  underline?: boolean | 'single' | 'double';
  strike?: boolean;
  color?: { argb: string };  // 'FFFF0000' (ARGB)
}
```

**UI コンポーネント:**
- [ ] Font Family ドロップダウン
- [ ] Font Size セレクター
- [ ] Bold / Italic / Underline ボタン
- [ ] Font Color ピッカー

#### 2.2 セル背景・塗りつぶし
```typescript
interface FillStyle {
  type: 'pattern' | 'gradient';
  pattern?: 'solid' | 'darkVertical' | 'darkHorizontal' | 'darkGrid' | ...;
  fgColor?: { argb: string };
  bgColor?: { argb: string };
}
```

**UI コンポーネント:**
- [ ] Background Color ピッカー
- [ ] Fill Pattern セレクター

#### 2.3 罫線（Borders）
```typescript
interface BorderStyle {
  top?: { style: 'thin' | 'medium' | 'thick' | 'double', color: { argb: string } };
  left?: { style: ..., color: ... };
  bottom?: { style: ..., color: ... };
  right?: { style: ..., color: ... };
}
```

**UI コンポーネント:**
- [ ] Border Style ツールバー
- [ ] 個別の罫線設定（上下左右）
- [ ] 罫線の色・太さ設定

#### 2.4 配置（Alignment）
```typescript
interface Alignment {
  horizontal?: 'left' | 'center' | 'right' | 'fill' | 'justify';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
  textRotation?: number;  // 0-180 degrees
}
```

**UI コンポーネント:**
- [ ] Horizontal Alignment ボタン（左・中央・右）
- [ ] Vertical Alignment ボタン（上・中央・下）
- [ ] Text Wrap トグル
- [ ] Text Rotation スライダー

#### 2.5 数値フォーマット
```typescript
interface NumberFormat {
  format?: string;  // '0.00', '$#,##0.00', 'dd/mm/yyyy', etc.
}
```

**UI コンポーネント:**
- [ ] Number Format ドロップダウン
  - General
  - Number (小数点付き)
  - Currency ($#,##0.00)
  - Percentage (0.00%)
  - Date (dd/mm/yyyy)
  - Time (hh:mm:ss)
  - Text

---

### **Phase 3: 高度なスタイル機能** 🚀 中優先度

#### 3.1 リッチテキスト
```typescript
interface RichText {
  richText: Array<{
    font?: FontStyle;
    text: string;
  }>;
}
```

**UI コンポーネント:**
- [ ] Rich Text Editor（セル内編集モード）
- [ ] インライン書式設定

#### 3.2 条件付き書式
```typescript
interface ConditionalFormatting {
  type: 'dataBar' | 'colorScale' | 'iconSet' | 'expression';
  rules: Array<{
    priority: number;
    formula?: string;
    style?: CellStyle;
  }>;
}
```

**UI コンポーネント:**
- [ ] 条件付き書式ダイアログ
- [ ] ルール作成インターフェース
- [ ] プレビュー表示

#### 3.3 データバリデーション
```typescript
interface DataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'custom';
  formulae: string[];
  showErrorMessage?: boolean;
  errorTitle?: string;
  error?: string;
}
```

**UI コンポーネント:**
- [ ] Data Validation ダイアログ
- [ ] ドロップダウンリスト設定
- [ ] カスタムバリデーション式

---

### **Phase 4: メディア機能** 🖼️ 中優先度

#### 4.1 画像の埋め込み
```typescript
interface Image {
  type: 'image';
  imageId: string;
  range: { tl: { col, row }, br: { col, row } };
}
```

**UI コンポーネント:**
- [ ] 画像挿入ボタン
- [ ] 画像リサイズ・移動
- [ ] 画像プロパティダイアログ

#### 4.2 チャート作成（基本）
```typescript
interface Chart {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  data: { labels: string[], datasets: Array<{...}> };
  options: {...};
}
```

**UI コンポーネント:**
- [ ] チャート作成ウィザード
- [ ] データ範囲選択
- [ ] チャートタイプ選択
- [ ] チャートスタイル設定

---

### **Phase 5: その他の機能** 📊 低優先度

#### 5.1 セル結合
```typescript
worksheet.mergeCells('A1:C1');
```

**UI コンポーネント:**
- [ ] Merge Cells ボタン
- [ ] Unmerge Cells ボタン

#### 5.2 行・列の操作
- [ ] 列幅の自動調整
- [ ] 行の高さ設定
- [ ] 列・行の固定（Freeze Panes）

#### 5.3 シート保護
```typescript
worksheet.protect('password', {
  selectLockedCells: true,
  selectUnlockedCells: true
});
```

**UI コンポーネント:**
- [ ] Protect Sheet ダイアログ
- [ ] パスワード設定

---

## 🎨 UI/UX デザイン方針

### **ツールバーレイアウト**

```
┌────────────────────────────────────────────────────────────┐
│ File | Edit | View | Format | Insert | Data | Tools | Help │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ [Font: Arial ▼] [Size: 12 ▼] [B] [I] [U]  [A▼] [🎨]     │
│                                                            │
│ [═══] [|||] [─] [│]  [Left] [Center] [Right]  [%] [$]   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **右クリックコンテキストメニュー**
- Format Cells... → スタイル設定ダイアログ
- Insert Image...
- Insert Chart...
- Conditional Formatting...
- Data Validation...

### **Format Cells ダイアログ**
```
┌─────────────────────────────────────┐
│ [Number] [Alignment] [Font] [Border] [Fill] │
├─────────────────────────────────────┤
│                                     │
│  [タブ内容]                         │
│                                     │
├─────────────────────────────────────┤
│         [OK]  [Cancel]  [Apply]     │
└─────────────────────────────────────┘
```

---

## 📦 必要なライブラリ

```json
{
  "dependencies": {
    "exceljs": "^4.4.0",           // Excel I/O
    "@mui/joy": "^5.0.0-beta.52",  // UI Components (既存)
    "react-colorful": "^5.6.1",    // Color Picker
    "tiptap": "^2.x",              // Rich Text Editor (検討中)
  }
}
```

---

## 🗄️ データベーススキーマ拡張

### 現在の `StoredCellData`
```typescript
interface StoredCellData {
  tabId: string;
  row: number;
  col: number;
  value: CellValue;
  type?: CellType;
  formula?: string;
}
```

### 拡張後の `StoredCellData`
```typescript
interface StoredCellData {
  tabId: string;
  row: number;
  col: number;
  value: CellValue;
  type?: CellType;
  formula?: string;
  
  // ✨ 新規追加: スタイル情報
  style?: {
    font?: {
      name?: string;
      size?: number;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean | 'single' | 'double';
      strike?: boolean;
      color?: { argb: string };
    };
    fill?: {
      type?: 'pattern' | 'gradient';
      pattern?: string;
      fgColor?: { argb: string };
      bgColor?: { argb: string };
    };
    border?: {
      top?: { style: string; color: { argb: string } };
      left?: { style: string; color: { argb: string } };
      bottom?: { style: string; color: { argb: string } };
      right?: { style: string; color: { argb: string } };
    };
    alignment?: {
      horizontal?: string;
      vertical?: string;
      wrapText?: boolean;
      textRotation?: number;
    };
    numFmt?: string;
  };
  
  // 結合セル情報
  merged?: boolean;
  mergeRange?: string;  // 'A1:C1'
}
```

---

## 🎯 実装順序（推奨）

### Week 1-2: 基盤整備
1. ✅ ExcelJS インストール
2. ✅ データベーススキーマ拡張
3. ✅ ExcelJS統合（読み込み・書き込み）

### Week 3-4: 基本スタイルUI
4. ✅ フォントスタイルツールバー
5. ✅ 色ピッカー統合
6. ✅ 罫線ツール
7. ✅ 配置ツール

### Week 5-6: 高度な機能
8. ✅ 数値フォーマット
9. ✅ リッチテキストエディタ
10. ✅ 条件付き書式

### Week 7-8: メディアと最終調整
11. ✅ 画像挿入機能
12. ✅ チャート作成（基本）
13. ✅ テスト・ドキュメント作成

---

## 🧪 テスト戦略

### 単体テスト
- [ ] ExcelJS統合テスト
- [ ] スタイル情報の永続化テスト
- [ ] フォーマット変換テスト

### 統合テスト
- [ ] UIからのスタイル適用テスト
- [ ] ファイル保存・読み込みテスト
- [ ] パフォーマンステスト（大規模スタイル付きシート）

### E2Eテスト
- [ ] ユーザーシナリオテスト
- [ ] 既存Excelファイルとの互換性テスト

---

## 📊 成功指標

- ✅ **機能カバレッジ**: ExcelJSの主要機能90%以上をUIで利用可能
- ✅ **パフォーマンス**: 10,000セル以下のスタイル適用は即座に反映
- ✅ **互換性**: 既存XLSXファイルのスタイルを完全に読み込み
- ✅ **UX**: Excelライクな直感的操作感

---

**Last Updated**: 2025-12-20  
**Status**: 📋 Planning Phase  
**Next Action**: Phase 1 - ExcelJS統合開始
