/* «Plantillas» (#/plantillas) · spec §4.5: templates B1–B9 as cards with their title, the session
   where they are used, the verbatim text, fillable blanks with a live preview, «Copiar» and
   «Imprimir»; B2, B6 and B8 interactive; B4 and B7 linked to their widgets; «Usar en mi cuaderno». */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  var WB = { B1: 'ficha', B2: 'bitacora', B3: 'instruccion', B5: 'declaracion' };

  function card(t) {
    var W = NS.data.widgets;
    var el = U.el('article', { class: 'card no-blob template-card', id: 'plantilla-' + t.id });
    el.appendChild(U.el('h2', { text: t.id + '. ' + t.title }));
    if (t.note) el.appendChild(U.el('p', { class: 'note', html: U.markup(t.note) }));
    var code = t.blocks.filter(function (b) { return b.type === 'code'; })[0];
    if (t.id === 'B6' || t.id === 'B8') el.appendChild(ui.widgets.listaPlantilla(t.id));
    else if (t.id === 'B2') {
      var b2 = ui.b2Head();
      el.appendChild(ui.widgets.tabla({ columns: b2.head, rows: NS.ui.wb.get('bitacora', []) || [], example: b2.example, csvName: 'bitacora', onChange: function (rows) { NS.ui.wb.set('bitacora', rows); } }));
    } else if (t.id === 'B9') el.appendChild(ui.widgets.clausula({}));
    else if (t.id === 'B5') el.appendChild(ui.widgets.declaracion({}));
    else if (code && /\[[^\]]+\]/.test(code.text)) el.appendChild(ui.widgets.plantilla(t.id, { title: false, workbook: WB[t.id] }));
    else el.appendChild(ui.blocks(t.blocks, { codeTitle: t.title }));
    if (t.id === 'B4') el.appendChild(U.el('a', { class: 'btn btn-small no-print', href: '#/sesion/4?s=tema-3', text: W.verificar.title }));
    if (t.id === 'B7') el.appendChild(U.el('a', { class: 'btn btn-small no-print', href: '#/sesion/7?s=laboratorio', text: W.acuerdo.title }));
    var row = U.el('div', { class: 'row no-print' }, [U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.plantilla.print, onclick: function () { ui.printOnly(el); } })]);
    if (WB[t.id]) row.appendChild(U.el('a', { class: 'btn btn-small', href: '#/cuaderno?s=' + WB[t.id], text: W.plantilla.toWorkbook }));
    el.appendChild(row);
    return el;
  }

  NS.ui.views.plantillas = {
    title: function () { return NS.data.ui.plantillas.title; },
    render: function (main, params) {
      var T = NS.data.ui.plantillas;
      ui.head(main, T.title, T.lead);
      var list = NS.data.plantillas || [];
      main.appendChild(U.el('ul', { class: 'toc no-print' }, list.map(function (t) { return U.el('li', {}, [U.el('a', { class: 'chip', href: '#/plantillas?t=' + t.id, text: t.id, title: t.title, onclick: function (ev) { ev.preventDefault(); var x = document.getElementById('plantilla-' + t.id); if (x) x.scrollIntoView({ behavior: 'smooth' }); } })]); })));
      list.forEach(function (t) { main.appendChild(card(t)); });
      if (params.query && params.query.t) setTimeout(function () { var x = document.getElementById('plantilla-' + params.query.t); if (x) x.scrollIntoView(); }, 60);
    }
  };
})(window.IAHI);
