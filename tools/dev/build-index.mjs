// Writes index.html with every script in the order of base §1.2:
// core, data, assets manifests, engine, style, course, videos, slides, ui, main.
// Run after adding or removing a file under js/:  node tools/dev/build-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ls = (dir) => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith('.js')).sort().map((f) => `${dir}/${f}`);
};
const ordered = (dir, first) => {
  const all = ls(dir);
  const head = first.map((f) => `${dir}/${f}`).filter((f) => all.includes(f));
  return head.concat(all.filter((f) => !head.includes(f)));
};

const groups = [
  ['core', ordered('js/core', ['namespace.js', 'store.js', 'router.js'])],
  ['data', ls('js/data').concat(ls('js/data/sesiones'))],
  ['assets', ['assets/audio/manifest.js', 'assets/video/index.js']],
  ['engine', ordered('js/engine', ['rng.js', 'easing.js', 'legend.js', 'layers.js', 'captions.js', 'timeline.js', 'charts.js', 'cards.js', 'narrator.js', 'player.js', 'recorder.js'])],
  ['style', ordered('js/style', ['tokens.js', 'primitives.js', 'signs.js', 'marks.js', 'lettering.js', 'machine.js', 'people.js', 'backgrounds.js', 'page.js', 'testsheet.js'])],
  ['course', ordered('js/course', ['pictos.js', 'props.js', 'lamp-family.js', 'places.js', 'diagrams.js', 'stamps.js', 'signs.js'])],
  ['videos', ls('js/videos')],
  ['slides', ls('js/slides')],
  ['ui', ordered('js/ui', ['components.js', 'shell.js'])],
  ['main', ['js/main.js']]
];

const scripts = groups.map(([name, files]) =>
  `  <!-- ${name} -->\n` + files.map((f) => `  <script defer src="${f}"></script>`).join('\n')).join('\n');

const html = `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Curso de IA: habilidades para la investigación</title>
  <meta name="description" content="Sitio del curso de IA para la investigación en ciencias sociales y económicas: sesiones, videos, plantillas y cuaderno del proyecto. Funciona sin conexión.">
  <!-- no icon: otherwise a served copy asks for /favicon.ico at the server root (404 in the console) -->
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/print.css">
${scripts}
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <div id="storage-warning" class="storage-warning" role="status" hidden></div>
  <header class="site-header" id="site-header"></header>
  <main id="main" class="view" tabindex="-1">
    <noscript><p>Este sitio necesita JavaScript para mostrar las sesiones, los videos y el cuaderno.</p></noscript>
  </main>
  <footer class="site-footer" id="site-footer"></footer>
  <div id="aria-live" class="sr-only" aria-live="polite"></div>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html: ' + groups.reduce((n, g) => n + g[1].length, 0) + ' scripts');
