import addonsLinter from 'addons-linter';
import { readFile } from 'node:fs/promises';

const linter = addonsLinter.createInstance({
  config: { _: ['extension'], logLevel: 'fatal', output: 'none', warningsAsErrors: false },
  runAsBinary: false,
});
const report = await linter.run();
const bundle = await readFile('extension/app.js', 'utf8');
const lines = bundle.split('\n');
// Vue uses this statement only for compiler-generated static template fragments.
// Keep this exception tied to the exact statement, within Vue's static renderer.
// All account data is rendered through escaped interpolation; never use v-html.
const staticAssignment = 'templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);';
const warnings = report.warnings.filter(warning => {
  const line = lines[warning.line - 1]?.trim();
  const context = lines.slice(Math.max(0, warning.line - 15), warning.line - 1).join('\n');
  return !(warning.code === 'UNSAFE_VAR_ASSIGNMENT' && warning.file === 'app.js' &&
    line === staticAssignment && context.includes('insertStaticContent(content, parent, anchor, namespace, start, end) {'));
});
for (const item of [...report.errors, ...warnings]) console.error(item);
const accepted = report.warnings.length - warnings.length;
console.log(`Add-ons Linter: ${report.errors.length} errors, ${warnings.length} unexpected warnings; ${accepted} known Vue static-template warning.`);
if (report.errors.length || warnings.length) process.exit(1);
