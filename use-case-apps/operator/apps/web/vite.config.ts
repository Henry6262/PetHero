import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = import.meta.dirname;
const projectRoot = resolve(root, "../..");

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3069",
    },
  },
  resolve: {
    alias: {
      "@shared": resolve(projectRoot, "src/shared"),
    },
  },
  optimizeDeps: {
    include: [
      "@react-three/drei",
      "@react-three/fiber",
      "@react-three/postprocessing",
      "three",
      "three-mesh-bvh",
      "camera-controls",
    ],
    force: true,
  },
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
            // Keep React + React-DOM + scheduler in the SAME chunk as R3F.
            // Splitting them causes a production race where R3F reads
            // React.Activity before the React chunk has finished initializing.
            if (
              id.includes("@react-three") ||
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor-react-r3f";
            }
            if (
              id.includes("/three/") ||
              id.includes("three-mesh-bvh") ||
              id.includes("camera-controls")
            ) {
              return "vendor-three";
            }
          }
        },
      },
    },
  },
});
