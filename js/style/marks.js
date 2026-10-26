/* STYLE · Miró — the eleven marks (style S4): correct, retry, misreading, speaking, chapter, divider,
   stamp, card, button, badge, pattern. Feedback marks always come with words, drawn by the caller. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  var MARKS = {
    correct: function (ctx, b, o) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) / 2;
      var a = S.appear('pop', o.p);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(a.scale, a.scale); ctx.globalAlpha *= a.alpha;
      S.fill(ctx, P.blob(0, 0, R * 0.36, R * 0.34, 7, 4, 0.18), { role: 'accent-2', offset: false, seed: 3 });
      var r = rng(21);
      for (var i = 0; i < 9; i++) {
        var ang = i * Math.PI * 2 / 9 + r.range(-0.15, 0.15);
        var r0 = R * 0.46, r1 = R * r.range(0.78, 1);
        S.stroke(ctx, [[Math.cos(ang) * r0, Math.sin(ang) * r0], [Math.cos(ang) * r1, Math.sin(ang) * r1]], { weight: 'regular', seed: i });
      }
      ctx.restore();
    },
    retry: function (ctx, b, o) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) / 2.2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((o.p == null ? 1 : o.p) * Math.PI * 2 - Math.PI * 2);
      S.stroke(ctx, P.spiral(0, 0, R, 2.3), { weight: 'regular', p: o.p, seed: 5 });
      ctx.restore();
    },
    misreading: function (ctx, b, o) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      S.stroke(ctx, P.spiral(cx, cy, Math.min(b.w, b.h) / 2.4, 2), { weight: 'thin', p: o.p, seed: 8 });
    },
    speaking: function (ctx, b, o) {
      var t = o.t || 0;
      var tw = 0.82 + 0.18 * Math.sin(t * 6);
      S.sign(ctx, 'star', { x: b.x + b.w / 2, y: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 * tw, seed: 13, rot: t * 0.6, colorCenter: 'accent-2' });
    },
    chapter: function (ctx, b, o) {
      var p = o.p == null ? 1 : o.p;
      S.title(ctx, o.text || '', { x: b.x, y: b.y + 34, size: 30, weight: 720, p: p, maxWidth: b.w, seed: 9 });
    },
    divider: function (ctx, b, o) {
      var y = b.y + b.h / 2, pts = [];
      for (var x = b.x; x <= b.x + b.w * 0.93; x += 10) pts.push([x, y + Math.sin(x * 0.018 + 1) * 4]);
      S.stroke(ctx, pts, { weight: 'regular', p: o.p, seed: 6, dot: o.variant === 'dot' });
      var ex = b.x + b.w * 0.965;
      if (o.variant === 'spiral') S.sign(ctx, 'spiral', { x: ex, y: y, r: 9, p: o.p });
      else if (o.variant !== 'dot') S.sign(ctx, 'star', { x: ex, y: y, r: 10, seed: 3, p: o.p });
    },
    stamp: function (ctx, b, o) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) / 2 - 4;
      var p = o.p == null ? 1 : o.p;
      var a = S.appear('pop', p);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(a.scale, a.scale); ctx.translate(-cx, -cy); ctx.globalAlpha *= a.alpha;
      var r = rng(o.seed || 31);
      // the paper inside the stamp stays clean so its words read on any ground
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2); ctx.fillStyle = role('ground', 0.94); ctx.fill(); ctx.restore();
      // uneven inking: two rings broken into arcs of varying weight
      for (var ring = 0; ring < 2; ring++) {
        var rr = R - ring * 9;
        for (var k = 0; k < 12; k++) {
          var a0 = k * Math.PI / 6 + r.range(0, 0.05), a1 = a0 + Math.PI / 6 - r.range(0.02, 0.09);
          S.stroke(ctx, P.arc(cx, cy, rr, a0, a1, 10), { weight: ring === 0 ? 'bold' : 'thin', seed: k + ring * 20, taper: false, alpha: r.range(0.72, 1) });
        }
      }
      if (o.sign) o.sign(ctx, cx, cy - R * 0.38, R * 0.3);
      if (o.text) {
        S.text(ctx, o.text, cx, cy + R * 0.02, { size: Math.max(14, Math.round(R * 0.13)), weight: 700, align: 'center', maxWidth: R * 1.45, lineHeight: 1.16, maxLines: 5 });
      }
      ctx.restore();
    },
    card: function (ctx, b, o) {
      var p = o.p == null ? 1 : o.p;
      var lineP = E.segment(p, 0, 0.6);
      var accent = o.variant || 'accent-1';
      var blob = P.blob(b.x + b.w - 6, b.y + 8, Math.min(70, b.w * 0.22), Math.min(52, b.h * 0.3), o.seed || 4, 4, 0.25);
      if (o.blob !== false) S.fill(ctx, blob, { role: accent, p: E.segment(p, 0.2, 0.9), seed: o.seed || 4 });
      ctx.save();
      ctx.globalAlpha *= E.out(Math.min(1, p * 2));
      P.trace(ctx, P.rect(b.x, b.y, b.w, b.h, 14), true);
      ctx.fillStyle = role(o.ground || 'ground');
      ctx.fill();
      ctx.restore();
      S.stroke(ctx, P.wobble(P.rect(b.x, b.y, b.w, b.h, 14), o.seed || 7, 1.6), { weight: 'bold', p: lineP, closed: true, taper: false, swell: 0.25, seed: o.seed || 7 });
    },
    button: function (ctx, b, o) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.min(b.w, b.h) / 2 - 3;
      S.stroke(ctx, P.wobble(P.circle(cx, cy, R), 3, 1.4), { weight: 'bold', closed: true, taper: false, seed: 2, p: o.p });
      if (o.variant === 'replay') {
        S.stroke(ctx, P.arc(cx, cy, R * 0.5, -Math.PI * 0.2, Math.PI * 1.45, 30), { weight: 'regular', seed: 3 });
        var tip = [cx + Math.cos(-Math.PI * 0.2) * R * 0.5, cy + Math.sin(-Math.PI * 0.2) * R * 0.5];
        S.fill(ctx, [[tip[0] - 9, tip[1] - 8], [tip[0] + 9, tip[1] - 2], [tip[0] - 2, tip[1] + 9]], { role: 'ink', offset: false, texture: false });
      } else {
        S.fill(ctx, [[cx - R * 0.28, cy - R * 0.4], [cx + R * 0.45, cy], [cx - R * 0.28, cy + R * 0.4]], { role: 'ink', offset: false, texture: false });
      }
    },
    badge: function (ctx, b, o) {
      var size = o.size || 17;
      var tw = S.measure(ctx, o.text || '', size, 700);
      var signW = o.sign ? size * 1.3 : 0;
      var w = tw + signW + 24, h = size + 14;
      var x = o.align === 'right' ? b.x + b.w - w : b.x, y = b.y;
      ctx.save();
      ctx.globalAlpha *= E.out(Math.min(1, (o.p == null ? 1 : o.p) * 2));
      P.trace(ctx, P.rect(x, y, w, h, h / 2), true);
      ctx.fillStyle = role(o.ground || 'ground'); ctx.fill();
      ctx.restore();
      S.stroke(ctx, P.rect(x, y, w, h, h / 2), { weight: 'thin', closed: true, taper: false, swell: 0.2, seed: 2, p: o.p, role: o.lineRole || 'ink' });
      if (o.sign) {
        ctx.save(); ctx.globalAlpha *= E.out(Math.min(1, (o.p == null ? 1 : o.p) * 2));
        o.sign(ctx, x + 12 + size * 0.45, y + h / 2, size * 0.5);
        ctx.restore();
      }
      S.text(ctx, o.text || '', x + 12 + signW, y + h / 2 + 1, { size: size, weight: 700, baseline: 'middle', p: o.p, role: o.textRole || 'ink' });
      return { w: w, h: h, x: x, y: y };
    },
    pattern: function (ctx, b, o) {
      S.patternFill(ctx, o.variant || 'dots', b, o);
    }
  };

  S.mark = function (ctx, name, box, opts) {
    var fn = MARKS[name];
    if (!fn) return null;
    return fn(ctx, box, opts || {});
  };
  S.markNames = Object.keys(MARKS);
})(window.IAHI);
