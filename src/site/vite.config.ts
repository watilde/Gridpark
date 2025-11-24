import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  base: "/Gridpark/",
  resolve: {
    alias: {
      "@renderer": path.resolve(__dirname, "../renderer"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../../docs"),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
});
