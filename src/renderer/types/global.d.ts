export {};

declare global {
  interface Window {
    electronAPI?: {
      setWindowTitle: (title: string) => void;
    };
  }
}
