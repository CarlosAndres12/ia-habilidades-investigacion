/* «Fuentes» (#/fuentes) · spec §7: «Bibliografía y recursos» (content Anexos C) and «Todas las
   fuentes por sesión». Every external link resolves through sources.js and opens in a new tab. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function sourcesOfSession(n) {
    var keys = [];
    var add = function (k) { if (k && keys.indexOf(k) < 0) keys.push(k); };
    var topics = (((NS.data.widgets || {}).topics || {})[n]) || {};
    Object.keys(topics).forEach(function (k) { (topics[k].figs || []).forEach(function (id) { var f = NS.data.figuresById[id]; if (f) f.fuentes.forEach(add); }); });
    var v = ui.videoOf(n);
    if (v) v.scenes.forEach(function (s) { (s.figs || []).forEach(function (id) { var f = NS.data.figuresById[id]; if (f) f.fuentes.forEach(add); }); });
    JSON.stringify(NS.data.sesiones[n]).replace(/\(ref:([a-z0-9-]+)\)/g, function (m, k) { add(k); return m; });
    return keys.filter(function (k) { return (NS.data.sources || {})[k]; });
  }
  ui.sourcesOfSession = sourcesOfSession;

  NS.ui.views.fuentes = {
    title: function () { return NS.data.ui.fuentes.title; },
    render: function (main) {
      var T = NS.data.ui.fuentes;
      ui.head(main, T.title, T.lead);
      var bib = (NS.data.bibliografia || {}).blocks || [];
      var cur = null;
      bib.forEach(function (b, i) {
        if (i === 0 && b.type === 'p') return;
        if (b.type === 'p' && /^\*\*[^*]+\*\*$/.test(b.text)) { cur = ui.section(b.text.replace(/\*\*/g, '')); main.appendChild(cur); return; }
        (cur || main).appendChild(ui.blocks([b], { tableCell: ui.priceCell }));
      });
      var all = ui.section(T.bySession, { id: 'por-sesion' });
      (NS.data.schedule || []).forEach(function (s) {
        all.appendChild(U.el('h3', { text: 'Sesión ' + s.n + ' · ' + s.title }));
        all.appendChild(U.el('ul', { class: 'source-list' }, sourcesOfSession(s.n).map(function (k) {
          var src = NS.data.sources[k];
          return U.el('li', {}, [src.url ? ui.ext(k, src.label) : src.label]);
        })));
      });
      main.appendChild(all);
      main.appendChild(U.el('p', { class: 'note', text: NS.data.ui.consulted }));
    }
  };
})(window.IAHI);
