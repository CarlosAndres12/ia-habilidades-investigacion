/* «Correcciones» (#/correcciones) · spec §4.8: the content's own corrections as pairs. «Use» is in
   ink; «No use» uses the alert role, always with its words (base §5.6). Each pair names its section. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  NS.ui.views.correcciones = {
    title: function () { return NS.data.ui.correcciones.title; },
    render: function (main) {
      var T = NS.data.ui.correcciones;
      ui.head(main, T.title, T.lead);
      (NS.data.correcciones || []).forEach(function (c) {
        main.appendChild(U.el('div', { class: 'usa-nouses' }, [
          U.el('article', { class: 'card no-blob usa' }, [U.el('p', { class: 'usa-label', text: T.usa }), U.el('p', { html: U.markup(c.use) })]),
          U.el('article', { class: 'card no-blob no-uses' }, [U.el('p', { class: 'no-uses-label', text: T.noUses }), U.el('p', { html: U.markup(c.noUse) }), U.el('p', { class: 'note', text: 'Programa del curso: ' + c.content })])
        ]));
      });
      main.appendChild(ui.stamp('stamp-pesos'));
    }
  };
})(window.IAHI);
