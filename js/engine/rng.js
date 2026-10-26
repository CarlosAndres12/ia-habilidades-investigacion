/* Seeded PRNG (mulberry32) and string hash -> seed. Pure; loadable in Node. */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.engine = NS.engine || {};

  function hash(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rng(seed) {
    var a = (typeof seed === 'string' ? hash(seed) : (seed >>> 0)) || 1;
    function next() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    next.range = function (lo, hi) { return lo + (hi - lo) * next(); };
    next.int = function (lo, hi) { return Math.floor(lo + (hi - lo + 1) * next()); };
    next.pick = function (arr) { return arr[Math.floor(next() * arr.length)]; };
    next.sign = function () { return next() < 0.5 ? -1 : 1; };
    next.gauss = function () {
      var u = 1 - next(), v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return next;
  }

  NS.engine.rng = rng;
  NS.engine.hash = hash;
})(typeof window !== 'undefined' ? window : globalThis);
