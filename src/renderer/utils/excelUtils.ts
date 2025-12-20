// ExcelJS is now the primary Excel library (full style support)
import { ExcelFile, ExcelSheet, CellData } from '../types/excel';

/**
 * Parse Excel file from ArrayBuffer (ExcelJS-powered for full style support)
 */
export const parseExcelFile = async (arrayBuffer: ArrayBuffer, fileName: string): Promise<ExcelFile> => {
  // Use ExcelJS for full style support
  const { ExcelJSAdapter } = await import('../../lib/exceljs-adapter');
  
  const result = await ExcelJSAdapter.readWorkbook(arrayBuffer);
  
  const sheets: ExcelSheet[] = result.sheets.map(sheet => ({
    name: sheet.name,
    data: sheet.data,
    rowCount: sheet.data.length,
    colCount: sheet.data[0]?.length ?? 0,
    properties: sheet.properties,
  }));

  return {
    name: fileName,
    path: '',
    sheets,
  };
};

/**
 * Create sample Excel file for demonstration
 */
export const createSampleExcelFile = (): ExcelFile => {
  const sampleData: CellData[][] = [
    [
      { value: 'Name', type: 'string' },
      { value: 'Age', type: 'string' },
      { value: 'Email', type: 'string' },
      { value: 'Salary', type: 'string' },
    ],
    [
      { value: 'John Doe', type: 'string' },
      { value: 28, type: 'number' },
      { value: 'john@example.com', type: 'string' },
      { value: 75000, type: 'number' },
    ],
    [
      { value: 'Jane Smith', type: 'string' },
      { value: 32, type: 'number' },
      { value: 'jane@example.com', type: 'string' },
      { value: 85000, type: 'number' },
    ],
    [
      { value: 'Bob Johnson', type: 'string' },
      { value: 45, type: 'number' },
      { value: 'bob@example.com', type: 'string' },
      { value: 95000, type: 'number' },
    ],
    [
      { value: 'Alice Williams', type: 'string' },
      { value: 29, type: 'number' },
      { value: 'alice@example.com', type: 'string' },
      { value: 78000, type: 'number' },
    ],
    [
      { value: 'Charlie Brown', type: 'string' },
      { value: 38, type: 'number' },
      { value: 'charlie@example.com', type: 'string' },
      { value: 88000, type: 'number' },
    ],
  ];

  const sheet2Data: CellData[][] = [
    [
      { value: 'Product', type: 'string' },
      { value: 'Quantity', type: 'string' },
      { value: 'Price', type: 'string' },
    ],
    [
      { value: 'Laptop', type: 'string' },
      { value: 10, type: 'number' },
      { value: 1200, type: 'number' },
    ],
    [
      { value: 'Mouse', type: 'string' },
      { value: 50, type: 'number' },
      { value: 25, type: 'number' },
    ],
    [
      { value: 'Keyboard', type: 'string' },
      { value: 30, type: 'number' },
      { value: 75, type: 'number' },
    ],
  ];

  return {
    name: 'Sample.xlsx',
    path: '/sample/Sample.xlsx',
    sheets: [
      {
        name: 'Employees',
        data: sampleData,
        rowCount: sampleData.length,
        colCount: sampleData[0].length,
      },
      {
        name: 'Products',
        data: sheet2Data,
        rowCount: sheet2Data.length,
        colCount: sheet2Data[0].length,
      },
    ],
  };
};

/**
 * Load Excel file from File object
 */
export const loadExcelFile = async (file: File): Promise<ExcelFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const excelFile = parseExcelFile(arrayBuffer, file.name);
        resolve(excelFile);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const normalizeCellValue = (cell: CellData): any => {
  if (cell.type === 'number') {
    const num = Number(cell.value);
    return Number.isFinite(num) ? num : 0;
  }
  if (cell.type === 'boolean') {
    return Boolean(cell.value);
  }
  if (cell.type === 'formula') {
    return cell.value ?? '';
  }
  return cell.value ?? '';
};

export const serializeExcelFile = async (file: ExcelFile): Promise<ArrayBuffer> => {
  // Use ExcelJS for full style support
  const { ExcelJSAdapter } = await import('../../lib/exceljs-adapter');
  
  const sheets = file.sheets.map(sheet => ({
    name: sheet.name || 'Sheet',
    data: sheet.data,
    properties: sheet.properties,
  }));
  
  return await ExcelJSAdapter.writeWorkbook(sheets);
};
