/* V8 · presentar-flujo · «Presentar su flujo de trabajo con IA» (spec §11 V8).
   Every on-screen text comes from the scene's `texts`, the figure bank, the cast or the data;
   visual beats follow the voice through s.at(i). */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  function fig(env, id) { return env.data.figuresById[id]; }
  function rotulo(env) { return (env.data.rotulos || {}).banderaControl || ''; }

  // ------------------------------------------------------------------ small drawings of this video
  // A presentation slide: a cream page with a bold outline and a title stroke (no text).
  function slide(ctx, S, b, p, seed) {
    var a = S.appear('bloom', p);
    if (a.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(a.scale, a.scale); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    var shape = S.path.rect(b.x, b.y, b.w, b.h, 12);
    S.fill(ctx, shape, { role: 'ground', offset: false, texture: false });
    S.fill(ctx, S.path.rect(b.x + 8, b.y + 8, b.w - 16, 40, 8), { role: 'ground-2', offset: false, texture: false });
    S.stroke(ctx, S.path.wobble(shape, seed, 1.1), { weight: 'bold', closed: true, taper: false, swell: 0.25, seed: seed });
    S.stroke(ctx, [[b.x + 26, b.y + 29], [b.x + b.w * 0.38, b.y + 30]], { weight: 'regular', taper: false, seed: seed + 1 });
    S.stroke(ctx, [[b.x + b.w * 0.42, b.y + 29], [b.x + b.w * 0.52, b.y + 30]], { weight: 'thin', taper: false, seed: seed + 2 });
    ctx.restore();
  }

  // A calligraphic timer face (human manner): ring, knob, hands and an elapsed sector.
  function clock(ctx, S, x, y, r, o) {
    o = o || {};
    var P = S.path, p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    var a = S.appear('pop', p);
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(x, y); ctx.scale(a.scale, a.scale);
    S.shape(ctx, P.rect(-r * 0.2, -r * 1.3, r * 0.4, r * 0.28, 3), { role: 'ink-soft', weight: 'thin', seed: 3 });
    S.fill(ctx, P.circle(0, 0, r, 40), { role: 'ground', offset: false, texture: false });
    if (o.sweep > 0) {
      var sec = [[0, 0]].concat(P.arc(0, 0, r * 0.84, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, o.sweep), 36));
      sec.closed = true;
      S.fill(ctx, sec, { role: o.sweepRole || 'accent-2', offset: false, texture: false });
    }
    S.stroke(ctx, P.wobble(P.circle(0, 0, r, 40), 9, 1), { weight: r > 30 ? 'bold' : 'regular', closed: true, taper: false, swell: 0.2, seed: 9 });
    for (var k = 0; k < 12; k += 3) {
      var ta = k * Math.PI / 6;
      S.stroke(ctx, [[Math.cos(ta) * r * 0.78, Math.sin(ta) * r * 0.78], [Math.cos(ta) * r * 0.9, Math.sin(ta) * r * 0.9]], { weight: 'thin', taper: false, seed: 20 + k });
    }
    var ang = o.angle == null ? -Math.PI / 2 + (o.sweep || 0) * Math.PI * 2 : o.angle;
    S.stroke(ctx, [[0, 0], [Math.cos(ang) * r * 0.7, Math.sin(ang) * r * 0.7]], { weight: r > 30 ? 'regular' : 'thin', taper: false, seed: 10 });
    S.fill(ctx, P.circle(0, 0, Math.max(2.5, r * 0.09), 10), { role: 'ink', offset: false, texture: false });
    ctx.restore();
  }

  // Inside the boxes of `diagrama-flujo`: a stroke for the stage's name (no text) and, on demand, the
  // stage's tool (a small lamp beside a tool slot).
  function stageDetails(ctx, env, boxes, o) {
    var S = env.style, C = env.course;
    boxes.forEach(function (b, i) {
      var q = Math.min(o.p == null ? 1 : o.p, b.q == null ? 1 : b.q);
      if (q <= 0) return;
      var w1 = b.w * (0.46 + 0.1 * ((i * 3) % 4) / 3);
      S.stroke(ctx, [[b.x + b.w / 2 - w1 / 2, b.y + (o.nameY || 24)], [b.x + b.w / 2 + w1 / 2, b.y + (o.nameY || 24) + 1]], { weight: 'regular', taper: false, p: q, seed: (o.seed || 900) + i });
      var tq = o.tools == null ? 0 : (typeof o.tools === 'function' ? o.tools(i) : o.tools);
      if (tq > 0) {
        var lr = o.lampR || 13, ty = b.y + b.h - lr - 12;
        C.lamp(ctx, 'lampara', { x: b.x + 14 + lr, y: ty, r: lr, p: tq, t: env.t, still: true });
        C.box(ctx, { x: b.x + 22 + lr * 2, y: ty - 12, w: b.w - 34 - lr * 2, h: 24 }, { p: tq, role: 'accent-5', r: 12, lines: 1, linesY: 12, seed: (o.seed || 900) + 20 + i, weight: 'thin' });
      }
    });
  }

  // Human checkpoints on top of some stage boxes.
  function boxFlags(ctx, env, boxes, idx, p, s) {
    idx.forEach(function (i, k) {
      var b = boxes[i];
      if (!b) return;
      var q = E.stagger(p, k, idx.length, 0.5);
      if (q > 0) env.course.prop(ctx, 'bandera-control', { x: b.x + b.w - 28 * (s / 0.5), y: b.y + 3, s: s, p: q, showLabel: false });
    });
  }

  // The scope of `curso.presentacion` lists, clause by clause, the questions after the bar (one
  // number below the total) and the timer's warnings (two numbers up to the total).
  function presentationExtras(env, f, total) {
    var pv = env.charts.parseValue, out = { marks: null, tail: null };
    String(f.alcance || '').split(';').forEach(function (cl) {
      var nums = (cl.match(/\d+(?:,\d+)?/g) || []).map(pv);
      if (nums.length >= 2 && !out.marks && nums.every(function (n) { return n > 0 && n <= total; })) out.marks = nums;
      else if (nums.length === 1 && out.tail == null && nums[0] > 0 && nums[0] < total) out.tail = nums[0];
    });
    return out;
  }

  // `seis-ejes` with a thin ring line through its items; the line breaks around each item and its label.
  function axesRing(ctx, env, o) {
    var S = env.style, P = S.path, C = env.course;
    var q = o.q == null ? 1 : o.q;
    if (q <= 0) return;
    var ids = (env.data.legend || []).map(function (l) { return l.id; });
    var boxes = ids.map(function (id, i) {
      var ang = -Math.PI / 2 + i * Math.PI * 2 / ids.length;
      var x = o.cx + Math.cos(ang) * o.rx, y = o.cy + Math.sin(ang) * o.ry;
      var w = S.measure(ctx, (env.legend.item(id) || {}).label || '', o.size, 700) + 60;
      return { x: x - w / 2 - 10, y: y - o.r - 9, w: w + 20, h: o.r * 2 + 18 };
    });
    var runs = [], run = [];
    P.ellipse(o.cx, o.cy, o.rx, o.ry, 240).forEach(function (pt) {
      var inside = boxes.some(function (b) { return pt[0] > b.x && pt[0] < b.x + b.w && pt[1] > b.y && pt[1] < b.y + b.h; });
      if (inside) { if (run.length > 1) runs.push(run); run = []; } else run.push(pt);
    });
    if (run.length > 1) runs.push(run);
    runs = runs.filter(function (r) { return P.length(r) > 30; });
    var total = runs.reduce(function (acc, r) { return acc + P.length(r); }, 0), done = 0;
    runs.forEach(function (r, k) {
      var L = P.length(r), rq = E.clamp((q * total - done) / Math.max(1, L), 0, 1);
      done += L;
      if (rq > 0) S.stroke(ctx, r, { weight: o.weight || 'thin', p: rq, seed: (o.seed || 1401) + k, taper: false });
    });
    C.sign(ctx, 'seis-ejes', { cx: o.cx, cy: o.cy, rx: o.rx, ry: o.ry, size: o.size, r: o.r, stepP: function (i) { return E.stagger(q, i, 6, 0.7); } });
  }

  var zones = {
    gancho: [[150, 60, 1000, 100], [200, 150, 900, 430]],
    entrega: [[40, 90, 1210, 490]],
    estructura: [[40, 110, 1210, 440]],
    flujo: [[50, 95, 1190, 450]],
    rubrica: [[40, 90, 1215, 490]],
    galeria: [[50, 85, 1200, 495]],
    transferible: [[50, 110, 1200, 400]],
    caso: [[180, 95, 1080, 480]],
    declaracion: [[270, 70, 940, 500]],
    ideas: [[90, 140, 1100, 450]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: the title «Presentar su flujo de trabajo con IA» at the top; on line 1 course sign `diagrama-flujo` appears on a slide with a timer frame beside it, and the `seis-ejes` ring appears small below.
      var S = env.style, C = env.course, tx = env.tx;
      S.title(ctx, tx('t1'), { x: 690, y: 130, size: 46, align: 'center', p: beat(s, 0, 0, 0.3), maxWidth: 960 });
      var sl = { x: 270, y: 174, w: 560, h: 248 };
      var sp = beat(s, 0, 0.15, 0.35);
      if (sp > 0) {
        slide(ctx, S, sl, sp, 31);
        var fl = beat(s, 0, 0.25, 0.55);
        var flow = C.sign(ctx, 'diagrama-flujo', { x: sl.x + 32, y: sl.y + 106, w: sl.w - 64, labels: ['', '', '', ''], tools: true, boxH: 92, gap: 34, size: 16, stepP: function (i) { return E.stagger(fl, i, 4, 0.6); } });
        if (flow) {
          stageDetails(ctx, env, flow.boxes, { p: fl, seed: 910 });
          boxFlags(ctx, env, flow.boxes, [1, 3], beat(s, 0, 0.45, 0.6), 0.38);
        }
      }
      // the timer frame beside the slide
      var tq = beat(s, 0, 0.3, 0.5);
      if (tq > 0) {
        C.box(ctx, { x: 862, y: 200, w: 178, h: 196 }, { p: tq, role: 'ground', weight: 'bold', seed: 32 });
        clock(ctx, S, 951, 306, 56, { p: tq, sweep: 0.12 + 0.55 * beat(s, 0, 0.3, 1) });
      }
      // the six axes, a small ring below
      axesRing(ctx, env, { cx: 650, cy: 510, rx: 330, ry: 60, size: 15, r: 15, q: beat(s, 0, 0.5, 0.95), weight: 'hair', seed: 1501 });
    },

    entrega: function (ctx, s, env) {
      // Draw: on line 1 a folder labeled «Carpeta compartida» receives four cards one after another, «Diagrama del flujo en una página», «Diapositivas (máximo 6)», «Bitácora de uso de IA completa» and «Declaración de uso de IA», with the card of `curso.entrega`; on line 2 a clock card labeled «48 horas antes» closes the folder.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var a = s.at(0), b = s.at(1);
      var fx = 640, fy = 382, fw = 250, fh = 168, x0 = fx - fw / 2, y0 = fy - fh / 2;
      var keys = ['t2', 't3', 't4', 't5'];
      var arrived = 0;
      // the folder's back and the label
      var fq = E.out(s.intro);
      var back = C.v4v8.poly([[x0, y0 + 16], [x0 + fw * 0.34, y0 + 16], [x0 + fw * 0.42, y0], [x0 + fw, y0], [x0 + fw, y0 + fh], [x0, y0 + fh]]);
      S.shape(ctx, back, { role: 'accent-7', p: fq, seed: 41, weight: 'bold' });
      S.text(ctx, tx('t1'), fx, y0 + fh + 34, { size: 22, weight: 700, align: 'center', p: fq });
      keys.forEach(function (k, i) {
        var t0 = 0.04 + i * 0.2;
        var cq = E.segment(a, t0, t0 + 0.1);
        var cy = 104 + i * 86;
        if (cq > 0) C.box(ctx, { x: 50, y: cy, w: 392, h: 68 }, { label: tx(k), size: 19, role: 'ground', align: 'left', p: cq, seed: 50 + i });
        var fly = E.inOut(E.segment(a, t0 + 0.08, t0 + 0.19));
        if (fly >= 1) {
          arrived++;
          C.check(ctx, 418, cy + 34, 20, { p: E.segment(a, t0 + 0.17, t0 + 0.21), seed: 60 + i });
        } else if (fly > 0) {
          var px = E.lerp(446, x0 + 60 + i * 34, fly), py = E.lerp(cy + 34, y0 + 8, fly) - Math.sin(fly * Math.PI) * 40;
          C.prop(ctx, 'article-card', { x: px - 20, y: py - 26, w: 40, h: 52, seed: 70 + i, barRole: ['accent-1', 'accent-3', 'accent-2', 'accent-4'][i] });
        }
      });
      // papers inside the folder, then its front (it rises and closes on line 2)
      var close = E.inOut(beat(s, 1, 0.45, 0.75));
      for (var j = 0; j < arrived; j++) C.prop(ctx, 'article-card', { x: x0 + 40 + j * 36, y: y0 - 22 + (j % 2) * 6 + 48 * close, w: 46, h: 70, seed: 70 + j, barRole: ['accent-1', 'accent-3', 'accent-2', 'accent-4'][j] });
      var frontTop = E.lerp(y0 + 42, y0 + 18, close);
      var front = C.v4v8.poly([[x0 - 6, frontTop], [x0 + fw + 6, frontTop], [x0 + fw, y0 + fh], [x0, y0 + fh]]);
      S.shape(ctx, front, { role: 'accent-6', p: fq, seed: 42, weight: 'regular' });
      // the bank's card
      var cardP = beat(s, 0, 0.02, 0.25);
      if (cardP > 0) env.cards.figure(ctx, 'curso.entrega', { x: 846, y: 96, w: 394, h: 262 }, { p: cardP });
      // line 2: the clock card «48 horas antes» comes and closes the folder
      var kq = beat(s, 1, 0, 0.2);
      if (kq > 0) {
        var mv = E.inOut(beat(s, 1, 0.25, 0.55));
        var kx = E.lerp(880, fx - 125, mv), ky = E.lerp(420, fy - 6, mv);
        C.box(ctx, { x: kx, y: ky, w: 250, h: 74 }, { p: kq, role: 'accent-2', weight: 'bold', seed: 80 });
        clock(ctx, S, kx + 40, ky + 37, 22, { p: kq, sweep: 0.75, angle: -Math.PI / 2 + 0.75 * Math.PI * 2 });
        S.text(ctx, tx('t6'), kx + 72, ky + 44, { size: 21, weight: 700, p: kq, maxWidth: 170 });
      }
      void P;
    },

    estructura: function (ctx, s, env) {
      // Draw: course sign `reloj-presentacion`, drawn exactly from figure `curso.presentacion`, a meaning zone; on line 1 the bar's segments appear one by one with their labels «proyecto y pregunta», «flujo de trabajo», «evidencia», «implicaciones y decisiones» and «declaración de uso de IA»; on line 2 two small marks on the bar show the warnings at 6 and at 8 minutes, and a tail segment labeled «preguntas» follows the bar.
      var S = env.style, C = env.course, tx = env.tx;
      var f = fig(env, 'curso.presentacion');
      var total = env.charts.parseValue(f.partes[0].valor);
      var ex = presentationExtras(env, f, total);
      var x0 = 70, unit = (1140 - 18) / (total + (ex.tail || 0));
      C.sign(ctx, 'reloj-presentacion', {
        fig: f, x: x0, y: 214, unit: unit, h: 82, labelW: 170,
        labels: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5')],
        marks: ex.marks || [], tail: ex.tail ? { minutes: ex.tail, label: tx('t6') } : null,
        q: [beat(s, 0, 0, 0.85), beat(s, 1, 0, 0.6)]
      });
      // type badge, scope and source of the figure under the chart
      var meta = beat(s, 0, 0.1, 0.4);
      if (meta > 0) {
        C.badge(ctx, f.tipo, x0, 446, { p: meta, size: 15 });
        S.text(ctx, f.alcance, x0, 506, { size: 16, role: 'ink-soft', p: meta, maxWidth: 1140, maxLines: 2 });
        S.text(ctx, env.cards.sourceLine(f), x0, 532, { size: 15, role: 'ink-soft', p: meta, maxWidth: 1140, maxLines: 1 });
      }
    },

    flujo: function (ctx, s, env) {
      // Draw: course sign `diagrama-flujo` enlarges; on line 1 each stage shows its tool and «para qué», and a `bandera-control` appears where there is a human checkpoint; on line 2 an evidence card «un resultado real y cómo se verificó» is pinned to one stage, with the legend items `validez` and `reproducibilidad`.
      var S = env.style, C = env.course, tx = env.tx;
      var grow = E.inOut(s.intro);
      ctx.save();
      var sc = 0.62 + 0.38 * grow;
      ctx.translate(640, 230); ctx.scale(sc, sc); ctx.translate(-640, -230);
      var flow = C.sign(ctx, 'diagrama-flujo', { x: 70, y: 168, w: 1140, labels: ['', '', '', '', ''], boxH: 124, gap: 40, p: 1 });
      ctx.restore();
      if (grow < 1 || !flow) return;
      var a = s.at(0);
      var toolQ = function (i) { return E.segment(a, 0.05 + i * 0.08, 0.2 + i * 0.08); };
      stageDetails(ctx, env, flow.boxes, { p: 1, seed: 920, tools: toolQ, lampR: 16 });
      flow.boxes.forEach(function (b, i) {
        var pq = E.segment(a, 0.3 + i * 0.07, 0.45 + i * 0.07);
        if (pq <= 0) return;
        S.text(ctx, tx('t1'), b.x + b.w / 2, b.y + b.h + 30, { size: 18, weight: 700, align: 'center', role: 'ink-soft', p: pq });
        S.stroke(ctx, [[b.x + b.w / 2 - 44, b.y + b.h + 50], [b.x + b.w / 2 + 40, b.y + b.h + 51]], { weight: 'thin', taper: false, p: pq, seed: 930 + i });
      });
      var flagQ = beat(s, 0, 0.7, 0.95);
      boxFlags(ctx, env, flow.boxes, [1, 3], flagQ, 0.5);
      if (flagQ > 0) {
        var b1 = flow.boxes[1];
        S.text(ctx, rotulo(env), b1.x + b1.w - 40, b1.y - 56, { size: 16, weight: 700, align: 'right', p: flagQ });
      }
      // line 2: an evidence card pinned to the third stage
      var e = beat(s, 1, 0, 0.35);
      if (e > 0) {
        var st = flow.boxes[2];
        var card = { x: 430, y: 402, w: 420, h: 126 };
        var pinX = st.x + st.w - 36;
        S.stroke(ctx, [[pinX, st.y + st.h + 4], [pinX + 1, card.y + 4]], { weight: 'thin', taper: false, p: e, seed: 940 });
        C.box(ctx, card, { p: e, role: 'ground', weight: 'bold', seed: 941 });
        S.fill(ctx, S.path.circle(pinX, card.y + 6, 8, 14), { role: 'accent-1', offset: false, texture: false, p: e });
        S.stroke(ctx, S.path.circle(pinX, card.y + 6, 8, 14), { weight: 'thin', closed: true, taper: false, p: e });
        S.text(ctx, tx('t2'), card.x + 22, card.y + 52, { size: 20, weight: 700, maxWidth: 236, lineHeight: 1.2, maxLines: 3, p: e });
        // a small capture of the result, checked
        var cx = card.x + card.w - 150, cy = card.y + 22;
        S.shape(ctx, S.path.rect(cx, cy, 112, 78, 6), { role: 'accent-5', p: e, seed: 942, weight: 'thin', offset: false });
        [0.55, 0.8, 0.4, 0.65].forEach(function (hh, k) { S.fill(ctx, S.path.rect(cx + 14 + k * 22, cy + 66 - 44 * hh, 14, 44 * hh, 2), { role: 'accent-3', offset: false, texture: false, p: e }); });
        C.check(ctx, cx + 96, cy + 70, 34, { p: beat(s, 1, 0.3, 0.55), seed: 943 });
      }
      var lq = beat(s, 1, 0.45, 0.8);
      if (lq > 0) C.legendRow(ctx, ['validez', 'reproducibilidad'], 878, 466, { p: lq, size: 19, r: 20 });
    },

    rubrica: function (ctx, s, env) {
      // Draw: course sign `rubrica`, a meaning zone, with the card of `curso.rubrica`; on line 1 the five criteria appear as rows, «Pertinencia», «Validez y verificación», «Reproducibilidad y transparencia», «Ética, protección de datos y equidad» and «Claridad y transferibilidad», each with «20 %»; on line 2 the level scale from 1 to 4 appears beside them, and the row «Validez y verificación» shows its level 4 text «Puntos de control humano, referencias verificadas y, si hay codificación o clasificación automática, validación contra codificación humana» and its level 1 text «Resultados de IA aceptados sin verificar»; on line 3 two `extra-3` tiles with rubric cards appear.
      var S = env.style, C = env.course, tx = env.tx;
      var f = fig(env, 'curso.rubrica');
      var scalePart = f.partes[1] || { valor: '', etiqueta: '' };
      var ends = (scalePart.valor.match(/\d+/g) || []).map(Number);
      var levels = ends.length >= 2 ? ends[1] - ends[0] + 1 : 4;
      var b = s.at(1);
      env.cards.figure(ctx, 'curso.rubrica', { x: 50, y: 414, w: 664, h: 160 }, { p: beat(s, 0, 0.05, 0.3), compact: true });
      var rub = C.sign(ctx, 'rubrica', {
        x: 50, y: 96, criteria: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5')], weight: tx('t6'),
        levels: levels, scaleLabel: scalePart.etiqueta + ' ' + scalePart.valor,
        nameW: 330, weightW: 92, levelW: 58, rowH: 52, headH: 50, size: 18,
        q: [beat(s, 0, 0, 0.7), beat(s, 1, 0, 0.3)], highlight: 1, hq: beat(s, 1, 0.25, 0.45)
      });
      // the row «Validez y verificación»: its level 4 and level 1 texts
      var h4 = E.segment(b, 0.35, 0.6), h1 = E.segment(b, 0.6, 0.85);
      if (rub && h4 > 0) {
        var row = rub.rows[1], c4 = rub.cell(1, levels), c1 = rub.cell(1, 1);
        var hl = function (c, q, role) {
          S.fill(ctx, S.path.circle(c.x + c.w / 2, c.y + c.h / 2, 9, 16), { role: role, offset: false, texture: false, p: q });
          S.stroke(ctx, S.path.circle(c.x + c.w / 2, c.y + c.h / 2, 9, 16), { weight: 'thin', closed: true, taper: false, p: q });
        };
        hl(c4, h4, 'accent-4');
        if (h1 > 0) hl(c1, h1, 'accent-1');
        var bx = 748;
        S.text(ctx, tx('t7'), bx, 118, { size: 20, weight: 700, p: h4 });
        C.box(ctx, { x: bx, y: 134, w: 492, h: 104 }, { p: h4, role: 'ground', seed: 960 });
        C.v4v8.dotsMark(ctx, bx + 32, 160, levels, 3.6, h4);
        S.text(ctx, tx('t8'), bx + 66, 164, { size: 17, weight: 600, maxWidth: 410, lineHeight: 1.22, maxLines: 4, p: h4 });
        if (h1 > 0) {
          C.box(ctx, { x: bx, y: 252, w: 492, h: 62 }, { p: h1, role: 'ground', seed: 961 });
          C.v4v8.dotsMark(ctx, bx + 32, 283, 1, 3.6, h1);
          S.text(ctx, tx('t9'), bx + 66, 289, { size: 17, weight: 600, maxWidth: 410, maxLines: 2, p: h1 });
        }
        // a bracket joins the highlighted row to its two texts
        var brq = E.segment(b, 0.4, 0.7);
        if (brq > 0) {
          var yy = row.y + row.h / 2;
          S.stroke(ctx, [[c4.x + c4.w + 4, yy], [bx - 14, yy + 1]], { weight: 'thin', taper: false, p: brq, seed: 962 });
          S.stroke(ctx, P2(S, bx - 14, 140, 310), { weight: 'thin', taper: false, p: brq, seed: 963 });
        }
      }
      // line 3: two commenters (extra-3) holding rubric cards
      var c = s.at(2);
      [0, 1].forEach(function (i) {
        var q = E.segment(c, 0.05 + i * 0.25, 0.35 + i * 0.25);
        if (q > 0) C.prop(ctx, 'tile', { x: 760 + i * 248, y: 388, w: 230, h: 150, person: S.extraLook(301 + i * 7), prop: 'rubric', t: s.t, p: q, seed: 970 + i });
      });
    },

    galeria: function (ctx, s, env) {
      // Draw: on line 1 several breakout rooms of three teams each appear, with diagrams and short video cards pinned on a shared board, and a small timer in each room; on line 2 the rooms reshuffle for a second round and comment notes accumulate on each team's board, with the cards of `curso.galeria` and `curso.entrega`.
      var S = env.style, C = env.course, P = S.path;
      var a = s.at(0), b = s.at(1);
      // the shared board: one post per team (a diagram and a short video card), comments on line 2
      var bq = beat(s, 0, 0, 0.25);
      var board = { x: 60, y: 92, w: 700, h: 190 };
      if (bq > 0) {
        C.box(ctx, board, { p: bq, role: 'ground-2', weight: 'bold', seed: 1001 });
        for (var t = 0; t < 9; t++) {
          var pq = E.segment(a, 0.15 + t * 0.05, 0.3 + t * 0.05);
          if (pq <= 0) continue;
          var px = board.x + 18 + (t % 3) * 228, py = board.y + 16 + Math.floor(t / 3) * 58;
          ctx.save(); ctx.globalAlpha *= pq;
          // the diagram: three small stages
          S.fill(ctx, P.rect(px, py, 96, 46, 4), { role: 'ground', offset: false, texture: false });
          S.stroke(ctx, P.rect(px, py, 96, 46, 4), { weight: 'thin', closed: true, taper: false, seed: 1010 + t });
          for (var k = 0; k < 3; k++) {
            S.stroke(ctx, P.rect(px + 8 + k * 30, py + 16, 20, 14, 2), { weight: 'hair', closed: true, taper: false, seed: 1020 + k });
            if (k < 2) S.stroke(ctx, [[px + 29 + k * 30, py + 23], [px + 37 + k * 30, py + 23]], { weight: 'hair', taper: false });
          }
          // the short video card
          S.fill(ctx, P.rect(px + 104, py, 60, 46, 4), { role: 'accent-5', offset: false, texture: false });
          S.stroke(ctx, P.rect(px + 104, py, 60, 46, 4), { weight: 'thin', closed: true, taper: false, seed: 1030 + t });
          S.fill(ctx, [[px + 127, py + 13], [px + 145, py + 23], [px + 127, py + 33]], { role: 'ink', offset: false, texture: false });
          S.fill(ctx, P.circle(px + 48, py - 2, 4, 10), { role: 'accent-1', offset: false, texture: false });
          ctx.restore();
          // comment notes accumulate during line 2
          var nNotes = Math.floor(E.clamp(b * 1.15 - t * 0.04, 0, 1) * 3 + 0.0001);
          for (var nn = 0; nn < nNotes; nn++) {
            var nx = px + 172 + (nn % 2) * 22, ny = py + 2 + Math.floor(nn / 2) * 22 + (nn % 2) * 6;
            S.fill(ctx, P.rect(nx, ny, 18, 18, 2), { role: 'accent-2', offset: false, texture: false });
            S.stroke(ctx, P.rect(nx, ny, 18, 18, 2), { weight: 'hair', closed: true, taper: false, seed: 1040 + nn });
          }
        }
      }
      // three breakout rooms of three teams; on line 2 the teams reshuffle (one from each first room)
      var rq = beat(s, 0, 0.35, 0.6);
      var mv = E.inOut(beat(s, 1, 0, 0.4));
      var rooms = [];
      for (var r = 0; r < 3; r++) rooms.push({ x: 60 + r * 240, y: 314, w: 220, h: 214 });
      rooms.forEach(function (rm, i) {
        if (rq <= 0) return;
        C.box(ctx, rm, { p: rq, role: 'ground', seed: 1050 + i, r: 16 });
        clock(ctx, S, rm.x + rm.w - 28, rm.y + 30, 16, { p: rq, sweep: 0.2 + 0.7 * (mv > 0 ? b : a), seed: 3 });
      });
      function slot(room, k) {
        var rm = rooms[room], tw = 92, th = 64;
        if (k < 2) return { x: rm.x + 12 + k * (tw + 12), y: rm.y + 58 };
        return { x: rm.x + (rm.w - tw) / 2, y: rm.y + 58 + th + 12 };
      }
      if (rq > 0) {
        for (var team = 0; team < 9; team++) {
          var r1 = Math.floor(team / 3), k1 = team % 3;
          var r2 = team % 3, k2 = Math.floor(team / 3);
          var s1 = slot(r1, k1), s2 = slot(r2, k2);
          var tq2 = E.segment(rq, team / 9 * 0.5, team / 9 * 0.5 + 0.5);
          C.prop(ctx, 'tile', { x: E.lerp(s1.x, s2.x, mv), y: E.lerp(s1.y, s2.y, mv) - Math.sin(mv * Math.PI) * 18, w: 92, h: 64, person: S.extraLook(410 + team * 3), t: s.t, p: tq2, seed: 1060 + team });
        }
      }
      // the bank's cards
      var g = beat(s, 0, 0.05, 0.3), en = beat(s, 0, 0.5, 0.75);
      if (en > 0) env.cards.figure(ctx, 'curso.entrega', { x: 792, y: 338, w: 448, h: 237 }, { p: en, scope: true, compact: true });
      if (g > 0) env.cards.figure(ctx, 'curso.galeria', { x: 792, y: 90, w: 448, h: 238 }, { p: g, compact: true });
    },

    transferible: function (ctx, s, env) {
      // Draw: on line 1 a researcher in an `extra-3` tile follows the diagram step by step and arrives at the same result, labeled «otro investigador podría replicarlo», and then a card «lo que decidimos no hacer con IA» is pinned to the diagram, with the legend item `etica-datos`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var a = s.at(0);
      var flow = C.sign(ctx, 'diagrama-flujo', { x: 330, y: 150, w: 880, labels: ['', '', '', ''], boxH: 100, gap: 46, p: E.out(s.intro) });
      if (flow) {
        stageDetails(ctx, env, flow.boxes, { p: E.out(s.intro), seed: 1100, tools: E.out(s.intro), lampR: 14 });
        boxFlags(ctx, env, flow.boxes, [1, 3], E.out(s.intro), 0.42);
      }
      var tile = { x: 60, y: 136, w: 220, h: 140 };
      C.prop(ctx, 'tile', { x: tile.x, y: tile.y, w: tile.w, h: tile.h, person: S.extraLook(331), prop: 'rubric', t: s.t, p: E.out(s.intro), seed: 1110, active: a > 0 && a < 0.55 });
      if (!flow) return;
      // the researcher's path: a dot travels from the tile through each stage, ticking it
      var walk = E.segment(a, 0.04, 0.5);
      var pts = [[tile.x + tile.w + 8, tile.y + tile.h / 2]];
      flow.boxes.forEach(function (bx) { pts.push([bx.x + bx.w / 2, bx.y + bx.h + 18]); });
      var nSeg = pts.length - 1, u = walk * nSeg, si = Math.min(nSeg - 1, Math.floor(u)), fr = u - si;
      if (walk > 0) {
        for (var k = 0; k < Math.min(nSeg, si + 1); k++) {
          var A = pts[k], B = pts[k + 1], f2 = k < si ? 1 : fr;
          S.stroke(ctx, P.smooth([A, [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + 26], B], 8), { weight: 'thin', taper: false, p: f2, seed: 1120 + k, role: 'accent-3' });
        }
        var dot = si < nSeg ? [E.lerp(pts[si][0], pts[si + 1][0], fr), E.lerp(pts[si][1], pts[si + 1][1], fr) + Math.sin(fr * Math.PI) * 26] : pts[nSeg];
        if (walk < 1) S.fill(ctx, P.circle(dot[0], dot[1], 7, 14), { role: 'accent-3', offset: false, texture: false });
        flow.boxes.forEach(function (bx, i) {
          if (u >= i + 1) C.check(ctx, bx.x + 24, bx.y + 30, 18, { p: E.clamp((u - i - 1) * 3, 0, 1), seed: 1130 + i });
        });
      }
      // the same result: the team's and the researcher's result cards side by side
      var rq = E.segment(a, 0.45, 0.6);
      if (rq > 0) {
        [0, 1].forEach(function (i) {
          var rx = 880 + i * 190, ry = 318;
          C.box(ctx, { x: rx, y: ry, w: 150, h: 96 }, { p: rq, role: 'ground', seed: 1140 + i, lines: 3, linesY: 30 });
          C.check(ctx, rx + 122, ry + 74, 22, { p: rq, seed: 1145 + i });
        });
        S.text(ctx, '=', 1050, 378, { size: 40, weight: 700, align: 'center', p: rq });
        S.text(ctx, tx('t1'), 1045, 458, { size: 21, weight: 700, align: 'center', maxWidth: 380, p: E.segment(a, 0.5, 0.65) });
      }
      // what the team decided not to do with AI, pinned to the diagram
      var nq = E.segment(a, 0.66, 0.82);
      if (nq > 0) {
        var st = flow.boxes[1];
        var note = { x: 420, y: 330, w: 360, h: 100 };
        S.stroke(ctx, [[st.x + st.w / 2, st.y + st.h + 40], [st.x + st.w / 2 + 1, note.y + 4]], { weight: 'thin', taper: false, p: nq, seed: 1150 });
        C.box(ctx, note, { p: nq, role: 'accent-2', seed: 1151 });
        S.fill(ctx, P.circle(st.x + st.w / 2, note.y + 6, 8, 14), { role: 'accent-1', offset: false, texture: false, p: nq });
        C.lamp(ctx, 'lampara', { x: note.x + 46, y: note.y + 50, r: 24, p: nq, t: s.t, still: true });
        C.cross(ctx, note.x + 46, note.y + 50, 40, { p: nq, weight: 'bold' });
        S.text(ctx, tx('t2'), note.x + 90, note.y + 46, { size: 20, weight: 700, maxWidth: 252, maxLines: 2, p: nq, vcenter: true });
      }
      var eq = E.segment(a, 0.8, 0.95);
      if (eq > 0) C.legendChip(ctx, 'etica-datos', 420, 478, { p: eq, size: 19, r: 20 });
    },

    caso: function (ctx, s, env) {
      // Draw: place `sala-virtual`: MARIANA presents a slide with the group's `diagrama-flujo`, AMPARO and JULIÁN sit in tiles, and the `extra-3` commenters hold rubric cards, with a visible timer frame beside the slide; on line 2 the slide changes to a short evidence capture with a check; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, P = S.path;
      var a = s.at(0), b = s.at(1);
      var intro = E.out(s.intro);
      // the shared slide
      var sl = { x: 262, y: 104, w: 640, h: 336 };
      slide(ctx, S, sl, intro, 1201);
      var sw = E.segment(b, 0, 0.3);
      if (sw < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - sw;
        var fl = beat(s, 0, 0, 0.35);
        var vq = beat(s, 0, 0.4, 0.65);
        var bw5 = (sl.w - 56 - 4 * 26) / 5;
        if (vq > 0) S.fill(ctx, S.path.rect(sl.x + 28 + 2 * (bw5 + 26) - 12, sl.y + 140 - 12, bw5 + 24, 120, 16), { role: 'accent-2', p: vq, seed: 1211 });
        var flow = C.sign(ctx, 'diagrama-flujo', { x: sl.x + 28, y: sl.y + 140, w: sl.w - 56, labels: ['', '', '', '', ''], boxH: 96, gap: 26, stepP: function (i) { return E.stagger(fl, i, 5, 0.6); } });
        if (flow) {
          stageDetails(ctx, env, flow.boxes, { p: fl, seed: 1210, tools: fl, lampR: 11 });
          // the interviews stage carries the human checkpoint (validation against the group's coding)
          boxFlags(ctx, env, flow.boxes, [2], beat(s, 0, 0.45, 0.65), 0.42);
        }
        ctx.restore();
      }
      if (sw > 0) {
        // a short evidence capture with a check
        ctx.save(); ctx.globalAlpha *= sw;
        var cap = { x: sl.x + 60, y: sl.y + 80, w: sl.w - 120, h: 214 };
        S.shape(ctx, P.rect(cap.x, cap.y, cap.w, cap.h, 8), { role: 'accent-5', weight: 'regular', seed: 1220, offset: false });
        C.table(ctx, { x: cap.x + 22, y: cap.y + 22, w: cap.w - 170, headers: ['', '', ''], nRows: 3, rowH: 40, headH: 30, p: 1 });
        C.check(ctx, cap.x + cap.w - 70, cap.y + cap.h / 2 + 10, 70, { p: E.segment(b, 0.25, 0.5), seed: 1221, weight: 'heavy' });
        ctx.restore();
      }
      // the timer frame beside the slide
      C.box(ctx, { x: 932, y: 116, w: 200, h: 214 }, { p: intro, role: 'ground', weight: 'bold', seed: 1230 });
      clock(ctx, S, 1032, 230, 60, { p: intro, sweep: 0.15 + 0.45 * a + 0.25 * b });
      // the call's tiles: Mariana presents; Amparo, Julián and three commenters with rubric cards
      var tiles = [
        { person: C.castEntry('mariana'), active: true },
        { person: C.castEntry('amparo') },
        { person: C.castEntry('julian') },
        { person: S.extraLook(301), prop: 'rubric' },
        { person: S.extraLook(308), prop: 'rubric' },
        { person: S.extraLook(343), prop: 'rubric' }
      ];
      tiles.forEach(function (tl, i) {
        C.prop(ctx, 'tile', { x: 190 + i * 178, y: 464, w: 162, h: 104, person: tl.person, prop: tl.prop || null, active: !!tl.active, t: s.t, p: E.segment(s.intro, i * 0.08, 0.5 + i * 0.08), seed: 1240 + i });
      });
    },

    declaracion: function (ctx, s, env) {
      // Draw: course sign `declaracion` with JULIÁN in a tile beside it; on line 2 its blanks fill one after another: «Herramienta y modelo o versión, fechas de uso», «Tarea concreta», «Revisado y verificado por», «Validación contra codificación humana», «No se usaron herramientas de IA para» and «Datos personales»; on line 3 the stamp `stamp-metodo` appears over the document.
      var S = env.style, C = env.course, tx = env.tx;
      C.sign(ctx, 'declaracion', {
        x: 290, y: 82, w: 600, h: 482,
        fields: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5'), tx('t6')],
        q: [E.out(s.intro), beat(s, 1, 0.05, 0.95)], size: 18
      });
      // Julián's tile beside the document while he is not the one speaking (his vignette shows him then)
      if (s.line >= 1 && s.speaker !== 'julian') {
        C.prop(ctx, 'tile', { x: 950, y: 150, w: 250, h: 160, person: C.castEntry('julian'), t: s.t, p: beat(s, 1, 0, 0.12), seed: 1301 });
      }
      var st = beat(s, 2, 0.05, 0.4);
      if (st > 0) C.stamp(ctx, 'stamp-metodo', { x: 790, y: 420, r: 122, p: st });
    },

    ideas: function (ctx, s, env) {
      // Draw: three cards appear one per line: «La IA es una herramienta estadística poderosa con límites conocidos», «El criterio, la verificación y la validación son de quien investiga» and «Las implicaciones y su documentación son parte del método, no un anexo»; on line 3 the `seis-ejes` ring closes around them.
      var C = env.course, tx = env.tx;
      var c = s.at(2);
      var ring = E.segment(c, 0.25, 0.85);
      ['t1', 't2', 't3'].forEach(function (k, i) {
        var q = beat(s, i, 0, 0.3);
        if (q > 0) C.box(ctx, { x: 380, y: 207 + i * 108, w: 520, h: 90 }, { label: tx(k), size: 22, role: ['accent-2', 'accent-5', 'ground-2'][i], weight: 'bold', p: q, seed: 1410 + i, maxLines: 2 });
      });
      axesRing(ctx, env, { cx: 640, cy: 370, rx: 500, ry: 200, size: 18, r: 19, q: ring, seed: 1401 });
    }
  };

  // a vertical bracket line (a brace without curls) used by the rubric callouts
  function P2(S, x, y1, y2) { return [[x + 8, y1], [x, y1], [x, y2], [x + 8, y2]]; }

  NS.videos.v8 = { zones: zones, scenes: scenes };
})(window.IAHI);
