import React from "react";
import { Sheet, Typography, Box } from "@mui/joy";
import {
  ExcelViewer,
  SheetSessionState,
  SearchNavigationCommand,
  ReplaceCommand,
  FormulaCommitCommand,
  ActiveCellDetails,
} from "../../workbook/components/ExcelViewer";
import { CodeEditorPanel } from "../../code-editor/CodeEditorPanel";
import { ManifestEditorPanel } from "../../manifest-editor/ManifestEditorPanel";
import { WorkbookTab } from "../../../types/tabs";
import { ExcelFile, CellPosition, CellRange, GridparkManifest, GridparkCodeFile } from "../../../types/excel";
import { ManifestSession } from "../../../hooks/useFileSessions";

interface EditorPanelProps {
  activeTab: WorkbookTab | null;
  activeSheetSession?: SheetSessionState;
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
  onSessionChange: (state: SheetSessionState) => void;
  onSaveSession: (state: SheetSessionState) => void;
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
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  activeTab,
  activeSheetSession,
  activeCodeSession,
  activeManifestSession,
  manifestEditorData,
  manifestIsDirty,
  canEditManifest,
  platformCapabilities,
  onSessionChange,
  onSaveSession,
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
      <ExcelViewer
        file={activeTab.file}
        sheetIndex={activeTab.sheetIndex}
        sessionState={activeSheetSession}
        onSessionChange={onSessionChange}
        onSaveSession={onSaveSession}
        onDirtyChange={onDirtyChange}
        onCellSelect={onCellSelect}
        onRangeSelect={onRangeSelect}
        searchQuery={sheetSearchQuery}
        searchNavigation={searchNavigation}
        replaceCommand={replaceCommand}
        formulaCommit={formulaCommitCommand}
        onActiveCellDetails={onActiveCellDetails}
      />
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
    return (
      <CodeEditorPanel
        codeFile={activeTab.codeFile}
        content={activeCodeSession?.content ?? ""}
        loading={activeCodeSession ? activeCodeSession.loading : true}
        saving={activeCodeSession ? activeCodeSession.saving : false}
        isDirty={
          activeCodeSession
            ? activeCodeSession.content !== activeCodeSession.originalContent
            : false
        }
        error={activeCodeSession?.error}
        onChange={(value) => onCodeChange(activeTab.codeFile, value)}
        onSave={() => onSaveCode(activeTab.codeFile)}
        onCloseTab={() => onCloseCodeTab(activeTab.id)}
      />
    );
  }

  return null;
};
