import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';

await build();
// Include the licenses of bundled runtime dependencies alongside the extension.
const licenses = await Promise.all([
  ['@noble/hashes', 'LICENSE'], ['vue', 'LICENSE'],
  ['@vue/shared', 'LICENSE'], ['@vue/reactivity', 'LICENSE'],
  ['@vue/runtime-core', 'LICENSE'], ['@vue/runtime-dom', 'LICENSE'],
].map(async ([name, file]) => `${name}\n\n${await readFile(`node_modules/${name}/${file}`, 'utf8')}`));
await writeFile('extension/THIRD_PARTY_LICENSE.txt', licenses.join('\n\n'));
