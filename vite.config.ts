import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Shared Vite configuration for web version
// Electron uses separate vite.*.config.ts files via Forge
export default defineConfig({
  plugins: [react()],

  // Entry point for web version
  root: './web',

  // Build configuration
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
      },
    },
  },

  // Development server
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false, // Don't auto-open browser for local dev
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },

  // Path resolution (shared with Electron configs)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/renderer/components'),
      '@ui': resolve(__dirname, './src/renderer/components/ui'),
    },
  },

  // Environment variables
  define: {
    __IS_WEB__: true,
    __IS_ELECTRON__: false,
  },

  // Optimize dependencies (shared between web and Electron)
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/joy', '@emotion/react', '@emotion/styled'],
  },
});
