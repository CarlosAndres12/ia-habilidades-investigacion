/* STYLE · Miró — the style test sheet (base §1.6), two 1280×720 pages (index.html?render=estilo).
   Page 1: roles with measured contrast, legend slots with their ink outline, sign and label, every
   mark at p = 0.5 and 1, pattern fills. Page 2: a person in three poses and a vignette, the lamp
   beside a person, one background per scene type plus hero and card, a figure card and an exact bar
   chart, a display title and a subtitle band with a speaker label. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path;

  function lum(hex) {
    var c = S.hexToRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }
  S.contrast = contrast;

  function small(ctx, text, x, y, o) { S.text(ctx, text, x, y, Object.assign({ size: 13, weight: 700 }, o || {})); }

  function page1(ctx, W, H) {
    S.background(ctx, 'explain', { W: W, H: H, seed: 1 });
    S.title(ctx, 'Hoja de estilo · Miró', { x: 40, y: 56, size: 38, seed: 3 });
    var roles = S.tokens.roles, names = Object.keys(roles);
    var g = roles.ground;
    names.forEach(function (n, i) {
      var col = i % 9, row = Math.floor(i / 9);
      var x = 40 + col * 136, y = 90 + row * 74;
      ctx.fillStyle = roles[n]; ctx.fillRect(x, y, 40, 40);
      ctx.strokeStyle = roles.ink; ctx.lineWidth = 1; ctx.strokeRect(x, y, 40, 40);
      small(ctx, n, x + 46, y + 14);
      var ref = (n === 'on-dark') ? roles.dark : g;
      small(ctx, contrast(roles[n], ref).toFixed(2) + ':1', x + 46, y + 32, { weight: 500, role: 'ink-soft' });
    });
    // legend slots
    var ly = 330;
    S.text(ctx, 'Leyenda (orden del estilo)', 40, ly, { size: 18, weight: 700 });
    var items = NS.data.legend || [];
    var lx = 40;
    items.forEach(function (it) {
      var r = NS.course.pictos.legendChip(ctx, it.id, lx, ly + 34, { size: 15, r: 20 });
      lx += r.w + 18;
    });
    // marks at 0.5 and 1
    var my = 420;
    S.text(ctx, 'Marcas a p = 0,5 y 1', 40, my, { size: 18, weight: 700 });
    var marks = ['correct', 'retry', 'misreading', 'speaking', 'button', 'stamp', 'card', 'badge', 'divider', 'chapter'];
    marks.forEach(function (m, i) {
      [0.5, 1].forEach(function (p, k) {
        var x = 40 + i * 122, y = my + 14 + k * 70;
        var box = { x: x, y: y, w: 110, h: 60 };
        if (m === 'badge') S.mark(ctx, 'badge', { x: x, y: y + 12, w: 110, h: 30 }, { text: 'Esquema', size: 13, p: p, sign: function (c, sx, sy, r) { NS.course.pictos.draw(c, 'three-boxes', { x: sx, y: sy, r: r }); } });
        else if (m === 'stamp') S.mark(ctx, 'stamp', { x: x + 20, y: y - 6, w: 70, h: 70 }, { p: p, text: '' });
        else if (m === 'chapter') S.mark(ctx, 'chapter', { x: x, y: y - 6, w: 110, h: 40 }, { text: 'Capítulo', p: p });
        else if (m === 'divider') S.mark(ctx, 'divider', { x: x, y: y + 16, w: 110, h: 28 }, { p: p });
        else S.mark(ctx, m, box, { p: p, t: 1 });
      });
      small(ctx, m, 40 + i * 122, my + 164, { weight: 500 });
    });
    // patterns
    var py = 610;
    S.patternNames.forEach(function (n, i) {
      var x = 40 + i * 200;
      S.patternFill(ctx, n, { x: x, y: py, w: 150, h: 70 });
      ctx.strokeStyle = roles.ink; ctx.lineWidth = 2; ctx.strokeRect(x, py, 150, 70);
      small(ctx, n, x, py + 90, { weight: 500 });
    });
  }

  function page2(ctx, W, H) {
    S.background(ctx, 'explain', { W: W, H: H, seed: 2 });
    var cast = (NS.data.cast || []).filter(function (c) { return c.look; });
    var a = cast[0], b = cast[1] || cast[0], c = cast[2] || cast[0];
    S.person(ctx, a, { x: 90, y: 380, scale: 0.72, pose: 'standing', t: 0.3 });
    S.person(ctx, b, { x: 210, y: 380, scale: 0.72, pose: 'pointing', t: 0.3 });
    S.person(ctx, c, { x: 350, y: 380, scale: 0.72, pose: 'seated', t: 0.3 });
    S.vignette(ctx, a, { x: 470, y: 300, r: 50, speaking: true, t: 0.5 });
    // the two manners side by side
    S.person(ctx, cast[3] || a, { x: 600, y: 380, scale: 0.72, pose: 'presenting', t: 0.3 });
    S.machineArea(ctx, 650, 190, 170, 190);
    S.machine(ctx, 'lamp', { x: 735, y: 285, r: 50, t: 1.2 });
    // backgrounds
    var types = ['title', 'explain', 'figure', 'compare', 'dialogue', 'case', 'recap', 'hero', 'card'];
    types.forEach(function (t, i) {
      var x = 860 + (i % 3) * 136, y = 30 + Math.floor(i / 3) * 96;
      var c2 = NS.engine.layers.canvas(1280, 720), g = c2.getContext('2d');
      S.background(g, t, { W: 1280, H: 720, seed: i + 1, t: 0 });
      S.ambient(g, t, 0, i + 1, [], 1280, 720);
      ctx.drawImage(c2, x, y, 124, 70);
      ctx.strokeStyle = S.tokens.roles.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, 124, 70);
      small(ctx, t, x, y + 86, { weight: 500 });
    });
    // a figure card and an exact bar chart
    var figs = NS.data.figures || [];
    // the shortest «Con matiz» figure, so the card shows every part (figure, scope, badges, source)
    var f = figs.filter(function (x) { return x.estado === 'Con matiz'; }).sort(function (a, b) { return (a.cifra + a.alcance).length - (b.cifra + b.alcance).length; })[0] || figs[0];
    if (f) NS.engine.cards.figure(ctx, f.id, { x: 30, y: 398, w: 560, h: 196 }, { p: 1, size: 19 });
    NS.engine.charts.barsH(ctx, {
      x: 540, y: 440, w: 700, labelW: 160, rowH: 28, gap: 10,
      scale: { from: 0, to: 60, step: 10, unit: 'puntos' },
      items: [{ label: 'Barra A', value: 58, valueText: '58' }, { label: 'Barra B', value: 47, valueText: '47' }, { label: 'Barra C', value: 12, valueText: '12' }]
    });
    S.title(ctx, 'Título de pantalla', { x: 860, y: 360, size: 40, seed: 5 });
    NS.engine.captions.drawBand(ctx, W, H, 'Así se ve un subtítulo con el nombre de quien habla.', a.name, 1, S);
  }

  S.testsheet = function (canvas, page) {
    var ctx = canvas.getContext('2d');
    var W = 1280, H = 720;
    ctx.save();
    if (String(page) === '2') page2(ctx, W, H); else page1(ctx, W, H);
    ctx.restore();
  };
})(window.IAHI);
