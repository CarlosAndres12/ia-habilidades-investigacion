/* Subtitles (base §2.4).
   chunk(text) is a pure function of the text, shared by the player and the Node tools: split at
   sentence ends, then at ; : and commas, then before a conjunction, so that no chunk exceeds 84
   characters. Never split inside a number, an abbreviation such as «EE. UU.», or a «…» quotation.
   drawBand(...) wraps a chunk into at most 2 lines (3 if it does not fit) and draws it. */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.engine = NS.engine || {};
  var MAX = 84;
  var ABBR = ['EE. UU.', 'et al.', 'art.', 'Dra.', 'Dr.', 'p.', 'núm.', 'vol.', 'ed.', 'aprox.',
    'ene.', 'feb.', 'mar.', 'abr.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
  var CONJ = [' y ', ' e ', ' o ', ' u ', ' pero ', ' que ', ' porque ', ' aunque ', ' cuando ', ' si ',
    ' como ', ' mientras ', ' ni ', ' sino ', ' donde '];

  // Mask spans that must not be split; returns {text, map} where protected spaces become \u0001.
  function protect(text) {
    var t = text;
    ABBR.forEach(function (a) {
      var masked = a.replace(/ /g, '\u0001').replace(/\./g, '\u0002');
      t = t.split(a).join(masked);
    });
    // «…» quotations (may nest one level)
    var out = '';
    var depth = 0;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (c === '«') depth++;
      if (depth > 0 && c === ' ') out += '\u0001';
      else if (depth > 0 && c === '.') out += '\u0002';
      else if (depth > 0 && (c === ',' || c === ';' || c === ':' || c === '?' || c === '!')) out += String.fromCharCode(0xE000 + c.charCodeAt(0));
      else out += c;
      if (c === '»' && depth > 0) depth--;
    }
    return out;
  }
  function unprotect(t) {
    return t.replace(/\u0001/g, ' ').replace(/\u0002/g, '.').replace(/[-]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xE000);
    });
  }

  function splitSentences(t) {
    var parts = [];
    var re = /([.!?…]["»”)]?)\s+(?=[A-ZÁÉÍÓÚÑ¿¡«(0-9])/g;
    var last = 0, m;
    while ((m = re.exec(t))) {
      var end = m.index + m[1].length;
      parts.push(t.slice(last, end));
      last = end + (m[0].length - m[1].length);
    }
    parts.push(t.slice(last));
    return parts.map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function splitAtPunct(s) {
    // split after ";", ":" or "," followed by a space (decimal commas have no space after them)
    var pieces = [];
    var re = /([;:,])\s+/g;
    var last = 0, m;
    while ((m = re.exec(s))) {
      pieces.push(s.slice(last, m.index + 1));
      last = m.index + m[0].length;
    }
    pieces.push(s.slice(last));
    return pieces.map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function greedy(pieces, max) {
    var out = [];
    var cur = '';
    pieces.forEach(function (p) {
      if (!cur) { cur = p; return; }
      if ((cur + ' ' + p).length <= max) cur += ' ' + p;
      else { out.push(cur); cur = p; }
    });
    if (cur) out.push(cur);
    return out;
  }

  function splitConj(s, max) {
    if (s.length <= max) return [s];
    var best = -1, bestScore = Infinity;
    CONJ.forEach(function (c) {
      var idx = -1;
      while ((idx = s.indexOf(c, idx + 1)) >= 0) {
        var a = idx, b = s.length - idx - 1;
        if (a < 12 || b < 12) continue;
        var score = Math.abs(a - b) + (a > max || b > max ? 1000 : 0);
        if (score < bestScore) { bestScore = score; best = idx; }
      }
    });
    if (best < 0) {
      // fallback: last space before max (protected spans have no spaces)
      var sp = s.lastIndexOf(' ', max);
      if (sp < 12) sp = s.indexOf(' ', max);
      if (sp < 0) return [s];
      best = sp;
    }
    var left = s.slice(0, best).trim(), right = s.slice(best).trim();
    return splitConj(left, max).concat(splitConj(right, max));
  }

  function chunk(text, max) {
    max = max || MAX;
    var t = protect(String(text || '').replace(/\s+/g, ' ').trim());
    if (!t) return [];
    var out = [];
    splitSentences(t).forEach(function (sent) {
      if (sent.length <= max) { out.push(sent); return; }
      greedy(splitAtPunct(sent), max).forEach(function (p) {
        splitConj(p, max).forEach(function (q) { out.push(q); });
      });
    });
    return out.map(unprotect);
  }

  // Character-proportional chunk times inside a line (used when there is no manifest).
  function chunkTimes(chunks, start, end) {
    var total = chunks.reduce(function (s, c) { return s + c.length; }, 0) || 1;
    var t = start;
    return chunks.map(function (c) {
      var d = (end - start) * c.length / total;
      var o = { text: c, start: t, end: t + d };
      t += d;
      return o;
    });
  }

  // ------------------------------------------------------------------ drawing (browser only)
  function wrap(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width <= maxWidth || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // Draws the subtitle band. style: the style API (roles, fonts). alpha: fade 0..1.
  function drawBand(ctx, W, H, text, speaker, alpha, style) {
    if (!text || alpha <= 0) return;
    var fontSize = 32;
    var body = (style && style.tokens && style.tokens.fonts && style.tokens.fonts.body) || 'sans-serif';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 ' + fontSize + 'px ' + body;
    var full = speaker ? speaker + ': ' + text : text;
    var maxW = W - 160;
    var lines = wrap(ctx, full, maxW);
    if (lines.length > 3) lines = lines.slice(0, 3);
    var lh = fontSize * 1.28;
    var bandH = lines.length * lh + 26;
    var y0 = H - bandH - 18;
    ctx.fillStyle = style.role('dark', 0.88);
    var bx = 60, bw = W - 120;
    roundRect(ctx, bx, y0, bw, bandH, 12);
    ctx.fill();
    ctx.fillStyle = style.role('on-dark');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    lines.forEach(function (ln, i) {
      var y = y0 + 13 + lh * (i + 0.5);
      if (i === 0 && speaker && ln.indexOf(speaker + ':') === 0) {
        // speaker name in bold, the rest regular
        var name = speaker + ':';
        var rest = ln.slice(name.length);
        ctx.font = '700 ' + fontSize + 'px ' + body;
        var wName = ctx.measureText(name).width;
        ctx.font = '500 ' + fontSize + 'px ' + body;
        var wRest = ctx.measureText(rest).width;
        var x = W / 2 - (wName + wRest) / 2;
        ctx.textAlign = 'left';
        ctx.font = '700 ' + fontSize + 'px ' + body;
        ctx.fillText(name, x, y);
        ctx.font = '500 ' + fontSize + 'px ' + body;
        ctx.fillText(rest, x + wName, y);
        ctx.textAlign = 'center';
      } else {
        ctx.font = '500 ' + fontSize + 'px ' + body;
        ctx.fillText(ln, W / 2, y);
      }
    });
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  NS.engine.captions = { MAX: MAX, chunk: chunk, chunkTimes: chunkTimes, drawBand: drawBand, wrap: wrap, roundRect: roundRect };
})(typeof window !== 'undefined' ? window : globalThis);
