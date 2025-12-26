import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import {
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
  ActiveCellDetails,
} from '../../workbook/components/ExcelViewer';
import {
  ExcelViewerDB,
  ExcelViewerDBHandle,
} from '../../workbook/components/ExcelViewerDB';
import { FormulaBar } from '../../formula-bar/FormulaBar';
import { SpreadsheetToolbar } from '../../toolbar/SpreadsheetToolbar';
import { WorkbookTab } from '../../../types/tabs';
import { CellPosition, CellRange } from '../../../types/excel';

interface EditorPanelProps {
  activeTab: WorkbookTab | null;
  platformCapabilities: any;
  // Sheet handlers
  onDirtyChange: (dirty: boolean) => void;
  onCellSelect: (position: CellPosition) => void;
  onRangeSelect: (range: CellRange) => void;
  onActiveCellDetails: (details: ActiveCellDetails) => void;
  // Shared state
  sheetSearchQuery: string;
  searchNavigation?: SearchNavigationCommand;
  replaceCommand: ReplaceCommand | null;
  formulaCommitCommand: FormulaCommitCommand | null;
  formulaBarState: any; // FormulaBar state from useFormulaBarOptimized
}

/**
 * Ref handle exposed by EditorPanel
 */
export interface EditorPanelHandle {
  /**
   * Execute undo operation
   */
  undo: () => void;
  /**
   * Execute redo operation
   */
  redo: () => void;
  /**
   * Check if undo is available
   */
  canUndo: () => boolean;
  /**
   * Check if redo is available
   */
  canRedo: () => boolean;
  /**
   * Force save immediately
   */
  save: () => Promise<void>;
}

export const EditorPanel = forwardRef<EditorPanelHandle, EditorPanelProps>(
  (
    {
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
    const sheetViewerRef = useRef<ExcelViewerDBHandle>(null);
    
    // Track selected cell/range for toolbar
    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
    
    // Wrap cell/range selection handlers to update toolbar state
    const handleCellSelect = (position: CellPosition) => {
      setSelectedCell(position);
      setSelectedRange(null);
      onCellSelect(position);
    };
    
    const handleRangeSelect = (range: CellRange) => {
      setSelectedRange(range);
      setSelectedCell(null);
      onRangeSelect(range);
    };

    // Expose undo/redo/save methods via ref
    useImperativeHandle(
      ref,
      () => ({
        undo: () => {
          sheetViewerRef.current?.undo();
        },
        redo: () => {
          sheetViewerRef.current?.redo();
        },
        canUndo: () => {
          return sheetViewerRef.current?.canUndo() ?? false;
        },
        canRedo: () => {
          return sheetViewerRef.current?.canRedo() ?? false;
        },
        save: async () => {
          await sheetViewerRef.current?.save();
        },
      }),
      []
    );

    if (!activeTab) {
      return (
        <Sheet
          variant="outlined"
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 0,
          }}
        >
          <Typography level="body-md" sx={{ color: 'neutral.500' }}>
            Open a sheet from the file tree.
          </Typography>
        </Sheet>
      );
    }

    if (activeTab.kind === 'sheet') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <FormulaBar formulaBarState={formulaBarState} />
          <SpreadsheetToolbar
            tabId={activeTab.id}
            selectedCell={selectedCell}
            selectedRange={selectedRange}
          />
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ExcelViewerDB
              ref={sheetViewerRef}
              tabId={activeTab.id}
              file={activeTab.file}
              sheetIndex={activeTab.sheetIndex}
              onDirtyChange={onDirtyChange}
              onCellSelect={handleCellSelect}
              onRangeSelect={handleRangeSelect}
              searchQuery={sheetSearchQuery}
              searchNavigation={searchNavigation}
              replaceCommand={replaceCommand}
              formulaCommit={formulaCommitCommand}
              onActiveCellDetails={onActiveCellDetails}
            />
          </Box>
        </Box>
      );
    }

    return null;
  }
);

EditorPanel.displayName = 'EditorPanel';
