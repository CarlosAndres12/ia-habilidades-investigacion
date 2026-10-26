/* §8.12 «Miniauditoría de sesgo» (sesión 3, §3.3): the base instruction (verbatim), the attribute
   assigned to the pair, versions A and B to copy, a table of the pair's own runs that computes
   «Promedio por versión» and «Diferencia entre versiones» only from the rows entered, and a CSV with
   the columns «pareja», «modelo», «versión», «respuesta». No result is pre-filled. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.auditStats = function (rows) {
    var sums = { A: 0, B: 0 }, ns = { A: 0, B: 0 };
    rows.forEach(function (r) {
      var v = String(r.version || '').trim().toUpperCase();
      var x = parseFloat(String(r.answer || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
      if ((v === 'A' || v === 'B') && isFinite(x)) { sums[v] += x; ns[v]++; }
    });
    var avg = { A: ns.A ? sums.A / ns.A : null, B: ns.B ? sums.B / ns.B : null };
    return { avg: avg, n: ns, diff: avg.A != null && avg.B != null ? avg.A - avg.B : null };
  };

  ui.widgets.auditoria = function () {
    var W = NS.data.widgets.auditoria;
    var base = (NS.data.sesgo || {}).instruccion || '';
    var saved = NS.store.get('w:auditoria', { attr: 0, pair: '', rows: [] }) || { attr: 0, rows: [] };
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    wrap.appendChild(ui.copyBox('Instrucción base', base));
    var sel = U.el('select', { id: 'aud-attr' }, W.attributes.map(function (a, i) { return U.el('option', { value: String(i), text: a.label + ' (' + a.a + ' / ' + a.b + ')' }); }));
    sel.value = String(saved.attr || 0);
    wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'aud-attr', text: W.selector }), sel]));
    var versions = U.el('div', { class: 'grid grid-2' });
    wrap.appendChild(versions);
    function version(which) {
      // the base text writes «[Andrés / Andrea]», «28 años» and «[Quibdó / Bogotá]»; the attribute
      // assigned to the pair changes between A and B, the others keep their first option
      var a = W.attributes[Number(sel.value)], G = W.attributes[0], R = W.attributes[1], E2 = W.attributes[2];
      var name = a === G && which === 'B' ? G.b : G.a;
      var city = a === R && which === 'B' ? R.b : R.a;
      var age = a === E2 && which === 'B' ? E2.b : E2.a;
      return base.replace('[' + G.a + ' / ' + G.b + ']', name).replace('[' + R.a + ' / ' + R.b + ']', city)
        .replace(E2.a, age).replace('nacido(a)', name === G.b ? 'nacida' : 'nacido');
    }
    function drawVersions() {
      versions.innerHTML = '';
      versions.appendChild(ui.copyBox(W.versionA, function () { return version('A'); }));
      versions.appendChild(ui.copyBox(W.versionB, function () { return version('B'); }));
    }
    sel.addEventListener('change', function () { saved.attr = Number(sel.value); NS.store.set('w:auditoria', saved); drawVersions(); });
    drawVersions();
    W.reminders.forEach(function (t) { wrap.appendChild(U.el('p', { class: 'note', text: t })); });
    var pair = U.el('input', { type: 'text', id: 'aud-pair', value: saved.pair || '' });
    pair.addEventListener('input', function () { saved.pair = pair.value; NS.store.set('w:auditoria', saved); });
    wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'aud-pair', text: W.pair }), pair]));
    var result = U.el('div', { class: 'result-box', 'aria-live': 'polite' });
    var table = ui.widgets.tabla({ columns: W.table, rows: (saved.rows || []).map(function (r) { return [r.model, r.version, r.run, r.answer]; }), addLabel: W.addRow, csvName: 'auditoria-corridas',
      onChange: function (rows) { saved.rows = rows.map(function (r) { return { model: r[0], version: r[1], run: r[2], answer: r[3] }; }); NS.store.set('w:auditoria', saved); stats(); } });
    wrap.appendChild(table);
    function stats() {
      var st = ui.auditStats(saved.rows || []);
      result.innerHTML = '';
      if (!st.n.A && !st.n.B) { result.textContent = W.empty; return; }
      var fmt = function (x) { return x == null ? '—' : U.fmtNumber(x, 0); };
      result.appendChild(U.el('p', { text: W.average + ': A ' + fmt(st.avg.A) + ' (' + st.n.A + ') · B ' + fmt(st.avg.B) + ' (' + st.n.B + ')' }));
      result.appendChild(U.el('p', { text: W.difference + ': ' + fmt(st.diff) }));
    }
    wrap.appendChild(result);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small', text: W.csv, onclick: function () {
      var rows = [W.csvHead].concat((saved.rows || []).map(function (r) { return [saved.pair || '', r.model, r.version, r.answer]; }));
      U.download('auditoria-pareja.csv', '﻿' + U.csv(rows), 'text/csv;charset=utf-8');
    } }));
    wrap.appendChild(U.el('a', { class: 'btn btn-small btn-quiet', href: '#/cuaderno?s=auditoria', text: NS.data.workbook.sections[4].title }));
    stats();
    return wrap;
  };
})(window.IAHI);
