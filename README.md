# Gridpark

**Excel superset with custom functions and developer-first experience**

A desktop-first Electron application that also works on the web, providing Excel-compatible spreadsheet functionality with powerful custom functions and modern developer tools.

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

## 🏗️ Architecture

### Dual Platform Support

- **🖥️ Electron**: Full desktop app with native OS integration
- **🌐 Web**: Browser-based version with modern web APIs
- **🔄 Shared Codebase**: Same React components work on both platforms

### Key Features

- **📊 Excel Compatibility**: Import/export `.xlsx` files with full data fidelity
- **⚡ Custom Functions**: JavaScript-based custom functions with Excel API compatibility
- **🎨 Modern UI**: Joy UI design system with dark theme
- **🧪 Full Test Coverage**: 51 tests covering all components
- **⌨️ Developer-First**: Monaco editor integration for code editing

## 📁 Project Structure

```
src/
├── main/                   # Electron main process
├── renderer/               # React application
│   ├── components/ui/      # Reusable UI components
│   ├── app/               # App shell and routing
│   ├── theme/             # Joy UI theme configuration
│   └── utils/             # Platform utilities
├── test/                  # Test utilities and setup
web/                       # Web-specific entry point
├── index.html            # HTML entry
├── main.tsx             # Web React entry
└── WebApp.tsx           # Web app wrapper
```

## 🛠️ Development Scripts

### Electron Development
- `npm start` - Launch Electron app in development mode
- `npm run package` - Package for distribution
- `npm run make` - Create distributable packages

### Web Development  
- `npm run web:dev` - Start web development server (port 3000)
- `npm run web:build` - Build for production
- `npm run web:preview` - Preview production build

### Combined Development
- `npm run dev:both` - Run both Electron and web simultaneously

### Quality Assurance
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - ESLint code checking
- `npm run storybook` - Component library development

## 🎯 Platform Detection

The app automatically detects whether it's running in Electron or web environment:

```typescript
import { isElectron, isWeb, getPlatformCapabilities } from './src/renderer/utils/platform';

if (isElectron()) {
  // Native desktop features
} else if (isWeb()) {
  // Web-specific features
}
```

## 🧪 Testing

Comprehensive test suite with 51 tests covering:
- **Input Component**: Error handling, validation, styling (100% coverage)
- **MonacoEditor**: Placeholder implementation, theming (~95% coverage)  
- **Toolbar**: Actions, tooltips, grouping (~97% coverage)

## 🎨 Design System

Based on Joy UI with Gridpark-specific customizations:
- **Colors**: Violet primary, neon green accents, developer-friendly dark theme
- **Typography**: Noto Sans for UI, Caveat for display, JetBrains Mono for code
- **Components**: Consistent, accessible, and hackable through Joy UI

## 📋 Development Workflow

1. **Setup**: Clone and run `npm install`
2. **Development**: Use `npm run dev:both` to test both platforms
3. **Testing**: Write tests for new components
4. **Component**: Use Storybook for component development
5. **Platform**: Use platform utilities for cross-platform features

---

## License

MIT - see LICENSE file for details