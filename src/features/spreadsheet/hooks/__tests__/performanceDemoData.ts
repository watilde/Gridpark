/**
 * Performance Demo Data Generator
 *
 * Generates large datasets for performance testing in the actual application.
 * Use this to test real-world performance improvements.
 *
 * Usage:
 * ```typescript
 * import { generateLargeSpreadsheet } from './performanceDemoData';
 *
 * const largeData = generateLargeSpreadsheet(100, 100); // 10,000 cells
 * await sheet.save2DArray(largeData);
 * ```
 */

import { CellData } from '../../../../lib/db';

// ============================================================================
// Data Generators
// ============================================================================

/**
 * Generate a large spreadsheet with realistic data
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns 2D array of cell data
 */
export function generateLargeSpreadsheet(rows: number, cols: number): CellData[][] {
  const data: CellData[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowData: CellData[] = [];

    for (let col = 0; col < cols; col++) {
      // Generate realistic cell content
      if (row === 0) {
        // Header row
        rowData.push({
          value: `Column ${String.fromCharCode(65 + (col % 26))}`,
          type: 'string',
          style: {
            fontWeight: 'bold',
            backgroundColor: '#f0f0f0',
          },
        });
      } else if (col === 0) {
        // First column (IDs)
        rowData.push({
          value: row,
          type: 'number',
        });
      } else {
        // Data cells - mix of types
        const cellType = Math.random();

        if (cellType < 0.4) {
          // Number (40%)
          rowData.push({
            value: Math.round(Math.random() * 10000) / 100,
            type: 'number',
          });
        } else if (cellType < 0.7) {
          // String (30%)
          rowData.push({
            value: `Data ${row}-${col}`,
            type: 'string',
          });
        } else if (cellType < 0.85) {
          // Formula (15%)
          const targetRow = Math.max(1, row - 1);
          const targetCol = String.fromCharCode(65 + col);
          rowData.push({
            value: 0, // Will be calculated
            type: 'formula',
            formula: `=SUM(${targetCol}${targetRow}:${targetCol}${row})`,
          });
        } else {
          // Empty (15%)
          rowData.push({
            value: null,
            type: 'empty',
          });
        }
      }
    }

    data.push(rowData);
  }

  return data;
}

/**
 * Generate sparse spreadsheet (realistic Excel usage)
 *
 * @param maxRows - Maximum row extent
 * @param maxCols - Maximum column extent
 * @param fillPercentage - Percentage of cells to fill (default: 10%)
 * @returns 2D array with sparse data
 */
export function generateSparseSpreadsheet(
  maxRows: number,
  maxCols: number,
  fillPercentage: number = 10
): CellData[][] {
  // Initialize empty array
  const data: CellData[][] = Array(maxRows)
    .fill(null)
    .map(() =>
      Array(maxCols)
        .fill(null)
        .map(
          (): CellData => ({
            value: null,
            type: 'empty',
          })
        )
    );

  // Fill random cells
  const totalCells = maxRows * maxCols;
  const cellsToFill = Math.floor((totalCells * fillPercentage) / 100);

  for (let i = 0; i < cellsToFill; i++) {
    const row = Math.floor(Math.random() * maxRows);
    const col = Math.floor(Math.random() * maxCols);

    data[row][col] = {
      value: Math.round(Math.random() * 1000),
      type: 'number',
    };
  }

  return data;
}

/**
 * Generate spreadsheet with formulas and dependencies
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns 2D array with formulas
 */
export function generateFormulaSpreadsheet(rows: number, cols: number): CellData[][] {
  const data: CellData[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowData: CellData[] = [];

    for (let col = 0; col < cols; col++) {
      if (row === 0 || col === 0) {
        // Border cells are numbers
        rowData.push({
          value: Math.round(Math.random() * 100),
          type: 'number',
        });
      } else {
        // Interior cells are formulas referencing neighbors
        const leftCol = String.fromCharCode(65 + col - 1);
        const topRow = row;

        rowData.push({
          value: 0,
          type: 'formula',
          formula: `=SUM(${leftCol}${topRow},${String.fromCharCode(65 + col)}${row})`,
        });
      }
    }

    data.push(rowData);
  }

  return data;
}

/**
 * Generate styled spreadsheet (for style performance testing)
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns 2D array with various styles
 */
export function generateStyledSpreadsheet(rows: number, cols: number): CellData[][] {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const data: CellData[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowData: CellData[] = [];

    for (let col = 0; col < cols; col++) {
      rowData.push({
        value: `Cell ${row}-${col}`,
        type: 'string',
        style: {
          backgroundColor: colors[col % colors.length],
          color: row % 2 === 0 ? '#ffffff' : '#000000',
          fontWeight: col % 3 === 0 ? 'bold' : 'normal',
          fontSize: `${12 + (row % 4)}px`,
        },
      });
    }

    data.push(rowData);
  }

  return data;
}

// ============================================================================
// Performance Test Scenarios
// ============================================================================

export const PERFORMANCE_SCENARIOS = {
  /**
   * Small sheet (baseline)
   */
  SMALL: () => generateLargeSpreadsheet(10, 10), // 100 cells

  /**
   * Medium sheet (typical usage)
   */
  MEDIUM: () => generateLargeSpreadsheet(50, 50), // 2,500 cells

  /**
   * Large sheet (stress test)
   */
  LARGE: () => generateLargeSpreadsheet(100, 100), // 10,000 cells

  /**
   * Extra large sheet (extreme test)
   */
  XLARGE: () => generateLargeSpreadsheet(200, 100), // 20,000 cells

  /**
   * Sparse large (realistic)
   */
  SPARSE_LARGE: () => generateSparseSpreadsheet(1000, 1000, 5), // 50,000 cells filled

  /**
   * Formula-heavy (calculation test)
   */
  FORMULA_HEAVY: () => generateFormulaSpreadsheet(50, 50), // 2,500 formulas

  /**
   * Style-heavy (rendering test)
   */
  STYLE_HEAVY: () => generateStyledSpreadsheet(100, 50), // 5,000 styled cells
};

// ============================================================================
// Performance Timing Utilities
// ============================================================================

/**
 * Measure performance of an operation
 *
 * @param name - Operation name
 * @param operation - Async operation to measure
 * @returns Result and timing info
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  console.log(`⏱️  Starting: ${name}`);
  const start = performance.now();

  const result = await operation();

  const duration = performance.now() - start;
  console.log(`✅ Completed: ${name} (${duration.toFixed(2)}ms)`);

  return { result, duration };
}

/**
 * Compare two implementations
 *
 * @param name - Test name
 * @param oldImpl - Old implementation
 * @param newImpl - New implementation
 * @returns Comparison results
 */
export async function compareImplementations<T>(
  name: string,
  oldImpl: () => Promise<T>,
  newImpl: () => Promise<T>
): Promise<void> {
  console.log(`\n🔬 Comparing: ${name}`);

  const oldResult = await measurePerformance('Old Implementation', oldImpl);
  const newResult = await measurePerformance('New Implementation', newImpl);

  const improvement = ((1 - newResult.duration / oldResult.duration) * 100).toFixed(1);

  console.log(`\n📊 Results:`);
  console.log(`  Old: ${oldResult.duration.toFixed(2)}ms`);
  console.log(`  New: ${newResult.duration.toFixed(2)}ms`);
  console.log(`  Improvement: ${improvement}%`);
}
