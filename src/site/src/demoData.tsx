import type {
  ExcelFile,
  ExcelSheet,
  GridparkCodeFile,
  GridparkPackage,
} from "@renderer/types/excel";
import type { FileNode } from "@renderer/components/ui/features/FileTree/FileTree";

const createSheet = (name: string, rows: Array<Array<string | number>>) => {
  const data = rows.map((row) =>
    row.map((value) => ({
      value,
      type:
        typeof value === "number"
          ? "number"
          : value === ""
            ? "empty"
            : "string",
    })),
  );

  return {
    name,
    data,
    rowCount: data.length,
    colCount: data[0]?.length ?? 0,
  } satisfies ExcelSheet;
};

const demoSheets: ExcelSheet[] = [
  createSheet("Overview", [
    ["Region", "Revenue", "Change", "Status"],
    ["North", 182000, "+12%", "Growing"],
    ["South", 95000, "+2%", "Stable"],
    ["West", 124500, "-4%", "Focus"],
  ]),
  createSheet("Warehouse A", [
    ["Item", "Stock", "Status", "Notes"],
    ["LED Panels", 120, "Ready", "Live styling"],
    ["Microchips", 45, "Restock", "JS warning"],
    ["Fiber Units", 88, "Ready", "Synced"],
  ]),
  createSheet("Warehouse B", [
    ["Item", "Stock", "Status", "Notes"],
    ["Edge Nodes", 62, "Ready", ""],
    ["Batteries", 31, "Restock", ""],
  ]),
];

const normalizeSheetName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

const sheetCodeFiles = demoSheets.flatMap((sheet) => {
  const slug = normalizeSheetName(sheet.name);
  const basePath = `/demo/sheets/${slug}`;
  return [
    {
      id: `sheet-${slug}-main`,
      name: "main.js",
      relativePath: `sheets/${slug}/main.js`,
      absolutePath: `${basePath}/main.js`,
      rootDir: "/demo",
      scope: "sheet",
      role: "main",
      sheetName: sheet.name,
      language: "javascript",
      exists: true,
    },
    {
      id: `sheet-${slug}-style`,
      name: "style.css",
      relativePath: `sheets/${slug}/style.css`,
      absolutePath: `${basePath}/style.css`,
      rootDir: "/demo",
      scope: "sheet",
      role: "style",
      sheetName: sheet.name,
      language: "css",
      exists: true,
    },
  ] satisfies GridparkCodeFile[];
});

const demoCodeFiles: GridparkCodeFile[] = [
  {
    id: "workbook-main",
    name: "main.js",
    relativePath: "workbook/main.js",
    absolutePath: "/demo/workbook/main.js",
    rootDir: "/demo",
    scope: "workbook",
    role: "main",
    language: "javascript",
    exists: true,
  },
  {
    id: "workbook-style",
    name: "style.css",
    relativePath: "workbook/style.css",
    absolutePath: "/demo/workbook/style.css",
    rootDir: "/demo",
    scope: "workbook",
    role: "style",
    language: "css",
    exists: true,
  },
  ...sheetCodeFiles,
];

const demoPackage: GridparkPackage = {
  rootDir: "/demo",
  manifestPath: "/demo/.gridpark/manifest.json",
  files: demoCodeFiles,
};

export const demoWorkbook: ExcelFile = {
  name: "Inventory.xlsx",
  path: "/demo/Inventory.xlsx",
  sheets: demoSheets,
  lastModified: new Date(),
  manifest: {
    name: "Gridpark Inventory",
    version: "1.0.0",
    description: "Inventory dashboard",
    main: "workbook/main.js",
    style: "workbook/style.css",
  },
  gridparkPackage: demoPackage,
};

export const demoFileNodes: FileNode[] = [
  {
    id: "inventory-root",
    name: "Inventory.xlsx",
    type: "workbook",
    children: [
      {
        id: "inventory-sheets",
        name: "Sheets",
        type: "folder",
        parentId: "inventory-root",
        children: demoSheets.map((sheet, index) => {
          const jsFile = sheetCodeFiles.find(
            (file) => file.sheetName === sheet.name && file.role === "main",
          );
          const cssFile = sheetCodeFiles.find(
            (file) => file.sheetName === sheet.name && file.role === "style",
          );
          const sheetNodeId = `sheet-${index}`;
          const sheetChildren: FileNode[] = [];
          if (jsFile) {
            sheetChildren.push({
              id: `${sheetNodeId}-js`,
              name: "JavaScript",
              type: "code",
              parentId: sheetNodeId,
              codeFile: jsFile,
            });
          }
          if (cssFile) {
            sheetChildren.push({
              id: `${sheetNodeId}-css`,
              name: "CSS",
              type: "code",
              parentId: sheetNodeId,
              codeFile: cssFile,
            });
          }
          return {
            id: sheetNodeId,
            name: sheet.name,
            type: "sheet",
            sheetIndex: index,
            parentId: "inventory-sheets",
            children: sheetChildren,
          };
        }),
      },
      {
        id: "inventory-main",
        name: "JavaScript",
        type: "code",
        parentId: "inventory-root",
        codeFile: demoCodeFiles[0],
      },
      {
        id: "inventory-style",
        name: "CSS",
        type: "code",
        parentId: "inventory-root",
        codeFile: demoCodeFiles[1],
      },
    ],
  },
];

export const codeContents: Record<string, string> = {
  "/demo/workbook/main.js": demoCodeFiles[0]
    ? `document.addEventListener("change", (event) => {
  if (!event.target.matches('col[index="2"] cell')) return;
  const sum = [...document.querySelectorAll('col[index="2"] cell')]
    .reduce((acc, cell) => acc + Number(cell.value || 0), 0);
  document.querySelector('cell[name="Total"]').value = sum;
});`
    : "",
  "/demo/workbook/style.css": `cell[value="Restock"] {
  background: #ff6b3520;
  color: #ff6b35;
}

cell[ref="B2"] {
  font-weight: 600;
  color: #b197fc;
}`,
};
+
sheetCodeFiles.forEach((file) => {
  if (file.role === "main") {
    codeContents[file.absolutePath] = `// JavaScript for ${file.sheetName}
document.addEventListener("input", (event) => {
  if (!event.target.closest('[data-sheet-id="${file.sheetName}"]')) return;
  console.log("Live coding ${file.sheetName}", event.target.value);
});`;
  } else {
    codeContents[file.absolutePath] = `/* CSS for ${file.sheetName} */
.gp-sheet[data-sheet-id="${file.sheetName}"] cell[value="Restock"] {
  color: #ff6b35;
  font-weight: 600;
}`;
  }
});

export const demoCodeFile = demoCodeFiles[0];
