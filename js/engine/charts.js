/* Exact charts (base §5.1). Geometry is computed exactly from the figure; the style only strokes and
   fills, with any wobble of a data mark kept within 2 px. Bars start at zero, share one scale per
   chart and carry the exact figure as a label. Numbers are drawn in the body face, never counted up. */
(function (NS) {
  'use strict';
  var S = NS.style, E = NS.engine.ease, U = NS.util;

  // es-CO figure string -> number ('84 %' -> 84, 'US$285.900 millones' -> 285900, '71,4' -> 71.4, '~6,6 GB' -> 6.6)
  function parseValue(str) {
    var m = String(str).replace(/ /g, ' ').match(/[-−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-−]?\d+(?:,\d+)?/);
    if (!m) return NaN;
    var s = m[0].replace('−', '-').replace(/\./g, '').replace(',', '.');
    return parseFloat(s);
  }

  // Axis values come from the scene's `scale` and are formatted here (years without separators).
  function axisLabel(v, scale) {
    if (scale && /^años?$/.test(scale.unit || '')) return String(Math.round(v));
    var dec = (scale.step % 1 !== 0) ? 1 : 0;
    return U.fmtNumber(v, dec);
  }

  function barRect(ctx, x, y, w, h, roleName, seed, p) {
    if (w <= 0.5 || h <= 0) return;
    var pts = S.path.wobble(S.path.rect(x, y, w, h, 3), seed, 0.9);
    S.fill(ctx, S.path.rect(x, y, w, h, 3), { role: roleName, offset: false, seed: seed, p: p, texture: true });
    S.stroke(ctx, pts, { weight: 'thin', closed: true, taper: false, swell: 0.15, seed: seed, p: p });
  }

  // Horizontal bars. items: [{ label, value (number), valueText (exact figure text), role }]
  function barsH(ctx, o) {
    var p = o.p == null ? 1 : o.p;
    var frameP = E.segment(p, 0, 0.45), valP = p >= 0.5 ? 1 : 0;
    var x = o.x, y = o.y, labelW = o.labelW || 300, w = o.w, rowH = o.rowH || 30, gap = o.gap || 10;
    var scale = o.scale || { from: 0, to: Math.max.apply(null, o.items.map(function (i) { return i.value; })), step: 10 };
    var valW = 0;
    o.items.forEach(function (it) { if (it.valueText) valW = Math.max(valW, S.measure(ctx, it.valueText, 19, 700)); });
    var x0 = x + labelW, aw = w - labelW - Math.max(40, valW + 18);
    var px = function (v) { return x0 + (v - scale.from) / (scale.to - scale.from) * aw; };
    var yy = y;
    var rows = [];
    o.items.forEach(function (it, i) {
      if (it.groupTitle) {
        S.text(ctx, it.groupTitle, x, yy + 18, { size: 20, weight: 700, p: frameP });
        yy += 30;
        return;
      }
      S.text(ctx, it.label, x0 - 12, yy + rowH * 0.68, { size: o.labelSize || 18, weight: 500, align: 'right', p: frameP, maxWidth: labelW - 16, maxLines: 1 });
      var bw = Math.max(0, px(it.value) - x0);
      barRect(ctx, x0, yy, bw * (frameP > 0 ? 1 : 0), rowH, it.role || 'accent-3', 30 + i, frameP);
      if (valP) S.text(ctx, it.valueText, x0 + bw + 10, yy + rowH * 0.7, { size: 19, weight: 700 });
      rows.push({ y: yy, h: rowH, x1: x0 + bw, value: it.value });
      yy += rowH + gap;
    });
    // axis with ticks (scale values are not figures; formatted by the engine)
    if (o.axis !== false) {
      var ay = yy + 4;
      S.stroke(ctx, [[x0, ay], [x0 + aw, ay]], { weight: 'thin', taper: false, p: frameP, seed: 3 });
      for (var v = scale.from; v <= scale.to + 1e-9; v += scale.step) {
        var tx = px(v);
        S.stroke(ctx, [[tx, ay], [tx, ay + 7]], { weight: 'hair', taper: false, p: frameP });
        S.text(ctx, axisLabel(v, scale), tx, ay + 26, { size: 15, align: 'center', role: 'ink-soft', p: frameP });
      }
      if (scale.unit) S.text(ctx, scale.unit, x0 + aw, ay + 48, { size: 15, align: 'right', role: 'ink-soft', p: frameP });
    }
    return { rows: rows, px: px, x0: x0, bottom: yy + 54 };
  }

  // Vertical bars with the same rules.
  function barsV(ctx, o) {
    var p = o.p == null ? 1 : o.p;
    var frameP = E.segment(p, 0, 0.45), valP = p >= 0.5 ? 1 : 0;
    var x = o.x, y = o.y, w = o.w, h = o.h, n = o.items.length;
    var scale = o.scale;
    var bw = o.barW || Math.min(110, (w / n) * 0.55);
    var py = function (v) { return y + h - (v - scale.from) / (scale.to - scale.from) * h; };
    S.stroke(ctx, [[x, y + h], [x + w, y + h]], { weight: 'thin', taper: false, p: frameP });
    for (var v = scale.from; v <= scale.to + 1e-9; v += scale.step) {
      S.text(ctx, axisLabel(v, scale), x - 10, py(v) + 5, { size: 15, align: 'right', role: 'ink-soft', p: frameP });
      S.stroke(ctx, [[x - 6, py(v)], [x, py(v)]], { weight: 'hair', taper: false, p: frameP });
    }
    if (scale.unit) S.text(ctx, scale.unit, x, y - 16, { size: 15, role: 'ink-soft', p: frameP });
    var cols = [];
    o.items.forEach(function (it, i) {
      var cx = x + (i + 0.5) * w / n;
      var top = py(it.value);
      barRect(ctx, cx - bw / 2, top, bw, y + h - top, it.role || 'accent-3', 50 + i, frameP);
      S.text(ctx, it.label, cx, y + h + 28, { size: 18, align: 'center', p: frameP, maxWidth: w / n - 10 });
      if (valP) S.text(ctx, it.valueText, cx, top - 12, { size: 20, weight: 700, align: 'center' });
      cols.push({ cx: cx, top: top });
    });
    return { cols: cols, py: py };
  }

  NS.engine.charts = { parseValue: parseValue, barsH: barsH, barsV: barsV, axisLabel: axisLabel };
})(window.IAHI);
