/* V6 · laboratorio-agentes · «Laboratorio 1: un agente en su computador» (spec §11 V6).
   Every on-screen text comes from the scene's `texts`, the figure bank, the course data (rotulos,
   badges) or the cast; visual beats follow the voice through s.at(i). The lab folder holds no real
   personal data: its interviews are drawn as anonymous pages. */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  // the badge «Esquema» (data: the badge whose sign is three boxes joined by lines)
  function esquema(env) { var b = env.data.badges || {}; for (var k in b) if (b[k].sign === 'three-boxes') return k; return ''; }
  // the agent at work: a small machine node runs along its loop arrow
  function pulse(ctx, S, x, y, R, t, p) {
    if (p <= 0) return;
    var a = Math.PI * (0.15 + 0.7 * ((t * 0.45) % 1));
    ctx.save(); ctx.globalAlpha *= E.clamp(p, 0, 1);
    S.machine(ctx, 'node', { x: x + Math.cos(a) * (R + 14), y: y + Math.sin(a) * (R + 14), r: 4.5, on: 1 });
    ctx.restore();
  }
  function arc(from, to, u, lift) { return [E.lerp(from[0], to[0], u), E.lerp(from[1], to[1], u) - Math.sin(u * Math.PI) * lift]; }
  function doc(C, ctx, x, y, w, h, p, seed, bar, check) { C.prop(ctx, 'article-card', { x: x, y: y, w: w, h: h, p: p, seed: seed, barRole: bar || 'accent-3', check: check }); }
  // the course folder prop, with the left edge of its outline drawn (props.js leaves that side open)
  function folder(env, ctx, o) {
    var out = env.course.prop(ctx, 'folder', o);
    var w = o.w || 150, h = o.h || 110, x = o.x - w / 2, y = o.y - h / 2;
    env.style.stroke(ctx, [[x, y + h], [x, y + 12]], { weight: 'regular', taper: false, p: o.p, seed: (o.seed || 7) + 9 });
    return out;
  }
  // body text that writes itself: wrapped as a whole first, then revealed character by character
  function written(ctx, S, str, x, y, o, u) {
    o = o || {};
    var size = o.size || 18, weight = o.weight || 500;
    ctx.save();
    ctx.font = weight + ' ' + size + 'px ' + S.tokens.fonts.body;
    var lines = o.maxWidth ? NS.engine.captions.wrap(ctx, NS.util.nbsp(String(str || '')), o.maxWidth) : [String(str || '')];
    ctx.restore();
    var total = lines.reduce(function (n, l) { return n + l.length; }, 0);
    var shown = Math.round(E.clamp(u, 0, 1) * total), lh = size * (o.lineHeight || 1.2);
    lines.forEach(function (ln, i) {
      var k = Math.min(ln.length, Math.max(0, shown));
      shown -= ln.length;
      if (k > 0) S.text(ctx, ln.slice(0, k), x, y + i * lh, { size: size, weight: weight, role: o.role });
    });
    return lines.length * lh;
  }
  // a code card: a page with indented lines (a script), human manner
  function codeCard(env, ctx, x, y, w, h, p, seed) {
    var S = env.style, C = env.course;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { p: p, role: 'ground', weight: 'regular', seed: seed, r: 8 });
    var ind = [0, 1, 1, 2, 1, 0, 1];
    var n = Math.max(2, Math.floor((h - 20) / 13));
    for (var i = 0; i < n && i < ind.length; i++) S.stroke(ctx, [[x + 12 + ind[i] * 10, y + 16 + i * 13], [x + 12 + ind[i] * 10 + (w - 34 - ind[i] * 10) * [0.8, 0.6, 0.7, 0.5, 0.75, 0.4, 0.6][i], y + 16.5 + i * 13]], { weight: i % 3 === 0 ? 'thin' : 'hair', taper: false, p: p, seed: seed + 1 + i, role: i % 3 === 0 ? 'accent-3' : 'ink' });
  }
  // a small chart card whose parts are labeled; proportions are not data (badge «Esquema» nearby)
  function chartCard(env, ctx, x, y, w, h, p, seed, kind) {
    var S = env.style, C = env.course, P = S.path;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { p: p, role: 'ground', weight: 'regular', seed: seed, r: 10 });
    if (p <= 0) return;
    S.fill(ctx, P.rect(x + 14, y + 12, w * 0.5, 9, 4), { role: 'ink', offset: false, texture: false, p: p });
    var ax = x + 26, ay = y + h - 30, aw = w - 46, ah = h - 62;
    S.stroke(ctx, [[ax, y + 34], [ax, ay], [ax + aw, ay]], { weight: 'thin', taper: false, p: p, seed: seed + 1 });
    if (kind === 'bars') {
      [0.55, 0.85, 0.4, 0.7].forEach(function (v, i) { S.fill(ctx, P.rect(ax + 10 + i * (aw - 14) / 4, ay - ah * v, (aw - 14) / 4 - 10, ah * v, 2), { role: 'accent-6', offset: false, p: p, seed: seed + 2 + i }); });
    } else {
      var pts = [0.3, 0.45, 0.4, 0.7, 0.62, 0.85].map(function (v, i) { return [ax + 8 + i * (aw - 16) / 5, ay - ah * v]; });
      S.stroke(ctx, P.smooth(pts, 6), { weight: 'regular', role: 'accent-3', p: p, seed: seed + 3 });
    }
    S.stroke(ctx, [[x + 14, y + h - 12], [x + w * 0.55, y + h - 12]], { weight: 'hair', taper: false, p: p, seed: seed + 4 });
  }

  var zones = {
    gancho: [[220, 70, 840, 80], [140, 240, 1000, 340]],
    opciones: [[20, 50, 1240, 500]],
    organizacion: [[50, 60, 1180, 500]],
    carpeta: [[60, 80, 1180, 480]],
    copia: [[100, 80, 1140, 470]],
    literatura: [[50, 80, 1180, 490]],
    datos: [[50, 80, 1180, 490]],
    'agents-md': [[90, 80, 1140, 470]],
    'skill-lab': [[50, 80, 1180, 470]],
    caso: [[180, 60, 1060, 420]],
    cierre: [[200, 110, 900, 380]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: the title «Laboratorio 1: un agente en su computador» at the top; on line 1 a laptop appears with an `agente` working on a folder labeled «lab-ia», and a `bandera-control` beside it.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0);
      S.title(ctx, tx('t1'), { x: 640, y: 124, size: 44, align: 'center', p: beat(s, 0, 0, 0.3), maxWidth: 880 });
      var lq = beat(s, 0, 0.06, 0.2);
      var lap = null;
      if (lq > 0) lap = C.prop(ctx, 'laptop', { x: 690, y: 520, w: 340, p: lq, seed: 11, screenRole: 'machine-ground' });
      var ag = beat(s, 0, 0.16, 0.3);
      if (ag > 0) C.lamp(ctx, 'agente', { x: 690, y: 404, r: 38, p: ag, t: s.t });
      if (a > 0.3) pulse(ctx, S, 690, 404, 38, s.t, E.segment(a, 0.3, 0.4));
      var fq = beat(s, 0, 0.26, 0.4);
      if (fq > 0) {
        folder(env, ctx, { x: 330, y: 450, w: 170, h: 120, p: fq, seed: 12, role: 'accent-6', label: tx('t2'), size: 22 });
        S.machine(ctx, 'arrow', { from: [516, 430], to: [424, 430], p: E.segment(fq, 0.4, 1), w: 1.8, head: 8, role: 'machine-grid' });
      }
      // the agent works on the folder: its files rise, move and settle back in order
      if (a > 0.42) {
        for (var j = 0; j < 3; j++) {
          var u = ((s.t * 0.3) + j / 3) % 1;
          var fade = Math.min(E.segment(u, 0, 0.12), 1 - E.segment(u, 0.88, 1)) * E.segment(a, 0.42, 0.52);
          if (fade <= 0) continue;
          var pt = arc([290, 396], [372, 396], u, 110);
          ctx.save(); ctx.globalAlpha *= fade;
          doc(C, ctx, pt[0] - 13, pt[1] - 34, 26, 34, 1, 13 + j, j % 2 ? 'accent-1' : 'accent-3');
          ctx.restore();
        }
      }
      var bq = beat(s, 0, 0.6, 0.8);
      if (bq > 0) C.prop(ctx, 'bandera-control', { x: 960, y: 500, s: 0.9, p: bq, size: 17, maxWidth: 200 });
      void lap;
    },

    opciones: function (ctx, s, env) {
      // Draw: a meaning zone; on line 1 the cards of `lab1.opencode`, `lab1.claude` and `lab1.chatgpt` appear side by side, each with «Revisar antes de clase»; on line 2 small notes appear under them, «App de escritorio de OpenCode», «Pestaña Code de la app de Claude» and «Modo Codex de la app de ChatGPT», and the card of `lab1.baratos` appears below with the note «Antigravity: solo con aprobación manual».
      var S = env.style, tx = env.tx;
      // two rows, so that each card's type and state badges fit side by side inside it:
      // OpenCode and Claude above; ChatGPT and, on line 2, the cheaper options below
      var slots = [
        { id: 'lab1.opencode', box: { x: 36, y: 58, w: 596, h: 200 }, note: 't2', q: beat(s, 0, 0.04, 0.28) },
        { id: 'lab1.claude', box: { x: 648, y: 58, w: 596, h: 200 }, note: 't3', q: beat(s, 0, 0.2, 0.44) },
        { id: 'lab1.chatgpt', box: { x: 36, y: 306, w: 500, h: 200 }, note: 't4', q: beat(s, 0, 0.36, 0.6), blob: false },
        { id: 'lab1.baratos', box: { x: 552, y: 306, w: 692, h: 200 }, note: 't5', q: beat(s, 1, 0.42, 0.56), blob: false }
      ];
      var noteQ = [beat(s, 1, 0.02, 0.2), beat(s, 1, 0.14, 0.32), beat(s, 1, 0.26, 0.44), beat(s, 1, 0.6, 0.78)];
      slots.forEach(function (sl) {
        if (sl.q > 0) env.cards.figure(ctx, sl.id, sl.box, { p: sl.q, size: 18, compact: true, blob: sl.blob });
      });
      slots.forEach(function (sl, i) {
        var nq = noteQ[i];
        if (nq > 0) S.text(ctx, tx(sl.note), sl.box.x + sl.box.w / 2, sl.box.y + sl.box.h + 27, { size: 19, weight: 700, align: 'center', maxWidth: sl.box.w - 20, p: nq });
      });
    },

    organizacion: function (ctx, s, env) {
      // Draw: course sign `salas-herramienta`; on line 1 three breakout rooms appear, «OpenCode», «Claude» and «ChatGPT», each with a monitor tile, TOMÁS in the room «Claude», and a participant in one room shares a screen inside the room; on line 2 course sign `semaforo-lab` appears with «Reacción verde: voy bien» and «Mano levantada: necesito ayuda», and then one tile freezes with the label «se cayó la conexión» while the agent on that laptop keeps working.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var res = C.sign(ctx, 'salas-herramienta', {
        x: 60, y: 70, w: 1160, h: 300, labels: [tx('t1'), tx('t2'), tx('t3')], monitors: [null, 'tomas', null], t: s.t,
        q: [beat(s, 0, 0.02, 0.22), beat(s, 0, 0.12, 0.32), beat(s, 0, 0.22, 0.42)]
      });
      // a participant shares a screen inside the room
      var sh = beat(s, 0, 0.55, 0.72);
      if (sh > 0 && res) {
        var r0 = res.rooms[0], t2 = r0.tiles[2], t3 = r0.tiles[3];
        var bx = t2.x, by = t2.y, bw = t3.x + t3.w - t2.x, bh = t2.h;
        ctx.save(); ctx.globalAlpha *= sh;
        S.machineArea(ctx, bx, by, bw, bh);
        S.machine(ctx, 'frame', { x: bx + 16, y: by + 12, w: bw * 0.62, h: bh - 24 });
        S.machineLine(ctx, bx + 16, by + 26, bx + 16 + bw * 0.62, by + 26, 1.1);
        S.machine(ctx, 'card', { x: bx + 28, y: by + 36, w: bw * 0.36, h: 24, lines: 2 });
        S.machine(ctx, 'lamp', { x: bx + bw * 0.83, y: by + bh / 2, r: Math.min(22, bh * 0.28), t: s.t });
        ctx.restore();
        S.stroke(ctx, S.path.rect(bx, by, bw, bh, 8), { weight: 'bold', closed: true, taper: false, p: sh, seed: 31 });
      }
      // line 2: the signals, then a connection drops while the agent keeps working
      var sg = beat(s, 1, 0, 0.35);
      if (sg > 0) C.sign(ctx, 'semaforo-lab', { x: 200, y: 470, labels: [tx('t5'), tx('t6')], q: [beat(s, 1, 0, 0.18), beat(s, 1, 0.14, 0.32)], r: 34, size: 21 });
      var fz = beat(s, 1, 0.5, 0.64);
      if (fz > 0 && res) {
        var tb = res.rooms[2].tiles[3];
        ctx.save(); ctx.globalAlpha *= fz;
        S.fill(ctx, S.path.rect(tb.x, tb.y, tb.w, tb.h, 10), { role: 'ground', offset: false, texture: false, alpha: 0.72 });
        S.fill(ctx, S.path.rect(tb.x + tb.w / 2 - 14, tb.y + 18, 9, 30, 3), { role: 'ink-soft', offset: false, texture: false });
        S.fill(ctx, S.path.rect(tb.x + tb.w / 2 + 5, tb.y + 18, 9, 30, 3), { role: 'ink-soft', offset: false, texture: false });
        S.text(ctx, tx('t7'), tb.x + tb.w / 2, tb.y + tb.h - 16, { size: 15, weight: 700, align: 'center', maxWidth: tb.w - 10 });
        ctx.restore();
        var lq = beat(s, 1, 0.62, 0.8);
        if (lq > 0) {
          var lx = 1110, ly = 530;
          for (var d = 0; d < 6; d++) S.stroke(ctx, [[tb.x + tb.w / 2, tb.y + tb.h + 8 + d * 14], [tb.x + tb.w / 2, tb.y + tb.h + 15 + d * 14]], { weight: 'thin', taper: false, p: lq, seed: 40 + d });
          C.prop(ctx, 'laptop', { x: lx, y: ly, w: 190, p: lq, seed: 41, screenRole: 'machine-ground' });
          C.lamp(ctx, 'agente', { x: lx, y: ly - 58, r: 22, p: lq, t: s.t });
          pulse(ctx, S, lx, ly - 58, 22, s.t, lq);
        }
      }
      void a; void b;
    },

    carpeta: function (ctx, s, env) {
      // Draw: course sign `carpeta-lab`; on line 1 the folder «lab-ia» opens and shows its contents, with the card of `curso.lab-ia` and the label «sin datos de personas reales»; on line 2 the folder is copied into «Documentos» and the original is set aside with the label «nunca sobre el original».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var dim = E.segment(b, 0.45, 0.75);
      ctx.save();
      ctx.translate(80, 96); ctx.scale(1.3, 1.3);
      C.sign(ctx, 'carpeta-lab', { x: 0, y: 0, stage: 'before', q: [beat(s, 0, 0, 0.12), beat(s, 0, 0.1, 0.5)], rowH: 44, size: 18, dim: dim, labels: [tx('t1')].concat(C.signLabels('carpeta-lab').slice(1)) });
      ctx.restore();
      var fc = beat(s, 0, 0.3, 0.5);
      if (fc > 0) env.cards.figure(ctx, 'curso.lab-ia', { x: 620, y: 92, w: 600, h: 228 }, { p: fc, size: 22 });
      var nl = beat(s, 0, 0.62, 0.85);
      if (nl > 0) {
        S.text(ctx, tx('t2'), 920, 372, { size: 23, weight: 700, align: 'center', p: nl });
        S.stroke(ctx, S.path.smooth([[760, 386], [920, 392], [1080, 386]], 8), { weight: 'thin', p: nl, seed: 50 });
      }
      // line 2: the copy goes to «Documentos»; the original is set aside
      var dq = beat(s, 1, 0, 0.3);
      if (dq > 0) folder(env, ctx, { x: 860, y: 486, w: 190, h: 120, p: dq, seed: 51, role: 'accent-3', label: tx('t3'), size: 20 });
      var mv = E.inOut(beat(s, 1, 0.2, 0.6));
      if (mv > 0) {
        var pt = arc([150, 120], [860, 478], mv, -70);
        folder(env, ctx, { x: pt[0], y: pt[1], w: 74, h: 52, seed: 52, role: 'accent-6' });
      }
      if (dim > 0) S.text(ctx, tx('t4'), 280, 548, { size: 21, weight: 700, align: 'center', p: dim });
      void a;
    },

    copia: function (ctx, s, env) {
      // Draw: a laptop with an `agente` opened inside the copy of «lab-ia», with the label «aprobación manual o modo de planificación»; on line 1 a read-only instruction card appears: «Lista los archivos de esta carpeta, di en una línea qué contiene cada uno y propón cómo organizarlos. No cambies nada todavía»; on line 2 the agent's list is compared, line by line, with the folder, and the label «mínimo privilegio» appears.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var intro = E.out(s.intro);
      var lap = C.prop(ctx, 'laptop', { x: 300, y: 452, w: 360, p: intro, seed: 60, screenRole: 'machine-ground' });
      var sc = lap ? lap.screen : { x: 128, y: 228, w: 344, h: 207 };
      ctx.save(); ctx.globalAlpha *= intro;
      S.machine(ctx, 'folder', { x: sc.x + 14, y: sc.y + 16, w: 26, h: 18 });
      S.machine(ctx, 'label', { text: tx('t1'), x: sc.x + 48, y: sc.y + 31, size: 17 });
      S.machineLine(ctx, sc.x + 8, sc.y + 44, sc.x + sc.w - 8, sc.y + 44, 1);
      ctx.restore();
      C.lamp(ctx, 'agente', { x: 300, y: 362, r: 34, p: E.segment(intro, 0.3, 1), t: s.t });
      S.text(ctx, tx('t2'), 300, 498, { size: 19, weight: 700, align: 'center', maxWidth: 400, p: E.segment(intro, 0.5, 1) });
      // line 1: a read-only instruction
      var iq = beat(s, 0, 0.35, 0.6);
      if (iq > 0) {
        C.box(ctx, { x: 540, y: 92, w: 680, h: 118 }, { p: iq, role: 'ground-2', weight: 'bold', seed: 61, r: 12 });
        S.text(ctx, tx('t3'), 566, 151 + 19 * 0.36, { size: 19, weight: 700, maxWidth: 630, vcenter: true, lineHeight: 1.18, p: E.segment(iq, 0.3, 1) });
      }
      // line 2: the agent's list is compared, line by line, with the folder
      var lq = beat(s, 1, 0, 0.2);
      if (lq > 0) {
        ctx.save(); ctx.globalAlpha *= lq;
        S.machine(ctx, 'frame', { x: 556, y: 262, w: 240, h: 214 });
        S.machine(ctx, 'lamp', { x: 776, y: 280, r: 11, still: true });
        ctx.restore();
      }
      var tree = C.sign(ctx, 'carpeta-lab', { x: 900, y: 238, stage: 'before', q: [lq, lq], rowH: 46, size: 18, labels: [tx('t1')].concat(C.signLabels('carpeta-lab').slice(1)), markNew: false, checks: [0, 1, 2, 3].map(function (k) { return beat(s, 1, 0.22 + k * 0.1, 0.32 + k * 0.1); }) });
      if (lq > 0 && tree) {
        tree.rows.forEach(function (row, k) {
          var ry = row.cy;
          var rq = beat(s, 1, 0.12 + k * 0.1, 0.24 + k * 0.1);
          if (rq <= 0) return;
          ctx.save(); ctx.globalAlpha *= rq;
          S.machine(ctx, 'node', { x: 576, y: ry, r: 4, on: 0.5 });
          S.machine(ctx, 'bar', { x: 590, y: ry - 2, w: [150, 120, 160, 110][k], h: 4 });
          ctx.restore();
          for (var d = 0; d < 7; d++) S.stroke(ctx, [[808 + d * 13, ry], [814 + d * 13, ry]], { weight: 'thin', taper: false, p: rq, seed: 62 + d });
        });
      }
      var mp = beat(s, 1, 0.6, 0.85);
      if (mp > 0) {
        S.text(ctx, tx('t4'), 890, 536, { size: 26, weight: 700, align: 'center', p: mp });
        key(env, ctx, 744, 528, 16, mp);
      }
      void a; void b;
    },

    literatura: function (ctx, s, env) {
      // Draw: course sign `matriz-literatura`; on line 1 the PDFs move into a new folder «articulos», renamed «Autor_Año_TituloCorto.pdf», and the table «matriz_literatura.csv» appears with its headers; on line 2 an empty cell is filled with «no encontrado» instead of a made-up value, and a plan card appears before any change; on line 3 three PDFs are drawn at random and compared with their rows, with the error labels «omisión», «invención» and «mala lectura del método» ready to tick in the `bitacora`.
      var S = env.style, C = env.course, tx = env.tx;
      var b = s.at(1), c = s.at(2);
      var intro = E.out(s.intro);
      // on line 3 the work area makes room: its top fades and the matrix rises
      var lift = E.inOut(beat(s, 2, 0, 0.16)), topA = 1 - lift;
      if (topA > 0) {
        ctx.save(); ctx.globalAlpha *= topA;
        // the PDFs move into «articulos», renamed
        var fq = beat(s, 0, 0.05, 0.2);
        if (fq > 0) folder(env, ctx, { x: 470, y: 160, w: 150, h: 104, p: fq, seed: 70, role: 'accent-6', label: tx('t1'), size: 19 });
        for (var k = 0; k < 4; k++) {
          var u = E.inOut(beat(s, 0, 0.18 + k * 0.08, 0.4 + k * 0.08));
          if (u >= 1) continue;
          var pt = arc([90 + k * 52, 120 + (k % 2) * 30], [450, 140], u, 50);
          ctx.save(); ctx.globalAlpha *= intro * (1 - E.segment(u, 0.85, 1));
          doc(C, ctx, pt[0] - 20, pt[1] - 26, 40, 52, 1, 71 + k, ['accent-1', 'accent-3', 'accent-2', 'accent-1'][k]);
          ctx.restore();
        }
        var tg = beat(s, 0, 0.5, 0.65);
        if (tg > 0) {
          var tw = S.measure(ctx, tx('t2'), 16, 700) + 28;
          C.box(ctx, { x: 150, y: 196, w: tw, h: 32 }, { p: tg, role: 'ground', r: 16, seed: 75, label: tx('t2'), size: 16 });
          C.arrow(ctx, [150 + tw + 6, 212], [390, 196], { p: tg, weight: 'thin', head: 8, curve: -8 });
        }
        // line 2: the plan, shown before any change
        var pq = beat(s, 1, 0.5, 0.75);
        C.lamp(ctx, 'agente', { x: 760, y: 172, r: 30, p: E.segment(intro, 0.3, 1), t: s.t });
        if (pq > 0) {
          ctx.save(); ctx.globalAlpha *= pq;
          S.machine(ctx, 'frame', { x: 850, y: 104, w: 330, h: 140 });
          for (var r = 0; r < 4; r++) {
            S.machine(ctx, 'node', { x: 872, y: 132 + r * 28, r: 6, on: r === 0 ? 1 : 0 });
            S.machine(ctx, 'bar', { x: 890, y: 130 + r * 28, w: [220, 180, 240, 150][r], h: 4 });
          }
          ctx.restore();
          S.machine(ctx, 'arrow', { from: [796, 172], to: [846, 172], p: pq, head: 7, w: 1.8, role: 'machine-grid' });
        }
        ctx.restore();
      }
      // the matrix with its headers
      var MY = E.lerp(288, 96, lift), headH = 54, rowH = 36;
      var mq = beat(s, 0, 0.6, 0.85);
      if (mq > 0) {
        C.prop(ctx, 'csv-sheet', { x: 60, y: MY - 34, w: 30, cols: 3, rows: 2, rh: 8, p: mq, seed: 76 });
        S.text(ctx, tx('t3'), 100, MY - 14, { size: 18, weight: 700, p: mq });
      }
      var cells = {};
      cells['1:7'] = { text: tx('t4'), q: beat(s, 1, 0.1, 0.3) };
      C.sign(ctx, 'matriz-literatura', { x: 60, y: MY, w: 1160, nRows: 4, rowH: rowH, headH: headH, p: mq, fill: 4 * beat(s, 0, 0.75, 1), cells: cells });
      // line 3: three PDFs at random are compared with their rows ...
      var rows3 = [0, 1, 3];
      rows3.forEach(function (r, k) {
        var q = beat(s, 2, 0.14 + k * 0.1, 0.32 + k * 0.1);
        if (q <= 0) return;
        var ry = MY + headH + r * rowH;
        S.stroke(ctx, S.path.rect(64, ry + 3, 1152, rowH - 6, 6), { weight: 'regular', closed: true, taper: false, p: q, role: 'accent-1', seed: 77 + k });
        var px = 120 + k * 92, py = 318;
        doc(C, ctx, px, py, 56, 72, q, 80 + k, ['accent-1', 'accent-3', 'accent-2'][k], E.segment(q, 0.6, 1));
        C.arrow(ctx, [px + 6, py + 4], [58, ry + rowH / 2], { p: E.segment(q, 0.2, 0.8), weight: 'hair', head: 7, curve: 18 + k * 8, seed: 83 + k });
      });
      // ... and the error types wait, ready to tick, in the logbook
      var bq = beat(s, 2, 0.48, 0.66);
      if (bq > 0) {
        var bcols = [0.09, 0.19, 0.1, 0.13, 0.12, 0.24, 0.13], BW = 1160, BY = 420;
        var bt = C.sign(ctx, 'bitacora', { x: 60, y: BY, w: BW, headers: C.signLabels('bitacora'), cols: bcols, nRows: 1, fill: 0, rowH: 84, headH: 48, headSize: 15, p: bq });
        var ry2 = BY + 48;
        if (bt) bcols.forEach(function (f, ci) {
          var cx0 = bt.cx[ci], cw = f * BW;
          if (ci === 5) {
            ['t5', 't6', 't7'].forEach(function (k2, i) {
              var q = beat(s, 2, 0.6 + i * 0.1, 0.76 + i * 0.1);
              if (q <= 0) return;
              var yy = ry2 + 16 + i * 23;
              S.stroke(ctx, S.path.rect(cx0 + 12, yy - 1, 16, 16, 3), { weight: 'thin', closed: true, taper: false, p: q, seed: 85 + i });
              S.text(ctx, tx(k2), cx0 + 36, yy + 13, { size: 16, weight: 700, p: q });
            });
          } else {
            var mw = (cw - 28) * (0.45 + 0.4 * ((ci * 3) % 5) / 5);
            S.stroke(ctx, [[cx0 + 12, ry2 + 42], [cx0 + 12 + mw * E.segment(bq, 0.4, 1), ry2 + 42.5]], { weight: 'thin', taper: false, seed: 90 + ci });
          }
        });
      }
      void b; void c;
    },

    datos: function (ctx, s, env) {
      // Draw: on line 1 the CSV card «indicadores del DANE» feeds an `agente`, and a list card «decisiones de análisis: faltantes, atípicos, exclusiones» appears at a `bandera-control` labeled «espera mi aprobación»; on line 2 a script card goes into a folder «analisis» together with «LEEME.md», and two chart cards appear with the labels «título», «unidades» and «fuente»; on line 3 a spreadsheet card computes one value by hand next to the agent's value, with a check, and the legend items `reproducibilidad` and `validez` appear.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1), c = s.at(2);
      var intro = E.out(s.intro);
      // line 1: the DANE indicators feed the agent; its analysis decisions wait for approval
      C.prop(ctx, 'csv-sheet', { x: 70, y: 112, w: 190, cols: 4, rows: 4, rh: 24, p: intro, seed: 90 });
      S.text(ctx, tx('t1'), 165, 262, { size: 18, weight: 700, align: 'center', maxWidth: 220, p: intro });
      C.arrow(ctx, [272, 172], [318, 172], { p: beat(s, 0, 0, 0.15), weight: 'thin', head: 10 });
      C.lamp(ctx, 'agente', { x: 368, y: 180, r: 30, p: E.segment(intro, 0.3, 1), t: s.t });
      var dq = beat(s, 0, 0.45, 0.7);
      if (dq > 0) {
        C.arrow(ctx, [412, 172], [452, 172], { p: dq, weight: 'thin', head: 10 });
        C.box(ctx, { x: 460, y: 92, w: 320, h: 168 }, { p: dq, role: 'ground', weight: 'bold', seed: 91 });
        S.text(ctx, tx('t2'), 480, 124, { size: 18, weight: 700, maxWidth: 284, lineHeight: 1.15, p: dq });
        for (var i = 0; i < 3; i++) {
          S.sign(ctx, 'star', { x: 488, y: 196 + i * 20, r: 5, seed: 92 + i, p: dq });
          S.stroke(ctx, [[500, 196 + i * 20], [500 + [200, 160, 230][i], 197 + i * 20]], { weight: 'hair', taper: false, p: dq, seed: 95 + i });
        }
        C.prop(ctx, 'bandera-control', { x: 832, y: 236, s: 0.72, p: beat(s, 0, 0.7, 0.9), label: tx('t3'), size: 17, maxWidth: 170 });
      }
      // line 2: a script and a LEEME go into «analisis»; two charts with title, units and source
      var lq0 = beat(s, 1, 0.05, 0.25), mv = E.inOut(beat(s, 1, 0.4, 0.7)), fq = beat(s, 1, 0.3, 0.45);
      if (mv >= 1) {
        codeCard(env, ctx, 104, 316, 62, 48, 1, 101);
        doc(C, ctx, 176, 312, 38, 50, 1, 108, 'accent-1');
      }
      if (fq > 0) folder(env, ctx, { x: 160, y: 388, w: 150, h: 100, p: fq, seed: 100, role: 'accent-6', label: tx('t4'), size: 19 });
      if (mv >= 1) {
        S.text(ctx, tx('t5'), 250, 352, { size: 17, weight: 700 });
        S.stroke(ctx, [[246, 346], [218, 336]], { weight: 'hair', taper: false, seed: 109 });
      } else if (mv > 0) {
        var p1 = arc([360, 300], [136, 340], mv, 60), p2 = arc([410, 304], [196, 338], mv, 40);
        codeCard(env, ctx, p1[0] - 31, p1[1] - 24, 62, 48, 1, 101);
        doc(C, ctx, p2[0] - 19, p2[1] - 25, 38, 50, 1, 108, 'accent-1');
      } else if (lq0 > 0) {
        codeCard(env, ctx, 330, 276, 62, 48, lq0, 101);
        doc(C, ctx, 392, 280, 38, 50, lq0, 108, 'accent-1');
      }
      var cq = beat(s, 1, 0.55, 0.85);
      if (cq > 0) {
        chartCard(env, ctx, 470, 300, 240, 150, cq, 110, 'bars');
        chartCard(env, ctx, 740, 300, 240, 150, E.segment(cq, 0.2, 1), 120, 'line');
        var lp = E.segment(cq, 0.5, 1);
        S.text(ctx, tx('t6'), 1000, 320, { size: 17, weight: 700, p: lp });
        S.text(ctx, tx('t7'), 1000, 380, { size: 17, weight: 700, p: lp });
        S.text(ctx, tx('t8'), 1000, 440, { size: 17, weight: 700, p: lp });
        C.arrow(ctx, [996, 314], [890, 314], { p: lp, weight: 'hair', head: 7 });
        C.arrow(ctx, [996, 374], [970, 418], { p: lp, weight: 'hair', head: 7 });
        C.arrow(ctx, [996, 434], [900, 438], { p: lp, weight: 'hair', head: 7 });
        C.badge(ctx, esquema(env), 1086, 304, { p: lp, size: 15 });
      }
      // line 3: one value computed by hand next to the agent's value, with a check
      var hq = beat(s, 2, 0, 0.3);
      if (hq > 0) {
        C.prop(ctx, 'csv-sheet', { x: 70, y: 476, w: 200, cols: 4, rows: 3, rh: 22, p: hq, seed: 130 });
        S.fill(ctx, S.path.rect(171, 521, 48, 20, 3), { role: 'accent-2', offset: false, texture: false, p: hq, alpha: 0.8 });
        C.prop(ctx, 'pen', { x: 214, y: 534, len: 54, angle: -0.8, p: hq });
        var vq = beat(s, 2, 0.25, 0.55);
        C.box(ctx, { x: 310, y: 494, w: 110, h: 52 }, { p: vq, role: 'ground', r: 10, seed: 131 });
        S.stroke(ctx, S.path.smooth([[330, 524], [350, 512], [372, 526], [398, 514]], 6), { weight: 'regular', p: vq, seed: 132 });
        if (vq > 0) {
          ctx.save(); ctx.globalAlpha *= vq;
          S.machine(ctx, 'frame', { x: 480, y: 494, w: 110, h: 52 });
          S.machine(ctx, 'bar', { x: 496, y: 517, w: 78, h: 6 });
          S.machine(ctx, 'lamp', { x: 600, y: 494, r: 10, still: true });
          ctx.restore();
          C.check(ctx, 450, 518, 22, { p: beat(s, 2, 0.5, 0.7), weight: 'bold' });
        }
        C.legendRow(ctx, ['reproducibilidad', 'validez'], 700, 522, { p: beat(s, 2, 0.55, 0.85), size: 19, r: 20 });
      }
      void a; void b; void c;
    },

    'agents-md': function (ctx, s, env) {
      // Draw: on line 1 a card «AGENTS.md» appears at the root of the folder and its rules write themselves: «Responde en español», «Nunca borres archivos; si algo sobra, muévelo a la carpeta “revisar”», «No inventes datos ni referencias», «Todo análisis se guarda como script reproducible», «Lista las decisiones de análisis y espera mi aprobación» and «Antes de cambios grandes, muestra el plan»; on line 2 three tool frames, «Codex», «OpenCode» and «Claude Code», read the same card.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var cq = beat(s, 0, 0, 0.12);
      // the card at the root of the folder
      folder(env, ctx, { x: 128, y: 136, w: 84, h: 60, p: cq, seed: 140, role: 'accent-6' });
      if (cq > 0) S.stroke(ctx, [[128, 168], [128, 200], [196, 200]], { weight: 'thin', taper: false, p: cq, seed: 141 });
      if (cq > 0) {
        C.box(ctx, { x: 206, y: 96, w: 560, h: 392 }, { p: cq, role: 'ground', weight: 'bold', seed: 142, r: 14 });
        C.prop(ctx, 'article-card', { x: 228, y: 114, w: 38, h: 48, p: cq, seed: 143, barRole: 'accent-1' });
        S.text(ctx, tx('t1'), 280, 148, { size: 28, weight: 700, p: cq });
      }
      var rules = ['t2', 't3', 't4', 't5', 't6', 't7'];
      var y = 200;
      rules.forEach(function (k, i) {
        var u = beat(s, 0, 0.12 + i * 0.14, 0.26 + i * 0.14);
        if (u > 0) S.sign(ctx, 'star', { x: 236, y: y - 6, r: 7, seed: 145 + i, p: u, colorCenter: 'accent-1' });
        var h = written(ctx, S, tx(k), 256, y, { size: 19, weight: 700, maxWidth: 490 }, u);
        y += Math.max(h, 24) + 14;
      });
      // line 2: three tools read the same card
      var tools = ['t8', 't9', 't10'];
      tools.forEach(function (k, i) {
        var q = beat(s, 1, 0.05 + i * 0.16, 0.25 + i * 0.16);
        if (q <= 0) return;
        var fy = 104 + i * 152;
        ctx.save(); ctx.globalAlpha *= q;
        S.machine(ctx, 'frame', { x: 900, y: fy, w: 300, h: 112 });
        S.machineLine(ctx, 900, fy + 20, 1200, fy + 20, 1);
        S.machine(ctx, 'lamp', { x: 1140, y: fy + 66, r: 26, t: s.t });
        S.machine(ctx, 'card', { x: 924, y: fy + 40, w: 54, h: 52, lines: 4 });
        S.machine(ctx, 'label', { text: tx(k), x: 912, y: fy + 15, size: 15 });
        ctx.restore();
        S.machine(ctx, 'arrow', { from: [770, 292], to: [896, fy + 64], p: E.segment(q, 0.3, 1), w: 1.4, head: 8, role: 'machine-grid' });
      });
      void a; void b;
    },

    'skill-lab': function (ctx, s, env) {
      // Draw: on line 1 the skill design of the fourth session becomes a folder «ficha-articulo» with a file «SKILL.md» whose steps appear: «Lee el PDF completo», «Extrae referencia, pregunta, método, datos, hallazgo y limitaciones», «Indica la página de cada dato», «Si un campo no aparece, escribe “no encontrado”» and «Agrega la fila sin borrar las existentes»; on line 2 the instruction card «Usa la skill ficha-articulo con uno de los artículos» runs it once, and the legend items `transparencia` and `validez` appear.
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // the skill design of session 4 becomes a folder with a SKILL.md file
      var dq = beat(s, 0, 0, 0.15);
      if (dq > 0) {
        C.box(ctx, { x: 70, y: 100, w: 200, h: 120 }, { p: dq, role: 'ground-2', seed: 150, r: 10, lines: 3, linesY: 40 });
        C.prop(ctx, 'pen', { x: 238, y: 206, len: 60, angle: -1.1, p: dq });
      }
      var fq = beat(s, 0, 0.12, 0.28);
      if (fq > 0) {
        C.arrow(ctx, [170, 228], [170, 278], { p: fq, weight: 'thin', head: 10 });
        folder(env, ctx, { x: 170, y: 340, w: 170, h: 116, p: fq, seed: 151, role: 'accent-6', label: tx('t1'), size: 20 });
      }
      var pq = beat(s, 0, 0.22, 0.38);
      if (pq > 0) {
        C.arrow(ctx, [262, 330], [338, 300], { p: pq, weight: 'thin', head: 10, curve: -10 });
        C.box(ctx, { x: 346, y: 96, w: 470, h: 372 }, { p: pq, role: 'ground', weight: 'bold', seed: 152, r: 14 });
        C.prop(ctx, 'article-card', { x: 368, y: 114, w: 36, h: 46, p: pq, seed: 153, barRole: 'accent-3' });
        S.text(ctx, tx('t2'), 418, 146, { size: 26, weight: 700, p: pq });
      }
      var y = 200;
      ['t3', 't4', 't5', 't6', 't7'].forEach(function (k, i) {
        var u = beat(s, 0, 0.36 + i * 0.12, 0.48 + i * 0.12);
        if (u > 0) { S.fill(ctx, S.path.circle(378, y - 6, 9, 16), { role: i === 2 ? 'accent-2' : 'ground-2', offset: false, texture: false, p: u }); S.stroke(ctx, S.path.circle(378, y - 6, 9, 16), { weight: 'hair', closed: true, taper: false, p: u }); }
        var h = written(ctx, S, tx(k), 398, y, { size: 19, weight: i === 2 ? 700 : 500, maxWidth: 396 }, u);
        y += Math.max(h, 24) + 18;
      });
      // line 2: the skill runs once on one article
      var iq = beat(s, 1, 0, 0.2);
      if (iq > 0) {
        C.box(ctx, { x: 850, y: 96, w: 370, h: 96 }, { p: iq, role: 'ground-2', weight: 'bold', seed: 154, r: 12 });
        S.text(ctx, tx('t8'), 870, 144 + 19 * 0.36, { size: 19, weight: 700, maxWidth: 330, vcenter: true, lineHeight: 1.16, p: E.segment(iq, 0.3, 1) });
      }
      var rq = beat(s, 1, 0.15, 0.3);
      if (rq > 0) C.lamp(ctx, 'agente', { x: 960, y: 290, r: 32, p: rq, t: s.t });
      var run = E.inOut(beat(s, 1, 0.25, 0.5));
      if (run > 0 && run < 1) { var pt = arc([1150, 250], [990, 282], run, 40); doc(C, ctx, pt[0] - 22, pt[1] - 28, 44, 56, 1, 155, 'accent-1'); }
      if (run >= 1 || run > 0.6) {
        var oq = E.segment(run, 0.6, 1);
        C.table(ctx, { x: 850, y: 360, w: 370, headers: ['', '', '', '', '', ''], nRows: 1, rowH: 34, headH: 18, p: oq, fill: oq });
        C.prop(ctx, 'article-card', { x: 1172, y: 404, w: 30, h: 38, p: oq, seed: 156, barRole: 'accent-2' });
      }
      var lg = beat(s, 1, 0.55, 0.85);
      if (lg > 0) C.legendRow(ctx, ['transparencia', 'validez'], 850, 500, { p: lg, size: 19, r: 20 });
      void a; void b;
    },

    caso: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA at her laptop, with TOMÁS in a tile; on line 1 a summary card from the agent, «Resumen de cambios», appears next to the folder tree; on line 2 the folder tree is compared item by item with the summary, each item getting a check when it appears in both, and a frame waiting for any change the summary might leave out; on line 3 the stamp `stamp-carpeta` appears; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx;
      var intro = E.out(s.intro);
      var pl = C.place(ctx, 'escritorio-casa', { x: 220, y: 478, w: 700, p: intro, secondScreen: false, window: false, laptopAt: 290, laptopW: 200 });
      // the folder tree after the lab; item by item, each new item gets a check when the summary names it
      var tree = C.sign(ctx, 'carpeta-lab', {
        x: 660, y: 66, stage: 'after', q: [intro, intro], rowH: 32, size: 17,
        checks: [0, 0, 0, 1, 2, 3, 4].map(function (k, i) { return i < 3 ? 0 : beat(s, 1, 0.08 + k * 0.12, 0.2 + k * 0.12); })
      });
      // a frame waits for any change the summary might leave out
      var fw = beat(s, 1, 0.62, 0.82);
      if (fw > 0 && tree) {
        var fy = tree.bottom + 6, P = S.path;
        var dash = P.rect(686, fy, 250, 34, 8);
        for (var d = 0; d < 14; d++) {
          var seg0 = P.partial(dash, d / 14), seg1 = P.partial(dash, (d + 0.55) / 14);
          S.stroke(ctx, [seg0[seg0.length - 1], seg1[seg1.length - 1]], { weight: 'thin', taper: false, p: fw, seed: 160 + d });
        }
        S.text(ctx, '?', 811, fy + 25, { size: 22, weight: 700, align: 'center', p: fw });
      }
      // line 1: the agent's own summary of what changed
      var sq = beat(s, 0, 0.1, 0.4);
      if (sq > 0) {
        ctx.save(); ctx.globalAlpha *= sq;
        S.machine(ctx, 'frame', { x: 200, y: 82, w: 340, h: 196 });
        S.machine(ctx, 'label', { text: tx('t1'), x: 216, y: 112, size: 20 });
        S.machine(ctx, 'lamp', { x: 514, y: 104, r: 13, still: true });
        for (var i = 0; i < 4; i++) {
          S.machine(ctx, 'node', { x: 222, y: 148 + i * 32, r: 5, on: 0.3 });
          S.machine(ctx, 'bar', { x: 236, y: 146 + i * 32, w: [210, 170, 230, 150][i], h: 4 });
        }
        ctx.restore();
      }
      // line 2: the summary's rows are compared with the folder, one by one
      for (var k = 0; k < 4; k++) {
        var kq = beat(s, 1, 0.12 + k * 0.12, 0.24 + k * 0.12);
        if (kq > 0) C.check(ctx, 566, 146 + k * 32, 16, { p: kq, weight: 'regular' });
      }
      // TOMÁS, in a video tile
      C.prop(ctx, 'tile', { x: 1012, y: 326, w: 210, h: 140, p: E.segment(intro, 0.3, 1), person: C.castEntry('tomas'), t: s.t, seed: 170, active: s.speaker === 'tomas' });
      C.person(ctx, 'mariana', { pose: 'seated', x: pl.seat.x, y: pl.seat.y, scale: 0.95, t: s.t, p: intro });
      pl.front(ctx);
      // line 3: the stamp
      var st = beat(s, 2, 0.05, 0.3);
      if (st > 0) C.stamp(ctx, 'stamp-carpeta', { x: 1100, y: 192, r: 120, p: st });
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-carpeta` stays in the center with the `carpeta-lab` behind it; on line 1 the stamp `stamp-responsabilidad` appears smaller beside it.
      var C = env.course;
      var intro = E.out(s.intro);
      // the lab folder, behind the stamp at the left, as the evidence it names
      C.sign(ctx, 'carpeta-lab', { x: 150, y: 176, stage: 'after', q: [intro, intro], rowH: 34, size: 18, markNew: false });
      C.stamp(ctx, 'stamp-carpeta', { x: 640, y: 300, r: 150, p: intro });
      C.stamp(ctx, 'stamp-responsabilidad', { x: 950, y: 404, r: 120, p: beat(s, 0, 0.2, 0.5) });
    }
  };

  // a small calligraphic key: the sign of «mínimo privilegio»
  function key(env, ctx, x, y, r, p) {
    var S = env.style, P = S.path;
    S.stroke(ctx, P.circle(x - r * 0.6, y, r * 0.55, 20), { weight: 'regular', closed: true, taper: false, p: p, seed: 180 });
    S.stroke(ctx, [[x - r * 0.05, y], [x + r * 1.6, y]], { weight: 'regular', taper: false, p: p, seed: 181 });
    S.stroke(ctx, [[x + r * 1.1, y], [x + r * 1.1, y + r * 0.55]], { weight: 'regular', taper: false, p: p, seed: 182 });
    S.stroke(ctx, [[x + r * 1.5, y], [x + r * 1.5, y + r * 0.45]], { weight: 'regular', taper: false, p: p, seed: 183 });
  }

  NS.videos.v6 = { zones: zones, scenes: scenes };
})(window.IAHI);
