import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite config for Electron renderer process
export default defineConfig({
  plugins: [react()],

  // Root directory for renderer
  root: resolve(__dirname, 'src/renderer'),

  // Build configuration
  build: {
    outDir: resolve(__dirname, '.vite/renderer'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
      },
      output: {
        manualChunks(id) {
          // Bundle Monaco Editor separately
          if (id.includes('monaco-editor')) {
            // Exclude language support files except essential ones
            if (id.includes('/basic-languages/')) {
              const lang = id.match(/\/basic-languages\/(\w+)\//)?.[1];
              // Only include JavaScript, TypeScript, CSS, HTML
              if (!['javascript', 'typescript', 'css', 'html'].includes(lang || '')) {
                return; // Exclude this language
              }
            }
            return 'monaco-editor';
          }
          // Bundle workers
          if (id.includes('.worker')) {
            return 'monaco-workers';
          }
        },
      },
    },
  },

  // Development server
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/renderer/components'),
      '@ui': resolve(__dirname, './src/renderer/components/ui'),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/joy',
      '@emotion/react',
      '@emotion/styled',
      'monaco-editor/esm/vs/editor/editor.api',
    ],
  },

  // Environment variables
  define: {
    __IS_WEB__: false,
    __IS_ELECTRON__: true,
  },
});
