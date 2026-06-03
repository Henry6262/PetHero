import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Consume the private react-bits-vault by aliasing `@` to its src.
// `@/free/...`, `@/pro/...`, `@/lib/...` resolve to the sibling vault repo.
// Our own app code uses the `@app` alias.
const VAULT = resolve(__dirname, '../../react-bits-vault/src');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  resolve: {
    alias: {
      '@': VAULT,
      '@app': resolve(__dirname, './src'),
    },
  },
});
