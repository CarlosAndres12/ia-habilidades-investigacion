/* §8.17 «Demostración de inyección inofensiva» and §8.18 «Mapa de riesgos de mi proyecto»
   (sesión 5, §5.4). The demo's example line is only ever shown inside its labeled box; nothing on
   the site hides text by color, size or position. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.inyeccion = function () {
    var W = NS.data.widgets.inyeccion, R = (NS.data.riesgos || {}).demo || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    wrap.appendChild(U.el('p', { html: U.markup(R.instructions || '') }));
    wrap.appendChild(U.el('div', { class: 'example-box', role: 'note', 'aria-label': W.boxTitle }, [
      U.el('p', { class: 'example-label', text: W.boxTitle }),
      U.el('p', { class: 'no-glos' }, [U.el('q', { text: R.example || '' })]),
      U.el('p', { class: 'note', text: W.boxNote })
    ]));
    wrap.appendChild(ui.stamp('stamp-oculto'));
    return wrap;
  };

  ui.widgets.riesgos = function () {
    var W = NS.data.widgets.riesgos;
    var data = NS.ui.wb.get('riesgos', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    W.fields.forEach(function (f, i) {
      wrap.appendChild(ui.wbField(f, data[f], function (v) { data[f] = v; NS.ui.wb.set('riesgos', data); }, { help: W.help[i], rows: '3' }));
    });
    wrap.appendChild(U.el('div', { class: 'row no-print' }, [U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: NS.data.widgets.plantilla.print, onclick: function () { ui.printOnly(wrap); } })]));
    wrap.appendChild(ui.stamp('stamp-responsabilidad'));
    return wrap;
  };
})(window.IAHI);
