/* §8.10 «Tarjetas del debate» (sesión 3, §3.1): the motion and the alternative motion (verbatim),
   three role cards with their public instructions, the debate timer (from curso.debate) and the
   readings of the debate. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.debate = function () {
    var W = NS.data.widgets.debate;
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    wrap.appendChild(U.el('p', {}, [U.el('strong', { text: W.motionLabel + ': ' }), '«' + W.motion + '»']));
    wrap.appendChild(U.el('p', {}, [U.el('strong', { text: W.altLabel + ': ' }), '«' + W.alt + '»']));
    wrap.appendChild(U.el('div', { class: 'grid grid-3' }, W.roles.map(function (r, i) {
      return U.el('article', { class: 'card ' + ['accent-1', 'accent-3', 'accent-2'][i] }, [U.el('h5', { class: 'h4', text: r.title }), U.el('p', { text: r.text })]);
    })));
    wrap.appendChild(ui.figureCardHTML('curso.debate'));
    wrap.appendChild(ui.widgets.temporizador({ title: W.timerTitle, segments: W.timer }));
    // the readings of §3.1 (the content's links in that topic)
    var part = NS.data.sesiones[3].parts.filter(function (p) { return /^3\.1/.test(p.title); })[0];
    var keys = [];
    if (part) JSON.stringify(part.blocks).replace(/\(ref:([a-z0-9-]+)\)/g, function (m, k) { if (keys.indexOf(k) < 0) keys.push(k); return m; });
    if (keys.length) {
      wrap.appendChild(U.el('h5', { class: 'h4', text: W.readingsTitle }));
      wrap.appendChild(U.el('ul', { class: 'source-list' }, keys.map(function (k) { return U.el('li', {}, [ui.ext(k)]); })));
    }
    return wrap;
  };
})(window.IAHI);
