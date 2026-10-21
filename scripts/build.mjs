import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';

await build({ entryPoints: ['src/app.js'], bundle: true, outfile: 'extension/app.js', platform: 'browser', target: 'firefox142', format: 'iife', legalComments: 'eof' });
await copyFile('node_modules/@noble/hashes/LICENSE', 'extension/THIRD_PARTY_LICENSE.txt');
console.log('Built extension/app.js with all runtime dependencies bundled locally.');
