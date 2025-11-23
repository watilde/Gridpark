import type {
  ExcelFile,
  ExcelSheet,
  GridparkCodeFile,
  GridparkPackage,
} from "@renderer/types/excel";
import type { FileNode } from "@renderer/features/FileTree/FileTree";

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
  createSheet("Walk_Data", [
    [
      "Date",
      "Dog_Name",
      "Route_ID",
      "Distance_meters",
      "Sniff_Points",
      "Dog_Motivation (1–10)",
      "Happiness (1–10)",
    ],
    ["2024-09-01", "Mochi", "R-01", 3400, 12, 9, 10],
    ["2024-09-01", "Haru", "R-02", 2800, 9, 8, 9],
    ["2024-09-02", "Yuzu", "R-03", 4100, 18, 7, 10],
    ["2024-09-03", "Koko", "R-02", 2950, 11, 8, 9],
    ["2024-09-04", "Mochi", "R-01", 3600, 15, 10, 10],
    ["2024-09-05", "Sora", "R-04", 2200, 8, 7, 8],
    ["2024-09-06", "Pip", "R-03", 4300, 20, 9, 9],
    ["2024-09-07", "Miso", "R-05", 2600, 6, 6, 7],
  ]),
  createSheet("Route_Master", [
    ["Route_ID", "Route_Name", "Distance_meters", "Path_Type", "Dog_Friendliness (1–10)"],
    ["R-01", "Downtown Loop", 3500, "Road", 8],
    ["R-02", "Canal Park Cruise", 2950, "Park", 10],
    ["R-03", "Riverside Sprint", 4200, "Riverside", 9],
    ["R-04", "Elm Street Stroll", 2100, "Road", 7],
    ["R-05", "Meadow Circuit", 2600, "Park", 9],
    ["R-06", "Harbor Run", 3800, "Riverside", 8],
    ["R-07", "Sunset Ridge", 3100, "Road", 8],
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
      name: "script.js",
      relativePath: `sheets/${slug}/script.js`,
      absolutePath: `${basePath}/script.js`,
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
    name: "script.js",
    relativePath: "workbook/script.js",
    absolutePath: "/demo/workbook/script.js",
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
  name: "Dog_Walking_Route_Optimizer.xlsx",
  path: "/demo/Dog_Walking_Route_Optimizer.xlsx",
  sheets: demoSheets,
  lastModified: new Date(),
  manifest: {
    name: "Dog Walking Route Optimizer",
    version: "1.0.0",
    description: "Route planner for happy pups",
    script: "workbook/script.js",
    style: "workbook/style.css",
  },
  gridparkPackage: demoPackage,
};

export const demoFileNodes: FileNode[] = [
  {
    id: "walk-root",
    name: "Dog_Walking_Route_Optimizer.xlsx",
    type: "workbook",
    children: [
      {
        id: "walk-sheets",
        name: "Sheets",
        type: "folder",
        parentId: "walk-root",
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
            parentId: "walk-sheets",
            children: sheetChildren,
          };
        }),
      },
      {
        id: "walk-main",
        name: "JavaScript",
        type: "code",
        parentId: "walk-root",
        codeFile: demoCodeFiles[0],
      },
      {
        id: "walk-style",
        name: "CSS",
        type: "code",
        parentId: "walk-root",
        codeFile: demoCodeFiles[1],
      },
    ],
  },
];

export const codeContents: Record<string,string> = {
  "/demo/workbook/script.js": "",
  "/demo/workbook/style.css": "",
};

sheetCodeFiles.forEach((file) => {
  codeContents[file.absolutePath] = "";
});

export const demoCodeFile = demoCodeFiles[0];
