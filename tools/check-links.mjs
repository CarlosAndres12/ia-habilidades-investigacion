// Links (spec §9.1), offline: (1) every URL in sources.js appears verbatim in the course file;
// (2) no file under js/, css/ or index.html contains a URL outside sources.js; (3) every external link
// on every page opens in a new tab with rel="noopener noreferrer" and carries «enlace externo»
// (checked in headless Chromium; --no-browser skips it); (4) info: source keys used nowhere.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadData } from './lib/load-data.mjs';

const errors = [], info = [];
const D = loadData({ engine: false }).data;
const sources = D.sources || {};
const content = fs.readFileSync(path.join(ROOT, 'content', 'curso-ia-habilidades.md'), 'utf8');
const urls = new Set(Object.values(sources).map((s) => s.url).filter(Boolean));
// URLs that the course writes inside commands (code), shown as text and never as links
const codeText = (content.match(/```[\s\S]*?```|`[^`\n]+`/g) || []).join('\n');
const URL_RE = /https?:\/\/[^\s"'<>\\]+/g;
function cleanUrl(u) {
  u = u.replace(/[.,;:]+$/, '');
  while (/\)$/.test(u) && (u.match(/\)/g) || []).length > (u.match(/\(/g) || []).length) u = u.slice(0, -1);
  return u;
}
const commandUrls = new Set((codeText.match(URL_RE) || []).map(cleanUrl));

// 1
for (const [k, s] of Object.entries(sources)) if (s.url && !content.includes(s.url)) errors.push(`1 sources.${k}: la URL no está en el archivo del curso → ${s.url}`);

// 2
const walk = (dir) => fs.existsSync(path.join(ROOT, dir)) ? fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
const files = walk('js').concat(walk('css')).concat(['index.html']).filter((f) => /\.(js|css|html)$/.test(f));
for (const f of files) {
  if (f.replace(/\\/g, '/') === 'js/data/sources.js') continue;
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of src.matchAll(URL_RE)) {
    const u = cleanUrl(m[0]);
    if (!urls.has(u) && !commandUrls.has(u)) errors.push(`2 ${f}: URL fuera de sources.js → ${u}`);
  }
}

// 4: keys used nowhere (figures, markup in data, ui code)
const used = new Set();
(D.figures || []).forEach((f) => (f.fuentes || []).forEach((k) => used.add(k)));
const allData = JSON.stringify(D);
for (const m of allData.matchAll(/ref:([a-z0-9-]+)/g)) used.add(m[1]);
for (const f of walk('js/ui')) { const s = fs.readFileSync(path.join(ROOT, f), 'utf8'); for (const k of Object.keys(sources)) if (s.includes(`'${k}'`)) used.add(k); }
for (const m of allData.matchAll(/"(?:links?|link)":\s*(\[[^\]]*\]|"[a-z0-9-]+")/g)) { for (const k of m[1].matchAll(/"([a-z0-9-]+)"/g)) used.add(k[1]); }
const unused = Object.keys(sources).filter((k) => !used.has(k) && sources[k].url);
if (unused.length) info.push(`4 claves sin uso (${unused.length}): ${unused.join(', ')}`);

// 3
if (!process.argv.includes('--no-browser')) {
  const { launchBrowser } = await import('./lib/browser.mjs');
  const b = await launchBrowser({ width: 1280, height: 900, timeout: 10 * 60 * 1000 });
  try {
    await b.open(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await new Promise((r) => setTimeout(r, 1200));
    const routes = ['', 'programa', 'ejes', 'cuaderno', 'plantillas', 'evidencia', 'herramientas', 'glosario', 'fuentes', 'correcciones', 'proyecto', 'acerca'].concat([1, 2, 3, 4, 5, 6, 7, 8].map((n) => 'sesion/' + n));
    let total = 0;
    for (const r of routes) {
      await b.evaluate(`(location.hash = '#/${r}', true)`);
      await new Promise((res) => setTimeout(res, 900));
      const bad = await b.evaluate(`Array.from(document.querySelectorAll('a[href^="http"]')).map(function (a) {
        var rel = (a.getAttribute('rel') || '').split(/\\s+/);
        var ok = a.target === '_blank' && rel.indexOf('noopener') >= 0 && rel.indexOf('noreferrer') >= 0 && /enlace externo/.test(a.textContent);
        return ok ? null : a.href + ' «' + a.textContent.slice(0, 40) + '»';
      }).filter(Boolean)`);
      total += await b.evaluate(`document.querySelectorAll('a[href^="http"]').length`);
      bad.forEach((x) => errors.push(`3 #/${r}: enlace externo sin target, rel o etiqueta → ${x}`));
    }
    info.push(`3 ${total} enlaces externos revisados en ${routes.length} vistas`);
  } finally { await b.close(); }
}

const print = (label, list) => { if (list.length) console.log(`\n${label} (${list.length})\n` + list.map((x) => '  · ' + x).join('\n')); };
print('ERRORES', errors);
print('Información', info);
console.log(`\ncheck-links: ${errors.length} errores · ${urls.size} URL en sources.js`);
process.exit(errors.length ? 1 : 0);
