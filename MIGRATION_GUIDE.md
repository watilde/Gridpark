# Migration Guide: Old Architecture → New Architecture

## Overview

This guide helps you migrate from the old state management approach to the new Dexie.js + Redux Toolkit architecture.

## Summary of Changes

### What Changed

| Aspect | Old | New |
|--------|-----|-----|
| **Table Data** | React state | Dexie.js (IndexedDB) |
| **UI State** | Multiple useState hooks | Redux Toolkit |
| **Dirty Tracking** | Multiple sources (session.dirty, dirtyMap) | Single Redux dirtyMap |
| **Auto-save** | Manual state + useEffect | Redux state + debounced dispatch |
| **Data Updates** | Manual setState | useLiveQuery (automatic) |
| **Persistence** | localStorage (manual) | redux-persist + IndexedDB |

### Benefits

✅ **No More Infinite Loops** - One-way data flow enforced  
✅ **Single Source of Truth** - No state synchronization issues  
✅ **Automatic Re-renders** - useLiveQuery handles updates  
✅ **Better Performance** - IndexedDB for large datasets  
✅ **Debuggable** - Redux DevTools integration  
✅ **Type-safe** - Full TypeScript support  

## Step-by-Step Migration

### Phase 1: Setup (✅ COMPLETED)

- [x] Install dependencies (Dexie, RTK, redux-persist)
- [x] Create directory structure
- [x] Configure Dexie database (`lib/db.ts`)
- [x] Configure Redux store (`stores/index.ts`)
- [x] Create spreadsheet slice (`stores/spreadsheetSlice.ts`)
- [x] Create AppProvider (`app/AppProvider.tsx`)
- [x] Create useExcelSheet hook (`features/spreadsheet/hooks/useExcelSheet.ts`)
- [x] Test build (✅ successful)

### Phase 2: Migrate Dirty State (NEXT)

#### Current Implementation (Home.tsx)

```typescript
// Old: Multiple state managers
const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

const markDirty = useCallback((id: string) => {
  setDirtyMap(prev => prev[id] ? prev : { ...prev, [id]: true });
}, []);

const markClean = useCallback((id: string) => {
  setDirtyMap(prev => {
    if (!prev[id]) return prev;
    const next = { ...prev };
    delete next[id];
    return next;
  });
}, []);
```

#### New Implementation

```typescript
// New: Redux actions
import { useAppDispatch, useAppSelector } from '../../stores';
import { markDirty, markClean, selectDirtyTabs } from '../../stores/spreadsheetSlice';

const dispatch = useAppDispatch();
const dirtyTabs = useAppSelector(selectDirtyTabs);

// Usage
dispatch(markDirty(tabId));
dispatch(markClean(tabId));
```

#### Migration Steps

1. **Import Redux hooks**
   ```typescript
   import { useAppDispatch, useAppSelector } from '../../stores';
   import { markDirty, markClean, selectDirtyTabs } from '../../stores/spreadsheetSlice';
   ```

2. **Replace state with Redux**
   ```typescript
   // Remove: const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
   
   // Add:
   const dispatch = useAppDispatch();
   const dirtyMap = useAppSelector(selectDirtyMap);
   const dirtyTabs = useAppSelector(selectDirtyTabs);
   ```

3. **Replace local functions with dispatch**
   ```typescript
   // Remove: const markDirty = useCallback(...)
   // Remove: const markClean = useCallback(...)
   
   // Replace calls with:
   dispatch(markDirty(tabId));
   dispatch(markClean(tabId));
   ```

4. **Update save functions**
   ```typescript
   const saveSheet = useCallback(async (tabId: string) => {
     // ... save logic
     await saveWorkbookFile(updatedFile);
     dispatch(markClean(tabId)); // Changed
   }, [/* deps */, dispatch]);
   ```

### Phase 3: Migrate Tab Management (NEXT)

#### Current Implementation

```typescript
// In useWorkspace.ts
const [openTabs, setOpenTabs] = useState<WorkbookTab[]>([]);
const [activeTab, setActiveTab] = useState<WorkbookTab | null>(null);
```

#### New Implementation

```typescript
// Redux handles all tab state
import { 
  addTab, 
  removeTab, 
  setActiveTab,
  selectOpenTabs,
  selectActiveTab 
} from '../../stores/spreadsheetSlice';

const dispatch = useAppDispatch();
const openTabs = useAppSelector(selectOpenTabs);
const activeTab = useAppSelector(selectActiveTab);

// Usage
dispatch(addTab({ id, kind, workbookId, label }));
dispatch(removeTab(tabId));
dispatch(setActiveTab(tabId));
```

### Phase 4: Migrate Auto-save (NEXT)

#### Current Implementation

```typescript
const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

useEffect(() => {
  if (!autoSaveEnabled || dirtyIds.length === 0) return;
  
  const timer = setTimeout(() => {
    saveAll();
  }, 2000);
  
  return () => clearTimeout(timer);
}, [autoSaveEnabled, dirtyIds, saveAll]);
```

#### New Implementation

```typescript
import { 
  setAutoSaveEnabled, 
  selectAutoSaveEnabled,
  selectAutoSaveInterval 
} from '../../stores/spreadsheetSlice';

const dispatch = useAppDispatch();
const autoSaveEnabled = useAppSelector(selectAutoSaveEnabled);
const autoSaveInterval = useAppSelector(selectAutoSaveInterval);

// Toggle auto-save
dispatch(setAutoSaveEnabled(!autoSaveEnabled));

// Use same useEffect with Redux values
useEffect(() => {
  if (!autoSaveEnabled || dirtyIds.length === 0) return;
  
  const timer = setTimeout(() => {
    saveAll();
  }, autoSaveInterval);
  
  return () => clearTimeout(timer);
}, [autoSaveEnabled, dirtyIds, saveAll, autoSaveInterval]);
```

### Phase 5: Migrate Sheet Data to Dexie (LATER)

This phase is optional and can be done gradually. Current file-based storage can remain.

#### When to migrate to Dexie

- When dealing with large spreadsheets (>10k cells)
- When implementing undo/redo
- When adding real-time collaboration
- When needing offline support

#### Example Migration

```typescript
// Old: Load from file
const loadSheet = async (filePath: string) => {
  const data = await readFile(filePath);
  setSheetData(data);
};

// New: Load from Dexie
const { cells, updateCell } = useExcelSheet({ 
  workbookId, 
  sheetName, 
  tabId 
});

// cells automatically updates via useLiveQuery
```

## File-by-File Migration Checklist

### High Priority (Do First)

- [ ] `src/renderer/pages/Home.tsx`
  - [ ] Replace dirtyMap state with Redux
  - [ ] Replace markDirty/markClean with dispatch
  - [ ] Replace autoSaveEnabled state with Redux
  - [ ] Update save functions to use Redux
  
- [ ] `src/renderer/hooks/useWorkspace.ts`
  - [ ] Replace openTabs state with Redux
  - [ ] Replace activeTab state with Redux
  - [ ] Update tab operations to dispatch actions

- [ ] `src/renderer/hooks/useFileSessions.ts`
  - [ ] Move session state to Redux
  - [ ] Remove sheetDirtyMap (now in Redux)
  - [ ] Update handlers to dispatch Redux actions

### Medium Priority

- [ ] `src/renderer/components/Header.tsx`
  - [ ] Replace AutoSave toggle state with Redux
  - [ ] Use Redux selectors for dirty state
  
- [ ] `src/renderer/features/workbook/components/FileTree.tsx`
  - [ ] Use Redux selectors for dirty indicators
  
- [ ] `src/renderer/features/workbook/components/TabList.tsx`
  - [ ] Use Redux selectors for tab state
  - [ ] Use Redux actions for tab operations

### Low Priority (Optional)

- [ ] Migrate sheet data to Dexie (when needed for performance)
- [ ] Add undo/redo using Redux
- [ ] Implement real-time collaboration

## Testing Strategy

### 1. Unit Tests

```typescript
// Test Redux reducers
import reducer, { markDirty, markClean } from './spreadsheetSlice';

describe('spreadsheetSlice', () => {
  it('marks tab as dirty', () => {
    const state = reducer(initialState, markDirty('tab1'));
    expect(state.dirtyMap['tab1']).toBe(true);
  });
  
  it('cleans dirty tab', () => {
    const dirtyState = { ...initialState, dirtyMap: { tab1: true } };
    const state = reducer(dirtyState, markClean('tab1'));
    expect(state.dirtyMap['tab1']).toBeUndefined();
  });
});
```

### 2. Integration Tests

```typescript
// Test feature hooks
import { renderHook } from '@testing-library/react';
import { useExcelSheet } from './useExcelSheet';

describe('useExcelSheet', () => {
  it('marks dirty after cell update', async () => {
    const { result } = renderHook(() => 
      useExcelSheet({ workbookId: 'wb1', sheetName: 'Sheet1', tabId: 'tab1' })
    );
    
    await result.current.updateCell({ row: 0, col: 0, value: 'test' });
    
    expect(result.current.isDirty).toBe(true);
  });
});
```

### 3. Manual Testing Checklist

- [ ] Open a workbook
- [ ] Edit a cell
- [ ] Verify dirty indicator appears
- [ ] Save the file
- [ ] Verify dirty indicator disappears
- [ ] Enable auto-save
- [ ] Edit a cell
- [ ] Wait 2 seconds
- [ ] Verify auto-save occurs
- [ ] Close and reopen app
- [ ] Verify state is restored (redux-persist)

## Common Patterns

### Pattern 1: Reading State

```typescript
// Old
const [value, setValue] = useState(initialValue);

// New
const value = useAppSelector(selectValue);
```

### Pattern 2: Updating State

```typescript
// Old
setValue(newValue);

// New
dispatch(updateValue(newValue));
```

### Pattern 3: Computed Values

```typescript
// Old
const derived = useMemo(() => compute(value), [value]);

// New - Create selector
export const selectDerived = (state: RootState) => 
  compute(state.slice.value);

// In component
const derived = useAppSelector(selectDerived);
```

### Pattern 4: Async Operations

```typescript
// Old
const handleSave = async () => {
  await saveToFile();
  setDirty(false);
};

// New
const handleSave = async () => {
  await saveToFile();
  dispatch(markClean(tabId));
};
```

## Rollback Plan

If issues occur during migration:

1. **Git Branching**
   ```bash
   git checkout -b migration/redux-dexie
   # Make changes
   # If issues: git checkout main
   ```

2. **Feature Flags**
   ```typescript
   const USE_NEW_ARCHITECTURE = process.env.REACT_APP_USE_NEW_ARCH === 'true';
   
   if (USE_NEW_ARCHITECTURE) {
     // New code
   } else {
     // Old code
   }
   ```

3. **Gradual Migration**
   - Migrate one feature at a time
   - Keep old code alongside new code
   - Remove old code only after validation

## Performance Monitoring

### Before Migration
```typescript
console.time('render');
// component render
console.timeEnd('render');
```

### After Migration
```typescript
// Use Redux DevTools
// Check action timeline
// Monitor re-render frequency
```

## Troubleshooting

### Issue: "Cannot find module 'dexie'"

**Solution:** Ensure dependencies are installed
```bash
npm install dexie dexie-react-hooks
```

### Issue: Redux DevTools not working

**Solution:** Check browser extension and store config
```typescript
// stores/index.ts
devTools: process.env.NODE_ENV !== 'production'
```

### Issue: State not persisting

**Solution:** Check redux-persist whitelist
```typescript
// stores/index.ts
whitelist: ['spreadsheet']
```

### Issue: useLiveQuery not updating

**Solution:** Ensure dependencies array is correct
```typescript
const cells = useLiveQuery(
  async () => await db.getCellsForSheet(sheetId),
  [sheetId] // Must include sheetId
);
```

## Next Steps

1. **Start with Phase 2** - Migrate dirty state management
2. **Test thoroughly** after each phase
3. **Monitor performance** using Redux DevTools
4. **Document any issues** encountered
5. **Gradually migrate remaining features**

## Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full architecture documentation
- [Dexie.js Docs](https://dexie.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [redux-persist Docs](https://github.com/rt2zz/redux-persist)

## Questions?

If you encounter issues during migration:

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for patterns
2. Review [Dexie.js examples](https://dexie.org/docs/Tutorial/React)
3. Check [RTK examples](https://redux-toolkit.js.org/tutorials/quick-start)
4. Look at existing implementations in `src/features/spreadsheet/`

---

**Status**: Infrastructure complete ✅ | Ready for migration 🚀
