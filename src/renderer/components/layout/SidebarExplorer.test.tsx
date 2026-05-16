/**
 * SidebarExplorer: New File ボタンのユニットテスト
 *
 * 「+」ボタン（New File）の表示・非表示とクリック時のコールバック呼び出しを検証する。
 *
 * **Validates: Requirements 3.1**
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock @mui/joy components
jest.mock('@mui/joy/Box', () => {
  return ({ children, ...props }: any) => <div {...props}>{children}</div>;
});

jest.mock('@mui/joy/Sheet', () => {
  return ({ children, ...props }: any) => <div {...props}>{children}</div>;
});

jest.mock('@mui/joy/Typography', () => {
  return ({ children, ...props }: any) => <span {...props}>{children}</span>;
});

jest.mock('@mui/joy/IconButton', () => {
  return ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
});

jest.mock('@mui/icons-material/Add', () => {
  return () => <span data-testid="add-icon">+</span>;
});

jest.mock('@mui/joy/styles', () => ({
  useTheme: () => ({
    palette: {
      background: { surface: '#fff' },
    },
  }),
}));

jest.mock('../../features/file-explorer/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

import { SidebarExplorer } from './SidebarExplorer';

function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    workbookNodes: [],
    searchQuery: '',
    selectedNodeId: '',
    onNodeSelect: jest.fn(),
    dirtyNodeIds: {},
    ...overrides,
  };
}

describe('SidebarExplorer: New File ボタン', () => {
  it('onFileCreate が渡された場合、New File ボタンが表示される', () => {
    const onFileCreate = jest.fn();
    render(<SidebarExplorer {...createDefaultProps({ onFileCreate })} />);

    const button = screen.getByRole('button', { name: 'New File' });
    expect(button).toBeInTheDocument();
  });

  it('「+」ボタンクリック時に onFileCreate が呼ばれる', () => {
    const onFileCreate = jest.fn();
    render(<SidebarExplorer {...createDefaultProps({ onFileCreate })} />);

    const button = screen.getByRole('button', { name: 'New File' });
    fireEvent.click(button);

    expect(onFileCreate).toHaveBeenCalledTimes(1);
  });

  it('onFileImport が渡された場合、Import File ボタンが表示される', () => {
    const onFileImport = jest.fn();
    render(<SidebarExplorer {...createDefaultProps({ onFileImport })} />);

    const button = screen.getByRole('button', { name: 'Import File' });
    expect(button).toBeInTheDocument();
  });

  it('Import ボタンクリック時に onFileImport が呼ばれる', () => {
    const onFileImport = jest.fn();
    render(<SidebarExplorer {...createDefaultProps({ onFileImport })} />);

    const button = screen.getByRole('button', { name: 'Import File' });
    fireEvent.click(button);

    expect(onFileImport).toHaveBeenCalledTimes(1);
  });

  it('onFileCreate/Import が渡されない場合、ボタンが表示されない', () => {
    render(<SidebarExplorer {...createDefaultProps()} />);

    const newButton = screen.queryByRole('button', { name: 'New File' });
    const importButton = screen.queryByRole('button', { name: 'Import File' });
    expect(newButton).not.toBeInTheDocument();
    expect(importButton).not.toBeInTheDocument();
  });
});
