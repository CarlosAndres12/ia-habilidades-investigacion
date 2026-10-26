/* V2 · como-escribe-llm · «Cómo escribe un LLM y cómo pedirle mejor» (spec §11 V2).
   Every on-screen text comes from the scene's `texts`, the figure bank, the sign labels or the data;
   visual beats follow the voice through s.at(i). Course signs of this video: js/course/signs-v2.js. */
(function (NS) {
  'use strict';
  var E = NS.engine.ease;
  var SP = String.fromCharCode(32), NBSP = String.fromCharCode(160);

  function beat(s, i, a, b) { return E.segment(s.at(i), a == null ? 0 : a, b == null ? 0.3 : b); }
  function sceneTexts(env, id) {
    var sc = env.video.scenes.filter(function (x) { return x.id === id; })[0];
    return (sc && sc.texts) || {};
  }
  function fig(env, id) { return env.data.figuresById[id]; }
  // «La | inform | alidad» → the fragments of a token strip
  function splitTokens(str) { return String(str || '').split('|').map(function (t) { return t.trim(); }).filter(Boolean); }
  // the words of a sentence, keeping a phrase of several words together as one chip
  function chipsOf(sentence, keep) {
    var words = String(sentence || '').split(/\s+/).filter(Boolean);
    if (!keep) return words;
    var kw = String(keep).split(/\s+/).filter(Boolean), n = kw.length;
    for (var i = 0; i + n <= words.length; i++) {
      if (words.slice(i, i + n).join('|') === kw.join('|')) return words.slice(0, i).concat([words.slice(i, i + n).join(SP)]).concat(words.slice(i + n));
    }
    return words;
  }
  function indexOf(list, v) { for (var i = 0; i < list.length; i++) if (list[i] === v) return i; return -1; }
  // keeps a multi-word label on one line (the shared text wrap only breaks at plain spaces)
  function keepTogether(str) { return String(str || '').split(SP).join(NBSP); }

  // ------------------------------------------------------------------ small drawings used by the scenes
  // a display title on balanced lines (no orphan word), lettered in reading order
  function balancedTitle(ctx, S, text, o) {
    var words = String(text || '').split(SP), lines = [text];
    if (S.measureTitle(ctx, text, o.size) > o.maxWidth && words.length > 1) {
      var best = null;
      for (var i = 1; i < words.length; i++) {
        var a = words.slice(0, i).join(SP), b = words.slice(i).join(SP);
        var m = Math.max(S.measureTitle(ctx, a, o.size), S.measureTitle(ctx, b, o.size));
        if (!best || m < best.m) best = { m: m, lines: [a, b] };
      }
      lines = best.lines;
    }
    var total = lines.reduce(function (n, l) { return n + l.length; }, 0), done = 0, lh = o.size * 1.14;
    lines.forEach(function (ln, k) {
      var q = E.clamp((o.p * total - done) / ln.length, 0, 1);
      done += ln.length;
      if (q > 0) S.title(ctx, ln, { x: o.x, y: o.y + k * lh, size: o.size, align: 'center', p: q, underline: k === lines.length - 1 ? undefined : false });
    });
  }

  // a stack of documents of one kind: 0 books, 1 article cards, 2 laws (pages with a seal), 3 forum posts
  function docStack(ctx, env, kind, cx, baseY, q) {
    var S = env.style, C = env.course, P = S.path;
    if (kind === 0) {
      var roles = ['accent-3', 'accent-1', 'accent-6', 'accent-2'];
      for (var k = 0; k < 4; k++) {
        var bq = E.stagger(q, k, 4, 0.6);
        if (bq <= 0) continue;
        var w = 156 - k * 12 + (k % 2) * 10, bx = cx - w / 2 + [-6, 8, -3, 5][k], by = baseY - 32 * (k + 1) - k * 3;
        S.shape(ctx, P.rect(bx, by, w, 30, 5), { role: roles[k], weight: 'regular', p: bq, seed: 30 + k });
        S.stroke(ctx, [[bx + 16, by + 4], [bx + 16, by + 26]], { weight: 'thin', taper: false, p: bq, seed: 34 + k });
        S.stroke(ctx, [[bx + w - 16, by + 4], [bx + w - 16, by + 26]], { weight: 'thin', taper: false, p: bq, seed: 38 + k });
      }
    } else if (kind === 1) {
      C.prop(ctx, 'card-stack', { x: cx, y: baseY, w: 124, h: 90, n: 5, p: q });
    } else if (kind === 2) {
      for (var j = 2; j >= 0; j--) {
        var jq = E.stagger(q, 2 - j, 3, 0.5);
        if (jq <= 0) continue;
        var px = cx - 62 + j * 8, py = baseY - 148 - j * 9;
        S.shape(ctx, P.rect(px, py, 124, 148, 5), { role: 'ground', weight: 'thin', offset: false, texture: false, p: jq, seed: 50 + j });
        if (j === 0) {
          for (var l = 0; l < 4; l++) S.stroke(ctx, [[px + 16, py + 28 + l * 20], [px + (l === 3 ? 70 : 106), py + 28 + l * 20]], { weight: 'hair', taper: false, p: jq, seed: 54 + l });
          S.shape(ctx, P.circle(px + 92, py + 118, 15, 24), { role: 'accent-1', weight: 'thin', p: jq, seed: 58 });
          S.stroke(ctx, [[px + 84, py + 130], [px + 78, py + 146]], { weight: 'regular', role: 'accent-1', taper: false, p: jq, seed: 59 });
        }
      }
    } else {
      [[-78, -152, 'left'], [-34, -102, 'right'], [-70, -52, 'left']].forEach(function (b, i) {
        var cq = E.stagger(q, i, 3, 0.5);
        if (cq > 0) C.prop(ctx, 'chat-bubble', { x: cx + b[0], y: baseY + b[1], w: 136, h: 40, tail: b[2], lines: 2, p: cq, seed: 60 + i });
      });
    }
  }

  // a sentence on a paper strip: blank words, the last slot left for the next word
  function sentenceStrip(ctx, env, x, y, w, h, seed) {
    var S = env.style, C = env.course;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { role: 'ground', weight: 'regular', seed: seed });
    var widths = [58, 94, 40, 112, 66], xx = x + 26;
    widths.forEach(function (ww, i) {
      S.stroke(ctx, [[xx, y + h / 2], [xx + ww, y + h / 2 + 0.5]], { weight: 'bold', taper: false, seed: seed + 1 + i });
      xx += ww + 20;
    });
    return { slot: { x: xx - 4, y: y + 10, w: x + w - 18 - (xx - 4), h: h - 20 } };
  }

  // a wall calendar page with two rings and a grid of days
  function calendarCard(ctx, env, x, y, w, h, q) {
    var S = env.style, P = S.path;
    S.shape(ctx, P.rect(x, y, w, h, 10), { role: 'ground', weight: 'bold', offset: false, texture: false, p: q, seed: 70 });
    S.fill(ctx, P.rect(x + 4, y + 4, w - 8, 34, 8), { role: 'accent-1', p: q, seed: 71 });
    [0.3, 0.7].forEach(function (u, i) { S.stroke(ctx, P.circle(x + w * u, y + 4, 7, 16), { weight: 'regular', closed: true, taper: false, p: q, seed: 72 + i }); });
    for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) {
      S.stroke(ctx, P.rect(x + 16 + c * (w - 32) / 5, y + 52 + r * 26, (w - 32) / 5 - 8, 18, 3), { weight: 'hair', closed: true, taper: false, p: q, seed: 74 + r * 5 + c });
    }
  }

  // a quote card: a quotation mark, a few lines and a small location tag
  function quoteCard(ctx, env, x, y, w, h, tag, q, seed) {
    var S = env.style, C = env.course, P = S.path;
    C.box(ctx, { x: x, y: y, w: w, h: h }, { role: 'ground', weight: 'regular', p: q, seed: seed, motion: 'pop' });
    if (q < 0.5) return;
    S.text(ctx, '«', x + 14, y + 40, { size: 38, weight: 700 });
    for (var l = 0; l < 2; l++) S.stroke(ctx, [[x + 48, y + 26 + l * 18], [x + w - (l ? 46 : 16), y + 26 + l * 18]], { weight: 'hair', taper: false, seed: seed + 1 + l });
    var tw = S.measure(ctx, tag, 17, 700) + 42;
    S.shape(ctx, P.rect(x + w - tw - 10, y + h - 34, tw, 26, 13), { role: 'accent-2', weight: 'thin', seed: seed + 4 });
    S.text(ctx, tag, x + w - tw + 2, y + h - 15, { size: 17, weight: 700 });
    S.stroke(ctx, [[x + w - tw + 26, y + h - 17], [x + w - 20, y + h - 17]], { weight: 'thin', taper: false, seed: seed + 5 });
  }

  // a sticky comment note
  function note(ctx, env, x, y, role, q, seed) {
    var S = env.style, P = S.path;
    var a = S.appear('pop', q);
    if (a.alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= a.alpha; ctx.translate(x, y); ctx.scale(a.scale, a.scale); ctx.rotate(seed % 2 ? 0.08 : -0.06);
    S.shape(ctx, P.rect(-30, -24, 60, 48, 4), { role: role, weight: 'thin', seed: seed });
    for (var l = 0; l < 2; l++) S.stroke(ctx, [[-20, -8 + l * 14], [l ? 6 : 18, -8 + l * 14]], { weight: 'hair', taper: false, seed: seed + 1 + l });
    ctx.restore();
  }

  // short calligraphic rays around a box: the label is «lit»
  function rays(ctx, S, b, q, seed) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2 + 16, ry = b.h / 2 + 14, n = 14;
    for (var i = 0; i < n; i++) {
      var a = i * Math.PI * 2 / n + 0.11;
      var x0 = cx + Math.cos(a) * rx, y0 = cy + Math.sin(a) * ry, L = 12 + (i % 3) * 6;
      S.stroke(ctx, [[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], { weight: 'regular', p: E.stagger(q, i, n, 0.5), seed: seed + i });
    }
  }

  // a small flag on a post (a reviewer's mark on a card)
  function smallFlag(ctx, S, x, y, q, seed) {
    var P = S.path;
    S.stroke(ctx, [[x, y], [x + 1, y - 50]], { weight: 'regular', taper: false, p: q, seed: seed });
    var cloth = P.smooth([[x + 2, y - 50], [x + 26, y - 45], [x + 46, y - 40], [x + 26, y - 33], [x + 2, y - 28]], 5);
    cloth.closed = true;
    S.shape(ctx, cloth, { role: 'accent-1', weight: 'thin', p: E.segment(q, 0.3, 1), seed: seed + 1 });
  }

  var zones = {
    gancho: [[260, 90, 760, 140], [200, 230, 900, 250]],
    'por-que-texto': [[60, 90, 1180, 230], [60, 330, 1180, 230]],
    ciclo: [[30, 90, 1220, 486]],
    fases: [[80, 200, 1140, 280]],
    plausible: [[280, 100, 980, 420]],
    deriva: [[40, 120, 580, 450], [620, 120, 630, 450]],
    tokens: [[40, 170, 1210, 300]],
    limites: [[0, 100, 1280, 210], [140, 320, 960, 250]],
    espanol: [[40, 170, 1210, 290]],
    largo: [[40, 120, 1220, 450]],
    mapa: [[70, 110, 1150, 460]],
    municipios: [[90, 90, 1170, 440]],
    'usos-emb': [[40, 90, 1220, 480]],
    similar: [[40, 110, 1200, 460]],
    banco: [[120, 100, 1100, 420]],
    'pesos-espaciales': [[320, 80, 920, 480]],
    familias: [[40, 90, 1200, 490]],
    'mapas-atencion': [[560, 60, 690, 500]],
    'seis-partes': [[100, 90, 1110, 480]],
    bucle: [[20, 100, 1240, 470]],
    metodo: [[40, 80, 1200, 490]],
    caso: [[20, 80, 1240, 330]],
    cierre: [[110, 90, 1060, 480]]
  };

  var scenes = {
    gancho: function (ctx, s, env) {
      // Draw: the title «Cómo escribe un LLM y cómo pedirle mejor» appears at the top; on line 1 a strip of text «The capital of Colombia is» slides in from the left and stops at an empty box with a blinking cursor, the small `lampara` appears beside the box, and three empty candidate cards fan out above it.
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit;
      balancedTitle(ctx, S, tx('t1'), { x: 640, y: 140, size: 46, maxWidth: 760, p: beat(s, 0, 0, 0.22) });
      var size = 30, h = 72, sw = S.measure(ctx, tx('t2'), size, 700) + 60, bw = 150, rowY = 392;
      var total = sw + 18 + bw + 130, x0 = 640 - total / 2, bx = x0 + sw + 18;
      var slide = E.inOut(beat(s, 0, 0.2, 0.42));
      if (slide > 0) C.box(ctx, { x: E.lerp(-sw - 40, x0, slide), y: rowY, w: sw, h: h }, { label: tx('t2'), size: size, role: 'ground', weight: 'bold', seed: 11 });
      var boxP = beat(s, 0, 0.38, 0.48);
      if (boxP > 0) {
        K.withAlpha(ctx, E.out(boxP), function () {
          K.dashed(ctx, S.path.rect(bx, rowY, bw, h, 12), { weight: 'regular', dash: 11, gap: 8, seed: 12 });
          var blink = 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(s.t * Math.PI * 2 / 1.1));
          K.withAlpha(ctx, blink, function () { S.stroke(ctx, [[bx + 26, rowY + 15], [bx + 26, rowY + h - 15]], { weight: 'bold', taper: false, seed: 13 }); });
        });
      }
      var lp = beat(s, 0, 0.48, 0.6);
      if (lp > 0) C.lamp(ctx, 'lampara', { x: bx + bw + 74, y: rowY + h / 2, r: 36, p: lp, t: s.t });
      // three empty candidate cards fan out above the box
      var fan = E.inOut(beat(s, 0, 0.6, 0.86));
      if (fan > 0) {
        [-1, 0, 1].forEach(function (k, i) {
          var cx = bx + bw / 2 + k * 116 * fan, cy = rowY - 92 - (1 - Math.abs(k)) * 22 * fan;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(k * 0.17 * fan);
          C.box(ctx, { x: -50, y: -36, w: 100, h: 72 }, { role: 'ground', p: E.clamp(fan * 1.5 - i * 0.2, 0, 1), seed: 14 + i, lines: 1, linesY: 37 });
          ctx.restore();
        });
      }
    },

    'por-que-texto': function (ctx, s, env) {
      // Draw: on line 1 stacks of documents appear labeled «libros», «artículos», «leyes», «foros»; on line 2 one sentence taken from a stack shows its next word covered by a card «¿?», the lamp's dials turn, the card lifts to reveal the word, and the label «aprendizaje autosupervisado» appears.
      var S = env.style, C = env.course, tx = env.tx;
      var cols = [190, 490, 790, 1090], baseY = 250;
      [tx('t1'), tx('t2'), tx('t3'), tx('t4')].forEach(function (lb, i) {
        var q = beat(s, 0, 0.03 + i * 0.09, 0.17 + i * 0.09);
        if (q <= 0) return;
        docStack(ctx, env, i, cols[i], baseY, q);
        S.text(ctx, lb, cols[i], baseY + 40, { size: 24, weight: 700, align: 'center', p: q });
      });
      // the sentence leaves the stack of articles and settles on its row
      var take = E.inOut(beat(s, 0, 0.55, 0.78));
      var sx = 110, sy = 404, sw = 620, sh = 66;
      var slot = null;
      if (take > 0) {
        ctx.save();
        var sc = E.lerp(0.25, 1, take);
        ctx.translate(E.lerp(cols[1], sx + sw / 2, take), E.lerp(190, sy + sh / 2, take)); ctx.scale(sc, sc); ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
        ctx.globalAlpha *= E.clamp(take * 3, 0, 1);
        slot = sentenceStrip(ctx, env, sx, sy, sw, sh, 80).slot;
        ctx.restore();
      }
      // the lamp guesses; its dials turn on line 2
      var lq = beat(s, 0, 0.7, 0.85);
      var lx = 900, ly = sy + sh / 2;
      if (lq > 0) {
        C.arrow(ctx, [sx + sw + 14, ly], [lx - 64, ly], { p: lq, weight: 'thin', head: 11, seed: 90 });
        S.machineArea(ctx, lx + 60, ly - 32, 236, 64);
        var turn = s.at(1);
        for (var k = 0; k < 4; k++) {
          var settle = E.segment(turn, 0.05 + k * 0.08, 0.55 + k * 0.08);
          var target = -Math.PI / 2 + [-0.8, 0.6, 1.2, -0.4][k];
          var ang = turn > 0 ? target + (1 - settle) * Math.sin(settle * 11 + k) * 1.3 : -Math.PI / 2;
          S.machine(ctx, 'dial', { x: lx + 92 + k * 57, y: ly, r: 17, angle: ang });
        }
        C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 48, p: lq, t: s.t });
      }
      if (take >= 1 && slot) {
        // the revealed word, under the card
        var rv = beat(s, 1, 0.42, 0.6);
        if (rv > 0) {
          C.box(ctx, slot, { role: 'accent-2', p: rv, seed: 91 });
          S.stroke(ctx, [[slot.x + 14, slot.y + slot.h / 2], [slot.x + slot.w - 40, slot.y + slot.h / 2 + 0.5]], { weight: 'bold', taper: false, p: rv, seed: 93 });
          C.check(ctx, slot.x + slot.w - 18, slot.y + slot.h / 2, 18, { p: beat(s, 1, 0.55, 0.7) });
        }
        // the card «¿?» covers the next word, then lifts
        var cq = beat(s, 0, 0.82, 0.92);
        var lift = E.inOut(beat(s, 1, 0.3, 0.55));
        if (cq > 0) {
          ctx.save();
          ctx.translate(slot.x + slot.w / 2 + lift * 30, slot.y + slot.h / 2 - lift * 72);
          ctx.rotate(-0.2 * lift);
          C.box(ctx, { x: -slot.w / 2 - 8, y: -slot.h / 2 - 8, w: slot.w + 16, h: slot.h + 16 }, { label: tx('t5'), size: 26, role: 'ground-2', weight: 'bold', p: cq, seed: 92, motion: 'pop' });
          ctx.restore();
        }
      }
      S.text(ctx, tx('t6'), sx + sw / 2, 540, { size: 28, weight: 700, align: 'center', p: beat(s, 1, 0.6, 0.85) });
    },

    ciclo: function (ctx, s, env) {
      // Draw: course sign `ciclo-token` with the course's example; on line 1 step «1. Texto de entrada» shows «La informalidad laboral en Colombia es» and step «2. Tokens» shows the strip «La | inform | alidad | laboral | en | Colombia | es»; on line 2 steps «3. Embeddings» and «4. Capas de atención» light up, with «laboral» joined by threads to «informalidad» and «Colombia»; on line 3 step «5. Probabilidades» shows the candidates «alta», «persistente», «estructural» and «un» as bars without values (badge «Esquema»), a small dial labeled «temperatura» sits beside it, step «6. Elegir y repetir» adds «alta» to the text, and an arrow returns to step 2.
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit, P = S.path;
      var intro = E.out(s.intro);
      var lit = [
        beat(s, 0, 0, 0.12) * (1 - beat(s, 0, 0.42, 0.55)),
        beat(s, 0, 0.42, 0.55) * (1 - beat(s, 1, 0, 0.12)),
        beat(s, 1, 0, 0.15) * (1 - beat(s, 2, 0, 0.12)),
        beat(s, 1, 0.1, 0.3) * (1 - beat(s, 2, 0, 0.12)),
        beat(s, 2, 0, 0.12) * (1 - beat(s, 2, 0.5, 0.6)),
        beat(s, 2, 0.5, 0.6)
      ];
      var add = E.inOut(beat(s, 2, 0.62, 0.8));
      var chosen = null, inline = null;
      C.sign(ctx, 'ciclo-token', {
        x: 40, y: 100, w: 1200, h: 466, q: [intro, intro, intro, intro, intro, intro], lit: lit, back: beat(s, 2, 0.82, 1),
        labels: [tx('t1'), tx('t3'), tx('t5'), tx('t6'), tx('t10'), tx('t17')],
        content: function (i, b, q, lt) {
          if (i === 0) {
            var tq = beat(s, 0, 0.04, 0.22);
            var t = S.text(ctx, tx('t2'), b.x, b.y + 34, { size: 22, weight: 500, maxWidth: b.w, lineHeight: 1.3, p: tq });
            if (t.lines && t.lines.length) {
              var last = t.lines[t.lines.length - 1], lw = S.measure(ctx, last, 22, 500);
              var aw = S.measure(ctx, tx('t18'), 22, 700) + 22;
              inline = lw + 14 + aw <= b.w ? { x: b.x + lw + 12, y: b.y + 34 + (t.lines.length - 1) * 22 * 1.3 - 24, w: aw, h: 34 } : { x: b.x, y: b.y + 34 + t.lines.length * 22 * 1.3 - 24, w: aw, h: 34 };
            }
          } else if (i === 1) {
            C.sign(ctx, 'tira-tokens', { x: b.x, y: b.y + 8, size: 17, tokens: splitTokens(tx('t4')), maxW: b.w, gap: 9, cut: beat(s, 0, 0.5, 0.92), blade: true, p: beat(s, 0, 0.42, 0.52), rowGap: 12 });
          } else if (i === 2) {
            var eq = beat(s, 1, 0, 0.45);
            if (eq <= 0) return;
            S.machineArea(ctx, b.x, b.y + 4, b.w, b.h - 4);
            var n = 7, colW = b.w / n;
            for (var c = 0; c < n; c++) {
              var cq = E.stagger(eq, c, n, 0.6);
              if (cq <= 0) continue;
              for (var r = 0; r < 5; r++) {
                var cx = b.x + c * colW + colW * 0.2, cy = b.y + 16 + r * ((b.h - 26) / 5), cw = colW * 0.6, ch = (b.h - 26) / 5 - 6;
                var v = 0.25 + 0.65 * Math.abs(Math.sin(c * 1.7 + r * 2.3 + 0.4));
                K.withAlpha(ctx, cq, function () {
                  K.cellBox(ctx, cx, cy, cw, ch, { lw: 1 });
                  S.machine(ctx, 'bar', { x: cx + 2, y: cy + 2, w: (cw - 4) * v, h: ch - 4, role: 'machine-line', alpha: 0.7 });
                });
              }
              if (lt > 0.3) S.glow(ctx, b.x + c * colW + colW / 2, b.y + 12, 9 * lt, 'machine-glow-1');
            }
          } else if (i === 3) {
            var hq = beat(s, 1, 0.12, 0.45);
            if (hq <= 0) return;
            C.sign(ctx, 'hilos-atencion', { x: b.x + b.w / 2, y: b.y + b.h - 22, align: 'center', size: 19, gap: 18,
              words: [tx('t8'), tx('t7'), tx('t9')], focus: 1, weights: [1, 0, 0.6], q: hq, tq: beat(s, 1, 0.35, 0.85), arcH: 30 });
          } else if (i === 4) {
            var pq = beat(s, 2, 0.04, 0.4);
            if (pq <= 0) return;
            var names = [tx('t11'), tx('t12'), tx('t13'), tx('t14')], rel = [1, 0.64, 0.44, 0.2];
            var labW = 0;
            names.forEach(function (nm) { labW = Math.max(labW, S.measure(ctx, nm, 17, 700)); });
            var barX = b.x + labW + 14, barMax = b.w - labW - 14 - 84, rowH = 31;
            var pick = beat(s, 2, 0.5, 0.6);
            names.forEach(function (nm, k) {
              var rq = E.stagger(pq, k, 4, 0.6);
              if (rq <= 0) return;
              var yy = b.y + 6 + k * rowH;
              S.text(ctx, nm, barX - 10, yy + 18, { size: 17, weight: 700, align: 'right', p: rq });
              var shape = P.rect(barX, yy + 3, Math.max(8, barMax * rel[k] * E.out(rq)), 20, 4);
              S.fill(ctx, shape, { role: k === 0 && pick > 0 ? 'accent-1' : 'accent-6', offset: false, seed: 140 + k });
              S.stroke(ctx, shape, { weight: 'thin', closed: true, taper: false, seed: 145 + k });
            });
            var dq = beat(s, 2, 0.3, 0.45);
            if (dq > 0) {
              var dx = b.x + b.w - 34, dy = b.y + 40;
              K.withAlpha(ctx, E.out(dq), function () {
                S.machine(ctx, 'disc', { x: dx, y: dy, r: 26 });
                S.machine(ctx, 'dial', { x: dx, y: dy, r: 18, angle: -Math.PI / 2 + 0.7 + Math.sin(s.t * 0.9) * 0.12 });
              });
              S.text(ctx, tx('t16'), dx, dy + 52, { size: 15, weight: 700, align: 'center', p: dq });
            }
            C.badge(ctx, tx('t15'), b.x + b.w - 98, b.y - 40, { p: pq, size: 15 });
          } else if (i === 5) {
            var cq2 = beat(s, 2, 0.5, 0.62);
            if (cq2 <= 0) return;
            var cw2 = S.measure(ctx, tx('t18'), 26, 700) + 40;
            chosen = { x: b.x + b.w / 2 - cw2 / 2, y: b.y + b.h / 2 - 26, w: cw2, h: 52 };
            C.box(ctx, chosen, { label: tx('t18'), size: 26, role: 'accent-2', weight: 'bold', p: cq2, seed: 150, motion: 'pop' });
          }
        }
      });
      // the chosen fragment is added to the text of step 1
      if (add > 0 && chosen && inline) {
        var fx = E.lerp(chosen.x, inline.x, add), fy = E.lerp(chosen.y, inline.y, add), fw = E.lerp(chosen.w, inline.w, add), fh = E.lerp(chosen.h, inline.h, add);
        C.box(ctx, { x: fx, y: fy, w: fw, h: fh }, { label: tx('t18'), size: E.lerp(26, 22, add), role: 'accent-2', weight: 'regular', seed: 151, r: 10 });
      }
    },

    fases: function (ctx, s, env) {
      // Draw: three lamps in a row, one per beat: on line 1 `lampara-base` with a continuous strip of text coming out, labeled «modelo base»; on line 2 `lampara-asistente` with an instruction card clipped to it, labeled «asistente», and then `lampara-razonamiento` with a short chain of step dots before its output, labeled «modelo de razonamiento».
      var S = env.style, C = env.course, tx = env.tx;
      var y = 316, R = 58;
      var p1 = beat(s, 0, 0.04, 0.5), p2 = beat(s, 1, 0.02, 0.4), p3 = beat(s, 1, 0.48, 0.88);
      if (p1 > 0) {
        C.lamp(ctx, 'lampara-base', { x: 170, y: y, r: R, len: 176, p: p1, t: s.t });
        S.text(ctx, tx('t1'), 262, y + 124, { size: 27, weight: 700, align: 'center', p: E.segment(p1, 0.3, 1) });
      }
      if (p2 > 0) {
        C.arrow(ctx, [430, y], [520, y], { p: E.segment(p2, 0, 0.4), weight: 'regular', head: 13, seed: 160 });
        C.lamp(ctx, 'lampara-asistente', { x: 650, y: y, r: R, p: p2, t: s.t });
        S.text(ctx, tx('t2'), 626, y + 124, { size: 27, weight: 700, align: 'center', p: E.segment(p2, 0.3, 1) });
      }
      if (p3 > 0) {
        C.arrow(ctx, [746, y], [836, y], { p: E.segment(p3, 0, 0.4), weight: 'regular', head: 13, seed: 161 });
        var out = C.lamp(ctx, 'lampara-razonamiento', { x: 942, y: y, r: R, p: p3, t: s.t });
        var oq = E.segment(p3, 0.85, 1);
        if (oq > 0) C.v2kit.withAlpha(ctx, oq, function () {
          S.machineLine(ctx, out.out[0], y, out.out[0] + 26, y, 1.3);
          S.machine(ctx, 'card', { x: out.out[0] + 28, y: y - 18, w: 46, h: 36, lines: 3 });
        });
        S.text(ctx, tx('t3'), 1042, y + 124, { size: 27, weight: 700, align: 'center', p: E.segment(p3, 0.3, 1), maxWidth: 300 });
      }
    },

    plausible: function (ctx, s, env) {
      // Draw: place `escritorio-casa`: on line 1 MARIANA reads an answer card that comes out of the lamp in large, confident lettering; on line 2 the lamp is shown with no database drawer attached, the answer card splits into two labels, «probable» and «verificado», with only «probable» lit, and the stamp `stamp-plausible` appears with the legend item `integridad`.
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit, P = S.path;
      var pl = C.place(ctx, 'escritorio-casa', { x: 200, y: 470, w: 560, p: E.out(s.intro), secondScreen: false, window: false, laptopAt: 250, laptopW: 190, plant: false, headset: false });
      C.person(ctx, 'mariana', { pose: 'reading', x: pl.seat.x, y: pl.seat.y, scale: 0.95, t: s.t });
      pl.front(ctx);
      var lx = 620, ly = 438;
      C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 30, t: s.t, p: E.out(s.intro) });
      var cardP = beat(s, 0, 0.05, 0.5);
      var split = E.inOut(beat(s, 1, 0.22, 0.48));
      var card = { x: 320, y: 112, w: 420, h: 190 };
      if (cardP > 0 && split < 1) {
        K.withAlpha(ctx, 1 - split, function () {
          C.arrow(ctx, [lx - 14, ly - 38], [lx - 50, card.y + card.h + 16], { p: E.segment(cardP, 0, 0.35), weight: 'thin', head: 10, seed: 170 });
          C.box(ctx, card, { role: 'ground', weight: 'bold', p: E.segment(cardP, 0.2, 0.6), seed: 171 });
          [320, 262, 180].forEach(function (lw, k) {
            S.stroke(ctx, [[card.x + 36, card.y + 52 + k * 44], [card.x + 36 + lw, card.y + 53 + k * 44]], { weight: 'heavy', taper: false, swell: 0.15, p: E.segment(cardP, 0.45 + k * 0.17, 0.62 + k * 0.17), seed: 172 + k });
          });
        });
      }
      // no database drawer behind the lamp: an unplugged lead and the dashed outline of an absent drawer
      var dbP = beat(s, 1, 0, 0.22);
      if (dbP > 0) {
        K.withAlpha(ctx, E.out(dbP), function () {
          var dx = lx + 66, dy = ly - 62;
          K.dashed(ctx, [[lx + 32, ly], [dx - 8, ly]], { weight: 'thin', dash: 6, gap: 5, seed: 175 });
          K.dashed(ctx, P.rect(dx, dy, 92, 104, 6), { weight: 'regular', dash: 9, gap: 7, seed: 176, role: 'ink-soft' });
          for (var d = 0; d < 3; d++) K.dashed(ctx, P.rect(dx + 12, dy + 12 + d * 30, 68, 22, 4), { weight: 'hair', dash: 6, gap: 5, seed: 177 + d, role: 'ink-soft' });
          C.cross(ctx, dx + 46, dy + 52, 56, { p: E.segment(dbP, 0.3, 1), weight: 'bold' });
        });
      }
      // the answer splits into two labels: only «probable» is lit
      if (split > 0) {
        var c0 = card.x + card.w / 2, cyy = card.y + 60;
        var pb = { x: E.lerp(c0 - 100, 300, split), y: cyy, w: 210, h: 76 }, vb = { x: E.lerp(c0 - 100, 548, split), y: cyy, w: 230, h: 76 };
        C.box(ctx, pb, { label: tx('t1'), size: 28, role: 'accent-2', weight: 'bold', p: split, seed: 178 });
        rays(ctx, S, pb, beat(s, 1, 0.42, 0.62), 180);
        K.withAlpha(ctx, split, function () {
          K.dashed(ctx, P.rect(vb.x, vb.y, vb.w, vb.h, 12), { weight: 'regular', dash: 10, gap: 8, seed: 179, role: 'ink-soft' });
          S.text(ctx, tx('t2'), vb.x + vb.w / 2, vb.y + vb.h / 2 + 10, { size: 28, weight: 700, align: 'center', role: 'ink-soft' });
        });
      }
      var stP = beat(s, 1, 0.55, 0.8);
      if (stP > 0) C.stamp(ctx, 'stamp-plausible', { x: 1040, y: 300, r: 122, p: stP });
      C.legendChip(ctx, 'integridad', 950, 478, { p: beat(s, 1, 0.7, 0.92), size: 21, r: 22 });
    },

    deriva: function (ctx, s, env) {
      // Draw: the legend item `reproducibilidad` at the top left; on line 1 an exact bar chart of figure `deriva.gpt4-primos`, a meaning zone: two vertical bars from zero on one scale (scale: from 0 to 100, step 25, unit «% de aciertos»), labeled «marzo» and «junio» with their exact values; on line 2 a calendar card «fecha y versión» is pinned beside the chart and three answer cards to the same instruction come out of a lamp, each slightly different.
      var S = env.style, C = env.course, tx = env.tx, ch = env.charts;
      var f = fig(env, 'deriva.gpt4-primos');
      C.legendChip(ctx, 'reproducibilidad', 60, 96, { p: E.out(s.intro), size: 20, r: 21 });
      var a = beat(s, 0, 0, 0.55);
      S.text(ctx, f.cifra, 60, 158, { size: 20, weight: 700, maxWidth: 540, lineHeight: 1.25, p: beat(s, 0, 0, 0.25) });
      var items = f.partes.map(function (pt, i) { return { label: pt.etiqueta, value: ch.parseValue(pt.valor), valueText: pt.valor, role: i ? 'accent-6' : 'accent-3' }; });
      if (a > 0) ch.barsV(ctx, { x: 150, y: 248, w: 400, h: 190, scale: env.scale, items: items, p: a, barW: 112 });
      var meta = beat(s, 0, 0.45, 0.75);
      if (meta > 0) {
        var bb = C.badge(ctx, f.tipo, 60, 488, { p: meta, size: 15 });
        C.badge(ctx, f.estado, 60 + (bb ? bb.w : 180) + 10, 488, { p: meta, size: 15 });
        S.text(ctx, f.alcance, 60, 542, { size: 15, role: 'ink-soft', p: meta, maxWidth: 560, maxLines: 1 });
        S.text(ctx, env.cards.sourceLine(f), 60, 564, { size: 15, role: 'ink-soft', p: meta, maxWidth: 560, maxLines: 1 });
      }
      // line 2: a calendar card «fecha y versión» pinned beside the chart
      var cq = beat(s, 1, 0, 0.25);
      if (cq > 0) {
        ctx.save(); ctx.translate(780, 210); ctx.rotate(-0.04); ctx.translate(-780, -210);
        calendarCard(ctx, env, 680, 140, 200, 136, cq);
        ctx.restore();
        S.fill(ctx, S.path.circle(780, 138, 8, 16), { role: 'accent-1', offset: false, texture: false, p: cq });
        S.text(ctx, tx('t3'), 780, 314, { size: 23, weight: 700, align: 'center', p: cq });
      }
      // three answer cards to the same instruction, each slightly different
      var lq = beat(s, 1, 0.42, 0.6);
      if (lq > 0) {
        var lx = 790, ly = 456;
        var inU = E.inOut(beat(s, 1, 0.48, 0.62));
        if (inU < 1) S.machine(ctx, 'card', { x: E.lerp(640, lx - 70, inU), y: ly - 14, w: 40, h: 28, lines: 3 });
        C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 40, p: lq, t: s.t });
        var pats = [[0.9, 0.7, 0.5], [0.8, 0.85, 0.35], [0.95, 0.55, 0.65]];
        [[1000, 372], [1080, 456], [1000, 540]].forEach(function (pos, i) {
          var u = E.inOut(beat(s, 1, 0.62 + i * 0.1, 0.78 + i * 0.1));
          if (u <= 0) return;
          var x = E.lerp(lx, pos[0], u), y = E.lerp(ly, pos[1], u);
          C.box(ctx, { x: x - 75, y: y - 32, w: 150, h: 64 }, { role: 'ground', p: E.clamp(u * 2, 0, 1), seed: 180 + i, r: 8 });
          pats[i].forEach(function (lw, k) { S.stroke(ctx, [[x - 60, y - 16 + k * 16], [x - 60 + 120 * lw, y - 15 + k * 16]], { weight: 'hair', taper: false, p: E.clamp(u * 2 - 1, 0, 1), seed: 184 + i * 3 + k }); });
        });
      }
    },

    tokens: function (ctx, s, env) {
      // Draw: course sign `tira-tokens`; on line 1 the `tokenizador` cuts a strip of text into fragments and three labels point at them: «palabras frecuentes», «partes de palabras», «signos»; on line 2 the card of `tokens.ingles` appears beside the strip.
      var S = env.style, C = env.course, tx = env.tx;
      var ex = sceneTexts(env, 'ciclo');
      var toks = splitTokens(ex.t4).concat([ex.t18, '.']);
      var y = 296;
      var res = C.sign(ctx, 'tira-tokens', { x: 60, y: y, size: 23, tokens: toks, gap: 15, cut: beat(s, 0, 0.1, 0.6), blade: true, p: beat(s, 0, 0, 0.1) });
      var cells = res.cells, h = cells.length ? cells[0].h : 40;
      var lq1 = beat(s, 0, 0.6, 0.74), lq2 = beat(s, 0, 0.7, 0.84), lq3 = beat(s, 0, 0.8, 0.94);
      var i3 = indexOf(toks, ex.t7), i5 = indexOf(toks, ex.t9);
      if (lq1 > 0 && cells[i3] && cells[i5]) {
        var lx = (cells[i3].x + cells[i5].x + cells[i5].w) / 2;
        S.text(ctx, tx('t1'), lx, y - 92, { size: 24, weight: 700, align: 'center', p: lq1 });
        [cells[i3], cells[i5]].forEach(function (c, k) { C.arrow(ctx, [lx + (k ? 40 : -40), y - 80], [c.x + c.w / 2, y - 10], { p: lq1, weight: 'thin', head: 10, curve: k ? -12 : 12, seed: 190 + k }); });
      }
      if (lq2 > 0 && cells[1] && cells[2]) {
        var bx0 = cells[1].x, bx1 = cells[2].x + cells[2].w;
        S.stroke(ctx, [[bx0, y + h + 12], [bx0, y + h + 24], [bx1, y + h + 24], [bx1, y + h + 12]], { weight: 'thin', taper: false, p: lq2, seed: 192 });
        S.text(ctx, tx('t2'), (bx0 + bx1) / 2, y + h + 62, { size: 24, weight: 700, align: 'center', p: lq2 });
      }
      var last = cells[cells.length - 1];
      if (lq3 > 0 && last) {
        S.text(ctx, tx('t3'), last.x + last.w / 2, y + h + 104, { size: 24, weight: 700, align: 'center', p: lq3 });
        C.arrow(ctx, [last.x + last.w / 2, y + h + 76], [last.x + last.w / 2, y + h + 12], { p: lq3, weight: 'thin', head: 10, seed: 193 });
      }
      var cq = beat(s, 1, 0, 0.35);
      if (cq > 0) env.cards.figure(ctx, 'tokens.ingles', { x: 880, y: 210, w: 360, h: 222 }, { p: cq, size: 22 });
    },

    limites: function (ctx, s, env) {
      // Draw: course sign `ventana-contexto`; on line 1 a frame holds a stretch of a long strip of text, with the labels «límites de uso», «precios» and «ventana de contexto» around it and the word «tokens» under each; on line 2 course sign `parches`: an image is cut into square patches and an audio wave into short segments, each becoming a small token card, with the label «multimodalidad».
      var S = env.style, C = env.course, tx = env.tx;
      C.sign(ctx, 'ventana-contexto', { x: 450, y: 112, w: 380, h: 100, stripY: 162, stripH: 30, from: 0, to: 1280, sp: beat(s, 0, 0, 0.3), p: beat(s, 0, 0.12, 0.35), offset: s.t * 12, dim: 0.32 });
      [[tx('t1'), 220], [tx('t3'), 640], [tx('t2'), 1060]].forEach(function (lb, i) {
        var q = beat(s, 0, 0.35 + i * 0.13, 0.5 + i * 0.13);
        if (q <= 0) return;
        S.text(ctx, lb[0], lb[1], 256, { size: 23, weight: 700, align: 'center', p: q });
        S.text(ctx, tx('t4'), lb[1], 284, { size: 19, weight: 500, align: 'center', role: 'ink-soft', p: q });
        if (i !== 1) C.arrow(ctx, [lb[1], 232], [lb[1] + (i ? -40 : 40), 186], { p: q, weight: 'thin', head: 9, seed: 200 + i });
      });
      var b = s.at(1);
      if (b > 0) {
        var r = C.sign(ctx, 'parches', { x: 180, y: 334, img: 104, n: 3, laneGap: 34, q: [beat(s, 1, 0, 0.3), beat(s, 1, 0.22, 0.48), beat(s, 1, 0.3, 0.58), beat(s, 1, 0.5, 0.72)] });
        var lq = beat(s, 1, 0.6, 0.78);
        var lx = 770, ly = 452;
        if (lq > 0) {
          var ir = r.imageRow, ar = r.audioRow;
          C.arrow(ctx, [ir[0] + ir[2] + 12, ir[1]], [lx - 52, ly - 18], { p: lq, weight: 'thin', head: 10, curve: -10, seed: 205 });
          C.arrow(ctx, [ar[0] + ar[2] + 12, ar[1]], [lx - 52, ly + 18], { p: lq, weight: 'thin', head: 10, curve: 10, seed: 206 });
          C.lamp(ctx, 'lampara', { x: lx, y: ly, r: 44, p: lq, t: s.t });
        }
        S.text(ctx, tx('t5'), lx + 70, ly + 10, { size: 30, weight: 700, p: beat(s, 1, 0.72, 0.92) });
      }
    },

    espanol: function (ctx, s, env) {
      // Draw: the legend item `equidad` at the top left; on line 1 two strips of the same paragraph appear, labeled «inglés» and «español», each cut into tokens, the Spanish strip exactly 1,55 times as long as the English one (figure `tokens.espanol`, a meaning zone), with the figure's card and the badge «Con matiz» showing «Con el tokenizador de GPT-4»; on line 2 three small labels appear under the Spanish strip: «cuesta más», «agota antes los límites», «menos contexto útil».
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit, ch = env.charts;
      var f = fig(env, 'tokens.espanol');
      var ratio = ch.parseValue(f.partes[0].valor);
      C.legendChip(ctx, 'equidad', 60, 96, { p: E.out(s.intro), size: 20, r: 21 });
      // exact lengths: the Spanish strip is `ratio` times the English one; both are cut into cells of equal width
      var nEn = 20, cell = 16, Len = nEn * cell, Les = Len * ratio, nEs = Math.round(nEn * ratio);
      var x0 = 196, h = 34, yEn = 220, yEs = 314;
      function strip(y, L, n, q, cutQ) {
        if (q <= 0) return;
        var w = L / n, g = 4 * E.inOut(cutQ);
        K.withAlpha(ctx, E.out(q), function () {
          for (var i = 0; i < n; i++) {
            var a = x0 + i * w + (i > 0 ? g / 2 : 0), b2 = x0 + (i + 1) * w - (i < n - 1 ? g / 2 : 0);
            if ((a - x0) / L > q * 1.05) continue;
            K.cellBox(ctx, a, y, b2 - a, h, { lw: 1 });
            S.machine(ctx, 'bar', { x: (a + b2) / 2 - 2, y: y + h / 2 - 2, w: 4, h: 4, role: 'machine-line', alpha: 0.85 });
          }
        });
      }
      var q1 = beat(s, 0, 0.02, 0.3), q2 = beat(s, 0, 0.18, 0.5);
      S.text(ctx, tx('t1'), x0 - 18, yEn + h / 2 + 8, { size: 23, weight: 700, align: 'right', p: q1 });
      S.text(ctx, tx('t2'), x0 - 18, yEs + h / 2 + 8, { size: 23, weight: 700, align: 'right', p: q2 });
      strip(yEn, Len, nEn, q1, beat(s, 0, 0.25, 0.45));
      strip(yEs, Les, nEs, q2, beat(s, 0, 0.4, 0.6));
      var g2 = beat(s, 0, 0.55, 0.75);
      if (g2 > 0) {
        K.withAlpha(ctx, g2, function () { K.dashed(ctx, [[x0 + Len, yEn + h + 6], [x0 + Len, yEs - 6]], { weight: 'thin', dash: 6, gap: 5, seed: 210 }); });
        S.text(ctx, f.partes[0].valor, x0 + Les + 18, yEs + h / 2 + 8, { size: 24, weight: 700, p: g2 });
      }
      var cq = beat(s, 0, 0.55, 0.85);
      if (cq > 0) env.cards.figure(ctx, 'tokens.espanol', { x: 880, y: 180, w: 360, h: 252 }, { p: cq, size: 22 });
      // line 2: three labels under the Spanish strip
      var xx = x0;
      [tx('t5'), tx('t6'), tx('t7')].forEach(function (lb, i) {
        var w = S.measure(ctx, lb, 19, 700) + 34;
        var q = beat(s, 1, 0.05 + i * 0.22, 0.25 + i * 0.22);
        if (q > 0) {
          C.box(ctx, { x: xx, y: 406, w: w, h: 50 }, { label: lb, size: 19, role: 'ground', p: q, seed: 212 + i });
          C.arrow(ctx, [xx + w / 2, 402], [xx + w / 2 + (i - 1) * 10, yEs + h + 8], { p: q, weight: 'thin', head: 8, seed: 216 + i });
        }
        xx += w + 16;
      });
    },

    largo: function (ctx, s, env) {
      // Draw: the legend item `validez` at the top left; on line 1 a very long strip of text runs through the `ventana-contexto` frame and its middle fades, then the strip is cut into chunks and each chunk returns a quote card with a small location tag «p.»; on line 2 a card «¿cuántas letras?» is crossed out and replaced by a script card labeled «código» and a spreadsheet card labeled «programa estadístico».
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit;
      C.legendChip(ctx, 'validez', 60, 96, { p: E.out(s.intro), size: 20, r: 21 });
      var chunk = E.inOut(beat(s, 0, 0.5, 0.7));
      var frameX = 110, frameW = 1060, sy = 196, sh = 30, cw = 22, gap = 5, pitch = cw + gap;
      var nCells = Math.floor((frameW - 40) / pitch), stripX = frameX + (frameW - nCells * pitch + gap) / 2;
      if (chunk < 1) {
        K.withAlpha(ctx, 1 - chunk, function () {
          C.sign(ctx, 'ventana-contexto', { x: frameX, y: 140, w: frameW, h: 112, stripY: sy, stripH: sh, cell: cw, gap: gap, from: stripX, to: stripX + nCells * pitch - 1, sp: beat(s, 0, 0, 0.14), p: beat(s, 0, 0.04, 0.16), fade: beat(s, 0, 0.16, 0.42), dim: 1 });
        });
      }
      // the material is divided into chunks; each chunk returns a quote with its location
      if (chunk > 0) {
        var per = Math.ceil(nCells / 4), spread = 34 * chunk;
        for (var k = 0; k < 4; k++) {
          var n = Math.min(per, nCells - k * per), cx = stripX + k * per * pitch + (k - 1.5) * spread;
          var yy = sy - sh / 2 + 18 * chunk;
          for (var i = 0; i < n; i++) { K.cellBox(ctx, cx + i * pitch, yy, cw, sh); K.glyphs(ctx, cx + i * pitch, yy, cw, sh); }
          var w = n * pitch - gap, qq = beat(s, 0, 0.7 + k * 0.06, 0.82 + k * 0.06);
          if (qq > 0) {
            C.arrow(ctx, [cx + w / 2, yy + sh + 8], [cx + w / 2, yy + sh + 46], { p: qq, weight: 'thin', head: 9, seed: 220 + k });
            quoteCard(ctx, env, cx + w / 2 - 92, yy + sh + 54, 184, 100, tx('t1'), qq, 224 + k * 7);
          }
        }
      }
      // line 2: counting letters goes to code or a statistics program
      var b1 = beat(s, 1, 0, 0.18), b2 = beat(s, 1, 0.2, 0.36), b3 = beat(s, 1, 0.38, 0.6), b4 = beat(s, 1, 0.55, 0.78);
      if (b1 > 0) {
        C.box(ctx, { x: 110, y: 466, w: 290, h: 74 }, { label: tx('t2'), size: 25, role: 'ground', weight: 'bold', p: b1, seed: 260 });
        if (b2 > 0) S.stroke(ctx, [[130, 507], [382, 499]], { weight: 'heavy', p: b2, taper: false, swell: 0.2, seed: 259 });
      }
      if (b3 > 0) {
        C.arrow(ctx, [416, 503], [500, 503], { p: E.segment(b3, 0, 0.4), weight: 'regular', head: 12, seed: 261 });
        C.box(ctx, { x: 516, y: 466, w: 250, h: 74 }, { p: b3, role: 'ground', seed: 262 });
        [[0, 46], [16, 60], [16, 40], [0, 30]].forEach(function (ln, k) { S.stroke(ctx, [[536 + ln[0], 480 + k * 14], [536 + ln[0] + ln[1], 480 + k * 14]], { weight: 'thin', taper: false, p: b3, seed: 263 + k }); });
        S.text(ctx, tx('t3'), 626, 512, { size: 24, weight: 700, p: b3 });
      }
      if (b4 > 0) {
        C.box(ctx, { x: 796, y: 466, w: 384, h: 74 }, { p: b4, role: 'ground', seed: 268 });
        C.prop(ctx, 'csv-sheet', { x: 812, y: 476, w: 82, cols: 3, rows: 3, rh: 13, p: b4, seed: 269 });
        S.text(ctx, tx('t4'), 910, 512, { size: 22, weight: 700, p: b4, maxWidth: 262 });
      }
    },

    mapa: function (ctx, s, env) {
      // Draw: course sign `mapa-significados`; on line 1 labeled dots appear on a plane, with similar words close together: «pobreza», «desigualdad» and «ingreso» in one cluster and «parque», «árbol» and «río» in another, and each dot gets a short tail of small cells labeled «cientos o miles de números»; on line 2 the dots «rey», «hombre», «mujer» and «reina» appear, an arrow goes from «hombre» to «mujer», and a parallel arrow from «rey» lands near «reina», with the label «word2vec, 2013» in a corner.
      var S = env.style, C = env.course, tx = env.tx;
      var b = s.at(1);
      var rey = { text: tx('t8'), x: 852, y: 248, side: 'left' }, hom = { text: tx('t9'), x: 832, y: 462, side: 'left' };
      var muj = { text: tx('t10'), x: 1052, y: 418, side: 'right' };
      var rei = { text: tx('t11'), x: rey.x + (muj.x - hom.x) + 14, y: rey.y + (muj.y - hom.y) + 12, side: 'right' };
      C.sign(ctx, 'mapa-significados', {
        x: 80, y: 110, w: 1130, h: 448, axesQ: E.out(s.intro), size: 22, tailQ: beat(s, 0, 0.55, 0.85),
        clusters: [
          { role: 'accent-2', q: beat(s, 0, 0.05, 0.3), words: [{ text: tx('t1'), x: 250, y: 214 }, { text: tx('t2'), x: 322, y: 282 }, { text: tx('t3'), x: 236, y: 338 }] },
          { role: 'accent-5', q: beat(s, 0, 0.25, 0.5), words: [{ text: tx('t4'), x: 560, y: 410 }, { text: tx('t5'), x: 650, y: 470 }, { text: tx('t6'), x: 548, y: 512 }] }
        ],
        analogy: b > 0 ? { q: beat(s, 1, 0, 0.3), arrowQ: beat(s, 1, 0.28, 0.5), moveQ: beat(s, 1, 0.5, 0.72), words: [rey, hom, muj, rei] } : null
      });
      var tq = beat(s, 0, 0.75, 0.95);
      if (tq > 0) {
        S.text(ctx, tx('t7'), 110, 440, { size: 20, weight: 700, p: tq, maxWidth: 260 });
        C.arrow(ctx, [170, 414], [192, 352], { p: tq, weight: 'thin', head: 9, curve: -10, seed: 230 });
      }
      S.text(ctx, tx('t16'), 1196, 526, { size: 20, weight: 700, align: 'right', role: 'ink-soft', p: beat(s, 1, 0.75, 0.95) });
    },

    municipios: function (ctx, s, env) {
      // Draw: on line 1 course sign `plano-coordenadas`: dots on a plane with the axes «latitud» and «longitud» and no outlines of territories, nearby dots sharing a similar fill; on line 2 course sign `cuadro-64`: a square tile labeled «10 por 10 metros» and, beside it, a strip of 64 small cells labeled «64 números» drawn exactly from figure `embeddings.alphaearth` (a meaning zone), with the figure's card and the labels «óptico», «radar», «clima» and «otros» flowing from the tile into the strip.
      var S = env.style, C = env.course, tx = env.tx, ch = env.charts;
      var f = fig(env, 'embeddings.alphaearth');
      var shrink = E.inOut(beat(s, 1, 0, 0.22));
      var pw = 640, ph = 380, px0 = 320, py0 = 118;
      var sc = E.lerp(1, 0.47, shrink), px = E.lerp(px0, 120, shrink), py = E.lerp(py0, 112, shrink);
      ctx.save();
      ctx.translate(px, py); ctx.scale(sc, sc); ctx.translate(-px0, -py0);
      C.sign(ctx, 'plano-coordenadas', { x: px0, y: py0, w: pw, h: ph, labels: ['', ''], q: [beat(s, 0, 0, 0.3), beat(s, 0, 0.2, 0.8)], seed: 21 });
      ctx.restore();
      var la = beat(s, 0, 0, 0.3), ls = E.lerp(23, 19, shrink);
      S.text(ctx, tx('t1'), px + 16 * sc, py + 10 * sc, { size: ls, weight: 700, p: la });
      S.text(ctx, tx('t2'), px + pw * sc, py + ph * sc + 30, { size: ls, weight: 700, align: 'right', p: la });
      var b = s.at(1);
      if (b > 0) {
        var n = ch.parseValue(f.partes[0].valor);
        C.sign(ctx, 'cuadro-64', {
          tile: { x: 120, y: 340, s: 140 }, strip: { x: 480, y: 402, w: 740, h: 52 }, n: n,
          labels: [tx('t3'), tx('t4')], flows: [tx('t5'), tx('t6'), tx('t7'), tx('t8')], size: 19,
          q: [beat(s, 1, 0.1, 0.3), beat(s, 1, 0.3, 0.62), beat(s, 1, 0.55, 0.8)]
        });
        var cq = beat(s, 1, 0.12, 0.4);
        if (cq > 0) env.cards.figure(ctx, 'embeddings.alphaearth', { x: 500, y: 92, w: 740, h: 214 }, { p: cq, size: 22 });
      }
    },

    'usos-emb': function (ctx, s, env) {
      // Draw: on line 1 four small use cards appear in a row: «buscar por significado», «agrupar respuestas abiertas de encuestas», «detectar temas», «comparar documentos de política pública»; on line 2 the card of `embeddings.garg` appears with the legend item `validez`; on line 3 a pair of dots joined by a short tie appears, labeled «asociaciones sesgadas», with the legend item `equidad`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var w = 272, gap = 24, x0 = (1280 - 4 * w - 3 * gap) / 2;
      [tx('t1'), tx('t2'), tx('t3'), tx('t4')].forEach(function (lb, i) {
        var q = beat(s, 0, 0.04 + i * 0.2, 0.22 + i * 0.2);
        if (q <= 0) return;
        var x = x0 + i * (w + gap), y = 96, cx = x + w / 2;
        C.box(ctx, { x: x, y: y, w: w, h: 164 }, { role: 'ground', p: q, seed: 240 + i });
        if (q < 0.5) return;
        var pq = E.segment(q, 0.5, 1);
        if (i === 0) {
          [[-24, 12], [-6, 26], [10, 8], [-14, -6]].forEach(function (d) { S.fill(ctx, P.circle(cx + d[0], y + 46 + d[1], 6, 12), { role: 'ink', offset: false, texture: false, p: pq }); });
          S.stroke(ctx, P.circle(cx - 6, y + 54, 30, 30), { weight: 'regular', closed: true, taper: false, p: pq, seed: 244 });
          S.stroke(ctx, [[cx + 16, y + 76], [cx + 36, y + 96]], { weight: 'bold', taper: false, p: pq, seed: 245 });
        } else if (i === 1) {
          [[-40, 0, 'accent-2'], [-22, 16, 'accent-2'], [-46, 26, 'accent-2'], [24, 4, 'accent-5'], [42, 20, 'accent-5'], [20, 30, 'accent-5']].forEach(function (d, k) {
            C.prop(ctx, 'chat-bubble', { x: cx + d[0] - 14, y: y + 30 + d[1], w: 30, h: 18, role: d[2], p: pq, seed: 246 + k });
          });
        } else if (i === 2) {
          // three topics: colored fields, each holding its own cluster of documents
          [['accent-1', -46], ['accent-2', 0], ['accent-5', 46]].forEach(function (d, k) {
            S.shape(ctx, P.blob(cx + d[1], y + 56, 21, 17, 250 + k, 4, 0.2), { role: d[0], weight: 'thin', p: pq, seed: 250 + k });
            [[-8, -5], [3, -7], [-3, 4], [8, 3], [-10, 6]].forEach(function (o2) { S.fill(ctx, P.circle(cx + d[1] + o2[0], y + 56 + o2[1], 2.2, 8), { role: 'ink', offset: false, texture: false, p: pq }); });
          });
        } else {
          C.prop(ctx, 'article-card', { x: cx - 66, y: y + 24, w: 46, h: 58, p: pq, seed: 254, barRole: 'accent-3' });
          C.prop(ctx, 'article-card', { x: cx + 20, y: y + 24, w: 46, h: 58, p: pq, seed: 255, barRole: 'accent-3' });
          C.approx(ctx, cx, y + 54, 22, { p: pq });
        }
        S.text(ctx, lb, cx, y + 118, { size: 19, weight: 700, align: 'center', maxWidth: w - 28, lineHeight: 1.2, maxLines: 2, p: pq });
      });
      var bq = beat(s, 1, 0, 0.3);
      if (bq > 0) {
        C.legendChip(ctx, 'validez', 70, 312, { p: bq, size: 20, r: 21 });
        env.cards.figure(ctx, 'embeddings.garg', { x: 70, y: 344, w: 560, h: 218 }, { p: beat(s, 1, 0.1, 0.45), size: 22 });
      }
      var cq = beat(s, 2, 0, 0.3);
      if (cq > 0) {
        C.legendChip(ctx, 'equidad', 720, 312, { p: cq, size: 20, r: 21 });
        var dq = beat(s, 2, 0.15, 0.5);
        var ax = 830, bx = 1010, yy = 430;
        S.shape(ctx, P.circle(ax, yy, 24, 30), { role: 'accent-3', weight: 'regular', p: dq, seed: 256 });
        S.shape(ctx, P.circle(bx, yy, 24, 30), { role: 'accent-1', weight: 'regular', p: dq, seed: 257 });
        var tie = P.smooth([[ax + 26, yy], [ax + 70, yy - 16], [(ax + bx) / 2, yy + 8], [bx - 70, yy - 14], [bx - 26, yy]], 10);
        S.stroke(ctx, tie, { weight: 'heavy', p: beat(s, 2, 0.35, 0.6), taper: false, seed: 258 });
        S.text(ctx, tx('t5'), (ax + bx) / 2, 514, { size: 25, weight: 700, align: 'center', p: beat(s, 2, 0.5, 0.75) });
      }
    },

    similar: function (ctx, s, env) {
      // Draw: the legend item `validez`; on line 1 a search by meaning returns a neat cluster of similar article cards while some relevant cards outside the cluster stay dark, and beside it the course sign `ecuacion-busqueda` appears with the label «búsqueda sistemática con palabras clave»; on line 2 a grid of zones appears with the training zones and the test zones gathered in two separate blocks, labeled «zonas de entrenamiento» and «zonas de prueba».
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit, P = S.path;
      C.legendChip(ctx, 'validez', 60, 96, { p: E.out(s.intro), size: 20, r: 21 });
      var cx = 330, cy = 236;
      var field = [[96, 150, 0], [530, 140, 2], [500, 300, 2], [120, 300, 2], [580, 222, 0], [64, 226, 0], [410, 330, 0], [208, 330, 0]];
      var cluster = [[cx - 62, cy - 54], [cx + 6, cy - 62], [cx - 40, cy + 8], [cx + 28, cy + 2], [cx - 6, cy - 28]];
      var fq = beat(s, 0, 0.02, 0.25);
      field.forEach(function (fc, i) {
        var q = E.stagger(fq, i, field.length, 0.6);
        if (q <= 0) return;
        var rel = fc[2] === 2;
        C.prop(ctx, 'article-card', { x: fc[0], y: fc[1], w: 44, h: 56, p: q, seed: 270 + i, barRole: rel ? 'accent-1' : 'ink-soft' });
        if (!rel) return;
        var dark = beat(s, 0, 0.45, 0.6);
        if (dark > 0) K.withAlpha(ctx, 0.55 * dark, function () { S.fill(ctx, P.rect(fc[0] - 2, fc[1] - 2, 48, 60, 6), { role: 'ink', offset: false, texture: false }); });
      });
      var sq = beat(s, 0, 0.2, 0.45);
      if (sq > 0) {
        S.fill(ctx, P.blob(cx - 14, cy - 12, 108, 88, 280, 5, 0.1), { role: 'accent-2', p: sq, alpha: 0.75, seed: 280 });
        cluster.forEach(function (c, i) { C.prop(ctx, 'article-card', { x: c[0], y: c[1], w: 44, h: 56, p: E.stagger(sq, i, 5, 0.5), seed: 281 + i, barRole: 'accent-1' }); });
        S.stroke(ctx, P.circle(cx + 74, cy - 76, 18, 24), { weight: 'regular', closed: true, taper: false, p: sq, seed: 287 });
        S.stroke(ctx, [[cx + 87, cy - 63], [cx + 104, cy - 46]], { weight: 'bold', taper: false, p: sq, seed: 288 });
      }
      var eq = beat(s, 0, 0.55, 0.85);
      if (eq > 0) C.sign(ctx, 'ecuacion-busqueda', { x: 720, y: 104, w: 440, h: 214, labels: C.signLabels('ecuacion-busqueda').map(keepTogether), q: [eq, beat(s, 0, 0.7, 0.95)], label: tx('t1'), labelQ: beat(s, 0, 0.75, 0.95) });
      // line 2: training zones and test zones in two separate blocks
      var g = beat(s, 1, 0, 0.4), sep = E.inOut(beat(s, 1, 0.35, 0.6)), lq = beat(s, 1, 0.55, 0.85);
      if (g > 0) {
        var cols = 12, rows = 3, cell = 34, pitch = 39, split = 8, extra = 34 * sep;
        var total = cols * pitch - 5 + extra, gx = 640 - total / 2, gy = 410;
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var q = E.stagger(g, r * cols + c, rows * cols, 0.7);
          if (q <= 0) continue;
          var test = c >= split, x = gx + c * pitch + (test ? extra : 0);
          S.shape(ctx, P.rect(x, gy + r * pitch, cell, cell, 4), { role: test ? 'accent-2' : 'accent-5', weight: 'thin', p: q, seed: 300 + r * cols + c });
        }
        S.text(ctx, tx('t2'), gx + (split * pitch - 5) / 2, gy + rows * pitch + 26, { size: 20, weight: 700, align: 'center', p: lq });
        S.text(ctx, tx('t3'), gx + split * pitch + extra + ((cols - split) * pitch - 5) / 2, gy + rows * pitch + 26, { size: 20, weight: 700, align: 'center', p: lq });
      }
    },

    banco: function (ctx, s, env) {
      // Draw: course sign `hilos-atencion` with the badge «Esquema»; on line 1 the sentence «me senté en el banco del parque» appears with «banco» joined to «parque» by the heaviest thread, and below it the sentence «el banco subió la tasa de interés» with «banco» joined to «tasa de interés» by the heaviest thread; on line 2 the threads of the second sentence redistribute as each word's threads appear in turn.
      var C = env.course, tx = env.tx;
      C.badge(ctx, tx('t1'), 1060, 100, { p: E.out(s.intro), size: 17 });
      var w1 = chipsOf(tx('t2')), f1 = indexOf(w1, tx('t3')), k1 = indexOf(w1, tx('t4'));
      var wt1 = w1.map(function (wd, i) { return i === k1 ? 1 : [0.16, 0.36, 0.12, 0.22, 0, 0.28, 1][i] || 0.15; });
      C.sign(ctx, 'hilos-atencion', { x: 640, y: 262, align: 'center', size: 32, words: w1, focus: f1, weights: wt1, q: beat(s, 0, 0, 0.2), tq: beat(s, 0, 0.15, 0.45), arcH: 26 });
      var w2 = chipsOf(tx('t5'), tx('t7')), f2 = indexOf(w2, tx('t6')), k2 = indexOf(w2, tx('t7'));
      var M = [[0, 0.9, 0.2, 0.1, 0.35], [0.15, 0, 0.42, 0.12, 1], [0.1, 0.85, 0, 0.16, 0.6], [0.1, 0.22, 0.15, 0, 0.92], [0.1, 0.95, 0.5, 0.3, 0]];
      function weightsFor(fi) {
        var row = M[Math.min(fi, M.length - 1)] || [];
        return w2.map(function (wd, i) { return i === fi ? 0 : (fi === f2 && i === k2 ? 1 : (row[i] == null ? 0.2 : row[i])); });
      }
      var base = { x: 640, y: 492, align: 'center', size: 32, words: w2, arcH: 26 };
      function threads(k, o) { C.sign(ctx, 'hilos-atencion', Object.assign({}, base, { focus: k, weights: weightsFor(k), q: 0, focusQ: 0 }, o)); }
      var b = s.at(1);
      if (b <= 0) {
        C.sign(ctx, 'hilos-atencion', Object.assign({}, base, { focus: f2, weights: weightsFor(f2), q: beat(s, 0, 0.5, 0.65), tq: beat(s, 0, 0.6, 0.9) }));
        return;
      }
      // line 2: every word weighs the others in turn, then «banco» again
      var n = w2.length, A = E.segment(b, 0, 0.82), B = E.segment(b, 0.82, 1);
      var slot = A * n, cur = Math.min(n - 1, Math.floor(slot)), ghost = 1 - E.segment(B, 0, 0.6);
      var fade0 = 1 - E.segment(b, 0, 0.06);
      if (fade0 > 0) threads(f2, { tq: 1, alpha: fade0 });
      for (var k = 0; k < n; k++) {
        if (B > 0) { if (ghost > 0) threads(k, { tq: 1, alpha: 0.16 * ghost }); continue; }
        if (k < cur) threads(k, { tq: 1, alpha: 0.16 });
        else if (k === cur) threads(k, { tq: E.segment(slot - k, 0, 0.6) });
      }
      if (B > 0) threads(f2, { tq: E.segment(B, 0.1, 0.9) });
      C.sign(ctx, 'hilos-atencion', Object.assign({}, base, { focus: B > 0 ? f2 : cur, weights: null, q: 1, tq: 0 }));
    },

    'pesos-espaciales': function (ctx, s, env) {
      // Draw: place `oficina-grupo`: on line 1 JULIÁN at the whiteboard draws a small grid of neighboring zones with weights between them, labeled «matriz de pesos espaciales», and the grid turns into the threads of a sentence, labeled «pesos calculados a partir del contexto»; on line 2 a tall stack of identical attention layers appears, labeled «Transformer, 2017: decenas de capas».
      var S = env.style, C = env.course, tx = env.tx, K = C.v2kit, P = S.path;
      C.place(ctx, 'oficina-grupo', { p: E.out(s.intro), boardX: 330, boardY: 84, boardW: 610, boardH: 320, window: false, laptops: false });
      C.person(ctx, 'julian', { pose: 'pointing', x: 232, y: 566, scale: 0.86, t: s.t, p: E.out(s.intro) });
      var bx = 330, by = 84, bw = 610;
      var g = beat(s, 0, 0.08, 0.4), morph = E.inOut(beat(s, 0, 0.5, 0.78)), th = beat(s, 0, 0.72, 0.95);
      S.text(ctx, tx('t1'), bx + bw / 2, by + 50, { size: 23, weight: 700, align: 'center', p: g * (1 - morph) });
      S.text(ctx, tx('t2'), bx + bw / 2, by + 50, { size: 23, weight: 700, align: 'center', p: E.segment(morph, 0.6, 1) });
      // a 2 × 3 grid of neighboring zones with weights between them
      var gs = 64, gg = 52, gx = bx + bw / 2 - (3 * gs + 2 * gg) / 2, gy = by + 96;
      var cw = 74, chh = 38, cg = 16, rowX = bx + bw / 2 - (6 * cw + 5 * cg) / 2, rowY = by + 236;
      var cells = [];
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
        var i = r * 3 + c;
        var A = { x: gx + c * (gs + gg), y: gy + r * (gs + gg), w: gs, h: gs }, B = { x: rowX + i * (cw + cg), y: rowY, w: cw, h: chh };
        cells.push({ x: E.lerp(A.x, B.x, morph), y: E.lerp(A.y, B.y, morph), w: E.lerp(A.w, B.w, morph), h: E.lerp(A.h, B.h, morph) });
      }
      var links = [[0, 1, 1], [1, 2, 0.35], [3, 4, 0.6], [4, 5, 0.25], [0, 3, 0.45], [1, 4, 0.9], [2, 5, 0.5]];
      if (g > 0 && morph < 1) {
        K.withAlpha(ctx, 1 - morph, function () {
          links.forEach(function (l, k) {
            var a = cells[l[0]], b = cells[l[1]];
            S.stroke(ctx, [[a.x + a.w / 2, a.y + a.h / 2], [b.x + b.w / 2, b.y + b.h / 2]], { weight: 1.2 + 7 * l[2], taper: false, swell: 0.3, p: E.stagger(g, k, links.length, 0.6), seed: 310 + k });
          });
        });
      }
      cells.forEach(function (c, k) {
        var q = E.stagger(g, k, 6, 0.6);
        if (q <= 0) return;
        if (morph < 0.5) S.shape(ctx, P.rect(c.x, c.y, c.w, c.h, 6), { role: ['accent-5', 'ground-2', 'accent-5', 'ground-2', 'accent-5', 'ground-2'][k], weight: 'regular', p: q, seed: 320 + k });
        else K.wordChip(ctx, c.x, c.y, c.w, c.h, { seed: 330 + k, role: k === 2 ? 'accent-2' : 'ground' });
      });
      if (th > 0) {
        var fc = cells[2], wts = [0.3, 0.85, 0, 0.5, 1, 0.2];
        cells.forEach(function (c, k) {
          if (k === 2) return;
          var A2 = [fc.x + fc.w / 2, fc.y - 6], B2 = [c.x + c.w / 2, c.y - 6];
          var mid = [(A2[0] + B2[0]) / 2, Math.min(A2[1], B2[1]) - 22 - Math.abs(B2[0] - A2[0]) * 0.22];
          S.stroke(ctx, P.smooth([A2, mid, B2], 14), { weight: 1.2 + 7.5 * wts[k], p: E.stagger(th, k, 6, 0.5), taper: false, swell: 0.5, seed: 340 + k, alpha: 0.55 + 0.45 * wts[k] });
        });
      }
      // line 2: a tall stack of identical attention layers
      var lq = beat(s, 1, 0.02, 0.6);
      if (lq > 0) {
        var sx = 1010, sw = 210, ly0 = 470, n = 12, lh = 22, lg = 8;
        for (var k = 0; k < n; k++) {
          var q = E.stagger(lq, k, n, 0.7);
          if (q <= 0) continue;
          var yy = ly0 - (k + 1) * (lh + lg);
          K.withAlpha(ctx, E.out(q), function () {
            S.machine(ctx, 'frame', { x: sx, y: yy, w: sw, h: lh });
            for (var d = 0; d < 6; d++) {
              var nx = sx + 22 + d * (sw - 44) / 5;
              if (d > 0) S.machineLine(ctx, nx - (sw - 44) / 5 + 5, yy + lh / 2, nx - 5, yy + lh / 2, 1, 'machine-line');
              S.machine(ctx, 'node', { x: nx, y: yy + lh / 2, r: 5 });
            }
          });
        }
        S.text(ctx, tx('t3'), sx + sw / 2, ly0 + 40, { size: 21, weight: 700, align: 'center', maxWidth: 250, p: beat(s, 1, 0.5, 0.8) });
      }
    },

    familias: function (ctx, s, env) {
      // Draw: course sign `dos-familias`, a meaning zone; on line 1 the lane «Codificador, tipo BERT» shows arrows in both directions over a sentence with a covered word, with the labels «analizar y clasificar texto» and «BETO, en español, de la Universidad de Chile»; on line 2 the lane «Decodificador, tipo GPT» shows a left-to-right arrow ending in a blank, with the label «todos los chats actuales»; on line 3 a `modelo-pequeno` sorts many text cards into labeled bins next to a large `lampara`, with «más barato», «más rápido» and «más reproducible» under the small one.
      var S = env.style, C = env.course, tx = env.tx;
      var q1 = beat(s, 0, 0, 0.45), q2 = beat(s, 1, 0, 0.5);
      C.sign(ctx, 'dos-familias', { t: s.t, size: 25, lanes: [
        { x: 70, y: 96, w: 520, title: tx('t1'), mode: 'both', q: q1, n: 6, cover: 3 },
        { x: 690, y: 96, w: 520, title: tx('t4'), mode: 'next', q: q2, n: 6 }
      ] });
      S.text(ctx, tx('t2'), 330, 300, { size: 23, weight: 700, align: 'center', p: beat(s, 0, 0.45, 0.65) });
      S.text(ctx, tx('t3'), 330, 332, { size: 19, weight: 500, align: 'center', role: 'ink-soft', maxWidth: 520, p: beat(s, 0, 0.65, 0.85) });
      S.text(ctx, tx('t5'), 950, 300, { size: 23, weight: 700, align: 'center', p: beat(s, 1, 0.5, 0.75) });
      // line 3: a small classifier sorts many text cards into bins, next to a large lamp
      var c = s.at(2);
      if (c > 0) {
        var mp = beat(s, 2, 0, 0.3), mx = 270, my = 396, binW = 84;
        var res = C.lamp(ctx, 'modelo-pequeno', { x: mx, y: my, r: 26, labels: ['', '', ''], binW: binW, p: mp, t: s.t });
        var bins = res.bins, binX = bins[0], binY = bins[1];
        ['accent-1', 'accent-2', 'accent-5'].forEach(function (rl, i) { S.fill(ctx, S.path.circle(binX + i * (binW + 24) + binW / 2, binY + 30, 8, 14), { role: rl, offset: false, texture: false, p: mp }); });
        if (mp >= 1) {
          for (var k = 0; k < 6; k++) {
            var u = ((s.t * 0.42) + k / 6) % 1, bin = k % 3, x, y;
            if (u < 0.45) { var v = E.inOut(u / 0.45); x = E.lerp(96, mx - 30, v); y = my - 4; }
            else { var v2 = E.inOut((u - 0.45) / 0.55); x = E.lerp(mx, binX + bin * (binW + 24) + binW / 2, v2); y = E.lerp(my + 28, binY + 6, v2); }
            S.machine(ctx, 'card', { x: x - 13, y: y - 9, w: 26, h: 18, lines: 2 });
          }
        }
        // the coding goes through a human checkpoint before it is used
        C.prop(ctx, 'bandera-control', { x: 436, y: binY + 26, s: 0.5, p: beat(s, 2, 0.3, 0.5), labelDx: 14, align: 'left', size: 15, maxWidth: 150 });
        var xx = 80;
        [tx('t6'), tx('t7'), tx('t8')].forEach(function (lb, i) {
          S.text(ctx, lb, xx, 566, { size: 18, weight: 700, p: beat(s, 2, 0.45 + i * 0.12, 0.6 + i * 0.12) });
          xx += S.measure(ctx, lb, 18, 700) + 22;
        });
        C.lamp(ctx, 'lampara', { x: 950, y: 440, r: 84, p: beat(s, 2, 0.2, 0.45), t: s.t });
      }
    },

    'mapas-atencion': function (ctx, s, env) {
      // Draw: place `escritorio-casa`: on line 1 MARIANA points at an attention map on her screen, a grid of cells of different intensity over a sentence (badge «Esquema»); on line 2 the label «no es una explicación confiable» appears across the map and the legend item `transparencia` lights up; on line 3 the map slides aside and the course sign `acuerdo` appears, a column «Usted» and a column «IA» linked where they match, with the label «kappa de Cohen o alfa de Krippendorff» and the legend item `validez`.
      var S = env.style, C = env.course, tx = env.tx;
      var pl = C.place(ctx, 'escritorio-casa', { x: 170, y: 480, w: 420, p: E.out(s.intro), secondScreen: false, window: false, laptopAt: 250, laptopW: 170, plant: false, headset: false });
      C.person(ctx, 'mariana', { pose: 'seated-pointing', x: pl.seat.x, y: pl.seat.y, scale: 0.95, t: s.t });
      pl.front(ctx);
      var aside = E.inOut(beat(s, 2, 0, 0.3));
      var scx = E.lerp(830, 1100, aside), sc = E.lerp(1, 0.52, aside);
      function mapX(x) { return scx + (x - 830) * sc; }
      function mapY(y) { return 470 + (y - 470) * sc; }
      ctx.save();
      ctx.translate(scx, 470); ctx.scale(sc, sc); ctx.translate(-830, -470);
      var scr = C.prop(ctx, 'screen', { x: 830, y: 470, w: 480, h: 334, p: E.out(s.intro), seed: 5, screenRole: 'machine-ground' }).screen;
      // the attention map: word marks along two sides and a grid of cells of different intensity
      var mq = beat(s, 0, 0.05, 0.5), n = 7, cell = 34, mx = scr.x + (scr.w - n * cell - 46) / 2 + 46, my = scr.y + 52;
      if (mq > 0) {
        for (var i = 0; i < n; i++) {
          S.machine(ctx, 'bar', { x: mx + i * cell + 6, y: my - 18, w: cell - 12, h: 5, role: 'machine-line', alpha: 0.9 * mq });
          S.machine(ctx, 'bar', { x: mx - 40, y: my + i * cell + cell / 2 - 2, w: 30, h: 5, role: 'machine-line', alpha: 0.9 * mq });
          for (var j = 0; j < n; j++) {
            var v = i === j ? 0.9 : 0.12 + 0.7 * Math.pow(Math.abs(Math.sin(i * 2.1 + j * 1.3 + 0.7)), 2);
            var cq = E.stagger(mq, i * n + j, n * n, 0.7);
            if (cq <= 0) continue;
            S.machine(ctx, 'bar', { x: mx + j * cell + 1, y: my + i * cell + 1, w: cell - 2, h: cell - 2, role: 'machine-glow-1', alpha: v * cq });
            S.machine(ctx, 'frame', { x: mx + j * cell, y: my + i * cell, w: cell, h: cell, fill: false, lw: 1, role: 'machine-grid' });
          }
        }
      }
      ctx.restore();
      // the label across the map keeps a readable size when the map moves aside
      var nq = beat(s, 1, 0.12, 0.4);
      if (nq > 0) {
        var lw = E.lerp(460, 290, aside), lh = E.lerp(68, 50, aside), ls = E.lerp(25, 17, aside);
        ctx.save(); ctx.translate(mapX(830), mapY(my + n * cell / 2)); ctx.rotate(-0.06);
        C.box(ctx, { x: -lw / 2, y: -lh / 2, w: lw, h: lh }, { label: tx('t2'), size: ls, role: 'ground', weight: 'bold', p: nq, seed: 360, motion: 'pop' });
        ctx.restore();
      }
      C.badge(ctx, tx('t1'), E.lerp(600, 985, aside), E.lerp(64, 236, aside), { p: E.out(s.intro), size: 16 });
      C.legendChip(ctx, 'transparencia', E.lerp(600, 990, aside), E.lerp(528, 506, aside), { p: beat(s, 1, 0.35, 0.6), size: 20, r: 21 });
      // line 3: validation against human coding
      var aq = beat(s, 2, 0.25, 0.7);
      if (aq > 0) {
        C.sign(ctx, 'acuerdo', { x: 612, y: 100, w: 330, h: 300, labels: [tx('t3'), tx('t4')], q: [aq, beat(s, 2, 0.35, 0.8), beat(s, 2, 0.55, 0.9)] });
        S.text(ctx, tx('t5'), 777, 440, { size: 20, weight: 700, align: 'center', maxWidth: 360, p: beat(s, 2, 0.6, 0.85) });
        C.legendChip(ctx, 'validez', 690, 520, { p: beat(s, 2, 0.7, 0.92), size: 20, r: 21 });
      }
    },

    'seis-partes': function (ctx, s, env) {
      // Draw: course sign `tarjeta-instruccion`; on line 1 the card's six parts appear one after another: «Contexto», «Tarea», «Insumos», «Criterios», «Formato», «Honestidad»; on line 2 the part «Honestidad» enlarges and shows «Si algo no está en los insumos o no lo sabes, dilo. No inventes referencias; marca lo que debo verificar.»
      var S = env.style, C = env.course, tx = env.tx;
      var q = [0, 1, 2, 3, 4, 5].map(function (i) { return beat(s, 0, 0.04 + i * 0.14, 0.18 + i * 0.14); });
      var em = beat(s, 1, 0, 0.2);
      var res = C.sign(ctx, 'tarjeta-instruccion', { x: 130, y: 100, w: 470, h: 464, labels: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5'), tx('t6')], size: 27, p: E.out(s.intro), q: q, emph: 5, emphQ: em, seed: 41 });
      var grow = E.inOut(beat(s, 1, 0.08, 0.4));
      if (grow > 0) {
        var row = res.rows[5];
        var to = { x: 670, y: 196, w: 540, h: 276 };
        var bx = E.lerp(row.x, to.x, grow), by = E.lerp(row.y, to.y, grow), bw = E.lerp(row.w, to.w, grow), bh = E.lerp(row.h, to.h, grow);
        C.arrow(ctx, [row.x + row.w + 14, row.y + row.h / 2], [to.x - 12, to.y + to.h - 60], { p: E.segment(grow, 0.6, 1), weight: 'regular', curve: 30, head: 13, seed: 370 });
        S.mark(ctx, 'card', { x: bx, y: by, w: bw, h: bh }, { p: Math.min(1, grow * 1.6), variant: 'accent-1', seed: 371 });
        if (grow >= 1) {
          S.text(ctx, tx('t7'), to.x + 34, to.y + 58, { size: 31, weight: 700, p: beat(s, 1, 0.38, 0.5) });
          S.text(ctx, tx('t8'), to.x + 34, to.y + 110, { size: 27, weight: 500, maxWidth: to.w - 68, lineHeight: 1.3, p: beat(s, 1, 0.42, 0.6) });
        }
      }
    },

    bucle: function (ctx, s, env) {
      // Draw: course sign `bucle-mejora`; on line 1 the steps «Primera versión», «Leer como revisor», «Diagnosticar la causa» and «Ajustar y probar» appear around a loop; on line 2 the step «Guardar la mejor versión» opens into the `bitacora` and a skill folder labeled «skill».
      var C = env.course, tx = env.tx;
      var shrink = E.inOut(beat(s, 1, 0, 0.22)), sc = E.lerp(1, 0.66, shrink);
      var cx0 = 640, cy0 = 330, cx1 = 320, cy1 = 320, rx = 300, ry = 180, bw = 258, bh = 74;
      var cx = E.lerp(cx0, cx1, shrink), cy = E.lerp(cy0, cy1, shrink);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx0, -cy0);
      C.sign(ctx, 'bucle-mejora', { cx: cx0, cy: cy0, rx: rx, ry: ry, labels: [tx('t1'), tx('t2'), tx('t3'), tx('t4'), tx('t5')], boxW: bw, boxH: bh, size: 22,
        q: [beat(s, 0, 0.02, 0.2), beat(s, 0, 0.22, 0.4), beat(s, 0, 0.42, 0.6), beat(s, 0, 0.62, 0.8)] });
      ctx.restore();
      var b = s.at(1);
      if (b > 0) {
        // the fourth step («Ajustar y probar», at the bottom of the loop) leaves the loop to the fifth
        var bottom = { x: cx1 + (cx0 - bw / 2 - cx0) * 0.66, y: cy1 + ry * 0.66 - bh * 0.66 / 2, w: bw * 0.66, h: bh * 0.66 };
        var ex = { x: 650, y: 404, w: 330, h: 70 };
        var eq = beat(s, 1, 0.22, 0.4);
        C.arrow(ctx, [bottom.x + bottom.w * 0.7, bottom.y + bottom.h + 6], [ex.x - 10, ex.y + ex.h * 0.7], { p: E.segment(eq, 0, 0.5), weight: 'regular', head: 13, curve: 34, seed: 380 });
        C.box(ctx, ex, { label: tx('t5'), size: 22, role: 'accent-2', weight: 'bold', p: E.segment(eq, 0.3, 1), seed: 381 });
        var tq = beat(s, 1, 0.36, 0.62);
        if (tq > 0) {
          C.arrow(ctx, [ex.x + ex.w / 2, ex.y - 6], [ex.x + ex.w / 2, 286], { p: tq, weight: 'thin', head: 10, seed: 382 });
          C.sign(ctx, 'bitacora', { x: 620, y: 108, w: 620, headers: C.signLabels('bitacora'), cols: [0.09, 0.18, 0.1, 0.16, 0.14, 0.19, 0.14], nRows: 2, rowH: 40, headH: 84, headSize: 15, fill: E.segment(tq, 0.5, 1) * 2, p: tq });
        }
        var fq = beat(s, 1, 0.58, 0.82);
        if (fq > 0) {
          C.arrow(ctx, [ex.x + ex.w + 6, ex.y + ex.h / 2], [1060, ex.y + ex.h / 2], { p: E.segment(fq, 0, 0.5), weight: 'thin', head: 10, seed: 383 });
          C.prop(ctx, 'folder', { x: 1144, y: ex.y + ex.h / 2, w: 150, h: 92, p: fq, label: tx('t6'), size: 22, seed: 384 });
        }
      }
    },

    metodo: function (ctx, s, env) {
      // Draw: the stamp `stamp-instruccion` at the top; on line 1 the card of `prompts.sclar` appears in the center, a meaning zone, with the badge «Con matiz»; on line 2 a page labeled «Método o anexo: instrucción exacta» and a row of variant cards labeled «rango de resultados» appear; on line 3 the instruction card and a codebook are locked into a folder labeled «antes de ver los resultados», with the legend items `transparencia` and `integridad`.
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      C.stamp(ctx, 'stamp-instruccion', { x: 180, y: 196, r: 120, p: E.out(s.intro) });
      var cq = beat(s, 0, 0.1, 0.45);
      if (cq > 0) env.cards.figure(ctx, 'prompts.sclar', { x: 380, y: 90, w: 520, h: 250 }, { p: cq, size: 24 });
      // line 2: the exact instruction in the methods or an annex, and the range over variants
      var pq = beat(s, 1, 0, 0.3);
      if (pq > 0) {
        var pg = { x: 90, y: 362, w: 300, h: 200 };
        S.shape(ctx, P.rect(pg.x, pg.y, pg.w, pg.h, 6), { role: 'ground', weight: 'regular', offset: false, texture: false, p: pq, seed: 390 });
        S.text(ctx, tx('t2'), pg.x + pg.w / 2, pg.y + 34, { size: 19, weight: 700, align: 'center', maxWidth: pg.w - 30, lineHeight: 1.2, maxLines: 2, p: pq });
        C.sign(ctx, 'tarjeta-instruccion', { x: pg.x + 90, y: pg.y + 76, w: 120, h: 108, compact: true, p: E.segment(pq, 0.3, 1), pad: 10, blob: false, seed: 391 });
      }
      var vq = beat(s, 1, 0.3, 0.7);
      if (vq > 0) {
        for (var k = 0; k < 4; k++) {
          var q = E.stagger(vq, k, 4, 0.6);
          if (q > 0) C.sign(ctx, 'tarjeta-instruccion', { x: 452 + k * 104, y: 386, w: 90, h: 112, compact: true, p: q, pad: 10, blob: false, seed: 392 + k, emph: k, emphQ: 1 });
        }
        C.bracket(ctx, 452, 452 + 3 * 104 + 90, 518, { p: beat(s, 1, 0.55, 0.8), h: -12 });
        S.text(ctx, tx('t3'), 452 + (3 * 104 + 90) / 2, 548, { size: 20, weight: 700, align: 'center', p: beat(s, 1, 0.6, 0.85) });
      }
      // line 3: the instruction and the codebook are locked into a folder before the results
      var c = s.at(2);
      if (c > 0) {
        var fq = beat(s, 2, 0, 0.25), mv = E.inOut(beat(s, 2, 0.2, 0.55)), lock = beat(s, 2, 0.55, 0.75);
        var fx = 1100, fy = 440;
        C.prop(ctx, 'folder', { x: fx, y: fy, w: 210, h: 130, p: fq, seed: 395, role: 'accent-6' });
        if (mv < 1) {
          C.sign(ctx, 'tarjeta-instruccion', { x: E.lerp(960, fx - 60, mv), y: E.lerp(130, fy - 40, mv), w: E.lerp(110, 60, mv), h: E.lerp(130, 70, mv), compact: true, p: fq, pad: 8, blob: false, seed: 396 });
          var bxx = E.lerp(1110, fx + 4, mv), byy = E.lerp(150, fy - 30, mv), bsc = E.lerp(1, 0.6, mv);
          S.shape(ctx, P.rect(bxx, byy, 90 * bsc, 116 * bsc, 6), { role: 'accent-3', weight: 'regular', p: fq, seed: 397 });
          [0, 1, 2].forEach(function (t) { S.shape(ctx, P.rect(bxx + 90 * bsc - 2, byy + (14 + t * 30) * bsc, 14 * bsc, 22 * bsc, 3), { role: ['accent-1', 'accent-2', 'accent-5'][t], weight: 'hair', p: fq, seed: 398 + t }); });
        }
        if (lock > 0) {
          S.stroke(ctx, [[fx - 105, fy + 6], [fx + 105, fy + 6]], { weight: 'heavy', p: lock, taper: false, seed: 401 });
          S.shape(ctx, P.circle(fx, fy + 6, 20, 28), { role: 'accent-1', weight: 'regular', p: lock, seed: 402 });
          S.stroke(ctx, P.arc(fx, fy - 4, 9, Math.PI, 0, 12), { weight: 'regular', p: lock, taper: false, seed: 403 });
        }
        S.text(ctx, tx('t4'), fx, fy + 100, { size: 20, weight: 700, align: 'center', maxWidth: 260, p: lock });
        C.legendChip(ctx, 'transparencia', 985, 300, { p: beat(s, 2, 0.6, 0.8), size: 20, r: 21 });
        C.legendChip(ctx, 'integridad', 985, 344, { p: beat(s, 2, 0.7, 0.9), size: 20, r: 21 });
      }
    },

    caso: function (ctx, s, env) {
      // Draw: place `oficina-grupo`: AMPARO, JULIÁN and MARIANA at the table, with three chat windows on the wall screen, each with a small lamp, labeled «cerrado», «cerrado» and «pesos abiertos»; on line 1 a `tarjeta-instruccion` labeled «Primera versión» enters the three windows; on line 2 the three answer cards come back; on line 3 the group checks each answer card for invented citations, with a small flag «¿cita inventada?», and the card returns labeled «Segunda versión», with a stack of PDF cards attached as «insumos» and the part «Honestidad» emphasized; on line 4 a third card labeled «Tercera versión» receives two comment notes; badge «Ejemplo ilustrativo».
      var S = env.style, C = env.course, tx = env.tx, P = S.path;
      var pl = C.place(ctx, 'oficina-grupo', { p: E.out(s.intro), board: false, window: false, laptops: false, seats: [400, 640, 880] });
      var scr = C.prop(ctx, 'screen', { x: 682, y: 392, w: 500, h: 270, p: E.out(s.intro), seed: 3, screenRole: 'ground' }).screen;
      var ww = 150, wg = 12, wx0 = scr.x + (scr.w - 3 * ww - 2 * wg) / 2, wy = scr.y + 10, wh = scr.h - 20;
      var wins = [];
      [tx('t1'), tx('t2'), tx('t3')].forEach(function (lb, i) {
        var x = wx0 + i * (ww + wg);
        wins.push({ x: x, y: wy, w: ww, h: wh });
        S.machine(ctx, 'browser', { x: x, y: wy, w: ww, h: wh, bar: 18 });
        C.lamp(ctx, 'lampara', { x: x + ww / 2, y: wy + 80, r: 28, t: s.t, p: E.out(s.intro) });
        S.machine(ctx, 'label', { text: lb, x: x + ww / 2, y: wy + wh - 18, size: 18, align: 'center', p: E.out(s.intro) });
      });
      // the three versions of the instruction form a deck on the left (each later one in front)
      var V = [{ x: 40, y: 92 }, { x: 40, y: 134 }, { x: 40, y: 176 }], vw = 284, vh = 238;
      function version(i, o) { C.sign(ctx, 'tarjeta-instruccion', Object.assign({ x: V[i].x, y: V[i].y, w: vw, h: vh, compact: true, titleSize: 17, pad: 14, blob: i === 0 ? undefined : false, seed: 410 + i }, o)); }
      var p1 = beat(s, 0, 0, 0.25), p2 = beat(s, 2, 0.45, 0.7), p3 = beat(s, 3, 0.05, 0.3);
      if (p1 > 0) version(0, { title: tx('t4'), p: p1 });
      // copies of the first version enter the three windows
      var into = E.inOut(beat(s, 0, 0.3, 0.75));
      if (into > 0) {
        wins.forEach(function (w, i) {
          var u = E.clamp(into * 1.25 - i * 0.12, 0, 1);
          if (u <= 0) return;
          S.machine(ctx, 'card', { x: E.lerp(V[0].x + vw - 30, w.x + w.w / 2 - 20, u), y: E.lerp(V[0].y + 60, w.y + 132, u), w: 40, h: 30, lines: 4 });
        });
      }
      // line 2: three answer cards come back to the right; line 3: each is read as a reviewer would
      var outs = [{ x: 950, y: 100 }, { x: 950, y: 180 }, { x: 950, y: 260 }], aw = 150, ah = 62;
      outs.forEach(function (o, i) {
        var u = E.inOut(beat(s, 1, 0.1 + i * 0.2, 0.45 + i * 0.2));
        if (u <= 0) return;
        var x = E.lerp(wins[i].x + 4, o.x, u), y = E.lerp(wins[i].y + 120, o.y, u);
        C.box(ctx, { x: x, y: y, w: aw, h: ah }, { role: 'ground', p: E.clamp(u * 2, 0, 1), seed: 420 + i, r: 8 });
        [0.9, 0.7, 0.8].forEach(function (lw, k) { S.stroke(ctx, [[x + 16, y + 17 + k * 14], [x + 16 + 100 * lw, y + 18 + k * 14]], { weight: 'hair', taper: false, seed: 424 + i * 3 + k }); });
        var rq = beat(s, 2, 0.05 + i * 0.1, 0.2 + i * 0.1);
        if (rq <= 0) return;
        if (i !== 1) C.check(ctx, x + aw - 20, y + ah - 18, 22, { p: rq });
        else {
          smallFlag(ctx, S, x + aw + 14, y + ah, rq, 430);
          S.text(ctx, tx('t5'), x + aw + 76, y + ah + 30, { size: 17, weight: 700, align: 'center', p: rq });
        }
      });
      // the second version: the PDF as inputs and the request for honesty
      if (p2 > 0) {
        version(1, { title: tx('t6'), p: p2, emph: 5, emphQ: beat(s, 2, 0.75, 0.9), emphLabel: tx('t8'), emphSize: 15 });
        var pdf = beat(s, 2, 0.6, 0.85);
        if (pdf > 0) {
          C.prop(ctx, 'card-stack', { x: 372, y: 318, w: 44, h: 56, n: 3, p: pdf });
          S.stroke(ctx, P.smooth([[V[1].x + vw - 8, 286], [V[1].x + vw + 12, 278], [V[1].x + vw + 30, 290]], 6), { weight: 'regular', taper: false, p: pdf, seed: 433 });
          S.text(ctx, tx('t7'), 380, 344, { size: 17, weight: 700, align: 'center', p: pdf });
        }
      }
      // line 4: the third version receives two comment notes
      if (p3 > 0) {
        version(2, { title: tx('t9'), p: p3, emph: 5, emphQ: 1, emphLabel: tx('t8'), emphSize: 15 });
        note(ctx, env, V[2].x + vw - 14, V[2].y + 66, 'accent-2', beat(s, 3, 0.35, 0.5), 440);
        note(ctx, env, V[2].x + vw - 30, V[2].y + 146, 'accent-5', beat(s, 3, 0.5, 0.65), 443);
      }
      var seats = pl.seats;
      C.person(ctx, 'amparo', { pose: 'seated', x: seats[0].x, y: seats[0].y, scale: seats[0].scale, t: s.t });
      C.person(ctx, 'mariana', { pose: 'seated', x: seats[1].x, y: seats[1].y, scale: seats[1].scale, t: s.t });
      C.person(ctx, 'julian', { pose: 'seated', x: seats[2].x, y: seats[2].y, scale: seats[2].scale, t: s.t });
      pl.front(ctx);
    },

    cierre: function (ctx, s, env) {
      // Draw: the stamp `stamp-plausible` in the center; on line 1 the course signs `ciclo-token`, `tira-tokens`, `mapa-significados`, `dos-familias` and `tarjeta-instruccion` return as small icons around it.
      var C = env.course;
      var a = s.at(0);
      C.stamp(ctx, 'stamp-plausible', { x: 640, y: 292, r: 138, p: E.out(s.intro) });
      var icons = [
        function () { C.sign(ctx, 'ciclo-token', { x: 0, y: 0, w: 1200, h: 466, labels: false, q: [1, 1, 1, 1, 1, 1], back: 1, arrowWeight: 'bold', head: 22, boxWeight: 'bold' }); },
        function () { C.sign(ctx, 'tira-tokens', { x: 0, y: 0, widths: [60, 110, 90, 120, 50, 130, 50], h: 60, gap: 22, cut: 1 }); },
        function () { C.sign(ctx, 'mapa-significados', { x: 0, y: 0, w: 900, h: 420, axesQ: 1, size: 1, clusters: [
          { role: 'accent-2', words: [{ text: '', x: 160, y: 120 }, { text: '', x: 240, y: 190 }, { text: '', x: 150, y: 240 }] },
          { role: 'accent-5', words: [{ text: '', x: 520, y: 260 }, { text: '', x: 610, y: 320 }, { text: '', x: 500, y: 350 }] }] }); },
        function () { C.sign(ctx, 'dos-familias', { t: 0, lanes: [{ x: 0, y: 0, w: 520, title: '', mode: 'both', n: 6, cover: 3 }, { x: 0, y: 150, w: 520, title: '', mode: 'next', n: 6 }] }); },
        function () { C.sign(ctx, 'tarjeta-instruccion', { x: 0, y: 0, w: 300, h: 340, compact: true, blob: false, seed: 450 }); }
      ];
      var fits = [[1200, 466], [690, 60], [900, 420], [520, 300], [300, 340]];
      var pos = [[250, 168], [1030, 168], [236, 412], [1044, 412], [640, 512]];
      var dims = [[236, 124], [236, 124], [236, 124], [236, 124], [200, 104]];
      icons.forEach(function (fn, i) {
        var q = E.segment(a, 0.06 + i * 0.12, 0.3 + i * 0.12);
        if (q <= 0) return;
        var bw = dims[i][0], bh = dims[i][1];
        C.box(ctx, { x: pos[i][0] - bw / 2, y: pos[i][1] - bh / 2, w: bw, h: bh }, { role: false, p: q, weight: 'thin', seed: 460 + i });
        if (q < 0.4) return;
        var f = fits[i], k = Math.min((bw - 34) / f[0], (bh - 28) / f[1]);
        ctx.save();
        ctx.globalAlpha *= E.segment(q, 0.4, 1);
        ctx.translate(pos[i][0] - f[0] * k / 2, pos[i][1] - f[1] * k / 2);
        ctx.scale(k, k);
        fn();
        ctx.restore();
      });
    }
  };

  NS.videos.v2 = { zones: zones, scenes: scenes };
})(window.IAHI);
