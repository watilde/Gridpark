import React from "react";
import { Sheet, Typography, Box } from "@mui/joy";
import {
  SheetSessionState,
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
  ActiveCellDetails,
} from "../../workbook/components/ExcelViewer";
import { ExcelViewerDexie } from "../../workbook/components/ExcelViewerDexie";
import { CodeEditorPanel } from "../../code-editor/CodeEditorPanel";
import { ManifestEditorPanel } from "../../manifest-editor/ManifestEditorPanel";
import { FormulaBar } from "../../formula-bar/FormulaBar";
import { WorkbookTab } from "../../../types/tabs";
import { ExcelFile, CellPosition, CellRange, GridparkManifest, GridparkCodeFile } from "../../../types/excel";
import { ManifestSession } from "../../../hooks/useFileSessions";

interface EditorPanelProps {
  activeTab: WorkbookTab | null;
  activeSheetSession?: SheetSessionState; // DEPRECATED: kept for type compatibility
  activeCodeSession?: {
    content: string;
    originalContent: string;
    loading: boolean;
    saving: boolean;
    error?: string;
  };
  activeManifestSession?: ManifestSession;
  manifestEditorData: GridparkManifest | null;
  manifestIsDirty: boolean;
  canEditManifest: boolean;
  platformCapabilities: any;
  // Sheet handlers
  onSessionChange?: (state: SheetSessionState) => void; // DEPRECATED: no longer used
  onSaveSession?: (state: SheetSessionState) => void; // DEPRECATED: no longer used
  onDirtyChange: (dirty: boolean) => void;
  onCellSelect: (position: CellPosition) => void;
  onRangeSelect: (range: CellRange) => void;
  onActiveCellDetails: (details: ActiveCellDetails) => void;
  // Manifest handlers
  onManifestChange: (workbookId: string, file: ExcelFile, next: GridparkManifest) => void;
  onSaveManifest: (workbookId: string, file: ExcelFile) => void;
  onReloadManifest: (file: ExcelFile) => void;
  // Code handlers
  onCodeChange: (codeFile: GridparkCodeFile, value: string) => void;
  onSaveCode: (codeFile: GridparkCodeFile) => void;
  onCloseCodeTab: (tabId: string) => void;
  // Shared state
  sheetSearchQuery: string;
  searchNavigation?: SearchNavigationCommand;
  replaceCommand: ReplaceCommand | null;
  formulaCommitCommand: FormulaCommitCommand | null;
  formulaBarState: any; // FormulaBar state from useFormulaBarOptimized
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  activeTab,
  activeSheetSession, // DEPRECATED: unused
  activeCodeSession,
  activeManifestSession,
  manifestEditorData,
  manifestIsDirty,
  canEditManifest,
  platformCapabilities,
  onSessionChange, // DEPRECATED: unused
  onSaveSession, // DEPRECATED: unused
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
}) => {
  if (!activeTab) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 0,
        }}
      >
        <Typography level="body-md" sx={{ color: "neutral.500" }}>
          Open a sheet, manifest, or code file from the file tree.
        </Typography>
      </Sheet>
    );
  }

  if (activeTab.kind === "sheet") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <FormulaBar formulaBarState={formulaBarState} />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ExcelViewerDexie
            tabId={activeTab.id}
            file={activeTab.file}
            sheetIndex={activeTab.sheetIndex}
            onDirtyChange={onDirtyChange}
            onCellSelect={onCellSelect}
            onRangeSelect={onRangeSelect}
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

  if (activeTab.kind === "manifest" && manifestEditorData) {
    return (
      <ManifestEditorPanel
        manifest={manifestEditorData}
        loading={Boolean(activeManifestSession?.loading) && !manifestIsDirty}
        saving={Boolean(activeManifestSession?.saving)}
        isDirty={manifestIsDirty}
        error={activeManifestSession?.error}
        editable={canEditManifest}
        platformCapabilities={{
          platform: platformCapabilities.platform as "electron" | "web",
          canAccessFileSystem: platformCapabilities.canAccessFileSystem,
          canWorkOffline: platformCapabilities.canWorkOffline,
          hasNativeMenus: platformCapabilities.hasNativeMenus,
          canManageWindows: platformCapabilities.canManageWindows,
          hasSystemIntegration: platformCapabilities.hasSystemIntegration,
          canAutoUpdate: platformCapabilities.canAutoUpdate,
          hasNativeNotifications: platformCapabilities.hasNativeNotifications,
          canAccessClipboard: platformCapabilities.canAccessClipboard,
        }}
        onChange={(next) => onManifestChange(activeTab.workbookId, activeTab.file, next)}
        onSave={() => onSaveManifest(activeTab.workbookId, activeTab.file)}
        onReload={() => onReloadManifest(activeTab.file)}
      />
    );
  }

  if (activeTab.kind === "code") {
    const isDirty = activeCodeSession
      ? activeCodeSession.content !== activeCodeSession.originalContent
      : false;
    
    return (
      <CodeEditorPanel
        codeFile={activeTab.codeFile}
        content={activeCodeSession?.content ?? ""}
        loading={activeCodeSession ? activeCodeSession.loading : true}
        saving={activeCodeSession ? activeCodeSession.saving : false}
        isDirty={isDirty}
        error={activeCodeSession?.error}
        onChange={(value) => {
          onCodeChange(activeTab.codeFile, value);
          // Mark tab as dirty when code changes (similar to sheet's onDirtyChange)
          const willBeDirty = value !== activeCodeSession?.originalContent;
          onDirtyChange(willBeDirty);
        }}
        onSave={() => onSaveCode(activeTab.codeFile)}
        onCloseTab={() => onCloseCodeTab(activeTab.id)}
      />
    );
  }

  return null;
};
