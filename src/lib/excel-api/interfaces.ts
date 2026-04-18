/**
 * Base interface for all proxy objects in the Excel API.
 */
export interface IProxyObject {
  /**
   * Queues a command to load the specified properties of the object.
   * You must call context.sync() before you can read these properties.
   */
  load(propertyNames?: string | string[]): this;
}

/**
 * Represents the font of a range.
 */
export interface IRangeFont {
  bold: boolean;
  italic: boolean;
  color: string;
  size: number;
  name: string;
}

/**
 * Represents the fill of a range.
 */
export interface IRangeFill {
  color: string;
}

/**
 * Represents a border of a range.
 */
export interface IRangeBorder {
  color: string;
  style: string;
}

/**
 * Represents the borders of a range.
 */
export interface IRangeBorders {
  readonly top: IRangeBorder;
  readonly bottom: IRangeBorder;
  readonly left: IRangeBorder;
  readonly right: IRangeBorder;
}

/**
 * Represents the formatting of a range.
 */
export interface IRangeFormat {
  readonly fill: IRangeFill;
  readonly font: IRangeFont;
  readonly borders: IRangeBorders;
}

/**
 * Represents a range of cells.
 */
export interface IRange extends IProxyObject {
  readonly address: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly rowIndex: number;
  readonly columnIndex: number;
  values: any[][];
  formulas: any[][];
  numberFormat: string[][];
  readonly format: IRangeFormat;
  /**
   * Clears the range.
   * @param option Optional. The type of clear to perform.
   */
  clear(option?: 'All' | 'Contents' | 'Formats'): void;
}

/**
 * Represents a worksheet in a workbook.
 */
export interface IWorksheet extends IProxyObject {
  readonly name: string;
  getRange(address: string): IRange;
  getUsedRange(): IRange;
  /**
   * Activates the worksheet.
   */
  activate(): void;
  /**
   * Deletes the worksheet.
   */
  delete(): void;
}

/**
 * A collection of worksheets in a workbook.
 */
export interface IWorksheetCollection extends IProxyObject {
  getActiveWorksheet(): IWorksheet;
  getItem(name: string): IWorksheet;
  add(name: string): IWorksheet;
}

/**
 * Represents a workbook.
 */
export interface IWorkbook extends IProxyObject {
  readonly name: string;
  readonly worksheets: IWorksheetCollection;
  getSelectedRange(): IRange;
}

/**
 * Command to be executed during sync.
 */
export interface ICommand {
  target: string;
  method: string;
  address?: string;
  args?: any[];
}

/**
 * Context for executing batch spreadsheet operations.
 */
export interface IRequestContext {
  readonly workbook: IWorkbook;
  sync(): Promise<void>;

  /**
   * Internal method to queue a command.
   */
  queueCommand(command: ICommand): void;

  /**
   * Internal method to register a proxy object for property loading.
   */
  addLoadedObject(obj: any): void;
}
