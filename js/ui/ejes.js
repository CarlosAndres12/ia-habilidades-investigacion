/* «Los seis ejes» (#/ejes) · spec §7: the six legend items as large cards (guiding question and
   example decision, verbatim), «Implicaciones por eje» with six filter chips and a counter, and
   «Seis preguntas antes de usar IA en su proyecto» as a printable card. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  // every tagged implication of the course, with its session
  ui.allImplications = function () {
    var out = [];
    Object.keys(NS.data.sesiones || {}).forEach(function (n) {
      (NS.data.sesiones[n].parts || []).forEach(function (p) {
        (p.implications || []).forEach(function (imp) { out.push({ n: Number(n), topic: p.title, imp: imp }); });
      });
    });
    return out;
  };

  NS.ui.views.ejes = {
    title: function () { return NS.data.ui.ejes.title; },
    render: function (main, params) {
      var T = NS.data.ui.ejes;
      ui.head(main, T.title, T.lead);
      var prog = (NS.data.programa || []).filter(function (s) { return s.title && /^Ejes de implicaciones/.test(s.title); })[0];
      var tb = prog ? prog.blocks.filter(function (b) { return b.type === 'table'; })[0] : null;
      main.appendChild(U.el('div', { class: 'grid grid-2' }, (NS.data.legend || []).map(function (l) {
        var row = tb ? tb.rows.filter(function (r) { return r[0] === l.label; })[0] : null;
        return U.el('article', { class: 'card no-blob impl-card slot-' + l.slot, id: 'eje-' + l.id }, [
          U.el('h2', {}, [ui.legendChip(l.id)]),
          U.el('p', {}, [U.el('strong', { text: T.question + ': ' }), row ? row[1] : l.question]),
          row ? U.el('p', {}, [U.el('strong', { text: T.example + ': ' }), U.el('span', { html: U.markup(row[2]) })]) : null
        ]);
      })));

      // «Implicaciones por eje»
      var sec = ui.section(T.byAxis, { id: 'por-eje' });
      var chips = U.el('div', { class: 'legend-row legend-filter', role: 'group', 'aria-label': T.byAxis });
      var counter = U.el('p', { class: 'score', 'aria-live': 'polite' });
      var list = U.el('div');
      var all = ui.allImplications();
      var current = params.query && params.query.eje ? params.query.eje : (NS.data.legend[0] || {}).id;
      (NS.data.legend || []).forEach(function (l) {
        var b = ui.legendChip(l.id, { button: true, pressed: l.id === current });
        b.addEventListener('click', function () { current = l.id; draw(); });
        chips.appendChild(b);
      });
      function draw() {
        U.$$('button', chips).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-axis') === current ? 'true' : 'false'); });
        var items = all.filter(function (x) { return (x.imp.axes || []).indexOf(current) >= 0; });
        counter.textContent = items.length === 1 ? T.counterOne : T.counter.replace('{n}', items.length);
        list.innerHTML = '';
        var bySession = {};
        items.forEach(function (x) { (bySession[x.n] = bySession[x.n] || []).push(x); });
        Object.keys(bySession).forEach(function (n) {
          var S = NS.data.sesiones[n];
          list.appendChild(U.el('h3', { text: 'Sesión ' + n + ' · ' + S.title }));
          list.appendChild(U.el('div', { class: 'grid grid-2' }, bySession[n].map(function (x) { return ui.implicationCard(x.imp); })));
          list.appendChild(U.el('a', { href: '#/sesion/' + n, text: T.goSession.replace('{n}', n) }));
        });
      }
      sec.appendChild(chips); sec.appendChild(counter); sec.appendChild(list);
      main.appendChild(sec);
      draw();

      // «Seis preguntas antes de usar IA en su proyecto»
      var q = ui.section(T.sixQuestions, { id: 'seis-preguntas' });
      var card = U.el('article', { class: 'card no-blob' }, [U.el('ol', {}, (NS.data.legend || []).map(function (l) {
        return U.el('li', {}, [ui.legendChip(l.id), U.el('p', { text: l.question })]);
      }))]);
      q.appendChild(card);
      q.appendChild(ui.printButton('Imprimir', function () { card.classList.add('print-target'); document.body.classList.add('print-one'); setTimeout(function () { card.classList.remove('print-target'); document.body.classList.remove('print-one'); }, 1500); }));
      main.appendChild(q);
    }
  };
})(window.IAHI);
