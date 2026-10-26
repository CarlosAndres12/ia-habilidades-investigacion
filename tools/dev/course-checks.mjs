// Course checks of spec §10.2 that can be computed (runs the site's own code in headless Chromium):
// agreement calculator (5), token ratio (6), bias audit before any row (7), «Modo clase» timers (9),
// implication cards and legend items (1), «Revisar antes de clase» cards (2, 14), sorting games (4).
//   node tools/dev/course-checks.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from '../lib/browser.mjs';
import { ROOT } from '../lib/load-data.mjs';

const b = await launchBrowser({ width: 1280, height: 900, timeout: 5 * 60 * 1000 });
let failed = 0;
const check = (name, ok, detail) => { if (!ok) failed++; console.log(`${ok ? 'ok   ' : 'FALLA'} ${name}${detail ? ' · ' + detail : ''}`); };
try {
  await b.open(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await new Promise((r) => setTimeout(r, 1500));
  const r = await b.evaluate(`(function () {
    var ui = IAHI.ui, W = IAHI.data.widgets, out = {};
    var a1 = ui.agreement('A A A A A B B B B B'.split(' '), 'A A A A B B B B B A'.split(' '));
    out.a1 = ui.agreementText(a1);
    var a2 = ui.agreement('A A B B'.split(' '), 'A A B B'.split(' '));
    out.a2 = ui.agreementText(a2);
    out.reading = ui.alphaReading(a1.alpha);
    out.ratio = ui.tokenRatio('155', '100');
    out.ratio0 = ui.tokenRatio('0', '100');
    out.ratioX = ui.tokenRatio('abc', '100');
    out.audit = ui.auditStats([]);
    out.debate = W.debate.timer.reduce(function (s, x) { return s + x[1]; }, 0);
    out.lab1 = W.claseTimers[6][0].segments.reduce(function (s, x) { return s + x[1]; }, 0);
    out.lab2 = W.claseTimers[7][0].segments.reduce(function (s, x) { return s + x[1]; }, 0);
    out.pres = W.presentaciones.segments.reduce(function (s, x) { return s + x[1]; }, 0);
    // implications: every one carries legend items
    var imps = ui.allImplications();
    out.impl = imps.length; out.implNoAxis = imps.filter(function (x) { return !(x.imp.axes || []).length; }).length;
    // sorting games: every card has a bin among the bins, an explanation and a hint
    var bad = [];
    Object.keys(IAHI.data.juegos).forEach(function (k) {
      var el = ui.widgets.clasificar(k);
      var cards = el.querySelectorAll('.game-card').length;
      if (!cards) bad.push(k + ': sin tarjetas');
    });
    out.games = bad;
    // review cards show the consultation date
    var miss = [];
    IAHI.data.figures.filter(function (f) { return f.estado === 'Revisar antes de clase'; }).forEach(function (f) {
      var c = ui.figureCardHTML(f.id);
      if (c.textContent.indexOf(IAHI.data.ui.consultedShort) < 0) miss.push(f.id);
    });
    out.review = miss;
    var matiz = [];
    IAHI.data.figures.filter(function (f) { return f.estado === 'Con matiz'; }).forEach(function (f) {
      var c = ui.figureCardHTML(f.id);
      if (c.textContent.indexOf(f.alcance.slice(0, 30)) < 0) matiz.push(f.id);
    });
    out.matiz = matiz;
    return out;
  })()`);
  check('5 acuerdo: 80,00 %', r.a1.pct.endsWith('80,00 %'), r.a1.pct);
  check('5 kappa 0,60', r.a1.kappa.endsWith('0,60'), r.a1.kappa);
  check('5 alfa 0,62', r.a1.alpha.endsWith('0,62'), r.a1.alpha);
  check('5 precisión y exhaustividad 0,80', r.a1.codes.every((c) => /Precisión: 0,80/.test(c) && /Exhaustividad: 0,80/.test(c)), r.a1.codes.join(' | '));
  check('5 lectura solo junto al alfa', /provisional|referencia/.test(r.reading), r.reading.slice(0, 60));
  check('5 acuerdo perfecto 100,00 %, 1,00, 1,00', r.a2.pct.endsWith('100,00 %') && r.a2.kappa.endsWith('1,00') && r.a2.alpha.endsWith('1,00'), [r.a2.pct, r.a2.kappa, r.a2.alpha].join(' · '));
  check('6 razón de tokens 155 y 100 → 1,55', r.ratio === '1,55', r.ratio);
  check('6 0 o texto → error', r.ratio0 === null && r.ratioX === null);
  check('7 auditoría sin filas: sin resultado', r.audit.diff === null && r.audit.avg.A === null);
  check('9 debate suma 20 min', r.debate === 20, String(r.debate));
  check('9 laboratorio 1 suma 120 min (curso.agenda-lab1)', r.lab1 === 120, String(r.lab1));
  check('9 laboratorio 2 suma 120 min (curso.agenda-lab2)', r.lab2 === 120, String(r.lab2));
  check('9 presentación 8 + 2 min', r.pres === 10, String(r.pres));
  check('1 implicaciones con eje', r.implNoAxis === 0, `${r.impl} implicaciones`);
  check('4 juegos con tarjetas', r.games.length === 0, r.games.join(', '));
  check('2/14 «Revisar antes de clase» con fecha de consulta', r.review.length === 0, r.review.join(', '));
  check('2 «Con matiz» con su alcance', r.matiz.length === 0, r.matiz.join(', '));
  if (b.errors.length) { failed++; console.log('Errores de consola:\n' + b.errors.join('\n')); }
} finally { await b.close(); }
process.exit(failed ? 1 : 0);
