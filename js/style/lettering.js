/* STYLE · Miró — display lettering for titles on the canvas (style S9).
   Thick black letters, each glyph with a tiny seeded rotation and offset, written letter by letter;
   a wavy underline that ends in a dot. Digits are never display-lettered: they use the body face. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  function fontFor(ch, size, weight) {
    if (/[0-9%]/.test(ch)) return '700 ' + Math.round(size * 0.92) + 'px ' + S.tokens.fonts.body;
    return (weight || 760) + ' ' + size + 'px ' + S.tokens.fonts.display;
  }
  function measureStr(ctx, str, size, weight) {
    var w = 0;
    for (var i = 0; i < str.length; i++) { ctx.font = fontFor(str[i], size, weight); w += ctx.measureText(str[i]).width; }
    return w;
  }
  function wrapTitle(ctx, text, size, maxWidth, weight) {
    if (!maxWidth) return [text];
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (wd) {
      var test = cur ? cur + ' ' + wd : wd;
      if (!cur || measureStr(ctx, test, size, weight) <= maxWidth) cur = test;
      else { lines.push(cur); cur = wd; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  S.title = function (ctx, text, o) {
    o = o || {};
    var size = o.size || 56;
    var weight = o.weight || 760;
    var p = o.p == null ? 1 : o.p;
    var r = rng(o.seed || NS.engine.hash(text));
    ctx.save();
    var lines = wrapTitle(ctx, String(text), size, o.maxWidth, weight);
    var total = lines.reduce(function (s, l) { return s + l.length; }, 0);
    var shown = E.clamp(p, 0, 1) * total;
    var lh = size * (o.lineHeight || 1.12);
    var y = o.y || 100;
    if (o.vcenter) y -= (lines.length - 1) * lh / 2;
    var count = 0;
    var lastLine = null;
    ctx.textBaseline = 'alphabetic';
    lines.forEach(function (ln, li) {
      var w = measureStr(ctx, ln, size, weight);
      var x = o.align === 'center' ? (o.x || 640) - w / 2 : o.align === 'right' ? (o.x || 1200) - w : (o.x || 80);
      var x0 = x;
      for (var i = 0; i < ln.length; i++) {
        var ch = ln[i];
        ctx.font = fontFor(ch, size, weight);
        var cw = ctx.measureText(ch).width;
        var vis = E.clamp(shown - count, 0, 1);
        count++;
        if (vis > 0 && ch !== ' ') {
          ctx.save();
          ctx.globalAlpha *= vis;
          ctx.translate(x + cw / 2, y + li * lh + r.range(-1.6, 1.6));
          ctx.rotate(r.range(-0.035, 0.035));
          ctx.fillStyle = role(o.role || 'ink');
          ctx.fillText(ch, -cw / 2, 0);
          ctx.restore();
        } else { r(); r(); }
        x += cw + (o.tracking || 0);
      }
      lastLine = { x0: x0, x1: x, y: y + li * lh };
    });
    if (o.underline !== false && lastLine && p > 0.75) {
      var up = E.segment(p, 0.75, 1);
      var pts = [];
      for (var xx = lastLine.x0; xx <= lastLine.x1; xx += 8) pts.push([xx, lastLine.y + size * 0.22 + Math.sin(xx * 0.05) * 3]);
      if (pts.length > 1) S.stroke(ctx, pts, { weight: size > 40 ? 'regular' : 'thin', p: up, seed: 4, dot: true });
    }
    ctx.restore();
    return { lines: lines, height: lines.length * lh };
  };
  S.measureTitle = function (ctx, text, size) { return measureStr(ctx, String(text), size || 56); };
})(window.IAHI);
