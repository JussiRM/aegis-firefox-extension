import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await build();
// Reload the matching stylesheet when an installed extension is rebuilt.
const css = await readFile('extension/app.css');
const cssVersion = createHash('sha256').update(css).digest('hex').slice(0, 12);
const html = await readFile('extension/app.html', 'utf8');
await writeFile('extension/app.html', html.replace('href="./app.css"', `href="./app.css?v=${cssVersion}"`));
await build({
  configFile: false,
  root: 'src',
  publicDir: false,
  build: {
    outDir: '../extension', emptyOutDir: false, target: 'firefox142', minify: false,
    rolldownOptions: {
      input: 'src/background.ts',
      output: { entryFileNames: 'background.js', format: 'iife' },
    },
  },
});
// Include the licenses of bundled runtime dependencies alongside the extension.
const licenses = await Promise.all([
  ['@noble/hashes', 'LICENSE'], ['vue', 'LICENSE'],
  ['@vue/shared', 'LICENSE'], ['@vue/reactivity', 'LICENSE'],
  ['@vue/runtime-core', 'LICENSE'], ['@vue/runtime-dom', 'LICENSE'],
].map(async ([name, file]) => `${name}\n\n${await readFile(`node_modules/${name}/${file}`, 'utf8')}`));
licenses.push(`Bootstrap Icons v1.13.1 (gear, lock, box-arrow-up-right)\nhttps://github.com/twbs/icons/tree/v1.13.1\n\n${await readFile('licenses/bootstrap-icons-LICENSE.txt', 'utf8')}`);
await writeFile('extension/THIRD_PARTY_LICENSE.txt', licenses.join('\n\n'));
