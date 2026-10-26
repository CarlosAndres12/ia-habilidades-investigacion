/* «Acerca del sitio» (#/acerca) · spec §7: the transparency notes in full, how the site works
   offline, where data are stored, the keyboard shortcuts of the player and of «Modo clase», the
   fiction note and the style credit. ?s=reproductor opens the player guide. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  NS.ui.views.acerca = {
    title: function () { return NS.data.ui.acerca.title; },
    render: function (main, params) {
      var T = NS.data.ui, F = T.footer;
      ui.head(main, T.acerca.title);
      var a = ui.section('Cómo se hizo este sitio');
      [F.transparency, F.declaration, F.credit, T.acerca.fiction, T.consulted].forEach(function (t) { a.appendChild(U.el('p', { text: t })); });
      main.appendChild(a);
      var b = ui.section('Sin conexión y sin cuentas');
      b.appendChild(U.el('p', { text: 'El sitio funciona sin conexión: basta abrir index.html con doble clic. No envía datos a ningún servicio y no carga nada de fuera de su carpeta; los enlaces externos se abren en una pestaña nueva y llevan la etiqueta «enlace externo».' }));
      b.appendChild(U.el('p', { text: 'Lo que usted escribe (el cuaderno, las listas de chequeo y la posición de cada video) se guarda únicamente en este navegador. Exporte su cuaderno para no perderlo: si borra los datos del navegador, se borra. El botón «Borrar mis datos de este navegador», al pie de cada página, lo elimina todo después de una confirmación.' }));
      b.appendChild(U.el('p', { text: 'Los videos se dibujan con código mientras se reproducen. Si las voces todavía no se han generado, el sitio usa la voz del navegador y lo indica con la nota «Voz del navegador».' }));
      main.appendChild(b);
      var c = ui.section('Guía rápida del reproductor', { id: 'reproductor' });
      c.appendChild(U.el('ul', { class: 'kbd-list' }, [
        'Espacio o K: reproducir o pausar.', '← y →: retroceder o avanzar 5 segundos.', 'Mayúscula + ← y Mayúscula + →: capítulo anterior o siguiente.',
        'C: subtítulos.', 'F: pantalla completa.',
        'Opciones: «Subtítulos», «Voz», «Velocidad» (0,75× o 1×), «Preguntas interactivas», «Pausar al final de cada capítulo», «Transcripción» y «Cifras de este video».',
        '«Descargar video» graba el video en tiempo real en este navegador; con el sitio abierto como archivo (file://) se graba sin voz. Para grabar con voz, sirva la carpeta en local (vea el README).'
      ].map(function (t) { return U.el('li', { text: t }); })));
      main.appendChild(c);
      var d = ui.section('Teclas del Modo clase');
      d.appendChild(U.el('p', { text: T.clase.keys }));
      main.appendChild(d);
      if (params.query && params.query.s) setTimeout(function () { var x = document.getElementById(params.query.s); if (x) x.scrollIntoView(); }, 60);
    }
  };
})(window.IAHI);
