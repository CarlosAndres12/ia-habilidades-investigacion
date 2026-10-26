/* §8.6 «Temperatura» (sesión 2, §2.1): the candidates after «La informalidad laboral en Colombia es»
   as bars without values; a slider from «baja» to «alta» with no numbers; «Elegir un token» draws one
   candidate with the current proportions. The proportions are invented (labeled «Ejemplo ilustrativo»
   and «Esquema»): they only show the effect of temperature. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  var BASE = [4.2, 2.6, 2.2, 1.0];   // invented logits for the illustration (never shown)

  ui.widgets.temperatura = function () {
    var W = NS.data.widgets.temperatura;
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var sentence = U.el('p', { class: 'lead', 'aria-live': 'polite', text: W.prompt });
    var slider = U.el('input', { type: 'range', min: '0', max: '100', value: '30', id: 'temp-slider', 'aria-valuetext': W.low });
    var bars = U.el('ul', { class: 'bar-list' });
    var rows = W.candidates.map(function (c) {
      var meter = U.el('span', {});
      bars.appendChild(U.el('li', {}, [U.el('span', { text: '«' + c + '»' }), U.el('div', { class: 'meter', 'aria-hidden': 'true' }, [meter])]));
      return meter;
    });
    var r = NS.engine.rng('temperatura');
    function probs() {
      var u = Number(slider.value) / 100;
      var temp = 0.15 + u * 2.35;
      var ex = BASE.map(function (z) { return Math.exp(z / temp); });
      var s = ex.reduce(function (a, b) { return a + b; }, 0);
      return ex.map(function (e) { return e / s; });
    }
    function draw() {
      var pr = probs(), mx = Math.max.apply(null, pr);
      rows.forEach(function (m, i) { m.style.width = (pr[i] / mx * 100) + '%'; });
      var u = Number(slider.value);
      slider.setAttribute('aria-valuetext', u < 34 ? W.low : (u > 66 ? W.high : W.low + ' a ' + W.high));
    }
    slider.addEventListener('input', draw);
    wrap.appendChild(sentence);
    wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'temp-slider', text: W.slider }), U.el('div', { class: 'row' }, [U.el('span', { text: W.low }), slider, U.el('span', { text: W.high })])]));
    wrap.appendChild(bars);
    wrap.appendChild(U.el('div', { class: 'row' }, [
      U.el('button', { type: 'button', class: 'btn btn-primary btn-small', text: W.pick, onclick: function () {
        var pr = probs(), x = r(), acc = 0, k = 0;
        for (var i = 0; i < pr.length; i++) { acc += pr[i]; if (x <= acc) { k = i; break; } }
        sentence.textContent += ' ' + W.candidates[k];
      } }),
      U.el('button', { type: 'button', class: 'btn btn-small', text: W.reset, onclick: function () { sentence.textContent = W.prompt; } })
    ]));
    wrap.appendChild(U.el('p', { class: 'note' }, [ui.badge(NS.data.workbook.example), ' ', ui.badge(W.badge), ' ', W.note]));
    wrap.appendChild(U.el('p', {}, [ui.ext(W.link, W.linkText)]));
    draw();
    return wrap;
  };
})(window.IAHI);
