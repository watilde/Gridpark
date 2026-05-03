# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gridpark is an experimental Excel-compatible desktop spreadsheet built on **Electron + React + TypeScript**. It reads/writes `.xlsx` via ExcelJS, calculates formulas via HyperFormula in a Web Worker, and persists data in an in-memory store (not IndexedDB — see "Architecture caveats" below).

## Common commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Run desktop app (dev) | `npm start` (runs `electron-forge start`, which boots Vite + Electron) |
| Lint / fix | `npm run lint` / `npm run lint:fix` |
| Format check / write | `npm run format:check` / `npm run format` |
| Run all tests | `npm test` (Jest + ts-jest, jsdom env) |
| Run one test file | `npx jest path/to/file.test.tsx` |
| Run by name | `npx jest -t "partial test name"` |
| Watch tests | `npm run test:watch` |
| Coverage | `npm run test:coverage` (thresholds: 70% lines/branches/functions/statements) |
| Storybook | `npm run storybook` (port 6006) |
| Marketing site dev | `npm run docs:dev` (Vite, separate config under `src/site/`) |
| Package / make installers | `npm run package` / `npm run make` |

Test files live alongside sources as `*.test.ts(x)` or under `__tests__/`. Setup file: `src/test/setup.ts`. The `@mui/joy`, `@emotion`, and `@babel/runtime` packages are explicitly transformed by Jest — don't strip them from `transformIgnorePatterns` in `jest.config.js`.

## Architecture

The repo has two top-level frontend roots that often confuse first-time readers:

1. **`src/renderer/`** — the **active** Electron renderer (entry: `src/renderer/index.html` → `src/renderer/index.tsx` → `src/renderer/app/App.tsx`). Most UI work happens here.
2. **`src/site/`** — a separate Vite-built marketing/docs site (`npm run docs:*`). Independent `tsconfig.json` and `vite.config.ts`.

Plus `src/main/` (Electron main process + preload), `src/workers/` (formula worker), `src/stores/` (Redux), `src/lib/` (db + ExcelJS adapter), `src/renderer/i18n/` (in-house i18n provider + locales), and `src/app/AppProvider.tsx` (Redux + i18n + theme root).

### Renderer layout

```
src/renderer/components/   # Generic UI primitives (layout, sidebar, ui/Button, ui/Input ...)
src/renderer/features/     # Feature modules — each owns its components + hooks + utils
src/renderer/pages/        # Thin compositions of features (Home.tsx is the only page today)
src/renderer/hooks/        # Cross-feature hooks (useWorkspace, useFileSessions, ...)
```

Active feature modules: `file-explorer`, `formula-bar`, `spreadsheet-v2` (the canonical grid implementation), `toolbar`, `workspace`. When you need a generic UI element, put it in `src/renderer/components/`. When you need feature-specific UI/state, put it in `src/renderer/features/<feature>/`.

### State separation (important)

State is split across three layers — keep them separate:

- **`src/lib/db.ts` (`AppDatabase`)** — domain data: cells (sparse `Map<tabId:row:col, StoredCellData>`), sheet metadata, workbook metadata, conditional-formatting rules. Exposes a custom `subscribe()` event system with `tabId` / `type` filters; `_batch_` is a sentinel tabId that fans out to all listeners. Components should subscribe rather than poll.
- **`src/stores/spreadsheetSlice.ts`** — UI-only state: open tabs, active tab, workspace tree, formula-bar state, undo/redo flags, autosave prefs. Persisted via `redux-persist` to `localStorage`, but only `autoSaveEnabled` and `autoSaveInterval` are whitelisted — tabs/workspace/dirty are deliberately blacklisted (lost on restart).
- **File system** — Excel files themselves are read/written through Electron IPC in `src/main/index.ts` using ExcelJS.

**Dirty tracking lives in the database (`sheetMetadata.dirty`)**, not Redux. The `dirtyTabIds` array in Redux is a derived/synced view — don't write to it as the source of truth.

### Formula calculation

The active formula engine is `src/renderer/features/spreadsheet-v2/utils/FormulaEngine.ts` — a thin synchronous wrapper around HyperFormula that runs **on the main thread** and is consumed by `useSpreadsheet` (`src/renderer/features/spreadsheet-v2/hooks/`). `src/workers/formula.worker.ts` is a separate Web Worker variant that exists in the tree but is not currently mounted by the v2 spreadsheet path; treat it as a fallback / legacy path until removed.

### ExcelJS bridge

`src/lib/exceljs-adapter.ts` + `src/lib/exceljs-types.ts` translate between ExcelJS's value/style/type model and the app's `CellValue`/`CellType`/`CellStyleData` model. The `convertExcelJSType` ordering (formula first, then `ValueType.*`, then richText fallback) matters — a formula cell can have a numeric `cell.type`, so checking `cell.formula` first is intentional.

`EXCELJS_FEATURES.md` is the canonical reference for what ExcelJS can/can't do. **Charts, pivot tables, and VBA cannot be created** (only round-tripped). If a request implies one of these, surface the limitation early.

## Architecture caveats

These are real divergences from older docs — go by the code, not the docs:

- **`docs-md/DEVELOPER_GUIDE.md` says Dexie.js / IndexedDB.** That migration was reverted. The current `db` is **purely in-memory** (`Map`-based, no persistence across reloads). There is no `useLiveQuery` — use `db.subscribe()` instead. Treat the dev guide's data-layer examples as outdated.
- The grid implementation is `src/renderer/features/spreadsheet-v2/` (the V2 path). An older `workbook/` directory was removed during cleanup; if you find references to it in old commits or docs, they're stale.

## Code style and conventions

- TypeScript strictness is moderate: `@typescript-eslint/no-explicit-any` and `no-non-null-assertion` are **off**; unused vars must be prefixed `_`. Don't add `any` casually, but don't fight existing ones either.
- Prettier is enforced via ESLint (`prettier/prettier: error`). Run `npm run format` before committing.
- Path aliases (renderer only): `@/*` → `src/*`, `@components/*` → `src/renderer/components/*`, `@ui/*` → `src/renderer/components/ui/*`. Defined in `vite.renderer.config.ts`; not all tooling resolves them, so prefer relative imports in shared code.
- Use `useAppDispatch` / `useAppSelector` from `src/stores/index.ts` instead of plain `useDispatch` / `useSelector`.
- User-facing strings go through the `useT()` hook from `src/renderer/i18n/I18nProvider`. Add new keys to **both** `locales/en.ts` and `locales/ja.ts` (the `Record<TranslationKey, string>` typing in `ja.ts` will fail compilation if you forget). Use `{name}` placeholders for interpolation; the locale is detected from `navigator.language` on first load and persisted to `localStorage('gridpark.locale')`.

## Electron specifics

- Hardware acceleration is **disabled** in `src/main/index.ts` (`app.disableHardwareAcceleration()`, `--disable-gpu`) to avoid GPU sandbox errors. Don't re-enable without testing across Linux CI / WSL.
- `forge.config.ts` patches `MakerDMG.prototype.make` to clean up stale `/Volumes/Gridpark` mounts before building — needed for the GitHub Actions release workflow (`.github/workflows/ci-release.yml`). Don't remove that wrapper.
- WSL has known dialog-freeze issues (see README) — when reproducing file-dialog bugs, ask whether the user is on WSL before deep-diving.

## Reference docs in repo

- `docs-md/Gridpark_Spec_v2.0.md` — full product spec
- `docs-md/Gridpark_Selector_Spec.md` — selection/range model
- `docs-md/VSCODE_DESIGN_SYSTEM.md` — design system notes
- `EXCELJS_FEATURES.md` — ExcelJS capability matrix
- `prompt/` — CAPE multi-agent prompt framework (orthogonal to the codebase; only relevant if the user asks about it)
