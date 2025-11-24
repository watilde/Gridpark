# Directory Structure & Component Roles

## Overview

This document defines the clear separation of concerns between `components`, `features`, and `pages` directories.

## The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    src/pages/                               │
│              (The Showroom / Canvas)                        │
│         Composition & Layout - No Business Logic           │
└────────────────────┬────────────────────────────────────────┘
                     │ assembles
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   src/features/                             │
│                   (The Engine)                              │
│         Business Logic & Domain-Specific UI                 │
│   Connected to Redux, Dexie, APIs - Feature Complete       │
└────────────────────┬────────────────────────────────────────┘
                     │ uses
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  src/components/                            │
│                  (The Lego Bricks)                          │
│         Pure UI Components - Domain Agnostic                │
│        Props Only - No State - Highly Reusable              │
└─────────────────────────────────────────────────────────────┘
```

## 1. src/components/ - The Building Blocks

### Role
**Universal UI Library** - "Dumb" Components

### Characteristics
- ✅ **Reusable**: Can be used anywhere (even in other projects)
- ✅ **Stateless**: No internal state management
- ✅ **Logic-free**: No Redux, Dexie, or API calls
- ✅ **Domain Agnostic**: No business terms like "Excel", "Spreadsheet", "User"
- ✅ **Props-driven**: All data comes from props
- ✅ **Presentational**: Only concerned with how things look

### What Goes Here
- Button, Input, Select, Checkbox
- Modal, Dialog, Drawer
- Card, Panel, Box
- Tooltip, Popover
- Badge, Chip, Tag
- Skeleton, Spinner, Progress
- Table (generic), List (generic)
- Typography helpers
- Layout components (Grid, Stack, Flex)

### What Does NOT Go Here
- ❌ Business logic
- ❌ API calls
- ❌ Database queries
- ❌ Redux connections
- ❌ Domain-specific components
- ❌ Feature-specific styling

### Example Structure
```
src/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── Button.stories.tsx
├── Input/
│   ├── Input.tsx
│   ├── Input.test.tsx
│   └── Input.stories.tsx
├── Modal/
│   ├── Modal.tsx
│   ├── Modal.test.tsx
│   └── Modal.stories.tsx
└── index.ts  # Export all components
```

### Example Component
```typescript
// ✅ GOOD - Pure, reusable, domain-agnostic
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  disabled,
  onClick 
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

```typescript
// ❌ BAD - Domain-specific, connected to state
export const SaveButton = () => {
  const dispatch = useAppDispatch(); // ❌ No Redux here
  const isDirty = useAppSelector(selectIsDirty); // ❌ No selectors here
  
  const handleSave = async () => {
    await saveWorkbook(); // ❌ No business logic here
  };
  
  return <button onClick={handleSave}>Save</button>;
};
```

---

## 2. src/features/ - The Engine

### Role
**Domain-Specific Functionality** - "Smart" Components

### Characteristics
- ✅ **Self-Contained**: Everything for this feature in one place
- ✅ **Connected**: Can access Redux, Dexie, APIs
- ✅ **Domain-Specific**: Uses business terminology
- ✅ **Feature Complete**: Has its own components, hooks, utils, types
- ✅ **State-Aware**: Manages and reads application state
- ✅ **Business Logic**: Contains the "how" of your app

### What Goes Here
- Feature-specific UI components
- State layer hooks (connecting Dexie + Redux)
- Business logic utilities
- Feature-specific types
- API integration for this feature
- Feature-specific constants

### What Does NOT Go Here
- ❌ Generic reusable components (those go in `src/components/`)
- ❌ Page layout/composition (that goes in `src/pages/`)
- ❌ Global utilities (those go in `src/utils/`)

### Example Structure
```
src/features/
└── spreadsheet/
    ├── components/          # Feature-specific UI
    │   ├── ExcelGrid.tsx    # Main grid component
    │   ├── CellEditor.tsx   # Cell editing UI
    │   ├── FormulaBar.tsx   # Formula input bar
    │   └── ColumnHeader.tsx # Column header UI
    ├── hooks/               # ★ STATE LAYER
    │   ├── useExcelSheet.ts # Connects Dexie + Redux
    │   ├── useFormula.ts    # Formula evaluation logic
    │   └── useCellSelection.ts
    ├── utils/               # Feature-specific utilities
    │   ├── cellFormatters.ts
    │   ├── formulaParser.ts
    │   └── excelHelpers.ts
    ├── types/               # Feature-specific types
    │   └── excel.types.ts
    └── constants/
        └── defaultStyles.ts
```

### Example Feature Component
```typescript
// ✅ GOOD - Feature component using both generic components and state
import { Button } from '../../components/Button';
import { useExcelSheet } from '../hooks/useExcelSheet';
import { useAppDispatch, useAppSelector } from '../../stores';

export const ExcelGrid: React.FC<ExcelGridProps> = ({ 
  workbookId, 
  sheetName, 
  tabId 
}) => {
  // ✅ Can access state layer
  const { cells, isDirty, updateCell } = useExcelSheet({ 
    workbookId, 
    sheetName, 
    tabId 
  });
  
  // ✅ Can access Redux
  const dispatch = useAppDispatch();
  
  // ✅ Business logic
  const handleCellEdit = async (row: number, col: number, value: string) => {
    await updateCell({ row, col, value });
  };
  
  return (
    <div className="excel-grid">
      {/* Feature-specific UI */}
      <FormulaBar />
      
      {/* Uses generic components from src/components */}
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
      
      {/* Renders cells */}
      {cells.map(cell => (
        <CellEditor key={cell.id} cell={cell} onEdit={handleCellEdit} />
      ))}
    </div>
  );
};
```

### Feature Hook Example (State Layer)
```typescript
// ✅ GOOD - Connects Dexie and Redux in clean API
export function useExcelSheet({ workbookId, sheetName, tabId }) {
  const dispatch = useAppDispatch();
  const isDirty = useAppSelector(selectIsDirty(tabId));
  
  // Dexie reactive query
  const cells = useLiveQuery(
    async () => await db.getCellsForSheet(sheetId),
    [sheetId]
  );
  
  // Business logic
  const updateCell = async (update: CellUpdate) => {
    await db.upsertCell(sheetId, update.row, update.col, update);
    dispatch(markDirty(tabId));
  };
  
  return { cells, isDirty, updateCell };
}
```

---

## 3. src/pages/ - The Showroom

### Role
**View Container / Screen Assembly** - The Canvas

### Characteristics
- ✅ **Composition Only**: Assembles features into screens
- ✅ **Layout**: Handles page structure (header, sidebar, main)
- ✅ **Minimal Logic**: Only UI state (like "which view to show")
- ✅ **Screen-Specific**: Each page is a unique view
- ✅ **No Data Access**: Does not directly call Redux/Dexie (features do that)
- ✅ **Orchestration**: Decides what features to show and where

### What Goes Here
- Page-level layouts
- Feature composition
- Screen-specific routing logic (if using router)
- View state management (which modal is open, which tab is active)

### What Does NOT Go Here
- ❌ Business logic (that goes in `src/features/`)
- ❌ Generic components (those go in `src/components/`)
- ❌ Direct database access
- ❌ Direct API calls
- ❌ Complex state management

### Example Structure
```
src/pages/
├── Home.tsx              # Main spreadsheet screen
├── Settings.tsx          # Settings screen
├── WelcomePage.tsx       # Initial welcome screen
└── NotFound.tsx          # Error page
```

### Example Page Component
```typescript
// ✅ GOOD - Pure composition and layout
import { Header } from '../features/header/components/Header';
import { FileTree } from '../features/workbook/components/FileTree';
import { TabList } from '../features/workbook/components/TabList';
import { ExcelGrid } from '../features/spreadsheet/components/ExcelGrid';
import { useAppSelector } from '../stores';
import { selectActiveTab } from '../stores/spreadsheetSlice';

export const Home: React.FC = () => {
  // ✅ Minimal state - only for layout decisions
  const activeTab = useAppSelector(selectActiveTab);
  
  return (
    <div className="home-layout">
      {/* Header */}
      <header>
        <Header />
      </header>
      
      {/* Layout */}
      <div className="main-content">
        {/* Sidebar */}
        <aside>
          <FileTree />
        </aside>
        
        {/* Main Area */}
        <main>
          <TabList />
          
          {/* Conditional rendering based on tab */}
          {activeTab?.kind === 'sheet' && (
            <ExcelGrid 
              workbookId={activeTab.workbookId}
              sheetName={activeTab.sheetName}
              tabId={activeTab.id}
            />
          )}
          
          {activeTab?.kind === 'manifest' && (
            <ManifestEditor tabId={activeTab.id} />
          )}
        </main>
      </div>
    </div>
  );
};
```

```typescript
// ❌ BAD - Too much business logic in page
export const Home = () => {
  // ❌ Page should not manage complex state
  const [cells, setCells] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  
  // ❌ Page should not have business logic
  const updateCell = async (row, col, value) => {
    await db.upsertCell(sheetId, row, col, { value });
    setIsDirty(true);
  };
  
  // ❌ Page should not directly query database
  useEffect(() => {
    db.getCellsForSheet(sheetId).then(setCells);
  }, [sheetId]);
  
  return <div>{/* ... */}</div>;
};
```

---

## Summary Table

| Directory | Analogy | Data Access | Reusability | Example |
|-----------|---------|-------------|-------------|---------|
| **components** | Lego Bricks | ❌ No (Props only) | ✅ High (Generic) | Button, Input, Modal |
| **features** | The Engine | ✅ Yes (Redux/DB) | ⚠️ Low (Specific to app) | ExcelGrid, useExcelSheet |
| **pages** | The Showroom | ❌ No (Layout only) | ❌ None (Specific to screen) | Home, Settings |

---

## Decision Tree: Where Does This Component Go?

### Start Here ↓

**Question 1: Is it generic and reusable in ANY project?**
- ✅ Yes → `src/components/`
- ❌ No → Continue to Question 2

**Question 2: Does it contain business logic or connect to state?**
- ✅ Yes → `src/features/`
- ❌ No → Continue to Question 3

**Question 3: Is it composing multiple features into a screen?**
- ✅ Yes → `src/pages/`
- ❌ No → Reconsider Question 1

### Examples

**"I need a Save Button"**
- Generic button? → `src/components/Button.tsx`
- Button with save logic? → `src/features/spreadsheet/components/SaveButton.tsx`

**"I need a Cell Editor"**
- Is it Excel-specific? → Yes → `src/features/spreadsheet/components/CellEditor.tsx`

**"I need a Modal"**
- Generic modal? → `src/components/Modal.tsx`
- Modal with specific form logic? → `src/features/settings/components/SettingsModal.tsx`

**"I need a Home Screen"**
- Screen that assembles features? → `src/pages/Home.tsx`

---

## Anti-Patterns to Avoid

### ❌ Don't: Put business logic in components
```typescript
// src/components/Button.tsx - ❌ BAD
export const Button = () => {
  const dispatch = useAppDispatch(); // ❌ No Redux in generic components
  return <button onClick={() => dispatch(saveFile())}>Save</button>;
};
```

### ❌ Don't: Put generic components in features
```typescript
// src/features/spreadsheet/components/Button.tsx - ❌ BAD
// This is just a generic button, it belongs in src/components/
export const Button = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

### ❌ Don't: Put feature logic in pages
```typescript
// src/pages/Home.tsx - ❌ BAD
export const Home = () => {
  const [cells, setCells] = useState([]); // ❌ Feature state
  
  const updateCell = async () => { // ❌ Business logic
    await db.upsertCell(...);
  };
  
  return <div>{/* ... */}</div>;
};
```

### ❌ Don't: Duplicate components across features
```typescript
// ❌ BAD - If multiple features use it, move to src/components/
src/features/spreadsheet/components/Button.tsx
src/features/settings/components/Button.tsx  // Duplicate!
```

---

## Migration Checklist

When refactoring existing code:

- [ ] **Identify generic components** → Move to `src/components/`
- [ ] **Identify business logic** → Move to `src/features/`
- [ ] **Simplify pages** → Remove logic, keep only composition
- [ ] **Create feature hooks** → Bridge Dexie + Redux in `features/*/hooks/`
- [ ] **Remove duplicate code** → Extract shared components
- [ ] **Test each layer independently** → Unit test components, integration test features

---

## Best Practices

### Components
- Keep them small and focused
- Use TypeScript interfaces for props
- Write Storybook stories for each component
- Test with React Testing Library

### Features
- One feature = one business domain
- Use barrel exports (`index.ts`) to expose public API
- Keep internal implementation details private
- Write integration tests

### Pages
- Keep them thin (< 100 lines)
- Only orchestrate features
- Use layout components from `src/components/`
- Minimal or no state management

---

## Real-World Example

### Before (Anti-pattern)
```
src/
├── components/
│   ├── ExcelGrid.tsx        # ❌ Too specific, has business logic
│   ├── SaveButton.tsx       # ❌ Business logic in generic component
│   └── Modal.tsx            # ✅ This is fine
└── pages/
    └── Home.tsx             # ❌ 500 lines, all logic here
```

### After (Correct pattern)
```
src/
├── components/              # Pure, reusable
│   ├── Button/
│   └── Modal/
├── features/                # Business logic
│   └── spreadsheet/
│       ├── components/
│       │   ├── ExcelGrid.tsx
│       │   └── SaveButton.tsx
│       └── hooks/
│           └── useExcelSheet.ts
└── pages/                   # Composition only
    └── Home.tsx             # 50 lines, clean layout
```

---

## Conclusion

This three-layer architecture provides:

✅ **Clear separation of concerns**  
✅ **Easy to test** (each layer independently)  
✅ **Scalable** (add features without affecting others)  
✅ **Maintainable** (easy to find and modify code)  
✅ **Reusable** (components can be shared or even extracted)  

When in doubt, ask: **"Could this be used in a completely different app?"**
- Yes → `src/components/`
- No → `src/features/`
- It's a full screen → `src/pages/`
