import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../assets/react-app",
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "react-app.js",
        chunkFileNames: "react-app.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "react-app.css";
          }
          return "[name][extname]";
        }
      }
    }
  }
});
