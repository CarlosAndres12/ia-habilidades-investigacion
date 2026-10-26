/* V3 · limites-potencialidades · «Límites y potencialidades de la IA en la ciencia» (spec §11 V3).
   Every on-screen text comes from the scene's `texts`, the figure bank, the cast or the data; visual
   beats follow the voice through s.at(i). Figure cards and exact charts use C.v3 (js/course/signs-v3.js):
   the card of base §5.2 with room for an exact chart or for the figure's parts as large numbers. */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  function sceneTexts(env, id) {
    var sc = env.video.scenes.filter(function (x) { return x.id === id; })[0];
    return (sc && sc.texts) || {};
  }
  function fig(env, id) { return env.data.figuresById[id]; }

  // ------------------------------------------------------------------ small props of this video
  // a document card with a round seal (a policy, a circular): a page, its title, ruled lines, the seal
  function docSeal(ctx, env, b, title, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    var a = S.appear('rise', p);
    ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(0, a.dy);
    S.shape(ctx, P.rect(b.x, b.y, b.w, b.h, 8), { role: 'ground', seed: seed, weight: 'bold', offset: false, texture: false });
    var t = S.text(ctx, title, b.x + 20, b.y + 42, { size: 23, weight: 700, maxWidth: b.w - 40, lineHeight: 1.18 });
    var y0 = b.y + 60 + t.height;
    var n = Math.max(2, Math.floor((b.y + b.h - 96 - y0) / 22) + 1);
    for (var i = 0; i < n; i++) S.stroke(ctx, [[b.x + 20, y0 + i * 22], [b.x + b.w - (i === n - 1 ? b.w * 0.45 : 20), y0 + i * 22 + 1]], { weight: 'hair', taper: false, seed: seed + 1 + i });
    var sx = b.x + b.w - 52, sy = b.y + b.h - 50;
    S.fill(ctx, P.circle(sx, sy, 30, 30), { role: 'accent-1', seed: seed + 8 });
    S.stroke(ctx, P.circle(sx, sy, 30, 30), { weight: 'regular', closed: true, taper: false, seed: seed + 9 });
    S.stroke(ctx, P.circle(sx, sy, 21, 26), { weight: 'hair', closed: true, taper: false, seed: seed + 10 });
    S.sign(ctx, 'star', { x: sx, y: sy, r: 9, seed: seed + 11 });
    ctx.restore();
  }

  // a calendar page with its month (the month comes from the scene's texts)
  function calendarCard(ctx, env, b, label, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    var a = S.appear('pop', p);
    ctx.save(); ctx.globalAlpha *= a.alpha;
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(a.scale, a.scale); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    S.shape(ctx, P.rect(b.x, b.y, b.w, b.h, 10), { role: 'ground', seed: seed, weight: 'bold', offset: false, texture: false });
    S.fill(ctx, P.rect(b.x + 5, b.y + 5, b.w - 10, 26, 7), { role: 'accent-1', seed: seed + 1 });
    [0.3, 0.7].forEach(function (u, i) { S.stroke(ctx, P.circle(b.x + b.w * u, b.y + 5, 7, 14), { weight: 'regular', closed: true, taper: false, seed: seed + 2 + i }); });
    S.text(ctx, label, b.x + b.w / 2, b.y + 31 + (b.h - 31) / 2 + 8, { size: 22, weight: 700, align: 'center', maxWidth: b.w - 24, vcenter: true });
    ctx.restore();
  }

  // a task card for the irregular frontier: helped (check) or worse (cross)
  function taskCard(ctx, env, x, y, ok, p, seed) {
    var C = env.course;
    if (p <= 0) return;
    C.prop(ctx, 'article-card', { x: x - 30, y: y - 22, w: 60, h: 44, p: p, seed: seed, barRole: 'accent-6' });
    if (ok) C.check(ctx, x + 32, y - 20, 22, { p: E.segment(p, 0.5, 1), weight: 'bold', seed: seed + 1 });
    else C.cross(ctx, x + 32, y - 20, 16, { p: E.segment(p, 0.5, 1), weight: 'bold' });
  }

  // a respondent's answer card: a short five-step line with the answer marked (human or machine manner)
  function respondent(ctx, env, x, y, w, h, u, machine, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha *= E.out(p);
    var lx0 = x + 12, lx1 = x + w - 12, ly = y + h * 0.64;
    if (machine) {
      S.machine(ctx, 'frame', { x: x, y: y, w: w, h: h });
      S.machineLine(ctx, x + 10, y + 13, x + w * 0.55, y + 13, 1.2);
      S.machineLine(ctx, lx0, ly, lx1, ly, 1.2);
      for (var k = 0; k < 5; k++) S.machineCircle(ctx, lx0 + k * (lx1 - lx0) / 4, ly, 2.2, 1);
      S.machine(ctx, 'node', { x: lx0 + u * (lx1 - lx0), y: ly, r: 5.5, on: 0.6 });
    } else {
      S.shape(ctx, P.rect(x, y, w, h, 7), { role: 'ground', seed: seed, weight: 'thin', offset: false, texture: false });
      S.stroke(ctx, [[x + 10, y + 13], [x + w * 0.55, y + 13]], { weight: 'hair', taper: false, seed: seed + 4 });
      S.stroke(ctx, [[lx0, ly], [lx1, ly + 1]], { weight: 'thin', taper: false, seed: seed + 1 });
      for (var j = 0; j < 5; j++) S.fill(ctx, P.circle(lx0 + j * (lx1 - lx0) / 4, ly, 2.4, 8), { role: 'ink', offset: false, texture: false });
      S.fill(ctx, P.circle(lx0 + u * (lx1 - lx0), ly, 6.5, 14), { role: 'accent-1', offset: false, seed: seed + 2 });
      S.stroke(ctx, P.circle(lx0 + u * (lx1 - lx0), ly, 6.5, 14), { weight: 'thin', closed: true, taper: false, seed: seed + 3 });
    }
    ctx.restore();
  }

  // a survey sheet: four questions, each with five answer circles
  function surveySheet(ctx, env, x, y, w, h, p, seed) {
    var S = env.style, P = S.path;
    if (p <= 0) return;
    S.shape(ctx, P.rect(x, y, w, h, 6), { role: 'ground', seed: seed, weight: 'regular', offset: false, texture: false, p: p });
    for (var i = 0; i < 4; i++) {
      var yy = y + 16 + i * (h - 22) / 4;
      S.stroke(ctx, [[x + 10, yy], [x + w * 0.72, yy]], { weight: 'hair', taper: false, p: p, seed: seed + i });
      for (var k = 0; k < 5; k++) {
        var cx = x + 14 + k * (w - 28) / 4, cy = yy + 11;
        S.stroke(ctx, P.circle(cx, cy, 3.6, 10), { weight: 'hair', closed: true, taper: false, p: p });
        if (k === (i * 2 + 1) % 5) S.fill(ctx, P.circle(cx, cy, 3, 10), { role: 'ink', offset: false, texture: false, p: p });
      }
    }
  }

  // a tweet card and a news card for the annotation scene (no readable text)
  function postCard(ctx, env, x, y, k, p) {
    var S = env.style, P = S.path, C = env.course;
    if (p <= 0) return;
    if (k % 2) { C.prop(ctx, 'article-card', { x: x - 22, y: y - 28, w: 44, h: 56, p: p, seed: 1100 + k, barRole: 'accent-3' }); return; }
    S.shape(ctx, P.rect(x - 26, y - 16, 52, 32, 8), { role: 'accent-5', seed: 1110 + k, weight: 'thin', p: p, texture: false });
    S.stroke(ctx, [[x - 18, y - 4], [x + 18, y - 4]], { weight: 'hair', taper: false, p: p });
    S.stroke(ctx, [[x - 18, y + 6], [x + 6, y + 6]], { weight: 'hair', taper: false, p: p });
  }

  var zones = {
    gancho: [[150, 84, 980, 495]],
    marcos: [[30, 56, 1220, 530]],
    normas: [[30, 56, 1220, 530]],
    privacidad: [[30, 56, 1220, 530]],
    transferencia: [[320, 60, 930, 290]],
    avances: [[30, 84, 1220, 500]],
    masai: [[30, 60, 1220, 520]],
    educacion: [[30, 56, 1220, 530]],
    trabajo: [[30, 56, 1220, 530]],
    ciencia: [[30, 56, 1220, 530]],
    pobreza: [[30, 56, 1220, 530]],
    anotacion: [[30, 84, 1220, 500]],
    silicio: [[640, 56, 610, 500]],
    referencias: [[30, 56, 1220, 530]],
    sesgo: [[30, 84, 1220, 500]],
    auditoria: [[30, 56, 1220, 530]],
    abliterado: [[30, 84, 1220, 500]],
    censura: [[30, 56, 1220, 530]],
    recursos: [[30, 84, 1220, 500]],
    region: [[30, 56, 1220, 530]],
    caso: [[200, 80, 1040, 270]],
    cierre: [[130, 100, 1020, 480]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: course sign `escala-1-5` across the frame, from «estrecha» to «amplía», with the question «¿La IA amplía o estrecha la ciencia?» above it; on line 1 the scale appears and small empty markers drop onto it from the video tiles of `extra-1` at the top, without values.
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      S.title(ctx, tx('t3'), { x: 640, y: 130, size: 46, align: 'center', p: beat(s, 0, 0, 0.2), maxWidth: 1100 });
      // the session's participants (extra-1) in a row of video tiles; two have the camera off
      var n = 8, tw = 92, th = 62, gap = 12, x0 = 640 - (n * tw + (n - 1) * gap) / 2, ty = 162;
      var from = [];
      for (var i = 0; i < n; i++) {
        var x = x0 + i * (tw + gap);
        from.push([x + tw / 2, ty + th + 6]);
        C.prop(ctx, 'tile', { x: x, y: ty, w: tw, h: th, p: E.stagger(E.out(s.intro), i, n, 0.5), person: S.extraLook(7 * 13 + i), cameraOff: i === 3 || i === 6, t: s.t, seed: 70 + i });
      }
      // the scale; small empty markers drop onto it from the tiles, without values (badge «Esquema»)
      var ks = [2, 3, 1, 3, 4, 2, 0, 3];
      C.sign(ctx, 'escala-1-5', {
        x: 220, y: 334, w: 840, labels: [tx('t1'), tx('t2')], p: beat(s, 0, 0.04, 0.3),
        markers: ks.map(function (k, j) { return { k: k, from: from[j], q: beat(s, 0, 0.3 + j * 0.045, 0.46 + j * 0.045) }; })
      });
      // (the badge mark draws its sign even at p = 0: only call it once it appears)
      var bq = beat(s, 0, 0.62, 0.75);
      if (bq > 0) C.badge(ctx, V.badgeName('three-boxes'), 1090, 262, { p: bq });
      // the course's figure: the survey on a scale from 1 to 5, repeated at the end of the session
      V.card(ctx, 'curso.escala', { x: 300, y: 448, w: 680, h: 128 }, { p: beat(s, 0, 0.74, 0.9), compact: true, inlineFoot: true, size: 22, blob: false });
    },

    marcos: function (ctx, s, env) {
      // Draw: the legend item `equidad` at the top left; on line 1 the card of `unesco.recomendacion` appears on the left; on line 2 the card of `ram.stem` appears on the right and, on line 3, the card of `ram.internet` below it, a meaning zone, each with two exact bars from zero on one scale (scale: from 0 to 100, step 25, unit «%»), the two cards never joined to each other.
      var C = env.course, V = C.v3;
      C.legendChip(ctx, 'equidad', 44, 96, { p: E.out(s.intro), size: 20, r: 22 });
      V.card(ctx, 'unesco.recomendacion', { x: 40, y: 140, w: 390, h: 400 }, { p: beat(s, 0, 0, 0.3), scope: true, size: 27 });
      function chartCard(id, box, p, blob) {
        var items = V.items(id, 'accent-3');
        var opts = { rowH: 30, gap: 10, labelW: 170 };
        return V.card(ctx, id, box, { p: p, compact: true, inlineFoot: true, size: 22, blob: blob, chart: { h: V.barsHeight(items.length, opts), draw: function (c2, area, q) { V.bars(c2, area, items, env.scale, Object.assign({ p: q }, opts)); } } });
      }
      chartCard('ram.stem', { x: 460, y: 62, w: 780, h: 252 }, beat(s, 1, 0, 0.4));
      chartCard('ram.internet', { x: 460, y: 328, w: 780, h: 252 }, beat(s, 2, 0, 0.4), false);
    },

    normas: function (ctx, s, env) {
      // Draw: document cards with a round seal appear in turn; on line 1 the card «CONPES 4144» with the cards of `conpes.4144` and `colombia.ley`, and above them, smaller, the card of `ue.ley-ia`; on line 2 the card «Circular Externa 002 de 2024 de la SIC» with the card of `sic.002` and two labels: «evaluar el impacto en privacidad» and «consentimiento previo».
      var C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // line 1 (the CONPES and the bills); it gives way to line 2 so every card stays legible
      var g1 = 1 - E.segment(b, 0, 0.1);
      if (a > 0 && g1 > 0) {
        ctx.save(); ctx.globalAlpha *= g1;
        docSeal(ctx, env, { x: 40, y: 160, w: 250, h: 330 }, tx('t1'), E.segment(a, 0, 0.1), 900);
        V.card(ctx, 'conpes.4144', { x: 320, y: 280, w: 450, h: 296 }, { p: E.segment(a, 0.08, 0.28), scope: true, size: 26, blob: false });
        V.card(ctx, 'colombia.ley', { x: 790, y: 280, w: 450, h: 296 }, { p: E.segment(a, 0.4, 0.52), size: 26, blob: false });
        // smaller, above them: the EU law (a short, quieter card)
        V.card(ctx, 'ue.ley-ia', { x: 320, y: 64, w: 920, h: 196 }, { p: E.segment(a, 0.7, 0.9), compact: true, inlineFoot: true, size: 20, blob: false });
        ctx.restore();
      }
      // line 2: the SIC circular, its card and its two obligations
      if (b > 0.08) {
        docSeal(ctx, env, { x: 40, y: 140, w: 270, h: 350 }, tx('t2'), E.segment(b, 0.08, 0.2), 910);
        V.card(ctx, 'sic.002', { x: 340, y: 96, w: 500, h: 430 }, { p: E.segment(b, 0.16, 0.36), scope: true, size: 28 });
        [[tx('t3'), 0.36, 184], [tx('t4'), 0.66, 330]].forEach(function (it, i) {
          var q = E.segment(b, it[1], it[1] + 0.12);
          if (q <= 0) return;
          C.arrow(ctx, [850, it[2] + 38], [886, it[2] + 38], { p: q, weight: 'regular', head: 10, seed: 920 + i });
          C.box(ctx, { x: 894, y: it[2], w: 346, h: 76 }, { label: it[0], size: 22, role: 'accent-2', p: q, seed: 925 + i });
        });
      }
    },

    privacidad: function (ctx, s, env) {
      // Draw: course sign `tabla-privacidad`, a meaning zone; on line 1 the rows «ChatGPT», «Claude» and «Gemini» appear with the question «¿Se usan las conversaciones para entrenar?» and their figure cards from the bank, each with «Revisar antes de clase», and a switch labeled «Configuración de privacidad» appears beside each row; the legend item `etica-datos` at the top left.
      var C = env.course, tx = env.tx;
      C.legendChip(ctx, 'etica-datos', 40, 88, { p: E.out(s.intro), size: 20, r: 22 });
      // the question heads the answer column, on the row of the legend item
      C.sign(ctx, 'tabla-privacidad', {
        x: 40, y: 64, w: 1200, nameW: 220, headH: 44, headX: 420, rowH: 150, gap: 8,
        names: [tx('t1'), tx('t2'), tx('t3')], question: tx('t4'), switchLabel: tx('t6'),
        figs: ['privacidad.chatgpt', 'privacidad.claude', 'privacidad.gemini'], split: 0.6, size: 20,
        headQ: beat(s, 0, 0, 0.12), q: [beat(s, 0, 0.06, 0.3), beat(s, 0, 0.3, 0.54), beat(s, 0, 0.54, 0.78)]
      });
    },

    transferencia: function (ctx, s, env) {
      // Draw: place `comite-etica`: DRA. ROJAS at the committee table with the course sign `formulario-consentimiento`, and MARIANA in a video tile at the side; on line 1 the course sign `viaje-datos` shows an interview card traveling along a cable to a far shelf labeled «servidores en el exterior»; on line 2 the card of `sic.005` appears with «Con matiz» next to the card of `ley1581.art26`; on line 3 the form's boxes «Autorizo» and «No autorizo» are emphasized; on line 4 a manuscript card labeled «manuscrito ajeno» stops before a lamp, next to the card of `nih.2023`, with the legend item `integridad`.
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0), b = s.at(1), c = s.at(2), d = s.at(3);
      var pl = C.place(ctx, 'comite-etica', { p: E.out(s.intro), tableY: 500, seats: [430] });
      var seat = pl.seats[0];
      C.person(ctx, 'rojas', { pose: 'seated-pointing', x: seat.x, y: seat.y, scale: seat.scale, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      // Mariana joins from a video tile at the side
      C.prop(ctx, 'tile', { x: 1010, y: 352, w: 220, h: 140, person: C.castEntry('mariana'), t: s.t, p: E.out(s.intro), seed: 31, active: s.speaker === 'mariana' });
      // the consent form on the table; on line 3 it comes forward and its boxes are emphasized
      var zoom = E.inOut(E.segment(c, 0, 0.18)) * (1 - E.inOut(E.segment(d, 0, 0.12)));
      var fs = E.lerp(0.32, 1, zoom);
      ctx.save();
      ctx.translate(E.lerp(556, 520, zoom), E.lerp(378, 70, zoom)); ctx.scale(fs, fs);
      C.sign(ctx, 'formulario-consentimiento', { x: 0, y: 0, w: 300, h: 380, labels: [tx('t3'), tx('t4')], labelQ: E.segment(zoom, 0.55, 0.9), emph: E.segment(c, 0.24, 0.42) * (1 - E.segment(d, 0, 0.1)), p: E.out(s.intro), seed: 940 });
      ctx.restore();
      // line 1: from a laptop on the committee table, an interview card travels along a cable to a far
      // shelf of servers abroad
      var g1 = 1 - E.segment(b, 0, 0.1);
      if (a > 0 && g1 > 0) {
        ctx.save(); ctx.globalAlpha *= g1;
        C.sign(ctx, 'viaje-datos', { from: [760, 497], to: [890, 196], laptopW: 140, label: tx('t1'), travel: E.segment(a, 0.32, 0.95), p: E.segment(a, 0, 0.3), t: s.t });
        ctx.restore();
      }
      // line 2: the transfer is regulated (Ley 1581) and the adequate level is «Con matiz»
      var g2 = 1 - E.segment(c, 0, 0.1);
      if (b > 0 && g2 > 0) {
        ctx.save(); ctx.globalAlpha *= g2;
        V.card(ctx, 'ley1581.art26', { x: 330, y: 96, w: 440, h: 250 }, { p: E.segment(b, 0.12, 0.32), compact: true, size: 25, blob: false });
        V.card(ctx, 'sic.005', { x: 790, y: 96, w: 440, h: 250 }, { p: E.segment(b, 0.3, 0.45), compact: true, size: 24, blob: false });
        ctx.restore();
      }
      // line 4: a manuscript of someone else stops before the lamp; the NIH rule; integrity
      if (d > 0) {
        var mq = E.segment(d, 0.05, 0.32);
        C.lamp(ctx, 'lampara', { x: 690, y: 206, r: 44, t: s.t, p: E.segment(d, 0, 0.12) });
        C.prop(ctx, 'article-card', { x: E.lerp(340, 470, E.out(mq)), y: 136, w: 100, h: 132, p: E.segment(d, 0, 0.1), seed: 950, label: tx('t5'), barRole: 'accent-1', size: 18 });
        var stopQ = E.segment(d, 0.3, 0.42);
        if (stopQ > 0) {
          S.stroke(ctx, [[600, 150], [602, 262]], { weight: 'heavy', taper: false, p: stopQ, seed: 951 });
          C.cross(ctx, 620, 130, 16, { p: stopQ, weight: 'regular' });
        }
        V.card(ctx, 'nih.2023', { x: 790, y: 96, w: 440, h: 248 }, { p: E.segment(d, 0.3, 0.45), scope: true, compact: true, size: 24, blob: false });
        C.legendChip(ctx, 'integridad', 560, 318, { p: E.segment(d, 0.45, 0.6), size: 20, r: 20 });
      }
    },

    avances: function (ctx, s, env) {
      // Draw: course sign `ficha-avance` twice, side by side, a meaning zone; on line 1 the left card shows «Biología» with the figure card of `avance.alphafold` and its limit «Son predicciones: se validan con experimentos»; on line 2 the right card shows «Clima» with the cards of `avance.graphcast` and `avance.aifs` and the limit «Las condiciones iniciales aún dependen de modelos físicos»; a type badge sits on every figure card.
      var C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // (the cards are inside the index cards: no corner shapes; the field is the index card's title)
      var L1 = C.sign(ctx, 'ficha-avance', { x: 40, y: 84, w: 460, h: 494, split: 'v', ratio: 0.8, title: tx('t1'), limits: [tx('t2')], limitQ: [E.segment(a, 0.78, 0.92)], limitSize: 22, p: E.segment(a, 0, 0.12), seed: 700 });
      V.card(ctx, 'avance.alphafold', L1.cifra, { p: E.segment(a, 0.1, 0.3), compact: true, size: 23, blob: false });
      // line 2: the whole «Clima» card arrives early in the line, so the poster frame shows both cards
      var L2 = C.sign(ctx, 'ficha-avance', { x: 520, y: 84, w: 720, h: 494, split: 'v', ratio: 0.8, title: tx('t3'), limits: [tx('t4')], limitQ: [E.segment(b, 0.08, 0.15)], limitSize: 22, p: E.segment(b, 0, 0.04), seed: 710 });
      var cw = (L2.cifra.w - 16) / 2;
      V.card(ctx, 'avance.graphcast', { x: L2.cifra.x, y: L2.cifra.y, w: cw, h: L2.cifra.h }, { p: E.segment(b, 0.02, 0.07), compact: true, size: 23, blob: false });
      V.card(ctx, 'avance.aifs', { x: L2.cifra.x + cw + 16, y: L2.cifra.y, w: cw, h: L2.cifra.h }, { p: E.segment(b, 0.05, 0.1), scope: true, compact: true, size: 23, blob: false });
    },

    masai: function (ctx, s, env) {
      // Draw: course sign `ficha-avance` titled «Salud», with the figure card of `avance.masai` (badges «Ensayo o experimento» and «Con matiz»), a meaning zone; on line 1 the three values appear on the card; on line 2 the limit half fills with «Un país y un sistema» and «La reducción de cánceres de intervalo no fue significativa».
      var C = env.course, V = C.v3, tx = env.tx;
      var F = C.sign(ctx, 'ficha-avance', { x: 40, y: 70, w: 1200, h: 508, split: 'h', ratio: 0.64, title: tx('t1'), limits: [tx('t4'), tx('t5')], limitQ: [beat(s, 1, 0.08, 0.3), beat(s, 1, 0.4, 0.62)], p: E.out(s.intro), seed: 720 });
      V.card(ctx, 'avance.masai', F.cifra, { p: beat(s, 0, 0, 0.12), values: [0, 1, 2], valueQ: [beat(s, 0, 0.2, 0.3), beat(s, 0, 0.42, 0.52), beat(s, 0, 0.62, 0.72)], size: 26, valueSize: 46, blob: false });
    },

    educacion: function (ctx, s, env) {
      // Draw: course sign `ficha-avance` titled «Educación»; on line 1 the figure card of `avance.nigeria` appears with the badges «Documento de trabajo» and «Con matiz»; on line 2 the figure card of `avance.pnas-retiro` appears beside it with the badge «Ensayo o experimento», the two cards never joined; the legend item `validez` at the top left.
      var C = env.course, V = C.v3, tx = env.tx;
      C.legendChip(ctx, 'validez', 40, 86, { p: E.out(s.intro), size: 20, r: 22 });
      var F = C.sign(ctx, 'ficha-avance', { x: 40, y: 124, w: 1200, h: 454, split: 'h', ratio: 0.5, title: tx('t1'), p: E.out(s.intro), seed: 730 });
      // the PNAS trial sits in the «Límite» half: in the content's table it is part of the limit
      V.card(ctx, 'avance.nigeria', F.cifra, { p: beat(s, 0, 0, 0.3), size: 28, blob: false });
      V.card(ctx, 'avance.pnas-retiro', F.limite, { p: beat(s, 1, 0, 0.3), size: 28, blob: false });
    },

    trabajo: function (ctx, s, env) {
      // Draw: a meaning zone; on line 1 the card of `avance.noy-zhang` appears; on line 2 the card of `avance.brynjolfsson` appears beside it; on line 3 an irregular line labeled «frontera irregular» runs across the frame, with tasks inside it marked as helped and similar tasks just outside it marked as worse, and the card of `avance.frontera` appears on the outside part.
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      var c = s.at(2);
      V.card(ctx, 'avance.noy-zhang', { x: 40, y: 62, w: 570, h: 210 }, { p: beat(s, 0, 0, 0.3), scope: true, size: 26, blob: false });
      V.card(ctx, 'avance.brynjolfsson', { x: 640, y: 62, w: 600, h: 210 }, { p: beat(s, 1, 0, 0.3), scope: true, size: 25, blob: false });
      var fq = E.segment(c, 0, 0.25);
      if (fq > 0) {
        var pts = [[40, 430], [110, 392], [175, 452], [250, 384], [320, 458], [400, 390], [470, 452], [545, 380], [615, 446], [690, 372], [760, 340], [840, 318], [930, 336], [1020, 312], [1110, 330], [1240, 312]];
        var line = S.path.smooth(pts, 5);
        // the inside of the frontier (where the AI helps) is a pale field above the line
        var inside = line.concat([[1240, 292], [40, 292]]);
        inside.closed = true;
        S.fill(ctx, inside, { role: 'accent-5', offset: false, alpha: 0.55, p: fq, seed: 959 });
        S.stroke(ctx, line, { weight: 'bold', p: fq, seed: 960, dot: true });
        S.text(ctx, tx('t1'), 48, 336, { size: 22, weight: 700, p: E.segment(c, 0.15, 0.35) });
        // inside the frontier the AI helps; similar tasks just outside it come out worse
        [[300, 330], [460, 334], [610, 316]].forEach(function (pt, i) { taskCard(ctx, env, pt[0], pt[1], true, E.segment(c, 0.15 + i * 0.06, 0.28 + i * 0.06), 970 + i); });
        [[215, 512], [370, 520], [530, 512], [690, 470]].forEach(function (pt, i) { taskCard(ctx, env, pt[0], pt[1], false, E.segment(c, 0.3 + i * 0.05, 0.43 + i * 0.05), 980 + i); });
        // the frontier and the task cards are a scheme: their positions and counts are not data
        var eq = E.segment(c, 0.5, 0.62);
        if (eq > 0) C.badge(ctx, V.badgeName('three-boxes'), 40, 544, { p: eq });
        V.card(ctx, 'avance.frontera', { x: 800, y: 362, w: 440, h: 216 }, { p: E.segment(c, 0.42, 0.57), compact: true, blob: false });
      }
    },

    ciencia: function (ctx, s, env) {
      // Draw: the card of figure `avance.hao`, a meaning zone; on line 1 its parts «3 veces más» and «4,8 veces más citas» appear as two separate numbers, not as bars; on line 2 a wide field of small topic dots narrows into a few clusters, labeled «menos temas» and «22 % menos interacción», with the legend item `equidad`.
      var S = env.style, C = env.course, V = C.v3, tx = env.tx, P = S.path;
      V.card(ctx, 'avance.hao', { x: 40, y: 62, w: 580, h: 516 }, { p: E.out(s.intro), values: [0, 1], valueCols: 1, valueLabel: 'above', valueQ: [beat(s, 0, 0.6, 0.7), beat(s, 0, 0.8, 0.9)], size: 24, valueSize: 44, blob: false });
      // a wide field of topic dots narrows into a few clusters (a scheme: no values)
      var u = E.inOut(beat(s, 1, 0.05, 0.6)), recolor = E.segment(u, 0.5, 0.95);
      var r = env.rng(4242), centers = [[800, 230], [960, 344], [1120, 214]];
      var roles = ['accent-1', 'accent-2', 'accent-3', 'accent-4', 'accent-6', 'accent-5', 'accent-7'];
      var clusterRoles = ['accent-1', 'accent-3', 'accent-4'];
      var fp = E.out(s.intro);
      for (var i = 0; i < 72; i++) {
        var x0 = 670 + r() * 560, y0 = 96 + r() * 350;
        var k = i % 3, ang = r() * Math.PI * 2, rad = 8 + r() * 36;
        var role0 = roles[Math.floor(r() * roles.length)];
        var x = E.lerp(x0, centers[k][0] + Math.cos(ang) * rad, u), y = E.lerp(y0, centers[k][1] + Math.sin(ang) * rad * 0.8, u);
        S.fill(ctx, P.circle(x, y, 6, 12), { role: role0, offset: false, texture: false, p: fp, alpha: 1 - recolor });
        if (recolor > 0) S.fill(ctx, P.circle(x, y, 6, 12), { role: clusterRoles[k], offset: false, texture: false, alpha: recolor });
        S.stroke(ctx, P.circle(x, y, 6, 12), { weight: 'hair', closed: true, taper: false, p: fp });
      }
      C.badge(ctx, V.badgeName('three-boxes'), 1110, 60, { p: fp });
      S.text(ctx, tx('t3'), 690, 494, { size: 24, weight: 700, p: beat(s, 1, 0.45, 0.6) });
      S.text(ctx, tx('t4'), 690, 530, { size: 24, weight: 700, p: beat(s, 1, 0.6, 0.75) });
      C.legendChip(ctx, 'equidad', 1040, 520, { p: beat(s, 1, 0.7, 0.85), size: 20, r: 22 });
    },

    pobreza: function (ctx, s, env) {
      // Draw: course sign `ficha-avance` titled «Pobreza», a meaning zone; on line 1 the cards of `avance.pobreza-jean` and `avance.pobreza-rwi` appear, each its own card and never joined, with the limit «Son índices relativos»; on line 2 the card of `avance.pobreza-indonesia` appears below them; on line 3 small cards for «Agricultura» (`avance.tumaini`) and «Matemáticas» (`avance.imo`), each with its limit, slide in at the edge of the frame.
      var C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0);
      // the limit «Son índices relativos» sits on the «Límite» row, so the Indonesia card (part of the
      // content's limit) can take the whole lower half
      var F = C.sign(ctx, 'ficha-avance', { x: 40, y: 62, w: 720, h: 516, split: 'v', ratio: 0.57, titleH: 46, labH: 28, pad: 14, title: tx('t1'), limits: [tx('t2')], limitInline: true, limitQ: [E.segment(a, 0.8, 0.92)], p: E.out(s.intro), seed: 740 });
      var cw = (F.cifra.w - 14) / 2;
      V.card(ctx, 'avance.pobreza-jean', { x: F.cifra.x, y: F.cifra.y, w: cw, h: F.cifra.h }, { p: E.segment(a, 0.05, 0.25), compact: true, pad: 18, blob: false });
      V.card(ctx, 'avance.pobreza-rwi', { x: F.cifra.x + cw + 14, y: F.cifra.y, w: cw, h: F.cifra.h }, { p: E.segment(a, 0.3, 0.5), compact: true, pad: 18, blob: false });
      V.card(ctx, 'avance.pobreza-indonesia', F.limite, { p: beat(s, 1, 0, 0.3), compact: true, inlineFoot: true, pad: 18, size: 22, blob: false });
      // line 3: two cards slide in at the edge of the frame, each headed by its field and showing its
      // limit (its scope)
      [['avance.tumaini', tx('t3'), 62, 248], ['avance.imo', tx('t4'), 324, 254]].forEach(function (it, i) {
        var q = beat(s, 2, i * 0.15, 0.35 + i * 0.15);
        if (q <= 0) return;
        ctx.save(); ctx.translate((1 - E.out(q)) * 480, 0);
        V.card(ctx, it[0], { x: 780, y: it[2], w: 460, h: it[3] }, { p: 1, tema: it[1], temaSize: 20, temaRole: 'ink', pad: 20, size: 20, blob: false });
        ctx.restore();
      });
    },

    anotacion: function (ctx, s, env) {
      // Draw: on line 1 a stack of tweet and news cards is sorted by a `lampara` into bins, beside the card of `anotacion.gilardi`; on line 2 a `modelo-pequeno` labeled «entrenado para la tarea» sorts the same cards, and AMPARO checks a sample of them at a `bandera-control` labeled «un codificador más».
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0), b = s.at(1);
      // line 1: the chat lamp sorts tweets and news into three bins
      var q1 = beat(s, 0, 0, 0.15);
      if (q1 > 0) {
        var lx = 320, ly = 200, bins = [[440, 118], [440, 184], [440, 250]];
        for (var j = 0; j < 4; j++) postCard(ctx, env, 120 + j * 5, 214 - j * 9, j, q1);
        bins.forEach(function (bn) { S.machine(ctx, 'frame', { x: bn[0], y: bn[1], w: 110, h: 54 }); });
        for (var k = 0; k < 9; k++) {
          var u = E.segment(a, 0.15 + k * 0.08, 0.3 + k * 0.08);
          var bn2 = bins[k % 3], tx2 = bn2[0] + 20 + Math.floor(k / 3) * 30, ty2 = bn2[1] + 27;
          if (u <= 0) continue;
          var px = u < 0.5 ? E.lerp(130, lx, E.inOut(u * 2)) : E.lerp(lx, tx2, E.inOut(u * 2 - 1));
          var py = u < 0.5 ? E.lerp(206, ly, E.inOut(u * 2)) : E.lerp(ly, ty2, E.inOut(u * 2 - 1));
          if (u >= 1) S.machine(ctx, 'card', { x: tx2 - 11, y: ty2 - 9, w: 22, h: 18, lines: 2 });
          else postCard(ctx, env, px, py, k, 1);
        }
        C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 42, t: s.t, p: q1 });
      }
      V.card(ctx, 'anotacion.gilardi', { x: 640, y: 64, w: 600, h: 250 }, { p: beat(s, 0, 0.05, 0.3), size: 24, blob: false });
      // line 2: a small model trained for the task sorts the same cards; Amparo checks a sample
      var q2 = beat(s, 1, 0, 0.15);
      if (q2 > 0) {
        for (var m = 0; m < 4; m++) postCard(ctx, env, 120 + m * 5, 452 - m * 9, m, q2);
        C.arrow(ctx, [170, 440], [262, 424], { p: q2, weight: 'thin', head: 9, seed: 1120 });
        var mp = C.lamp(ctx, 'modelo-pequeno', { x: 310, y: 418, r: 32, labels: ['', '', ''], binW: 64, p: beat(s, 1, 0.05, 0.6), t: s.t });
        // the sorted cards pile up in the bins
        if (mp && mp.bins) {
          var bx0 = mp.bins[0], by0 = mp.bins[1];
          for (var bi = 0; bi < 3; bi++) {
            var nIn = Math.round(3 * beat(s, 1, 0.3 + bi * 0.2, 0.75 + bi * 0.08));
            for (var j = 0; j < nIn; j++) S.machine(ctx, 'card', { x: bx0 + bi * 88 + 8 + (j % 2) * 24, y: by0 + 8 + Math.floor(j / 2) * 24, w: 22, h: 18, lines: 2 });
          }
        }
        S.text(ctx, tx('t1'), 356, 412, { size: 21, weight: 700, p: q2 });
        // Amparo checks a sample at the human checkpoint: she faces the sorted cards
        var am = C.person(ctx, 'amparo', { pose: 'presenting', x: 1060, y: 578, scale: 0.78, flip: true, t: s.t, p: beat(s, 1, 0.25, 0.45) });
        C.prop(ctx, 'bandera-control', { x: 760, y: 532, s: 0.85, p: beat(s, 1, 0.35, 0.55), label: tx('t2'), size: 18, maxWidth: 230 });
        var sq = beat(s, 1, 0.5, 0.75);
        if (sq > 0 && am.rightHand) {
          var hx = am.rightHand[0], hy = am.rightHand[1];
          var cx = E.lerp(400, hx - 18, E.inOut(sq)), cy = E.lerp(520, hy - 34, E.inOut(sq));
          C.prop(ctx, 'article-card', { x: cx - 24, y: cy - 30, w: 48, h: 60, seed: 1130, barRole: 'accent-3' });
          C.check(ctx, hx - 62, hy - 58, 24, { p: beat(s, 1, 0.75, 0.9), seed: 1131 });
        }
      }
    },

    silicio: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA with a survey sheet; on line 1 rows of simulated respondent cards come out of a lamp, with less spread than a row of real respondent cards beside them (badge «Esquema»); on line 2 the label «no sirven para inferencia estadística» appears across the simulated rows, and two allowed uses appear as cards: «pilotear un cuestionario» and «generar hipótesis».
      var C = env.course, tx = env.tx;
      var pl = C.place(ctx, 'escritorio-casa', { x: 180, y: 470, w: 430, p: E.out(s.intro), secondScreen: false, window: false, plant: false, laptopAt: 320, laptopW: 160 });
      var m = C.person(ctx, 'mariana', { pose: 'reading', x: pl.seat.x, y: pl.seat.y, scale: 0.9, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      if (m.rightHand) surveySheet(ctx, env, m.rightHand[0] - 46, m.rightHand[1] - 92, 92, 112, E.out(s.intro), 1150);
      // line 1: simulated respondents come out of a lamp, with less spread than the real ones (a scheme)
      C.lamp(ctx, 'lampara', { x: 712, y: 205, r: 40, t: s.t, p: beat(s, 0, 0, 0.2) });
      var cw = 76, ch = 50, gx = 14, x0 = 790;
      var sim = [[0.48, 0.52, 0.5, 0.55, 0.47], [0.5, 0.45, 0.53, 0.5, 0.56], [0.52, 0.49, 0.46, 0.51, 0.5]];
      sim.forEach(function (row, r) {
        row.forEach(function (u, k) {
          var q = beat(s, 0, 0.2 + (r * 5 + k) * 0.035, 0.32 + (r * 5 + k) * 0.035);
          if (q <= 0) return;
          var tx0 = x0 + k * (cw + gx), ty0 = 120 + r * (ch + 12);
          // dealt out of the lamp one after another, opaque as they fly
          respondent(ctx, env, E.lerp(712, tx0, E.inOut(q)), E.lerp(180, ty0, E.inOut(q)), cw, ch, u, true, E.segment(q, 0, 0.15), 1160 + r * 5 + k);
        });
      });
      [0.1, 0.85, 0.35, 0.65, 0.95].forEach(function (u, k) {
        respondent(ctx, env, x0 + k * (cw + gx), 340, cw, ch, u, false, beat(s, 0, 0.12 + k * 0.05, 0.28 + k * 0.05), 1180 + k);
      });
      var bq = beat(s, 0, 0.5, 0.7);
      if (bq > 0) C.badge(ctx, tx('t1'), 1100, 66, { p: bq });
      // line 2: not for statistical inference (a band across the simulated rows); two allowed uses
      C.box(ctx, { x: 772, y: 181, w: 452, h: 52 }, { label: tx('t2'), size: 22, role: 'accent-2', p: beat(s, 1, 0.4, 0.55), seed: 1190, weight: 'bold' });
      [[tx('t3'), 700], [tx('t4'), 982]].forEach(function (it, i) {
        var q = beat(s, 1, 0.62 + i * 0.12, 0.76 + i * 0.12);
        C.box(ctx, { x: it[1], y: 438, w: 254, h: 72 }, { label: it[0], size: 21, role: 'ground', p: q, seed: 1192 + i });
        if (q > 0.6) C.check(ctx, it[1] + 236, 440, 20, { p: E.segment(q, 0.6, 1), seed: 1194 + i });
      });
    },

    referencias: function (ctx, s, env) {
      // Draw: the stamp `stamp-fuente` at the top; on line 1 the card of `referencias.walters` appears with two exact bars from zero on one scale (scale: from 0 to 100, step 25, unit «% de citas inventadas»), labeled «GPT-3.5» and «GPT-4»; on line 2 the card of `referencias.pubmed` (badge «Análisis preliminar») shows its two parts as numbers; on line 3 the card of `referencias.sin-correccion` appears next to the legend item `integridad` and the label «el filtro es quien investiga».
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      C.stamp(ctx, 'stamp-fuente', { x: 162, y: 178, r: 114, p: E.out(s.intro) });
      var items = V.items('referencias.walters', 'accent-1');
      var opts = { rowH: 30, gap: 10, labelW: 200 };
      V.card(ctx, 'referencias.walters', { x: 320, y: 62, w: 920, h: 236 }, { p: beat(s, 0, 0, 0.4), compact: true, inlineFoot: true, blob: false, chart: { h: V.barsHeight(2, opts), draw: function (c2, area, q) { V.bars(c2, area, items, env.scale, Object.assign({ p: q }, opts)); } } });
      V.card(ctx, 'referencias.pubmed', { x: 40, y: 314, w: 596, h: 264 }, { p: beat(s, 1, 0, 0.25), compact: true, values: [0, 1], valueQ: [beat(s, 1, 0.35, 0.45), beat(s, 1, 0.55, 0.65)], size: 21, blob: false });
      V.card(ctx, 'referencias.sin-correccion', { x: 660, y: 314, w: 580, h: 204 }, { p: beat(s, 2, 0, 0.3), compact: true, size: 24, blob: false });
      C.legendChip(ctx, 'integridad', 664, 552, { p: beat(s, 2, 0.45, 0.65), size: 20, r: 20 });
      S.text(ctx, tx('t4'), 1236, 559, { size: 22, weight: 700, align: 'right', p: beat(s, 2, 0.55, 0.75) });
    },

    sesgo: function (ctx, s, env) {
      // Draw: course sign `danos-sesgo`; on line 1 a cluster of dots shifted to one side of a center mark appears, labeled «error sistemático»; on line 2 the panel «Daños de representación» appears with stereotype and invisibility cards, and the panel «Daños de asignación» shows a resource card («crédito», «empleo», «subsidios») withheld from one group; on line 3 an answer card leans toward the question card that produced it, labeled «complacencia», with the legend item `integridad`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      // line 1: a systematic error, the dots gather to one side of the center mark
      var tq = beat(s, 0, 0, 0.12);
      if (tq > 0) {
        var cx = 250, cy = 196;
        [86, 56, 26].forEach(function (rr, i) { S.stroke(ctx, P.circle(cx, cy, rr, 44), { weight: i === 0 ? 'regular' : 'thin', closed: true, taper: false, p: tq, seed: 1200 + i }); });
        S.stroke(ctx, [[cx - 12, cy], [cx + 12, cy]], { weight: 'bold', taper: false, p: tq, seed: 1203 });
        S.stroke(ctx, [[cx, cy - 12], [cx, cy + 12]], { weight: 'bold', taper: false, p: tq, seed: 1204 });
        var r = env.rng(1210), dq = beat(s, 0, 0.08, 0.25);
        for (var i = 0; i < 14; i++) {
          var dx = 58 + r.gauss() * 10, dy = -38 + r.gauss() * 10;
          var q = E.stagger(dq, i, 14);
          S.fill(ctx, P.circle(cx + dx, cy + dy, 6, 12), { role: 'accent-1', offset: false, texture: false, p: q });
          S.stroke(ctx, P.circle(cx + dx, cy + dy, 6, 12), { weight: 'hair', closed: true, taper: false, p: q });
        }
        C.arrow(ctx, [cx + 6, cy - 4], [cx + 46, cy - 30], { p: beat(s, 0, 0.2, 0.3), weight: 'thin', head: 9, seed: 1211 });
        S.text(ctx, tx('t1'), cx + 120, cy + 8, { size: 25, weight: 700, p: beat(s, 0, 0.22, 0.35) });
        // the spread of the dots does not come from a figure: «Esquema» (base §5.1)
        var eq = beat(s, 0, 0.3, 0.42);
        if (eq > 0) C.badge(ctx, env.course.v3.badgeName('three-boxes'), cx + 120, cy + 30, { p: eq });
      }
      // line 2: two kinds of harm
      C.sign(ctx, 'danos-sesgo', { x: 40, y: 326, w: 1200, h: 252, labels: [tx('t2'), tx('t3')], resources: [tx('t4'), tx('t5'), tx('t6')], q: [beat(s, 1, 0, 0.5), beat(s, 1, 0.42, 0.95)], t: s.t });
      // line 3: complacency — the answer leans toward the question that produced it
      var cq = beat(s, 2, 0, 0.3);
      if (cq > 0) {
        // the question (a bubble with lines and «?»), and the answer it produced, which bows toward it
        // and agrees (a check)
        C.prop(ctx, 'chat-bubble', { x: 730, y: 92, w: 150, h: 70, tail: 'right', p: cq, seed: 1220 });
        S.text(ctx, '?', 805, 140, { size: 38, weight: 700, align: 'center', p: cq });
        var ap = beat(s, 2, 0.2, 0.45);
        var lean = 0.2 * E.inOut(beat(s, 2, 0.35, 0.6));
        ctx.save(); ctx.translate(1190, 236); ctx.rotate(lean); ctx.translate(-1190, -236);
        C.prop(ctx, 'chat-bubble', { x: 960, y: 150, w: 230, h: 86, lines: 2, tail: 'left', p: ap, seed: 1222, role: 'ground-2' });
        if (ap > 0.5) C.check(ctx, 1150, 190, 30, { p: E.segment(ap, 0.5, 1), seed: 1223 });
        ctx.restore();
        C.arrow(ctx, [900, 128], [948, 150], { p: beat(s, 2, 0.15, 0.35), weight: 'thin', head: 9, curve: -8, seed: 1221 });
        S.text(ctx, tx('t7'), 1060, 292, { size: 26, weight: 700, align: 'center', p: beat(s, 2, 0.45, 0.65) });
        C.legendChip(ctx, 'integridad', 700, 214, { p: beat(s, 2, 0.6, 0.8), size: 20, r: 20 });
      }
    },

    auditoria: function (ctx, s, env) {
      // Draw: course sign `auditoria-correspondencia` with the badge «Esquema», a meaning zone; on line 1 two prompt cards appear, identical except one highlighted attribute: «[Andrés / Andrea]», «[Quibdó / Bogotá]», «[edad]»; on line 2 each card is run three times in two models (two small lamps) and the answers flow as rows into a shared sheet with the columns «pareja», «modelo», «versión», «respuesta» and a row «Promedio por versión» without values; on line 3 a small card «Bertrand y Mullainathan, 2004: hojas de vida idénticas con nombres distintos» appears, with the legend items `validez` and `equidad`.
      var C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0);
      // each pair changes one attribute: gender, region of origin or age (as the voice lists them)
      var hi = a < 0.8 || a >= 1 ? 0 : a < 0.89 ? 1 : 2;
      C.sign(ctx, 'auditoria-correspondencia', {
        x: 40, y: 66, w: 1200, h: 350, attrs: [tx('t2'), tx('t3'), tx('t4')], hi: hi,
        heads: [tx('t5'), tx('t6'), tx('t7'), tx('t8')], avg: tx('t9'), badge: tx('t1'), nRows: 6,
        q: [beat(s, 0, 0, 0.3), beat(s, 1, 0, 0.5), beat(s, 1, 0.3, 1)], t: s.t
      });
      V.card(ctx, 'curso.auditoria', { x: 40, y: 434, w: 600, h: 144 }, { p: beat(s, 1, 0.25, 0.45), compact: true, inlineFoot: true, blob: false });
      C.box(ctx, { x: 668, y: 434, w: 572, h: 84 }, { label: tx('t10'), size: 19, role: 'ground-2', p: beat(s, 2, 0, 0.3), seed: 1240 });
      C.legendRow(ctx, ['validez', 'equidad'], 680, 552, { p: beat(s, 2, 0.3, 0.5), size: 19, r: 20 });
    },

    abliterado: function (ctx, s, env) {
      // Draw: on line 1 a `lampara` shows a refusal card «No puedo ayudar con eso», a second lamp is retrained with a stack of answer cards without refusals, labeled «sin censura: reentrenado», and a third lamp becomes `lampara-abliterada`, labeled «abliterado: editado, sin reentrenar»; on line 2 the card of `abliteracion.arditi` appears below, a meaning zone, with a small card «también en español».
      var S = env.style, C = env.course, V = C.v3, tx = env.tx;
      var a = s.at(0);
      var ly = 222;
      // a lamp that refuses
      C.lamp(ctx, 'lampara', { x: 220, y: ly, r: 50, t: s.t, p: beat(s, 0, 0, 0.1) });
      C.prop(ctx, 'chat-bubble', { x: 110, y: 96, w: 270, h: 58, text: tx('t1'), size: 18, tail: 'left', p: beat(s, 0, 0.05, 0.16), seed: 1250 });
      // a second lamp, retrained with answer cards that have no refusals
      var q2 = beat(s, 0, 0.15, 0.32);
      if (q2 > 0) {
        C.prop(ctx, 'card-stack', { x: 520, y: 268, w: 74, h: 54, n: 5, p: q2 });
        for (var k = 0; k < 4; k++) {
          var u = E.segment(a, 0.25 + k * 0.05, 0.36 + k * 0.05);
          if (u > 0 && u < 1) C.prop(ctx, 'article-card', { x: E.lerp(500, 616, E.inOut(u)), y: E.lerp(214, 200, E.inOut(u)), w: 40, h: 32, seed: 1260 + k, barRole: 'accent-3' });
        }
        C.lamp(ctx, 'lampara', { x: 660, y: ly, r: 50, t: s.t, p: q2 });
        S.text(ctx, tx('t2'), 640, 318, { size: 21, weight: 700, align: 'center', p: beat(s, 0, 0.3, 0.42), maxWidth: 330 });
      }
      // a third lamp becomes the abliterated lamp: one inner line removed, its place marked by a frame
      var q3 = beat(s, 0, 0.5, 0.62), morph = beat(s, 0, 0.66, 0.82);
      if (q3 > 0) {
        ctx.save(); ctx.globalAlpha *= 1 - morph;
        C.lamp(ctx, 'lampara', { x: 1060, y: ly, r: 62, t: s.t, p: q3 });
        ctx.restore();
        if (morph > 0) {
          ctx.save(); ctx.globalAlpha *= morph;
          C.lamp(ctx, 'lampara-abliterada', { x: 1060, y: ly, r: 62, t: s.t, p: 1 });
          ctx.restore();
        }
        S.text(ctx, tx('t3'), 1060, 330, { size: 21, weight: 700, align: 'center', p: beat(s, 0, 0.72, 0.86), maxWidth: 380 });
      }
      // line 2: the study, and the same direction in Spanish
      V.card(ctx, 'abliteracion.arditi', { x: 150, y: 366, w: 660, h: 210 }, { p: beat(s, 1, 0, 0.3), scope: true, compact: true, size: 24, blob: false });
      C.box(ctx, { x: 850, y: 420, w: 300, h: 80 }, { label: tx('t4'), size: 22, role: 'accent-2', p: beat(s, 1, 0.78, 0.92), seed: 1270 });
    },

    censura: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: MARIANA at her laptop; on line 1 the stamp `stamp-censura` appears; on line 2 the card of `censura.nist` appears with «Con matiz», a meaning zone; on line 3 a sheet of interview fragments shows some fragments marked «negativa» falling out of the coded set, labeled «datos faltantes que no son aleatorios», with the legend item `validez`.
      // (The scene has four voice lines: the stamp lands as Mariana's misreading ends; line 2 shows
      // that removing refusals leaves the bias; the NIST card comes with line 3, the fragments with line 4.)
      var S = env.style, C = env.course, V = C.v3, tx = env.tx, P = S.path;
      var b = s.at(1), d = s.at(3);
      var pl = C.place(ctx, 'escritorio-casa', { x: 180, y: 470, w: 420, p: E.out(s.intro), secondScreen: false, window: false, laptopAt: 300, laptopW: 180 });
      C.person(ctx, 'mariana', { pose: 'seated', x: pl.seat.x, y: pl.seat.y, scale: 0.9, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      C.stamp(ctx, 'stamp-censura', { x: 360, y: 196, r: 118, p: beat(s, 0, 0.55, 0.9) });
      // line 2: the refusals are struck out, the tilted bar (the bias) stays tilted
      var g2 = beat(s, 1, 0, 0.25) * (1 - beat(s, 2, 0, 0.12));
      if (g2 > 0) {
        ctx.save(); ctx.globalAlpha *= g2;
        C.lamp(ctx, 'lampara', { x: 740, y: 190, r: 46, t: s.t, p: 1 });
        [[812, 96], [812, 166]].forEach(function (pt, i) {
          C.prop(ctx, 'chat-bubble', { x: pt[0], y: pt[1], w: 150, h: 50, lines: 2, tail: 'left', seed: 1300 + i });
          S.stroke(ctx, [[pt[0] + 8, pt[1] + 48], [pt[0] + 142, pt[1] + 2]], { weight: 'bold', taper: false, p: beat(s, 1, 0.3 + i * 0.1, 0.45 + i * 0.1), seed: 1302 + i });
        });
        var bq = beat(s, 1, 0.5, 0.7), fx = 1110, fy = 250;
        S.shape(ctx, [[fx - 22, fy + 34], [fx, fy], [fx + 22, fy + 34]], { role: 'accent-6', p: bq, seed: 1305, weight: 'regular' });
        S.stroke(ctx, [[fx - 104, fy - 30], [fx + 104, fy + 22]], { weight: 'heavy', taper: false, p: bq, seed: 1306 });
        ctx.restore();
      }
      // line 3: the NIST evaluation
      V.card(ctx, 'censura.nist', { x: 660, y: 66, w: 580, h: 250 }, { p: beat(s, 2, 0.1, 0.35), compact: true, size: 23, blob: false });
      // line 4: interview fragments; those marked «negativa» fall out of the coded set
      if (d > 0) {
        var sh = { x: 660, y: 336, w: 330, h: 240 };
        S.shape(ctx, P.rect(sh.x, sh.y, sh.w, sh.h, 8), { role: 'ground', p: beat(s, 3, 0, 0.15), seed: 1310, weight: 'regular', offset: false, texture: false });
        var codes = ['accent-3', 'accent-2', null, 'accent-4', null, 'accent-1'];
        var landing = { 2: [1026, 440, 0.06], 4: [1034, 488, 0.08] };
        codes.forEach(function (code, i) {
          var fy2 = sh.y + 18 + i * 36, fq = beat(s, 3, 0.05 + i * 0.03, 0.2 + i * 0.03);
          if (fq <= 0) return;
          var fall = code ? 0 : E.inOut(beat(s, 3, 0.35 + i * 0.04, 0.7 + i * 0.04));
          var to = landing[i] || [sh.x + 16, fy2, 0];
          ctx.save();
          ctx.translate(E.lerp(sh.x + 16, to[0], fall), E.lerp(fy2, to[1], fall) + Math.sin(fall * Math.PI) * 26); ctx.rotate(fall * to[2]);
          S.shape(ctx, P.rect(0, 0, 220, 26, 8), { role: code ? 'ground-2' : 'ground', p: fq, seed: 1320 + i, weight: 'thin', offset: false, texture: false });
          S.stroke(ctx, [[10, 13], [code ? 196 : 120, 14]], { weight: 'hair', taper: false, p: fq, seed: 1330 + i });
          if (code) S.fill(ctx, P.circle(256, 13, 9, 16), { role: code, offset: false, p: fq });
          else S.text(ctx, tx('t2'), 130, 19, { size: 15, weight: 700, p: fq });
          ctx.restore();
        });
        S.text(ctx, tx('t3'), 1030, 370, { size: 22, weight: 700, maxWidth: 206, lineHeight: 1.2, p: beat(s, 3, 0.65, 0.8) });
        C.legendChip(ctx, 'validez', 1030, 558, { p: beat(s, 3, 0.75, 0.9), size: 20, r: 20 });
      }
    },

    recursos: function (ctx, s, env) {
      // Draw: course sign `pilas-recursos` as the frame; on line 1 an exact horizontal bar chart of figure `geo.inversion`, a meaning zone: three bars from zero on one scale (scale: from 0 to 300000, step 50000, unit «millones de dólares»), labeled «EE. UU.», «Europa» and «China» with their exact values; on line 2 the cards of `geo.computo`, `geo.chips` and `geo.cobre` appear in the columns «Cómputo», «Chips» and «Minerales», with a small `chip-gpu`, and the column «Energía» shows the card of `geo.energia-2024` and, beside it and visibly distinct, the card of `geo.energia-2030` with the badge «Proyección», with a `centro-datos` behind them.
      var C = env.course, V = C.v3, ch = env.charts;
      var fr = E.out(s.intro);
      // the resource piles as the frame (their labels from §3.5); cards fill them in, never a map
      var piles = C.sign(ctx, 'pilas-recursos', { piles: [
        { k: 0, x: 40, y: 106, w: 500, h: 256, q: fr },
        { k: 4, x: 560, y: 106, w: 680, h: 256, q: fr },
        { k: 1, x: 40, y: 392, w: 400, h: 186, q: fr },
        { k: 2, x: 460, y: 392, w: 450, h: 186, q: fr },
        { k: 3, x: 930, y: 392, w: 310, h: 186, q: fr }
      ] });
      // line 1: private investment in AI in 2025, an exact bar chart from the bank, one scale from zero
      var inv = V.items('geo.inversion', 'accent-3');
      var iopts = { rowH: 24, gap: 6, labelW: 84, valueRoom: 8, unitBelow: true };
      V.card(ctx, 'geo.inversion', piles[0], { p: beat(s, 0, 0, 0.4), compact: true, inlineFoot: true, pad: 18, text: fig(env, 'geo.inversion').cifra.split(':')[0], size: 21, blob: false, chart: { h: V.barsHeight(3, iopts), draw: function (c2, area, q) { V.bars(c2, area, inv, env.scale, Object.assign({ p: q }, iopts)); } } });
      // line 2: computing, chips (with a small GPU beside its label) and minerals
      V.card(ctx, 'geo.computo', piles[2], { p: beat(s, 1, 0, 0.2), compact: true, inlineFoot: true, pad: 18, size: 21, blob: false });
      C.lamp(ctx, 'chip-gpu', { x: (piles[3].labelEnd || 547) + 24, y: 374, s: 26, p: beat(s, 1, 0.08, 0.2) });
      // (the chips figure is dated: its scope, «2022; …», shows)
      V.card(ctx, 'geo.chips', piles[3], { p: beat(s, 1, 0.08, 0.28), compact: true, scope: true, inlineFoot: true, pad: 18, size: 21, blob: false });
      V.card(ctx, 'geo.cobre', piles[4], { p: beat(s, 1, 0.16, 0.36), compact: true, pad: 18, size: 24, blob: false });
      // energy: a data center behind two separate cards. Observed 2024 and projected 2030 are two
      // separate bars on one scale from zero; the projection is visibly distinct (ochre card, dashed
      // outline, striped bar) and carries «Proyección». The two are never joined.
      var en = piles[1];
      var cq = beat(s, 1, 0.3, 0.45);
      if (cq > 0) C.lamp(ctx, 'centro-datos', { x: en.x + en.w / 2, y: en.y + en.h / 2, w: en.w, h: en.h, rows: 3, cols: 7, p: cq, t: s.t });
      var e24 = fig(env, 'geo.energia-2024'), e30 = fig(env, 'geo.energia-2030');
      var v24 = ch.parseValue(e24.partes[0].valor), v30 = ch.parseValue(e30.partes[0].valor);
      var eScale = { from: 0, to: Math.max(v24, v30), step: Math.max(v24, v30) };
      // the gap between the two cards shows a column of the data center's lamps
      var gapE = 44, cardW = (en.w - 12 - gapE) / 2;
      function energy(f, x, p, distinct) {
        var it = [{ label: '', value: ch.parseValue(f.partes[0].valor), valueText: f.partes[0].valor, role: 'accent-1', pattern: distinct ? 'stripes' : null, dashed: distinct }];
        var bo = { rowH: 22, gap: 0, labelW: 6, axis: false, valueAbove: true };
        V.card(ctx, f.id, { x: x, y: en.y + 6, w: cardW, h: en.h - 12 }, { p: p, compact: true, inlineFoot: true, pad: 18, ground: distinct ? 'ground-2' : null, dashed: distinct, size: 20, blob: false, chart: { h: V.barsHeight(1, bo), draw: function (c2, area, q) { V.bars(c2, area, it, eScale, Object.assign({ p: q }, bo)); } } });
      }
      energy(e24, en.x + 6, beat(s, 1, 0.35, 0.6), false);
      energy(e30, en.x + 6 + cardW + gapE, beat(s, 1, 0.68, 0.9), true);
    },

    region: function (ctx, s, env) {
      // Draw: on line 1 the column «Nube con GPU» shows the card of `geo.nube-gpu` and, below it, an exact horizontal bar chart of figure `geo.ilia`, a meaning zone: four bars from zero on one scale (scale: from 0 to 100, step 25, unit «puntos del ILIA»), labeled «Chile», «Brasil», «Uruguay» and «Colombia», with the card of `geo.brasil-gpu` beside it; on line 2 a calendar card «junio de 2026» appears with the card of `geo.exportacion`, a `lampara-nube` disconnects for a moment and reconnects, and the legend item `reproducibilidad` lights up.
      var S = env.style, C = env.course, V = C.v3, tx = env.tx, P = S.path;
      var b = s.at(1);
      var pile = C.sign(ctx, 'pilas-recursos', { piles: [{ k: 5, x: 40, y: 92, w: 780, h: 486, q: beat(s, 0, 0, 0.12) }] })[0];
      V.card(ctx, 'geo.nube-gpu', { x: pile.x, y: pile.y, w: pile.w, h: 150 }, { p: beat(s, 0, 0.04, 0.2), compact: true, scope: true, inlineFoot: true, size: 22, blob: false });
      // the ILIA 2026: an exact bar chart, four bars from zero on the scene's scale
      var il = V.items('geo.ilia', 'accent-3');
      var iopts = { rowH: 23, gap: 5, labelW: 110, unitBelow: true };
      V.card(ctx, 'geo.ilia', { x: pile.x, y: pile.y + 160, w: 500, h: pile.h - 160 }, { p: beat(s, 0, 0.12, 0.45), compact: true, inlineFoot: true, size: 20, blob: false, chart: { h: V.barsHeight(4, iopts), draw: function (c2, area, q) { V.bars(c2, area, il, env.scale, Object.assign({ p: q }, iopts)); } } });
      V.card(ctx, 'geo.brasil-gpu', { x: pile.x + 512, y: pile.y + 160, w: pile.w - 512, h: pile.h - 160 }, { p: beat(s, 0, 0.72, 0.9), compact: true, size: 27, blob: false });
      // line 2: access can change — the calendar, the export controls, and a cloud lamp whose cable is
      // cut for a moment and joined again
      calendarCard(ctx, env, { x: 846, y: 64, w: 200, h: 96 }, tx('t6'), beat(s, 1, 0, 0.12), 1400);
      V.card(ctx, 'geo.exportacion', { x: 840, y: 172, w: 400, h: 262 }, { p: beat(s, 1, 0.08, 0.3), compact: true, scope: true, size: 21, blob: false });
      var nq = beat(s, 1, 0.25, 0.4);
      if (nq > 0) {
        var off = E.segment(b, 0.45, 0.55) * (1 - E.segment(b, 0.72, 0.82));
        var cy = 508, gapX = 1062, gapW = 40 * off;
        C.prop(ctx, 'laptop', { x: 902, y: 528, w: 100, p: nq, seed: 1410 });
        ctx.save();
        ctx.globalAlpha *= 1 - 0.45 * off;
        if (off > 0.02) {
          // everything but the cut piece of the cable
          ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.rect(gapX - gapW, cy - 12, gapW * 2, 24); ctx.clip('evenodd');
        }
        C.lamp(ctx, 'lampara-nube', { x: 1170, y: cy - 42, r: 24, laptop: [954, cy], elbow: 1010, p: nq, t: s.t });
        ctx.restore();
        if (off > 0.05) { S.machine(ctx, 'plug', { x: gapX - gapW - 6, y: cy, s: 12, dir: 1 }); S.machineCircle(ctx, gapX + gapW + 6, cy, 6, 1.6); }
        var lit = beat(s, 1, 0.82, 0.95);
        if (lit > 0) S.fill(ctx, P.blob(944, 558, 128, 24, 1415, 4, 0.12), { role: 'accent-2', p: lit, seed: 1416, alpha: 0.9 });
        C.legendChip(ctx, 'reproducibilidad', 842, 558, { p: beat(s, 1, 0.78, 0.9), size: 19, r: 20 });
      }
    },

    caso: function (ctx, s, env) {
      // Draw: place `comite-etica`: AMPARO and MARIANA in front of DRA. ROJAS at the committee table; on line 1 a document labeled «Protocolo para el comité de ética» shows three lines: «qué herramientas de IA», «dónde se alojan los datos», «cómo se protegen»; on line 2 the `formulario-consentimiento` appears with the clause title «Uso de herramientas de inteligencia artificial»; on line 3 a `lampara-local` inside a laptop is labeled «entrevistas: modelo local», next to an open book with the stamp `stamp-fuente`; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var pl = C.place(ctx, 'comite-etica', { p: E.out(s.intro), tableY: 500, seats: [880] });
      C.person(ctx, 'rojas', { pose: 'seated', x: pl.seats[0].x, y: pl.seats[0].y, scale: pl.seats[0].scale, t: s.t, p: E.out(s.intro) });
      pl.front(ctx);
      // line 3: the interviews go to a local model on a laptop; an open book with the source stamp
      var q3 = beat(s, 2, 0, 0.25);
      if (q3 > 0) {
        C.lamp(ctx, 'lampara-local', { x: 640, y: 446, r: 30, p: q3, t: s.t });
        S.text(ctx, tx('t6'), 640, 380, { size: 21, weight: 700, align: 'center', p: beat(s, 2, 0.15, 0.35) });
        var bk = beat(s, 2, 0.3, 0.5);
        if (bk > 0) {
          var bx = 1110, by = 486;
          S.shape(ctx, [[bx, by - 52], [bx - 96, by - 64], [bx - 104, by + 4], [bx, by + 12]], { role: 'ground', p: bk, seed: 1500, weight: 'regular', offset: false, texture: false });
          S.shape(ctx, [[bx, by - 52], [bx + 96, by - 64], [bx + 104, by + 4], [bx, by + 12]], { role: 'ground', p: bk, seed: 1501, weight: 'regular', offset: false, texture: false });
          for (var i = 0; i < 3; i++) {
            S.stroke(ctx, [[bx - 84, by - 44 + i * 14], [bx - 14, by - 36 + i * 14]], { weight: 'hair', taper: false, p: bk, seed: 1502 + i });
            S.stroke(ctx, [[bx + 14, by - 36 + i * 14], [bx + 84, by - 44 + i * 14]], { weight: 'hair', taper: false, p: bk, seed: 1505 + i });
          }
        }
        C.stamp(ctx, 'stamp-fuente', { x: 1122, y: 232, r: 114, p: beat(s, 2, 0.45, 0.75) });
      }
      // Amparo and Mariana stand in front of the committee table
      C.person(ctx, 'amparo', { pose: 'presenting', x: 300, y: 578, scale: 0.8, t: s.t, p: E.out(s.intro) });
      C.person(ctx, 'mariana', { pose: 'standing', x: 450, y: 578, scale: 0.8, t: s.t, p: E.out(s.intro) });
      // line 1: the protocol for the ethics committee
      var q1 = beat(s, 0, 0, 0.2);
      if (q1 > 0) {
        // the document grows with its title (measured), then its three lines
        var titleL = env.course.v3.wrap(ctx, tx('t1'), 22, 700, 336).length;
        var d = { x: 330, y: 92, w: 380, h: 52 + titleL * 27 + 3 * 42 };
        S.shape(ctx, P.rect(d.x, d.y, d.w, d.h, 8), { role: 'ground', p: q1, seed: 1510, weight: 'bold', offset: false, texture: false });
        S.text(ctx, tx('t1'), d.x + 22, d.y + 40, { size: 22, weight: 700, maxWidth: 336, lineHeight: 1.2, p: q1 });
        ['t2', 't3', 't4'].forEach(function (k, i) {
          var lq = beat(s, 0, 0.25 + i * 0.2, 0.4 + i * 0.2);
          if (lq <= 0) return;
          var yy = d.y + 40 + titleL * 27 + 30 + i * 42;
          S.fill(ctx, P.circle(d.x + 30, yy - 7, 5, 12), { role: 'accent-1', offset: false, texture: false, p: lq });
          S.text(ctx, tx(k), d.x + 46, yy, { size: 20, weight: 700, p: lq });
          S.stroke(ctx, [[d.x + 46, yy + 12], [d.x + d.w - 26, yy + 13]], { weight: 'hair', taper: false, p: lq, seed: 1520 + i });
        });
      }
      // line 2: the consent form with the clause on the use of AI tools
      C.sign(ctx, 'formulario-consentimiento', { x: 726, y: 92, w: 250, h: 248, title: tx('t5'), titleSize: 18, lines: 3, boxSize: 17, p: beat(s, 1, 0, 0.3), seed: 1530 });
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-autora` appears in the center; on line 1 the course signs `ficha-avance`, `danos-sesgo`, `lampara-abliterada` and `pilas-recursos` return as small icons around it, and the `escala-1-5` reappears below with its question.
      var S = env.style, C = env.course;
      var a = s.at(0);
      C.stamp(ctx, 'stamp-autora', { x: 640, y: 248, r: 142, p: E.out(s.intro) });
      var none = ['', '', '', '', '', ''];
      var icons = [
        function () { var F = C.sign(ctx, 'ficha-avance', { x: 0, y: 0, w: 1000, h: 480, split: 'h', ratio: 0.6, labels: none, limits: [' '], seed: 720 }); C.box(ctx, { x: F.cifra.x + 20, y: F.cifra.y + 20, w: F.cifra.w - 40, h: F.cifra.h - 40 }, { role: 'ground', weight: 'bold', seed: 721 }); },
        function () { C.sign(ctx, 'danos-sesgo', { x: 0, y: 0, w: 1000, h: 480, labels: ['', ''], resources: [], t: 0 }); },
        null,
        function () { C.sign(ctx, 'pilas-recursos', { labels: none, piles: [{ k: 0, x: 0, y: 40, w: 300, h: 420 }, { k: 1, x: 350, y: 40, w: 300, h: 420 }, { k: 2, x: 700, y: 40, w: 300, h: 420 }] }); }
      ];
      var pos = [[250, 170], [1030, 170], [250, 372], [1030, 372]];
      icons.forEach(function (fn, i) {
        var q = E.segment(a, 0.1 + i * 0.12, 0.3 + i * 0.12);
        if (q <= 0) return;
        ctx.save();
        ctx.globalAlpha *= E.out(q);
        // the abliterated lamp is drawn at icon size (its ruled lines keep their width); the course
        // signs are drawn at full size and scaled down
        if (fn) { ctx.translate(pos[i][0] - 100, pos[i][1] - 48); ctx.scale(0.2, 0.2); fn(); }
        else C.lamp(ctx, 'lampara-abliterada', { x: pos[i][0], y: pos[i][1], r: 44, t: 0, still: true });
        ctx.restore();
        C.box(ctx, { x: pos[i][0] - 116, y: pos[i][1] - 62, w: 232, h: 124 }, { role: false, p: q, weight: 'thin', seed: 1600 + i });
      });
      var g = sceneTexts(env, 'gancho');
      var eq = E.segment(a, 0.62, 0.85);
      S.title(ctx, g.t3, { x: 640, y: 474, size: 30, align: 'center', p: eq, underline: false });
      C.sign(ctx, 'escala-1-5', { x: 470, y: 534, w: 340, labels: [g.t1, g.t2], labelSide: true, labelSize: 22, r: 13, p: E.segment(a, 0.7, 0.95) });
    }
  };

  NS.videos.v3 = { zones: zones, scenes: scenes };
})(window.IAHI);
