/* «Mi cuaderno» (#/cuaderno) · spec §4.4 and §7: the 14 sections of the project workbook, the
   progress strip by session, and export, import, CSV, print and delete (with an in-page
   confirmation). Fields print as the participant's text, or as lines when empty. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  // a labeled field with a print mirror; onChange(value)
  ui.wbField = function (label, value, onChange, opts) {
    opts = opts || {};
    var id = 'wbf-' + Math.floor(Math.random() * 1e8);
    var input = U.el(opts.input ? 'input' : 'textarea', { id: id, type: opts.input ? 'text' : null, rows: opts.rows || (opts.input ? null : '3') });
    input.value = value || '';
    var mirror = U.el('div', { class: 'print-only print-field' });
    function sync() { mirror.textContent = input.value || ''; mirror.classList.toggle('is-empty', !input.value); }
    input.addEventListener('input', function () { sync(); onChange(input.value); });
    sync();
    return U.el('div', { class: 'field' }, [U.el('label', { for: id, text: label }), opts.help ? U.el('p', { class: 'help', text: opts.help }) : null, input, mirror]);
  };

  function b1Fields() {
    var text = ui.templateText(ui.template('B1'));
    var out = [];
    text.split('\n').forEach(function (ln) {
      ln = ln.trim();
      if (/^\d\.$/.test(ln)) out.push({ label: ln, sub: true });
      else if (/:$/.test(ln)) out.push({ label: ln.replace(/:$/, '') });
    });
    return out;
  }
  function b2Head() {
    var t = ui.template('B2');
    var tb = t ? t.blocks.filter(function (b) { return b.type === 'table'; })[0] : null;
    return tb ? { head: tb.head, example: tb.rows[0] } : { head: [], example: null };
  }
  ui.b2Head = b2Head;

  var RENDER = {
    template: function (sec) {
      var data = NS.ui.wb.get(sec.id, {}) || {};
      var box = U.el('div', { class: 'grid grid-2' });
      b1Fields().forEach(function (f) {
        box.appendChild(ui.wbField(f.label, data[f.label], function (v) { data[f.label] = v; NS.ui.wb.set(sec.id, data); }, { input: f.sub, rows: '2' }));
      });
      return box;
    },
    table: function (sec) {
      if (sec.id === 'bitacora') {
        var b2 = b2Head();
        return ui.widgets.tabla({ columns: b2.head, rows: NS.ui.wb.get('bitacora', []) || [], example: b2.example, addLabel: sec.add, csvName: 'bitacora', onChange: function (rows) { NS.ui.wb.set('bitacora', rows); } });
      }
      if (sec.id === 'busqueda') {
        var data = NS.ui.wb.get('busqueda', {}) || {};
        var wrap = U.el('div');
        wrap.appendChild(ui.widgets.tabla({ columns: sec.columns, rows: data.rows || [], addLabel: sec.add, csvName: 'busqueda-comparada', onChange: function (rows) { data.rows = rows; NS.ui.wb.set('busqueda', data); } }));
        wrap.appendChild(U.el('h4', { text: sec.refsTitle }));
        data.refs = data.refs || ['', '', ''];
        for (var i = 0; i < sec.refs; i++) (function (k) {
          wrap.appendChild(ui.wbField('Referencia ' + (k + 1), data.refs[k], function (v) { data.refs[k] = v; NS.ui.wb.set('busqueda', data); }, { input: true }));
        })(i);
        wrap.appendChild(U.el('a', { class: 'btn btn-small no-print', href: '#/sesion/4?s=tema-3', text: NS.data.widgets.verificar.title }));
        return wrap;
      }
      // antecedentes
      return ui.widgets.tabla({ columns: sec.columns, rows: NS.ui.wb.get(sec.id, []) || [], checkbox: sec.checkbox, addLabel: sec.add, csvName: 'matriz-antecedentes', onChange: function (rows) { NS.ui.wb.set(sec.id, rows); },
        onCheck: function (ri, on) { if (on) location.hash = '#/sesion/7?s=laboratorio'; } });
    },
    pairs: function (sec) {
      var data = NS.ui.wb.get(sec.id, {}) || {};
      return U.el('div', { class: 'grid grid-2' }, sec.pairs.map(function (p) {
        data[p.key] = data[p.key] || {};
        return U.el('fieldset', {}, [U.el('legend', { text: p.label })].concat(sec.fields.map(function (f) {
          return ui.wbField(f, data[p.key][f], function (v) { data[p.key][f] = v; NS.ui.wb.set(sec.id, data); }, { rows: '2' });
        })));
      }));
    },
    versions: function (sec) {
      var data = NS.ui.wb.get(sec.id, {}) || {};
      return U.el('div', {}, sec.versions.map(function (v, i) {
        var k = 'v' + (i + 1);
        data[k] = data[k] || {};
        return U.el('fieldset', {}, [U.el('legend', { text: v }),
          ui.wbField(v, data[k].text, function (val) { data[k].text = val; NS.ui.wb.set(sec.id, data); }, { rows: '5' })
        ].concat(sec.fields.map(function (f) { return ui.wbField(f, data[k][f], function (val) { data[k][f] = val; NS.ui.wb.set(sec.id, data); }, { rows: '2' }); })));
      }));
    },
    fields: function (sec) {
      var data = NS.ui.wb.get(sec.id, {}) || {};
      return U.el('div', {}, sec.fields.map(function (f) { return ui.wbField(f, data[f], function (v) { data[f] = v; NS.ui.wb.set(sec.id, data); }, { rows: '3' }); }));
    },
    lab: function (sec) {
      var data = NS.ui.wb.get(sec.id, {}) || {};
      var wrap = U.el('div');
      sec.parts.forEach(function (pt) {
        data[pt] = data[pt] || {};
        var fs = U.el('fieldset', {}, [U.el('legend', { text: 'Parte ' + pt })]);
        sec.fields.forEach(function (f) {
          if (f === 'Tipo de error encontrado') {
            var id = 'err-' + pt;
            var sel = U.el('select', { id: id }, [U.el('option', { value: '', text: '—' })].concat(sec.errors.map(function (e) { return U.el('option', { value: e, text: e }); })));
            sel.value = data[pt][f] || '';
            sel.addEventListener('change', function () { data[pt][f] = sel.value; NS.ui.wb.set(sec.id, data); });
            fs.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f }), sel]));
          } else fs.appendChild(ui.wbField(f, data[pt][f], function (v) { data[pt][f] = v; NS.ui.wb.set(sec.id, data); }, { rows: '2' }));
        });
        wrap.appendChild(fs);
      });
      sec.files.forEach(function (f) { wrap.appendChild(ui.wbField(f, data[f], function (v) { data[f] = v; NS.ui.wb.set(sec.id, data); }, { rows: '8' })); });
      return wrap;
    },
    widget: function (sec) {
      var el = ui.widgetByName(sec.widget, { workbook: true });
      return el || U.el('p', { text: sec.widget });
    }
  };

  NS.ui.views.cuaderno = {
    title: function () { return NS.data.workbook.title; },
    render: function (main, params) {
      var Wd = NS.data.workbook;
      ui.head(main, Wd.title, Wd.lead);
      main.appendChild(U.el('p', { class: 'card no-blob card-dark', role: 'note', text: Wd.banner }));
      // progress strip
      var strip = U.el('ol', { class: 'progress-strip', 'aria-label': Wd.progress });
      (NS.data.schedule || []).forEach(function (s) {
        var ok = NS.ui.wb.productSaved(s.n);
        strip.appendChild(U.el('li', { class: ok ? 'is-done' : '' }, [U.el('a', { href: '#/sesion/' + s.n }, ['Sesión ' + s.n]), U.el('span', { class: 'note', text: ok ? Wd.saved : Wd.pending })]));
      });
      main.appendChild(strip);
      // controls
      var file = U.el('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', id: 'wb-import' });
      var status = U.el('p', { class: 'note', 'aria-live': 'polite' });
      file.addEventListener('change', function () {
        var f = file.files && file.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () { var ok = NS.ui.wb.importJSON(String(rd.result)); status.textContent = ok ? Wd.imported : Wd.importError; U.announce(status.textContent); if (ok) NS.router.render(); };
        rd.readAsText(f);
      });
      var clearBtn = U.el('button', { type: 'button', class: 'btn btn-quiet', text: Wd.buttons.clear });
      clearBtn.addEventListener('click', function () {
        var F = NS.data.ui.footer;
        ui.confirm(clearBtn, F.clearConfirm, F.clearYes, F.clearNo, function () { NS.store.clearAll(); U.announce(F.cleared); NS.router.render(); });
      });
      main.appendChild(U.el('div', { class: 'row no-print' }, [
        U.el('button', { type: 'button', class: 'btn btn-primary', text: Wd.buttons.export, onclick: function () { U.download('cuaderno-del-proyecto.json', NS.ui.wb.exportJSON(), 'application/json'); } }),
        U.el('label', { for: 'wb-import', class: 'btn', text: Wd.buttons.import, tabindex: '0', onkeydown: function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); file.click(); } } }), file,
        U.el('button', { type: 'button', class: 'btn', text: Wd.buttons.csv, onclick: function () { U.download('cuaderno-tablas.csv', '﻿' + NS.ui.wb.tablesCSV(), 'text/csv;charset=utf-8'); } }),
        U.el('button', { type: 'button', class: 'btn', text: Wd.buttons.print, onclick: function () { window.print(); } }),
        clearBtn
      ]));
      main.appendChild(status);
      // table of contents and sections
      main.appendChild(U.el('ol', { class: 'wb-toc no-print' }, Wd.sections.map(function (s) { return U.el('li', {}, [U.el('a', { href: '#/cuaderno?s=' + s.id, onclick: function (ev) { ev.preventDefault(); var t = document.getElementById('wb-' + s.id); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, text: s.title })]); })));
      Wd.sections.forEach(function (sec) {
        var el = ui.section(sec.n + '. ' + sec.title, { id: 'wb-' + sec.id });
        el.classList.add('wb-section');
        el.appendChild(U.el('p', { class: 'wb-status', text: 'Sesiones: ' + sec.sessions.join(', ') }));
        try { el.appendChild(RENDER[sec.kind](sec)); } catch (e) { console.error('cuaderno ' + sec.id, e); }
        main.appendChild(el);
      });
      if (params.query && params.query.s) setTimeout(function () { var t = document.getElementById('wb-' + params.query.s); if (t) t.scrollIntoView(); }, 60);
    }
  };
})(window.IAHI);
