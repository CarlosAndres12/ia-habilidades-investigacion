/* §8.27 «Declaración de uso de IA» (plantilla B5; sesión 8): the template card with «Completar con mi
   bitácora», «Copiar», «Imprimir», the content's note and the stamp (workbook section 13).
   §8.28 «Cláusula de consentimiento sobre uso de IA» (plantilla B9; sesión 3): the choice of
   «[Opción A]» or «[Opción B]», the optional «[Si aplica]» line and the content's warning. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.declaracion = function () {
    var W = NS.data.widgets.declaracion;
    var t = ui.template('B5');
    var text = ui.templateText(t);
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title }), U.el('p', { class: 'note', text: W.note })]);
    var current = '';
    var card = ui.widgets.plantilla('B5', { title: false, workbook: 'declaracion', key: 'plantilla:B5', onChange: function (values, preview) { current = preview; } });
    wrap.appendChild(card);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small', text: W.fill, onclick: function () {
      // one line per logbook row: tool and version, date and task (the participant then edits)
      var rows = NS.ui.wb.get('bitacora', []) || [];
      var lines = rows.filter(function (r) { return r[1]; }).map(function (r) { return '- ' + r[1] + (r[0] ? ', ' + r[0] : '') + ': ' + (r[2] || ''); });
      var m = /^- \[[^\]]+\]: \[[^\]]+\]\.?$/m.exec(text);
      var filled = m && lines.length ? text.replace(m[0], lines.join('\n')) : text;
      var values = NS.store.get('plantilla:B5', {}) || {};
      var final = ui.fillTemplate(filled, values);
      NS.ui.wb.set('declaracion', { text: final, values: values });
      var pre = card.querySelector('.template-preview'); if (pre) pre.textContent = final;
      U.announce(NS.data.widgets.plantilla.saved);
    } }));
    wrap.appendChild(ui.stamp('stamp-autora'));
    return wrap;
  };

  ui.widgets.clausula = function () {
    var W = NS.data.widgets.clausula;
    var t = ui.template('B9');
    var text = ui.templateText(t);
    var saved = NS.store.get('w:clausula', { option: 'A', ifApplies: true }) || { option: 'A', ifApplies: true };
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title }), U.el('p', { class: 'note', text: W.warning })]);
    var opt = U.el('div', { class: 'row', role: 'radiogroup', 'aria-label': W.optionA + ' / ' + W.optionB });
    ['A', 'B'].forEach(function (k) {
      var b = U.el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': saved.option === k ? 'true' : 'false', text: k === 'A' ? W.optionA : W.optionB });
      b.addEventListener('click', function () { saved.option = k; NS.store.set('w:clausula', saved); U.$$('button', opt).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); card.update(); });
      opt.appendChild(b);
    });
    var cb = U.el('input', { type: 'checkbox', id: 'cl-if' });
    cb.checked = saved.ifApplies !== false;
    cb.addEventListener('change', function () { saved.ifApplies = cb.checked; NS.store.set('w:clausula', saved); card.update(); });
    function compose() {
      return text.split('\n').filter(function (ln) {
        if (ln.indexOf(W.optionA) === 0) return saved.option === 'A';
        if (ln.indexOf(W.optionB) === 0) return saved.option === 'B';
        if (ln.indexOf(W.ifApplies) === 0) return saved.ifApplies !== false;
        return true;
      }).map(function (ln) { return ln.replace(W.optionA + ' ', '').replace(W.optionB + ' ', '').replace(W.ifApplies + ' ', ''); }).join('\n');
    }
    wrap.appendChild(opt);
    wrap.appendChild(U.el('label', { for: 'cl-if', class: 'opt' }, [cb, ' ' + W.ifApplies]));
    var card = ui.copyBox('', compose);
    card.update = (function (orig) { return function () { orig(); }; })(card.update);
    wrap.appendChild(card);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small btn-quiet no-print', text: NS.data.widgets.plantilla.print, onclick: function () { ui.printOnly(wrap); } }));
    return wrap;
  };
})(window.IAHI);
