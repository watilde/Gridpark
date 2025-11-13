# Gridpark Specification v1.9

**Includes:**\
- File Structure (Embedded XLSX model)\
- CSS Selector Specification\
- CSS Examples\
- JavaScript API (Hybrid Model)\
- JavaScript Examples\
- Workbook Embedding Model (OOXML-Compliant)

**Last Updated:** 2025-11-12\
**Author:** Gridpark Project

------------------------------------------------------------------------

# 1. Introduction

Gridpark reimagines spreadsheets as a **hackable, stylable, and reactive
platform**, merging:\
- **CSS semantics** for styling\
- **DOM-like JavaScript APIs** for logic\
- **OOXML-compliant embedding** inside `.xlsx` files

> "A workbook that behaves like a web app --- scriptable, stylable, and
> alive."

------------------------------------------------------------------------

# 2. File Structure (OOXML-Compliant)

A Gridpark workbook is a **standard `.xlsx` file** that embeds an
internal directory named `.gridpark/` inside its ZIP container.\
This structure is **100% compliant** with the [Office Open XML
(ECMA-376)](https://www.ecma-international.org/publications-and-standards/standards/ecma-376/)
specification.

    SalesWorkbook.xlsx
    ├── [Content_Types].xml
    ├── _rels/.rels
    ├── xl/
    │   ├── workbook.xml
    │   ├── worksheets/
    │   │   ├── sheet1.xml
    │   │   ├── sheet2.xml
    │   │   └── sheet3.xml
    │   └── sharedStrings.xml
    └── .gridpark/
        ├── manifest.json
        ├── CSS
        ├── JavaScript
        └── Sheets/
            ├── Sheet1/
            │   ├── CSS
            │   └── JavaScript
            ├── Sheet2/
            │   ├── CSS
            │   └── JavaScript
            └── Sheet3/
                └── JavaScript

### ✅ Compliance Notes

-   `.gridpark/` exists **inside** the XLSX ZIP container.\
-   Excel **ignores** unregistered folders not listed in
    `[Content_Types].xml`.\
-   According to **ECMA-376 §9.1.1.4 (Interleaved Parts)**:\
    \> "A package may contain parts not referenced by any relationship.\
    \> Such parts shall be ignored by applications that do not
    understand them."\
-   Gridpark is therefore **fully compatible** with Excel and other
    Office tools.

### 🧱 Guidelines

  Rule                                       Description
  ------------------------------------------ ----------------------------------
  No modification to `[Content_Types].xml`   Keep Excel compatibility
  No new relationships (`_rels/`)            `.gridpark/` is detached
  Store at root level                        Avoid `/xl/` namespace conflicts
  Use normal ZIP compression                 Same as Excel
  Optional custom MIME type                  `application/vnd.gridpark+json`

------------------------------------------------------------------------

# 3. CSS Specification

Gridpark introduces a **CSS-compatible styling model** for
spreadsheets.\
Sheets are represented as a **virtual DOM**, allowing tags, classes,
IDs, and attributes to describe appearance and behavior.

## 3.1 Concept Mapping

  HTML Element   Gridpark Equivalent   Example
  -------------- --------------------- ------------------------
  `<sheet>`      Worksheet             `<sheet id="Summary">`
  `<row>`        Row                   `<row index="1">`
  `<col>`        Column                `<col index="3">`
  `<cell>`       Cell                  `<cell ref="A1">`
  `<range>`      Range                 `<range ref="A1:C10">`

## 3.2 Selectors

  Type         Example                     Description
  ------------ --------------------------- -----------------
  Tag          `sheet {}`, `cell {}`       Structure
  Class        `.total {}`                 Named styles
  ID           `#Sales {}`                 Sheet ID
  Attribute    `cell[ref="A1"] {}`         Metadata
  Descendant   `sheet#Sales row cell {}`   Hierarchy
  Pseudo       `cell:hover {}`             State selectors

## 3.3 Cascade & Priority

  Priority       Description
  -------------- ---------------
  `!important`   Highest
  Inline         Overrides all
  `.class`       High
  `#id`          Medium
  `tag`          Low

## 3.4 Pseudo-classes

  Pseudo        Description
  ------------- ---------------
  `:hover`      Hover state
  `:selected`   Selected cell
  `:edited`     Value changed
  `:error`      Error cell

## 3.5 Extended Selectors

  Selector       Description      Example
  -------------- ---------------- ------------------------
  `:formula()`   Match formula    `cell:formula("=SUM")`
  `:value()`     Match by value   `cell:value(">100")`
  `[name]`       Named range      `cell[name="Total"]`

------------------------------------------------------------------------

# 4. CSS Examples

``` css
sheet#Summary {
  background: #f9f8ff;
  font-family: "Noto Sans";
}

row[index="1"] {
  font-weight: bold;
  background: #e1e4eb;
}

col[index="3"] {
  text-align: right;
}

cell[ref="A1"] {
  color: #4efd8a;
}

.range-highlight cell {
  background: rgba(62,71,90,0.1);
}

cell:hover {
  background: #eef;
}

cell:edited {
  animation: flash 0.3s;
}
```

------------------------------------------------------------------------

# 5. JavaScript API (Hybrid Model)

Gridpark exposes a **virtual spreadsheet DOM**, manipulable with
DOM-like APIs.\
Developers can use either **`gridpark.querySelector`** or
**`document.querySelector`**, since Gridpark proxies the latter when
mounted.

## 5.1 Core Example

``` js
const sheet = document.querySelector("#Sales");
const cell = document.querySelector('cell[ref="A1"]');

cell.value = 1200;
cell.style.background = "#ff4da6";
```

## 5.2 Global API

  Method                               Description
  ------------------------------------ --------------------------------
  `gridpark.querySelector(sel)`        Query inside the Gridpark DOM
  `gridpark.querySelectorAll(sel)`     Query multiple nodes
  `gridpark.on(event, sel, handler)`   Event binding
  `document.querySelector(sel)`        Proxy to Gridpark when mounted
  `document.querySelectorAll(sel)`     Proxy-enabled alias

## 5.3 Events

  Event        Trigger
  ------------ --------------------
  `"change"`   Cell value changed
  `"select"`   Selection changed
  `"hover"`    Hover event
  `"render"`   Sheet re-render

## 5.4 Node Interfaces

``` js
interface Sheet {
  id: string;
  name: string;
  rows: Row[];
  getCell(ref: string): Cell;
}

interface Cell {
  ref: string;
  value: any;
  formula?: string;
  style: CSSStyleDeclaration;
  classList: DOMTokenList;
}
```

## 5.5 Reactive Pattern Example

``` js
document.querySelectorAll("cell").forEach(cell => {
  if (Number(cell.value) > 100) cell.classList.add("alert");
});
```

``` css
cell.alert {
  color: #ff6b35;
  font-weight: bold;
}
```

------------------------------------------------------------------------

# 6. JavaScript Examples

### Click-to-Sort

``` js
document.addEventListener("click", (e) => {
  if (!e.target.matches("row[index='1'] cell")) return;
  const headerCell = e.target;
  const colRef = headerCell.ref.match(/[A-Z]+/)[0];
  const sheet = document.querySelector("sheet#Sales");
  const rows = [...sheet.querySelectorAll("row")].filter(r => r.index > 1);

  rows.sort((a, b) => {
    const aCell = a.querySelector(`cell[ref^='${colRef}']`);
    const bCell = b.querySelector(`cell[ref^='${colRef}']`);
    return (Number(aCell.value) || 0) - (Number(bCell.value) || 0);
  });

  rows.forEach((row, i) => {
    row.index = i + 2;
    sheet.appendChild(row);
  });

  headerCell.classList.add("sorted");
  setTimeout(() => headerCell.classList.remove("sorted"), 800);
});
```

``` css
cell.sorted {
  background: #3dd6f5;
  color: #fff;
  transition: all 0.3s ease;
}
```

### Highlight Active Row

``` js
document.addEventListener("select", (e) => {
  if (!e.target.matches("cell")) return;
  const row = e.target.closest("row");
  document.querySelectorAll("row.active").forEach(r => r.classList.remove("active"));
  row.classList.add("active");
});
```

``` css
row.active cell {
  background: #ff4da6;
  color: #fff;
}
```

### Auto-Sum Column

``` js
const totalCell = document.querySelector('cell[name="Total"]');

document.addEventListener("change", (e) => {
  if (!e.target.matches('col[index="2"] cell')) return;
  const values = document.querySelectorAll('col[index="2"] cell');
  const sum = [...values].reduce((a, c) => a + Number(c.value || 0), 0);
  totalCell.value = sum;
});
```

### Reactive Style

``` js
document.querySelectorAll("cell").forEach(cell => {
  cell.classList.toggle("over-limit", Number(cell.value) > 100);
});
```

``` css
cell.over-limit {
  color: #ff6b35;
  font-weight: bold;
}
```

### Hover Tooltip

``` js
document.addEventListener("hover", (e) => {
  if (!e.target.matches('cell[ref="A1"]')) return;
  const tooltip = document.createElement("div");
  tooltip.textContent = "This is cell A1";
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);
  e.target.addEventListener("mouseleave", () => tooltip.remove(), { once: true });
});
```

``` css
.tooltip {
  position: absolute;
  background: #1c2541;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
```

------------------------------------------------------------------------

# 7. Workbook Embedding Model (OOXML-Compliant)

## 7.1 Overview

Gridpark embeds its code and styles **inside the `.xlsx` ZIP container**
under `.gridpark/`, leveraging the **Open Packaging Conventions (OPC)**.

Excel and other consumers safely ignore this folder, while Gridpark
runtimes load it dynamically.

## 7.2 Compliance Summary

  Criterion             Status   Description
  --------------------- -------- --------------------------------------
  OPC ZIP structure     ✅       Unchanged
  Excel compatibility   ✅       Excel ignores unknown folders
  OOXML conformance     ✅       ECMA-376 allows "foreign parts"
  Backward safety       ✅       Compatible with older Excel versions
  Gridpark runtime      ✅       Reads via ZIP APIs

------------------------------------------------------------------------

# 8. Summary

> Gridpark extends Excel with a fully OOXML-compliant embedded app layer
> ---\
> combining **CSS styling**, **DOM scripting**, and **sandboxed
> interactivity** inside `.xlsx`.

**© Gridpark Project --- Specification v1.9**\
*"表計算をデザインし、走らせる。"*
