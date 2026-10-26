/* V4 · herramientas-estado-del-arte · «Herramientas de IA para el estado del arte» (spec §11 V4).
   Every on-screen text comes from the scene's `texts`, the figure bank, the cast or the data;
   visual beats follow the voice through s.at(i). */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  function sceneTexts(env, id) {
    var sc = env.video.scenes.filter(function (x) { return x.id === id; })[0];
    return (sc && sc.texts) || {};
  }

  // ------------------------------------------------------------------ shared drawings of this video
  // Articles keep one color each, so the order of two lists can be compared at a glance.
  var ART = ['accent-1', 'accent-3', 'accent-2', 'accent-4', 'accent-6', 'accent-5', 'accent-7'];

  // One row of a result list: a small card with the article's color mark and two lines.
  function resultRow(ctx, env, x, y, w, h, role, p, seed) {
    var S = env.style, P = S.path;
    var a = S.appear('rise', p);
    if (a.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(0, a.dy);
    var box = P.rect(x, y, w, h, 8);
    S.fill(ctx, box, { role: 'ground', offset: false, texture: false });
    S.stroke(ctx, P.wobble(box, seed, 0.8), { weight: 'thin', closed: true, taper: false, swell: 0.2, seed: seed });
    S.fill(ctx, P.rect(x + 8, y + 7, h - 14, h - 14, 4), { role: role, seed: seed + 1 });
    S.stroke(ctx, P.rect(x + 8, y + 7, h - 14, h - 14, 4), { weight: 'hair', closed: true, taper: false, seed: seed + 2 });
    S.stroke(ctx, [[x + h + 4, y + h * 0.38], [x + w - 14, y + h * 0.38 + 1]], { weight: 'thin', taper: false, seed: seed + 3 });
    S.stroke(ctx, [[x + h + 4, y + h * 0.68], [x + w * 0.64, y + h * 0.68 + 1]], { weight: 'hair', taper: false, seed: seed + 4 });
    ctx.restore();
  }
  function resultList(ctx, env, x, y, order, o) {
    var h = o.h || 38, gap = o.gap || 8, w = o.w || 180;
    order.forEach(function (k, i) {
      resultRow(ctx, env, x, y + i * (h + gap), w, h, ART[k % ART.length], E.stagger(o.p == null ? 1 : o.p, i, order.length, 0.7), (o.seed || 100) + i * 7);
    });
    return { x: x, y: y, w: w, h: order.length * (h + gap) - gap };
  }

  // A small machine card with a question mark (the lamp asks the user).
  function questionCard(ctx, env, x, y, p) {
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha *= E.clamp(p * 2, 0, 1);
    env.style.machine(ctx, 'card', { x: x - 16, y: y - 12, w: 32, h: 24, lines: 0 });
    env.style.text(ctx, '?', x, y + 6, { size: 17, weight: 700, align: 'center', role: 'on-dark' });
    ctx.restore();
  }

  // A machine area that fades in (the machine's area switches to the machine roles, style S7).
  function machinePanel(ctx, env, x, y, w, h, p) {
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha *= E.clamp(p * 1.5, 0, 1);
    env.style.machineArea(ctx, x, y, w, h);
    ctx.restore();
  }

  // A tall shelf of records (a bibliographic base): a wooden case full of record cards.
  function recordShelf(ctx, env, x, y, w, h, p, seed) {
    var S = env.style, P = S.path;
    var a = S.appear('rise', p);
    if (a.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(0, a.dy);
    S.shape(ctx, P.rect(x, y, w, h, 8), { role: 'accent-8', seed: seed, weight: 'regular' });
    S.fill(ctx, P.rect(x + 10, y + 10, w - 20, h - 20, 4), { role: 'ground-2', offset: false, texture: false });
    var rows = 6, rh = (h - 20) / rows, r = env.rng(seed);
    for (var i = 0; i < rows; i++) {
      var yy = y + 10 + (i + 1) * rh;
      S.stroke(ctx, [[x + 8, yy], [x + w - 8, yy + 1]], { weight: 'regular', taper: false, seed: seed + 10 + i });
      for (var k = 0, xx = x + 14; xx < x + w - 20; k++) {
        var cw = r.range(7, 12), ch = rh - r.range(8, 16);
        S.fill(ctx, P.rect(xx, yy - ch - 1, cw, ch, 2), { role: r.pick(['ground', 'accent-5', 'ground', 'accent-2', 'accent-6']), offset: false, texture: false });
        S.stroke(ctx, P.rect(xx, yy - ch - 1, cw, ch, 2), { weight: 'hair', closed: true, taper: false, seed: seed + 20 + k });
        xx += cw + r.range(2, 4);
      }
    }
    ctx.restore();
  }

  // A tray (human manner) where sorted cards land; returns its box.
  function tray(ctx, env, x, y, w, h, label, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    S.shape(ctx, P.rect(x, y, w, h, 10), { role: 'ground-2', p: p, seed: seed, weight: 'regular', offset: false });
    S.text(ctx, label, x + w / 2, y + h + 26, { size: 19, weight: 700, align: 'center', p: p, maxWidth: w + 40 });
  }

  // A document page with a folded corner (human manner).
  function page(ctx, env, x, y, w, h, o) {
    var S = env.style, P = S.path;
    o = o || {};
    var fold = o.fold || 28;
    var pts = env.course.v4v8.poly([[x, y], [x + w - fold, y], [x + w, y + fold], [x + w, y + h], [x, y + h]]);
    S.fill(ctx, pts, { role: o.role || 'ground', offset: false, texture: false, p: o.p });
    S.stroke(ctx, P.wobble(pts, (o.seed || 5) + 1, 1), { weight: o.weight || 'bold', closed: true, taper: false, swell: 0.25, seed: o.seed || 5, p: o.p });
    S.stroke(ctx, [[x + w - fold, y + 2], [x + w - fold + 1, y + fold], [x + w - 2, y + fold]], { weight: 'thin', taper: false, seed: (o.seed || 5) + 2, p: o.p });
  }

  // A round seal (norms and policies): a red disc with a star.
  function seal(ctx, env, x, y, r, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    S.fill(ctx, P.circle(x, y, r, 30), { role: 'accent-1', p: p, seed: seed });
    S.stroke(ctx, P.wobble(P.circle(x, y, r, 30), seed + 1, 1), { weight: 'regular', closed: true, taper: false, p: p, seed: seed });
    S.stroke(ctx, P.circle(x, y, r * 0.7, 26), { weight: 'hair', closed: true, taper: false, p: p, seed: seed + 2, role: 'ground' });
    S.sign(ctx, 'star', { x: x, y: y, r: r * 0.42, seed: seed + 3, p: p, role: 'ground' });
  }

  // ------------------------------------------------------------------ the chapter's tool grid
  function toolNames(env) {
    var u = sceneTexts(env, 'undermind'), c = sceneTexts(env, 'consensus'), e = sceneTexts(env, 'elicit');
    return [u.t1, u.t3, c.t1, e.t1, e.t5];
  }
  // a small drawing of each tool, for the columns already seen
  function toolIcon(ctx, env, i, cx, cy) {
    var S = env.style, C = env.course, P = S.path;
    if (i === 0) {
      S.machineArea(ctx, cx - 44, cy - 34, 88, 68);
      C.lamp(ctx, 'lampara', { x: cx - 22, y: cy, r: 14, still: true, glow: false });
      for (var k = 0; k < 6; k++) S.machine(ctx, 'card', { x: cx + (k % 2) * 18, y: cy - 24 + Math.floor(k / 2) * 17, w: 14, h: 12, lines: 1 });
    } else if (i === 1) {
      page(ctx, env, cx - 26, cy - 36, 52, 72, { fold: 12, weight: 'thin', seed: 241 });
      for (var j = 0; j < 4; j++) {
        S.stroke(ctx, [[cx - 18, cy - 14 + j * 13], [cx + 8, cy - 14 + j * 13]], { weight: 'hair', taper: false, seed: 242 + j });
        S.fill(ctx, P.circle(cx + 14, cy - 14 + j * 13, 2.6, 8), { role: 'accent-3', offset: false, texture: false });
      }
    } else if (i === 2) {
      S.machine(ctx, 'gauge', { x: cx, y: cy + 16, r: 34, labels: ['', '', '', ''], needle: 0 });
    } else if (i === 3) {
      S.machine(ctx, 'frame', { x: cx - 40, y: cy - 28, w: 80, h: 56 });
      S.machineLine(ctx, cx - 40, cy - 14, cx + 40, cy - 14, 1);
      for (var r2 = 0; r2 < 3; r2++) for (var c2 = 0; c2 < 3; c2++) S.machine(ctx, 'bar', { x: cx - 34 + c2 * 26, y: cy - 6 + r2 * 11, w: 14 + ((r2 + c2) % 2) * 5, h: 4 });
    } else {
      S.machineArea(ctx, cx - 44, cy - 36, 88, 72);
      S.machine(ctx, 'graph', { x: cx, y: cy, r: 26, n: 8, seed: 5 });
    }
  }
  // The chapter's tool grid: five columns that appear over the chapter. state[i]: 'wide' (the tool
  // being explained), 'seen' (narrow, with its name and its small drawing), 'next' (an empty column).
  function toolGrid(ctx, env, state, o) {
    o = o || {};
    var S = env.style, C = env.course, P = S.path;
    var names = toolNames(env);
    var x0 = 50, x1 = 1230, gap = 10, y = 92, hh = 42, seenW = 112, nextW = 30;
    var nWide = 0, fixed = 0;
    state.forEach(function (st) { if (st === 'wide') nWide++; else fixed += st === 'seen' ? seenW : nextW; });
    var wideW = (x1 - x0 - gap * (state.length - 1) - fixed) / Math.max(1, nWide);
    var x = x0, cols = [];
    state.forEach(function (st, i) {
      var w = st === 'wide' ? wideW : st === 'seen' ? seenW : nextW;
      var by = y + hh + 8;
      cols.push({ x: x, y: y, w: w, h: hh, state: st, name: names[i], body: { x: x, y: by, w: w, h: st === 'seen' ? (o.seenH || 140) : 575 - by } });
      x += w + gap;
    });
    cols.forEach(function (c, i) {
      var q = typeof o.q === 'function' ? o.q(i) : (o.q == null ? 1 : o.q);
      if (q <= 0) return;
      ctx.save();
      ctx.globalAlpha *= E.clamp(q * 2, 0, 1);
      if (c.state === 'next') {
        C.v4v8.dashed(ctx, P.rect(c.x, c.y, c.w, c.h, 8), { weight: 'hair', seed: 200 + i, on: 6, off: 6 });
        C.v4v8.dashed(ctx, P.rect(c.body.x, c.body.y, c.body.w, c.body.h, 10), { weight: 'hair', seed: 210 + i, on: 6, off: 7 });
      } else {
        var wide = c.state === 'wide';
        C.box(ctx, c, { label: c.name, size: wide ? 22 : 15, role: wide ? 'accent-2' : 'ground-2', weight: wide ? 'regular' : 'thin', r: 10, seed: 220 + i, maxLines: 1 });
        colBorder(ctx, env, c, i);
        if (!wide) toolIcon(ctx, env, i, c.body.x + c.w / 2, c.body.y + c.body.h / 2);
      }
      ctx.restore();
    });
    return cols;
  }

  function colBorder(ctx, env, c, i) {
    var S = env.style, P = S.path;
    S.stroke(ctx, P.wobble(P.rect(c.body.x, c.body.y, c.body.w, c.body.h, 12), 230 + i, 1), { weight: 'thin', closed: true, taper: false, swell: 0.2, seed: 230 + i });
  }
  // A figure card inside a tool column: no corner shape, no theme line (the column's header names the tool).
  function colCard(ctx, env, figId, box, o) {
    return env.cards.figure(ctx, figId, box, Object.assign({ compact: true, blob: false }, o || {}));
  }

  // The verification steps of the case, with three article cards passing through them: each card
  // rests on a step, then hops to the next one; it gets a check after the last step.
  function verifySteps(ctx, env, box, labels, q) {
    var C = env.course, n = labels.length;
    var flow = C.flow(ctx, { x: box.x - 8, y: box.y + 70, w: box.w + 16, labels: labels, boxH: 112, gap: 28, size: 15, stepP: function (i) { return E.stagger(E.segment(q, 0, 0.3), i, n, 0.6); } });
    var mv = E.segment(q, 0.25, 1);
    if (mv <= 0) return flow;
    for (var k = 0; k < 3; k++) {
      var u = E.clamp(mv * 1.25 - k * 0.12, 0, 1) * (n - 1);
      var i = Math.min(n - 2, Math.floor(u)), fr = u - i;
      var hop = u >= n - 1 ? 1 : E.inOut(E.clamp((fr - 0.5) * 2, 0, 1));
      var b0 = flow.boxes[i], b1 = flow.boxes[i + 1];
      var cx = E.lerp(b0.x + b0.w / 2, b1.x + b1.w / 2, hop);
      C.prop(ctx, 'article-card', { x: cx - 16 + (k - 1) * 12, y: box.y + 8 + k * 6, w: 32, h: 42, seed: 380 + k, barRole: ART[k], check: u >= n - 1 ? 1 : 0 });
    }
    return flow;
  }

  var zones = {
    gancho: [[140, 60, 1010, 90], [150, 150, 980, 400]],
    bases: [[40, 80, 1210, 450]],
    'ciclo-busqueda': [[30, 100, 1220, 470]],
    undermind: [[40, 85, 1200, 495]],
    consensus: [[40, 85, 1200, 495]],
    elicit: [[40, 85, 1200, 495]],
    'normas-revision': [[80, 90, 1120, 470]],
    revision: [[40, 90, 1190, 470]],
    'no-hay': [[260, 80, 980, 420]],
    leer: [[90, 60, 1100, 480]],
    proyecto: [[60, 100, 1180, 460]],
    cuaderno: [[120, 80, 1100, 480]],
    'instrucciones-proyecto': [[90, 80, 1150, 440]],
    skill: [[40, 90, 1200, 480]],
    estandar: [[60, 80, 1180, 470]],
    'cuidado-skill': [[40, 90, 1200, 480]],
    caso: [[20, 80, 960, 330]],
    'skill-caso': [[190, 80, 590, 360]],
    cierre: [[110, 140, 1060, 420]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: the title «Herramientas de IA para el estado del arte» at the top; on line 1 two `buscador-academico` lamps side by side receive the same question card «¿El salario mínimo aumenta la informalidad?» and each returns a list of article cards of a different length and order.
      var S = env.style, C = env.course, tx = env.tx;
      S.title(ctx, tx('t1'), { x: 700, y: 126, size: 44, align: 'center', p: beat(s, 0, 0, 0.3), maxWidth: 940 });
      var qb = { x: 400, y: 168, w: 480, h: 64 };
      var qq = beat(s, 0, 0.12, 0.3);
      if (qq > 0) C.box(ctx, qb, { label: tx('t2'), size: 22, role: 'accent-2', weight: 'bold', p: qq, seed: 11 });
      var lamps = [[470, 390], [810, 390]];
      var lq = beat(s, 0, 0.25, 0.45);
      lamps.forEach(function (L, i) {
        if (lq <= 0) return;
        C.arrow(ctx, [qb.x + qb.w / 2 + (i ? 60 : -60), qb.y + qb.h + 6], [L[0] + (i ? -18 : 18), L[1] - 96], { p: E.segment(lq, 0, 0.6), curve: i ? 16 : -16, weight: 'regular', head: 12, seed: 20 + i });
        C.lamp(ctx, 'buscador-academico', { x: L[0], y: L[1], r: 34, ring: 78, labels: [], p: lq, t: s.t + i * 0.8 });
      });
      // each tool returns its own list: different length, different order
      var outQ = beat(s, 0, 0.45, 0.6);
      var lists = [{ x: 150, order: [0, 2, 1, 3, 4], from: [392, 390], to: [340, 390] }, { x: 950, order: [2, 0, 5], from: [888, 390], to: [940, 390] }];
      lists.forEach(function (Lst, i) {
        if (outQ <= 0) return;
        C.arrow(ctx, Lst.from, Lst.to, { p: outQ, weight: 'thin', head: 10, seed: 30 + i });
        var top = 390 - (Lst.order.length * 46 - 8) / 2;
        resultList(ctx, env, Lst.x, top, Lst.order, { w: 180, h: 38, gap: 8, p: beat(s, 0, 0.5 + i * 0.12, 0.85 + i * 0.1), seed: 40 + i * 50 });
      });
    },

    bases: function (ctx, s, env) {
      // Draw: on line 1 two tall shelves of records appear, labeled «Semantic Scholar» and «OpenAlex», with the card of `busqueda.bases`; on line 2 two search beams leave a `buscador-academico`, labeled «palabras clave» and «significado (embeddings)», and the lamp reads some abstracts and full texts and sorts them into «relevante» and «no relevante».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      recordShelf(ctx, env, 56, 132, 150, 300, beat(s, 0, 0, 0.25), 51);
      recordShelf(ctx, env, 232, 132, 150, 300, beat(s, 0, 0.1, 0.35), 61);
      S.text(ctx, tx('t1'), 131, 468, { size: 19, weight: 700, align: 'center', maxWidth: 170, p: beat(s, 0, 0.15, 0.4) });
      S.text(ctx, tx('t2'), 307, 468, { size: 19, weight: 700, align: 'center', maxWidth: 170, p: beat(s, 0, 0.25, 0.5) });
      var cq = beat(s, 0, 0.3, 0.6);
      if (cq > 0) env.cards.figure(ctx, 'busqueda.bases', { x: 846, y: 84, w: 394, h: 236 }, { p: cq });
      // line 2: the search beams, the reading and the sorting, inside the machine's area
      var pq = beat(s, 1, 0, 0.15);
      var mx = 400, my = 184, mw = 410, mh = 260;
      machinePanel(ctx, env, mx, my, mw, mh, pq);
      var lx = 724, ly = 314;
      if (pq > 0) C.lamp(ctx, 'buscador-academico', { x: lx, y: ly, r: 30, ring: 66, labels: [], p: pq, t: s.t });
      var bq = beat(s, 1, 0.1, 0.35);
      if (bq > 0) {
        var bw = (lx - 72 - mx) * bq;
        S.machine(ctx, 'strip', { x: lx - 72 - bw, y: 262, w: bw, h: 20, cuts: [0.2, 0.42, 0.66, 0.84], gap: 6 });
        S.machine(ctx, 'frame', { x: lx - 72 - bw, y: 346, w: bw, h: 20 });
        for (var d = 0; d < Math.floor(bw / 13); d++) S.machineCircle(ctx, lx - 80 - d * 13, 356, 3.2, 1.1, d % 3 === 0 ? 'machine-glow-1' : 'machine-line');
        S.machine(ctx, 'label', { text: tx('t3'), x: mx + 14, y: 248, size: 17, p: bq });
        S.machine(ctx, 'label', { text: tx('t4'), x: mx + 14, y: 392, size: 17, p: bq, maxWidth: 300 });
      }
      // cards travel in along the beams, then the lamp sorts them into two trays
      var trayQ = beat(s, 1, 0.3, 0.5);
      tray(ctx, env, 860, 388, 170, 92, tx('t5'), trayQ, 70);
      tray(ctx, env, 1056, 388, 170, 92, tx('t6'), trayQ, 72);
      if (trayQ > 0) {
        C.check(ctx, 1004, 412, 22, { p: trayQ, seed: 74 });
        C.cross(ctx, 1200, 412, 18, { p: trayQ, weight: 'regular' });
      }
      var rel = [true, false, true, true, false, true], landed = [0, 0];
      rel.forEach(function (isRel, k) {
        var u = E.segment(b, 0.32 + k * 0.08, 0.52 + k * 0.08);
        if (u <= 0) return;
        var full = k % 2 === 1;
        var w = 26, h = full ? 34 : 22;
        if (u < 0.5) {
          var v = E.inOut(u * 2), yy = k % 2 ? 356 : 272;
          ctx.save(); ctx.globalAlpha *= E.clamp(u * 8, 0, 1);
          S.machine(ctx, 'card', { x: E.lerp(mx + 6, lx - 60, v), y: yy - h / 2, w: w, h: h, lines: full ? 4 : 2 });
          ctx.restore();
        } else if (u < 1) {
          var v2 = E.inOut((u - 0.5) * 2), tx2 = isRel ? 900 + landed[0] * 22 : 1096 + landed[1] * 22;
          var px = E.lerp(lx + 30, tx2, v2), py = E.lerp(ly, 420, v2) - Math.sin(v2 * Math.PI) * 60;
          C.prop(ctx, 'article-card', { x: px - 14, y: py - 18, w: 28, h: full ? 40 : 30, seed: 80 + k, barRole: ART[k] });
        }
        if (u >= 1) {
          var j = isRel ? 0 : 1, n = landed[j]++;
          C.prop(ctx, 'article-card', { x: (j ? 1084 : 888) + n * 22, y: 402 + (n % 2) * 6, w: 30, h: full ? 44 : 34, seed: 80 + k, barRole: ART[k] });
        }
      });
      void a;
    },

    'ciclo-busqueda': function (ctx, s, env) {
      // Draw: course sign `ciclo-busqueda`; on line 1 the loop «busca», «lee», «reformula», «sigue citas» turns around a `buscador-academico`, and the label «se detiene cuando ya no aparece nada nuevo» appears at its exit; on line 2 three dials appear beside the loop, labeled «cómo ordenan y filtran», «cuántos artículos leen completos» and «cuándo se detienen», and a calendar card labeled «otra fecha» returns a third, different list.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var b = s.at(1);
      C.sign(ctx, 'ciclo-busqueda', {
        cx: 320, cy: 296, rx: 214, ry: 150, boxW: 164, boxH: 54, size: 20, exitW: 282, exitH: 78, exitGap: 40, exitDy: 62,
        labels: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5')],
        q: [beat(s, 0, 0, 0.6), beat(s, 0, 0.62, 0.9)], t: s.t
      });
      // line 2: three dials that change the result
      var dq = beat(s, 1, 0, 0.2);
      machinePanel(ctx, env, 790, 106, 72, 236, dq);
      ['t6', 't7', 't8'].forEach(function (k, i) {
        var q = beat(s, 1, 0.05 + i * 0.1, 0.2 + i * 0.1);
        if (q <= 0) return;
        var y = 146 + i * 78;
        S.machine(ctx, 'dial', { x: 826, y: y, r: 22, angle: -Math.PI / 2 + (q < 1 ? q * 2.4 : 2.4) * (i % 2 ? -0.7 : 0.8) + i * 0.4 });
        S.text(ctx, tx(k), 880, y + 7, { size: 20, weight: 700, maxWidth: 350, maxLines: 2, vcenter: true, lineHeight: 1.12, p: q });
      });
      // a calendar card «otra fecha» returns a third, different list
      var kq = beat(s, 1, 0.4, 0.6);
      if (kq > 0) {
        var cx = 800, cy = 400;
        S.shape(ctx, P.rect(cx, cy, 120, 104, 8), { role: 'ground', p: kq, seed: 91, weight: 'regular', offset: false });
        S.fill(ctx, P.rect(cx + 4, cy + 4, 112, 24, 6), { role: 'accent-1', offset: false, p: kq });
        for (var g = 0; g < 9; g++) S.fill(ctx, P.circle(cx + 22 + (g % 3) * 38, cy + 46 + Math.floor(g / 3) * 18, 3.4, 8), { role: g === 4 ? 'accent-1' : 'ink', offset: false, texture: false, p: kq });
        S.text(ctx, tx('t9'), cx + 60, cy + 134, { size: 19, weight: 700, align: 'center', p: kq });
        C.arrow(ctx, [cx + 128, cy + 52], [cx + 184, cy + 52], { p: beat(s, 1, 0.5, 0.65), weight: 'thin', head: 10, seed: 92 });
      }
      resultList(ctx, env, 994, 384, [3, 1, 6, 0], { w: 190, h: 36, gap: 8, p: beat(s, 1, 0.55, 0.95), seed: 140 });
      void b;
    },

    undermind: function (ctx, s, env) {
      // Draw: a tool grid, a meaning zone, whose columns appear over this chapter; on line 1 the column «Undermind» shows a lamp that first sends small question cards to the user, then plans and reads many cards, with the card of `herr.undermind` («Revisar antes de clase»); on line 2 the column «Asta» shows a report whose every line carries a small citation link.
      var S = env.style, C = env.course, P = S.path;
      var cols = toolGrid(ctx, env, ['wide', 'wide', 'next', 'next', 'next'], { q: function (i) { return i === 0 ? E.out(s.intro) : i === 1 ? beat(s, 1, 0, 0.2) : E.out(s.intro) * 0.9; } });
      var u = cols[0].body;
      // the bank's card first: its corner shape tucks under the machine panel
      var cq = beat(s, 0, 0.12, 0.4);
      if (cq > 0) colCard(ctx, env, 'herr.undermind', { x: u.x + 12, y: u.y + 160, w: u.w - 24, h: u.h - 168 }, { p: cq });
      // Undermind: the lamp asks the user, then plans and reads many articles
      var tile = { x: u.x + 16, y: u.y + 12, w: 124, h: 84 };
      C.prop(ctx, 'tile', { x: tile.x, y: tile.y, w: tile.w, h: tile.h, person: S.extraLook(77), t: s.t, p: beat(s, 0, 0, 0.12), seed: 301 });
      var lx = u.x + 196, ly = u.y + 58;
      C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 28, p: beat(s, 0, 0, 0.12), t: s.t });
      for (var k = 0; k < 2; k++) {
        var f = beat(s, 0, 0.06 + k * 0.08, 0.2 + k * 0.08);
        if (f > 0 && f < 1) questionCard(ctx, env, E.lerp(lx - 30, tile.x + tile.w + 10, E.inOut(f)), ly - 18 + k * 30, 1);
        if (f >= 1) questionCard(ctx, env, tile.x + tile.w - 22 - k * 36, tile.y + tile.h + 22, 1);
      }
      var gx = u.x + 248, gy = u.y + 12, gw = u.w - 262, gh = 136;
      var rq = beat(s, 0, 0.28, 0.4);
      machinePanel(ctx, env, gx, gy, gw, gh, rq);
      if (rq > 0) {
        // the plan: a short chain of steps
        for (var i = 0; i < 4; i++) {
          var nq = beat(s, 0, 0.3 + i * 0.04, 0.36 + i * 0.04);
          if (nq <= 0) continue;
          if (i > 0) S.machineLine(ctx, gx + 30 + (i - 1) * 50 + 8, gy + 24, gx + 30 + i * 50 - 8, gy + 24, 1.3);
          S.machine(ctx, 'node', { x: gx + 30 + i * 50, y: gy + 24, r: 8, on: nq });
        }
        // the reading: many cards, read one after another
        var read = beat(s, 0, 0.45, 0.9), nCols = Math.floor((gw - 20) / 26), n = nCols * 4;
        for (var c = 0; c < n; c++) {
          var cx = gx + 14 + (c % nCols) * 26, cy = gy + 44 + Math.floor(c / nCols) * 22;
          S.machine(ctx, 'card', { x: cx, y: cy, w: 18, h: 17, lines: 2 });
          if (c < read * n) S.machine(ctx, 'frame', { x: cx - 1, y: cy - 1, w: 20, h: 19, fill: false, role: 'machine-glow-1', lw: 1.2 });
        }
      }
      // Asta: a report whose every line carries a citation link to its source
      var ab = cols[1].body;
      var bq = beat(s, 1, 0.1, 0.35);
      if (bq > 0) {
        var rx = ab.x + 26, ry = ab.y + 22, rw = 270, rh = 370;
        page(ctx, env, rx, ry, rw, rh, { p: bq, seed: 310, fold: 30 });
        S.fill(ctx, P.rect(rx + 22, ry + 26, rw * 0.55, 12, 4), { role: 'accent-3', offset: false, texture: false, p: bq });
        var srcs = [[ab.x + 370, ab.y + 46], [ab.x + 370, ab.y + 176], [ab.x + 370, ab.y + 306]];
        srcs.forEach(function (sp, j) { C.prop(ctx, 'article-card', { x: sp[0], y: sp[1], w: 92, h: 104, p: beat(s, 1, 0.15 + j * 0.06, 0.3 + j * 0.06), seed: 320 + j, barRole: ART[j + 1] }); });
        for (var ln = 0; ln < 9; ln++) {
          var lq = beat(s, 1, 0.25 + ln * 0.06, 0.33 + ln * 0.06);
          if (lq <= 0) continue;
          var yy = ry + 66 + ln * 32, x2 = rx + rw - 46 - (ln % 3) * 18;
          S.stroke(ctx, [[rx + 22, yy], [x2, yy + 1]], { weight: 'thin', taper: false, p: lq, seed: 330 + ln });
          S.stroke(ctx, P.circle(x2 + 12, yy, 5, 12), { weight: 'thin', closed: true, taper: false, p: lq, seed: 340 + ln, role: 'accent-3' });
          var src = srcs[ln % 3];
          if (lq >= 1) C.v4v8.dashed(ctx, [[x2 + 18, yy], [src[0] - 4, src[1] + 52]], { weight: 'hair', on: 5, off: 5, seed: 350 + ln, role: 'accent-3' });
        }
      }
    },

    consensus: function (ctx, s, env) {
      // Draw: on line 1 the column «Consensus» shows the `medidor` with its four segments «sí», «posiblemente», «mixto» and «no», fed by a short stack of study cards, with the card of `herr.consensus` («Con matiz»), while MARIANA watches from a tile at the side; on line 2 the short stack is set next to a much taller stack labeled «toda la literatura», and the label «los primeros 5 a 20 estudios» appears on the short one.
      var S = env.style, C = env.course, tx = env.tx;
      var cols = toolGrid(ctx, env, ['seen', 'seen', 'wide', 'next', 'next'], { q: E.out(s.intro) });
      var body = cols[2].body;
      var cq = beat(s, 0, 0.1, 0.4);
      if (cq > 0) colCard(ctx, env, 'herr.consensus', { x: body.x + body.w - 390, y: body.y + 12, w: 378, h: 256 }, { p: cq });
      var gx = body.x + 150, gy = 326, base = 510;
      // the short stack of studies feeds the meter
      C.prop(ctx, 'card-stack', { x: gx, y: base, w: 92, h: 64, n: 4, p: E.out(s.intro) });
      C.arrow(ctx, [gx, base - 100], [gx, gy + 16], { p: beat(s, 0, 0, 0.3), weight: 'regular', head: 12, seed: 401 });
      C.lamp(ctx, 'medidor', { x: gx, y: gy, r: 104, labels: [tx('t2'), tx('t3'), tx('t4'), tx('t5')], needle: 0, p: E.out(s.intro) });
      // line 2: beside it, a much taller stack, «toda la literatura»; the short one is «los primeros 5 a 20 estudios»
      var tq = beat(s, 1, 0.1, 0.5);
      if (tq > 0) {
        var tallX = gx + 196, nT = 22;
        for (var k = nT - 1; k >= 0; k--) {
          var kq = E.stagger(tq, nT - 1 - k, nT, 0.8);
          if (kq > 0) C.prop(ctx, 'article-card', { x: tallX - 46 + k * 1.5, y: base - 64 - k * 8, w: 92, h: 64, seed: 420 + k, barRole: ART[k % 4], p: kq });
        }
        S.text(ctx, tx('t7'), tallX + 14, base + 30, { size: 19, weight: 700, align: 'center', p: beat(s, 1, 0.35, 0.6), maxWidth: 200 });
      }
      var sq = beat(s, 1, 0.45, 0.75);
      if (sq > 0) S.text(ctx, tx('t8'), gx + 4, base + 30, { size: 19, weight: 700, align: 'center', p: sq, maxWidth: 190, lineHeight: 1.15 });
      // Mariana watches from a tile at the side (her vignette shows her while she speaks)
      if (s.speaker !== 'mariana' && s.line >= 1) C.prop(ctx, 'tile', { x: 52, y: 300, w: 222, h: 140, person: C.castEntry('mariana'), t: s.t, p: beat(s, 1, 0, 0.12), seed: 402 });
    },

    elicit: function (ctx, s, env) {
      // Draw: on line 1 the column «Elicit» shows a `tabla-extraccion` with the headers «muestra», «método» and «resultados» and the card of `herr.elicit`; on line 2 the column «Connected Papers» shows a `grafo` of article dots around a seed dot labeled «artículo semilla», with the label «no lee los textos» and the card of `herr.connected`.
      var S = env.style, C = env.course, tx = env.tx;
      var cols = toolGrid(ctx, env, ['seen', 'seen', 'seen', 'wide', 'wide'], { q: function (i) { return i < 4 ? E.out(s.intro) : beat(s, 1, 0, 0.2); } });
      var el = cols[3].body, cp = cols[4].body;
      // Elicit: the card first (its corner shape tucks behind the table), then the extraction table
      var ec = beat(s, 0, 0.1, 0.4);
      if (ec > 0) colCard(ctx, env, 'herr.elicit', { x: el.x + 10, y: el.y + 120, w: el.w - 20, h: el.h - 126 }, { p: ec });
      var tq = beat(s, 0, 0, 0.2);
      if (tq > 0) C.lamp(ctx, 'tabla-extraccion', { x: el.x + 100, y: el.y + 10, w: el.w - 114, r: 28, rows: 2, headers: [tx('t2'), tx('t3'), tx('t4')], fill: beat(s, 0, 0.15, 0.85), p: tq, t: s.t });
      // Connected Papers: a graph around a seed article; it does not read the texts
      var cc = beat(s, 1, 0.15, 0.45);
      if (cc > 0) colCard(ctx, env, 'herr.connected', { x: cp.x + 10, y: cp.y + 140, w: cp.w - 20, h: cp.h - 146 }, { p: cc });
      var gq = beat(s, 1, 0.05, 0.25);
      if (gq > 0) {
        machinePanel(ctx, env, cp.x + 10, cp.y + 10, cp.w - 20, 122, gq);
        var gx = cp.x + 74, gy = cp.y + 71;
        S.machine(ctx, 'graph', { x: gx, y: gy, r: 48, n: 10, seed: 7, p: beat(s, 1, 0.1, 0.45) });
        var lq = beat(s, 1, 0.3, 0.5);
        if (lq > 0) {
          S.machine(ctx, 'arrow', { from: [cp.x + 168, cp.y + 46], to: [gx + 15, gy - 6], p: lq, w: 1.4, head: 8 });
          S.machine(ctx, 'label', { text: tx('t6'), x: cp.x + 176, y: cp.y + 52, size: 18, p: lq, maxWidth: cp.w - 196 });
        }
        // «no lee los textos»: an article card crossed out, in the machine's ruled lines
        var nq = beat(s, 1, 0.55, 0.75);
        if (nq > 0) {
          ctx.save(); ctx.globalAlpha *= nq;
          var kx = cp.x + 178, ky = cp.y + 82;
          S.machine(ctx, 'card', { x: kx, y: ky, w: 22, h: 28, lines: 3 });
          S.machineLine(ctx, kx - 3, ky - 3, kx + 25, ky + 31, 2, 'machine-glow-2');
          S.machineLine(ctx, kx + 25, ky - 3, kx - 3, ky + 31, 2, 'machine-glow-2');
          ctx.restore();
          S.machine(ctx, 'label', { text: tx('t7'), x: cp.x + 210, y: cp.y + 103, size: 18, p: nq, maxWidth: cp.w - 230 });
        }
      }
    },

    'normas-revision': function (ctx, s, env) {
      // Draw: two document cards with a round seal appear; on line 1 the card «RAISE» with the labels «Cochrane, Campbell, JBI y la Collaboration for Environmental Evidence» and «los autores siguen siendo responsables»; on line 2 the card «PRISMA» with the label «sin extensión oficial para IA: una actualización está en desarrollo».
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var docs = [{ x: 110, y: 104, w: 470, h: 440 }, { x: 700, y: 104, w: 470, h: 440 }];
      var q1 = beat(s, 0, 0, 0.2), q2 = beat(s, 1, 0, 0.2);
      [q1, q2].forEach(function (q, i) {
        if (q <= 0) return;
        var d = docs[i], a = S.appear('rise', q);
        ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(0, a.dy);
        page(ctx, env, d.x, d.y, d.w, d.h, { seed: 500 + i * 10, fold: 40 });
        S.title(ctx, tx(i ? 't4' : 't1'), { x: d.x + 34, y: d.y + 76, size: 50, p: 1, seed: 501 + i * 10, underline: false });
        seal(ctx, env, d.x + d.w - 76, d.y + 92, 36, 1, 502 + i * 10);
        ctx.restore();
      });
      // RAISE: who endorsed it, and who stays responsible
      var e1 = beat(s, 0, 0.2, 0.45);
      if (e1 > 0) {
        var d0 = docs[0];
        S.text(ctx, tx('t2'), d0.x + 34, d0.y + 156, { size: 21, weight: 600, maxWidth: d0.w - 70, lineHeight: 1.25, maxLines: 4, p: e1 });
        for (var k = 0; k < 4; k++) C.check(ctx, d0.x + 52 + k * 40, d0.y + 286, 20, { p: beat(s, 0, 0.3 + k * 0.05, 0.4 + k * 0.05), seed: 510 + k });
      }
      var e2 = beat(s, 0, 0.5, 0.75);
      if (e2 > 0) {
        var d1 = docs[0];
        C.box(ctx, { x: d1.x + 30, y: d1.y + 330, w: d1.w - 60, h: 70 }, { label: tx('t3'), size: 21, role: 'accent-2', weight: 'bold', p: e2, seed: 520 });
        C.prop(ctx, 'pen', { x: d1.x + d1.w - 100, y: d1.y + 432, len: 46, angle: -0.5, p: e2 });
        S.stroke(ctx, P.smooth([[d1.x + 40, d1.y + 420], [d1.x + 80, d1.y + 406], [d1.x + 110, d1.y + 424], [d1.x + 150, d1.y + 408]], 8), { weight: 'thin', p: e2, seed: 521 });
      }
      // PRISMA: no official extension for AI yet; an update is in development
      var e3 = beat(s, 1, 0.2, 0.5);
      if (e3 > 0) {
        var d2 = docs[1];
        for (var ln = 0; ln < 4; ln++) S.stroke(ctx, [[d2.x + 36, d2.y + 150 + ln * 26], [d2.x + d2.w - 60 - (ln === 3 ? 120 : 0), d2.y + 151 + ln * 26]], { weight: 'hair', taper: false, p: e3, seed: 530 + ln });
        var sx = d2.x + 36, sy = d2.y + 268, sw = d2.w - 72, sh = 140;
        C.v4v8.dashed(ctx, P.rect(sx, sy, sw, sh, 12), { weight: 'regular', seed: 540, on: 12, off: 8 });
        C.pictos.draw(ctx, 'hourglass', { x: sx + 44, y: sy + sh / 2, r: 26, p: e3 });
        S.text(ctx, tx('t5'), sx + 84, sy + sh / 2 + 8, { size: 21, weight: 700, maxWidth: sw - 100, lineHeight: 1.2, maxLines: 3, vcenter: true, p: beat(s, 1, 0.35, 0.65) });
      }
    },

    revision: function (ctx, s, env) {
      // Draw: the legend item `validez`; on line 1 the `buscador-academico` sits on the left, labeled «explorar y delimitar un tema», and the course sign `ecuacion-busqueda` sits on the right, labeled «búsqueda principal de una revisión sistemática»; on line 2 a logbook row appears with «herramienta», «fecha», «consulta exacta» and «número de resultados», with the legend item `reproducibilidad`.
      var S = env.style, C = env.course, tx = env.tx;
      C.legendChip(ctx, 'validez', 60, 116, { p: E.out(s.intro), size: 20, r: 22 });
      var lq = beat(s, 0, 0, 0.25);
      if (lq > 0) {
        C.lamp(ctx, 'buscador-academico', { x: 330, y: 280, r: 36, ring: 84, labels: [], p: lq, t: s.t });
        S.text(ctx, tx('t1'), 330, 412, { size: 22, weight: 700, align: 'center', maxWidth: 420, p: beat(s, 0, 0.1, 0.35) });
      }
      var eq = beat(s, 0, 0.3, 0.6);
      if (eq > 0) C.sign(ctx, 'ecuacion-busqueda', { x: 680, y: 160, w: 480, h: 222, q: [eq, beat(s, 0, 0.5, 0.85)], label: tx('t2'), labelQ: beat(s, 0, 0.55, 0.8) });
      // line 2: the logbook row of each query
      var tq = beat(s, 1, 0, 0.25);
      if (tq > 0) {
        C.table(ctx, { x: 330, y: 468, w: 850, headers: [tx('t3'), tx('t4'), tx('t5'), tx('t6')], cols: [0.23, 0.17, 0.32, 0.28], nRows: 1, rowH: 44, headH: 46, headSize: 17, p: tq, fill: beat(s, 1, 0.25, 0.7) });
        C.legendChip(ctx, 'reproducibilidad', 60, 514, { p: beat(s, 1, 0.3, 0.6), size: 20, r: 22 });
      }
    },

    'no-hay': function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA with an empty results card; on line 2 the empty card fills from three stacks labeled «SciELO», «Redalyc» and «repositorios institucionales», and a shelf of reports labeled «DANE», «CEPAL» and «Banco de la República» appears, with the legend item `equidad`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var b = s.at(1);
      var pl = C.place(ctx, 'escritorio-casa', { x: 240, y: 452, w: 540, p: E.out(s.intro), window: false, secondScreen: false, laptopAt: 330, laptopW: 200, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: pl.seat.x, y: pl.seat.y, scale: 0.92, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      // the results card above her laptop: empty rows until line 2
      var rc = { x: 330, y: 88, w: 400, h: 214 };
      C.box(ctx, rc, { p: E.out(s.intro), role: 'ground', weight: 'bold', seed: 601 });
      S.shape(ctx, P.rect(rc.x + 18, rc.y + 16, rc.w - 36, 32, 16), { role: 'accent-5', weight: 'thin', seed: 602, offset: false, p: E.out(s.intro) });
      C.pictos.draw(ctx, 'magnifier-check', { x: rc.x + 40, y: rc.y + 32, r: 11, p: E.out(s.intro) });
      var rowY = function (r) { return rc.y + 62 + r * 36; };
      var filled = Math.floor(E.segment(b, 0.25, 0.95) * 4.999);
      for (var r = 0; r < 4; r++) {
        if (r < filled) resultRow(ctx, env, rc.x + 18, rowY(r), rc.w - 36, 30, ART[[3, 0, 5, 2][r]], 1, 610 + r * 7);
        else C.v4v8.dashed(ctx, P.rect(rc.x + 18, rowY(r), rc.w - 36, 30, 8), { weight: 'hair', seed: 640 + r, on: 7, off: 6, role: 'ink-soft' });
      }
      // line 2: three stacks of regional sources fill the card
      var sq = beat(s, 1, 0, 0.25);
      var stacks = [{ x: 880, k: 't1' }, { x: 1016, k: 't2' }, { x: 1152, k: 't3' }];
      stacks.forEach(function (st, i) {
        var q = E.stagger(sq, i, 3, 0.5);
        if (q <= 0) return;
        C.prop(ctx, 'card-stack', { x: st.x, y: 280, w: 92, h: 62, n: 5, p: q });
        S.text(ctx, tx(st.k), st.x + 10, 310, { size: 18, weight: 700, align: 'center', maxWidth: 132, p: q, lineHeight: 1.15 });
        var f = E.segment(b, 0.25 + i * 0.12, 0.45 + i * 0.12);
        if (f > 0 && f < 1) {
          var v = E.inOut(f);
          C.prop(ctx, 'article-card', { x: E.lerp(st.x - 20, rc.x + rc.w - 60, v), y: E.lerp(200, rowY(i) - 4, v) - Math.sin(v * Math.PI) * 50, w: 30, h: 38, seed: 650 + i, barRole: ART[[3, 0, 5][i]] });
        }
      });
      // and a shelf of grey literature
      var rq = beat(s, 1, 0.45, 0.7);
      if (rq > 0) {
        S.stroke(ctx, [[836, 498], [1236, 499]], { weight: 'bold', taper: false, p: rq, seed: 660 });
        [['t4', 840, 110], ['t5', 962, 116], ['t6', 1090, 140]].forEach(function (rp, i) {
          var q = E.stagger(rq, i, 3, 0.5);
          if (q > 0) C.box(ctx, { x: rp[1], y: 410, w: rp[2], h: 84 }, { label: tx(rp[0]), size: 17, role: ['accent-6', 'accent-5', 'ground-2'][i], p: q, seed: 670 + i, r: 6, maxLines: 3 });
        });
        var f4 = E.segment(b, 0.62, 0.8);
        if (f4 > 0 && f4 < 1) {
          var v4 = E.inOut(f4);
          C.prop(ctx, 'article-card', { x: E.lerp(960, rc.x + rc.w - 60, v4), y: E.lerp(400, rowY(3) - 4, v4) - Math.sin(v4 * Math.PI) * 60, w: 30, h: 38, seed: 680, barRole: ART[2] });
        }
        C.legendChip(ctx, 'equidad', 840, 540, { p: beat(s, 1, 0.6, 0.85), size: 20, r: 22 });
      }
    },

    leer: function (ctx, s, env) {
      // Draw: the stamp `stamp-citar` at the top; on line 1 a summary card covering an article is lifted to show the full text with three labels: «muestra», «contexto», «limitaciones»; on line 2 a PDF card stops at a small gate labeled «licencia de la editorial o de la biblioteca», with the legend item `integridad`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      C.stamp(ctx, 'stamp-citar', { x: 640, y: 178, r: 118, p: E.out(s.intro) });
      // the article and the summary card that covers it
      var ar = { x: 150, y: 256, w: 320, h: 300 };
      page(ctx, env, ar.x, ar.y, ar.w, ar.h, { seed: 700, fold: 30, p: E.out(s.intro) });
      S.fill(ctx, P.rect(ar.x + 24, ar.y + 24, ar.w * 0.6, 12, 4), { role: 'accent-3', offset: false, texture: false, p: E.out(s.intro) });
      var marks = [{ line: 1, k: 't1' }, { line: 4, k: 't2' }, { line: 7, k: 't3' }];
      for (var ln = 0; ln < 9; ln++) {
        var yy = ar.y + 60 + ln * 25;
        var hl = marks.filter(function (m) { return m.line === ln; })[0];
        if (hl) {
          var hq = beat(s, 0, 0.45 + marks.indexOf(hl) * 0.12, 0.6 + marks.indexOf(hl) * 0.12);
          if (hq > 0) S.fill(ctx, P.rect(ar.x + 22, yy - 9, (ar.w - 64) * hq, 16, 4), { role: 'accent-2', offset: false, texture: false, alpha: 0.85 });
        }
        S.stroke(ctx, [[ar.x + 24, yy], [ar.x + ar.w - 40 - (ln % 4 === 3 ? 90 : 0), yy + 1]], { weight: 'hair', taper: false, seed: 710 + ln, p: E.out(s.intro) });
      }
      marks.forEach(function (m, i) {
        var q = beat(s, 0, 0.5 + i * 0.12, 0.65 + i * 0.12);
        if (q <= 0) return;
        var yy = ar.y + 60 + m.line * 25, bx = ar.x + ar.w + 34;
        C.arrow(ctx, [bx - 4, yy + 8 + i * 6], [ar.x + ar.w - 34, yy], { p: q, weight: 'thin', head: 9, seed: 720 + i });
        C.box(ctx, { x: bx, y: yy - 12 + i * 6, w: 150, h: 40 }, { label: tx(m.k), size: 18, role: 'accent-2', p: q, seed: 730 + i, r: 20 });
      });
      // the summary card lifts up and to the left, inside the frame
      var lift = E.inOut(beat(s, 0, 0.12, 0.45));
      ctx.save();
      ctx.translate(ar.x + 30 - 104 * lift, ar.y + 40 - 172 * lift);
      ctx.rotate(-0.12 * lift);
      C.box(ctx, { x: 0, y: 0, w: ar.w - 60, h: 150 }, { p: E.out(s.intro), role: 'ground-2', weight: 'bold', seed: 740, lines: 3, linesY: 50 });
      S.fill(ctx, P.rect(18, 18, 110, 12, 4), { role: 'accent-1', offset: false, texture: false, p: E.out(s.intro) });
      ctx.restore();
      // line 2: a PDF stops at the gate of its license
      var gq = beat(s, 1, 0, 0.2);
      if (gq > 0) {
        var gx = 1040, gy = 372;
        S.stroke(ctx, [[gx, gy - 70], [gx + 1, gy + 70]], { weight: 'bold', taper: false, p: gq, seed: 750 });
        S.stroke(ctx, [[gx + 110, gy - 70], [gx + 111, gy + 70]], { weight: 'bold', taper: false, p: gq, seed: 751 });
        var bar = P.rect(gx - 14, gy - 34, 140, 26, 8);
        S.fill(ctx, bar, { role: 'accent-1', offset: false, p: gq });
        for (var st = 0; st < 4; st++) S.fill(ctx, P.rect(gx + 8 + st * 30, gy - 32, 12, 22, 2), { role: 'ground', offset: false, texture: false, p: gq });
        S.stroke(ctx, bar, { weight: 'regular', closed: true, taper: false, p: gq, seed: 752 });
        S.text(ctx, tx('t4'), gx + 55, gy + 104, { size: 19, weight: 700, align: 'center', maxWidth: 300, lineHeight: 1.2, p: beat(s, 1, 0.15, 0.4) });
        var mv = E.inOut(beat(s, 1, 0.15, 0.55));
        var px = E.lerp(780, gx - 96, mv);
        page(ctx, env, px, gy - 52, 74, 96, { seed: 760, fold: 18, weight: 'regular', p: gq });
        S.fill(ctx, P.rect(px + 10, gy - 40, 40, 10, 3), { role: 'accent-1', offset: false, texture: false, p: gq });
        for (var k2 = 0; k2 < 4; k2++) S.stroke(ctx, [[px + 10, gy - 16 + k2 * 13], [px + 62, gy - 15 + k2 * 13]], { weight: 'hair', taper: false, seed: 770 + k2, p: gq });
        C.legendChip(ctx, 'integridad', 984, 540, { p: beat(s, 1, 0.45, 0.75), size: 20, r: 22 });
      }
    },

    proyecto: function (ctx, s, env) {
      // Draw: course sign `proyecto-carpeta`; on line 1 a single chat bubble fades on the left, labeled «se pierde y empieza de cero», and the project folder on the right fills its three parts: «instrucciones fijas», «documentos del proyecto», «historial»; on line 2 small labels appear inside the folder: «protocolo», «libro de códigos», «guía de estilo de la revista», with a version-and-date tag.
      var C = env.course, tx = env.tx;
      C.sign(ctx, 'proyecto-carpeta', {
        bubble: { x: 120, y: 176, w: 400, h: 180 }, folder: { x: 676, y: 112, w: 560, h: 446 },
        labels: [tx('t2'), tx('t3'), tx('t4')], bubbleLabel: tx('t1'), docs: [tx('t5'), tx('t6'), tx('t7')],
        q: [E.out(s.intro), beat(s, 0, 0.35, 0.95), beat(s, 1, 0, 0.55)],
        fade: beat(s, 0, 0.08, 0.4), tag: beat(s, 1, 0.55, 0.85)
      });
    },

    cuaderno: function (ctx, s, env) {
      // Draw: on line 1 a `cuaderno-fuentes` holds five source cards and its answers link to passages in them, with MARIANA beside it; on line 2 the label «reduce, no elimina» appears, and outside the notebook a stack of missing key studies casts a shadow labeled «sesgo de selección», with the legend item `validez`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var nx = 680, ny = 316, nw = 520, nh = 300;
      var nq = beat(s, 0, 0, 0.35);
      var ax = nx + 50, ay = ny + 70;
      if (nq > 0) {
        C.lamp(ctx, 'cuaderno-fuentes', { x: nx, y: ny, w: nw, h: nh, sources: 5, r: 38, p: nq, t: s.t });
        // the answer and its citation links to passages in the sources
        var aq = beat(s, 0, 0.4, 0.7);
        if (aq > 0) {
          S.shape(ctx, P.rect(ax, ay, 190, 66, 8), { role: 'accent-5', p: aq, seed: 820, weight: 'thin', offset: false });
          for (var l = 0; l < 3; l++) {
            var yy = ay + 18 + l * 16;
            S.stroke(ctx, [[ax + 12, yy], [ax + 160 - l * 20, yy + 1]], { weight: 'hair', taper: false, p: aq, seed: 821 + l });
            var src = [0, 2, 4][l], sy = ny - nh / 2 + 40 + src * (nh - 80) / 4;
            var lk = beat(s, 0, 0.55 + l * 0.1, 0.7 + l * 0.1);
            if (lk > 0) {
              S.fill(ctx, P.rect(nx - nw / 2 + 42, sy - 8, 56, 8, 3), { role: 'accent-2', offset: false, texture: false, alpha: 0.9, p: lk });
              C.v4v8.dashed(ctx, [[ax - 2, yy], [nx - nw / 2 + 108, sy - 4]], { weight: 'hair', on: 5, off: 4, seed: 830 + l, role: 'accent-3' });
            }
          }
        }
      }
      // line 2: «reduce, no elimina»; outside, the missing key studies cast their shadow over the answer
      var rq = beat(s, 1, 0, 0.3);
      if (rq > 0) C.box(ctx, { x: nx - 150, y: 92, w: 300, h: 50 }, { label: tx('t1'), size: 22, role: 'accent-2', weight: 'bold', p: rq, seed: 840, motion: 'pop' });
      var mq = beat(s, 1, 0.3, 0.55);
      if (mq > 0) {
        ctx.save();
        ctx.translate(500, 420); ctx.rotate(0.07);
        S.fill(ctx, P.blob(0, 0, 330, 40, 801, 4, 0.1), { role: 'ink-soft', seed: 802, alpha: 0.3 * mq });
        ctx.restore();
        for (var k = 0; k < 4; k++) {
          var cy = 330 - k * 12, cx = 150 + k * 7;
          ctx.save(); ctx.globalAlpha *= mq;
          S.fill(ctx, P.rect(cx, cy, 96, 70, 6), { role: 'ground', offset: false, texture: false });
          C.v4v8.dashed(ctx, P.rect(cx, cy, 96, 70, 6), { weight: 'thin', seed: 810 + k, on: 7, off: 5 });
          ctx.restore();
        }
        S.text(ctx, tx('t2'), 300, 498, { size: 22, weight: 700, align: 'center', p: beat(s, 1, 0.45, 0.7) });
        C.legendChip(ctx, 'validez', 190, 540, { p: beat(s, 1, 0.55, 0.8), size: 20, r: 22 });
      }
      // Mariana beside the notebook
      C.person(ctx, 'mariana', { pose: 'pointing', x: 1070, y: 560, scale: 0.86, flip: true, t: s.t, p: E.out(s.intro) });
    },

    'instrucciones-proyecto': function (ctx, s, env) {
      // Draw: on line 1 a card titled «Instrucciones del proyecto» appears and its lines write themselves: «Responde en español, con lenguaje académico y claro», «Cuando te lo pida, usa solo las fuentes del proyecto», «Nunca inventes referencias, cifras ni citas textuales», «Citas en formato APA 7», «Antes de una tarea larga, propón un plan y espera mi confirmación»; on line 2 the legend item `etica-datos` appears with the label «solo documentos que se puedan compartir».
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var card = { x: 70, y: 92, w: 810, h: 440 };
      var cq = beat(s, 0, 0, 0.12);
      if (cq > 0) {
        S.mark(ctx, 'card', card, { p: cq, variant: 'accent-2', seed: 901 });
        S.text(ctx, tx('t1'), card.x + 40, card.y + 60, { size: 30, weight: 700, p: cq });
        S.stroke(ctx, [[card.x + 40, card.y + 78], [card.x + 420, card.y + 79]], { weight: 'thin', taper: false, p: cq, seed: 902 });
        // a small lamp that reads these instructions
        C.lamp(ctx, 'lampara', { x: card.x + card.w - 66, y: card.y + 54, r: 28, p: beat(s, 0, 0.1, 0.3), t: s.t });
      }
      var y = card.y + 134;
      ['t2', 't3', 't4', 't5', 't6'].forEach(function (k, i) {
        var q = beat(s, 0, 0.12 + i * 0.16, 0.27 + i * 0.16);
        var lines = 1;
        if (q > 0) {
          S.fill(ctx, P.circle(card.x + 48, y - 7, 5, 10), { role: 'ink', offset: false, texture: false });
          // the line writes itself from left to right
          ctx.save();
          ctx.beginPath(); ctx.rect(card.x + 60, y - 30, (card.w - 80) * q, 76); ctx.clip();
          lines = S.text(ctx, tx(k), card.x + 68, y, { size: 21, weight: 600, maxWidth: card.w - 120, maxLines: 2, lineHeight: 1.2 }).lines.length;
          ctx.restore();
        }
        y += 54 + (lines - 1) * 25;
      });
      // line 2: only documents that can be shared
      var eq = beat(s, 1, 0, 0.3);
      if (eq > 0) {
        C.legendChip(ctx, 'etica-datos', 916, 176, { p: eq, size: 20, r: 22 });
        var dq = beat(s, 1, 0.2, 0.5);
        C.prop(ctx, 'article-card', { x: 920, y: 226, w: 86, h: 112, seed: 910, p: dq });
        C.check(ctx, 998, 330, 28, { p: beat(s, 1, 0.35, 0.55), seed: 911 });
        S.text(ctx, tx('t7'), 1030, 270, { size: 21, weight: 700, maxWidth: 210, lineHeight: 1.2, p: dq });
      }
    },

    skill: function (ctx, s, env) {
      // Draw: course sign `piezas-agente`, a meaning zone, with its four items appearing one per line: on line 1 «Skill», a folder with an instruction sheet «SKILL.md», next to the analogy «el instructivo del grupo para una tarea»; on line 2 «Subagente», a `subagente` that receives a task card and returns one summary card, next to «el auxiliar que revisa artículos y entrega un informe»; on line 3 «Plugin», a kit box holding skills, a subagent and connectors, next to «el kit de métodos que un grupo comparte con otro», and «Conector (MCP)», a `conector` joining the lamp to a drawer, next to «la credencial de biblioteca».
      var C = env.course, tx = env.tx;
      C.sign(ctx, 'piezas-agente', {
        x: 50, y: 92, w: 1180, h: 484,
        labels: [tx('t1'), tx('t2'), tx('t4'), tx('t6'), tx('t8')],
        analogies: [tx('t3'), tx('t5'), tx('t7'), tx('t9')],
        q: [beat(s, 0, 0, 0.4), beat(s, 1, 0, 0.4), beat(s, 2, 0, 0.35), beat(s, 2, 0.45, 0.8)],
        flow: beat(s, 1, 0.3, 0.9), t: s.t
      });
    },

    estandar: function (ctx, s, env) {
      // Draw: on line 1 a skill folder is copied into several frames labeled «Claude», «ChatGPT y Codex», «GitHub Copilot» and «OpenCode», with a card «estándar abierto, diciembre de 2025»; on line 2 the skill folder is placed beside a codebook on a shelf labeled «OSF», with the legend item `transparencia`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var a = s.at(0), b = s.at(1);
      var sheet = sceneTexts(env, 'skill').t2;
      var frames = [{ x: 560, y: 96, k: 't1' }, { x: 900, y: 96, k: 't2' }, { x: 560, y: 252, k: 't3' }, { x: 900, y: 252, k: 't4' }];
      frames.forEach(function (f, i) {
        var q = beat(s, 0, 0.1 + i * 0.08, 0.22 + i * 0.08);
        if (q <= 0) return;
        ctx.save(); ctx.globalAlpha *= E.clamp(q * 1.5, 0, 1);
        S.machine(ctx, 'browser', { x: f.x, y: f.y, w: 310, h: 136, bar: 22 });
        S.machine(ctx, 'label', { text: tx(f.k), x: f.x + 70, y: f.y + 16, size: 15, maxWidth: 230 });
        C.lamp(ctx, 'lampara', { x: f.x + 58, y: f.y + 82, r: 26, t: s.t, still: true });
        ctx.restore();
        var arrive = beat(s, 0, 0.35 + i * 0.1, 0.5 + i * 0.1);
        if (arrive >= 1) C.v4v8.skillFolder(ctx, f.x + 210, f.y + 84, 0.62, '', 1, 960 + i * 7);
        else if (arrive > 0) {
          var v = E.inOut(arrive);
          C.v4v8.skillFolder(ctx, E.lerp(240, f.x + 210, v), E.lerp(250, f.y + 84, v) - Math.sin(v * Math.PI) * 40, E.lerp(1.1, 0.62, v), '', 1, 960 + i * 7);
        }
      });
      var kq = beat(s, 0, 0.6, 0.85);
      if (kq > 0) C.box(ctx, { x: 640, y: 412, w: 490, h: 56 }, { label: tx('t5'), size: 21, role: 'accent-2', weight: 'bold', p: kq, seed: 990 });
      // the original skill: first at the left, on line 2 it goes to the shelf beside a codebook
      var mv = E.inOut(beat(s, 1, 0.05, 0.4));
      C.v4v8.skillFolder(ctx, E.lerp(240, 230, mv), E.lerp(250, 470, mv), E.lerp(1.4, 1.05, mv), sheet, E.out(s.intro), 950);
      var shq = beat(s, 1, 0, 0.25);
      if (shq > 0) {
        S.stroke(ctx, [[100, 528], [470, 529]], { weight: 'bold', taper: false, p: shq, seed: 991 });
        S.stroke(ctx, [[120, 530], [120, 556]], { weight: 'regular', taper: false, p: shq, seed: 992 });
        S.stroke(ctx, [[450, 530], [450, 556]], { weight: 'regular', taper: false, p: shq, seed: 993 });
        // the codebook beside it
        var bq = beat(s, 1, 0.3, 0.55);
        S.shape(ctx, P.rect(318, 432, 66, 94, 6), { role: 'accent-3', p: bq, seed: 994, weight: 'regular' });
        S.stroke(ctx, [[332, 434], [332, 524]], { weight: 'thin', taper: false, p: bq, seed: 995, role: 'ground' });
        S.fill(ctx, P.rect(342, 452, 32, 22, 3), { role: 'ground', offset: false, texture: false, p: bq });
        C.box(ctx, { x: 200, y: 540, w: 130, h: 34 }, { label: tx('t6'), size: 19, role: 'ground-2', weight: 'thin', p: beat(s, 1, 0.4, 0.6), seed: 996, r: 8 });
        C.legendChip(ctx, 'transparencia', 516, 510, { p: beat(s, 1, 0.55, 0.85), size: 20, r: 22 });
      }
      void a; void b;
    },

    'cuidado-skill': function (ctx, s, env) {
      // Draw: on line 1 a skill folder is applied to a long row of document cards, and check marks and error marks multiply together along the row, while a small sample of cards is held aside at a `bandera-control` labeled «pruebe con una muestra»; on line 2 a third-party plugin box arrives with the label «ejecuta instrucciones con sus permisos», and a `subagente` returns a summary card that now carries small links labeled «fuentes, citas y archivos»; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var n = 12, x0 = 214, dx = 84, y0 = 166;
      var sweep = beat(s, 0, 0.05, 0.62);
      var fx = E.lerp(x0 - 70, x0 + (n - 1) * dx + 90, sweep);
      var errs = [2, 6, 9];
      for (var i = 0; i < n; i++) {
        var cx = x0 + i * dx;
        C.prop(ctx, 'article-card', { x: cx, y: y0, w: 60, h: 76, seed: 1001 + i, p: E.out(s.intro), barRole: ART[i % ART.length] });
        var mq = E.clamp((fx - cx - 30) / 50, 0, 1);
        if (mq > 0) {
          if (errs.indexOf(i) >= 0) C.cross(ctx, cx + 30, y0 + 104, 22, { p: mq, weight: 'bold' });
          else C.check(ctx, cx + 30, y0 + 104, 24, { p: mq, seed: 1020 + i });
        }
      }
      // the skill passes above the row, card by card
      C.v4v8.skillFolder(ctx, Math.min(fx, x0 + (n - 1) * dx + 30), y0 - 36, 0.62, '', E.out(s.intro), 1030);
      // a small sample, held aside at a human checkpoint
      var sq = beat(s, 0, 0.6, 0.85);
      if (sq > 0) {
        for (var k = 0; k < 3; k++) C.prop(ctx, 'article-card', { x: 96 + k * 22, y: 316 + k * 8, w: 60, h: 76, seed: 1001 + k, barRole: ART[k], p: sq });
        C.prop(ctx, 'bandera-control', { x: 262, y: 408, s: 0.85, p: sq, label: tx('t1'), size: 19, maxWidth: 240 });
      }
      // line 2: a third-party plugin, and a subagent whose summary now shows what it used
      var pq = beat(s, 1, 0, 0.3);
      if (pq > 0) {
        var px = E.lerp(1300, 640, E.out(pq));
        C.v4v8.kitBox(ctx, px, 376, 0.95, pq, s.t, 1040);
        S.text(ctx, tx('t2'), 640, 474, { size: 20, weight: 700, align: 'center', maxWidth: 300, lineHeight: 1.2, p: beat(s, 1, 0.2, 0.45) });
      }
      var bq = beat(s, 1, 0.4, 0.6);
      if (bq > 0) {
        var sx = 900, sy = 376;
        C.lamp(ctx, 'subagente', { x: sx, y: sy, r: 26, p: bq, t: s.t, flow: beat(s, 1, 0.45, 0.75) });
        var oq = beat(s, 1, 0.72, 0.9);
        if (oq > 0) {
          var ox = 1040, oy = 352;
          ctx.save(); ctx.globalAlpha *= oq;
          S.machine(ctx, 'card', { x: ox, y: oy, w: 74, h: 54, lines: 4 });
          ctx.restore();
          var icons = [['article', 1000], ['quote', 1077], ['folder', 1154]];
          icons.forEach(function (ic, j) {
            var q = E.stagger(oq, j, 3, 0.5);
            if (q <= 0) return;
            S.stroke(ctx, [[ox + 37, oy + 56], [ic[1], 452]], { weight: 'hair', taper: false, p: q, seed: 1050 + j, role: 'accent-3' });
            if (ic[0] === 'article') C.prop(ctx, 'article-card', { x: ic[1] - 16, y: 452, w: 32, h: 40, seed: 1060, p: q });
            else if (ic[0] === 'quote') { S.shape(ctx, P.rect(ic[1] - 18, 452, 36, 40, 6), { role: 'ground', p: q, seed: 1061, weight: 'thin', offset: false }); S.text(ctx, '«»', ic[1], 480, { size: 20, weight: 700, align: 'center', p: q }); }
            else C.prop(ctx, 'folder', { x: ic[1], y: 472, w: 40, h: 30, p: q, seed: 1062 });
          });
          S.text(ctx, tx('t3'), 1077, 526, { size: 19, weight: 700, align: 'center', maxWidth: 260, p: beat(s, 1, 0.8, 0.95) });
        }
      }
    },

    caso: function (ctx, s, env) {
      // Draw: place `oficina-grupo`: JULIÁN, MARIANA and AMPARO at the table; on line 1 the wall screen shows a comparison table with the rows «Asta», «Consensus» and «Undermind»; on line 2 its columns appear, «Consulta exacta», «Fecha», «Útiles de los 10 primeros», «En más de una herramienta» and «En español», filled with short marks and no numbers; on line 3 three article cards pass through the five verification steps «¿Existe?», «¿Los datos coinciden?», «¿Dice lo que la IA afirma?», «¿Es pertinente y de calidad?» and «Registrar»; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx;
      var b = s.at(1), c = s.at(2), d = s.at(3);
      var pl = C.place(ctx, 'oficina-grupo', { p: E.out(s.intro), board: false, window: false, seats: [300, 640, 980] });
      // the bank's card of the workshop, on the wall beside the screen (its corner shape tucks behind it)
      var fq = beat(s, 1, 0, 0.3);
      if (fq > 0) env.cards.figure(ctx, 'curso.taller-busqueda', { x: 22, y: 92, w: 278, h: 288 }, { p: fq, compact: true });
      var sx = 310, sy = 92, sw = 660, sh = 300;
      C.prop(ctx, 'screen', { x: sx + sw / 2, y: sy + sh + 40, w: sw, h: sh, p: E.out(s.intro), seed: 3, screenRole: 'ground' });
      var inner = { x: sx + 24, y: sy + 22, w: sw - 48, h: sh - 44 };
      // the comparison table (lines 1, 2 and 4) or the verification steps (line 3)
      var toSteps = E.segment(c, 0, 0.15) * (1 - E.segment(d, 0, 0.15));
      if (toSteps < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - toSteps;
        var heads = ['', tx('t4'), tx('t5'), tx('t6'), tx('t7'), tx('t8')];
        var colQ = function (i) { return i === 0 ? 1 : E.segment(b, 0.05 + (i - 1) * 0.16, 0.2 + (i - 1) * 0.16); };
        var cols = [0.18, 0.18, 0.12, 0.18, 0.2, 0.14];
        var shown = heads.map(function (h, i) { return colQ(i) > 0 ? h : ''; });
        var rows = [[tx('t1')], [tx('t2')], [tx('t3')]].map(function (r) { return r.concat([null, null, null, null, null]); });
        var tb = C.table(ctx, { x: inner.x, y: inner.y + 12, w: inner.w, headers: shown, cols: cols, rows: rows, nRows: 3, rowH: 52, headH: 70, headSize: 15, size: 18, cellWeight: 700, p: beat(s, 0, 0, 0.3), marks: false });
        // short marks, no numbers, as each column appears
        for (var ci = 1; ci < 6; ci++) {
          var q = colQ(ci);
          if (q <= 0) continue;
          for (var ri = 0; ri < 3; ri++) {
            var mw = (cols[ci] * inner.w - 28) * (0.4 + 0.4 * (((ri * 7 + ci * 3) % 5) / 5));
            S.stroke(ctx, [[tb.cx[ci] + 12, tb.y + tb.headH + ri * 52 + 26], [tb.cx[ci] + 12 + mw * q, tb.y + tb.headH + ri * 52 + 27]], { weight: 'thin', taper: false, seed: 1100 + ri * 10 + ci, role: 'accent-3' });
          }
        }
        // line 4: the group's rows of the shared sheet, the session's first product
        var hq = beat(s, 3, 0.1, 0.4);
        if (hq > 0) S.stroke(ctx, S.path.wobble(S.path.rect(tb.x - 8, tb.y + tb.headH - 4, tb.w + 16, 52 * 3 + 10, 12), 1130, 1.2), { weight: 'heavy', role: 'accent-2', closed: true, taper: false, p: hq, seed: 1130 });
        ctx.restore();
      }
      if (toSteps > 0) {
        ctx.save(); ctx.globalAlpha *= toSteps;
        verifySteps(ctx, env, inner, [tx('t9'), tx('t10'), tx('t11'), tx('t12'), tx('t13')], E.segment(c, 0.05, 0.95));
        ctx.restore();
      }
      var seats = pl.seats;
      C.person(ctx, 'julian', { pose: 'seated', x: seats[0].x, y: seats[0].y, scale: seats[0].scale, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: seats[1].x, y: seats[1].y, scale: seats[1].scale, t: s.t });
      C.person(ctx, 'amparo', { pose: 'seated', x: seats[2].x, y: seats[2].y, scale: seats[2].scale, t: s.t });
      pl.front(ctx);
    },

    'skill-caso': function (ctx, s, env) {
      // Draw: on line 1 the screen shows a skill card with the fields «Nombre: ficha-articulo», «Cuándo usarla», «Pasos», «Criterios de calidad», «Ejemplo de entrada y de salida» and «Lo que nunca debe hacer»; on line 2 MARIANA hands it to AMPARO for review at a `bandera-control`.
      var C = env.course, tx = env.tx;
      var b = s.at(1);
      C.place(ctx, 'oficina-grupo', { p: E.out(s.intro), board: false, window: false });
      var sx = 196, sy = 84, sw = 560, sh = 392;
      C.prop(ctx, 'screen', { x: sx + sw / 2, y: sy + sh + 40, w: sw, h: sh, p: E.out(s.intro), seed: 5, screenRole: 'ground' });
      C.sign(ctx, 'ficha-proyecto', {
        x: sx + 22, y: sy + 20, w: sw - 44, h: sh - 40, title: tx('t1'), p: E.out(s.intro),
        fields: ['t2', 't3', 't4', 't5', 't6'].map(function (k, i) { return { label: tx(k), marks: 1, q: beat(s, 0, 0.15 + i * 0.15, 0.32 + i * 0.15) }; })
      });
      // Mariana hands the skill card to Amparo, who reviews it at a human checkpoint
      var turn = b > 0;
      var m = C.person(ctx, 'mariana', { pose: turn ? 'presenting' : 'pointing', flip: !turn, x: 850, y: 566, scale: 0.86, t: s.t, p: E.out(s.intro) });
      var am = C.person(ctx, 'amparo', { pose: 'standing', flip: true, x: 1170, y: 566, scale: 0.86, t: s.t, p: E.out(s.intro) });
      var hq = beat(s, 1, 0.05, 0.6);
      if (hq > 0 && m.rightHand && (am.rightHand || am.leftHand)) {
        var v = E.inOut(hq), to = am.rightHand || am.leftHand;
        var hx = E.lerp(m.rightHand[0], to[0], v), hy = E.lerp(m.rightHand[1], to[1], v) - Math.sin(v * Math.PI) * 50;
        C.prop(ctx, 'article-card', { x: hx - 22, y: hy - 52, w: 44, h: 56, seed: 1201, barRole: 'accent-3' });
      }
      var fq = beat(s, 1, 0.3, 0.6);
      if (fq > 0) C.prop(ctx, 'bandera-control', { x: 1012, y: 500, s: 0.95, p: fq, size: 18, maxWidth: 200 });
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-citar` in the center; on line 1 small icons of the `ciclo-busqueda`, the `medidor`, the `grafo`, the `proyecto-carpeta` and the `piezas-agente` return around it.
      var S = env.style, C = env.course;
      var a = s.at(0);
      C.stamp(ctx, 'stamp-citar', { x: 640, y: 300, r: 122, p: E.out(s.intro) });
      var icons = [
        function () { C.sign(ctx, 'ciclo-busqueda', { cx: -40, cy: -30, rx: 210, ry: 150, labels: ['', '', '', '', ''], q: [1, 1], t: s.t, still: true, active: null, exitW: 220, exitGap: 40, exitDy: 62 }); },
        function () { C.lamp(ctx, 'medidor', { x: 0, y: 70, r: 150, labels: ['', '', '', ''], needle: 0 }); },
        function () { S.machineArea(ctx, -150, -110, 300, 220); S.machine(ctx, 'graph', { x: 0, y: 0, r: 82, n: 10, seed: 7 }); },
        function () { C.sign(ctx, 'proyecto-carpeta', { folder: { x: -250, y: -200, w: 500, h: 400 }, labels: ['', '', ''], q: [0, 1, 0] }); },
        function () {
          C.v4v8.skillFolder(ctx, -230, -60, 1.3, '', 1, 1301);
          C.v4v8.kitBox(ctx, -220, 120, 1.1, 1, 0, 1310);
          S.machineArea(ctx, -60, -170, 380, 340);
          C.lamp(ctx, 'subagente', { x: 60, y: -80, r: 34, flow: 0, still: true });
          C.lamp(ctx, 'conector', { x: 30, y: 90, r: 30, dx: 170, still: true });
        }
      ];
      var pos = [[262, 196, 0.22], [1018, 196, 0.36], [230, 418, 0.3], [1050, 418, 0.24], [640, 500, 0.25]];
      icons.forEach(function (fn, i) {
        var q = E.segment(a, 0.08 + i * 0.13, 0.3 + i * 0.13);
        if (q <= 0) return;
        var px = pos[i][0], py = pos[i][1];
        C.box(ctx, { x: px - 104, y: py - 58, w: 208, h: 116 }, { role: false, p: q, weight: 'thin', seed: 1320 + i });
        ctx.save();
        ctx.globalAlpha *= E.clamp(q * 1.5, 0, 1);
        ctx.translate(px, py); ctx.scale(pos[i][2], pos[i][2]);
        fn();
        ctx.restore();
      });
    }
  };

  NS.videos.v4 = { zones: zones, scenes: scenes };
})(window.IAHI);
