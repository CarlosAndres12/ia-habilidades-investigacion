/* STYLE · Miró — free sign vocabulary and pattern fills (style S5).
   Irregular star, crescent moon, sun disc, bird, ladder, spiral, comet, strands, blob, dot cluster,
   spatter, free constellation. Eyes exist only on people. Patterns stay distinct in grayscale. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  var SIGNS = {
    star: function (ctx, o) {
      var r = rng(o.seed || 1), n = r.int(5, 8), R = o.r || 14;
      var rot = o.rot || 0;
      for (var i = 0; i < n; i++) {
        var a = rot + i * Math.PI / n + r.range(-0.12, 0.12);
        var l1 = R * r.range(0.7, 1.15), l2 = R * r.range(0.7, 1.15);
        S.stroke(ctx, [[o.x - Math.cos(a) * l1, o.y - Math.sin(a) * l1], [o.x + Math.cos(a) * l2, o.y + Math.sin(a) * l2]],
          { weight: R > 16 ? 'regular' : 'thin', p: E.segment(o.p == null ? 1 : o.p, i / n * 0.6, i / n * 0.6 + 0.4), seed: (o.seed || 1) + i, role: o.role });
      }
      if (o.colorCenter) S.fill(ctx, P.circle(o.x, o.y, R * 0.22), { role: o.colorCenter, offset: false, texture: false, p: o.p });
    },
    dots: function (ctx, o) {
      var r = rng(o.seed || 2), R = o.r || 12;
      for (var i = 0; i < 6; i++) {
        ctx.fillStyle = role(o.role || 'ink');
        ctx.beginPath(); ctx.arc(o.x + r.range(-R, R), o.y + r.range(-R * 0.6, R * 0.6), r.range(1.4, 3.2), 0, Math.PI * 2); ctx.fill();
      }
    },
    spiral: function (ctx, o) {
      S.stroke(ctx, P.spiral(o.x, o.y, o.r || 12, o.turns || 2.1), { weight: 'thin', p: o.p, seed: o.seed, role: o.role, dot: false });
    },
    moon: function (ctx, o) {
      var R = o.r || 14;
      var outer = P.arc(o.x, o.y, R, -Math.PI * 0.55, Math.PI * 0.55, 28);
      var inner = P.arc(o.x - R * 0.42, o.y, R * 0.78, Math.PI * 0.5, -Math.PI * 0.5, 28);
      var shape = outer.concat(inner.reverse()); shape.closed = true;
      S.fill(ctx, shape, { role: o.fillRole || 'accent-2', seed: o.seed, p: o.p });
      S.stroke(ctx, outer, { weight: 'thin', p: o.p, seed: o.seed });
    },
    sun: function (ctx, o) {
      S.fill(ctx, P.circle(o.x, o.y, o.r || 30), { role: o.fillRole || 'accent-1', seed: o.seed, p: o.p });
    },
    bird: function (ctx, o) {
      var R = o.r || 16;
      S.stroke(ctx, P.smooth([[o.x - R, o.y], [o.x - R * 0.4, o.y - R * 0.5], [o.x, o.y]], 8), { weight: 'thin', p: o.p, seed: o.seed });
      S.stroke(ctx, P.smooth([[o.x, o.y], [o.x + R * 0.4, o.y - R * 0.55], [o.x + R, o.y - R * 0.1]], 8), { weight: 'thin', p: o.p, seed: (o.seed || 1) + 2 });
    },
    ladder: function (ctx, o) {
      var R = o.r || 30, w = R * 0.35;
      S.stroke(ctx, [[o.x - w, o.y + R], [o.x - w * 0.8, o.y - R]], { weight: 'thin', p: o.p, seed: o.seed });
      S.stroke(ctx, [[o.x + w, o.y + R], [o.x + w * 1.1, o.y - R]], { weight: 'thin', p: o.p, seed: (o.seed || 1) + 1 });
      for (var i = 0; i < 4; i++) {
        var y = o.y + R - (i + 0.6) * R / 2.2;
        S.stroke(ctx, [[o.x - w, y], [o.x + w, y - 2]], { weight: 'hair', p: o.p, seed: (o.seed || 1) + 3 + i, taper: false });
      }
    },
    comet: function (ctx, o) {
      var R = o.r || 10;
      S.fill(ctx, P.circle(o.x, o.y, R * 0.45), { role: 'accent-1', seed: o.seed, p: o.p });
      for (var i = 1; i <= 5; i++) {
        ctx.fillStyle = role('ink');
        ctx.beginPath(); ctx.arc(o.x - i * R * 0.8, o.y + i * R * 0.25, Math.max(0.8, 2.6 - i * 0.35), 0, Math.PI * 2); ctx.fill();
      }
    },
    strands: function (ctx, o) {
      var r = rng(o.seed || 4), R = o.r || 18;
      for (var i = 0; i < 5; i++) {
        S.stroke(ctx, P.smooth([[o.x + i * 3, o.y], [o.x + i * 3 + r.range(-6, 6), o.y + R * 0.5], [o.x + i * 3 + r.range(-8, 8), o.y + R]], 6), { weight: 'hair', p: o.p, seed: i });
      }
    },
    blob: function (ctx, o) {
      S.shape(ctx, P.blob(o.x, o.y, o.r || 20, (o.r || 20) * 0.8, o.seed, 5, 0.3), { role: o.fillRole || 'accent-3', p: o.p, seed: o.seed, weight: 'thin' });
    },
    spatter: function (ctx, o) {
      var R = o.r || 20;
      ctx.drawImage(S.texture('spatter', 64, 64, o.seed || 3), o.x - R, o.y - R, R * 2, R * 2);
    },
    // hand-drawn dots joined by loose curves: the human counterpart of the machine's grid
    constellation: function (ctx, o) {
      var pts = o.points;
      if (!pts) {
        var r = rng(o.seed || 9); pts = [];
        var ry = o.ry == null ? o.r * 0.5 : o.ry;
        for (var i = 0; i < (o.n || 6); i++) pts.push([o.x + r.range(-o.r, o.r), o.y + r.range(-ry, ry)]);
      }
      for (var k = 1; k < pts.length; k++) {
        var a = pts[k - 1], b = pts[k];
        var mid = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.12, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.12];
        S.stroke(ctx, P.smooth([a, mid, b], 8), { weight: 'hair', p: E.segment(o.p == null ? 1 : o.p, (k - 1) / pts.length, k / pts.length), seed: k });
      }
      pts.forEach(function (q) {
        ctx.fillStyle = role('ink');
        ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, Math.PI * 2); ctx.fill();
      });
    }
  };

  S.sign = function (ctx, name, o) {
    var fn = SIGNS[name];
    if (fn) fn(ctx, o || {});
  };
  S.signNames = Object.keys(SIGNS);

  // ------------------------------------------------------------------ pattern fills (unit identity and print)
  S.patternFill = function (ctx, name, box, o) {
    o = o || {};
    var x = box.x, y = box.y, w = box.w, h = box.h;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = role(o.ground || 'ground'); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = role(o.role || 'ink'); ctx.strokeStyle = role(o.role || 'ink');
    var r = rng(o.seed || 12);
    var gap = o.gap || 14, i, j;
    if (name === 'dots') {
      for (i = x + gap / 2; i < x + w; i += gap) for (j = y + gap / 2; j < y + h; j += gap) {
        ctx.beginPath(); ctx.arc(i + r.range(-1, 1), j + r.range(-1, 1), 2.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (name === 'stripes') {
      for (i = x - h; i < x + w + h; i += gap) S.stroke(ctx, [[i, y + h + 4], [i + h, y - 4]], { weight: 'thin', seed: i | 0, taper: false });
    } else if (name === 'crosses') {
      for (i = x + gap; i < x + w; i += gap * 1.6) for (j = y + gap; j < y + h; j += gap * 1.6) S.sign(ctx, 'star', { x: i, y: j, r: 5, seed: (i * 7 + j) | 0 });
    } else if (name === 'checks') {
      for (i = x; i < x + w; i += gap) S.stroke(ctx, [[i, y], [i + 1, y + h]], { weight: 'hair', seed: i | 0, taper: false });
      for (j = y; j < y + h; j += gap) S.stroke(ctx, [[x, j], [x + w, j + 1]], { weight: 'hair', seed: j | 0, taper: false });
    } else if (name === 'waves') {
      for (j = y + gap / 2; j < y + h; j += gap) {
        var wv = [];
        for (i = x - 4; i <= x + w + 4; i += 6) wv.push([i, j + Math.sin(i * 0.12) * 3.5]);
        S.stroke(ctx, wv, { weight: 'thin', seed: j | 0, taper: false });
      }
    } else if (name === 'grid') {
      for (i = x + gap / 2; i < x + w; i += gap) for (j = y + gap / 2; j < y + h; j += gap) ctx.fillRect(i - 1, j - 1, 2, 2);
    }
    ctx.restore();
  };
  S.patternNames = ['dots', 'stripes', 'crosses', 'checks', 'waves', 'grid'];
})(window.IAHI);
