/* §8.7 «Razón de tokens» (sesión 2, §2.2): two whole numbers ≥ 1; the ratio to two decimals in the
   es-CO format (155 and 100 give «1,55»), the card of tokens.espanol and the note on the tokenizer. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.tokenRatio = function (es, en) {
    var ok = function (v) { return /^\s*\d+\s*$/.test(String(v)) && parseInt(v, 10) >= 1; };
    if (!ok(es) || !ok(en)) return null;
    return U.fmtNumber(parseInt(es, 10) / parseInt(en, 10), 2);
  };

  ui.widgets['razon-tokens'] = function () {
    var W = NS.data.widgets['razon-tokens'];
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var es = U.el('input', { type: 'text', inputmode: 'numeric', id: 'rt-es' });
    var en = U.el('input', { type: 'text', inputmode: 'numeric', id: 'rt-en' });
    var out = U.el('p', { class: 'result-box', 'aria-live': 'polite' });
    function calc() {
      if (!es.value && !en.value) { out.textContent = ''; return; }
      var x = ui.tokenRatio(es.value, en.value);
      out.textContent = x == null ? W.error : W.result.replace('{x}', x);
    }
    es.addEventListener('input', calc); en.addEventListener('input', calc);
    wrap.appendChild(U.el('div', { class: 'grid grid-2' }, [
      U.el('div', { class: 'field' }, [U.el('label', { for: 'rt-es', text: W.es }), es]),
      U.el('div', { class: 'field' }, [U.el('label', { for: 'rt-en', text: W.en }), en])
    ]));
    wrap.appendChild(out);
    wrap.appendChild(ui.figureCardHTML(W.fig));
    wrap.appendChild(U.el('p', { class: 'note', text: W.note }));
    wrap.appendChild(U.el('p', { class: 'row' }, W.links.map(function (k) { return ui.ext(k); })));
    return wrap;
  };
})(window.IAHI);
