# Gridpark Excel Viewer API Documentation

## Overview

Gridpark provides a powerful Excel viewer with JavaScript and CSS APIs for programmatic cell manipulation and styling.

## Features

✅ **Excel File Display** - View .xlsx files with multiple sheets
✅ **File Tree Navigation** - Left sidebar for file management
✅ **Cell Selection** - Single cell and range selection with mouse
✅ **JavaScript API** - Programmatic cell operations
✅ **CSS Styling API** - Dynamic cell styling

## Getting Started

### Upload Excel File

Click the "Upload Excel" button in the top-right corner to load your own .xlsx files.

### File Tree

The left sidebar shows all loaded files. Click on a file to view its contents.

### Cell Selection

- **Single Cell**: Click on any cell
- **Range Selection**: Click and drag to select multiple cells

## JavaScript API

Access the API via `window.gridparkAPI`:

```javascript
// Get reference to the API
const api = window.gridparkAPI;
```

### Methods

#### `getCellValue(row, col)`

Get the value of a specific cell.

```javascript
const cellData = api.getCellValue(0, 0);
console.log(cellData.value); // Cell value
console.log(cellData.type);  // 'string', 'number', 'boolean', 'formula', 'empty'
```

#### `setCellStyle(row, col, style)`

Apply CSS style to a single cell.

```javascript
api.setCellStyle(1, 2, {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '14px'
});
```

#### `setRangeStyle(range, style)`

Apply CSS style to a range of cells.

```javascript
api.setRangeStyle(
  { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
  {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontWeight: 'bold'
  }
);
```

#### `clearCellStyle(row, col)`

Remove styling from a specific cell.

```javascript
api.clearCellStyle(1, 2);
```

#### `clearAllStyles()`

Remove all cell styling.

```javascript
api.clearAllStyles();
```

#### `getSelectedCell()`

Get the currently selected cell position.

```javascript
const position = api.getSelectedCell();
console.log(position); // { row: 1, col: 2 }
```

#### `getSelectionRange()`

Get the current selection range.

```javascript
const range = api.getSelectionRange();
console.log(range); // { startRow: 0, startCol: 0, endRow: 2, endCol: 3 }
```

## CSS Styling Options

Available style properties for `setCellStyle()` and `setRangeStyle()`:

```typescript
interface CellStyle {
  backgroundColor?: string;  // e.g., '#3b82f6', 'red'
  color?: string;           // Text color
  fontWeight?: string;      // 'normal', 'bold', '600'
  fontStyle?: string;       // 'normal', 'italic'
  textAlign?: string;       // 'left', 'center', 'right'
  border?: string;          // '1px solid red'
  fontSize?: string;        // '14px', '1.2rem'
}
```

## Examples

### Example 1: Highlight Header Row

```javascript
// Style the first row as a header
window.gridparkAPI.setRangeStyle(
  { startRow: 0, startCol: 0, endRow: 0, endCol: 10 },
  {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '14px'
  }
);
```

### Example 2: Color-code Values

```javascript
const api = window.gridparkAPI;

// Get cell value
const cellData = api.getCellValue(1, 3);

// Apply color based on value
if (cellData && cellData.type === 'number') {
  const value = cellData.value;
  
  if (value > 80000) {
    api.setCellStyle(1, 3, { backgroundColor: '#10b981', color: '#ffffff' }); // Green
  } else if (value > 70000) {
    api.setCellStyle(1, 3, { backgroundColor: '#f59e0b', color: '#ffffff' }); // Orange
  } else {
    api.setCellStyle(1, 3, { backgroundColor: '#ef4444', color: '#ffffff' }); // Red
  }
}
```

### Example 3: Zebra Striping

```javascript
const api = window.gridparkAPI;

// Get selected range
const range = api.getSelectionRange();
if (range) {
  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      const isEvenRow = row % 2 === 0;
      api.setCellStyle(row, col, {
        backgroundColor: isEvenRow ? '#f3f4f6' : '#ffffff'
      });
    }
  }
}
```

### Example 4: Custom Data Analysis

```javascript
const api = window.gridparkAPI;

// Analyze salary column (assuming column 3)
const salaries = [];
for (let row = 1; row < 10; row++) {
  const cellData = api.getCellValue(row, 3);
  if (cellData && cellData.type === 'number') {
    salaries.push(cellData.value);
  }
}

const average = salaries.reduce((a, b) => a + b, 0) / salaries.length;
console.log('Average salary:', average);

// Highlight cells above average
for (let row = 1; row < 10; row++) {
  const cellData = api.getCellValue(row, 3);
  if (cellData && cellData.value > average) {
    api.setCellStyle(row, 3, {
      backgroundColor: '#22c55e',
      color: '#ffffff',
      fontWeight: 'bold'
    });
  }
}
```

## Browser Console Usage

Open the browser console (F12) and use the API directly:

```javascript
// Test the API
const api = window.gridparkAPI;

// Get current selection
console.log(api.getSelectedCell());

// Style a cell
api.setCellStyle(0, 0, { backgroundColor: 'yellow' });

// Clear all styles
api.clearAllStyles();
```

## TypeScript Types

```typescript
interface CellData {
  value: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'formula' | 'empty';
  formula?: string;
}

interface CellPosition {
  row: number;
  col: number;
}

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  border?: string;
  fontSize?: string;
}
```

## Notes

- Row and column indices are **zero-based** (0, 1, 2, ...)
- Styles are applied dynamically and persist until cleared
- The API is available after the ExcelViewer component is mounted
- Use the "Test Styling" button to see a demo of the styling capabilities

## Support

For issues or questions, please refer to the project repository or documentation.
