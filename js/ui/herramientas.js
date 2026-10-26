/* «Herramientas» (#/herramientas) · spec §7: content Anexos C · Herramientas por sesión, then the tool
   tables of §4.1, §4.2, §5.2, Sesión 6 · Elegir herramienta and Sesión 7 · Herramientas del
   laboratorio. Cells with prices or plan limits carry «Revisar antes de clase» and the bank's cards. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function tableSection(main, title, t, figs) {
    if (!t) return;
    var s = ui.section(title);
    s.appendChild(ui.table(t.head, t.rows, ui.priceCell));
    if (figs && figs.length) s.appendChild(ui.figureGrid(figs));
    main.appendChild(s);
  }

  NS.ui.views.herramientas = {
    title: function () { return NS.data.ui.herramientas.title; },
    render: function (main) {
      var T = NS.data.ui.herramientas, H = NS.data.herramientas || {};
      ui.head(main, T.title);
      main.appendChild(U.el('p', { class: 'card no-blob', role: 'note' }, [ui.badge('Revisar antes de clase'), ' ', T.note, ' ', NS.data.ui.consultedShort + '.']));
      // Anexos C · Herramientas por sesión
      var bib = (NS.data.bibliografia || {}).blocks || [];
      var start = -1;
      bib.forEach(function (b, i) { if (b.type === 'p' && /Herramientas por sesión/.test(b.text)) start = i; });
      if (start >= 0) {
        var s = ui.section('Herramientas por sesión');
        var chunk = [];
        for (var i = start + 1; i < bib.length; i++) { if (bib[i].type === 'p' && /^\*\*/.test(bib[i].text)) break; chunk.push(bib[i]); }
        s.appendChild(ui.blocks(chunk, { tableCell: ui.priceCell }));
        main.appendChild(s);
      }
      tableSection(main, H.busqueda ? H.busqueda.part : '', H.busqueda, ['busqueda.bases', 'herr.undermind', 'herr.consensus', 'herr.consensus-gratis', 'herr.elicit', 'herr.connected']);
      tableSection(main, H.proyectos ? H.proyectos.part : '', H.proyectos);
      tableSection(main, H.piezas ? H.piezas.part : '', H.piezas);
      tableSection(main, H.entornos ? H.entornos.part : '', H.entornos);
      tableSection(main, H.lab1Opciones ? H.lab1Opciones.part : '', H.lab1Opciones, ['lab1.opencode', 'lab1.claude', 'lab1.chatgpt', 'lab1.baratos']);
      tableSection(main, H.lab2 ? H.lab2.part : '', H.lab2, ['lab2.notebook', 'lab2.datavoyager', 'lab2.claude-archivos', 'lab2.researchrabbit', 'lab2.ram-local', 'lab2.modelos-locales']);
    }
  };
})(window.IAHI);
