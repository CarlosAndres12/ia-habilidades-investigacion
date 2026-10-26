/* §8.9 «¿La IA amplía o estrecha la ciencia?» (sesión 3, apertura y cierre): a five-step scale
   answered twice; after the second answer it shows both. Stored only in this browser. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.escala = function () {
    var W = NS.data.widgets.escala;
    var saved = NS.store.get('w:escala', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var both = U.el('p', { class: 'result-box', 'aria-live': 'polite', hidden: true });
    W.moments.forEach(function (m, mi) {
      var fs = U.el('fieldset', {}, [U.el('legend', { text: m })]);
      var row = U.el('div', { class: 'scale-row', role: 'radiogroup', 'aria-label': m });
      for (var v = 1; v <= 5; v++) (function (val) {
        var lab = val === 1 ? val + ' · ' + W.low : (val === 5 ? val + ' · ' + W.high : String(val));
        var b = U.el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': saved[mi] === val ? 'true' : 'false', text: lab });
        b.addEventListener('click', function () {
          saved[mi] = val; NS.store.set('w:escala', saved);
          U.$$('button', row).forEach(function (x, k) { x.setAttribute('aria-checked', k + 1 === val ? 'true' : 'false'); });
          show();
        });
        row.appendChild(b);
      })(v);
      fs.appendChild(row);
      wrap.appendChild(fs);
    });
    function show() {
      if (saved[0] && saved[1]) {
        both.hidden = false;
        both.textContent = W.both + ': ' + W.moments[0].toLowerCase() + ', ' + saved[0] + '; ' + W.moments[1].toLowerCase() + ', ' + saved[1] + '. (1 = ' + W.low + ', 5 = ' + W.high + ')';
      }
    }
    wrap.appendChild(both);
    wrap.appendChild(U.el('p', { class: 'note', text: W.note }));
    show();
    return wrap;
  };
})(window.IAHI);
