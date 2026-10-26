/* Places of this course (spec §3.5), as a few flat fields and lines (style S8 `dialogue`, `case`):
   `sala-virtual`, `escritorio-casa`, `oficina-grupo`, `comite-etica`. Never political maps or borders.
   place(ctx, id, o) draws the back of the place and returns anchors: seats { x, y, scale } for the
   cast, screen or board boxes, and front(ctx), which draws the furniture that goes in front of
   seated people. Labels come from the caller. */
(function (NS) {
  'use strict';
  var S = NS.style, P = S.path, E = NS.engine.ease;
  var C = NS.course;

  function rect(x, y, w, h, r) { return P.rect(x, y, w, h, r == null ? 8 : r); }
  function table(ctx, x, y, w, h, o) {
    var top = [[x, y], [x + w, y], [x + w - 12, y + 18], [x + 12, y + 18]]; top.closed = true;
    S.shape(ctx, rect(x + 12, y + 14, w - 24, h, 6), { role: 'accent-8', p: o.p, seed: o.seed || 31, weight: 'regular' });
    S.shape(ctx, rect(x, y, w, 22, 6), { role: 'accent-7', p: o.p, seed: (o.seed || 31) + 1, weight: 'regular' });
  }
  function windowField(ctx, x, y, w, h, p, seed) {
    S.shape(ctx, rect(x, y, w, h, 6), { role: 'accent-5', p: p, seed: seed, weight: 'regular' });
    S.stroke(ctx, [[x + w / 2, y + 4], [x + w / 2, y + h - 4]], { weight: 'thin', p: p, taper: false });
    S.stroke(ctx, [[x + 4, y + h / 2], [x + w - 4, y + h / 2]], { weight: 'thin', p: p, taper: false });
    S.sign(ctx, 'sun', { x: x + w * 0.72, y: y + h * 0.3, r: Math.min(w, h) * 0.12, seed: seed + 2, p: p });
  }
  function shelf(ctx, x, y, w, p, seed) {
    S.stroke(ctx, [[x, y], [x + w, y + 1]], { weight: 'bold', p: p, taper: false, seed: seed });
    var roles = ['accent-6', 'accent-1', 'accent-3', 'accent-6', 'accent-2'];
    for (var i = 0; i < Math.floor(w / 26); i++) {
      var hh = 38 + (i * 7) % 14;
      S.shape(ctx, rect(x + 6 + i * 26, y - hh, 20, hh - 2, 3), { role: roles[i % roles.length], p: E.segment(p, 0.2, 1), seed: seed + i, weight: 'hair' });
    }
  }

  var F = {
    // a video-call grid of tiles with a chat column; o.rooms: [{ label, n }] draws breakout rooms instead
    'sala-virtual': function (ctx, o) {
      var p = o.p == null ? 1 : o.p, x = o.x == null ? 60 : o.x, y = o.y == null ? 130 : o.y;
      var w = o.w || 1160, h = o.h || 470, chatW = o.chat === false ? 0 : (o.chatW || 230);
      var out = { tiles: [] };
      if (o.rooms) {
        var n = o.rooms.length, gap = 30, rw = (w - gap * (n - 1)) / n;
        o.rooms.forEach(function (room, ri) {
          var rx = x + ri * (rw + gap);
          S.shape(ctx, rect(rx, y, rw, h, 16), { role: 'ground-2', p: p, seed: 40 + ri, weight: 'regular', offset: false });
          if (room.label) S.text(ctx, room.label, rx + rw / 2, y + 34, { size: 20, weight: 700, align: 'center', p: p, maxWidth: rw - 20 });
          var k = room.n || 4, cols = 2, tw = (rw - 50) / cols, th = tw * 0.62;
          for (var i = 0; i < k; i++) {
            var tx = rx + 18 + (i % cols) * (tw + 14), ty = y + 56 + Math.floor(i / cols) * (th + 14);
            var person = room.people && room.people[i] ? C.castEntry(room.people[i]) : S.extraLook(101 + ri * 10 + i);
            out.tiles.push(C.prop(ctx, 'tile', { x: tx, y: ty, w: tw, h: th, p: E.segment(p, 0.1 + i * 0.08, 0.6 + i * 0.08), person: person, t: o.t, seed: 60 + ri * 10 + i, prop: room.prop && i === 0 ? room.prop : null }));
          }
        });
        return out;
      }
      var cols = o.cols || 4, rows = o.rows || 2, gap2 = 16;
      var gw = w - chatW - (chatW ? 24 : 0);
      var tw2 = (gw - gap2 * (cols - 1)) / cols, th2 = (h - gap2 * (rows - 1)) / rows;
      var people = o.people || [];
      var off = o.cameraOff || [3, 6];
      for (var j = 0; j < cols * rows; j++) {
        var tx2 = x + (j % cols) * (tw2 + gap2), ty2 = y + Math.floor(j / cols) * (th2 + gap2);
        var who = people[j] ? (typeof people[j] === 'string' ? C.castEntry(people[j]) : people[j]) : S.extraLook((o.seed || 7) * 13 + j);
        out.tiles.push(C.prop(ctx, 'tile', {
          x: tx2, y: ty2, w: tw2, h: th2, p: E.segment(p, j / (cols * rows) * 0.5, j / (cols * rows) * 0.5 + 0.5),
          person: who, cameraOff: !people[j] && off.indexOf(j) >= 0, t: o.t, seed: 70 + j, active: o.active === j,
          prop: o.tileProp || null
        }));
      }
      if (chatW) {
        var cx = x + gw + 24;
        S.shape(ctx, rect(cx, y, chatW, h, 12), { role: 'ground', p: p, seed: 80, weight: 'regular', offset: false, texture: false });
        var nb = o.bubbles == null ? 0 : o.bubbles;
        for (var b = 0; b < Math.floor(nb); b++) {
          C.prop(ctx, 'chat-bubble', { x: cx + 14 + (b % 2) * 30, y: y + 18 + b * 62, w: chatW - 58, h: 42, p: E.clamp(nb - b, 0, 1), tail: b % 2 ? 'right' : 'left', lines: 2, seed: 81 + b });
        }
        out.chat = { x: cx, y: y, w: chatW, h: h };
      }
      return out;
    },

    // Mariana's desk at home: laptop, a second screen, headphones, a plant
    'escritorio-casa': function (ctx, o) {
      var p = o.p == null ? 1 : o.p, sc = o.scale || 1;
      var dx = o.x == null ? 330 : o.x, dy = o.y == null ? 470 : o.y, dw = o.w || 640;
      S.fill(ctx, rect(0, 0, 1280, dy - 10, 0), { role: 'ground-2', p: p, offset: false, alpha: 0.45 });
      if (o.window !== false) windowField(ctx, dx + dw * 0.62, 90, 170, 150, p, 21);
      var scr = o.secondScreen === false ? null : C.prop(ctx, 'screen', { x: dx + dw * 0.8, y: dy, w: 230, h: 140, p: p, seed: 22, screenRole: o.screenRole });
      var seat = { x: dx + 110, y: dy + 70, scale: sc };
      var out = { seat: seat, deskY: dy, second: scr ? scr.screen : null };
      out.front = function (c2) {
        table(c2, dx, dy, dw, 160, { p: p, seed: 23 });
        out.laptop = C.prop(c2, 'laptop', { x: dx + (o.laptopAt || dw * 0.5), y: dy + 2, w: o.laptopW || 220, p: p, seed: 24, screenRole: o.laptopScreen });
        if (o.headset !== false) C.prop(c2, 'headset', { x: dx + dw * 0.82, y: dy - 6, r: 22, p: p });
        if (o.plant !== false) C.prop(c2, 'plant', { x: dx + dw - 40, y: dy + 2, p: p, s: 0.9 });
        return out.laptop;
      };
      return out;
    },

    // the research group's office: a shared table with laptops, a whiteboard, shelves of folders, a window
    'oficina-grupo': function (ctx, o) {
      var p = o.p == null ? 1 : o.p, sc = o.scale || 0.82;
      S.fill(ctx, rect(0, 0, 1280, 420, 0), { role: 'ground-2', p: p, offset: false, alpha: 0.5 });
      var out = {};
      if (o.board !== false) out.board = C.prop(ctx, 'whiteboard', { x: o.boardX || 380, y: o.boardY || 70, w: o.boardW || 560, h: o.boardH || 300, p: p, seed: 32 });
      if (o.window !== false) windowField(ctx, 1010, 90, 190, 160, p, 33);
      shelf(ctx, 60, 200, 250, p, 34);
      shelf(ctx, 60, 320, 250, p, 35);
      var ty = o.tableY || 520;
      out.tableY = ty;
      out.seats = (o.seats || [300, 640, 980]).map(function (sx) { return { x: sx, y: ty + 30 * sc, scale: sc }; });
      out.front = function (c2) {
        table(c2, 120, ty, 1040, 220, { p: p, seed: 36 });
        if (o.laptops !== false) out.seats.forEach(function (s, i) { C.prop(c2, 'laptop', { x: s.x + 120 * sc, y: ty + 2, w: 140, p: p, seed: 37 + i }); });
      };
      return out;
    },

    // a committee room: a long table with folders and a printed consent form
    'comite-etica': function (ctx, o) {
      var p = o.p == null ? 1 : o.p, sc = o.scale || 0.85;
      S.fill(ctx, rect(0, 0, 1280, 440, 0), { role: 'ground-2', p: p, offset: false, alpha: 0.55 });
      windowField(ctx, 120, 90, 180, 170, p, 41);
      var ty = o.tableY || 500;
      var out = { tableY: ty, seats: (o.seats || [520, 820]).map(function (sx) { return { x: sx, y: ty + 30 * sc, scale: sc }; }) };
      out.front = function (c2) {
        table(c2, 80, ty, 1120, 230, { p: p, seed: 42 });
        C.prop(c2, 'folder', { x: 300, y: ty - 6, w: 110, h: 20, p: p, seed: 43, role: 'accent-6' });
        C.prop(c2, 'folder', { x: 1010, y: ty - 6, w: 110, h: 20, p: p, seed: 44, role: 'accent-1' });
      };
      return out;
    }
  };

  C.castEntry = function (id) {
    var list = NS.data.cast || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  // Place a cast member (drawn by the style); returns the person's anchors.
  C.person = function (ctx, id, o) {
    var entry = typeof id === 'string' ? C.castEntry(id) : id;
    if (!entry || !entry.look) return {};
    return S.person(ctx, entry, o || {});
  };

  C.place = function (ctx, id, o) {
    var fn = F[id];
    if (!fn) return {};
    ctx.save();
    var out = fn(ctx, o || {});
    ctx.restore();
    if (out && !out.front) out.front = function () {};
    return out || { front: function () {} };
  };
  C.placeIds = Object.keys(F);
})(window.IAHI);
