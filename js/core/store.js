/* Local state (workbook, progress, player positions). Every access is wrapped in try/catch:
   storage can be blocked or empty (private windows, previews), and the site must still work. */
(function (NS) {
  'use strict';
  var PREFIX = 'iahi:';
  var memory = {};           // fallback when localStorage is not available
  var store = NS.store = { ok: true, warned: false };

  function ls() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function warn() {
    store.ok = false;
    if (store.warned) return;
    store.warned = true;
    var bar = document.getElementById('storage-warning');
    if (bar) {
      bar.hidden = false;
      bar.textContent = 'No se pudo guardar en este navegador: exporte su cuaderno para no perderlo.';
    }
  }

  store.get = function (key, fallback) {
    var raw = null;
    try {
      var s = ls();
      raw = s ? s.getItem(PREFIX + key) : null;
    } catch (e) { raw = null; }
    if (raw == null && Object.prototype.hasOwnProperty.call(memory, key)) raw = memory[key];
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  };

  store.set = function (key, value) {
    var raw = JSON.stringify(value);
    memory[key] = raw;
    try {
      var s = ls();
      if (!s) { warn(); return false; }
      s.setItem(PREFIX + key, raw);
      return true;
    } catch (e) { warn(); return false; }
  };

  store.remove = function (key) {
    delete memory[key];
    try { var s = ls(); if (s) s.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  };

  store.keys = function () {
    var out = Object.keys(memory);
    try {
      var s = ls();
      if (s) {
        for (var i = 0; i < s.length; i++) {
          var k = s.key(i);
          if (k && k.indexOf(PREFIX) === 0 && out.indexOf(k.slice(PREFIX.length)) < 0) out.push(k.slice(PREFIX.length));
        }
      }
    } catch (e) { /* ignore */ }
    return out;
  };

  store.exportAll = function () {
    var out = {};
    store.keys().forEach(function (k) { out[k] = store.get(k, null); });
    return out;
  };

  store.importAll = function (obj) {
    if (!obj || typeof obj !== 'object') return false;
    Object.keys(obj).forEach(function (k) { store.set(k, obj[k]); });
    return true;
  };

  store.clearAll = function () {
    store.keys().forEach(function (k) { store.remove(k); });
    memory = {};
  };
})(window.IAHI);
