/**
 * Bug 7 検証: 最初の文字消失バグが修正済みであることを確認
 *
 * CellRenderer のローカルステート管理（editValue, handleFocus, handleBlur, handleChange）
 * が正しく実装されていることをユニットテストで検証する。
 *
 * パターン: 制御入力 + デバウンス保存 → ローカルステートでの非制御入力
 * - フォーカス時にローカルステートが初期化される
 * - 入力中はローカルステートのみ更新される（外部ストアへの即時反映なし）
 * - ブラー時に変更がコミットされる
 *
 * **Validates: Requirements 3.1**
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock @mui/joy/styles to avoid theme provider requirement
jest.mock('@mui/joy/styles', () => ({
  styled: (component: any, _options?: any) => {
    return (styler: any) => {
      const StyledComponent = React.forwardRef((props: any, ref: any) => {
        const {
          selected,
          inRange,
          customStyle,
          matchState,
          ...rest
        } = props;
        if (typeof component === 'string') {
          return React.createElement(component, { ...rest, ref });
        }
        return React.createElement(component, { ...rest, ref });
      });
      StyledComponent.displayName = `Styled(${typeof component === 'string' ? component : 'Component'})`;
      return StyledComponent;
    };
  },
  extendTheme: jest.fn(),
}));

// Mock theme
jest.mock('./theme', () => ({
  excelPalette: {
    gridBackground: '#FFFFFF',
    gridText: '#000000',
    headerBorder: '#E0E0E0',
    cellBorder: '#E0E0E0',
    cellHover: '#F5F5F5',
    cellSelected: '#6200EE33',
    cellMatch: '#FF980033',
    cellCurrent: '#FF980066',
  },
}));


import { CellItem } from './CellRenderer';

function createDefaultProps(overrides: Record<string, any> = {}) {
  const defaultCell = { value: 'hello', type: 'string', formula: undefined, style: undefined };
  const sheetData = [[defaultCell]];

  return {
    columnIndex: 0,
    rowIndex: 0,
    style: { top: 0, left: 0, width: 100, height: 30 },
    sheetData,
    selectedCell: { row: 0, col: 0 },
    selectionRange: null,
    cellStyles: {},
    searchMatchMap: new Map(),
    currentSearchMatch: null,
    currentSheetName: 'Sheet1',
    onCellMouseDown: jest.fn(),
    onCellMouseEnter: jest.fn(),
    onCellChange: jest.fn(),
    getColumnLabel: (index: number) => String.fromCharCode(65 + index),
    getCellKey: (row: number, col: number) => `${row}-${col}`,
    createEmptyCell: () => ({ value: null, type: 'empty' }),
    ...overrides,
  };
}

describe('Bug 7 検証: CellRenderer ローカルステート管理', () => {
  describe('フォーカス時にローカルステートが初期化される', () => {
    it('入力フォーカス時にセル値がローカルステートにコピーされる', () => {
      const props = createDefaultProps();
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('hello');

      fireEvent.focus(input);
      expect(input.value).toBe('hello');
    });

    it('空セルのフォーカス時に空文字列で初期化される', () => {
      const props = createDefaultProps({
        sheetData: [[{ value: null, type: 'empty' }]],
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');

      fireEvent.focus(input);
      expect(input.value).toBe('');
    });

    it('数値セルのフォーカス時に文字列に変換されて初期化される', () => {
      const props = createDefaultProps({
        sheetData: [[{ value: 42, type: 'number' }]],
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.focus(input);
      expect(input.value).toBe('42');
    });
  });

  describe('入力中はローカルステートのみ更新される（最初の文字が消失しない）', () => {
    it('最初の文字入力がローカルステートに正しく反映される', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: null, type: 'empty' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'A' } });
      expect(input.value).toBe('A');

      // onCellChange should NOT be called during typing (only on blur)
      expect(onCellChange).not.toHaveBeenCalled();
    });

    it('連続入力がローカルステートに正しく蓄積される', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: null, type: 'empty' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'H' } });
      fireEvent.change(input, { target: { value: 'He' } });
      fireEvent.change(input, { target: { value: 'Hel' } });
      fireEvent.change(input, { target: { value: 'Hell' } });
      fireEvent.change(input, { target: { value: 'Hello' } });

      expect(input.value).toBe('Hello');
      expect(onCellChange).not.toHaveBeenCalled();
    });

    it('既存値の編集でも最初のキーストロークが保持される', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: 'old', type: 'string' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      expect(input.value).toBe('old');

      fireEvent.change(input, { target: { value: 'new' } });
      expect(input.value).toBe('new');
      expect(onCellChange).not.toHaveBeenCalled();
    });
  });

  describe('ブラー時に変更がコミットされる', () => {
    it('値が変更された場合、ブラー時に onCellChange が呼ばれる', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: 'old', type: 'string' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'new' } });
      fireEvent.blur(input);

      expect(onCellChange).toHaveBeenCalledWith(0, 0, 'new');
      expect(onCellChange).toHaveBeenCalledTimes(1);
    });

    it('値が変更されていない場合、ブラー時に onCellChange は呼ばれない', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: 'same', type: 'string' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onCellChange).not.toHaveBeenCalled();
    });

    it('空セルに入力してブラーすると onCellChange が呼ばれる', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: null, type: 'empty' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'typed' } });
      fireEvent.blur(input);

      expect(onCellChange).toHaveBeenCalledWith(0, 0, 'typed');
    });
  });

  describe('Enter/Escape キー操作', () => {
    it('Enter キーで変更がコミットされる', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: '', type: 'string' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'entered' } });
      // Enter calls inputRef.current.blur() programmatically;
      // in jsdom, programmatic blur() may not fire the onBlur handler,
      // so we simulate the full sequence: keyDown + blur
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.blur(input);

      expect(onCellChange).toHaveBeenCalledWith(0, 0, 'entered');
    });

    it('Escape キーで編集がキャンセルされる', () => {
      const onCellChange = jest.fn();
      const props = createDefaultProps({
        sheetData: [[{ value: 'original', type: 'string' }]],
        onCellChange,
      });
      render(<CellItem {...props} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'changed' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      // Escape cancels — onCellChange should NOT be called
      expect(onCellChange).not.toHaveBeenCalled();
    });
  });
});
