import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vite config for Electron main process
export default defineConfig({
  build: {
    // Main process build configuration
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'index.js',
      },
    },
    outDir: '.vite/build',
    emptyOutDir: false,
    sourcemap: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
