// Style isolation and palette (base §8.3). Exit 1 on errors.
//   node tools/check-style.mjs              all checks, including the test sheet in headless Chromium
//   node tools/check-style.mjs --no-browser skip check 6
// 1 no color literals outside js/style/*, css/tokens.css, css/style.css, js/engine/legend.js
// 2 tokens.js = tokens.css = the S3 table of content/estilo-*.md
// 3 contrast minimums · 4 legend order, exclusions and ΔE00 distances · 5 ink outline ≥ 2 px on legend
// shapes · 6 the test sheet renders without console errors. Also warns when course or video files
// set a stroke manner directly (they must use the style API).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/load-data.mjs';

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
function walk(dir, ext) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), ext) : (e.name.endsWith(ext) ? [path.join(dir, e.name)] : []));
}

// ------------------------------------------------------------------ 1. color literals
const NAMED = 'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' ');
const NAMED_SET = new Set(NAMED);
const ALLOWED = new Set(['css/tokens.css', 'css/style.css', 'js/engine/legend.js']);
const isAllowed = (f) => ALLOWED.has(f) || f.startsWith('js/style/');

function jsStrings(src) {
  const out = []; let i = 0, line = 1; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; let j = i + 1, text = '';
      while (j < n && src[j] !== q) { if (src[j] === '\\') { text += src[j + 1]; j += 2; continue; } if (src[j] === '\n') line++; text += src[j]; j++; }
      out.push({ text, line }); i = j + 1; continue;
    }
    i++;
  }
  return out;
}
const HEX_FULL = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN = /\b(rgba?|hsla?)\s*\(/i;
for (const f of walk('js', '.js').map((p) => p.replace(/\\/g, '/'))) {
  if (isAllowed(f)) continue;
  const src = read(f);
  for (const { text, line } of jsStrings(src)) {
    const t = text.trim();
    if (HEX_FULL.test(t) || FN.test(t) || NAMED_SET.has(t.toLowerCase()) || /#[0-9a-f]{6}\b/i.test(t)) err(`1 ${f}:${line}: literal de color «${t.slice(0, 40)}»`);
  }
  if (f.startsWith('js/course/') || f.startsWith('js/videos/')) {
    src.split('\n').forEach((ln, i) => {
      if (/ctx\.(strokeStyle|lineWidth|setLineDash|shadowBlur|filter)\s*=/.test(ln) || /ctx\.(strokeStyle|fillStyle)\s*=/.test(ln)) warn(`manera de trazo fuera del estilo ${f}:${i + 1}: ${ln.trim().slice(0, 80)}`);
    });
  }
}
for (const f of [...walk('css', '.css').map((p) => p.replace(/\\/g, '/')), 'index.html']) {
  if (isAllowed(f) || !fs.existsSync(path.join(ROOT, f))) continue;
  const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
  src.split('\n').forEach((ln, i) => {
    if (/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b(?![\w-])/i.test(ln) && !/href=|url\(/.test(ln)) err(`1 ${f}:${i + 1}: literal de color «${ln.trim().slice(0, 60)}»`);
    if (FN.test(ln)) err(`1 ${f}:${i + 1}: función de color «${ln.trim().slice(0, 60)}»`);
    const m = ln.match(/:\s*([^;{}]+)[;}]/);
    if (m && f.endsWith('.css')) for (const w of m[1].toLowerCase().split(/[\s,()]+/)) if (NAMED_SET.has(w)) err(`1 ${f}:${i + 1}: color con nombre «${w}»`);
  });
}

// ------------------------------------------------------------------ 2. roles in three places
const sandbox = { window: {}, globalThis: {} };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read('js/style/tokens.js'), sandbox);
const tok = sandbox.IAHI.style.tokens;
const jsRoles = tok.roles;
const css = read('css/tokens.css');
const rootBlock = (css.match(/:root\s*\{([\s\S]*?)\}/) || [])[1] || '';
const cssRoles = {};
for (const m of rootBlock.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) cssRoles[m[1]] = m[2].toUpperCase();
const styleFile = fs.readdirSync(path.join(ROOT, 'content')).filter((f) => /^estilo-.*\.md$/.test(f));
if (styleFile.length !== 1) err(`2 content/ debe tener exactamente un archivo estilo-*.md (hay ${styleFile.length})`);
const styleMd = styleFile.length ? read(path.join('content', styleFile[0])) : '';
const s3 = {};
for (const m of styleMd.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|[^|]*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|/gm)) s3[m[1]] = m[2].toUpperCase();
for (const [k, v] of Object.entries(s3)) {
  if (!jsRoles[k]) err(`2 js/style/tokens.js: falta el rol ${k}`);
  else if (jsRoles[k].toUpperCase() !== v) err(`2 js/style/tokens.js: ${k} = ${jsRoles[k]}, el estilo dice ${v}`);
  if (!cssRoles[k]) err(`2 css/tokens.css: falta --${k}`);
  else if (cssRoles[k] !== v) err(`2 css/tokens.css: --${k} = ${cssRoles[k]}, el estilo dice ${v}`);
}
for (const k of Object.keys(jsRoles)) if (!s3[k]) err(`2 js/style/tokens.js define ${k}, que no está en la tabla S3 del estilo`);

// ------------------------------------------------------------------ 3. contrast
const REQUIRED = ['ground', 'ground-2', 'ink', 'ink-soft', 'dark', 'on-dark', 'accent-1', 'accent-2', 'accent-3', 'skin-1', 'skin-2', 'skin-3', 'skin-4', 'skin-5', 'machine-ground', 'machine-line', 'machine-grid', 'machine-glow-1', 'machine-glow-2', 'alert'];
REQUIRED.forEach((r) => { if (!jsRoles[r]) err(`3 falta el rol obligatorio ${r}`); });
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const need = [['ink', 'ground', 4.5], ['ink-soft', 'ground', 4.5], ['ink', 'ground-2', 4.5], ['on-dark', 'dark', 4.5], ['on-dark', 'machine-ground', 4.5], ['machine-line', 'machine-ground', 3], ['alert', 'ground', 4.5]];
for (const [a, b, min] of need) {
  if (!jsRoles[a] || !jsRoles[b]) continue;
  const c = contrast(jsRoles[a], jsRoles[b]);
  if (c < min) err(`3 contraste ${a} sobre ${b}: ${c.toFixed(2)}:1 (mínimo ${min}:1)`);
}

// ------------------------------------------------------------------ 4. legend order, exclusions, ΔE00
const LEGEND = { 'blue': '#0072B2', 'vermillion': '#D55E00', 'bluish green': '#009E73', 'reddish purple': '#CC79A7', 'sky blue': '#56B4E9', 'orange': '#E69F00', 'yellow': '#F0E442' };
const ordLine = (styleMd.match(/^Legend order:\s*(.+)$/m) || [])[1] || '';
const exLine = (styleMd.match(/^Legend exclusions:\s*(.+)$/m) || [])[1] || '';
const styleOrder = ordLine.split(',').map((s) => s.trim()).filter(Boolean);
const styleEx = exLine.split(',').map((s) => s.replace(/\(.*\)/, '').trim()).filter((s) => s && s !== '—' && s !== 'none');
if (JSON.stringify(styleOrder) !== JSON.stringify(Array.from(tok.legendOrder))) err(`4 legendOrder de tokens.js (${tok.legendOrder.join(', ')}) no coincide con el estilo (${styleOrder.join(', ')})`);
if (JSON.stringify(styleEx) !== JSON.stringify(Array.from(tok.legendExclude))) err(`4 legendExclude de tokens.js (${tok.legendExclude.join(', ')}) no coincide con el estilo (${styleEx.join(', ')})`);
for (const [name, hex] of Object.entries(LEGEND)) {
  const c = contrast(hex, jsRoles.ground);
  if (c < 1.5 && !tok.legendExclude.includes(name)) err(`4 el color de leyenda ${name} (${c.toFixed(2)}:1 sobre ground) debe excluirse`);
}
function lab(hex) {
  let [r, g, b] = rgb(hex).map(lin);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = (r * 0.2126 + g * 0.7152 + b * 0.0722), z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  [x, y, z] = [f(x), f(y), f(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function de00(h1, h2) {
  const [L1, a1, b1] = lab(h1), [L2, a2, b2] = lab(h2);
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * deg + 360) % 360, h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = h2p - h1p; if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p; if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += (hbp < 360 ? 360 : -360); hbp /= 2; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2)), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh));
}
const legendFile = path.join(ROOT, 'js/data/legend.js');
let slotsUsed = 6;
if (fs.existsSync(legendFile)) {
  const sb = { window: {}, IAHI: { data: {} } }; sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(legendFile, 'utf8'), sb);
  slotsUsed = Math.max(...sb.IAHI.data.legend.map((l) => l.slot));
}
const inUse = tok.legendOrder.filter((n) => !tok.legendExclude.includes(n)).slice(0, slotsUsed);
for (const name of inUse) {
  for (const [role, hex] of Object.entries(jsRoles)) {
    const d = de00(LEGEND[name], hex);
    if (/^accent-/.test(role) && d < 15) err(`4 ΔE00 ${name} ↔ ${role} = ${d.toFixed(1)} (mínimo 15)`);
    else if (/^(skin-|machine-glow|machine-line$|ground-2$|alert$)/.test(role) && d < 15) warn(`4 ΔE00 ${name} ↔ ${role} = ${d.toFixed(1)} (recomendado ≥ 15)`);
  }
}

// ------------------------------------------------------------------ 5. ink outline on legend shapes
const pictos = fs.existsSync(path.join(ROOT, 'js/course/pictos.js')) ? read('js/course/pictos.js') : '';
const chip = pictos.slice(pictos.indexOf('function legendChip'));
const wm = chip.match(/S\.stroke\(ctx, P\.circle\([^)]*\), \{ weight: ([0-9.]+)/);
if (!wm || parseFloat(wm[1]) < 2) err('5 js/course/pictos.js: el contorno en ink de cada forma de la leyenda debe medir 2 px o más');
const comp = read('css/components.css');
const bm = comp.match(/\.legend-swatch\s*\{[^}]*border:\s*([0-9.]+)px\s+solid\s+var\(--ink\)/);
if (!bm || parseFloat(bm[1]) < 2) err('5 css/components.css: .legend-swatch necesita un borde en var(--ink) de 2 px o más');

// ------------------------------------------------------------------ 6. the test sheet renders without errors
if (!process.argv.includes('--no-browser')) {
  const { launchBrowser } = await import('./lib/browser.mjs');
  const b = await launchBrowser({ width: 1280, height: 720, timeout: 180000 });
  try {
    for (const page of ['1', '2']) {
      await b.open(pathToFileURL(path.join(ROOT, 'index.html')).href + `?render=estilo&page=${page}`);
      for (let i = 0; i < 100; i++) { if (await b.evaluate('!!window.renderReady || !!window.renderError')) break; await new Promise((r) => setTimeout(r, 50)); }
      const e = await b.evaluate('window.renderError || null');
      if (e) err(`6 hoja de estilo, página ${page}: ${e}`);
    }
    for (const e of new Set(b.errors)) err(`6 consola: ${e}`);
  } finally { await b.close(); }
}

const print = (label, list) => { if (list.length) console.log(`\n${label} (${list.length})\n` + list.map((x) => '  · ' + x).join('\n')); };
print('ERRORES', errors);
print('Avisos', warnings);
console.log(`\ncheck-style: ${errors.length} errores, ${warnings.length} avisos · ${Object.keys(s3).length} roles, leyenda en uso: ${inUse.join(', ')}`);
process.exit(errors.length ? 1 : 0);
