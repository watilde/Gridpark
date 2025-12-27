/**
 * ConditionalFormattingEngine - Evaluates conditional formatting rules
 * 
 * Supports:
 * - cellIs: Compare cell values
 * - expression: Formula-based rules
 * - top10: Top/bottom N values
 * - aboveAverage: Above/below average
 * - colorScale: Color gradients
 * - iconSet: Icon indicators
 * - dataBar: Horizontal bars
 * - containsText: Text pattern matching
 * - timePeriod: Date-based rules
 */

import {
  ConditionalFormattingRule,
  CellStyleData,
  StoredCellData,
} from '../../../../lib/db';

export class ConditionalFormattingEngine {
  /**
   * Evaluate all rules for a cell and return merged style
   */
  evaluateCell(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rules: ConditionalFormattingRule[],
    allCells: Map<string, StoredCellData>
  ): CellStyleData | undefined {
    // Sort rules by priority (already sorted, but double-check)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    let mergedStyle: CellStyleData | undefined;

    for (const rule of sortedRules) {
      // Check if cell is in rule range
      if (!this.isInRange(row, col, rule.ranges)) {
        continue;
      }

      // Evaluate rule
      const matches = this.evaluateRule(row, col, cell, rule, allCells);

      if (matches) {
        // Apply style
        if (rule.style) {
          mergedStyle = { ...mergedStyle, ...rule.style };
        }

        // Color scale, icon set, data bar handled separately
        if (rule.colorScale) {
          const colorScaleStyle = this.evaluateColorScale(row, col, cell, rule, allCells);
          mergedStyle = { ...mergedStyle, ...colorScaleStyle };
        }

        // Stop if true
        if (rule.stopIfTrue) {
          break;
        }
      }
    }

    return mergedStyle;
  }

  /**
   * Check if cell is in any of the rule ranges
   */
  private isInRange(
    row: number,
    col: number,
    ranges: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>
  ): boolean {
    return ranges.some(
      range =>
        row >= range.startRow &&
        row <= range.endRow &&
        col >= range.startCol &&
        col <= range.endCol
    );
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule,
    allCells: Map<string, StoredCellData>
  ): boolean {
    switch (rule.type) {
      case 'cellIs':
        return this.evaluateCellIs(cell, rule);
      case 'expression':
        return this.evaluateExpression(row, col, cell, rule, allCells);
      case 'top10':
        return this.evaluateTop10(row, col, cell, rule, allCells);
      case 'aboveAverage':
        return this.evaluateAboveAverage(row, col, cell, rule, allCells);
      case 'containsText':
        return this.evaluateContainsText(cell, rule);
      case 'timePeriod':
        return this.evaluateTimePeriod(cell, rule);
      default:
        return false;
    }
  }

  /**
   * Evaluate cellIs rule (compare cell value)
   */
  private evaluateCellIs(
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule
  ): boolean {
    if (!cell || !rule.operator || rule.value === undefined) {
      return false;
    }

    const cellValue = this.getCellNumericValue(cell);
    const ruleValue = typeof rule.value === 'number' ? rule.value : parseFloat(String(rule.value));

    if (isNaN(cellValue) || isNaN(ruleValue)) {
      // String comparison
      const cellStr = String(cell.value || '');
      const ruleStr = String(rule.value);

      switch (rule.operator) {
        case 'equal':
          return cellStr === ruleStr;
        case 'notEqual':
          return cellStr !== ruleStr;
        case 'containsText':
          return cellStr.includes(ruleStr);
        case 'notContainsText':
          return !cellStr.includes(ruleStr);
        case 'beginsWith':
          return cellStr.startsWith(ruleStr);
        case 'endsWith':
          return cellStr.endsWith(ruleStr);
        default:
          return false;
      }
    }

    // Numeric comparison
    switch (rule.operator) {
      case 'greaterThan':
        return cellValue > ruleValue;
      case 'lessThan':
        return cellValue < ruleValue;
      case 'greaterThanOrEqual':
        return cellValue >= ruleValue;
      case 'lessThanOrEqual':
        return cellValue <= ruleValue;
      case 'equal':
        return cellValue === ruleValue;
      case 'notEqual':
        return cellValue !== ruleValue;
      case 'between':
        if (rule.value2 === undefined) return false;
        const value2 = typeof rule.value2 === 'number' ? rule.value2 : parseFloat(String(rule.value2));
        return cellValue >= ruleValue && cellValue <= value2;
      case 'notBetween':
        if (rule.value2 === undefined) return false;
        const value2b = typeof rule.value2 === 'number' ? rule.value2 : parseFloat(String(rule.value2));
        return cellValue < ruleValue || cellValue > value2b;
      default:
        return false;
    }
  }

  /**
   * Evaluate expression rule (formula-based)
   */
  private evaluateExpression(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule,
    allCells: Map<string, StoredCellData>
  ): boolean {
    // TODO: Implement formula evaluation
    // For now, return false
    return false;
  }

  /**
   * Evaluate top10 rule
   */
  private evaluateTop10(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule,
    allCells: Map<string, StoredCellData>
  ): boolean {
    if (!cell) return false;

    // Get all cells in range
    const rangeValues: number[] = [];
    rule.ranges.forEach(range => {
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          const key = `${r},${c}`;
          const rangeCell = allCells.get(key);
          if (rangeCell) {
            const value = this.getCellNumericValue(rangeCell);
            if (!isNaN(value)) {
              rangeValues.push(value);
            }
          }
        }
      }
    });

    if (rangeValues.length === 0) return false;

    // Sort values
    rangeValues.sort((a, b) => b - a);

    const cellValue = this.getCellNumericValue(cell);
    if (isNaN(cellValue)) return false;

    // Top 10
    const topN = Math.min(10, rangeValues.length);
    const threshold = rangeValues[topN - 1];

    return cellValue >= threshold;
  }

  /**
   * Evaluate aboveAverage rule
   */
  private evaluateAboveAverage(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule,
    allCells: Map<string, StoredCellData>
  ): boolean {
    if (!cell) return false;

    // Get all cells in range
    const rangeValues: number[] = [];
    rule.ranges.forEach(range => {
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          const key = `${r},${c}`;
          const rangeCell = allCells.get(key);
          if (rangeCell) {
            const value = this.getCellNumericValue(rangeCell);
            if (!isNaN(value)) {
              rangeValues.push(value);
            }
          }
        }
      }
    });

    if (rangeValues.length === 0) return false;

    // Calculate average
    const average = rangeValues.reduce((sum, v) => sum + v, 0) / rangeValues.length;

    const cellValue = this.getCellNumericValue(cell);
    if (isNaN(cellValue)) return false;

    return cellValue > average;
  }

  /**
   * Evaluate containsText rule
   */
  private evaluateContainsText(
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule
  ): boolean {
    if (!cell || !rule.value) return false;

    const cellText = String(cell.value || '').toLowerCase();
    const searchText = String(rule.value).toLowerCase();

    return cellText.includes(searchText);
  }

  /**
   * Evaluate timePeriod rule
   */
  private evaluateTimePeriod(
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule
  ): boolean {
    // TODO: Implement date-based rules
    return false;
  }

  /**
   * Evaluate color scale and return background color
   */
  private evaluateColorScale(
    row: number,
    col: number,
    cell: StoredCellData | undefined,
    rule: ConditionalFormattingRule,
    allCells: Map<string, StoredCellData>
  ): CellStyleData | undefined {
    if (!cell || !rule.colorScale) return undefined;

    // Get all cells in range
    const rangeValues: number[] = [];
    rule.ranges.forEach(range => {
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          const key = `${r},${c}`;
          const rangeCell = allCells.get(key);
          if (rangeCell) {
            const value = this.getCellNumericValue(rangeCell);
            if (!isNaN(value)) {
              rangeValues.push(value);
            }
          }
        }
      }
    });

    if (rangeValues.length === 0) return undefined;

    const min = Math.min(...rangeValues);
    const max = Math.max(...rangeValues);
    const cellValue = this.getCellNumericValue(cell);

    if (isNaN(cellValue)) return undefined;

    // Calculate position (0-1)
    const position = max === min ? 0.5 : (cellValue - min) / (max - min);

    // Interpolate color
    const { min: minColor, mid: midColor, max: maxColor } = rule.colorScale;

    let backgroundColor: string;
    if (midColor && position <= 0.5) {
      // Interpolate between min and mid
      backgroundColor = this.interpolateColor(
        minColor?.color || '#FFFFFF',
        midColor.color,
        position * 2
      );
    } else if (midColor && position > 0.5) {
      // Interpolate between mid and max
      backgroundColor = this.interpolateColor(
        midColor.color,
        maxColor?.color || '#FF0000',
        (position - 0.5) * 2
      );
    } else {
      // Two-color scale
      backgroundColor = this.interpolateColor(
        minColor?.color || '#FFFFFF',
        maxColor?.color || '#FF0000',
        position
      );
    }

    return { backgroundColor };
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: string, color2: string, position: number): string {
    // Parse hex colors
    const c1 = this.parseHexColor(color1);
    const c2 = this.parseHexColor(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * position);
    const g = Math.round(c1.g + (c2.g - c1.g) * position);
    const b = Math.round(c1.b + (c2.b - c1.b) * position);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
  }

  /**
   * Parse hex color to RGB
   */
  private parseHexColor(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace('#', '');
    return {
      r: parseInt(cleaned.substring(0, 2), 16),
      g: parseInt(cleaned.substring(2, 4), 16),
      b: parseInt(cleaned.substring(4, 6), 16),
    };
  }

  /**
   * Get numeric value from cell
   */
  private getCellNumericValue(cell: StoredCellData): number {
    if (cell.type === 'number' && typeof cell.value === 'number') {
      return cell.value;
    }
    if (typeof cell.value === 'string') {
      return parseFloat(cell.value);
    }
    return NaN;
  }
}
