/* Checklist (spec §8.0 «lista», §8.19): items with checkboxes that persist locally, «Reiniciar lista»
   and «Lista completa.» when every box is checked. items: strings with mini-markup. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.lista = function (key, items, opts) {
    opts = opts || {};
    var W = NS.data.widgets.lista;
    var state = NS.store.get('lista:' + key, {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': opts.title || key });
    if (opts.title) wrap.appendChild(U.el('h4', { text: opts.title }));
    var ul = U.el('ul', { class: 'check-list' });
    var done = U.el('p', { class: 'feedback', 'aria-live': 'polite' });
    var boxes = [];
    items.forEach(function (it, i) {
      var id = 'chk-' + key.replace(/\W/g, '') + '-' + i;
      var cb = U.el('input', { type: 'checkbox', id: id });
      cb.checked = !!state[i];
      cb.addEventListener('change', function () { state[i] = cb.checked; NS.store.set('lista:' + key, state); check(); });
      boxes.push(cb);
      ul.appendChild(U.el('li', {}, [cb, U.el('label', { for: id, html: U.markup(it) })]));
    });
    function check() {
      var all = boxes.length && boxes.every(function (b) { return b.checked; });
      done.innerHTML = '';
      if (all) { done.appendChild(ui.mark('correct')); done.appendChild(U.el('span', { text: W.done })); U.announce(W.done); }
      if (opts.onChange) opts.onChange(boxes.map(function (b) { return b.checked; }));
    }
    wrap.appendChild(ul);
    wrap.appendChild(done);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small btn-quiet no-print', text: W.reset, onclick: function () { state = {}; NS.store.set('lista:' + key, state); boxes.forEach(function (b) { b.checked = false; }); check(); } }));
    check();
    return wrap;
  };

  // a checklist from a template's `check` block (B6, B8)
  ui.widgets.listaPlantilla = function (id) {
    var t = ui.template(id);
    if (!t) return U.el('p', { text: id });
    var block = t.blocks.filter(function (b) { return b.type === 'check'; })[0];
    return ui.widgets.lista(id, block ? block.items : [], { title: t.id + '. ' + t.title });
  };
})(window.IAHI);
