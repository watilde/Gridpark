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
    },
  },
  
  // Development server
  server: {
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
    ],
  },
  
  // Environment variables
  define: {
    __IS_WEB__: false,
    __IS_ELECTRON__: true,
  },
});