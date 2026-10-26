/* STYLE · Miró — the machine manner and «la lámpara de IA» (style S7).
   Small, cool, ruler-drawn objects: thin perfectly straight machine-line strokes and perfect circles
   on a machine-ground disc or panel, an ordered dot grid in machine-grid, small glow accents.
   It is the only perfectly regular thing on screen. It never has eyes, a face, a body or a brain. */
(function (NS) {
  'use strict';
  var S = NS.style, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  function glowSprite(name) {
    return NS.engine.layers.shared.get('glow:' + name, function () {
      var c = NS.engine.layers.canvas(64, 64), g = c.getContext('2d');
      var grd = g.createRadialGradient(32, 32, 1, 32, 32, 31);
      grd.addColorStop(0, role(name, 0.95)); grd.addColorStop(0.35, role(name, 0.45)); grd.addColorStop(1, role(name, 0));
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      return c;
    });
  }
  S.glow = function (ctx, x, y, r, which) {
    ctx.drawImage(glowSprite(which || 'machine-glow-1'), x - r, y - r, r * 2, r * 2);
  };

  function line(ctx, x1, y1, x2, y2, w, rl) {
    ctx.strokeStyle = role(rl || 'machine-line'); ctx.lineWidth = w || 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function circle(ctx, x, y, r, w, rl) {
    ctx.strokeStyle = role(rl || 'machine-line'); ctx.lineWidth = w || 1.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  S.machineLine = line;
  S.machineCircle = circle;

  // Ruled panel with construction lines (the machine's area switches to the machine roles).
  S.machineGrid = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = role('machine-ground');
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = role('machine-grid'); ctx.lineWidth = 1;
    var step = o.step || 24;
    ctx.beginPath();
    for (var i = x + step; i < x + w; i += step) { ctx.moveTo(i, y); ctx.lineTo(i, y + h); }
    for (var j = y + step; j < y + h; j += step) { ctx.moveTo(x, j); ctx.lineTo(x + w, j); }
    ctx.stroke();
    ctx.restore();
  };

  function dotGrid(ctx, x, y, w, h, gap, rl, r) {
    ctx.fillStyle = role(rl || 'machine-grid');
    for (var i = x; i <= x + w + 0.1; i += gap) for (var j = y; j <= y + h + 0.1; j += gap) {
      ctx.beginPath(); ctx.arc(i, j, r || 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  S.dotGrid = dotGrid;

  // «la lámpara de IA»
  function lamp(ctx, o) {
    var x = o.x || 0, y = o.y || 0, R = o.r || 46, t = o.t || 0;
    var a = S.appear('pop', o.p == null ? 1 : o.p);
    if (a.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(x, y); ctx.scale(a.scale, a.scale);
    S.glow(ctx, 0, 0, R * 1.5, 'machine-glow-1');
    ctx.globalAlpha *= 0.999;
    ctx.fillStyle = role('machine-ground');
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 0, 0, R - 3, 1.4);
    circle(ctx, 0, 0, R * 0.78, 1, 'machine-grid');
    // the lamp-window: straight lines and an arch of perfect circle
    var wx = R * 0.42, wTop = -R * 0.46, wBot = R * 0.5;
    ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-wx, wBot); ctx.lineTo(-wx, wTop + wx * 0.2);
    ctx.arc(0, wTop + wx * 0.2, wx, Math.PI, 0);
    ctx.lineTo(wx, wBot); ctx.closePath(); ctx.stroke();
    line(ctx, 0, wTop - wx * 0.75, 0, wBot, 1);
    line(ctx, -wx, R * 0.1, wx, R * 0.1, 1);
    // letters flowing through it like tiny regular stars
    ctx.save();
    ctx.beginPath(); ctx.rect(-wx + 2, wTop - wx, wx * 2 - 4, wBot - wTop + wx); ctx.clip();
    var speed = o.still ? 0 : 14;
    for (var row = 0; row < 4; row++) {
      var yy = wTop + 4 + row * (wBot - wTop) / 4;
      for (var k = 0; k < 6; k++) {
        var xx = -wx + ((k * 13 + row * 7 + t * speed) % (wx * 2 + 14)) - 7;
        ctx.fillStyle = role(k % 3 === 0 ? 'machine-glow-1' : 'machine-line', 0.9);
        ctx.fillRect(xx, yy, 3, 3);
      }
    }
    ctx.restore();
    // small glow accents
    S.glow(ctx, R * 0.62, -R * 0.55, 7, 'machine-glow-2');
    S.glow(ctx, -R * 0.66, R * 0.52, 6, 'machine-glow-1');
    ctx.restore();
  }

  // A lamp drawn from its parts, so the course can build the lamp's family (style S7):
  // { bars: false } hides the window's crossbar, { rows: n } shows rule rows instead of flowing letters,
  // { dim: true } lowers the glow.
  function lampParts(ctx, o) {
    var x = o.x || 0, y = o.y || 0, R = o.r || 46, t = o.t || 0;
    var a = S.appear('pop', o.p == null ? 1 : o.p);
    if (a.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(x, y); ctx.scale(a.scale, a.scale);
    if (!o.dim && o.glow !== false) S.glow(ctx, 0, 0, R * 1.5, 'machine-glow-1');
    ctx.fillStyle = role('machine-ground');
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 0, 0, R - 3, 1.4);
    circle(ctx, 0, 0, R * 0.78, 1, 'machine-grid');
    var wx = R * 0.42, wTop = -R * 0.46, wBot = R * 0.5;
    ctx.strokeStyle = role('machine-line', o.dim ? 0.6 : 1); ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-wx, wBot); ctx.lineTo(-wx, wTop + wx * 0.2);
    ctx.arc(0, wTop + wx * 0.2, wx, Math.PI, 0);
    ctx.lineTo(wx, wBot); ctx.closePath(); ctx.stroke();
    if (o.bars !== false) {
      line(ctx, 0, wTop - wx * 0.75, 0, wBot, 1);
      line(ctx, -wx, R * 0.1, wx, R * 0.1, 1);
    } else if (o.gapFrame) {
      // the removed inner line, its place marked by a frame
      ctx.save(); ctx.setLineDash([3, 3]);
      ctx.strokeStyle = role('machine-glow-2'); ctx.lineWidth = 1.4;
      ctx.strokeRect(-wx - 4, R * 0.1 - 5, wx * 2 + 8, 10);
      ctx.restore();
      line(ctx, 0, wTop - wx * 0.75, 0, wBot, 1);
    }
    if (o.rows) {
      for (var i = 0; i < o.rows; i++) {
        var yy = wTop + 6 + i * (wBot - wTop - 10) / o.rows;
        ctx.fillStyle = role('machine-line', o.dim ? 0.55 : 0.9);
        ctx.fillRect(-wx + 5, yy, 3, 3);
        line(ctx, -wx + 11, yy + 1.5, wx - 6, yy + 1.5, 1, 'machine-line');
      }
    } else {
      ctx.save();
      ctx.beginPath(); ctx.rect(-wx + 2, wTop - wx, wx * 2 - 4, wBot - wTop + wx); ctx.clip();
      var speed = o.still ? 0 : 14;
      for (var row = 0; row < 4; row++) {
        var y2 = wTop + 4 + row * (wBot - wTop) / 4;
        for (var k = 0; k < 6; k++) {
          var xx = -wx + ((k * 13 + row * 7 + t * speed) % (wx * 2 + 14)) - 7;
          ctx.fillStyle = role(k % 3 === 0 ? 'machine-glow-1' : 'machine-line', 0.9);
          ctx.fillRect(xx, y2, 3, 3);
        }
      }
      ctx.restore();
    }
    if (!o.dim) {
      S.glow(ctx, R * 0.62, -R * 0.55, 7, 'machine-glow-2');
      S.glow(ctx, -R * 0.66, R * 0.52, 6, 'machine-glow-1');
    }
    ctx.restore();
  }

  // straight arrow in the machine manner
  function arrow(ctx, o) {
    var a = o.from, b = o.to, w = o.w || 1.6, rl = o.role || 'machine-line';
    var p = o.p == null ? 1 : o.p;
    var ex = a[0] + (b[0] - a[0]) * p, ey = a[1] + (b[1] - a[1]) * p;
    line(ctx, a[0], a[1], ex, ey, w, rl);
    if (p >= 0.98 && o.head !== false) {
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hs = o.head || 8;
      line(ctx, b[0], b[1], b[0] - Math.cos(ang - 0.45) * hs, b[1] - Math.sin(ang - 0.45) * hs, w, rl);
      line(ctx, b[0], b[1], b[0] - Math.cos(ang + 0.45) * hs, b[1] - Math.sin(ang + 0.45) * hs, w, rl);
    }
  }

  var PARTS = {
    lamp: lamp,
    lampParts: lampParts,
    arrow: arrow,
    disc: function (ctx, o) {
      ctx.fillStyle = role('machine-ground');
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r || 20, 0, Math.PI * 2); ctx.fill();
      circle(ctx, o.x, o.y, (o.r || 20) - 2, o.w || 1.3, o.role);
    },
    // rectangle outline (optionally filled with machine-ground)
    frame: function (ctx, o) {
      if (o.fill !== false) { ctx.fillStyle = role('machine-ground'); ctx.fillRect(o.x, o.y, o.w, o.h); }
      ctx.strokeStyle = role(o.role || 'machine-line'); ctx.lineWidth = o.lw || 1.5;
      if (o.dash) { ctx.save(); ctx.setLineDash(o.dash); ctx.strokeRect(o.x, o.y, o.w, o.h); ctx.restore(); }
      else ctx.strokeRect(o.x, o.y, o.w, o.h);
    },
    // a small machine card with n ruled lines (instruction card, summary card, document on a cable)
    card: function (ctx, o) {
      var w = o.w || 40, h = o.h || 28;
      ctx.fillStyle = role('machine-ground'); ctx.fillRect(o.x, o.y, w, h);
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.3; ctx.strokeRect(o.x, o.y, w, h);
      var n = o.lines == null ? 3 : o.lines;
      for (var i = 0; i < n; i++) line(ctx, o.x + 5, o.y + 7 + i * (h - 10) / Math.max(1, n), o.x + w - 5 - (i === n - 1 ? w * 0.3 : 0), o.y + 7 + i * (h - 10) / Math.max(1, n), 1, 'machine-line');
    },
    // a straight strip of text: identical small squares in a ruled band; `cuts` splits it into fragments
    strip: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w, h = o.h || 22, cuts = o.cuts || [], gap = o.gap || 0;
      var shift = 0, cell = o.cell || 9;
      ctx.save();
      var segs = [], prev = 0;
      cuts.concat([1]).forEach(function (c) { segs.push([prev, c]); prev = c; });
      segs.forEach(function (sg, i) {
        var sx = x + sg[0] * w + shift, sw = (sg[1] - sg[0]) * w;
        ctx.fillStyle = role('machine-ground'); ctx.fillRect(sx, y, sw, h);
        ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.2; ctx.strokeRect(sx, y, sw, h);
        for (var cx = sx + 4; cx < sx + sw - 6; cx += cell) {
          ctx.fillStyle = role('machine-line', 0.85);
          ctx.fillRect(cx, y + h / 2 - 2, 4, 4);
        }
        shift += gap;
      });
      ctx.restore();
    },
    node: function (ctx, o) {
      ctx.fillStyle = role('machine-ground'); ctx.beginPath(); ctx.arc(o.x, o.y, o.r || 8, 0, Math.PI * 2); ctx.fill();
      circle(ctx, o.x, o.y, o.r || 8, o.w || 1.4, o.role);
      if (o.on) S.glow(ctx, o.x, o.y, (o.r || 8) * 1.8 * o.on, 'machine-glow-1');
    },
    plug: function (ctx, o) {
      var x = o.x, y = o.y, s = o.s || 14, dir = o.dir || 1;
      ctx.fillStyle = role('machine-ground'); ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.4; ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      line(ctx, x + dir * s / 2, y - s * 0.22, x + dir * s, y - s * 0.22, 1.6);
      line(ctx, x + dir * s / 2, y + s * 0.22, x + dir * s, y + s * 0.22, 1.6);
    },
    // a file outline with a folded corner, filled
    file: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w || 60, h = o.h || 80, f = o.fold || Math.min(w, h) * 0.22;
      ctx.fillStyle = role('machine-ground');
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - f, y); ctx.lineTo(x + w, y + f); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = o.lw || 1.6; ctx.stroke();
      line(ctx, x + w - f, y, x + w - f, y + f, 1.2); line(ctx, x + w - f, y + f, x + w, y + f, 1.2);
      if (o.dots) dotGrid(ctx, x + 12, y + f + 10, w - 24, h - f - 22, o.gap || 10, 'machine-line', 1.5);
    },
    folder: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w || 36, h = o.h || 26;
      ctx.fillStyle = role('machine-ground'); ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.3; ctx.strokeRect(x, y, w, h); ctx.strokeRect(x, y - 6, w * 0.45, 6);
    },
    terminal: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w || 40, h = o.h || 30;
      PARTS.frame(ctx, { x: x, y: y, w: w, h: h });
      line(ctx, x + 6, y + 10, x + 12, y + 15, 1.3); line(ctx, x + 12, y + 15, x + 6, y + 20, 1.3); line(ctx, x + 16, y + 21, x + 28, y + 21, 1.3);
    },
    browser: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w || 40, h = o.h || 30, bar = o.bar || Math.max(8, h * 0.18);
      PARTS.frame(ctx, { x: x, y: y, w: w, h: h });
      line(ctx, x, y + bar, x + w, y + bar, 1.1);
      for (var k = 0; k < 3; k++) circle(ctx, x + 5 + k * Math.max(5, bar * 0.6), y + bar / 2, Math.max(1.4, bar * 0.16), 1);
    },
    // a filled bar in machine-line (table cells being filled, progress)
    bar: function (ctx, o) { ctx.fillStyle = role(o.role || 'machine-line', o.alpha == null ? 0.85 : o.alpha); ctx.fillRect(o.x, o.y, o.w, o.h || 5); },
    // a loop arrow: a perfect-circle arc with a straight head
    loopArrow: function (ctx, o) {
      var a0 = o.a0 == null ? Math.PI * 0.15 : o.a0, a1 = o.a1 == null ? Math.PI * 0.85 : o.a1;
      ctx.strokeStyle = role(o.role || 'machine-glow-1'); ctx.lineWidth = o.w || 1.8;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, a0, a1); ctx.stroke();
      var ax = o.x + Math.cos(a1) * o.r, ay = o.y + Math.sin(a1) * o.r, tg = a1 + Math.PI / 2;
      line(ctx, ax, ay, ax - Math.cos(tg - 0.5) * 9, ay - Math.sin(tg - 0.5) * 9, o.w || 1.8, o.role || 'machine-glow-1');
      line(ctx, ax, ay, ax - Math.cos(tg + 0.5) * 9, ay - Math.sin(tg + 0.5) * 9, o.w || 1.8, o.role || 'machine-glow-1');
    },
    // label set in the body face inside the machine's area (on-dark on machine-ground)
    label: function (ctx, o) {
      S.text(ctx, o.text, o.x, o.y, { size: o.size || 16, weight: o.weight || 700, role: 'on-dark', align: o.align || 'left', p: o.p, maxWidth: o.maxWidth, baseline: o.baseline });
    },
    panel: function (ctx, o) { S.machineGrid(ctx, o.x, o.y, o.w, o.h, o); },
    ring: function (ctx, o) { circle(ctx, o.x, o.y, o.r || 20, o.w || 1.4); },
    grid: function (ctx, o) { dotGrid(ctx, o.x, o.y, o.w, o.h, o.gap || 10, o.role, o.dot); },
    // straight cable with right angles between two points
    cable: function (ctx, o) {
      var a = o.from, b = o.to, mx = o.elbow == null ? (a[0] + b[0]) / 2 : o.elbow;
      var pts = [a, [mx, a[1]], [mx, b[1]], b];
      var L = 0, segs = [];
      for (var i = 1; i < pts.length; i++) { var d = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
      var cut = L * (o.p == null ? 1 : o.p), acc = 0;
      ctx.strokeStyle = role(o.role || 'machine-line'); ctx.lineWidth = o.w || 2;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      for (var k = 1; k < pts.length; k++) {
        if (acc + segs[k - 1] <= cut) { ctx.lineTo(pts[k][0], pts[k][1]); acc += segs[k - 1]; }
        else { var t = (cut - acc) / segs[k - 1]; ctx.lineTo(pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t); break; }
      }
      ctx.stroke();
      return pts;
    },
    dial: function (ctx, o) {
      var R = o.r || 9;
      ctx.fillStyle = role('machine-ground');
      ctx.beginPath(); ctx.arc(o.x, o.y, R, 0, Math.PI * 2); ctx.fill();
      circle(ctx, o.x, o.y, R, 1.3);
      var ang = o.angle == null ? -Math.PI / 4 : o.angle;
      line(ctx, o.x, o.y, o.x + Math.cos(ang) * R * 0.85, o.y + Math.sin(ang) * R * 0.85, 1.8, 'machine-glow-1');
    },
    blade: function (ctx, o) { line(ctx, o.x, o.y - (o.h || 40) / 2, o.x, o.y + (o.h || 40) / 2, 2.2); },
    chip: function (ctx, o) {
      var s = o.s || 70, x = o.x - s / 2, y = o.y - s / 2;
      ctx.fillStyle = role('machine-ground'); ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.5; ctx.strokeRect(x, y, s, s);
      dotGrid(ctx, x + 9, y + 9, s - 18, s - 18, (s - 18) / 7, 'machine-line', 1.4);
      for (var i = 0; i < 6; i++) {
        var u = x + 8 + i * (s - 16) / 5;
        line(ctx, u, y - 7, u, y, 1.4); line(ctx, u, y + s, u, y + s + 7, 1.4);
        line(ctx, x - 7, y + 8 + i * (s - 16) / 5, x, y + 8 + i * (s - 16) / 5, 1.4);
        line(ctx, x + s, y + 8 + i * (s - 16) / 5, x + s + 7, y + 8 + i * (s - 16) / 5, 1.4);
      }
    },
    gauge: function (ctx, o) {
      var R = o.r || 70, n = (o.labels || []).length || 4;
      ctx.fillStyle = role('machine-ground');
      ctx.beginPath(); ctx.arc(o.x, o.y, R + 8, Math.PI, 0); ctx.closePath(); ctx.fill();
      for (var i = 0; i <= n; i++) {
        var a = Math.PI + i * Math.PI / n;
        line(ctx, o.x + Math.cos(a) * R * 0.55, o.y + Math.sin(a) * R * 0.55, o.x + Math.cos(a) * R, o.y + Math.sin(a) * R, 1.3);
      }
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(o.x, o.y, R, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(o.x, o.y, R * 0.55, Math.PI, 0); ctx.stroke();
      if (o.needle != null) {
        var na = Math.PI + (o.needle + 0.5) * Math.PI / n;
        line(ctx, o.x, o.y, o.x + Math.cos(na) * R * 0.92, o.y + Math.sin(na) * R * 0.92, 2.4, 'machine-glow-1');
      }
    },
    // regular graph of nodes around a seed
    graph: function (ctx, o) {
      var r = rng(o.seed || 5), n = o.n || 10, R = o.r || 80, nodes = [];
      for (var i = 0; i < n; i++) { var a = i * Math.PI * 2 / n; nodes.push([o.x + Math.cos(a) * R * (0.6 + 0.4 * (i % 2)), o.y + Math.sin(a) * R * (0.6 + 0.4 * (i % 2))]); }
      var p = o.p == null ? 1 : o.p;
      nodes.forEach(function (q, i) {
        if (E.segment(p, i / n * 0.7, i / n * 0.7 + 0.3) <= 0) return;
        line(ctx, o.x, o.y, q[0], q[1], 1.1, 'machine-line');
        if (i > 0) line(ctx, nodes[i - 1][0], nodes[i - 1][1], q[0], q[1], 0.8, 'machine-grid');
      });
      nodes.forEach(function (q, i) {
        if (E.segment(p, i / n * 0.7, i / n * 0.7 + 0.3) <= 0) return;
        ctx.fillStyle = role('machine-ground'); ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, Math.PI * 2); ctx.fill();
        circle(ctx, q[0], q[1], 7, 1.3);
      });
      ctx.fillStyle = role('machine-ground'); ctx.beginPath(); ctx.arc(o.x, o.y, 11, 0, Math.PI * 2); ctx.fill();
      circle(ctx, o.x, o.y, 11, 2, 'machine-glow-1');
      return nodes;
    },
    shelf: function (ctx, o) {
      var w = o.w || 260, h = o.h || 16;
      ctx.fillStyle = role('machine-grid'); ctx.fillRect(o.x, o.y, w, h);
      ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1.2; ctx.strokeRect(o.x, o.y, w, h);
    },
    // a straight conveyor of cards through the lamp
    conveyor: function (ctx, o) {
      line(ctx, o.x1, o.y, o.x2, o.y, 1.5);
      var n = o.n || 6, t = o.t || 0;
      for (var i = 0; i < n; i++) {
        var u = ((i / n) + t * 0.05) % 1;
        var xx = o.x1 + (o.x2 - o.x1) * u;
        ctx.fillStyle = role('machine-ground'); ctx.fillRect(xx - 9, o.y - 16, 18, 13);
        ctx.strokeStyle = role('machine-line'); ctx.lineWidth = 1; ctx.strokeRect(xx - 9, o.y - 16, 18, 13);
      }
    }
  };

  S.machine = function (ctx, kind, o) {
    var fn = PARTS[kind];
    if (fn) return fn(ctx, o || {});
    return null;
  };
  S.machineParts = Object.keys(PARTS);
})(window.IAHI);
