/**
 * Common Utility Functions
 *
 * Reusable utility functions used across the application.
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last invocation.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(context, args);
    }, wait);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Parse A1 cell notation (e.g. "A1" -> {row: 0, col: 0})
 */
export function parseA1Cell(cell: string): { row: number; col: number } {
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

/**
 * Parse A1 range notation (e.g. "A1:B2" -> {startRow: 0, startCol: 0, endRow: 1, endCol: 1})
 */
export function parseA1Range(address: string) {
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

/**
 * Check if a cell is within a given range
 */
export function isCellInRange(row: number, col: number, range: { startRow: number; startCol: number; endRow: number; endCol: number }): boolean {
  return row >= range.startRow && row <= range.endRow && 
         col >= range.startCol && col <= range.endCol;
}
