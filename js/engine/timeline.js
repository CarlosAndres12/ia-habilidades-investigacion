/* Timeline of a video (base §2.2): scene, line, chunk and pause times; chapters. Pure functions,
   no DOM at load, so the Node tools compute exactly the same times as the player.
   scene duration = max(min, 0.6 lead + lines + 0.5 s between lines (0.35 s when the speaker changes)
   + extra pauses + 1.2 tail). Each discussion pause adds a silent 6 s segment after its scene. */
(function (G) {
  'use strict';
  var NS = G.IAHI = G.IAHI || {};
  NS.engine = NS.engine || {};
  var LEAD = 0.6, GAP = 0.5, GAP_SPEAKER = 0.35, TAIL = 1.2, HOLD = 6, XFADE = 0.8;

  function words(text) { return String(text || '').trim().split(/\s+/).filter(Boolean).length; }

  function wpsOf(cast, voice) {
    var c = cast && cast[voice];
    return (c && c.wordsPerSecond) || 2.4;
  }

  // manifestEntry (optional): assets/audio/manifest.js entry for this video, with measured lines.
  function build(video, opts) {
    opts = opts || {};
    var cast = opts.cast || {};
    var man = opts.manifest || null;
    var chunker = (NS.engine.captions && NS.engine.captions.chunk) || function (t) { return [t]; };
    var chunkTimes = NS.engine.captions && NS.engine.captions.chunkTimes;
    var manLines = {};
    if (man && man.lines) {
      man.lines.forEach(function (l) { manLines[l.scene + '#' + l.index] = l; });
    }
    var t = 0;
    var scenes = [];
    var segments = [];
    var pausesByScene = {};
    (video.pauses || []).forEach(function (p) { (pausesByScene[p.after] = pausesByScene[p.after] || []).push(p); });
    var checksByScene = {};
    (video.checkpoints || []).forEach(function (c) { (checksByScene[c.after] = checksByScene[c.after] || []).push(c); });

    video.scenes.forEach(function (sc, si) {
      var start = t;
      var cursor = start + LEAD;
      var lines = [];
      var prevVoice = null;
      (sc.lines || []).forEach(function (ln, li) {
        if (li > 0) cursor += (ln.voice !== prevVoice ? GAP_SPEAKER : GAP);
        var m = manLines[sc.id + '#' + li];
        var dur = m ? m.dur : words(ln.text) / wpsOf(cast, ln.voice);
        var chunks;
        if (m && m.chunks && m.chunks.length) {
          chunks = m.chunks.map(function (c) { return { text: c.text, start: cursor + c.start, end: cursor + c.end }; });
        } else {
          chunks = chunkTimes ? chunkTimes(chunker(ln.text), cursor, cursor + dur) : [{ text: ln.text, start: cursor, end: cursor + dur }];
        }
        lines.push({ index: li, voice: ln.voice, text: ln.text, start: cursor, end: cursor + dur, chunks: chunks, misreading: !!ln.misreading });
        cursor += dur + (ln.pause || 0);
        prevVoice = ln.voice;
      });
      var needed = (cursor - start) + TAIL;
      var dur = Math.max(sc.min || 0, needed);
      var end = start + dur;
      scenes.push({ id: sc.id, index: si, type: sc.type, start: start, end: end, dur: dur, lines: lines });
      t = end;
      (checksByScene[sc.id] || []).forEach(function (c) {
        segments.push({ type: 'checkpoint', after: sc.id, sceneIndex: si, start: t, end: t + HOLD, data: c });
        t += HOLD;
      });
      (pausesByScene[sc.id] || []).forEach(function (p) {
        segments.push({ type: 'pause', after: sc.id, sceneIndex: si, start: t, end: t + HOLD, data: p });
        t += HOLD;
      });
    });

    var chapters = (video.chapters || []).map(function (ch) {
      var sc = scenes.filter(function (s) { return s.id === ch.from; })[0];
      return { title: ch.title, from: ch.from, start: sc ? sc.start : 0 };
    });
    chapters.forEach(function (ch, i) { ch.end = i + 1 < chapters.length ? chapters[i + 1].start : t; });
    return { id: video.id, duration: t, scenes: scenes, segments: segments, chapters: chapters, XFADE: XFADE };
  }

  // State at time t: which scene or segment, local progress, active line and helpers for draw code.
  function state(tl, t) {
    t = Math.max(0, Math.min(t, tl.duration));
    for (var k = 0; k < tl.segments.length; k++) {
      var sg = tl.segments[k];
      if (t >= sg.start && t < sg.end) {
        var sc0 = tl.scenes[sg.sceneIndex];
        return { kind: sg.type, segment: sg, scene: sc0, s: local(sc0, sc0.dur), t: t, p: (t - sg.start) / (sg.end - sg.start) };
      }
    }
    var sc = tl.scenes[tl.scenes.length - 1];
    for (var i = 0; i < tl.scenes.length; i++) {
      if (t < tl.scenes[i].end) { sc = tl.scenes[i]; break; }
    }
    return { kind: 'scene', scene: sc, s: local(sc, t - sc.start), t: t };
  }

  function local(sc, lt) {
    lt = Math.max(0, Math.min(lt, sc.dur));
    var abs = sc.start + lt;
    var line = -1, lineP = 0, speaker = null;
    for (var i = 0; i < sc.lines.length; i++) {
      var L = sc.lines[i];
      if (abs >= L.start) {
        line = i;
        lineP = Math.min(1, (abs - L.start) / Math.max(0.01, L.end - L.start));
        speaker = abs < L.end ? L.voice : null;
      }
    }
    var n = sc.lines.length;
    var s = {
      t: lt, dur: sc.dur, p: sc.dur > 0 ? lt / sc.dur : 1,
      intro: Math.min(1, lt / 1), outro: Math.max(0, Math.min(1, (lt - (sc.dur - 1)) / 1)),
      lines: sc.lines.map(function (L) { return { start: L.start - sc.start, end: L.end - sc.start, voice: L.voice }; }),
      line: line, lineP: lineP, speaker: speaker,
      at: function (k) {
        if (n === 0) return Math.min(1, lt / Math.max(0.01, sc.dur));
        if (k >= n) k = n - 1;
        if (k < 0) k = 0;
        var L = sc.lines[k];
        if (abs < L.start) return 0;
        if (abs >= L.end) return 1;
        return (abs - L.start) / Math.max(0.01, L.end - L.start);
      }
    };
    return s;
  }

  // Active subtitle chunk at absolute time t (with a small hold after a line ends).
  function chunkAt(tl, t) {
    var st = state(tl, t);
    if (st.kind !== 'scene') return null;
    var sc = st.scene;
    for (var i = 0; i < sc.lines.length; i++) {
      var L = sc.lines[i];
      for (var j = 0; j < L.chunks.length; j++) {
        var c = L.chunks[j];
        // a chunk stays up until the next one of its line starts; the last one holds 0.25 s
        var until = j === L.chunks.length - 1 ? c.end + 0.25 : Math.max(c.end, L.chunks[j + 1].start);
        if (t >= c.start && t < until) return { text: c.text, voice: L.voice, line: L, start: c.start, end: c.end, index: j };
      }
    }
    return null;
  }

  function chapterAt(tl, t) {
    var cur = null;
    tl.chapters.forEach(function (c) { if (t >= c.start) cur = c; });
    return cur;
  }

  NS.engine.timeline = { build: build, state: state, chunkAt: chunkAt, chapterAt: chapterAt, words: words,
    LEAD: LEAD, GAP: GAP, TAIL: TAIL, HOLD: HOLD, XFADE: XFADE };
})(typeof window !== 'undefined' ? window : globalThis);
