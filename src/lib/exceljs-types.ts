/**
 * ExcelJS Style Types
 * 
 * Comprehensive type definitions for ExcelJS cell styling
 * These types match ExcelJS API for full feature support
 */

// ============================================================================
// Font Styles
// ============================================================================

export interface ExcelFont {
  name?: string;              // 'Arial', 'Times New Roman', 'Calibri'
  size?: number;              // 10, 12, 14, 16, etc.
  bold?: boolean;
  italic?: boolean;
  underline?: boolean | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
  strike?: boolean;
  outline?: boolean;
  color?: ExcelColor;
  family?: number;            // Font family ID
  charset?: number;           // Character set
  scheme?: 'minor' | 'major' | 'none';
  vertAlign?: 'superscript' | 'subscript';
}

// ============================================================================
// Color Definitions
// ============================================================================

export interface ExcelColor {
  argb?: string;    // 'FFFF0000' (Alpha, Red, Green, Blue)
  theme?: number;   // Theme color index (0-9)
  tint?: number;    // Tint value (-1 to 1)
}

// ============================================================================
// Fill Styles
// ============================================================================

export type ExcelFillPattern =
  | 'none'
  | 'solid'
  | 'darkGray'
  | 'mediumGray'
  | 'lightGray'
  | 'gray125'
  | 'gray0625'
  | 'darkHorizontal'
  | 'darkVertical'
  | 'darkDown'
  | 'darkUp'
  | 'darkGrid'
  | 'darkTrellis'
  | 'lightHorizontal'
  | 'lightVertical'
  | 'lightDown'
  | 'lightUp'
  | 'lightGrid'
  | 'lightTrellis';

export interface ExcelPatternFill {
  type: 'pattern';
  pattern: ExcelFillPattern;
  fgColor?: ExcelColor;
  bgColor?: ExcelColor;
}

export interface ExcelGradientStop {
  position: number;  // 0 to 1
  color: ExcelColor;
}

export interface ExcelGradientFill {
  type: 'gradient';
  gradient: 'angle' | 'path';
  degree?: number;        // For angle gradient (0-360)
  center?: { left: number; top: number };  // For path gradient
  stops: ExcelGradientStop[];
}

export type ExcelFill = ExcelPatternFill | ExcelGradientFill;

// ============================================================================
// Border Styles
// ============================================================================

export type ExcelBorderStyle =
  | 'thin'
  | 'medium'
  | 'thick'
  | 'dotted'
  | 'hair'
  | 'dashed'
  | 'mediumDashed'
  | 'dashDot'
  | 'mediumDashDot'
  | 'dashDotDot'
  | 'mediumDashDotDot'
  | 'slantDashDot'
  | 'double';

export interface ExcelBorderSegment {
  style?: ExcelBorderStyle;
  color?: ExcelColor;
}

export interface ExcelBorder {
  top?: ExcelBorderSegment;
  left?: ExcelBorderSegment;
  bottom?: ExcelBorderSegment;
  right?: ExcelBorderSegment;
  diagonal?: ExcelBorderSegment & { up?: boolean; down?: boolean };
}

// ============================================================================
// Alignment
// ============================================================================

export interface ExcelAlignment {
  horizontal?: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
  vertical?: 'top' | 'middle' | 'bottom' | 'justify' | 'distributed';
  wrapText?: boolean;
  shrinkToFit?: boolean;
  indent?: number;
  readingOrder?: 'rtl' | 'ltr';
  textRotation?: number | 'vertical';  // 0-180 or 'vertical'
}

// ============================================================================
// Number Format
// ============================================================================

export interface ExcelNumberFormat {
  formatCode?: string;  // Excel format code (e.g., '0.00', '$#,##0.00', 'dd/mm/yyyy')
}

// Predefined format codes
export const EXCEL_NUMBER_FORMATS = {
  GENERAL: 'General',
  TEXT: '@',
  NUMBER: '0',
  NUMBER_2DP: '0.00',
  CURRENCY: '$#,##0.00',
  ACCOUNTING: '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)',
  DATE_SHORT: 'mm-dd-yy',
  DATE_LONG: 'dd/mm/yyyy',
  DATE_TIME: 'dd/mm/yyyy hh:mm',
  TIME: 'hh:mm:ss',
  PERCENTAGE: '0%',
  PERCENTAGE_2DP: '0.00%',
  FRACTION: '# ?/?',
  SCIENTIFIC: '0.00E+00',
} as const;

// ============================================================================
// Protection
// ============================================================================

export interface ExcelProtection {
  locked?: boolean;
  hidden?: boolean;
}

// ============================================================================
// Complete Cell Style
// ============================================================================

export interface ExcelCellStyle {
  // Core styling
  font?: ExcelFont;
  fill?: ExcelFill;
  border?: ExcelBorder;
  alignment?: ExcelAlignment;
  numFmt?: string;  // Number format code
  protection?: ExcelProtection;
}

// ============================================================================
// Rich Text (for inline formatting)
// ============================================================================

export interface ExcelRichTextFragment {
  font?: ExcelFont;
  text: string;
}

export interface ExcelRichText {
  richText: ExcelRichTextFragment[];
}

// ============================================================================
// Conditional Formatting
// ============================================================================

export interface ExcelConditionalFormatting {
  ref: string;  // Cell range (e.g., 'A1:B10')
  type: 'expression' | 'cellIs' | 'top10' | 'aboveAverage' | 'colorScale' | 'dataBar' | 'iconSet';
  priority?: number;
  
  // For expression type
  formulae?: string[];
  
  // For cellIs type
  operator?: 'lessThan' | 'greaterThan' | 'equal' | 'between' | 'notBetween';
  
  // Style to apply
  style?: ExcelCellStyle;
  
  // For dataBar
  dataBar?: {
    minLength?: number;
    maxLength?: number;
    showValue?: boolean;
    gradient?: boolean;
    border?: boolean;
    negativeBarColorSameAsPositive?: boolean;
    negativeBarBorderColorSameAsPositive?: boolean;
    axisPosition?: 'none' | 'automatic' | 'middle';
    direction?: 'leftToRight' | 'rightToLeft';
    minColor?: ExcelColor;
    maxColor?: ExcelColor;
    borderColor?: ExcelColor;
    negativeFillColor?: ExcelColor;
    negativeBorderColor?: ExcelColor;
    axisColor?: ExcelColor;
  };
  
  // For colorScale
  colorScale?: {
    cfvo: Array<{
      type: 'num' | 'percent' | 'min' | 'max' | 'formula' | 'percentile';
      value?: number;
    }>;
    color: ExcelColor[];
  };
  
  // For iconSet
  iconSet?: {
    iconSet: '3Arrows' | '3ArrowsGray' | '3Flags' | '3TrafficLights1' | '3TrafficLights2' | 
             '3Signs' | '3Symbols' | '3Symbols2' | '4Arrows' | '4ArrowsGray' | '4RedToBlack' | 
             '4Rating' | '4TrafficLights' | '5Arrows' | '5ArrowsGray' | '5Rating' | '5Quarters';
    showValue?: boolean;
    reverse?: boolean;
    cfvo: Array<{
      type: 'num' | 'percent' | 'min' | 'max' | 'formula' | 'percentile';
      value?: number;
    }>;
  };
}

// ============================================================================
// Data Validation
// ============================================================================

export interface ExcelDataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'time' | 'textLength' | 'custom';
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
  formulae: string[];  // Validation criteria
  
  // Error handling
  allowBlank?: boolean;
  showInputMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
  showErrorMessage?: boolean;
  errorStyle?: 'error' | 'warning' | 'information';
  errorTitle?: string;
  error?: string;
}

// ============================================================================
// Cell Merging
// ============================================================================

export interface ExcelMergeInfo {
  merged: boolean;
  master?: boolean;  // Is this the top-left cell of the merge?
  range?: string;    // Merge range (e.g., 'A1:C3')
}

// ============================================================================
// Image
// ============================================================================

export interface ExcelImage {
  type: 'image';
  imageId: string;
  range: {
    tl: { col: number; row: number };  // Top-left anchor
    br?: { col: number; row: number };  // Bottom-right anchor (optional)
    ext?: { width: number; height: number };  // Size in pixels
  };
  hyperlinks?: {
    hyperlink?: string;
    tooltip?: string;
  };
}

// ============================================================================
// Enhanced StoredCellData with ExcelJS Support
// ============================================================================

export interface ExcelJSCellData {
  // Core data
  value: string | number | boolean | null | Date;
  type: 'empty' | 'string' | 'number' | 'boolean' | 'date' | 'error' | 'formula' | 'richText';
  formula?: string;
  
  // Rich text (alternative to plain value)
  richText?: ExcelRichTextFragment[];
  
  // Styling
  style?: ExcelCellStyle;
  
  // Merge info
  merge?: ExcelMergeInfo;
  
  // Data validation
  dataValidation?: ExcelDataValidation;
  
  // Comment/Note
  note?: {
    texts: ExcelRichTextFragment[];
    margins?: {
      insetmode?: 'auto' | 'custom';
      inset?: [number, number, number, number];
    };
    protection?: {
      locked?: boolean | 'True' | 'False';
      lockText?: boolean | 'True' | 'False';
    };
    editAs?: 'twoCells' | 'oneCells' | 'absolute';
  };
  
  // Hyperlink
  hyperlink?: {
    text?: string;
    hyperlink?: string;
    tooltip?: string;
  };
}

// ============================================================================
// Sheet-level Features
// ============================================================================

export interface ExcelSheetProperties {
  // Merged cells
  merges?: string[];

  // Conditional formatting rules
  conditionalFormattings?: ExcelConditionalFormatting[];
  
  // Images
  images?: ExcelImage[];
  
  // Column widths
  columns?: Array<{
    width?: number;
    hidden?: boolean;
    outlineLevel?: number;
    style?: ExcelCellStyle;
  }>;
  
  // Row heights
  rows?: Array<{
    height?: number;
    hidden?: boolean;
    outlineLevel?: number;
    style?: ExcelCellStyle;
  }>;
  
  // Freeze panes
  views?: Array<{
    state?: 'normal' | 'frozen' | 'split';
    xSplit?: number;  // Number of columns visible in left pane
    ySplit?: number;  // Number of rows visible in top pane
    topLeftCell?: string;  // Top-left cell in bottom-right pane
    activeCell?: string;
    showGridLines?: boolean;
    showRowColHeaders?: boolean;
    rightToLeft?: boolean;
    zoomScale?: number;
    zoomScaleNormal?: number;
  }>;
  
  // Auto filter
  autoFilter?: {
    ref: string;  // Range (e.g., 'A1:E10')
  };
  
  // Print settings
  pageSetup?: {
    paperSize?: number;
    orientation?: 'portrait' | 'landscape';
    horizontalDpi?: number;
    verticalDpi?: number;
    fitToPage?: boolean;
    fitToWidth?: number;
    fitToHeight?: number;
    pageOrder?: 'downThenOver' | 'overThenDown';
    blackAndWhite?: boolean;
    draft?: boolean;
    cellComments?: 'None' | 'asDisplayed' | 'atEnd';
    errors?: 'displayed' | 'blank' | 'dash' | 'NA';
    scale?: number;
    margins?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
      header?: number;
      footer?: number;
    };
  };
  
  // Sheet protection
  protection?: {
    sheet?: boolean;
    password?: string;
    formatCells?: boolean;
    formatColumns?: boolean;
    formatRows?: boolean;
    insertColumns?: boolean;
    insertRows?: boolean;
    insertHyperlinks?: boolean;
    deleteColumns?: boolean;
    deleteRows?: boolean;
    selectLockedCells?: boolean;
    sort?: boolean;
    autoFilter?: boolean;
    pivotTables?: boolean;
    selectUnlockedCells?: boolean;
  };
}
