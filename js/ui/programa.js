/* «Programa» (#/programa) · spec §7: content Programa transcribed in order; the six axes as legend
   cards; the evaluation with its figure cards; the responsible-use rules printable as one page. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  NS.ui.views.programa = {
    title: function () { return 'Programa'; },
    render: function (main) {
      var prog = NS.data.programa || [];
      main.appendChild(U.el('h1', { text: 'Programa' }));
      prog.forEach(function (sec, i) {
        if (!sec.title) { main.appendChild(ui.blocks(sec.blocks)); return; }
        var s = ui.section(sec.title, { id: 'p' + i });
        if (/^Ejes de implicaciones/.test(sec.title)) {
          var intro = sec.blocks.filter(function (b) { return b.type !== 'table'; });
          s.appendChild(ui.blocks(intro));
          var tb = sec.blocks.filter(function (b) { return b.type === 'table'; })[0];
          s.appendChild(U.el('div', { class: 'grid grid-3' }, (NS.data.legend || []).map(function (l) {
            var row = tb ? tb.rows.filter(function (r) { return r[0] === l.label; })[0] : null;
            return U.el('article', { class: 'card no-blob impl-card slot-' + l.slot }, [
              ui.legendChip(l.id),
              U.el('p', {}, [U.el('strong', { text: 'Pregunta guía: ' }), row ? row[1] : l.question]),
              row ? U.el('p', {}, [U.el('strong', { text: 'Ejemplo de decisión: ' }), U.el('span', { html: U.markup(row[2]) })]) : null
            ]);
          })));
        } else {
          s.appendChild(ui.blocks(sec.blocks, { tableCell: ui.priceCell }));
        }
        if (/^Evaluación/.test(sec.title)) s.appendChild(ui.figureGrid(['curso.evaluacion', 'curso.certificacion']));
        if (/^Requisitos técnicos/.test(sec.title)) s.appendChild(U.el('a', { class: 'btn', href: '#/plantillas?t=B8', text: 'Ver la lista de chequeo técnica (B8)' }));
        if (/^Reglas de uso responsable/.test(sec.title)) s.appendChild(ui.printButton('Imprimir las reglas', function () { s.classList.add('print-target'); document.body.classList.add('print-one'); setTimeout(function () { s.classList.remove('print-target'); document.body.classList.remove('print-one'); }, 1500); }));
        main.appendChild(s);
      });
    }
  };
})(window.IAHI);
