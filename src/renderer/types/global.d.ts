export {};

declare global {
  interface Window {
    electronAPI?: {
      setWindowTitle: (title: string) => void;
      onFilesOpened: (
        callback: (payload: { files: unknown; directoryName?: string }) => void
      ) => () => void;
      onThemePresetChange?: (callback: (presetId: string) => void) => () => void;
      gridpark?: {
        readFile: (payload: {
          path: string;
          rootDir: string;
        }) => Promise<{ success: boolean; content?: string; error?: string }>;
        writeFile: (payload: {
          path: string;
          rootDir: string;
          content: string;
        }) => Promise<{ success: boolean; error?: string }>;
        writeBinaryFile?: (payload: {
          path: string;
          rootDir: string;
          data: Uint8Array;
        }) => Promise<{ success: boolean; error?: string }>;
      };
    };
    gridpark?: {
      querySelector: (selector: string) => Element | null;
      querySelectorAll: (selector: string) => NodeListOf<Element>;
      on: (event: string, selector: string, handler: (event: any) => void) => () => void;
      watch: (type: string, handler: (event: any) => void) => () => void;
      dispose?: () => void;
    };
  }
}
