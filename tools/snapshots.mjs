// Review frames (base §7): headless Chromium renders, through index.html?render=<id>, one frame at
// the midpoint of every voice line and of every discussion pause card (linear mode), plus the
// poster; writes review/<id>/NN-<scene>-<k>.png and a contact sheet review/<id>/contact.png.
//   node tools/snapshots.mjs                 every video
//   node tools/snapshots.mjs v1 v3           some videos
//   node tools/snapshots.mjs v1 --scene caso only one scene (all its lines)
//   node tools/snapshots.mjs --estilo        the style test sheet → review/estilo/page-1.png, page-2.png
//   node tools/snapshots.mjs --slides 3      the live slides of session 3 → review/slides-3/*.png
//   --no-subs  frames without subtitles · --at v1:12.5  one frame at a time (seconds)
// Exits with code 1 when the page logs console errors.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = pathToFileURL(path.join(ROOT, 'index.html')).href;
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const ids = args.filter((a, i) => /^v\d+$/.test(a) && !['--scene', '--at', '--slides'].includes(args[i - 1]));

function savePng(file, dataUrl) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

async function waitReady(b) {
  for (let i = 0; i < 200; i++) {
    const r = await b.evaluate('({ ready: !!window.renderReady, err: window.renderError || null })');
    if (r.err) throw new Error(r.err);
    if (r.ready) return;
    await new Promise((res) => setTimeout(res, 50));
  }
  throw new Error('render mode not ready');
}

const CONTACT = `(function (times, cols) {
  var src = document.querySelector('canvas');
  var tw = 320, th = 180, rows = Math.ceil(times.length / cols);
  var sheet = document.createElement('canvas');
  sheet.width = cols * tw; sheet.height = rows * (th + 22);
  var g = sheet.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, sheet.width, sheet.height);
  times.forEach(function (it, i) {
    window.renderFrame(it.t, { subtitles: it.subs });
    var x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 22);
    g.drawImage(src, x, y, tw, th);
    g.fillStyle = '#000000'; g.font = '13px sans-serif';
    g.fillText(it.label, x + 4, y + th + 15);
  });
  return sheet.toDataURL('image/png');
})`;

async function snapVideo(b, id) {
  await b.open(`${INDEX}?render=${id}`);
  await waitReady(b);
  const tl = await b.evaluate('window.videoTimeline');
  const subs = !flag('--no-subs');
  const only = val('--scene');
  const shots = [];
  tl.scenes.forEach((s, si) => {
    if (only && s.id !== only) return;
    if (!s.lines.length) shots.push({ t: (s.start + s.end) / 2, label: `${si + 1} ${s.id}`, file: `${String(si + 1).padStart(2, '0')}-${s.id}-0` });
    s.lines.forEach((l, k) => shots.push({ t: (l.start + l.end) / 2, label: `${si + 1} ${s.id} · ${k + 1}`, file: `${String(si + 1).padStart(2, '0')}-${s.id}-${k + 1}` }));
    if (!only) {
      tl.segments.filter((g) => g.after === s.id).forEach((g, k) => shots.push({ t: (g.start + g.end) / 2, label: `${si + 1} ${s.id} · pausa`, file: `${String(si + 1).padStart(2, '0')}-${s.id}-pausa${k + 1}` }));
    }
  });
  const dir = path.join(ROOT, 'review', id);
  if (!only) fs.rmSync(dir, { recursive: true, force: true });
  for (const sh of shots) {
    const url = await b.evaluate(`(window.renderFrame(${sh.t}, { subtitles: ${subs} }), document.querySelector('canvas').toDataURL('image/png'))`);
    savePng(path.join(dir, sh.file + '.png'), url);
  }
  if (!only) {
    const sheet = await b.evaluate(`${CONTACT}(${JSON.stringify(shots.map((s) => ({ t: s.t, label: s.label, subs })))}, 4)`, 180000);
    savePng(path.join(dir, 'contact.png'), sheet);
  }
  const mins = Math.floor(tl.duration / 60), secs = Math.round(tl.duration % 60);
  console.log(`${id}: ${shots.length} frames · ${mins}:${String(secs).padStart(2, '0')} → review/${id}/`);
}

async function main() {
  const b = await launchBrowser({ width: 1280, height: 720, timeout: 30 * 60 * 1000 });
  let failed = false;
  try {
    if (flag('--estilo')) {
      for (const page of ['1', '2']) {
        await b.open(`${INDEX}?render=estilo&page=${page}`);
        await waitReady(b);
        savePng(path.join(ROOT, 'review', 'estilo', `page-${page}.png`), await b.evaluate(`document.querySelector('canvas').toDataURL('image/png')`));
      }
      console.log('estilo: 2 pages → review/estilo/');
    } else if (val('--slides')) {
      const n = val('--slides');
      await b.open(`${INDEX}?render=slide:${n}-1`);
      await waitReady(b);
      const count = await b.evaluate(`(window.IAHI.slides && window.IAHI.slides.count) ? window.IAHI.slides.count(${JSON.stringify(n)}) : 0`);
      for (let k = 1; k <= count; k++) {
        await b.open(`${INDEX}?render=slide:${n}-${k}`);
        await waitReady(b);
        savePng(path.join(ROOT, 'review', `slides-${n}`, `slide-${String(k).padStart(2, '0')}.png`), await b.evaluate(`document.querySelector('canvas').toDataURL('image/png')`));
      }
      console.log(`slides ${n}: ${count} → review/slides-${n}/`);
    } else if (val('--at')) {
      const [id, t] = val('--at').split(':');
      await b.open(`${INDEX}?render=${id}`);
      await waitReady(b);
      const url = await b.evaluate(`(window.renderFrame(${parseFloat(t)}, { subtitles: ${!flag('--no-subs')} }), document.querySelector('canvas').toDataURL('image/png'))`);
      savePng(path.join(ROOT, 'review', id, `at-${t}.png`), url);
      console.log(`${id} @ ${t}s → review/${id}/at-${t}.png`);
    } else {
      const list = ids.length ? ids : await (async () => {
        await b.open(`${INDEX}?render=v1`);
        await waitReady(b);
        return b.evaluate('window.IAHI.data.videos.map(function (v) { return v.id; })');
      })();
      for (const id of list) await snapVideo(b, id);
    }
  } finally {
    if (b.errors.length) {
      failed = true;
      console.error('Errores en la consola:\n' + [...new Set(b.errors)].slice(0, 30).join('\n'));
    }
    await b.close();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
