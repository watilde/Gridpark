import * as XLSX from 'xlsx';
import { ExcelFile, ExcelSheet, CellData } from '../types/excel';

/**
 * Parse Excel file from ArrayBuffer
 */
export const parseExcelFile = (arrayBuffer: ArrayBuffer, fileName: string): ExcelFile => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    const rowCount = range.e.r + 1;
    const colCount = range.e.c + 1;

    const data: CellData[][] = [];

    for (let row = 0; row < rowCount; row++) {
      const rowData: CellData[] = [];
      for (let col = 0; col < colCount; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (!cell) {
          rowData.push({
            value: null,
            type: 'empty',
          });
        } else {
          let cellData: CellData = {
            value: cell.v,
            type: 'string',
          };

          // Determine cell type
          if (cell.f) {
            cellData.type = 'formula';
            cellData.formula = cell.f;
          } else if (cell.t === 'n') {
            cellData.type = 'number';
          } else if (cell.t === 'b') {
            cellData.type = 'boolean';
          } else if (cell.t === 's') {
            cellData.type = 'string';
          }

          rowData.push(cellData);
        }
      }
      data.push(rowData);
    }

    return {
      name: sheetName,
      data,
      rowCount,
      colCount,
    };
  });

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

    reader.onload = (e) => {
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
