import { useImperativeHandle, useCallback, Ref } from "react";
import type * as Monaco from "monaco-editor";

/**
 * Monaco Editor Ref API
 * Exposes methods for parent components to interact with Monaco Editor
 */
export interface MonacoEditorRef {
  /**
   * Get the current editor instance
   */
  getEditor: () => Monaco.editor.IStandaloneCodeEditor | null;

  /**
   * Get current editor value
   */
  getValue: () => string;

  /**
   * Set editor value
   */
  setValue: (value: string) => void;

  /**
   * Insert text at cursor position
   */
  insertText: (text: string) => void;

  /**
   * Focus the editor
   */
  focus: () => void;

  /**
   * Get current cursor position
   */
  getCursorPosition: () => { line: number; column: number } | null;

  /**
   * Set cursor position
   */
  setCursorPosition: (line: number, column: number) => void;

  /**
   * Get selected text
   */
  getSelectedText: () => string;

  /**
   * Replace selected text
   */
  replaceSelection: (text: string) => void;

  /**
   * Format document
   */
  formatDocument: () => void;

  /**
   * Trigger save action
   */
  save: () => void;

  /**
   * Undo last action
   */
  undo: () => void;

  /**
   * Redo last undone action
   */
  redo: () => void;

  /**
   * Find text in editor
   */
  find: (text: string) => void;

  /**
   * Replace text in editor
   */
  replace: (find: string, replace: string) => void;

  /**
   * Go to line
   */
  gotoLine: (line: number) => void;
}

/**
 * Hook to create Monaco Editor ref API using useImperativeHandle
 */
export const useMonacoEditorRef = (
  ref: Ref<MonacoEditorRef>,
  deps: {
    editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
    onSave?: () => void;
  }
) => {
  const { editorRef, onSave } = deps;

  const getEditor = useCallback(() => {
    return editorRef.current;
  }, [editorRef]);

  const getValue = useCallback(() => {
    return editorRef.current?.getValue() ?? "";
  }, [editorRef]);

  const setValue = useCallback(
    (value: string) => {
      editorRef.current?.setValue(value);
    },
    [editorRef]
  );

  const insertText = useCallback(
    (text: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const selection = editor.getSelection();
      if (selection) {
        editor.executeEdits("", [
          {
            range: selection,
            text,
          },
        ]);
      }
    },
    [editorRef]
  );

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, [editorRef]);

  const getCursorPosition = useCallback(() => {
    const position = editorRef.current?.getPosition();
    if (!position) return null;
    return {
      line: position.lineNumber,
      column: position.column,
    };
  }, [editorRef]);

  const setCursorPosition = useCallback(
    (line: number, column: number) => {
      editorRef.current?.setPosition({ lineNumber: line, column });
    },
    [editorRef]
  );

  const getSelectedText = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return "";

    const selection = editor.getSelection();
    if (!selection) return "";

    return editor.getModel()?.getValueInRange(selection) ?? "";
  }, [editorRef]);

  const replaceSelection = useCallback(
    (text: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const selection = editor.getSelection();
      if (selection) {
        editor.executeEdits("", [
          {
            range: selection,
            text,
          },
        ]);
      }
    },
    [editorRef]
  );

  const formatDocument = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, [editorRef]);

  const save = useCallback(() => {
    if (onSave) {
      onSave();
    } else {
      console.warn("No save handler provided to Monaco Editor");
    }
  }, [onSave]);

  const undo = useCallback(() => {
    editorRef.current?.trigger("keyboard", "undo", {});
  }, [editorRef]);

  const redo = useCallback(() => {
    editorRef.current?.trigger("keyboard", "redo", {});
  }, [editorRef]);

  const find = useCallback(
    (text: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const action = editor.getAction("actions.find");
      if (action) {
        action.run();
        // Note: Monaco's find widget will open, but we can't directly set the search text
        // This would require accessing Monaco's internal find controller
      }
    },
    [editorRef]
  );

  const replace = useCallback(
    (findText: string, replaceText: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const action = editor.getAction("editor.action.startFindReplaceAction");
      if (action) {
        action.run();
      }
    },
    [editorRef]
  );

  const gotoLine = useCallback(
    (line: number) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
    },
    [editorRef]
  );

  useImperativeHandle(
    ref,
    () => ({
      getEditor,
      getValue,
      setValue,
      insertText,
      focus,
      getCursorPosition,
      setCursorPosition,
      getSelectedText,
      replaceSelection,
      formatDocument,
      save,
      undo,
      redo,
      find,
      replace,
      gotoLine,
    }),
    [
      getEditor,
      getValue,
      setValue,
      insertText,
      focus,
      getCursorPosition,
      setCursorPosition,
      getSelectedText,
      replaceSelection,
      formatDocument,
      save,
      undo,
      redo,
      find,
      replace,
      gotoLine,
    ]
  );
};
