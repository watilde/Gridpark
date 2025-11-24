import React, { useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { Sheet, Box, Typography, Alert, CircularProgress } from "@mui/joy";
import { MonacoEditor, MonacoEditorHandle } from "./MonacoEditor";
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

/**
 * Ref handle exposed by CodeEditorPanel
 */
export interface CodeEditorPanelHandle {
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
}

export const CodeEditorPanel = forwardRef<CodeEditorPanelHandle, CodeEditorPanelProps>(({
  codeFile,
  content,
  loading,
  saving,
  isDirty,
  error,
  onChange,
  onSave: handleSaveRequest,
  onCloseTab,
}, ref) => {
  const monacoRef = useRef<MonacoEditorHandle>(null);
  const canSave = !loading && !saving && isDirty;
  const isMacPlatform =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Expose undo/redo methods via ref
  useImperativeHandle(ref, () => ({
    undo: () => {
      console.log('⏪ [CodeEditorPanel] Undo called', { hasMonacoRef: !!monacoRef.current });
      monacoRef.current?.undo();
    },
    redo: () => {
      console.log('⏩ [CodeEditorPanel] Redo called', { hasMonacoRef: !!monacoRef.current });
      monacoRef.current?.redo();
    },
    canUndo: () => {
      // No logging here - called every 200ms
      return monacoRef.current?.canUndo() ?? false;
    },
    canRedo: () => {
      // No logging here - called every 200ms
      return monacoRef.current?.canRedo() ?? false;
    },
  }), []);

  const runSave = useCallback(() => {
    if (!canSave) return;
    handleSaveRequest();
  }, [canSave, handleSaveRequest]);

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      // Handle Cmd+S (Mac) or Ctrl+S (Windows/Linux) for save
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        console.log('[CodeEditorPanel] Save shortcut detected', { 
          platform: isMacPlatform ? 'Mac' : 'Windows/Linux',
          metaKey: event.metaKey, 
          ctrlKey: event.ctrlKey,
          canSave
        });
        event.preventDefault();
        runSave();
        return;
      }
      // Handle Cmd+W (Mac) or Ctrl+W (Windows/Linux) for close tab
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") {
        if (!onCloseTab) return;
        console.log('[CodeEditorPanel] Close tab shortcut detected');
        event.preventDefault();
        onCloseTab();
      }
    },
    [runSave, onCloseTab, canSave, isMacPlatform],
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
            ref={monacoRef}
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
});

CodeEditorPanel.displayName = "GridparkCodeEditorPanel";
