import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
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
    host: true,
    open: true,
  },
  
  // Path resolution
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
});