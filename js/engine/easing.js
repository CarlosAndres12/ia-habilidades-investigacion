/* Easing and timing helpers. Pure; loadable in Node. */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.engine = NS.engine || {};
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  var E = {
    clamp: clamp,
    lerp: function (a, b, t) { return a + (b - a) * t; },
    linear: function (t) { return clamp(t, 0, 1); },
    inOut: function (t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    out: function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
    in: function (t) { t = clamp(t, 0, 1); return t * t * t; },
    back: function (t) {
      t = clamp(t, 0, 1);
      var c1 = 1.4, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    // progress of t inside [a, b], clamped to 0..1
    segment: function (p, a, b) { return b <= a ? (p >= b ? 1 : 0) : clamp((p - a) / (b - a), 0, 1); },
    // staggered appearance of item i of n inside progress q
    stagger: function (q, i, n, spread) {
      var s = spread == null ? 0.6 : spread;
      var start = n <= 1 ? 0 : (i / (n - 1)) * s;
      return clamp((q - start) / Math.max(1e-6, 1 - s), 0, 1);
    }
  };
  NS.engine.ease = E;
})(typeof window !== 'undefined' ? window : globalThis);
