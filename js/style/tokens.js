/* STYLE · Miró (content/estilo-miro.md, S3 and S9). The only JS file with role color values.
   css/tokens.css mirrors these roles exactly (checked by tools/check-style.mjs). */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.style = NS.style || {};
  var roles = {
    'ground': '#F4EEDF',
    'ground-2': '#E7D3A8',
    'ink': '#15120F',
    'ink-soft': '#4A4038',
    'dark': '#0E1A3B',
    'on-dark': '#F4EEDF',
    'accent-1': '#D7261E',
    'accent-2': '#FCD619',
    'accent-3': '#1C3F95',
    'accent-4': '#267933',
    'accent-5': '#C0D5EC',
    'accent-6': '#A87F43',
    'accent-7': '#94461C',
    'accent-8': '#6B4426',
    'skin-1': '#F2CDAE',
    'skin-2': '#DAA882',
    'skin-3': '#B18661',
    'skin-4': '#8A5634',
    'skin-5': '#5C3A24',
    'machine-ground': '#0E1A3B',
    'machine-line': '#C1DCFD',
    'machine-grid': '#2A3D6E',
    'machine-glow-1': '#46F0B0',
    'machine-glow-2': '#FF36F0',
    'alert': '#A3123A'
  };
  NS.style.tokens = {
    name: 'Miró',
    roles: roles,
    legendOrder: ['blue', 'vermillion', 'bluish green', 'reddish purple', 'sky blue', 'orange'],
    legendExclude: ['yellow'],
    fonts: {
      body: '"Atkinson Hyperlegible", "Noto Sans", "DejaVu Sans", system-ui, sans-serif',
      display: '"Fraunces", "Noto Serif Display", Georgia, serif'
    },
    clothing: ['accent-1', 'accent-2', 'accent-3']
  };

  var cache = {};
  function hexToRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  // CSS color string for a role (or a legend hex passed through), with optional alpha.
  NS.style.role = function (name, alpha) {
    var hex = roles[name] || (typeof name === 'string' && name.charAt(0) === '#' ? name : roles.ink);
    if (alpha == null || alpha >= 1) return hex;
    var key = hex + '|' + alpha;
    if (!cache[key]) {
      var c = hexToRgb(hex);
      cache[key] = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, alpha).toFixed(3) + ')';
    }
    return cache[key];
  };
  NS.style.hexToRgb = hexToRgb;
})(typeof window !== 'undefined' ? window : globalThis);
