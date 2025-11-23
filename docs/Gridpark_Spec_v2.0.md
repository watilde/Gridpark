# Gridpark Technical Specification v2.0

## 1. Introduction

Gridpark is an innovative desktop-first Electron application designed to transform traditional spreadsheet interactions into a dynamic and creative experimentation environment. By positioning itself as "Excel's creative superset," Gridpark aims to redesign the relationship between people and numbers, fostering creativity and joy in data manipulation rather than mere efficiency. It combines the familiarity of Excel functionality with modern web development paradigms, enabling users—especially Creative Technologists and Developers—to hack, customize, and extend their data workflows within a safe and protected environment.

### 1.1 Mission, Vision, Values

*   **Mission**: "Transform spreadsheets into playgrounds" – Gridpark seeks to evolve data manipulation from routine tasks into creative experimentation, making spreadsheets a medium for play and discovery within secure boundaries.
*   **Vision**: "Redesign the relationship between people and numbers" – Envisioning a world where data interaction sparks creativity and joy, where spreadsheets become canvases for expression, and experimentation is natural.
*   **Values**:
    *   **Safety by Design**: Powerful tools are safe by default, allowing free experimentation without risk.
    *   **Playful Productivity**: Data exploration is engaging, experimental, fun, and genuinely useful.
    *   **Creative Expression**: Tools amplify personal creativity within predictable boundaries.
    *   **Hackable Within Limits**: Customizable and extensible within a protected environment, allowing tools to adapt to user will.
    *   **Reasonably compatible with Excel**: Innovation builds on existing knowledge, providing reasonable compatibility with Excel.
    *   **Local-First Control**: Desktop-first experience ensures offline functionality and complete user data control.

### 1.2 Product Positioning

Gridpark is positioned as "Excel's creative superset – like TypeScript for JavaScript." It offers all core Excel functionality alongside enhanced capabilities:
*   Perfect Excel file compatibility (.xlsx).
*   Enhanced JavaScript syntax within a protected environment.
*   Modern development tools (Monaco Editor, debugging).
*   Controlled API access with rate limiting.
*   CSS styling and visual customization.
*   A robust plugin system leveraging Custom Functions.

## 2. Target Audience & Personas

Gridpark is designed for a specific set of users who value both the structure of spreadsheets and the power of modern development. The primary target audience is "Creative Technologists," encompassing developers, designers, and analysts who seek a controlled environment for data experimentation.

### 2.1 Developer Persona

*   **Mindset**: Code-first approach to problem-solving. Prefers keyboard shortcuts, command palettes, and dark mode.
*   **Tools**: VS Code, Terminal, Git, Chrome DevTools, JavaScript, TypeScript, Python, SQL.
*   **Pain Points**: Finds traditional Excel foreign to their development environment, lacks version control for data analysis, struggles to integrate APIs directly, formula syntax is unfamiliar, and sharing complex calculations is cumbersome.
*   **Core Needs**: Seamless API integration, code reusability, real-time collaboration, customizability with JavaScript, and performance monitoring.
*   **Success Scenarios**: Building real-time API monitoring dashboards, prototyping algorithms with live data, creating interactive reports, experimenting with data transformations, and sharing executable analysis documentation.

### 2.2 Designer Persona

*   **Mindset**: Visual-first, user experience focused. Values visual feedback, interactive prototypes, and collaborative design.
*   **Tools**: Figma, Sketch, prototyping tools, browser inspector, CSS, basic JavaScript.
*   **Pain Points**: Spreadsheets are visually unappealing for presentations, difficult to create interactive design systems or data-driven interface concepts, and static charts fail to communicate dynamic user flows.
*   **Core Needs**: Visual customization (CSS), interactive prototypes, design system integration, beautiful client presentations, and creative visualization of user research data.
*   **Success Scenarios**: Creating interactive design system documentation, building stunning client dashboards, prototyping data-driven UIs, visualizing research findings, and collaborating with developers on data visualization.

### 2.3 Product Owner Persona

*   **Mindset**: Business value and user impact focused. Metrics-driven decisions and cross-functional collaboration.
*   **Tools**: Analytics platforms, project management tools, presentation software.
*   **Pain Points**: Cannot create interactive executive reports, struggles to combine multiple data sources, dashboards are static, updates are time-consuming, and sharing complex analysis is difficult.
*   **Core Needs**: Executive dashboards with drill-down capabilities, interactive reports for stakeholders, multi-source data integration, automated reporting, and collaborative analysis.
*   **Success Scenarios**: Building executive dashboards, creating interactive product performance reports, analyzing user behavior, facilitating data-driven decision-making, and presenting quarterly business reviews with live data.

## 3. Core Functionality & Features

Gridpark is built upon a foundation of Excel compatibility, augmented with modern development tools and a focus on extensibility. Its core functionalities revolve around seamless spreadsheet manipulation, code integration, and a rich user experience.

### 3.1 Excel Compatibility

*   **File Format Support**: Native support for `.xlsx` and `.csv` file import and export with high data fidelity.
*   **Data Preservation**: Ensures no data loss during import/export cycles.
*   **Formula Compatibility**: Parsing and calculation of core Excel functions (e.g., SUM, AVERAGE, IF, VLOOKUP) with identical behavior to Excel.
*   **References**: Supports A1/R1C1 cell references, range references, and cross-sheet references.

### 3.2 Spreadsheet Grid & Formula Engine

*   **Basic Grid**: An interactive spreadsheet interface (e.g., 26 columns × 1000 rows) with features like cell selection, keyboard navigation, and cell editing.
*   **Data Types**: Handles basic data types including text, numbers, and booleans.
*   **Automatic Recalculation**: A robust formula engine capable of automatic recalculation upon dependency changes.
*   **SQLite Storage**: Utilizes an SQLite-based data storage for persistence across sessions, complete with schema versioning and migration.
*   **Multi-sheet Support**: Allows multiple worksheets within a workbook, with features for creating, renaming, deleting, and reordering sheets.

### 3.3 Monaco Editor Integration

*   **Code Editing**: Provides a VS Code-level editing experience for JavaScript, CSS, and other code files associated with workbooks and sheets.
*   **Syntax Highlighting & IntelliSense**: Rich editing features including syntax highlighting, code completion (IntelliSense) for Excel APIs and custom functions, and error detection.
*   **Theming**: Supports dark mode and integrates with Gridpark's theming system.

### 3.4 File Management & Workspace (Gridpark Package)

*   **Gridpark Project Structure**: Manages a `.gridpark` directory alongside `.xlsx` files, which contains `manifest.json` and associated code files (e.g., `main.js`, `style.css`) for workbooks and individual sheets.
*   **Manifest Management**: Automatically generates a `manifest.json` for new or imported Excel files, allowing developers to define custom logic and styles.
*   **File Tree Navigation**: A hierarchical file tree (`FileTree`) for navigating workbooks, sheets, manifests, and code files, providing visual cues for file types, selection, and dirty state.
*   **Tab Management**: Supports multiple open tabs for different file types (sheets, manifests, code files) with active tab tracking and dirty state indicators.
*   **Secure File I/O**: Leverages Electron's IPC (`window.electronAPI`) for secure reading and writing of files to the local file system.

## 4. Architecture & Technical Principles

Gridpark is architected as a desktop-first Electron application, designed to function as an "Excel superset" while maintaining local-first control and a strong emphasis on security, performance, and hackability.

### 4.1 System North Star

The architectural vision is guided by:
*   **Electron Main Process Core**: Encapsulating application lifecycle, window management, and secure IPC.
*   **Decoupled Spreadsheet Logic**: A dedicated workbook engine operates independently of UI concerns.
*   **Sandboxed Plugin Runtime**: Enabling hackable extensions without compromising safety.
*   **Deterministic Behavior**: Ensuring replayable commands and reproducible calculations (≥90% reproducibility target).

### 4.2 Process Architecture

*   **Main Process (`src/main/index.ts`)**: Responsible for the overarching application lifecycle, composing windows, integrating native functionalities, and registering secure IPC channels. It strictly avoids business logic.
*   **Preload Script (`src/main/preload.ts`)**: Serves as the single, hardened source of truth for renderer-safe APIs. It exposes explicit, typed capabilities (e.g., filesystem access, analytics events, command dispatch) to the renderer via `contextBridge`, with `nodeIntegration` disabled in renderers for security.
*   **Renderer Process (`src/renderer/index.tsx`)**: Hosts the interactive user interface, including the spreadsheet grid, Monaco code editor, and command palette. It acts as a pure client, interacting exclusively with the workbook engine and plugin APIs.

### 4.3 Core Modules

1.  **Workbook Engine**: Manages an immutable worksheet state tree in memory, with snapshot serialization to `.xlsx` format. All mutations (e.g., `ApplyFormula`, `EditCell`, `RunPlugin`, `Undo`) are command-based and batched for robust undo/redo functionality.
2.  **Calculation & Validation Workers**: Offloads computationally intensive tasks and linting to Web Workers (or Electron `worker_threads`). These workers communicate using structured cloning, ensuring no shared mutable state.
3.  **Experience Layer**: Implemented using React, providing the declarative UI for the grid surface, inspector panels, and timeline view. State management relies on a unidirectional data flow (e.g., Redux Toolkit or Zustand), sourcing data exclusively from workbook engine events.
4.  **Plugin Sandbox**: Executes custom JavaScript within a sandboxed environment (SES/isolated-vm) with granular capability filtering. It provides high-level APIs like `grid.getRange`, `grid.setRange`, and `ui.openPanel`, enforced with rate limiting. Plugin manifests define permissions, which are validated prior to activation.
5.  **Persistence & Sync**: Handles local autosave functionality to a `.gridpark` bundle (SQLite-based), combining workbook snapshots with plugin metadata. An export/import pipeline translates between `.gridpark` and `.xlsx` formats via a dedicated micro-library.

### 4.4 Data & Event Flow

1.  The Renderer emits user intent (e.g., `dispatchCommand`) via the secure preload bridge.
2.  The Main process forwards this intent to the workbook engine service (running in Node.js context) or a dedicated in-renderer engine worker.
3.  The Engine mutates its state, appends the operation to a command log, and publishes a versioned event (`WorkbookUpdated vN`).
4.  The Renderer's store reconciles these events into its UI state, with React components rendering solely based on selectors from this store.
5.  An observability layer records command metadata (duration, errors) for retrospective metrics (Agent Satisfaction Score (ASS), Satisfaction Variance (SV), Satisfaction Trend (ST)).

### 4.5 Non-Functional Guardrails

*   **Security**: Strict adherence to the preload layer; all IPC payloads are validated using Zod schemas. Dynamic `eval` is disallowed outside the designated sandbox environments.
*   **Performance**: Aims for UI updates below 16ms for grid edits. Employs virtualization for row/column rendering and incremental diffing for large sheets.
*   **Offline-First**: Designed with no hard network dependencies. Remote services (e.g., updates, templates) must degrade gracefully with cached fallbacks.
*   **Testing**: Emphasizes deterministic seeds for command replay. Includes unit tests for the formula engine and integration tests for IPC contracts (e.g., using Playwright/Electron).
*   **Telemetry**: Logs command IDs, execution times, and satisfaction metrics to local JSON files (under `prompt/3_development/log/`) for observer ingestion and analysis.

## 5. Developer Experience & Extensibility (Hackability)

A core tenet of Gridpark is to empower "Creative Technologists" through a highly hackable and extensible environment. This is achieved through a robust plugin ecosystem, a code-first approach to UI interaction, and modern development tooling.

### 5.1 Plugin Ecosystem & Custom Functions

Gridpark provides a powerful plugin system that extends its core functionality, fully compatible with Excel Custom Functions specifications.
*   **Custom Function API**: Full support for `@customfunction` annotations, parameter type definitions (number, string, boolean, range), optional parameters, and asynchronous functions using Promises.
*   **Namespace Registration**: Custom functions are registered under the `GRIDPARK` namespace (e.g., `GRIDPARK.FUNCTIONNAME()`).
*   **Plugin Registration System**: Allows modular extension of functionality, including metadata storage, function discovery, namespace management, and dependency tracking.
*   **Hot Reload**: Enables immediate updates of custom functions on save, significantly accelerating development cycles.
*   **Function Library Management**: Tools for organizing, sharing, and version controlling custom function libraries.
*   **Streaming Functions**: Support for real-time updating functions (`StreamingInvocation`) for live dashboards.

### 5.2 UI/DOM Interaction (Controlled Hackability)

Gridpark aims to deliver a "code-like experience with spreadsheet flexibility," enabling developers to interact with the grid in a familiar, web-centric manner. While direct, unmediated DOM manipulation (e.g., raw `document.querySelector`) in a React application with a decoupled data engine can lead to inconsistencies and break determinism, Gridpark will provide a controlled, DOM-like API within the plugin sandbox. The detailed specification for these selectors is outlined in the separate document, [Gridpark Selector Specification](Gridpark_Selector_Spec.md).

*   **Rationale**: To maintain architectural integrity (separation of UI from workbook engine), ensure data consistency, and preserve deterministic behavior, plugins will interact with the grid UI through a structured and sandboxed API.
*   **Controlled Access**: This API will offer methods that *feel* like DOM manipulation but are safely mediated by the Gridpark core. This could involve:
    *   **Element Accessors**: Functions like `grid.getCellElement(address)` or `grid.getRangeElement(range)` that return a controlled DOM element (or a proxy). These elements would expose properties and methods for safely modifying visual aspects (e.g., `element.style.backgroundColor`, `element.setAttribute('data-custom', 'value')`) without directly affecting the underlying data model unless explicitly intended via a `setRange` operation.
    *   **Event Handling**: Plugins can attach event listeners to these controlled elements (e.g., `element.addEventListener('click', handler)`) to react to user interactions, triggering actions that are then processed by the workbook engine or other Gridpark APIs.
*   **Synchronization**: Any UI changes made via these controlled APIs that are intended to affect the data model must be explicitly synchronized back to the workbook engine through structured API calls (e.g., `grid.setRange`). This ensures that the engine's immutable state remains the single source of truth for data.

### 5.3 API Surface

The plugin sandbox provides high-level APIs for interacting with the Gridpark environment:
*   **Grid Manipulation**: `grid.getRange`, `grid.setRange` for programmatic data access and modification.
*   **UI Interaction**: `ui.openPanel` for extending the user interface with custom panels.
*   **Rate Limiting**: APIs are rate-limited to ensure system stability and performance.

### 5.4 Modern Development Tooling

Gridpark integrates tools that provide a professional development environment:
*   **VS Code-level Editing**: Enhanced Monaco Editor integration for custom functions, offering IntelliSense, syntax highlighting, and error detection.
*   **Real-time Debugging**: Capabilities for setting breakpoints, watching variables, and inspecting call stacks within custom function execution.
*   **Version Control Integration**: Future support for Git integration for function version control.
*   **Performance Profiling**: Tools to measure execution time, memory usage, and identify performance bottlenecks in custom functions.

## 6. Design Principles & Brand Guidelines

Gridpark's design is guided by a core philosophy that aims to "Transform spreadsheets into playgrounds," translating data manipulation into creative experiences for software engineers. This vision is supported by specific design values and a cohesive brand identity.

### 6.1 Core Philosophy & Values

The design emphasizes:
*   **Code-First Experience**: Interface behaviors mirror familiar development tools (e.g., VS Code-like keyboard shortcuts, command palette, dark mode default).
*   **Hackable Interface**: Designed with visible extension points for JavaScript customization, discoverable shortcuts, and modular UI components to encourage user modification and exploration.
*   **Playful Productivity**: Delightful elements enhance functionality without distraction, such as subtle animations on data changes, achievement-style feedback, and visual celebrations for successful operations.
*   **Immediate Feedback**: Every user action receives instant and clear responses, with real-time formula previews, progressive disclosure of complexity, and guiding error states.

**Decision Framework**: Design choices prioritize: 1) Functionality, 2) Code-First Compatibility, 3) Hackability, 4) Playful Enhancement, and 5) Feedback Clarity. Anti-patterns like a "business software feel" or "over-gamification" are actively avoided.

### 6.2 Brand Identity & Color Palette

*   **Brand Identity**: Gridpark's brand positioning is an "Intellectual playground for data creativity," contrasting with Excel's business productivity focus.
*   **Color Palette**: A curated palette ensures visual consistency and clarity:
    *   **Core Colors**: Violet (`#B197FC`) for primary accents/active states, and Navy (`#1C2541`) for text/structure.
    *   **Neutral Colors**: Off-White (`#F9F8FF`) for backgrounds, Soft Black (`#121826`) for dark mode, and Cool Grays (Light: `#E1E4EB`, Medium: `#A0A6B8`, Dark: `#3E475A`) for subtle elements.
    *   **Accent Colors**: Neon Green (`#4EFD8A`) for success, Vivid Orange (`#FF6B35`) for energy/warnings, Turquoise Blue (`#3DD6F5`) for speed, and Hot Pink (`#FF4DA6`) for playfulness.

### 6.3 Typography

Typography choices are made to support readability, professionalism, and developer-friendliness:
*   **Headers/Display**: `Caveat` (handwritten, playful).
*   **Body/Interface**: `Noto Sans` (readable, professional).
*   **Code/Data**: `JetBrains Mono` (monospace, developer-friendly).

## 7. Testing & Quality Assurance

Gridpark employs a comprehensive testing strategy to ensure the quality, reliability, and maintainability of the application across its various components and platforms. This includes a robust testing setup, clear expectations for different test types, and adherence to established coding standards.

### 7.1 Development Playbook (High-Level)

The development process incorporates quality assurance practices from the outset:
*   **Role Alignment & Intake**: Confirming Definition of Ready (DoR) items with Product Owner (POA) and Designer (DA) before coding, capturing task intent, acceptance criteria, and design references.
*   **Implementation Flow**: Involves planning, prototyping in sandboxes, building within the renderer or engine, and rigorous verification through automated checks.
*   **Handoff**: Updating task notes with outcomes, test evidence, and open questions, including logging Agent Satisfaction Scores (ASS).

### 7.2 Testing Expectations

Gridpark utilizes a multi-faceted testing approach:
*   **Unit Tests**: Focus on isolating and testing individual units of code. This includes:
    *   Formula engine logic.
    *   Command reducers within the workbook engine.
    *   Plugin permission checks.
    *   Individual React components and custom hooks.
*   **Integration Tests**: Verify the interactions between different modules and systems. This includes:
    *   IPC bridge contracts between the main and renderer processes.
    *   Undo/redo timelines within the workbook engine.
    *   `.gridpark` ⇄ `.xlsx` conversion processes, ensuring data fidelity.
    *   Key workflows involving file I/O and data persistence.
*   **UI/UX/Design Tests**: Ensure that the application's visual and interactive elements meet design specifications and user experience goals.
    *   Snapshot or story-based verification of playful feedback behaviors and visual consistency.
    *   Components using Joy UI are rendered within the correct theming context.
*   **End-to-End (E2E) Tests**: (Implicitly, though not explicitly detailed in `src/test`) For covering full user workflows. These would likely leverage tools like Playwright or Electron-specific testing frameworks.
*   **Performance Tests**: Benchmarking grid rendering, formula calculation, and file I/O performance to meet or exceed Excel's performance for basic operations.
*   **Cross-Platform Compatibility Tests**: Verification across macOS, Windows, and Linux.

### 7.3 Testing Environment & Utilities

The testing environment is configured to facilitate efficient and reliable testing:
*   **`src/test/setup.ts`**: Configures the Jest testing environment.
    *   Includes `@testing-library/jest-dom` for extended DOM matchers.
    *   Mocks Electron APIs (`window.electronAPI.ipcRenderer`) to allow renderer process code to run in a Node.js environment without direct Electron dependencies.
    *   Mocks browser APIs like `ResizeObserver` and `matchMedia` for consistent component behavior in tests.
    *   Suppresses specific console errors to maintain clean test output.
*   **`src/test/utils.tsx`**: Provides custom render utilities and helpers for React component testing.
    *   `customRender`: Overrides `@testing-library/react`'s `render` to wrap components with `@mui/joy`'s `CssVarsProvider` and the application's theme, ensuring accurate styling in tests.
    *   Helpers like `createMockIcon`, `createMockAction` for streamlined test data.
    *   `waitForElementToBeRemoved`: A utility for testing dynamic UI changes involving element removal.

## 8. Roadmap & Milestones

Gridpark's development follows a phased roadmap, progressively building capabilities from foundational Excel API compatibility to advanced developer experiences and seamless Excel migration. Each version allows for API/UI improvements while guaranteeing `.xlsx` and Excel Custom Functions compatibility.

### 8.1 Release Philosophy

*   **Excel Subset Strategy**: Implement a carefully chosen subset of Excel JavaScript API and Custom Functions.
*   **Breaking Changes Allowed**: Major versions may introduce controlled breaking changes for API and UI enhancements.
*   **Excel Compatibility Guaranteed**: Full `.xlsx` file compatibility and adherence to Excel Custom Functions specifications.
*   **Plugin Ecosystem**: Prioritizes an extensible platform through plugins built on Excel Custom Functions.

### 8.2 Version Milestones

*   **Version 1.0.0: Excel JavaScript API Foundation (Weeks 1-3)**
    *   **Theme**: "Excel-Compatible Spreadsheet with Developer Experience"
    *   **Core Features**: Electron + React + TypeScript app, SQLite local database, basic spreadsheet grid, initial Excel JavaScript API subset, Monaco Editor integration, `.xlsx`/`.csv` import/export.
    *   **Excel JS API v1 (Subset)**: Basic `Excel.run()`, `Workbook`/`Worksheet`/`Range` objects, core properties (values, formulas), basic built-in functions (SUM, AVERAGE, IF, VLOOKUP), `Context.sync()`.
    *   **Success Criteria**: Excel JS API subset functions identically to Excel, `.xlsx` import/export without data loss, demonstrable core developer workflow, performance matches or exceeds Excel for basic operations.

*   **Version 2.0.0: Excel Custom Functions Integration (Weeks 4-5)**
    *   **Theme**: "Extensible Functions with Excel Compatibility"
    *   **Breaking Changes**: Introduction of Custom Functions namespace, plugin architecture.
    *   **Excel Custom Functions v2**: Full `@customfunction` annotation support, parameter type definitions, optional/async parameters, namespace registration, Excel error types.
    *   **Plugin System v2**: Custom Function registration, plugin metadata storage, discovery/autocomplete, hot reload for development.
    *   **Success Criteria**: Excel Custom Functions function identically to Excel Add-ins, plugin development experience matches Excel Add-ins, existing Excel Custom Functions migrate minimally.

*   **Version 3.0.0: Enhanced Developer Experience (Weeks 6-7)**
    *   **Theme**: "Professional Development Environment"
    *   **Breaking Changes**: Advanced Monaco Editor integration, hot reload system.
    *   **Developer Experience**: VS Code-level editing, real-time debugging (breakpoints, watches), hot reload, IntelliSense, Git integration (future), performance profiling.
    *   **Advanced Custom Functions**: Streaming functions (`StreamingInvocation`), cancellation, advanced parameter validation, cross-sheet references.
    *   **Multi-sheet & Collaboration**: Cross-sheet CF references, shared CF libraries, real-time collaboration on CFs, internal function marketplace.
    *   **Success Criteria**: Development experience exceeds Excel Add-in development, hot reload reduces CF development time by 50%+, advanced features work seamlessly.

*   **Version 4.0.0: Excel Migration Bridge (Week 8)**
    *   **Theme**: "Seamless Excel Transition"
    *   **Breaking Changes**: Excel Add-in import wizard, enhanced compatibility.
    *   **Excel Add-in Migration**: Automatic `.xlam` import, VBA to JavaScript CF conversion assistance, macro migration guidance, complex formula compatibility.
    *   **Migration Tools**: Migration Wizard, VBA to JS translation assistance, compatibility reports.
    *   **Enhanced Excel Compatibility**: Array formula support, advanced parameter types, Excel formatting preservation, full `.xlsx` roundtrip.
    *   **Success Criteria**: >90% of Excel Add-ins migrate successfully, Excel power users transition with minimal learning curve, bidirectional Excel compatibility demonstrated.
