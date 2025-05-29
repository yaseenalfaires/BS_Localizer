import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' assert { type: 'json' }
// If you're using React:
// import react from '@vitejs/plugin-react';
// If you're using Vue:
// import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    // react(), // For React
    // vue(),   // For Vue
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // The main popup HTML (Vite will automatically find its linked JS like popup.js)
        popup: resolve(__dirname, 'popup.html'),
        // Your background script
        background: resolve(__dirname, 'background.js'),
        // Your content script - ADDED THIS LINE
        content: resolve(__dirname, 'content.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
      external: ['chrome'],
    },
    cssCodeSplit: false,
  },
});