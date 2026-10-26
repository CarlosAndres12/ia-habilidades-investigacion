/* Core legend colors (Okabe–Ito) and their assignment to legend slots (base §1.5).
   This file and css/tokens.css are the only places outside js/style/ with these color values. */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.engine = NS.engine || {};
  var CORE = {
    'blue': '#0072B2', 'vermillion': '#D55E00', 'bluish green': '#009E73', 'reddish purple': '#CC79A7',
    'sky blue': '#56B4E9', 'orange': '#E69F00', 'yellow': '#F0E442'
  };
  var legend = NS.engine.legend = { core: CORE };

  function order() {
    var tok = NS.style && NS.style.tokens;
    var ord = (tok && tok.legendOrder) || ['blue', 'vermillion', 'bluish green', 'reddish purple', 'sky blue', 'orange'];
    var ex = (tok && tok.legendExclude) || [];
    return ord.filter(function (n) { return ex.indexOf(n) < 0; });
  }

  // Color of legend slot k (1-based). Beyond the style's slots: null (draw with ink + pattern).
  legend.slotColor = function (k) {
    var o = order();
    var name = o[k - 1];
    return name ? CORE[name] : null;
  };
  legend.slotCount = function () { return order().length; };
  legend.item = function (id) {
    var items = (NS.data && NS.data.legend) || [];
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  };
  legend.colorOf = function (id) {
    var it = legend.item(id);
    return it ? legend.slotColor(it.slot) : null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
