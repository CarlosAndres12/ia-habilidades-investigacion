/* Live slides of «Modo clase» (spec §4.6): one slide per agenda block of each session. Each slide
   has its title, three to five short points transcribed from the block's explanation or steps, its
   course-sign diagram (the last frame of the video scene that draws it) or its figure cards, the
   block's «Dinámica en línea» as a footer, and presenter notes. The deck never types a figure.
   NS.slides.render(ctx, 'n-k', { t }) draws slide k of session n on a 1280×720 canvas. */
(function (NS) {
  'use strict';
  var U = NS.util;
  var slides = NS.slides;
  var images = {};

  function deckOf(n) { return (((NS.data.widgets || {}).deck || {})[n]) || []; }
  slides.count = function (n) { return deckOf(n).length; };

  function clean(md) {
    return String(md || '').replace(/\[([^\]]+)\]\((?:ref:)?[^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
  }
  function sentences(text) {
    var t = clean(text).replace(/^[^.:]{2,60}[.:]\s+(?=[A-ZÁÉÍÓÚÑ¿«])/, function (m) { return /^(Explicación|Demo|Actividad|Taller|Discusión)/.test(m) ? '' : m; });
    var out = [], cur = '';
    t.split(/(?<=[.!?»])\s+(?=[A-ZÁÉÍÓÚÑ¿«])/).forEach(function (s) { out.push(s.trim()); });
    void cur;
    return out.filter(Boolean);
  }
  function partFor(n, key) {
    var S = (NS.data.sesiones || {})[n];
    if (!S) return null;
    return S.parts.filter(function (p) { return p.title.indexOf(key) === 0; })[0] || null;
  }
  function agendaRow(n, title) {
    var sched = (NS.data.schedule || [])[n - 1] || { agenda: [] };
    var t = title.replace(/^[A-E]\.\s*/, '');
    var hit = null;
    sched.agenda.forEach(function (r) {
      var b = r.block.replace(/^[A-E]\.\s*/, '');
      if (!hit && (b === title || b.indexOf(t) === 0 || t.indexOf(b) === 0 || (title.match(/^\d\.\d/) && b.indexOf(title.slice(0, 3)) === 0))) hit = r;
    });
    if (!hit && /^Presentaciones/.test(title)) hit = sched.agenda.filter(function (r) { return /Presentaciones/.test(r.block); })[0] || null;
    if (!hit && /^Pausa/.test(title)) hit = sched.agenda.filter(function (r) { return /^Pausa/.test(r.block); })[0] || null;
    return hit;
  }

  // three to five short points, transcribed
  function pointsFor(n, sl) {
    var pts = [];
    // a point is a whole sentence of five words or more, never a heading, a label or a figure title
    var push = function (s) {
      if (!s || pts.length >= 4 || pts.indexOf(s) >= 0) return;
      if (s.length < 30 || s.split(/\s+/).length < 5 || /:$/.test(s) || /^Figura:/.test(s)) return;
      pts.push(s);
    };
    if (sl.agenda) {
      var row = agendaRow(n, sl.agenda);
      if (row) push(clean(row.dynamic) + '.');
      var S = NS.data.sesiones[n];
      (S.intro || []).forEach(function (b) { sentences(b.text || '').slice(0, 2).forEach(push); });
      return pts;
    }
    var part = partFor(n, sl.topic);
    if (!part) return pts;
    var blocks = part.blocks || [];
    if (NS.ui.splitTopic && part.implications) {
      var sp = NS.ui.splitTopic(part);
      blocks = sl.practice ? sp.practice : sp.explain;
    }
    blocks.forEach(function (b) {
      if (b.type === 'p') { var ss = sentences(b.text); var short = ss.filter(function (x) { return x.length <= 170; }); push(short[0] || ss[0]); }
      else if (b.type === 'ol' || b.type === 'ul') b.items.forEach(function (it) { var ss = sentences(it); push(ss[0]); });
    });
    return pts;
  }

  function notesFor(n, sl) {
    var S = NS.data.sesiones[n];
    var notes = S.parts.filter(function (p) { return /^Notas para el docente/.test(p.title); })[0];
    var items = [];
    if (notes) notes.blocks.forEach(function (b) { (b.items || [b.text]).forEach(function (x) { if (x) items.push(x); }); });
    var axes = [];
    var part = sl.topic ? partFor(n, sl.topic) : null;
    if (part && part.implications) part.implications.forEach(function (imp) { (imp.axes || []).forEach(function (a) { if (axes.indexOf(a) < 0) axes.push(a); }); });
    return { items: items, axes: axes };
  }

  function chapterFor(ref) {
    if (!ref) return null;
    var parts = ref.split(':');
    var v = NS.engine.player.videoById(parts[0]);
    if (!v) return null;
    var idx = -1;
    v.scenes.forEach(function (s, i) { if (s.id === parts[1]) idx = i; });
    if (idx < 0) return null;
    var ch = null;
    (v.chapters || []).forEach(function (c, k) {
      var ci = -1; v.scenes.forEach(function (s, i) { if (s.id === c.from) ci = i; });
      if (ci >= 0 && ci <= idx) ch = { video: v.id, index: k, title: c.title };
    });
    return ch;
  }

  slides.list = function (n) {
    return deckOf(n).map(function (sl, i) {
      var row = sl.pause ? agendaRow(n, 'Pausa') : agendaRow(n, sl.agenda || sl.title);
      return {
        n: n, k: i + 1, id: sl.id, title: sl.title, pause: !!sl.pause, figs: sl.figs || [], scenes: sl.scenes || [], stamp: sl.stamp || null,
        points: sl.pause ? [] : pointsFor(n, sl), footer: row ? clean(row.dynamic) : '', minutes: row ? row.minutes : '',
        notes: notesFor(n, sl), chapter: chapterFor((sl.scenes || [])[0])
      };
    });
  };

  function sceneImage(ref) {
    if (images[ref]) return images[ref];
    var parts = ref.split(':');
    var video = NS.engine.player.videoById(parts[0]);
    if (!video) return null;
    var idx = -1;
    video.scenes.forEach(function (s, i) { if (s.id === parts[1]) idx = i; });
    if (idx < 0) return null;
    var c = NS.engine.layers.canvas(1280, 720), g = c.getContext('2d');
    try {
      var r = new NS.engine.player.Renderer(video, {});
      var castW = {};
      (NS.data.cast || []).forEach(function (cc) { castW[cc.id] = { wordsPerSecond: cc.wordsPerSecond || 2.4 }; });
      var tl = NS.engine.timeline.build(video, { cast: castW, manifest: (NS.audioManifest || {})[video.id] || null });
      r.setup();
      var tsc = tl.scenes[idx];
      r.drawScene(g, idx, NS.engine.timeline.state(tl, tsc.end - 0.05).s, tsc.end - 0.05);
    } catch (e) { console.error(e); }
    images[ref] = c;
    return c;
  }

  slides.render = function (ctx, key, o) {
    o = o || {};
    var S = NS.style, C = NS.course;
    var nk = String(key).split('-');
    var n = parseInt(nk[0], 10), k = parseInt(nk[1] || '1', 10);
    var list = slides.list(n);
    var sl = list[k - 1];
    if (!sl) return null;
    if (sl.pause) {
      S.background(ctx, 'title', { W: 1280, H: 720, seed: 4 });
      var P = NS.data.widgets.pauseSlide;
      S.title(ctx, P.title, { x: 640, y: 300, size: 64, align: 'center', maxWidth: 1100, seed: 7 });
      var left = Math.max(0, P.minutes * 60 - (o.t || 0));
      S.text(ctx, U.clock(left), 640, 470, { size: 120, weight: 700, align: 'center' });
      return sl;
    }
    S.background(ctx, 'explain', { W: 1280, H: 720, seed: k + 2 });
    S.title(ctx, sl.title, { x: 60, y: 92, size: sl.title.length > 34 ? 38 : 46, maxWidth: 1160, seed: k + 5 });
    // points (left)
    var hasVisual = sl.scenes.length || sl.figs.length;
    var colW = hasVisual ? 540 : 1120;
    var y = 170;
    sl.points.forEach(function (pt, i) {
      S.sign(ctx, 'star', { x: 78, y: y - 8, r: 9, seed: 20 + i, colorCenter: i % 2 ? 'accent-1' : 'accent-2' });
      var t = S.text(ctx, pt, 100, y, { size: 25, weight: 500, maxWidth: colW - 50, lineHeight: 1.28, maxLines: 4 });
      y += t.height + 16;
    });
    // visual (right): the course-sign diagram, or up to two figure cards
    if (sl.scenes.length) {
      var img = sceneImage(sl.scenes[0]);
      if (img) {
        var bx = 640, by = 150, bw = 590, bh = 332;
        ctx.drawImage(img, bx, by, bw, bh);
        S.stroke(ctx, S.path.rect(bx, by, bw, bh, 10), { weight: 'regular', closed: true, taper: false, seed: 3 });
      }
      if (sl.figs.length && y < 470) NS.engine.cards.figure(ctx, sl.figs[0], { x: 60, y: Math.max(y, 400), w: 540, h: 230 }, { p: 1, size: 19 });
    } else if (sl.figs.length) {
      NS.engine.cards.figure(ctx, sl.figs[0], { x: 640, y: 150, w: 590, h: 230 }, { p: 1, size: 20 });
      if (sl.figs[1]) NS.engine.cards.figure(ctx, sl.figs[1], { x: 640, y: 400, w: 590, h: 220 }, { p: 1, size: 19 });
    }
    if (sl.stamp) C.stamp(ctx, sl.stamp, { x: 340, y: 470, r: 120 });
    // footer: «Dinámica en línea»
    if (sl.footer) {
      S.stroke(ctx, [[60, 640], [1220, 641]], { weight: 'thin', taper: false, seed: 9 });
      S.text(ctx, (sl.minutes ? sl.minutes + ' min · ' : '') + sl.footer, 60, 676, { size: 19, weight: 600, role: 'ink-soft', maxWidth: 1100, maxLines: 1 });
    }
    S.text(ctx, k + ' / ' + list.length, 1220, 702, { size: 15, align: 'right', role: 'ink-soft' });
    return sl;
  };
})(window.IAHI);
