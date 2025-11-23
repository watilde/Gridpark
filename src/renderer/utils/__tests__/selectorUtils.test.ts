// src/renderer/utils/__tests__/selectorUtils.test.ts

import { parseGridSelector } from '../selectorUtils';

describe('parseGridSelector', () => {
  // --- Basic Element Targeting ---
  test('should parse Sheet:SheetName selector', () => {
    const selector = 'Sheet:MyData';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Sheet',
      sheetName: 'MyData',
    });
  });

  test('should parse Sheet:Active selector', () => {
    const selector = 'Sheet:Active';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Sheet',
      sheetName: 'Active',
    });
  });

  test('should parse Cell:A1 selector (active sheet assumed)', () => {
    const selector = 'Cell:A1';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      identifier: 'A1',
    });
  });

  test('should parse Sheet:SheetName!Cell:A1 selector', () => {
    const selector = 'Sheet:Summary!Cell:B5';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      sheetName: 'Summary',
      identifier: 'B5',
    });
  });

  test('should parse Range:A1:B2 selector', () => {
    const selector = 'Range:A1:B2';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Range',
      identifier: 'A1:B2',
    });
  });

  test('should parse Sheet:ChartData!Range:C3:D7 selector', () => {
    const selector = 'Sheet:ChartData!Range:C3:D7';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Range',
      sheetName: 'ChartData',
      identifier: 'C3:D7',
    });
  });

  test('should parse Col:A selector', () => {
    const selector = 'Col:A';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Col',
      identifier: 'A',
    });
  });

  test('should parse Sheet:Products!Col:C selector', () => {
    const selector = 'Sheet:Products!Col:C';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Col',
      sheetName: 'Products',
      identifier: 'C',
    });
  });

  test('should parse Row:1 selector', () => {
    const selector = 'Row:1';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Row',
      identifier: '1',
    });
  });

  test('should parse Sheet:Metadata!Row:10 selector', () => {
    const selector = 'Sheet:Metadata!Row:10';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Row',
      sheetName: 'Metadata',
      identifier: '10',
    });
  });

  // --- Conditional Selectors ---
  test('should parse Cell with exact value condition', () => {
    const selector = 'Cell[value="Total"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      conditions: [{ attribute: 'value', operator: '=', value: 'Total' }],
    });
  });

  test('should parse Cell with starts-with value condition', () => {
    const selector = 'Cell[value^="Prod"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      conditions: [{ attribute: 'value', operator: '^=', value: 'Prod' }],
    });
  });

  test('should parse Col:A Cell with contains value condition', () => {
    const selector = 'Col:A Cell[value*="sum"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Col', // Base element is Col:A
      identifier: 'A',
      conditions: [{ attribute: 'value', operator: '*=', value: 'sum' }],
    });
  });

  test('should parse Cell with word-match value condition', () => {
    const selector = 'Cell[value~="keyword"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      conditions: [{ attribute: 'value', operator: '~=', value: 'keyword' }],
    });
  });

  test('should parse Cell with type condition', () => {
    const selector = 'Cell[type="number"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      conditions: [{ attribute: 'type', operator: '=', value: 'number' }],
    });
  });

  test('should parse Cell with multiple conditions', () => {
    const selector = 'Cell[type="string"][value*="error"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      conditions: [
        { attribute: 'type', operator: '=', value: 'string' },
        { attribute: 'value', operator: '*=', value: 'error' },
      ],
    });
  });

  test('should parse Sheet!Cell with mixed conditions', () => {
    const selector = 'Sheet:Summary!Cell[type="number"][value="100"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      sheetName: 'Summary',
      conditions: [
        { attribute: 'type', operator: '=', value: 'number' },
        { attribute: 'value', operator: '=', value: '100' },
      ],
    });
  });

  // --- Pseudo-Selectors ---
  test('should parse Cell:Active as an identifier if not a pseudo-selector', () => {
    // If 'Active' is not a pseudo-selector keyword, it's an identifier
    const selector = 'Cell:Active';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      identifier: 'Active',
    });
  });

  test('should parse :active pseudo-selector as a condition', () => {
    const selector = 'Cell:A1:active';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      identifier: 'A1',
      conditions: [{ attribute: 'active', operator: '=', value: 'true' }],
    });
  });

  test('should parse :dirty pseudo-selector as a condition', () => {
    const selector = 'Sheet:MyData!Row:5:dirty';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Row',
      sheetName: 'MyData',
      identifier: '5',
      conditions: [{ attribute: 'dirty', operator: '=', value: 'true' }],
    });
  });

  test('should parse multiple pseudo-selectors and conditions', () => {
    const selector = 'Cell:B2:active[value="Test"]:error';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell',
      identifier: 'B2',
      conditions: [
        { attribute: 'active', operator: '=', value: 'true' },
        { attribute: 'value', operator: '=', value: 'Test' },
        { attribute: 'error', operator: '=', value: 'true' },
      ],
    });
  });

  // --- Invalid Selectors ---
  test('should warn and return partial result for invalid selector', () => {
    const selector = 'InvalidSelector!';
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({ selectorString: selector });
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid Gridpark selector syntax'), selector);
    consoleWarnSpy.mockRestore();
  });

  test('should handle selectors with no explicit element type but conditions', () => {
    const selector = '[value="Hello"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Cell', // Assumed Cell
      conditions: [{ attribute: 'value', operator: '=', value: 'Hello' }],
    });
  });

  test('should handle selectors with Col element and conditions', () => {
    const selector = 'Col:B[type="string"]';
    const parsed = parseGridSelector(selector);
    expect(parsed).toEqual({
      selectorString: selector,
      elementType: 'Col',
      identifier: 'B',
      conditions: [{ attribute: 'type', operator: '=', value: 'string' }],
    });
  });
});
