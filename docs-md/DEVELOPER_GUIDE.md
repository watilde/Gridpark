# Gridpark Developer Guide

## Architecture Overview

Gridpark uses a clean separation between UI state and data:

- **Redux**: UI state only (tabs, selection, preferences); a small whitelist persists to `localStorage` via `redux-persist`.
- **In-memory `AppDatabase`** (`src/lib/db.ts`): runtime data store for cells, sheet metadata, and conditional-formatting rules. Backed by `Map`s, not IndexedDB. Data is lost on app restart — durability comes from saving the workbook to disk.
- **File System**: Document storage (Excel files, manifest, code) via Electron IPC + ExcelJS.

> Earlier revisions used Dexie.js / IndexedDB for the data layer. That was reverted; the current store is purely in-memory. The API uses `db.subscribe(listener, { tabId, type })` instead of Dexie's `useLiveQuery`.

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

### `AppDatabase` (in-memory data store)

Cell data lives in `Map`s keyed by `tabId:row:col`. Reads return arrays/snapshots; writes go through `upsertCell` / `bulkUpsertCells` / `upsertSheetMetadata`. Subscribe for reactivity:

```typescript
import { db } from '@/lib/db';

const unsubscribe = db.subscribe(
  event => { /* event.type, event.tabId, event.action */ },
  { tabId, type: 'cells' } // optional filters
);
```

Or use the higher-level hook:

```typescript
const sheet = useExcelSheet({ tabId, workbookId, sheetName, sheetIndex });
const { cells, isDirty, updateCell } = sheet;
await updateCell({ row: 0, col: 0, value: "Hello" });
```

**Stores**:
- `cellsStore`: sparse matrix (only non-empty cells)
- `sheetMetadataStore`: dimensions, dirty flag, timestamps
- `workbooksStore`: workbook-level metadata
- `conditionalFormattingStore`: per-sheet CF rules

The `_batch_` sentinel `tabId` is used by bulk operations to fan out a single notification to all listeners.

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
// Feature hook bridges AppDatabase + Redux
export function useMyFeature(tabId: string) {
  const [data, setData] = useState<MyType[]>([]);
  const uiState = useAppSelector(selectMyState);

  useEffect(() => {
    const refresh = async () => setData(await db.getCellsForSheet(tabId));
    refresh();
    return db.subscribe(refresh, { tabId, type: 'cells' });
  }, [tabId]);

  return { data, uiState };
}
```

### Adding State

**Domain data?** → extend `AppDatabase` in `src/lib/db.ts`
**UI state?** → add to `src/stores/` (Redux slice)

## Performance Optimization

- **Sparse Matrix**: Only non-empty cells are stored
- **O(1) cell lookups** via the `tabId:row:col` map key
- **Web Workers**: Offload formula calculation from main thread
- **Batch Updates**: Use `bulkUpsertCells` for multiple cell updates (single notification)
- **Formula Caching**: Automatic result caching with dependency tracking

## Key Files

- `src/lib/db.ts` - In-memory `AppDatabase` (cells, metadata, conditional formatting)
- `src/lib/exceljs-adapter.ts` - ExcelJS ↔ `AppDatabase` translation layer
- `src/stores/index.ts` - Redux store configuration
- `src/features/spreadsheet/hooks/useExcelSheet.ts` - Sheet state management
- `src/features/formula/hooks/useFormulaWorker.ts` - Formula calculation client
- `src/workers/formula.worker.ts` - HyperFormula worker (separate cell store, message-driven)
- `src/renderer/app/App.tsx` - Application root

## Common Tasks

### Query cells from database

```typescript
const cells = await db.getCellsForSheet(tabId);
// or in a range:
const range = await db.getCellsInRange(tabId, startRow, endRow, startCol, endCol);
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

1. **Reactive reads**: `db.subscribe(...)` for `AppDatabase`, `useAppSelector` for Redux
2. **Batch updates**: prefer `bulkUpsertCells` over many `upsertCell` calls (single notification, fewer re-renders)
3. **Memoize callbacks**: Use `useCallback` to prevent unnecessary re-renders
4. **Keep pages thin**: Move business logic to feature hooks
5. **Test each layer**: Unit test components, integration test features

## External Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [HyperFormula Documentation](https://hyperformula.handsontable.com/)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
