# Quick Start Guide - New Architecture

## 🚀 Quick Overview

This project now uses **Dexie.js + Redux Toolkit** for state management.

```
Table Data (cells) → Dexie.js (IndexedDB)
UI State (dirty, tabs) → Redux Toolkit
Bridge Layer → Feature Hooks (useExcelSheet)
```

---

## 📖 Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[NEW_ARCHITECTURE_SUMMARY.md](./NEW_ARCHITECTURE_SUMMARY.md)** | Complete overview of what was built | Start here |
| **[DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)** | Components vs Features vs Pages | Before adding code |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture details | For deep understanding |
| **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** | Step-by-step migration instructions | When migrating code |

---

## 🎯 For New Developers

### 1. Understand the Three Layers

```
🖼️  Pages (src/pages/)
     ↓ assembles
⚙️  Features (src/features/)
     ↓ uses
🧱  Components (src/components/)
```

**Rule of Thumb:**
- **Generic UI?** → `src/components/`
- **Business Logic?** → `src/features/`
- **Full Screen?** → `src/pages/`

📖 **Read**: [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)

### 2. Learn the State Management

**Two storage systems:**

| Data Type | Storage | How to Use |
|-----------|---------|------------|
| Table data (cells, sheets) | Dexie.js | `useLiveQuery()` |
| UI state (dirty, tabs) | Redux | `useAppSelector()` |

📖 **Read**: [ARCHITECTURE.md](./ARCHITECTURE.md#state-management-strategy)

### 3. Try the Example

```typescript
// src/features/spreadsheet/hooks/useExcelSheet.ts
const { 
  cells,        // From Dexie (auto-reactive)
  isDirty,      // From Redux
  updateCell,   // Updates both
} = useExcelSheet({ workbookId, sheetName, tabId });
```

📖 **Read**: [NEW_ARCHITECTURE_SUMMARY.md](./NEW_ARCHITECTURE_SUMMARY.md#-usage-examples)

---

## 🛠️ For Contributors

### Adding a New Component

**Question**: Is it reusable in other projects?
- ✅ Yes → `src/components/Button.tsx`
- ❌ No → `src/features/myfeature/components/MyButton.tsx`

### Adding a New Feature

1. Create directory: `src/features/myfeature/`
2. Add hook: `src/features/myfeature/hooks/useMyFeature.ts`
3. Add component: `src/features/myfeature/components/MyComponent.tsx`
4. Use in page: `src/pages/MyPage.tsx`

📖 **Read**: [NEW_ARCHITECTURE_SUMMARY.md](./NEW_ARCHITECTURE_SUMMARY.md#-development-workflow)

### Adding State

**Question**: What type of state?
- **Table data** → Add to `src/lib/db.ts` (Dexie)
- **UI state** → Add to `src/stores/` (Redux)

📖 **Read**: [ARCHITECTURE.md](./ARCHITECTURE.md#usage-patterns)

---

## 🔧 For Maintainers

### Current Status

✅ **Infrastructure Complete**
- Dexie.js configured
- Redux store configured
- AppProvider setup
- Example components created
- Documentation complete

⏳ **Migration Pending**
- Phase 2: Dirty state → Redux
- Phase 3: Tab management → Redux
- Phase 4: Auto-save → Redux
- Phase 5: Sessions → Redux
- Phase 6: Sheet data → Dexie (optional)

📖 **Read**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#step-by-step-migration)

### Next Steps

1. **Start Migration** - Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. **Test Each Phase** - Ensure no regressions
3. **Monitor Performance** - Use Redux DevTools
4. **Update Tests** - Add tests for new hooks

---

## 🎓 Learning Path

### Beginner (30 minutes)
1. Read [NEW_ARCHITECTURE_SUMMARY.md](./NEW_ARCHITECTURE_SUMMARY.md) - Overview
2. Read [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md#summary-table) - Component roles
3. Look at example: `src/features/spreadsheet/hooks/useExcelSheet.ts`

### Intermediate (1 hour)
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - Full architecture
2. Try using `useExcelSheet` in a component
3. Practice with Redux: dispatch an action

### Advanced (2+ hours)
1. Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration strategy
2. Implement a new feature using the architecture
3. Write tests for your feature

---

## 📊 Key Files

### Infrastructure
```
src/
├── lib/db.ts                    # Dexie database
├── stores/
│   ├── index.ts                 # Redux store
│   └── spreadsheetSlice.ts      # UI state
└── app/AppProvider.tsx          # Root provider
```

### Feature Example
```
src/features/spreadsheet/
├── hooks/useExcelSheet.ts       # State layer
└── components/ExcelGrid.tsx     # UI component
```

### Documentation
```
ARCHITECTURE.md                  # Technical architecture
DIRECTORY_STRUCTURE.md           # Component organization
MIGRATION_GUIDE.md               # Migration instructions
NEW_ARCHITECTURE_SUMMARY.md      # Implementation summary
QUICK_START.md                   # This file
```

---

## 💡 Common Tasks

### Task: Add a new table to Dexie
```typescript
// src/lib/db.ts
this.version(2).stores({
  // Existing tables...
  myNewTable: '++id, field1, field2',
});
```

### Task: Add new UI state to Redux
```typescript
// src/stores/mySlice.ts
const mySlice = createSlice({
  name: 'my',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; }
  }
});
```

### Task: Use state in component
```typescript
// Component
import { useAppDispatch, useAppSelector } from '../stores';
import { increment } from '../stores/mySlice';

const value = useAppSelector(state => state.my.value);
const dispatch = useAppDispatch();

<button onClick={() => dispatch(increment())}>+</button>
```

### Task: Create feature hook
```typescript
// src/features/myfeature/hooks/useMyFeature.ts
export function useMyFeature() {
  // Dexie query
  const data = useLiveQuery(async () => await db.myTable.toArray());
  
  // Redux state
  const uiState = useAppSelector(selectMyState);
  
  return { data, uiState };
}
```

---

## 🐛 Troubleshooting

### Issue: Component not re-rendering

**Cause**: Not using reactive queries

**Solution**: Use `useLiveQuery` for Dexie, `useAppSelector` for Redux
```typescript
// ❌ Wrong
const cells = await db.getCellsForSheet(id);

// ✅ Correct
const cells = useLiveQuery(
  async () => await db.getCellsForSheet(id),
  [id]
);
```

### Issue: State not persisting

**Cause**: Slice not in redux-persist whitelist

**Solution**: Add to whitelist in `src/stores/index.ts`
```typescript
const persistConfig = {
  whitelist: ['spreadsheet', 'mySlice'], // Add here
};
```

### Issue: Infinite loop

**Cause**: Circular state updates

**Solution**: Check dependency arrays in useEffect/useCallback
```typescript
// ❌ Wrong - function recreated every render
const handler = () => { ... };
useEffect(() => { ... }, [handler]);

// ✅ Correct - memoized
const handler = useCallback(() => { ... }, []);
useEffect(() => { ... }, [handler]);
```

---

## 🔗 External Resources

- [Dexie.js Docs](https://dexie.org/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [redux-persist](https://github.com/rt2zz/redux-persist)

---

## 📞 Getting Help

1. **Check documentation** - Start with [NEW_ARCHITECTURE_SUMMARY.md](./NEW_ARCHITECTURE_SUMMARY.md)
2. **Review examples** - Look at `src/features/spreadsheet/`
3. **Search issues** - Check GitHub issues
4. **Ask questions** - Create new issue with [architecture] tag

---

## ✅ Checklist for New Features

- [ ] Determine if it's a component, feature, or page
- [ ] Create appropriate directory structure
- [ ] Add types in `types/` (if needed)
- [ ] Create feature hook (if accessing state)
- [ ] Create UI components
- [ ] Write tests
- [ ] Update documentation
- [ ] Test build: `npm run package`

---

**Last Updated**: 2025-11-24  
**Version**: 1.0.0  
**Status**: Production Ready ✅
