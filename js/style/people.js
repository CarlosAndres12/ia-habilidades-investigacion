/* STYLE · Miró — people (style S6, base §5.3).
   Simple, friendly «personajes»: rounded bodies in flat color with black outlines, dot eyes, small
   smiles, hair as calligraphic strokes, clear poses. Built from the cast entry's `look`
   (age, build, hair, skin role, clothing items with accent roles). No teeth, claws or distortion.
   person() returns anchor points (hands, head, lap) so js/course/ can place props. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  var BUILD = { slim: 0.86, medium: 1, stocky: 1.16, tall: 0.92, lanky: 0.82 };
  var HEIGHT = { slim: 1, medium: 1, stocky: 0.97, tall: 1.07, lanky: 1.06 };

  function head(ctx, cx, cy, R, look, seed, p, t) {
    var hair = look.hair || {};
    var hr = rng(seed + 3);
    // hair behind the head
    if (hair.style === 'ponytail') {
      S.stroke(ctx, P.smooth([[cx + R * 0.7, cy - R * 0.4], [cx + R * 1.25, cy + R * 0.1], [cx + R * 1.15, cy + R * 0.9]], 8), { weight: 'heavy', seed: seed + 1, p: p, role: hair.role || 'ink' });
    } else if (hair.style === 'wavy-shoulder') {
      S.fill(ctx, P.blob(cx, cy + R * 0.25, R * 1.25, R * 1.15, seed + 2, 5, 0.12), { role: hair.role || 'ground', offset: false, texture: false, p: p });
      for (var w = 0; w < 5; w++) {
        var sx = cx - R * 1.1 + w * R * 0.55;
        S.stroke(ctx, P.smooth([[sx, cy - R * 0.6], [sx + hr.range(-6, 6), cy + R * 0.3], [sx + hr.range(-8, 8), cy + R * 1.25]], 6), { weight: 'thin', seed: seed + 10 + w, p: p });
      }
    }
    // face
    S.fill(ctx, P.circle(cx, cy, R, 40), { role: look.skin || 'skin-2', offset: false, seed: seed, p: p, texture: false });
    S.stroke(ctx, P.wobble(P.circle(cx, cy, R, 40), seed + 4, 1), { weight: 'regular', closed: true, taper: false, swell: 0.3, seed: seed, p: p });
    // hair on top
    if (hair.style === 'ponytail' || hair.style === 'short' || hair.style === 'short-gray' || hair.style === 'fringe') {
      var cap = P.arc(cx, cy - R * 0.05, R * 1.04, Math.PI * 1.05, Math.PI * 1.95, 24);
      cap.push([cx + R * 0.7, cy - R * 0.35]);
      if (hair.style === 'fringe') { cap.push([cx + R * 0.2, cy - R * 0.45]); cap.push([cx - R * 0.15, cy - R * 0.3]); cap.push([cx - R * 0.5, cy - R * 0.45]); }
      else { cap.push([cx, cy - R * 0.62]); }
      cap.push([cx - R * 0.85, cy - R * 0.25]);
      cap.closed = true;
      S.fill(ctx, cap, { role: hair.role || 'ink', offset: false, texture: false, p: p, seed: seed + 6 });
      if (hair.style === 'fringe') {
        for (var f = 0; f < 4; f++) S.stroke(ctx, [[cx - R * 0.5 + f * R * 0.3, cy - R * 0.75], [cx - R * 0.6 + f * R * 0.3, cy - R * 0.35]], { weight: 'thin', seed: seed + 20 + f, p: p });
      }
    } else if (hair.style === 'curly-short') {
      for (var c = 0; c < 9; c++) {
        var a = Math.PI * (1.02 + c * 0.11);
        S.sign(ctx, 'spiral', { x: cx + Math.cos(a) * R * 0.92, y: cy + Math.sin(a) * R * 0.92, r: R * 0.24, turns: 1.4, seed: seed + c, p: p });
      }
    } else if (hair.style === 'wavy-shoulder') {
      S.stroke(ctx, P.arc(cx, cy - R * 0.02, R * 1.05, Math.PI * 1.02, Math.PI * 1.98, 24), { weight: 'regular', seed: seed + 8, p: p });
    }
    // beard
    if (look.beard) {
      var bd = P.arc(cx, cy + R * 0.05, R * 0.98, Math.PI * 0.12, Math.PI * 0.88, 20);
      bd.push([cx - R * 0.45, cy + R * 0.42]); bd.push([cx + R * 0.45, cy + R * 0.42]);
      bd.closed = true;
      S.fill(ctx, bd, { role: (look.hair && look.hair.role) || 'ink', offset: false, texture: false, p: p });
    }
    // eyes (dots), smile
    var ey = cy - R * 0.08;
    var blink = t != null && (Math.floor(t * 0.9 + seed) % 7 === 0) && ((t * 0.9 + seed) % 1) < 0.08;
    ctx.fillStyle = role('ink');
    [-1, 1].forEach(function (sx) {
      ctx.beginPath();
      if (blink) ctx.rect(cx + sx * R * 0.36 - 3.5, ey - 1, 7, 2);
      else ctx.arc(cx + sx * R * 0.36, ey, Math.max(2.4, R * 0.085), 0, Math.PI * 2);
      ctx.fill();
    });
    S.stroke(ctx, P.arc(cx, cy + R * 0.18, R * 0.3, Math.PI * 0.2, Math.PI * 0.8, 10), { weight: 'thin', seed: seed + 9, p: p, taper: false, role: look.beard ? 'on-dark' : 'ink' });
    if (look.glasses === 'round' || look.glasses === 'reading') {
      var gr = look.glasses === 'round' ? R * 0.24 : R * 0.2;
      [-1, 1].forEach(function (sx) {
        S.stroke(ctx, P.circle(cx + sx * R * 0.36, ey, gr, 24), { weight: 'hair', closed: true, taper: false, p: p, seed: seed + 30 + sx });
      });
      S.stroke(ctx, [[cx - R * 0.12, ey], [cx + R * 0.12, ey]], { weight: 'hair', p: p, taper: false });
      if (look.glasses === 'reading') S.stroke(ctx, P.smooth([[cx - R * 0.6, ey], [cx - R * 0.95, cy + R * 0.7], [cx - R * 0.4, cy + R * 1.6]], 6), { weight: 'hair', p: p, seed: seed + 33 });
    }
    if (look.headset) {
      S.stroke(ctx, P.arc(cx, cy, R * 1.12, Math.PI * 1.1, Math.PI * 1.9, 20), { weight: 'bold', seed: seed + 40, p: p, taper: false });
      S.fill(ctx, P.ellipse(cx - R * 1.08, cy, R * 0.18, R * 0.3), { role: 'ink', offset: false, texture: false, p: p });
      S.stroke(ctx, P.smooth([[cx - R * 1.05, cy + R * 0.2], [cx - R * 0.8, cy + R * 0.7], [cx - R * 0.35, cy + R * 0.62]], 6), { weight: 'thin', seed: seed + 41, p: p });
    }
  }

  function clothes(look) {
    var items = look.clothes || [];
    var top = items[0] || { item: 'shirt', role: 'accent-3' };
    return { top: top, extra: items.slice(1) };
  }

  // torso polygon between shoulders and hips
  function torso(cx, neckY, hipY, shW, look, seed) {
    var hipW = shW * (look.build === 'stocky' ? 0.95 : 0.82);
    var pts = P.smooth([
      [cx - shW * 0.5, neckY + 8], [cx - shW * 0.56, neckY + (hipY - neckY) * 0.35], [cx - hipW * 0.55, hipY],
      [cx + hipW * 0.55, hipY], [cx + shW * 0.56, neckY + (hipY - neckY) * 0.35], [cx + shW * 0.5, neckY + 8]
    ], 6, true);
    pts.closed = true;
    return pts;
  }

  function extraItem(ctx, it, cx, neckY, hipY, shW, seed, p) {
    var h = hipY - neckY;
    if (it.item === 'scarf' || it.item === 'shawl') {
      var band = P.smooth([[cx - shW * 0.52, neckY + 12], [cx, neckY + 28], [cx + shW * 0.52, neckY + 12], [cx + shW * 0.36, neckY + 2], [cx, neckY + 12], [cx - shW * 0.36, neckY + 2]], 5, true);
      band.closed = true;
      S.shape(ctx, band, { role: it.role, weight: 'thin', seed: seed + 50, p: p });
      if (it.item === 'scarf') {
        var tail = P.rect(cx + shW * 0.08, neckY + 18, shW * 0.16, h * 0.45, 5);
        S.shape(ctx, tail, { role: it.role, weight: 'thin', seed: seed + 51, p: p });
      }
    } else if (it.item === 'vest') {
      var v = [[cx - shW * 0.34, neckY + 14], [cx - shW * 0.08, neckY + h * 0.55], [cx - shW * 0.34, hipY - 2], [cx - shW * 0.5, hipY - 2], [cx - shW * 0.5, neckY + 16]];
      var v2 = v.map(function (q) { return [2 * cx - q[0], q[1]]; });
      v.closed = true; v2.closed = true;
      S.shape(ctx, v, { role: it.role, weight: 'thin', seed: seed + 52, p: p });
      S.shape(ctx, v2, { role: it.role, weight: 'thin', seed: seed + 53, p: p });
    } else if (it.item === 'bag') {
      S.stroke(ctx, [[cx - shW * 0.42, neckY + 10], [cx + shW * 0.45, hipY - h * 0.1]], { weight: 'thin', seed: seed + 54, p: p });
      S.shape(ctx, P.rect(cx + shW * 0.32, hipY - h * 0.2, shW * 0.36, h * 0.24, 6), { role: it.role, weight: 'thin', seed: seed + 55, p: p });
    } else if (it.item === 'blouse' || it.item === 't-shirt') {
      var col = [[cx - shW * 0.2, neckY + 6], [cx, neckY + 30], [cx + shW * 0.2, neckY + 6]];
      col.push([cx, neckY + 14]); col.closed = true;
      S.shape(ctx, col, { role: it.role, weight: 'hair', seed: seed + 56, p: p });
    }
  }

  // pose → arm targets relative to shoulders (dx, dy) in units of torso height
  var POSES = {
    standing: { l: [-0.12, 0.95], r: [0.12, 0.95], legs: 'standing' },
    pointing: { l: [-0.1, 0.95], r: [0.95, -0.15], legs: 'standing', pointer: true },
    presenting: { l: [-0.15, 0.95], r: [0.75, 0.35], legs: 'standing' },
    'arms-crossed': { l: [0.32, 0.5], r: [-0.32, 0.55], legs: 'standing', crossed: true },
    waving: { l: [-0.12, 0.95], r: [0.55, -0.75], legs: 'standing' },
    'raising-hand': { l: [-0.1, 0.9], r: [0.2, -1.05], legs: 'seated' },
    seated: { l: [0.35, 0.72], r: [0.6, 0.72], legs: 'seated' },
    writing: { l: [0.3, 0.75], r: [0.62, 0.68], legs: 'seated' },
    reading: { l: [0.4, 0.55], r: [0.62, 0.55], legs: 'seated' },
    'seated-pointing': { l: [0.3, 0.75], r: [0.95, -0.05], legs: 'seated', pointer: true },
    bust: { l: null, r: null, legs: null }
  };

  S.person = function (ctx, entry, o) {
    o = o || {};
    if (!entry) return {};
    var look = entry.look || {};
    var seed = NS.engine.hash(entry.id || 'x') % 997;
    var p = o.p == null ? 1 : o.p;
    if (p <= 0) return {};
    var sc = (o.scale || 1) * HEIGHT[look.build || 'medium'];
    var x = o.x || 0, y = o.y || 0;
    var flip = o.flip ? -1 : 1;
    var pose = POSES[o.vignette ? 'bust' : (o.pose || 'standing')] || POSES.standing;
    var a = S.appear('rise', p);
    ctx.save();
    ctx.globalAlpha *= a.alpha;
    ctx.translate(x, y + a.dy);
    if (flip < 0) ctx.scale(-1, 1);
    var R = 33 * sc;
    var shW = 84 * sc * (BUILD[look.build || 'medium'] || 1);
    var cl = clothes(look);
    var anchors = {};
    var headY, neckY, hipY;
    if (o.vignette || o.pose === 'bust') {
      // head and shoulders (used in vignettes and video tiles)
      headY = -R * 1.1; neckY = headY + R * 0.95; hipY = neckY + R * 1.7;
      var tb = torso(0, neckY, hipY, shW, look, seed);
      S.shape(ctx, tb, { role: cl.top.role, weight: 'regular', seed: seed + 1, p: p });
      cl.extra.forEach(function (it, i) { extraItem(ctx, it, 0, neckY, hipY, shW, seed + i, p); });
      head(ctx, 0, headY, R, look, seed, p, o.t);
      anchors.head = [x, y + headY];
      ctx.restore();
      return anchors;
    }
    var seatedP = pose.legs === 'seated';
    var total = 300 * sc;
    hipY = seatedP ? -10 * sc : -132 * sc;
    neckY = hipY - 118 * sc;
    headY = neckY - R * 0.95;
    // legs
    if (pose.legs === 'standing') {
      [-1, 1].forEach(function (sx) {
        S.stroke(ctx, P.smooth([[sx * shW * 0.2, hipY - 4], [sx * shW * 0.22, hipY + 60 * sc], [sx * shW * 0.24, -6 * sc]], 6), { weight: 7 * sc + 1.5, seed: seed + 60 + sx, p: E.segment(p, 0, 0.6), taper: false, swell: 0.15 });
        S.fill(ctx, P.ellipse(sx * shW * 0.24 + sx * 9 * sc, -3 * sc, 15 * sc, 6.5 * sc), { role: 'ink', offset: false, texture: false, p: p });
      });
    } else if (seatedP && !o.noLegs) {
      [-1, 1].forEach(function (sx) {
        S.stroke(ctx, P.smooth([[sx * shW * 0.18, hipY], [sx * shW * 0.18 + 56 * sc, hipY + 4], [sx * shW * 0.18 + 60 * sc, hipY + 92 * sc]], 6), { weight: 7 * sc + 1.5, seed: seed + 62 + sx, p: E.segment(p, 0, 0.6), taper: false, swell: 0.15 });
      });
    }
    var tp = torso(0, neckY, hipY, shW, look, seed);
    S.shape(ctx, tp, { role: cl.top.role, weight: 'regular', seed: seed + 1, p: p });
    cl.extra.forEach(function (it, i) { extraItem(ctx, it, 0, neckY, hipY, shW, seed + i, p); });
    // arms
    var th = hipY - neckY;
    function arm(side, target) {
      if (!target) return null;
      var sx = side * shW * 0.48, sy = neckY + 14 * sc;
      var tx = target[0] * th * (side < 0 && !pose.crossed ? -1 : 1), ty = sy + target[1] * th;
      if (side < 0 && !pose.crossed) tx = -Math.abs(target[0]) * th - shW * 0.05;
      if (side > 0 && !pose.crossed) tx = Math.max(tx, shW * 0.05 + target[0] * th);
      var mid = [(sx + tx) / 2 + side * 14 * sc, (sy + ty) / 2 + 8 * sc];
      S.stroke(ctx, P.smooth([[sx, sy], mid, [tx, ty]], 6), { weight: 8 * sc + 1, seed: seed + 70 + side, p: E.segment(p, 0.3, 0.9), taper: false, swell: 0.2 });
      S.fill(ctx, P.circle(tx, ty, 8.5 * sc, 18), { role: look.skin || 'skin-2', offset: false, texture: false, p: p });
      S.stroke(ctx, P.circle(tx, ty, 8.5 * sc, 18), { weight: 'hair', closed: true, taper: false, p: p });
      return [tx, ty];
    }
    var lh = arm(-1, pose.l), rh = arm(1, pose.r);
    head(ctx, 0, headY, R, look, seed, p, o.t);
    ctx.restore();
    function abs(pt) { return pt ? [x + flip * pt[0], y + a.dy + pt[1]] : null; }
    anchors.leftHand = abs(lh);
    anchors.rightHand = abs(rh);
    anchors.head = [x, y + headY];
    anchors.lap = [x + flip * shW * 0.55, y + hipY - 4 * sc];
    anchors.top = [x, y + headY - R];
    anchors.height = total;
    return anchors;
  };

  // Speaker vignette: head and shoulders inside a calligraphic circle on ground (style S6).
  S.vignette = function (ctx, entry, o) {
    o = o || {};
    var x = o.x, y = o.y, R = o.r || 48;
    var p = o.p == null ? 1 : o.p;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = role('ground'); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R - 3, 0, Math.PI * 2); ctx.clip();
    S.person(ctx, entry, { x: x, y: y + R * 0.95, scale: R / 52, vignette: true, p: p, t: o.t });
    ctx.restore();
    S.stroke(ctx, P.wobble(P.circle(x, y, R), 5, 1.2), { weight: 'bold', closed: true, taper: false, p: p, seed: 7 });
    if (o.speaking) S.mark(ctx, 'speaking', { x: x + R * 0.62, y: y - R * 1.12, w: 30, h: 30 }, { t: o.t || 0 });
    ctx.restore();
  };

  // Generic extra (no label, never speaks): look derived from a seed.
  S.extraLook = function (seed) {
    var r = rng(seed);
    var styles = ['short', 'ponytail', 'curly-short', 'short-gray', 'fringe', 'wavy-shoulder'];
    return {
      id: 'extra-' + seed,
      look: {
        build: r.pick(['slim', 'medium', 'stocky', 'tall']),
        skin: 'skin-' + r.int(1, 5),
        hair: { style: r.pick(styles), role: r.pick(['ink', 'ink', 'ink-soft']) },
        glasses: r() < 0.25 ? 'round' : null,
        beard: r() < 0.15,
        clothes: [{ item: 'shirt', role: r.pick(['accent-1', 'accent-2', 'accent-3']) }]
      }
    };
  };
})(window.IAHI);
