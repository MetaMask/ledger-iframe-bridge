import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    [
      // legacy({
      //   // This will generate both modern and legacy builds, with the legacy build targeting not IE 11
      //   // and the modern build targeting the last 2 versions of all browsers and not dead browsers
      //   targets: ['last 2 versions, not dead, > 0.2%', 'not IE 11'],
      // }),
      nodePolyfills(),
    ],
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer()
      ]
    }
  },
  build: {
    // chunkSizeWarningLimit: 1000,
    // rollupOptions: {
    //   output: {
    //     manualChunks,
    //   },
    // },
    target: 'esnext',
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
