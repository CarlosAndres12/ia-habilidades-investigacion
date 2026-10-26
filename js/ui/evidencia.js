/* «Banco de cifras» (#/evidencia) · spec §7: every figure card with filters «Sesión», «Tema»,
   «Tipo de evidencia» and «Estado», its id visible for the facilitator, the consultation date and the
   box «¿Cómo leer una cifra?». ?f=<id> highlights one card. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  // sessions where a figure is used (topics of the session views and scenes of the session's video)
  function figSessions() {
    var map = {};
    var add = function (id, n) { (map[id] = map[id] || []); if (map[id].indexOf(n) < 0) map[id].push(n); };
    var topics = (NS.data.widgets || {}).topics || {};
    Object.keys(topics).forEach(function (n) { Object.keys(topics[n]).forEach(function (k) { (topics[n][k].figs || []).forEach(function (id) { add(id, Number(n)); }); }); });
    (NS.data.videos || []).forEach(function (v) { v.scenes.forEach(function (s) { (s.figs || []).forEach(function (id) { add(id, Number(v.session)); }); }); });
    return map;
  }

  NS.ui.views.evidencia = {
    title: function () { return NS.data.ui.evidencia.title; },
    render: function (main, params) {
      var T = NS.data.ui.evidencia, F = T.filters;
      ui.head(main, T.title, T.lead);
      main.appendChild(U.el('p', { class: 'note', text: NS.data.ui.consulted }));
      var figs = NS.data.figures || [];
      var sess = figSessions();
      function select(label, options, allLabel) {
        var id = 'flt-' + Math.floor(Math.random() * 1e6);
        var s = U.el('select', { id: id }, [U.el('option', { value: '', text: allLabel })].concat(options.map(function (o) { return U.el('option', { value: o.value, text: o.label }); })));
        return { el: U.el('div', { class: 'field' }, [U.el('label', { for: id, text: label }), s]), sel: s };
      }
      var temas = []; figs.forEach(function (f) { if (temas.indexOf(f.tema) < 0) temas.push(f.tema); });
      var fS = select(F.sesion, (NS.data.schedule || []).map(function (s) { return { value: String(s.n), label: 'Sesión ' + s.n }; }), F.all);
      var fT = select(F.tema, temas.map(function (t) { return { value: t, label: t }; }), F.allM);
      var tipos = Object.keys(NS.data.badges || {}).filter(function (k) { return ['Con matiz', 'Revisar antes de clase', 'Ejemplo ilustrativo', 'Personajes inventados', 'Esquema'].indexOf(k) < 0; });
      var fY = select(F.tipo, tipos.map(function (t) { return { value: t, label: t }; }), F.allM);
      var fE = select(F.estado, ['Vigente', 'Con matiz', 'Revisar antes de clase'].map(function (t) { return { value: t, label: t }; }), F.allM);
      main.appendChild(U.el('div', { class: 'grid grid-4 no-print' }, [fS.el, fT.el, fY.el, fE.el]));
      var count = U.el('p', { class: 'score', 'aria-live': 'polite' });
      var grid = U.el('div', { class: 'fig-grid' });
      main.appendChild(count);
      main.appendChild(grid);
      function draw() {
        grid.innerHTML = '';
        var shown = figs.filter(function (f) {
          if (fS.sel.value && (sess[f.id] || []).indexOf(Number(fS.sel.value)) < 0) return false;
          if (fT.sel.value && f.tema !== fT.sel.value) return false;
          if (fY.sel.value && f.tipo !== fY.sel.value) return false;
          if (fE.sel.value && f.estado !== fE.sel.value) return false;
          return true;
        });
        shown.forEach(function (f) {
          var c = ui.figureCardHTML(f.id, { showId: true, anchor: true });
          if (params.query && params.query.f === f.id) c.classList.add('is-target');
          grid.appendChild(c);
        });
        count.textContent = T.count.replace('{n}', shown.length);
      }
      [fS, fT, fY, fE].forEach(function (x) { x.sel.addEventListener('change', draw); });
      draw();
      var how = U.el('aside', { class: 'card no-blob', 'aria-label': T.howTitle }, [
        U.el('h2', { text: T.howTitle }),
        U.el('p', { text: T.howText }),
        U.el('a', { class: 'btn btn-small', href: '#/sesion/3?s=tema-2', text: T.howLink })
      ]);
      main.appendChild(how);
      if (params.query && params.query.f) setTimeout(function () { var t = document.getElementById('fig-' + params.query.f); if (t) { t.scrollIntoView({ block: 'center' }); t.setAttribute('tabindex', '-1'); t.focus(); } }, 80);
    }
  };
})(window.IAHI);
