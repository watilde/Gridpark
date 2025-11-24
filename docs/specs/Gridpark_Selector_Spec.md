# Gridpark Selector Specification

This document details the specification for interacting with the Gridpark spreadsheet grid using CSS-like selectors, enabling a powerful "Controlled Hackability" experience for developers within the plugin sandbox. The goal is to allow developers to target and manipulate spreadsheet elements (cells, rows, columns, sheets, ranges) using intuitive syntax familiar from web development, accessible from both JavaScript and CSS.

## 1. Core Principles

*   **Familiarity**: Mimic CSS/DOM `querySelector` semantics.
*   **Precision**: Allow targeting specific cells, ranges, rows, columns, and sheets.
*   **Controlled Access**: All interactions are mediated by the Gridpark core to maintain data consistency, ensure deterministic behavior, and respect the React rendering lifecycle. Direct manipulation of the underlying React DOM is prevented.
*   **Sandboxed Environment**: Selectors are available exclusively within the secure plugin sandbox.

## 2. Gridpark Semantic Selector Syntax (DSL-like)

Gridpark introduces a "Semantic Selector Syntax" – a concise and intuitive DSL (Domain-Specific Language) inspired by web DOM selectors. This syntax allows developers to target spreadsheet elements (sheets, cells, ranges, columns, rows) using a unified, human-readable string, which is then interpreted by Gridpark for both JavaScript and CSS contexts. The syntax leverages a hierarchical structure with colons (`:`) and exclamation marks (`!`) for clarity.

### 2.1 Basic Element Targeting

*   **Sheet Selection**:
    *   `Sheet:<SheetName>`: Selects a specific sheet by its name.
    *   Example: `Sheet:MyData`
    *   `Sheet:Active`: Selects the currently active sheet. (Implicit if no sheet is specified and active context exists).

*   **Cell Selection**:
    *   `Cell:<Address>`: Selects a single cell by its Excel-style address within the active sheet.
    *   `Sheet:<SheetName>!Cell:<Address>`: Selects a single cell by its Excel-style address within a specific sheet.
    *   Example: `Cell:A1`, `Sheet:Summary!Cell:B5`

*   **Range Selection**:
    *   `Range:<StartAddress>:<EndAddress>`: Selects a range of cells within the active sheet.
    *   `Sheet:<SheetName>!Range:<StartAddress>:<EndAddress>`: Selects a range of cells within a specific sheet.
    *   Example: `Range:A1:B2`, `Sheet:ChartData!Range:C3:D7`

*   **Column Selection**:
    *   `Col:<ColumnIdentifier>`: Selects an entire column by its Excel-style identifier (e.g., A, B, AA) within the active sheet.
    *   `Sheet:<SheetName>!Col:<ColumnIdentifier>`: Selects an entire column within a specific sheet.
    *   Example: `Col:A`, `Sheet:Products!Col:C`

*   **Row Selection**:
    *   `Row:<RowNumber>`: Selects an entire row by its number within the active sheet.
    *   `Sheet:<SheetName>!Row:<RowNumber>`: Selects an entire row within a specific sheet.
    *   Example: `Row:1`, `Sheet:Metadata!Row:10`

### 2.2 Contextual Shorthands

*   If no sheet name is specified, the selector implicitly applies to the currently active sheet.
    *   Example: If "Sheet1" is active, `Cell:A1` is equivalent to `Sheet:Sheet1!Cell:A1`.
*   Relative addressing within a selected range or column/row is not directly supported in the selector string itself, but can be achieved by chaining operations in JavaScript or by nested CSS.

### 2.3 Conditional Selectors (Pseudo-Selectors)

Gridpark will support conditional selectors, enabling developers to target elements based on their data, state, or other properties, similar to CSS pseudo-classes or advanced attribute selectors. These conditions can be combined with basic element and range selectors for highly precise targeting.

*   **By Value**:
    *   `cell[value="<ExactValue>"]`: Selects cells whose *displayed* value exactly matches `<ExactValue>`.
    *   `cell[value^="<StartString>"]`: Selects cells whose value starts with `<StartString>`.
    *   `cell[value*="<ContainsString>"]`: Selects cells whose value contains `<ContainsString>`.
    *   `cell[value~="<Word>"]`: Selects cells whose value contains the whole word `<Word>`.
    *   Example: `Cell[value="Total"]`, `Col:A Cell[value^="Product"]`
*   **By Data Type**:
    *   `cell[type="number"]`: Selects cells identified as containing a number.
    *   `cell[type="string"]`: Selects cells identified as containing a string.
    *   `cell[type="formula"]`: Selects cells containing a formula.
    *   Example: `Col:C Cell[type="number"]`
*   **By State**:
    *   `:active`: Targets the currently active spreadsheet element (cell, row, col).
    *   `:selected`: Targets elements that are part of the current user selection.
    *   `:dirty`: Targets elements (cells, sheets, workbooks) with unsaved changes.
    *   `:error`: Targets cells containing an error value (e.g., #VALUE!, #DIV/0!).
*   **By Formula Structure (Future Consideration)**:
    *   `cell[formula*="SUM"]`: Selects cells whose formula contains "SUM".
    *   `cell[formula~="VLOOKUP"]`: Selects cells whose formula contains the VLOOKUP function.
*   **Combined Conditions**:
    *   `Sheet:Summary!Cell[type="number"][value<100]`: Selects number cells in the "Summary" sheet with a value less than 100. (Note: numerical comparisons would be implemented through specialized parsing in `grid.querySelector` and potentially through dynamically generated `data-` attributes for CSS, e.g., `data-value-lt="100"`).

**CSS Integration for Conditional Selectors**:
For CSS, Gridpark's rendering engine will generate appropriate `data-` attributes on the rendered DOM elements to reflect these conditions. For example:
*   `cell[value="Total"]` would target `.cell[data-cell-value="Total"]`.
*   `cell[type="number"]` would target `.cell[data-cell-type="number"]`.
*   `:active` would be mapped to a class like `.is-active` or a `data-` attribute like `data-active="true"`.

This allows CSS to leverage these conditions using standard attribute and class selectors.

## 3. CSS Integration

To enable a unified and intuitive selection experience, Gridpark allows developers to leverage the "Semantic Selector Syntax" for both CSS styling and JavaScript interactions.

While JavaScript's `grid.querySelector` directly parses this semantic selector string, CSS operates on the rendered DOM's structure and attributes. Gridpark's rendering engine acts as a mediator, translating the semantic intent of these selectors into standard CSS-compatible forms (classes and data attributes) on the DOM elements, allowing native CSS matching.

Gridpark plugins can apply CSS styles directly targeting spreadsheet elements using the defined selector syntax. To enable this, the Gridpark rendering engine will dynamically add specific `data-` attributes to the rendered DOM elements that correspond to the logical spreadsheet structure.

**Internal DOM Representation (Conceptual):**

```html
<div class="sheet" data-sheet-name="MyData">
  <div class="row" data-row-num="1">
    <div class="col" data-col-id="A">
      <div class="cell" data-cell-address="A1" data-cell-value="Hello"></div>
    </div>
    <!-- ... other columns ... -->
  </div>
  <!-- ... other rows ... -->
</div>
```

**Example CSS using Data Attributes:**

```css
/* Style all cells in column A */
.col[data-col-id="A"] .cell {
  background-color: #f0f0f0;
  font-weight: bold;
}

/* Highlight cells in a specific range on Sheet1 */
/* Gridpark will simplify range targeting by generating `data-in-range` attributes on relevant cells.
   This allows direct CSS targeting of cells belonging to specific logical ranges. */
.sheet[data-sheet-name="Sheet1"] .cell[data-in-range="C1:E5"] {
  border: 2px solid var(--gridpark-color-accent-orange);
}

/* Apply a custom style to a cell with a specific value */
.cell[data-cell-value="Total"] {
  color: var(--gridpark-color-accent-green);
  font-size: 1.2em;
}
```

**Implementation Details for CSS:**
*   Gridpark will internally map the DSL-like selectors to DOM elements by generating appropriate `data-*` attributes. This includes `data-in-range="<RangeAddress>"` for cells that are part of a programmatically defined range.
*   Custom CSS provided by plugins will be injected into the sandboxed environment and applied to the grid's visual layer.
*   Predefined CSS variables (e.g., `var(--gridpark-color-accent-orange)`) will be exposed for consistent theming.

## 4. JavaScript Integration

Within the plugin sandbox, a global `grid` object will be available. This `grid` object will expose `querySelector`-like methods that accept the Gridpark Selector Syntax (DSL-like) and return controlled `GridElement` objects.

**Example JavaScript:**

```javascript
// Get the active sheet
const activeSheet = grid.querySelector('Sheet:Active');
if (activeSheet) {
  console.log('Active sheet name:', activeSheet.name);
}

// Get a single cell element on the active sheet
const cellA1 = grid.querySelector('Cell:A1');
if (cellA1) {
  cellA1.style.backgroundColor = 'lightblue';
  cellA1.addEventListener('click', () => {
    console.log('Cell A1 clicked!');
    // To update underlying data, use grid.setRange API
    grid.setRange('A1', [['Clicked!']]); // Implicitly on active sheet
  });
}

// Get multiple elements from a specific sheet and column
const columnBCells = grid.querySelectorAll('Sheet:Products!Col:B');
columnBCells.forEach(cell => {
  if (cell.value < 10) { // Assuming GridElement for cell has a 'value' property
    cell.style.backgroundColor = 'salmon';
  }
});

// Get a range of cells
const salesRange = grid.querySelector('Sheet:Sales!Range:A1:D10');
if (salesRange) {
  salesRange.style.border = '1px solid gray';
}
```

**API Methods (within `grid` object):**
*   **`grid.querySelector(selector: string): GridElement | null`**: Returns the first matching `GridElement` or `null`.
*   **`grid.querySelectorAll(selector: string): GridElement[]`**: Returns an array of all matching `GridElement`s.

**`GridElement` Interface (simplified):**
The `GridElement` will be a proxy object that provides a controlled interface to the underlying visual element, mimicking key DOM properties.
*   `id: string`: Unique identifier for the element.
*   `className: string`: For adding/removing CSS classes.
*   `dataset: DOMStringMap`: For custom data attributes.
*   `style: CSSStyleDeclaration`: A subset of CSS style properties for visual manipulation.
*   `addEventListener(event: string, handler: Function)`: For attaching event listeners (e.g., `click`, `change`).
*   `setAttribute(name: string, value: string)`: For setting custom attributes.
*   `value: any`: For accessing or setting the *displayed* value of a cell. Changes to this should typically be followed by `grid.setRange` for data persistence.
*   `address: string`: The Excel-style address of the element (if applicable).
*   `name: string`: The name of the sheet, column, or row (if applicable).
*   `rowIndex: number`: The 0-based index of the row (if applicable).
*   `columnIndex: number`: The 0-based index of the column (if applicable).
*   `sheetName: string`: The name of the sheet this element belongs to.
*   Other properties relevant to the element type.

## 5. Architectural Implications

The implementation of Gridpark Selectors necessitates a careful balance between developer freedom and architectural integrity:
*   **Renderer Layer Mediation**: The React rendering layer will intercept and interpret plugin-provided CSS and JavaScript selector operations. It will translate these into safe updates to the visual DOM managed by React.
*   **Data Model Separation**: Visual changes made via selectors (e.g., `element.style.backgroundColor`) will not automatically update the underlying immutable workbook data model. Explicit API calls (e.g., `grid.setRange`) are required to modify data.
*   **Performance**: The mediation layer will be optimized to minimize re-renders and ensure smooth performance, especially for broad selectors.
*   **Security**: All selector operations occur within the plugin sandbox, ensuring that plugins cannot access or modify arbitrary parts of the Electron application or host system.

This approach provides developers with a highly intuitive and powerful way to customize Gridpark's appearance and behavior, while safeguarding the application's stability and data integrity.

## 6. Exceptions and Key Considerations

While Gridpark Semantic Selectors aim to provide a familiar and intuitive experience akin to web DOM manipulation, it's important to understand certain distinctions and limitations inherent in a spreadsheet environment.

### 6.1 `GridElement` is a Proxy, Not a Native DOM Element

The `GridElement` objects returned by `grid.querySelector` and `grid.querySelectorAll` are carefully controlled proxy objects. They *mimic* key properties and methods of standard `HTMLElement`s (e.g., `style`, `addEventListener`, `setAttribute`, `value`, `className`, `dataset`) but are not actual live DOM nodes.

*   **Limited API Surface**: Not all standard `HTMLElement` properties and methods will be available (e.g., `innerHTML`, `outerHTML`, `children`, `parentNode`, `nextSibling`, `previousSibling`). Access is restricted to maintain security, data integrity, and architectural separation.
*   **No Direct HTML DOM Traversal**: You cannot use standard DOM traversal methods (like `querySelector` on a returned `GridElement` to find a raw HTML `div`) to navigate the underlying HTML structure of the grid. `GridElement`s represent *conceptual* spreadsheet components (cells, rows, columns, sheets), and their "children" are other conceptual spreadsheet components.

### 6.2 Data Model vs. Visual Representation

Visual modifications made through `GridElement.style` or CSS selectors (`.cell[data-cell-value="Total"] { color: red; }`) only affect the *displayed* properties of the spreadsheet elements. They do *not* automatically alter the underlying data in the workbook's immutable data model.

*   **Explicit Data Updates Required**: To modify the actual data of a cell or range, explicit API calls to the workbook engine are required, primarily through methods like `grid.setRange()`. Plugins must actively synchronize visual changes with data changes.

### 6.3 Performance Considerations for Broad Selectors

While syntactically valid, selectors that target a very large number of elements across multiple sheets without specific constraints (e.g., `Sheet:Active!Cell[value=""]`) can have significant performance implications, especially for very large workbooks.

*   **Optimized Targeting**: Developers are encouraged to optimize their selectors by targeting specific sheets, rows, or columns whenever possible to limit the scope of queries and maintain application responsiveness.

### 6.4 Read-Only Properties

Some properties of `GridElement`s (e.g., `address`, `rowIndex`, `columnIndex`, `sheetName`) will be read-only to reflect the fixed structural nature of the spreadsheet element they represent. Attempts to modify these properties will either be ignored or result in an error.

### 6.5 Evolution of Features

*   **Conditional Selectors**: As noted in Section 2.3, some conditional selectors (e.g., those involving numerical comparisons like `value<100` or formula structure matching) may be introduced gradually as features. Their availability and exact behavior should be verified against the current API documentation.

These considerations ensure that developers can leverage the power of web-like selectors in Gridpark effectively, while operating within a secure, stable, and data-consistent environment.