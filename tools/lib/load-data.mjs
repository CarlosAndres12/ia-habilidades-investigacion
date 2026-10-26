// Evaluates the site's data files (js/data/*.js) and its pure engine files (rng, easing, captions,
// timeline) in a vm sandbox, so the tools read exactly what the page reads and compute the same
// subtitle chunks and times as the player (base §4.4).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function listData() {
  const dir = path.join(ROOT, 'js', 'data');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(dir, f));
  const ses = path.join(dir, 'sesiones');
  if (fs.existsSync(ses)) fs.readdirSync(ses).filter((f) => f.endsWith('.js')).sort().forEach((f) => files.push(path.join(ses, f)));
  return files;
}

export function loadData(opts = {}) {
  const sandbox = { console, Math, Date, JSON, Object, Array, String, Number, RegExp, Promise, setTimeout, clearTimeout };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.IAHI = { data: {}, engine: {}, style: {}, course: {}, videos: {}, slides: {}, ui: {}, util: {} };
  vm.createContext(sandbox);
  const run = (file) => vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: path.relative(ROOT, file) });
  listData().forEach(run);
  for (const f of ['assets/audio/manifest.js']) {
    const abs = path.join(ROOT, f);
    if (fs.existsSync(abs)) run(abs);
  }
  if (opts.engine !== false) {
    for (const f of ['rng.js', 'easing.js', 'captions.js', 'timeline.js']) run(path.join(ROOT, 'js', 'engine', f));
  }
  return sandbox.IAHI;
}

// Walks every string inside a value, with its path ("videos.3.scenes.2.lines.0.text").
export function walkStrings(value, fn, at = '') {
  if (typeof value === 'string') { fn(value, at); return; }
  if (Array.isArray(value)) { value.forEach((v, i) => walkStrings(v, fn, at ? `${at}.${i}` : String(i))); return; }
  if (value && typeof value === 'object') Object.keys(value).forEach((k) => walkStrings(value[k], fn, at ? `${at}.${k}` : k));
}
