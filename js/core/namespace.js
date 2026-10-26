/* Curso de IA: habilidades para la investigación · namespace and small utilities.
   Classic script (no modules) so the site works from file://. Everything hangs from window.IAHI. */
(function (root) {
  'use strict';
  var NS = root.IAHI = root.IAHI || {};
  ['data', 'engine', 'style', 'course', 'videos', 'slides', 'ui', 'util'].forEach(function (k) {
    NS[k] = NS[k] || {};
  });
  var U = NS.util;

  // ---------------------------------------------------------------- strings and numbers
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  };

  // es-CO: thousands point, decimal comma.
  U.fmtNumber = function (n, decimals) {
    if (n == null || !isFinite(n)) return '—';
    var d = decimals == null ? 0 : decimals;
    var neg = n < 0;
    var fixed = Math.abs(n).toFixed(d);
    var parts = fixed.split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−' : '') + int + (d > 0 ? ',' + parts[1] : '');
  };
  U.fmtPercent = function (n, decimals) { return U.fmtNumber(n, decimals) + ' %'; };
  // The content writes «84 %» with a plain space; the page shows it as a non-breaking space.
  U.nbsp = function (s) {
    return String(s).replace(/(\d) %/g, '$1 %').replace(/(\d) (GB|MB|TWh|min)\b/g, '$1 $2');
  };
  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.slug = function (s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };
  U.clock = function (sec) {
    sec = Math.max(0, Math.round(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };

  // ---------------------------------------------------------------- mini-markup (base §1.1)
  // **negrita**, [texto](ref:clave), [texto](url) only when the url is a source, {fig:id}, {glos:término}.
  // Everything else is escaped: data never holds raw HTML.
  U.markup = function (src) {
    var out = U.esc(src == null ? '' : src);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\[([^\]]+)\]\(ref:([a-z0-9-]+)\)/g, function (m, text, key) {
      var src = NS.data.sources && NS.data.sources[key];
      if (!src || !src.url) return text;
      return '<a class="ext" href="' + U.esc(src.url) + '" target="_blank" rel="noopener noreferrer" data-src="' + key + '">' +
        text + '<span class="ext-label"> (enlace externo)</span></a>';
    });
    out = out.replace(/\{fig:([a-z0-9.-]+)\}/g, function (m, id) {
      var f = NS.data.figuresById && NS.data.figuresById[id];
      if (!f) return m;
      return '<a class="fig-chip" href="#/evidencia?f=' + U.esc(id) + '" data-fig="' + U.esc(id) + '">' +
        U.esc(U.nbsp(f.cifra)) + ' <span class="badge-inline">' + U.esc(f.tipo) + '</span></a>';
    });
    out = out.replace(/\{glos:([^}]+)\}/g, function (m, term) {
      return '<button type="button" class="glos-chip" data-term="' + U.esc(term) + '">' + U.esc(term) + '</button>';
    });
    return U.nbsp(out);
  };

  // ---------------------------------------------------------------- DOM helpers
  U.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };
  U.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  U.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  U.announce = function (msg) {
    var live = document.getElementById('aria-live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 30);
  };

  U.copyText = function (text) {
    function fallback() {
      var ta = U.el('textarea', { style: { position: 'fixed', left: '-9999px' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return Promise.resolve(ok);
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
      }
    } catch (e) { /* fall through */ }
    return fallback();
  };

  U.download = function (filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var a = U.el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  U.csv = function (rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c == null ? '' : c);
        return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
  };

  U.prefersReducedMotion = function () {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  U.params = function () {
    var out = {};
    var q = (location.search || '').replace(/^\?/, '');
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      out[k] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
    });
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
