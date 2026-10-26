/* Editable table (spec §8.0 «tabla»): add and delete rows, edit cells, «Descargar CSV».
   opts: { columns, rows (initial), checkbox (column name rendered as a checkbox), onChange(rows),
   example (a greyed, read-only first row with the badge «Ejemplo ilustrativo»), csvName, addLabel }. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.tabla = function (opts) {
    var W = NS.data.widgets.table;
    var cols = opts.columns;
    var rows = (opts.rows || []).map(function (r) { return Array.isArray(r) ? r.slice() : cols.map(function (c) { return r[c]; }); });
    var wrap = U.el('div', { class: 'widget widget-table' });
    var table = U.el('table');
    var thead = U.el('thead', {}, [U.el('tr', {}, cols.map(function (c) { return U.el('th', { scope: 'col', text: c }); }).concat([U.el('th', { scope: 'col' }, [U.el('span', { class: 'sr-only', text: W.remove })])]))]);
    var tbody = U.el('tbody');
    table.appendChild(thead); table.appendChild(tbody);
    var tw = U.el('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': opts.label || cols.join(', ') }, [table]);
    wrap.appendChild(tw);
    function save() { if (opts.onChange) opts.onChange(rows.map(function (r) { return r.slice(); })); }
    function render() {
      tbody.innerHTML = '';
      if (opts.example) {
        tbody.appendChild(U.el('tr', { class: 'example-row' }, opts.example.map(function (c, i) {
          return U.el('td', {}, i === 0 ? [ui.badge(NS.data.workbook.example), U.el('br'), U.el('span', { text: c })] : [U.el('span', { text: c })]);
        }).concat([U.el('td')])));
      }
      rows.forEach(function (r, ri) {
        var tr = U.el('tr');
        cols.forEach(function (c, ci) {
          var label = c + ', fila ' + (ri + 1);
          var cell;
          if (opts.checkbox === c) {
            cell = U.el('input', { type: 'checkbox', 'aria-label': label });
            cell.checked = !!r[ci];
            cell.addEventListener('change', function () { r[ci] = cell.checked; save(); if (opts.onCheck) opts.onCheck(ri, cell.checked, r); });
          } else {
            cell = U.el('textarea', { 'aria-label': label, rows: '2' });
            cell.value = r[ci] == null ? '' : r[ci];
            cell.addEventListener('input', function () { r[ci] = cell.value; save(); });
          }
          tr.appendChild(U.el('td', {}, [cell]));
        });
        tr.appendChild(U.el('td', {}, [U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', 'aria-label': W.remove + ' ' + (ri + 1), text: '×', onclick: function () { rows.splice(ri, 1); save(); render(); } })]));
        tbody.appendChild(tr);
      });
    }
    wrap.appendChild(U.el('div', { class: 'row no-print' }, [
      U.el('button', { type: 'button', class: 'btn btn-small', text: opts.addLabel || W.add, onclick: function () {
        rows.push(cols.map(function (c) { return opts.checkbox === c ? false : ''; }));
        save(); render();
        var last = tbody.lastChild && tbody.lastChild.querySelector('textarea,input'); if (last) last.focus();
      } }),
      U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: opts.csvLabel || W.csv, onclick: function () {
        U.download((opts.csvName || 'tabla') + '.csv', '﻿' + U.csv([cols].concat(rows.map(function (r) { return r.map(function (v) { return typeof v === 'boolean' ? (v ? 'sí' : 'no') : v; }); }))), 'text/csv;charset=utf-8');
      } })
    ]));
    render();
    wrap.getRows = function () { return rows; };
    wrap.setRows = function (rs) { rows = rs.map(function (r) { return r.slice(); }); render(); save(); };
    return wrap;
  };
})(window.IAHI);
