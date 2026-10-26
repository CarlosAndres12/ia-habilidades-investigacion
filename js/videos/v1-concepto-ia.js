/* V1 · concepto-ia · «¿Qué es la IA y cómo aprende un modelo?» (spec §11 V1).
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
  function fig(env, id) { return env.data.figuresById[id]; }

  var zones = {
    gancho: [[60, 120, 1170, 440]],
    niveles: [[130, 90, 1020, 490]],
    entrenar: [[40, 90, 1200, 480]],
    regresion: [[290, 30, 950, 450]],
    linea: [[60, 80, 1160, 480]],
    motores: [[60, 120, 1160, 450]],
    eliza: [[30, 60, 1220, 480]],
    'tres-epocas': [[180, 60, 920, 260]],
    pesos: [[40, 60, 1200, 460]],
    categorias: [[60, 120, 1160, 440]],
    latam: [[470, 60, 790, 520]],
    ranking: [[30, 60, 1220, 520]],
    eleccion: [[40, 70, 1200, 470]],
    neurona: [[40, 100, 1200, 440]],
    montana: [[60, 100, 1180, 430]],
    sobreajuste: [[60, 100, 1160, 470]],
    'caja-negra': [[50, 90, 1180, 470]],
    caso: [[360, 50, 900, 360]],
    cierre: [[200, 80, 880, 480]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: place `sala-virtual`: a grid of eight video tiles of `extra-1` fills the frame, with a chat column on the right; on line 1 the title «¿Qué es la IA y cómo aprende un modelo?» appears across the top while small empty chat bubbles pop into the chat column one by one, and the small `lampara` appears on the lower right edge of one tile, like a tool on a desk.
      var S = env.style, C = env.course;
      var room = C.place(ctx, 'sala-virtual', { x: 70, y: 140, w: 1140, h: 410, cols: 4, rows: 2, chatW: 220, p: E.out(s.intro), bubbles: 6 * beat(s, 0, 0.15, 0.95), t: s.t, seed: 7 });
      S.title(ctx, env.tx('t1'), { x: 640, y: 92, size: 46, align: 'center', p: beat(s, 0, 0, 0.45), maxWidth: 1180 });
      var tile = room.tiles[6];
      if (tile) C.lamp(ctx, 'lampara', { x: tile.x + tile.w - 26, y: tile.y + tile.h - 26, r: 20, p: beat(s, 0, 0.55, 0.8), t: s.t });
    },

    funcion: function (ctx, s, env) {
      // Draw: the `lampara` sits in the center on an empty ground; on line 1 an input card labeled «entrada» slides in from the left into the lamp and an output card labeled «salida» comes out on the right; on line 2 a row of example cards with a check mark passes under the lamp while a few small dials on the lamp turn and settle.
      var S = env.style, C = env.course;
      var cx = 640, cy = 290;
      var a = s.at(0);
      var inU = E.inOut(E.segment(a, 0.05, 0.5));
      if (a > 0 && inU < 1) C.box(ctx, { x: E.lerp(130, cx - 190, inU), y: cy - 36, w: 170, h: 72 }, { label: env.tx('t1'), size: 24, role: 'accent-2', seed: 3, p: E.segment(a, 0, 0.15) });
      var outU = E.inOut(E.segment(a, 0.5, 0.95));
      if (outU > 0) C.box(ctx, { x: E.lerp(cx + 20, cx + 230, outU), y: cy - 36, w: 170, h: 72 }, { label: env.tx('t2'), size: 24, role: 'accent-5', seed: 4, p: E.segment(a, 0.5, 0.65) });
      if (inU >= 1) C.box(ctx, { x: 130, y: cy - 36, w: 170, h: 72 }, { label: env.tx('t1'), size: 24, role: 'accent-2', seed: 3, p: 1 });
      // dials on a ruled bar under the lamp: they turn on line 2 and settle
      var b = s.at(1);
      S.machineArea(ctx, cx - 140, cy + 92, 280, 58);
      for (var i = 0; i < 5; i++) {
        var settle = E.segment(b, 0.1 + i * 0.1, 0.8);
        var target = -Math.PI / 2 + [-0.7, 0.5, 1.1, -0.3, 0.8][i];
        var ang = target + (1 - settle) * Math.sin(settle * 12 + i) * 1.1 * (b > 0 ? 1 : 0);
        S.machine(ctx, 'dial', { x: cx - 112 + i * 56, y: cy + 121, r: 15, angle: b > 0 ? ang : -Math.PI / 2 });
      }
      C.lamp(ctx, 'lampara', { x: cx, y: cy, r: 84, t: s.t, p: E.out(s.intro) });
      // example cards with a check mark pass under the lamp
      if (b > 0) {
        for (var k = 0; k < 6; k++) {
          var u = E.clamp(b * 1.6 - k * 0.12, 0, 1);
          if (u <= 0 || u >= 1) continue;
          var x = E.lerp(-120, 1400, u);
          C.prop(ctx, 'article-card', { x: x, y: 450, w: 96, h: 74, seed: 10 + k, check: 1 });
        }
      }
    },

    inteligencia: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA seated at her laptop, with the small `lampara` beside the screen; on line 1 a long answer card unrolls from the lamp toward her; on line 2 the word «inteligencia» appears above the lamp in quotation marks, then breaks into small dots arranged in a regular pattern labeled «regularidades estadísticas».
      var S = env.style, C = env.course;
      var pl = C.place(ctx, 'escritorio-casa', { x: 200, y: 470, w: 760, p: E.out(s.intro), secondScreen: false, window: false, laptopAt: 330, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: pl.seat.x, y: pl.seat.y, scale: 0.95, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      var lx = 760, ly = 420;
      C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 34, t: s.t });
      // a long answer card unrolls from the lamp toward her
      var a = beat(s, 0, 0.05, 0.9);
      if (a > 0) {
        var w = 360 * a;
        C.box(ctx, { x: lx - 30 - w, y: 150, w: Math.max(30, w), h: 120 }, { p: 1, role: 'ground', lines: Math.round(4 * a), linesY: 26, seed: 31 });
        C.arrow(ctx, [lx - 10, ly - 38], [lx - 40, 280], { p: E.segment(a, 0, 0.3), weight: 'thin', head: 9 });
      }
      // «inteligencia» above the lamp, then a regular pattern of dots
      var b = s.at(1);
      var word = E.segment(b, 0, 0.18) * (1 - E.segment(b, 0.45, 0.62));
      if (word > 0) S.text(ctx, '«' + env.tx('t1') + '»', 960, 210, { size: 40, weight: 700, align: 'center', p: word });
      var dots = E.segment(b, 0.5, 0.75);
      if (dots > 0) {
        ctx.save(); ctx.globalAlpha *= dots;
        S.dotGrid(ctx, 830, 170, 260, 70, 20, 'ink', 4);
        ctx.restore();
        S.text(ctx, env.tx('t2'), 960, 290, { size: 24, weight: 700, align: 'center', p: E.segment(b, 0.62, 0.85) });
      }
    },

    niveles: function (ctx, s, env) {
      // Draw: course sign `niveles-ia`; on line 1 the outer frame «Inteligencia artificial» appears with its examples «ELIZA, Deep Blue»; on line 2 the frames «Aprendizaje automático» («regresión, filtros de spam») and «Aprendizaje profundo» («reconocimiento de imágenes, AlphaFold») appear inside it, one after the other; on line 3 the innermost frame «IA generativa y modelos de lenguaje (LLM)» («ChatGPT, Claude, Gemini, Llama, Qwen») appears and is emphasized, with the caption «Un LLM es un caso particular de la IA, no su sinónimo».
      var S = env.style, C = env.course, tx = env.tx;
      var boxes = C.sign(ctx, 'niveles-ia', {
        x: 140, y: 92, w: 1000, h: 480,
        labels: [tx('t1'), tx('t3'), tx('t5'), tx('t7')],
        examples: [tx('t2'), tx('t4'), tx('t6'), tx('t8')],
        q: [beat(s, 0, 0, 0.4), beat(s, 1, 0, 0.35), beat(s, 1, 0.45, 0.8), beat(s, 2, 0, 0.3)],
        emph: beat(s, 2, 0.3, 0.5)
      });
      var inner = boxes[3];
      S.text(ctx, tx('t9'), inner.x + inner.w / 2, inner.y + inner.h - 42, { size: 23, weight: 700, align: 'center', p: beat(s, 2, 0.4, 0.7), maxWidth: inner.w - 40 });
    },

    entrenar: function (ctx, s, env) {
      // Draw: two halves; on line 1 the left half, labeled «Entrenamiento», shows a tall stack of document cards feeding a lamp covered with many small dials that turn, and the right half, labeled «Inferencia», shows a question card entering a lamp and an answer card leaving it, as in a chat; on line 2 the label «miles de millones de perillas» appears under the left lamp's dials.
      var S = env.style, C = env.course;
      var a = s.at(0);
      var L = beat(s, 0, 0, 0.45), R2 = beat(s, 0, 0.45, 0.9);
      S.title(ctx, env.tx('t1'), { x: 320, y: 128, size: 38, align: 'center', p: L });
      S.title(ctx, env.tx('t2'), { x: 960, y: 128, size: 38, align: 'center', p: R2 });
      if (L > 0) {
        C.prop(ctx, 'card-stack', { x: 140, y: 470, w: 120, h: 86, n: 7, p: L });
        C.arrow(ctx, [210, 330], [260, 330], { p: E.segment(L, 0.5, 1), weight: 'regular' });
        S.machineArea(ctx, 270, 200, 250, 250);
        var spin = s.line >= 0 ? 1 : 0;
        for (var i = 0; i < 14; i++) {
          var ang = i * Math.PI * 2 / 14;
          var dx = 395 + Math.cos(ang) * 102, dy = 325 + Math.sin(ang) * 102;
          S.machine(ctx, 'dial', { x: dx, y: dy, r: 11, angle: -Math.PI / 2 + Math.sin(s.t * 1.6 + i * 1.3) * 1.2 * spin });
        }
        C.lamp(ctx, 'lampara', { x: 395, y: 325, r: 62, t: s.t, p: L });
      }
      if (R2 > 0) {
        C.lamp(ctx, 'lampara', { x: 960, y: 330, r: 66, t: s.t, p: R2 });
        var u = E.inOut(E.segment(a, 0.55, 0.8));
        if (u < 1) C.prop(ctx, 'chat-bubble', { x: E.lerp(700, 830, u), y: 230, w: 120, h: 50, lines: 2, tail: 'right', p: R2 * (1 - E.segment(u, 0.85, 1)) });
        var v = E.inOut(E.segment(a, 0.8, 1));
        if (v > 0) C.prop(ctx, 'chat-bubble', { x: E.lerp(980, 1060, v), y: 410, w: 150, h: 64, lines: 3, tail: 'left', p: v });
      }
      S.text(ctx, env.tx('t3'), 395, 500, { size: 22, weight: 700, align: 'center', p: beat(s, 1, 0, 0.3) });
    },

    regresion: function (ctx, s, env) {
      // Draw: place `oficina-grupo`: JULIÁN beside a whiteboard; on line 1 the left side of the board shows dots with one straight line through them, labeled «regresión lineal: pocos parámetros»; on line 2 the right side shows the same dots with a flexible curve, labeled «aprendizaje automático: muchos parámetros», with the labels «estimar e interpretar un efecto» and «predecir bien casos nuevos» under each side and the badge «Esquema»; on line 3 the legend item `validez` appears at the top left with two cards, «predecir bien» and «identificar efectos», separated by a not-equal sign.
      var S = env.style, C = env.course, tx = env.tx;
      // Julián stands clear of the speaker vignette (bottom left); the board keeps room for t2 on one line
      var bx = 348, by = 120, bw = 902, bh = 360;
      C.clearRegion(ctx, 600, 80, 80, 510, env.seed);
      C.prop(ctx, 'whiteboard', { x: bx, y: by, w: bw, h: bh, p: E.out(s.intro), seed: 32 });
      S.stroke(ctx, [[bx + bw / 2, by + 20], [bx + bw / 2 + 2, by + bh - 20]], { weight: 'thin', taper: false });
      C.person(ctx, 'julian', { pose: 'pointing', x: 225, y: 570, scale: 0.92, t: s.t, p: E.out(s.intro) });
      var r = env.rng(41), pts = [];
      for (var i = 0; i < 12; i++) { var u = i / 11; pts.push([u, 0.78 - 0.5 * u + Math.sin(u * 7) * 0.08 + r.range(-0.06, 0.06)]); }
      function side(x0, a, curve) {
        var w = bw / 2 - 70, h = bh - 150, y0 = by + 70;
        pts.forEach(function (pt, k) { S.fill(ctx, env.style.path.circle(x0 + pt[0] * w, y0 + pt[1] * h, 5.5, 12), { role: 'ink', offset: false, texture: false, p: E.stagger(a, k, pts.length) }); });
        var line = [];
        for (var j = 0; j <= 40; j++) {
          var v = j / 40;
          var yy = curve ? 0.78 - 0.5 * v + Math.sin(v * 7) * 0.08 : 0.8 - 0.5 * v;
          line.push([x0 + v * w, y0 + yy * h]);
        }
        S.stroke(ctx, line, { weight: 'bold', role: curve ? 'accent-1' : 'accent-3', p: E.segment(a, 0.4, 1), seed: curve ? 5 : 6 });
      }
      var a = beat(s, 0, 0, 0.7), b = beat(s, 1, 0, 0.6);
      if (a > 0) {
        side(bx + 40, a, false);
        S.text(ctx, tx('t1'), bx + bw / 4, by + 46, { size: 20, weight: 700, align: 'center', p: a, maxWidth: bw / 2 - 30 });
      }
      if (b > 0) {
        side(bx + bw / 2 + 30, b, true);
        S.text(ctx, tx('t2'), bx + bw * 0.75, by + 46, { size: 20, weight: 700, align: 'center', p: b, maxWidth: bw / 2 - 30 });
        var c = beat(s, 1, 0.5, 0.9);
        S.text(ctx, tx('t3'), bx + bw / 4, by + bh - 34, { size: 19, weight: 500, align: 'center', role: 'ink-soft', p: c, maxWidth: bw / 2 - 30 });
        S.text(ctx, tx('t4'), bx + bw * 0.75, by + bh - 34, { size: 19, weight: 500, align: 'center', role: 'ink-soft', p: c, maxWidth: bw / 2 - 30 });
        C.badge(ctx, tx('t5'), bx + bw - 150, by - 46, { p: c });
      }
      var d = beat(s, 2, 0, 0.4);
      if (d > 0) {
        C.legendChip(ctx, 'validez', 300, 60, { p: d, size: 19, r: 20 });
        C.box(ctx, { x: 520, y: 34, w: 200, h: 54 }, { label: tx('t6'), size: 19, role: 'ground', p: beat(s, 2, 0.2, 0.5), seed: 44 });
        C.notEqual(ctx, 760, 61, 30, { p: beat(s, 2, 0.4, 0.6) });
        C.box(ctx, { x: 800, y: 34, w: 230, h: 54 }, { label: tx('t7'), size: 19, role: 'ground', p: beat(s, 2, 0.5, 0.8), seed: 45 });
      }
    },

    linea: function (ctx, s, env) {
      // Draw: course sign `linea-tiempo` across the frame on a year scale (scale: from 1950 to 2025, step 10, unit «año»); on line 1 milestone cards appear at 1950 «Turing: el juego de la imitación», 1956 «Taller de Dartmouth» and 1958 «Perceptrón de Rosenblatt»; on line 2 a cold band labeled «Inviernos de la IA» spreads over the 1970s and 1980s; on line 3 the cards 2012 «AlexNet», 2017 «Transformer» and 2022 «ChatGPT» appear and the stretch after 2012 is emphasized.
      var C = env.course, tx = env.tx;
      var a = s.at(0), c = s.at(2);
      C.sign(ctx, 'linea-tiempo', {
        x: 110, y: 350, w: 1060, scale: env.scale, p: E.out(s.intro),
        band: { from: 1970, to: 1990, label: tx('t4'), q: beat(s, 1, 0, 0.5) },
        emph: { from: 2012, q: E.segment(c, 0.5, 0.9) },
        cards: [
          { year: 1950, label: tx('t1'), q: E.segment(a, 0.05, 0.3), row: -1, dx: 50 },
          { year: 1956, label: tx('t2'), q: E.segment(a, 0.35, 0.6), row: 1, dx: 40 },
          { year: 1958, label: tx('t3'), q: E.segment(a, 0.65, 0.9), row: -1, level: 1, dx: 150 },
          { year: 2012, label: tx('t5'), q: E.segment(c, 0, 0.2), row: -1, dx: -40, w: 150 },
          { year: 2017, label: tx('t6'), q: E.segment(c, 0.2, 0.4), row: 1, dx: -10, w: 160 },
          { year: 2022, label: tx('t7'), q: E.segment(c, 0.4, 0.6), row: -1, level: 1, dx: 0, w: 150 }
        ]
      });
    },

    motores: function (ctx, s, env) {
      // Draw: course sign `tres-motores`; on line 1 the three engines appear one after another: «Datos digitales masivos», «Procesadores gráficos (GPU)» (`chip-gpu`) and «Mejores algoritmos» (a block labeled «Transformer, 2017»); on line 2 a ring of blank tiles labeled «todas las disciplinas» lights up around a card «ChatGPT, 2022».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var shrink = E.inOut(E.segment(b, 0, 0.3));
      ctx.save();
      ctx.translate(640, 300 - 170 * shrink); ctx.scale(1 - 0.45 * shrink, 1 - 0.45 * shrink); ctx.translate(-640, -300);
      C.sign(ctx, 'tres-motores', { x: 80, y: 290, w: 1120, labels: [tx('t1'), tx('t2'), tx('t3')], algo: tx('t4'), q: [E.segment(a, 0.02, 0.3), E.segment(a, 0.33, 0.62), E.segment(a, 0.66, 0.95)], t: s.t });
      ctx.restore();
      if (b > 0) {
        var ring = E.segment(b, 0.25, 0.9);
        C.ring(ctx, { n: 12, cx: 640, cy: 410, rx: 430, ry: 118, p: ring, draw: function (i, x, y, q) {
          C.box(ctx, { x: x - 38, y: y - 26, w: 76, h: 52 }, { p: q, role: q >= 1 ? ['accent-2', 'accent-5', 'accent-1', 'ground-2'][i % 4] : 'ground', seed: 70 + i, r: 8 });
        } });
        C.box(ctx, { x: 520, y: 352, w: 240, h: 72 }, { label: tx('t6'), size: 24, role: 'ground', weight: 'bold', p: E.segment(b, 0.2, 0.45), seed: 90 });
        S.text(ctx, tx('t5'), 640, 462, { size: 22, weight: 700, align: 'center', p: E.segment(b, 0.6, 0.9) });
      }
    },

    eliza: function (ctx, s, env) {
      // Draw: course sign `tres-epocas`; on line 1 the first panel «ELIZA (1966)» shows `lampara-antigua` with the question card «What are the main causes of informal employment in Latin America?» and, below it, «¿Cuáles son las principales causas del empleo informal en América Latina?»; on line 2 its answer card «How would an answer to that help you?» appears with «¿En qué le ayudaría una respuesta a eso?» below it; on line 3 the panels «GPT-2 (2019)» and «Un chat actual» show their question cards and closed answer cards marked «…», while MARIANA watches from a tile at the lower left; on line 4 the caption «efecto ELIZA» appears over the first panel.
      var S = env.style, C = env.course, tx = env.tx;
      var c = s.at(2);
      var boxes = C.sign(ctx, 'tres-epocas', {
        x: 240, y: 70, w: 1000, h: 470, t: s.t,
        panels: [
          { title: tx('t1'), lamp: 'lampara-antigua', q: beat(s, 0, 0, 0.25), qq: beat(s, 0, 0.2, 0.5), qa: beat(s, 1, 0, 0.4), question: [tx('t2'), tx('t3')], answer: [tx('t4'), tx('t5')] },
          { title: tx('t6'), lamp: 'lampara', q: E.segment(c, 0, 0.3), qq: E.segment(c, 0.15, 0.4), qa: E.segment(c, 0.35, 0.6), question: [tx('t3')], answer: null, closedText: tx('t8') },
          { title: tx('t7'), lamp: 'lampara', q: E.segment(c, 0.3, 0.6), qq: E.segment(c, 0.45, 0.7), qa: E.segment(c, 0.65, 0.9), question: [tx('t3')], answer: null, closedText: tx('t8') }
        ]
      });
      if (c > 0 && s.speaker !== 'mariana') {
        C.prop(ctx, 'tile', { x: 40, y: 400, w: 170, h: 120, person: C.castEntry('mariana'), t: s.t, p: E.segment(c, 0, 0.3), seed: 5 });
      }
      var d = beat(s, 3, 0.4, 0.7);
      if (d > 0) {
        var b0 = boxes[0];
        C.box(ctx, { x: b0.x + 92, y: b0.y + 64, w: b0.w - 110, h: 52 }, { label: tx('t9'), size: 22, role: 'accent-2', weight: 'bold', p: d, seed: 99, motion: 'pop' });
      }
    },

    'tres-epocas': function (ctx, s, env) {
      // Draw: the three panels shrink into a row at the top of the frame; on line 1 an empty label with a question mark appears under each panel.
      var C = env.course;
      var e = sceneTexts(env, 'eliza');
      var boxes = C.sign(ctx, 'tres-epocas', {
        x: 200, y: 80, w: 880, h: 120, small: true, gap: 30, t: s.t,
        panels: [{ title: e.t1, lamp: 'lampara-antigua' }, { title: e.t6 }, { title: e.t7 }]
      });
      boxes.forEach(function (b, i) {
        C.box(ctx, { x: b.x + b.w / 2 - 90, y: 260, w: 180, h: 110 }, { label: '?', size: 54, role: 'ground', p: beat(s, 0, 0.1 + i * 0.15, 0.3 + i * 0.15), seed: 120 + i });
      });
    },

    pesos: function (ctx, s, env) {
      // Draw: on line 1 the labels «tamaño», «datos» and «ajuste para seguir instrucciones» appear under the three panels, then the panels fade, and the legend item `reproducibilidad` appears at the top left with a small notebook row «nombre · versión · fecha»; on line 2 the `lampara` opens like a box and shows `archivo-pesos`, labeled «los pesos».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var fade = 1 - E.segment(a, 0.62, 0.85);
      if (fade > 0) {
        ctx.save(); ctx.globalAlpha *= fade;
        var e = sceneTexts(env, 'eliza');
        var boxes = C.sign(ctx, 'tres-epocas', { x: 200, y: 80, w: 880, h: 120, small: true, gap: 30, t: s.t, panels: [{ title: e.t1, lamp: 'lampara-antigua' }, { title: e.t6 }, { title: e.t7 }] });
        [tx('t1'), tx('t2'), tx('t3')].forEach(function (lb, i) {
          var bb = boxes[i];
          C.box(ctx, { x: bb.x + 10, y: 240, w: bb.w - 20, h: 70 }, { label: lb, size: 21, role: 'accent-2', p: E.segment(a, 0.05 + i * 0.12, 0.2 + i * 0.12), seed: 130 + i });
        });
        ctx.restore();
      }
      var g = E.segment(a, 0.7, 0.95);
      if (g > 0) {
        C.legendChip(ctx, 'reproducibilidad', 60, 110, { p: g, size: 20, r: 22 });
        C.box(ctx, { x: 60, y: 150, w: 360, h: 56 }, { label: tx('t4'), size: 19, role: 'ground', p: g, seed: 140 });
        S.notebookLines(ctx, 70, 150, 340, 56, { gap: 18, margin: true, p: g });
      }
      // the lamp opens like a box: its upper half lifts and the file of weights rises from inside
      var open = E.inOut(beat(s, 1, 0, 0.45));
      var lx = 760, ly = 380, R = 92;
      if (b > 0 || g > 0) {
        if (open <= 0) C.lamp(ctx, 'lampara', { x: lx, y: ly, r: R, t: s.t, p: g });
        else {
          S.glow(ctx, lx, ly - 40 * open, R * 1.6, 'machine-glow-1');
          ctx.save(); ctx.beginPath(); ctx.rect(lx - R - 10, ly, (R + 10) * 2, R + 20); ctx.clip();
          C.lamp(ctx, 'lampara', { x: lx, y: ly, r: R, t: s.t, p: 1, glow: false });
          ctx.restore();
          C.lamp(ctx, 'archivo-pesos', { x: lx, y: ly - 60 * open, w: 112, h: 140, p: E.segment(open, 0.2, 0.8) });
          ctx.save(); ctx.translate(0, -150 * open);
          ctx.beginPath(); ctx.rect(lx - R - 10, ly - R - 20, (R + 10) * 2, R + 20); ctx.clip();
          C.lamp(ctx, 'lampara', { x: lx, y: ly, r: R, t: s.t, p: 1, glow: false });
          ctx.restore();
        }
        S.text(ctx, tx('t5'), lx + 170, ly - 70, { size: 26, weight: 700, p: beat(s, 1, 0.45, 0.7) });
        if (open > 0.6) C.arrow(ctx, [lx + 160, ly - 80], [lx + 66, ly - 76], { p: beat(s, 1, 0.5, 0.75), weight: 'thin', curve: -16, head: 10 });
      }
    },

    categorias: function (ctx, s, env) {
      // Draw: course sign `cajas-modelos`, a meaning zone with three boxes in a row; on line 1 the box «Código abierto» opens to show «pesos», «código de entrenamiento» and «información sobre los datos», with the examples «Olmo 3, Apertus, SmolLM3»; on line 2 the box «Pesos abiertos» opens to show only «pesos», with «DeepSeek, Qwen, Kimi, GLM, MiMo, Gemma 4, gpt-oss, Muse Spark Open»; on line 3 the box «Cerrados» stays shut with a service window labeled «app o API», with «Claude, GPT, Gemini, Muse Wonder, Grok», and the note «Ejemplos de octubre de 2026» appears under the three boxes.
      var C = env.course, tx = env.tx;
      C.clearRegion(ctx, 600, 80, 80, 500, env.seed);
      C.sign(ctx, 'cajas-modelos', {
        x: 90, y: 200, w: 1100, h: 210, gap: 50,
        boxes: [
          { title: tx('t1'), items: [tx('t2'), tx('t3'), tx('t4')], examples: tx('t5'), q: beat(s, 0, 0, 0.8) },
          { title: tx('t6'), items: [tx('t7')], examples: tx('t8'), q: beat(s, 1, 0, 0.7) },
          { title: tx('t9'), closed: true, windowLabel: tx('t10'), examples: tx('t11'), q: beat(s, 2, 0, 0.5) }
        ]
      });
      env.style.text(ctx, tx('t12'), 640, 530, { size: 19, weight: 700, align: 'center', role: 'ink-soft', p: beat(s, 2, 0.6, 0.9) });
    },

    latam: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA at her laptop; on line 1 a card «Latam-GPT» appears in the center with the labels «CENIA, Chile» and «instituciones de 15 países»; on line 2 the card hovers between the boxes «Código abierto» and «Pesos abiertos»; on line 3 it opens to show «Llama 3.1 70B reentrenado» and «licencia de Llama», slides into the box «Pesos abiertos», and the stamp `stamp-pesos` appears.
      var S = env.style, C = env.course, tx = env.tx;
      // the desk sits right of the speaker vignette (bottom left), the boxes right of the desk
      var pl = C.place(ctx, 'escritorio-casa', { x: 100, y: 480, w: 440, p: E.out(s.intro), secondScreen: false, window: false, headset: false, plant: false, laptopAt: 300, laptopW: 180 });
      C.person(ctx, 'mariana', { pose: 'seated', x: pl.seat.x + 10, y: pl.seat.y, scale: 0.9, t: s.t });
      pl.front(ctx);
      var a = s.at(0), b = s.at(1), c = s.at(2);
      // the two boxes
      var boxQ = beat(s, 1, 0, 0.3);
      var openX = 680, weightsX = 1080, boxY = 380;
      if (boxQ > 0) {
        [[openX, tx('t4')], [weightsX, tx('t5')]].forEach(function (bx, i) {
          C.box(ctx, { x: bx[0] - 120, y: boxY, w: 240, h: 150 }, { role: 'accent-6', p: boxQ, seed: 150 + i });
          S.text(ctx, bx[1], bx[0], boxY - 16, { size: 21, weight: 700, align: 'center', p: boxQ });
        });
      }
      // the Latam-GPT card: center, hover between the boxes, then into «Pesos abiertos»
      var hover = Math.sin(s.t * 2.2) * 30 * E.segment(b, 0.2, 0.5) * (1 - E.segment(c, 0.4, 0.6));
      var slide = E.inOut(E.segment(c, 0.45, 0.8));
      var cx = E.lerp(800 + hover, weightsX, slide), cy = E.lerp(170, boxY + 10, slide);
      var cardP = beat(s, 0, 0, 0.3);
      if (cardP > 0) {
        C.box(ctx, { x: cx - 160, y: cy, w: 320, h: 150 }, { label: tx('t1'), sub: tx('t2') + ' · ' + tx('t3'), size: 26, subSize: 17, role: 'ground', weight: 'bold', p: cardP, seed: 160, subGap: 36 });
      }
      // the labels close as the card starts to slide, so they never travel out of the frame
      var openP = E.segment(c, 0.1, 0.4) * (1 - E.segment(c, 0.45, 0.55));
      if (openP > 0) {
        C.box(ctx, { x: cx + 170, y: cy - 10, w: 250, h: 60 }, { label: tx('t6'), size: 17, role: 'accent-2', p: openP, seed: 161 });
        C.box(ctx, { x: cx + 170, y: cy + 62, w: 250, h: 52 }, { label: tx('t7'), size: 17, role: 'accent-2', p: openP, seed: 162 });
      }
      var stampP = beat(s, 2, 0.75, 0.95);
      if (stampP > 0) C.stamp(ctx, 'stamp-pesos', { x: 700, y: 210, r: 120, p: stampP });
      // the bank's card (figure, scope, type, source) once the case is settled, above the label «Pesos abiertos»
      if (c > 0.85) env.cards.figure(ctx, 'ecosistema.latamgpt', { x: 860, y: 40, w: 390, h: 296 }, { p: E.segment(c, 0.85, 1), size: 17, maxLines: 5 });
    },

    ranking: function (ctx, s, env) {
      // Draw: an exact horizontal bar chart of figures `aa.cerrados` and `aa.abiertos`, a meaning zone: two groups of six bars, «Cerrados (6 mejores)» above and «Pesos abiertos (6 mejores)» below, on one scale (scale: from 0 to 60, step 10, unit «puntos del índice»), each bar labeled with its model, company and exact value from the bank; on line 1 the bars appear group by group, frame first and then values, and a reference line at the best closed value and a bracket to the best open value appear with the label of `aa.brecha`; on line 2 the card of `aa.indice-def` appears beside the chart with the badge «Con matiz»; on line 3 the note «El ranking cambia cada semana» appears under the chart.
      var S = env.style, C = env.course, ch = env.charts, tx = env.tx;
      var cer = fig(env, 'aa.cerrados'), abi = fig(env, 'aa.abiertos'), bre = fig(env, 'aa.brecha');
      var a = s.at(0);
      function items(f, role) { return f.partes.map(function (pt) { return { label: pt.etiqueta, value: ch.parseValue(pt.valor), valueText: pt.valor, role: role }; }); }
      var g1 = E.segment(a, 0, 0.3), g2 = E.segment(a, 0.3, 0.6);
      var x = 40, w = 800, labelW = 300, rowH = 20, gap = 5;
      var list = [{ groupTitle: tx('t1') }].concat(items(cer, 'accent-3'));
      var top = 56;
      var r1 = ch.barsH(ctx, { x: x, y: top, w: w, labelW: labelW, rowH: rowH, gap: gap, scale: env.scale, items: list, p: g1, axis: false, labelSize: 16 });
      var y2 = top + 30 + 6 * (rowH + gap) + 10;
      var r2 = ch.barsH(ctx, { x: x, y: y2, w: w, labelW: labelW, rowH: rowH, gap: gap, scale: env.scale, items: [{ groupTitle: tx('t2') }].concat(items(abi, 'accent-6')), p: g2, labelSize: 16 });
      // reference line at the best closed value and a bracket to the best open value
      var ref = E.segment(a, 0.6, 0.85);
      if (ref > 0) {
        var best = ch.parseValue(bre.partes[1].valor), open = ch.parseValue(bre.partes[2].valor);
        var xb = r1.px(best), xo = r2.px(open);
        for (var yy = y2 + 8; yy < y2 + 30 + 6 * (rowH + gap); yy += 14) S.stroke(ctx, [[xb, yy], [xb, yy + 7]], { weight: 'thin', taper: false, p: ref });
        C.bracket(ctx, xo, xb, y2 + 18, { p: ref, label: bre.partes[0].valor + ' ' + bre.partes[0].etiqueta, size: 16, h: 10, maxWidth: 440 });
      }
      // type and state badges and the source, under the chart (the notes take the full width: one line each)
      var meta = E.segment(a, 0.5, 0.8);
      if (meta > 0) {
        var bb = C.badge(ctx, cer.tipo, x, 486, { p: meta, size: 15 });
        C.badge(ctx, cer.estado, x + (bb ? bb.w : 200) + 10, 486, { p: meta, size: 15 });
        S.text(ctx, tx('t1') + ': ' + cer.alcance, x, 536, { size: 14, role: 'ink-soft', p: meta, maxWidth: 1200, maxLines: 1 });
        S.text(ctx, tx('t2') + ': ' + abi.alcance, x, 555, { size: 14, role: 'ink-soft', p: meta, maxWidth: 1200, maxLines: 1 });
        S.text(ctx, env.cards.sourceLine(cer) + ' · ' + env.data.ui.consultedShort, x, 574, { size: 14, role: 'ink-soft', p: meta, maxWidth: 1200, maxLines: 1 });
      }
      var cq = beat(s, 1, 0, 0.4);
      if (cq > 0) env.cards.figure(ctx, 'aa.indice-def', { x: 870, y: 80, w: 380, h: 330 }, { p: cq, size: 19 });
      S.text(ctx, tx('t4'), 1060, 460, { size: 21, weight: 700, align: 'center', p: beat(s, 2, 0, 0.4), maxWidth: 360 });
    },

    eleccion: function (ctx, s, env) {
      // Draw: the legend items `transparencia` and `etica-datos` appear at the top left; on line 1 a page labeled «Sección de métodos» shows five blank lines labeled «modelo», «versión», «configuración», «fecha» and «licencia»; on line 2 `lampara-local` sits inside a laptop on the left, while on the right a document card travels along a long cable to `lampara-nube` on a far shelf labeled «servidores de la empresa, casi siempre en el exterior».
      var S = env.style, C = env.course, tx = env.tx;
      C.legendRow(ctx, ['transparencia', 'etica-datos'], 60, 96, { p: E.out(s.intro), size: 19, r: 20 });
      var a = beat(s, 0, 0, 0.8);
      if (a > 0) {
        C.box(ctx, { x: 60, y: 140, w: 400, h: 400 }, { p: E.segment(a, 0, 0.3), role: 'ground', weight: 'bold', seed: 170 });
        S.text(ctx, tx('t1'), 84, 186, { size: 24, weight: 700, p: E.segment(a, 0.1, 0.35) });
        ['t2', 't3', 't4', 't5', 't6'].forEach(function (k, i) {
          var q = E.segment(a, 0.25 + i * 0.13, 0.4 + i * 0.13);
          S.text(ctx, tx(k), 84, 246 + i * 60, { size: 19, weight: 700, p: q });
          S.stroke(ctx, [[220, 248 + i * 60], [430, 249 + i * 60]], { weight: 'thin', taper: false, p: q, seed: 180 + i });
        });
      }
      var b = s.at(1);
      var lp = beat(s, 1, 0, 0.3);
      if (lp > 0) C.lamp(ctx, 'lampara-local', { x: 610, y: 420, r: 40, p: lp, t: s.t });
      var np = beat(s, 1, 0.3, 0.6);
      if (np > 0) {
        C.prop(ctx, 'laptop', { x: 860, y: 520, w: 150, p: np, seed: 9 });
        C.lamp(ctx, 'lampara-nube', { x: 1120, y: 190, r: 34, laptop: [935, 460], elbow: 1000, p: np, t: s.t, travel: E.segment(b, 0.55, 0.95) });
        S.text(ctx, tx('t7'), 1120, 274, { size: 17, weight: 700, align: 'center', p: E.segment(np, 0.5, 1), maxWidth: 300 });
      }
    },

    neurona: function (ctx, s, env) {
      // Draw: course sign `neurona`; on line 1 four input lines enter from the left, each dial turns to a different setting, the lines meet in one node and the node's gauge rises; on line 2 a card «regresión logística» appears beside the node with a «≈» sign between them; on line 3 course sign `red-capas` grows to the right, columns of nodes joined by lines, and three small panels light up above them in order: «bordes», «formas», «objetos».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1), c = s.at(2);
      C.sign(ctx, 'neurona', { x: 50, y: 170, w: 420, h: 260, q: E.segment(a, 0, 0.8), act: E.segment(a, 0.75, 1) });
      var bq = beat(s, 1, 0, 0.4);
      if (bq > 0) {
        S.text(ctx, tx('t2'), 500, 318, { size: 44, weight: 700, align: 'center', p: bq });
        C.box(ctx, { x: 530, y: 262, w: 190, h: 76 }, { label: tx('t1'), size: 20, role: 'ground', weight: 'bold', p: beat(s, 1, 0.2, 0.6), seed: 190 });
      }
      var net = E.segment(c, 0, 0.5);
      if (net > 0) {
        C.sign(ctx, 'red-capas', { x: 760, y: 220, w: 460, h: 300, cols: [4, 6, 6, 4], p: net,
          panels: [tx('t3'), tx('t4'), tx('t5')], pq: [E.segment(c, 0.45, 0.6), E.segment(c, 0.6, 0.75), E.segment(c, 0.75, 0.9)] });
      }
    },

    montana: function (ctx, s, env) {
      // Draw: course sign `montana-niebla`; on line 1 the bead takes one step and the labels «predice», «mide el error» and «ajusta los pesos» appear beside it in turn, then it keeps stepping down the slope in small steps while the fog stays around it; on line 2 short arrows fan from the label «mide el error» back to several dials of a small `neurona`, labeled «retropropagación».
      var S = env.style, C = env.course, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      var stepP = E.clamp(s.t / Math.max(1, s.dur) * 1.05, 0, 1);
      var m = C.sign(ctx, 'montana-niebla', { x: 70, y: 120, w: 820, h: 360, step: stepP, steps: 16, fog: 1, t: s.t, p: E.out(s.intro) });
      var labels = [tx('t1'), tx('t2'), tx('t3')];
      var b1 = s.at(1);
      var idx = a < 1 ? Math.min(2, Math.floor(a * 3)) : 1;
      var lp = a < 1 ? E.segment((a * 3) % 1, 0, 0.3) : 1;
      var lab = { x: Math.min(m.bead[0] + 30, 700), y: m.bead[1] - 96, w: 210, h: 54 };
      C.box(ctx, lab, { label: b1 > 0 ? tx('t4') : labels[idx], size: 20, role: 'accent-2', p: Math.min(lp, 1), seed: 200 + idx });
      var bq = beat(s, 1, 0, 0.35);
      if (bq > 0) {
        C.sign(ctx, 'neurona', { x: 950, y: 120, w: 290, h: 190, q: 1, act: 0.5 });
        [0, 1, 2, 3].forEach(function (i) {
          var dy = 120 + 40 + i * (190 - 80) / 3;
          C.arrow(ctx, [lab.x + lab.w + 4, lab.y + 14 + i * 9], [950 + 0.3 * 290 - 18, dy], { p: beat(s, 1, 0.2 + i * 0.1, 0.45 + i * 0.1), weight: 'thin', curve: -14, head: 9, seed: 220 + i });
        });
        S.text(ctx, tx('t5'), 1095, 350, { size: 22, weight: 700, align: 'center', p: beat(s, 1, 0.55, 0.8) });
      }
    },

    sobreajuste: function (ctx, s, env) {
      // Draw: course sign `curvas-ajuste` with the badge «Esquema»; on line 1 training dots appear on the left and a curve threads through every one of them, then new dots appear far from that curve and are marked as misses, while on the right a smooth curve passes near both old and new dots; on line 2 JULIÁN appears at the right edge; on line 3 the legend item `validez` and a card «datos que no vio en el entrenamiento» appear below.
      var C = env.course, tx = env.tx;
      var a = s.at(0);
      // both charts end at y 440, above the speaker vignette of line 2
      C.sign(ctx, 'curvas-ajuste', { x: 90, y: 110, w: 460, h: 330, side: 'over', q: [E.segment(a, 0, 0.2), E.segment(a, 0.15, 0.4), E.segment(a, 0.4, 0.55), E.segment(a, 0.5, 0.65)], seed: 150 });
      C.sign(ctx, 'curvas-ajuste', { x: 680, y: 110, w: 400, h: 330, side: 'smooth', q: [E.segment(a, 0.6, 0.75), E.segment(a, 0.72, 0.9), E.segment(a, 0.8, 0.95), 0], seed: 150 });
      C.badge(ctx, tx('t1'), 900, 70, { p: E.out(s.intro) });
      var jp = beat(s, 1, 0, 0.3);
      if (jp > 0) C.person(ctx, 'julian', { pose: 'arms-crossed', x: 1190, y: 560, scale: 0.78, p: jp, t: s.t });
      var c = beat(s, 2, 0, 0.4);
      if (c > 0) {
        C.legendChip(ctx, 'validez', 90, 528, { p: c, size: 19, r: 20 });
        C.box(ctx, { x: 300, y: 500, w: 420, h: 56 }, { label: tx('t2'), size: 19, role: 'accent-2', p: beat(s, 2, 0.2, 0.6), seed: 230 });
      }
    },

    'caja-negra': function (ctx, s, env) {
      // Draw: course sign `caja-negra`; on line 1 the lamp shows many small unlabeled dials while, beside it, a regression card shows one labeled coefficient «coeficiente»; on line 2 the legend item `transparencia` appears with three cards below it: «auditorías», «métodos de explicabilidad», «modelos más simples».
      var C = env.course, tx = env.tx;
      C.sign(ctx, 'caja-negra', { x: 90, y: 100, coefLabel: tx('t1'), q: [beat(s, 0, 0, 0.35), beat(s, 0, 0.4, 0.8)], t: s.t });
      var b = beat(s, 1, 0, 0.3);
      if (b > 0) {
        C.legendChip(ctx, 'transparencia', 90, 450, { p: b, size: 19, r: 20 });
        ['t2', 't3', 't4'].forEach(function (k, i) {
          C.box(ctx, { x: 90 + i * 360, y: 486, w: 330, h: 60 }, { label: tx(k), size: 19, role: 'ground', p: beat(s, 1, 0.2 + i * 0.15, 0.45 + i * 0.15), seed: 240 + i });
        });
      }
    },

    caso: function (ctx, s, env) {
      // Draw: place `oficina-grupo`: AMPARO, JULIÁN and MARIANA at the shared table, with the course sign `ficha-proyecto` on the wall screen; on line 1 the field «Proyecto» fills with «Informalidad laboral en Colombia»; on line 2 the field «Datos» fills with «GEIH del DANE · entrevistas sintéticas para practicar»; on line 3 short marks appear under «Tres tareas en las que la IA podría ayudar» and «Un riesgo que me preocupa»; on line 4 the screen switches to course sign `bitacora`, its first row fills with short marks and no numbers, and both cards drop into a folder labeled «Carpeta del curso»; badge «Ejemplo ilustrativo».
      var C = env.course, tx = env.tx;
      var pl = C.place(ctx, 'oficina-grupo', { p: E.out(s.intro), board: false, boardX: 380, seats: [300, 640, 980] });
      var bx = 370, by = 56, bw = 580, bh = 330;
      var d = s.at(3);
      var drop = E.inOut(E.segment(d, 0.6, 0.95));
      var switchP = E.segment(d, 0.05, 0.3);
      C.prop(ctx, 'screen', { x: bx + bw / 2, y: by + bh + 40, w: bw, h: bh, p: E.out(s.intro), seed: 3, screenRole: 'ground' });
      ctx.save();
      ctx.translate(bx + bw / 2, by + bh / 2);
      var sc = 1 - 0.75 * drop;
      ctx.translate(drop * 600, drop * 40); ctx.scale(sc, sc);
      ctx.translate(-(bx + bw / 2), -(by + bh / 2));
      if (switchP < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - switchP;
        C.sign(ctx, 'ficha-proyecto', { x: bx + 20, y: by + 18, w: bw - 40, h: bh - 36, fields: [
          { label: tx('t1'), value: tx('t2'), q: beat(s, 0, 0.3, 0.6) },
          { label: tx('t3'), value: tx('t4'), q: beat(s, 1, 0.2, 0.6) },
          { label: tx('t5'), marks: 3, q: beat(s, 2, 0.1, 0.6) },
          { label: tx('t6'), marks: 1, q: beat(s, 2, 0.5, 0.9) }
        ] });
        ctx.restore();
      }
      if (switchP > 0) {
        var b2 = (env.data.plantillas || []).filter(function (t) { return t.id === 'B2'; })[0];
        var heads = b2 ? b2.blocks.filter(function (k) { return k.type === 'table'; })[0].head : [];
        ctx.save(); ctx.globalAlpha *= switchP;
        // columns sized so every header word fits the narrow wall screen
        C.sign(ctx, 'bitacora', { x: bx + 16, y: by + 40, w: bw - 32, headers: heads, nRows: 2, fill: E.segment(d, 0.25, 0.55), headH: 74, headSize: 13, cols: [0.1, 0.185, 0.1, 0.165, 0.15, 0.17, 0.13] });
        ctx.restore();
      }
      ctx.restore();
      var folderP = E.segment(d, 0.45, 0.65);
      if (folderP > 0) C.prop(ctx, 'folder', { x: 1150, y: 300, w: 170, h: 120, p: folderP, label: tx('t7'), seed: 260 });
      var seats = pl.seats;
      C.person(ctx, 'amparo', { pose: 'seated', x: seats[0].x, y: seats[0].y, scale: seats[0].scale, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: seats[1].x, y: seats[1].y, scale: seats[1].scale, t: s.t });
      C.person(ctx, 'julian', { pose: 'seated', x: seats[2].x, y: seats[2].y, scale: seats[2].scale, t: s.t });
      pl.front(ctx);
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-estimaciones` appears in the center; on line 1 the course signs `niveles-ia`, `cajas-modelos`, `neurona` and `curvas-ajuste` return as small icons in a ring around it, and the legend item `validez` sits below the stamp.
      var C = env.course;
      var a = s.at(0);
      C.stamp(ctx, 'stamp-estimaciones', { x: 640, y: 300, r: 150, p: E.out(s.intro) });
      var n = sceneTexts(env, 'niveles'), cm = sceneTexts(env, 'categorias');
      var icons = [
        function (q) { C.sign(ctx, 'niveles-ia', { x: 0, y: 0, w: 1000, h: 480, labels: ['', '', '', ''], examples: null, q: [q, q, q, q] }); },
        function (q) { C.sign(ctx, 'cajas-modelos', { x: 0, y: 120, w: 1000, h: 210, boxes: [{ title: '', items: ['', '', ''], q: q }, { title: '', items: [''], q: q }, { title: '', closed: true, q: q }] }); },
        function (q) { C.sign(ctx, 'neurona', { x: 250, y: 60, w: 500, h: 360, q: q, act: q }); },
        function (q) { C.sign(ctx, 'curvas-ajuste', { x: 200, y: 20, w: 600, h: 420, side: 'over', q: [q, q, q, q], seed: 150 }); }
      ];
      var pos = [[260, 170], [1020, 170], [260, 430], [1020, 430]];
      icons.forEach(function (fn, i) {
        var q = E.segment(a, 0.1 + i * 0.15, 0.35 + i * 0.15);
        if (q <= 0) return;
        ctx.save();
        ctx.translate(pos[i][0] - 100, pos[i][1] - 50);
        ctx.scale(0.2, 0.2);
        fn(1);
        ctx.restore();
        C.box(ctx, { x: pos[i][0] - 112, y: pos[i][1] - 62, w: 224, h: 124 }, { role: false, p: q, weight: 'thin', seed: 270 + i });
      });
      C.legendChip(ctx, 'validez', 560, 500, { p: E.segment(a, 0.7, 0.95), size: 21, r: 22 });
      void n; void cm;
    }
  };

  NS.videos.v1 = { zones: zones, scenes: scenes };
})(window.IAHI);
