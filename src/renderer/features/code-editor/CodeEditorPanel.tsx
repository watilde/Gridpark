import React, { useEffect, useCallback } from "react";
import { Sheet, Box, Typography, Alert, CircularProgress } from "@mui/joy";
import { MonacoEditor } from "./MonacoEditor";
import { GridparkCodeFile } from "../../../../types/excel";

export interface CodeEditorPanelProps {
  codeFile: GridparkCodeFile;
  content: string;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCloseTab?: () => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  codeFile,
  content,
  loading,
  saving,
  isDirty,
  error,
  onChange,
  onSave: handleSaveRequest,
  onCloseTab,
}) => {
  const canSave = !loading && !saving && isDirty;
  const isMacPlatform =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const runSave = useCallback(() => {
    if (!canSave) return;
    handleSaveRequest();
  }, [canSave, handleSaveRequest]);

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        runSave();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") {
        if (!onCloseTab) return;
        event.preventDefault();
        onCloseTab();
      }
    },
    [runSave, onCloseTab],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleKeydown]);

  return (
    <Sheet
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 0,
      }}
    >
      {error && (
        <Alert variant="soft" color="danger">
          {error}
        </Alert>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <CircularProgress size="sm" />
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              Loading file…
            </Typography>
          </Box>
        ) : (
          <MonacoEditor
            value={content}
            onChange={onChange}
            onSave={(latestValue) => {
              if (latestValue !== content) {
                onChange(latestValue);
              }
              runSave();
            }}
            language={codeFile.language}
            height="100%"
            width="100%"
            readOnly={saving}
          />
        )}
      </Box>
    </Sheet>
  );
};

CodeEditorPanel.displayName = "GridparkCodeEditorPanel";
