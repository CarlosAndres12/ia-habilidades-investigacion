/* The lamp's family of this course (spec §3.3), built only from the lamp's own parts (style S7):
   ruled lines, perfect circles, dot grids and glow accents. No member has eyes, a face, a body,
   limbs, a humanoid shape or a brain. lamp(ctx, id, o) with o = { x, y, r, p, t, labels, seed, … };
   it returns anchor points ({ in, out, … }) so scenes can join cards and cables to it.
   Labels always come from the caller (scene texts or data), never from this file. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var M = function (ctx, kind, o) { return S.machine(ctx, kind, o); };

  function base(ctx, o, extra) { M(ctx, 'lampParts', Object.assign({ x: o.x, y: o.y, r: o.r, p: o.p, t: o.t, still: o.still, glow: o.glow }, extra || {})); }
  function anchors(o) { var R = o.r || 46; return { in: [o.x - R, o.y], out: [o.x + R, o.y], top: [o.x, o.y - R], bottom: [o.x, o.y + R], r: R }; }

  var F = {
    lampara: function (ctx, o) { base(ctx, o); return anchors(o); },

    // the lamp with one continuous strip of text coming out, no instruction card
    'lampara-base': function (ctx, o) {
      var R = o.r || 46, len = o.len || 260;
      var sp = E.segment(o.p == null ? 1 : o.p, 0.3, 1);
      if (sp > 0) M(ctx, 'strip', { x: o.x + R - 4, y: o.y - 11, w: len * sp, h: 22 });
      base(ctx, o);
      return Object.assign(anchors(o), { end: [o.x + R + len, o.y] });
    },

    // the lamp with a small instruction card clipped to its side
    'lampara-asistente': function (ctx, o) {
      var R = o.r || 46;
      base(ctx, o);
      var cp = E.segment(o.p == null ? 1 : o.p, 0.4, 1);
      if (cp > 0) {
        ctx.save(); ctx.globalAlpha *= cp;
        M(ctx, 'card', { x: o.x - R - 44, y: o.y - R * 0.9, w: 40, h: 50, lines: 5 });
        S.machineLine(ctx, o.x - R - 8, o.y - R * 0.6, o.x - R * 0.72, o.y - R * 0.6, 2);
        S.machineCircle(ctx, o.x - R - 8, o.y - R * 0.6, 3, 1.4);
        ctx.restore();
      }
      return anchors(o);
    },

    // the lamp with a short chain of step dots before its output
    'lampara-razonamiento': function (ctx, o) {
      var R = o.r || 46, n = o.steps || 4, p = o.p == null ? 1 : o.p;
      base(ctx, o);
      var x0 = o.x + R + 18;
      for (var i = 0; i < n; i++) {
        var q = E.segment(p, 0.3 + i * 0.15, 0.4 + i * 0.15);
        if (q <= 0) continue;
        if (i > 0) S.machineLine(ctx, x0 + (i - 1) * 30 + 7, o.y, x0 + i * 30 - 7, o.y, 1.3);
        M(ctx, 'node', { x: x0 + i * 30, y: o.y, r: 7, on: q });
      }
      return Object.assign(anchors(o), { out: [x0 + (n - 1) * 30 + 10, o.y] });
    },

    // a dim lamp whose inside shows a short list of rule rows (ELIZA)
    'lampara-antigua': function (ctx, o) { base(ctx, o, { dim: true, rows: 4, bars: false }); return anchors(o); },

    // the lamp inside a laptop outline, with its network cable unplugged
    'lampara-local': function (ctx, o) {
      var R = o.r || 40, w = R * 3.4, h = R * 2.4, x = o.x - w / 2, y = o.y - h / 2 - 8;
      var p = o.p == null ? 1 : o.p;
      NS.course.prop(ctx, 'laptop', { x: o.x, y: o.y + h / 2 + 4, w: w, p: p, screenRole: 'machine-ground', seed: o.seed || 5 });
      M(ctx, 'lampParts', { x: o.x, y: y + h / 2 + 4, r: R * 0.82, p: p, t: o.t, still: o.still });
      // the unplugged cable: a straight run that ends in a plug, a gap, and the socket
      var cy = o.y + h / 2 - 6;
      var cp = E.segment(p, 0.4, 1);
      if (cp > 0) {
        ctx.save(); ctx.globalAlpha *= cp;
        S.machineLine(ctx, x + w + 2, cy, x + w + 38, cy, 2);
        M(ctx, 'plug', { x: x + w + 44, y: cy, s: 12, dir: 1 });
        S.machineCircle(ctx, x + w + 92, cy, 7, 1.6);
        ctx.restore();
      }
      return { screen: [o.x, y + h / 2], r: R };
    },

    // the lamp on a far shelf, joined to the user's laptop by a long cable; a document card travels
    // along it (o.travel 0→1)
    'lampara-nube': function (ctx, o) {
      var R = o.r || 34, p = o.p == null ? 1 : o.p;
      var lx = o.laptop ? o.laptop[0] : o.x - 380, ly = o.laptop ? o.laptop[1] : o.y + 120;
      M(ctx, 'shelf', { x: o.x - R * 2.2, y: o.y + R + 6, w: R * 4.4, h: 12 });
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: o.t, still: o.still });
      var from = [lx, ly], to = [o.x, o.y + R + 18];
      var pts = M(ctx, 'cable', { from: from, to: to, elbow: o.elbow == null ? (lx + o.x) / 2 : o.elbow, p: E.segment(p, 0.2, 0.7), w: 2 });
      if (o.travel != null && pts) {
        var L = 0, segs = [];
        for (var i = 1; i < pts.length; i++) { var d = P.dist(pts[i - 1], pts[i]); segs.push(d); L += d; }
        var at = L * E.clamp(o.travel, 0, 1), acc = 0, q = pts[0];
        for (var k = 1; k < pts.length; k++) {
          if (acc + segs[k - 1] >= at) { var u = (at - acc) / Math.max(1e-6, segs[k - 1]); q = [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * u, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * u]; break; }
          acc += segs[k - 1]; q = pts[k];
        }
        M(ctx, 'card', { x: q[0] - 16, y: q[1] - 26, w: 32, h: 22, lines: 3 });
      }
      return Object.assign(anchors({ x: o.x, y: o.y, r: R }), { cable: pts });
    },

    // a file outline filled with a regular dot grid
    'archivo-pesos': function (ctx, o) {
      var w = o.w || 120, h = o.h || 150, x = o.x - w / 2, y = o.y - h / 2;
      var a = S.appear('pop', o.p == null ? 1 : o.p);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      ctx.translate(o.x, o.y); ctx.scale(a.scale, a.scale); ctx.translate(-o.x, -o.y);
      M(ctx, 'file', { x: x, y: y, w: w, h: h, fold: 26, dots: true });
      ctx.restore();
      return { x: x, y: y, w: w, h: h };
    },

    'chip-gpu': function (ctx, o) {
      var a = S.appear('pop', o.p == null ? 1 : o.p);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      ctx.translate(o.x, o.y); ctx.scale(a.scale, a.scale);
      M(ctx, 'chip', { x: 0, y: 0, s: o.s || 80 });
      ctx.restore();
    },

    // lamps in rows on long shelves, joined by power lines
    'centro-datos': function (ctx, o) {
      var rows = o.rows || 3, cols = o.cols || 5, w = o.w || 420, h = o.h || 260, x = o.x - w / 2, y = o.y - h / 2;
      var p = o.p == null ? 1 : o.p;
      M(ctx, 'panel', { x: x, y: y, w: w, h: h, step: 26 });
      for (var r = 0; r < rows; r++) {
        var sy = y + (r + 1) * h / (rows + 0.4);
        M(ctx, 'shelf', { x: x + 16, y: sy, w: w - 32, h: 8 });
        for (var c = 0; c < cols; c++) {
          var q = E.segment(p, (r * cols + c) / (rows * cols) * 0.7, (r * cols + c) / (rows * cols) * 0.7 + 0.3);
          if (q <= 0) continue;
          M(ctx, 'lampParts', { x: x + 40 + c * (w - 80) / (cols - 1), y: sy - 22, r: 18, p: q, t: o.t, still: true });
        }
        S.machineLine(ctx, x + 8, sy + 14, x + w - 8, sy + 14, 1.2, 'machine-glow-1');
      }
      S.machineLine(ctx, x + 8, y + 10, x + 8, y + h - 6, 1.4, 'machine-glow-1');
      return { x: x, y: y, w: w, h: h };
    },

    // a straight blade of the lamp's lines cutting a strip of text into fragments (o.cut 0→1)
    tokenizador: function (ctx, o) {
      var w = o.w || 520, x = o.x - w / 2, y = o.y;
      var cuts = o.cuts || [0.18, 0.31, 0.47, 0.6, 0.78];
      var cut = E.clamp(o.cut == null ? 1 : o.cut, 0, 1);
      var done = cuts.filter(function (c) { return c <= cut; });
      M(ctx, 'strip', { x: x, y: y - 14, w: w, h: 28, cuts: done, gap: 10 * E.segment(cut, 0.2, 1) + (done.length ? 4 : 0) });
      var bx = x + w * cut + done.length * (10 * E.segment(cut, 0.2, 1) + 4);
      if (cut < 1 || o.showBlade) M(ctx, 'blade', { x: bx, y: y, h: 64 });
      return { x: x, w: w };
    },

    // a small lamp that sorts cards into labeled bins (labels from the caller)
    'modelo-pequeno': function (ctx, o) {
      var R = o.r || 28, p = o.p == null ? 1 : o.p, labels = o.labels || ['', ''];
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: o.t, still: o.still });
      var n = labels.length, bw = o.binW || 120, gap = 24;
      var total = n * bw + (n - 1) * gap, bx = o.x - total / 2, by = o.y + R + 50;
      labels.forEach(function (lb, i) {
        var x = bx + i * (bw + gap);
        M(ctx, 'frame', { x: x, y: by, w: bw, h: 60 });
        if (lb) M(ctx, 'label', { text: lb, x: x + bw / 2, y: by + 36, align: 'center', size: 15, p: p, maxWidth: bw - 10 });
        var q = E.segment(p, 0.3 + i * 0.2, 0.6 + i * 0.2);
        if (q > 0 && q < 1) {
          var cx = E.lerp(o.x, x + bw / 2, E.inOut(q)), cy = E.lerp(o.y + R, by - 4, E.inOut(q));
          M(ctx, 'card', { x: cx - 14, y: cy - 20, w: 28, h: 20, lines: 2 });
        }
        S.machineLine(ctx, o.x, o.y + R, x + bw / 2, by, 1, 'machine-grid');
      });
      return { bins: [bx, by, total, 60] };
    },

    // the lamp with one of its inner lines removed, its place marked by a frame
    'lampara-abliterada': function (ctx, o) { base(ctx, o, { bars: false, gapFrame: true }); return anchors(o); },

    // the lamp with a ring of article cards that cycle through the caller's labels; o.active = -1
    // highlights no card
    'buscador-academico': function (ctx, o) {
      var R = o.r || 40, ring = o.ring || 120, labels = o.labels || [], n = Math.max(4, labels.length);
      var p = o.p == null ? 1 : o.p, t = o.t || 0;
      var active = o.active == null ? Math.floor(t / 1.6) % n : o.active;
      S.machineCircle(ctx, o.x, o.y, ring, 1, 'machine-grid');
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / n;
        var cx = o.x + Math.cos(a) * ring, cy = o.y + Math.sin(a) * ring;
        var q = E.segment(p, i / n * 0.6, i / n * 0.6 + 0.4);
        if (q <= 0) continue;
        M(ctx, 'card', { x: cx - 22, y: cy - 16, w: 44, h: 32, lines: 3 });
        if (i === active) S.glow(ctx, cx, cy, 30, 'machine-glow-1');
        if (labels[i]) M(ctx, 'label', { text: labels[i], x: cx, y: cy + (Math.sin(a) >= 0 ? 38 : -24), align: 'center', size: 15, p: q });
      }
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: t, still: o.still });
      return anchors({ x: o.x, y: o.y, r: R });
    },

    // half-circle gauge with labeled segments (labels from the caller)
    medidor: function (ctx, o) {
      var R = o.r || 90, labels = o.labels || [];
      var a = S.appear('pop', o.p == null ? 1 : o.p);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      M(ctx, 'gauge', { x: o.x, y: o.y, r: R, labels: labels, needle: o.needle });
      labels.forEach(function (lb, i) {
        var ang = Math.PI + (i + 0.5) * Math.PI / labels.length;
        S.text(ctx, lb, o.x + Math.cos(ang) * (R + 30), o.y + Math.sin(ang) * (R + 30) + 6, { size: 16, weight: 700, align: 'center' });
      });
      ctx.restore();
    },

    // the lamp filling rows of a table with column headers (headers from the caller; o.fill 0→1)
    'tabla-extraccion': function (ctx, o) {
      var heads = o.headers || ['', '', ''], rows = o.rows || 4, w = o.w || 460, rh = 30;
      var x = o.x, y = o.y, cw = w / heads.length, p = o.p == null ? 1 : o.p;
      var R = o.r || 34;
      base(ctx, { x: x - R - 30, y: y + 40, r: R, p: p, t: o.t, still: o.still });
      M(ctx, 'frame', { x: x, y: y, w: w, h: rh * (rows + 1) + 8 });
      heads.forEach(function (h, i) {
        M(ctx, 'label', { text: h, x: x + i * cw + 8, y: y + 20, size: 15, p: p, maxWidth: cw - 12 });
        if (i > 0) S.machineLine(ctx, x + i * cw, y, x + i * cw, y + rh * (rows + 1) + 8, 1, 'machine-grid');
      });
      S.machineLine(ctx, x, y + rh, x + w, y + rh, 1.2);
      var fill = E.clamp(o.fill == null ? 1 : o.fill, 0, 1) * rows;
      for (var r = 0; r < rows; r++) {
        var q = E.clamp(fill - r, 0, 1);
        if (q <= 0) continue;
        for (var c = 0; c < heads.length; c++) {
          var bw = (cw - 20) * E.clamp(q * heads.length - c, 0, 1) * (0.55 + 0.4 * ((r * 7 + c * 3) % 5) / 5);
          if (bw > 0) M(ctx, 'bar', { x: x + c * cw + 8, y: y + rh * (r + 1) + 13, w: bw, h: 5 });
        }
      }
      return { x: x, y: y, w: w, h: rh * (rows + 1) + 8 };
    },

    grafo: function (ctx, o) { return M(ctx, 'graph', o); },

    // the lamp inside an open notebook frame, reading only the source cards placed in it,
    // with small citation links to them
    'cuaderno-fuentes': function (ctx, o) {
      var w = o.w || 420, h = o.h || 250, x = o.x - w / 2, y = o.y - h / 2, p = o.p == null ? 1 : o.p;
      NS.course.prop(ctx, 'open-notebook', { x: o.x, y: o.y, w: w, h: h, p: p, seed: o.seed || 3 });
      var n = o.sources || 3;
      var R = o.r || 34;
      var lx = x + w * 0.72, ly = o.y;
      for (var i = 0; i < n; i++) {
        var cx = x + 36, cy = y + 40 + i * (h - 80) / Math.max(1, n - 1);
        var q = E.segment(p, 0.2 + i * 0.15, 0.45 + i * 0.15);
        if (q <= 0) continue;
        ctx.save(); ctx.globalAlpha *= q;
        NS.course.prop(ctx, 'article-card', { x: cx, y: cy - 24, w: 70, h: 48, seed: i + 3 });
        ctx.restore();
        var lq = E.segment(p, 0.6 + i * 0.1, 0.8 + i * 0.1);
        if (lq > 0) M(ctx, 'arrow', { from: [lx - R - 4, ly], to: [cx + 74, cy], p: lq, w: 1.2, head: 6 });
      }
      base(ctx, { x: lx, y: ly, r: R, p: p, t: o.t, still: o.still });
      return { x: x, y: y, w: w, h: h };
    },

    // the lamp with three small tool tabs (folder, terminal, browser) and a loop arrow
    agente: function (ctx, o) {
      var R = o.r || 44, p = o.p == null ? 1 : o.p;
      var tp = E.segment(p, 0.35, 1);
      if (tp > 0) {
        ctx.save(); ctx.globalAlpha *= tp;
        var ly = o.y - R - 34;
        var fx = o.x - R - 26, bx = o.x + R + 26;
        M(ctx, 'folder', { x: fx - 18, y: ly - 6, w: 36, h: 26 });
        M(ctx, 'terminal', { x: o.x - 20, y: ly - 10, w: 40, h: 30 });
        M(ctx, 'browser', { x: bx - 20, y: ly - 10, w: 40, h: 30, bar: 8 });
        [fx, o.x, bx].forEach(function (tx) { S.machineLine(ctx, tx, ly + 20, E.lerp(tx, o.x, 0.6), o.y - R * 0.8, 1, 'machine-grid'); });
        M(ctx, 'loopArrow', { x: o.x, y: o.y, r: R + 14 });
        ctx.restore();
      }
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: o.t, still: o.still });
      return anchors({ x: o.x, y: o.y, r: R });
    },

    // a smaller lamp that receives a task card and returns a single summary card (o.flow 0→1)
    subagente: function (ctx, o) {
      var R = o.r || 26, p = o.p == null ? 1 : o.p, f = o.flow == null ? 1 : o.flow;
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: o.t, still: o.still });
      if (f > 0 && f < 0.5) { var u = E.inOut(f * 2); M(ctx, 'card', { x: E.lerp(o.x - 140, o.x - R - 30, u), y: o.y - 12, w: 30, h: 22, lines: 3 }); }
      if (f >= 0.5) { var v = E.inOut((f - 0.5) * 2); M(ctx, 'card', { x: E.lerp(o.x + R + 4, o.x + 120, v), y: o.y - 14, w: 34, h: 26, lines: 1 }); }
      return anchors({ x: o.x, y: o.y, r: R });
    },

    // a plug that joins the lamp to a drawer of a database
    conector: function (ctx, o) {
      var R = o.r || 36, p = o.p == null ? 1 : o.p, dx = o.dx || 200;
      base(ctx, { x: o.x, y: o.y, r: R, p: p, t: o.t, still: o.still });
      var cx = o.x + dx;
      M(ctx, 'frame', { x: cx - 4, y: o.y - 54, w: 92, h: 108 });
      for (var i = 0; i < 3; i++) { M(ctx, 'frame', { x: cx + 6, y: o.y - 46 + i * 33, w: 72, h: 26, fill: false }); S.machineLine(ctx, cx + 34, o.y - 33 + i * 33, cx + 50, o.y - 33 + i * 33, 1.6); }
      var cp = E.segment(p, 0.3, 1);
      S.machineLine(ctx, o.x + R, o.y, o.x + R + (dx - R - 30) * cp, o.y, 2);
      if (cp > 0) M(ctx, 'plug', { x: o.x + R + (dx - R - 30) * cp + 4, y: o.y, s: 14, dir: 1 });
      return { drawer: [cx, o.y - 54, 92, 108] };
    },

    // the lamp inside a browser window frame
    'navegador-agente': function (ctx, o) {
      var w = o.w || 150, h = o.h || 110, x = o.x - w / 2, y = o.y - h / 2;
      var a = S.appear('pop', o.p == null ? 1 : o.p);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      M(ctx, 'browser', { x: x, y: y, w: w, h: h, bar: 18 });
      ctx.restore();
      base(ctx, { x: o.x, y: o.y + 9, r: Math.min(w, h) * 0.3, p: o.p, t: o.t, still: o.still });
    }
  };

  NS.course.lamp = function (ctx, id, o) {
    o = o || {};
    var fn = F[id] || F.lampara;
    ctx.save();
    var out = fn(ctx, o);
    ctx.restore();
    return out || anchors(o);
  };
  NS.course.lampIds = Object.keys(F);
})(window.IAHI);
