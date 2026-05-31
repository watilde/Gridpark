import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  root: resolve(__dirname, 'src/renderer'),

  build: {
    outDir: resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/renderer/components'),
      '@ui': resolve(__dirname, './src/renderer/components/ui'),
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/joy', '@emotion/react', '@emotion/styled'],
  },

  define: {
    __IS_WEB__: true,
    __IS_ELECTRON__: false,
  },
});
