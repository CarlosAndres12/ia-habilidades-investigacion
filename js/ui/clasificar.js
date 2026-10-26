/* Sorting game (spec §8.0 «clasificar»): cards into labeled bins by drag and drop or by keyboard
   (Tab to a card, Enter to pick it, arrow keys to choose a bin, Enter to drop it). Each card is
   checked on drop; feedback always shows a mark with words and is announced with aria-live. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function path(obj, p) { return p.split('.').reduce(function (o, k) { return o ? o[k] : null; }, obj); }

  // Builds the cards of a game, from its own list or from the content table it names.
  function cardsOf(g) {
    if (g.cards) {
      return g.cards.map(function (c) {
        return {
          text: c.text, bin: c.bin,
          explain: c.explain || (g.explain || {})[c.bin] || '',
          hint: c.hint || (g.hints || {})[c.bin] || g.hint || ''
        };
      });
    }
    var t = path(NS.data, g.from);
    var out = [];
    if (g.from === 'herramientas.piezas') {
      t.rows.forEach(function (r) {
        [r[2], r[3]].forEach(function (txt) { out.push({ text: txt, bin: r[0], explain: r[0] + ': ' + r[1] + '.', hint: g.hint }); });
      });
    } else if (g.from === 'riesgos.riesgos') {
      g.bins = t.rows.map(function (r) { return r[0]; });
      t.rows.forEach(function (r) { out.push({ text: r[2], bin: r[0], explain: r[0] + '. ' + t.head[1] + ': ' + r[1] + '.', hint: g.hint }); });
    }
    return out;
  }

  ui.widgets.clasificar = function (gameId) {
    var g = (NS.data.juegos || {})[gameId];
    if (!g) return U.el('p', { text: gameId });
    var W = NS.data.widgets.juego;
    var cards = cardsOf(g);
    var r = NS.engine.rng(gameId);
    var order = cards.map(function (c, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }

    var wrap = U.el('section', { class: 'widget widget-game card no-blob', 'aria-label': g.title });
    wrap.appendChild(U.el('h4', { text: g.title }));
    if (g.intro) wrap.appendChild(U.el('p', { class: 'note', text: g.intro }));
    var counter = U.el('p', { class: 'score', 'aria-live': 'polite' });
    var fb = U.el('p', { class: 'feedback', 'aria-live': 'polite' });
    var pool = U.el('ul', { class: 'game-pool', 'aria-label': 'Tarjetas por clasificar' });
    var binsBox = U.el('div', { class: 'game-bins', role: 'group', 'aria-label': W.bins });
    var picked = null;
    var placed = 0;

    var bins = (g.bins || []).map(function (name) {
      var list = U.el('ul', { class: 'bin-list' });
      var btn = U.el('button', { type: 'button', class: 'bin', 'aria-label': W.drop + ' «' + name + '»', 'data-bin': name }, [U.el('span', { class: 'bin-title', text: name })]);
      var box = U.el('div', { class: 'bin-box' }, [btn, list]);
      btn.addEventListener('click', function () { if (picked) drop(picked, name); });
      btn.addEventListener('keydown', function (ev) {
        var idx = bins.map(function (b) { return b.btn; }).indexOf(btn);
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); bins[(idx + 1) % bins.length].btn.focus(); }
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); bins[(idx - 1 + bins.length) % bins.length].btn.focus(); }
        if (ev.key === 'Escape' && picked) { var c = picked; unpick(); c.el.focus(); }
      });
      box.addEventListener('dragover', function (ev) { ev.preventDefault(); box.classList.add('is-over'); });
      box.addEventListener('dragleave', function () { box.classList.remove('is-over'); });
      box.addEventListener('drop', function (ev) {
        ev.preventDefault(); box.classList.remove('is-over');
        var k = parseInt(ev.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(k)) drop(items[k], name);
      });
      binsBox.appendChild(box);
      return { name: name, btn: btn, list: list };
    });

    var items = cards.map(function (c, k) {
      var el = U.el('button', { type: 'button', class: 'chip game-card', draggable: 'true', 'aria-pressed': 'false', text: c.text, title: W.pick });
      var it = { card: c, el: el, k: k, done: false };
      el.addEventListener('click', function () { if (it.done) return; if (picked === it) { unpick(); return; } pick(it); });
      el.addEventListener('dragstart', function (ev) { ev.dataTransfer.setData('text/plain', String(k)); pick(it, true); });
      return it;
    });
    order.forEach(function (k) { pool.appendChild(U.el('li', {}, [items[k].el])); });

    function pick(it, silent) {
      unpick();
      picked = it;
      it.el.setAttribute('aria-pressed', 'true');
      if (!silent && bins.length) bins[0].btn.focus();
    }
    function unpick() { if (picked) picked.el.setAttribute('aria-pressed', 'false'); picked = null; }
    function drop(it, name) {
      if (!it || it.done) return;
      if (it.card.bin === name) {
        it.done = true;
        placed++;
        it.el.setAttribute('aria-pressed', 'false');
        it.el.setAttribute('aria-disabled', 'true');
        it.el.draggable = false;
        var li = it.el.parentNode;
        bins.filter(function (b) { return b.name === name; })[0].list.appendChild(U.el('li', {}, [it.el]));
        if (li && li.parentNode) li.remove();
        ui.feedback(fb, true, it.card.explain);
        picked = null;
        update();
        var next = items.filter(function (x) { return !x.done; })[0];
        if (next) next.el.focus();
      } else {
        unpick();
        ui.feedback(fb, false, it.card.hint);
        it.el.focus();
      }
    }
    function update() {
      counter.textContent = W.counter.replace('{n}', placed).replace('{N}', items.length);
      if (placed === items.length) {
        fb.appendChild(U.el('span', { text: ' ' + W.done }));
        U.announce(W.done);
        restart.hidden = false;
      }
    }
    var restart = U.el('button', { type: 'button', class: 'btn btn-small', text: W.restart, hidden: true, onclick: function () {
      var fresh = ui.widgets.clasificar(gameId);
      wrap.replaceWith(fresh);
      var f = fresh.querySelector('.game-card'); if (f) f.focus();
    } });
    wrap.appendChild(pool);
    wrap.appendChild(binsBox);
    wrap.appendChild(counter);
    wrap.appendChild(fb);
    if (g.note) wrap.appendChild(U.el('p', { class: 'note' }, [g.note + ' ', g.noteBadge ? ui.badge(g.noteBadge) : null]));
    wrap.appendChild(restart);
    update();
    return wrap;
  };
})(window.IAHI);
