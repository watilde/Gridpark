import { IRequestContext, IWorkbook, ICommand } from './interfaces';
import { WorkbookProxy, BaseProxy, RangeProxy, WorksheetProxy } from './proxies';
import { db as defaultDb, AppDatabase } from '../db';

/**
 * Helper to parse A1 notation to row/col indices.
 */
function parseA1Range(address: string) {
  if (address === 'SELECTED_RANGE_PLACEHOLDER' || address === 'USED_RANGE_PLACEHOLDER') {
    return { startRow: 0, startCol: 0, endRow: 0, endCol: 0 };
  }
  const parts = address.split(':');
  const start = parseA1Cell(parts[0]);
  const end = parts[1] ? parseA1Cell(parts[1]) : start;
  return {
    startRow: Math.min(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    endCol: Math.max(start.col, end.col)
  };
}

function parseA1Cell(cell: string) {
  const match = cell.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return { row: 0, col: 0 };
  const letters = match[1];
  const row = parseInt(match[2], 10) - 1;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { row, col: col - 1 };
}

export type SyncListener = (changes: { tabId: string; address: string }[]) => void;
let syncListener: SyncListener | null = null;

/**
 * Registers a listener that is notified when a sync completes with changes.
 */
export const setSyncListener = (listener: SyncListener) => {
  syncListener = listener;
};

export class RequestContext implements IRequestContext {
  private _commands: ICommand[] = [];
  private _workbook: WorkbookProxy;
  private _loadedObjects: Set<BaseProxy> = new Set();
  private _db: AppDatabase;
  private _tabId: string = 'Sheet1';
  private _changedRanges: Set<string> = new Set();

  constructor(db?: AppDatabase) {
    this._db = db || defaultDb;
    this._workbook = new WorkbookProxy(this);
  }

  get workbook(): IWorkbook {
    return this._workbook;
  }

  queueCommand(command: ICommand): void {
    this._commands.push(command);
    if (command.address) {
      this._changedRanges.add(command.address);
    }
  }

  addLoadedObject(obj: BaseProxy): void {
    this._loadedObjects.add(obj);
  }

  async sync(): Promise<void> {
    if (this._commands.length > 0) {
      try {
        for (const cmd of this._commands) {
          await this._executeCommand(cmd);
        }
        
        // Notify UI layer about changes for visual feedback
        if (syncListener && this._changedRanges.size > 0) {
          syncListener(Array.from(this._changedRanges).map(address => ({ tabId: this._tabId, address })));
        }

        this._commands = [];
        this._changedRanges.clear();
      } catch (error) {
        console.error('Failed to execute commands during sync:', error);
        throw error;
      }
    }

    for (const obj of this._loadedObjects) {
      const mockData: any = {};
      const props = obj._getPropertiesToLoad();
      if (obj instanceof RangeProxy) {
        const range = parseA1Range(obj.address);
        if (props.some(p => p === '*' || p === 'values')) {
          const cells = await this._db.getCellsInRange(this._tabId, range.startRow, range.endRow, range.startCol, range.endCol);
          const values: any[][] = [];
          for (let r = 0; r <= range.endRow - range.startRow; r++) {
            values[r] = [];
            for (let c = 0; c <= range.endCol - range.startCol; c++) {
              const cell = cells.find(cc => cc.row === range.startRow + r && cc.col === range.startCol + c);
              values[r][c] = cell ? cell.value : null;
            }
          }
          mockData.values = values;
        }
        if (props.some(p => p === '*' || p === 'formulas')) {
          const cells = await this._db.getCellsInRange(this._tabId, range.startRow, range.endRow, range.startCol, range.endCol);
          const formulas: any[][] = [];
          for (let r = 0; r <= range.endRow - range.startRow; r++) {
            formulas[r] = [];
            for (let c = 0; c <= range.endCol - range.startCol; c++) {
              const cell = cells.find(cc => cc.row === range.startRow + r && cc.col === range.startCol + c);
              formulas[r][c] = cell ? cell.formula || '' : '';
            }
          }
          mockData.formulas = formulas;
        }
        if (props.some(p => p === '*' || p === 'rowCount')) mockData.rowCount = range.endRow - range.startRow + 1;
        if (props.some(p => p === '*' || p === 'columnCount')) mockData.columnCount = range.endCol - range.startCol + 1;
        if (props.some(p => p === '*' || p === 'rowIndex')) mockData.rowIndex = range.startRow;
        if (props.some(p => p === '*' || p === 'columnIndex')) mockData.columnIndex = range.startCol;
      } else if (obj instanceof WorksheetProxy) {
        if (props.some(p => p === '*' || p === 'name')) {
          const metadata = await this._db.getSheetMetadata(this._tabId);
          mockData.name = metadata ? metadata.sheetName : 'Sheet1';
        }
      } else if (obj instanceof WorkbookProxy) {
        if (props.some(p => p === '*' || p === 'name')) mockData.name = 'Workbook';
      }
      obj._setLoadedData(mockData);
    }
    this._loadedObjects.clear();
  }

  private async _executeCommand(cmd: ICommand): Promise<void> {
    if (cmd.target === 'Range' && cmd.address) {
      const range = parseA1Range(cmd.address);
      if (cmd.method === 'setValues') {
        const values = cmd.args?.[0] as any[][];
        const updates: any[] = [];
        for (let r = 0; r < values.length; r++) {
          for (let c = 0; c < values[r].length; c++) {
            updates.push({
              row: range.startRow + r, 
              col: range.startCol + c, 
              data: { value: values[r][c], type: typeof values[r][c] === 'number' ? 'number' : 'string' }
            });
          }
        }
        await this._db.bulkUpsertCells(this._tabId, updates);
      } else if (cmd.method === 'setFormulas') {
        const formulas = cmd.args?.[0] as string[][];
        const updates: any[] = [];
        for (let r = 0; r < formulas.length; r++) {
          for (let c = 0; c < formulas[r].length; c++) {
            updates.push({ row: range.startRow + r, col: range.startCol + c, data: { formula: formulas[r][c], type: 'formula' } });
          }
        }
        await this._db.bulkUpsertCells(this._tabId, updates);
      } else if (cmd.method === 'clear') {
        const cells = await this._db.getCellsInRange(this._tabId, range.startRow, range.endRow, range.startCol, range.endCol);
        for (const cell of cells) await this._db.deleteCell(this._tabId, cell.row, cell.col);
      }
    } else if (cmd.target.startsWith('RangeFont') && cmd.address) {
      const range = parseA1Range(cmd.address);
      const cells = await this._db.getCellsInRange(this._tabId, range.startRow, range.endRow, range.startCol, range.endCol);
      const updates: any[] = [];
      const prop = cmd.method.replace('set', '').toLowerCase();
      const value = cmd.args?.[0];
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          const existing = cells.find(cc => cc.row === r && cc.col === c);
          const style = (existing?.style as any) || {};
          const font = style.font || {};
          font[prop] = value;
          style.font = font;
          updates.push({ row: r, col: c, data: { style } });
        }
      }
      await this._db.bulkUpsertCells(this._tabId, updates);
    } else if (cmd.target === 'RangeFill' && cmd.address) {
      const range = parseA1Range(cmd.address);
      const updates: any[] = [];
      const color = cmd.args?.[0];
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          const cell = await this._db.getCell(this._tabId, r, c);
          const style = (cell?.style as any) || {};
          style.backgroundColor = color;
          updates.push({ row: r, col: c, data: { style } });
        }
      }
      await this._db.bulkUpsertCells(this._tabId, updates);
    }
  }
}

export const Excel = {
  run: async <T>(batch: (context: RequestContext) => Promise<T>): Promise<T> => {
    const context = new RequestContext();
    try {
      return await batch(context);
    } catch (error) {
      console.error('Excel.run execution failed:', error);
      throw error;
    }
  }
};