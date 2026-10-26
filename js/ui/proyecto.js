/* «Proyecto final» (#/proyecto) · spec §4.9 and §7: what the final project is, the presentation
   structure, the deliverables, the gallery variant and the rubric (content Sesión 8), with the
   evaluation cards and links to the three builders (flow, rubric, AI-use declaration). */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  NS.ui.views.proyecto = {
    title: function () { return NS.data.ui.proyecto.title; },
    render: function (main) {
      var T = NS.data.ui.proyecto, R = NS.data.rubrica || {};
      ui.head(main, T.title, T.lead);
      main.appendChild(U.el('div', { class: 'row' }, [
        U.el('a', { class: 'btn btn-primary', href: '#/cuaderno?s=flujo', text: T.links[0] }),
        U.el('a', { class: 'btn', href: '#/cuaderno?s=rubrica', text: T.links[1] }),
        U.el('a', { class: 'btn', href: '#/cuaderno?s=declaracion', text: T.links[2] })
      ]));
      main.appendChild(ui.figureGrid(['curso.evaluacion', 'curso.presentacion', 'curso.entrega', 'curso.rubrica']));
      var s1 = ui.section('Antes de la sesión 8');
      s1.appendChild(ui.blocks(R.antes || []));
      main.appendChild(s1);
      var s2 = ui.section('Estructura de cada presentación (8 minutos)');
      s2.appendChild(U.el('ol', {}, (R.estructura || []).map(function (it) { return U.el('li', { html: U.markup(it) }); })));
      var est = ui.sceneFigure('v8:estructura'); if (est) s2.appendChild(est);
      main.appendChild(s2);
      var s3 = ui.section('Rúbrica');
      if (R.rubrica) s3.appendChild(ui.table(R.rubrica.head, R.rubrica.rows));
      main.appendChild(s3);
      var s4 = ui.section('Agenda y variante de galería');
      s4.appendChild(ui.blocks(R.agenda || []));
      s4.appendChild(ui.figureGrid(['curso.galeria']));
      main.appendChild(s4);
      main.appendChild(ui.stamp('stamp-autora'));
    }
  };
})(window.IAHI);
