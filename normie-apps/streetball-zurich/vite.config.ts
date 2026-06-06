import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Self-contained: the React Bits components we use are vendored under src/free,
// so `@/free/...`, `@/lib/...` and our own `@app/...` all resolve to this app's
// own src. No cross-repo dependency.
const SRC = resolve(__dirname, './src');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': SRC,
      '@app': SRC,
    },
  },
});
