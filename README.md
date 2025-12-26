# Gridpark

**[Experimental] Excel-compatible spreadsheet with custom functions and styles**

A desktop Electron application that provides Excel-compatible spreadsheet functionality with JavaScript custom functions and CSS styling.

## Quick Start

```bash
# Install dependencies
npm install

# Start Electron app
npm start

# Run tests
npm test
```

## ⚠️ WSL (Windows Subsystem for Linux) Users

**Known Issue**: File selection dialog may freeze or be very slow on WSL due to:
1. Cross-filesystem access (`/mnt/c/` to Windows files)
2. Electron's native dialog limitations in WSL
3. GPU acceleration issues in virtualized environment

**Recommended Solutions**:

### Option 1: Use Native Windows (Recommended)
```bash
# On Windows (not WSL), run:
npm install
npm start
```

### Option 2: Use WSL Native Paths
- Store and open files in WSL filesystem (`/home/user/...`)
- Avoid accessing Windows paths (`/mnt/c/...`)

### Option 3: Enable WSLg (Windows 11 only)
- Ensure WSLg is properly configured
- Update to latest WSL2 kernel: `wsl --update`

### Performance Tips for WSL
```bash
# Check if running in WSL
grep -qi microsoft /proc/version && echo "Running in WSL"

# Use WSL2 (not WSL1) for better performance
wsl --set-version Ubuntu 2

# Store project files in WSL filesystem
mv /mnt/c/projects/Gridpark ~/Gridpark
```

## Documentation

See the [docs-md/](docs-md/) directory for detailed documentation:
- [DEVELOPER_GUIDE.md](docs-md/DEVELOPER_GUIDE.md) - Architecture and development guide
- [Gridpark_Spec_v2.0.md](docs-md/Gridpark_Spec_v2.0.md) - Full specification
- [Gridpark_Selector_Spec.md](docs-md/Gridpark_Selector_Spec.md) - Selector specification

## License

Apache-2.0
