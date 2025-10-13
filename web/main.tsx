import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import web-specific App wrapper
import { WebApp } from './WebApp';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to locate the root element.');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <WebApp />
  </StrictMode>,
);