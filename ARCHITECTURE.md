# Gridpark Architecture

## Overview

Gridpark uses a modern, optimized architecture with clear separation of concerns:

- **Redux**: UI state only (tabs, selection, preferences)
- **Dexie.js**: Data persistence (sheet cells, metadata)
- **File System**: Document storage (Excel files, manifest, code)

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  React Components                   │
│              (Bulletproof React Pattern)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌───────────────────┐  │
│  │  useWorkspace    │      │  useExcelSheet    │  │
│  │  State           │      │  (Dexie Hook)     │  │
│  │  (UI State)      │      │                   │  │
│  └────────┬─────────┘      └──────────┬────────┘  │
│           │                           │           │
├───────────┼───────────────────────────┼───────────┤
│           │                           │           │
│     ┌─────▼──────┐              ┌────▼────┐      │
│     │   Redux    │              │  Dexie  │      │
│     │  (UI Only) │              │  (Data) │      │
│     ├────────────┤              ├─────────┤      │
│     │ • Tabs     │              │ • Cells │      │
│     │ • Selection│              │ • Sheets│      │
│     │ • DirtyMap │              │ (Sparse)│      │
│     │ • AutoSave │              │         │      │
│     └────────────┘              └─────────┘      │
│          │                           │           │
│     localStorage              IndexedDB          │
│    (5-10 KB)                 (Efficient)         │
└─────────────────────────────────────────────────────┘
```

## Redux State

**Purpose**: UI state only (not data persistence)

```typescript
interface SpreadsheetState {
  // Workspace navigation
  workbookNodes: FileNode[];
  currentDirectoryName: string;
  selectedNodeId: string;
  
  // Open tabs
  openTabs: WorkbookTab[];
  activeTabId: string;
  
  // Dirty tracking
  dirtyMap: Record<string, boolean>;
  
  // UI preferences
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}
```

**Benefits**:
- Small state size (~5-10 KB)
- Fast serialization with redux-persist
- Clear UI-only purpose

## Dexie.js Database

**Purpose**: Persistent data storage with reactive queries

### Schema v2 (Optimized Sparse Matrix)

```typescript
// Sheet metadata
sheetMetadata: {
  id?: number;
  tabId: string;           // Primary key
  workbookId: string;
  sheetName: string;
  sheetIndex: number;
  maxRow: number;          // Highest row with data
  maxCol: number;          // Highest column with data
  cellCount: number;       // Total non-empty cells
  dirty: boolean;
}

// Cell data (sparse matrix)
cells: {
  id?: number;
  tabId: string;           // Tab identifier
  row: number;             // 0-based row index
  col: number;             // 0-based column index
  value: any;              // Cell value
  type: CellType;          // Cell type
  formula?: string;        // Formula if present
  style?: CellStyleData;   // Cell styling
  version: number;         // Version for undo/redo
}
```

**Indexes**:
- `[tabId+row+col]` - Unique compound index for O(1) cell lookup
- `tabId` - Fast sheet-level queries
- `[tabId+row]`, `[tabId+col]` - Efficient range queries

**Benefits**:
- 10-100x memory reduction (sparse storage)
- O(1) cell lookups
- Efficient range queries for viewport rendering
- Automatic persistence (survives page reload)
- Built-in for future undo/redo

## Hooks

### Core Hooks

#### `useExcelSheet({ tabId, workbookId, sheetName, sheetIndex })`

Direct Dexie access for sheet data with reactive queries.

```typescript
const sheet = useExcelSheet({ 
  tabId, 
  workbookId, 
  sheetName, 
  sheetIndex 
});

// Reactive data (auto-updates on DB changes)
const { 
  data,           // 2D array (ExcelViewer compatible)
  cells,          // Sparse array (DB format)
  cellMap,        // O(1) lookup map
  isDirty,        // Has unsaved changes
  updateCell,     // Update single cell
  updateCells,    // Batch update
  markSaved,      // Mark as saved
} = sheet;
```

#### `useWorkspaceState()`

Central state management hook (UI state only).

```typescript
const {
  // Workspace data
  workbookNodes,
  openTabs,
  activeTab,
  
  // Save manager
  saveManager,
  
  // Auto-save
  autoSave,
  
  // Actions
  handleTabChange,
  handleCloseTab,
  handleNodeSelect,
} = useWorkspaceState();
```

### File Operations

#### `useSaveWorkbook()`

Save workbook file (loads data from Dexie automatically).

```typescript
const { saveWorkbookFile } = useSaveWorkbook();
await saveWorkbookFile(excelFile); // Auto-loads from Dexie
```

#### `useManifestSessions()`

Manifest file operations (no caching, file system only).

#### `useCodeSessions()`

Code file operations (no caching, file system only).

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Redux State** | 5-10 KB | UI only |
| **Cell Lookup** | O(1) | Compound index |
| **Range Query** | O(log n) | Efficient |
| **Memory (10k cells)** | ~200 KB | Sparse matrix |
| **Persistence** | Automatic | IndexedDB + localStorage |

## Migration from Old Architecture

### Before (Mixed State)
```typescript
// ❌ Multiple state sources
const [sheetSessions, setSheetSessions] = useState({});  // Memory
const dirtyMap = useAppSelector(selectDirtyMap);         // Redux
// Dexie unused
```

### After (Clean Separation)
```typescript
// ✅ Clear separation
const sheet = useExcelSheet({ tabId, ... });  // Dexie (data)
const { dirtyMap } = useAppSelector(...);      // Redux (UI)
// No useState for data
```

## Best Practices

### 1. Use the Right Hook for the Job

- **Sheet data**: Use `useExcelSheet()` (not useState)
- **UI state**: Use Redux selectors
- **File I/O**: Use `useSaveWorkbook()`, `useManifestSessions()`, etc.

### 2. Don't Duplicate State

- Sheet data lives in Dexie (single source of truth)
- Don't copy to useState or Redux
- Use reactive queries for automatic updates

### 3. Leverage Sparse Matrix

- Only non-empty cells are stored
- Huge memory savings for sparse spreadsheets
- Efficient for large sheets with scattered data

### 4. Batch Updates

```typescript
// ❌ Don't do this
for (const update of updates) {
  await sheet.updateCell(update);
}

// ✅ Do this
await sheet.updateCells(updates);
```

## Future Enhancements

- [ ] Undo/redo using version field
- [ ] Collaborative editing with sync
- [ ] Viewport-based lazy loading
- [ ] Cell-level permissions
- [ ] Formula dependency graph

## Directory Structure

```
src/
├── stores/                    # Redux (UI state only)
│   ├── index.ts              # Store configuration
│   └── spreadsheetSlice.ts   # Main slice
├── lib/
│   ├── db.ts                 # Dexie database
│   └── migration.ts          # Migration utilities
├── features/
│   ├── spreadsheet/
│   │   └── hooks/
│   │       └── useExcelSheet.ts  # Dexie hook
│   └── workspace/
│       └── hooks/
│           ├── useWorkspaceState.ts
│           ├── useSaveManager.ts
│           └── useAutoSave.ts
└── renderer/
    └── hooks/
        ├── useFileSessions.ts    # File I/O
        └── useWorkspace.ts       # Workspace logic
```

## Key Principles

1. **Separation of Concerns**: UI state vs Data persistence
2. **Single Source of Truth**: No duplicate state
3. **Reactive Updates**: useLiveQuery for automatic re-renders
4. **Performance First**: Sparse matrix, O(1) lookups, batch updates
5. **Type Safety**: Full TypeScript coverage
6. **Bulletproof React**: Feature-based architecture

---

**Version**: 2.0 (Complete Dexie + Redux migration)  
**Last Updated**: 2024-11-24
