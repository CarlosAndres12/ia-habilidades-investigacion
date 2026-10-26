#!/usr/bin/env node
// Dev-only: content/curso-ia-habilidades.md -> js/data/*.js (verbatim text, structured).
//   node tools/dev/build-content.mjs
// Writes: js/data/course.js, schedule.js, sesiones/s1.js … s8.js, glosario.js, plantillas.js,
// bibliografia.js, hitos.js and js/data/links.js (every link of the content with a stable key).
// Links become [texto](ref:clave) in the mini-markup; keys named in the spec (spec §4.2) are fixed
// in KEYS below, every other link gets a key derived from its text.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'content', 'curso-ia-habilidades.md');
const OUT = path.join(ROOT, 'js', 'data');

// Keys fixed by the spec (§4.2): key -> substring of the URL.
const KEYS = {
  'aa-modelos': 'artificialanalysis.ai/leaderboards/models',
  'artificial-analysis': 'https://artificialanalysis.ai/',
  'latamgpt-faq': 'latamgpt.org/faq',
  'latamgpt-modelo': 'huggingface.co/latam-gpt',
  'osi-definicion': 'opensource.org/ai/open-source-ai-definition',
  'osi-pesos': 'opensource.org/ai/open-weights',
  'mullainathan-spiess2017': '10.1257/jep.31.2.87',
  'breiman2001': '10.1214/ss/1009213726',
  'athey-imbens2019': '10.1146/annurev-economics-080217-053433',
  'chen2024': '10.1162/99608f92.5317da47',
  'openai-tokens': 'what-are-tokens-and-how-to-count-them',
  'petrov2023': 'proceedings.neurips.cc/paper_files/paper/2023/hash/74bb24dca8334adce292883b4b651eda',
  'liu2024': 'arxiv.org/abs/2307.03172',
  'alphaearth': 'alphaearth-foundations',
  'earth-engine': 'GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL',
  'kozlowski2019': '10.1177/0003122419877135',
  'garg2018': '10.1073/pnas.1720347115',
  'caliskan2017': '10.1126/science.aal4230',
  'jain-wallace2019': 'arxiv.org/abs/1902.10186',
  'beto': 'github.com/dccuchile/beto',
  'sclar2024': 'arxiv.org/abs/2310.11324',
  'unesco-recomendacion': 'unesco.org/en/artificial-intelligence/recommendation-ethics',
  'ram-colombia': 'ram_informe_unesco-colombia',
  'onu-panel': 'independent-international-scientific-panel-ai',
  'onu-dialogo': 'global-dialogue-ai-governance',
  'ue-ley-ia': 'regulatory-framework-ai',
  'conpes-4144': 'conpes-4144',
  'sic-002-2024': 'Circular%20Externa%20No.%20002',
  'sic-005-2017': 'circular_superindustria_0005_2017',
  'nih-2023': 'NOT-OD-23-149',
  'chatgpt-datos': '7730893-data-controls-faq',
  'claude-terminos': 'updates-to-our-consumer-terms',
  'gemini-privacidad': 'support.google.com/gemini/answer/13594961',
  'alphafold-2021': '10.1038/s41586-021-03819-2',
  'alphafold-db': 'alphafold.ebi.ac.uk',
  'nobel-quimica-2024': 'nobelprize.org/prizes/chemistry/2024',
  'graphcast-2023': '10.1126/science.adi2336',
  'ecmwf-aifs': 'ecmwf.int/node/29308',
  'masai-2024': 'S2589-7500(24)00267-X',
  'masai-2025': 'S0140-6736(25)02464-X',
  'bm-nigeria': '10.1596/1813-9450-11125',
  'pnas-2025': '10.1073/pnas.2422633122',
  'tumaini-2019': '10.1186/s13007-019-0475-z',
  'cenicafe-2025': 'publicaciones.cenicafe.org',
  'jean2016': '10.1126/science.aaf7894',
  'rwi2022': '10.1073/pnas.2113658119',
  'indonesia2023': '10.3389/fdata.2023.1054156',
  'noy-zhang2023': '10.1126/science.adh2586',
  'brynjolfsson2025': '10.1093/qje/qjae044',
  'frontera-irregular': '10.1287/orsc.2025.21838',
  'hao2026': '10.1038/s41586-025-09922-y',
  'deepmind-imo': 'gold-medal-standard-at-the-international-mathematical-olympiad',
  'gilardi2023': '10.1073/pnas.2305016120',
  'ziems2024': '10.1162/coli_a_00502',
  'argyle2023': '10.1017/pan.2023.2',
  'bisbee2024': '10.1017/pan.2024.5',
  'korinek2023': '10.1257/jel.20231736',
  'korinek-nber2025': 'nber.org/papers/w34202',
  'walters2023': '10.1038/s41598-023-41032-5',
  'lancet2026': 'retractionwatch.com/2026/05/07',
  'gallegos2024': '10.1162/coli_a_00524',
  'atari2023': '10.31234/osf.io/5b26t',
  'santurkar2023': 'santurkar23a',
  'sharma2024': 'arxiv.org/abs/2310.13548',
  'openai-gpt4o': 'sycophancy-in-gpt-4o',
  'hofmann2024': '10.1038/s41586-024-07856-5',
  'bai2025': '10.1073/pnas.2416228122',
  'wang2025-identidades': '10.1038/s42256-025-00986-z',
  'bertrand-mullainathan2004': '10.1257/0002828042002561',
  'labonne2024': 'mlabonne/abliteration',
  'arditi2024': 'arxiv.org/abs/2406.11717',
  'wang2025-espanol': 'arxiv.org/abs/2505.17306',
  'nist-deepseek': 'caisi-evaluation-deepseek',
  'perplexity-r1-1776': 'perplexity-ai/r1-1776',
  'ai-index-2026': 'hai.stanford.edu/ai-index/2026',
  'epoch-supercomputadores': 'epoch.ai/blog/trends-in-ai-supercomputers',
  'epoch-mapa': 'epoch.ai/data/ai-data-centers/map',
  'sia-bcg': 'semiconductors.org/emerging-resilience',
  'asml-euv': 'asml.com/en/products/euv',
  'usgs-cobre-2026': 'mcs2026-copper',
  'aie-energia': 'iea.org/reports/energy-and-ai',
  'lehdonvirta2024': '10.1609/aies.v7i1.31683',
  'ilia2026': 'indicelatam.cl',
  'eeuu-plan-2025': 'americas-ai-action-plan',
  'anthropic-acceso-2026': 'fable-mythos-access',
  'ocmia-2026': 'english.news.cn/20260716',
  'reino-unido-plan-2025': 'ai-opportunities-action-plan',
  'paris-declaracion-2025': 'statement-on-inclusive-and-sustainable',
  'ocde-tablero': 'oecd.ai/en/dashboards/national',
  'undermind': 'https://www.undermind.ai/',
  'asta': 'https://asta.allen.ai/',
  'consensus': 'https://consensus.app/',
  'consensus-planes': '10087865-subscription-plans',
  'elicit': 'https://elicit.com/',
  'elicit-precios': 'elicit.com/pricing',
  'connected-papers': 'connectedpapers.com',
  'raise2025': '14651858.ED000178',
  'prisma-extensiones': 'prisma-statement.org/extensions',
  'gemini-notebook': 'notebooklm-gemini-notebook',
  'skills-estandar': 'agentskills.io/clients',
  'cc-plugins': 'code.claude.com/docs/en/plugins',
  'cc-subagentes': 'code.claude.com/docs/en/sub-agents',
  'cowork-seguridad': '13364135-use-claude-cowork-safely',
  'apa-ia': 'cite-generative-ai-references',
  'cope-ia': 'authorship-and-ai-tools',
  'prisma-traice': 'ai.jmir.org/2025/1/e80247',
  'mcp-fundacion': 'donating-the-model-context-protocol',
  'caso-claude-code': 'simonwillison.net/2025/Dec/9/claude',
  'caso-antigravity': 'google_antigravity_wipes_d_drive',
  'caso-comet': 'comet-prompt-injection',
  'caso-replit': 'replit_saastr_vibe_coding_incident',
  'caso-preprints': 'researchers-hide-prompts-in-scientific-papers',
  'openai-inyeccion': 'hardening-atlas-against-prompt-injection',
  'building-agents': 'building-effective-agents',
  'context-engineering': 'effective-context-engineering-for-ai-agents',
  'prompt-engineering': 'prompt-engineering/overview',
  'opencode-go': 'https://opencode.ai/go',
  'opencode-docs-go': 'opencode.ai/docs/go',
  'opencode-proveedores': 'opencode.ai/docs/providers',
  'opencode-descarga': 'opencode.ai/download',
  'claude-precios': 'claude.com/pricing',
  'codex-precios': 'learn.chatgpt.com/docs/pricing',
  'antigravity-precios': 'antigravity.google/pricing',
  'claude-code-escritorio': 'code.claude.com/docs/en/desktop',
  'claude-code-setup': 'code.claude.com/docs/en/setup',
  'codex-windows': 'codex/windows/windows-app',
  'claude-cowork-web': '15520349-use-cowork-on-web-desktop-and-mobile',
  'chatgpt-app-escritorio': 'help.openai.com/en/articles/20001276',
  'scholar-labs': 'scholar.googleblog.com',
  'researchrabbit': 'researchrabbit.ai/pricing',
  'gemini-notebook-limites': 'gemininotebook/answer/16213268',
  'datavoyager': 'asta-datavoyager',
  'claude-archivos': '12111783-create-and-edit-files-with-claude',
  'lmstudio-trabajo': 'lmstudio.ai/blog/free-for-work',
  'ollama-biblioteca': 'ollama.com/library',
  'asta-blog': 'allenai.org/blog/asta',
  'gemini-planes': 'gemini.google/subscriptions',
  'lmstudio-requisitos': 'lmstudio.ai/docs/app/system-requirements',
  'vaswani2017': 'arxiv.org/abs/1706.03762',
  'devlin2019': 'arxiv.org/abs/1810.04805',
  'gentzkow2019': '10.1257/jel.20181020',
  'unesco-guia-genai': 'guidance-generative-ai-education-and-research',
  'lmstudio': 'https://lmstudio.ai/',
  'ollama': 'https://ollama.com/',
  'zotero': 'zotero.org',
  'bishop2024': 'bishopbook.com',
  'anthropic-glosario': 'about-claude/glossary',
  'findingeliza': 'findingeliza.org',
  'masswerk-eliza': 'masswerk.at/elizabot',
  'transformer-explainer': 'transformer-explainer',
  'tensorflow-playground': 'playground.tensorflow.org',
  'tiktokenizer': 'tiktokenizer.vercel.app',
  'tokenization-fairness': 'tokenization-fairness',
  'embedding-projector': 'projector.tensorflow.org',
  'pdfm-google': 'population-dynamics-a-foundation-model',
  'llm-visualization': 'bbycroft.net/llm',
  'olmo': 'allenai.org/olmo',
  'apertus': 'swiss-ai/Apertus',
  'smollm3': 'SmolLM3-3B'
};

// ------------------------------------------------------------------ markdown blocks
function unescape(s) { return s.replace(/\\([\[\]_~*\\#.()>-])/g, '$1').replace(/&#91;/g, '['); }

function linkRe() { return /\[([^\]]+)\]\((<[^>]+>|[^)\s]+)\)/g; }

const linkTable = new Map();   // url -> { key, label, firstText }
const usedKeys = new Set();
function keyForUrl(url, text) {
  if (linkTable.has(url)) return linkTable.get(url).key;
  let key = null;
  // exact matches first ('https://…/' style entries), then substrings
  for (const [k, pat] of Object.entries(KEYS)) { if (pat.startsWith('http') && (url === pat || url === pat.replace(/\/$/, ''))) { key = k; break; } }
  if (!key) for (const [k, pat] of Object.entries(KEYS)) { if (!pat.startsWith('http') && url.includes(pat)) { key = k; break; } }
  if (!key) {
    key = slug(text).slice(0, 40) || 'enlace';
    if (/youtube\.com/.test(url)) key = 'video-' + key;
    let k2 = key, n = 2;
    while (usedKeys.has(k2)) k2 = key + '-' + n++;
    key = k2;
  }
  usedKeys.add(key);
  linkTable.set(url, { key, url, text });
  return key;
}
function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function inline(s) {
  s = s.replace(linkRe(), (m, text, url) => {
    url = url.replace(/^<|>$/g, '');
    const key = keyForUrl(url, unescape(text));
    return `[${unescape(text)}](ref:${key})`;
  });
  return unescape(s).replace(/\s+$/, '');
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    let m;
    if ((m = /^```(\w*)\s*$/.exec(ln))) {
      const lang = m[1] || 'text';
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'code', lang, text: buf.join('\n') });
      continue;
    }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(ln))) { blocks.push({ type: 'h', level: m[1].length, text: inline(m[2]) }); i++; continue; }
    if (/^\|/.test(ln)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => inline(c.trim()));
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells).filter((r) => r.some((c) => c));
      blocks.push({ type: 'table', head, rows: body });
      continue;
    }
    if (/^\s*[-*] \[[ x]\] /.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] \[[ x]\] /.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*[-*] \[[ x]\] /, ''))); i++; }
      blocks.push({ type: 'check', items });
      continue;
    }
    if (/^\s*[-*] /.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
        let it = lines[i].replace(/^\s*[-*] /, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i])) { it += ' ' + lines[i].trim(); i++; }
        items.push(inline(it));
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\s*\d+\. /.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) {
        let it = lines[i].replace(/^\s*\d+\. /, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+\. /.test(lines[i])) { it += ' ' + lines[i].trim(); i++; }
        items.push(inline(it));
      }
      blocks.push({ type: 'ol', items });
      continue;
    }
    const buf = [ln.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4} |\||```|\s*[-*] |\s*\d+\. )/.test(lines[i])) { buf.push(lines[i].trim()); i++; }
    blocks.push({ type: 'p', text: inline(buf.join(' ')) });
  }
  return blocks;
}

// split blocks into sections by heading level
function sections(blocks, level) {
  const out = [];
  let cur = { title: null, blocks: [] };
  for (const b of blocks) {
    if (b.type === 'h' && b.level === level) {
      if (cur.title || cur.blocks.length) out.push(cur);
      cur = { title: b.text, blocks: [] };
    } else cur.blocks.push(b);
  }
  if (cur.title || cur.blocks.length) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ implications (legend tags)
const AXES = [
  ['etica-datos', /^(ética y protección de datos)/i],
  ['reproducibilidad', /^(reproducibilidad)/i],
  ['transparencia', /^(transparencia)/i],
  ['integridad', /^(integridad)/i],
  ['equidad', /^(equidad)/i],
  ['validez', /^(validez( causal)?)/i]
];
function tagImplication(text) {
  const m = /^\*\*([^*]+?)\.?\*\*\s*(.*)$/.exec(text);
  if (!m) return null;
  const lead = m[1].replace(/\.$/, '');
  for (const [id, re] of AXES) if (re.test(lead)) return { axes: [id], lead, text: m[2] };
  return null;
}
function tagParenthetical(text) {
  // «(validez)», «(validez y transparencia)», «(integridad)» in the labs
  const found = [];
  const re = /\((validez|reproducibilidad|transparencia|integridad|equidad|ética y protección de datos)( y (validez|reproducibilidad|transparencia|integridad|equidad|ética y protección de datos))?\)/gi;
  let m;
  while ((m = re.exec(text))) {
    [m[1], m[3]].filter(Boolean).forEach((w) => {
      const id = /ética/i.test(w) ? 'etica-datos' : w.toLowerCase();
      if (!found.includes(id)) found.push(id);
    });
  }
  return found;
}

// ------------------------------------------------------------------ build
// Site wording (spec §2 «Language about AI», §10.1): where the content gives a mechanism a human verb
// or drops a qualifier that a figure must carry, the site uses the glossary's wording. The content file
// itself stays verbatim; each change is listed here so it can be reviewed.
const SITE_WORDING = [
  ['los suma y decide cuánto activarse', 'los suma y calcula cuánto se activa'],
  ['Cada token mira a los demás y decide cuánto pesa cada uno', 'Cada token pondera a los demás, y calcula cuánto pesa cada uno,'],
  ['cuántos artículos leen completos y cuándo deciden que terminaron', 'cuántos artículos leen completos y cuándo se detienen'],
  ['donde el modelo decide el proceso y las herramientas', 'donde el modelo define el proceso y las herramientas'],
  ['en el análisis de 2026, más del 98 %', 'en el análisis preliminar de 2026, más del 98 %'],
  // the four figures of the original document were transcribed as text in the content file; the site
  // draws them (videos, diagrams, the exact chart), so their transcription notes are dropped here
  ['**Figura del documento original: «Un LLM es un caso particular de la IA, no su sinónimo».** Cuatro niveles anidados, del más general al más específico (diagrama transcrito como lista; cada nivel está dentro del anterior):',
   '**Figura: «Un LLM es un caso particular de la IA, no su sinónimo».** Cuatro niveles anidados, del más general al más específico; cada nivel está dentro del anterior:'],
  ['**Figura del documento original: «Los mejores modelos abiertos van 12 puntos detrás de los cerrados».** Artificial Analysis, índice de inteligencia, 22 de octubre de 2026; los seis primeros abiertos son chinos (gráfico de barras transcrito como tabla).',
   '**Figura: «Los mejores modelos abiertos van 12 puntos detrás de los cerrados».** El gráfico exacto, con su fuente y su fecha, está en la «Foto de referencia de Artificial Analysis» de esta sección.'],
  ['**Figura del documento original: «Un LLM escribe un token a la vez».** Seis pasos en ciclo; recorrido simplificado con el caso común del curso; los ejemplos de cada paso son ilustrativos (diagrama transcrito como lista):',
   '**Figura: «Un LLM escribe un token a la vez».** Seis pasos en ciclo; recorrido simplificado con el caso común del curso; los ejemplos de cada paso son ilustrativos:'],
  ['**Figura del documento original: «Un agente repite un ciclo hasta cumplir el objetivo; la persona revisa al final».** Cinco pasos y una decisión (diagrama transcrito como lista):',
   '**Figura: «Un agente repite un ciclo hasta cumplir el objetivo; la persona revisa al final».** Cinco pasos y una decisión:']
];
const md = SITE_WORDING.reduce((s, [a, b]) => {
  if (!s.includes(a)) throw new Error('SITE_WORDING: no se encontró «' + a + '» en el curso');
  return s.split(a).join(b);
}, readFileSync(SRC, 'utf-8'));
const all = parseBlocks(md.split('\n')).filter((b) => !(b.type === 'table' && b.head.join('|') === 'Grupo|Modelo|Empresa|País|Índice de inteligencia'));
const top = sections(all, 2);       // [ {title:null (h1, date, note)}, Programa, Sesión 1..8, Anexos ]

const programa = top.find((s) => s.title && /^Programa del curso/.test(s.title));
const anexos = top.find((s) => s.title && /^Anexos/.test(s.title));
const sesiones = top.filter((s) => s.title && /^Sesión \d/.test(s.title));

function serialize(name, obj) {
  return `/* GENERATED by tools/dev/build-content.mjs from content/curso-ia-habilidades.md — edit the content and re-run. */\n` +
    `window.IAHI.data.${name} = ${JSON.stringify(obj, null, 1)};\n`;
}

mkdirSync(path.join(OUT, 'sesiones'), { recursive: true });

// course.js: program subsections (verbatim blocks)
const prog = sections(programa.blocks, 3).map((s) => ({ title: s.title, blocks: s.blocks }));
writeFileSync(path.join(OUT, 'course.js'), serialize('programa', prog));

// sessions
const schedule = [];
sesiones.forEach((s, idx) => {
  const n = idx + 1;
  const m = /^Sesión (\d+) — (.*)$/.exec(s.title);
  const subs = sections(s.blocks, 3);
  const intro = subs[0] && !subs[0].title ? subs[0].blocks : [];
  const parts = subs.filter((x) => x.title).map((x) => {
    const part = { title: x.title, blocks: x.blocks };
    // implications: "**Implicaciones para la investigación**" paragraph followed by a list
    const imps = [];
    x.blocks.forEach((b, k) => {
      if (b.type === 'p' && /^\*\*(Implicaciones|Implicaciones de usar|Por qué importa)/.test(b.text)) {
        const nx = x.blocks[k + 1];
        if (nx && nx.type === 'ul') nx.items.forEach((it) => { const tg = tagImplication(it); if (tg) imps.push(tg); });
      }
      if (b.type === 'p' && /^\*\*Por qué importa/.test(b.text)) {
        const axes = tagParenthetical(b.text);
        if (axes.length) imps.push({ axes, lead: 'Por qué importa', text: b.text.replace(/^\*\*Por qué importa( para investigar)?\.?\*\*\s*/, '') });
      }
    });
    if (imps.length) part.implications = imps;
    return part;
  });
  const before = parts.find((p) => /^Antes de la sesión/.test(p.title));
  const agenda = parts.find((p) => /^Agenda/.test(p.title));
  const ag = agenda && agenda.blocks.find((b) => b.type === 'table');
  const doc = { n, title: m ? m[2] : s.title, heading: s.title, intro, parts };
  writeFileSync(path.join(OUT, 'sesiones', 's' + n + '.js'), `/* GENERATED by tools/dev/build-content.mjs — edit the content and re-run. */\nwindow.IAHI.data.sesiones = window.IAHI.data.sesiones || {};\nwindow.IAHI.data.sesiones[${n}] = ${JSON.stringify(doc, null, 1)};\n`);
  schedule.push({
    n, title: doc.title,
    before: before ? before.title.replace(/^Antes de la sesión\s*/, '').replace(/^\(|\)$/g, '') : '',
    agenda: ag ? ag.rows.map((r) => ({ minutes: r[0], block: r[1], dynamic: r[2] })) : [],
    agendaTitle: agenda ? agenda.title : ''
  });
});
// session map rows (program table) for products
const mapa = prog.find((s) => /Mapa de sesiones/.test(s.title));
const mapTable = mapa && mapa.blocks.find((b) => b.type === 'table');
if (mapTable) mapTable.rows.forEach((r) => {
  const it = schedule.find((s) => String(s.n) === r[0]);
  if (it) { it.module = r[1]; it.beforeTask = r[2]; it.product = r[3]; }
});
writeFileSync(path.join(OUT, 'schedule.js'), serialize('schedule', schedule));

// annexes
const anx = sections(anexos.blocks, 3);
const glos = anx.find((s) => /^A\. Glosario/.test(s.title));
const glosTables = glos.blocks.filter((b) => b.type === 'table');
const glosLabels = glos.blocks.filter((b) => b.type === 'p').map((b) => b.text.replace(/\*\*/g, ''));
const glosario = [];
glosTables.forEach((t, i) => t.rows.forEach((r) => glosario.push({ term: r[0], def: r[1], table: glosLabels[i] || '' })));
writeFileSync(path.join(OUT, 'glosario.js'), serialize('glosario', glosario));

const plant = anx.find((s) => /^B\. Plantillas/.test(s.title));
const templates = [];
let cur = null;
plant.blocks.forEach((b) => {
  const m = b.type === 'p' && /^\*\*(B\d)\. ([^*]+?)\*\*\.?\s*(.*)$/.exec(b.text);
  if (m) { cur = { id: m[1], title: m[2].replace(/\.$/, ''), note: m[3] || '', blocks: [] }; templates.push(cur); return; }
  if (cur) cur.blocks.push(b);
});
writeFileSync(path.join(OUT, 'plantillas.js'), serialize('plantillas', templates));

const bib = anx.find((s) => /^C\. Bibliografía/.test(s.title));
writeFileSync(path.join(OUT, 'bibliografia.js'), serialize('bibliografia', { title: bib.title, blocks: bib.blocks }));

// hitos (timeline of §1.2)
const s1 = sesiones[0];
const lt = sections(s1.blocks, 3).find((x) => /^1\.2/.test(x.title));
const hitosTable = lt.blocks.find((b) => b.type === 'table');
writeFileSync(path.join(OUT, 'hitos.js'), serialize('hitos', hitosTable.rows.map((r) => ({ year: r[0], hito: r[1], why: r[2] }))));

// ------------------------------------------------------------------ structured data for the widgets (spec §4.3)
// Tables are located by their header row, so a reordered content file still builds.
const allParts = [];
sesiones.forEach((s, idx) => sections(s.blocks, 3).forEach((x) => { if (x.title) allParts.push({ n: idx + 1, title: x.title, blocks: x.blocks }); }));
function findTable(n, firstHead, alsoHead) {
  for (const p of allParts) {
    if (n && p.n !== n) continue;
    for (const b of p.blocks) if (b.type === 'table' && b.head[0] === firstHead && (!alsoHead || b.head.includes(alsoHead))) return { head: b.head, rows: b.rows, part: p.title };
  }
  throw new Error('table not found: ' + firstHead);
}
function findPart(n, re) { const p = allParts.find((x) => x.n === n && re.test(x.title)); if (!p) throw new Error('part not found: ' + re); return p; }
function findPara(n, re) {
  for (const p of allParts) { if (n && p.n !== n) continue; for (const b of p.blocks) if (b.type === 'p' && re.test(b.text)) return b.text; }
  throw new Error('paragraph not found: ' + re);
}
const quoted = (t) => { const m = /«([^»]+)»/.exec(t); return m ? m[1] : ''; };

writeFileSync(path.join(OUT, 'modelos.js'), serialize('modelos', {
  categorias: findTable(1, 'Categoría', 'Qué se publica'),
  actividad: findTable(1, 'Modelo', 'Precio por millón de tokens').head
}));
const s3sesgo = findPart(3, /^3\.3/);
writeFileSync(path.join(OUT, 'sesgo.js'), serialize('sesgo', {
  sesgos: findTable(3, 'Sesgo', 'Evidencia'),
  instruccion: (s3sesgo.blocks.find((b) => b.type === 'code') || {}).text || ''
}));
writeFileSync(path.join(OUT, 'marcos.js'), serialize('marcos', {
  marcos: findTable(3, 'Marco', 'Qué es'),
  privacidad: findTable(3, 'Herramienta', '¿Se usan las conversaciones para entrenar?')
}));
const demo = findPara(5, /^\*\*Demo de inyección/);
writeFileSync(path.join(OUT, 'riesgos.js'), serialize('riesgos', {
  riesgos: findTable(5, 'Riesgo', 'Cómo se reduce'),
  casos: findTable(5, 'Fecha', 'Lección'),
  demo: { instructions: demo, example: quoted(demo) }
}));
const s8 = (re) => findPart(8, re);
writeFileSync(path.join(OUT, 'rubrica.js'), serialize('rubrica', {
  estructura: (s8(/^Estructura de cada presentación/).blocks.find((b) => b.type === 'ol') || {}).items || [],
  rubrica: findTable(8, 'Criterio', 'Nivel 4'),
  antes: s8(/^Antes de la sesión/).blocks,
  agenda: s8(/^Agenda/).blocks
}));
writeFileSync(path.join(OUT, 'herramientas.js'), serialize('herramientas', {
  busqueda: findTable(4, 'Herramienta', 'Para qué sirve mejor'),
  proyectos: findTable(4, 'Herramienta', 'Qué ofrece'),
  piezas: findTable(4, 'Concepto', 'Analogía en un grupo de investigación'),
  diferencias: findTable(5, '', 'Agente'),
  entornos: findTable(5, 'Entorno', 'Qué hace'),
  lab1Opciones: findTable(6, 'Opción', 'Precio'),
  lab1Organizacion: findTable(6, 'Elemento', 'Cómo funciona'),
  lab1Instalacion: findPart(6, /^Anexo de instalación/).blocks,
  problemas: findTable(6, 'Síntoma', 'Causa probable'),
  lab2: findTable(7, 'Etapa', 'Qué ofrece gratis'),
  lab2Modelos: findTable(7, 'Modelo', 'Tamaño de descarga')
}));

// links
const links = {};
for (const v of linkTable.values()) links[v.key] = { url: v.url, text: v.text };
writeFileSync(path.join(OUT, 'links.js'), serialize('links', links));

const missing = Object.keys(KEYS).filter((k) => !links[k]);
console.log(`sessions: ${sesiones.length}; glossary: ${glosario.length}; templates: ${templates.length}; links: ${Object.keys(links).length}`);
if (missing.length) console.log('fixed keys with no link in the content:', missing.join(', '));
