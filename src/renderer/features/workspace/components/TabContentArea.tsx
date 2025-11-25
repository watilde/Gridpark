import React, { forwardRef } from 'react';
import { Box } from '@mui/joy';
import { WorkbookTabs } from './WorkbookTabs';
import { EditorPanel, EditorPanelHandle } from './EditorPanel';
import { WorkbookTab } from '../../../types/tabs';
import {
  ActiveCellDetails,
  SheetSessionState,
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
} from '../../workbook/components/ExcelViewer';
import { ManifestSession } from '../../../hooks/useFileSessions';
import {
  CellPosition,
  CellRange,
  ExcelFile,
  GridparkCodeFile,
  GridparkManifest,
} from '../../../types/excel';

export interface TabContentAreaProps {
  openTabs: WorkbookTab[];
  activeTabId: string;
  onTabChange: (event: React.SyntheticEvent | null, value: string | number | null) => void;
  onCloseTab: (tabId: string) => void;
  tabIsDirty: (tab: WorkbookTab) => boolean;

  activeTab: WorkbookTab | null;

  activeCodeSession:
    | {
        content: string;
        originalContent: string;
        loading: boolean;
        saving: boolean;
        error?: string;
      }
    | undefined;
  activeManifestSession: ManifestSession | undefined;
  manifestEditorData: GridparkManifest | null;
  manifestIsDirty: boolean;
  canEditManifest: boolean;
  platformCapabilities: {
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
    isWeb: boolean;
    hasFilesystem: boolean;
    hasShell: boolean;
  };

  onDirtyChange: (dirty: boolean) => void;

  onCellSelect: (position: CellPosition) => void;
  onRangeSelect: (range: CellRange) => void;
  onActiveCellDetails: (details: ActiveCellDetails) => void;
  onManifestChange: (workbookId: string, file: ExcelFile, nextManifest: GridparkManifest) => void;
  onSaveManifest: (workbookId: string, file: ExcelFile) => Promise<void>;
  onReloadManifest: (file: ExcelFile) => Promise<void>;
  onCodeChange: (codeFile: GridparkCodeFile, value: string) => void;
  onSaveCode: (codeFile: GridparkCodeFile) => Promise<void>;
  onCloseCodeTab: (tabId: string) => void;
  sheetSearchQuery: string;
  searchNavigation: SearchNavigationCommand | undefined;
  replaceCommand: ReplaceCommand | null;
  formulaCommitCommand: FormulaCommitCommand | null;
  formulaBarState: any; // FormulaBar state from useFormulaBarOptimized
}

export const TabContentArea = forwardRef<EditorPanelHandle, TabContentAreaProps>(
  (
    {
      openTabs,
      activeTabId,
      onTabChange,
      onCloseTab,
      tabIsDirty,

      activeTab,
      activeCodeSession,
      activeManifestSession,
      manifestEditorData,
      manifestIsDirty,
      canEditManifest,
      platformCapabilities,
      onDirtyChange,
      onCellSelect,
      onRangeSelect,
      onActiveCellDetails,
      onManifestChange,
      onSaveManifest,
      onReloadManifest,
      onCodeChange,
      onSaveCode,
      onCloseCodeTab,
      sheetSearchQuery,
      searchNavigation,
      replaceCommand,
      formulaCommitCommand,
      formulaBarState,
    },
    ref
  ) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <WorkbookTabs
          openTabs={openTabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
          onCloseTab={onCloseTab}
          tabIsDirty={tabIsDirty}
        />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <EditorPanel
            ref={ref}
            activeTab={activeTab}
            activeCodeSession={activeCodeSession}
            activeManifestSession={activeManifestSession}
            manifestEditorData={manifestEditorData}
            manifestIsDirty={manifestIsDirty}
            canEditManifest={canEditManifest}
            platformCapabilities={platformCapabilities}
            onDirtyChange={onDirtyChange}
            onCellSelect={onCellSelect}
            onRangeSelect={onRangeSelect}
            onActiveCellDetails={onActiveCellDetails}
            onManifestChange={onManifestChange}
            onSaveManifest={onSaveManifest}
            onReloadManifest={onReloadManifest}
            onCodeChange={onCodeChange}
            onSaveCode={onSaveCode}
            onCloseCodeTab={onCloseCodeTab}
            sheetSearchQuery={sheetSearchQuery}
            searchNavigation={searchNavigation}
            replaceCommand={replaceCommand}
            formulaCommitCommand={formulaCommitCommand}
            formulaBarState={formulaBarState}
          />
        </Box>
      </Box>
    );
  }
);
