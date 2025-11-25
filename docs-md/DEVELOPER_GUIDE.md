# Gridpark Developer Guide

## Architecture Overview

Gridpark uses a clean separation between UI state and data persistence:

- **Redux**: UI state only (tabs, selection, preferences)
- **Dexie.js (IndexedDB)**: Data persistence (sheet cells, metadata)
- **File System**: Document storage (Excel files, manifest, code)

## Project Structure

```
src/
├── components/          # Reusable UI components (Button, Input, Modal)
├── features/           # Business logic & domain-specific components
│   ├── spreadsheet/   # Excel grid, formula bar, cell editor
│   └── workspace/     # File tree, tabs, save manager
├── pages/             # Screen layouts (composition only)
├── stores/            # Redux store configuration
└── lib/
    └── db.ts          # Dexie database schema
```

### Three-Layer Pattern

**Components** (Generic UI) → **Features** (Business Logic) → **Pages** (Layout)

- **Components**: Pure, reusable UI elements with no business logic
- **Features**: Self-contained functionality with state management
- **Pages**: Compose features into screens (minimal logic)

## State Management

### Dexie.js (Data Storage)

Store spreadsheet cells in IndexedDB for efficient persistence:

```typescript
// Use reactive queries
const sheet = useExcelSheet({ tabId, workbookId, sheetName, sheetIndex });
const { cells, isDirty, updateCell } = sheet;

// Update cells
await updateCell({ row: 0, col: 0, value: "Hello" });
```

**Schema**:
- `cells`: Sparse matrix storage (tabId, row, col, value, type, formula)
- `sheetMetadata`: Sheet dimensions and statistics

### Redux (UI State)

Manage UI-only state like tabs, selection, and preferences:

```typescript
const { openTabs, activeTab } = useAppSelector(state => state.spreadsheet);
dispatch(addTab({ id, name, kind: 'sheet' }));
```

## Formula Calculation

Gridpark uses **HyperFormula** (Excel-compatible calculation engine) in a Web Worker:

```typescript
const { calculate } = useFormulaWorker(tabId);

// Calculate formulas
const result = await calculate('=SUM(A1:A100)', 'B1');
const vlookup = await calculate('=VLOOKUP(A1, B1:D10, 3, FALSE)', 'E1');
```

**Features**:
- 400+ Excel functions (SUM, VLOOKUP, IF, SUMIF, etc.)
- Non-blocking calculation (Web Worker)
- Dependency tracking and circular reference detection
- Result caching for performance

## Development Workflow

### Adding a Component

**Generic UI?** → `src/components/Button.tsx`
**Feature-specific?** → `src/features/myfeature/components/MyButton.tsx`

```typescript
// Generic component (src/components/Button.tsx)
export const Button = ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
);
```

### Adding a Feature

1. Create directory: `src/features/myfeature/`
2. Add hook: `hooks/useMyFeature.ts` (state layer)
3. Add component: `components/MyComponent.tsx`
4. Use in page: `src/pages/MyPage.tsx`

```typescript
// Feature hook bridges Dexie + Redux
export function useMyFeature() {
  const data = useLiveQuery(() => db.myTable.toArray());
  const uiState = useAppSelector(selectMyState);
  return { data, uiState };
}
```

### Adding State

**Table data?** → Add to `src/lib/db.ts` (Dexie)
**UI state?** → Add to `src/stores/` (Redux slice)

## Performance Optimization

- **Sparse Matrix**: Only non-empty cells are stored
- **Indexed Queries**: O(1) cell lookups with compound indexes
- **Web Workers**: Offload formula calculation from main thread
- **Batch Updates**: Use `bulkPut` for multiple cell updates
- **Formula Caching**: Automatic result caching with dependency tracking

## Key Files

- `src/lib/db.ts` - Dexie database schema
- `src/stores/index.ts` - Redux store configuration
- `src/features/spreadsheet/hooks/useExcelSheet.ts` - Sheet state management
- `src/features/formula/hooks/useFormulaWorker.ts` - Formula calculation
- `src/renderer/App.tsx` - Application root

## Common Tasks

### Query cells from database

```typescript
const cells = useLiveQuery(
  async () => await db.cells.where('tabId').equals(tabId).toArray(),
  [tabId]
);
```

### Update multiple cells

```typescript
await db.bulkUpsertCells(tabId, [
  { row: 0, col: 0, data: { value: "A", type: "string" } },
  { row: 0, col: 1, data: { value: 123, type: "number" } },
]);
```

### Dispatch Redux action

```typescript
const dispatch = useAppDispatch();
dispatch(markDirty(tabId));
```

## Best Practices

1. **Use reactive queries**: `useLiveQuery` for Dexie, `useAppSelector` for Redux
2. **Batch updates**: Combine multiple database operations
3. **Memoize callbacks**: Use `useCallback` to prevent unnecessary re-renders
4. **Keep pages thin**: Move business logic to feature hooks
5. **Test each layer**: Unit test components, integration test features

## External Resources

- [Dexie.js Documentation](https://dexie.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [HyperFormula Documentation](https://hyperformula.handsontable.com/)
