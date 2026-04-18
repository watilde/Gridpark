import { IProxyObject, IRange, IWorksheet, IWorksheetCollection, IWorkbook, IRequestContext, IRangeFormat, IRangeFont, IRangeFill, IRangeBorders, IRangeBorder, ICommand } from './interfaces';

/**
 * Base class for all proxy objects.
 */
export abstract class BaseProxy implements IProxyObject {
  protected _loadedProperties = new Set<string>();
  protected _isInitialized = false;

  constructor(protected context: IRequestContext) {}

  load(propertyNames?: string | string[]): this {
    if (!propertyNames) {
      this._loadedProperties.add('*');
    } else {
      const props = typeof propertyNames === 'string' 
        ? propertyNames.split(',').map(p => p.trim())
        : propertyNames;
      props.forEach(p => this._loadedProperties.add(p));
    }
    this.context.addLoadedObject(this);
    return this;
  }

  /**
   * Internal method to update the proxy object with data from the host.
   */
  abstract _setLoadedData(data: any): void;

  /**
   * Internal method to get the list of properties to load.
   */
  _getPropertiesToLoad(): string[] {
    return Array.from(this._loadedProperties);
  }

  protected checkLoaded(property: string) {
    if (!this._isInitialized && !this._loadedProperties.has(property) && !this._loadedProperties.has('*')) {
      // Check if any parent property is loaded (e.g., if 'font' is loaded, 'font/bold' is also considered loaded)
      const parts = property.split('/');
      let current = '';
      for (let i = 0; i < parts.length; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        if (this._loadedProperties.has(current)) return;
      }
      
      throw new Error(`Property '${property}' is not loaded. Use object.load('${property}') and context.sync() before accessing it.`);
    }
  }
}

export class RangeFontProxy extends BaseProxy implements IRangeFont {
  private _bold: boolean = false;
  private _italic: boolean = false;
  private _color: string = '';
  private _size: number = 11;
  private _name: string = 'Calibri';

  constructor(context: IRequestContext, private _address: string) {
    super(context);
  }

  get bold(): boolean { this.checkLoaded('bold'); return this._bold; }
  set bold(value: boolean) {
    this._bold = value;
    this.context.queueCommand({ target: 'RangeFont', method: 'setBold', address: this._address, args: [value] });
  }

  get italic(): boolean { this.checkLoaded('italic'); return this._italic; }
  set italic(value: boolean) {
    this._italic = value;
    this.context.queueCommand({ target: 'RangeFont', method: 'setItalic', address: this._address, args: [value] });
  }

  get color(): string { this.checkLoaded('color'); return this._color; }
  set color(value: string) {
    this._color = value;
    this.context.queueCommand({ target: 'RangeFont', method: 'setColor', address: this._address, args: [value] });
  }

  get size(): number { this.checkLoaded('size'); return this._size; }
  set size(value: number) {
    this._size = value;
    this.context.queueCommand({ target: 'RangeFont', method: 'setSize', address: this._address, args: [value] });
  }

  get name(): string { this.checkLoaded('name'); return this._name; }
  set name(value: string) {
    this._name = value;
    this.context.queueCommand({ target: 'RangeFont', method: 'setName', address: this._address, args: [value] });
  }

  _setLoadedData(data: any): void {
    if (data.bold !== undefined) this._bold = data.bold;
    if (data.italic !== undefined) this._italic = data.italic;
    if (data.color !== undefined) this._color = data.color;
    if (data.size !== undefined) this._size = data.size;
    if (data.name !== undefined) this._name = data.name;
    this._isInitialized = true;
  }
}

export class RangeFillProxy extends BaseProxy implements IRangeFill {
  private _color: string = '';

  constructor(context: IRequestContext, private _address: string) {
    super(context);
  }

  get color(): string { this.checkLoaded('color'); return this._color; }
  set color(value: string) {
    this._color = value;
    this.context.queueCommand({ target: 'RangeFill', method: 'setColor', address: this._address, args: [value] });
  }

  _setLoadedData(data: any): void {
    if (data.color !== undefined) this._color = data.color;
    this._isInitialized = true;
  }
}

export class RangeBorderProxy extends BaseProxy implements IRangeBorder {
  private _color: string = '';
  private _style: string = 'None';

  constructor(context: IRequestContext, private _address: string, private _side: string) {
    super(context);
  }

  get color(): string { this.checkLoaded('color'); return this._color; }
  set color(value: string) {
    this._color = value;
    this.context.queueCommand({ target: 'RangeBorder', method: 'setColor', address: this._address, args: [this._side, value] });
  }

  get style(): string { this.checkLoaded('style'); return this._style; }
  set style(value: string) {
    this._style = value;
    this.context.queueCommand({ target: 'RangeBorder', method: 'setStyle', address: this._address, args: [this._side, value] });
  }

  _setLoadedData(data: any): void {
    if (data.color !== undefined) this._color = data.color;
    if (data.style !== undefined) this._style = data.style;
    this._isInitialized = true;
  }
}

export class RangeBordersProxy extends BaseProxy implements IRangeBorders {
  private _top: RangeBorderProxy;
  private _bottom: RangeBorderProxy;
  private _left: RangeBorderProxy;
  private _right: RangeBorderProxy;

  constructor(context: IRequestContext, address: string) {
    super(context);
    this._top = new RangeBorderProxy(context, address, 'top');
    this._bottom = new RangeBorderProxy(context, address, 'bottom');
    this._left = new RangeBorderProxy(context, address, 'left');
    this._right = new RangeBorderProxy(context, address, 'right');
  }

  get top(): IRangeBorder { return this._top; }
  get bottom(): IRangeBorder { return this._bottom; }
  get left(): IRangeBorder { return this._left; }
  get right(): IRangeBorder { return this._right; }

  _setLoadedData(data: any): void {
    if (data.top) this._top._setLoadedData(data.top);
    if (data.bottom) this._bottom._setLoadedData(data.bottom);
    if (data.left) this._left._setLoadedData(data.left);
    if (data.right) this._right._setLoadedData(data.right);
    this._isInitialized = true;
  }
}

export class RangeFormatProxy extends BaseProxy implements IRangeFormat {
  private _fill: RangeFillProxy;
  private _font: RangeFontProxy;
  private _borders: RangeBordersProxy;

  constructor(context: IRequestContext, address: string) {
    super(context);
    this._fill = new RangeFillProxy(context, address);
    this._font = new RangeFontProxy(context, address);
    this._borders = new RangeBordersProxy(context, address);
  }

  get fill(): IRangeFill { return this._fill; }
  get font(): IRangeFont { return this._font; }
  get borders(): IRangeBorders { return this._borders; }

  _setLoadedData(data: any): void {
    if (data.fill) this._fill._setLoadedData(data.fill);
    if (data.font) this._font._setLoadedData(data.font);
    if (data.borders) this._borders._setLoadedData(data.borders);
    this._isInitialized = true;
  }
}

/**
 * Proxy for a range of cells.
 */
export class RangeProxy extends BaseProxy implements IRange {
  private _address: string;
  private _rowCount: number = 0;
  private _columnCount: number = 0;
  private _rowIndex: number = 0;
  private _columnIndex: number = 0;
  private _values: any[][] = [];
  private _formulas: any[][] = [];
  private _numberFormat: string[][] = [];
  private _format: RangeFormatProxy;

  constructor(context: IRequestContext, address: string) {
    super(context);
    this._address = address;
    this._format = new RangeFormatProxy(context, address);
  }

  get address(): string {
    return this._address;
  }

  get rowCount(): number { this.checkLoaded('rowCount'); return this._rowCount; }
  get columnCount(): number { this.checkLoaded('columnCount'); return this._columnCount; }
  get rowIndex(): number { this.checkLoaded('rowIndex'); return this._rowIndex; }
  get columnIndex(): number { this.checkLoaded('columnIndex'); return this._columnIndex; }

  get format(): IRangeFormat {
    return this._format;
  }

  get values(): any[][] {
    this.checkLoaded('values');
    return this._values;
  }

  set values(value: any[][]) {
    this._values = value;
    this.context.queueCommand({
      target: 'Range',
      method: 'setValues',
      address: this._address,
      args: [value]
    });
  }

  get formulas(): any[][] {
    this.checkLoaded('formulas');
    return this._formulas;
  }

  set formulas(value: any[][]) {
    this._formulas = value;
    this.context.queueCommand({
      target: 'Range',
      method: 'setFormulas',
      address: this._address,
      args: [value]
    });
  }

  get numberFormat(): string[][] {
    this.checkLoaded('numberFormat');
    return this._numberFormat;
  }

  set numberFormat(value: string[][]) {
    this._numberFormat = value;
    this.context.queueCommand({
      target: 'Range',
      method: 'setNumberFormat',
      address: this._address,
      args: [value]
    });
  }

  clear(option?: 'All' | 'Contents' | 'Formats'): void {
    this.context.queueCommand({
      target: 'Range',
      method: 'clear',
      address: this._address,
      args: [option || 'All']
    });
  }

  _setLoadedData(data: any): void {
    if (data.values !== undefined) this._values = data.values;
    if (data.formulas !== undefined) this._formulas = data.formulas;
    if (data.numberFormat !== undefined) this._numberFormat = data.numberFormat;
    if (data.rowCount !== undefined) this._rowCount = data.rowCount;
    if (data.columnCount !== undefined) this._columnCount = data.columnCount;
    if (data.rowIndex !== undefined) this._rowIndex = data.rowIndex;
    if (data.columnIndex !== undefined) this._columnIndex = data.columnIndex;
    if (data.format !== undefined) this._format._setLoadedData(data.format);
    this._isInitialized = true;
  }
}

/**
 * Proxy for a worksheet.
 */
export class WorksheetProxy extends BaseProxy implements IWorksheet {
  private _name: string = '';

  constructor(context: IRequestContext, name: string) {
    super(context);
    this._name = name;
  }

  get name(): string {
    this.checkLoaded('name');
    return this._name;
  }

  getRange(address: string): IRange {
    return new RangeProxy(this.context, address);
  }

  getUsedRange(): IRange {
    return new RangeProxy(this.context, 'USED_RANGE_PLACEHOLDER'); 
  }

  activate(): void {
    this.context.queueCommand({
      target: 'Worksheet',
      method: 'activate',
      args: [this._name]
    });
  }

  delete(): void {
    this.context.queueCommand({
      target: 'Worksheet',
      method: 'delete',
      args: [this._name]
    });
  }

  _setLoadedData(data: any): void {
    if (data.name !== undefined) this._name = data.name;
    this._isInitialized = true;
  }
}

/**
 * Proxy for a collection of worksheets.
 */
export class WorksheetCollectionProxy extends BaseProxy implements IWorksheetCollection {
  constructor(context: IRequestContext) {
    super(context);
  }

  getActiveWorksheet(): IWorksheet {
    return new WorksheetProxy(this.context, 'ActiveSheet');
  }

  getItem(name: string): IWorksheet {
    return new WorksheetProxy(this.context, name);
  }

  add(name: string): IWorksheet {
    this.context.queueCommand({
      target: 'WorksheetCollection',
      method: 'add',
      args: [name]
    });
    return new WorksheetProxy(this.context, name);
  }

  _setLoadedData(data: any): void {
    this._isInitialized = true;
  }
}

/**
 * Proxy for a workbook.
 */
export class WorkbookProxy extends BaseProxy implements IWorkbook {
  private _name: string = '';
  private _worksheets: WorksheetCollectionProxy;

  constructor(context: IRequestContext) {
    super(context);
    this._worksheets = new WorksheetCollectionProxy(this.context);
  }

  get name(): string { this.checkLoaded('name'); return this._name; }

  get worksheets(): IWorksheetCollection {
    return this._worksheets;
  }

  getSelectedRange(): IRange {
    return new RangeProxy(this.context, 'SELECTED_RANGE_PLACEHOLDER');
  }

  _setLoadedData(data: any): void {
    if (data.name !== undefined) this._name = data.name;
    this._isInitialized = true;
  }
}
