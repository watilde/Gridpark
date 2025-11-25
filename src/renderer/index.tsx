import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import Fontsource fonts
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';

import { App } from './app/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to locate the root element.');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
