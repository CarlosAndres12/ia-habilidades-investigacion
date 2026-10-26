// Frame checks of every video (base §2.4, §5.2) that a contact sheet cannot show, computed with the
// site's own code in headless Chromium (sampled every 0.5 s and at the midpoint of every voice line).
// Fails (exit 1) on: text cut (it wraps to more lines than its maxLines, the rest is dropped), a line
// wider than its maxWidth, text of a course box above or below the box, figure cards whose content
// does not fit; subtitle chunks wrapping to more than 3 lines (the band keeps 3) and, inside a voice
// line, a gap, a chunk of another line or a faded band. Notes (to review by eye, desks and floors are
// expected there): drawn content under the speaker vignette and under the subtitle band.
//   node tools/dev/frame-checks.mjs [v1 v3] [--sheets]   (--sheets: review/frame-checks/<id>-*.png)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from '../lib/browser.mjs';
import { ROOT } from '../lib/load-data.mjs';

const args = process.argv.slice(2);
const sheets = args.includes('--sheets');
const only = args.filter((a) => /^v\d+$/.test(a));
const INDEX = pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = path.join(ROOT, 'review', 'frame-checks');

const PAGE = `(function (wantSheets) {
  var NS = window.IAHI, S = NS.style, C = NS.course, CAP = NS.engine.captions, TL = NS.engine.timeline;
  var id = window.videoTimeline.id, video = NS.engine.player.videoById(id);
  var castW = {}, castBy = {};
  (NS.data.cast || []).forEach(function (c) { castW[c.id] = { wordsPerSecond: c.wordsPerSecond || 2.4 }; castBy[c.id] = c; });
  var tl = TL.build(video, { cast: castW, manifest: (NS.audioManifest || {})[id] || null });
  var cv = document.querySelector('canvas'), g = cv.getContext('2d');
  var out = { text: [], cards: [], nText: 0, nCards: 0, nChunks: 0, subs: [], vignette: [], band: [], sheets: {} };
  var seen = {}, cardKeys = {}, now = 0;
  function where() {
    for (var i = 0; i < tl.scenes.length; i++) if (now >= tl.scenes[i].start && now < tl.scenes[i].end) return (i + 1) + ' ' + tl.scenes[i].id + ', t=' + now.toFixed(1) + ' s';
    return 'pausa, t=' + now.toFixed(1) + ' s';
  }
  function note(list, key, msg) { if (!seen[key]) { seen[key] = 1; list.push(msg); } }

  // 1. text and cards, every 0.5 s
  var text0 = S.text, box0 = C.box, fig0 = NS.engine.cards.figure, v3 = C.v3 || {}, card0 = v3.card, row0 = v3.rowCard;
  var inBox = null, inCard = null;
  S.text = function (ctx, str, x, y, o) {
    var r = text0.apply(this, arguments);
    o = o || {};
    if (str == null || str === '' || !r || !r.lines || !r.lines.length) return r;
    out.nText++;
    var size = o.size || 22, label = '«' + String(str).slice(0, 70) + '» (' + where() + ')';
    if (o.maxWidth) {
      ctx.save();
      ctx.font = (o.italic ? 'italic ' : '') + (o.weight || 500) + ' ' + size + 'px ' + S.tokens.fonts.body;
      var all = CAP.wrap(ctx, NS.util && NS.util.nbsp ? NS.util.nbsp(String(str)) : String(str), o.maxWidth);
      var widest = Math.max.apply(null, all.map(function (ln) { return ctx.measureText(ln).width; }));
      ctx.restore();
      if (o.maxLines && all.length > o.maxLines) note(out.text, 'cut' + str, 'cortado: necesita ' + all.length + ' líneas y caben ' + o.maxLines + ' ' + label);
      if (widest > o.maxWidth + 2) note(out.text, 'wide' + str, 'más ancho que su espacio (' + Math.round(widest) + ' px en ' + Math.round(o.maxWidth) + ' px) ' + label);
    }
    if (inBox) {
      var n = r.lines.length, lh = r.lineHeight;
      var top = (o.vcenter ? y - (n - 1) * lh / 2 : y) - size * 0.78;
      var bottom = (o.vcenter ? y + (n - 1) * lh / 2 : y + (n - 1) * lh) + size * 0.22;
      var over = Math.max(inBox.y - top, bottom - (inBox.y + inBox.h));
      if (over > 2) note(out.text, 'box' + str, 'fuera de su caja por ' + Math.round(over) + ' px ' + label);
    }
    if (inCard) inCard.bottom = Math.max(inCard.bottom, y - size * 0.92 + r.height);
    return r;
  };
  C.box = function (ctx, b) {
    var prev = inBox;
    inBox = b;
    try { return box0.apply(this, arguments); } finally { inBox = prev; }
  };
  // engine cards shrink their text until it fits or reach 16 px: measure the lowest text edge
  NS.engine.cards.figure = function (ctx, fid, b) {
    var prev = inCard;
    inCard = { bottom: -1 };
    try {
      var r = fig0.apply(this, arguments);
      cardKeys[fid + '@' + Math.round(b.x) + ',' + Math.round(b.y)] = 1;
      var over = Math.round(inCard.bottom - (b.y + b.h));
      if (over > 0) note(out.cards, 'figure' + fid + b.y, 'tarjeta ' + fid + ' se desborda ' + over + ' px (' + where() + ')');
      return r;
    } finally { inCard = prev; }
  };
  // course v3 cards report their own overflow
  ['card', 'rowCard'].forEach(function (fn) {
    var f0 = v3[fn];
    if (!f0) return;
    v3[fn] = function (ctx, fid, b) {
      var r = f0.apply(this, arguments);
      if (r && r.overflow != null) {
        cardKeys[fn + fid + '@' + Math.round(b.x) + ',' + Math.round(b.y)] = 1;
        if (r.overflow > 0) note(out.cards, fn + fid + b.y, 'tarjeta ' + fid + ' se desborda ' + r.overflow + ' px (' + where() + ')');
      }
      return r;
    };
  });
  try {
    for (var t = 0; t < tl.duration; t += 0.5) { now = t; window.renderFrame(t, { subtitles: false }); }
  } finally {
    S.text = text0; C.box = box0; NS.engine.cards.figure = fig0;
    if (card0) v3.card = card0;
    if (row0) v3.rowCard = row0;
  }
  out.nCards = Object.keys(cardKeys).length;

  // 2. subtitles: band lines with the band's font; fade rule as in the player (0.2 s in and out, 0.25 s hold)
  var body = S.tokens.fonts.body;
  function bandLines(text, voice) {
    var who = voice !== 'narrador' && castBy[voice] ? castBy[voice].name : null;
    g.save();
    g.font = '600 32px ' + body;
    var n = CAP.wrap(g, who ? who + ': ' + text : text, 1280 - 160).length;
    g.restore();
    return n;
  }
  tl.scenes.forEach(function (sc, si) {
    sc.lines.forEach(function (L, li) {
      var tag = (si + 1) + ' ' + sc.id + ' · ' + (li + 1);
      L.chunks.forEach(function (c) {
        out.nChunks++;
        var n = bandLines(c.text, L.voice);
        if (n > 3) out.subs.push('fragmento de ' + n + ' líneas, la banda muestra 3: «' + c.text.slice(0, 60) + '» (' + tag + ')');
      });
      var bad = {};
      for (var t = L.start; t <= L.end; t += 0.04) {
        var ch = TL.chunkAt(tl, t), kind = null;
        if (!ch) kind = 'sin subtítulo';
        else if (ch.line !== L) kind = 'subtítulo de otra línea';
        else {
          var first = ch.index === 0, last = ch.index === ch.line.chunks.length - 1;
          var a = Math.min(first ? (t - ch.start) / 0.2 : 1, last ? (ch.end + 0.25 - t) / 0.2 : 1);
          if (a < 0.999 && t > L.start + 0.2) kind = 'banda atenuada';
        }
        if (kind && !bad[kind]) { bad[kind] = 1; out.subs.push(kind + ' a +' + (t - L.start).toFixed(2) + ' s de la línea (' + tag + ')'); }
      }
    });
  });

  // 3. notes: drawn content (ink or saturated pixels) under the speaker vignette (r 56 at 96, H - 214,
  // as in the player) and under the band of the chunk shown, at the midpoint of every voice line
  function count(x, y, w, h, round) {
    var d = g.getImageData(x, y, w, h).data, n = 0;
    for (var i = 0; i < d.length; i += 4) {
      var px = (i / 4) % w, py = Math.floor(i / 4 / w);
      if (round && Math.pow(px - w / 2, 2) + Math.pow(py - h / 2, 2) > Math.pow(w / 2, 2)) continue;
      var r = d[i], gg = d[i + 1], b = d[i + 2];
      if (0.2126 * r + 0.7152 * gg + 0.0722 * b < 140 || Math.max(r, gg, b) - Math.min(r, gg, b) > 70) n++;
    }
    return n;
  }
  function tile(x, y, w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, w, h); return c; }
  var vig0 = S.vignette, vTiles = [], bTiles = [];
  S.vignette = function () {};
  try {
    tl.scenes.forEach(function (sc, si) {
      sc.lines.forEach(function (L, li) {
        var t = (L.start + L.end) / 2, ch = TL.chunkAt(tl, t), tag = (si + 1) + ' ' + sc.id + ' · ' + (li + 1);
        window.renderFrame(t, { subtitles: false });
        if (L.voice !== 'narrador' && castBy[L.voice] && count(40, 450, 112, 112, true) > 150) {
          out.vignette.push(tag);
          if (wantSheets) vTiles.push({ tag: tag, c: tile(28, 438, 136, 136) });
        }
        if (ch) {
          var bandH = Math.min(3, bandLines(ch.text, ch.voice)) * 32 * 1.28 + 26, y0 = Math.round(720 - bandH - 18);
          if (count(60, y0, 1160, Math.round(bandH), false) > 150) {
            out.band.push(tag);
            if (wantSheets) bTiles.push({ tag: tag, c: tile(0, y0 - 60, 1280, 720 - y0 + 60), h: Math.round(bandH) });
          }
        }
      });
    });
  } finally { S.vignette = vig0; }
  if (wantSheets && vTiles.length) {
    var vs = document.createElement('canvas'), cols = 8;
    vs.width = cols * 156; vs.height = Math.ceil(vTiles.length / cols) * 160;
    var vg = vs.getContext('2d');
    vg.fillStyle = '#ffffff'; vg.fillRect(0, 0, vs.width, vs.height);
    vTiles.forEach(function (it, i) {
      var x = (i % cols) * 156, y = Math.floor(i / cols) * 160;
      vg.drawImage(it.c, x, y);
      vg.strokeStyle = '#ff00ff'; vg.lineWidth = 1.5; vg.beginPath(); vg.arc(x + 68, y + 68, 56, 0, Math.PI * 2); vg.stroke();
      vg.fillStyle = '#000000'; vg.font = '11px sans-serif'; vg.fillText(it.tag, x + 2, y + 150);
    });
    out.sheets.vineta = vs.toDataURL('image/png');
  }
  if (wantSheets && bTiles.length) {
    var bs = document.createElement('canvas'), bh = 0;
    bTiles.forEach(function (it) { bh += it.c.height / 2 + 6; });
    bs.width = 640; bs.height = bh;
    var bg = bs.getContext('2d'), yy = 0;
    bg.fillStyle = '#ffffff'; bg.fillRect(0, 0, bs.width, bs.height);
    bTiles.forEach(function (it) {
      bg.drawImage(it.c, 0, yy, 640, it.c.height / 2);
      bg.strokeStyle = '#ff00ff'; bg.lineWidth = 1; bg.strokeRect(30, yy + 30, 580, it.h / 2);
      bg.fillStyle = '#ff00ff'; bg.font = '11px sans-serif'; bg.fillText(it.tag, 4, yy + 12);
      yy += it.c.height / 2 + 6;
    });
    out.sheets.banda = bs.toDataURL('image/png');
  }
  return out;
})`;

async function waitReady(b) {
  for (let i = 0; i < 200; i++) {
    const r = await b.evaluate('({ ready: !!window.renderReady, err: window.renderError || null })');
    if (r.err) throw new Error(r.err);
    if (r.ready) return;
    await new Promise((res) => setTimeout(res, 50));
  }
  throw new Error('render mode not ready');
}

const b = await launchBrowser({ width: 1280, height: 720, timeout: 30 * 60 * 1000 });
let failed = 0;
const check = (name, ok, detail, list) => {
  if (!ok) failed++;
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${name}${detail ? ' · ' + detail : ''}`);
  (list || []).forEach((x) => console.log('      ' + x));
};
try {
  await b.open(`${INDEX}?render=v1`);
  await waitReady(b);
  const ids = only.length ? only : await b.evaluate('window.IAHI.data.videos.map(function (v) { return v.id; })');
  for (const id of ids) {
    await b.open(`${INDEX}?render=${id}`);
    await waitReady(b);
    const r = await b.evaluate(`${PAGE}(${sheets})`, 10 * 60 * 1000);
    check(`${id} textos sin cortar ni fuera de su espacio`, !r.text.length, `${r.nText} textos dibujados`, r.text);
    check(`${id} tarjetas sin desborde`, !r.cards.length, `${r.nCards} tarjetas`, r.cards);
    check(`${id} subtítulos de 3 líneas o menos, sin huecos ni fundidos dentro de una línea`, !r.subs.length, `${r.nChunks} fragmentos`, r.subs);
    if (r.vignette.length) console.log(`aviso ${id} dibujo bajo la viñeta del personaje (revise a ojo): ${r.vignette.join(', ')}`);
    if (r.band.length) console.log(`aviso ${id} dibujo bajo la banda de subtítulos (revise a ojo): ${r.band.join(', ')}`);
    for (const [k, d] of Object.entries(r.sheets)) {
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `${id}-${k}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
  }
  if (b.errors.length) { failed++; console.log('Errores de consola:\n' + [...new Set(b.errors)].slice(0, 30).join('\n')); }
} finally {
  await b.close();
}
if (sheets) console.log(`hojas de revisión → ${path.relative(ROOT, OUT)}/`);
process.exit(failed ? 1 : 0);
