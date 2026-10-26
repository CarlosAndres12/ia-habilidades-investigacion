/* §8.26 «Autoevaluación con la rúbrica» (sesión 8): the five criteria with their level 4 and level 1
   descriptors (verbatim); a level from 1 to 4 for each; «Puntaje orientativo: X de 4» (20 % each, one
   decimal) and the note that the grade comes from the commenters and the teacher. Section 14. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.rubrica = function () {
    var W = NS.data.widgets.rubrica;
    var t = (NS.data.rubrica || {}).rubrica || { head: [], rows: [] };
    var data = NS.ui.wb.get('rubrica', {}) || {};
    data.levels = data.levels || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var out = U.el('p', { class: 'result-box big', 'aria-live': 'polite' });
    t.rows.forEach(function (r, i) {
      var fs = U.el('fieldset', {}, [U.el('legend', { html: U.markup(r[0]) + ' · ' + U.esc(r[1]) })]);
      fs.appendChild(U.el('p', { class: 'note' }, [U.el('strong', { text: t.head[2] + ': ' }), U.el('span', { html: U.markup(r[2]) })]));
      fs.appendChild(U.el('p', { class: 'note' }, [U.el('strong', { text: t.head[3] + ': ' }), U.el('span', { html: U.markup(r[3]) })]));
      var row = U.el('div', { class: 'scale-row', role: 'radiogroup', 'aria-label': W.level });
      [1, 2, 3, 4].forEach(function (lv) {
        var b = U.el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': data.levels[i] === lv ? 'true' : 'false', text: W.level + ' ' + lv });
        b.addEventListener('click', function () {
          data.levels[i] = lv; NS.ui.wb.set('rubrica', data);
          U.$$('button', row).forEach(function (x, k) { x.setAttribute('aria-checked', k + 1 === lv ? 'true' : 'false'); });
          score();
        });
        row.appendChild(b);
      });
      fs.appendChild(row);
      wrap.appendChild(fs);
    });
    function score() {
      var vals = Object.keys(data.levels).map(function (k) { return data.levels[k]; });
      if (vals.length < t.rows.length) { out.textContent = ''; return; }
      var x = vals.reduce(function (a, b) { return a + b * 0.2; }, 0);
      out.textContent = W.result.replace('{x}', U.fmtNumber(x, 1));
    }
    wrap.appendChild(out);
    wrap.appendChild(U.el('p', { class: 'note', text: W.note }));
    score();
    return wrap;
  };
})(window.IAHI);
