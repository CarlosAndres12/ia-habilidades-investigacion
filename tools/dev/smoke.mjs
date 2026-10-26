// Page smoke test: opens every route of the site in headless Chromium, reports console errors and,
// with --shots, writes a full-page screenshot per route to review/pages/<route>.png.
//   node tools/dev/smoke.mjs [--shots] [--only sesion/3] [--width 1280]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from '../lib/browser.mjs';
import { ROOT } from '../lib/load-data.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const width = Number(val('--width') || 1280);
const routes = ['', 'programa', 'ejes', 'cuaderno', 'plantillas', 'evidencia', 'herramientas', 'glosario', 'fuentes', 'correcciones', 'proyecto', 'acerca', 'clase']
  .concat([1, 2, 3, 4, 5, 6, 7, 8].map((n) => 'sesion/' + n))
  .concat([1, 3, 6, 8].map((n) => 'sesion/' + n + '/clase'));
const list = val('--only') ? [val('--only')] : routes;
const INDEX = pathToFileURL(path.join(ROOT, 'index.html')).href;

const b = await launchBrowser({ width, height: 900, timeout: 15 * 60 * 1000 });
let failed = false;
try {
  await b.open(INDEX);
  await new Promise((r) => setTimeout(r, 1500));
  for (const r of list) {
    const before = b.errors.length;
    await b.evaluate(`(location.hash = '#/${r}', true)`);
    await new Promise((res) => setTimeout(res, 1200));
    const info = await b.evaluate(`({ h1: (document.querySelector('main h1') || {}).textContent || '', n: document.querySelectorAll('main *').length, err: document.querySelector('main .error') ? 1 : 0, w: document.documentElement.scrollWidth })`);
    const errs = b.errors.slice(before);
    const status = errs.length || info.err ? 'ERROR' : 'ok';
    if (status !== 'ok') failed = true;
    console.log(`${status.padEnd(5)} #/${r.padEnd(16)} ${String(info.n).padStart(5)} nodos · ${info.h1.slice(0, 60)}${info.w > width + 2 ? ' · DESBORDE HORIZONTAL ' + info.w : ''}`);
    errs.forEach((e) => console.log('      ' + String(e).split('\n').slice(0, 3).join(' | ')));
    if (flag('--shots')) {
      const m = await b.cdp('Page.getLayoutMetrics');
      const h = Math.min(16000, Math.ceil((m.cssContentSize || m.contentSize).height));
      const shot = await b.cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
      const file = path.join(ROOT, 'review', 'pages', (r || 'inicio').replace(/\//g, '-') + (width !== 1280 ? '-' + width : '') + '.png');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    }
  }
} finally {
  await b.close();
}
process.exit(failed ? 1 : 0);
