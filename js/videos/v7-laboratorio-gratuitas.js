/* V7 · laboratorio-gratuitas · «Laboratorio 2: investigar con herramientas gratuitas» (spec §11 V7).
   Every on-screen text comes from the scene's `texts`, the figure bank, the course data (rotulos,
   plantillas, badges) or the cast; visual beats follow the voice through s.at(i). Prices and plan
   limits appear only on the figure cards. */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  function sceneTexts(env, id) { var sc = env.video.scenes.filter(function (x) { return x.id === id; })[0]; return (sc && sc.texts) || {}; }
  function arc(from, to, u, lift) { return [E.lerp(from[0], to[0], u), E.lerp(from[1], to[1], u) - Math.sin(u * Math.PI) * lift]; }
  function doc(C, ctx, x, y, w, h, p, seed, bar, check) { C.prop(ctx, 'article-card', { x: x, y: y, w: w, h: h, p: p, seed: seed, barRole: bar || 'accent-3', check: check }); }
  function pulse(ctx, S, x, y, R, t, p) {
    if (p <= 0) return;
    var a = Math.PI * (0.15 + 0.7 * ((t * 0.45) % 1));
    ctx.save(); ctx.globalAlpha *= E.clamp(p, 0, 1);
    S.machine(ctx, 'node', { x: x + Math.cos(a) * (R + 14), y: y + Math.sin(a) * (R + 14), r: 4.5, on: 1 });
    ctx.restore();
  }
  // a code card: a page with indented lines (a script), human manner
  function codeCard(env, ctx, x, y, w, h, p, seed) {
    var S = env.style, C = env.course;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { p: p, role: 'ground', weight: 'regular', seed: seed, r: 8 });
    var ind = [0, 1, 1, 2, 1, 0, 1], len = [0.8, 0.6, 0.7, 0.5, 0.75, 0.4, 0.6];
    var n = Math.max(2, Math.min(ind.length, Math.floor((h - 20) / 13)));
    for (var i = 0; i < n; i++) S.stroke(ctx, [[x + 12 + ind[i] * 10, y + 16 + i * 13], [x + 12 + ind[i] * 10 + (w - 34 - ind[i] * 10) * len[i], y + 16.5 + i * 13]], { weight: i % 3 === 0 ? 'thin' : 'hair', taper: false, p: p, seed: seed + 1 + i, role: i % 3 === 0 ? 'accent-3' : 'ink' });
  }
  // a small chart card (not data: a pictogram of «a chart»)
  function chartCard(env, ctx, x, y, w, h, p, seed) {
    var S = env.style, C = env.course, P = S.path;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { p: p, role: 'ground', weight: 'regular', seed: seed, r: 10 });
    if (p <= 0) return;
    var ax = x + 22, ay = y + h - 20, aw = w - 40, ah = h - 46;
    S.stroke(ctx, [[ax, y + 18], [ax, ay], [ax + aw, ay]], { weight: 'thin', taper: false, p: p, seed: seed + 1 });
    [0.5, 0.85, 0.35, 0.65].forEach(function (v, i) { S.fill(ctx, P.rect(ax + 8 + i * (aw - 10) / 4, ay - ah * v, (aw - 10) / 4 - 8, ah * v, 2), { role: 'accent-6', offset: false, p: p, seed: seed + 2 + i }); });
  }
  // a calendar page with one day marked (no digits)
  function calendar(env, ctx, x, y, r, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    S.fill(ctx, P.rect(x - r, y - r, r * 2, r * 2, 4), { role: 'ground', offset: false, texture: false, p: p });
    S.fill(ctx, P.rect(x - r, y - r, r * 2, r * 0.5, 4), { role: 'accent-1', offset: false, texture: false, p: p });
    S.stroke(ctx, P.rect(x - r, y - r, r * 2, r * 2, 4), { weight: r > 30 ? 'regular' : 'thin', closed: true, taper: false, p: p, seed: seed || 5 });
    for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) {
      var cx = x - r * 0.6 + i * r * 0.4, cy = y + j * r * 0.32 - r * 0.05;
      S.fill(ctx, P.circle(cx, cy, Math.max(1.6, r * 0.06), 8), { role: 'ink', offset: false, texture: false, p: p });
      if (i === 2 && j === 1) S.stroke(ctx, P.circle(cx, cy, r * 0.17, 14), { weight: 'thin', closed: true, taper: false, role: 'accent-1', p: p, seed: (seed || 5) + 1 });
    }
  }
  // a dated stamp: the calendar sign inside a round ink mark
  function dateStamp(env, ctx, x, y, r, p) {
    var S = env.style, C = env.course;
    if (p <= 0) return;
    var a = S.appear('pop', p);
    ctx.save(); ctx.globalAlpha *= a.alpha;
    ctx.translate(x, y); ctx.scale(a.scale, a.scale); ctx.translate(-x, -y);
    S.fill(ctx, S.path.circle(x, y, r, 24), { role: 'ground', offset: false, texture: false });
    S.stroke(ctx, S.path.circle(x, y, r, 24), { weight: 'bold', closed: true, taper: false, seed: 40 });
    C.pictos.draw(ctx, 'calendar-check', { x: x, y: y, r: r * 0.6 });
    ctx.restore();
  }
  // the bold step names of the course's reference-checking protocol (plantillas B4)
  function protocolSteps(env) {
    var t = (env.data.plantillas || []).filter(function (x) { return x.id === 'B4'; })[0];
    var blk = t ? t.blocks.filter(function (b) { return b.items; })[0] : null;
    return blk ? blk.items.map(function (it) { var m = /\*\*([^*]+)\*\*/.exec(it); return m ? m[1].trim() : ''; }) : [];
  }

  var zones = {
    gancho: [[220, 66, 840, 130], [50, 290, 1180, 240]],
    etapas: [[30, 56, 1220, 524]],
    gratis: [[60, 90, 1170, 470]],
    pregunta: [[50, 76, 1180, 500]],
    'buscar-mapear': [[50, 90, 1180, 486]],
    leer: [[60, 70, 1170, 500]],
    matriz: [[50, 76, 1190, 500]],
    rutas: [[50, 66, 1180, 506]],
    'ruta-2': [[50, 56, 1180, 516]],
    'ruta-3': [[50, 60, 1180, 510]],
    caso: [[330, 80, 680, 280]],
    cierre: [[90, 96, 1100, 480]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: the title «Laboratorio 2: investigar con herramientas gratuitas» at the top; on line 1 course sign `etapas-gratuitas` appears as a row of stage cards, each with an empty tool slot.
      var S = env.style, C = env.course, tx = env.tx;
      S.title(ctx, tx('t1'), { x: 640, y: 118, size: 44, align: 'center', p: beat(s, 0, 0, 0.3), maxWidth: 800 });
      var n = C.signLabels('etapas-gratuitas').length || 7;
      var q = [];
      for (var i = 0; i < n; i++) q.push(beat(s, 0, 0.3 + i * 0.07, 0.42 + i * 0.07));
      C.sign(ctx, 'etapas-gratuitas', { x: 60, y: 304, w: 1160, h: 220, q: q, size: 18 });
    },

    etapas: function (ctx, s, env) {
      // Draw: course sign `etapas-gratuitas`, a meaning zone; on line 1 the stages «Buscar» («Asta», «Consensus», «Google Scholar Labs»), «Mapear» («Connected Papers o ResearchRabbit») and «Leer y sintetizar» («Gemini Notebook», with the card of `lab2.notebook`) fill their slots; on line 2 «Extraer» («Elicit»), «Analizar datos» («Asta DataVoyager», with the card of `lab2.datavoyager`), «Datos sensibles» («LM Studio u Ollama») and «Referencias» («Zotero») fill theirs; every card carries «Revisar antes de clase».
      var C = env.course, tx = env.tx, S = env.style;
      var a = s.at(0), b = s.at(1);
      C.badge(ctx, tx('t17'), 40, 62, { p: E.out(s.intro), size: 16 });
      var X = 40, W = 1200, cw = (W - 12 * 6) / 7;
      // the limits of the free plans, on their cards, under their stages
      var cx2 = X + 2 * (cw + 12) + cw / 2, cx4 = X + 4 * (cw + 12) + cw / 2;
      var n1 = E.segment(a, 0.82, 1), n2 = E.segment(b, 0.28, 0.44);
      if (n1 > 0) env.cards.figure(ctx, 'lab2.notebook', { x: 96, y: 397, w: 530, h: 178 }, { p: n1, size: 20, compact: true });
      if (n2 > 0) env.cards.figure(ctx, 'lab2.datavoyager', { x: 664, y: 397, w: 530, h: 178 }, { p: n2, size: 20, compact: true });
      var res = C.sign(ctx, 'etapas-gratuitas', {
        x: X, y: 108, w: W, h: 250, slotH: 142, size: 18, toolSize: 15, revisar: true, p: E.out(s.intro),
        labels: [tx('t1'), tx('t5'), tx('t7'), tx('t9'), tx('t11'), tx('t13'), tx('t15')],
        tools: [[tx('t2'), tx('t3'), tx('t4')], [tx('t6')], [tx('t8')], [tx('t10')], [tx('t12')], [tx('t14')], [tx('t16')]],
        toolQ: [E.segment(a, 0.04, 0.3), E.segment(a, 0.42, 0.6), E.segment(a, 0.7, 0.86), E.segment(b, 0.02, 0.14), E.segment(b, 0.12, 0.3), E.segment(b, 0.45, 0.6), E.segment(b, 0.62, 0.76)]
      });
      if (n1 > 0) S.stroke(ctx, [[cx2, 362], [cx2, 397]], { weight: 'thin', taper: false, p: n1, seed: 12 });
      if (n2 > 0) S.stroke(ctx, [[cx4, 362], [cx4, 397]], { weight: 'thin', taper: false, p: n2, seed: 13 });
      void res;
    },

    gratis: function (ctx, s, env) {
      // Draw: on line 1 a free-plan card shows the label «suele usarse para mejorar los modelos» and two small reviewer figures beside it, with the legend item `etica-datos`; on line 2 a calendar card stamps a date on an export, a screenshot and a code card, with the legend item `reproducibilidad`.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // line 1: a free-plan card: the conversation goes on to improve the models
      var cq = beat(s, 0, 0, 0.18);
      if (cq > 0) {
        C.box(ctx, { x: 70, y: 96, w: 480, h: 300 }, { p: cq, role: 'ground', weight: 'bold', seed: 20, r: 16 });
        C.prop(ctx, 'chat-bubble', { x: 94, y: 122, w: 230, h: 48, lines: 2, tail: 'right', p: cq, seed: 21 });
        C.prop(ctx, 'chat-bubble', { x: 150, y: 192, w: 230, h: 48, lines: 2, tail: 'left', p: cq, seed: 22, role: 'ground-2' });
        C.prop(ctx, 'chat-bubble', { x: 94, y: 262, w: 200, h: 48, lines: 2, tail: 'right', p: cq, seed: 23 });
      }
      var mq = beat(s, 0, 0.14, 0.36);
      if (mq > 0) {
        C.arrow(ctx, [394, 214], [446, 214], { p: mq, weight: 'thin', head: 10 });
        C.lamp(ctx, 'lampara', { x: 488, y: 214, r: 32, p: mq, t: s.t });
        for (var k = 0; k < 3; k++) S.machine(ctx, 'dial', { x: 456 + k * 32, y: 280, r: 10, angle: -Math.PI / 2 + Math.sin(s.t * 1.4 + k) * 0.9 * mq });
        S.text(ctx, tx('t1'), 94, 360, { size: 21, weight: 700, maxWidth: 440, p: E.segment(mq, 0.4, 1) });
      }
      // two human reviewers, beside the card
      [0, 1].forEach(function (k2) {
        var rq = beat(s, 0, 0.45 + k2 * 0.08, 0.6 + k2 * 0.08);
        if (rq > 0) C.prop(ctx, 'tile', { x: 576, y: 112 + k2 * 132, w: 150, h: 112, p: rq, person: S.extraLook(77 + k2 * 9), t: s.t, seed: 24 + k2 });
      });
      var lg = beat(s, 0, 0.72, 0.9);
      if (lg > 0) C.legendChip(ctx, 'etica-datos', 70, 440, { p: lg, size: 19, r: 20 });
      // line 2: a calendar stamps a date on an export, a screenshot and a code card
      var kq = beat(s, 1, 0, 0.2);
      if (kq > 0) calendar(env, ctx, 1000, 152, 48, kq, 30);
      var items = [[840, 300], [1000, 300], [1160, 300]];
      items.forEach(function (it, i) {
        var iq = beat(s, 1, 0.1 + i * 0.08, 0.3 + i * 0.08);
        if (iq <= 0) return;
        if (i === 0) C.prop(ctx, 'csv-sheet', { x: it[0] - 64, y: it[1], w: 128, cols: 4, rows: 4, rh: 20, p: iq, seed: 31 });
        else if (i === 1) {
          C.box(ctx, { x: it[0] - 64, y: it[1], w: 128, h: 100 }, { p: iq, role: 'accent-5', seed: 32, r: 6 });
          S.sign(ctx, 'sun', { x: it[0] + 30, y: it[1] + 26, r: 10, seed: 33, p: iq });
          S.stroke(ctx, [[it[0] - 54, it[1] + 88], [it[0] - 18, it[1] + 48], [it[0] + 4, it[1] + 70], [it[0] + 24, it[1] + 56], [it[0] + 54, it[1] + 88]], { weight: 'thin', taper: false, p: iq, seed: 34 });
        } else codeCard(env, ctx, it[0] - 64, it[1], 128, 100, iq, 35);
        var u = E.inOut(beat(s, 1, 0.3 + i * 0.14, 0.44 + i * 0.14));
        if (u > 0 && u < 1) {
          var pt = arc([1000, 190], [it[0] + 50, it[1] + 2], u, 40);
          dateStamp(env, ctx, pt[0], pt[1], 20, 1);
        } else if (u >= 1) dateStamp(env, ctx, it[0] + 50, it[1] + 2, 20, 1);
      });
      var lg2 = beat(s, 1, 0.72, 0.92);
      if (lg2 > 0) C.legendChip(ctx, 'reproducibilidad', 776, 460, { p: lg2, size: 19, r: 20 });
      void a; void b;
    },

    pregunta: function (ctx, s, env) {
      // Draw: course sign `pregunta-estructurada`; on line 1 the four boxes «población», «fenómeno», «resultado» and «contexto» fill with the course's example: «trabajadores urbanos de Colombia», «aumento del salario mínimo», «informalidad laboral», «entre 2010 y 2025»; on line 2 the card of `curso.parte-a-lab2` shows the five steps with their times.
      var C = env.course, tx = env.tx;
      var a = s.at(0);
      C.sign(ctx, 'pregunta-estructurada', {
        x: 60, y: 84, w: 1160, h: 196,
        labels: [tx('t1'), tx('t2'), tx('t3'), tx('t4')], values: [tx('t5'), tx('t6'), tx('t7'), tx('t8')],
        q: [E.segment(a, 0.16, 0.26), E.segment(a, 0.22, 0.31), E.segment(a, 0.27, 0.36), E.segment(a, 0.31, 0.4)],
        vq: [E.segment(a, 0.48, 0.6), E.segment(a, 0.68, 0.8), E.segment(a, 0.79, 0.88), E.segment(a, 0.86, 0.96)],
        size: 22, valueSize: 21
      });
      var fq = beat(s, 1, 0, 0.25);
      if (fq > 0) env.cards.figure(ctx, 'curso.parte-a-lab2', { x: 190, y: 316, w: 900, h: 248 }, { p: fq, size: 24 });
    },

    'buscar-mapear': function (ctx, s, env) {
      // Draw: on line 1 the same question card goes into two `buscador-academico` lamps labeled «Asta» and «Consensus», and its English version into a third labeled «Google Scholar Labs», while a logbook row records «consulta», «fecha» and «resultados»; on line 2 a `grafo` opens around the most cited article, with earlier works on one side labeled «fundacionales» and later works on the other labeled «revisiones recientes».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var intro = E.out(s.intro);
      // the question card, and the three academic search lamps
      C.box(ctx, { x: 60, y: 140, w: 150, h: 112 }, { p: intro, role: 'accent-2', weight: 'bold', seed: 50, label: '?', size: 46 });
      var lamps = [[420, 196, 't1'], [670, 196, 't2'], [920, 196, 't3']];
      lamps.forEach(function (l, i) {
        var lq = E.segment(intro, 0.2 + i * 0.15, 0.6 + i * 0.15);
        if (lq <= 0) return;
        C.lamp(ctx, 'buscador-academico', { x: l[0], y: l[1], r: 28, ring: 66, labels: [], p: lq, t: s.t, active: Math.floor(s.t / 1.2 + i) % 4 });
        S.text(ctx, tx(l[2]), l[0], l[1] + 116, { size: 19, weight: 700, align: 'center', p: lq });
      });
      // the same question goes to each lamp (the third one in its English version)
      lamps.forEach(function (l, i) {
        var u = E.inOut(beat(s, 0, 0.1 + i * 0.1, 0.24 + i * 0.1));
        if (u <= 0 || u >= 1) return;
        var pt = arc([135, 196], [l[0], l[1]], u, 70);
        var sc = 1 - 0.55 * E.segment(u, 0.6, 1);
        ctx.save(); ctx.globalAlpha *= 1 - E.segment(u, 0.85, 1);
        ctx.translate(pt[0], pt[1]); ctx.scale(sc * 0.5, sc * 0.5);
        C.box(ctx, { x: -75, y: -56, w: 150, h: 112 }, { role: i === 2 ? 'accent-5' : 'accent-2', weight: 'bold', seed: 51 + i, label: '?', size: 46 });
        ctx.restore();
      });
      // the search logbook: query, date, results
      var tq = beat(s, 0, 0.46, 0.6);
      if (tq > 0) C.table(ctx, { x: 60, y: 380, w: 520, headers: [tx('t4'), tx('t5'), tx('t6')], nRows: 3, rowH: 38, headH: 44, headSize: 18, p: tq, fill: 3 * beat(s, 0, 0.55, 0.9) });
      // line 2: a graph opens around the most cited article
      var gp = beat(s, 1, 0, 0.18);
      if (gp > 0) {
        var gx = 660, gy = 354, gw = 560, gh = 216, cx = gx + gw / 2, cy = gy + 96;
        ctx.save(); ctx.globalAlpha *= gp;
        S.machineArea(ctx, gx, gy, gw, gh);
        ctx.restore();
        var r = env.rng(55);
        var nodes = [];
        for (var k = 0; k < 6; k++) nodes.push([gx + 46 + (k % 3) * 62 + r.range(-8, 8), gy + 34 + Math.floor(k / 3) * 74 + r.range(-6, 6) + (k % 3) * 8, -1]);
        for (var k2 = 0; k2 < 6; k2++) nodes.push([gx + gw - 46 - (k2 % 3) * 62 + r.range(-8, 8), gy + 34 + Math.floor(k2 / 3) * 74 + r.range(-6, 6) + (k2 % 3) * 8, 1]);
        nodes.forEach(function (nd, i) {
          var nq = beat(s, 1, 0.2 + (i % 6) * 0.05 + (nd[2] > 0 ? 0.15 : 0), 0.32 + (i % 6) * 0.05 + (nd[2] > 0 ? 0.15 : 0));
          if (nq <= 0) return;
          S.machineLine(ctx, cx, cy, E.lerp(cx, nd[0], nq), E.lerp(cy, nd[1], nq), 1.1, 'machine-line');
          if (nq >= 1) S.machine(ctx, 'node', { x: nd[0], y: nd[1], r: 7 });
        });
        S.machine(ctx, 'node', { x: cx, y: cy, r: 13, on: 1 });
        var mv = E.inOut(beat(s, 1, 0, 0.2));
        if (mv < 1) { var pt2 = arc([420, 196], [cx - 14, cy - 18], mv, 60); doc(C, ctx, pt2[0], pt2[1], 28, 36, 1, 56, 'accent-1'); }
        S.machine(ctx, 'label', { text: tx('t7'), x: gx + 110, y: gy + gh - 18, align: 'center', size: 17, p: beat(s, 1, 0.45, 0.65) });
        S.machine(ctx, 'label', { text: tx('t8'), x: gx + gw - 120, y: gy + gh - 18, align: 'center', size: 17, p: beat(s, 1, 0.65, 0.85) });
      }
      void a; void b;
    },

    leer: function (ctx, s, env) {
      // Draw: on line 1 a `cuaderno-fuentes` receives the participant's PDF cards, with the card of `curso.pdfs-lab2`, and a question card appears: «¿Qué métodos usan estos estudios y en qué coinciden y difieren sus resultados? Cita el pasaje que respalda cada afirmación»; on line 2 the answer arrives with a small link to a passage on every sentence, with the legend item `validez` and the label «la síntesis es tan buena como los documentos cargados».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // the notebook with sources receives the participant's PDFs
      var nq = beat(s, 0, 0.02, 0.5);
      C.lamp(ctx, 'cuaderno-fuentes', { x: 330, y: 316, w: 500, h: 300, sources: 3, p: nq, t: s.t });
      for (var k = 0; k < 3; k++) {
        var u = E.inOut(beat(s, 0, 0.06 + k * 0.05, 0.2 + k * 0.05));
        if (u <= 0 || u >= 1) continue;
        var pt = arc([20, 520], [116, 206 + k * 110], u, 80);
        doc(C, ctx, pt[0], pt[1], 52, 66, 1, 60 + k, 'accent-3');
      }
      var fq = beat(s, 0, 0.04, 0.22);
      if (fq > 0) env.cards.figure(ctx, 'curso.pdfs-lab2', { x: 640, y: 74, w: 580, h: 180 }, { p: fq, size: 21 });
      var qq = beat(s, 0, 0.4, 0.62);
      if (qq > 0) {
        C.box(ctx, { x: 640, y: 272, w: 580, h: 116 }, { p: qq, role: 'ground-2', weight: 'bold', seed: 61, r: 12 });
        S.text(ctx, tx('t1'), 662, 330 + 19 * 0.36, { size: 19, weight: 700, maxWidth: 536, vcenter: true, lineHeight: 1.16, p: E.segment(qq, 0.3, 1) });
      }
      // line 2: the answer, each sentence with a link to its passage
      var aq = beat(s, 1, 0, 0.25);
      if (aq > 0) {
        C.box(ctx, { x: 640, y: 404, w: 580, h: 116 }, { p: aq, role: 'ground', weight: 'regular', seed: 62, r: 12 });
        for (var i = 0; i < 4; i++) {
          var lq = beat(s, 1, 0.08 + i * 0.08, 0.2 + i * 0.08);
          if (lq <= 0) continue;
          var ly = 428 + i * 24, len = [440, 380, 470, 300][i];
          S.stroke(ctx, [[664, ly], [664 + len * lq, ly + 0.5]], { weight: 'thin', taper: false, seed: 63 + i });
          if (lq >= 1) {
            var lx = 664 + len + 18;
            S.stroke(ctx, S.path.rect(lx, ly - 8, 26, 16, 8), { weight: 'thin', closed: true, taper: false, seed: 67 + i });
            S.fill(ctx, S.path.circle(lx + 13, ly, 3.2, 10), { role: 'accent-3', offset: false, texture: false });
          }
        }
      }
      var lb = beat(s, 1, 0.12, 0.45);
      if (lb > 0) {
        C.legendChip(ctx, 'validez', 640, 552, { p: lb, size: 19, r: 20 });
        S.text(ctx, tx('t2'), 790, 559, { size: 20, weight: 700, maxWidth: 440, p: lb });
      }
      void a;
    },

    matriz: function (ctx, s, env) {
      // Draw: course sign `matriz-antecedentes`; on line 1 the headers appear and three rows fill with short marks, then the column «¿Verificada?» receives a check on each of the three rows after it passes the verification steps, with the stamp `stamp-fuente` and the legend item `transparencia`.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0);
      var heads = C.signLabels('matriz-antecedentes').slice();
      if (heads.length) heads[heads.length - 1] = tx('t1') || heads[heads.length - 1];
      var X = 60, Y = 84, W = 810, headH = 64, rowH = 56;
      var checks = [0, 1, 2].map(function (r) { return E.segment(a, 0.46 + r * 0.13, 0.52 + r * 0.13); });
      var tb = C.sign(ctx, 'matriz-antecedentes', { x: X, y: Y, w: W, headers: heads, nRows: 3, rowH: rowH, headH: headH, headSize: 15, p: E.segment(a, 0, 0.08), fill: 3 * E.segment(a, 0.06, 0.3), checks: checks });
      // the rule of the course's protocol, as the voice names it
      var stq = E.segment(a, 0.26, 0.38);
      if (stq > 0) C.stamp(ctx, 'stamp-fuente', { x: 1068, y: 236, r: 150, p: stq });
      // the protocol runs on each row, then the row's box is checked
      var steps = protocolSteps(env);
      var sx = X, sy = 414, out = [];
      steps.forEach(function (st) {
        var w = S.measure(ctx, st, 17, 700) + 28;
        out.push({ x: sx, w: w });
        sx += w + 34;
      });
      var stepsP = E.segment(a, 0.3, 0.38);
      var cur = -1, curStep = -1;
      for (var r = 0; r < 3; r++) {
        var u = E.segment(a, 0.34 + r * 0.13, 0.46 + r * 0.13);
        if (u > 0 && u < 1) { cur = r; curStep = Math.min(steps.length - 1, Math.floor(u * steps.length)); }
      }
      if (cur >= 0 && tb) S.stroke(ctx, S.path.rect(X + 4, Y + headH + cur * rowH + 3, W - 8, rowH - 6, 8), { weight: 'regular', closed: true, taper: false, role: 'accent-1', seed: 70 + cur });
      out.forEach(function (o, i) {
        if (stepsP <= 0) return;
        C.box(ctx, { x: o.x, y: sy, w: o.w, h: 36 }, { p: stepsP, role: i === curStep ? 'accent-2' : 'ground', r: 18, seed: 71 + i, label: steps[i], size: 17, weight: i === curStep ? 'bold' : 'thin' });
        if (i < out.length - 1) C.arrow(ctx, [o.x + o.w + 5, sy + 18], [o.x + o.w + 28, sy + 18], { p: stepsP, weight: 'thin', head: 7, seed: 76 + i });
      });
      var lg = E.segment(a, 0.8, 0.94);
      if (lg > 0) C.legendChip(ctx, 'transparencia', 60, 516, { p: lg, size: 20, r: 21 });
    },

    rutas: function (ctx, s, env) {
      // Draw: course sign `tres-rutas`; on line 1 the card «Ruta 1. Datos cuantitativos» shows the CSV of the DANE going to «Asta DataVoyager» or a free chat and returning a chart card, a code card and a methods card, with a hand calculation check; on line 2 the methods card is read line by line, labeled «decisiones que usted firma», with the legend item `integridad`.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var intro = E.out(s.intro);
      var L = C.signLabels('tres-rutas').slice();
      L[0] = tx('t1') || L[0];
      var res = C.sign(ctx, 'tres-rutas', { x: 60, y: 72, w: 1160, labels: L, active: 0, tabH: 62, panelH: 418, panelQ: beat(s, 0, 0.04, 0.18), q: [intro, E.segment(intro, 0.2, 1), E.segment(intro, 0.4, 1)], size: 19 });
      var pnl = res && res.panel ? res.panel : { x: 60, y: 144, w: 1160, h: 418 };
      var py = pnl.y;
      // the CSV of the DANE goes to Asta DataVoyager or to a free chat
      var c1 = beat(s, 0, 0.14, 0.28);
      if (c1 > 0) C.prop(ctx, 'csv-sheet', { x: 96, y: py + 90, w: 170, cols: 4, rows: 4, rh: 24, p: c1, seed: 80 });
      var f1 = beat(s, 0, 0.26, 0.4);
      if (f1 > 0) {
        C.arrow(ctx, [274, py + 140], [330, py + 96], { p: f1, weight: 'thin', head: 9, seed: 81 });
        C.arrow(ctx, [274, py + 150], [330, py + 228], { p: f1, weight: 'thin', head: 9, seed: 82 });
        ctx.save(); ctx.globalAlpha *= f1;
        S.machine(ctx, 'frame', { x: 338, y: py + 40, w: 230, h: 112 });
        S.machine(ctx, 'label', { text: tx('t2'), x: 352, y: py + 64, size: 16 });
        S.machine(ctx, 'lamp', { x: 452, y: py + 108, r: 24, t: s.t });
        S.machine(ctx, 'browser', { x: 338, y: py + 176, w: 230, h: 112, bar: 18 });
        S.machine(ctx, 'card', { x: 352, y: py + 206, w: 100, h: 24, lines: 2 });
        S.machine(ctx, 'card', { x: 410, y: py + 240, w: 100, h: 24, lines: 2 });
        S.machine(ctx, 'lamp', { x: 532, y: py + 236, r: 18, t: s.t });
        ctx.restore();
      }
      // ... and returns a chart, a code card and a methods card; one value is checked by hand
      var r1 = beat(s, 0, 0.42, 0.62);
      if (r1 > 0) {
        C.arrow(ctx, [576, py + 120], [626, py + 92], { p: r1, weight: 'thin', head: 9, seed: 83 });
        C.arrow(ctx, [576, py + 220], [626, py + 230], { p: r1, weight: 'thin', head: 9, seed: 84 });
        chartCard(env, ctx, 636, py + 34, 190, 122, r1, 85);
        codeCard(env, ctx, 636, py + 176, 190, 96, E.segment(r1, 0.2, 1), 90);
        C.arrow(ctx, [830, py + 200], [866, py + 200], { p: E.segment(r1, 0.4, 1), weight: 'thin', head: 9, seed: 86 });
      }
      var mth = beat(s, 0, 0.55, 0.75);
      var MX = 876, MY = py + 34, MW = 304, MH = 300;
      if (mth > 0) {
        C.box(ctx, { x: MX, y: MY, w: MW, h: MH }, { p: mth, role: 'ground', weight: 'bold', seed: 95, r: 10 });
        S.fill(ctx, S.path.rect(MX + 20, MY + 20, 150, 12, 5), { role: 'ink', offset: false, texture: false, p: mth });
      }
      var hc = beat(s, 0, 0.66, 0.86);
      if (hc > 0) {
        C.prop(ctx, 'csv-sheet', { x: 640, y: py + 300, w: 120, cols: 3, rows: 3, rh: 18, p: hc, seed: 96 });
        S.fill(ctx, S.path.rect(681, py + 337, 38, 16, 3), { role: 'accent-2', offset: false, texture: false, p: hc, alpha: 0.85 });
        C.prop(ctx, 'pen', { x: 716, y: py + 350, len: 44, angle: -0.8, p: hc });
        C.check(ctx, 790, py + 334, 22, { p: E.segment(hc, 0.4, 1), weight: 'bold' });
      }
      // line 2: the methods are read line by line: decisions that the researcher signs
      if (mth > 0) {
        for (var i = 0; i < 8; i++) {
          var ly = MY + 56 + i * 22, len = [230, 200, 250, 180, 240, 210, 160, 220][i];
          var rq = beat(s, 1, 0.04 + i * 0.07, 0.12 + i * 0.07);
          if (rq > 0 && rq < 1) S.fill(ctx, S.path.rect(MX + 14, ly - 9, len + 14, 18, 6), { role: 'accent-2', offset: false, texture: false, alpha: 0.9 });
          S.stroke(ctx, [[MX + 20, ly], [MX + 20 + len, ly + 0.5]], { weight: 'thin', taper: false, p: mth, seed: 100 + i });
          if (rq >= 1) C.check(ctx, MX + MW - 22, ly - 2, 12, { p: 1, weight: 'thin' });
        }
        var sg = beat(s, 1, 0.55, 0.8);
        S.stroke(ctx, [[MX + 20, MY + MH - 26], [MX + MW - 20, MY + MH - 25]], { weight: 'thin', taper: false, p: sg, seed: 110 });
        S.stroke(ctx, S.path.smooth([[MX + 40, MY + MH - 32], [MX + 62, MY + MH - 50], [MX + 78, MY + MH - 30], [MX + 104, MY + MH - 46], [MX + 130, MY + MH - 34]], 8), { weight: 'regular', p: sg, seed: 111 });
        S.text(ctx, tx('t3'), MX + MW / 2, MY + MH + 30, { size: 20, weight: 700, align: 'center', maxWidth: 340, p: sg });
      }
      var lg = beat(s, 1, 0.6, 0.85);
      if (lg > 0) C.legendChip(ctx, 'integridad', 96, py + 360, { p: lg, size: 19, r: 20 });
      void a; void b;
    },

    'ruta-2': function (ctx, s, env) {
      // Draw: course sign `libro-codigos` with its four tabs and the card of `curso.libro-codigos`; on line 1 an interview transcript is coded by a lamp, each code with its quote and location; on line 2 course sign `acuerdo` (badge «Esquema»): the participant codes one interview by hand in the column «Usted», the matches with the column «IA» are linked, and the label «porcentaje de acuerdo · kappa de Cohen» appears; on line 3 three labels fade out of the AI column: «ironías», «contexto», «silencios».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1), c = s.at(2);
      var intro = E.out(s.intro);
      var roles = ['accent-3', 'accent-2', 'accent-1', 'accent-4'];
      var fq = beat(s, 0, 0.12, 0.3);
      if (fq > 0) env.cards.figure(ctx, 'curso.libro-codigos', { x: 60, y: 320, w: 330, h: 248 }, { p: fq, size: 19 });
      C.sign(ctx, 'libro-codigos', { x: 60, y: 76, w: 310, h: 216, p: intro, size: 18 });
      // line 1: an interview transcript is coded by a lamp: each code with its quote and location
      var tq = beat(s, 0, 0.2, 0.35);
      var TX = 430, TY = 76, TW = 310, TH = 330;
      if (tq > 0) {
        C.prop(ctx, 'article-card', { x: TX, y: TY, w: TW, h: TH, p: tq, seed: 120, barRole: 'ink-soft' });
        C.lamp(ctx, 'lampara', { x: TX + TW - 6, y: TY + TH + 34, r: 26, p: tq, t: s.t });
      }
      var frag = [[0, 0], [2, 1], [4, 2], [6, 0], [8, 3]];
      frag.forEach(function (fr, i) {
        var hq = beat(s, 0, 0.35 + i * 0.11, 0.48 + i * 0.11);
        if (hq <= 0) return;
        var fy = TY + 92 + fr[0] * 24, fw = [200, 160, 220, 140, 180][i];
        S.fill(ctx, S.path.rect(TX + 30, fy - 9, fw * hq, 16, 5), { role: roles[fr[1]], offset: false, p: hq, seed: 121 + i, alpha: 0.8 });
        if (hq >= 1) {
          S.stroke(ctx, [[TX + 20, fy - 10], [TX + 15, fy - 10], [TX + 15, fy + 8], [TX + 20, fy + 8]], { weight: 'thin', taper: false, seed: 126 + i });
          S.fill(ctx, S.path.rect(TX + TW - 26, fy - 8, 14, 14, 4), { role: roles[fr[1]], offset: false, texture: false });
          S.stroke(ctx, S.path.rect(TX + TW - 26, fy - 8, 14, 14, 4), { weight: 'hair', closed: true, taper: false });
        }
        if (hq > 0 && hq < 1) S.machineLine(ctx, TX + TW - 18, TY + TH + 10, TX + 30 + fw * hq, fy, 1.2, 'machine-glow-1');
      });
      // line 2: agreement between the participant's codes and the AI's (schematic)
      C.badge(ctx, tx('t1'), 790, 62, { p: beat(s, 1, 0, 0.2), size: 16 });
      var AX = 790, AW = 430;
      C.sign(ctx, 'acuerdo', {
        x: AX, y: 104, w: AW, h: 320, n: 6, labels: [tx('t2'), tx('t3')],
        human: [0, 1, 3, 2, 1, 2], ai: [0, 1, 0, 2, 3, 0],
        q: [beat(s, 1, 0.15, 0.55), beat(s, 1, 0, 0.18), beat(s, 1, 0.55, 0.8)],
        fade: [2, 4, 5], fadeQ: beat(s, 2, 0.35, 0.9)
      });
      var pen = beat(s, 1, 0.15, 0.55);
      if (pen > 0 && pen < 1) C.prop(ctx, 'pen', { x: AX + 118, y: 150 + pen * 250, len: 50, angle: -0.9 });
      S.text(ctx, tx('t4'), AX + AW / 2, 470, { size: 20, weight: 700, align: 'center', maxWidth: AW, p: beat(s, 1, 0.72, 0.95) });
      // line 3: what the literal AI coding loses
      var rowH = (320 - 50) / 6;
      [['t5', 2], ['t6', 4], ['t7', 5]].forEach(function (lb, i) {
        var lq = beat(s, 2, 0.05 + i * 0.12, 0.25 + i * 0.12);
        if (lq <= 0) return;
        var ly = 104 + 46 + lb[1] * rowH + (rowH - 10) / 2 + 6;
        var fade = 1 - 0.7 * beat(s, 2, 0.45 + i * 0.1, 0.9);
        S.text(ctx, tx(lb[0]), AX + AW - 110 - 14 - 12 * (1 - fade), ly, { size: 18, weight: 700, align: 'right', p: lq, alpha: fade });
      });
      void a; void b; void c;
    },

    'ruta-3': function (ctx, s, env) {
      // Draw: on line 1 a laptop runs a `lampara-local` with its network cable unplugged, labeled «LM Studio u Ollama», with the card of `lab2.ram-local`; on line 2 the card of `lab2.modelos-locales` appears with the three models; on line 3 a model card marked «cloud» is crossed out with the label «no corre en su computador: no lo use para datos sensibles», and the legend items `etica-datos` and `validez` appear.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1), c = s.at(2);
      var lq = beat(s, 0, 0, 0.2);
      C.lamp(ctx, 'lampara-local', { x: 210, y: 228, r: 52, p: lq, t: s.t });
      S.text(ctx, tx('t1'), 230, 344, { size: 22, weight: 700, align: 'center', p: beat(s, 0, 0.1, 0.3) });
      var fq = beat(s, 0, 0.35, 0.6), mq = beat(s, 1, 0.3, 0.55);
      if (mq > 0) env.cards.figure(ctx, 'lab2.modelos-locales', { x: 470, y: 294, w: 750, h: 214 }, { p: mq, size: 21 });
      if (fq > 0) env.cards.figure(ctx, 'lab2.ram-local', { x: 470, y: 70, w: 750, h: 190 }, { p: fq, size: 22 });
      // line 3: a model marked «cloud» is crossed out
      var cq = beat(s, 2, 0, 0.2);
      if (cq > 0) {
        ctx.save(); ctx.globalAlpha *= cq;
        S.machine(ctx, 'frame', { x: 80, y: 392, w: 300, h: 84 });
        S.machine(ctx, 'file', { x: 96, y: 404, w: 44, h: 58, fold: 12, dots: true, gap: 8 });
        S.machine(ctx, 'label', { text: tx('t2'), x: 156, y: 428, size: 20 });
        S.machine(ctx, 'lamp', { x: 344, y: 434, r: 20, still: true });
        S.machineLine(ctx, 156, 446, 300, 446, 1);
        S.machineLine(ctx, 156, 458, 260, 458, 1);
        ctx.restore();
        C.cross(ctx, 230, 434, 92, { p: beat(s, 2, 0.15, 0.35), weight: 'heavy' });
        S.text(ctx, tx('t3'), 80, 512, { size: 18, weight: 700, maxWidth: 360, lineHeight: 1.2, p: beat(s, 2, 0.25, 0.5) });
      }
      var lg = beat(s, 2, 0.45, 0.75);
      if (lg > 0) C.legendRow(ctx, ['etica-datos', 'validez'], 470, 546, { p: lg, size: 19, r: 20 });
      void a; void b; void c;
    },

    caso: function (ctx, s, env) {
      // Draw: place `oficina-grupo`: JULIÁN, MARIANA and AMPARO each at a laptop; on line 1 JULIÁN's laptop is labeled «Ruta 1» and shows a chart card with a hand-check mark; on line 2 MARIANA's laptop is labeled «Ruta 2» and shows the `libro-codigos`; on line 3 AMPARO's laptop is labeled «Ruta 3» and shows a `lampara-local` with its cable unplugged, while the whiteboard behind them shows course sign `diagrama-flujo` growing: «Buscar», «Mapear», «Leer», «Extraer» and «Analizar», each with its tool, and a `bandera-control` after «Extraer» and after «Analizar»; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx;
      var intro = E.out(s.intro);
      var pl = C.place(ctx, 'oficina-grupo', { p: intro, boardX: 340, boardY: 84, boardW: 660, boardH: 262, window: false, laptops: false, seats: [230, 600, 940] });
      // the whiteboard: the group's workflow grows on line 3, with a checkpoint after «Extraer» and «Analizar»
      var g = beat(s, 2, 0.42, 0.95);
      if (g > 0) {
        var n = 5;
        C.sign(ctx, 'diagrama-flujo', {
          x: 372, y: 140, w: 590, labels: [tx('t4'), tx('t5'), tx('t6'), tx('t7'), tx('t8')], tools: true, flags: [3, 4], gap: 26, boxH: 128, size: 17, flagS: 0.5, flagDx: 4,
          stepP: function (i) { return E.segment(g, i / n * 0.8, i / n * 0.8 + 0.25); }
        });
      }
      var seats = pl.seats;
      C.person(ctx, 'julian', { pose: 'seated', x: seats[0].x, y: seats[0].y, scale: seats[0].scale, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: seats[1].x, y: seats[1].y, scale: seats[1].scale, t: s.t });
      C.person(ctx, 'amparo', { pose: 'seated', x: seats[2].x, y: seats[2].y, scale: seats[2].scale, t: s.t });
      pl.front(ctx);
      // each one's laptop shows the route they follow
      var labels = [tx('t1'), tx('t2'), tx('t3')];
      var ty = pl.tableY || 520;
      seats.forEach(function (st, i) {
        var lx = st.x + 122, scr;
        var q = beat(s, i, 0.05, 0.3);
        if (i < 2) {
          var lap = C.prop(ctx, 'laptop', { x: lx, y: ty + 2, w: 196, p: intro, seed: 140 + i, screenRole: 'accent-5' });
          scr = lap ? lap.screen : { x: lx - 90, y: ty - 120, w: 180, h: 106 };
        } else {
          // AMPARO: the local model, its network cable unplugged
          C.lamp(ctx, 'lampara-local', { x: lx, y: ty + 2 - 64, r: 50, p: intro, t: s.t });
          scr = { x: lx - 85, y: ty - 118, w: 170, h: 100 };
        }
        if (q <= 0) return;
        var tw = S.measure(ctx, labels[i], 17, 700) + 26;
        C.box(ctx, { x: lx - tw / 2, y: scr.y - 46, w: tw, h: 32 }, { p: q, role: 'accent-2', r: 16, seed: 145 + i, label: labels[i], size: 17 });
        if (i === 0) {
          chartCard(env, ctx, scr.x + 12, scr.y + 10, scr.w - 70, scr.h - 20, q, 150);
          C.check(ctx, scr.x + scr.w - 30, scr.y + scr.h / 2, 26, { p: beat(s, 0, 0.55, 0.8), weight: 'bold' });
        } else if (i === 1) {
          C.sign(ctx, 'libro-codigos', { x: scr.x + 22, y: scr.y + 8, w: scr.w - 60, h: scr.h - 16, p: q, icon: true, labels: ['', '', '', ''] });
        }
      });
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-interpretacion` in the center, with the `diagrama-flujo` behind it; on line 1 the label «Insumo para la última sesión: el diagrama del flujo» appears below.
      var S = env.style, C = env.course, tx = env.tx;
      var k = sceneTexts(env, 'caso');
      var intro = E.out(s.intro);
      // the group's workflow, behind the stamp: a band across the back of the page
      C.sign(ctx, 'diagrama-flujo', { x: 110, y: 120, w: 1060, labels: [k.t4, k.t5, k.t6, k.t7, k.t8], tools: true, flags: [3, 4], gap: 56, boxH: 118, size: 18, flagS: 0.42, flagDx: 6, p: intro });
      C.stamp(ctx, 'stamp-interpretacion', { x: 640, y: 386, r: 128, p: intro });
      S.text(ctx, tx('t1'), 640, 562, { size: 24, weight: 700, align: 'center', maxWidth: 1000, p: beat(s, 0, 0.3, 0.7) });
    }
  };

  NS.videos.v7 = { zones: zones, scenes: scenes };
})(window.IAHI);
