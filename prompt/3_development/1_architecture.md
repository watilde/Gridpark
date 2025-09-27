# Architecture

## System North Star
Gridpark is a desktop-first Electron application that behaves like an "Excel superset" while retaining local-first control. The architecture must:
- Wrap the core experience in the Electron main process and expose a minimal, hardened preload bridge.
- Keep spreadsheet logic in a dedicated workbook engine that functions independently from UI concerns.
- Support hackable extensions through a sandboxed plugin runtime without compromising safety-by-design.
- Preserve deterministic behaviour (replayable commands, reproducible calculations) to reach ≥90% reproducibility.

## Process Architecture
- **Main Process (`src/index.ts`)**: Owns application lifecycle, window composition, native integrations, and secure IPC channel registration. No business logic.
- **Preload (`src/preload.ts`)**: Single source of truth for renderer-safe APIs. Expose explicit, typed capabilities (filesystem, analytics events, command dispatch) via `contextBridge`. Never enable `nodeIntegration` in renderers.
- **Renderer (`src/renderer.ts`)**: Hosts the interactive surface (grid, Monaco workbench, command palette). Treat as a pure client of the workbook engine and plugin APIs.

## Core Modules
1. **Workbook Engine**
   - Immutable worksheet state tree stored in memory with snapshot serialization to `.xlsx`.
   - Command-based mutations (`ApplyFormula`, `EditCell`, `RunPlugin`, `Undo`), batched for undo/redo.
   - Formula runtime executes in a dedicated worker; all calculations are pure functions fed by the command log.
2. **Calculation & Validation Workers**
   - Offload heavy computation and linting to Web Workers (or Electron `worker_threads`).
   - Workers communicate via structured cloning; no shared mutable state.
3. **Experience Layer**
   - React (or comparable declarative UI) hosts: grid surface, inspector panels, timeline view.
   - State management through a unidirectional data flow (Redux Toolkit or Zustand) sourced exclusively from workbook engine events.
4. **Plugin Sandbox**
   - Runs custom JavaScript in SES/isolated-vm with capability filtering.
   - Provide high-level APIs: `grid.getRange`, `grid.setRange`, `ui.openPanel` with rate limiting.
   - Plugin manifest defines permissions; validation occurs before activation.
5. **Persistence & Sync**
   - Local autosave to `.gridpark` bundle combining workbook snapshot + plugin metadata.
   - Export/import pipeline translates `.gridpark` ⇄ `.xlsx` using a converter micro-library.

## Data & Event Flow
1. Renderer emits intent (`dispatchCommand`) through preload.
2. Main process forwards to workbook engine service (Node context) or in-renderer engine worker.
3. Engine mutates state, appends to command log, and publishes a versioned event (`WorkbookUpdated vN`).
4. Renderer store reconciles events into UI state; components render from store selectors only.
5. Observability layer records command metadata (duration, errors) for retrospective metrics (ASS, SV, ST).

## Non-Functional Guardrails
- **Security**: Never bypass the preload layer; validate all payloads against Zod schemas. Disallow dynamic `eval` outside the sandbox.
- **Performance**: Target <16ms UI updates for grid edits. Use virtualization for row/column rendering and incremental diffing for large sheets.
- **Offline-First**: No hard network dependencies; any remote services (updates, templates) must fail gracefully with cached fallbacks.
- **Testing**: Provide deterministic seeds for command replay; unit-test formula engine, integration-test IPC contracts with Playwright/Electron.
- **Telemetry**: Log command IDs, execution time, and satisfaction metrics to local JSON under `prompt/3_development/log/` for observer ingestion.

## Evolution Roadmap
- **Phase 1 (MVP)**: Stabilize workbook engine, wire Monaco-based formula editor, implement undo/redo, and basic `.xlsx` import/export.
- **Phase 2 (Playful Productivity)**: Add timeline playback, celebratory animations, and safe plugin gallery with curated samples.
- **Phase 3 (Extensibility)**: Introduce collaborative ghost mode, advanced API surface (custom visualizations), and sandbox policy editor.

Respect these guardrails when proposing technical solutions; deviations require explicit rationale and traceability back to product principles.
