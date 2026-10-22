import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: false,
  plugins: [vue({ template: { transformAssetUrls: false } })],
  build: {
    outDir: '../extension',
    // The manifest and icons are maintained directly in extension/.
    emptyOutDir: false,
    target: 'firefox142',
    minify: false,
    cssMinify: false,
    rolldownOptions: {
      input: 'src/app.html',
      output: { entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
});
