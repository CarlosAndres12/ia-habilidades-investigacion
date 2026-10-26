/* Shared layouts of this course's signs and widgets (spec §9.1): labeled boxes, calligraphic
   arrows, cycles and loops (`ciclo-token`, `ciclo-agente`, `bucle-mejora`, `ciclo-busqueda`), flows
   (`diagrama-flujo`), tables (`tabla-privacidad`, `tabla-riesgos`, `matriz-literatura`,
   `matriz-antecedentes`, `bitacora`), grids of frames, rings, legend chips and badges. Stamps live in stamps.js.
   Built only from the style API; every label comes from the caller (scene texts or data). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;

  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 10 : r); }

  // A labeled box: o = { label, sub, role (fill), p, seed, size, subSize, align, weight, lines, dashed }
  C.box = function (ctx, b, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return b;
    var a = S.appear(o.motion || 'bloom', p);
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2 + a.dy); ctx.scale(a.scale, a.scale); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    var shape = rect(b.x, b.y, b.w, b.h, o.r == null ? 12 : o.r);
    if (o.role !== false) S.fill(ctx, shape, { role: o.role || 'ground', offset: o.role && o.role !== 'ground', texture: !!o.role && o.role !== 'ground', seed: o.seed || 3 });
    S.stroke(ctx, P.wobble(shape, (o.seed || 3) + 1, 1.1), { weight: o.weight || 'regular', closed: true, taper: false, swell: 0.25, seed: o.seed || 3 });
    var size = o.size || 20, tx = o.align === 'left' ? b.x + 16 : b.x + b.w / 2;
    var textRole = o.textRole || (o.role === 'dark' || o.role === 'accent-3' || o.role === 'ink' ? 'on-dark' : 'ink');
    var mw = b.w - 24;
    if (o.label) {
      var ly = o.sub ? b.y + (o.labelY || size + 14) : b.y + b.h / 2 + size * 0.35;
      if (!o.sub && o.vcenter !== false) {
        S.text(ctx, o.label, tx, b.y + b.h / 2 + size * 0.35, { size: size, weight: 700, align: o.align === 'left' ? 'left' : 'center', maxWidth: mw, vcenter: true, lineHeight: 1.18, role: textRole, maxLines: o.maxLines || 4 });
      } else {
        S.text(ctx, o.label, tx, ly, { size: size, weight: 700, align: o.align === 'left' ? 'left' : 'center', maxWidth: mw, lineHeight: 1.18, role: textRole, maxLines: o.maxLines || 3 });
      }
    }
    if (o.sub) {
      S.text(ctx, o.sub, tx, b.y + (o.subY || (size + 14 + (o.subGap || 30))), { size: o.subSize || 16, weight: 500, align: o.align === 'left' ? 'left' : 'center', maxWidth: mw, lineHeight: 1.2, role: o.subRole || (textRole === 'on-dark' ? 'on-dark' : 'ink-soft'), maxLines: o.subLines || 4 });
    }
    if (o.lines) {
      for (var i = 0; i < o.lines; i++) {
        var yy = b.y + (o.linesY || b.h * 0.45) + i * 18;
        S.stroke(ctx, [[b.x + 18, yy], [b.x + b.w - (i === o.lines - 1 ? b.w * 0.4 : 18), yy]], { weight: 'hair', taper: false, seed: i + 7 });
      }
    }
    ctx.restore();
    return b;
  };

  // Repaint the bare paper of the scene's background inside a region (to keep a zone clean).
  C.clearRegion = function (ctx, x, y, w, h, seed) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    S.background(ctx, 'explain', { W: 1280, H: 720, seed: seed || 1 });
    ctx.restore();
  };

  C.label = function (ctx, text, x, y, o) {
    o = o || {};
    return S.text(ctx, text, x, y, Object.assign({ size: 20, weight: 700 }, o));
  };

  // A calligraphic arrow; o = { p, curve (bend, px), weight, head (size), role, dashed }
  C.arrow = function (ctx, from, to, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    var mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2;
    var dx = to[0] - from[0], dy = to[1] - from[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
    var bend = o.curve || 0;
    var mid = [mx - dy / d * bend, my + dx / d * bend];
    var pts = bend ? P.smooth([from, mid, to], 12) : P.resample([from, to], 6);
    S.stroke(ctx, pts, { weight: o.weight || 'regular', p: p, seed: o.seed || 5, role: o.role, taper: false, swell: 0.3 });
    if (p >= 0.97 && o.head !== false) {
      var tail = pts[Math.max(0, pts.length - 4)];
      var ang = Math.atan2(to[1] - tail[1], to[0] - tail[0]), hs = o.head || 14;
      S.stroke(ctx, [[to[0] - Math.cos(ang - 0.5) * hs, to[1] - Math.sin(ang - 0.5) * hs], to, [to[0] - Math.cos(ang + 0.5) * hs, to[1] - Math.sin(ang + 0.5) * hs]], { weight: o.weight || 'regular', seed: (o.seed || 5) + 1, role: o.role, taper: false, swell: 0.2 });
    }
  };

  C.check = function (ctx, x, y, s, o) {
    o = o || {};
    S.stroke(ctx, [[x - s * 0.5, y], [x - s * 0.12, y + s * 0.4], [x + s * 0.55, y - s * 0.45]], { weight: o.weight || 'bold', p: o.p, taper: false, swell: 0.2, seed: o.seed || 3 });
  };
  C.cross = function (ctx, x, y, s, o) {
    o = o || {};
    S.stroke(ctx, [[x - s / 2, y - s / 2], [x + s / 2, y + s / 2]], { weight: o.weight || 'regular', p: o.p, taper: false, seed: 4 });
    S.stroke(ctx, [[x + s / 2, y - s / 2], [x - s / 2, y + s / 2]], { weight: o.weight || 'regular', p: E.segment(o.p == null ? 1 : o.p, 0.4, 1), taper: false, seed: 5 });
  };
  C.notEqual = function (ctx, x, y, s, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    S.stroke(ctx, [[x - s / 2, y - s * 0.18], [x + s / 2, y - s * 0.18]], { weight: 'bold', p: p, taper: false, seed: 6 });
    S.stroke(ctx, [[x - s / 2, y + s * 0.18], [x + s / 2, y + s * 0.18]], { weight: 'bold', p: p, taper: false, seed: 7 });
    S.stroke(ctx, [[x + s * 0.25, y - s * 0.5], [x - s * 0.25, y + s * 0.5]], { weight: 'bold', p: E.segment(p, 0.4, 1), taper: false, seed: 8 });
  };
  C.approx = function (ctx, x, y, s, o) {
    o = o || {};
    [-0.16, 0.16].forEach(function (dy, i) {
      var pts = []; for (var k = 0; k <= 12; k++) { var u = k / 12; pts.push([x - s / 2 + u * s, y + dy * s + Math.sin(u * Math.PI * 2) * s * 0.08]); }
      S.stroke(ctx, pts, { weight: 'bold', p: o.p, taper: false, seed: 9 + i });
    });
  };
  // A bracket between x1 and x2 at height y (pointing down), with an optional label above
  C.bracket = function (ctx, x1, x2, y, o) {
    o = o || {};
    var h = o.h || 14, p = o.p == null ? 1 : o.p;
    S.stroke(ctx, [[x1, y + h], [x1, y], [x2, y], [x2, y + h]], { weight: 'thin', p: p, taper: false, seed: 10 });
    if (o.label) S.text(ctx, o.label, (x1 + x2) / 2, y - 10, { size: o.size || 17, weight: 700, align: 'center', p: p, maxWidth: o.maxWidth || Math.max(160, x2 - x1 + 120) });
  };

  // Steps placed around a circle and joined by curved arrows; o = { cx, cy, r, labels, p (overall),
  // stepP (array or fn i -> 0..1), active, boxW, boxH, size, back: { from, to, label }, roles }
  C.cycle = function (ctx, o) {
    var n = o.labels.length, r = o.r || 220, rx = o.rx || r, ry = o.ry || r * 0.72;
    var bw = o.boxW || 190, bh = o.boxH || 64;
    var pos = [];
    var a0 = o.start == null ? -Math.PI / 2 : o.start;
    for (var i = 0; i < n; i++) {
      var a = a0 + i * Math.PI * 2 / n;
      pos.push([o.cx + Math.cos(a) * rx, o.cy + Math.sin(a) * ry, a]);
    }
    function sp(i) { if (typeof o.stepP === 'function') return o.stepP(i); if (o.stepP) return o.stepP[i] == null ? 1 : o.stepP[i]; return E.stagger(o.p == null ? 1 : o.p, i, n, 0.75); }
    // arrows first, under the boxes
    for (var k = 0; k < n; k++) {
      if (o.closed === false && k === n - 1) break;
      var q = Math.min(sp(k), sp((k + 1) % n));
      if (q <= 0) continue;
      var A = pos[k], B = pos[(k + 1) % n];
      var am = (A[2] + (B[2] < A[2] ? B[2] + Math.PI * 2 : B[2])) / 2;
      var mid = [o.cx + Math.cos(am) * rx * 1.08, o.cy + Math.sin(am) * ry * 1.08];
      // start and end on the boxes' edges (plus a small gap), whatever their proportions
      var edge = function (pt, toward, gap) {
        var dx = toward[0] - pt[0], dy = toward[1] - pt[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / d, uy = dy / d;
        var t = Math.min(ux ? (bw / 2) / Math.abs(ux) : Infinity, uy ? (bh / 2) / Math.abs(uy) : Infinity);
        return [pt[0] + ux * (t + gap), pt[1] + uy * (t + gap)];
      };
      var from = edge([A[0], A[1]], mid, 6), to = edge([B[0], B[1]], mid, 9);
      C.arrow(ctx, from, to, { p: q, curve: 18, weight: 'thin', head: 11, seed: 20 + k });
    }
    var boxes = [];
    pos.forEach(function (ps, i) {
      var q = sp(i);
      var b = { x: ps[0] - bw / 2, y: ps[1] - bh / 2, w: bw, h: bh };
      boxes.push(b);
      if (q <= 0) return;
      C.box(ctx, b, { label: o.labels[i], p: q, size: o.size || 18, role: o.active === i ? (o.activeRole || 'accent-2') : (o.roles ? o.roles[i] : 'ground'), weight: o.active === i ? 'bold' : 'regular', seed: 30 + i });
    });
    if (o.back) {
      var bq = o.back.p == null ? 1 : o.back.p;
      if (bq > 0) {
        var F0 = boxes[o.back.from], T0 = boxes[o.back.to];
        var from2 = [F0.x + F0.w / 2, F0.y + F0.h + 4], to2 = [T0.x + T0.w / 2, T0.y + T0.h + 4];
        if (o.back.inner) { from2 = [F0.x + F0.w / 2 + (o.cx - F0.x - F0.w / 2) * 0.25, F0.y + F0.h / 2 + (o.cy - F0.y - F0.h / 2) * 0.25]; to2 = [T0.x + T0.w / 2 + (o.cx - T0.x - T0.w / 2) * 0.25, T0.y + T0.h / 2 + (o.cy - T0.y - T0.h / 2) * 0.25]; }
        C.arrow(ctx, from2, to2, { p: bq, curve: o.back.curve == null ? -60 : o.back.curve, weight: 'regular', head: 13, seed: 40 });
        if (o.back.label) S.text(ctx, o.back.label, o.back.lx == null ? o.cx : o.back.lx, o.back.ly == null ? o.cy : o.back.ly, { size: o.back.size || 17, weight: 700, align: 'center', p: bq, maxWidth: o.back.maxWidth || 260 });
      }
    }
    return { boxes: boxes, pos: pos };
  };

  // Stage boxes in a row (or wrapped) joined by arrows; o = { x, y, w, labels, subs, flags (indexes
  // with a bandera-control), p, boxH, gap, size, roles, stepP }
  C.flow = function (ctx, o) {
    var n = o.labels.length, gap = o.gap || 44, bh = o.boxH || 92;
    var perRow = o.perRow || n;
    var bw = (o.w - gap * (perRow - 1)) / perRow;
    var boxes = [];
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / perRow), col = i % perRow;
      var x = o.x + col * (bw + gap), y = o.y + row * (bh + (o.rowGap || 110));
      var q = o.stepP ? o.stepP(i) : E.stagger(o.p == null ? 1 : o.p, i, n, 0.75);
      boxes.push({ x: x, y: y, w: bw, h: bh, q: q });
    }
    boxes.forEach(function (b, i) {
      if (i < n - 1) {
        var nb = boxes[i + 1];
        var q2 = Math.min(b.q, nb.q);
        if (q2 > 0) {
          if (nb.y === b.y) C.arrow(ctx, [b.x + b.w + 6, b.y + b.h / 2], [nb.x - 8, nb.y + nb.h / 2], { p: q2, weight: 'thin', head: 11, seed: 50 + i });
          else C.arrow(ctx, [b.x + b.w / 2, b.y + b.h + 6], [nb.x + nb.w / 2, nb.y - 10], { p: q2, weight: 'thin', head: 11, curve: 40, seed: 50 + i });
        }
      }
      if (b.q <= 0) return;
      C.box(ctx, b, { label: o.labels[i], sub: o.subs ? o.subs[i] : null, p: b.q, size: o.size || 19, subSize: o.subSize || 15, role: o.roles ? o.roles[i] : 'ground', seed: 60 + i, subGap: o.subGap || 26 });
      if (o.flags && o.flags.indexOf(i) >= 0) C.prop(ctx, 'bandera-control', { x: b.x + b.w - 14, y: b.y - 4, s: 0.5, p: b.q, showLabel: false });
    });
    return { boxes: boxes };
  };

  // A hand-drawn table; o = { x, y, w, headers, rows (arrays; null cell = short marks), cols (fractions),
  // rowH, headH, p, fill (0..rows: progressive rows), size, headSize, marks, highlightRow, roles }
  C.table = function (ctx, o) {
    var heads = o.headers || [], nc = heads.length || (o.rows && o.rows[0] ? o.rows[0].length : 1);
    var cols = o.cols || heads.map(function () { return 1 / nc; });
    var rowH = o.rowH || 44, headH = o.headH || 56, w = o.w, x = o.x, y = o.y;
    var rows = o.rows || [];
    var nr = o.nRows == null ? rows.length : o.nRows;
    var h = headH + rowH * nr;
    var p = o.p == null ? 1 : o.p;
    var frame = rect(x, y, w, h, 10);
    S.fill(ctx, frame, { role: 'ground', offset: false, texture: false, p: p });
    S.fill(ctx, rect(x + 3, y + 3, w - 6, headH - 3, 8), { role: o.headRole || 'ground-2', offset: false, texture: false, p: p });
    S.stroke(ctx, P.wobble(frame, 4, 0.8), { weight: 'regular', closed: true, taper: false, p: p, seed: 4 });
    var cx = [x];
    cols.forEach(function (f, i) { cx.push(cx[i] + f * w); });
    for (var c = 1; c < nc; c++) S.stroke(ctx, [[cx[c], y + 4], [cx[c], y + h - 4]], { weight: 'hair', taper: false, p: p, seed: c + 10 });
    S.stroke(ctx, [[x + 4, y + headH], [x + w - 4, y + headH]], { weight: 'thin', taper: false, p: p, seed: 20 });
    for (var r = 1; r < nr; r++) S.stroke(ctx, [[x + 4, y + headH + r * rowH], [x + w - 4, y + headH + r * rowH]], { weight: 'hair', taper: false, p: p, seed: r + 30 });
    var hs = o.headSize || 16;
    heads.forEach(function (hd, i) { S.text(ctx, hd, cx[i] + 10, y + headH / 2 + hs * 0.35, { size: hs, weight: 700, maxWidth: cols[i] * w - 16, vcenter: true, lineHeight: 1.12, maxLines: 3, p: p }); });
    var fill = o.fill == null ? nr : o.fill;
    for (var rr = 0; rr < nr; rr++) {
      var q = E.clamp(fill - rr, 0, 1);
      if (q <= 0) continue;
      var ry = y + headH + rr * rowH;
      if (o.highlightRow === rr) S.fill(ctx, rect(x + 4, ry + 3, w - 8, rowH - 6, 6), { role: 'accent-2', offset: false, alpha: 0.55, p: q });
      for (var cc = 0; cc < nc; cc++) {
        var cell = rows[rr] ? rows[rr][cc] : null;
        if (cell == null || cell === '') {
          if (o.marks !== false) {
            var mw = (cols[cc] * w - 28) * (0.45 + 0.4 * (((rr * 7 + cc * 3) % 5) / 5));
            S.stroke(ctx, [[cx[cc] + 12, ry + rowH / 2], [cx[cc] + 12 + mw * E.clamp(q * nc - cc, 0, 1), ry + rowH / 2]], { weight: 'thin', taper: false, seed: rr * 10 + cc });
          }
        } else if (typeof cell === 'function') {
          cell(ctx, { x: cx[cc], y: ry, w: cols[cc] * w, h: rowH }, q);
        } else {
          S.text(ctx, cell, cx[cc] + 10, ry + rowH / 2 + (o.size || 16) * 0.35, { size: o.size || 16, weight: o.cellWeight || 500, maxWidth: cols[cc] * w - 16, vcenter: true, lineHeight: 1.15, maxLines: o.cellLines || 2, p: q });
        }
      }
    }
    return { x: x, y: y, w: w, h: h, cx: cx, rowH: rowH, headH: headH };
  };

  // Frames in a grid (tool grids, environments); o = { x, y, w, cols, labels, subs, boxH, gap, p, draw(i, box, q) }
  C.grid = function (ctx, o) {
    var n = o.labels.length, cols = o.cols || n, gap = o.gap || 24, bh = o.boxH || 150;
    var bw = (o.w - gap * (cols - 1)) / cols;
    var boxes = [];
    for (var i = 0; i < n; i++) {
      var b = { x: o.x + (i % cols) * (bw + gap), y: o.y + Math.floor(i / cols) * (bh + gap), w: bw, h: bh };
      var q = o.stepP ? o.stepP(i) : E.stagger(o.p == null ? 1 : o.p, i, n, 0.7);
      boxes.push(b);
      if (q <= 0) continue;
      C.box(ctx, b, { label: o.labels[i], sub: o.subs ? o.subs[i] : null, p: q, size: o.size || 18, subSize: o.subSize || 15, labelY: o.labelY || 30, subY: o.subY, vcenter: false, seed: 70 + i, role: o.roles ? o.roles[i] : 'ground' });
      if (o.draw) o.draw(i, b, q);
    }
    return { boxes: boxes };
  };

  // Items placed in a ring around a center; draw(i, x, y, q)
  C.ring = function (ctx, o) {
    var n = o.n, out = [];
    for (var i = 0; i < n; i++) {
      var a = (o.start == null ? -Math.PI / 2 : o.start) + i * Math.PI * 2 / n;
      var x = o.cx + Math.cos(a) * (o.rx || o.r), y = o.cy + Math.sin(a) * (o.ry || o.r);
      var q = o.stepP ? o.stepP(i) : E.stagger(o.p == null ? 1 : o.p, i, n, 0.7);
      out.push([x, y]);
      if (q > 0 && o.draw) o.draw(i, x, y, q);
    }
    return out;
  };

  // Legend chip (slot color + ink outline + sign + label) and a row of them
  C.legendChip = function (ctx, id, x, y, o) { return C.pictos.legendChip(ctx, id, x, y, o); };
  C.legendRow = function (ctx, ids, x, y, o) {
    o = o || {};
    var xx = x;
    ids.forEach(function (id, i) {
      var q = o.stepP ? o.stepP(i) : (o.p == null ? 1 : o.p);
      if (q <= 0) return;
      var r = C.pictos.legendChip(ctx, id, xx, y, { p: q, size: o.size || 19, r: o.r || 20 });
      xx += r.w + (o.gap || 26);
    });
    return xx - x;
  };

  // A badge with its sign when the badge is one of spec §3.2 (text from data or texts)
  C.badge = function (ctx, text, x, y, o) {
    o = o || {};
    var b = (NS.data.badges || {})[text];
    var sign = b && b.sign ? function (c, sx, sy, r) { C.pictos.draw(c, b.sign, { x: sx, y: sy, r: r }); } : null;
    return S.mark(ctx, 'badge', { x: x, y: y, w: o.w || 400, h: 30 }, { text: text, size: o.size || 16, sign: sign, p: o.p, align: o.align });
  };

})(window.IAHI);
