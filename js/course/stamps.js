/* Course stamps (spec §3.2): each stamp is the `stamp` mark with its sign in the middle and its
   final text (js/data/stamps.js) inside it, in the body face. stamp(ctx, id, { x, y, r, p }). */
(function (NS) {
  'use strict';
  var S = NS.style;
  var C = NS.course;

  C.stamp = function (ctx, id, o) {
    o = o || {};
    var st = null;
    (NS.data.stamps || []).forEach(function (s) { if (s.id === id) st = s; });
    if (!st) return;
    var R = o.r || 150;
    var signName = C.pictos.stampSign[id];
    S.mark(ctx, 'stamp', { x: o.x - R, y: o.y - R, w: R * 2, h: R * 2 }, {
      p: o.p, text: st.text, seed: NS.engine.hash(id) % 97,
      sign: function (c, x, y, r) { C.pictos.draw(c, signName, { x: x, y: y, r: r }); }
    });
  };
})(window.IAHI);
