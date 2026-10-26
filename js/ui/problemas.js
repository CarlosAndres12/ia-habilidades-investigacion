/* §8.21 «Problemas frecuentes» (sesión 6): the content table as a searchable list («Buscar un
   síntoma» filters by «Síntoma», «Causa probable» and «Qué hacer»). The cause «Exceso de confianza del
   agente» is shown as «El agente reporta como terminado algo que falta»; the last row stays visible. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  ui.widgets.problemas = function () {
    var W = NS.data.widgets.problemas, t = (NS.data.herramientas || {}).problemas || { head: [], rows: [] };
    var rows = t.rows.map(function (r) { return r.map(function (c) { return W.replace[c] || c; }); });
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var id = 'pf-' + Math.floor(Math.random() * 1e5);
    var q = U.el('input', { type: 'search', id: id });
    wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: W.search }), q]));
    var list = U.el('div');
    var none = U.el('p', { class: 'note', 'aria-live': 'polite' });
    wrap.appendChild(none);
    wrap.appendChild(list);
    function draw() {
      var s = norm(q.value.trim());
      list.innerHTML = '';
      var shown = rows.filter(function (r, i) { return i === rows.length - 1 || !s || norm(r.join(' ')).indexOf(s) >= 0; });
      shown.forEach(function (r) {
        list.appendChild(U.el('article', { class: 'card no-blob' }, r.map(function (c, i) {
          return U.el('p', {}, [U.el('strong', { text: t.head[i] + ': ' }), U.el('span', { html: U.markup(c) })]);
        })));
      });
      none.textContent = s && shown.length === 1 ? W.none : '';
    }
    q.addEventListener('input', draw);
    draw();
    return wrap;
  };
})(window.IAHI);
