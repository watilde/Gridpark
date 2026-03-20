/**
 * Workspace Integration Unit Tests
 *
 * Verifies workspace integration after new file creation in WorkspacePage.
 * - resetWorkbooks is called with the created file when lastCreatedFile is set (Req 2.1)
 * - Window title is updated with the file name (Req 2.3)
 *
 * **Validates: Requirements 2.1, 2.3**
 */

import React from 'react';
import { render } from '@testing-library/react';

const mockResetWorkbooks = jest.fn();
const mockSetWindowTitle = jest.fn();
const mockCreateNewFile = jest.fn();

let mockLastCreatedFile: any = null;

jest.mock('../../../renderer/hooks/useExcelFileOperations', () => ({
  useExcelFileOperations: () => ({
    createNewFile: mockCreateNewFile,
    lastCreatedFile: mockLastCreatedFile,
    isProcessing: false,
    lastError: null,
    lastOperation: null,
    lastOpenedFiles: [],
  }),
}));

jest.mock('../hooks/useWorkspaceState', () => ({
  useWorkspaceState: () => ({
    workbookNodes: [],
    openTabs: [],
    activeTabId: '',
    selectedNodeId: '',
    activeTab: null,
    isLoadingFiles: false,
    searchState: { query: '', results: [], currentIndex: -1 },
    setTreeSearchQuery: jest.fn(),
    saveManager: {
      dirtyMap: {},
      dirtyIds: [],
      isDirty: jest.fn(),
      markTabDirty: jest.fn(),
      markTabClean: jest.fn(),
      saveTab: jest.fn(),
      saveTabAs: jest.fn(),
      saveAllDirtyTabs: jest.fn(),
      tabIsDirty: jest.fn(),
    },
    autoSave: {
      autoSaveEnabled: false,
      autoSaveInterval: 30000,
      toggleAutoSave: jest.fn(),
    },
    handleTabChange: jest.fn(),
    handleCloseTab: jest.fn(),
    handleNodeSelect: jest.fn(),
    findWorkbookNode: jest.fn(),
    updateWorkbookReferences: jest.fn(),
    handleManifestChange: jest.fn(),
    handleCodeChange: jest.fn(),
    readManifestFile: jest.fn(),
    formulaBarState: {},
    activeManifestSession: null,
    activeCodeSession: null,
    manifestEditorData: null,
    manifestIsDirty: false,
    canEditManifest: false,
    dirtyNodeIds: {},
    resetWorkbooks: mockResetWorkbooks,
    electron: { setWindowTitle: mockSetWindowTitle },
  }),
}));

jest.mock('../../../stores', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => false,
}));

jest.mock('../../../stores/spreadsheetSlice', () => ({
  updateUndoRedo: jest.fn(),
  selectCanUndo: jest.fn(),
  selectCanRedo: jest.fn(),
}));

jest.mock('../../../renderer/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div>,
}));

jest.mock('../../../renderer/components/layout/ActivityBar', () => ({
  ActivityBar: () => <div data-testid="activity-bar" />,
  ActivityBarView: {},
}));

jest.mock('../../../renderer/components/layout/SidebarExplorer', () => ({
  SidebarExplorer: () => <div data-testid="sidebar-explorer" />,
}));

jest.mock('../../../renderer/components/sidebar/GitPlaceholderSidebar', () => ({
  GitPlaceholderSidebar: () => <div data-testid="git-sidebar" />,
}));

jest.mock('../../../renderer/features/workspace/components/WorkspaceHeader', () => ({
  WorkspaceHeader: () => <div data-testid="workspace-header" />,
}));

jest.mock('../../../renderer/features/workspace/components/TabContentArea', () => ({
  TabContentArea: () => <div data-testid="tab-content-area" />,
}));

jest.mock('../../../renderer/features/workspace/components/EditorPanel', () => ({
  EditorPanelHandle: {},
}));

jest.mock('../../../renderer/utils/platform', () => ({
  getPlatformCapabilities: () => ({ isMac: false, modifierKey: 'Ctrl' }),
}));

import { WorkspacePage } from './WorkspacePage';

describe('Workspace Integration: New file creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLastCreatedFile = null;
  });

  describe('Tab added to workspace after lastCreatedFile is set (Req 2.1)', () => {
    it('resetWorkbooks is called with the created file when lastCreatedFile is set', () => {
      const testFile = {
        name: 'TestWorkbook.xlsx',
        path: '/tmp/TestWorkbook.xlsx',
        sheets: [{ name: 'Sheet1', data: [], rowCount: 0, colCount: 0 }],
      };
      mockLastCreatedFile = testFile;

      render(<WorkspacePage />);

      expect(mockResetWorkbooks).toHaveBeenCalledWith([testFile]);
      expect(mockResetWorkbooks).toHaveBeenCalledTimes(1);
    });

    it('resetWorkbooks is not called when lastCreatedFile is null', () => {
      mockLastCreatedFile = null;

      render(<WorkspacePage />);

      expect(mockResetWorkbooks).not.toHaveBeenCalled();
    });
  });

  describe('Window title updated with file name (Req 2.3)', () => {
    it('setWindowTitle is called with the file name when lastCreatedFile is set', () => {
      const testFile = {
        name: 'MySpreadsheet.xlsx',
        path: '/home/user/MySpreadsheet.xlsx',
        sheets: [{ name: 'Sheet1', data: [], rowCount: 0, colCount: 0 }],
      };
      mockLastCreatedFile = testFile;

      render(<WorkspacePage />);

      expect(mockSetWindowTitle).toHaveBeenCalledWith('MySpreadsheet.xlsx');
    });

    it('setWindowTitle is not called with a .xlsx file name when lastCreatedFile is null', () => {
      mockLastCreatedFile = null;

      render(<WorkspacePage />);

      // When lastCreatedFile is null, setWindowTitle should not be called with any .xlsx name.
      // A separate useEffect may call setWindowTitle with the default title.
      expect(mockSetWindowTitle).not.toHaveBeenCalledWith(
        expect.stringMatching(/\.xlsx$/)
      );
    });
  });

  describe('Both resetWorkbooks and setWindowTitle are called together', () => {
    it('both are called after file creation', () => {
      const testFile = {
        name: 'Untitled.xlsx',
        path: '/tmp/Untitled.xlsx',
        sheets: [{ name: 'Sheet1', data: [], rowCount: 0, colCount: 0 }],
      };
      mockLastCreatedFile = testFile;

      render(<WorkspacePage />);

      expect(mockResetWorkbooks).toHaveBeenCalledWith([testFile]);
      expect(mockSetWindowTitle).toHaveBeenCalledWith('Untitled.xlsx');
    });
  });
});
