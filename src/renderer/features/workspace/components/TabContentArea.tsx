import React, { forwardRef } from 'react';
import { Box } from '@mui/joy';
import { WorkbookTabs } from './WorkbookTabs';
import { EditorPanel, EditorPanelHandle } from './EditorPanel';
import { WorkbookTab } from '../../../types/tabs';
import {
  ActiveCellDetails,
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
} from '../../spreadsheet-v2/components/SpreadsheetContainerV2';
import { CellPosition, CellRange } from '../../../types/excel';

export interface TabContentAreaProps {
  openTabs: WorkbookTab[];
  activeTabId: string;
  onTabChange: (event: React.SyntheticEvent | null, value: string | number | null) => void;
  onCloseTab: (tabId: string) => void;
  tabIsDirty: (tab: WorkbookTab) => boolean;

  activeTab: WorkbookTab | null;

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

  sheetSearchQuery: string;
  searchNavigation: SearchNavigationCommand | undefined;
  replaceCommand: ReplaceCommand | null;
  formulaCommitCommand: FormulaCommitCommand | null;
  formulaBarState: any;
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
      platformCapabilities,
      onDirtyChange,
      onCellSelect,
      onRangeSelect,
      onActiveCellDetails,
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
            platformCapabilities={platformCapabilities}
            onDirtyChange={onDirtyChange}
            onCellSelect={onCellSelect}
            onRangeSelect={onRangeSelect}
            onActiveCellDetails={onActiveCellDetails}
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
