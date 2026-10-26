// Traceability of figures (base §8.2) and the forbidden statements of spec §10.1.
//   node tools/check-figures.mjs            report; exit 1 on errors
//   node tools/check-figures.mjs --quiet    errors and warnings only
// Rules: 1 ids and source keys exist · 2 partes are literal pieces of cifra/alcance · 3 every digit
// token said or shown in a scene comes from that scene's figures (else the unit's course section:
// warning; else error) · 4 no "+", "−", "→" in voice lines · 5 no figure literals and no Spanish
// copy in video, course-drawing and slide files · 6 «Con matiz» cards render their scope · 7 the
// forbidden statements · 8 (info) rows never used.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadData, walkStrings } from './lib/load-data.mjs';

const quiet = process.argv.includes('--quiet');
const NS = loadData();
const D = NS.data;
const errors = [], warnings = [], info = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m), note = (m) => info.push(m);

const figs = D.figures || [];
const byId = Object.fromEntries(figs.map((f) => [f.id, f]));
const sources = D.sources || {};
const used = new Set();
const norm = (s) => String(s || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');

// ------------------------------------------------------------------ rule 1 + 2: the bank itself
for (const f of figs) {
  for (const k of f.fuentes || []) if (!sources[k]) err(`R1 ${f.id}: fuente «${k}» no existe en sources.js`);
  const hay = norm(f.cifra) + ' ¦ ' + norm(f.alcance);
  for (const pt of f.partes || []) {
    if (pt.valor && !hay.includes(norm(pt.valor))) err(`R2 ${f.id}: partes.valor «${pt.valor}» no está en cifra ni alcance`);
    if (pt.etiqueta && !hay.includes(norm(pt.etiqueta))) err(`R2 ${f.id}: partes.etiqueta «${pt.etiqueta}» no está en cifra ni alcance`);
  }
  if (!['Vigente', 'Con matiz', 'Revisar antes de clase'].includes(f.estado)) err(`R1 ${f.id}: estado desconocido «${f.estado}»`);
  if (!(D.badges || {})[f.tipo]) err(`R1 ${f.id}: tipo «${f.tipo}» no es una insignia de badges.js`);
}

// figure ids and ref keys inside data strings ({fig:id}, [t](ref:key))
const DATA_KEYS = Object.keys(D).filter((k) => !['figures', 'figuresById', 'sources', 'forbidden'].includes(k));
for (const key of DATA_KEYS) {
  walkStrings(D[key], (s, at) => {
    for (const m of s.matchAll(/\{fig:([a-z0-9.-]+)\}/g)) { used.add(m[1]); if (!byId[m[1]]) err(`R1 data.${key}.${at}: {fig:${m[1]}} no existe`); }
    for (const m of s.matchAll(/\]\(ref:([a-z0-9-]+)\)/g)) if (!sources[m[1]]) err(`R1 data.${key}.${at}: ref:${m[1]} no existe en sources.js`);
  });
}
// structured fig references in data (videos, widgets, juegos, slides…)
walkStrings(D, () => {});
(function scanFigFields(v, at) {
  if (Array.isArray(v)) return v.forEach((x, i) => scanFigFields(x, `${at}.${i}`));
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if ((k === 'figs' || k === 'fig' || k === 'figure' || k === 'figures') && k !== 'figuresById') {
        const ids = Array.isArray(v[k]) ? v[k] : [v[k]];
        ids.filter((x) => typeof x === 'string').forEach((id) => { used.add(id); if (!byId[id]) err(`R1 ${at}.${k}: figura «${id}» no existe`); });
      } else scanFigFields(v[k], `${at}.${k}`);
    }
  }
})(Object.fromEntries(DATA_KEYS.map((k) => [k, D[k]])), 'data');

// ------------------------------------------------------------------ JS sources: literals and comments
function jsStrings(src) {
  // returns [{ text, line }] for every string literal outside comments
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; let j = i + 1, text = '';
      while (j < n && src[j] !== q) { if (src[j] === '\\') { text += src[j + 1]; j += 2; continue; } if (src[j] === '\n') line++; text += src[j]; j++; }
      out.push({ text, line });
      i = j + 1; continue;
    }
    // regex literal (rough): skip /…/ after ( , = : [ ! & | ? { } ; or line start
    if (c === '/' && /[(,=:[!&|?{};]\s*$/.test(src.slice(Math.max(0, i - 3), i))) {
      let j = i + 1; while (j < n && src[j] !== '/' && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}
const listJs = (dir) => fs.existsSync(path.join(ROOT, dir)) ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f)) : [];
const SPANISH = /[áéíóúñÁÉÍÓÚÑ¿¡]/;
const WORDS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/g;
const FIGLIT = /\d\s?%|\d{1,3}(\.\d{3})+(?!\d)|\d+,\d+/;
const prefixes = new Set(figs.map((f) => f.id.split('.')[0]));

// rule 5 on video, course-drawing and slide files
for (const file of [...listJs('js/videos'), ...listJs('js/course'), ...listJs('js/slides')]) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const { text, line } of jsStrings(src)) {
    const t = text.trim();
    if (!t || t === 'use strict') continue;
    if (FIGLIT.test(t)) err(`R5 ${file}:${line}: literal con forma de cifra «${t.slice(0, 60)}»`);
    const words = t.match(WORDS) || [];
    if (SPANISH.test(t) || (words.length >= 2 && /\s/.test(t) && !/^[\w-]+(\s[\w-]+)*\s?(px|em)$/.test(t))) err(`R5 ${file}:${line}: texto en español escrito en el código «${t.slice(0, 60)}» (use texts, datos o el banco)`);
    if (/^[a-z0-9-]+\.[a-z0-9.-]+$/.test(t) && prefixes.has(t.split('.')[0])) { used.add(t); if (!byId[t]) err(`R1 ${file}:${line}: figura «${t}» no existe`); }
  }
}
// figure ids named in UI code (cards, widgets)
for (const file of listJs('js/ui')) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const { text, line } of jsStrings(src)) {
    if (/^[a-z0-9-]+\.[a-z0-9.-]+$/.test(text) && prefixes.has(text.split('.')[0])) { used.add(text); if (!byId[text]) err(`R1 ${file}:${line}: figura «${text}» no existe`); }
  }
}

// ------------------------------------------------------------------ rule 3 + 4: what scenes say and show
const content = fs.readFileSync(path.join(ROOT, 'content', 'curso-ia-habilidades.md'), 'utf8');
function sessionSection(n) {
  const re = new RegExp(`^## Sesión ${n}\\b[\\s\\S]*?(?=^## )`, 'm');
  const m = content.match(re);
  return m ? norm(m[0]) : '';
}
const TOKEN = /\d+(?:[.,]\d+)*(?:\s?%)?/g;
const isYear = (tok) => /^(1[89]\d{2}|20\d{2})$/.test(tok);
const castName = Object.fromEntries((D.cast || []).map((c) => [c.id, c.name]));
for (const v of D.videos || []) {
  const sec = sessionSection(v.session || v.unit || '');
  for (const sc of v.scenes) {
    (sc.figs || []).forEach((id) => used.add(id));
    const hay = (sc.figs || []).map((id) => byId[id] ? norm(byId[id].cifra) + ' ¦ ' + norm(byId[id].alcance) : '').join(' ¦ ');
    const units = [];
    (sc.lines || []).forEach((ln, i) => units.push({ kind: `línea ${i + 1} (${ln.voice})`, text: ln.text, line: ln, i }));
    units.push({ kind: 'Se ve', text: sc.seVe || '' });
    Object.entries(sc.texts || {}).forEach(([k, t]) => units.push({ kind: `texts.${k}`, text: t }));
    for (const u of units) {
      if (u.line) {
        if (/[+−→]/.test(u.text)) err(`R4 ${v.id}/${sc.id} ${u.kind}: contiene «+», «−» o «→»`);
        if (u.line.misreading) {
          const next = sc.lines[u.i + 1];
          if (!next || next.misreading) err(`R3 ${v.id}/${sc.id} ${u.kind}: error de lectura sin línea que lo corrija a continuación`);
          continue;
        }
        if (u.line.voice !== 'narrador' && /\d/.test(u.text)) warn(`Ficción ${v.id}/${sc.id} ${u.kind}: ${castName[u.line.voice] || u.line.voice} dice cifras: revise que no sea un resultado («${u.text.slice(0, 70)}»)`);
      }
      if (sc.ejemplo) continue;
      for (const m of norm(u.text).matchAll(TOKEN)) {
        const tok = m[0].trim();
        if (isYear(tok)) continue;
        const core = tok.replace(/\s?%$/, '');
        if (hay.includes(tok) || hay.includes(core)) continue;
        if (sec.includes(tok) || sec.includes(core)) { if (!quiet) warn(`R3 ${v.id}/${sc.id} ${u.kind}: «${tok}» no está en las cifras de la escena; aparece en la sesión ${v.session} del curso (revisar a mano)`); continue; }
        err(`R3 ${v.id}/${sc.id} ${u.kind}: «${tok}» no viene de ninguna cifra de la escena ni de la sesión ${v.session} del curso`);
      }
    }
  }
}

// ------------------------------------------------------------------ rule 6: «Con matiz» shows its scope
const cardsSrc = fs.readFileSync(path.join(ROOT, 'js/engine/cards.js'), 'utf8');
if (!/Con matiz/.test(cardsSrc) || !/alcance/.test(cardsSrc)) err('R6 js/engine/cards.js: las tarjetas «Con matiz» no muestran su alcance');
const compSrc = fs.existsSync(path.join(ROOT, 'js/ui/components.js')) ? fs.readFileSync(path.join(ROOT, 'js/ui/components.js'), 'utf8') : '';
if (compSrc && !(/Con matiz/.test(compSrc) && /alcance/.test(compSrc))) err('R6 js/ui/components.js: la tarjeta HTML no muestra el alcance de las cifras «Con matiz»');

// ------------------------------------------------------------------ rule 7: forbidden statements
const rules = (D.forbidden || []).map((r) => ({ ...r, re: new RegExp(r.match, r.flags == null ? 'i' : r.flags), un: r.unless ? new RegExp(r.unless, 'i') : null }));
function scan(text, where, opts = {}) {
  const t = norm(text);
  for (const r of rules) {
    if (r.siteOnly && !opts.site) continue;
    if (r.re.test(t) && !(r.un && r.un.test(t))) err(`R7 ${where}: «${r.desc}» → «${t.slice(0, 110)}»`);
  }
}
for (const v of D.videos || []) {
  scan(v.title, `${v.id} título`, { site: true });
  (v.chapters || []).forEach((c) => scan(c.title, `${v.id} capítulo`, { site: true }));
  (v.pauses || []).forEach((p) => scan(p.prompt, `${v.id} pausa`, { site: true }));
  for (const sc of v.scenes) {
    (sc.lines || []).forEach((ln, i) => { if (!ln.misreading) scan(ln.text, `${v.id}/${sc.id} línea ${i + 1}`, { site: true }); });
    scan(sc.seVe || '', `${v.id}/${sc.id} Se ve`, { site: true });
    Object.entries(sc.texts || {}).forEach(([k, t]) => scan(t, `${v.id}/${sc.id} texts.${k}`, { site: true }));
  }
}
figs.forEach((f) => scan(f.cifra + ' ' + f.alcance, `cifra ${f.id}`, { site: true }));
const EXEMPT_FIELDS = [/^errores\.\d+\.\d+\.said$/, /^correcciones\.\d+\.noUse$/];
for (const key of DATA_KEYS) {
  if (['videos', 'figures', 'figuresById'].includes(key)) continue;
  walkStrings(D[key], (s, at) => {
    const p = `${key}.${at}`;
    if (EXEMPT_FIELDS.some((re) => re.test(p))) return;
    scan(s, `data.${p}`, { site: true });
  });
}
for (const file of [...listJs('js/ui'), ...listJs('js/slides')]) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const { text, line } of jsStrings(src)) if (/\s/.test(text)) scan(text, `${file}:${line}`, { site: true });
}
for (const f of ['index.html', 'README.md']) {
  const abs = path.join(ROOT, f);
  if (!fs.existsSync(abs)) continue;
  fs.readFileSync(abs, 'utf8').split(/\n\s*\n/).forEach((para, i) => scan(para, `${f} §${i + 1}`, { site: f !== 'README.md' }));
}

// ------------------------------------------------------------------ rule 8: rows never used
const unused = figs.filter((f) => !used.has(f.id)).map((f) => f.id);
if (unused.length) note(`R8 cifras sin usar (${unused.length}): ${unused.join(', ')}`);

// ------------------------------------------------------------------ report
const print = (label, list) => { if (list.length) console.log(`\n${label} (${list.length})\n` + list.map((x) => '  · ' + x).join('\n')); };
print('ERRORES', errors);
print('Avisos', warnings);
if (!quiet) print('Información', info);
console.log(`\ncheck-figures: ${errors.length} errores, ${warnings.length} avisos · ${figs.length} cifras, ${(D.videos || []).length} videos`);
process.exit(errors.length ? 1 : 0);
