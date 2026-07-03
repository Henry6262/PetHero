import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        landing: resolve(root, "index.html"),
        dashboard: resolve(root, "dashboard/index.html"),
      },
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("@react-three")) return "vendor-r3f";
            if (
              id.includes("/three/") ||
              id.includes("three-mesh-bvh") ||
              id.includes("camera-controls")
            ) {
              return "vendor-three";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }
          }
        },
      },
    },
  },
});
