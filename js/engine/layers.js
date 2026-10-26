/* Offscreen layer cache: keeps only the current and next scene's layers (LRU of 2 per video),
   builds them lazily and prefetches the next one when the browser is idle (base §1.4, §6). */
(function (NS) {
  'use strict';
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function LayerCache(limit) {
    this.limit = limit || 2;
    this.map = new Map();
  }
  LayerCache.prototype.get = function (key, build) {
    if (this.map.has(key)) {
      var v = this.map.get(key);
      this.map.delete(key);
      this.map.set(key, v);
      return v;
    }
    var val = build ? build() : null;
    this.map.set(key, val);
    while (this.map.size > this.limit) {
      var first = this.map.keys().next().value;
      this.map.delete(first);
    }
    return val;
  };
  LayerCache.prototype.has = function (key) { return this.map.has(key); };
  LayerCache.prototype.clear = function () { this.map.clear(); };

  // Small general cache for textures and pre-rendered decorations (bounded).
  var shared = new LayerCache(48);

  NS.engine.layers = {
    LayerCache: LayerCache,
    canvas: makeCanvas,
    shared: shared,
    idle: function (fn) {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 500 });
      else setTimeout(fn, 60);
    }
  };
})(window.IAHI);
