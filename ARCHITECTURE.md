# Architecture Documentation

## Overview

This application uses a modern, scalable architecture with clear separation of concerns:

- **Dexie.js** for table data (cells, sheets, workbooks)
- **Redux Toolkit (RTK) + redux-persist** for UI state management
- **Feature-based structure** for better organization

📖 **See [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)** for detailed explanation of components vs features vs pages

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Components                          │
│                  (React UI Components)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
┌───────────▼──────────┐   ┌─────────▼──────────────┐
│   Feature Hooks      │   │   Redux Selectors      │
│  (useExcelSheet)     │   │  (useAppSelector)      │
│                      │   │                        │
│  ┌─────────┐        │   │                        │
│  │ Dexie   │        │   │                        │
│  │ Queries │        │   │                        │
│  └────┬────┘        │   │                        │
└───────┼─────────────┘   └────────────────────────┘
        │                           │
┌───────▼──────────┐   ┌────────────▼──────────────┐
│    Dexie.js      │   │   Redux Store (RTK)       │
│  (IndexedDB)     │   │   + redux-persist         │
├──────────────────┤   ├───────────────────────────┤
│ • Sheet data     │   │ • Dirty state tracking    │
│ • Cell values    │   │ • Open tabs               │
│ • Formulas       │   │ • Active selections       │
│ • Cell styles    │   │ • Auto-save config        │
│ • Large datasets │   │ • Session state           │
└──────────────────┘   └───────────────────────────┘
```

## Directory Structure

```
src/
├── app/                      # App-level configuration
│   └── AppProvider.tsx       # Redux Provider + PersistGate + Theme
├── assets/                   # Static assets
├── components/               # 🧱 Generic reusable components (The Lego Bricks)
├── features/                 # ⚙️ Feature modules - The Engine (main development area)
│   └── spreadsheet/          # Spreadsheet feature
│       ├── components/       # Feature-specific UI components (domain-aware)
│       │   └── ExcelGrid.tsx
│       └── hooks/            # ★ State layer (Dexie + Redux bridge)
│           └── useExcelSheet.ts
├── hooks/                    # Generic reusable hooks
├── lib/                      # ★ Infrastructure setup
│   └── db.ts                 # Dexie database configuration
├── pages/                    # 🖼️ Page components - The Showroom (composition only)
├── stores/                   # ★ Redux state management
│   ├── index.ts              # Store configuration (RTK + persist)
│   └── spreadsheetSlice.ts   # Spreadsheet UI state
├── theme/                    # Theme configuration
├── types/                    # TypeScript types
└── utils/                    # Utility functions
```

## State Management Strategy

### 1. **Dexie.js for Table Data** (`lib/db.ts`)

**What it manages:**
- Sheet data (metadata, names, indices)
- Cell data (values, formulas, styles)
- Workbook metadata

**Why Dexie.js:**
- ✅ Reactive queries with `useLiveQuery`
- ✅ Automatic re-renders when data changes
- ✅ IndexedDB for large datasets
- ✅ Offline-first capabilities
- ✅ Fast queries with compound indices

**Example:**
```typescript
// Auto-reactive query - component re-renders when data changes
const cells = useLiveQuery(
  async () => await db.getCellsForSheet(sheetId),
  [sheetId]
);
```

### 2. **Redux Toolkit for UI State** (`stores/`)

**What it manages:**
- Dirty state tracking (unsaved changes)
- Open tabs and active tab
- Auto-save configuration
- Session state (scroll, selections)

**Why Redux Toolkit:**
- ✅ Single source of truth
- ✅ Predictable state updates
- ✅ Time-travel debugging
- ✅ Persistence with redux-persist
- ✅ Type-safe with TypeScript

**Example:**
```typescript
// Dispatch actions
dispatch(markDirty(tabId));

// Select state
const isDirty = useAppSelector(selectIsDirty(tabId));
```

### 3. **Feature Hooks as Bridge** (`features/*/hooks/`)

**Purpose:** Connect Dexie and Redux in a clean API

**Example - `useExcelSheet`:**
```typescript
const {
  cells,          // From Dexie (reactive)
  isDirty,        // From Redux
  updateCell,     // Updates Dexie + marks dirty in Redux
  markSaved,      // Clears dirty state in Redux
} = useExcelSheet({ workbookId, sheetName, tabId });
```

## Data Flow

### Writing Data (User Edit)

```
User Edit
   ↓
Component calls updateCell()
   ↓
useExcelSheet hook
   ├─→ Updates Dexie database
   └─→ Dispatches markDirty() to Redux
         ↓
Component re-renders (via useLiveQuery + useSelector)
```

### Saving Data

```
User clicks Save
   ↓
Component calls save handler
   ↓
Save to file system
   ↓
Component calls markSaved()
   ↓
Redux updates dirty state
   ↓
Component re-renders (dirty indicator removed)
```

### Loading Data

```
Component mounts with useExcelSheet
   ↓
useLiveQuery fetches from Dexie
   ↓
Component renders with data
   ↓
[Data changes in Dexie]
   ↓
useLiveQuery automatically re-fetches
   ↓
Component re-renders with new data
```

## Key Benefits

### 🎯 **Single Source of Truth**
- Table data → Dexie
- UI state → Redux
- No duplication, no sync issues

### 🔄 **Reactive Updates**
- `useLiveQuery` auto-updates components when data changes
- No manual state management needed

### 🚫 **No Infinite Loops**
- One-way data flow enforced
- Clear separation of concerns
- Immutable updates

### 🐛 **Debuggable**
- Redux DevTools for state inspection
- Time-travel debugging
- Clear action history

### 💾 **Persistent**
- redux-persist for UI state
- IndexedDB for table data
- Offline-first architecture

### 🧪 **Testable**
- Pure Redux reducers
- Isolated feature hooks
- Mockable database queries

## Usage Patterns

### Creating a New Feature Component

1. **Create feature hook** (`features/myfeature/hooks/useMyFeature.ts`)
```typescript
export function useMyFeature() {
  // Connect to Dexie for data
  const data = useLiveQuery(async () => await db.myTable.toArray());
  
  // Connect to Redux for UI state
  const isDirty = useAppSelector(selectIsDirty(id));
  
  // Return unified API
  return { data, isDirty, updateData, save };
}
```

2. **Create component** (`features/myfeature/components/MyComponent.tsx`)
```typescript
export const MyComponent = () => {
  const { data, isDirty, updateData } = useMyFeature();
  
  // Just use the hook - no manual state management
  return <div>{/* UI */}</div>;
};
```

### Adding New Redux State

1. **Create slice** (`stores/mySlice.ts`)
```typescript
const mySlice = createSlice({
  name: 'my',
  initialState,
  reducers: { /* actions */ }
});
```

2. **Add to store** (`stores/index.ts`)
```typescript
const rootReducer = combineReducers({
  spreadsheet: spreadsheetReducer,
  my: myReducer, // Add here
});
```

3. **Use in components**
```typescript
const value = useAppSelector(state => state.my.value);
dispatch(myAction(payload));
```

### Adding New Dexie Tables

1. **Update schema** (`lib/db.ts`)
```typescript
this.version(2).stores({
  // Existing tables...
  myNewTable: '++id, field1, field2',
});
```

2. **Add methods**
```typescript
async getMyData(id: number) {
  return await this.myNewTable.get(id);
}
```

3. **Use with useLiveQuery**
```typescript
const data = useLiveQuery(
  async () => await db.getMyData(id),
  [id]
);
```

## Migration Guide

### From Old Architecture to New

**Before (Old way):**
```typescript
// Multiple state managers
const [data, setData] = useState();
const [dirty, setDirty] = useState(false);
const [sessions, setSessions] = useState({});

// Manual updates
const handleChange = () => {
  setData(newData);
  setDirty(true);
  setSessions({ ...sessions, [id]: newSession });
};
```

**After (New way):**
```typescript
// Single hook with unified API
const { data, isDirty, updateData } = useExcelSheet({ ... });

// Automatic updates
const handleChange = async () => {
  await updateData(newData); // Automatically marks dirty
};
```

## Best Practices

### ✅ DO

- Use feature hooks for all data operations
- Keep components focused on UI only
- Use Redux for UI state, Dexie for data
- Use selectors for derived state
- Use `useCallback` for actions

### ❌ DON'T

- Don't mix Dexie and Redux responsibilities
- Don't store large data in Redux
- Don't mutate Redux state directly
- Don't use local state for shared data
- Don't create circular dependencies

## Troubleshooting

### Issue: Component not re-rendering after data change

**Solution:** Ensure you're using `useLiveQuery` for Dexie data:
```typescript
// ❌ Wrong - won't re-render
const cells = await db.getCellsForSheet(id);

// ✅ Correct - auto re-renders
const cells = useLiveQuery(
  async () => await db.getCellsForSheet(id),
  [id]
);
```

### Issue: Redux DevTools not showing actions

**Solution:** Ensure `devTools: true` in store configuration (already set in production mode check)

### Issue: State not persisting after refresh

**Solution:** Check redux-persist configuration and ensure slice is in whitelist

## Testing

### Testing Feature Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';

test('useExcelSheet marks dirty on update', async () => {
  const { result } = renderHook(
    () => useExcelSheet({ workbookId, sheetName, tabId }),
    { wrapper: Provider }
  );
  
  await result.current.updateCell({ row: 0, col: 0, value: 'test' });
  
  expect(result.current.isDirty).toBe(true);
});
```

### Testing Redux Slices

```typescript
import reducer, { markDirty } from './spreadsheetSlice';

test('markDirty sets dirty state', () => {
  const state = reducer(initialState, markDirty('tab1'));
  expect(state.dirtyMap['tab1']).toBe(true);
});
```

## Performance Considerations

### Dexie Optimization

- Use compound indices for common queries
- Use `where().equals()` instead of `filter()`
- Batch updates with `bulkUpsertCells()`
- Use transactions for multiple operations

### Redux Optimization

- Use memoized selectors with `reselect`
- Keep Redux state normalized
- Use `useCallback` for dispatch actions
- Split large slices into smaller ones

## Future Enhancements

- [ ] Add undo/redo with Redux
- [ ] Implement collaborative editing
- [ ] Add real-time sync with backend
- [ ] Optimize for large datasets (virtualization)
- [ ] Add offline conflict resolution
- [ ] Implement data migration utilities

## Resources

- [Dexie.js Documentation](https://dexie.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [redux-persist Documentation](https://github.com/rt2zz/redux-persist)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
