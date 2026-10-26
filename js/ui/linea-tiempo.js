/* §8.4 «Línea de tiempo de la IA»: the 18 milestones of hitos.js, nothing added; year, milestone and
   «Por qué importa»; ← and → move between cards; «Mostrar los inviernos de la IA» highlights the
   1970s and 1980s. Also §8.5 «TensorFlow Playground, paso a paso» (checklist + workbook field). */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets['linea-tiempo'] = function () {
    var W = NS.data.widgets['linea-tiempo'];
    var hitos = NS.data.hitos || [];
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title }), U.el('p', { class: 'note', text: W.keys })]);
    var winters = U.el('input', { type: 'checkbox', id: 'lt-winters' });
    wrap.appendChild(U.el('label', { for: 'lt-winters', class: 'opt' }, [winters, ' ' + W.winters]));
    var track = U.el('ol', { class: 'timeline', role: 'list' });
    hitos.forEach(function (h, i) {
      var isWinter = /1970|1980/.test(h.year);
      var li = U.el('li', { class: 'timeline-item' + (isWinter ? ' is-winter' : ''), tabindex: '0', 'aria-label': h.year + ': ' + h.hito }, [
        U.el('p', { class: 'timeline-year', text: h.year }),
        U.el('p', { class: 'timeline-hito', html: U.markup(h.hito) }),
        U.el('p', { class: 'note' }, [U.el('strong', { text: W.why + ': ' }), U.el('span', { html: U.markup(h.why) })])
      ]);
      li.addEventListener('keydown', function (ev) {
        var items = U.$$('.timeline-item', track);
        if (ev.key === 'ArrowRight') { ev.preventDefault(); (items[i + 1] || items[i]).focus(); }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); (items[i - 1] || items[i]).focus(); }
      });
      track.appendChild(li);
    });
    winters.addEventListener('change', function () { track.classList.toggle('show-winters', winters.checked); });
    wrap.appendChild(U.el('div', { class: 'timeline-wrap' }, [track]));
    wrap.appendChild(U.el('p', { class: 'note', text: W.last }));
    return wrap;
  };

  ui.widgets.playground = function () {
    var W = NS.data.widgets.playground;
    var S1 = NS.data.sesiones[1];
    var part = S1.parts.filter(function (p) { return /^1\.4/.test(p.title); })[0];
    var steps = [];
    if (part) part.blocks.forEach(function (b) { if (b.type === 'ol') steps = steps.concat(b.items); });
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    wrap.appendChild(U.el('p', {}, [ui.ext(W.link)]));
    wrap.appendChild(U.el('p', { text: W.roles }));
    wrap.appendChild(ui.widgets.lista('playground', steps));
    var tickets = NS.ui.wb.get('tickets', {}) || {};
    tickets.s1 = tickets.s1 || {};
    var key = NS.data.workbook.sections.filter(function (s) { return s.id === 'tickets'; })[0].fields[0];
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    var ta = U.el('textarea', { id: 'pg-capa', rows: '2' });
    ta.value = tickets.s1.capa || '';
    wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'pg-capa', text: W.field }), ta]));
    wrap.appendChild(U.el('div', { class: 'row' }, [U.el('button', { type: 'button', class: 'btn btn-small', text: W.save, onclick: function () {
      var t = NS.ui.wb.get('tickets', {}) || {};
      t.s1 = t.s1 || {};
      t.s1.capa = ta.value;
      if (!t.s1[key]) t.s1[key] = ta.value;
      NS.ui.wb.set('tickets', t);
      status.textContent = NS.data.widgets.plantilla.saved; U.announce(status.textContent);
    } }), status]));
    return wrap;
  };
})(window.IAHI);
