/* Figure cards on the canvas (base §5.2): the figure, its scope when it matters, its type badge,
   its state badge and «Fuente: …», framed with the `card` mark. The frame draws first, then the
   numbers appear crisp and all at once. The card's number area is a meaning zone. */
(function (NS) {
  'use strict';
  var S = NS.style, E = NS.engine.ease, U = NS.util;

  function fig(id) { return (NS.data.figuresById || {})[id]; }
  function sourceLine(f) {
    var src = NS.data.sources || {};
    var names = (f.fuentes || []).map(function (k) { return src[k] ? src[k].label : k; });
    return names.length ? 'Fuente: ' + names.join('; ') : '';
  }
  function typeSign(type) {
    var pic = NS.course && NS.course.pictos;
    var badges = NS.data.badges || {};
    var b = badges[type];
    if (!pic || !b || !b.sign) return null;
    return function (ctx, x, y, r) { pic.draw(ctx, b.sign, { x: x, y: y, r: r }); };
  }

  function countLines(ctx, text, size, weight, maxWidth) {
    if (!text) return 0;
    ctx.save();
    ctx.font = (weight || 500) + ' ' + size + 'px ' + S.tokens.fonts.body;
    var n = NS.engine.captions.wrap(ctx, U.nbsp(String(text)), maxWidth).length;
    ctx.restore();
    return n;
  }

  // box: {x, y, w, h}; o: { p, scope (bool), text (override the cifra text), compact, variant, size }
  // The content flows top-down and shrinks until the figure, its scope, its badges and its source
  // all fit in the box (base §5.2): nothing is ever hidden or overlapped.
  function figureCard(ctx, id, box, o) {
    o = o || {};
    var f = fig(id);
    if (!f) return null;
    var p = o.p == null ? 1 : o.p;
    var frameP = E.segment(p, 0, 0.5), textOn = p >= 0.5;
    var accents = ['accent-1', 'accent-2', 'accent-3'];
    S.mark(ctx, 'card', box, { p: frameP, variant: o.variant || accents[NS.engine.hash(f.tema || id) % 3], seed: NS.engine.hash(id) % 50, blob: o.blob });
    if (!textOn) return { zone: [box.x, box.y, box.w, box.h] };
    var pad = box.w > 300 ? 22 : 16;
    var x = box.x + pad, w = box.w - pad * 2;
    var main = o.text || f.cifra;
    var showScope = o.scope || f.estado === 'Con matiz' || f.estado === 'Revisar antes de clase';
    var scope = showScope && f.alcance ? f.alcance : '';
    var line = sourceLine(f);
    if (f.estado === 'Revisar antes de clase') line += ' · ' + ((NS.data.ui || {}).consultedShort || '');
    var start = o.size || (box.w > 520 ? 25 : 21);
    var fit = null;
    // the type and state badges share one row when they fit, otherwise the state badge wraps
    var hasState = f.estado === 'Con matiz' || f.estado === 'Revisar antes de clase';
    var badgeW = function (text, size) { return S.measure(ctx, text, size, 700) + size * 1.3 + 24; };
    // text never goes below 16 px (figure) and 15 px (scope, source, theme): if a card still does not
    // fit, the caller must give it more room (scenes are reviewed frame by frame)
    for (var size = start; size >= 16; size--) {
      var sSize = Math.max(15, Math.round(size * 0.72)), srcSize = Math.max(15, Math.round(size * 0.64)), temaSize = Math.max(15, Math.round(size * 0.66));
      var temaH = o.compact ? 0 : temaSize * 1.25 + 8;
      var mainL = countLines(ctx, main, size, 700, w);
      var scopeL = countLines(ctx, scope, sSize, 500, w);
      var srcL = countLines(ctx, line, srcSize, 500, w);
      var bs = Math.max(12, Math.min(15, srcSize + 1));
      var twoRows = hasState && badgeW(f.tipo, bs) + 8 + badgeW(f.estado, bs) > w;
      var badgeH = (Math.round(srcSize * 1.25) + 16) * (twoRows ? 2 : 1);
      var total = pad + temaH + mainL * size * 1.22 + 8 + (scopeL ? scopeL * sSize * 1.2 + 8 : 0) + badgeH + 8 + srcL * srcSize * 1.2 + pad - 4;
      fit = { size: size, sSize: sSize, srcSize: srcSize, temaSize: temaSize, temaH: temaH, mainL: mainL, scopeL: scopeL, srcL: srcL, badgeH: badgeH };
      if (total <= box.h) break;
    }
    var y = box.y + pad;
    if (!o.compact) { S.text(ctx, f.tema || '', x, y + fit.temaSize, { size: fit.temaSize, weight: 700, role: 'ink-soft', maxWidth: w, maxLines: 1 }); y += fit.temaH; }
    var t = S.text(ctx, main, x, y + fit.size * 0.92, { size: fit.size, weight: 700, maxWidth: w, lineHeight: 1.22 });
    y += t.height + 8;
    if (scope) {
      var sc = S.text(ctx, scope, x, y + fit.sSize * 0.95, { size: fit.sSize, weight: 500, role: 'ink-soft', maxWidth: w, lineHeight: 1.2 });
      y += sc.height + 8;
    }
    var bsize = Math.max(12, Math.min(15, fit.srcSize + 1));
    var b1 = S.mark(ctx, 'badge', { x: x, y: y, w: w, h: 30 }, { text: f.tipo, size: bsize, sign: typeSign(f.tipo) });
    if (hasState) {
      var wrap = (b1 ? b1.w : 0) + 8 + badgeW(f.estado, bsize) > w;
      var b2 = S.mark(ctx, 'badge', { x: wrap ? x : x + (b1 ? b1.w : 0) + 8, y: wrap ? y + (b1 ? b1.h : 30) + 6 : y, w: w, h: 30 }, { text: f.estado, size: bsize, sign: typeSign(f.estado) });
      if (wrap && b2) y += b2.h + 6;
    }
    y += (b1 ? b1.h : fit.badgeH) + 8;
    S.text(ctx, line, x, y + fit.srcSize, { size: fit.srcSize, weight: 500, role: 'ink-soft', maxWidth: w, lineHeight: 1.2 });
    return { zone: [box.x, box.y, box.w, box.h] };
  }

  NS.engine.cards = { figure: figureCard, sourceLine: sourceLine, typeSign: typeSign };
})(window.IAHI);
