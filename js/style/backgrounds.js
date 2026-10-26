/* STYLE · Miró — one background per scene type plus hero and card (style S8).
   Lienzo with paper grain; meaning zones stay bare; the machine's area switches to machine roles. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease, rng = NS.engine.rng, role = S.role;

  function paper(ctx, W, H, seed) {
    var tex = S.texture('paper', 640, 360, 1 + ((seed || 0) % 3));
    ctx.drawImage(tex, 0, 0, W, H);
  }

  var BG = {
    title: function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      var r = rng((o.seed || 1) + 2);
      var sunX = r() < 0.5 ? W - 170 : 170, sunY = 150;
      if (r() < 0.55) S.sign(ctx, 'sun', { x: sunX, y: sunY, r: 56, seed: 3 });
      else S.sign(ctx, 'moon', { x: sunX, y: sunY, r: 46, seed: 4 });
      // a small bird in the opposite top corner; the bottom stays clear for the subtitle band
      S.sign(ctx, 'bird', { x: W - sunX + (sunX < W / 2 ? 20 : -20), y: 46, r: 14, seed: (o.seed || 1) + 1 });
    },
    explain: function (ctx, W, H, o) { paper(ctx, W, H, o.seed); },
    figure: function (ctx, W, H, o) { paper(ctx, W, H, o.seed); },
    compare: function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      if (o.divider !== false) {
        var pts = [];
        for (var y = 90; y <= H - 150; y += 12) pts.push([W / 2 + Math.sin(y * 0.02) * 6, y]);
        S.stroke(ctx, pts, { weight: 'thin', seed: 4, alpha: 0.8 });
      }
    },
    dialogue: function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(S.texture('wash', 400, 220, 2), 0, H * 0.45, W, H * 0.55); ctx.restore();
    },
    'case': function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      ctx.save(); ctx.fillStyle = role('ground-2', 0.55); ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.4; ctx.drawImage(S.texture('gouache', 256, 256, 9), 0, 0, W, H); ctx.restore();
    },
    recap: function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      S.sign(ctx, 'constellation', { x: W * 0.5, y: 54, r: 470, ry: 28, n: 7, seed: (o.seed || 1) + 5 });
    },
    hero: function (ctx, W, H, o) {
      paper(ctx, W, H, o.seed);
      var t = o.t || 0;
      var still = NS.util.prefersReducedMotion && NS.util.prefersReducedMotion();
      var sx = W - 190 + (still ? 0 : Math.sin(t * 0.31) * 12);
      S.sign(ctx, 'sun', { x: sx, y: 130, r: 62, seed: 3 });
      var bx = still ? W * 0.3 : ((t * 38) % (W + 200)) - 100;
      S.sign(ctx, 'bird', { x: bx, y: 110 + Math.sin(t * 1.4) * 6, r: 18, seed: 2 });
    },
    card: function (ctx, W, H, o) { ctx.fillStyle = role('ground'); ctx.fillRect(0, 0, W, H); }
  };

  S.background = function (ctx, type, o) {
    o = o || {};
    var W = o.W || 1280, H = o.H || 720;
    (BG[type] || BG.explain)(ctx, W, H, o);
  };
  S.backgroundTypes = Object.keys(BG);

  // The machine's area inside any scene.
  S.machineArea = function (ctx, x, y, w, h) {
    S.machineGrid(ctx, x, y, w, h, { step: 28 });
  };
})(window.IAHI);
