import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { styled } from "@mui/joy/styles";
import { Box, Sheet, Typography } from "@mui/joy";
import {
  ExcelFile,
  CellData,
  CellRange,
  CellPosition,
  CellStyle,
  GridparkCodeFile,
} from "../../../types/excel";

const ViewerContainer = styled(Sheet)({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  backgroundColor: "#ffffff",
  borderRadius: 0,
});

const GridContainer = styled(Box)({
  flex: 1,
  overflow: "auto",
  position: "relative",
  backgroundColor: "#ffffff",
});

const Grid = styled("table")({
  borderCollapse: "collapse",
  fontSize: "13px",
  fontFamily: "inherit",
  minWidth: "100%",
  userSelect: "none",
  color: "#000000",
});

const HeaderCell = styled("th")({
  position: "sticky",
  top: 0,
  left: 0,
  backgroundColor: "#ffffff",
  border: "1px solid #d1d1d1",
  padding: "4px 8px",
  fontWeight: 600,
  fontSize: "12px",
  textAlign: "center",
  minWidth: "64px",
  zIndex: 2,
});

const RowHeaderCell = styled("th")({
  position: "sticky",
  left: 0,
  backgroundColor: "#ffffff",
  border: "1px solid #d1d1d1",
  padding: "4px 8px",
  fontWeight: 600,
  fontSize: "12px",
  textAlign: "center",
  minWidth: "28px",
  maxWidth: "28px",
  width: "28px",
  zIndex: 1,
});

interface StyledCellProps {
  selected: boolean;
  inRange: boolean;
  customStyle?: CellStyle;
}

const Cell = styled("td", {
  shouldForwardProp: (prop) =>
    prop !== "selected" && prop !== "inRange" && prop !== "customStyle",
})<StyledCellProps>(({ selected, inRange, customStyle }) => ({
  border: "1px solid #e0e0e0",
  padding: "4px 8px",
  cursor: "cell",
  backgroundColor: selected
    ? "#cfe8ff"
    : inRange
      ? "#e5f2ff"
      : customStyle?.backgroundColor || "#ffffff",
  color: customStyle?.color || "#000000",
  fontWeight: customStyle?.fontWeight || "normal",
  fontStyle: customStyle?.fontStyle || "normal",
  textAlign: (customStyle?.textAlign as any) || "left",
  fontSize: customStyle?.fontSize || "inherit",
  ...(customStyle?.border && { border: customStyle.border }),
  "&:hover": {
    backgroundColor: selected ? "#cfe8ff" : "#f5f5f5",
  },
}));

const CellInput = styled("input")({
  width: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  font: "inherit",
  color: "inherit",
});

const cloneSheetData = (data: CellData[][]): CellData[][] =>
  data.map((row) => row.map((cell) => ({ ...cell })));

export type SheetSessionState = {
  data: CellData[][];
  dirty: boolean;
};

interface GridparkCellEvent {
  ref: string;
  value: string;
  row: number;
  col: number;
  sheet: string;
  element: HTMLElement | null;
}

const replaceToken = (input: string, regex: RegExp, replacer: string) =>
  input.replace(regex, replacer);

const transformGridparkSyntax = (source: string) => {
  if (!source) return source;
  let result = source;
  result = replaceToken(
    result,
    /sheet#([\w-]+)/gi,
    '.gp-sheet[data-sheet-id="$1"]',
  );
  result = replaceToken(
    result,
    /row\[index="([^"]+)"\]/gi,
    '.gp-row[data-row-index="$1"]',
  );
  result = replaceToken(
    result,
    /cell\[ref="([^"]+)"\]/gi,
    '.gp-cell[data-cell-ref="$1"]',
  );
  result = replaceToken(
    result,
    /col\[index="([^"]+)"\]/gi,
    '.gp-col[data-col-index="$1"]',
  );
  result = replaceToken(
    result,
    /(^|[^a-zA-Z0-9_-])sheet(?![a-zA-Z0-9_-])/gi,
    "$1.gp-sheet",
  );
  result = replaceToken(
    result,
    /(^|[^a-zA-Z0-9_-])row(?![a-zA-Z0-9_-])/gi,
    "$1.gp-row",
  );
  result = replaceToken(
    result,
    /(^|[^a-zA-Z0-9_-])cell(?![a-zA-Z0-9_-])/gi,
    "$1.gp-cell",
  );
  result = replaceToken(
    result,
    /(^|[^a-zA-Z0-9_-])col(?![a-zA-Z0-9_-])/gi,
    "$1.gp-col",
  );
  return result;
};

const scopeCssToSheet = (css: string, sheetName: string) => {
  if (!css) return css;
  return css.replace(/([^{}]+){/g, (match, selector) => {
    const normalized = selector.trim();
    if (!normalized) return match;
    return `.gp-sheet[data-sheet-id="${sheetName}"] ${normalized} {`;
  });
};

const getColumnWidth = (colIndex: number) => (colIndex === 0 ? 56 : 96);
const calculateRowHeaderWidth = (rowCount: number) => {
  const digits = rowCount > 0 ? Math.floor(Math.log10(rowCount)) + 1 : 1;
  return Math.max(20, 8 + digits * 8);
};

const columnStyle = (colIndex: number) => {
  const width = getColumnWidth(colIndex);
  return {
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
    width: `${width}px`,
  };
};

export interface ExcelViewerProps {
  file: ExcelFile | null;
  sheetIndex?: number;
  sessionState?: SheetSessionState;
  onSessionChange?: (state: SheetSessionState) => void;
  onSaveSession?: (state: SheetSessionState) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onCellSelect?: (position: CellPosition) => void;
  onRangeSelect?: (range: CellRange) => void;
}

/**
 * ExcelViewer Component with Cell Selection and Styling
 *
 * Features:
 * - Display Excel file content in a grid
 * - Single cell selection (click)
 * - Range selection (click and drag)
 * - Sheet selector
 * - JavaScript API for cell operations
 * - CSS API for cell styling
 */
export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  file,
  sheetIndex = 0,
  sessionState,
  onSessionChange,
  onSaveSession,
  onDirtyChange,
  onCellSelect,
  onRangeSelect,
}) => {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyle>>(
    new Map(),
  );
  const [gridData, setGridData] = useState<CellData[][]>([]);
  const [workbookCss, setWorkbookCss] = useState("");
  const [sheetCss, setSheetCss] = useState("");
  const [workbookScript, setWorkbookScript] = useState("");
  const gridRef = useRef<HTMLTableElement>(null);
  const watchersRef = useRef<Array<(event: GridparkCellEvent) => void>>([]);
  const latestGridDataRef = useRef<CellData[][]>([]);
  const dirtyRef = useRef<boolean>(sessionState?.dirty ?? false);
  const [hasLocalChanges, setHasLocalChanges] = useState<boolean>(
    sessionState?.dirty ?? false,
  );
  const notifyWatchers = useCallback((event: GridparkCellEvent) => {
    watchersRef.current.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Gridpark watcher error", error);
      }
    });
  }, []);

  const normalizedSheetIndex = useMemo(() => {
    if (!file || file.sheets.length === 0) return 0;
    const clampedIndex = Math.max(
      0,
      Math.min(sheetIndex, file.sheets.length - 1),
    );
    return clampedIndex;
  }, [file, sheetIndex]);

  const currentSheet = file?.sheets[normalizedSheetIndex] || null;
  const rowHeaderWidth = useMemo(
    () => calculateRowHeaderWidth(currentSheet?.rowCount ?? 1),
    [currentSheet?.rowCount],
  );
  const rowHeaderStyle = useMemo(
    () => ({
      minWidth: `${rowHeaderWidth}px`,
      maxWidth: `${rowHeaderWidth}px`,
      width: `${rowHeaderWidth}px`,
    }),
    [rowHeaderWidth],
  );
  const readGridparkFile = useCallback(async (codeFile?: GridparkCodeFile) => {
    if (!codeFile) return "";
    const api = window.electronAPI?.gridpark;
    if (!api?.readFile) return "";
    try {
      const response = await api.readFile({
        path: codeFile.absolutePath,
        rootDir: codeFile.rootDir,
      });
      if (response?.success) {
        return response.content ?? "";
      }
    } catch (error) {
      console.warn(
        "Failed to read Gridpark file",
        codeFile.absolutePath,
        error,
      );
    }
    return "";
  }, []);

  const sheetData = useMemo(() => {
    if (gridData.length > 0) return gridData;
    return currentSheet?.data ?? [];
  }, [gridData, currentSheet]);

  useEffect(() => {
    if (sessionState && sessionState.data.length) {
      setGridData(cloneSheetData(sessionState.data));
      setHasLocalChanges(sessionState.dirty);
      return;
    }
    if (currentSheet) {
      setGridData(cloneSheetData(currentSheet.data));
      setHasLocalChanges(false);
    } else {
      setGridData([]);
      setHasLocalChanges(false);
    }
  }, [currentSheet, sessionState]);

  useEffect(() => {
    latestGridDataRef.current = gridData;
  }, [gridData]);

  useEffect(() => {
    dirtyRef.current = hasLocalChanges;
    onDirtyChange?.(hasLocalChanges);
  }, [hasLocalChanges, onDirtyChange]);

  useEffect(() => {
    return () => {
      if (onSessionChange) {
        onSessionChange({
          data: latestGridDataRef.current,
          dirty: dirtyRef.current,
        });
      }
    };
  }, [onSessionChange]);

  const handleSheetSave = useCallback(() => {
    if (!onSaveSession) return;
    const snapshot = cloneSheetData(latestGridDataRef.current);
    onSaveSession({ data: snapshot, dirty: false });
    dirtyRef.current = false;
    setHasLocalChanges(false);
  }, [onSaveSession]);

  useEffect(() => {
    if (!onSaveSession) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSheetSave();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleSheetSave, onSaveSession]);

  useEffect(() => {
    const cssChunks: string[] = [];
    if (workbookCss) {
      cssChunks.push(transformGridparkSyntax(workbookCss));
    }
    if (sheetCss && currentSheet) {
      const transformed = transformGridparkSyntax(sheetCss);
      cssChunks.push(scopeCssToSheet(transformed, currentSheet.name));
    }
    if (!cssChunks.length) return;
    const styleEl = document.createElement("style");
    styleEl.dataset.gridparkStyle = currentSheet
      ? `sheet-${currentSheet.name}`
      : "workbook";
    styleEl.textContent = cssChunks.join("\n");
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, [workbookCss, sheetCss, currentSheet]);

  useEffect(() => {
    let cancelled = false;
    const pkg = file?.gridparkPackage;
    if (!pkg) {
      setWorkbookCss("");
      setWorkbookScript("");
      return;
    }
    const globalCssFile = pkg.files.find(
      (f) => f.scope === "workbook" && f.role === "style",
    );
    const globalJsFile = pkg.files.find(
      (f) => f.scope === "workbook" && f.role === "main",
    );
    (async () => {
      const [cssContent, jsContent] = await Promise.all([
        readGridparkFile(globalCssFile),
        readGridparkFile(globalJsFile),
      ]);
      if (cancelled) return;
      setWorkbookCss(cssContent);
      setWorkbookScript(jsContent);
    })();
    return () => {
      cancelled = true;
    };
  }, [file?.gridparkPackage, file?.path, readGridparkFile]);

  useEffect(() => {
    let cancelled = false;
    const pkg = file?.gridparkPackage;
    const sheetName = currentSheet?.name;
    if (!pkg || !sheetName) {
      setSheetCss("");
      return;
    }
    const sheetCssFile = pkg.files.find(
      (f) =>
        f.scope === "sheet" && f.role === "style" && f.sheetName === sheetName,
    );
    (async () => {
      const cssContent = await readGridparkFile(sheetCssFile);
      if (cancelled) return;
      setSheetCss(cssContent);
    })();
    return () => {
      cancelled = true;
    };
  }, [file?.gridparkPackage, currentSheet?.name, readGridparkFile]);

  const transformSelectorForQuery = useCallback(
    (selector: string) => transformGridparkSyntax(selector),
    [],
  );

  const createGridparkEventDetail = useCallback(
    (row: number, col: number, value: string): GridparkCellEvent | null => {
      if (!currentSheet) return null;
      const ref = `${getColumnLabel(col)}${row + 1}`;
      const element = gridRef.current?.querySelector(
        `[data-cell-ref="${ref}"]`,
      ) as HTMLElement | null;
      return {
        ref,
        value,
        row,
        col,
        sheet: currentSheet.name,
        element,
      };
    },
    [currentSheet],
  );

  const dispatchGridparkEvent = useCallback(
    (name: string, detail: GridparkCellEvent | { sheet: string }) => {
      document.dispatchEvent(new CustomEvent(name, { detail }));
    },
    [],
  );

  const registerGridparkApi = useCallback(
    (script: string) => {
      const disposers: Array<() => void> = [];
      watchersRef.current = [];
      const api = {
        querySelector: (selector: string) =>
          document.querySelector(transformSelectorForQuery(selector)),
        querySelectorAll: (selector: string) =>
          document.querySelectorAll(transformSelectorForQuery(selector)),
        on: (
          event: string,
          selector: string,
          handler: (event: any) => void,
        ) => {
          const selectorTransformed = selector
            ? transformSelectorForQuery(selector)
            : null;
          const eventMap: Record<string, string> = {
            hover: "pointerover",
            change: "gridpark:cell-change",
            select: "gridpark:cell-select",
            render: "gridpark:render",
          };
          const domEvent = eventMap[event] ?? event;
          const listener = (domEventObj: Event) => {
            if (
              domEvent.startsWith("gridpark:") &&
              domEventObj instanceof CustomEvent
            ) {
              handler(domEventObj.detail);
              return;
            }
            const target = domEventObj.target as Element | null;
            if (selectorTransformed) {
              const matched = target?.closest(selectorTransformed);
              if (!matched) return;
              handler({ ...domEventObj, target: matched });
            } else {
              handler(domEventObj);
            }
          };
          document.addEventListener(domEvent, listener as EventListener);
          const dispose = () =>
            document.removeEventListener(domEvent, listener as EventListener);
          disposers.push(dispose);
          return dispose;
        },
        watch: (type: string, handler: (event: GridparkCellEvent) => void) => {
          if (type !== "cell") return () => {};
          watchersRef.current.push(handler);
          const dispose = () => {
            watchersRef.current = watchersRef.current.filter(
              (fn) => fn !== handler,
            );
          };
          disposers.push(dispose);
          return dispose;
        },
        dispose: () => {
          disposers.forEach((fn) => fn());
          watchersRef.current = [];
        },
      };

      (window as any).gridpark = api;
      if (script.trim()) {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function("gridpark", script);
          fn(api);
        } catch (error) {
          console.error("Gridpark script error", error);
        }
      }
      return api;
    },
    [transformSelectorForQuery],
  );

  useEffect(() => {
    const api = registerGridparkApi(workbookScript || "");
    return () => {
      api.dispose();
      if ((window as any).gridpark === api) {
        delete (window as any).gridpark;
      }
    };
  }, [registerGridparkApi, workbookScript]);

  useEffect(() => {
    if (!currentSheet) return;
    dispatchGridparkEvent("gridpark:render", { sheet: currentSheet.name });
  }, [currentSheet, dispatchGridparkEvent]);

  // Generate column headers (A, B, C, ...)
  function getColumnLabel(index: number): string {
    let label = "";
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }

  // Get cell key for styling
  const getCellKey = (row: number, col: number): string => {
    return `${row}-${col}`;
  };

  // Check if cell is in selection range
  const isCellInRange = (row: number, col: number): boolean => {
    if (!selectionRange) return false;
    return (
      row >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
      row <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
      col >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
      col <= Math.max(selectionRange.startCol, selectionRange.endCol)
    );
  };

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = (row: number, col: number) => {
    const position = { row, col };
    setSelectedCell(position);
    setSelectionRange({
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    });
    setIsSelecting(true);
    onCellSelect?.(position);
    const cellValue = sheetData[row]?.[col]?.value;
    const eventDetail =
      cellValue !== undefined
        ? createGridparkEventDetail(
            row,
            col,
            cellValue != null ? String(cellValue) : "",
          )
        : null;
    if (eventDetail) {
      dispatchGridparkEvent("gridpark:cell-select", eventDetail);
    }
  };

  // Handle cell mouse enter (during selection)
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionRange) return;
    setSelectionRange({
      ...selectionRange,
      endRow: row,
      endCol: col,
    });
  };

  // Handle mouse up (end selection)
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionRange) {
      setIsSelecting(false);
      onRangeSelect?.(selectionRange);
    }
  }, [isSelecting, selectionRange, onRangeSelect]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      setGridData((prev) => {
        if (!prev.length) return prev;
        return prev.map((rowData, rowIndex) =>
          rowIndex === row
            ? rowData.map((cellData, colIndex) =>
                colIndex === col
                  ? {
                      ...cellData,
                      value,
                      type:
                        value === ""
                          ? "empty"
                          : isNaN(Number(value))
                            ? "string"
                            : "number",
                    }
                  : cellData,
              )
            : rowData,
        );
      });
      dirtyRef.current = true;
      setHasLocalChanges(true);
      const detail = createGridparkEventDetail(row, col, value);
      if (detail) {
        notifyWatchers(detail);
        dispatchGridparkEvent("gridpark:cell-change", detail);
      }
    },
    [createGridparkEventDetail, dispatchGridparkEvent, notifyWatchers],
  );

  // Public API: Get cell value
  const getCellValue = useCallback(
    (row: number, col: number): CellData | null => {
      if (!sheetData || row < 0 || col < 0) return null;
      if (row >= sheetData.length || col >= sheetData[row].length) return null;
      return sheetData[row][col];
    },
    [sheetData],
  );

  // Public API: Set cell style
  const setCellStyle = useCallback(
    (row: number, col: number, style: CellStyle) => {
      setCellStyles((prev) => {
        const newStyles = new Map(prev);
        newStyles.set(getCellKey(row, col), style);
        return newStyles;
      });
    },
    [],
  );

  // Public API: Set range style
  const setRangeStyle = useCallback((range: CellRange, style: CellStyle) => {
    setCellStyles((prev) => {
      const newStyles = new Map(prev);
      for (
        let row = Math.min(range.startRow, range.endRow);
        row <= Math.max(range.startRow, range.endRow);
        row++
      ) {
        for (
          let col = Math.min(range.startCol, range.endCol);
          col <= Math.max(range.startCol, range.endCol);
          col++
        ) {
          newStyles.set(getCellKey(row, col), style);
        }
      }
      return newStyles;
    });
  }, []);

  // Public API: Clear cell style
  const clearCellStyle = useCallback((row: number, col: number) => {
    setCellStyles((prev) => {
      const newStyles = new Map(prev);
      newStyles.delete(getCellKey(row, col));
      return newStyles;
    });
  }, []);

  // Public API: Clear all styles
  const clearAllStyles = useCallback(() => {
    setCellStyles(new Map());
  }, []);

  // Expose API via ref (for external JavaScript access)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).gridparkAPI = {
        getCellValue,
        setCellStyle,
        setRangeStyle,
        clearCellStyle,
        clearAllStyles,
        getSelectedCell: () => selectedCell,
        getSelectionRange: () => selectionRange,
      };
    }
  }, [
    getCellValue,
    setCellStyle,
    setRangeStyle,
    clearCellStyle,
    clearAllStyles,
    selectedCell,
    selectionRange,
  ]);

  if (!file || !currentSheet) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "sm",
        }}
      >
        <Typography level="body-md" sx={{ color: "neutral.500" }}>
          No file selected. Please select an Excel file from the file tree.
        </Typography>
      </Sheet>
    );
  }

  return (
    <ViewerContainer variant="plain">
      <GridContainer>
        <Box className="gp-sheet" data-sheet-id={currentSheet?.name ?? ""}>
          <Grid ref={gridRef} className="gp-grid">
            <thead>
              <tr>
                <HeaderCell style={rowHeaderStyle} className="gp-col-header" />
                {Array.from({ length: currentSheet.colCount }, (_, i) => (
                  <HeaderCell
                    key={i}
                    style={columnStyle(i)}
                    className="gp-col"
                    data-col-index={i + 1}
                  >
                    {getColumnLabel(i)}
                  </HeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.map((row: CellData[], rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className="gp-row"
                  data-row-index={rowIndex + 1}
                >
                  <RowHeaderCell style={rowHeaderStyle}>
                    {rowIndex + 1}
                  </RowHeaderCell>
                  {row.map((cell: CellData, colIndex: number) => (
                    <Cell
                      key={colIndex}
                      className="gp-cell"
                      data-row-index={rowIndex + 1}
                      data-col-index={colIndex + 1}
                      data-cell-ref={`${getColumnLabel(colIndex)}${rowIndex + 1}`}
                      style={columnStyle(colIndex)}
                      selected={
                        selectedCell?.row === rowIndex &&
                        selectedCell?.col === colIndex
                      }
                      inRange={isCellInRange(rowIndex, colIndex)}
                      customStyle={cellStyles.get(
                        getCellKey(rowIndex, colIndex),
                      )}
                      onMouseDown={() =>
                        handleCellMouseDown(rowIndex, colIndex)
                      }
                      onMouseEnter={() =>
                        handleCellMouseEnter(rowIndex, colIndex)
                      }
                    >
                      <CellInput
                        value={
                          cell.value !== null && cell.value !== undefined
                            ? String(cell.value)
                            : ""
                        }
                        onChange={(event) =>
                          handleCellChange(
                            rowIndex,
                            colIndex,
                            event.target.value,
                          )
                        }
                      />
                    </Cell>
                  ))}
                </tr>
              ))}
            </tbody>
          </Grid>
        </Box>
      </GridContainer>
    </ViewerContainer>
  );
};

ExcelViewer.displayName = "GridparkExcelViewer";
