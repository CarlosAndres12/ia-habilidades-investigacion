/* §8.8 «Constructor de instrucciones» (sesión 2, §2.5 and Anexos B3): the six fields of B3 (the last
   pre-filled with the content's text), «Guardar como versión 1/2/3» (workbook section 4), «Copiar»,
   the improvement loop of §2.5 as a checklist, the stamp and the reminder. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function b3Lines() {
    var text = ui.templateText(ui.template('B3'));
    var out = {};
    text.split('\n').forEach(function (ln) { var m = /^([^:]+):\s*(.*)$/.exec(ln); if (m) out[m[1].trim()] = m[2]; });
    return out;
  }

  ui.widgets.instruccion = function () {
    var W = NS.data.widgets.instruccion;
    var defaults = b3Lines();
    var saved = NS.store.get('w:instruccion', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var fields = {};
    W.fields.forEach(function (f, i) {
      var id = 'ins-' + i;
      var ta = U.el('textarea', { id: id, rows: f === 'Honestidad' ? '3' : '2', placeholder: f === 'Honestidad' ? '' : (defaults[f] || '') });
      ta.value = saved[f] != null ? saved[f] : (f === 'Honestidad' ? (defaults[f] || '') : '');
      ta.addEventListener('input', function () { saved[f] = ta.value; NS.store.set('w:instruccion', saved); box.update(); });
      fields[f] = ta;
      wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f }), ta]));
    });
    function text() { return W.fields.map(function (f) { return f + ': ' + (fields[f].value || ''); }).join('\n'); }
    var box = ui.copyBox('', text, { button: W.copy });
    wrap.appendChild(box);
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    wrap.appendChild(U.el('div', { class: 'row' }, W.save.map(function (label, i) {
      return U.el('button', { type: 'button', class: 'btn btn-small', text: label, onclick: function () {
        var data = NS.ui.wb.get('instruccion', {}) || {};
        var k = 'v' + (i + 1);
        data[k] = data[k] || {};
        data[k].text = text();
        NS.ui.wb.set('instruccion', data);
        status.textContent = W.saved.replace('{n}', i + 1); U.announce(status.textContent);
      } });
    }).concat([status])));
    // the improvement loop of §2.5
    var part = NS.data.sesiones[2].parts.filter(function (p) { return /^2\.5/.test(p.title); })[0];
    var loop = part ? (part.blocks.filter(function (b) { return b.type === 'ol'; })[0] || { items: [] }).items : [];
    wrap.appendChild(ui.widgets.lista('bucle-mejora', loop, { title: W.loopTitle }));
    wrap.appendChild(ui.stamp('stamp-instruccion'));
    wrap.appendChild(U.el('p', { class: 'lead', text: W.reminder }));
    return wrap;
  };

  // §2.6 «Práctica en chats»: the same builder, with the stamp «Plausible no es verdadero»
  ui.widgets['instruccion-practica'] = function () {
    var wrap = U.el('div');
    wrap.appendChild(U.el('a', { class: 'btn', href: '#/cuaderno?s=instruccion', text: NS.data.workbook.sections[3].title }));
    wrap.appendChild(ui.stamp('stamp-plausible'));
    return wrap;
  };
})(window.IAHI);
