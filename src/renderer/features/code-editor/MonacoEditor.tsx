import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { Box } from "@mui/joy";
import { styled } from "@mui/joy/styles";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco Editor to use local workers instead of CDN
// Only load essential languages: JavaScript, TypeScript, JSON, CSS, HTML
let monacoConfigured = false;

const configureMonaco = () => {
  if (monacoConfigured || typeof window === 'undefined') return;
  
  // @ts-expect-error - Monaco worker environment
  self.MonacoEnvironment = {
    getWorker(_: unknown, label: string) {
      if (label === 'json') {
        return new jsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new htmlWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
  
  monacoConfigured = true;
};

const EditorContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  minHeight: "200px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  fontFamily: '"JetBrains Mono", monospace',
  backgroundColor: theme.palette.background.surface,
  overflow: "hidden",
  "& .monaco-editor": {
    backgroundColor: "transparent",
    fontFamily: '"JetBrains Mono", monospace',
  },
  "&:focus-within": {
    outline: `2px solid ${theme.palette.primary[400]}`,
    outlineOffset: "2px",
  },
}));

export interface MonacoEditorProps {
  /**
   * Editor content value
   */
  value?: string;
  /**
   * Language mode (javascript, typescript, json, etc.)
   */
  language?: string;
  /**
   * Height of the editor
   */
  height?: string | number;
  /**
   * Width of the editor
   */
  width?: string | number;
  /**
   * Read-only mode
   */
  readOnly?: boolean;
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  /**
   * Save handler (Cmd/Ctrl + S)
   */
  onSave?: (value: string) => void;
  /**
   * Theme for the editor
   */
  theme?: "vs" | "vs-dark" | "hc-black";
  /**
   * Monaco editor options
   */
  options?: MonacoEditor.IStandaloneEditorConstructionOptions;
}

/**
 * Gridpark Monaco Editor Component
 *
 * A code editor component based on Monaco Editor with Gridpark design principles:
 * - Code-first experience with syntax highlighting
 * - Developer-friendly with monospace fonts and dark theme
 * - Immediate feedback and accessibility features
 * - Hackable through Monaco editor options
 *
 * Note: Requires @monaco-editor/react + monaco-editor.
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = "",
  language = "javascript",
  height = "200px",
  width = "100%",
  readOnly = false,
  onChange,
  onSave,
  theme = "vs-dark",
  options,
}) => {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const onSaveRef = useRef(onSave);
  const readOnlyRef = useRef(readOnly);

  onSaveRef.current = onSave;
  readOnlyRef.current = readOnly;

  // Configure Monaco workers on mount
  useEffect(() => {
    configureMonaco();
  }, []);

  const editorOptions =
    useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(
      () => ({
        fontSize: 14,
        fontFamily: '"JetBrains Mono", monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly,
        wordWrap: "on",
        contextmenu: true,
        smoothScrolling: true,
        lineNumbersMinChars: 2,
        lineDecorationsWidth: 8,
        ...options,
      }),
      [options, readOnly],
    );

  const normalizedTheme =
    theme === "hc-black" ? "hc-black" : theme === "vs-dark" ? "vs-dark" : "vs";

  const handleMount = useCallback<OnMount>((editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    // Register Cmd+S (Mac) or Ctrl+S (Windows/Linux) shortcut
    // KeyMod.CtrlCmd automatically uses the correct modifier for the platform
    editorInstance.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      () => {
        console.log('[MonacoEditor] Save command triggered', {
          hasOnSave: !!onSaveRef.current,
          readOnly: readOnlyRef.current
        });
        if (!onSaveRef.current || readOnlyRef.current) return;
        onSaveRef.current(editorInstance.getValue());
      },
    );
  }, []);

  return (
    <EditorContainer sx={{ height, width }}>
      <Editor
        height="100%"
        width="100%"
        value={value}
        defaultValue={value}
        language={language}
        theme={normalizedTheme}
        options={editorOptions}
        onChange={(nextValue) => onChange?.(nextValue ?? "")}
        onMount={handleMount}
        loading={<Box sx={{ p: 2 }}>Loading editor…</Box>}
      />
    </EditorContainer>
  );
};

MonacoEditor.displayName = "GridparkMonacoEditor";
