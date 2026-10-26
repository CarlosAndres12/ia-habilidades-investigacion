/* STYLE · Miró — page decorations (style S10), drawn once at load on small canvases and reused as
   CSS backgrounds through custom properties: paper grain, the card's corner shapes, the brush
   divider and underline, the feedback marks, the stamp ring, a few floating signs, the brand mark. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path;

  function url(w, h, draw) {
    try {
      var c = NS.engine.layers.canvas(w, h);
      draw(c.getContext('2d'), w, h);
      return 'url("' + c.toDataURL() + '")';
    } catch (e) { return 'none'; }
  }

  S.decoratePage = function () {
    var root = document.documentElement.style;
    var set = function (k, v) { try { root.setProperty(k, v); } catch (e) { /* ignore */ } };
    // the page gets only the fine grain of the paper (the washes stay in the videos)
    set('--paper-grain', url(480, 480, function (g, w, h) {
      var r = NS.engine.rng(7);
      g.fillStyle = S.role('ground'); g.fillRect(0, 0, w, h);
      for (var i = 0; i < w * h / 30; i++) {
        g.fillStyle = r() < 0.6 ? S.role('ink', r.range(0.02, 0.05)) : S.role('on-dark', r.range(0.2, 0.45));
        g.fillRect(r() * w, r() * h, r.range(0.6, 1.5), r.range(0.6, 1.5));
      }
    }));
    ['accent-1', 'accent-2', 'accent-3'].forEach(function (r, i) {
      set('--blob-' + (i + 1), url(184, 140, function (g) {
        S.fill(g, P.blob(92, 70, 74, 52, 4 + i * 7, 4, 0.24), { role: r, offset: false, seed: 4 + i });
      }));
    });
    set('--divider', url(1200, 28, function (g, w) { S.mark(g, 'divider', { x: 6, y: 0, w: w - 12, h: 28 }, {}); }));
    set('--divider-spiral', url(1200, 28, function (g, w) { S.mark(g, 'divider', { x: 6, y: 0, w: w - 12, h: 28 }, { variant: 'spiral' }); }));
    set('--underline', url(440, 28, function (g, w) {
      var pts = []; for (var x = 4; x <= w - 18; x += 8) pts.push([x, 12 + Math.sin(x * 0.05) * 4]);
      S.stroke(g, pts, { weight: 'regular', seed: 4, dot: true });
    }));
    set('--mark-correct', url(80, 80, function (g) { S.mark(g, 'correct', { x: 2, y: 2, w: 76, h: 76 }, {}); }));
    set('--mark-retry', url(80, 80, function (g) { S.mark(g, 'retry', { x: 4, y: 4, w: 72, h: 72 }, {}); }));
    set('--mark-misreading', url(60, 60, function (g) { S.mark(g, 'misreading', { x: 4, y: 4, w: 52, h: 52 }, {}); }));
    set('--stamp-ring', url(440, 440, function (g) {
      var r = NS.engine.rng(31);
      for (var ring = 0; ring < 2; ring++) {
        var rr = 214 - ring * 22;
        for (var k = 0; k < 14; k++) {
          var a0 = k * Math.PI / 7 + r.range(0, 0.05), a1 = a0 + Math.PI / 7 - r.range(0.02, 0.08);
          S.stroke(g, P.arc(220, 220, rr, a0, a1, 12), { weight: ring === 0 ? 7 : 2.4, seed: k + ring * 20, taper: false, alpha: r.range(0.75, 1) });
        }
      }
    }));
    set('--page-signs', url(520, 300, function (g) {
      S.sign(g, 'star', { x: 420, y: 60, r: 26, seed: 3, colorCenter: 'accent-2' });
      S.sign(g, 'moon', { x: 330, y: 120, r: 22, seed: 4 });
      S.sign(g, 'dots', { x: 470, y: 160, r: 22, seed: 5 });
      S.sign(g, 'bird', { x: 250, y: 50, r: 22, seed: 6 });
      S.sign(g, 'spiral', { x: 480, y: 240, r: 16, seed: 7 });
    }));
    set('--brand-mark', url(96, 96, function (g) {
      S.fill(g, P.circle(52, 50, 30), { role: 'accent-1', seed: 2 });
      S.sign(g, 'star', { x: 34, y: 34, r: 22, seed: 5 });
      S.stroke(g, P.spiral(64, 64, 18, 1.8), { weight: 'regular', seed: 3 });
    }));
  };
})(window.IAHI);
