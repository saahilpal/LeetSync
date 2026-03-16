import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/content.ts"),
        injectMonaco: resolve(__dirname, "src/injected/injectMonaco.ts")
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});
