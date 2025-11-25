import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vite config for Electron preload scripts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js',
      },
    },
    outDir: '.vite/build',
    emptyOutDir: false,
    sourcemap: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
