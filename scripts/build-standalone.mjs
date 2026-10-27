// Builds dist/skystudio-360.html — a single self-contained file (three.js, CSS and code inlined)
// that opens by double-click, works offline and can be emailed or put on a USB stick.

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  write: false,
  legalComments: 'eof'
});
const js = result.outputFiles[0].text;
const css = await readFile(path.join(root, 'css/style.css'), 'utf8');
let html = await readFile(path.join(root, 'index.html'), 'utf8');

const swap = (from, to) => {
  if (!html.includes(from)) throw new Error('build: marker not found: ' + from.slice(0, 60));
  html = html.replace(from, () => to);
};

swap('<link rel="stylesheet" href="css/style.css" />', `<style>\n${css}</style>`);
html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
// The file:// redirect belongs to index.html only.
html = html.replace(/\s*<script>\s*\/\/ Opened by double-click[\s\S]*?<\/script>/, '');
// "</script" inside the bundle would close the tag early.
swap('<script type="module" src="src/main.js"></script>', `<script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>`);

await mkdir(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist/skystudio-360.html');
await writeFile(out, html);
console.log(`Built ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB)`);
