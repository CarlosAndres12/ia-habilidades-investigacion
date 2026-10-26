/* Course signs of spec §3.5: the content's metaphors and diagrams, parameterized, seeded and able
   to draw on with progress values. sign(ctx, id, o): o.q is the list of beat progresses (usually
   [s.at(0), s.at(1), …]) and every label comes from the caller (scene texts or data), never from
   this file. Signs built for one video live in the same registry (C.signs). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;
  var R = C.signs = C.signs || {};

  function q(o, i) { var a = o.q || []; return a[i] == null ? (o.p == null ? 1 : o.p) : a[i]; }
  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 12 : r); }

  // ------------------------------------------------------------------ niveles-ia (content §1.1)
  // four nested rounded frames; o = { x, y, w, h, labels[4], examples[4], q[4], emph }
  R['niveles-ia'] = function (ctx, o) {
    var roles = ['ground-2', 'accent-5', 'ground', 'accent-2'];
    var boxes = [];
    for (var i = 0; i < 4; i++) {
      var inset = { l: 30 * i, r: 30 * i, t: 70 * i, b: 22 * i };
      boxes.push({ x: o.x + inset.l, y: o.y + inset.t, w: o.w - inset.l - inset.r, h: o.h - inset.t - inset.b });
    }
    boxes.forEach(function (b, i) {
      var p = q(o, i);
      if (p <= 0) return;
      var a = S.appear('bloom', p);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      var shape = rect(b.x, b.y, b.w, b.h, 26 - i * 3);
      S.fill(ctx, shape, { role: roles[i], seed: 11 + i, p: 1, alpha: i === 2 ? 1 : 0.92 });
      var emph = i === 3 && o.emph ? o.emph : 0;
      S.stroke(ctx, P.wobble(shape, 20 + i, 1.4), { weight: emph > 0 ? 'heavy' : 'bold', closed: true, taper: false, swell: 0.3, p: E.segment(p, 0, 0.8), seed: 20 + i });
      var lab = o.labels[i] || '', ex = o.examples ? o.examples[i] : '';
      var lw = S.measure(ctx, lab, 25, 700);
      S.text(ctx, lab, b.x + 22, b.y + 42, { size: 25, weight: 700, p: E.segment(p, 0.3, 1) });
      if (ex) {
        var room = b.w - 66 - lw;
        if (room > S.measure(ctx, '«' + ex + '»', 18, 500)) S.text(ctx, '«' + ex + '»', b.x + 40 + lw, b.y + 41, { size: 18, weight: 500, role: 'ink-soft', p: E.segment(p, 0.5, 1) });
        else S.text(ctx, '«' + ex + '»', b.x + 22, b.y + 66, { size: 18, weight: 500, role: 'ink-soft', p: E.segment(p, 0.5, 1), maxWidth: b.w - 40 });
      }
      ctx.restore();
    });
    return boxes;
  };

  // ------------------------------------------------------------------ linea-tiempo (content §1.2)
  // o = { x, y (axis), w, scale, cards: [{ year, label, q, row }], band: { from, to, label, q }, emph: { from, q } }
  R['linea-tiempo'] = function (ctx, o) {
    var sc = o.scale, x0 = o.x, w = o.w, y = o.y, p = o.p == null ? 1 : o.p;
    var px = function (v) { return x0 + (v - sc.from) / (sc.to - sc.from) * w; };
    if (o.band && (o.band.q == null ? 1 : o.band.q) > 0) {
      var bq = o.band.q == null ? 1 : o.band.q;
      var bx1 = px(o.band.from), bx2 = px(o.band.to);
      var band = P.blob((bx1 + bx2) / 2, y - 6, (bx2 - bx1) / 2 + 10, 118, 7, 4, 0.06);
      S.fill(ctx, band, { role: 'accent-5', p: bq, seed: 7, alpha: 0.9 });
      S.sign(ctx, 'star', { x: bx1 + 30, y: y - 92, r: 10, seed: 4, p: bq });
      S.sign(ctx, 'star', { x: bx2 - 34, y: y - 70, r: 8, seed: 5, p: bq });
      S.text(ctx, o.band.label, (bx1 + bx2) / 2, y + 74, { size: 20, weight: 700, align: 'center', p: bq, maxWidth: bx2 - bx1 + 60 });
    }
    var axis = [];
    for (var xx = x0 - 10; xx <= x0 + w + 10; xx += 12) axis.push([xx, y + Math.sin(xx * 0.01) * 1.2]);
    S.stroke(ctx, axis, { weight: 'bold', p: E.segment(p, 0, 0.6), seed: 3, dot: true });
    for (var v = sc.from; v <= sc.to + 1e-9; v += sc.step) {
      var tx = px(v);
      S.stroke(ctx, [[tx, y - 8], [tx, y + 8]], { weight: 'thin', taper: false, p: p });
      S.text(ctx, NS.engine.charts.axisLabel(v, sc), tx, y + 34, { size: 17, weight: 700, align: 'center', role: 'ink-soft', p: p });
    }
    if (o.emph && (o.emph.q || 0) > 0) {
      var ex1 = px(o.emph.from), ex2 = x0 + w;
      S.stroke(ctx, [[ex1, y], [ex2, y]], { weight: 'heavy', role: 'accent-1', p: o.emph.q, taper: false, seed: 9 });
    }
    (o.cards || []).forEach(function (c, i) {
      var cq = c.q == null ? 1 : c.q;
      if (cq <= 0) return;
      var cx = px(c.year);
      var up = c.row == null ? (i % 2 === 0) : c.row < 0;
      var level = c.level || 0;
      var bw = c.w || 190, bh = c.h || 66;
      var by = up ? y - 120 - bh - level * (bh + 14) : y + 56 + level * (bh + 14);
      var bx = Math.max(x0 - 60, Math.min(x0 + w + 60 - bw, cx - bw / 2 + (c.dx || 0)));
      S.stroke(ctx, [[cx, y + (up ? -10 : 10)], [cx, up ? by + bh : by]], { weight: 'thin', taper: false, p: cq, seed: 40 + i });
      S.fill(ctx, P.circle(cx, y, 6, 14), { role: 'ink', offset: false, texture: false, p: cq });
      C.box(ctx, { x: bx, y: by, w: bw, h: bh }, { label: c.label, p: cq, size: 17, seed: 50 + i, role: c.role || 'ground', maxLines: 3 });
    });
    return { px: px };
  };

  // ------------------------------------------------------------------ tres-motores (content §1.2)
  // o = { x, y, w, labels[3], algo (label of the Transformer block), q[3], t }
  R['tres-motores'] = function (ctx, o) {
    var cw = o.w / 3, out = [];
    for (var i = 0; i < 3; i++) {
      var p = q(o, i);
      var cx = o.x + cw * i + cw / 2, cy = o.y;
      out.push([cx, cy]);
      if (p <= 0) continue;
      var a = S.appear('rise', p);
      ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(0, a.dy);
      S.fill(ctx, P.blob(cx, cy, 128, 104, 60 + i, 5, 0.12), { role: ['accent-2', 'accent-5', 'accent-1'][i], seed: 60 + i, alpha: i === 2 ? 0.28 : 0.55 });
      if (i === 0) C.prop(ctx, 'card-stack', { x: cx, y: cy + 62, w: 120, h: 84, n: 6, p: 1 });
      else if (i === 1) C.lamp(ctx, 'chip-gpu', { x: cx, y: cy, s: 104, p: 1 });
      else C.box(ctx, { x: cx - 100, y: cy - 44, w: 200, h: 88 }, { label: o.algo, size: 22, role: 'ground', weight: 'bold', seed: 71 });
      S.text(ctx, o.labels[i], cx, cy + 148, { size: 23, weight: 700, align: 'center', maxWidth: cw - 20 });
      ctx.restore();
    }
    return out;
  };

  // ------------------------------------------------------------------ tres-epocas (content §1.2 demo)
  // o = { x, y, w, h, gap, panels: [{ title, lamp, q (panel), qq (question), qa (answer), question: [lines], answer: [lines] | null, closedText }], t, small }
  R['tres-epocas'] = function (ctx, o) {
    var n = o.panels.length, gap = o.gap || 26, pw = (o.w - gap * (n - 1)) / n, ph = o.h;
    var small = !!o.small;
    var boxes = [];
    o.panels.forEach(function (pn, i) {
      var x = o.x + i * (pw + gap), y = o.y;
      var b = { x: x, y: y, w: pw, h: ph };
      boxes.push(b);
      var pq = pn.q == null ? 1 : pn.q;
      if (pq <= 0) return;
      C.box(ctx, b, { p: pq, role: 'ground', weight: 'bold', seed: 80 + i });
      S.text(ctx, pn.title, x + pw / 2, y + (small ? 30 : 40), { size: small ? 19 : 24, weight: 700, align: 'center', p: pq, maxWidth: pw - 20 });
      var lr = small ? 20 : 30;
      C.lamp(ctx, pn.lamp || 'lampara', { x: x + 20 + lr, y: y + (small ? 64 : 90), r: lr, p: pq, t: o.t, still: small });
      if (small) return;
      var qq = pn.qq == null ? pq : pn.qq;
      if (qq > 0) {
        var qy = y + 132;
        C.prop(ctx, 'chat-bubble', { x: x + 16, y: qy, w: pw - 32, h: pn.question && pn.question.length > 1 ? 150 : 70, p: qq, tail: 'right', seed: 90 + i });
        if (pn.question) {
          var tq = S.text(ctx, pn.question[0], x + 32, qy + 30, { size: 16, weight: 700, maxWidth: pw - 64, lineHeight: 1.2, maxLines: 3, p: qq });
          if (pn.question[1]) S.text(ctx, pn.question[1], x + 32, qy + 38 + tq.height, { size: 15, weight: 500, role: 'ink-soft', maxWidth: pw - 64, lineHeight: 1.2, maxLines: 3, p: qq });
        }
      }
      var qa = pn.qa == null ? 0 : pn.qa;
      if (qa > 0) {
        var ay = y + ph - (pn.answer ? 150 : 86);
        C.prop(ctx, 'chat-bubble', { x: x + 16, y: ay, w: pw - 32, h: pn.answer ? 132 : 64, p: qa, tail: 'left', role: pn.answer ? 'ground-2' : 'ground', seed: 95 + i });
        if (pn.answer) {
          var ta = S.text(ctx, pn.answer[0], x + 32, ay + 30, { size: 16, weight: 700, maxWidth: pw - 64, lineHeight: 1.2, maxLines: 2, p: qa });
          if (pn.answer[1]) S.text(ctx, pn.answer[1], x + 32, ay + 38 + ta.height, { size: 15, weight: 500, role: 'ink-soft', maxWidth: pw - 64, lineHeight: 1.2, maxLines: 3, p: qa });
        } else if (pn.closedText) {
          S.text(ctx, pn.closedText, x + pw / 2, ay + 42, { size: 30, weight: 700, align: 'center', p: qa });
        }
      }
    });
    return boxes;
  };

  // ------------------------------------------------------------------ cajas-modelos (content §1.3 table)
  // o = { x, y, w, h, boxes: [{ title, items: [labels], examples, closed, windowLabel, q }], note, noteQ }
  R['cajas-modelos'] = function (ctx, o) {
    var n = o.boxes.length, gap = o.gap || 40, bw = (o.w - gap * (n - 1)) / n, bh = o.h || 230;
    var out = [];
    o.boxes.forEach(function (bx, i) {
      var p = bx.q == null ? 1 : bx.q;
      var x = o.x + i * (bw + gap), y = o.y;
      out.push({ x: x, y: y, w: bw, h: bh });
      if (p <= 0) return;
      var a = S.appear('rise', p);
      ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(0, a.dy);
      S.text(ctx, bx.title, x + bw / 2, y - 84, { size: 25, weight: 700, align: 'center', maxWidth: bw });
      var open = !bx.closed ? E.segment(p, 0.25, 0.9) : 0;
      if (open > 0) {
        // the open lid stands up behind the box, its inside showing
        var lh = 58 * open;
        S.shape(ctx, rect(x + 8, y - lh, bw - 16, lh + 12, 8), { role: 'accent-7', seed: 103 + i, weight: 'regular' });
        S.fill(ctx, rect(x + 22, y - lh + 10, bw - 44, Math.max(2, lh - 14), 6), { role: 'ground-2', offset: false, texture: false });
      }
      var body = rect(x, y, bw, bh, 10);
      S.fill(ctx, body, { role: 'accent-6', seed: 100 + i, alpha: 0.85 });
      S.stroke(ctx, P.wobble(body, 101 + i, 1.2), { weight: 'bold', closed: true, taper: false, seed: 102 + i });
      if (bx.closed) {
        S.shape(ctx, rect(x - 6, y - 22, bw + 12, 26, 6), { role: 'accent-7', seed: 103 + i, weight: 'regular' });
        var wx = x + bw / 2 - 70, wy = y + bh / 2 - 38;
        S.fill(ctx, rect(wx, wy, 140, 76, 8), { role: 'ground', offset: false, texture: false });
        S.stroke(ctx, rect(wx, wy, 140, 76, 8), { weight: 'regular', closed: true, taper: false, seed: 104 + i });
        if (bx.windowLabel) S.text(ctx, bx.windowLabel, wx + 70, wy + 46, { size: 19, weight: 700, align: 'center', maxWidth: 130 });
      } else {
        (bx.items || []).forEach(function (it, k) {
          var iq = E.segment(p, 0.45 + k * 0.15, 0.7 + k * 0.15);
          if (iq <= 0) return;
          var ih = 46, iy = y + 22 + k * (ih + 14);
          C.box(ctx, { x: x + 18, y: iy, w: bw - 36, h: ih }, { label: it, p: iq, size: 17, role: 'ground', seed: 110 + i * 5 + k, r: 20 });
        });
      }
      if (bx.examples) S.text(ctx, bx.examples, x + bw / 2, y + bh + 34, { size: 17, weight: 500, align: 'center', role: 'ink-soft', maxWidth: bw + 10, lineHeight: 1.22, maxLines: 3, p: E.segment(p, 0.6, 1) });
      ctx.restore();
    });
    if (o.note && (o.noteQ == null ? 1 : o.noteQ) > 0) {
      S.text(ctx, o.note, o.x + o.w / 2, o.y + bh + 104, { size: 17, weight: 700, align: 'center', p: o.noteQ == null ? 1 : o.noteQ });
    }
    return out;
  };

  // ------------------------------------------------------------------ neurona (content §1.4), machine manner
  // o = { x, y, w, h, q (inputs), act (0→1 gauge), dials: [angles], t }
  R.neurona = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w || 420, h = o.h || 260, p = o.p == null ? 1 : o.p;
    S.machineArea(ctx, x, y, w, h);
    var nx = x + w * 0.66, ny = y + h / 2;
    var dials = o.dials || [-0.6, 0.4, -1.4, 0.9];
    var inq = o.q == null ? p : o.q;
    for (var i = 0; i < 4; i++) {
      var iy = y + 40 + i * (h - 80) / 3;
      var lq = E.segment(inq, i * 0.15, 0.4 + i * 0.15);
      if (lq <= 0) continue;
      S.machine(ctx, 'arrow', { from: [x + 20, iy], to: [nx - 24, ny + (iy - ny) * 0.12], p: lq, head: false });
      var turn = E.inOut(E.segment(inq, 0.3 + i * 0.12, 0.7 + i * 0.12));
      var ty = ny + (iy - ny) * 0.12, dxp = x + w * 0.3, u0 = (dxp - (x + 20)) / Math.max(1, (nx - 24) - (x + 20));
      S.machine(ctx, 'dial', { x: dxp, y: iy + (ty - iy) * u0, r: 14, angle: -Math.PI / 2 + dials[i] * turn });
      S.machine(ctx, 'node', { x: x + 20, y: iy, r: 6 });
    }
    S.machine(ctx, 'node', { x: nx, y: ny, r: 24, on: o.act || 0 });
    var gq = o.act || 0;
    S.machine(ctx, 'gauge', { x: x + w - 64, y: ny + 30, r: 40, labels: ['', '', '', ''], needle: gq > 0 ? -0.5 + gq * 3.6 : null });
    S.machineLine(ctx, nx + 24, ny, x + w - 108, ny, 1.4);
    return { node: [nx, ny], box: { x: x, y: y, w: w, h: h } };
  };

  // ------------------------------------------------------------------ red-capas (content §1.4), machine manner
  // o = { x, y, w, h, cols: [n, …], panels: [labels], pq: [q per panel], p }
  R['red-capas'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, p = o.p == null ? 1 : o.p;
    var cols = o.cols || [4, 5, 5, 3];
    S.machineArea(ctx, x, y, w, h);
    var pts = cols.map(function (n, c) {
      var cx = x + 50 + c * (w - 100) / (cols.length - 1);
      var arr = [];
      for (var k = 0; k < n; k++) arr.push([cx, y + 50 + (k + 0.5) * (h - 100) / n]);
      return arr;
    });
    for (var c = 0; c < pts.length - 1; c++) {
      var lq = E.segment(p, c / pts.length, (c + 1) / pts.length);
      if (lq <= 0) continue;
      pts[c].forEach(function (a) { pts[c + 1].forEach(function (b) { S.machineLine(ctx, a[0], a[1], a[0] + (b[0] - a[0]) * lq, a[1] + (b[1] - a[1]) * lq, 0.9, 'machine-line'); }); });
    }
    pts.forEach(function (col, c) {
      var nq = E.segment(p, c / pts.length * 0.8, c / pts.length * 0.8 + 0.2);
      if (nq <= 0) return;
      col.forEach(function (pt) { S.machine(ctx, 'node', { x: pt[0], y: pt[1], r: 9 }); });
    });
    (o.panels || []).forEach(function (lb, i) {
      var pq = o.pq ? o.pq[i] : p;
      if (pq <= 0) return;
      var col = pts[Math.min(pts.length - 1, i + 1)];
      var bx = col[0][0] - 62, by = y - 70;
      C.box(ctx, { x: bx, y: by, w: 124, h: 52 }, { label: lb, p: pq, size: 18, role: 'accent-2', seed: 120 + i });
      S.machine(ctx, 'arrow', { from: [col[0][0], by + 52], to: [col[0][0], col[0][1] - 14], p: pq, w: 1.2, head: 6 });
      col.forEach(function (pt) { S.glow(ctx, pt[0], pt[1], 18 * pq, 'machine-glow-1'); });
    });
    return pts;
  };

  // ------------------------------------------------------------------ montana-niebla (content §1.4)
  // o = { x, y, w, h, step (0→1 along the slope), steps (n), fog, t }
  R['montana-niebla'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, p = o.p == null ? 1 : o.p;
    var slope = function (u) { return [x + u * w, y + h * (0.12 + 0.78 * (u * u * (3 - 2 * u))) + Math.sin(u * 18) * 6]; };
    var line = [];
    for (var i = 0; i <= 60; i++) line.push(slope(i / 60));
    var foot = y + h + 40;
    var land = [[x - 60, foot], [x - 52, y + h * 0.5], [x - 30, y + h * 0.22]].concat(line).concat([[x + w + 40, y + h * 0.93], [x + w + 70, foot]]);
    land = P.smooth(land, 6, true); land.closed = true;
    S.fill(ctx, land, { role: 'accent-4', seed: 130, p: p, alpha: 0.85 });
    S.stroke(ctx, line, { weight: 'bold', p: p, seed: 131 });
    var n = o.steps || 14;
    var at = E.clamp(o.step == null ? 0 : o.step, 0, 1);
    var k = Math.floor(at * n);
    var frac = at * n - k;
    var u0 = 0.06 + 0.88 * (k / n), u1 = 0.06 + 0.88 * (Math.min(n, k + 1) / n);
    var pos0 = slope(u0), pos1 = slope(u1);
    var pt = [E.lerp(pos0[0], pos1[0], E.inOut(frac)), E.lerp(pos0[1], pos1[1], E.inOut(frac)) - 22 - Math.sin(frac * Math.PI) * 12];
    // footprints of the steps taken
    for (var j = 0; j <= k; j++) { var fp = slope(0.06 + 0.88 * (j / n)); S.fill(ctx, P.circle(fp[0], fp[1] - 6, 3.4, 10), { role: 'ink', offset: false, texture: false }); }
    // fog: flat cream fields around the bead, leaving it visible (no gradients)
    var fog = o.fog == null ? 1 : o.fog;
    if (fog > 0) {
      for (var f = 0; f < 6; f++) {
        var fa = f * 1.05 + (o.t || 0) * 0.08;
        var fx = pt[0] + Math.cos(fa) * (110 + f * 22);
        var fy = pt[1] + Math.sin(fa) * (46 + f * 6) - 8;
        S.fill(ctx, P.blob(fx, fy, 110, 38, 140 + f, 4, 0.18), { role: 'ground', offset: false, texture: false, alpha: 0.78 * fog });
      }
    }
    // the bead, made of the lamp's parts
    S.machine(ctx, 'disc', { x: pt[0], y: pt[1], r: 16 });
    S.machine(ctx, 'node', { x: pt[0], y: pt[1], r: 6, on: 0.6 });
    return { bead: pt, slope: slope };
  };

  // ------------------------------------------------------------------ curvas-ajuste (content §1.4)
  // o = { x, y, w, h, side: 'over' | 'smooth', q: [dots, curve, new dots, misses] }
  R['curvas-ajuste'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    var r = NS.engine.rng(o.seed || 150);
    var base = function (u) { return y + h * (0.75 - 0.5 * u) ; };
    var train = [], fresh = [];
    for (var i = 0; i < 9; i++) { var u = 0.06 + i * 0.11; train.push([x + u * w, base(u) + (i % 2 ? 1 : -1) * r.range(38, 58)]); }
    [1, 3, 4, 6, 7].forEach(function (k) { var v = 0.06 + k * 0.11 + 0.02; fresh.push([x + v * w, base(v) + r.range(-8, 8)]); });
    S.stroke(ctx, [[x, y + h], [x + w, y + h]], { weight: 'thin', taper: false });
    S.stroke(ctx, [[x, y + h], [x, y]], { weight: 'thin', taper: false });
    var q0 = q(o, 0), q1 = q(o, 1), q2 = q(o, 2), q3 = q(o, 3);
    train.forEach(function (pt, i) { if (E.stagger(q0, i, train.length) > 0) S.fill(ctx, P.circle(pt[0], pt[1], 7, 14), { role: 'ink', offset: false, texture: false, p: E.stagger(q0, i, train.length) }); });
    if (q1 > 0) {
      if (o.side === 'smooth') {
        var sm = [];
        for (var s2 = 0; s2 <= 30; s2++) { var uu = s2 / 30; sm.push([x + uu * w, base(uu)]); }
        S.stroke(ctx, sm, { weight: 'bold', role: 'accent-3', p: q1, seed: 151 });
      } else {
        S.stroke(ctx, P.smooth([[x + 4, train[0][1]]].concat(train).concat([[x + w - 4, train[train.length - 1][1]]]), 10), { weight: 'bold', role: 'accent-1', p: q1, seed: 152 });
      }
    }
    fresh.forEach(function (pt, i) {
      var fq = E.stagger(q2, i, fresh.length);
      if (fq <= 0) return;
      S.stroke(ctx, P.circle(pt[0], pt[1], 8, 16), { weight: 'thin', closed: true, taper: false, p: fq });
      if (o.side !== 'smooth' && q3 > 0) C.cross(ctx, pt[0] + 14, pt[1] - 14, 12, { p: E.stagger(q3, i, fresh.length), weight: 'thin' });
    });
    return { train: train, fresh: fresh };
  };

  // ------------------------------------------------------------------ caja-negra (content §1.4)
  // o = { x, y, coefLabel, q: [lamp + dials, regression card], t }
  R['caja-negra'] = function (ctx, o) {
    var q0 = q(o, 0), q1 = q(o, 1);
    var mx = o.x, my = o.y, mw = 470, mh = 300;
    if (q0 > 0) {
      var a = S.appear('bloom', q0);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      S.machineArea(ctx, mx, my, mw, mh);
      for (var i = 0; i < 6; i++) for (var j = 0; j < 4; j++) {
        if ((i === 2 || i === 3) && (j === 1 || j === 2)) continue;
        S.machine(ctx, 'dial', { x: mx + 50 + i * 74, y: my + 46 + j * 70, r: 13, angle: -Math.PI / 2 + Math.sin(i * 1.7 + j * 2.3) * 1.3 });
      }
      C.lamp(ctx, 'lampara', { x: mx + mw / 2, y: my + mh / 2, r: 54, t: o.t });
      ctx.restore();
    }
    if (q1 > 0) {
      var cx = mx + mw + 70, cy = my + 10, cw = 380, ch = 280;
      var b = C.box(ctx, { x: cx, y: cy, w: cw, h: ch }, { p: q1, role: 'ground', weight: 'bold', seed: 160 });
      var r = NS.engine.rng(161);
      for (var k = 0; k < 12; k++) {
        var u = k / 11;
        S.fill(ctx, P.circle(cx + 40 + u * (cw - 80), cy + ch - 60 - u * (ch - 140) + r.range(-18, 18), 5, 12), { role: 'ink', offset: false, texture: false, p: q1 });
      }
      S.stroke(ctx, [[cx + 30, cy + ch - 50], [cx + cw - 30, cy + 70]], { weight: 'bold', role: 'accent-3', p: E.segment(q1, 0.3, 1), seed: 162 });
      C.box(ctx, { x: cx + cw / 2 - 90, y: cy + 22, w: 180, h: 44 }, { label: o.coefLabel, p: E.segment(q1, 0.5, 1), size: 18, role: 'accent-2', seed: 163 });
    }
    return { machine: [mx, my, mw, mh] };
  };

  // ------------------------------------------------------------------ ficha-proyecto (Anexos B1)
  // o = { x, y, w, h, title, fields: [{ label, value, marks, q }] }
  R['ficha-proyecto'] = function (ctx, o) {
    var p = o.p == null ? 1 : o.p;
    C.box(ctx, { x: o.x, y: o.y, w: o.w, h: o.h }, { p: p, role: 'ground', weight: 'bold', seed: 170 });
    if (o.title) S.text(ctx, o.title, o.x + 24, o.y + 40, { size: 22, weight: 700, p: p });
    var y = o.y + (o.title ? 76 : 40);
    var fh = (o.h - (y - o.y) - 16) / Math.max(1, o.fields.length);
    o.fields.forEach(function (f, i) {
      var fy = y + i * fh;
      S.text(ctx, f.label, o.x + 24, fy + 22, { size: 18, weight: 700, p: p, maxWidth: o.w - 48 });
      S.stroke(ctx, [[o.x + 24, fy + fh - 10], [o.x + o.w - 24, fy + fh - 10]], { weight: 'hair', taper: false, p: p, seed: 171 + i });
      var fq = f.q == null ? 0 : f.q;
      if (fq <= 0) return;
      if (f.value) S.text(ctx, f.value, o.x + 24, fy + fh - 18, { size: 18, weight: 500, role: 'accent-3', p: fq, maxWidth: o.w - 48 });
      else if (f.marks) {
        for (var m = 0; m < f.marks; m++) {
          var mw = (o.w - 80) * (0.25 + 0.15 * ((m * 3) % 4)) / f.marks * 2;
          S.stroke(ctx, [[o.x + 30 + m * (o.w - 60) / f.marks, fy + fh - 20], [o.x + 30 + m * (o.w - 60) / f.marks + mw * E.stagger(fq, m, f.marks), fy + fh - 21]], { weight: 'thin', role: 'accent-3', taper: false, seed: 180 + m });
        }
      }
    });
  };

  // ------------------------------------------------------------------ bitacora (Anexos B2)
  // o = { x, y, w, headers (from data), fill (rows filled, 0→n), nRows }
  R.bitacora = function (ctx, o) {
    var cols = o.cols || (o.headers && o.headers.length === 7 ? [0.1, 0.2, 0.11, 0.17, 0.13, 0.16, 0.13] : null);
    return C.table(ctx, { x: o.x, y: o.y, w: o.w, headers: o.headers, cols: cols, nRows: o.nRows || 2, fill: o.fill == null ? 1 : o.fill, rowH: o.rowH || 46, headH: o.headH || 70, headSize: o.headSize || 15, p: o.p });
  };

  // ------------------------------------------------------------------ seis-ejes (content Programa)
  // the six legend items in a ring, each with sign and label; o = { cx, cy, rx, ry, q (stagger), ids }
  R['seis-ejes'] = function (ctx, o) {
    var ids = o.ids || (NS.data.legend || []).map(function (l) { return l.id; });
    return C.ring(ctx, { n: ids.length, cx: o.cx, cy: o.cy, rx: o.rx || 330, ry: o.ry || 200, p: o.p, stepP: o.stepP, draw: function (i, x, y, qq) {
      var w = S.measure(ctx, (C.pictos && NS.engine.legend.item(ids[i]) || {}).label || '', o.size || 19, 700) + 60;
      C.legendChip(ctx, ids[i], x - w / 2, y, { p: qq, size: o.size || 19, r: o.r || 22 });
    } });
  };

  // the sign's own final-copy labels (spec §3.5), for scenes that do not list them in their texts
  function rot(id) { return ((NS.data.rotulos || {}).signs || {})[id] || []; }
  C.signLabels = rot;

  // ------------------------------------------------------------------ ecuacion-busqueda (content §4.1)
  // a card with a search equation of keywords joined by «Y» and «O», and the database names;
  // o = { x, y, w, h, labels: [y, o, base1…base4] (default: §3.5), q: [equation, bases], label }
  R['ecuacion-busqueda'] = function (ctx, o) {
    var L = o.labels || rot('ecuacion-busqueda');
    var w = o.w || 420, h = o.h || 220, x = o.x, y = o.y;
    var q0 = q(o, 0), q1 = q(o, 1);
    C.box(ctx, { x: x, y: y, w: w, h: h }, { p: q0, role: 'ground', weight: 'bold', seed: 300 });
    if (q0 <= 0) return;
    // two rows: (kw O kw) Y (kw O kw)
    var row = function (yy, k) {
      var pw = (w - 140) / 2;
      S.stroke(ctx, P.arc(x + 26, yy + 18, 16, Math.PI * 0.6, Math.PI * 1.4, 10), { weight: 'thin', p: q0, seed: 301 + k });
      C.box(ctx, { x: x + 34, y: yy, w: pw, h: 36 }, { p: E.segment(q0, 0.2, 0.6), role: 'accent-5', seed: 302 + k, r: 18, lines: 1, linesY: 18 });
      S.text(ctx, L[1] || '', x + 34 + pw + 24, yy + 25, { size: 18, weight: 700, align: 'center', p: q0 });
      C.box(ctx, { x: x + 34 + pw + 48, y: yy, w: pw, h: 36 }, { p: E.segment(q0, 0.3, 0.7), role: 'accent-5', seed: 304 + k, r: 18, lines: 1, linesY: 18 });
      S.stroke(ctx, P.arc(x + w - 40, yy + 18, 16, -Math.PI * 0.4, Math.PI * 0.4, 10), { weight: 'thin', p: q0, seed: 306 + k });
    };
    row(y + 26, 0);
    S.text(ctx, L[0] || '', x + w / 2, y + 92, { size: 20, weight: 700, align: 'center', p: E.segment(q0, 0.4, 0.8) });
    row(y + 104, 1);
    var bases = L.slice(2);
    var bx = x + 18;
    bases.forEach(function (b, i) {
      var bq = E.stagger(q1, i, bases.length);
      if (bq <= 0) return;
      var bw = S.measure(ctx, b, 15, 700) + 38;   // C.box wraps at width − 24: keep names on one line
      if (bx + bw > x + w - 10) return;
      C.box(ctx, { x: bx, y: y + h - 50, w: bw, h: 32 }, { label: b, size: 15, p: bq, role: 'ground-2', seed: 310 + i, r: 16 });
      bx += bw + 8;
    });
    if (o.label) S.text(ctx, o.label, x + w / 2, y + h + 30, { size: 19, weight: 700, align: 'center', maxWidth: w + 60, p: o.labelQ == null ? q0 : o.labelQ });
  };

  // ------------------------------------------------------------------ acuerdo (Sesión 7, Anexos B7)
  // two columns of codes for the same fragments, «Usted» and «IA», linked where they match;
  // o = { x, y, w, h, labels: [usted, ia], n, q: [human column, AI column, links], fade: [i…] (AI codes that fade), fadeQ }
  R.acuerdo = function (ctx, o) {
    var L = o.labels || rot('acuerdo');
    var n = o.n || 6, x = o.x, y = o.y, w = o.w || 420, h = o.h || 300;
    var human = o.human || [0, 1, 0, 2, 1, 3], ai = o.ai || [0, 1, 2, 2, 1, 0];
    var roles = ['accent-3', 'accent-2', 'accent-1', 'accent-4'];
    var colW = 110, gap = w - colW * 2, rowH = (h - 50) / n;
    var q0 = q(o, 0), q1 = q(o, 1), q2 = q(o, 2);
    S.text(ctx, L[0] || '', x + colW / 2, y + 24, { size: 21, weight: 700, align: 'center', p: Math.max(q0, 0.001) });
    S.text(ctx, L[1] || '', x + colW + gap + colW / 2, y + 24, { size: 21, weight: 700, align: 'center', p: Math.max(q1, 0.001) });
    for (var i = 0; i < n; i++) {
      var yy = y + 46 + i * rowH;
      var hq = E.stagger(q0, i, n), aq = E.stagger(q1, i, n);
      var codeBox = function (cx, code, qq, seed, fade) {
        if (qq <= 0) return;
        var b = P.rect(cx, yy, colW, rowH - 10, (rowH - 10) / 2);
        S.fill(ctx, b, { role: roles[code % roles.length], offset: false, p: qq, alpha: fade == null ? 1 : fade, seed: seed });
        S.stroke(ctx, b, { weight: 'thin', closed: true, taper: false, p: qq, alpha: fade == null ? 1 : fade });
        S.sign(ctx, ['dots', 'star', 'spiral', 'moon'][code % 4] === 'dots' ? 'dots' : 'star', { x: cx + colW / 2, y: yy + (rowH - 10) / 2, r: 7, seed: code + 3, p: qq });
      };
      codeBox(x, human[i], hq, 320 + i);
      var fadeA = (o.fade && o.fade.indexOf(i) >= 0) ? 1 - (o.fadeQ || 0) * 0.85 : null;
      codeBox(x + colW + gap, ai[i], aq, 330 + i, fadeA);
      if (human[i] === ai[i]) {
        var lq = E.stagger(q2, i, n);
        if (lq > 0) S.stroke(ctx, [[x + colW + 8, yy + (rowH - 10) / 2], [x + colW + gap - 8, yy + (rowH - 10) / 2 + 1]], { weight: 'regular', p: lq, taper: false, seed: 340 + i });
      }
    }
    return { x: x, y: y, w: w, h: h };
  };

  // ------------------------------------------------------------------ diagrama-flujo (Sesión 7 · Cierre, Sesión 8)
  // stage boxes joined by arrows, each with the slot of its tool and, where it applies, a bandera-control;
  // o = { x, y, w, labels, flags: [index…], tools: true (empty tool slots), sub (label under each, e.g. «para qué»), p, stepP, boxH, perRow }
  R['diagrama-flujo'] = function (ctx, o) {
    var labels = o.labels || [];
    var res = C.flow(ctx, { x: o.x, y: o.y, w: o.w, labels: labels, p: o.p, stepP: o.stepP, boxH: o.boxH || (o.tools ? 104 : 80), perRow: o.perRow, size: o.size || 19, gap: o.gap, rowGap: o.rowGap });
    res.boxes.forEach(function (b, i) {
      if (b.q <= 0) return;
      if (o.tools) {
        var tq = E.segment(b.q, 0.5, 1);
        C.box(ctx, { x: b.x + 14, y: b.y + b.h - 40, w: b.w - 28, h: 28 }, { p: tq, role: 'accent-5', r: 14, lines: 1, linesY: 14, seed: 350 + i });
      }
      if (o.sub) S.text(ctx, o.sub, b.x + b.w / 2, b.y + b.h + 24, { size: 15, weight: 700, align: 'center', role: 'ink-soft', p: E.segment(b.q, 0.6, 1) });
      if (o.flags && o.flags.indexOf(i) >= 0) C.prop(ctx, 'bandera-control', { x: b.x + b.w + (o.flagDx == null ? 10 : o.flagDx), y: b.y + b.h, s: o.flagS || 0.62, p: E.segment(b.q, 0.6, 1), showLabel: false });
    });
    return res;
  };

  C.sign = function (ctx, id, o) {
    var fn = R[id];
    if (!fn) return null;
    ctx.save();
    var out = fn(ctx, o || {});
    ctx.restore();
    return out;
  };
})(window.IAHI);

/* ======================================================================================================
   Course signs drawn first in V2 (built in parallel, kept as their own block)
   ====================================================================================================== */
/* Course signs of V2 (spec §3.5; content §2.1–§2.5): ciclo-token, tira-tokens, ventana-contexto,
   parches, mapa-significados, plano-coordenadas, cuadro-64, hilos-atencion, dos-familias,
   tarjeta-instruccion and bucle-mejora. Built only from the style API and the shared diagrams
   (C.box, C.arrow, C.cycle); parameterized, seeded and able to draw on with progress values
   (o.q = list of beat progresses, o.p = overall appearance). Every label comes from the caller
   (scene texts or C.signLabels), never from this file. Tokens and the numbers of an embedding live
   inside the machine, so they are drawn with the machine roles (ruled cells on machine-ground). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;
  var R = C.signs = C.signs || {};

  function qv(o, i) { var a = o.q || []; return a[i] == null ? (o.p == null ? 1 : o.p) : a[i]; }
  function rot(id) { return C.signLabels ? C.signLabels(id) : []; }
  function withAlpha(ctx, a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, a); fn(); ctx.restore(); }

  // one ruled cell of the machine (a token, a number)
  function cellBox(ctx, x, y, w, h, o) {
    o = o || {};
    S.machine(ctx, 'bar', { x: x, y: y, w: w, h: h, role: 'machine-ground', alpha: 1 });
    S.machine(ctx, 'frame', { x: x, y: y, w: w, h: h, fill: false, lw: o.lw || 1.2, role: o.lineRole });
  }
  // tiny regular squares standing for text inside a cell
  function glyphs(ctx, x, y, w, h, role) {
    var n = Math.max(1, Math.floor((w - 6) / 7));
    var x0 = x + (w - (n * 7 - 3)) / 2;
    for (var i = 0; i < n; i++) S.machine(ctx, 'bar', { x: x0 + i * 7, y: y + h / 2 - 2, w: 4, h: 4, role: role || 'machine-line', alpha: 0.85 });
  }
  // a calligraphic dashed line along a path (absent or pending things)
  function dashed(ctx, pts, o) {
    o = o || {};
    var res = P.resample(pts, 2), dash = o.dash || 9, gap = o.gap || 7, acc = 0, cur = [res[0]], on = true;
    for (var i = 1; i < res.length; i++) {
      acc += P.dist(res[i - 1], res[i]);
      if (on) cur.push(res[i]);
      if (on && acc >= dash) { S.stroke(ctx, cur, { weight: o.weight || 'thin', taper: false, swell: 0.2, role: o.role, seed: (o.seed || 1) + i }); on = false; acc = 0; }
      else if (!on && acc >= gap) { on = true; acc = 0; cur = [res[i]]; }
    }
    if (on && cur.length > 1) S.stroke(ctx, cur, { weight: o.weight || 'thin', taper: false, role: o.role, seed: o.seed });
  }
  // a small blank card standing for a word (no readable text)
  function wordChip(ctx, x, y, w, h, o) {
    o = o || {};
    var shape = P.rect(x, y, w, h, Math.min(10, h / 2));
    S.fill(ctx, shape, { role: o.role || 'ground', offset: false, texture: false });
    S.stroke(ctx, P.wobble(shape, (o.seed || 3) + 1, 0.8), { weight: o.weight || 'thin', closed: true, taper: false, swell: 0.2, seed: o.seed || 3 });
    if (o.line !== false) S.stroke(ctx, [[x + Math.min(12, w * 0.22), y + h / 2], [x + w - Math.min(12, w * 0.22), y + h / 2 + 0.5]], { weight: 'hair', taper: false, seed: (o.seed || 3) + 2 });
  }
  // shared helpers for the V2 scenes (kept under one name so they never collide with other files)
  C.v2kit = { cellBox: cellBox, glyphs: glyphs, dashed: dashed, wordChip: wordChip, withAlpha: withAlpha };

  // ------------------------------------------------------------------ tira-tokens (content §2.1 figure, §2.2)
  // A strip of text cut into fragments with gaps between them, in the tokenizador's manner (its strip and
  // its blade). o = { x, y (top), size, h, tokens: [str] | null, widths: [px] (cells without text),
  // cut (0→1, the blade's sweep; 1 = every boundary cut), gap (px between fragments), blade (show the
  // blade while it cuts), maxW (wrap into rows), rowGap, p (appear), lit: [indexes] (glow) }.
  // Returns { cells: [{ x, y, w, h, text }], w, h }.
  R['tira-tokens'] = function (ctx, o) {
    var size = o.size || 20, h = o.h || Math.round(size * 1.75);
    var padX = o.padX == null ? Math.round(size * 0.5) : o.padX;
    var src = o.tokens || o.widths || [];
    var items = src.map(function (t) { return o.tokens ? { text: t, w: S.measure(ctx, t, size, 700) + padX * 2 } : { text: '', w: t }; });
    var n = items.length;
    if (!n) return { cells: [], w: 0, h: 0 };
    var gap = o.gap == null ? Math.round(size * 0.55) : o.gap;
    var cut = E.clamp(o.cut == null ? 1 : o.cut, 0, 1), B = Math.max(1, n - 1);
    function open(k) { return E.inOut(E.clamp(cut * B - k, 0, 1)); }
    // rows are decided with every gap open, so they never jump while the blade cuts
    var rows = [], cur = [], curW = 0;
    items.forEach(function (it, i) {
      var add = it.w + (cur.length ? gap : 0);
      if (o.maxW && cur.length && curW + add > o.maxW) { rows.push(cur); cur = []; curW = 0; add = it.w; }
      cur.push(i); curW += add;
    });
    rows.push(cur);
    var rowGap = o.rowGap == null ? Math.round(h * 0.45) : o.rowGap;
    var cells = [], maxRow = 0;
    rows.forEach(function (row, r) {
      var full = row.reduce(function (s, i) { return s + items[i].w; }, 0) + gap * (row.length - 1);
      maxRow = Math.max(maxRow, full);
      var xx = o.align === 'center' && o.maxW ? o.x + (o.maxW - full) / 2 : o.x, yy = o.y + r * (h + rowGap);
      row.forEach(function (i, k) {
        cells[i] = { x: xx, y: yy, w: items[i].w, h: h, text: items[i].text, row: r };
        xx += items[i].w + (k < row.length - 1 ? gap * open(i) : 0);
      });
    });
    var p = o.p == null ? 1 : o.p;
    withAlpha(ctx, E.out(p), function () {
      // joined fragments are one band; each opened boundary splits the band
      rows.forEach(function (row) {
        var start = row[0];
        row.forEach(function (i, k) {
          var last = k === row.length - 1;
          if (last || open(i) > 0.04) {
            var a = cells[start], b = cells[i];
            S.machine(ctx, 'bar', { x: a.x, y: a.y, w: b.x + b.w - a.x, h: h, role: 'machine-ground', alpha: 1 });
            S.machine(ctx, 'frame', { x: a.x, y: a.y, w: b.x + b.w - a.x, h: h, fill: false, lw: 1.3 });
            if (!last) start = row[k + 1];
          }
        });
      });
      cells.forEach(function (c, i) {
        if (o.lit && o.lit.indexOf(i) >= 0) {
          S.machine(ctx, 'frame', { x: c.x - 3, y: c.y - 3, w: c.w + 6, h: c.h + 6, fill: false, lw: 2, role: 'machine-glow-1' });
        }
        if (c.text) S.machine(ctx, 'label', { text: c.text, x: c.x + c.w / 2, y: c.y + c.h / 2 + 1, size: size, align: 'center', baseline: 'middle' });
        else glyphs(ctx, c.x, c.y, c.w, c.h);
      });
      // the blade of the tokenizador, at the boundary it is cutting
      if (o.blade && cut > 0 && cut < 1) {
        var kb = Math.min(B - 1, Math.floor(cut * B)), cb = cells[kb], nb = cells[kb + 1];
        if (cb && nb && cb.row === nb.row) {
          var bx = (cb.x + cb.w + nb.x) / 2;
          S.machine(ctx, 'blade', { x: bx, y: cb.y + h / 2, h: h + 44 });
          S.machine(ctx, 'node', { x: bx, y: cb.y - 26, r: 6, on: 0.8 });
        }
      }
    });
    return { cells: cells, w: maxRow, h: rows.length * h + (rows.length - 1) * rowGap };
  };

  // ------------------------------------------------------------------ ventana-contexto (content §2.2)
  // A frame that holds a limited stretch of a long strip of text; outside the frame the strip is dim,
  // and `fade` (0→1) makes the middle of the held stretch fade (a strip longer than the frame).
  // o = { x, y, w, h (frame), stripY (center), stripH, cell, gap, from, to (strip ends), offset (scroll, px),
  //       sp (strip reveal 0→1), p (frame), fade, dim }. Returns { frame, stripY, stripH }.
  R['ventana-contexto'] = function (ctx, o) {
    var fx = o.x, fy = o.y, fw = o.w, fh = o.h, p = o.p == null ? 1 : o.p;
    var sh = o.stripH || 30, cy = o.stripY == null ? fy + fh / 2 : o.stripY, sy = cy - sh / 2;
    var cw = o.cell || 24, gap = o.gap == null ? 5 : o.gap, pitch = cw + gap;
    var x0 = o.from == null ? 0 : o.from, x1 = o.to == null ? 1280 : o.to;
    var sp = o.sp == null ? p : o.sp, fade = o.fade || 0, dim = o.dim == null ? 0.3 : o.dim;
    var off = (((o.offset || 0) % pitch) + pitch) % pitch;
    withAlpha(ctx, p, function () { S.fill(ctx, P.rect(fx, fy, fw, fh, 18), { role: 'ground-2', offset: false, texture: false, alpha: 0.85 }); });
    for (var x = x0 - off; x < x1; x += pitch) {
      if (x + cw <= x0 - 0.5) continue;
      var c = x + cw / 2;
      var reveal = E.clamp((sp * (1 + 1 / 14) - (x - x0) / Math.max(1, x1 - x0)) * 14, 0, 1);
      if (reveal <= 0) continue;
      var a = dim;
      if (c >= fx && c <= fx + fw) {
        var v = (c - fx) / fw, bump = Math.pow(Math.sin(Math.PI * v), 2);
        a = 1 - fade * 0.86 * bump;
      }
      withAlpha(ctx, a * reveal, function () { cellBox(ctx, x, sy, cw, sh); glyphs(ctx, x, sy, cw, sh); });
    }
    S.stroke(ctx, P.wobble(P.rect(fx, fy, fw, fh, 18), 707, 1.4), { weight: 'bold', closed: true, taper: false, swell: 0.25, p: p, seed: 707 });
    return { frame: { x: fx, y: fy, w: fw, h: fh }, stripY: cy, stripH: sh };
  };

  // ------------------------------------------------------------------ parches (content §2.2)
  // An image cut into small square patches and an audio wave cut into short segments, each patch and
  // segment becoming a token cell. o = { x, y, img (side), n (patches per side), laneGap, cell, cellH,
  // q: [image cut, image tokens, audio cut, audio tokens], p }. Returns { imageRow, audioRow } with the
  // [x, y, w] of each row of token cells.
  function picture(ctx, x, y, s) {
    S.fill(ctx, P.rect(x, y, s, s, 2), { role: 'accent-5', offset: false, seed: 801 });
    var hill = P.smooth([[x - 6, y + s * 0.8], [x + s * 0.32, y + s * 0.52], [x + s * 0.64, y + s * 0.72], [x + s + 6, y + s * 0.56], [x + s + 6, y + s + 6], [x - 6, y + s + 6]], 8, true);
    hill.closed = true;
    S.fill(ctx, hill, { role: 'accent-4', offset: false, seed: 803 });
    S.fill(ctx, P.circle(x + s * 0.72, y + s * 0.28, s * 0.13, 24), { role: 'accent-1', offset: false, texture: false, seed: 802 });
    S.stroke(ctx, P.smooth([[x + s * 0.1, y + s * 0.22], [x + s * 0.2, y + s * 0.13], [x + s * 0.3, y + s * 0.21], [x + s * 0.4, y + s * 0.13], [x + s * 0.5, y + s * 0.22]], 5), { weight: 'thin', seed: 804 });
  }
  function wave(x, cy, w, amp) {
    var pts = [];
    for (var k = 0; k <= 96; k++) {
      var u = k / 96, env = 0.3 + 0.7 * Math.abs(Math.sin(u * Math.PI * 2.3 + 0.5));
      pts.push([x + u * w, cy + Math.sin(k * 0.6) * amp * env]);
    }
    return pts;
  }
  R.parches = function (ctx, o) {
    var x = o.x, y = o.y, s = o.img || 108, n = o.n || 3;
    var q0 = qv(o, 0), q1 = qv(o, 1), q2 = qv(o, 2), q3 = qv(o, 3);
    var cw = o.cell || 20, ch = o.cellH || 28, pitch = cw + 6, sepMax = 8;
    var rowX = x + s + sepMax * (n - 1) + 64;
    var out = {};
    // the image and its patches
    if (q0 > 0) {
      var ap = E.segment(q0, 0, 0.35), sep = sepMax * E.inOut(E.segment(q0, 0.35, 1));
      var ps = s / n;
      withAlpha(ctx, E.out(ap), function () {
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var px = x + i * (ps + sep), py = y + j * (ps + sep);
          ctx.save();
          ctx.beginPath(); ctx.rect(px, py, ps, ps); ctx.clip();
          ctx.translate(i * sep, j * sep);
          picture(ctx, x, y, s);
          ctx.restore();
          if (sep > 0.6) S.stroke(ctx, P.rect(px, py, ps, ps, 2), { weight: 'thin', closed: true, taper: false, seed: 810 + i * n + j });
        }
        if (sep <= 0.6) S.stroke(ctx, P.wobble(P.rect(x, y, s, s, 3), 815, 1), { weight: 'regular', closed: true, taper: false, seed: 815 });
      });
      var iy = y + s / 2 - ch / 2;
      if (q1 > 0) {
        C.arrow(ctx, [x + s + sep * (n - 1) + 12, y + s / 2], [rowX - 12, y + s / 2], { p: E.segment(q1, 0, 0.3), weight: 'thin', head: 10, seed: 820 });
        for (var k = 0; k < n * n; k++) {
          var tq = E.stagger(E.segment(q1, 0.2, 1), k, n * n, 0.7);
          if (tq <= 0) continue;
          withAlpha(ctx, E.out(tq), function () { cellBox(ctx, rowX + k * pitch, iy, cw, ch); glyphs(ctx, rowX + k * pitch, iy, cw, ch); });
        }
      }
      out.imageRow = [rowX, y + s / 2, n * n * pitch - 6];
    }
    // the audio wave and its segments
    var ay = y + s + (o.laneGap == null ? 46 : o.laneGap), ah = 64, acy = ay + ah / 2, segs = o.segments || 6;
    if (q2 > 0) {
      var ap2 = E.segment(q2, 0, 0.35), sep2 = 9 * E.inOut(E.segment(q2, 0.35, 1));
      var pts = wave(x, acy, s, ah * 0.42);
      withAlpha(ctx, E.out(ap2), function () {
        for (var g = 0; g < segs; g++) {
          var a0 = Math.round(g * 96 / segs), a1 = Math.round((g + 1) * 96 / segs);
          var part = P.translate(pts.slice(a0, a1 + 1), g * sep2, 0);
          S.stroke(ctx, part, { weight: 'regular', taper: false, swell: 0.2, seed: 830 + g });
          if (sep2 > 0.6) S.stroke(ctx, [[part[0][0] - 2, acy - ah / 2], [part[0][0] - 2, acy + ah / 2]], { weight: 'hair', taper: false, seed: 840 + g, role: 'ink-soft' });
        }
      });
      if (q3 > 0) {
        C.arrow(ctx, [x + s + sep2 * (segs - 1) + 12, acy], [rowX - 12, acy], { p: E.segment(q3, 0, 0.3), weight: 'thin', head: 10, seed: 850 });
        for (var m = 0; m < segs; m++) {
          var sq = E.stagger(E.segment(q3, 0.2, 1), m, segs, 0.7);
          if (sq <= 0) continue;
          withAlpha(ctx, E.out(sq), function () { cellBox(ctx, rowX + m * pitch, acy - ch / 2, cw, ch); glyphs(ctx, rowX + m * pitch, acy - ch / 2, cw, ch); });
        }
      }
      out.audioRow = [rowX, acy, segs * pitch - 6];
    }
    out.imageRow = out.imageRow || [rowX, y + s / 2, n * n * pitch - 6];
    out.audioRow = out.audioRow || [rowX, acy, segs * pitch - 6];
    return out;
  };

  // ------------------------------------------------------------------ mapa-significados (content §2.3)
  // A plane of labeled dots where similar words sit close (a flat color field behind each group), each
  // dot with a short tail of small cells (its list of numbers), and the analogy as two parallel arrows:
  // from «hombre» to «mujer», and the same arrow moved to start at «rey», landing near «reina».
  // o = { x, y, w, h, axesQ, size, tailQ, clusters: [{ role, q, words: [{ text, x, y, side }] }],
  //       analogy: { q, arrowQ, moveQ, words: [rey, hombre, mujer, reina] as { text, x, y, side } } }
  function dotLabel(ctx, wd, size, q) {
    var side = wd.side || 'right';
    var al = side === 'left' ? 'right' : (side === 'right' ? 'left' : 'center');
    var lx = side === 'left' ? wd.x - 16 : side === 'right' ? wd.x + 16 : wd.x;
    var ly = side === 'above' ? wd.y - 18 : side === 'below' ? wd.y + size + 12 : wd.y + size * 0.36;
    S.text(ctx, wd.text, lx, ly, { size: size, weight: 700, align: al, p: q });
  }
  function wordDot(ctx, wd, size, q, tailQ) {
    if (q <= 0) return;
    var dir = wd.side === 'left' ? 1 : -1;
    if (tailQ > 0) {
      for (var k = 0; k < 6; k++) {
        var tq = E.stagger(tailQ, k, 6, 0.6);
        if (tq <= 0) continue;
        var cx = dir < 0 ? wd.x - 18 - (k + 1) * 10 : wd.x + 18 + k * 10;
        withAlpha(ctx, E.out(tq), function () { cellBox(ctx, cx, wd.y - 4, 8, 8, { lw: 1 }); });
      }
    }
    S.fill(ctx, P.circle(wd.x, wd.y, 8, 18), { role: 'ink', offset: false, texture: false, p: q });
    dotLabel(ctx, wd, size, q);
  }
  R['mapa-significados'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, size = o.size || 22;
    var ax = o.axesQ == null ? 1 : o.axesQ;
    if (ax > 0) {
      S.stroke(ctx, [[x, y + h], [x + w, y + h - 2]], { weight: 'thin', p: ax, seed: 900, role: 'ink-soft', dot: true });
      S.stroke(ctx, [[x, y + h], [x + 2, y]], { weight: 'thin', p: ax, seed: 901, role: 'ink-soft', dot: true });
    }
    (o.clusters || []).forEach(function (cl, ci) {
      var q = cl.q == null ? 1 : cl.q;
      if (q <= 0) return;
      var xs = [], ys = [];
      cl.words.forEach(function (wd) {
        var lw = S.measure(ctx, wd.text, size, 700);
        xs.push(wd.x - 80, wd.x + (wd.side === 'left' ? 10 : lw + 26)); ys.push(wd.y - 22, wd.y + 22);
      });
      var bx0 = Math.min.apply(null, xs), bx1 = Math.max.apply(null, xs), by0 = Math.min.apply(null, ys), by1 = Math.max.apply(null, ys);
      S.fill(ctx, P.blob((bx0 + bx1) / 2, (by0 + by1) / 2, (bx1 - bx0) / 2 + 26, (by1 - by0) / 2 + 30, 910 + ci, 5, 0.12), { role: cl.role || 'accent-2', p: E.segment(q, 0, 0.5), seed: 910 + ci, alpha: 0.55 });
      cl.words.forEach(function (wd, i) { wordDot(ctx, wd, size, E.stagger(q, i, cl.words.length, 0.6), o.tailQ || 0); });
    });
    var an = o.analogy;
    if (an && (an.q || 0) > 0) {
      var W = an.words, rey = W[0], hom = W[1], muj = W[2], rei = W[3];
      var vx = muj.x - hom.x, vy = muj.y - hom.y, d = Math.sqrt(vx * vx + vy * vy) || 1, ux = vx / d, uy = vy / d;
      [hom, muj, rey, rei].forEach(function (wd, i) { wordDot(ctx, wd, size, E.stagger(an.q, i, 4, 0.6), 0); });
      var aq = an.arrowQ || 0, mq = an.moveQ || 0;
      if (aq > 0) C.arrow(ctx, [hom.x + ux * 16, hom.y + uy * 16], [muj.x - ux * 16, muj.y - uy * 16], { p: aq, weight: 'bold', head: 15, seed: 920 });
      if (mq > 0) {
        var lx = rey.x + vx, ly = rey.y + vy;
        C.arrow(ctx, [rey.x + ux * 16, rey.y + uy * 16], [lx - ux * 6, ly - uy * 6], { p: mq, weight: 'bold', head: 15, role: 'accent-1', seed: 921 });
        if (mq >= 1) S.stroke(ctx, P.circle(lx, ly, 22, 30), { weight: 'thin', closed: true, taper: false, role: 'ink-soft', seed: 922 });
      }
    }
    return { x: x, y: y, w: w, h: h };
  };

  // ------------------------------------------------------------------ plano-coordenadas (content §2.3)
  // Dots on a plane with the axes labeled «latitud» and «longitud»; no borders or outlines of
  // territories. Each dot takes the fill of the nearest of a few fixed centers, so neighbors share a fill.
  // o = { x, y, w, h, labels: [latitud, longitud], q: [axes, dots], seed, n, size, roles }
  R['plano-coordenadas'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, L = o.labels || rot('plano-coordenadas'), size = o.size || 21;
    var qa = qv(o, 0), qd = qv(o, 1);
    if (qa > 0) {
      C.arrow(ctx, [x, y + h], [x, y], { p: qa, weight: 'regular', head: 12, seed: 930 });
      C.arrow(ctx, [x, y + h], [x + w, y + h], { p: qa, weight: 'regular', head: 12, seed: 931 });
      S.text(ctx, L[0] || '', x + 16, y + 10, { size: size, weight: 700, p: qa });
      S.text(ctx, L[1] || '', x + w, y + h + 34, { size: size, weight: 700, align: 'right', p: qa });
    }
    if (qd <= 0) return { x: x, y: y, w: w, h: h };
    var roles = o.roles || ['accent-2', 'accent-4', 'accent-5', 'accent-6'];
    var centers = [[0.22, 0.28], [0.74, 0.22], [0.3, 0.76], [0.8, 0.72]];
    var r = NS.engine.rng(o.seed || 12);
    var cols = o.cols || 8, rows = o.rows || 5, pts = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      if (r() < 0.18) continue;
      pts.push([(i + 0.5 + r.range(-0.32, 0.32)) / cols, (j + 0.5 + r.range(-0.32, 0.32)) / rows]);
    }
    pts.forEach(function (pt, k) {
      var q = E.stagger(qd, k, pts.length, 0.7);
      if (q <= 0) return;
      var best = 0, bd = 9;
      centers.forEach(function (c, ci) { var dd = (c[0] - pt[0]) * (c[0] - pt[0]) + (c[1] - pt[1]) * (c[1] - pt[1]); if (dd < bd) { bd = dd; best = ci; } });
      var px = x + 26 + pt[0] * (w - 52), py = y + 20 + pt[1] * (h - 40);
      S.fill(ctx, P.circle(px, py, 10, 20), { role: roles[best % roles.length], offset: false, texture: false, p: q });
      S.stroke(ctx, P.circle(px, py, 10, 20), { weight: 'thin', closed: true, taper: false, p: q, seed: 940 + k });
    });
    return { x: x, y: y, w: w, h: h };
  };

  // ------------------------------------------------------------------ cuadro-64 (content §2.3, figure embeddings.alphaearth)
  // A square tile of land beside a strip of exactly n small cells: one list of numbers per tile, not a
  // subdivision of it. The labels of the inputs flow from the tile into the strip, all into the same list.
  // o = { tile: { x, y, s }, strip: { x, y, w, h }, n (exact, from the figure), labels: [tile label, strip label],
  //       flows: [labels], size, q: [tile, strip, flows] }. Returns { strip: [x, y, w, h] }.
  R['cuadro-64'] = function (ctx, o) {
    var t = o.tile, st = o.strip, n = Math.round(o.n || 0), L = o.labels || rot('cuadro-64'), size = o.size || 20;
    var q0 = qv(o, 0), q1 = qv(o, 1), q2 = qv(o, 2);
    if (q0 > 0) {
      var a = S.appear('bloom', q0);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      var tile = P.rect(t.x, t.y, t.s, t.s, 4);
      S.fill(ctx, tile, { role: 'accent-4', offset: false, seed: 950 });
      S.fill(ctx, P.rect(t.x + t.s * 0.08, t.y + t.s * 0.1, t.s * 0.38, t.s * 0.34, 3), { role: 'accent-6', offset: false, seed: 951, alpha: 0.9 });
      S.fill(ctx, P.rect(t.x + t.s * 0.56, t.y + t.s * 0.6, t.s * 0.34, t.s * 0.3, 3), { role: 'accent-2', offset: false, seed: 952, alpha: 0.9 });
      S.stroke(ctx, P.smooth([[t.x + t.s * 0.02, t.y + t.s * 0.72], [t.x + t.s * 0.3, t.y + t.s * 0.6], [t.x + t.s * 0.48, t.y + t.s * 0.36], [t.x + t.s * 0.98, t.y + t.s * 0.28]], 8), { weight: 'heavy', role: 'accent-5', taper: false, seed: 953 });
      S.stroke(ctx, P.wobble(tile, 954, 1), { weight: 'bold', closed: true, taper: false, swell: 0.2, seed: 954 });
      ctx.restore();
      S.text(ctx, L[0] || '', t.x + t.s / 2, t.y + t.s + 30, { size: size, weight: 700, align: 'center', p: q0 });
    }
    var pitch = st.w / Math.max(1, n), cw = pitch - Math.max(1.5, pitch * 0.2);
    if (q1 > 0 && n > 0) {
      for (var i = 0; i < n; i++) {
        var cq = E.stagger(q1, i, n, 0.8);
        if (cq <= 0) continue;
        withAlpha(ctx, E.out(cq), function () { cellBox(ctx, st.x + i * pitch, st.y, cw, st.h, { lw: 1 }); });
        var g = 0.25 + 0.6 * Math.abs(Math.sin(i * 2.17 + 0.6));
        withAlpha(ctx, E.out(cq), function () { S.machine(ctx, 'bar', { x: st.x + i * pitch + 2, y: st.y + st.h * (1 - g) - 2, w: Math.max(1, cw - 4), h: st.h * g - 2, role: 'machine-line', alpha: 0.75 }); });
      }
      S.text(ctx, L[1] || '', st.x + st.w / 2, st.y + st.h + 32, { size: size + 2, weight: 700, align: 'center', p: E.segment(q1, 0.5, 1) });
    }
    var flows = o.flows || [];
    if (q2 > 0 && flows.length) {
      var fx0 = t.x + t.s + 10, tx = st.x - 12, tyy = st.y + st.h / 2;
      flows.forEach(function (lb, k) {
        var fq = E.stagger(q2, k, flows.length, 0.6);
        if (fq <= 0) return;
        var fy = t.y + t.s * (0.16 + 0.68 * k / Math.max(1, flows.length - 1));
        var mx = (fx0 + tx) / 2;
        var pts = P.smooth([[fx0, fy], [mx - 30, fy], [mx + 40, (fy + tyy) / 2], [tx, tyy]], 10);
        S.stroke(ctx, pts, { weight: 'thin', p: E.segment(fq, 0, 0.8), taper: false, seed: 960 + k });
        S.text(ctx, lb, fx0 + 8, fy - 8, { size: size - 2, weight: 700, p: fq });
      });
      C.arrow(ctx, [tx - 22, tyy], [st.x - 4, tyy], { p: E.segment(q2, 0.7, 1), weight: 'thin', head: 10, seed: 969 });
    }
    return { strip: [st.x, st.y, st.w, st.h] };
  };

  // ------------------------------------------------------------------ hilos-atencion (content §2.4)
  // One word joined to the other words of its sentence by threads of different weight (badge «Esquema»,
  // drawn by the caller). o = { x, y (baseline), align, words: [str] (a phrase may be one chip), size,
  // focus (index), weights: [0..1 per word], q (words appear), tq (threads, number or fn(i)), alpha,
  // focusQ, arcH, heavyRole }. Returns { chips: [{ x, y, w, h, cx }] }.
  R['hilos-atencion'] = function (ctx, o) {
    var size = o.size || 26, words = o.words || [], gap = o.gap == null ? Math.round(size * 0.62) : o.gap;
    var widths = words.map(function (wd) { return S.measure(ctx, wd, size, 700); });
    var total = widths.reduce(function (s, v) { return s + v; }, 0) + gap * Math.max(0, words.length - 1);
    var x = o.align === 'center' ? o.x - total / 2 : o.x, y = o.y;
    var chips = widths.map(function (wv) { var c = { x: x, y: y - size * 0.82, w: wv, h: size * 1.12, cx: x + wv / 2 }; x += wv + gap; return c; });
    var q = o.q == null ? 1 : o.q, f = o.focus;
    var fq = o.focusQ == null ? 1 : o.focusQ;
    if (f != null && chips[f] && fq > 0) {
      var fc = chips[f];
      S.fill(ctx, P.rect(fc.x - 9, fc.y - 6, fc.w + 18, fc.h + 12, 12), { role: o.focusRole || 'accent-2', p: Math.min(q, fq), seed: 970 + f });
    }
    if (f != null && o.weights) {
      chips.forEach(function (c, i) {
        if (i === f) return;
        var wt = o.weights[i] || 0;
        var tq = typeof o.tq === 'function' ? o.tq(i) : (o.tq == null ? 1 : o.tq);
        if (wt <= 0 || tq <= 0) return;
        var A = [chips[f].cx, chips[f].y - 8], Bp = [c.cx, c.y - 8];
        var hgt = (o.arcH || 22) + Math.abs(Bp[0] - A[0]) * 0.2;
        var mid = [(A[0] + Bp[0]) / 2, Math.min(A[1], Bp[1]) - hgt];
        var heavy = wt >= 0.95;
        S.stroke(ctx, P.smooth([A, mid, Bp], 14), {
          weight: 1.2 + 8.5 * wt, p: tq, taper: false, swell: 0.55, seed: 980 + i,
          role: heavy && o.heavyRole ? o.heavyRole : 'ink', alpha: (o.alpha == null ? 1 : o.alpha) * (0.55 + 0.45 * wt), dot: heavy
        });
      });
    }
    words.forEach(function (wd, i) {
      var wq = E.stagger(q, i, words.length, 0.5);
      if (wq <= 0) return;
      S.text(ctx, wd, chips[i].x, y, { size: size, weight: 700, p: wq });
    });
    return { chips: chips, total: total };
  };

  // ------------------------------------------------------------------ dos-familias (content §2.4 table)
  // Two lanes: «Codificador, tipo BERT» (arrows from both sides over a sentence with one covered word)
  // and «Decodificador, tipo GPT» (an arrow from left to right ending in a blank for the next word).
  // o = { lanes: [{ x, y, w, title, mode: 'both' | 'next', q, n, cover }], t, size }.
  // Returns [{ chips, bottom }] per lane.
  R['dos-familias'] = function (ctx, o) {
    var out = [];
    (o.lanes || []).forEach(function (ln, li) {
      var q = ln.q == null ? 1 : ln.q, x = ln.x, y = ln.y, w = ln.w;
      var n = ln.n || 6, cg = 12, chH = 40;
      var rel = [0.8, 1.15, 0.7, 1.3, 0.9, 1.05, 0.85, 1.2].slice(0, n), sum = rel.reduce(function (s, v) { return s + v; }, 0);
      var avail = w - cg * (n - 1), chips = [], xx = x;
      rel.forEach(function (rv) { var cw = avail * rv / sum; chips.push({ x: xx, y: y + 104, w: cw, h: chH }); xx += cw + cg; });
      out.push({ chips: chips, bottom: y + 104 + chH });
      if (q <= 0) return;
      S.text(ctx, ln.title, x + w / 2, y + 26, { size: o.size || 25, weight: 700, align: 'center', p: E.segment(q, 0, 0.3), maxWidth: w });
      var cq = E.segment(q, 0.15, 0.6);
      chips.forEach(function (c, i) {
        var iq = E.stagger(cq, i, n, 0.6);
        if (iq <= 0) return;
        var last = ln.mode === 'next' && i === n - 1;
        withAlpha(ctx, E.out(iq), function () {
          if (last) {
            dashed(ctx, P.rect(c.x, c.y, c.w, c.h, 10), { weight: 'thin', dash: 7, gap: 6, seed: 990 });
            var blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((o.t || 0) * Math.PI * 2 / 1.1));
            withAlpha(ctx, blink, function () { S.stroke(ctx, [[c.x + 14, c.y + 8], [c.x + 14, c.y + c.h - 8]], { weight: 'regular', taper: false, seed: 991 }); });
          } else wordChip(ctx, c.x, c.y, c.w, c.h, { seed: 1000 + li * 10 + i });
        });
      });
      var aq = E.segment(q, 0.55, 1);
      if (ln.mode === 'both') {
        var cv = ln.cover == null ? Math.floor(n / 2) : ln.cover, cc = chips[cv];
        if (aq > 0) {
          var cardA = S.appear('pop', E.segment(aq, 0, 0.4));
          ctx.save(); ctx.globalAlpha *= cardA.alpha;
          ctx.translate(cc.x + cc.w / 2, cc.y + cc.h / 2); ctx.scale(cardA.scale, cardA.scale); ctx.rotate(-0.05);
          S.shape(ctx, P.rect(-cc.w / 2 - 6, -cc.h / 2 - 8, cc.w + 12, cc.h + 16, 8), { role: 'ink', weight: 'regular', seed: 1020 });
          S.text(ctx, '?', 0, 9, { size: 26, weight: 700, align: 'center', role: 'on-dark' });
          ctx.restore();
          var first = chips[0], lastC = chips[n - 1];
          C.arrow(ctx, [first.x + first.w / 2, first.y - 10], [cc.x + cc.w * 0.3, cc.y - 14], { p: E.segment(aq, 0.3, 0.8), curve: -36, weight: 'regular', head: 12, seed: 1021 });
          C.arrow(ctx, [lastC.x + lastC.w / 2, lastC.y - 10], [cc.x + cc.w * 0.7, cc.y - 14], { p: E.segment(aq, 0.4, 0.9), curve: 36, weight: 'regular', head: 12, seed: 1022 });
        }
      } else if (aq > 0) {
        var f0 = chips[0], bl = chips[n - 1];
        C.arrow(ctx, [f0.x + 6, f0.y - 14], [bl.x + bl.w * 0.5, bl.y - 12], { p: E.segment(aq, 0.2, 0.9), curve: -34, weight: 'regular', head: 13, seed: 1023 });
      }
    });
    return out;
  };

  // ------------------------------------------------------------------ tarjeta-instruccion (content §2.5, Anexos B3)
  // A card with six labeled parts: «Contexto», «Tarea», «Insumos», «Criterios», «Formato», «Honestidad».
  // o = { x, y, w, h, labels (default §3.5), title, size, q: [6 part progresses] | p, emph (index), emphQ,
  //       compact (short bars instead of labels; emphLabel shown on the emphasized row), variant, seed }.
  // Returns { rows: [{ x, y, w, h }] }.
  R['tarjeta-instruccion'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h, p = o.p == null ? 1 : o.p;
    var labels = o.labels || rot('tarjeta-instruccion');
    var pad = o.pad || (o.compact ? 14 : 26), size = o.size || 22;
    S.mark(ctx, 'card', { x: x, y: y, w: w, h: h }, { p: p, variant: o.variant || 'accent-2', seed: o.seed || 41, blob: o.blob });
    var rows = [];
    var titleH = o.title ? (o.titleSize || 18) + 18 : 0;
    var top = y + pad + titleH, rh = (y + h - pad - top) / 6;
    for (var k = 0; k < 6; k++) rows.push({ x: x + pad, y: top + k * rh, w: w - pad * 2, h: rh });
    if (p < 0.45) return { rows: rows };
    var tp = E.segment(p, 0.45, 1);
    if (o.title) S.text(ctx, o.title, x + pad, y + pad + (o.titleSize || 18), { size: o.titleSize || 18, weight: 700, p: tp, maxWidth: w - pad * 2, maxLines: 1 });
    var labW = 0;
    if (!o.compact) labels.forEach(function (lb) { labW = Math.max(labW, S.measure(ctx, lb, size, 700)); });
    rows.forEach(function (r, i) {
      var q = o.q ? (o.q[i] == null ? tp : Math.min(tp, o.q[i])) : E.stagger(tp, i, 6, 0.6);
      if (q <= 0) return;
      var em = o.emph === i ? (o.emphQ == null ? 1 : o.emphQ) : 0;
      if (em > 0) S.fill(ctx, P.rect(r.x - 8, r.y + 2, r.w + 16, r.h - 4, 9), { role: o.emphRole || 'accent-2', p: Math.min(q, em), seed: 1040 + i });
      var cy = r.y + r.h / 2;
      S.fill(ctx, P.circle(r.x + 6, cy, o.compact ? 3.5 : 5, 12), { role: 'ink', offset: false, texture: false, p: q });
      if (!o.compact) {
        S.text(ctx, labels[i] || '', r.x + 22, cy + size * 0.36, { size: size, weight: 700, p: q });
        var lx = r.x + 22 + labW + 22, lw = (x + w - pad) - lx;
        if (lw > 24) S.stroke(ctx, [[lx, cy + 2], [lx + lw * (0.55 + 0.4 * ((i * 7) % 5) / 5) * E.out(q), cy + 2.5]], { weight: 'hair', taper: false, seed: 1050 + i });
      } else if (em > 0 && o.emphLabel) {
        S.text(ctx, o.emphLabel, r.x + 16, cy + (o.emphSize || 15) * 0.36, { size: o.emphSize || 15, weight: 700, p: Math.min(q, em), maxWidth: r.w - 18, maxLines: 1 });
      } else {
        S.stroke(ctx, [[r.x + 16, cy], [r.x + 16 + (r.w - 20) * (0.5 + 0.45 * ((i * 7) % 5) / 5) * E.out(q), cy + 0.5]], { weight: 'thin', taper: false, seed: 1060 + i });
      }
    });
    return { rows: rows };
  };

  // ------------------------------------------------------------------ bucle-mejora (content §2.5)
  // A loop of the first four steps («Primera versión», «Leer como revisor», «Diagnosticar la causa»,
  // «Ajustar y probar»), and the fifth, «Guardar la mejor versión», leaving the loop from the fourth's lower edge.
  // o = { cx, cy, rx, ry, start (angle of the first step; default: left, so the loop reads like a clock
  //       from nine o'clock and the fourth step sits at the bottom), labels (default §3.5),
  //       q: [4 step progresses], boxW, boxH, size, active, exit: { x, y, w, h, q, size } }.
  // Returns { boxes, exit }.
  R['bucle-mejora'] = function (ctx, o) {
    var labels = o.labels || rot('bucle-mejora');
    var rx = o.rx || 240, ry = o.ry || 170, bw = o.boxW || 230, bh = o.boxH || 70, size = o.size || 20;
    var start = o.start == null ? Math.PI : o.start;
    var boxes = [];
    for (var i = 0; i < 4; i++) {
      var a = start + i * Math.PI / 2;
      var cx = o.cx + Math.cos(a) * rx, cy = o.cy + Math.sin(a) * ry;
      boxes.push({ x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, cx: cx, cy: cy });
    }
    // the four steps sit at the four sides of the loop; each arrow runs outside it, from an edge of
    // one box to the facing edge of the next (vertical exit from a side box, horizontal from a top or
    // bottom box), so every arrowhead stays visible whatever the size of the boxes
    function exitPt(b, k) {
      var up = boxes[(k + 1) % 4].cy < b.cy, right = boxes[(k + 1) % 4].cx > b.cx;
      return k % 2 === 0 ? [b.cx, up ? b.y - 6 : b.y + b.h + 6] : [right ? b.x + b.w + 6 : b.x - 6, b.cy];
    }
    function entryPt(b, from, k) {
      return k % 2 === 0 ? [from.cx < b.cx ? b.x - 8 : b.x + b.w + 8, b.cy] : [b.cx, from.cy < b.cy ? b.y - 8 : b.y + b.h + 8];
    }
    for (var k = 0; k < 4; k++) {
      var qa = Math.min(qv(o, k), qv(o, (k + 1) % 4));
      if (qa <= 0) continue;
      var A = boxes[k], B = boxes[(k + 1) % 4];
      C.arrow(ctx, exitPt(A, k), entryPt(B, A, k), { p: qa, weight: 'regular', head: 12, curve: o.arrowCurve == null ? -34 : o.arrowCurve, seed: 1060 + k });
    }
    boxes.forEach(function (b, i) {
      var q = qv(o, i);
      if (q > 0) C.box(ctx, b, { label: labels[i] || '', p: q, size: size, role: o.active === i ? 'accent-2' : 'ground', weight: o.active === i ? 'bold' : 'regular', seed: 1065 + i });
    });
    var ex = o.exit;
    if (ex && (ex.q || 0) > 0) {
      var b3 = boxes[3];
      C.arrow(ctx, [b3.x + b3.w * 0.7, b3.y + b3.h + 6], [ex.x - 10, ex.y + ex.h * 0.7], { p: E.segment(ex.q, 0, 0.5), weight: 'regular', head: 13, curve: o.exitCurve == null ? 34 : o.exitCurve, seed: 1070 });
      C.box(ctx, { x: ex.x, y: ex.y, w: ex.w, h: ex.h }, { label: labels[4] || '', p: E.segment(ex.q, 0.3, 1), size: ex.size || size, role: 'accent-2', weight: 'bold', seed: 1071 });
    }
    return { boxes: boxes, exit: ex };
  };

  // ------------------------------------------------------------------ ciclo-token (content §2.1 figure)
  // Six steps in a cycle, laid out as a loop of two rows (1 → 2 → 3, down, 4 → 5 → 6) with the arrow
  // from step 6 back to step 2. o = { x, y, w, h, labels (default §3.5), q: [6 step progresses],
  // lit: [6 values 0→1], back (return arrow 0→1), gapX, gapY, size, content(i, inner, q, lit) }.
  // Returns { boxes }.
  R['ciclo-token'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w, h = o.h;
    var gx = o.gapX == null ? 46 : o.gapX, gy = o.gapY == null ? 64 : o.gapY;
    var bw = (w - 2 * gx) / 3, bh = (h - gy) / 2;
    var cols = [0, 1, 2, 2, 1, 0], rows = [0, 0, 0, 1, 1, 1];
    var labels = o.labels || rot('ciclo-token'), size = o.size || 19;
    var boxes = [];
    for (var i = 0; i < 6; i++) boxes.push({ x: x + cols[i] * (bw + gx), y: y + rows[i] * (bh + gy), w: bw, h: bh });
    for (var k = 0; k < 5; k++) {
      var qa = Math.min(qv(o, k), qv(o, k + 1));
      if (qa <= 0) continue;
      var A = boxes[k], B = boxes[k + 1], from, to;
      if (rows[k] === rows[k + 1]) {
        var dir = cols[k + 1] > cols[k] ? 1 : -1, yy = A.y + A.h / 2;
        from = [dir > 0 ? A.x + A.w + 5 : A.x - 5, yy]; to = [dir > 0 ? B.x - 7 : B.x + B.w + 7, yy];
      } else { from = [A.x + A.w / 2, A.y + A.h + 5]; to = [B.x + B.w / 2, B.y - 7]; }
      C.arrow(ctx, from, to, { p: qa, weight: o.arrowWeight || 'regular', head: o.head || 12, seed: 1100 + k });
    }
    var bq = o.back || 0;
    if (bq > 0) {
      var F = boxes[5], T = boxes[1];
      C.arrow(ctx, [F.x + F.w * 0.8, F.y - 6], [T.x + T.w * 0.2, T.y + T.h + 8], { p: bq, weight: o.arrowWeight || 'bold', head: o.head ? o.head + 2 : 15, curve: -22, role: o.backRole || 'accent-1', seed: 1110 });
    }
    boxes.forEach(function (b, i) {
      var q = qv(o, i);
      if (q <= 0) return;
      var lit = o.lit ? (o.lit[i] || 0) : 0;
      var a = S.appear('bloom', q);
      ctx.save(); ctx.globalAlpha *= a.alpha;
      var shape = P.rect(b.x, b.y, b.w, b.h, 14);
      S.fill(ctx, shape, { role: 'ground', offset: false, texture: false });
      if (lit > 0) S.fill(ctx, shape, { role: o.litRole || 'accent-2', alpha: 0.8 * lit, seed: 1120 + i });
      S.stroke(ctx, P.wobble(shape, 1130 + i, 1.1), { weight: lit > 0.5 ? 'bold' : (o.boxWeight || 'regular'), closed: true, taper: false, swell: 0.25, seed: 1130 + i, p: E.segment(q, 0, 0.8) });
      if (labels[i] && o.labels !== false) S.text(ctx, labels[i], b.x + 16, b.y + size + 12, { size: size, weight: 700, maxWidth: b.w - 32, maxLines: 1 });
      ctx.restore();
      if (o.content) o.content(i, { x: b.x + 16, y: b.y + size + 26, w: b.w - 32, h: b.h - size - 38 }, q, lit);
    });
    return { boxes: boxes };
  };
})(window.IAHI);

/* ======================================================================================================
   Course signs drawn first in V3 (built in parallel, kept as their own block)
   ====================================================================================================== */
/* Course signs of V3 · «Límites y potencialidades de la IA en la ciencia» (spec §3.5): escala-1-5,
   ficha-avance, formulario-consentimiento, viaje-datos, tabla-privacidad, danos-sesgo,
   auditoria-correspondencia and pilas-recursos, registered in C.signs and drawn through C.sign().
   Also V3's figure helpers (C.v3): the figure card of base §5.2 in the same design as the engine's
   card, with room for an exact chart or for the figure's parts as large numbers, a row layout for
   tables, and badges that wrap on narrow cards; plus exact horizontal bars with a compact axis.
   Built only from the style API; every label comes from the caller (scene texts, the figure bank or
   C.signLabels), never from this file. o.q is the list of beat progresses, as in the other signs. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;
  var R = C.signs = C.signs || {};
  var V3 = C.v3 = C.v3 || {};

  function q(o, i) { var a = o.q || []; return a[i] == null ? (o.p == null ? 1 : o.p) : a[i]; }
  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 12 : r); }
  function rot(id) { return (((NS.data.rotulos || {}).signs || {})[id]) || []; }
  function fig(id) { return (NS.data.figuresById || {})[id]; }
  function badges() { return NS.data.badges || {}; }

  // a path cut into dashes (on, off in px): a list of short strokes for S.stroke
  function dashes(pts, on, off) {
    var res = P.resample(pts, 2), out = [], cur = [], acc = 0, period = on + off;
    for (var i = 0; i < res.length; i++) {
      if (i > 0) acc += P.dist(res[i - 1], res[i]);
      if ((acc % period) < on) cur.push(res[i]);
      else if (cur.length) { if (cur.length > 1) out.push(cur); cur = []; }
    }
    if (cur.length > 1) out.push(cur);
    return out;
  }
  V3.dashes = dashes;

  // wrapped lines of a text at a size, as S.text would wrap them
  function wrap(ctx, text, size, weight, maxWidth) {
    if (!text) return [];
    ctx.save();
    ctx.font = (weight || 500) + ' ' + size + 'px ' + S.tokens.fonts.body;
    var out = NS.engine.captions.wrap(ctx, NS.util.nbsp(String(text)), maxWidth);
    ctx.restore();
    return out;
  }
  V3.wrap = wrap;

  // ------------------------------------------------------------------ badges and sources (spec §3.2)
  // The badge whose sign is `sign` (e.g. 'three-boxes' → «Esquema»): badge labels stay in data.
  V3.badgeName = function (sign) {
    var b = badges();
    for (var k in b) if (b[k] && b[k].sign === sign) return k;
    return '';
  };
  // «Con matiz» and «Revisar antes de clase» carry a badge; «Vigente» has none.
  function stateOf(f) { return badges()[f.estado] ? f.estado : ''; }
  function isReview(f) { var b = badges()[f.estado]; return !!(b && b.sign === 'calendar-cycle'); }
  V3.stateOf = stateOf;
  // «Fuente: …», plus the consultation date on «Revisar antes de clase» figures
  V3.sourceLine = function (f) {
    var line = NS.engine.cards.sourceLine(f);
    if (isReview(f)) line += ' · ' + ((NS.data.ui || {}).consultedShort || '');
    return line;
  };
  function badgeW(ctx, text, size) {
    return S.measure(ctx, text, size, 700) + (badges()[text] ? size * 1.3 : 0) + 24;
  }
  function drawBadge(ctx, text, x, y, size, p) {
    return S.mark(ctx, 'badge', { x: x, y: y, w: 600, h: 30 }, { text: text, size: size, sign: NS.engine.cards.typeSign(text), p: p });
  }
  // type badge and state badge, on one row when they fit in w, else on two rows
  function badgeRows(ctx, f, size, w) {
    var st = stateOf(f);
    var w1 = badgeW(ctx, f.tipo, size), w2 = st ? badgeW(ctx, st, size) : 0;
    var two = st && w1 + 8 + w2 > w;
    var bh = size + 14;
    return { st: st, w1: w1, w2: w2, two: !!two, h: two ? bh * 2 + 6 : bh, bh: bh };
  }
  function drawBadges(ctx, f, x, y, size, w, p) {
    var b = badgeRows(ctx, f, size, w);
    drawBadge(ctx, f.tipo, x, y, size, p);
    if (b.st) {
      if (b.two) drawBadge(ctx, b.st, x, y + b.bh + 6, size, p);
      else drawBadge(ctx, b.st, x + b.w1 + 8, y, size, p);
    }
    return b.h;
  }
  V3.drawBadges = drawBadges;

  // Value tiles of a card: rows of `cols` tiles. A short value keeps its large size in a tile just wide
  // enough for it (and its label); a long value gets the rest of the row and the largest size that fits
  // it, so one long value never shrinks the others. Returns { h, items: [{ x, y, w, h, size, rowSize }] }.
  function tileLayout(ctx, vals, w, cols, vSize, sSize) {
    var gap = 14, items = [], y = 0, minW = 150;
    for (var r0 = 0; r0 < vals.length; r0 += cols) {
      var row = vals.slice(r0, r0 + cols), total = w - (row.length - 1) * gap;
      var nat = row.map(function (pt) { return S.measure(ctx, NS.util.nbsp(pt.valor), vSize, 700) + 24; });
      var widths = nat.map(function (v) { return Math.max(v, minW); });
      var sum = widths.reduce(function (a, b) { return a + b; }, 0);
      if (sum <= total) {
        var extra = (total - sum) / row.length;
        widths = widths.map(function (v) { return v + extra; });
      } else {
        var fair = total / row.length, fixed = 0, longNat = 0;
        widths.forEach(function (v, i) { if (v <= fair) fixed += v; else longNat += nat[i]; });
        widths = widths.map(function (v, i) { return v <= fair ? v : (total - fixed) * nat[i] / longNat; });
      }
      var sizes = row.map(function (pt, i) { return Math.max(14, Math.min(vSize, Math.floor(vSize * (widths[i] - 24) / (nat[i] - 24)))); });
      var rowSize = Math.max.apply(null, sizes);
      var labL = Math.max.apply(null, row.map(function (pt, i) { return Math.max(1, wrap(ctx, pt.etiqueta, sSize, 600, widths[i] - 20).length); }));
      var h = rowSize * 1.12 + 8 + labL * sSize * 1.2 + 14;
      var x = 0;
      row.forEach(function (pt, i) { items.push({ x: x, y: y, w: widths[i], h: h, size: sizes[i], rowSize: rowSize }); x += widths[i] + gap; });
      y += h + 10;
    }
    return { h: y - 10, items: items };
  }

  // ------------------------------------------------------------------ figure card (base §5.2)
  // Same design as env.cards.figure (card mark, tema, figure, scope, type and state badges, source),
  // with extras: o.values (indices of partes shown as large numbers, each appearing crisp at once when
  // its o.valueQ[i] reaches 0.5), o.chart ({ h, draw(ctx, area, p) }: room for an exact chart),
  // o.text (a literal piece of the figure, e.g. the heading of a chart), o.tema (the line above the
  // figure, e.g. the field of an advance, from the scene's texts), o.scope (show the scope of a
  // «Vigente» figure), o.compact (no tema), o.ground / o.dashed (a visibly distinct card), o.blob
  // (false: no colored shape behind the corner, for dense layouts), o.foot ('bottom'), o.inlineFoot
  // (the source beside the badges). The figure text shrinks until everything fits; the scope never
  // goes under 15 px, badges stay at 15 px and the source at 15 px or more.
  // Returns { zone, size, overflow (px that did not fit: 0 when the card is complete) }.
  V3.card = function (ctx, id, box, o) {
    o = o || {};
    var f = fig(id);
    var out = { zone: [box.x, box.y, box.w, box.h] };
    if (!f) return out;
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return out;
    var frameP = E.segment(p, 0, 0.5);
    var accents = ['accent-1', 'accent-2', 'accent-3'];
    S.mark(ctx, 'card', box, { p: frameP, variant: o.variant || accents[NS.engine.hash(f.tema || id) % 3], seed: NS.engine.hash(id) % 50, ground: o.ground, blob: o.blob });
    if (o.dashed && frameP > 0) {
      // a second, dashed outline just inside the card: a projection is not an observation
      dashes(P.rect(box.x + 8, box.y + 8, box.w - 16, box.h - 16, 10), 12, 9).forEach(function (d, k) {
        S.stroke(ctx, d, { weight: 'thin', taper: false, swell: 0.1, p: frameP, seed: 600 + k });
      });
    }
    if (p < 0.5) return out;
    var pad = o.pad || (box.w > 300 ? 22 : 16);
    var x = box.x + pad, w = box.w - pad * 2;
    var main = o.text != null ? o.text : f.cifra;
    var st = stateOf(f);
    var scope = (st || o.scope) && f.alcance && o.scope !== false ? f.alcance : '';
    var line = V3.sourceLine(f);
    var vals = (o.values || []).map(function (k2) { return f.partes[k2]; }).filter(Boolean);
    var vcols = o.valueCols || vals.length || 1;
    var chartH = o.chart ? o.chart.h : 0;
    var tema = o.tema != null ? o.tema : (f.tema || '');
    var start = o.size || (box.w > 520 ? 25 : 22), minSize = o.minSize || 16;
    var L = null;
    for (var size = start; size >= minSize; size--) {
      var sSize = Math.max(15, Math.round(size * 0.74)), srcSize = Math.max(15, Math.round(size * 0.66)), temaSize = o.temaSize || Math.max(15, Math.round(size * 0.7));
      var bsize = 15;
      var temaH = o.compact ? 0 : temaSize * 1.25 + 8;
      var mainL = wrap(ctx, main, size, 700, w).length;
      var scopeL = wrap(ctx, scope, sSize, 500, w).length;
      var srcL = wrap(ctx, line, srcSize, 500, w).length;
      var br = badgeRows(ctx, f, bsize, w);
      var vSize = o.valueSize ? Math.min(o.valueSize, Math.round(size * 1.9)) : Math.round(size * 1.55);
      var tiles = vals.length ? tileLayout(ctx, vals, w, vcols, vSize, sSize) : null;
      var vH = tiles ? tiles.h : 0;
      var head = temaH + (mainL ? mainL * size * 1.22 + 8 : 0) + (vH ? vH + 10 : 0) + (chartH ? chartH + 8 : 0);
      // o.inlineFoot: the source sits beside the badges when there is room for it
      var inl = 0, inlW = 0;
      if (o.inlineFoot && !br.two) {
        inlW = w - (br.w1 + (br.st ? 8 + br.w2 : 0)) - 16;
        if (inlW >= w * 0.34) inl = wrap(ctx, line, srcSize, 500, inlW).length;
      }
      var footRow = inl ? Math.max(br.h, inl * srcSize * 1.2 + 4) : br.h + 8 + srcL * srcSize * 1.2;
      var foot = (scopeL ? scopeL * sSize * 1.2 + 8 : 0) + footRow;
      L = { size: size, sSize: sSize, srcSize: srcSize, temaSize: temaSize, bsize: bsize, temaH: temaH, tiles: tiles, vH: vH, head: head, foot: foot, inl: inl, inlW: inlW, br: br, need: pad + head + foot + pad - 4 };
      if (L.need <= box.h) break;
    }
    out.overflow = Math.max(0, Math.round(L.need - box.h));
    var y = box.y + pad;
    if (!o.compact) { S.text(ctx, tema, x, y + L.temaSize, { size: L.temaSize, weight: 700, role: o.temaRole || 'ink-soft', maxWidth: w, maxLines: 1 }); y += L.temaH; }
    if (main) {
      var t = S.text(ctx, main, x, y + L.size * 0.92, { size: L.size, weight: 700, maxWidth: w, lineHeight: 1.22 });
      y += t.height + 8;
    }
    if (vals.length) {
      var vq = o.valueQ || [];
      L.tiles.items.forEach(function (tl, i) {
        var pt = vals[i];
        var tq = vq[i] == null ? 1 : vq[i];
        if (tq <= 0) return;
        var tx = x + tl.x, ty = y + tl.y;
        // the tile blooms, then its number appears crisp and all at once (never counted up)
        S.fill(ctx, rect(tx, ty, tl.w, tl.h, 12), { role: 'ground-2', offset: false, texture: false, alpha: 0.75, p: E.segment(tq, 0, 0.5) });
        if (tq < 0.5) return;
        var above = o.valueLabel === 'above';
        // numbers of one row share a baseline; labels sit under (or over) them
        var ly = above ? ty + 8 + L.sSize : ty + 8 + tl.rowSize * 1.02 + 6 + L.sSize;
        var vy = above ? ty + tl.h - 12 : ty + 6 + tl.rowSize * 0.92;
        S.text(ctx, pt.valor, tx + 10, vy, { size: tl.size, weight: 700 });
        S.text(ctx, pt.etiqueta, tx + 10, ly, { size: L.sSize, weight: 600, role: 'ink-soft', maxWidth: tl.w - 20, lineHeight: 1.2 });
      });
      y += L.vH + 10;
    }
    if (o.chart) {
      out.chart = { x: x, y: y, w: w, h: chartH };
      // the chart draws its frame first, then its exact values, after the card's frame
      o.chart.draw(ctx, out.chart, o.chartQ == null ? E.segment(p, 0.5, 1) : o.chartQ);
      y += chartH + 8;
    }
    if (o.foot === 'bottom') y = Math.max(y, box.y + box.h - pad + 4 - L.foot);
    if (scope) {
      var sc = S.text(ctx, scope, x, y + L.sSize * 0.95, { size: L.sSize, weight: 500, role: 'ink-soft', maxWidth: w, lineHeight: 1.2 });
      y += sc.height + 8;
    }
    if (L.inl) {
      var bw0 = L.br.w1 + (L.br.st ? 8 + L.br.w2 : 0);
      drawBadges(ctx, f, x, y + Math.max(0, (L.inl * L.srcSize * 1.2 + 4 - L.br.h) / 2), L.bsize, w, 1);
      var sy0 = y + Math.max(0, (L.br.h - L.inl * L.srcSize * 1.2) / 2);
      S.text(ctx, line, x + bw0 + 16, sy0 + L.srcSize, { size: L.srcSize, weight: 500, role: 'ink-soft', maxWidth: L.inlW, lineHeight: 1.2 });
      out.bottom = y + Math.max(L.br.h, L.inl * L.srcSize * 1.2 + 4);
    } else {
      y += drawBadges(ctx, f, x, y, L.bsize, w, 1) + 8;
      S.text(ctx, line, x, y + L.srcSize, { size: L.srcSize, weight: 500, role: 'ink-soft', maxWidth: w, lineHeight: 1.2 });
      out.bottom = y + wrap(ctx, line, L.srcSize, 500, w).length * L.srcSize * 1.2;
    }
    out.size = L.size;
    return out;
  };

  // A figure card laid out as a table row: the figure and its scope on the left; the badges, the
  // source and the consultation date on the right. Same content as the card (base §5.2).
  V3.rowCard = function (ctx, id, box, o) {
    o = o || {};
    var f = fig(id);
    var out = { zone: [box.x, box.y, box.w, box.h] };
    if (!f) return out;
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return out;
    var accents = ['accent-1', 'accent-2', 'accent-3'];
    S.mark(ctx, 'card', box, { p: E.segment(p, 0, 0.5), variant: o.variant || accents[NS.engine.hash(id) % 3], seed: NS.engine.hash(id) % 50, blob: o.blob });
    if (p < 0.5) return out;
    var pad = o.pad || 18, gap = 24;
    var inner = box.w - pad * 2 - gap;
    var lw = Math.round(inner * (o.split || 0.62)), rw = inner - lw;
    var xl = box.x + pad, xr = xl + lw + gap;
    var st = stateOf(f);
    var scope = (st || o.scope) && f.alcance ? f.alcance : '';
    var line = V3.sourceLine(f);
    var L = null;
    for (var size = o.size || 21; size >= (o.minSize || 16); size--) {
      var sSize = Math.max(15, Math.round(size * 0.74)), srcSize = Math.max(15, Math.round(size * 0.68));
      var bsize = 15;
      var mainL = wrap(ctx, f.cifra, size, 700, lw).length, scopeL = wrap(ctx, scope, sSize, 500, lw).length;
      var leftH = mainL * size * 1.2 + (scopeL ? 8 + scopeL * sSize * 1.2 : 0);
      var bh = bsize + 14, nb = st ? 2 : 1;
      var srcL = wrap(ctx, line, srcSize, 500, rw).length;
      var rightH = nb * bh + (nb - 1) * 6 + 8 + srcL * srcSize * 1.2;
      L = { size: size, sSize: sSize, srcSize: srcSize, bsize: bsize, leftH: leftH, rightH: rightH, bh: bh };
      if (Math.max(leftH, rightH) + pad * 2 <= box.h) break;
    }
    out.overflow = Math.max(0, Math.round(Math.max(L.leftH, L.rightH) + pad * 2 - box.h));
    var yl = box.y + (box.h - L.leftH) / 2, yr = box.y + (box.h - L.rightH) / 2;
    var t = S.text(ctx, f.cifra, xl, yl + L.size * 0.9, { size: L.size, weight: 700, maxWidth: lw, lineHeight: 1.2 });
    if (scope) S.text(ctx, scope, xl, yl + t.height + 8 + L.sSize * 0.92, { size: L.sSize, weight: 500, role: 'ink-soft', maxWidth: lw, lineHeight: 1.2 });
    // a quiet calligraphic rule between the two blocks
    S.stroke(ctx, [[xr - gap / 2, box.y + 16], [xr - gap / 2 + 1, box.y + box.h - 16]], { weight: 'hair', taper: false, seed: 610 });
    drawBadge(ctx, f.tipo, xr, yr, L.bsize, 1);
    if (st) drawBadge(ctx, st, xr, yr + L.bh + 6, L.bsize, 1);
    var yy = yr + (st ? 2 : 1) * L.bh + (st ? 6 : 0) + 8;
    S.text(ctx, line, xr, yy + L.srcSize, { size: L.srcSize, weight: 500, role: 'ink-soft', maxWidth: rw, lineHeight: 1.2 });
    out.size = L.size;
    return out;
  };

  // ------------------------------------------------------------------ exact bars (base §5.1)
  // Horizontal bars in the engine's manner (charts.barsH): lengths computed exactly from the value on
  // one zero-based scale, outline wobble under 1 px, the exact figure as a label; the frame draws
  // first, then the values appear crisp. A value label that does not fit after its bar is set inside
  // the bar (on-dark); o.valueAbove sets each value above its bar instead, so bars can use the whole
  // width. A compact axis: ticks and tick values from the scene's scale; the unit at the start of the
  // tick row, or under the axis at its end (o.unitBelow). item.pattern ('stripes') and item.dashed
  // mark a projection, visibly distinct from an observation.
  // items: [{ label, value, valueText, role, pattern, dashed }];
  // o = { p, labelW, rowH, gap, labelSize, valueSize, tickSize, aw (bar span in px), valueRoom, axis,
  //       unitBelow, valueAbove }
  V3.bars = function (ctx, area, items, scale, o) {
    o = o || {};
    var ch = NS.engine.charts;
    var p = o.p == null ? 1 : o.p;
    var frameP = E.segment(p, 0, 0.45), valOn = p >= 0.5;
    var labelW = o.labelW == null ? 150 : o.labelW, rowH = o.rowH || 26, gap = o.gap == null ? 8 : o.gap, vs = o.valueSize || 19;
    var above = !!o.valueAbove, vh = above ? Math.round(vs * 1.25) : 0;
    var span = scale.to - scale.from;
    var x0 = area.x + labelW, aw = o.aw || (area.w - labelW - (o.valueRoom == null ? (above ? 4 : 90) : o.valueRoom));
    var ts = o.tickSize || 15, nSteps = Math.round(span / scale.step), every = 1;
    if (o.axis !== false) {
      // the last tick value stays inside the area; when tick values would touch, every other tick
      // is labeled (the tick marks stay at every step of the scale)
      var lastW = S.measure(ctx, NS.engine.charts.axisLabel(scale.to, scale), ts, 500);
      aw = Math.min(aw, area.w - labelW - lastW / 2 - 2);
      var widest = 0;
      for (var tv = scale.from; tv <= scale.to + 1e-9; tv += scale.step) widest = Math.max(widest, S.measure(ctx, NS.engine.charts.axisLabel(tv, scale), ts, 500));
      while (every < nSteps && aw / nSteps * every < widest + 12) every++;
    }
    var px = function (v) { return x0 + (v - scale.from) / span * aw; };
    var yy = area.y;
    items.forEach(function (it, i) {
      var by = yy + vh;
      if (it.label) S.text(ctx, it.label, x0 - 12, by + rowH * 0.7, { size: o.labelSize || 17, weight: 500, align: 'right', p: frameP, maxWidth: labelW - 14 });
      var bw = Math.max(0, px(it.value) - x0);
      if (frameP > 0 && bw > 0.5) {
        var shape = P.rect(x0, by, bw, rowH, 3);
        if (it.pattern) {
          ctx.save(); ctx.globalAlpha *= E.out(frameP);
          S.patternFill(ctx, it.pattern, { x: x0, y: by, w: bw, h: rowH }, { gap: 9, seed: 40 + i });
          ctx.restore();
        } else S.fill(ctx, shape, { role: it.role || 'accent-3', offset: false, seed: 30 + i, p: frameP, texture: true });
        if (it.dashed) {
          dashes(shape, 7, 5).forEach(function (d, k) { S.stroke(ctx, d, { weight: 'thin', taper: false, swell: 0.1, seed: 50 + k, p: frameP }); });
        } else S.stroke(ctx, P.wobble(shape, 30 + i, 0.9), { weight: 'thin', closed: true, taper: false, swell: 0.15, seed: 30 + i, p: frameP });
      }
      if (valOn) {
        var tw = S.measure(ctx, NS.util.nbsp(it.valueText), vs, 700);
        if (above) S.text(ctx, it.valueText, x0, yy + vs * 0.95, { size: vs, weight: 700 });
        else if (x0 + bw + 10 + tw <= area.x + area.w || bw < tw + 24 || it.pattern) S.text(ctx, it.valueText, x0 + bw + 10, by + rowH * 0.73, { size: vs, weight: 700 });
        else S.text(ctx, it.valueText, x0 + bw - 12, by + rowH * 0.73, { size: vs, weight: 700, align: 'right', role: 'on-dark' });
      }
      yy += vh + rowH + gap;
    });
    if (o.axis !== false) {
      var ay = yy - gap + 6;
      S.stroke(ctx, [[x0, ay], [x0 + aw, ay]], { weight: 'thin', taper: false, p: frameP, seed: 3 });
      for (var k2 = 0; k2 <= nSteps; k2++) {
        var v = scale.from + k2 * scale.step, tx = px(v);
        S.stroke(ctx, [[tx, ay], [tx, ay + 6]], { weight: 'hair', taper: false, p: frameP });
        if (k2 % every === 0) S.text(ctx, ch.axisLabel(v, scale), tx, ay + 23, { size: ts, align: 'center', role: 'ink-soft', p: frameP });
      }
      if (scale.unit) {
        if (o.unitBelow) S.text(ctx, scale.unit, x0 + aw, ay + 43, { size: ts, align: 'right', role: 'ink-soft', p: frameP });
        else S.text(ctx, scale.unit, x0 - 26, ay + 23, { size: ts, align: 'right', role: 'ink-soft', p: frameP });
      }
    } else {
      // the zero line all bars start from
      S.stroke(ctx, [[x0, area.y + vh - 6], [x0, yy - gap + 6]], { weight: 'thin', taper: false, p: frameP, seed: 4 });
    }
    return { px: px, x0: x0, aw: aw, height: V3.barsHeight(items.length, o) };
  };
  V3.barsHeight = function (n, o) {
    o = o || {};
    var gap = o.gap == null ? 8 : o.gap, vh = o.valueAbove ? Math.round((o.valueSize || 19) * 1.25) : 0;
    return n * (vh + (o.rowH || 26) + gap) - gap + (o.axis === false ? 8 : (o.unitBelow ? 52 : 34));
  };
  // bank partes → chart items (labels and exact values from the bank)
  V3.items = function (id, role) {
    var f = fig(id);
    if (!f) return [];
    return f.partes.map(function (pt) { return { label: pt.etiqueta, value: NS.engine.charts.parseValue(pt.valor), valueText: pt.valor, role: role || 'accent-3' }; });
  };

  // ------------------------------------------------------------------ escala-1-5 (Sesión 3 · Agenda)
  // a horizontal scale of five steps from «estrecha» to «amplía»; small empty markers can drop onto it.
  // o = { x, y (line), w, labels [estrecha, amplía], p, steps, r, markers: [{ k (step), from [x, y], q }],
  //       labelSize }
  R['escala-1-5'] = function (ctx, o) {
    var L = o.labels || rot('escala-1-5');
    var n = o.steps || 5, x = o.x, y = o.y, w = o.w, rr = o.r || 18;
    var p = o.p == null ? 1 : o.p;
    var px = function (k) { return x + k * w / (n - 1); };
    var out = { px: px, y: y, r: rr, markers: [] };
    if (p > 0) {
      var line = [];
      for (var xx = x - 40; xx <= x + w + 40; xx += 12) line.push([xx, y + Math.sin(xx * 0.013) * 2]);
      S.stroke(ctx, line, { weight: 'bold', p: E.segment(p, 0, 0.6), seed: 501, dot: true });
      var fills = ['accent-5', 'ground', 'ground', 'ground', 'accent-2'];
      for (var k = 0; k < n; k++) {
        var kq = E.segment(p, 0.25 + k * 0.1, 0.5 + k * 0.1);
        if (kq <= 0) continue;
        S.shape(ctx, P.circle(px(k), y, rr, 30), { role: fills[k] || 'ground', p: kq, seed: 510 + k, weight: 'regular', texture: false });
      }
      var lq = E.segment(p, 0.6, 1), ls = o.labelSize || 26;
      if (lq > 0) {
        var lx = px(0), rx2 = px(n - 1);
        if (o.labelSide) {
          // labels beside the ends of the line
          S.text(ctx, L[0] || '', lx - 58, y + ls * 0.35, { size: ls, weight: 700, align: 'right', p: lq });
          S.text(ctx, L[1] || '', rx2 + 58, y + ls * 0.35, { size: ls, weight: 700, p: lq });
        } else {
          // labels under the end steps; «estrecha»: lines that converge, «amplía»: lines that open
          var sy = y + rr + 22 + ls;
          S.text(ctx, L[0] || '', lx, sy, { size: ls, weight: 700, align: 'center', p: lq });
          S.text(ctx, L[1] || '', rx2, sy, { size: ls, weight: 700, align: 'center', p: lq });
          [-1, 1].forEach(function (sg) {
            S.stroke(ctx, [[lx - 70 - 26, y + sg * 16], [lx - 70, y + sg * 4]], { weight: 'thin', taper: false, p: lq, seed: 520 + sg });
            S.stroke(ctx, [[rx2 + 70, y + sg * 4], [rx2 + 70 + 26, y + sg * 16]], { weight: 'thin', taper: false, p: lq, seed: 523 + sg });
          });
        }
      }
    }
    // markers: empty rings that fall from their tile and stack above their step
    var stack = {};
    (o.markers || []).forEach(function (m, i) {
      var level = stack[m.k] || 0;
      stack[m.k] = level + 1;
      var tx = px(m.k), ty = y - rr - 16 - level * 24;
      out.markers.push([tx, ty]);
      var mq = m.q == null ? 1 : m.q;
      if (mq <= 0) return;
      var u = E.inOut(E.clamp(mq / 0.85, 0, 1));
      var bounce = mq > 0.85 ? Math.sin((mq - 0.85) / 0.15 * Math.PI) * 5 : 0;
      var from = m.from || [tx, ty - 200];
      var cx = E.lerp(from[0], tx, u), cy = E.lerp(from[1], ty, u) - bounce;
      S.fill(ctx, P.circle(cx, cy, 9, 18), { role: 'ground', offset: false, texture: false });
      S.stroke(ctx, P.circle(cx, cy, 9, 18), { weight: 'regular', closed: true, taper: false, seed: 530 + i });
    });
    return out;
  };

  // ------------------------------------------------------------------ ficha-avance (content §3.2 table)
  // a card split in two: «Cifra clave» (figure cards, drawn by the caller in the returned box) and
  // «Límite» (short texts). o = { x, y, w, h, title, labels [cifra clave, límite], split: 'v' (top /
  // bottom) or 'h' (left | right), ratio (share of «Cifra clave»), limits: [text…], limitQ: [q…],
  // limitSize, limitW, limitInline (the limit text on the label row, after «Límite», so a figure card
  // can take the whole limit half), p, seed, titleSize, titleH, labH, pad }. Returns { cifra, limite }.
  R['ficha-avance'] = function (ctx, o) {
    var L = o.labels || rot('ficha-avance');
    var p = o.p == null ? 1 : o.p;
    var x = o.x, y = o.y, w = o.w, h = o.h, seed = o.seed || 700;
    var titleH = o.title ? (o.titleH || 54) : 12;
    var pad = o.pad || 16, labH = o.labH || 30;
    var by = y + titleH, bh = h - titleH;
    var split = o.split || 'h', ratio = o.ratio || 0.6;
    var cifra, limite, div;
    if (split === 'h') {
      var cw = Math.round((w - pad * 3) * ratio);
      cifra = { x: x + pad, y: by + labH, w: cw, h: bh - labH - pad };
      limite = { x: x + pad * 2 + cw, y: by + labH, w: w - pad * 3 - cw, h: bh - labH - pad };
      div = [[x + pad * 1.5 + cw, by + 8], [x + pad * 1.5 + cw + 2, y + h - 14]];
    } else {
      var chh = Math.round((bh - labH * 2 - pad * 2) * ratio);
      cifra = { x: x + pad, y: by + labH, w: w - pad * 2, h: chh };
      limite = { x: x + pad, y: by + labH * 2 + chh + pad, w: w - pad * 2, h: bh - labH * 2 - chh - pad * 2 };
      div = [[x + 12, by + labH + chh + pad * 0.6], [x + w - 12, by + labH + chh + pad * 0.6 + 2]];
    }
    var out = { cifra: cifra, limite: limite };
    if (p <= 0) return out;
    // the index card: an ochre wash with a calligraphic outline, a title on top, a divider between halves
    S.shape(ctx, rect(x, y, w, h, 20), { role: 'ground-2', p: E.segment(p, 0, 0.5), seed: seed, weight: 'bold', fillAlpha: 0.6, wobbleAmp: 1.2 });
    if (o.title) S.title(ctx, o.title, { x: x + 22, y: y + 40, size: o.titleSize || 32, p: E.segment(p, 0.2, 0.7), seed: seed + 1, underline: false });
    if (o.title) S.stroke(ctx, [[x + 14, y + titleH - 4], [x + w - 14, y + titleH - 2]], { weight: 'thin', taper: false, p: E.segment(p, 0.2, 0.6), seed: seed + 2 });
    S.stroke(ctx, div, { weight: 'regular', p: E.segment(p, 0.3, 0.8), seed: seed + 3, dot: true });
    var lp = E.segment(p, 0.4, 0.8);
    S.text(ctx, L[0] || '', cifra.x + 4, cifra.y - 9, { size: 17, weight: 700, role: 'ink-soft', p: lp });
    S.text(ctx, L[1] || '', limite.x + 4, limite.y - 9, { size: 17, weight: 700, role: 'ink-soft', p: lp });
    if (o.limitInline) {
      // the limit on the label row: «Límite» followed by the short text, with a margin bracket
      var lx0 = limite.x + 4 + S.measure(ctx, L[1] || '', 17, 700) + 18, ls0 = o.limitSize || 22;
      (o.limits || []).forEach(function (txt, i) {
        var lq0 = o.limitQ && o.limitQ[i] != null ? o.limitQ[i] : 1;
        if (lq0 <= 0) return;
        S.stroke(ctx, [[lx0 + 6, limite.y - 30], [lx0 + 2, limite.y - 17], [lx0 + 6, limite.y - 4]], { weight: 'regular', taper: false, p: lq0, seed: seed + 10 + i });
        S.fill(ctx, P.circle(lx0 + 2, limite.y - 17, 3.5, 10), { role: 'accent-1', offset: false, texture: false, p: lq0 });
        S.text(ctx, txt, lx0 + 18, limite.y - 9, { size: ls0, weight: 700, p: lq0 });
        lx0 += S.measure(ctx, txt, ls0, 700) + 40;
      });
      out.limitBottom = limite.y;
      return out;
    }
    // limits: short texts, each behind a small margin bracket, appearing in turn
    var ty = limite.y + 6, ls = o.limitSize || 23, lw = (o.limitW || limite.w) - 34;
    (o.limits || []).forEach(function (txt, i) {
      var lq = o.limitQ && o.limitQ[i] != null ? o.limitQ[i] : 1;
      var lines = wrap(ctx, txt, ls, 700, lw).length;
      var hh = lines * ls * 1.22;
      if (lq > 0) {
        S.stroke(ctx, [[limite.x + 6, ty + 2], [limite.x + 2, ty + hh / 2], [limite.x + 6, ty + hh + 2]], { weight: 'regular', taper: false, p: lq, seed: seed + 10 + i });
        S.fill(ctx, P.circle(limite.x + 2, ty + hh / 2, 3.5, 10), { role: 'accent-1', offset: false, texture: false, p: lq });
        S.text(ctx, txt, limite.x + 22, ty + ls * 0.95, { size: ls, weight: 700, maxWidth: lw, lineHeight: 1.22, p: lq });
      }
      ty += hh + 18;
    });
    out.limitBottom = ty;
    return out;
  };

  // ------------------------------------------------------------------ formulario-consentimiento (Anexos B9)
  // a form with a clause and the boxes «Autorizo» and «No autorizo»; o = { x, y, w, h, title (clause
  // title), labels [autorizo, no autorizo], emph (0→1: the boxes are emphasized), labelQ (0→1: the box
  // labels, e.g. hidden while the form is drawn too small to read them), p, lines, seed }
  R['formulario-consentimiento'] = function (ctx, o) {
    var L = o.labels || rot('formulario-consentimiento');
    var p = o.p == null ? 1 : o.p;
    var x = o.x, y = o.y, w = o.w || 300, h = o.h || 380, seed = o.seed || 720;
    if (p <= 0) return {};
    S.shape(ctx, rect(x, y, w, h, 8), { role: 'ground', p: E.segment(p, 0, 0.6), seed: seed, weight: 'regular', offset: false, texture: false });
    var ty = y + 26;
    if (o.title) {
      var t = S.text(ctx, o.title, x + 22, y + 38, { size: o.titleSize || 19, weight: 700, maxWidth: w - 44, lineHeight: 1.18, p: E.segment(p, 0.3, 0.8), maxLines: 3 });
      ty = y + 38 + t.height;
    } else {
      S.stroke(ctx, [[x + 22, y + 34], [x + w * 0.62, y + 34]], { weight: 'bold', taper: false, p: E.segment(p, 0.3, 0.8), seed: seed + 1 });
      ty = y + 56;
    }
    var nl = o.lines || 5, boxTop = y + h - 112;
    var gapL = Math.min(26, (boxTop - ty - 10) / nl);
    for (var i = 0; i < nl; i++) {
      var ly = ty + 10 + i * gapL;
      S.stroke(ctx, [[x + 22, ly], [x + w - (i === nl - 1 ? w * 0.42 : 22), ly + 1]], { weight: 'hair', taper: false, p: E.segment(p, 0.4, 1), seed: seed + 2 + i });
    }
    var em = o.emph || 0, boxes = [];
    [0, 1].forEach(function (k) {
      var bx = x + 24, byy = y + h - 96 + k * 44;
      boxes.push({ x: bx, y: byy, w: 26, h: 26 });
      if (em > 0) S.fill(ctx, P.blob(bx + 70, byy + 13, Math.min(w * 0.42, 120), 22, seed + 10 + k, 4, 0.12), { role: 'accent-2', p: em, seed: seed + 12 + k, alpha: 0.9 });
      S.stroke(ctx, rect(bx, byy, 26, 26, 4), { weight: em > 0.5 ? 'bold' : 'thin', closed: true, taper: false, p: E.segment(p, 0.5, 1), seed: seed + 14 + k });
      S.text(ctx, L[k] || '', bx + 40, byy + 20, { size: o.boxSize || 19, weight: 700, p: E.segment(p, 0.5, 1) * (o.labelQ == null ? 1 : o.labelQ) });
    });
    return { boxes: boxes };
  };

  // ------------------------------------------------------------------ viaje-datos (content §3.1, §3.5)
  // a document card traveling along a cable from a laptop to a far server shelf, with the label of the
  // jurisdiction; o = { from [x, y] (laptop base), to [x, y] (shelf center), label, travel (0→1), p,
  // t, laptopW, shelfW, shelfH, labelBelow }
  R['viaje-datos'] = function (ctx, o) {
    var lab = o.label != null ? o.label : rot('viaje-datos')[0];
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return {};
    var lw = o.laptopW || 150, sw = o.shelfW || 200, sh = o.shelfH || 112;
    C.prop(ctx, 'laptop', { x: o.from[0], y: o.from[1], w: lw, p: E.segment(p, 0, 0.5), seed: 730 });
    var ap = E.segment(p, 0.25, 0.8);
    if (ap > 0) {
      ctx.save(); ctx.globalAlpha *= E.out(ap);
      C.lamp(ctx, 'centro-datos', { x: o.to[0], y: o.to[1], w: sw, h: sh, rows: 2, cols: 4, p: 1, t: o.t });
      ctx.restore();
    }
    var start = [o.from[0] + lw * 0.52, o.from[1] - lw * 0.2], end = [o.to[0], o.to[1] + sh / 2];
    var pts = S.machine(ctx, 'cable', { from: start, to: end, elbow: o.to[0], p: E.segment(p, 0.3, 0.9), w: 2 });
    var ly = o.labelBelow ? o.to[1] + sh / 2 + 30 : o.to[1] - sh / 2 - 14;
    S.text(ctx, lab, o.to[0], ly, { size: o.labelSize || 19, weight: 700, align: 'center', p: E.segment(p, 0.6, 1), maxWidth: sw + 120 });
    var tr = o.travel == null ? -1 : o.travel;
    if (tr >= 0 && pts) {
      var Ltot = 0, segs = [];
      for (var i = 1; i < pts.length; i++) { var d = P.dist(pts[i - 1], pts[i]); segs.push(d); Ltot += d; }
      var at = Ltot * E.clamp(tr, 0, 1), acc = 0, pos = pts[0];
      for (var k = 1; k < pts.length; k++) {
        if (acc + segs[k - 1] >= at) { var u = (at - acc) / Math.max(1e-6, segs[k - 1]); pos = [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * u, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * u]; break; }
        acc += segs[k - 1]; pos = pts[k];
      }
      V3.interviewCard(ctx, pos[0], pos[1] - 26, 1, { p: E.segment(tr, 0, 0.08) });
    }
    return { cable: pts, shelf: { x: o.to[0] - sw / 2, y: o.to[1] - sh / 2, w: sw, h: sh } };
  };
  // an interview card (human manner): a small page with a speech bubble and a few lines
  V3.interviewCard = function (ctx, cx, cy, s, o) {
    o = o || {};
    var w = 54 * s, h = 40 * s, x = cx - w / 2, y = cy - h / 2;
    var a = S.appear('pop', o.p == null ? 1 : o.p);
    if (a.alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= a.alpha;
    ctx.translate(cx, cy); ctx.scale(a.scale, a.scale); ctx.translate(-cx, -cy);
    S.shape(ctx, rect(x, y, w, h, 5), { role: 'ground', seed: 740, weight: 'thin', offset: false, texture: false });
    S.stroke(ctx, P.ellipse(x + w * 0.27, y + h * 0.38, w * 0.15, h * 0.18, 16), { weight: 'hair', closed: true, taper: false, seed: 741 });
    S.stroke(ctx, [[x + w * 0.2, y + h * 0.52], [x + w * 0.16, y + h * 0.68], [x + w * 0.3, y + h * 0.54]], { weight: 'hair', taper: false, seed: 742 });
    for (var i = 0; i < 3; i++) S.stroke(ctx, [[x + w * 0.5, y + h * (0.3 + i * 0.2)], [x + w * (i === 2 ? 0.72 : 0.86), y + h * (0.3 + i * 0.2)]], { weight: 'hair', taper: false, seed: 743 + i });
    ctx.restore();
  };

  // ------------------------------------------------------------------ tabla-privacidad (content §3.1 table)
  // three rows («ChatGPT», «Claude», «Gemini»), each with the question «¿Se usan las conversaciones para
  // entrenar?» (the header of the answer column) and its answer card from the bank, plus a privacy
  // switch; o = { x, y, w, names [3], question, figs [3], switchLabel, nameW, headH, headX (x of the
  // question, default: over the answer column), rowH, gap, q: [row…], headQ, size, split }
  R['tabla-privacidad'] = function (ctx, o) {
    var L = rot('tabla-privacidad');
    var names = o.names || L.slice(0, 3), question = o.question != null ? o.question : L[3];
    var x = o.x, y = o.y, w = o.w, nameW = o.nameW || 250, headH = o.headH || 44, rowH = o.rowH || 150, gap = o.gap == null ? 12 : o.gap;
    var hq = o.headQ == null ? 1 : o.headQ;
    if (hq > 0) {
      var hx = o.headX == null ? x + nameW + 6 : o.headX;
      S.stroke(ctx, P.ellipse(hx + 14, y + 16, 15, 11, 20), { weight: 'thin', closed: true, taper: false, p: hq, seed: 750 });
      S.stroke(ctx, [[hx + 6, y + 25], [hx + 2, y + 35], [hx + 13, y + 27]], { weight: 'thin', taper: false, p: hq, seed: 751 });
      S.text(ctx, question, hx + 40, y + 24, { size: o.questionSize || 23, weight: 700, p: hq, maxWidth: x + w - hx - 50 });
    }
    var rows = [];
    for (var i = 0; i < 3; i++) {
      var ry = y + headH + i * (rowH + gap), rq = q(o, i);
      var card = { x: x + nameW, y: ry, w: w - nameW, h: rowH };
      rows.push(card);
      if (rq <= 0) continue;
      var a = S.appear('rise', E.segment(rq, 0, 0.5));
      ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(0, a.dy);
      S.text(ctx, names[i] || '', x + 4, ry + 40, { size: 27, weight: 700 });
      // a privacy switch: a pill with its knob, labeled «Configuración de privacidad»
      var sx = x + 6, sy = ry + 66;
      S.shape(ctx, rect(sx, sy, 52, 28, 14), { role: 'accent-5', seed: 752 + i, weight: 'regular', offset: false, texture: false });
      S.fill(ctx, P.circle(sx + 15, sy + 14, 9.5, 18), { role: 'ground', offset: false, texture: false });
      S.stroke(ctx, P.circle(sx + 15, sy + 14, 9.5, 18), { weight: 'thin', closed: true, taper: false, seed: 755 + i });
      if (o.switchLabel) S.text(ctx, o.switchLabel, sx + 64, sy + 12, { size: 16, weight: 700, maxWidth: nameW - 84, lineHeight: 1.15, maxLines: 2 });
      ctx.restore();
      // only the first row keeps the card's corner shape: the others would cover the row above
      V3.rowCard(ctx, o.figs[i], card, { p: E.segment(rq, 0.2, 1), split: o.split, size: o.size, blob: i === 0 ? undefined : false });
    }
    return { rows: rows };
  };

  // ------------------------------------------------------------------ danos-sesgo (content §3.3)
  // two panels: «Daños de representación» (a stereotype card: varied people pressed into one repeated
  // face; an invisibility card: one person missing from the group) and «Daños de asignación» (a
  // resource card handed to one group and withheld from another). o = { x, y, w, h, labels [2],
  // resources [3], q: [panel 1, panel 2], t, gap }
  R['danos-sesgo'] = function (ctx, o) {
    var L = o.labels || rot('danos-sesgo');
    var gap = o.gap || 30, pw = (o.w - gap) / 2, h = o.h, t = o.t || 0;
    var b1 = { x: o.x, y: o.y, w: pw, h: h }, b2 = { x: o.x + pw + gap, y: o.y, w: pw, h: h };
    var q1 = q(o, 0), q2 = q(o, 1);
    function panel(b, title, pq, seed) {
      C.box(ctx, b, { p: E.segment(pq, 0, 0.35), role: 'ground', weight: 'bold', seed: seed });
      S.text(ctx, title, b.x + 22, b.y + 38, { size: 24, weight: 700, p: E.segment(pq, 0.1, 0.4), maxWidth: b.w - 44, maxLines: 1 });
    }
    function tiles(x, y, n, tw, th, looks, qq, seed, missing) {
      for (var i = 0; i < n; i++) {
        var tq = E.segment(qq, i * 0.12, 0.5 + i * 0.12);
        if (tq <= 0) continue;
        var tx = x + i * (tw + 8);
        if (missing === i) {
          // the missing person: an empty tile with a dashed outline
          dashes(P.rect(tx, y, tw, th, 8), 8, 7).forEach(function (d, k) {
            S.stroke(ctx, d, { weight: 'thin', taper: false, swell: 0.1, p: tq, role: 'ink-soft', seed: seed + 40 + k });
          });
          continue;
        }
        C.prop(ctx, 'tile', { x: tx, y: y, w: tw, h: th, p: tq, person: looks[i], t: t, seed: seed + i });
      }
    }
    var out = { b1: b1, b2: b2 };
    if (q1 > 0) {
      panel(b1, L[0] || '', q1, 760);
      var cq = E.segment(q1, 0.25, 0.75), iq = E.segment(q1, 0.5, 1);
      var cw = (pw - 66) / 2, ch = h - 86, cy = b1.y + 62;
      // stereotype: three different people → the same face three times
      if (cq > 0) {
        var c1 = { x: b1.x + 22, y: cy, w: cw, h: ch };
        S.shape(ctx, rect(c1.x, c1.y, c1.w, c1.h, 12), { role: 'ground-2', p: cq, seed: 761, weight: 'regular', fillAlpha: 0.7 });
        var tw = (cw - 40) / 3, th = Math.min(tw * 0.9, (ch - 46) / 2);
        var varied = [S.extraLook(311), S.extraLook(127), S.extraLook(905)];
        var same = [S.extraLook(127), S.extraLook(127), S.extraLook(127)];
        tiles(c1.x + 12, c1.y + 12, 3, tw, th, varied, cq, 770);
        C.arrow(ctx, [c1.x + cw / 2, c1.y + 18 + th], [c1.x + cw / 2, c1.y + 30 + th + 12], { p: E.segment(cq, 0.4, 0.7), weight: 'thin', head: 8, seed: 775 });
        tiles(c1.x + 12, c1.y + ch - 12 - th, 3, tw, th, same, E.segment(cq, 0.55, 1), 780);
      }
      // invisibility: a group where one person does not appear
      if (iq > 0) {
        var c2 = { x: b1.x + 44 + cw, y: cy, w: cw, h: ch };
        S.shape(ctx, rect(c2.x, c2.y, c2.w, c2.h, 12), { role: 'ground-2', p: iq, seed: 762, weight: 'regular', fillAlpha: 0.7 });
        var tw2 = (cw - 32) / 2, th2 = Math.min(tw2 * 0.78, (ch - 36) / 2);
        var looks2 = [S.extraLook(442), S.extraLook(513), S.extraLook(77), S.extraLook(268)];
        tiles(c2.x + 12, c2.y + 12, 2, tw2, th2, looks2, iq, 790);
        tiles(c2.x + 12, c2.y + 24 + th2, 2, tw2, th2, looks2.slice(2), E.segment(iq, 0.2, 1), 795, 1);
      }
    }
    if (q2 > 0) {
      panel(b2, L[1] || '', q2, 800);
      var rq = E.segment(q2, 0.2, 0.6);
      var res = o.resources || [];
      var rc = { x: b2.x + 22, y: b2.y + 62, w: Math.min(220, pw * 0.4), h: h - 86 };
      if (rq > 0) {
        C.box(ctx, rc, { p: rq, role: 'accent-2', weight: 'regular', seed: 805 });
        res.forEach(function (lab, i) {
          var yy = rc.y + 22 + i * ((rc.h - 30) / Math.max(1, res.length));
          S.fill(ctx, P.circle(rc.x + 20, yy + 12, 5, 12), { role: 'ink', offset: false, texture: false, p: rq });
          S.text(ctx, lab, rc.x + 34, yy + 19, { size: 20, weight: 700, p: rq, maxWidth: rc.w - 44 });
        });
      }
      // two groups: the card reaches the first and is stopped before the second
      var gx = rc.x + rc.w + 70, gw = b2.x + pw - 22 - gx, th3 = Math.min(64, (h - 110) / 2.4), tw3 = Math.min(84, (gw - 8) / 2);
      var gy1 = b2.y + 64, gy2 = b2.y + h - 22 - th3;
      var gq = E.segment(q2, 0.35, 0.75);
      tiles(gx, gy1, 2, tw3, th3, [S.extraLook(631), S.extraLook(212)], gq, 810);
      tiles(gx, gy2, 2, tw3, th3, [S.extraLook(358), S.extraLook(819)], gq, 815);
      var aq = E.segment(q2, 0.6, 0.85), sq = E.segment(q2, 0.75, 1);
      C.arrow(ctx, [rc.x + rc.w + 8, rc.y + rc.h * 0.3], [gx - 10, gy1 + th3 / 2], { p: aq, weight: 'regular', head: 12, curve: -10, seed: 820 });
      if (sq > 0) {
        var ax = rc.x + rc.w + 8, ay = rc.y + rc.h * 0.72, mx = (ax + gx) / 2, my = (ay + gy2 + th3 / 2) / 2;
        C.arrow(ctx, [ax, ay], [mx - 6, my], { p: sq, weight: 'regular', head: false, seed: 821 });
        S.stroke(ctx, [[mx + 2, my - 24], [mx + 6, my + 24]], { weight: 'heavy', taper: false, p: sq, seed: 822 });
        C.cross(ctx, mx + 30, my, 16, { p: E.segment(sq, 0.5, 1), weight: 'regular' });
      }
    }
    return out;
  };

  // ------------------------------------------------------------------ auditoria-correspondencia (content §3.3)
  // two prompt cards identical except one highlighted attribute, each run three times in two models,
  // feeding rows of a shared sheet with a «Promedio por versión» row and no values; badge «Esquema».
  // o = { x, y, w, h, attrs [3], hi (index of the highlighted attribute), heads [4], avg, badge,
  //       q: [prompt cards, runs, sheet], t, nRows }
  R['auditoria-correspondencia'] = function (ctx, o) {
    var Lr = rot('auditoria-correspondencia');
    var x = o.x, y = o.y, w = o.w, h = o.h, t = o.t || 0;
    var q0 = q(o, 0), q1 = q(o, 1), q2 = q(o, 2);
    var cardW = o.cardW || 360, cardH = (h - 30) / 2;
    var attrs = o.attrs || [], hi = o.hi == null ? 0 : o.hi;
    var out = { cards: [], lamps: [] };
    // the two prompt cards: the same ruled text with the three attribute slots; one slot highlighted
    [0, 1].forEach(function (k) {
      var cq = E.segment(q0, k * 0.2, 0.5 + k * 0.2);
      var cb = { x: x, y: y + k * (cardH + 30), w: cardW, h: cardH };
      out.cards.push(cb);
      if (cq <= 0) return;
      C.box(ctx, cb, { p: cq, role: 'ground', weight: 'regular', seed: 830 + k });
      if (cq < 0.5) return;
      var rowsY = [cb.y + 34, cb.y + cardH / 2 + 4, cb.y + cardH - 30];
      attrs.forEach(function (lab, i) {
        var cw = S.measure(ctx, lab, 17, 700) + 22;
        var cx = i === 1 ? cb.x + cb.w - 20 - cw : cb.x + 20;
        var yy = rowsY[i];
        var on = i === hi;
        S.fill(ctx, rect(cx, yy - 17, cw, 32, 16), { role: on ? 'accent-2' : 'ground-2', offset: false, texture: false, alpha: on ? 1 : 0.8 });
        S.stroke(ctx, rect(cx, yy - 17, cw, 32, 16), { weight: on ? 'regular' : 'hair', closed: true, taper: false, seed: 840 + i });
        S.text(ctx, lab, cx + 11, yy + 5, { size: 17, weight: 700 });
        // the ruled text around the slot
        var l1 = i === 1 ? cb.x + 20 : cx + cw + 12, l2 = i === 1 ? cx - 12 : cb.x + cb.w - 20;
        if (l2 - l1 > 20) S.stroke(ctx, [[l1, yy + 1], [l2, yy + 2]], { weight: 'hair', taper: false, seed: 845 + i + k * 3 });
      });
    });
    // two small lamps (two models); each card runs three times in each (three dots on each run line)
    var lx = x + cardW + 120, ly = [y + h * 0.25, y + h * 0.75];
    var sheetX = lx + 110, sheetW = x + w - sheetX;
    ly.forEach(function (yy, m) {
      var lq = E.segment(q1, m * 0.1, 0.3 + m * 0.1);
      if (lq <= 0) return;
      C.lamp(ctx, 'lampara', { x: lx, y: yy, r: 34, p: lq, t: t });
      out.lamps.push([lx, yy]);
      out.cards.forEach(function (cb, k) {
        var rq = E.segment(q1, 0.15 + k * 0.1 + m * 0.05, 0.45 + k * 0.1 + m * 0.05);
        if (rq <= 0) return;
        var a = [cb.x + cb.w + 8, cb.y + cb.h / 2 + (m - 0.5) * 18], b = [lx - 40, yy + (k - 0.5) * 14];
        C.arrow(ctx, a, b, { p: rq, weight: 'thin', head: 8, seed: 850 + k * 2 + m });
        // three runs of each version in each model: three dots on the arrow, near its start
        if (rq >= 1) for (var d = 0; d < 3; d++) {
          var u = 0.1 + d * 0.075, dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.sqrt(dx * dx + dy * dy) || 1;
          S.fill(ctx, P.circle(a[0] + dx * u + dy / dl * 8, a[1] + dy * u - dx / dl * 8, 3.2, 10), { role: 'ink', offset: false, texture: false });
        }
      });
    });
    // the shared sheet: columns «pareja», «modelo», «versión», «respuesta»; rows of short marks, no values
    var nRows = o.nRows || 6, headH = 44, rowH = Math.min(36, (h - headH - 46) / (nRows + 1));
    var sq = E.segment(q1, 0.2, 0.5);
    if (sq > 0) {
      var heads = o.heads || [];
      var avgCell = function (c2, box, qq) { S.text(c2, o.avg || Lr[0] || '', box.x + 10, box.y + box.h / 2 + 6, { size: 16, weight: 700, p: qq }); };
      var none = function () {};
      var rows = [];
      for (var r = 0; r < nRows; r++) rows.push(null);
      rows.push([avgCell, none, none, none]);
      C.table(ctx, { x: sheetX, y: y, w: sheetW, headers: heads, rows: rows, nRows: nRows + 1, rowH: rowH, headH: headH, headSize: 17, p: sq, fill: q2 * nRows + (q2 >= 1 ? 1 : 0), highlightRow: nRows, cols: [0.24, 0.24, 0.24, 0.28] });
      out.sheet = { x: sheetX, y: y, w: sheetW, h: headH + rowH * (nRows + 1) };
      // the answers are recorded in the shared sheet by the group: a human checkpoint before they count
      if (o.flag !== false) C.prop(ctx, 'bandera-control', { x: sheetX - 44, y: y + h * 0.5 + 18, s: 0.5, p: sq, showLabel: false });
      // answers flow as rows from the lamps into the sheet
      if (q2 > 0 && q2 < 1) {
        var rr = Math.floor(q2 * nRows), fr = q2 * nRows - rr;
        var src = ly[rr % 2], ty = y + headH + rr * rowH + rowH / 2;
        var cx2 = E.lerp(lx + 36, sheetX + 20, E.inOut(fr)), cy2 = E.lerp(src, ty, E.inOut(fr));
        S.machine(ctx, 'card', { x: cx2 - 15, y: cy2 - 10, w: 30, h: 20, lines: 2 });
      }
    }
    if (o.badge) {
      var bq = o.badgeQ == null ? q0 : o.badgeQ;
      if (bq > 0) C.badge(ctx, o.badge, sheetX + sheetW - S.measure(ctx, o.badge, 16, 700) - 52, y + h - 30, { p: bq });
    }
    return out;
  };

  // ------------------------------------------------------------------ pilas-recursos (content §3.5 table)
  // resource piles as a frame: labeled ochre fields where the scene places figure cards and charts; the
  // label sits on top of its pile like a tab; no maps. o = { piles: [{ k (index in labels), x, y, w, h,
  // q }], labels (default §3.5), labelSize }. Returns the inner box of each pile.
  R['pilas-recursos'] = function (ctx, o) {
    var L = o.labels || rot('pilas-recursos');
    return (o.piles || []).map(function (pl) {
      var pq = pl.q == null ? (o.p == null ? 1 : o.p) : pl.q;
      var ins = o.inset == null ? 6 : o.inset;
      var inner = { x: pl.x + ins, y: pl.y + ins, w: pl.w - ins * 2, h: pl.h - ins * 2 };
      if (pq <= 0) return inner;
      S.shape(ctx, rect(pl.x, pl.y, pl.w, pl.h, 18), { role: 'ground-2', p: E.segment(pq, 0, 0.6), seed: 860 + (pl.k || 0), weight: 'regular', fillAlpha: 0.55 });
      var ls = o.labelSize || 21, lw = S.measure(ctx, L[pl.k] || '', ls, 700);
      S.text(ctx, L[pl.k] || '', pl.x + 16, pl.y - 9, { size: ls, weight: 700, p: E.segment(pq, 0.2, 0.7) });
      S.stroke(ctx, [[pl.x + 14, pl.y - 4], [pl.x + 22 + lw, pl.y - 3]], { weight: 'thin', taper: false, p: E.segment(pq, 0.3, 0.8), seed: 870 + (pl.k || 0), dot: true });
      inner.labelEnd = pl.x + 22 + lw;
      return inner;
    });
  };
})(window.IAHI);

/* ======================================================================================================
   Course signs drawn first in V4 and V8 (built in parallel, kept as their own block)
   ====================================================================================================== */
/* Course signs of V4 and V8 (spec §3.5): `ciclo-busqueda`, `proyecto-carpeta`, `piezas-agente` (V4)
   and `reloj-presentacion`, `rubrica`, `declaracion` (V8). Parameterized, seeded and able to draw on
   with progress values: o.q is the list of beat progresses, as in signs.js. Every label comes from the
   caller (scene texts, the figure bank or C.signLabels), never from this file. Built only from the
   style API and the course's own drawings (boxes, cycles, props, the lamp's family). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;
  var R = C.signs = C.signs || {};

  function q(o, i) { var a = o.q || []; return a[i] == null ? (o.p == null ? 1 : o.p) : a[i]; }
  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 12 : r); }
  function rot(id) { return C.signLabels ? C.signLabels(id) : (((NS.data.rotulos || {}).signs || {})[id] || []); }
  function fade(ctx, a) { ctx.globalAlpha *= E.clamp(a, 0, 1); }
  // a closed polygon whose outline closes too (S.stroke walks the points; it does not join the ends)
  function poly(pts) { var o = pts.slice(); o.push([pts[0][0], pts[0][1]]); o.closed = true; return o; }

  // A dashed calligraphic line (dashes are short strokes along the path).
  function dashed(ctx, pts, o) {
    o = o || {};
    var on = o.on || 10, off = o.off || 7, k = 0;
    var res = P.resample(pts, 2), run = [res[0]], acc = 0, drawing = true;
    function flush() { if (run.length > 1) S.stroke(ctx, run, { weight: o.weight || 'thin', taper: false, swell: 0.1, seed: (o.seed || 1) + k++, role: o.role }); }
    for (var i = 1; i < res.length; i++) {
      acc += P.dist(res[i - 1], res[i]);
      if (drawing) {
        run.push(res[i]);
        if (acc >= on) { flush(); run = []; acc = 0; drawing = false; }
      } else if (acc >= off) { acc = 0; drawing = true; run = [res[i]]; }
    }
    if (drawing) flush();
  }

  // A free-standing speech bubble with ruled lines (n lines spread over its height).
  function bubble(ctx, x, y, w, h, o) {
    o = o || {};
    var body = rect(x, y, w, h, Math.min(26, h / 2));
    S.fill(ctx, body, { role: o.role || 'ground', offset: false, texture: false, p: o.p });
    S.stroke(ctx, P.wobble(body, (o.seed || 5) + 1, 1), { weight: o.weight || 'regular', closed: true, taper: false, swell: 0.25, seed: o.seed || 5, p: o.p });
    var tx = x + 34;
    S.stroke(ctx, [[tx, y + h - 2], [tx - 16, y + h + 22], [tx + 14, y + h - 1]], { weight: o.weight || 'regular', taper: false, seed: (o.seed || 5) + 2, p: o.p });
    var n = o.lines || 0;
    for (var i = 0; i < n; i++) {
      var yy = y + 26 + i * (h - 40) / Math.max(1, n - 0.6);
      S.stroke(ctx, [[x + 24, yy], [x + w - (i === n - 1 ? w * 0.42 : 24), yy + 1]], { weight: 'thin', taper: false, seed: (o.seed || 5) + 10 + i, p: o.p });
    }
  }

  // ------------------------------------------------------------------ ciclo-busqueda (content §4.1)
  // a loop «busca» → «lee» → «reformula» → «sigue citas» turning around a `buscador-academico`, and
  // the exit «se detiene cuando ya no aparece nada nuevo». The highlighted step follows the lamp's
  // glowing card. o = { cx, cy, rx, ry, labels [5] (default §3.5), q: [loop, exit], t, boxW, boxH,
  // size, lamp (default true), lampR, ring, exitW, exitH, exitGap, exitSize, still, active }
  R['ciclo-busqueda'] = function (ctx, o) {
    var L = o.labels || rot('ciclo-busqueda');
    var cx = o.cx, cy = o.cy, rx = o.rx || 220, ry = o.ry || 150;
    var bw = o.boxW || 170, bh = o.boxH || 56;
    var q0 = q(o, 0), q1 = q(o, 1), t = o.t || 0;
    var spin = Math.floor(t / 1.6) % 4;
    var active = o.active !== undefined ? o.active : (q0 >= 1 ? spin : null);
    if (o.lamp !== false && q0 > 0) {
      // step i sits at angle π + i·π/2; the lamp's ring card at that angle is (i + 3) mod 4
      C.lamp(ctx, 'buscador-academico', { x: cx, y: cy, r: o.lampR || 34, ring: o.ring || 72, labels: [], p: E.segment(q0, 0, 0.35), t: t, still: o.still, active: active == null ? -1 : (active + 3) % 4 });
    }
    // four steps clockwise from the left: busca (left), lee (top), reformula (right), sigue citas (bottom)
    var ctr = [[cx - rx, cy], [cx, cy - ry], [cx + rx, cy], [cx, cy + ry]];
    var boxes = ctr.map(function (c) { return { x: c[0] - bw / 2, y: c[1] - bh / 2, w: bw, h: bh }; });
    var sp = function (i) { return E.stagger(E.segment(q0, 0.15, 1), i, 4, 0.7); };
    boxes.forEach(function (b, i) {
      var qq = sp(i);
      if (qq > 0) C.box(ctx, b, { label: L[i], p: qq, size: o.size || 20, role: active === i ? 'accent-2' : 'ground', weight: active === i ? 'bold' : 'regular', seed: 30 + i });
    });
    // arrows from edge to edge, bulging outward
    var g = 6;
    var arrows = [
      [[ctr[0][0], boxes[0].y - g], [boxes[1].x - g - 4, ctr[1][1]]],
      [[boxes[1].x + bw + g, ctr[1][1]], [ctr[2][0], boxes[2].y - g - 4]],
      [[ctr[2][0], boxes[2].y + bh + g], [boxes[3].x + bw * 0.78, boxes[3].y - g - 4]],
      [[boxes[3].x - g, ctr[3][1]], [ctr[0][0], boxes[0].y + bh + g + 4]]
    ];
    arrows.forEach(function (a, k) {
      var qa = Math.min(sp(k), sp((k + 1) % 4));
      if (qa <= 0) return;
      var d = P.dist(a[0], a[1]);
      C.arrow(ctx, a[0], a[1], { p: qa, curve: -0.22 * d, weight: 'thin', head: 11, seed: 20 + k });
    });
    var b3 = boxes[3];
    var ew = o.exitW || 280, eh = o.exitH || 78;
    var ex = b3.x + b3.w + (o.exitGap || 64), ey = b3.y + b3.h / 2 - eh / 2 + (o.exitDy || 0);
    if (q1 > 0) {
      C.arrow(ctx, [b3.x + b3.w + 6, b3.y + b3.h / 2 + 8], [ex - 8, ey + eh / 2], { p: E.segment(q1, 0, 0.45), weight: 'regular', head: 13, seed: 401 });
      C.box(ctx, { x: ex, y: ey, w: ew, h: eh }, { label: L[4], size: o.exitSize || 19, role: 'accent-2', p: E.segment(q1, 0.3, 1), seed: 402, maxLines: 3 });
    }
    return { boxes: boxes, exit: { x: ex, y: ey, w: ew, h: eh } };
  };

  // ------------------------------------------------------------------ proyecto-carpeta (content §4.2)
  // a single chat bubble next to a project folder with three labeled parts: «instrucciones fijas»,
  // «documentos del proyecto», «historial». o = { bubble: {x, y, w, h}, folder: {x, y, w, h},
  // labels [3] (default §3.5), bubbleLabel, docs [labels inside «documentos»], q: [bubble, parts, docs],
  // fade (0→1, the loose chat is lost), tag (0→1, version-and-date tag on the instructions) }
  R['proyecto-carpeta'] = function (ctx, o) {
    var L = o.labels || rot('proyecto-carpeta');
    var q0 = q(o, 0), q1 = q(o, 1), q2 = q(o, 2);
    var out = { parts: [] };
    var bb = o.bubble;
    if (bb && q0 > 0) {
      var lost = E.clamp(o.fade || 0, 0, 1);
      ctx.save();
      fade(ctx, 1 - 0.72 * lost);
      bubble(ctx, bb.x, bb.y, bb.w, bb.h, { p: q0, lines: Math.max(0, Math.round(4 * (1 - lost))), seed: 410 });
      ctx.restore();
      // «empieza de cero»: a small spiral turning back to the start
      if (lost > 0.3) S.sign(ctx, 'spiral', { x: bb.x + bb.w - 30, y: bb.y + bb.h + 30, r: 16, p: E.segment(lost, 0.3, 0.9), seed: 411 });
      if (o.bubbleLabel) S.text(ctx, o.bubbleLabel, bb.x + bb.w / 2, bb.y + bb.h + 76, { size: o.labelSize || 22, weight: 700, align: 'center', maxWidth: bb.w + 60, p: E.segment(lost, 0.1, 0.6) });
      out.bubble = bb;
    }
    var fb = o.folder;
    if (!fb || q1 <= 0) return out;
    var x = fb.x, y = fb.y, w = fb.w, h = fb.h;
    var back = poly([[x, y + 22], [x + w * 0.3, y + 22], [x + w * 0.36, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    S.shape(ctx, back, { role: 'accent-6', p: E.segment(q1, 0, 0.3), seed: 420, weight: 'bold' });
    var pad = 18, top = y + 40, rowH = (h - 40 - pad) / 3;
    for (var i = 0; i < 3; i++) {
      var pq = E.segment(q1, 0.2 + i * 0.22, 0.45 + i * 0.22);
      var b = { x: x + pad, y: top + i * rowH, w: w - pad * 2, h: rowH - 12 };
      out.parts.push(b);
      if (pq <= 0) continue;
      C.box(ctx, b, { p: pq, role: 'ground', seed: 430 + i, r: 10 });
      ctx.save(); fade(ctx, pq);
      var ix = b.x + 46, iy = b.y + 44;
      if (i === 0) {
        // fixed instructions: a ruled card with a pin
        S.shape(ctx, rect(ix - 24, iy - 28, 48, 58, 4), { role: 'accent-2', seed: 440, weight: 'thin' });
        for (var k = 0; k < 4; k++) S.stroke(ctx, [[ix - 16, iy - 14 + k * 11], [ix + (k === 3 ? 2 : 16), iy - 14 + k * 11]], { weight: 'hair', taper: false, seed: 441 + k });
        S.fill(ctx, P.circle(ix, iy - 30, 5, 12), { role: 'accent-1', offset: false, texture: false });
        S.stroke(ctx, P.circle(ix, iy - 30, 5, 12), { weight: 'hair', closed: true, taper: false });
      } else if (i === 1) {
        // project documents: three pages
        for (var d = 2; d >= 0; d--) C.prop(ctx, 'article-card', { x: ix - 26 + d * 9, y: iy - 34 + d * 5, w: 38, h: 50, seed: 450 + d, barRole: ['accent-3', 'accent-1', 'accent-4'][d] });
      } else {
        // history: earlier exchanges kept in order
        for (var m = 0; m < 3; m++) {
          var my = iy - 30 + m * 20, mx = ix - 26 + (m % 2) * 12;
          S.fill(ctx, rect(mx, my, 40, 15, 7), { role: m % 2 ? 'accent-5' : 'ground', offset: false, texture: false });
          S.stroke(ctx, rect(mx, my, 40, 15, 7), { weight: 'hair', closed: true, taper: false, seed: 460 + m });
        }
      }
      S.text(ctx, L[i] || '', b.x + 96, b.y + 32, { size: o.partSize || 20, weight: 700, maxWidth: b.w - 110, maxLines: 1 });
      ctx.restore();
    }
    // the documents named on line 2: small chips inside «documentos del proyecto»
    var docs = o.docs || [];
    if (q2 > 0 && docs.length) {
      var row = out.parts[1], ds = o.docSize || 16, cxp = row.x + 96, cyp = row.y + 44;
      docs.forEach(function (lb, j) {
        var dw = S.measure(ctx, lb, ds, 700) + 28;
        if (cxp + dw > row.x + row.w - 10 && cxp > row.x + 96) { cxp = row.x + 96; cyp += 36; }
        C.box(ctx, { x: cxp, y: cyp, w: dw, h: 31 }, { label: lb, size: ds, role: 'accent-5', p: E.stagger(q2, j, docs.length, 0.6), seed: 470 + j, r: 15 });
        cxp += dw + 10;
      });
    }
    // version-and-date tag hanging from the fixed instructions
    var tg = o.tag == null ? 0 : o.tag;
    if (tg > 0) {
      var ins = out.parts[0];
      var tx0 = ins.x + ins.w - 92, ty0 = ins.y + ins.h - 44;
      ctx.save(); fade(ctx, tg);
      S.stroke(ctx, P.smooth([[ins.x + ins.w - 150, ins.y + 30], [tx0 - 18, ty0 - 4], [tx0, ty0 + 14]], 8), { weight: 'thin', seed: 480, p: tg });
      var tagS = poly([[tx0, ty0 + 2], [tx0 + 70, ty0 + 2], [tx0 + 70, ty0 + 30], [tx0, ty0 + 30], [tx0 - 12, ty0 + 16]]);
      S.shape(ctx, tagS, { role: 'accent-2', seed: 481, weight: 'thin', p: tg });
      C.pictos.draw(ctx, 'calendar-check', { x: tx0 + 18, y: ty0 + 16, r: 10, p: tg });
      S.stroke(ctx, [[tx0 + 36, ty0 + 11], [tx0 + 62, ty0 + 11]], { weight: 'hair', taper: false, seed: 482, p: tg });
      S.stroke(ctx, [[tx0 + 36, ty0 + 20], [tx0 + 54, ty0 + 20]], { weight: 'hair', taper: false, seed: 483, p: tg });
      ctx.restore();
    }
    out.folder = fb;
    return out;
  };

  // ------------------------------------------------------------------ piezas-agente (content §4.3)
  // four items in rows (name · drawing · analogy): «Skill» (a folder with the sheet «SKILL.md»),
  // «Subagente» (`subagente`, fed by the main lamp), «Plugin» (a kit box holding a skill, a subagent and
  // a connector), «Conector (MCP)» (`conector`). o = { x, y, w, h, labels (default §3.5: Skill,
  // SKILL.md, Subagente, Plugin, Conector (MCP)), analogies [4], q [4], t, flow (subagent 0→1),
  // titleW, iconW, size, analogySize, frames (default true) }
  function skillFolder(ctx, cx, cy, s, sheetLabel, p, seed) {
    var w = 96 * s, h = 70 * s, x = cx - w / 2, y = cy - h / 2 + 8 * s;
    var back = poly([[x, y + 10 * s], [x + w * 0.34, y + 10 * s], [x + w * 0.42, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    S.shape(ctx, back, { role: 'accent-6', p: p, seed: seed, weight: 'regular' });
    var sw = w * 0.86, sh = h * 0.95, sx = cx - sw / 2, sy = y - h * 0.42;
    S.shape(ctx, rect(sx, sy, sw, sh, 4), { role: 'ground', p: p, seed: seed + 1, weight: 'thin', offset: false, texture: false });
    if (sheetLabel) S.text(ctx, sheetLabel, cx, sy + 19 * s, { size: Math.max(13, Math.round(15 * s)), weight: 700, align: 'center', maxWidth: sw - 6, maxLines: 1, p: p });
    for (var k = 0; k < 2; k++) S.stroke(ctx, [[sx + 10 * s, sy + (30 + k * 9) * s], [sx + sw - (k ? 26 : 10) * s, sy + (30 + k * 9) * s]], { weight: 'hair', taper: false, seed: seed + 2 + k, p: p });
    var front = poly([[x - 3 * s, y + h * 0.38], [x + w + 3 * s, y + h * 0.38], [x + w, y + h], [x, y + h]]);
    S.shape(ctx, front, { role: 'accent-6', p: p, seed: seed + 5, weight: 'regular' });
  }

  function kitBox(ctx, cx, cy, s, p, t, seed) {
    var w = 150 * s, h = 70 * s, x = cx - w / 2, y = cy - h / 2 + 12 * s;
    // handle, high above the contents
    S.stroke(ctx, P.arc(cx, y, 36 * s, Math.PI * 1.12, Math.PI * 1.88, 18), { weight: 'bold', taper: false, seed: seed, p: p });
    // contents peeking over the rim: a skill folder, a small lamp (subagent) and a plug (connector)
    ctx.save(); fade(ctx, E.segment(p, 0.3, 1));
    var fx = x + w * 0.17, fy = y - 4 * s;
    var mini = poly([[fx - 16 * s, fy - 10 * s], [fx - 4 * s, fy - 10 * s], [fx, fy - 15 * s], [fx + 16 * s, fy - 15 * s], [fx + 16 * s, fy + 12 * s], [fx - 16 * s, fy + 12 * s]]);
    S.shape(ctx, mini, { role: 'accent-6', seed: seed + 1, weight: 'thin' });
    C.lamp(ctx, 'lampara', { x: cx, y: y - 7 * s, r: 13 * s, t: t, still: true, glow: false });
    S.machine(ctx, 'plug', { x: x + w * 0.82, y: y - 6 * s, s: 12 * s, dir: 1 });
    ctx.restore();
    S.shape(ctx, rect(x, y, w, h, 8), { role: 'accent-1', p: p, seed: seed + 2, weight: 'regular' });
    S.stroke(ctx, [[x + 8, y + h * 0.36], [x + w - 8, y + h * 0.36 + 1]], { weight: 'thin', taper: false, seed: seed + 3, p: p });
    S.fill(ctx, rect(cx - 12 * s, y + h * 0.36 - 6 * s, 24 * s, 12 * s, 3), { role: 'accent-2', offset: false, texture: false, p: p });
    S.stroke(ctx, rect(cx - 12 * s, y + h * 0.36 - 6 * s, 24 * s, 12 * s, 3), { weight: 'hair', closed: true, taper: false, p: p });
  }

  R['piezas-agente'] = function (ctx, o) {
    var L = o.labels || rot('piezas-agente');
    var titles = [L[0], L[2], L[3], L[4]], sheet = L[1];
    var an = o.analogies || [];
    var n = 4, rh = o.h / n, t = o.t || 0;
    var tw = o.titleW || o.w * 0.17, iw = o.iconW || o.w * 0.35;
    var rows = [];
    for (var i = 0; i < n; i++) {
      var qi = q(o, i);
      var ry = o.y + i * rh;
      var row = { x: o.x, y: ry + 6, w: o.w, h: rh - 12 };
      rows.push(row);
      if (qi <= 0) continue;
      if (o.frames !== false) C.box(ctx, row, { p: E.segment(qi, 0, 0.3), role: 'ground', weight: 'thin', seed: 500 + i, r: 14 });
      ctx.save(); fade(ctx, E.segment(qi, 0.05, 0.3));
      if (titles[i]) S.text(ctx, titles[i], o.x + 22, row.y + row.h / 2 + 8, { size: o.size || 24, weight: 700, maxWidth: tw - 26, maxLines: 2, vcenter: true, lineHeight: 1.1 });
      ctx.restore();
      var icx = o.x + tw + iw / 2, icy = row.y + row.h / 2;
      var ip = E.segment(qi, 0.1, 0.55);
      if (i === 0) skillFolder(ctx, icx, icy + 6, Math.min(1.05, row.h / 92), sheet, ip, 510);
      else if (i === 1) {
        // the main lamp (left) hands a task card to the subagent, which returns one summary card
        var fl = o.flow == null ? E.segment(qi, 0.35, 0.95) : o.flow;
        var mx = icx - 170, sx = icx + 4;
        if (ip > 0) { ctx.save(); fade(ctx, ip * 1.5); S.machineArea(ctx, icx - 214, row.y + 10, 384, row.h - 20); ctx.restore(); }
        C.lamp(ctx, 'lampara', { x: mx, y: icy - 4, r: 24, p: ip, t: t, still: o.still });
        C.lamp(ctx, 'subagente', { x: sx, y: icy - 4, r: 20, p: ip, t: t, flow: Math.min(fl, 0.999), still: o.still });
        var back = E.segment(fl, 0.75, 1);
        if (back > 0) {
          ctx.save(); fade(ctx, back);
          var ex0 = sx + 137, ey0 = icy + 14, ey1 = icy + 36;
          S.machineLine(ctx, ex0, ey0, ex0, ey1, 1.4);
          S.machineLine(ctx, ex0, ey1, mx, ey1, 1.4);
          S.machine(ctx, 'arrow', { from: [mx, ey1], to: [mx, icy + 22], w: 1.4, head: 7 });
          ctx.restore();
        }
      } else if (i === 2) kitBox(ctx, icx, icy + 6, Math.min(1, row.h / 100), ip, t, 520);
      else {
        if (ip > 0) { ctx.save(); fade(ctx, ip * 1.5); S.machineArea(ctx, icx - 214, row.y + 10, 384, row.h - 20); ctx.restore(); }
        ctx.save();
        ctx.translate(icx, icy); ctx.scale(0.8, 0.8); ctx.translate(-icx, -icy);
        C.lamp(ctx, 'conector', { x: icx - 118, y: icy, r: 26, dx: 190, p: ip, t: t, still: o.still });
        ctx.restore();
      }
      var ax = o.x + tw + iw + 10, aw = o.w - tw - iw - 26;
      if (an[i]) C.box(ctx, { x: ax, y: row.y + 12, w: aw, h: row.h - 24 }, { label: an[i], size: o.analogySize || 19, role: 'ground-2', align: 'left', p: E.segment(qi, 0.45, 0.9), seed: 530 + i, r: 12, maxLines: 2 });
    }
    return { rows: rows };
  };

  // ------------------------------------------------------------------ reloj-presentacion (Sesión 8)
  // the presentation clock: a bar split into segments drawn exactly from a figure's partes —
  // partes[0] is the total («8 minutos»), partes[1…] the segments («1 min», «3 min», …) with their
  // labels. Widths come from charts.parseValue of each valor on one scale (o.unit px per minute,
  // starting at zero); values print exactly as the bank writes them. o = { fig, x, y, unit | w, h,
  // labels (segment labels, default the partes' etiquetas), q: [segments, warnings + tail],
  // marks: [minutes] (warning ticks), tail: { minutes, label } (after the bar, dashed), size }
  function bell(ctx, x, y, r, p, seed) {
    var dome = P.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95, 16);
    var shape = poly(dome.concat([[x + r * 1.25, y + r * 0.75], [x - r * 1.25, y + r * 0.75]]));
    S.shape(ctx, shape, { role: 'accent-2', p: p, seed: seed, weight: 'thin' });
    S.fill(ctx, P.circle(x, y + r * 1.05, r * 0.28, 10), { role: 'ink', offset: false, texture: false, p: p });
    S.stroke(ctx, [[x - r * 1.7, y - r * 0.6], [x - r * 2.3, y - r * 1]], { weight: 'thin', taper: false, seed: seed + 1, p: p });
    S.stroke(ctx, [[x + r * 1.7, y - r * 0.6], [x + r * 2.3, y - r * 1]], { weight: 'thin', taper: false, seed: seed + 2, p: p });
  }

  R['reloj-presentacion'] = function (ctx, o) {
    var f = o.fig;
    if (!f || !f.partes || f.partes.length < 2) return null;
    var pv = NS.engine.charts.parseValue;
    var total = pv(f.partes[0].valor);
    var segs = f.partes.slice(1).map(function (pt, i) {
      return { value: pv(pt.valor), text: pt.valor, label: (o.labels && o.labels[i]) || pt.etiqueta };
    });
    var unit = o.unit || o.w / total;
    var x0 = o.x, y0 = o.y, h = o.h || 80;
    var px = function (m) { return x0 + m * unit; };
    var q0 = q(o, 0), q1 = q(o, 1);
    var roles = o.roles || ['accent-5', 'accent-2', 'ground-2', 'accent-5', 'accent-2'];
    var size = o.size || 17;
    // the whole bar: its total as the bank writes it, over a bracket
    var tq = E.segment(q0, 0, 0.2);
    if (tq > 0) {
      C.bracket(ctx, px(0), px(total), y0 - 18, { p: tq, h: 10 });
      S.text(ctx, f.partes[0].etiqueta + ' ' + f.partes[0].valor, px(0), y0 - 34, { size: o.titleSize || 24, weight: 700, p: tq });
    }
    // minute ticks along the top edge (no numbers): one per minute of the scale
    var acc = 0, out = [], rowsEnd = [-1e9, -1e9];
    var placed = [];
    segs.forEach(function (sg, i) {
      var a = acc, b = acc + sg.value; acc = b;
      var sq = E.stagger(E.segment(q0, 0.1, 1), i, segs.length, 0.75);
      var gx = px(a), gw = px(b) - px(a);
      out.push({ x: gx, w: gw, a: a, b: b });
      if (sq <= 0) return;
      var shape = P.rect(gx, y0, gw, h, 4);
      S.fill(ctx, shape, { role: roles[i % roles.length], offset: false, p: sq, seed: 600 + i });
      S.stroke(ctx, P.wobble(shape, 610 + i, 0.8), { weight: 'regular', closed: true, taper: false, swell: 0.15, p: sq, seed: 610 + i });
      if (sq >= 0.5) {
        var vw = S.measure(ctx, sg.text, 20, 700);
        if (vw < gw - 10) S.text(ctx, sg.text, gx + gw / 2, y0 + h / 2 + 7, { size: 20, weight: 700, align: 'center' });
        else S.text(ctx, sg.text, gx + gw / 2, y0 - 6, { size: 17, weight: 700, align: 'center' });
      }
      // the segment's label under the bar; a second row (with a leader line) when two would touch
      var lw = Math.min(o.labelW || 230, Math.max(S.measure(ctx, sg.label, size, 700) + 8, 60));
      var cxl = gx + gw / 2;
      var rowI = 0;
      if (cxl - lw / 2 < rowsEnd[0] + 14) rowI = 1;
      rowsEnd[rowI] = cxl + lw / 2;
      var ly = y0 + h + 30 + rowI * (o.rowGap || 58);
      placed.push({ x: cxl, y: ly, w: lw, row: rowI });
      var lq = E.segment(sq, 0.3, 1);
      if (rowI > 0) S.stroke(ctx, [[cxl, y0 + h + 4], [cxl, ly - size - 2]], { weight: 'hair', taper: false, seed: 620 + i, p: lq });
      S.text(ctx, sg.label, cxl, ly, { size: size, weight: 700, align: 'center', maxWidth: lw, lineHeight: 1.15, maxLines: 2, p: lq });
    });
    // warnings: a tick through the bar and a small bell above it, at the given minutes
    (o.marks || []).forEach(function (m, i) {
      var mq = E.stagger(q1, i, (o.marks || []).length, 0.4);
      if (mq <= 0) return;
      var mx = px(m);
      S.stroke(ctx, [[mx, y0 - 12], [mx + 1, y0 + h + 12]], { weight: 'bold', taper: false, p: E.segment(mq, 0, 0.5), seed: 630 + i, role: 'accent-1' });
      bell(ctx, mx, y0 - 46, 11, E.segment(mq, 0.3, 1), 640 + i * 5);
    });
    // the tail after the bar (dashed: it is outside the presentation's minutes)
    var tail = o.tail;
    var tailBox = null;
    if (tail && tail.minutes > 0) {
      var tx0 = px(total) + (o.tailGap || 18), tw = tail.minutes * unit;
      tailBox = { x: tx0, y: y0, w: tw, h: h };
      var tq2 = E.segment(q1, 0.45, 1);
      if (tq2 > 0) {
        ctx.save(); fade(ctx, tq2);
        S.fill(ctx, P.rect(tx0, y0, tw, h, 4), { role: 'ground', offset: false, texture: false });
        dashed(ctx, P.rect(tx0, y0, tw, h, 4), { weight: 'regular', seed: 650 });
        if (tail.label) S.text(ctx, tail.label, tx0 + tw / 2, y0 + h / 2 + 7, { size: 20, weight: 700, align: 'center', maxWidth: tw - 10 });
        ctx.restore();
      }
    }
    return { px: px, x0: x0, x1: px(total), y: y0, h: h, segs: out, labels: placed, tail: tailBox };
  };

  // ------------------------------------------------------------------ rubrica (Sesión 8 · Rúbrica)
  // five criteria rows, each with its weight («20 %», from the bank), and a level scale of n levels
  // (n from the figure: «de 1 a 4»): level k is shown as k dots, so no number is typed.
  // o = { x, y, w, criteria [labels], weight, levels, scaleLabel, q: [rows, scale], highlight (row),
  //   hq (0→1), rowH, nameW, weightW, levelW, size }
  // returns { rows: [{x, y, w, h}], cell(row, level) → {x, y, w, h}, scale: {x, y, w, h} }
  function dotsMark(ctx, cx, cy, k, r, p) {
    var gap = r * 2.6;
    for (var i = 0; i < k; i++) S.fill(ctx, P.circle(cx - (k - 1) * gap / 2 + i * gap, cy, r, 12), { role: 'ink', offset: false, texture: false, p: p });
  }
  R.rubrica = function (ctx, o) {
    var crit = o.criteria || [], n = crit.length, lv = o.levels || 4;
    var x = o.x, y = o.y, rowH = o.rowH || 56, headH = o.headH || 50;
    var nameW = o.nameW || 300, weightW = o.weightW || 84, levelW = o.levelW || 58;
    var q0 = q(o, 0), q1 = q(o, 1), hq = o.hq || 0;
    var size = o.size || 18;
    var bodyY = y + headH;
    var tableW = nameW + weightW;
    var rows = [];
    // the criteria: a ruled frame that grows row by row
    var fq = E.segment(q0, 0, 0.2);
    var shown = E.segment(q0, 0.05, 1) * n;
    var fh = rowH * Math.max(1, Math.ceil(Math.min(n, shown + 0.001)));
    if (fq > 0) {
      var frame = rect(x, bodyY, tableW, fh, 10);
      S.fill(ctx, frame, { role: 'ground', offset: false, texture: false, p: fq });
      S.stroke(ctx, P.wobble(frame, 701, 0.8), { weight: 'regular', closed: true, taper: false, swell: 0.2, p: fq, seed: 701 });
    }
    for (var i = 0; i < n; i++) {
      var ry = bodyY + i * rowH;
      rows.push({ x: x, y: ry, w: tableW, h: rowH });
      var rq = E.clamp(shown - i, 0, 1);
      if (rq <= 0) continue;
      if (o.highlight === i && hq > 0) S.fill(ctx, rect(x + 4, ry + 4, tableW - 8, rowH - 8, 8), { role: 'accent-2', offset: false, alpha: 0.55, p: hq });
      if (i > 0) S.stroke(ctx, [[x + 6, ry], [x + tableW - 6, ry + 1]], { weight: 'hair', taper: false, seed: 710 + i, p: rq });
      S.text(ctx, crit[i], x + 16, ry + rowH / 2 + size * 0.36, { size: size, weight: 700, maxWidth: nameW - 26, vcenter: true, lineHeight: 1.12, maxLines: 2, p: rq });
      if (o.weight) {
        var wq = E.segment(rq, 0.3, 1);
        C.box(ctx, { x: x + nameW + 8, y: ry + 10, w: weightW - 16, h: rowH - 20 }, { label: o.weight, size: 17, role: 'accent-2', p: wq, seed: 720 + i, r: 14 });
      }
    }
    if (fq > 0) S.stroke(ctx, [[x + nameW, bodyY + 6], [x + nameW + 1, bodyY + fh - 6]], { weight: 'hair', taper: false, seed: 730, p: fq });
    // the level scale beside the criteria: n columns, a header with k dots per level
    var sx = x + tableW + 10, sw = lv * levelW;
    var scaleBox = { x: sx, y: y, w: sw, h: headH + rowH * n };
    if (q1 > 0) {
      var sf = rect(sx, bodyY, sw, rowH * n, 10);
      S.fill(ctx, sf, { role: 'ground', offset: false, texture: false, p: q1 });
      if (o.highlight != null && hq > 0) S.fill(ctx, rect(sx + 4, bodyY + o.highlight * rowH + 4, sw - 8, rowH - 8, 8), { role: 'accent-2', offset: false, alpha: 0.55, p: hq });
      S.stroke(ctx, P.wobble(sf, 741, 0.8), { weight: 'regular', closed: true, taper: false, swell: 0.2, p: q1, seed: 741 });
      if (o.scaleLabel) S.text(ctx, o.scaleLabel, sx + sw / 2, y + 14, { size: 16, weight: 700, align: 'center', role: 'ink-soft', maxWidth: sw + 40, p: q1 });
      for (var k = 0; k < lv; k++) {
        var cx = sx + k * levelW + levelW / 2;
        var kq = E.stagger(q1, k, lv, 0.5);
        dotsMark(ctx, cx, y + headH - 14, k + 1, 3.6, kq);
        if (k > 0) S.stroke(ctx, [[sx + k * levelW, bodyY + 6], [sx + k * levelW + 1, bodyY + rowH * n - 6]], { weight: 'hair', taper: false, seed: 750 + k, p: kq });
        for (var r2 = 0; r2 < n; r2++) S.stroke(ctx, P.circle(cx, bodyY + r2 * rowH + rowH / 2, 7, 16), { weight: 'hair', closed: true, taper: false, p: kq, role: 'ink-soft' });
      }
      for (var r3 = 1; r3 < n; r3++) S.stroke(ctx, [[sx + 6, bodyY + r3 * rowH], [sx + sw - 6, bodyY + r3 * rowH + 1]], { weight: 'hair', taper: false, seed: 760 + r3, p: q1 });
    }
    return {
      rows: rows, scale: scaleBox,
      cell: function (row, level) { return { x: sx + (level - 1) * levelW, y: bodyY + row * rowH, w: levelW, h: rowH }; }
    };
  };

  // ------------------------------------------------------------------ declaracion (Anexos B5)
  // a document titled «Declaración de uso de inteligencia artificial» with labeled blanks that fill
  // with handwriting marks. o = { x, y, w, h, title (default §3.5), fields [labels], q: [document, fill],
  //   fills [0→1 per field] (default: staggered from q[1]), size }
  // returns { fields: [{ x, y, w }], box }
  R.declaracion = function (ctx, o) {
    var title = o.title || rot('declaracion')[0] || '';
    var fields = o.fields || [];
    var x = o.x, y = o.y, w = o.w, h = o.h;
    var q0 = q(o, 0), q1 = q(o, 1);
    var out = { fields: [], box: { x: x, y: y, w: w, h: h } };
    if (q0 <= 0) return out;
    var a = S.appear('rise', q0);
    ctx.save(); fade(ctx, a.alpha); ctx.translate(0, a.dy);
    var fold = 34;
    var page = poly([[x, y], [x + w - fold, y], [x + w, y + fold], [x + w, y + h], [x, y + h]]);
    S.fill(ctx, page, { role: 'ground', offset: false, texture: false });
    S.stroke(ctx, P.wobble(page, 801, 1.2), { weight: 'bold', closed: true, taper: false, swell: 0.25, seed: 801 });
    S.stroke(ctx, [[x + w - fold, y + 2], [x + w - fold + 1, y + fold], [x + w - 2, y + fold]], { weight: 'thin', taper: false, seed: 802 });
    var tt = S.text(ctx, title, x + 30, y + 46, { size: o.titleSize || 25, weight: 700, maxWidth: w - 60 - fold, lineHeight: 1.15, maxLines: 2 });
    var top = y + 46 + tt.height + 6;
    S.stroke(ctx, [[x + 30, top - 10], [x + w - 30, top - 9]], { weight: 'thin', taper: false, seed: 803 });
    var fh = (y + h - 20 - top) / Math.max(1, fields.length);
    var size = o.size || 18;
    fields.forEach(function (lb, i) {
      var fy = top + i * fh;
      S.text(ctx, lb, x + 30, fy + size + 6, { size: size, weight: 700, maxWidth: w - 60, maxLines: 1 });
      var by = fy + fh - 12;
      S.stroke(ctx, [[x + 30, by], [x + w - 30, by + 1]], { weight: 'hair', taper: false, seed: 810 + i, role: 'ink-soft' });
      out.fields.push({ x: x + 30, y: by, w: w - 60 });
      var fq = o.fills ? (o.fills[i] || 0) : E.stagger(q1, i, fields.length, 0.8);
      if (fq <= 0) return;
      // handwriting: a loose wavy line in the pen's blue along the blank
      var len = (w - 90) * (0.55 + 0.35 * ((i * 5) % 4) / 4);
      var pts = [];
      for (var k = 0; k <= 40; k++) { var u = k / 40; pts.push([x + 36 + u * len, by - 9 + Math.sin(u * 26 + i) * 3.2 + Math.sin(u * 7) * 1.5]); }
      S.stroke(ctx, pts, { weight: 'regular', role: 'accent-3', p: fq, seed: 820 + i, swell: 0.3 });
    });
    ctx.restore();
    return out;
  };

  // helpers shared by the V4 and V8 video files (private to these two videos)
  C.v4v8 = { dashed: dashed, bubble: bubble, skillFolder: skillFolder, kitBox: kitBox, bell: bell, dotsMark: dotsMark, poly: poly };
})(window.IAHI);

/* ======================================================================================================
   Course signs drawn first in V5 and V7 (built in parallel, kept as their own block)
   ====================================================================================================== */
/* Course signs of V5–V7 (spec §3.5 and §11): ciclo-agente, seis-entornos, tres-estandares, mapa-riesgos,
   tabla-riesgos, tarjetas-casos, pagina-oculta, dialogo-permiso (V5); salas-herramienta, semaforo-lab,
   carpeta-lab, matriz-literatura (V6); etapas-gratuitas, pregunta-estructurada, matriz-antecedentes,
   tres-rutas, libro-codigos (V7). Parameterized, seeded and able to draw on with progress values:
   o.q is the list of beat progresses; every label comes from the caller (scene texts or data) or, by
   default, from the sign's final-copy labels (C.signLabels, spec §3.5). Built only from the style API
   and the course drawings; the machine parts keep the machine manner (style S7).
   pagina-oculta: the hidden line is never drawn before its reveal, and once revealed it is shown only
   inside its labeled highlight frame (spec §8.17, §10.2 item 10). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;
  var R = C.signs = C.signs || {};

  function q(o, i) { var a = o.q || []; return a[i] == null ? (o.p == null ? 1 : o.p) : a[i]; }
  function rot(id) { return ((NS.data.rotulos || {}).signs || {})[id] || []; }
  function labels(o, id) { return o.labels || rot(id); }
  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 12 : r); }
  // data cells may carry the content's link markup: keep only the words
  function plain(s) { return String(s == null ? '' : s).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, ''); }
  function alpha(ctx, a) { ctx.save(); ctx.globalAlpha *= E.clamp(a, 0, 1); }
  // S.stroke draws a polyline as given: a polygon needs its first point repeated to close its outline
  function closed(pts) { var c = pts.slice(); c.push([pts[0][0], pts[0][1]]); c.closed = true; return c; }
  // the course folder prop, with its left edge drawn (props.js leaves that side of the outline open)
  function folderProp(ctx, o) {
    var out = C.prop(ctx, 'folder', o);
    var w = o.w || 150, h = o.h || 110, x = o.x - w / 2, y = o.y - h / 2;
    S.stroke(ctx, [[x, y + h], [x, y + 12]], { weight: 'regular', taper: false, p: o.p, seed: (o.seed || 7) + 9 });
    return out;
  }
  // body text measured the way S.text wraps it: number of lines at a size and width
  function lineCount(ctx, str, size, weight, maxWidth) {
    ctx.save();
    ctx.font = (weight || 700) + ' ' + size + 'px ' + S.tokens.fonts.body;
    var n = NS.engine.captions.wrap(ctx, NS.util.nbsp(String(str || '')), maxWidth).length;
    ctx.restore();
    return n;
  }

  // ------------------------------------------------------------------ small shared drawings
  // the sign of «a person» inside a diagram: a head-and-shoulders outline (never a cast member)
  function personIcon(ctx, x, y, r, p, seed) {
    S.stroke(ctx, P.circle(x, y - r * 0.38, r * 0.36, 24), { weight: 'thin', closed: true, taper: false, p: p, seed: seed || 3 });
    S.stroke(ctx, P.arc(x, y + r * 0.74, r * 0.64, Math.PI * 1.08, Math.PI * 1.92, 18), { weight: 'thin', taper: false, p: p, seed: (seed || 3) + 1 });
  }
  // a page with a folded corner and ruled lines (human manner); o = { p, seed, lines, bar (title-bar role), fill, weight }
  function page(ctx, x, y, w, h, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p, f = Math.min(w, h) * 0.22, sd = o.seed || 5;
    var pts = closed([[x, y], [x + w - f, y], [x + w, y + f], [x + w, y + h], [x, y + h]]);
    S.shape(ctx, pts, { role: o.fill || 'ground', p: p, seed: sd, weight: o.weight || 'thin', offset: false, texture: false, wobbleAmp: 0.8 });
    S.stroke(ctx, [[x + w - f, y + 1], [x + w - f, y + f], [x + w - 1, y + f]], { weight: 'hair', taper: false, p: p, seed: sd + 1 });
    if (o.bar) S.fill(ctx, rect(x + w * 0.13, y + h * 0.13, w * 0.5, Math.max(4, h * 0.075), 2), { role: o.bar, offset: false, texture: false, p: p });
    var n = o.lines == null ? 3 : o.lines, top = y + h * (o.bar ? 0.36 : 0.3);
    for (var i = 0; i < n; i++) {
      var yy = top + i * (y + h * 0.88 - top) / Math.max(1, n);
      S.stroke(ctx, [[x + w * 0.13, yy], [x + w * (i === n - 1 ? 0.6 : 0.86), yy]], { weight: 'hair', taper: false, p: p, seed: sd + 2 + i });
    }
  }
  // a dashed calligraphic outline (an empty slot, a frame that waits)
  function dashed(ctx, pts, o) {
    o = o || {};
    var res = P.resample(pts, 3), dash = o.dash || 9, gap = o.gap || 7, acc = 0, cur = [], on = true;
    for (var i = 1; i < res.length; i++) {
      var d = P.dist(res[i - 1], res[i]);
      acc += d;
      if (on) cur.push(res[i - 1]);
      if (on && acc >= dash) { cur.push(res[i]); if (cur.length > 1) S.stroke(ctx, cur, { weight: o.weight || 'thin', taper: false, p: o.p, seed: i, role: o.role }); cur = []; on = false; acc = 0; }
      else if (!on && acc >= gap) { on = true; acc = 0; }
    }
  }
  // a checkbox with an optional check (p of the check)
  function checkbox(ctx, x, y, s, checkP, p) {
    S.stroke(ctx, rect(x, y, s, s, 3), { weight: 'thin', closed: true, taper: false, p: p == null ? 1 : p, seed: 7 });
    if (checkP > 0) C.check(ctx, x + s * 0.5, y + s * 0.42, s * 0.95, { p: checkP, weight: 'regular' });
  }

  // ------------------------------------------------------------------ ciclo-agente (content §5.1 figure)
  // «1. Objetivo» (a person) → «2. Planear» → «3. Actuar» → «4. Observar» → «5. ¿Cumplido?» (a decision)
  // → «6. Entregar» (a person who reviews); «no: ajusta el plan y repite» back to step 2.
  // o = { x, y, w, h, labels [7] (steps 1–6, then the way back), q [7], active (step index the agent runs),
  //       agent (false hides the lamp), agentP, t, icons, limits (lines under step 1), size }
  R['ciclo-agente'] = function (ctx, o) {
    var L = labels(o, 'ciclo-agente');
    var x = o.x == null ? 60 : o.x, y = o.y == null ? 80 : o.y, w = o.w || 1160, h = o.h || 380;
    var bw = o.boxW || Math.min(186, w * 0.16), bh = o.boxH || 68, size = o.size || 18;
    var c1 = x + bw / 2, c2 = x + w * 0.3, c3 = x + w * 0.64, c4 = x + w - bw / 2;
    var yt = y + bh / 2 + 4, yb = y + h * 0.62;
    var dw = bw * 0.64, dh = bh * 0.8;
    var pos = [[c1, yb], [c2, yb], [c2, yt], [c3, yt], [c3, yb], [c4, yb]];
    var boxes = pos.map(function (c) { return { x: c[0] - bw / 2, y: c[1] - bh / 2, w: bw, h: bh, cx: c[0], cy: c[1] }; });
    boxes[4] = { x: c3 - dw, y: yb - dh, w: dw * 2, h: dh * 2, cx: c3, cy: yb };
    var arrows = [
      [[c1 + bw / 2 + 6, yb], [c2 - bw / 2 - 10, yb]],
      [[c2, yb - bh / 2 - 6], [c2, yt + bh / 2 + 10]],
      [[c2 + bw / 2 + 6, yt], [c3 - bw / 2 - 10, yt]],
      [[c3, yt + bh / 2 + 6], [c3, yb - dh - 8]],
      [[c3 + dw + 4, yb], [c4 - bw / 2 - 10, yb]]
    ];
    arrows.forEach(function (a, k) {
      var aq = Math.min(q(o, k), q(o, k + 1));
      if (aq > 0) C.arrow(ctx, a[0], a[1], { p: aq, weight: 'thin', head: 11, seed: 400 + k });
    });
    // the way back, under the loop
    var bq = q(o, 6), back = { x: (c2 + c3) / 2, y: yb + bh / 2 + 80 };
    if (bq > 0) {
      C.arrow(ctx, [c3 - dw * 0.25, yb + dh * 0.78 + 4], [c2 + bw * 0.12, yb + bh / 2 + 8], { p: bq, curve: -44, weight: 'regular', head: 13, seed: 407 });
      S.text(ctx, L[6] || '', back.x, back.y, { size: o.backSize || 19, weight: 700, align: 'center', p: E.segment(bq, 0.4, 1), maxWidth: c3 - c2 + 80 });
    }
    // the agent in the middle of its loop
    var lamp = null;
    if (o.agent !== false) {
      lamp = { x: (c2 + c3) / 2, y: (yt + yb) / 2 + (o.lampDy == null ? 12 : o.lampDy), r: o.lampR || 34 };
      var lq = o.agentP == null ? q(o, 1) : o.agentP;
      if (lq > 0) C.lamp(ctx, 'agente', { x: lamp.x, y: lamp.y, r: lamp.r, p: lq, t: o.t, still: o.still });
    }
    boxes.forEach(function (b, i) {
      var bq2 = q(o, i);
      if (bq2 <= 0) return;
      var active = o.active === i;
      if (i === 4) {
        var a = S.appear('bloom', bq2);
        alpha(ctx, a.alpha);
        var dia = closed([[b.cx, b.cy - dh], [b.cx + dw, b.cy], [b.cx, b.cy + dh], [b.cx - dw, b.cy]]);
        S.fill(ctx, dia, { role: active ? 'accent-2' : 'ground-2', seed: 410, offset: active, texture: active });
        S.stroke(ctx, P.wobble(dia, 411, 1), { weight: active ? 'bold' : 'regular', closed: true, taper: false, swell: 0.25, seed: 411 });
        S.text(ctx, L[4] || '', b.cx, b.cy + size * 0.36, { size: size, weight: 700, align: 'center', maxWidth: dw * 1.25, vcenter: true, lineHeight: 1.1 });
        ctx.restore();
        return;
      }
      var human = i === 0 || i === 5;
      C.box(ctx, b, { p: bq2, role: active ? 'accent-2' : (human ? 'ground' : 'accent-5'), weight: active || human ? 'bold' : 'regular', seed: 412 + i });
      var lx = b.cx, lw = bw - 24, ly = b.cy + size * 0.36;
      if (human && o.icons !== false) { personIcon(ctx, b.x + 28, b.cy + 3, 24, bq2, 420 + i); lx = b.cx + 18; lw = bw - 64; }
      if (i === 0 && o.limits) {
        ly = b.cy - 4;
        [0, 1].forEach(function (k) { S.stroke(ctx, [[lx - lw / 2 + 4, b.cy + 12 + k * 9], [lx + lw / 2 - 4 - k * 26, b.cy + 12 + k * 9]], { weight: 'hair', taper: false, p: E.segment(bq2, 0.5, 1), seed: 425 + k }); });
      }
      S.text(ctx, L[i] || '', lx, ly, { size: size, weight: 700, align: 'center', p: bq2, maxWidth: lw, vcenter: true, lineHeight: 1.1 });
    });
    return { boxes: boxes, lamp: lamp, back: back };
  };

  // ------------------------------------------------------------------ dialogo-permiso (content §5.3 demo)
  // a permission card «El agente pide permiso para:» with «Aprobar» and «Rechazar»; the request itself is a
  // command strip in the machine manner. o = { x, y, w, labels [3], p, highlight (0→1), choice (0 approve,
  // 1 reject), choiceP, size }
  R['dialogo-permiso'] = function (ctx, o) {
    var L = labels(o, 'dialogo-permiso');
    var w = o.w || 300, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
    var size = o.size || Math.max(15, Math.round(w * 0.056));
    // the card grows to its title: title lines, the command strip, the buttons
    var tl = lineCount(ctx, L[0], size, 700, w - 58), titleH = tl * size * 1.12;
    var sh = Math.max(22, Math.round(size * 1.5)), bh = Math.max(30, Math.round(size * 2));
    var h = o.h || Math.round(16 + titleH + 12 + sh + 12 + bh + 12);
    if (p <= 0) return { x: x, y: y, w: w, h: h };
    var a = S.appear('pop', p);
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(a.scale, a.scale); ctx.translate(-(x + w / 2), -(y + h / 2));
    var hl = o.highlight || 0;
    if (hl > 0) S.fill(ctx, P.blob(x + w / 2, y + h / 2, w * 0.58, h * 0.66, 430, 5, 0.12), { role: 'accent-2', p: hl, seed: 431 });
    var body = rect(x, y, w, h, 14);
    S.fill(ctx, body, { role: 'ground', offset: false, texture: false });
    S.stroke(ctx, P.wobble(body, 432, 1.1), { weight: hl > 0.5 ? 'heavy' : 'bold', closed: true, taper: false, swell: 0.25, seed: 432 });
    S.machine(ctx, 'lamp', { x: x + w - 22, y: y + 22, r: 11, still: true });
    S.text(ctx, L[0] || '', x + 16, y + 14 + size * 0.92, { size: size, weight: 700, maxWidth: w - 58, lineHeight: 1.12 });
    // the request: a command strip (machine manner)
    var sy = y + 16 + titleH + 10;
    S.machine(ctx, 'frame', { x: x + 16, y: sy, w: w - 32, h: sh });
    S.machineLine(ctx, x + 24, sy + sh * 0.3, x + 31, sy + sh * 0.5, 1.4);
    S.machineLine(ctx, x + 31, sy + sh * 0.5, x + 24, sy + sh * 0.7, 1.4);
    S.machine(ctx, 'bar', { x: x + 40, y: sy + sh / 2 - 2, w: (w - 80) * 0.7, h: 4, alpha: 0.8 });
    // the two buttons
    var bwid = (w - 44) / 2, by = y + h - bh - 12;
    [0, 1].forEach(function (k) {
      var bx = x + 16 + k * (bwid + 12);
      var bb = rect(bx, by, bwid, bh, bh / 2);
      S.fill(ctx, bb, { role: k === 0 ? 'accent-2' : 'ground', offset: false, texture: false });
      S.stroke(ctx, bb, { weight: 'thin', closed: true, taper: false, seed: 433 + k });
      S.text(ctx, L[k + 1] || '', bx + bwid / 2, by + bh / 2 + size * 0.36, { size: size, weight: 700, align: 'center', maxWidth: bwid - 10 });
      if (o.choice === k && (o.choiceP || 0) > 0) C.check(ctx, bx + bwid - 2, by - 2, 18, { p: o.choiceP, weight: 'regular' });
    });
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  };

  // ------------------------------------------------------------------ seis-entornos (content §5.2 table)
  // six frames, each with its environment drawn in the machine manner and a small lamp inside.
  // o = { x, y, w, h, cols (3), labels [6], q [6], warn: { label, q } (on «Navegador»), t, size, gap, inner(i, box, q) }
  function envPicto(ctx, i, b, o) {
    var M = function (k, oo) { return S.machine(ctx, k, oo); };
    var t = o.t || 0, cy = b.y + b.h / 2;
    var lr = Math.max(10, Math.min(b.h * 0.2, 24));
    var fw = Math.min(b.w * 0.64, b.h * 1.75), fh = Math.min(b.h * 0.78, fw * 0.62);
    var fx = b.x + (b.w - fw - lr * 2 - 14) / 2, fy = cy - fh / 2;
    var lampX = fx + fw + lr + 14, lampY = cy;
    var k;
    if (i === 0) {
      M('browser', { x: fx, y: fy, w: fw, h: fh, bar: Math.max(7, fh * 0.14) });
      M('card', { x: fx + 8, y: fy + fh * 0.28, w: fw * 0.48, h: fh * 0.17, lines: 1 });
      M('card', { x: fx + fw * 0.44, y: fy + fh * 0.52, w: fw * 0.48, h: fh * 0.17, lines: 1 });
      for (k = 0; k < 3; k++) M('frame', { x: fx + 8 + k * (fh * 0.17 + 5), y: fy + fh * 0.78, w: fh * 0.15, h: fh * 0.13, fill: false });
    } else if (i === 1) {
      M('frame', { x: fx, y: fy, w: fw, h: fh });
      S.machineLine(ctx, fx, fy + fh * 0.16, fx + fw, fy + fh * 0.16, 1.1);
      S.machineLine(ctx, fx + fw * 0.3, fy + fh * 0.16, fx + fw * 0.3, fy + fh, 1);
      M('folder', { x: fx + fw * 0.06, y: fy + fh * 0.36, w: fw * 0.18, h: fh * 0.2 });
      M('folder', { x: fx + fw * 0.06, y: fy + fh * 0.68, w: fw * 0.18, h: fh * 0.2 });
      M('card', { x: fx + fw * 0.38, y: fy + fh * 0.3, w: fw * 0.5, h: fh * 0.24, lines: 2 });
      M('card', { x: fx + fw * 0.38, y: fy + fh * 0.62, w: fw * 0.5, h: fh * 0.24, lines: 2 });
    } else if (i === 2) {
      M('frame', { x: fx, y: fy, w: fw, h: fh });
      for (k = 0; k < 3; k++) {
        var ly = fy + fh * (0.24 + k * 0.25);
        S.machineLine(ctx, fx + 8, ly - 5, fx + 14, ly, 1.3); S.machineLine(ctx, fx + 14, ly, fx + 8, ly + 5, 1.3);
        M('bar', { x: fx + 20, y: ly - 1.5, w: fw * (0.55 - k * 0.12), h: 3, alpha: 0.85 });
      }
    } else if (i === 3) {
      M('frame', { x: fx, y: fy, w: fw, h: fh });
      S.machineLine(ctx, fx + fw * 0.26, fy, fx + fw * 0.26, fy + fh, 1);
      for (k = 0; k < 4; k++) M('bar', { x: fx + 6, y: fy + fh * (0.18 + k * 0.18), w: fw * 0.14, h: 2.5, alpha: 0.6 });
      var ind = [0, 1, 2, 2, 1, 0];
      for (k = 0; k < 6; k++) M('bar', { x: fx + fw * 0.31 + ind[k] * 9, y: fy + fh * (0.14 + k * 0.14), w: fw * (0.5 - ind[k] * 0.08 - (k % 2) * 0.1), h: 2.5, role: k % 3 === 1 ? 'machine-glow-1' : 'machine-line', alpha: 0.85 });
    } else if (i === 4) {
      C.lamp(ctx, 'navegador-agente', { x: b.x + b.w / 2, y: cy - (o.warn ? 14 : 0), w: Math.min(b.w * 0.62, fw * 1.15), h: fh * (o.warn ? 0.76 : 1.02), t: t, still: o.still });
      return;
    } else if (i === 5) {
      var sw = fw, sx = b.x + (b.w - sw) / 2;
      [0, 1].forEach(function (r) {
        var shy = fy + fh * (0.48 + r * 0.46);
        M('shelf', { x: sx, y: shy, w: sw, h: 7 });
        var nc = b.w < 220 ? 3 : 4;
        for (var c = 0; c < nc; c++) {
          var lit = r === 0 && c === 1;
          M('lampParts', { x: sx + sw * (nc === 3 ? 0.18 + c * 0.32 : 0.14 + c * 0.24), y: shy - lr * 0.66 - 2, r: lit ? lr * 0.78 : lr * 0.56, t: t, still: !lit || o.still, dim: !lit });
        }
      });
      return;
    }
    M('lamp', { x: lampX, y: lampY, r: lr, t: t, still: o.still });
  }
  R['seis-entornos'] = function (ctx, o) {
    var L = labels(o, 'seis-entornos');
    var n = L.length, cols = o.cols || 3, rows = Math.ceil(n / cols), gap = o.gap == null ? 24 : o.gap;
    var fw = (o.w - gap * (cols - 1)) / cols, fh = (o.h - gap * (rows - 1)) / rows;
    var size = o.size || 20, head = o.headH || Math.round(size * 2.3);
    var boxes = [];
    for (var i = 0; i < n; i++) {
      var b = { x: o.x + (i % cols) * (fw + gap), y: o.y + Math.floor(i / cols) * (fh + gap), w: fw, h: fh };
      boxes.push(b);
      var fq = q(o, i);
      if (fq <= 0) continue;
      var a = S.appear('rise', fq);
      alpha(ctx, a.alpha);
      ctx.translate(0, a.dy);
      C.box(ctx, b, { p: 1, role: 'ground', weight: 'regular', seed: 440 + i });
      S.text(ctx, L[i] || '', b.x + (o.center ? b.w / 2 : 14), b.y + head * 0.62, { size: size, weight: 700, align: o.center ? 'center' : 'left', maxWidth: b.w - 24, maxLines: 2, lineHeight: 1.08, vcenter: true });
      var pb = { x: b.x + 10, y: b.y + head, w: b.w - 20, h: o.panelH || (b.h - head - 10) };
      b.panel = pb;
      S.machineArea(ctx, pb.x, pb.y, pb.w, pb.h);
      envPicto(ctx, i, pb, o);
      if (o.warn && i === 4 && (o.warn.q || 0) > 0) {
        var wq = o.warn.q, ws = o.warn.size || 15;
        var tw = S.measure(ctx, o.warn.label || '', ws, 700) + 44, th = ws + 16;
        var tx = pb.x + 8, ty = pb.y + pb.h - th - 6;
        alpha(ctx, E.segment(wq, 0, 0.5));
        var tag = rect(tx, ty, tw, th, th / 2);
        S.fill(ctx, tag, { role: 'accent-2', offset: false, texture: false });
        S.stroke(ctx, tag, { weight: 'thin', closed: true, taper: false, seed: 448 });
        var tri = closed([[tx + 18, ty + 5], [tx + 27, ty + th - 5], [tx + 9, ty + th - 5]]);
        S.stroke(ctx, tri, { weight: 'thin', closed: true, taper: false, seed: 449 });
        S.text(ctx, '!', tx + 18, ty + th - 7, { size: ws - 3, weight: 700, align: 'center' });
        S.text(ctx, o.warn.label || '', tx + 34, ty + th / 2 + ws * 0.36, { size: ws, weight: 700 });
        ctx.restore();
      }
      if (o.inner) o.inner(i, b, fq);
      ctx.restore();
    }
    return { boxes: boxes };
  };

  // ------------------------------------------------------------------ tres-estandares (content §5.2)
  // «AGENTS.md» (a card), «Agent Skills» (a skill folder), «MCP» (a plug, machine manner).
  // o = { x, y, w, labels [3], q [3], s (icon scale), size } · o.only = i draws one small icon at (x, y)
  function standardIcon(ctx, i, x, y, s, p, seed) {
    if (p <= 0) return;
    var a = S.appear('pop', p);
    alpha(ctx, a.alpha);
    ctx.translate(x, y); ctx.scale(a.scale * s, a.scale * s); ctx.translate(-x, -y);
    if (i === 0) {
      page(ctx, x - 32, y - 42, 64, 84, { lines: 4, bar: 'accent-1', seed: seed || 450, weight: 'regular' });
    } else if (i === 1) {
      page(ctx, x - 18, y - 46, 46, 54, { lines: 3, seed: (seed || 450) + 1 });
      folderProp(ctx, { x: x, y: y + 10, w: 92, h: 62, seed: (seed || 450) + 2, role: 'accent-6' });
    } else {
      S.machineArea(ctx, x - 46, y - 32, 92, 64);
      S.machineLine(ctx, x - 40, y, x - 18, y, 2);
      S.machine(ctx, 'plug', { x: x - 9, y: y, s: 18, dir: 1 });
      S.machineLine(ctx, x + 18, y - 9, x + 18, y + 9, 2);
      S.machineCircle(ctx, x + 30, y, 7, 1.5, 'machine-glow-1');
    }
    ctx.restore();
  }
  R['tres-estandares'] = function (ctx, o) {
    var L = labels(o, 'tres-estandares');
    if (o.only != null) { standardIcon(ctx, o.only, o.x, o.y, o.s || 0.4, o.p == null ? 1 : o.p, o.seed); return null; }
    var n = 3, cw = o.w / n, s = o.s || 1, size = o.size || 22, out = [];
    for (var i = 0; i < n; i++) {
      var cx = o.x + cw * i + cw / 2, cy = o.y + 50 * s;
      out.push({ x: cx, y: cy });
      var sq = q(o, i);
      standardIcon(ctx, i, cx, cy, s, sq, 450 + i * 3);
      S.text(ctx, L[i] || '', cx, cy + 60 * s + size, { size: size, weight: 700, align: 'center', p: E.segment(sq, 0.3, 1), maxWidth: cw - 10 });
    }
    return out;
  };

  // ------------------------------------------------------------------ mapa-riesgos (content §5.4 taller)
  // a card with four fields: «Datos sensibles que tengo», «Tareas que delegaría a un agente», «Tareas que
  // nunca delegaría», «Dónde pondría un punto de control humano»; each with a small sign and either blank
  // lines or a value. o = { x, y, w, h, labels [4], values [4], vq [4], p, size, valueSize, variant }
  R['mapa-riesgos'] = function (ctx, o) {
    var L = labels(o, 'mapa-riesgos');
    var x = o.x, y = o.y, w = o.w || 560, h = o.h || 380, p = o.p == null ? 1 : o.p;
    if (p <= 0) return [];
    S.mark(ctx, 'card', { x: x, y: y, w: w, h: h }, { p: p, variant: o.variant || 'accent-1', seed: 460, blob: o.blob });
    var fp = E.segment(p, 0.35, 1);
    var pad = 22, fw = (w - pad * 2) / 2, fh = (h - pad * 2) / 2, top = y + pad;
    S.stroke(ctx, [[x + w / 2, top + 6], [x + w / 2 + 1, top + fh * 2 - 6]], { weight: 'thin', taper: false, p: fp, seed: 461 });
    S.stroke(ctx, [[x + pad + 6, top + fh], [x + w - pad - 6, top + fh + 1]], { weight: 'thin', taper: false, p: fp, seed: 462 });
    var out = [], size = o.size || 18, vs = o.valueSize || 18;
    for (var i = 0; i < 4; i++) {
      var fx = x + pad + (i % 2) * fw, fy = top + Math.floor(i / 2) * fh;
      var box = { x: fx, y: fy, w: fw, h: fh };
      out.push(box);
      // the field's sign, top right
      var ix = fx + fw - 30, iy = fy + 30;
      alpha(ctx, fp);
      if (i === 0) { page(ctx, ix - 14, iy - 19, 28, 36, { lines: 0, seed: 463 }); personIcon(ctx, ix, iy + 2, 15, 1, 464); }
      else if (i === 1 || i === 2) { S.machine(ctx, 'lamp', { x: ix, y: iy, r: 14, still: true }); if (i === 2) C.cross(ctx, ix, iy, 28, { weight: 'regular' }); }
      else C.prop(ctx, 'bandera-control', { x: ix - 10, y: iy + 18, s: 0.4, showLabel: false });
      ctx.restore();
      var head = S.text(ctx, L[i] || '', fx + 14, fy + 30, { size: size, weight: 700, maxWidth: fw - 74, lineHeight: 1.14, maxLines: 3, p: fp });
      var vy = fy + 30 + Math.max(head.height, size * 1.14) + 12;
      var val = o.values ? o.values[i] : null, vq = o.vq ? (o.vq[i] || 0) : 0;
      if (val && vq > 0) {
        S.text(ctx, val, fx + 14, vy + vs * 0.3, { size: vs, weight: 700, role: 'accent-3', maxWidth: fw - 28, lineHeight: 1.18, maxLines: 3, p: vq });
      } else {
        for (var k = 0; k < 2; k++) S.stroke(ctx, [[fx + 14, vy + 4 + k * 26], [fx + fw - 18 - k * 40, vy + 5 + k * 26]], { weight: 'hair', taper: false, p: fp, seed: 465 + i * 3 + k });
      }
    }
    return out;
  };

  // ------------------------------------------------------------------ tabla-riesgos (content §5.4 table)
  // five rows: «Acciones destructivas», «Inyección de instrucciones», «Fuga de datos», «Resultados
  // fabricados», «Costo y dependencia», each with «Cómo se reduce».
  // o = { x, y, w, risks [5], measures [5], headers [2], q [5] (rows), p (frame), rowH, headH, size }
  function dataMeasures(risks) {
    var t = ((NS.data.riesgos || {}).riesgos) || null;
    return risks.map(function (rk, i) {
      if (!t || !t.rows) return null;
      var row = t.rows.filter(function (r) { return r[0] === rk; })[0] || t.rows[i];
      return row ? plain(row[row.length - 1]) : null;
    });
  }
  R['tabla-riesgos'] = function (ctx, o) {
    var L = rot('tabla-riesgos');
    var risks = o.risks || L.slice(0, 5);
    var measures = o.measures || dataMeasures(risks);
    var heads = o.headers || ['', L[5] || ''];
    var size = o.size || 18;
    var rq = function (i) { return o.q && o.q[i] != null ? o.q[i] : (o.p == null ? 1 : o.p); };
    var rows = risks.map(function (rk, i) {
      return [
        function (c, b) { var qq = rq(i); if (qq <= 0) return; S.text(c, rk, b.x + 14, b.y + b.h / 2 + (size + 1) * 0.36, { size: size + 1, weight: 700, maxWidth: b.w - 24, vcenter: true, lineHeight: 1.12, maxLines: 2, p: qq }); },
        function (c, b) {
          var qq = E.segment(rq(i), 0.25, 1); if (qq <= 0) return;
          if (measures[i]) S.text(c, measures[i], b.x + 14, b.y + b.h / 2 + size * 0.36, { size: size, weight: 500, maxWidth: b.w - 26, vcenter: true, lineHeight: 1.16, maxLines: 2, p: qq });
          else S.stroke(c, [[b.x + 14, b.y + b.h / 2], [b.x + 14 + (b.w - 40) * 0.6 * qq, b.y + b.h / 2]], { weight: 'thin', taper: false, seed: 470 + i });
        }
      ];
    });
    return C.table(ctx, { x: o.x, y: o.y, w: o.w, headers: heads, cols: o.cols || [0.33, 0.67], nRows: risks.length, rows: rows, rowH: o.rowH || 74, headH: o.headH || 50, headSize: o.headSize || 18, p: o.p == null ? 1 : o.p, marks: false });
  };

  // ------------------------------------------------------------------ tarjetas-casos (content §5.4 table)
  // incident cards: a date, a one-line case and its lesson; no people, no logos.
  // o = { x, y, w, h, cols, gap, cards: [{ date, text, lesson, q, lq, emph }], size, lessonSize, lessonH }
  R['tarjetas-casos'] = function (ctx, o) {
    var cards = o.cards || [], cols = o.cols || 2, gap = o.gap == null ? 24 : o.gap;
    var rows = Math.ceil(cards.length / cols);
    var cw = (o.w - gap * (cols - 1)) / cols, ch = (o.h - gap * (rows - 1)) / rows;
    var lh = o.lessonH || 64, out = [];
    cards.forEach(function (cd, i) {
      var bx = o.x + (i % cols) * (cw + gap), by = o.y + Math.floor(i / cols) * (ch + gap);
      out.push({ x: bx, y: by, w: cw, h: ch });
      var cq = cd.q == null ? 1 : cd.q;
      if (cq <= 0) return;
      var a = S.appear('rise', cq);
      alpha(ctx, a.alpha);
      ctx.translate(0, a.dy);
      var body = rect(bx, by, cw, ch, 14);
      S.fill(ctx, body, { role: 'ground', offset: false, texture: false });
      var lq = cd.lq || 0;
      if (lq > 0 && cd.emph) S.fill(ctx, rect(bx + 8, by + ch - lh, cw - 16, lh - 8, 10), { role: 'accent-2', p: lq, seed: 480 + i });
      S.stroke(ctx, P.wobble(body, 481 + i, 1.2), { weight: cd.emph && lq > 0.5 ? 'heavy' : 'bold', closed: true, taper: false, swell: 0.25, seed: 481 + i });
      C.pictos.draw(ctx, 'warning-folder', { x: bx + 30, y: by + 30, r: 13 });
      S.text(ctx, cd.date || '', bx + 54, by + 37, { size: o.dateSize || 20, weight: 700 });
      S.text(ctx, cd.text || '', bx + 22, by + 70, { size: o.size || 17, weight: 500, maxWidth: cw - 44, lineHeight: 1.22, maxLines: 4 });
      if (lq > 0) {
        var ly = by + ch - lh;
        S.stroke(ctx, [[bx + 18, ly], [bx + cw - 18, ly + 1]], { weight: 'thin', taper: false, p: lq, seed: 490 + i });
        S.sign(ctx, 'star', { x: bx + 30, y: ly + lh / 2 - 3, r: 8, seed: 491 + i, p: lq, colorCenter: cd.emph ? 'accent-1' : null });
        S.text(ctx, cd.lesson || '', bx + 48, ly + lh / 2 + (o.lessonSize || 18) * 0.3, { size: o.lessonSize || 18, weight: 700, maxWidth: cw - 70, lineHeight: 1.15, maxLines: 2, vcenter: true, p: lq });
      }
      ctx.restore();
    });
    return out;
  };

  // ------------------------------------------------------------------ pagina-oculta (content §5.4 demo)
  // a page of normal lines with one line in `ground` on `ground` (invisible), revealed on cue by a
  // highlight frame. Before the reveal its slot is simply empty; after it, the line appears only inside
  // the labeled frame. o = { x, y, w, h, lines, hiddenAt, p, scan (0→1 reading), reveal (0→1), text,
  // label, size }
  R['pagina-oculta'] = function (ctx, o) {
    var x = o.x, y = o.y, w = o.w || 380, h = o.h || 440, p = o.p == null ? 1 : o.p;
    var n = o.lines || 12, hid = o.hiddenAt == null ? 7 : o.hiddenAt;
    var gapY = (h - 130) / n;
    var lineY = function (k) { return y + 104 + k * gapY; };
    if (p > 0) {
      var f = 36;
      var pts = closed([[x, y], [x + w - f, y], [x + w, y + f], [x + w, y + h], [x, y + h]]);
      S.shape(ctx, pts, { role: 'ground', p: p, seed: 500, weight: 'regular', offset: false, texture: false, wobbleAmp: 1 });
      S.stroke(ctx, [[x + w - f, y + 1], [x + w - f, y + f], [x + w - 1, y + f]], { weight: 'thin', taper: false, p: p, seed: 501 });
      S.fill(ctx, rect(x + 28, y + 34, w * 0.6, 14, 4), { role: 'accent-3', offset: false, texture: false, p: p });
      S.fill(ctx, rect(x + 28, y + 58, w * 0.38, 8, 3), { role: 'ink-soft', offset: false, texture: false, p: p, alpha: 0.6 });
      for (var k = 0; k < n; k++) {
        if (k === hid) continue;
        var end = (k === 3 || k === n - 1) ? 0.62 : 0.92 - (k % 3) * 0.03;
        S.stroke(ctx, [[x + 28, lineY(k)], [x + 28 + (w - 56) * end, lineY(k) + 0.5]], { weight: 'thin', taper: false, p: E.segment(p, k / n * 0.5, k / n * 0.5 + 0.5), seed: 502 + k, alpha: 0.75 });
      }
    }
    var sc = o.scan == null ? 0 : o.scan;
    if (sc > 0 && sc < 1) {
      var sy = y + 18 + (h - 36) * sc;
      S.glow(ctx, x + w / 2, sy, 26, 'machine-glow-1');
      S.machineLine(ctx, x + 8, sy, x + w - 8, sy, 2, 'machine-glow-1');
    }
    var rv = o.reveal || 0, frame = null;
    if (rv > 0) {
      var size = o.size || 16;
      ctx.save();
      ctx.font = '700 ' + size + 'px ' + S.tokens.fonts.body;
      var tl = o.text ? NS.engine.captions.wrap(ctx, NS.util.nbsp(String(o.text)), w - 44).length : 1;
      ctx.restore();
      var fhFull = tl * size * 1.22 + 26, grow = E.inOut(E.segment(rv, 0, 0.4));
      var fh = E.lerp(16, fhFull, grow), fx = x + 8, fw = w - 16, fcy = lineY(hid);
      var fy = fcy - 10 - (fh - 16) * 0.3;
      frame = { x: fx, y: fy, w: fw, h: fh };
      var fr = rect(fx, fy, fw, fh, 8);
      S.fill(ctx, fr, { role: 'accent-2', offset: false, texture: false, p: E.segment(rv, 0, 0.3) });
      S.stroke(ctx, P.wobble(fr, 505, 1), { weight: 'heavy', closed: true, taper: false, swell: 0.25, seed: 505, p: E.segment(rv, 0, 0.45) });
      if (o.text && grow >= 1) S.text(ctx, o.text, fx + 14, fy + 15 + size * 0.95, { size: size, weight: 700, maxWidth: w - 44, lineHeight: 1.22, p: E.segment(rv, 0.45, 1) });
      if (o.label) {
        var ls = o.labelSize || 16, lq = E.segment(rv, 0.3, 0.7);
        ctx.save();
        ctx.font = '700 ' + ls + 'px ' + S.tokens.fonts.body;
        var ll = NS.engine.captions.wrap(ctx, NS.util.nbsp(String(o.label)), fw - 24).length;
        ctx.restore();
        var tagH = ll * ls * 1.18 + 14, tagY = fy - tagH - 4;
        alpha(ctx, lq);
        var tg = rect(fx, tagY, fw, tagH, 8);
        S.fill(ctx, tg, { role: 'ground', offset: false, texture: false });
        S.stroke(ctx, tg, { weight: 'thin', closed: true, taper: false, seed: 506 });
        S.text(ctx, o.label, fx + 12, tagY + 8 + ls * 0.92, { size: ls, weight: 700, maxWidth: fw - 24, lineHeight: 1.18 });
        ctx.restore();
        frame.tagY = tagY;
      }
    }
    return { frame: frame, slot: [x + w / 2, lineY(hid)], page: { x: x, y: y, w: w, h: h } };
  };

  // ------------------------------------------------------------------ salas-herramienta (Sesión 6 · Organización remota)
  // three breakout rooms labeled «OpenCode», «Claude», «ChatGPT», each with a monitor tile (headset).
  // o = { x, y, w, h, labels [3], q [3] (rooms), monitors [cast id or null per room], n (tiles, 4), t, gap }
  R['salas-herramienta'] = function (ctx, o) {
    var L = labels(o, 'salas-herramienta');
    var n = L.length, gap = o.gap == null ? 26 : o.gap, rw = (o.w - gap * (n - 1)) / n;
    var per = o.n || 4, cols = 2, head = 52;
    var tw = (rw - 46) / cols, th = Math.min(tw * 0.66, (o.h - head - 16 - 12) / 2);
    var rooms = [];
    for (var ri = 0; ri < n; ri++) {
      var rx = o.x + ri * (rw + gap), rq = q(o, ri), tiles = [];
      var room = { x: rx, y: o.y, w: rw, h: o.h, tiles: tiles };
      rooms.push(room);
      for (var i = 0; i < per; i++) tiles.push({ x: rx + 18 + (i % cols) * (tw + 10), y: o.y + head + Math.floor(i / cols) * (th + 12), w: tw, h: th });
      if (rq <= 0) continue;
      S.shape(ctx, rect(rx, o.y, rw, o.h, 16), { role: 'ground-2', p: rq, seed: 510 + ri, weight: 'regular', offset: false });
      S.text(ctx, L[ri] || '', rx + rw / 2, o.y + 34, { size: o.size || 21, weight: 700, align: 'center', p: rq, maxWidth: rw - 20 });
      var mon = o.monitors && o.monitors[ri] ? C.castEntry(o.monitors[ri]) : null;
      tiles.forEach(function (tb, k) {
        var tq = E.segment(rq, 0.15 + k * 0.1, 0.55 + k * 0.1);
        if (tq <= 0) return;
        var person = k === 0 && mon ? mon : S.extraLook(301 + ri * 17 + k * 5);
        C.prop(ctx, 'tile', { x: tb.x, y: tb.y, w: tb.w, h: tb.h, p: tq, person: person, t: o.t, seed: 520 + ri * 10 + k, active: k === 0, prop: k === 0 && !mon ? 'headset' : null, ground: 'ground' });
      });
    }
    return { rooms: rooms };
  };

  // ------------------------------------------------------------------ semaforo-lab (Sesión 6 · Organización remota)
  // two signs: a check reaction «Reacción verde: voy bien» and a raised hand «Mano levantada: necesito ayuda».
  // o = { x, y (center line), labels [2], q [2], r, size, gap, vertical }
  function reaction(ctx, x, y, r, p) {
    var b = rect(x - r, y - r, r * 2, r * 2, r * 0.45);
    S.shape(ctx, b, { role: 'accent-4', p: p, seed: 530, weight: 'regular' });
    S.stroke(ctx, [[x - r * 0.48, y + r * 0.02], [x - r * 0.1, y + r * 0.42], [x + r * 0.52, y - r * 0.42]], { weight: 'heavy', role: 'ground', taper: false, swell: 0.2, p: E.segment(p, 0.4, 1), seed: 531 });
  }
  function hand(ctx, x, y, r, p) {
    var fq = E.segment(p, 0, 0.8);
    var fingers = [[-0.42, -0.62, 0.62], [-0.15, -0.86, 0.86], [0.12, -0.8, 0.8], [0.38, -0.6, 0.62]];
    fingers.forEach(function (f, i) {
      S.shape(ctx, rect(x + (f[0] - 0.115) * r, y + f[1] * r, 0.23 * r, f[2] * r + 0.2 * r, 0.115 * r), { role: 'accent-2', p: fq, seed: 532 + i, weight: 'thin', offset: false });
    });
    var th = [[x - 0.52 * r, y + 0.05 * r], [x - 0.92 * r, y - 0.32 * r], [x - 0.8 * r, y - 0.44 * r], [x - 0.42 * r, y - 0.2 * r]];
    th = P.smooth(th, 6); th.push([x - 0.42 * r, y + 0.1 * r]); th = closed(th);
    S.shape(ctx, th, { role: 'accent-2', p: fq, seed: 537, weight: 'thin', offset: false });
    var palm = rect(x - 0.56 * r, y - 0.2 * r, 1.08 * r, 1.0 * r, 0.32 * r);
    S.fill(ctx, palm, { role: 'accent-2', offset: false, texture: false, p: fq });
    var side = [[x - 0.56 * r, y - 0.12 * r], [x - 0.55 * r, y + 0.5 * r], [x - 0.36 * r, y + 0.8 * r], [x + 0.3 * r, y + 0.8 * r], [x + 0.5 * r, y + 0.5 * r], [x + 0.52 * r, y - 0.1 * r]];
    S.stroke(ctx, P.smooth(side, 6), { weight: 'thin', taper: false, p: fq, seed: 538 });
    S.stroke(ctx, [[x - 0.34 * r, y + 0.8 * r], [x - 0.3 * r, y + 1.1 * r]], { weight: 'thin', taper: false, p: fq, seed: 539 });
    S.stroke(ctx, [[x + 0.28 * r, y + 0.8 * r], [x + 0.26 * r, y + 1.1 * r]], { weight: 'thin', taper: false, p: fq, seed: 540 });
  }
  R['semaforo-lab'] = function (ctx, o) {
    var L = labels(o, 'semaforo-lab');
    var r = o.r || 32, size = o.size || 21, gap = o.gap || 54, out = [];
    var x = o.x, y = o.y;
    for (var i = 0; i < 2; i++) {
      var iq = q(o, i);
      var ix = x + r, iy = y;
      out.push({ x: ix, y: iy });
      if (iq > 0) {
        var a = S.appear('pop', iq);
        alpha(ctx, a.alpha);
        ctx.translate(ix, iy); ctx.scale(a.scale, a.scale); ctx.translate(-ix, -iy);
        if (i === 0) reaction(ctx, ix, iy, r, 1); else hand(ctx, ix, iy - r * 0.1, r * 1.05, 1);
        ctx.restore();
        S.text(ctx, L[i] || '', x + r * 2 + 16, y + size * 0.36, { size: size, weight: 700, p: E.segment(iq, 0.3, 1), maxWidth: o.maxWidth || 360, vcenter: true });
      }
      var lw = Math.min(o.maxWidth || 360, S.measure(ctx, L[i] || '', size, 700));
      if (o.vertical) y += r * 2 + (o.vgap || 30); else x += r * 2 + 16 + lw + gap;
    }
    return out;
  };

  // ------------------------------------------------------------------ carpeta-lab (Sesión 6)
  // the folder tree of «lab-ia» as it arrives (the PDFs, the CSV of the DANE, the three interviews and
  // «AGENTS.md») and, after the lab, the items the agent creates («articulos», «analisis», «revisar»,
  // «matriz_literatura.csv»), each marked with a small machine dot. o = { x, y, labels [6], stage
  // ('before' | 'after'), q [root, items], newQ (after items), rowH, size, checks [per row], dim }
  function pdfFan(ctx, x, y, n, p, seed) {
    for (var i = n - 1; i >= 0; i--) page(ctx, x + i * 9, y - 12 - (i % 2) * 2, 17, 23, { lines: 0, seed: (seed || 540) + i, p: p, bar: i % 3 === 0 ? 'accent-1' : null });
  }
  function csvIcon(ctx, x, y, p, seed) { C.prop(ctx, 'csv-sheet', { x: x, y: y - 12, w: 34, cols: 3, rows: 2, rh: 8, p: p, seed: seed || 545 }); }
  function interviews(ctx, x, y, p) {
    for (var i = 0; i < 3; i++) {
      page(ctx, x + i * 22, y - 13, 18, 25, { lines: 2, seed: 547 + i, p: p });
      S.stroke(ctx, P.ellipse(x + i * 22 + 9, y - 16, 6, 4, 14), { weight: 'hair', closed: true, taper: false, p: p, seed: 550 + i });
    }
  }
  function smallFolder(ctx, x, y, p, seed, role) { folderProp(ctx, { x: x + 17, y: y, w: 34, h: 24, p: p, seed: seed || 552, role: role || 'accent-6' }); }
  R['carpeta-lab'] = function (ctx, o) {
    var L = labels(o, 'carpeta-lab');
    var x = o.x, y = o.y, rh = o.rowH || 36, size = o.size || 18;
    var stage = o.stage || 'before';
    var rootQ = q(o, 0), itemQ = q(o, 1), newQ = o.newQ == null ? 1 : o.newQ;
    var rows = stage === 'after'
      ? ['csv', 'interviews', 'agents', 'articles', 'analysis', 'review', 'matrix']
      : ['pdfs', 'csv', 'interviews', 'agents'];
    var isNew = { articles: 1, analysis: 1, review: 1, matrix: 1 };
    var out = { root: { x: x, y: y, w: 200, h: 40 }, rows: [] };
    if (rootQ > 0) {
      folderProp(ctx, { x: x + 26, y: y + 18, w: 50, h: 36, p: rootQ, seed: 555, role: 'accent-6', open: itemQ > 0 });
      S.text(ctx, L[0] || '', x + 62, y + 26, { size: size + 3, weight: 700, p: rootQ });
    }
    var ty = y + 48, tx = x + 26;
    var lastY = ty + (rows.length - 1) * rh + rh / 2;
    if (itemQ > 0) S.stroke(ctx, [[tx, y + 38], [tx + 1, ty + (lastY - ty) * E.clamp(itemQ * 1.4, 0, 1)]], { weight: 'thin', taper: false, seed: 556 });
    rows.forEach(function (key, i) {
      var ry = ty + i * rh, cy = ry + rh / 2;
      var row = { key: key, x: tx + 30, y: ry, w: 300, h: rh, cy: cy, isNew: !!isNew[key] };
      out.rows.push(row);
      var iq = E.stagger(itemQ, i, rows.length, 0.6);
      if (isNew[key]) iq = Math.min(iq, newQ);
      if (iq <= 0) return;
      alpha(ctx, (o.dim ? 1 - o.dim * 0.6 : 1));
      S.stroke(ctx, [[tx, cy], [tx + 22, cy + 0.5]], { weight: 'thin', taper: false, p: iq, seed: 557 + i });
      var ix = tx + 30, lab = null, endX = ix;
      if (key === 'pdfs') { pdfFan(ctx, ix, cy, 10, iq, 560); endX = ix + 106; }
      else if (key === 'csv') { csvIcon(ctx, ix, cy, iq, 571); endX = ix + 36; }
      else if (key === 'interviews') { interviews(ctx, ix, cy, iq); endX = ix + 62; }
      else if (key === 'agents') { page(ctx, ix + 4, cy - 13, 22, 26, { lines: 2, bar: 'accent-1', seed: 574, p: iq }); lab = L[1]; endX = ix + 30; }
      else if (key === 'matrix') { csvIcon(ctx, ix, cy, iq, 575); lab = L[5]; endX = ix + 36; }
      else {
        smallFolder(ctx, ix, cy, iq, 576 + i);
        lab = key === 'articles' ? L[2] : key === 'analysis' ? L[3] : L[4];
        endX = ix + 36;
        if (key === 'articles') { pdfFan(ctx, ix + 46 + S.measure(ctx, lab || '', size, 700) + 12, cy, 4, iq, 580); }
      }
      if (lab) {
        S.text(ctx, lab, endX + 10, cy + size * 0.36, { size: size, weight: 700, p: iq });
        endX += 10 + S.measure(ctx, lab, size, 700);
        if (key === 'articles') endX += 12 + 4 * 9 + 17;
      }
      if (isNew[key] && o.markNew !== false) {
        S.machine(ctx, 'node', { x: endX + 14, y: cy, r: 5, on: iq });
      }
      row.endX = endX + (isNew[key] ? 22 : 0);
      ctx.restore();
      var ck = o.checks ? (o.checks[i] || 0) : 0;
      if (ck > 0) C.check(ctx, row.endX + 22, cy - 2, 18, { p: ck, weight: 'regular' });
    });
    out.bottom = ty + rows.length * rh;
    return out;
  };

  // ------------------------------------------------------------------ matriz-literatura (Sesión 6 · Parte B)
  // a table with the headers «archivo», «autores», «año», «título», «fuente», «pregunta», «método»,
  // «datos», «hallazgo principal». o = { x, y, w, headers, nRows, fill, cells: { 'r:c': { text, q } },
  // rowH, headH, headSize, size, cols, highlight: { r, q } }
  R['matriz-literatura'] = function (ctx, o) {
    var H = o.headers || rot('matriz-literatura');
    var cols = o.cols || [0.11, 0.1, 0.07, 0.11, 0.1, 0.11, 0.1, 0.11, 0.19];
    var nr = o.nRows || 3, size = o.size || 15;
    var rows = [];
    for (var r = 0; r < nr; r++) {
      var row = [];
      for (var c = 0; c < H.length; c++) {
        var cell = o.cells ? o.cells[r + ':' + c] : null;
        row.push(cell ? (function (cl) {
          return function (cx2, b) {
            var cq = cl.q == null ? 1 : cl.q; if (cq <= 0) return;
            S.fill(cx2, rect(b.x + 4, b.y + 5, b.w - 8, b.h - 10, 6), { role: 'accent-2', offset: false, texture: false, p: cq });
            S.text(cx2, cl.text, b.x + b.w / 2, b.y + b.h / 2 + size * 0.36, { size: size, weight: 700, align: 'center', maxWidth: b.w - 10, vcenter: true, lineHeight: 1.08, maxLines: 2, p: cq });
          };
        })(cell) : null);
      }
      rows.push(row);
    }
    return C.table(ctx, { x: o.x, y: o.y, w: o.w, headers: H, cols: cols, nRows: nr, rows: rows, fill: o.fill, rowH: o.rowH || 42, headH: o.headH || 56, headSize: o.headSize || 15, p: o.p == null ? 1 : o.p, highlightRow: o.highlightRow });
  };

  // ------------------------------------------------------------------ etapas-gratuitas (Sesión 7 table)
  // a row of stage cards «Buscar», «Mapear», «Leer y sintetizar», «Extraer», «Analizar datos», «Datos
  // sensibles», «Referencias», each with a tool slot (empty, dashed, until its tools fill it).
  // o = { x, y, w, h, labels [7], q [7], tools [[names] per stage], toolQ [7], slotH, size, toolSize, revisar }
  R['etapas-gratuitas'] = function (ctx, o) {
    var L = labels(o, 'etapas-gratuitas');
    var n = L.length, gap = o.gap == null ? 12 : o.gap, cw = (o.w - gap * (n - 1)) / n, ch = o.h || 220;
    var slotH = o.slotH || Math.round(ch * 0.5), size = o.size || 18, ts = o.toolSize || 15;
    var out = [];
    for (var i = 0; i < n; i++) {
      var b = { x: o.x + i * (cw + gap), y: o.y, w: cw, h: ch };
      var sb = { x: b.x + 9, y: b.y + ch - slotH - 9, w: cw - 18, h: slotH };
      b.slot = sb;
      out.push(b);
      var cq = q(o, i);
      if (cq <= 0) continue;
      C.box(ctx, b, { p: cq, role: 'ground', weight: 'regular', seed: 600 + i });
      S.text(ctx, L[i] || '', b.x + cw / 2, b.y + (ch - slotH - 9) / 2 + size * 0.36, { size: size, weight: 700, align: 'center', maxWidth: cw - 14, vcenter: true, lineHeight: 1.08, maxLines: 2, p: cq });
      if (o.revisar) C.pictos.draw(ctx, 'calendar-cycle', { x: b.x + cw - 15, y: b.y + 15, r: 8, p: cq });
      var tq = o.toolQ ? (o.toolQ[i] || 0) : 0, tools = o.tools ? o.tools[i] : null;
      if (tq > 0 && tools && tools.length) {
        var sr = rect(sb.x, sb.y, sb.w, sb.h, 12);
        S.fill(ctx, sr, { role: 'accent-5', p: E.segment(tq, 0, 0.6), seed: 610 + i });
        S.stroke(ctx, P.wobble(sr, 611 + i, 0.8), { weight: 'thin', closed: true, taper: false, p: E.segment(tq, 0, 0.6), seed: 611 + i });
        ctx.save();
        ctx.font = '700 ' + ts + 'px ' + S.tokens.fonts.body;
        var lines = [];
        tools.forEach(function (tn) { NS.engine.captions.wrap(ctx, NS.util.nbsp(String(tn)), sb.w - 12).forEach(function (l, k) { lines.push({ t: l, first: k === 0 }); }); });
        ctx.restore();
        var lh = ts * 1.16, tot = lines.length * lh + (tools.length - 1) * 4;
        var yy = sb.y + sb.h / 2 - tot / 2 + ts * 0.86;
        lines.forEach(function (ln, k) {
          if (k > 0 && ln.first) yy += 4;
          S.text(ctx, ln.t, sb.x + sb.w / 2, yy, { size: ts, weight: 700, align: 'center', p: E.segment(tq, 0.3, 1) });
          yy += lh;
        });
      } else {
        dashed(ctx, rect(sb.x, sb.y, sb.w, sb.h, 12), { p: cq, weight: 'thin' });
      }
    }
    return out;
  };

  // ------------------------------------------------------------------ pregunta-estructurada (Sesión 7)
  // four boxes: «población», «fenómeno», «resultado», «contexto», each with its color strip.
  // o = { x, y, w, h, labels [4], values [4], q [4], vq [4], size, valueSize, roles }
  var QROLES = ['accent-2', 'accent-5', 'accent-1', 'accent-6'];
  R['pregunta-estructurada'] = function (ctx, o) {
    var L = labels(o, 'pregunta-estructurada');
    var gap = o.gap == null ? 22 : o.gap, bw = (o.w - gap * 3) / 4, bh = o.h || 170;
    var roles = o.roles || QROLES, out = [];
    for (var i = 0; i < 4; i++) {
      var b = { x: o.x + i * (bw + gap), y: o.y, w: bw, h: bh };
      out.push(b);
      var cq = q(o, i);
      if (cq <= 0) continue;
      C.box(ctx, b, { p: cq, role: 'ground', weight: 'bold', seed: 620 + i });
      S.fill(ctx, rect(b.x + 12, b.y + 12, bw - 24, 12, 6), { role: roles[i], p: cq, seed: 625 + i });
      S.text(ctx, L[i] || '', b.x + bw / 2, b.y + 56, { size: o.size || 21, weight: 700, align: 'center', p: cq, maxWidth: bw - 20 });
      var vq = o.vq ? (o.vq[i] || 0) : 0;
      if (o.values && vq > 0) S.text(ctx, o.values[i], b.x + bw / 2, b.y + 70 + (bh - 70) / 2 + 6, { size: o.valueSize || 20, weight: 700, role: 'accent-3', align: 'center', maxWidth: bw - 28, vcenter: true, lineHeight: 1.15, maxLines: 3, p: vq });
      else S.stroke(ctx, [[b.x + 24, b.y + bh - 40], [b.x + bw - 24, b.y + bh - 39]], { weight: 'hair', taper: false, p: cq, seed: 630 + i });
    }
    return out;
  };

  // ------------------------------------------------------------------ matriz-antecedentes (Sesión 7 · Parte A)
  // a table with the headers «Referencia (APA 7)», «País y periodo», «Datos», «Método», «Hallazgo
  // principal», «Limitaciones», «¿Verificada?»; the last column holds a box per row and its check.
  // o = { x, y, w, headers, nRows, fill, checks [per row], rowH, headH, headSize, p }
  R['matriz-antecedentes'] = function (ctx, o) {
    var H = o.headers || rot('matriz-antecedentes');
    var nr = o.nRows || 3, rows = [];
    for (var r = 0; r < nr; r++) {
      var row = [];
      for (var c = 0; c < H.length - 1; c++) row.push(null);
      row.push((function (rr) {
        return function (cx2, b, qq) {
          var s = Math.min(26, b.h - 16);
          checkbox(cx2, b.x + b.w / 2 - s / 2, b.y + b.h / 2 - s / 2, s, o.checks ? (o.checks[rr] || 0) : 0, qq);
        };
      })(r));
      rows.push(row);
    }
    return C.table(ctx, { x: o.x, y: o.y, w: o.w, headers: H, cols: o.cols || [0.2, 0.14, 0.1, 0.11, 0.18, 0.14, 0.13], nRows: nr, rows: rows, fill: o.fill, rowH: o.rowH || 50, headH: o.headH || 60, headSize: o.headSize || 16, p: o.p == null ? 1 : o.p });
  };

  // ------------------------------------------------------------------ tres-rutas (Sesión 7 · Parte B)
  // three route cards: «Ruta 1. Datos cuantitativos», «Ruta 2. Textos y entrevistas», «Ruta 3. Datos
  // sensibles con un modelo local»; the active one opens onto a panel below it.
  // o = { x, y, w, labels [3], q [3], active, tabH, panelH, panelQ, size }
  R['tres-rutas'] = function (ctx, o) {
    var L = labels(o, 'tres-rutas');
    var gap = o.gap == null ? 16 : o.gap, tw = (o.w - gap * 2) / 3, th = o.tabH || 62;
    var act = o.active == null ? -1 : o.active, pq = o.panelQ || 0, out = { tabs: [], panel: null };
    if (act >= 0 && o.panelH) {
      var pb = { x: o.x, y: o.y + th + 10, w: o.w, h: o.panelH };
      out.panel = pb;
      if (pq > 0) {
        var a = S.appear('bloom', pq);
        alpha(ctx, a.alpha);
        var pr = rect(pb.x, pb.y, pb.w, pb.h, 16);
        S.fill(ctx, pr, { role: 'ground', offset: false, texture: false });
        S.stroke(ctx, P.wobble(pr, 640, 1.2), { weight: 'bold', closed: true, taper: false, swell: 0.25, seed: 640 });
        ctx.restore();
      }
    }
    for (var i = 0; i < 3; i++) {
      var b = { x: o.x + i * (tw + gap), y: o.y, w: tw, h: th };
      out.tabs.push(b);
      var cq = q(o, i);
      if (cq <= 0) continue;
      C.box(ctx, b, { label: L[i] || '', size: o.size || 19, role: i === act ? 'accent-2' : 'ground', weight: i === act ? 'bold' : 'regular', p: cq, seed: 645 + i, maxLines: 2 });
    }
    return out;
  };

  // ------------------------------------------------------------------ libro-codigos (Sesión 7 · Ruta 2)
  // a codebook with tabs «ingreso», «protección social», «autonomía», «barreras para formalizarse»: each
  // code has a colored tab at the book's edge and its row on the page. o = { x, y, w, h, labels [4],
  // p, tabsQ [4], roles, size, icon (no words, for small sizes) }
  var CODE_ROLES = ['accent-3', 'accent-2', 'accent-1', 'accent-4'];
  R['libro-codigos'] = function (ctx, o) {
    var L = labels(o, 'libro-codigos');
    var x = o.x, y = o.y, w = o.w || 320, h = o.h || 230, p = o.p == null ? 1 : o.p;
    var roles = o.roles || CODE_ROLES, n = L.length || 4;
    if (p <= 0) return null;
    var rowH = (h - 34) / n, out = [];
    // one size for every code, small enough that the longest one fits on its line
    var size = o.size || 18, room = w - 96;
    L.forEach(function (lb) { while (size > 13 && S.measure(ctx, lb || '', size, 700) > room) size -= 1; });
    for (var i = 0; i < n; i++) {
      var tq = o.tabsQ ? (o.tabsQ[i] == null ? p : o.tabsQ[i]) : p;
      var ty = y + 18 + i * rowH;
      if (tq > 0) S.shape(ctx, rect(x + w - 14, ty + rowH * 0.18, 34, rowH * 0.64, 6), { role: roles[i % roles.length], p: tq, seed: 650 + i, weight: 'thin' });
    }
    S.shape(ctx, rect(x, y, w, h, 12), { role: 'accent-3', p: p, seed: 655, weight: 'regular' });
    S.shape(ctx, rect(x + 18, y + 8, w - 30, h - 16, 8), { role: 'ground', p: p, seed: 656, weight: 'thin', offset: false, texture: false });
    for (var k = 0; k < n; k++) {
      var tq2 = o.tabsQ ? (o.tabsQ[k] == null ? p : o.tabsQ[k]) : p;
      var ry = y + 18 + k * rowH, cy = ry + rowH / 2;
      out.push({ x: x + 18, y: ry, w: w - 30, h: rowH, cy: cy });
      if (tq2 <= 0) continue;
      S.fill(ctx, rect(x + 32, cy - 9, 18, 18, 5), { role: roles[k % roles.length], p: tq2, seed: 660 + k });
      S.stroke(ctx, rect(x + 32, cy - 9, 18, 18, 5), { weight: 'hair', closed: true, taper: false, p: tq2, seed: 664 + k });
      if (o.icon) {
        S.stroke(ctx, [[x + 60, cy - 2], [x + w - 40 - (k % 2) * 30, cy - 1]], { weight: 'thin', taper: false, p: tq2, seed: 668 + k });
      } else {
        S.text(ctx, L[k] || '', x + 60, cy + size * 0.2, { size: size, weight: 700, p: tq2 });
        S.stroke(ctx, [[x + 60, cy + size * 0.2 + 8], [x + w - 44 - (k % 2) * 40, cy + size * 0.2 + 9]], { weight: 'hair', taper: false, p: tq2, seed: 672 + k });
      }
    }
    return out;
  };
})(window.IAHI);
