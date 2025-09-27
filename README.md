# Gridpark

## Development Scripts

- `npm start` – Launch the Electron app in development mode.
- `npm run storybook` – Start Storybook on port 6006 for component development.
- `npm run build-storybook` – Generate the static Storybook bundle in `storybook-static/`.

Storybook reflects the Gridpark brand foundations with a default dark workspace, developer-centric typography, and accent palette. Global styles are shared with the renderer so components stay visually consistent.

If you run Storybook in CI or need an offline check, prefer `npm run build-storybook` which builds the preview and exits without opening a dev server.
