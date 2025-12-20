# VSCode-Inspired Design System for Gridpark

> **Design Philosophy**: Deep respect for Visual Studio Code's refined, productivity-focused UI design language.

## 🎨 Color Palette

### Dark Theme (Primary)

```typescript
const vscodeColors = {
  // Background Layers
  bg: {
    editor: '#1e1e1e',       // Main editor background
    elevated: '#252526',     // Panels, sidebars
    sidebar: '#2d2d30',      // Activity bar, status bar
    input: '#3c3c3c',        // Input fields
    dropdown: '#3c3c3c',     // Dropdowns
    surface: '#252526',      // Elevated surfaces
  },
  
  // Foreground Text
  fg: {
    primary: '#cccccc',      // Main text
    secondary: '#969696',    // Muted text
    disabled: '#6e6e6e',     // Disabled text
    link: '#3794ff',         // Links
    success: '#89d185',      // Success states
    warning: '#cca700',      // Warnings
    error: '#f48771',        // Errors
  },
  
  // Accent Colors
  accent: {
    primary: '#007acc',      // Primary actions
    hover: '#0e639c',        // Hover states
    active: '#094771',       // Active/pressed states
    focus: '#007acc',        // Focus indicators
  },
  
  // Borders & Dividers
  border: {
    default: '#454545',      // Standard borders
    focus: '#007acc',        // Focus borders
    active: '#0e639c',       // Active borders
    subtle: '#3e3e42',       // Subtle dividers
  },
  
  // Interactive States
  state: {
    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.1)',
    selected: 'rgba(14, 99, 156, 0.3)',
    focus: 'rgba(0, 122, 204, 0.4)',
  },
  
  // Editor Specific
  editor: {
    lineHighlight: '#2a2a2a',
    selection: '#264f78',
    findMatch: '#515c6a',
    wordHighlight: '#575757',
  },
  
  // Status Bar
  statusBar: {
    background: '#007acc',
    noFolder: '#68217a',
    debugging: '#cc6633',
  },
};
```

### Light Theme (Optional)

```typescript
const vscodeLightColors = {
  bg: {
    editor: '#ffffff',
    elevated: '#f3f3f3',
    sidebar: '#e7e7e7',
    input: '#ffffff',
    surface: '#f3f3f3',
  },
  fg: {
    primary: '#000000',
    secondary: '#6e6e6e',
    disabled: '#a6a6a6',
    link: '#006ab1',
  },
  accent: {
    primary: '#0066bf',
    hover: '#005ba1',
    active: '#004d8a',
  },
  border: {
    default: '#d0d0d0',
    focus: '#0066bf',
    subtle: '#e5e5e5',
  },
};
```

## 📐 Layout Structure

### Grid System

```
┌────┬─────────────────────────────────────────────────┐
│    │                  Title Bar                      │ 35px
├────┼─────────────────────────────────────────────────┤
│ A  │ S │              Editor Tabs                    │ 35px
│ c  │ i ├─────────────────────────────────────────────┤
│ t  │ d │                                             │
│ i  │ e │         Editor / Spreadsheet Area           │ flex:1
│ v  │ b │                                             │
│ i  │ a │                                             │
│ t  │ r │                                             │
│ y  │   │                                             │
│    │   ├─────────────────────────────────────────────┤
│ B  │   │              Panel Area                     │ 300px
│ a  │   │         (Terminal, Debug, etc.)             │ (resizable)
│ r  │   │                                             │
├────┴───┴─────────────────────────────────────────────┤
│              Status Bar                               │ 22px
└──────────────────────────────────────────────────────┘

Widths:
- Activity Bar: 48px (fixed)
- Sidebar: 250-400px (resizable, default 300px)
- Editor: flex: 1
- Panel: 200-600px (resizable, default 300px)
```

### Component Hierarchy

```
AppShell
├── TitleBar (custom window controls on Electron)
├── MainLayout
│   ├── ActivityBar (left: 48px)
│   ├── Sidebar (resizable: 250-400px)
│   │   ├── SidebarHeader
│   │   ├── SidebarContent
│   │   └── SidebarFooter
│   ├── EditorArea (flex: 1)
│   │   ├── EditorTabs
│   │   ├── EditorBreadcrumbs
│   │   ├── EditorContent (CodeEditor | SpreadsheetViewer)
│   │   └── PanelArea (resizable)
│   │       ├── PanelTabs
│   │       └── PanelContent
└── StatusBar (bottom: 22px)
```

## 🔤 Typography

### Font Stacks

```css
/* UI Text (Sans-serif) */
--font-family-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                  'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
                  'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Code/Monospace */
--font-family-mono: 'Cascadia Code', 'Fira Code', 'Consolas', 
                    'Courier New', monospace;

/* Excel/Spreadsheet (Windows Excel default) */
--font-family-excel: 'Calibri', 'Segoe UI', sans-serif;
```

### Font Sizes

```css
--font-size-xxs: 10px;   /* Status bar icons */
--font-size-xs:  11px;   /* Status bar text, breadcrumbs */
--font-size-sm:  12px;   /* Sidebar labels, tabs */
--font-size-md:  13px;   /* Main UI text, editor */
--font-size-lg:  14px;   /* Section headers */
--font-size-xl:  16px;   /* Dialog titles */
--font-size-xxl: 20px;   /* Welcome screen titles */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## 🎭 Component Patterns

### Activity Bar

```tsx
<ActivityBar>
  <ActivityButton icon="files" label="Explorer" active />
  <ActivityButton icon="search" label="Search" />
  <ActivityButton icon="extensions" label="Extensions" />
  <Spacer />
  <ActivityButton icon="settings" label="Settings" />
</ActivityBar>

// Styles:
// - Width: 48px fixed
// - Background: #2d2d30
// - Icons: 24x24px, centered
// - Active indicator: 2px left border, #007acc
// - Hover: rgba(255,255,255,0.05)
```

### Sidebar

```tsx
<Sidebar width={300} resizable>
  <SidebarHeader>
    <Title>EXPLORER</Title>
    <Actions>
      <IconButton icon="new-file" />
      <IconButton icon="new-folder" />
    </Actions>
  </SidebarHeader>
  <SidebarContent>
    <TreeView />
  </SidebarContent>
</Sidebar>

// Styles:
// - Background: #252526
// - Border-right: 1px solid #454545
// - Header height: 35px
// - Title: 11px, uppercase, #cccccc
```

### Editor Tabs

```tsx
<EditorTabs>
  <EditorTab label="workbook.xlsx" active modified />
  <EditorTab label="README.md" />
  <EditorTab label="script.js" closable />
</EditorTabs>

// Styles:
// - Height: 35px
// - Background: #2d2d30
// - Active tab: #1e1e1e
// - Modified indicator: white dot (6px)
// - Close button: only on hover
// - Font: 13px, --font-family-ui
```

### Status Bar

```tsx
<StatusBar>
  <StatusBarLeft>
    <StatusItem icon="branch" text="main" />
    <StatusItem icon="sync" text="0↓ 0↑" />
  </StatusBarLeft>
  <StatusBarRight>
    <StatusItem text="Ln 42, Col 16" />
    <StatusItem text="UTF-8" />
    <StatusItem text="JavaScript" />
  </StatusBarRight>
</StatusBar>

// Styles:
// - Height: 22px
// - Background: #007acc
// - Font: 11px
// - Items: 4px padding, hover darken 10%
```

### Context Menu

```tsx
<ContextMenu>
  <MenuItem icon="copy" label="Copy" keybinding="Ctrl+C" />
  <MenuItem icon="paste" label="Paste" keybinding="Ctrl+V" />
  <MenuDivider />
  <MenuItem icon="delete" label="Delete" danger />
</ContextMenu>

// Styles:
// - Background: #3c3c3c
// - Border: 1px solid #454545
// - Border-radius: 5px
// - Item height: 22px
// - Hover: rgba(255,255,255,0.05)
// - Keybinding: right-aligned, #969696
```

## 🎬 Animation & Transitions

```css
/* Standard transition duration */
--transition-fast: 100ms;
--transition-normal: 150ms;
--transition-slow: 250ms;

/* Easing functions */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);

/* Common patterns */
.hoverable {
  transition: background-color var(--transition-normal) var(--ease-in-out);
}

.focusable {
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: outline-color var(--transition-fast) var(--ease-out);
}

.focusable:focus-visible {
  outline-color: var(--accent-focus);
}
```

## 🔍 Interactive States

### Button States

```css
.button {
  background: transparent;
  border: 1px solid transparent;
  color: #cccccc;
}

.button:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #454545;
}

.button:active {
  background: rgba(255, 255, 255, 0.1);
  border-color: #007acc;
}

.button:focus-visible {
  outline: 2px solid #007acc;
  outline-offset: -2px;
}

.button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.button.primary {
  background: #007acc;
  color: #ffffff;
}

.button.primary:hover {
  background: #0e639c;
}
```

### List Item States

```css
.list-item {
  height: 22px;
  padding: 0 8px;
  cursor: pointer;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.list-item.selected {
  background: rgba(14, 99, 156, 0.3);
}

.list-item.focused {
  outline: 1px solid #007acc;
  outline-offset: -1px;
}

.list-item.selected.focused {
  background: rgba(0, 122, 204, 0.4);
}
```

## 📦 Icon System

### Codicons Integration

VSCodeは独自のアイコンフォント「Codicons」を使用。Gridparkでは以下を検討：

**Option 1**: Codicons直接利用
```bash
npm install @vscode/codicons
```

**Option 2**: Material Icons (現在利用中) のVSCode風スタイル適用
```tsx
import { Folder, InsertDriveFile, Settings } from '@mui/icons-material';

// Codicons風のスタイル
<Icon sx={{
  fontSize: '16px',
  color: '#cccccc',
  '&:hover': { color: '#ffffff' }
}} />
```

### Common Icons Mapping

| Feature | Codicon | Material Icon |
|---------|---------|---------------|
| File | `file` | `InsertDriveFile` |
| Folder | `folder` | `Folder` |
| Search | `search` | `Search` |
| Settings | `gear` | `Settings` |
| Save | `save` | `Save` |
| Undo | `discard` | `Undo` |
| Redo | `redo` | `Redo` |

## 🎯 Implementation Strategy

### Phase 1: Foundation (Week 1)
1. ✅ Create design system documentation (this file)
2. ⏳ Implement theme tokens in MUI Joy theme configuration
3. ⏳ Create base VSCode-style components:
   - `VSCodeButton`
   - `VSCodeInput`
   - `VSCodeSelect`
   - `VSCodeMenu`

### Phase 2: Layout (Week 2)
4. ⏳ Implement ActivityBar component
5. ⏳ Refactor Sidebar with VSCode styling
6. ⏳ Implement resizable panels
7. ⏳ Create StatusBar component

### Phase 3: Editor Integration (Week 3)
8. ⏳ VSCode-style tab system
9. ⏳ Breadcrumb navigation
10. ⏳ Panel area (terminal/debug equivalent)
11. ⏳ Command Palette (Ctrl+Shift+P)

### Phase 4: Polish (Week 4)
12. ⏳ Context menus
13. ⏳ Keyboard shortcuts
14. ⏳ Animation refinements
15. ⏳ Accessibility improvements

## 🔗 References

- [VSCode Source Code](https://github.com/microsoft/vscode)
- [VSCode Theme Colors](https://code.visualstudio.com/api/references/theme-color)
- [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
- [VSCode Design Principles](https://code.visualstudio.com/api/ux-guidelines/overview)

## 📝 Notes

- **Accessibility**: VSCode has excellent keyboard navigation - implement full keyboard support
- **Performance**: VSCode virtualizes large lists - use react-window for file trees
- **Customization**: Provide theme customization like VSCode settings.json
- **Platform Integration**: Native window controls on Electron (Windows/macOS specific)
