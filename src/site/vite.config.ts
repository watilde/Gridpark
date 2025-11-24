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
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/editor/editor.api',
    ],
  },
});
