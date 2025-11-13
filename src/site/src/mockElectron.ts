import type { GridparkCodeFile } from "@renderer/types/excel";

type GridparkReadFilePayload = { path: string; rootDir: string };
type GridparkWritePayload = GridparkReadFilePayload & { content: string };

declare global {
  interface Window {
    __gridparkDocsContent__?: Record<string, string>;
  }
}

const contentMap: Record<string, string> = {
  "/demo/workbook/main.js": `document.addEventListener("change", (event) => {
  if (!event.target.matches('col[index="2"] cell')) return;
  const sum = [...document.querySelectorAll('col[index="2"] cell')]
    .reduce((acc, cell) => acc + Number(cell.value || 0), 0);
  document.querySelector('cell[name="Total"]').value = sum;
});
`,
  "/demo/workbook/style.css": `cell[ref="B2"] {
  font-weight: 700;
  color: #b197fc;
}

cell[value="Restock"] {
  background: #ff6b3511;
  color: #ff6b35;
}
`,
};

const readFile = async ({
  path,
}: GridparkReadFilePayload): Promise<{ success: boolean; content?: string }> => {
  const content =
    window.__gridparkDocsContent__?.[path] ?? contentMap[path] ?? "";
  return { success: true, content };
};

const writeFile = async ({
  path,
  content,
}: GridparkWritePayload): Promise<{ success: boolean }> => {
  if (!window.__gridparkDocsContent__) {
    window.__gridparkDocsContent__ = {};
  }
  window.__gridparkDocsContent__![path] = content;
  return { success: true };
};

const noop = () => () => {};

if (typeof window !== "undefined" && !window.electronAPI) {
  window.electronAPI = {
    setWindowTitle: () => {},
    onFilesOpened: () => noop,
    onThemePresetChange: () => noop,
    gridpark: {
      readFile,
      writeFile,
    },
  };
}

export const registerCodeContent = (
  files: GridparkCodeFile[],
  content: Record<string, string>,
): void => {
  if (!window.__gridparkDocsContent__) {
    window.__gridparkDocsContent__ = {};
  }
  files.forEach((file) => {
    if (content[file.absolutePath]) {
      window.__gridparkDocsContent__![file.absolutePath] =
        content[file.absolutePath];
    }
  });
};
