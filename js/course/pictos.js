/* Course pictograms (spec §3.1–§3.2): legend signs, badge signs and stamp signs.
   Built only from the style API (stroke, fill, path), so another style re-skins them.
   draw(ctx, name, {x, y, r, p}) draws centered at (x, y) inside radius r.
   dataURL(name, px) renders one to an image for the HTML page (cached). */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;

  function st(ctx, pts, o, w) { S.stroke(ctx, pts, Object.assign({ weight: w || 'thin', taper: false, swell: 0.25 }, o)); }
  function circ(x, y, r) { return P.circle(x, y, r, 32); }

  var D = {
    // ---------------- legend signs (spec §3.1)
    target: function (ctx, x, y, r, o) {
      st(ctx, circ(x, y, r * 0.95), o, 'regular');
      st(ctx, circ(x, y, r * 0.6), o);
      S.fill(ctx, circ(x, y, r * 0.24), { role: 'ink', offset: false, texture: false, p: o.p });
      st(ctx, [[x + r * 1.05, y - r * 1.05], [x + r * 0.15, y - r * 0.15]], o, 'regular');
      st(ctx, [[x + r * 1.05, y - r * 1.05], [x + r * 0.7, y - r * 1.05]], o);
      st(ctx, [[x + r * 1.05, y - r * 1.05], [x + r * 1.05, y - r * 0.7]], o);
    },
    'sheets-cycle': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.95, y - r * 0.75, r * 0.8, r * 1.1, 3), Object.assign({ closed: true }, o));
      st(ctx, P.rect(x + r * 0.15, y - r * 0.75, r * 0.8, r * 1.1, 3), Object.assign({ closed: true }, o));
      st(ctx, P.arc(x, y + r * 0.3, r * 0.6, 0.2, Math.PI - 0.2, 14), o);
      st(ctx, [[x - r * 0.55, y + r * 0.55], [x - r * 0.6, y + r * 0.3]], o);
    },
    window: function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.5, y - r * 0.8, r, r * 1.5, 2), Object.assign({ closed: true }, o), 'regular');
      st(ctx, [[x, y - r * 0.8], [x, y + r * 0.7]], o);
      st(ctx, [[x - r * 0.5, y - r * 0.8], [x - r * 1.05, y - r * 0.55], [x - r * 1.05, y + r * 0.9], [x - r * 0.5, y + r * 0.7]], o);
      st(ctx, [[x + r * 0.5, y - r * 0.8], [x + r * 1.05, y - r * 0.55], [x + r * 1.05, y + r * 0.9], [x + r * 0.5, y + r * 0.7]], o);
    },
    padlock: function (ctx, x, y, r, o) {
      st(ctx, P.arc(x, y - r * 0.15, r * 0.45, Math.PI, 0, 16), o, 'regular');
      st(ctx, [[x - r * 0.45, y - r * 0.15], [x - r * 0.45, y + r * 0.05]], o, 'regular');
      st(ctx, [[x + r * 0.45, y - r * 0.15], [x + r * 0.45, y + r * 0.05]], o, 'regular');
      S.shape(ctx, P.rect(x - r * 0.75, y, r * 1.5, r * 0.95, 4), { role: 'ink', weight: 'thin', p: o.p, offset: false });
      S.fill(ctx, circ(x, y + r * 0.42, r * 0.13), { role: 'ground', offset: false, texture: false, p: o.p });
    },
    'magnifier-check': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.95, y - r * 0.85, r * 1.15, r * 1.5, 2), Object.assign({ closed: true }, o));
      st(ctx, [[x - r * 0.7, y - r * 0.35], [x - r * 0.45, y - r * 0.1], [x - r * 0.05, y - r * 0.6]], o);
      st(ctx, circ(x + r * 0.35, y + r * 0.2, r * 0.42), Object.assign({ closed: true }, o), 'regular');
      st(ctx, [[x + r * 0.65, y + r * 0.5], [x + r * 1.05, y + r * 0.95]], o, 'bold');
    },
    scale: function (ctx, x, y, r, o) {
      st(ctx, [[x, y - r * 0.9], [x, y + r * 0.8]], o, 'regular');
      st(ctx, [[x - r * 0.6, y + r * 0.85], [x + r * 0.6, y + r * 0.85]], o, 'regular');
      st(ctx, [[x - r * 0.95, y - r * 0.55], [x + r * 0.95, y - r * 0.55]], o, 'regular');
      [-1, 1].forEach(function (s) {
        st(ctx, [[x + s * r * 0.85, y - r * 0.55], [x + s * r * 0.6, y + r * 0.05]], o);
        st(ctx, [[x + s * r * 0.85, y - r * 0.55], [x + s * r * 1.1, y + r * 0.05]], o);
        st(ctx, P.arc(x + s * r * 0.85, y + r * 0.05, r * 0.27, 0, Math.PI, 10), o);
      });
    },
    // ---------------- badge signs (spec §3.2)
    journal: function (ctx, x, y, r, o) {
      st(ctx, [[x, y - r * 0.6], [x, y + r * 0.7]], o);
      st(ctx, [[x, y - r * 0.6], [x - r * 0.9, y - r * 0.75], [x - r * 0.9, y + r * 0.55], [x, y + r * 0.7], [x + r * 0.9, y + r * 0.55], [x + r * 0.9, y - r * 0.75], [x, y - r * 0.6]], o);
      S.text(ctx, '“', x + r * 0.45, y + r * 0.35, { size: Math.round(r * 1.2), weight: 700 });
    },
    'two-groups': function (ctx, x, y, r, o) {
      st(ctx, [[x, y - r * 0.9], [x, y + r * 0.9]], o);
      for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) {
        S.fill(ctx, circ(x - r * 0.75 + j * r * 0.4, y - r * 0.5 + i * r * 0.5, r * 0.12), { role: 'ink', offset: false, texture: false, p: o.p });
        st(ctx, circ(x + r * 0.35 + j * r * 0.4, y - r * 0.5 + i * r * 0.5, r * 0.12), Object.assign({ closed: true }, o), 'hair');
      }
    },
    paperclip: function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.7, y - r * 0.85, r * 1.4, r * 1.7, 2), Object.assign({ closed: true }, o));
      st(ctx, P.smooth([[x + r * 0.35, y - r * 1.05], [x + r * 0.35, y + r * 0.1], [x + r * 0.6, y + r * 0.1], [x + r * 0.6, y - r * 0.8]], 6), o, 'regular');
      for (var k = 0; k < 3; k++) st(ctx, [[x - r * 0.45, y - r * 0.35 + k * r * 0.35], [x + r * 0.15, y - r * 0.35 + k * r * 0.35]], o, 'hair');
    },
    'folded-page': function (ctx, x, y, r, o) {
      st(ctx, [[x - r * 0.7, y - r * 0.85], [x + r * 0.3, y - r * 0.85], [x + r * 0.7, y - r * 0.45], [x + r * 0.7, y + r * 0.85], [x - r * 0.7, y + r * 0.85], [x - r * 0.7, y - r * 0.85]], o);
      st(ctx, [[x + r * 0.3, y - r * 0.85], [x + r * 0.3, y - r * 0.45], [x + r * 0.7, y - r * 0.45]], o, 'hair');
    },
    hourglass: function (ctx, x, y, r, o) {
      st(ctx, [[x - r * 0.6, y - r * 0.85], [x + r * 0.6, y - r * 0.85]], o, 'regular');
      st(ctx, [[x - r * 0.6, y + r * 0.85], [x + r * 0.6, y + r * 0.85]], o, 'regular');
      st(ctx, [[x - r * 0.5, y - r * 0.85], [x + r * 0.5, y + r * 0.85]], o);
      st(ctx, [[x + r * 0.5, y - r * 0.85], [x - r * 0.5, y + r * 0.85]], o);
      S.fill(ctx, [[x - r * 0.3, y + r * 0.85], [x, y + r * 0.35], [x + r * 0.3, y + r * 0.85]], { role: 'ink', offset: false, texture: false, p: o.p });
    },
    'horizon-arrow': function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y + r * 0.6], [x + r, y + r * 0.6]], o);
      st(ctx, [[x - r * 0.8, y + r * 0.35], [x + r * 0.6, y - r * 0.7]], o, 'regular');
      st(ctx, [[x + r * 0.6, y - r * 0.7], [x + r * 0.15, y - r * 0.68]], o, 'regular');
      st(ctx, [[x + r * 0.6, y - r * 0.7], [x + r * 0.5, y - r * 0.25]], o, 'regular');
    },
    columns: function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y - r * 0.45], [x, y - r * 0.95], [x + r, y - r * 0.45], [x - r, y - r * 0.45]], o, 'regular');
      for (var i = 0; i < 3; i++) st(ctx, [[x - r * 0.6 + i * r * 0.6, y - r * 0.35], [x - r * 0.6 + i * r * 0.6, y + r * 0.65]], o, 'regular');
      st(ctx, [[x - r, y + r * 0.8], [x + r, y + r * 0.8]], o, 'regular');
    },
    seal: function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.85, y - r * 0.9, r * 1.3, r * 1.6, 2), Object.assign({ closed: true }, o));
      S.fill(ctx, circ(x + r * 0.45, y + r * 0.5, r * 0.42), { role: 'accent-1', offset: false, p: o.p });
      st(ctx, circ(x + r * 0.45, y + r * 0.5, r * 0.42), Object.assign({ closed: true }, o));
      for (var k = 0; k < 3; k++) st(ctx, [[x - r * 0.6, y - r * 0.55 + k * r * 0.3], [x + r * 0.2, y - r * 0.55 + k * r * 0.3]], o, 'hair');
    },
    'price-tag': function (ctx, x, y, r, o) {
      st(ctx, [[x - r * 0.9, y - r * 0.35], [x + r * 0.35, y - r * 0.35], [x + r, y], [x + r * 0.35, y + r * 0.35], [x - r * 0.9, y + r * 0.35], [x - r * 0.9, y - r * 0.35]], o);
      st(ctx, circ(x + r * 0.45, y, r * 0.09), Object.assign({ closed: true }, o), 'hair');
    },
    podium: function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y + r * 0.8], [x - r, y + r * 0.1], [x - r * 0.33, y + r * 0.1], [x - r * 0.33, y - r * 0.5], [x + r * 0.33, y - r * 0.5], [x + r * 0.33, y + r * 0.35], [x + r, y + r * 0.35], [x + r, y + r * 0.8], [x - r, y + r * 0.8]], o);
    },
    'warning-folder': function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y - r * 0.6], [x - r * 0.3, y - r * 0.6], [x - r * 0.15, y - r * 0.4], [x + r, y - r * 0.4], [x + r, y + r * 0.75], [x - r, y + r * 0.75], [x - r, y - r * 0.6]], o);
      st(ctx, [[x, y - r * 0.15], [x + r * 0.4, y + r * 0.5], [x - r * 0.4, y + r * 0.5], [x, y - r * 0.15]], o, 'hair');
    },
    'calendar-check': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.85, y - r * 0.75, r * 1.7, r * 1.6, 3), Object.assign({ closed: true }, o));
      st(ctx, [[x - r * 0.85, y - r * 0.35], [x + r * 0.85, y - r * 0.35]], o, 'hair');
      st(ctx, [[x - r * 0.4, y + r * 0.25], [x - r * 0.1, y + r * 0.55], [x + r * 0.45, y - r * 0.05]], o, 'regular');
    },
    'caret-note': function (ctx, x, y, r, o) {
      st(ctx, [[x - r * 0.9, y + r * 0.6], [x + r * 0.9, y + r * 0.6]], o);
      st(ctx, [[x - r * 0.3, y + r * 0.6], [x, y - r * 0.1], [x + r * 0.3, y + r * 0.6]], o, 'regular');
      st(ctx, P.smooth([[x - r * 0.8, y - r * 0.5], [x - r * 0.3, y - r * 0.8], [x + r * 0.2, y - r * 0.45], [x + r * 0.8, y - r * 0.75]], 6), o, 'hair');
    },
    'calendar-cycle': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.85, y - r * 0.75, r * 1.7, r * 1.6, 3), Object.assign({ closed: true }, o));
      st(ctx, P.arc(x, y + r * 0.1, r * 0.4, -0.3, Math.PI * 1.5, 18), o);
      st(ctx, [[x + r * 0.38, y - r * 0.02], [x + r * 0.42, y + r * 0.25]], o);
    },
    puzzle: function (ctx, x, y, r, o) {
      var pts = [[x - r * 0.75, y - r * 0.75], [x - r * 0.15, y - r * 0.75]];
      P.arc(x, y - r * 0.75, r * 0.18, Math.PI, 0, 8).forEach(function (q) { pts.push(q); });
      pts.push([x + r * 0.75, y - r * 0.75], [x + r * 0.75, y - r * 0.15]);
      P.arc(x + r * 0.75, y, r * 0.18, -Math.PI / 2, Math.PI / 2, 8).forEach(function (q) { pts.push(q); });
      pts.push([x + r * 0.75, y + r * 0.75], [x - r * 0.75, y + r * 0.75], [x - r * 0.75, y - r * 0.75]);
      st(ctx, pts, o);
    },
    'two-heads': function (ctx, x, y, r, o) {
      [-0.45, 0.45].forEach(function (dx, i) {
        st(ctx, circ(x + dx * r, y - r * 0.3, r * 0.3), Object.assign({ closed: true }, o));
        st(ctx, P.arc(x + dx * r, y + r * 0.6, r * 0.45, Math.PI, 0, 12), o);
      });
      S.sign(ctx, 'star', { x: x + r * 0.95, y: y - r * 0.85, r: r * 0.3, seed: 2 });
    },
    'three-boxes': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r, y - r * 0.8, r * 0.7, r * 0.55, 2), Object.assign({ closed: true }, o));
      st(ctx, P.rect(x + r * 0.3, y - r * 0.8, r * 0.7, r * 0.55, 2), Object.assign({ closed: true }, o));
      st(ctx, P.rect(x - r * 0.35, y + r * 0.3, r * 0.7, r * 0.55, 2), Object.assign({ closed: true }, o));
      st(ctx, [[x - r * 0.65, y - r * 0.25], [x - r * 0.1, y + r * 0.3]], o, 'hair');
      st(ctx, [[x + r * 0.65, y - r * 0.25], [x + r * 0.1, y + r * 0.3]], o, 'hair');
    },
    dot: function (ctx, x, y, r, o) { S.fill(ctx, circ(x, y, r * 0.3), { role: 'ink', offset: false, texture: false, p: o.p }); },
    // ---------------- stamp signs (spec §3.2)
    'tape-bracket': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r, y - r * 0.2, r * 2, r * 0.45, 2), Object.assign({ closed: true }, o));
      for (var i = 0; i < 7; i++) st(ctx, [[x - r * 0.85 + i * r * 0.28, y - r * 0.2], [x - r * 0.85 + i * r * 0.28, y + (i % 2 ? -r * 0.02 : r * 0.05)]], o, 'hair');
      st(ctx, [[x - r * 0.5, y - r * 0.55], [x - r * 0.5, y - r * 0.4], [x + r * 0.5, y - r * 0.4], [x + r * 0.5, y - r * 0.55]], o);
    },
    'box-no-recipe': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.8, y - r * 0.3, r * 1.6, r * 1.1, 2), Object.assign({ closed: true }, o));
      S.dotGrid ? null : null;
      for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) S.fill(ctx, circ(x - r * 0.5 + i * r * 0.33, y + j * r * 0.35, r * 0.07), { role: 'ink', offset: false, texture: false, p: o.p });
      st(ctx, [[x - r * 0.8, y - r * 0.3], [x - r * 0.4, y - r * 0.85]], o, 'hair');
      st(ctx, [[x + r * 0.8, y - r * 0.3], [x + r * 0.4, y - r * 0.85]], o, 'hair');
    },
    'bubble-question': function (ctx, x, y, r, o) {
      var b = P.ellipse(x, y - r * 0.15, r * 0.95, r * 0.7, 30);
      st(ctx, b, Object.assign({ closed: true }, o));
      st(ctx, [[x - r * 0.35, y + r * 0.45], [x - r * 0.55, y + r * 0.95], [x - r * 0.05, y + r * 0.52]], o);
      S.text(ctx, '?', x, y + r * 0.05, { size: Math.round(r * 1.05), weight: 700, align: 'center' });
    },
    'six-lines-card': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.8, y - r * 0.95, r * 1.6, r * 1.9, 3), Object.assign({ closed: true }, o));
      for (var k = 0; k < 6; k++) st(ctx, [[x - r * 0.55, y - r * 0.65 + k * r * 0.27], [x + r * (0.55 - (k % 2) * 0.2), y - r * 0.65 + k * r * 0.27]], o, 'hair');
    },
    'open-book': function (ctx, x, y, r, o) {
      st(ctx, [[x, y - r * 0.5], [x, y + r * 0.75]], o);
      st(ctx, P.smooth([[x, y - r * 0.5], [x - r * 0.5, y - r * 0.75], [x - r, y - r * 0.55]], 6), o);
      st(ctx, P.smooth([[x, y - r * 0.5], [x + r * 0.5, y - r * 0.75], [x + r, y - r * 0.55]], 6), o);
      st(ctx, [[x - r, y - r * 0.55], [x - r, y + r * 0.6], [x, y + r * 0.75], [x + r, y + r * 0.6], [x + r, y - r * 0.55]], o);
      if (o.bookmark !== false) S.fill(ctx, [[x + r * 0.45, y - r * 0.65], [x + r * 0.65, y - r * 0.68], [x + r * 0.65, y + r * 0.05], [x + r * 0.55, y - r * 0.08], [x + r * 0.45, y + r * 0.05]], { role: 'accent-1', offset: false, p: o.p });
      if (o.lines) for (var k = 0; k < 3; k++) { st(ctx, [[x - r * 0.8, y - r * 0.25 + k * r * 0.25], [x - r * 0.15, y - r * 0.2 + k * r * 0.25]], o, 'hair'); st(ctx, [[x + r * 0.15, y - r * 0.2 + k * r * 0.25], [x + r * 0.8, y - r * 0.25 + k * r * 0.25]], o, 'hair'); }
    },
    'reading-book': function (ctx, x, y, r, o) { D['open-book'](ctx, x, y, r, Object.assign({}, o, { bookmark: false, lines: true })); },
    'pen-signature': function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y + r * 0.7], [x + r, y + r * 0.7]], o);
      st(ctx, P.smooth([[x - r * 0.8, y + r * 0.45], [x - r * 0.4, y + r * 0.1], [x - r * 0.1, y + r * 0.5], [x + r * 0.2, y + r * 0.2]], 8), o, 'hair');
      st(ctx, [[x + r * 0.25, y + r * 0.15], [x + r * 0.95, y - r * 0.85]], o, 'bold');
    },
    'bubble-slash-bar': function (ctx, x, y, r, o) {
      st(ctx, P.ellipse(x - r * 0.35, y - r * 0.2, r * 0.6, r * 0.45, 24), Object.assign({ closed: true }, o));
      st(ctx, [[x - r * 0.85, y + r * 0.25], [x + r * 0.15, y - r * 0.65]], o, 'regular');
      st(ctx, [[x + r * 0.45, y + r * 0.85], [x + r * 1.0, y - r * 0.15]], o, 'regular');
    },
    'clipboard-signature': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.75, y - r * 0.85, r * 1.5, r * 1.8, 3), Object.assign({ closed: true }, o));
      st(ctx, P.rect(x - r * 0.3, y - r * 1.0, r * 0.6, r * 0.3, 2), Object.assign({ closed: true }, o), 'regular');
      st(ctx, [[x - r * 0.5, y + r * 0.55], [x + r * 0.5, y + r * 0.55]], o, 'hair');
      st(ctx, P.smooth([[x - r * 0.45, y + r * 0.4], [x - r * 0.15, y + r * 0.1], [x + r * 0.05, y + r * 0.42], [x + r * 0.35, y + r * 0.15]], 8), o, 'hair');
    },
    'hidden-line-page': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.75, y - r * 0.9, r * 1.5, r * 1.8, 2), Object.assign({ closed: true }, o));
      for (var k = 0; k < 4; k++) if (k !== 2) st(ctx, [[x - r * 0.5, y - r * 0.55 + k * r * 0.35], [x + r * 0.5, y - r * 0.55 + k * r * 0.35]], o, 'hair');
      st(ctx, P.rect(x - r * 0.62, y + r * 0.05, r * 1.24, r * 0.3, 2), Object.assign({ closed: true }, o), 'hair');
    },
    'open-folder': function (ctx, x, y, r, o) {
      st(ctx, [[x - r, y - r * 0.55], [x - r * 0.35, y - r * 0.55], [x - r * 0.2, y - r * 0.35], [x + r * 0.8, y - r * 0.35], [x + r * 0.8, y - r * 0.05]], o);
      st(ctx, [[x - r, y - r * 0.55], [x - r, y + r * 0.7], [x + r * 0.75, y + r * 0.7], [x + r, y - r * 0.05], [x - r * 0.65, y - r * 0.05], [x - r, y + r * 0.7]], o);
    },
    'notebook-pen': function (ctx, x, y, r, o) {
      st(ctx, P.rect(x - r * 0.85, y - r * 0.8, r * 1.2, r * 1.6, 3), Object.assign({ closed: true }, o));
      for (var k = 0; k < 4; k++) st(ctx, [[x - r * 0.6, y - r * 0.45 + k * r * 0.32], [x + r * 0.15, y - r * 0.45 + k * r * 0.32]], o, 'hair');
      st(ctx, [[x + r * 0.55, y + r * 0.75], [x + r * 0.95, y - r * 0.8]], o, 'regular');
    },
    'six-ring': function (ctx, x, y, r, o) {
      for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3; st(ctx, circ(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.22), Object.assign({ closed: true }, o)); }
    },
    'lamp-small': function (ctx, x, y, r, o) { S.machine(ctx, 'lamp', { x: x, y: y, r: r * 0.85, p: o.p == null ? 1 : o.p, still: true }); }
  };

  var STAMP_SIGNS = {
    'stamp-estimaciones': 'tape-bracket', 'stamp-pesos': 'box-no-recipe', 'stamp-plausible': 'bubble-question',
    'stamp-instruccion': 'six-lines-card', 'stamp-fuente': 'open-book', 'stamp-autora': 'pen-signature',
    'stamp-censura': 'bubble-slash-bar', 'stamp-citar': 'reading-book', 'stamp-responsabilidad': 'clipboard-signature',
    'stamp-oculto': 'hidden-line-page', 'stamp-carpeta': 'open-folder', 'stamp-interpretacion': 'notebook-pen', 'stamp-metodo': 'six-ring'
  };
  var LEGEND_SIGNS = { validez: 'target', reproducibilidad: 'sheets-cycle', transparencia: 'window', 'etica-datos': 'padlock', integridad: 'magnifier-check', equidad: 'scale' };

  function draw(ctx, name, o) {
    o = o || {};
    var fn = D[name] || D.dot;
    ctx.save();
    fn(ctx, o.x || 0, o.y || 0, o.r || 12, { p: o.p == null ? 1 : o.p, role: o.role });
    ctx.restore();
  }

  var urls = {};
  function dataURL(name, px) {
    px = px || 48;
    var key = name + '@' + px;
    if (urls[key]) return urls[key];
    try {
      var c = NS.engine.layers.canvas(px * 2, px * 2);
      var g = c.getContext('2d');
      draw(g, name, { x: px, y: px, r: px * 0.8 });
      urls[key] = c.toDataURL();
    } catch (e) { urls[key] = ''; }
    return urls[key];
  }

  // A legend item as drawn on the canvas: slot color + ink outline + sign + label.
  function legendChip(ctx, id, x, y, o) {
    o = o || {};
    var it = NS.engine.legend.item(id);
    if (!it) return { w: 0 };
    var color = NS.engine.legend.slotColor(it.slot);
    var R = o.r || 22;
    var p = o.p == null ? 1 : o.p;
    if (color) S.fill(ctx, P.circle(x + R, y, R, 36), { color: color, offset: false, texture: false, p: p });
    else S.patternFill(ctx, 'dots', { x: x, y: y - R, w: R * 2, h: R * 2 });
    S.stroke(ctx, P.circle(x + R, y, R, 36), { weight: 2.6, closed: true, taper: false, swell: 0, p: p });
    S.fill(ctx, P.circle(x + R, y, R * 0.72, 30), { role: 'ground', offset: false, texture: false, alpha: 0.9 * E.clamp(p * 2, 0, 1) });
    draw(ctx, LEGEND_SIGNS[id], { x: x + R, y: y, r: R * 0.55, p: p });
    var t = S.text(ctx, o.label === false ? '' : it.label, x + R * 2 + 10, y + 7, { size: o.size || 20, weight: 700, p: p });
    return { w: R * 2 + 14 + t.width, r: R };
  }

  NS.course.pictos = { draw: draw, dataURL: dataURL, names: Object.keys(D), stampSign: STAMP_SIGNS, legendSign: LEGEND_SIGNS, legendChip: legendChip };
})(window.IAHI);
