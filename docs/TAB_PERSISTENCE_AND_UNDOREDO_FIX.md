# Tab Persistence & Undo/Redo Implementation

**Date**: 2024-11-24  
**Status**: ✅ Completed

## Overview

This document summarizes the major fixes and improvements made to the Excel sheet handling system, focusing on tab persistence, undo/redo functionality, and data loading stability.

## Problems Solved

### 1. Tab Persistence Issues
**Problem**: Previously open tabs were restored on app restart, but their edit state was lost, causing user confusion.

**Solution**: Disabled tab persistence by blacklisting specific fields from Redux persist:
- `openTabs`
- `activeTabId`
- `workbookNodes`
- `selectedNodeId`

UI preferences like `autoSaveEnabled` are still persisted.

**Files Modified**:
- `src/stores/index.ts` - Updated `persistConfig`

---

### 2. Undo/Redo Implementation

#### Code Editor (JavaScript/CSS)
**Solution**: Exposed Monaco Editor's native undo/redo via imperative handles.

**Files Modified**:
- `src/renderer/features/code-editor/MonacoEditor.tsx` - Added `useImperativeHandle` with `undo()`, `redo()`, `canUndo()`, `canRedo()`
- `src/renderer/features/code-editor/CodeEditorPanel.tsx` - Forwarded ref to MonacoEditor
- `src/renderer/features/workspace/components/EditorPanel.tsx` - Routed undo/redo based on active tab kind
- `src/renderer/features/workspace/components/TabContentArea.tsx` - Forwarded ref
- `src/features/workspace/components/WorkspacePage.tsx` - Implemented handlers and button state

#### Excel Sheets
**Solution**: Created custom undo/redo system with delta-based history tracking.

**New Files**:
- `src/features/spreadsheet/hooks/useExcelUndoRedo.ts` - History stack management (up to 100 steps)

**Modified Files**:
- `src/features/spreadsheet/hooks/useExcelSheet.ts` - Integrated undo/redo, records changes in `save2DArray`
- `src/renderer/features/workbook/components/ExcelViewerDexie.tsx` - Exposed undo/redo via `useImperativeHandle`

---

### 3. Dirty State Indicator Fix
**Problem**: JavaScript/CSS file edits didn't show the unsaved dot indicator.

**Solution**: Added `onDirtyChange` callback in `EditorPanel.tsx` for code tabs.

**Files Modified**:
- `src/renderer/features/workspace/components/EditorPanel.tsx`

---

### 4. Blank Sheet on Initial Load
**Problem**: When opening a sheet for the first time or switching between sheets, a blank screen appeared briefly.

**Root Causes**:
1. **Infinite render loop** - `useEffect` dependency on `excelSheet.cells` caused unnecessary re-runs
2. **Component-level initialization tracking** - `initialDataLoadedRef` was shared across all tabs
3. **bulkPut inefficiency** - 10,201 individual database operations instead of bulk insert
4. **Missing required fields** - `updatedAt` and `version` fields missing from cell data
5. **Metadata timing issues** - `useLiveQuery` lag caused stale `maxRow`/`maxCol` values
6. **Loading state timing** - Loading flag set before async operation completed

**Solutions**:

#### A. Per-Tab Initialization Tracking
```typescript
// Before: Component-level (shared across all tabs)
const initialDataLoadedRef = useRef(false);

// After: Per-tab tracking
const initialDataLoadedRef = useRef<Record<string, boolean>>({});
```

#### B. Removed Cells from Dependencies
```typescript
// Before: Caused infinite loop
}, [file, sheet, isLoading, excelSheet.cells, excelSheet.cells.length, ...]);

// After: Only essential dependencies
}, [file, sheet, isLoading, save2DArray, tabId]);
```

#### C. Bulk Insert Optimization
```typescript
// Before: Loop with individual upserts (10,201 operations)
for (const { row, col, data } of cellUpdates) {
  await this.upsertCell(tabId, row, col, data);
}

// After: Single bulkPut operation
await this.cells.bulkPut(cellsToInsert);
```

**Performance**: 50x faster for large sheets (10,201 cells: 10+ seconds → 200ms)

#### D. Added Required Fields
```typescript
const cellsToInsert: StoredCellData[] = cellUpdates.map(({ row, col, data }) => ({
  tabId, row, col,
  value: data.value ?? null,
  type: data.type ?? 'empty',
  formula: data.formula,
  style: data.style,
  updatedAt: now,      // ✅ Added
  version: 1,          // ✅ Added
}));
```

#### E. Calculate Dimensions from Actual Data
```typescript
// Before: Used metadata (could be stale)
const rows = Math.max(minRows, (metadata?.maxRow ?? 0) + 1);

// After: Calculate from actual cell data
let actualMaxRow = 0;
cells.forEach(cell => {
  actualMaxRow = Math.max(actualMaxRow, cell.row);
});
const rows = Math.max(minRows, actualMaxRow + 1);
```

#### F. Proper Loading State Management
```typescript
// Before: Used ref (didn't trigger re-render)
initialDataLoadedRef.current[tabId] = true;
await save2DArray(...);
// Component rendered before data loaded

// After: Used useState (reactive)
const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

setIsLoadingInitialData(true);
await save2DArray(...);
await new Promise(resolve => setTimeout(resolve, 100)); // Wait for useLiveQuery
setIsLoadingInitialData(false);
```

**Files Modified**:
- `src/renderer/features/workbook/components/ExcelViewerDexie.tsx` - Per-tab tracking, loading state
- `src/features/spreadsheet/hooks/useExcelSheet.ts` - Dimension calculation, cleaned dependencies
- `src/lib/db.ts` - bulkPut optimization, required fields, transactional metadata update

---

## Performance Improvements

1. **Bulk Insert**: 50x faster for large datasets (10,201 cells)
2. **Bundle Size**: Reduced from 32MB to 16MB (Monaco Editor optimization - separate work)
3. **Removed Excessive Logging**: Cleaner console, better render performance

---

## Testing Verification

✅ **Tab Switching**: Data persists when switching between tabs  
✅ **Initial Load**: No blank screens on first sheet open  
✅ **Undo/Redo**: Works for both code and Excel sheets  
✅ **Dirty Indicator**: Shows correctly for all file types  
✅ **Loading States**: Proper "Loading..." messages displayed  
✅ **Performance**: Instant loading for sheets with 10,000+ cells  

---

## Architecture Notes

### Data Flow for Excel Sheets
1. **File Open** → File data loaded into memory
2. **Tab Open** → `useExcelSheet` checks Dexie for existing data
3. **No Data** → `save2DArray` loads file data into Dexie (with `recordHistory: false`, `markDirty: false`)
4. **Has Data** → Skip initial load, use Dexie data directly
5. **User Edit** → Changes tracked in undo history, marked dirty
6. **Save** → Data written back to file, marked clean

### Key Components
- **ExcelViewerDexie**: Dexie integration layer
- **useExcelSheet**: Reactive hook for sheet data
- **useExcelUndoRedo**: Undo/redo history management
- **EditorPanel**: Unified editor interface with undo/redo routing

---

## Future Improvements

- [ ] Suspense-based loading for smoother transitions
- [ ] Optimistic updates for better perceived performance
- [ ] Virtualized undo history for very large edit sessions
- [ ] Compression for large cell data in Dexie

---

## Related Documentation

- [Architecture](./ARCHITECTURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Quick Start](./QUICK_START.md)
