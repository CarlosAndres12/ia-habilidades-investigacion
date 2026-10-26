/* Shared UI components: content blocks, figure cards, legend chips, implication cards, badges,
   stamps, copy boxes, dividers, in-page confirmations, tabs, static course-sign canvases and the
   glossary card. Copy comes from js/data; drawings come from js/course and js/style. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  ui.views = ui.views || {};
  ui.widgets = ui.widgets || {};
  var T = function () { return NS.data.ui || {}; };

  // ---------------------------------------------------------------- small pieces
  ui.signImg = function (name, px, alt) {
    var url = NS.course.pictos ? NS.course.pictos.dataURL(name, px || 24) : '';
    return url ? U.el('img', { src: url, alt: alt || '', width: px || 24, height: px || 24, class: 'sign' }) : null;
  };
  ui.badge = function (text, opts) {
    opts = opts || {};
    var b = (NS.data.badges || {})[text];
    return U.el('span', { class: 'badge' + (opts.alert ? ' badge-alert' : '') }, [b && b.sign ? ui.signImg(b.sign, 22) : null, text]);
  };
  ui.legendChip = function (id, opts) {
    opts = opts || {};
    var it = NS.engine.legend.item(id);
    if (!it) return null;
    var sw = U.el('span', { class: 'legend-swatch slot-' + it.slot, 'aria-hidden': 'true' }, [ui.signImg(NS.course.pictos.legendSign[id], 22)]);
    var tag = opts.button ? 'button' : 'span';
    var attrs = { class: 'legend-item', 'data-axis': id };
    if (opts.button) { attrs.type = 'button'; attrs['aria-pressed'] = opts.pressed ? 'true' : 'false'; }
    return U.el(tag, attrs, [sw, it.label]);
  };
  ui.legendRow = function (ids, opts) {
    return U.el('div', { class: 'legend-row' }, (ids || []).map(function (id) { return ui.legendChip(id, opts); }));
  };
  ui.divider = function (variant) {
    return U.el('div', { class: 'divider' + (variant ? ' ' + variant : ''), role: 'presentation' });
  };
  ui.partLabel = function (text) { return U.el('h4', { class: 'part-label', text: text }); };
  ui.stamp = function (id) {
    var st = (NS.data.stamps || []).filter(function (s) { return s.id === id; })[0];
    if (!st) return null;
    return U.el('div', { class: 'stamp', role: 'note' }, [ui.signImg(NS.course.pictos.stampSign[id], 46), U.el('span', { text: st.text })]);
  };
  ui.mark = function (kind) { return U.el('span', { class: 'mark-' + kind, 'aria-hidden': 'true' }); };
  // feedback always with words: «¡Muy bien!» + explanation, or «Casi. Pista: …»
  ui.feedback = function (box, ok, text) {
    box.innerHTML = '';
    box.appendChild(ui.mark(ok ? 'correct' : 'retry'));
    box.appendChild(U.el('span', { text: (ok ? '¡Muy bien! ' : 'Casi. Pista: ') + (text || '') }));
    U.announce((ok ? '¡Muy bien! ' : 'Casi. Pista: ') + (text || ''));
  };
  ui.md = function (text, tag) { return U.el(tag || 'p', { html: U.markup(text) }); };

  // ---------------------------------------------------------------- content blocks (from build-content)
  ui.blocks = function (blocks, opts) {
    opts = opts || {};
    var frag = document.createDocumentFragment();
    (blocks || []).forEach(function (b) {
      var node = null;
      if (b.type === 'p') node = ui.md(b.text);
      else if (b.type === 'ul' || b.type === 'ol') node = U.el(b.type, {}, b.items.map(function (it) { return U.el('li', { html: U.markup(it) }); }));
      else if (b.type === 'table') node = ui.table(b.head, b.rows, opts.tableCell);
      else if (b.type === 'code') node = ui.copyBox(b.title || opts.codeTitle || 'Texto para copiar', b.text, { lang: b.lang });
      else if (b.type === 'quote') node = U.el('blockquote', { html: U.markup(b.text) });
      else if (b.type === 'h4' || b.type === 'h5') node = U.el('h4', { html: U.markup(b.text) });
      if (node) frag.appendChild(node);
    });
    return frag;
  };
  ui.table = function (head, rows, cellFn) {
    var t = U.el('table');
    if (head && head.length) t.appendChild(U.el('thead', {}, [U.el('tr', {}, head.map(function (h) { return U.el('th', { scope: 'col', html: U.markup(h) }); }))]));
    t.appendChild(U.el('tbody', {}, (rows || []).map(function (r, ri) {
      return U.el('tr', {}, r.map(function (c, ci) {
        var html = cellFn ? cellFn(c, ri, ci, head) : null;
        return U.el(ci === 0 ? 'th' : 'td', ci === 0 ? { scope: 'row', html: html || U.markup(c) } : { html: html || U.markup(c) });
      }));
    })));
    return U.el('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': (head || []).join(', ') }, [t]);
  };

  // ---------------------------------------------------------------- figure card (base §5.2, HTML)
  ui.figureCardHTML = function (id, opts) {
    opts = opts || {};
    var f = (NS.data.figuresById || {})[id];
    if (!f) return U.el('p', { class: 'note', text: id });
    var src = NS.data.sources || {};
    var srcNodes = [];
    (f.fuentes || []).forEach(function (k, i) {
      var s = src[k];
      if (i) srcNodes.push('; ');
      if (s && s.url) srcNodes.push(U.el('a', { class: 'ext', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, [s.label, U.el('span', { class: 'ext-label', text: ' (enlace externo)' })]));
      else srcNodes.push(s ? s.label : k);
    });
    var badges = U.el('div', { class: 'badges' }, [ui.badge(f.tipo)]);
    if (f.estado === 'Con matiz' || f.estado === 'Revisar antes de clase') badges.appendChild(ui.badge(f.estado));
    var showScope = f.estado === 'Con matiz' || f.estado === 'Revisar antes de clase' || opts.scope !== false;
    var card = U.el('article', { class: 'card fig-card ' + ['accent-1', 'accent-2', 'accent-3'][NS.engine.hash(f.tema || id) % 3], id: opts.anchor ? 'fig-' + id : null, 'data-fig': id }, [
      U.el('p', { class: 'fig-tema', text: f.tema }),
      U.el('p', { class: 'fig-cifra', text: U.nbsp(f.cifra) }),
      showScope && f.alcance ? U.el('p', { class: 'fig-alcance', text: U.nbsp(f.alcance) }) : null,
      badges,
      U.el('p', { class: 'fig-source' }, ['Fuente: '].concat(srcNodes).concat(f.estado === 'Revisar antes de clase' ? [' · ' + T().consultedShort] : [])),
      opts.showId ? U.el('p', { class: 'fig-id', text: f.id }) : null
    ]);
    return card;
  };
  ui.figureGrid = function (ids, opts) {
    return U.el('div', { class: 'fig-grid' }, (ids || []).map(function (id) { return ui.figureCardHTML(id, opts); }));
  };

  // ---------------------------------------------------------------- implication card (legend items + text)
  ui.implicationCard = function (imp) {
    var axes = imp.axes || [];
    var first = NS.engine.legend.item(axes[0]);
    return U.el('article', { class: 'card impl-card no-blob' + (first ? ' slot-' + first.slot : '') }, [
      ui.legendRow(axes),
      U.el('p', { html: U.markup(imp.text) })
    ]);
  };

  // ---------------------------------------------------------------- copy box
  ui.copyBox = function (label, text, opts) {
    opts = opts || {};
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    var btn = U.el('button', { type: 'button', class: 'btn btn-small', text: opts.button || 'Copiar' });
    btn.addEventListener('click', function () {
      var t = typeof text === 'function' ? text() : text;
      U.copyText(t).then(function (ok) { status.textContent = ok ? 'Copiado' : 'No se pudo copiar: seleccione el texto y cópielo a mano.'; U.announce(status.textContent); setTimeout(function () { status.textContent = ''; }, 2500); });
    });
    var pre = U.el('pre', { tabindex: '0' }, [U.el('code', { text: typeof text === 'function' ? text() : text })]);
    var box = U.el('div', { class: 'copy-box' }, [label ? U.el('p', { class: 'copy-label', text: label }) : null, pre, U.el('div', { class: 'row' }, [btn, status].concat(opts.extra || []))]);
    box.update = function () { pre.firstChild.textContent = typeof text === 'function' ? text() : text; };
    return box;
  };

  // ---------------------------------------------------------------- in-page confirmation (never a browser dialog)
  ui.confirm = function (anchor, message, yes, no, onYes) {
    var box = U.el('div', { class: 'card no-blob', role: 'alertdialog', 'aria-label': message }, [
      U.el('p', { text: message }),
      U.el('div', { class: 'row' }, [
        U.el('button', { type: 'button', class: 'btn btn-primary', text: yes, onclick: function () { box.remove(); onYes(); } }),
        U.el('button', { type: 'button', class: 'btn btn-quiet', text: no, onclick: function () { box.remove(); anchor.focus(); } })
      ])
    ]);
    anchor.insertAdjacentElement('afterend', box);
    box.querySelector('button').focus();
    return box;
  };

  // ---------------------------------------------------------------- tabs
  ui.tabs = function (items, opts) {
    opts = opts || {};
    var wrap = U.el('div', { class: 'tabs-wrap' });
    var list = U.el('div', { class: 'tabs', role: 'tablist', 'aria-label': opts.label || '' });
    var panels = [];
    var uid = 'tab' + Math.floor(Math.random() * 1e6);
    items.forEach(function (it, i) {
      var b = U.el('button', { type: 'button', role: 'tab', class: 'chip', id: uid + '-t' + i, 'aria-controls': uid + '-p' + i, 'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1', text: it.label });
      var p = U.el('div', { role: 'tabpanel', id: uid + '-p' + i, 'aria-labelledby': uid + '-t' + i, hidden: i !== 0 });
      p.appendChild(typeof it.content === 'function' ? it.content() : it.content);
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight') { select((i + 1) % items.length, true); ev.preventDefault(); }
        if (ev.key === 'ArrowLeft') { select((i - 1 + items.length) % items.length, true); ev.preventDefault(); }
      });
      list.appendChild(b); panels.push(p);
    });
    function select(i, focus) {
      U.$$('[role=tab]', list).forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; if (k === i && focus) b.focus(); });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
    }
    wrap.appendChild(list);
    panels.forEach(function (p) { wrap.appendChild(p); });
    return wrap;
  };

  // ---------------------------------------------------------------- static course-sign canvas
  // draw(ctx, W, H) composes course signs; the canvas is a picture with a text alternative.
  ui.canvasFigure = function (draw, label, opts) {
    opts = opts || {};
    var w = opts.w || 1280, h = opts.h || 720;
    var c = U.el('canvas', { width: w, height: h, role: 'img', 'aria-label': label || '' });
    var fig = U.el('figure', { class: 'canvas-figure' }, [c, opts.caption ? U.el('figcaption', { text: opts.caption }) : null]);
    var drawn = false;
    function paint() {
      if (drawn) return; drawn = true;
      var ctx = c.getContext('2d');
      try {
        NS.style.background(ctx, opts.bg || 'explain', { W: w, H: h, seed: opts.seed || 3 });
        draw(ctx, w, h);
      } catch (e) { console.error(e); }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { paint(); io.disconnect(); } }, { rootMargin: '300px' });
      io.observe(c);
    } else paint();
    fig.paint = paint;
    window.addEventListener('beforeprint', paint);
    return fig;
  };

  // ---------------------------------------------------------------- a still of a video scene (course-sign diagrams)
  // 'v1:niveles' → the scene's last frame, drawn by its own code (js/course + js/style); the scene's
  // «Se ve» is its text alternative.
  var renderers = {};
  ui.sceneFigure = function (ref, opts) {
    opts = opts || {};
    var parts = String(ref).split(':');
    var video = NS.engine.player.videoById(parts[0]);
    if (!video) return null;
    var idx = -1;
    video.scenes.forEach(function (s, i) { if (s.id === parts[1]) idx = i; });
    if (idx < 0) return null;
    var sc = video.scenes[idx];
    return ui.canvasFigure(function (ctx) {
      var r = renderers[video.id];
      if (!r) {
        r = renderers[video.id] = { renderer: new NS.engine.player.Renderer(video, {}) };
        var castW = {};
        (NS.data.cast || []).forEach(function (c) { castW[c.id] = { wordsPerSecond: c.wordsPerSecond || 2.4 }; });
        r.tl = NS.engine.timeline.build(video, { cast: castW, manifest: (NS.audioManifest || {})[video.id] || null });
        r.renderer.setup();
      }
      var tsc = r.tl.scenes[idx];
      var st = NS.engine.timeline.state(r.tl, tsc.end - 0.05);
      r.renderer.drawScene(ctx, idx, st.s, tsc.end - 0.05);
    }, sc.seVe, { caption: opts.caption === false ? null : sc.seVe, seed: idx + 1 });
  };

  // ---------------------------------------------------------------- glossary card (chips anywhere)
  function findTerm(term) {
    var t = String(term).toLowerCase();
    var list = NS.data.glosario || [];
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (String(g.term).toLowerCase() === t) return g;
    }
    for (var j = 0; j < list.length; j++) if (String(list[j].term).toLowerCase().indexOf(t) === 0) return list[j];
    return null;
  }
  ui.findTerm = findTerm;
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  document.addEventListener('click', function (ev) {
    var chip = ev.target.closest && ev.target.closest('.glos-chip');
    if (!chip) { if (pop && !pop.contains(ev.target)) closePop(); return; }
    ev.preventDefault();
    closePop();
    var g = findTerm(chip.getAttribute('data-term'));
    var r = chip.getBoundingClientRect();
    pop = U.el('div', { class: 'glos-pop', role: 'dialog', 'aria-label': 'Definición' }, [U.el('div', { class: 'card' }, [
      U.el('h3', { text: g ? g.term : chip.getAttribute('data-term') }),
      U.el('p', { html: g ? U.markup(g.def) : 'Sin definición en el glosario.' }),
      U.el('div', { class: 'row' }, [
        U.el('a', { href: '#/glosario?t=' + encodeURIComponent(g ? g.term : ''), class: 'btn btn-small', text: 'Ver en el glosario' }),
        U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: 'Cerrar', onclick: closePop })
      ])
    ])]);
    document.body.appendChild(pop);
    var top = Math.min(window.innerHeight - 20 - pop.offsetHeight, r.bottom + 8);
    pop.style.top = Math.max(10, top) + 'px';
    pop.style.left = Math.max(10, Math.min(window.innerWidth - pop.offsetWidth - 10, r.left)) + 'px';
    pop.querySelector('button').focus();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closePop(); });
  document.addEventListener('iahi:route', closePop);

  // ---------------------------------------------------------------- page helpers
  ui.head = function (main, title, lead, opts) {
    opts = opts || {};
    if (opts.kicker) main.appendChild(U.el('p', { class: 'card-kicker', text: opts.kicker }));
    main.appendChild(U.el('h1', { text: title }));
    if (lead) main.appendChild(U.el('p', { class: 'lead', html: U.markup(lead) }));
  };
  ui.section = function (title, opts) {
    opts = opts || {};
    var s = U.el('section', { class: 'section', id: opts.id || null, 'aria-labelledby': opts.id ? opts.id + '-h' : null });
    s.appendChild(U.el(opts.level || 'h2', { text: title, id: opts.id ? opts.id + '-h' : null, class: opts.brush ? 'brush' : null }));
    return s;
  };
  ui.printButton = function (label, before) {
    return U.el('button', { type: 'button', class: 'btn btn-quiet no-print', text: label || 'Imprimir', onclick: function () { if (before) before(); window.print(); } });
  };
  ui.ext = function (key, text) {
    var s = (NS.data.sources || {})[key] || (NS.data.links || {})[key];
    if (!s || !s.url) return document.createTextNode(text || key);
    return U.el('a', { class: 'ext', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, [text || s.label || s.text || key, U.el('span', { class: 'ext-label', text: ' (enlace externo)' })]);
  };
})(window.IAHI);
