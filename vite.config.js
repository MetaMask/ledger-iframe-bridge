import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  base: './',
  plugins: [react(), [nodePolyfills()]],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
  },
});

function manualChunks(id) {
  if (id.includes('node_modules')) {
    // all node_modules are in the vendor chunk
    return 'vendor';
  }
  0;
}
