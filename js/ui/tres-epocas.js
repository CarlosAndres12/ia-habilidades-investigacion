/* §8.2 «La misma pregunta, tres épocas» (sesión 1, §1.2): three panels with the question and its
   translation, a stored guess per panel, «Ver lo que registra el curso», then the discussion. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets['tres-epocas'] = function () {
    var W = NS.data.widgets['tres-epocas'];
    var saved = NS.store.get('w:tres-epocas', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var grid = U.el('div', { class: 'grid grid-3' });
    var answers = [];
    W.panels.forEach(function (title, i) {
      var id = 'te-' + i;
      var ta = U.el('textarea', { id: id, rows: '3' });
      ta.value = saved[i] || '';
      ta.addEventListener('input', function () { saved[i] = ta.value; NS.store.set('w:tres-epocas', saved); });
      var ans = U.el('p', { class: 'reveal', hidden: true, text: i === 0 ? W.elizaAnswer : W.otherAnswer });
      answers.push(ans);
      grid.appendChild(U.el('article', { class: 'card no-blob' }, [
        U.el('h5', { class: 'h4', text: title }),
        U.el('p', {}, [U.el('em', { lang: 'en', text: '«' + W.question + '»' })]),
        U.el('p', { class: 'note', text: W.translation }),
        U.el('div', { class: 'field' }, [U.el('label', { for: id, text: W.guessLabel }), ta]),
        ans
      ]));
    });
    wrap.appendChild(grid);
    var after = U.el('div', { hidden: true }, W.after.map(function (t) { return U.el('p', { text: t }); }));
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn', text: W.reveal, onclick: function (ev) { answers.forEach(function (a) { a.hidden = false; }); after.hidden = false; ev.target.disabled = true; U.announce(W.after[0]); } }));
    wrap.appendChild(after);
    wrap.appendChild(U.el('p', { class: 'row' }, W.links.map(function (k) { return ui.ext(k); })));
    return wrap;
  };
})(window.IAHI);
