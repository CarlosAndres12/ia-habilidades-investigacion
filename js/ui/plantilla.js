/* Template card (spec §8.0 «plantilla»): the template's text with its «[…]» blanks turned into
   fields, a live preview, «Copiar», «Imprimir» and «Guardar en mi cuaderno». Values persist locally. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function template(id) { return (NS.data.plantillas || []).filter(function (t) { return t.id === id; })[0]; }
  ui.template = template;
  function codeText(t) { var b = (t.blocks || []).filter(function (x) { return x.type === 'code'; })[0]; return b ? b.text : ''; }
  ui.templateText = codeText;

  // blanks: every «[…]» once, in order of appearance
  function blanks(text) {
    var seen = {}, out = [];
    (text.match(/\[[^\]]+\]/g) || []).forEach(function (b) { if (!seen[b]) { seen[b] = true; out.push(b); } });
    return out;
  }
  ui.fillTemplate = function (text, values) {
    return text.replace(/\[[^\]]+\]/g, function (b) { var v = values[b]; return v && String(v).trim() ? v : b; });
  };

  // opts: { key (store key), workbook (section id), skip: [blank…] (handled elsewhere), title, onChange }
  ui.widgets.plantilla = function (id, opts) {
    opts = opts || {};
    var W = NS.data.widgets.plantilla;
    var t = template(id);
    if (!t) return U.el('p', { text: id });
    var text = codeText(t);
    var key = opts.key || ('plantilla:' + id);
    var values = NS.store.get(key, {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': t.title });
    if (opts.title !== false) wrap.appendChild(U.el('h4', { text: opts.title || (t.id + '. ' + t.title) }));
    if (t.note) wrap.appendChild(U.el('p', { class: 'note', html: U.markup(t.note) }));
    var form = U.el('div', { class: 'grid grid-2' });
    var preview = U.el('pre', { class: 'template-preview', tabindex: '0', 'aria-live': 'off' });
    function render() {
      preview.textContent = ui.fillTemplate(text, values);
      if (opts.onChange) opts.onChange(values, preview.textContent);
    }
    blanks(text).forEach(function (b, i) {
      if (opts.skip && opts.skip.indexOf(b) >= 0) return;
      var fid = 'f-' + id + '-' + i + '-' + Math.floor(Math.random() * 1e5);
      var input = U.el(b.length > 40 ? 'textarea' : 'input', { id: fid, type: 'text', value: values[b] || '' });
      if (input.tagName === 'TEXTAREA') input.value = values[b] || '';
      input.addEventListener('input', function () { values[b] = input.value; NS.store.set(key, values); render(); });
      form.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: fid, text: b.replace(/^\[|\]$/g, '') }), input]));
    });
    wrap.appendChild(form);
    wrap.appendChild(U.el('p', { class: 'copy-label', text: W.preview }));
    wrap.appendChild(preview);
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    var row = U.el('div', { class: 'row no-print' }, [
      U.el('button', { type: 'button', class: 'btn btn-small', text: W.copy, onclick: function () { U.copyText(preview.textContent).then(function (ok) { status.textContent = ok ? 'Copiado' : 'No se pudo copiar.'; U.announce(status.textContent); }); } }),
      U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.print, onclick: function () { printOnly(wrap); } })
    ]);
    if (opts.workbook) row.appendChild(U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.save, onclick: function () { NS.ui.wb.set(opts.workbook, { text: preview.textContent, values: values }); status.textContent = W.saved; U.announce(W.saved); } }));
    row.appendChild(status);
    wrap.appendChild(row);
    render();
    wrap.values = values;
    return wrap;
  };

  // print only one element: mark it and let print.css hide the rest of the view
  function printOnly(el) {
    document.body.classList.add('print-one');
    el.classList.add('print-target');
    var done = function () { document.body.classList.remove('print-one'); el.classList.remove('print-target'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }
  ui.printOnly = printOnly;
})(window.IAHI);
