/* Props of this course (spec §3.5), drawn in the human manner by composing the style API:
   laptop, second screen, headset, notebook-logbook, pen, folder, article cards, CSV sheet, consent
   form, clipboard, open notebook, chat bubble, plant, whiteboard, video tile, and `bandera-control`
   («Punto de control humano»). Labels always come from the caller (scene texts or data).
   prop(ctx, id, o) with o = { x, y, w, h, p, seed, … } returns anchor points where useful. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;

  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 8 : r); }
  function line(ctx, pts, o) { S.stroke(ctx, pts, Object.assign({ weight: 'thin', taper: false, swell: 0.2 }, o || {})); }

  var F = {
    // an open laptop seen from the front; (x, y) is the middle of its base
    laptop: function (ctx, o) {
      var w = o.w || 200, h = w * 0.62, x = o.x - w / 2, y = o.y - h - w * 0.06, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 10), { role: 'ink', p: p, seed: o.seed || 3, weight: 'regular', offset: false, texture: false });
      S.fill(ctx, rect(x + 8, y + 8, w - 16, h - 16, 4), { role: o.screenRole || 'accent-5', p: p, offset: false, texture: o.screenRole !== 'machine-ground' });
      var base = [[x - w * 0.08, o.y], [x + w * 1.08, o.y], [x + w, y + h], [x, y + h]];
      base.closed = true;
      S.shape(ctx, base, { role: 'ink-soft', p: p, seed: (o.seed || 3) + 1, weight: 'thin', offset: false });
      return { screen: { x: x + 8, y: y + 8, w: w - 16, h: h - 16 }, top: [o.x, y] };
    },
    // a second screen on a stand
    screen: function (ctx, o) {
      var w = o.w || 240, h = o.h || w * 0.6, x = o.x - w / 2, y = o.y - h - 40, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 8), { role: 'ink', p: p, seed: o.seed || 4, offset: false, texture: false });
      S.fill(ctx, rect(x + 9, y + 9, w - 18, h - 18, 4), { role: o.screenRole || 'accent-5', p: p, offset: false, texture: o.screenRole !== 'machine-ground' });
      line(ctx, [[o.x, y + h], [o.x, o.y - 6]], { weight: 'bold', p: p });
      line(ctx, [[o.x - 40, o.y - 4], [o.x + 40, o.y - 4]], { weight: 'bold', p: p });
      return { screen: { x: x + 9, y: y + 9, w: w - 18, h: h - 18 } };
    },
    headset: function (ctx, o) {
      var r = o.r || 24, p = o.p == null ? 1 : o.p;
      S.stroke(ctx, P.arc(o.x, o.y, r, Math.PI * 1.05, Math.PI * 1.95, 18), { weight: 'bold', p: p, taper: false, seed: 4 });
      [-1, 1].forEach(function (s) { S.shape(ctx, P.ellipse(o.x + s * r * 0.95, o.y + 2, r * 0.22, r * 0.36), { role: 'accent-3', weight: 'thin', p: p, seed: 5 + s }); });
    },
    // notebook-logbook (closed, with an elastic band)
    notebook: function (ctx, o) {
      var w = o.w || 90, h = o.h || 116, x = o.x - w / 2, y = o.y - h / 2, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 6), { role: o.role || 'accent-3', p: p, seed: o.seed || 6, weight: 'regular' });
      line(ctx, [[x + w * 0.78, y + 2], [x + w * 0.78, y + h - 2]], { weight: 'thin', p: p, role: 'ink' });
    },
    pen: function (ctx, o) {
      var L = o.len || 70, a = o.angle == null ? -0.9 : o.angle, p = o.p == null ? 1 : o.p;
      var x2 = o.x + Math.cos(a) * L, y2 = o.y + Math.sin(a) * L;
      S.stroke(ctx, [[o.x, o.y], [x2, y2]], { weight: 'heavy', p: p, taper: false, swell: 0.1, role: o.role || 'accent-1' });
      S.stroke(ctx, [[o.x, o.y], [x2, y2]], { weight: 'hair', p: p, taper: false });
      S.fill(ctx, P.circle(o.x, o.y, 2.6, 10), { role: 'ink', offset: false, texture: false, p: p });
    },
    folder: function (ctx, o) {
      var w = o.w || 150, h = o.h || 110, x = o.x - w / 2, y = o.y - h / 2, p = o.p == null ? 1 : o.p;
      var back = [[x, y + 12], [x + w * 0.36, y + 12], [x + w * 0.44, y], [x + w, y], [x + w, y + h], [x, y + h]];
      back.closed = true;
      S.shape(ctx, back, { role: o.role || 'accent-6', p: p, seed: o.seed || 7, weight: 'regular' });
      if (o.open) S.shape(ctx, [[x - 8, y + 30], [x + w - 8, y + 30], [x + w, y + h], [x, y + h]], { role: 'ground-2', p: p, seed: (o.seed || 7) + 1, weight: 'thin' });
      if (o.label) S.text(ctx, o.label, o.x, y + h + 26, { size: o.size || 18, weight: 700, align: 'center', p: p, maxWidth: w + 80 });
      return { mouth: [o.x, y + 10], box: { x: x, y: y, w: w, h: h } };
    },
    // an article card: a page with a title bar and lines, no readable text unless the caller labels it
    'article-card': function (ctx, o) {
      var w = o.w || 120, h = o.h || 150, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 6), { role: 'ground', p: p, seed: o.seed || 8, weight: o.weight || 'thin', offset: false, texture: false });
      S.fill(ctx, rect(x + w * 0.1, y + h * 0.1, w * 0.8, Math.max(6, h * 0.09), 3), { role: o.barRole || 'accent-3', p: p, offset: false, texture: false });
      var n = Math.max(2, Math.floor(h / 26));
      for (var i = 0; i < n; i++) {
        var yy = y + h * 0.32 + i * (h * 0.58) / n;
        line(ctx, [[x + w * 0.1, yy], [x + w * (i === n - 1 ? 0.6 : 0.9), yy]], { weight: 'hair', p: p, seed: i + (o.seed || 8) });
      }
      if (o.label) S.text(ctx, o.label, x + w / 2, y + h + 22, { size: o.size || 16, weight: 700, align: 'center', p: p, maxWidth: w + 60 });
      if (o.check) S.stroke(ctx, [[x + w - 26, y + h - 22], [x + w - 18, y + h - 12], [x + w - 4, y + h - 34]], { weight: 'bold', p: o.check, taper: false });
    },
    // a CSV sheet: a table with column headers (labels optional)
    'csv-sheet': function (ctx, o) {
      var cols = o.cols || 4, rows = o.rows || 5, w = o.w || 220, rh = o.rh || 22, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
      var h = rh * (rows + 1);
      S.shape(ctx, rect(x, y, w, h, 4), { role: 'ground', p: p, seed: o.seed || 9, weight: 'thin', offset: false, texture: false });
      S.fill(ctx, rect(x + 2, y + 2, w - 4, rh - 2, 2), { role: 'ground-2', p: p, offset: false, texture: false });
      for (var c = 1; c < cols; c++) line(ctx, [[x + c * w / cols, y], [x + c * w / cols, y + h]], { weight: 'hair', p: p, seed: c });
      for (var r = 1; r <= rows; r++) line(ctx, [[x, y + r * rh], [x + w, y + r * rh]], { weight: 'hair', p: p, seed: r + 10 });
      (o.headers || []).forEach(function (hd, i) { S.text(ctx, hd, x + i * w / cols + 5, y + rh * 0.72, { size: Math.min(14, rh * 0.62), weight: 700, p: p, maxWidth: w / cols - 8, maxLines: 1 }); });
      return { x: x, y: y, w: w, h: h, rh: rh };
    },
    // a consent form with a clause and two boxes (labels from the caller)
    'consent-form': function (ctx, o) {
      var w = o.w || 230, h = o.h || 300, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 6), { role: 'ground', p: p, seed: o.seed || 10, weight: 'regular', offset: false, texture: false });
      if (o.title) S.text(ctx, o.title, x + 18, y + 34, { size: 17, weight: 700, p: p, maxWidth: w - 36, maxLines: 2 });
      for (var i = 0; i < 4; i++) line(ctx, [[x + 18, y + 70 + i * 24], [x + w - (i === 3 ? 90 : 18), y + 70 + i * 24]], { weight: 'hair', p: p, seed: i + 30 });
      var boxes = o.boxes || ['', ''];
      boxes.forEach(function (lb, i) {
        var by = y + h - 92 + i * 40;
        S.stroke(ctx, rect(x + 18, by, 22, 22, 3), { weight: 'thin', closed: true, p: p, taper: false });
        if (o.checked === i) S.stroke(ctx, [[x + 21, by + 11], [x + 28, by + 19], [x + 42, by - 6]], { weight: 'bold', p: p, taper: false });
        if (lb) S.text(ctx, lb, x + 50, by + 17, { size: 16, weight: 700, p: p });
      });
    },
    clipboard: function (ctx, o) {
      var w = o.w || 150, h = o.h || 200, x = o.x - w / 2, y = o.y - h / 2, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 8), { role: 'accent-8', p: p, seed: o.seed || 11, weight: 'regular' });
      S.shape(ctx, rect(x + 12, y + 18, w - 24, h - 30, 4), { role: 'ground', p: p, seed: (o.seed || 11) + 1, weight: 'thin', offset: false, texture: false });
      S.shape(ctx, rect(o.x - 26, y - 8, 52, 20, 5), { role: 'ink-soft', p: p, seed: (o.seed || 11) + 2, weight: 'thin' });
      for (var i = 0; i < (o.lines || 4); i++) line(ctx, [[x + 24, y + 50 + i * 26], [x + w - 24, y + 50 + i * 26]], { weight: 'hair', p: p, seed: i + 40 });
      if (o.signature) S.stroke(ctx, P.smooth([[x + 26, y + h - 30], [x + 50, y + h - 46], [x + 70, y + h - 28], [x + 96, y + h - 44]], 8), { weight: 'thin', p: o.signature });
      return { box: { x: x, y: y, w: w, h: h } };
    },
    // an open notebook frame (two pages and a spine)
    'open-notebook': function (ctx, o) {
      var w = o.w || 420, h = o.h || 250, x = o.x - w / 2, y = o.y - h / 2, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x - 10, y - 10, w + 20, h + 20, 14), { role: 'accent-3', p: p, seed: o.seed || 12, weight: 'regular' });
      S.fill(ctx, rect(x, y, w, h, 8), { role: 'ground', p: p, offset: false, texture: false });
      S.stroke(ctx, rect(x, y, w, h, 8), { weight: 'thin', closed: true, p: p, taper: false });
      line(ctx, [[o.x, y + 4], [o.x, y + h - 4]], { weight: 'regular', p: p });
      return { left: { x: x, y: y, w: w / 2, h: h }, right: { x: o.x, y: y, w: w / 2, h: h } };
    },
    // a chat bubble (empty unless lines > 0); tail: 'left' | 'right'
    'chat-bubble': function (ctx, o) {
      var w = o.w || 120, h = o.h || 46, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
      var a = S.appear('pop', p);
      if (a.alpha <= 0) return;
      ctx.save(); ctx.globalAlpha *= a.alpha;
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(a.scale, a.scale); ctx.translate(-(x + w / 2), -(y + h / 2));
      var body = rect(x, y, w, h, Math.min(18, h / 2));
      S.fill(ctx, body, { role: o.role || 'ground', offset: false, texture: false });
      S.stroke(ctx, body, { weight: 'thin', closed: true, taper: false, seed: o.seed || 13 });
      var tx = o.tail === 'right' ? x + w - 18 : x + 18;
      S.stroke(ctx, [[tx, y + h - 2], [tx + (o.tail === 'right' ? 10 : -10), y + h + 12], [tx + (o.tail === 'right' ? -6 : 6), y + h - 1]], { weight: 'thin', taper: false });
      for (var i = 0; i < (o.lines || 0); i++) line(ctx, [[x + 14, y + 16 + i * 12], [x + w - (i === o.lines - 1 ? w * 0.4 : 14), y + 16 + i * 12]], { weight: 'hair', seed: i + 50 });
      if (o.text) S.text(ctx, o.text, x + 14, y + h / 2 + 6, { size: o.size || 17, weight: 600, maxWidth: w - 28, maxLines: o.maxLines || 3 });
      ctx.restore();
    },
    plant: function (ctx, o) {
      var p = o.p == null ? 1 : o.p, s = o.s || 1;
      S.shape(ctx, [[o.x - 22 * s, o.y - 40 * s], [o.x + 22 * s, o.y - 40 * s], [o.x + 16 * s, o.y], [o.x - 16 * s, o.y]], { role: 'accent-7', p: p, seed: 14, weight: 'thin' });
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + (i - 2) * 0.42;
        var tip = [o.x + Math.cos(a) * 62 * s, o.y - 40 * s + Math.sin(a) * 62 * s];
        S.shape(ctx, P.smooth([[o.x, o.y - 40 * s], [(o.x + tip[0]) / 2 - 10 * s, (o.y - 40 * s + tip[1]) / 2], tip, [(o.x + tip[0]) / 2 + 10 * s, (o.y - 40 * s + tip[1]) / 2]], 6, true), { role: 'accent-4', p: E.segment(p, i * 0.1, 0.6 + i * 0.08), seed: 15 + i, weight: 'thin' });
      }
    },
    whiteboard: function (ctx, o) {
      var w = o.w || 520, h = o.h || 300, x = o.x, y = o.y, p = o.p == null ? 1 : o.p;
      S.shape(ctx, rect(x, y, w, h, 6), { role: 'ground', p: p, seed: o.seed || 16, weight: 'bold', offset: false, texture: false });
      line(ctx, [[x + 30, y + h + 10], [x + w - 30, y + h + 10]], { weight: 'regular', p: p });
      return { x: x + 20, y: y + 20, w: w - 40, h: h - 40 };
    },
    // a video-call tile with one person (cast entry or extra look) or a camera-off silhouette sign
    tile: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w || 200, h = o.h || 130, p = o.p == null ? 1 : o.p;
      var box = rect(x, y, w, h, 10);
      S.fill(ctx, box, { role: o.ground || 'ground-2', p: p, offset: false, texture: false });
      if (p > 0.3) {
        ctx.save();
        P.trace(ctx, box, true); ctx.clip();
        if (o.cameraOff) {
          var R = h * 0.17;
          S.stroke(ctx, P.circle(x + w / 2, y + h * 0.42, R, 30), { weight: 'thin', closed: true, taper: false, p: E.segment(p, 0.3, 1), role: 'ink-soft' });
          S.stroke(ctx, P.arc(x + w / 2, y + h * 0.42 + R * 3.1, R * 1.9, Math.PI * 1.15, Math.PI * 1.85, 20), { weight: 'thin', taper: false, p: E.segment(p, 0.3, 1), role: 'ink-soft' });
        } else if (o.person) {
          S.person(ctx, o.person, { x: x + w / 2, y: y + h * 0.66, scale: h / 190, vignette: true, p: E.segment(p, 0.3, 1), t: o.t });
          if (o.prop === 'rubric') F['article-card'](ctx, { x: x + w * 0.72, y: y + h * 0.5, w: w * 0.22, h: h * 0.4, seed: 3, p: E.segment(p, 0.5, 1), barRole: 'accent-1' });   // held low, beside the face
          if (o.prop === 'headset') F.headset(ctx, { x: x + w / 2, y: y + h * 0.32, r: h * 0.2, p: p });
        }
        ctx.restore();
      }
      S.stroke(ctx, P.wobble(box, o.seed || 17, 1), { weight: o.active ? 'bold' : 'regular', closed: true, taper: false, p: p, seed: o.seed || 17 });
      if (o.label) S.text(ctx, o.label, x + 10, y + h - 10, { size: 15, weight: 700, p: p });
      return { x: x, y: y, w: w, h: h };
    },
    // `bandera-control`: a small flag on a post labeled «Punto de control humano» (label from data)
    'bandera-control': function (ctx, o) {
      var s = o.s || 1, p = o.p == null ? 1 : o.p;
      var label = o.label == null ? ((NS.data.rotulos || {}).banderaControl || '') : o.label;
      S.stroke(ctx, [[o.x, o.y], [o.x + 1, o.y - 92 * s]], { weight: 'regular', p: E.segment(p, 0, 0.5), taper: false, dot: false });
      var flag = P.smooth([[o.x + 2, o.y - 92 * s], [o.x + 36 * s, o.y - 86 * s], [o.x + 62 * s, o.y - 80 * s], [o.x + 34 * s, o.y - 70 * s], [o.x + 2, o.y - 64 * s]], 5);
      flag.closed = true;
      S.shape(ctx, flag, { role: 'accent-1', p: E.segment(p, 0.3, 1), seed: 18, weight: 'thin' });
      S.fill(ctx, P.ellipse(o.x, o.y + 2, 18 * s, 5 * s), { role: 'ink', offset: false, texture: false, p: p });
      if (label && o.showLabel !== false) S.text(ctx, label, o.x + (o.labelDx == null ? 0 : o.labelDx), o.y + 26 * s, { size: o.size || 16, weight: 700, align: o.align || 'center', p: E.segment(p, 0.5, 1), maxWidth: o.maxWidth || 190 });
      return { top: [o.x, o.y - 92 * s] };
    },
    // a stack of document cards (data, training corpus)
    'card-stack': function (ctx, o) {
      var n = o.n || 6, w = o.w || 120, h = o.h || 80, p = o.p == null ? 1 : o.p;
      for (var i = n - 1; i >= 0; i--) {
        var q = E.segment(p, (n - 1 - i) / n * 0.6, (n - 1 - i) / n * 0.6 + 0.4);
        if (q <= 0) continue;
        F['article-card'](ctx, { x: o.x - w / 2 + i * 6, y: o.y - h - i * 10, w: w, h: h, p: q, seed: i + 20, barRole: ['accent-1', 'accent-2', 'accent-3'][i % 3] });
      }
    }
  };

  NS.course.prop = function (ctx, id, o) {
    var fn = F[id];
    if (!fn) return null;
    ctx.save();
    var out = fn(ctx, o || {});
    ctx.restore();
    return out;
  };
  NS.course.propIds = Object.keys(F);
})(window.IAHI);
