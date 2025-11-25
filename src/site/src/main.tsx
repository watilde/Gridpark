import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/noto-sans/300.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import { App } from './App';
import './landing/style.css';
import './landing/chaos.css';
import './landing/japanese-street.css';
import './landing/philosophy.css';
import './landing/site-overrides.css';
import './mockElectron';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
