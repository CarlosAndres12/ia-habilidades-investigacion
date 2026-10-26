/* Workbook storage (spec §4.4): every section lives under the key `wb:<id>` in js/core/store.js
   (try/catch, memory fallback). Widgets read and write through NS.ui.wb, so the «Cuaderno del
   proyecto» view and the session widgets always show the same data. */
(function (NS) {
  'use strict';
  var U = NS.util;
  var wb = NS.ui.wb = {};
  var listeners = [];

  wb.get = function (id, fallback) { return NS.store.get('wb:' + id, fallback === undefined ? null : fallback); };
  wb.set = function (id, value) {
    var ok = NS.store.set('wb:' + id, value);
    listeners.forEach(function (fn) { try { fn(id, value); } catch (e) { /* ignore */ } });
    return ok;
  };
  wb.patch = function (id, obj) { var cur = wb.get(id, {}) || {}; Object.keys(obj).forEach(function (k) { cur[k] = obj[k]; }); return wb.set(id, cur); };
  wb.on = function (fn) { listeners.push(fn); };
  wb.section = function (id) { return (NS.data.workbook.sections || []).filter(function (s) { return s.id === id; })[0]; };

  function filled(v) {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.some(filled);
    if (typeof v === 'object') return Object.keys(v).some(function (k) { return filled(v[k]); });
    return true;
  }
  wb.filled = filled;
  wb.done = function (id) { return filled(wb.get(id)); };
  // the session's product is saved when at least one of its sections has content
  wb.productSaved = function (n) {
    var ids = (NS.data.workbook.products || {})[n] || [];
    return ids.some(function (id) { return wb.done(id); });
  };

  // a row appended to the logbook (section 2), e.g. from «Verificar una referencia»
  wb.addLog = function (row) {
    var rows = wb.get('bitacora', []) || [];
    rows.push(row);
    wb.set('bitacora', rows);
  };

  // export / import / CSV
  wb.exportJSON = function () {
    var out = { sitio: NS.data.ui.siteTitle, exportado: new Date().toISOString(), cuaderno: {} };
    NS.store.keys().forEach(function (k) { if (k.indexOf('wb:') === 0) out.cuaderno[k.slice(3)] = NS.store.get(k, null); });
    return JSON.stringify(out, null, 2);
  };
  wb.importJSON = function (text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return false; }
    var data = obj && obj.cuaderno;
    if (!data || typeof data !== 'object') return false;
    Object.keys(data).forEach(function (k) { wb.set(k, data[k]); });
    return true;
  };
  wb.tablesCSV = function () {
    var parts = [];
    var b2 = (NS.data.plantillas || []).filter(function (t) { return t.id === 'B2'; })[0];
    var bHead = b2 ? b2.blocks.filter(function (b) { return b.type === 'table'; })[0].head : [];
    function table(title, head, rows) {
      parts.push(U.csv([[title]]));
      parts.push(U.csv([head].concat((rows || []).map(function (r) { return head.map(function (h, i) { var v = Array.isArray(r) ? r[i] : r[h]; return typeof v === 'boolean' ? (v ? 'sí' : 'no') : (v == null ? '' : v); }); }))));
      parts.push('');
    }
    table(wb.section('bitacora').title, bHead, wb.get('bitacora', []));
    table(wb.section('busqueda').title, wb.section('busqueda').columns, (wb.get('busqueda', {}) || {}).rows || []);
    table(wb.section('antecedentes').title, wb.section('antecedentes').columns, wb.get('antecedentes', []));
    var flujo = wb.get('flujo', {}) || {};
    table(wb.section('flujo').title, ['Etapa', 'Herramienta', 'Para qué', 'Punto de control humano', '¿Cuál?', 'Ejes que atiende'], (flujo.stages || []).map(function (s) {
      return [s.stage, s.tool, s.purpose, s.check ? 'sí' : 'no', s.which || '', (s.axes || []).map(function (a) { var it = NS.engine.legend.item(a); return it ? it.label : a; }).join('; ')];
    }));
    return parts.join('\n');
  };
})(window.IAHI);
