# Gridpark

**[Experimental] Reasonably compatible with Excel and developer-first experience**

A desktop-first Electron application that also works on the web, providing Excel reasonably compatible spreadsheet functionality with powerful custom functions and modern developer tools.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start Electron app (desktop version)
npm start

# Start web version (browser)
npm run web:dev

# Run both simultaneously 
npm run dev:both
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Component Development

```bash
# Storybook for component development
npm run storybook
```

## 📘 Docs Site

The marketing site lives under `src/site` and builds into the `docs/` directory for static hosting.

Hosted URL: `https://watilde.github.io/Gridpark/` (Vite `base` is set to `/Gridpark/` so all assets load correctly there).

- `npm run docs:dev` — Launch the Vite dev server for the site.
- `npm run docs:build` — Build the site and dump the generated HTML/JS/CSS under `docs/`.
- `npm run docs:preview` — Preview the production build locally.

## ⚙️ CI & Releases

- The [`ci-release.yml`](.github/workflows/ci-release.yml) workflow runs on `push` to `v*` tags, builds docs plus the desktop app on Ubuntu/macOS/Windows, uploads each `out/make` bundle, and publishes them as release assets in GitHub Releases.

## 🏗️ Key features

- **📊 Reasonably compatible with Excel**: Import/export `.xlsx` files with most data fidelity
- **⚡ Custom Functions**: Standard JavaScript custom functions
- **🎨 Custom Styles**: Standard CSS styling with Excel-elector
- **🧪 Care Test Coverage**: Best effort and this is not v1 yet
- **⌨️ Developer-First**: Editor integration for code editing

## 📁 Project Structure

```
assets/                    # shared assets (icons, fonts, etc.)
docs/                      # marketing site build output (static hosting)
examples/                  # experimental apps or sample data
out/                       # build artifacts from packaging (cleaned between runs)
src/
├── main/                   # Electron main process, menu, platform helpers
├── renderer/               # React-based desktop/web renderer (components, themes, utils)
├── site/                   # Vite marketing/demo site (landing page + HeroDemo)
└── test/                   # Jest test suites & helpers
```

## 🛠️ Development Scripts

### Electron Development
- `npm start` - Launch Electron app in development mode
- `npm run package` - Package for distribution
- `npm run make` - Create distributable packages

### Quality Assurance
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - ESLint code checking
- `npm run storybook` - Component library development

## 🧪 Testing

Comprehensive test suite:
- **Input Component**: Error handling, validation, styling
- **Editor**: Placeholder implementation, theming
- **Toolbar**: Actions, tooltips, grouping

## 🎨 Design System

Based on Joy UI with Gridpark-specific customizations:
- **Colors**: Violet primary, neon green accents, developer-friendly dark theme
- **Typography**: Noto Sans for UI, Caveat for display, JetBrains Mono for code
- **Components**: Consistent, accessible, and hackable through Joy UI

## 📋 Development Workflow

1. **Setup**: Clone and run `npm install`
2. **Development**: Use `npm start` for Electron app
3. **Testing**: Write tests for new components
4. **Component**: Use Storybook for component development
5. **Platform**: Use platform utilities for cross-platform features

---

## License

Apache-2.0 - see LICENSE file for details
