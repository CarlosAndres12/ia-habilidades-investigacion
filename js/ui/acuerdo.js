/* §8.23 «Calculadora de acuerdo» (sesión 7, ruta 2; protocolo B7): codes, per-fragment human and AI
   codes (or two pasted columns); percentage agreement, Cohen's kappa, Krippendorff's alpha (nominal,
   two coders) and per-code precision and recall with the human code as reference. The reading of
   validacion.krippendorff applies to alpha only. Pure functions in ui.agreement for the tests. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  // h, a: arrays of codes (same length). Returns { n, po, kappa, alpha, perCode: { code: { precision, recall } } }
  ui.agreement = function (h, a) {
    var pairs = [];
    for (var i = 0; i < Math.min(h.length, a.length); i++) if (h[i] && a[i]) pairs.push([h[i], a[i]]);
    var n = pairs.length;
    if (n < 2) return null;
    var codes = [];
    pairs.forEach(function (p) { [p[0], p[1]].forEach(function (c) { if (codes.indexOf(c) < 0) codes.push(c); }); });
    var agree = pairs.filter(function (p) { return p[0] === p[1]; }).length;
    var po = agree / n;
    var pe = 0;
    codes.forEach(function (c) {
      var ph = pairs.filter(function (p) { return p[0] === c; }).length / n;
      var pa = pairs.filter(function (p) { return p[1] === c; }).length / n;
      pe += ph * pa;
    });
    var kappa = pe < 1 ? (po - pe) / (1 - pe) : null;
    // Krippendorff: coincidence matrix, each unit adds both ordered pairs (two coders: weight 1)
    var o = {}, nc = {};
    codes.forEach(function (c) { o[c] = {}; codes.forEach(function (k) { o[c][k] = 0; }); nc[c] = 0; });
    pairs.forEach(function (p) { o[p[0]][p[1]] += 1; o[p[1]][p[0]] += 1; });
    codes.forEach(function (c) { codes.forEach(function (k) { nc[c] += o[c][k]; }); });
    var nn = 2 * n, dObs = 0, dExp = 0;
    codes.forEach(function (c) { codes.forEach(function (k) { if (c !== k) { dObs += o[c][k]; dExp += nc[c] * nc[k]; } }); });
    var alpha = dExp > 0 ? 1 - (nn - 1) * dObs / dExp : null;
    var perCode = {};
    codes.forEach(function (c) {
      var tp = pairs.filter(function (p) { return p[0] === c && p[1] === c; }).length;
      var aiC = pairs.filter(function (p) { return p[1] === c; }).length;
      var huC = pairs.filter(function (p) { return p[0] === c; }).length;
      perCode[c] = { precision: aiC ? tp / aiC : null, recall: huC ? tp / huC : null };
    });
    return { n: n, po: po, kappa: kappa, alpha: alpha, perCode: perCode, codes: codes };
  };
  ui.agreementText = function (r) {
    var W = NS.data.widgets.acuerdo.results;
    var f2 = function (x) { return x == null ? '—' : U.fmtNumber(x, 2); };
    return {
      pct: W.pct + ': ' + U.fmtNumber(r.po * 100, 2) + ' %',
      kappa: W.kappa + ': ' + f2(r.kappa),
      alpha: W.alpha + ': ' + f2(r.alpha),
      codes: r.codes.map(function (c) { return c + ' · ' + W.precision + ': ' + f2(r.perCode[c].precision) + ' · ' + W.recall + ': ' + f2(r.perCode[c].recall); })
    };
  };
  ui.alphaReading = function (alpha) {
    var R = NS.data.widgets.acuerdo.reading;
    if (alpha == null) return '';
    if (alpha >= 0.8) return R.high;
    if (alpha >= 0.667) return R.mid;
    return R.low;
  };

  ui.widgets.acuerdo = function () {
    var W = NS.data.widgets.acuerdo;
    var saved = NS.store.get('w:acuerdo', null) || { codes: W.codes.slice(), rows: [['', ''], ['', ''], ['', '']], example: false };
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var codesBox = U.el('div', { class: 'field' });
    var table = U.el('div');
    var res = U.el('div', { class: 'result-box', 'aria-live': 'polite' });
    var exBadge = U.el('p', { hidden: !saved.example }, [ui.badge(W.exampleBadge)]);
    function save() { NS.store.set('w:acuerdo', saved); }
    function drawCodes() {
      codesBox.innerHTML = '';
      codesBox.appendChild(U.el('label', { for: 'ac-codes', text: W.codesTitle }));
      var inp = U.el('input', { type: 'text', id: 'ac-codes', value: saved.codes.join('; ') });
      inp.addEventListener('change', function () { saved.codes = inp.value.split(';').map(function (s) { return s.trim(); }).filter(Boolean); save(); drawTable(); calc(); });
      codesBox.appendChild(inp);
    }
    function select(val, label, onChange) {
      var s = U.el('select', { 'aria-label': label }, [U.el('option', { value: '', text: '—' })].concat(saved.codes.map(function (c) { return U.el('option', { value: c, text: c }); })));
      s.value = val || '';
      s.addEventListener('change', function () { onChange(s.value); });
      return s;
    }
    function drawTable() {
      table.innerHTML = '';
      var t = U.el('table', {}, [U.el('thead', {}, [U.el('tr', {}, [U.el('th', { scope: 'col', text: W.fragment }), U.el('th', { scope: 'col', text: W.human }), U.el('th', { scope: 'col', text: W.ai }), U.el('th', { scope: 'col' }, [U.el('span', { class: 'sr-only', text: NS.data.widgets.table.remove })])])])]);
      var tb = U.el('tbody');
      saved.rows.forEach(function (r, i) {
        tb.appendChild(U.el('tr', {}, [
          U.el('th', { scope: 'row', text: String(i + 1) }),
          U.el('td', {}, [select(r[0], W.human + ' ' + (i + 1), function (v) { r[0] = v; save(); calc(); })]),
          U.el('td', {}, [select(r[1], W.ai + ' ' + (i + 1), function (v) { r[1] = v; save(); calc(); })]),
          U.el('td', {}, [U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: '×', 'aria-label': NS.data.widgets.table.remove + ' ' + (i + 1), onclick: function () { saved.rows.splice(i, 1); save(); drawTable(); calc(); } })])
        ]));
      });
      t.appendChild(tb);
      table.appendChild(U.el('div', { class: 'table-wrap' }, [t]));
    }
    var paste = U.el('textarea', { id: 'ac-paste', rows: '4' });
    var pasteBox = U.el('div', { class: 'field', hidden: true }, [U.el('label', { for: 'ac-paste', text: W.paste }), U.el('p', { class: 'help', text: W.pasteHelp }), paste,
      U.el('button', { type: 'button', class: 'btn btn-small', text: W.paste, onclick: function () {
        var rows = paste.value.split('\n').map(function (l) { return l.split(/\t|;/).map(function (s) { return s.trim(); }); }).filter(function (r) { return r[0] && r[1]; });
        rows.forEach(function (r) { [r[0], r[1]].forEach(function (c) { if (saved.codes.indexOf(c) < 0) saved.codes.push(c); }); });
        saved.rows = rows.map(function (r) { return [r[0], r[1]]; });
        saved.example = false; exBadge.hidden = true;
        save(); drawCodes(); drawTable(); calc();
      } })]);
    function calc() {
      res.innerHTML = '';
      var r = ui.agreement(saved.rows.map(function (x) { return x[0]; }), saved.rows.map(function (x) { return x[1]; }));
      if (!r) { res.textContent = W.need; return; }
      var t = ui.agreementText(r);
      res.appendChild(U.el('p', { class: 'big', text: t.pct }));
      res.appendChild(U.el('p', { text: t.kappa }));
      res.appendChild(U.el('p', {}, [t.alpha, U.el('br'), U.el('strong', { text: ui.alphaReading(r.alpha) })]));
      res.appendChild(U.el('ul', {}, t.codes.map(function (x) { return U.el('li', { text: x }); })));
      res.appendChild(U.el('p', { class: 'note' }, [ui.figureCardHTML('validacion.krippendorff')]));
    }
    drawCodes(); drawTable();
    wrap.appendChild(codesBox);
    wrap.appendChild(exBadge);
    wrap.appendChild(table);
    wrap.appendChild(U.el('div', { class: 'row' }, [
      U.el('button', { type: 'button', class: 'btn btn-small', text: W.addRow, onclick: function () { saved.rows.push(['', '']); save(); drawTable(); } }),
      U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.paste, 'aria-expanded': 'false', onclick: function (ev) { pasteBox.hidden = !pasteBox.hidden; ev.target.setAttribute('aria-expanded', pasteBox.hidden ? 'false' : 'true'); } }),
      U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.example, onclick: function () {
        saved = { codes: W.exampleCodes.slice(), rows: W.exampleHuman.map(function (h, i) { return [h, W.exampleAi[i]]; }), example: true };
        exBadge.hidden = false; save(); drawCodes(); drawTable(); calc();
      } })
    ]));
    wrap.appendChild(pasteBox);
    wrap.appendChild(res);
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    wrap.appendChild(U.el('div', { class: 'row' }, [U.el('button', { type: 'button', class: 'btn btn-small', text: W.save, onclick: function () {
      var r = ui.agreement(saved.rows.map(function (x) { return x[0]; }), saved.rows.map(function (x) { return x[1]; }));
      if (!r) { status.textContent = W.need; return; }
      var t = ui.agreementText(r);
      var d = NS.ui.wb.get('ruta', {}) || {};
      var key = NS.ui.wb.section('ruta').fields[2];
      d[key] = [t.pct, t.kappa, t.alpha].concat(t.codes).join('\n') + (saved.example ? '\n(' + W.exampleBadge + ')' : '');
      NS.ui.wb.set('ruta', d);
      status.textContent = W.saved; U.announce(W.saved);
    } }), status]));
    calc();
    return wrap;
  };
})(window.IAHI);
