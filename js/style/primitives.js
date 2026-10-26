/* STYLE · Miró — drawing primitives (style S1, S2, S11).
   Black calligraphic line that swells and tapers and can end in a dot; flat gouache fields offset
   2–4 px from their outline; seeded, pre-rendered textures; calm ambient signs kept out of the
   meaning zones. Only the machine (machine.js) is ruler-straight. Every function is seeded and pure. */
(function (NS) {
  'use strict';
  var S = NS.style;
  var E = NS.engine.ease;
  var rng = NS.engine.rng;
  var role = S.role;

  // ------------------------------------------------------------------ geometry
  var P = S.path = {};
  P.dist = function (a, b) { var dx = b[0] - a[0], dy = b[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); };
  P.length = function (pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += P.dist(pts[i - 1], pts[i]); return L; };
  P.line = function (x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; };
  P.poly = function (arr) { return arr.map(function (p) { return [p[0], p[1]]; }); };
  P.arc = function (cx, cy, r, a0, a1, n) {
    n = n || Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 6));
    var out = [];
    for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return out;
  };
  P.circle = function (cx, cy, r, n) { var c = P.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, n || 56); c.closed = true; return c; };
  P.ellipse = function (cx, cy, rx, ry, n) {
    n = n || 56; var out = [];
    for (var i = 0; i <= n; i++) { var a = -Math.PI / 2 + Math.PI * 2 * i / n; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    out.closed = true; return out;
  };
  P.rect = function (x, y, w, h, r) {
    r = Math.min(r == null ? 10 : r, w / 2, h / 2);
    var out = [];
    function corner(cx, cy, a0) { P.arc(cx, cy, r, a0, a0 + Math.PI / 2, 6).forEach(function (p) { out.push(p); }); }
    out.push([x + r, y]);
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    out.push([x + r, y]);
    out.closed = true;
    return out;
  };
  // Organic, biomorphic closed shape.
  P.blob = function (cx, cy, rx, ry, seed, lobes, irr) {
    var r = rng(seed || 3);
    lobes = lobes || 5; irr = irr == null ? 0.22 : irr;
    var ph = []; for (var k = 0; k < lobes; k++) ph.push([r.range(0, Math.PI * 2), r.range(0.4, 1)]);
    var out = [], n = 64;
    for (var i = 0; i <= n; i++) {
      var a = Math.PI * 2 * i / n;
      var m = 1;
      for (var j = 0; j < lobes; j++) m += irr * ph[j][1] * Math.sin(a * (j + 2) + ph[j][0]) / (j + 1.4);
      out.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
    }
    out.closed = true;
    return out;
  };
  P.spiral = function (cx, cy, r, turns, n) {
    turns = turns || 2.2; n = n || 80; var out = [];
    for (var i = 0; i <= n; i++) { var u = i / n; var a = u * turns * Math.PI * 2; var rr = r * u; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return out;
  };
  P.resample = function (pts, step) {
    if (pts.length < 2) return pts.slice();
    var out = [pts[0]];
    var acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var d = P.dist(a, b);
      if (d === 0) continue;
      var t = (step - acc) / d;
      while (t <= 1) {
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        t += step / d;
      }
      acc = (acc + d) % step;
    }
    var last = pts[pts.length - 1];
    if (P.dist(out[out.length - 1], last) > 0.5) out.push(last);
    out.closed = pts.closed;
    return out;
  };
  // Catmull–Rom smoothing through control points.
  P.smooth = function (pts, seg, closed) {
    seg = seg || 10;
    var n = pts.length;
    if (n < 3) return pts.slice();
    var out = [];
    function get(i) { if (closed) return pts[(i + n) % n]; return pts[Math.max(0, Math.min(n - 1, i))]; }
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (var k = 0; k < seg; k++) {
        var t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(closed ? out[0] : pts[n - 1]);
    out.closed = closed;
    return out;
  };
  // Slight hand imperfection along the normal (amplitude in px, low frequency, seeded).
  P.wobble = function (pts, seed, amp, freq) {
    var r = rng(seed || 11);
    amp = amp == null ? 1.6 : amp; freq = freq || 0.035;
    var ph1 = r.range(0, 6.28), ph2 = r.range(0, 6.28);
    var res = P.resample(pts, 4);
    var s = 0;
    var out = res.map(function (p, i) {
      if (i > 0) s += P.dist(res[i - 1], p);
      var a = res[Math.min(i + 1, res.length - 1)], b = res[Math.max(i - 1, 0)];
      var dx = a[0] - b[0], dy = a[1] - b[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / d, ny = dx / d;
      var o = amp * (Math.sin(s * freq + ph1) * 0.7 + Math.sin(s * freq * 2.3 + ph2) * 0.3);
      return [p[0] + nx * o, p[1] + ny * o];
    });
    out.closed = pts.closed;
    return out;
  };
  P.partial = function (pts, p) {
    if (p >= 1) return pts;
    if (p <= 0) return [pts[0]];
    var L = P.length(pts) * p, acc = 0, out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var d = P.dist(pts[i - 1], pts[i]);
      if (acc + d >= L) {
        var t = (L - acc) / d;
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
        return out;
      }
      acc += d; out.push(pts[i]);
    }
    return out;
  };
  P.translate = function (pts, dx, dy) { var o = pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); o.closed = pts.closed; return o; };
  P.bbox = function (pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  };
  function trace(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }
  P.trace = trace;

  // value noise along a parameter (seeded)
  function noise1(seed) {
    var r = rng(seed);
    var v = []; for (var i = 0; i < 64; i++) v.push(r() * 2 - 1);
    return function (x) {
      var i = Math.floor(x), f = x - i, a = v[((i % 64) + 64) % 64], b = v[(((i + 1) % 64) + 64) % 64];
      var u = f * f * (3 - 2 * f);
      return a + (b - a) * u;
    };
  }

  // ------------------------------------------------------------------ calligraphic stroke
  var WEIGHTS = { hair: 1.1, thin: 1.8, regular: 3.2, bold: 5.4, heavy: 7.5 };
  S.stroke = function (ctx, pts, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0 || !pts || pts.length < 2) return;
    var base = typeof o.weight === 'number' ? o.weight : (WEIGHTS[o.weight || 'regular'] || 3.2);
    var closed = o.closed != null ? o.closed : !!pts.closed;
    // a closed outline always draws its last side back to the first point
    if (closed && P.dist(pts[0], pts[pts.length - 1]) > 0.5) { pts = pts.concat([pts[0]]); }
    var path = P.resample(pts, o.step || 2.5);
    if (path.length < 2) return;
    var nz = noise1((o.seed || 1) * 7 + 3);
    var L = 0, cum = [0];
    for (var i = 1; i < path.length; i++) { L += P.dist(path[i - 1], path[i]); cum.push(L); }
    var cut = L * E.clamp(p, 0, 1);
    var left = [], right = [];
    var taper = o.taper !== false && !closed;
    var swell = o.swell == null ? 0.42 : o.swell;
    for (var k = 0; k < path.length; k++) {
      var s = cum[k];
      var pt = path[k];
      if (s > cut) {
        // interpolate the exact end point
        var a = path[k - 1], t = (cut - cum[k - 1]) / Math.max(1e-6, s - cum[k - 1]);
        pt = [a[0] + (pt[0] - a[0]) * t, a[1] + (pt[1] - a[1]) * t];
        s = cut;
      }
      var u = L > 0 ? s / L : 0;
      var w = base * (1 - swell + swell * Math.sin(Math.PI * E.clamp(u, 0, 1)));
      if (taper) w *= E.clamp(Math.min(u, 1 - u) * 9 + 0.35, 0.35, 1);
      w *= 1 + 0.16 * nz(s * 0.025);
      var nb = path[Math.min(k + 1, path.length - 1)], pb = path[Math.max(k - 1, 0)];
      var dx = nb[0] - pb[0], dy = nb[1] - pb[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / d * w / 2, ny = dx / d * w / 2;
      left.push([pt[0] + nx, pt[1] + ny]);
      right.push([pt[0] - nx, pt[1] - ny]);
      if (s >= cut) break;
    }
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = o.color || role(o.role || 'ink');
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (var a1 = 1; a1 < left.length; a1++) ctx.lineTo(left[a1][0], left[a1][1]);
    for (var b1 = right.length - 1; b1 >= 0; b1--) ctx.lineTo(right[b1][0], right[b1][1]);
    ctx.closePath();
    ctx.fill();
    // round caps so joints never look cut
    var head = path[0];
    ctx.beginPath(); ctx.arc(head[0], head[1], Math.max(0.6, base * (taper ? 0.18 : 0.5)), 0, Math.PI * 2); ctx.fill();
    if (o.dot && p >= 0.98) {
      var end = path[path.length - 1];
      ctx.beginPath(); ctx.arc(end[0], end[1], base * 1.05 + 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (o.second && p > 0.2) {
      // the occasional thin second stroke beside a thick one
      S.stroke(ctx, P.translate(pts, base * 1.6, base * 1.2), { weight: 'hair', role: o.role, p: E.segment(p, 0.2, 1), seed: (o.seed || 1) + 5, alpha: 0.85 });
    }
  };

  // ------------------------------------------------------------------ textures (pre-rendered, seeded)
  S.texture = function (kind, w, h, seed) {
    var key = 'tex:' + kind + ':' + w + 'x' + h + ':' + (seed || 1);
    return NS.engine.layers.shared.get(key, function () {
      var c = NS.engine.layers.canvas(w, h);
      var g = c.getContext('2d');
      var r = rng(seed || 1);
      var i;
      if (kind === 'paper') {
        g.fillStyle = role('ground'); g.fillRect(0, 0, w, h);
        for (i = 0; i < w * h / 26; i++) {
          g.fillStyle = r() < 0.6 ? role('ink', r.range(0.025, 0.06)) : role('on-dark', r.range(0.25, 0.5));
          g.fillRect(r() * w, r() * h, r.range(0.6, 1.6), r.range(0.6, 1.6));
        }
        for (i = 0; i < 14; i++) {
          g.fillStyle = role('ground-2', r.range(0.05, 0.12));
          g.beginPath(); g.ellipse(r() * w, r() * h, r.range(40, 160), r.range(30, 110), r() * 3, 0, Math.PI * 2); g.fill();
        }
      } else if (kind === 'gouache') {
        for (i = 0; i < 90; i++) {
          var y = r() * h, x = r() * w;
          g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,' + r.range(0.08, 0.2).toFixed(2) + ')' : 'rgba(0,0,0,' + r.range(0.05, 0.12).toFixed(2) + ')';
          g.lineWidth = r.range(1, 4);
          g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y + r.range(-6, 6), x + 60, y + r.range(-6, 6), x + r.range(60, 140), y + r.range(-8, 8)); g.stroke();
        }
      } else if (kind === 'spatter') {
        for (i = 0; i < 70; i++) {
          g.fillStyle = role('ink', r.range(0.4, 0.9));
          g.beginPath(); g.arc(r() * w, r() * h, r.range(0.6, 2.6), 0, Math.PI * 2); g.fill();
        }
      } else if (kind === 'wash') {
        var grd = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, Math.max(w, h) / 1.8);
        grd.addColorStop(0, role('ground-2', 0.55)); grd.addColorStop(1, role('ground-2', 0));
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
      }
      return c;
    });
  };
  var patterns = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function texPattern(ctx, kind) {
    var m = patterns && patterns.get(ctx);
    if (!m) { m = {}; if (patterns) patterns.set(ctx, m); }
    if (!m[kind]) m[kind] = ctx.createPattern(S.texture(kind, 256, 256, kind.length * 13), 'repeat');
    return m[kind];
  }
  S.texPattern = texPattern;

  // ------------------------------------------------------------------ gouache fill, offset from its line
  S.fill = function (ctx, shape, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    var pts = Array.isArray(shape) ? shape : shape.pts;
    var r = rng(o.seed || 5);
    var dx = 0, dy = 0;
    if (o.offset !== false) {
      dx = r.range(2, 4) * r.sign(); dy = r.range(1.5, 3.2) * r.sign();
    }
    var bb = P.bbox(pts);
    var a = S.appear('bloom', p);
    ctx.save();
    ctx.globalAlpha *= a.alpha * (o.alpha == null ? 1 : o.alpha);
    ctx.translate(bb.cx + dx, bb.cy + dy);
    ctx.scale(a.scale, a.scale);
    ctx.translate(-bb.cx, -bb.cy);
    trace(ctx, pts, true);
    ctx.fillStyle = o.color || role(o.role || 'accent-1');
    ctx.fill();
    if (o.texture !== false && bb.w > 14 && bb.h > 10) {
      ctx.clip();
      ctx.globalAlpha *= 0.55;
      ctx.fillStyle = texPattern(ctx, 'gouache');
      ctx.fillRect(bb.x - 6, bb.y - 6, bb.w + 12, bb.h + 12);
    }
    ctx.restore();
  };

  // A filled shape with its calligraphic outline, as the style composes most objects.
  S.shape = function (ctx, pts, o) {
    o = o || {};
    var p = o.p == null ? 1 : o.p;
    var lineP = E.segment(p, 0, 0.7), fillP = E.segment(p, 0.45, 1);
    if (o.fill !== false && (o.role || o.color)) S.fill(ctx, pts, { role: o.role, color: o.color, p: fillP, seed: o.seed, offset: o.offset, texture: o.texture, alpha: o.fillAlpha });
    if (o.line !== false) S.stroke(ctx, o.wobble === false ? pts : P.wobble(pts, (o.seed || 3) + 1, o.wobbleAmp == null ? 1.4 : o.wobbleAmp), { weight: o.weight || 'regular', role: o.lineRole || 'ink', p: lineP, seed: o.seed, closed: true, taper: false, swell: 0.3 });
  };

  // ------------------------------------------------------------------ appearance motion (style S2)
  S.appear = function (kind, p) {
    p = E.clamp(p == null ? 1 : p, 0, 1);
    if (NS.util && NS.util.prefersReducedMotion && NS.util.prefersReducedMotion() && !S.forceMotion) {
      return { alpha: E.out(Math.min(1, p * 3)), scale: 1, dx: 0, dy: 0, reveal: 1 };
    }
    switch (kind) {
      case 'bloom': return { alpha: E.out(p), scale: 0.93 + 0.07 * E.back(p), dx: 0, dy: 0, reveal: 1 };
      case 'pop': return { alpha: E.out(Math.min(1, p * 2)), scale: 0.6 + 0.4 * E.back(p), dx: 0, dy: 0, reveal: 1 };
      case 'rise': return { alpha: E.out(p), scale: 1, dx: 0, dy: (1 - E.out(p)) * 14, reveal: 1 };
      case 'draw': return { alpha: 1, scale: 1, dx: 0, dy: 0, reveal: E.inOut(p) };
      default: return { alpha: E.out(p), scale: 1, dx: 0, dy: 0, reveal: 1 };
    }
  };

  // ------------------------------------------------------------------ body-face text (labels; never display lettering)
  S.text = function (ctx, str, x, y, o) {
    o = o || {};
    if (str == null || str === '') return { width: 0, height: 0, lines: [] };
    var size = o.size || 22;
    var weight = o.weight || 500;
    var a = o.p == null ? 1 : E.clamp(o.p * 1.6, 0, 1);
    if (a <= 0) return { width: 0, height: 0, lines: [] };
    ctx.save();
    ctx.globalAlpha *= a * (o.alpha == null ? 1 : o.alpha);
    ctx.font = (o.italic ? 'italic ' : '') + weight + ' ' + size + 'px ' + S.tokens.fonts.body;
    ctx.fillStyle = o.color || role(o.role || 'ink');
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    var s = NS.util && NS.util.nbsp ? NS.util.nbsp(String(str)) : String(str);
    var lines = o.maxWidth ? NS.engine.captions.wrap(ctx, s, o.maxWidth) : [s];
    if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
    var lh = size * (o.lineHeight || 1.25);
    var yy = y;
    if (o.vcenter) yy = y - (lines.length - 1) * lh / 2;
    var wmax = 0;
    lines.forEach(function (ln, i) { ctx.fillText(ln, x, yy + i * lh); wmax = Math.max(wmax, ctx.measureText(ln).width); });
    ctx.restore();
    return { width: wmax, height: lines.length * lh, lines: lines, lineHeight: lh };
  };
  S.measure = function (ctx, str, size, weight) {
    ctx.save();
    ctx.font = (weight || 500) + ' ' + (size || 22) + 'px ' + S.tokens.fonts.body;
    var w = ctx.measureText(String(str)).width;
    ctx.restore();
    return w;
  };

  // ------------------------------------------------------------------ overlap rule (style S1, S11)
  // Where two colored shapes overlap, the intersection is ink or a third color, never blended.
  S.overlap = function (ctx, a, b, o) {
    o = o || {};
    ctx.save();
    trace(ctx, a, true); ctx.clip();
    trace(ctx, b, true);
    ctx.globalAlpha *= o.p == null ? 1 : E.clamp(o.p, 0, 1);
    ctx.fillStyle = role(o.role || 'ink');
    ctx.fill();
    ctx.restore();
  };

  // Ruled notebook lines with a margin line, as an optional ground (style S11).
  S.notebookLines = function (ctx, x, y, w, h, o) {
    o = o || {};
    var gap = o.gap || 30, p = o.p == null ? 1 : o.p;
    for (var yy = y + gap, i = 0; yy < y + h; yy += gap, i++) {
      S.stroke(ctx, [[x, yy], [x + w, yy + 1]], { weight: 'hair', role: o.role || 'ink-soft', seed: i + 3, taper: false, p: p, alpha: 0.55 });
    }
    if (o.margin !== false) S.stroke(ctx, [[x + (o.marginX || 48), y], [x + (o.marginX || 48) + 1, y + h]], { weight: 'thin', role: 'accent-1', seed: 2, taper: false, p: p, alpha: 0.7 });
  };

  // Calligraphic contour loop around a point (signs, lettering flourishes).
  S.contourLoop = function (ctx, cx, cy, r, o) {
    o = o || {};
    var rr = rng(o.seed || 17), pts = [];
    var turns = o.turns || 1.15;
    for (var i = 0; i <= 48; i++) {
      var u = i / 48, a = u * Math.PI * 2 * turns + (o.rot || 0);
      var m = 1 + 0.12 * Math.sin(a * 2 + rr.range(0, 6)) + u * 0.12;
      pts.push([cx + Math.cos(a) * r * m, cy + Math.sin(a) * r * m * (o.squash || 0.8)]);
    }
    S.stroke(ctx, P.smooth(pts, 3), { weight: o.weight || 'regular', p: o.p, seed: o.seed, dot: o.dot !== false, role: o.role });
  };

  // ------------------------------------------------------------------ ambient life (style S2, S5)
  function inZones(x, y, r, zones) {
    if (!zones) return false;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (x + r > z[0] && x - r < z[0] + z[2] && y + r > z[1] && y - r < z[1] + z[3]) return true;
    }
    return false;
  }
  S.inZones = inZones;
  var AMB_COUNT = { title: 7, recap: 7, explain: 3, dialogue: 2, case: 2, figure: 2, compare: 2, hero: 9, card: 0 };
  S.ambient = function (ctx, sceneType, t, seed, zones, W, H) {
    W = W || 1280; H = H || 720;
    var n = AMB_COUNT[sceneType] == null ? 2 : AMB_COUNT[sceneType];
    if (!n) return;
    // the lettered title of a title scene is a meaning zone too
    if (sceneType === 'title') zones = (zones || []).concat([[W * 0.14, 24, W * 0.72, 200]]);
    var r = rng((seed || 1) * 31 + 17);
    var still = NS.util && NS.util.prefersReducedMotion && NS.util.prefersReducedMotion();
    for (var i = 0; i < n; i++) {
      var kind = r.pick(['star', 'star', 'dots', 'spiral', 'star', 'moon']);
      var bx = r.range(40, W - 40), by = r.range(36, H * 0.42);
      var sz = r.range(9, 18);
      var ph = r.range(0, 6.28);
      var x = bx + (still ? 0 : Math.sin(t * 0.18 + ph) * 10);
      var y = by + (still ? 0 : Math.cos(t * 0.15 + ph) * 6);
      if (inZones(x, y, sz + 6, zones)) continue;
      var tw = still ? 1 : 0.75 + 0.25 * Math.sin(t * 1.3 + ph);
      ctx.save();
      ctx.globalAlpha *= 0.85 * tw;
      if (kind === 'star') S.sign(ctx, 'star', { x: x, y: y, r: sz, seed: i + seed, rot: still ? 0 : t * 0.05 + ph, colorCenter: r() < 0.4 ? r.pick(['accent-1', 'accent-2']) : null });
      else if (kind === 'dots') S.sign(ctx, 'dots', { x: x, y: y, r: sz, seed: i + seed });
      else if (kind === 'spiral') S.sign(ctx, 'spiral', { x: x, y: y, r: sz * 0.8, seed: i + seed });
      else S.sign(ctx, 'moon', { x: x, y: y, r: sz * 0.9, seed: i + seed });
      ctx.restore();
    }
  };
})(window.IAHI);
