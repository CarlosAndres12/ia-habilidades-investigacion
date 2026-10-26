/* «Glosario» (#/glosario) · spec §4.7: both tables of content Anexos A in alphabetical order, a
   search box, a filter by table and, for each term, the sessions where it appears. Also
   ui.glossify(container): the first use of each term in a view becomes a chip with its definition. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function key(term) { return String(term).replace(/\s*\([^)]*\)\s*$/, '').trim(); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var sessionsCache = null;
  function sessionsOf(term) {
    if (!sessionsCache) {
      sessionsCache = {};
      Object.keys(NS.data.sesiones || {}).forEach(function (n) { sessionsCache[n] = norm(JSON.stringify(NS.data.sesiones[n])); });
    }
    var k = norm(key(term));
    return Object.keys(sessionsCache).filter(function (n) { return k.length > 2 && sessionsCache[n].indexOf(k) >= 0; });
  }

  // wraps the first occurrence of each glossary term inside `root` in a glossary chip
  ui.glossify = function (root) {
    var terms = (NS.data.glosario || []).map(function (g) { return { term: g.term, k: key(g.term) }; })
      .filter(function (t) { return t.k.length > 3; })
      .sort(function (a, b) { return b.k.length - a.k.length; });
    var done = {};
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (p.closest('a, button, h1, h2, h3, h4, code, pre, label, select, option, textarea, .glos-chip, .badge, .chip, figcaption, summary, .player, .fig-card, .legend-item, .stamp, .no-glos')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      terms.forEach(function (t) {
        if (done[t.k] || !node.parentNode) return;
        var text = node.nodeValue;
        var re = new RegExp('(^|[^\\wáéíóúñü])(' + t.k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\wáéíóúñü])', 'i');
        var m = re.exec(text);
        if (!m) return;
        done[t.k] = true;
        var start = m.index + m[1].length, end = start + m[2].length;
        var after = node.splitText(start);
        after.splitText(end - start);
        var chip = U.el('button', { type: 'button', class: 'glos-chip', 'data-term': t.term, text: after.nodeValue });
        after.parentNode.replaceChild(chip, after);
        node = chip.nextSibling && chip.nextSibling.nodeType === 3 ? chip.nextSibling : node;
      });
    });
  };

  NS.ui.views.glosario = {
    title: function () { return NS.data.ui.glosario.title; },
    render: function (main, params) {
      var T = NS.data.ui.glosario;
      ui.head(main, T.title, T.lead);
      var list = (NS.data.glosario || []).slice().sort(function (a, b) { return norm(a.term).localeCompare(norm(b.term)); });
      var tables = []; list.forEach(function (g) { if (tables.indexOf(g.table) < 0) tables.push(g.table); });
      var search = U.el('input', { type: 'search', id: 'glos-search', placeholder: T.search });
      var tab = U.el('select', { id: 'glos-table' }, [U.el('option', { value: '', text: 'Todas las tablas' })].concat(tables.map(function (t) { return U.el('option', { value: t, text: t }); })));
      main.appendChild(U.el('div', { class: 'grid grid-2 no-print' }, [
        U.el('div', { class: 'field' }, [U.el('label', { for: 'glos-search', text: T.search }), search]),
        U.el('div', { class: 'field' }, [U.el('label', { for: 'glos-table', text: 'Tabla' }), tab])
      ]));
      var count = U.el('p', { class: 'score', 'aria-live': 'polite' });
      var dl = U.el('dl', { class: 'glossary' });
      main.appendChild(count);
      main.appendChild(dl);
      if (params.query && params.query.t) search.value = key(params.query.t);
      function draw() {
        var q = norm(search.value.trim());
        dl.innerHTML = '';
        var shown = list.filter(function (g) { return (!tab.value || g.table === tab.value) && (!q || norm(g.term).indexOf(q) >= 0 || norm(g.def).indexOf(q) >= 0); });
        shown.forEach(function (g) {
          var ss = sessionsOf(g.term);
          dl.appendChild(U.el('div', { class: 'card no-blob glossary-item', id: 'term-' + U.slug(g.term) }, [
            U.el('dt', { text: g.term }),
            U.el('dd', { html: U.markup(g.def) }),
            U.el('dd', { class: 'note' }, [g.table + (ss.length ? ' · Sesiones: ' : '')].concat(ss.map(function (n, i) { return U.el('a', { href: '#/sesion/' + n, text: (i ? ', ' : '') + n }); })))
          ]));
        });
        count.textContent = shown.length + (shown.length === 1 ? ' término' : ' términos');
      }
      search.addEventListener('input', draw);
      tab.addEventListener('change', draw);
      draw();
    }
  };
})(window.IAHI);
