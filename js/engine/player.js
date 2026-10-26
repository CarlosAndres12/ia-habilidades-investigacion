/* Video player (base §2–§3): canvas + HTML controls outside the canvas, chapters, discussion pauses,
   subtitles, transcript, resume, keyboard, one video at a time, lazy init, recording.
   The Renderer draws any frame from its time alone (renderFrame(t) is deterministic). */
(function (NS) {
  'use strict';
  var U = NS.util, S = NS.style, E = NS.engine.ease, TL = NS.engine.timeline, CAP = NS.engine.captions;
  var W = 1280, H = 720;
  var instances = [];

  function castById() {
    var m = {};
    (NS.data.cast || []).forEach(function (c) { m[c.id] = c; });
    return m;
  }
  function videoById(id) {
    var list = NS.data.videos || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // ------------------------------------------------------------------ renderer
  function Renderer(video, opts) {
    this.video = video;
    this.opts = opts || {};
    this.mod = NS.videos[video.id] || {};
    this.cache = new NS.engine.layers.LayerCache(2);
    this.cast = castById();
    this.env = {
      W: W, H: H, rng: NS.engine.rng, ease: E, cache: this.cache, style: S, course: NS.course,
      legend: NS.engine.legend, charts: NS.engine.charts, cards: NS.engine.cards, data: NS.data, video: video, cast: this.cast
    };
    this.buffer = null;
    this.bufferKey = null;
    this.ready = false;
  }
  Renderer.prototype.setup = function () {
    if (this.ready) return;
    this.ready = true;
    if (this.mod.setup) { try { this.mod.setup(this.env); } catch (e) { console.error(e); } }
  };
  Renderer.prototype.drawScene = function (ctx, index, s, absT) {
    var sc = this.video.scenes[index];
    var env = this.env;
    env.scene = sc;
    env.texts = sc.texts || {};
    env.tx = function (k) { return (sc.texts || {})[k] || ''; };
    env.scale = sc.scale || null;
    env.figs = sc.figs || [];
    env.t = absT;
    env.seed = index + 1;
    ctx.save();
    S.background(ctx, sc.type, { W: W, H: H, seed: index + 1, t: absT });
    var zones = (this.mod.zones && this.mod.zones[sc.id]) || [];
    S.ambient(ctx, sc.type, absT, index + 1, zones, W, H);
    var fn = this.mod.scenes && this.mod.scenes[sc.id];
    if (fn) {
      try { fn(ctx, s, env); } catch (e) { console.error('scene ' + this.video.id + '/' + sc.id, e); }
    } else {
      // A scene without drawing code still shows its content (never a blank frame).
      S.title(ctx, '', {});
      S.text(ctx, sc.seVe || '', W / 2, H / 2 - 40, { size: 30, weight: 600, align: 'center', maxWidth: 900, vcenter: true, p: s.intro });
    }
    var bx = W - 30;
    var badges = [];
    if (sc.ficcion) badges.push('Personajes inventados');
    if (sc.ejemplo) badges.push('Ejemplo ilustrativo');
    var self = this;
    badges.forEach(function (b, k) {
      var pic = NS.course.pictos;
      var sign = pic && NS.data.badges && NS.data.badges[b] ? function (c, x, y, r) { pic.draw(c, NS.data.badges[b].sign, { x: x, y: y, r: r }); } : null;
      S.mark(ctx, 'badge', { x: bx - 420, y: 22 + k * 40, w: 420, h: 30 }, { text: b, size: 15, align: 'right', sign: sign, p: s.intro });
    });
    ctx.restore();
  };
  Renderer.prototype.bufferCtx = function () {
    if (!this.buffer) { this.buffer = NS.engine.layers.canvas(W, H); }
    var g = this.buffer.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    return g;
  };
  // The neighbouring scene of a cross-fade is drawn at a fixed time, so one drawing serves the whole fade.
  Renderer.prototype.neighbor = function (tl, j, at, absT) {
    var key = j + '@' + at;
    if (this.bufferKey !== key) {
      this.drawScene(this.bufferCtx(), j, TL.state(tl, at).s, absT);
      this.bufferKey = key;
    }
    return this.buffer;
  };
  Renderer.prototype.frame = function (ctx, tl, t, o) {
    o = o || {};
    this.setup();
    var st = TL.state(tl, t);
    var sc = st.scene;
    var idx = sc.index;
    ctx.save();
    if (st.kind === 'scene') {
      this.drawScene(ctx, idx, st.s, t);
      var local = st.s.t, half = TL.XFADE / 2;
      if (local < half && idx > 0) {
        var prev = tl.scenes[idx - 1];
        ctx.globalAlpha = 0.5 * (1 - local / half);
        ctx.drawImage(this.neighbor(tl, idx - 1, prev.end - 0.001, prev.end), 0, 0);
        ctx.globalAlpha = 1;
      } else if (sc.dur - local < half && idx < tl.scenes.length - 1 && !this.segmentAfter(tl, idx)) {
        var next = tl.scenes[idx + 1];
        ctx.globalAlpha = 0.5 * (1 - (sc.dur - local) / half);
        ctx.drawImage(this.neighbor(tl, idx + 1, next.start + 0.001, next.start), 0, 0);
        ctx.globalAlpha = 1;
      }
    } else {
      this.drawScene(ctx, idx, st.s, sc.end);
      ctx.fillStyle = S.role('ground', 0.55);
      ctx.fillRect(0, 0, W, H);
      if (o.linear || o.cardOnCanvas) this.pauseCard(ctx, st.segment, st.p);
    }
    // chapter title mark for 2 s at each chapter start
    var ch = TL.chapterAt(tl, t);
    if (ch && t - ch.start < 2.4 && st.kind === 'scene') {
      S.mark(ctx, 'chapter', { x: 40, y: 18, w: 640, h: 60 }, { text: ch.title, p: E.clamp((t - ch.start) / 1.3, 0, 1) });
    }
    // speaker vignette (characters only; the narrator is never drawn)
    if (st.kind === 'scene' && st.s.speaker && st.s.speaker !== 'narrador' && this.cast[st.s.speaker]) {
      S.vignette(ctx, this.cast[st.s.speaker], { x: 96, y: H - 214, r: 56, speaking: true, t: t });
    }
    // subtitles
    if (o.subtitles !== false && st.kind === 'scene') {
      var chunk = TL.chunkAt(tl, t);
      if (chunk) {
        var who = chunk.voice !== 'narrador' && this.cast[chunk.voice] ? this.cast[chunk.voice].name : null;
        // fade only where a line starts or ends; chunks inside one line follow each other without a blink
        var first = chunk.index === 0, last = chunk.index === chunk.line.chunks.length - 1;
        var a = E.clamp(Math.min(first ? (t - chunk.start) / 0.2 : 1, last ? (chunk.end + 0.25 - t) / 0.2 : 1), 0, 1);
        CAP.drawBand(ctx, W, H, chunk.text, who, a, S);
      }
    }
    // end: soft fade
    if (t > tl.duration - 1) {
      ctx.fillStyle = S.role('ground', E.clamp((t - (tl.duration - 1)) / 1, 0, 1) * 0.85);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    return st;
  };
  Renderer.prototype.segmentAfter = function (tl, idx) {
    return tl.segments.some(function (sg) { return sg.sceneIndex === idx; });
  };
  // Linear-mode pause or checkpoint card drawn on the canvas (also used in recordings).
  Renderer.prototype.pauseCard = function (ctx, seg, p) {
    var box = { x: 190, y: 120, w: 900, h: 420 };
    S.mark(ctx, 'card', box, { p: 1, variant: 'accent-2', seed: 11 });
    if (seg.type === 'pause') {
      S.title(ctx, 'Pausa para conversar', { x: box.x + 50, y: box.y + 90, size: 44, p: 1 });
      S.text(ctx, seg.data.prompt, box.x + 50, box.y + 160, { size: 30, weight: 600, maxWidth: box.w - 100, lineHeight: 1.3, maxLines: 5 });
      S.text(ctx, 'Pausen el video y conversen', box.x + 50, box.y + box.h - 40, { size: 24, weight: 700, role: 'ink-soft' });
    } else if (seg.type === 'checkpoint') {
      var c = seg.data;
      var showAns = p > 4 / 6;
      S.title(ctx, '¡Pausa! Piensa y responde', { x: box.x + 50, y: box.y + 80, size: 40, p: 1 });
      S.text(ctx, c.question, box.x + 50, box.y + 140, { size: 26, weight: 600, maxWidth: box.w - 100, maxLines: 3 });
      (c.options || []).forEach(function (op, i) {
        var good = i === c.answer;
        S.text(ctx, (showAns && good ? '✓ ' : '• ') + op, box.x + 70, box.y + 230 + i * 40, { size: 24, weight: showAns && good ? 700 : 500 });
      });
      if (!showAns) S.text(ctx, 'Pausa el video y respondan en grupo · ' + Math.ceil(4 - p * 6), box.x + 50, box.y + box.h - 30, { size: 22, weight: 700, role: 'ink-soft' });
      else S.text(ctx, c.explain || '', box.x + 50, box.y + box.h - 50, { size: 22, maxWidth: box.w - 100, maxLines: 2 });
    }
  };

  // ------------------------------------------------------------------ transcript (data -> HTML)
  function transcriptHTML(video) {
    var cast = castById();
    var sources = NS.data.sources || {};
    var figs = NS.data.figuresById || {};
    var chapterStarts = {};
    (video.chapters || []).forEach(function (c) { chapterStarts[c.from] = c.title; });
    var pausesBy = {};
    (video.pauses || []).forEach(function (p) { (pausesBy[p.after] = pausesBy[p.after] || []).push(p); });
    var html = '';
    video.scenes.forEach(function (sc) {
      if (chapterStarts[sc.id]) html += '<h4 class="tr-chapter">' + U.esc(chapterStarts[sc.id]) + '</h4>';
      html += '<div class="tr-scene"><p class="tr-seve"><span class="tr-label">Se ve:</span> ' + U.esc(U.nbsp(sc.seVe || '')) + '</p>';
      (sc.lines || []).forEach(function (ln) {
        var c = cast[ln.voice];
        var who = ln.voice === 'narrador' ? '' : '<strong>' + U.esc(c ? c.name : ln.voice) + ':</strong> ';
        var mis = ln.misreading ? ' <span class="tr-misreading" title="Error de lectura, corregido a continuación"><span class="mark-misreading" aria-hidden="true"></span>Error de lectura, corregido a continuación</span>' : '';
        html += '<p class="tr-line' + (ln.misreading ? ' is-misreading' : '') + '">' + who + U.esc(U.nbsp(ln.text)) + mis + '</p>';
      });
      if (sc.figs && sc.figs.length) {
        var names = [];
        sc.figs.forEach(function (id) {
          (figs[id] ? figs[id].fuentes : []).forEach(function (k) {
            var lab = sources[k] ? sources[k].label : k;
            if (names.indexOf(lab) < 0) names.push(lab);
          });
        });
        html += '<p class="tr-sources">Fuentes de esta escena: ' + U.esc(names.join('; ')) + '</p>';
      }
      (pausesBy[sc.id] || []).forEach(function (p) {
        html += '<p class="tr-pause"><strong>Pausa para conversar:</strong> ' + U.esc(p.prompt) + '</p>';
      });
      html += '</div>';
    });
    return html;
  }

  // ------------------------------------------------------------------ player instance
  function Player(container, videoId, opts) {
    this.container = container;
    this.id = videoId;
    this.video = videoById(videoId);
    this.opts = opts || {};
    this.inited = false;
    this.playing = false;
    this.t = 0;
    this.base = 0; this.perf = 0;
    this.rate = 1;
    this.settings = {
      subtitles: true, voice: true, interactive: true,
      chapterPause: !!this.opts.chapterPause
    };
    this.passed = {};
    instances.push(this);
    this.build();
  }

  Player.prototype.build = function () {
    var self = this, v = this.video;
    if (!v) { this.container.appendChild(U.el('p', { text: 'Video no disponible.' })); return; }
    var fig = U.el('figure', { class: 'player', 'data-video': v.id });
    var chapters = U.el('div', { class: 'player-chapters', role: 'group', 'aria-label': 'Capítulos del video' });
    (v.chapters || []).forEach(function (ch, i) {
      chapters.appendChild(U.el('button', { type: 'button', class: 'chip', 'data-ch': i, onclick: function () { self.gotoChapter(i, true); } }, [ch.title]));
    });
    var stage = U.el('div', { class: 'player-stage', tabindex: '0', 'aria-label': 'Video: ' + v.title + '. Use Espacio para reproducir o pausar.' });
    var canvas = U.el('canvas', { width: W, height: H, role: 'img', 'aria-label': 'Video «' + v.title + '». La transcripción, debajo, describe cada escena.' });
    var big = U.el('button', { type: 'button', class: 'player-big-play', 'aria-label': 'Reproducir el video «' + v.title + '»' });
    var overlay = U.el('div', { class: 'player-overlay', hidden: true, role: 'dialog', 'aria-live': 'polite' });
    var note = U.el('div', { class: 'player-voice-note', hidden: true, text: 'Voz del navegador' });
    stage.appendChild(canvas); stage.appendChild(big); stage.appendChild(overlay); stage.appendChild(note);
    var bar = U.el('div', { class: 'player-bar' });
    var playBtn = U.el('button', { type: 'button', class: 'btn-icon player-play', 'aria-label': 'Reproducir', text: '▶' });
    var scrubWrap = U.el('div', { class: 'player-scrub' });
    var ticks = U.el('div', { class: 'player-ticks', 'aria-hidden': 'true' });
    var range = U.el('input', { type: 'range', min: '0', max: '1000', value: '0', step: '1', 'aria-label': 'Posición del video' });
    var preview = U.el('div', { class: 'player-preview', hidden: true });
    var pc = U.el('canvas', { width: 256, height: 144 });
    var plabel = U.el('span', { class: 'player-preview-label' });
    preview.appendChild(pc); preview.appendChild(plabel);
    scrubWrap.appendChild(ticks); scrubWrap.appendChild(range); scrubWrap.appendChild(preview);
    var time = U.el('span', { class: 'player-time', text: '0:00 / 0:00' });
    bar.appendChild(playBtn); bar.appendChild(scrubWrap); bar.appendChild(time);
    var optsRow = U.el('div', { class: 'player-options' });
    function toggle(label, key) {
      var id = 'opt-' + v.id + '-' + key + '-' + instances.length;
      var cb = U.el('input', { type: 'checkbox', id: id });
      cb.checked = !!self.settings[key];
      cb.addEventListener('change', function () { self.settings[key] = cb.checked; self.onSetting(key); });
      return U.el('label', { for: id, class: 'opt' }, [cb, ' ' + label]);
    }
    optsRow.appendChild(toggle('Subtítulos', 'subtitles'));
    optsRow.appendChild(toggle('Voz', 'voice'));
    var speed = U.el('select', { 'aria-label': 'Velocidad' }, [U.el('option', { value: '1', text: 'Velocidad 1×' }), U.el('option', { value: '0.75', text: 'Velocidad 0,75×' })]);
    speed.addEventListener('change', function () { self.setRate(parseFloat(speed.value)); });
    optsRow.appendChild(speed);
    optsRow.appendChild(toggle('Preguntas interactivas', 'interactive'));
    optsRow.appendChild(toggle('Pausar al final de cada capítulo', 'chapterPause'));
    var fsBtn = U.el('button', { type: 'button', class: 'btn btn-quiet', text: 'Pantalla completa', onclick: function () { self.fullscreen(); } });
    var dlBtn = U.el('button', { type: 'button', class: 'btn btn-quiet', text: (NS.videoIndex || {})[v.id] ? 'Descargar MP4' : 'Descargar video', onclick: function () { self.download(); } });
    optsRow.appendChild(fsBtn); optsRow.appendChild(dlBtn);
    var resume = U.el('p', { class: 'player-resume', hidden: true });
    var tr = U.el('details', { class: 'player-transcript' }, [U.el('summary', { text: 'Transcripción' }), U.el('div', { class: 'tr-body', html: transcriptHTML(v) })]);
    if (NS.ui && NS.ui.glossify) NS.ui.glossify(tr.querySelector('.tr-body'));
    var figsBox = U.el('details', { class: 'player-figs' }, [U.el('summary', { text: 'Cifras de este video' }), U.el('div', { class: 'figs-body' })]);
    fig.appendChild(chapters); fig.appendChild(stage); fig.appendChild(bar); fig.appendChild(optsRow); fig.appendChild(resume);
    fig.appendChild(tr);
    fig.appendChild(figsBox);
    this.container.appendChild(fig);
    this.el = { fig: fig, stage: stage, canvas: canvas, ctx: canvas.getContext('2d'), big: big, overlay: overlay, note: note, play: playBtn, range: range, time: time, ticks: ticks, preview: preview, pc: pc, plabel: plabel, resume: resume, chapters: chapters, figsBody: figsBox.querySelector('.figs-body'), speed: speed };
    // play button art (the `button` mark), drawn once
    try {
      var bc = NS.engine.layers.canvas(140, 140);
      S.mark(bc.getContext('2d'), 'button', { x: 10, y: 10, w: 120, h: 120 }, {});
      big.style.backgroundImage = 'url(' + bc.toDataURL() + ')';
    } catch (e) { /* ignore */ }
    big.addEventListener('click', function () { self.play(); });
    playBtn.addEventListener('click', function () { self.playing ? self.pause() : self.play(); });
    range.addEventListener('input', function () { self.seek(parseInt(range.value, 10) / 1000 * self.tl.duration); });
    range.addEventListener('mousemove', function (ev) { self.hover(ev); });
    range.addEventListener('mouseleave', function () { preview.hidden = true; });
    stage.addEventListener('keydown', function (ev) { self.key(ev); });
    fig.addEventListener('keydown', function (ev) { if (ev.target === range) return; if (ev.target === stage) return; if (ev.key === ' ' && ev.target.tagName === 'BUTTON') return; });
    this.observe();
  };

  Player.prototype.observe = function () {
    var self = this;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) self.init();
          else if (self.playing) self.pause();
        });
      }, { rootMargin: '200px' });
      io.observe(this.el.stage);
      this.io = io;
    } else this.init();
  };

  Player.prototype.init = function () {
    if (this.inited) return;
    this.inited = true;
    var self = this;
    var castW = {};
    (NS.data.cast || []).forEach(function (c) { castW[c.id] = { wordsPerSecond: c.wordsPerSecond || 2.4 }; });
    this.narrator = new NS.engine.Narrator(this.video, {});
    this.renderer = new Renderer(this.video, {});
    var man = (NS.audioManifest || {})[this.video.id] || null;
    this.tl = TL.build(this.video, { cast: castW, manifest: man });
    this.renderTicks();
    this.renderFigs();
    var saved = NS.store.get('pos:' + this.video.id, 0);
    var poster = this.video.poster ? this.posterTime() : 0;
    this.draw(poster);
    this.updateUI();
    this.warm();
    if (saved > 5 && saved < this.tl.duration - 5) {
      var r = this.el.resume;
      r.hidden = false;
      r.innerHTML = '';
      r.appendChild(U.el('button', { type: 'button', class: 'btn', text: 'Continuar donde ibas (' + U.clock(saved) + ')', onclick: function () { r.hidden = true; self.seek(saved); self.play(); } }));
      r.appendChild(U.el('button', { type: 'button', class: 'btn btn-quiet', text: 'Desde el inicio', onclick: function () { r.hidden = true; self.seek(0); self.play(); } }));
    }
    this.narrator.init().then(function () {
      if (self.narrator.mode === 'browser') self.el.note.hidden = false;
    });
  };

  // Draws one small frame of each scene in idle time before play, so the drawing code and the shared
  // textures are warm and the first cross-fades do not stutter. Stops as soon as the video plays.
  Player.prototype.warm = function () {
    var self = this, scenes = this.tl.scenes, i = 0, idle = NS.engine.layers.idle;
    var g = NS.engine.layers.canvas(256, 144).getContext('2d');
    if (!this.previewRenderer) this.previewRenderer = new Renderer(this.video, {});
    function step() {
      if (i >= scenes.length || self.playing) return;
      var s = scenes[i++];
      g.setTransform(256 / W, 0, 0, 144 / H, 0, 0);
      try { self.previewRenderer.frame(g, self.tl, s.start + s.dur * 0.5, { subtitles: false }); } catch (e) { return; }
      idle(step);
    }
    idle(step);
  };

  Player.prototype.posterTime = function () {
    var ps = this.video.poster, tl = this.tl;
    var sc = tl.scenes.filter(function (s) { return s.id === ps.scene; })[0] || tl.scenes[0];
    return sc.start + sc.dur * (ps.p == null ? 0.6 : ps.p);
  };

  Player.prototype.renderTicks = function () {
    var self = this, tl = this.tl, box = this.el.ticks;
    box.innerHTML = '';
    tl.scenes.forEach(function (s) { box.appendChild(U.el('span', { class: 'tick tick-scene', style: { left: (s.start / tl.duration * 100) + '%' } })); });
    tl.segments.forEach(function (sg) { box.appendChild(U.el('span', { class: 'tick tick-pause', style: { left: (sg.start / tl.duration * 100) + '%' }, title: 'Pausa para conversar' })); });
    tl.chapters.forEach(function (c) { box.appendChild(U.el('span', { class: 'tick tick-chapter', style: { left: (c.start / tl.duration * 100) + '%' }, title: c.title })); });
  };

  Player.prototype.renderFigs = function () {
    var ids = [];
    this.video.scenes.forEach(function (s) { (s.figs || []).forEach(function (f) { if (ids.indexOf(f) < 0) ids.push(f); }); });
    var body = this.el.figsBody;
    if (!ids.length) { body.appendChild(U.el('p', { text: 'Este video no usa cifras del banco.' })); return; }
    ids.forEach(function (id) { if (NS.ui.figureCardHTML) body.appendChild(NS.ui.figureCardHTML(id)); });
  };

  Player.prototype.now = function () {
    if (!this.playing) return this.t;
    var n = this.narrator;
    if (n && n.mode === 'audio' && this.settings.voice && n.audio) {
      var a = n.audio, at = a.currentTime, nowP = performance.now();
      if (this._lastAt !== at) { this._lastAt = at; this._anchorAt = at; this._anchorPerf = nowP; }
      var est = this._anchorAt + (nowP - this._anchorPerf) / 1000 * this.rate;
      if (Math.abs(est - at) > 0.04 + 0.1) { this._anchorAt = at; this._anchorPerf = nowP; est = at; }
      return est;
    }
    return this.base + (performance.now() - this.perf) / 1000 * this.rate;
  };

  Player.prototype.play = function () {
    var self = this;
    this.init();
    instances.forEach(function (p) { if (p !== self && p.playing) p.pause(); });
    this.el.big.hidden = true;
    this.el.resume.hidden = true;
    this.hideOverlay();
    if (this.t >= this.tl.duration - 0.05) this.t = 0;
    this.playing = true;
    this.base = this.t; this.perf = performance.now();
    this.narrator.rate = this.rate;
    if (this.narrator.mode === 'audio' && this.settings.voice) {
      var a = this.narrator.audio;
      a.currentTime = this.t; a.playbackRate = this.rate;
      try { a.preservesPitch = true; } catch (e) { /* ignore */ }
      var pr = a.play(); if (pr && pr.catch) pr.catch(function () { /* autoplay blocked */ });
      this._lastAt = null;
    }
    this.el.play.textContent = '❚❚'; this.el.play.setAttribute('aria-label', 'Pausar');
    this.loop();
  };

  Player.prototype.pause = function () {
    if (!this.playing) return;
    this.t = this.now();
    this.playing = false;
    if (this.narrator) {
      this.narrator.cancel();
      if (this.narrator.audio) this.narrator.audio.pause();
    }
    this.el.play.textContent = '▶'; this.el.play.setAttribute('aria-label', 'Reproducir');
    NS.store.set('pos:' + this.video.id, this.t);
    this.draw(this.t);
    this.updateUI();
  };

  Player.prototype.seek = function (t) {
    this.init();
    t = E.clamp(t, 0, this.tl.duration);
    this.t = t; this.base = t; this.perf = performance.now();
    this.passed = {};
    var self = this;
    this.tl.segments.forEach(function (sg) { if (sg.start < t - 0.01) self.passed['seg' + sg.start] = true; });
    this.tl.chapters.forEach(function (c) { if (c.start < t - 0.01) self.passed['ch' + c.start] = true; });
    if (this.narrator) {
      this.narrator.reset();
      if (this.narrator.audio) this.narrator.audio.currentTime = t;
    }
    if (!this.playing) { this.draw(t); this.updateUI(); }
  };

  Player.prototype.setRate = function (r) {
    var t = this.now();
    this.rate = r;
    this.base = t; this.perf = performance.now();
    if (this.narrator) { this.narrator.rate = r; if (this.narrator.audio) this.narrator.audio.playbackRate = r; }
  };

  Player.prototype.onSetting = function (key) {
    if (key === 'voice' && this.narrator) {
      this.narrator.enabled = this.settings.voice;
      if (!this.settings.voice) this.narrator.cancel();
      if (this.narrator.audio) this.narrator.audio.muted = !this.settings.voice;
    }
    if (!this.playing) this.draw(this.t);
  };

  Player.prototype.loop = function () {
    var self = this;
    if (!this.playing) return;
    var t = this.now();
    // browser voice still speaking past its slot: hold the frame
    if (this.narrator.holding(this.tl, t)) {
      this.base = this.t; this.perf = performance.now();
      t = this.t;
    }
    // discussion pauses and checkpoints (interactive mode)
    for (var i = 0; i < this.tl.segments.length; i++) {
      var sg = this.tl.segments[i];
      if (this.settings.interactive && !this.passed['seg' + sg.start] && t >= sg.start && this.t <= sg.start + 0.001) {
        this.passed['seg' + sg.start] = true;
        this.t = sg.start;
        this.pause();
        this.showSegment(sg);
        return;
      }
    }
    // pause at the end of each chapter (option)
    if (this.settings.chapterPause) {
      for (var k = 1; k < this.tl.chapters.length; k++) {
        var c = this.tl.chapters[k];
        if (!this.passed['ch' + c.start] && t >= c.start && this.t <= c.start + 0.001) {
          this.passed['ch' + c.start] = true;
          this.t = c.start;
          this.pause();
          this.showChapterEnd(k);
          return;
        }
      }
    }
    if (t >= this.tl.duration) {
      this.t = this.tl.duration;
      this.pause();
      NS.store.set('pos:' + this.video.id, 0);
      this.showEnd();
      return;
    }
    this.t = t;
    this.draw(t);
    if (this.settings.voice) this.narrator.tick(this.tl, t, true);
    this.updateUI();
    if (!this._savedAt || Math.abs(t - this._savedAt) > 5) { this._savedAt = t; NS.store.set('pos:' + this.video.id, t); }
    requestAnimationFrame(function () { self.loop(); });
  };

  Player.prototype.draw = function (t) {
    var ctx = this.el.ctx;
    this.renderer.frame(ctx, this.tl, t, { subtitles: this.settings.subtitles, cardOnCanvas: !this.settings.interactive });
  };

  Player.prototype.updateUI = function () {
    var tl = this.tl;
    if (!tl) return;
    this.el.range.value = String(Math.round(this.t / tl.duration * 1000));
    this.el.time.textContent = U.clock(this.t) + ' / ' + U.clock(tl.duration);
    var ch = TL.chapterAt(tl, this.t);
    var idx = ch ? tl.chapters.indexOf(ch) : -1;
    U.$$('button', this.el.chapters).forEach(function (b, i) { if (i === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  };

  Player.prototype.gotoChapter = function (i, play) {
    this.init();
    var ch = this.tl.chapters[i];
    if (!ch) return;
    this.hideOverlay();
    this.seek(ch.start);
    this.passed['ch' + ch.start] = true;
    if (play) this.play();
  };

  Player.prototype.hideOverlay = function () { this.el.overlay.hidden = true; this.el.overlay.innerHTML = ''; };

  Player.prototype.showSegment = function (sg) {
    var self = this, ov = this.el.overlay;
    ov.innerHTML = '';
    ov.hidden = false;
    var card = U.el('div', { class: 'card pause-card' });
    if (sg.type === 'pause') {
      card.appendChild(U.el('h3', { text: 'Pausa para conversar' }));
      card.appendChild(U.el('p', { class: 'pause-prompt', text: sg.data.prompt }));
      var secs = sg.data.seconds || 120;
      var cd = U.el('p', { class: 'pause-count', 'aria-live': 'off', text: 'Tiempo sugerido: ' + U.clock(secs) });
      card.appendChild(cd);
      var left = secs;
      this._cd = setInterval(function () {
        left = Math.max(0, left - 1);
        cd.textContent = left > 0 ? 'Tiempo sugerido: ' + U.clock(left) : 'Tiempo sugerido cumplido';
        if (left <= 0) clearInterval(self._cd);
      }, 1000);
    } else {
      var c = sg.data;
      card.appendChild(U.el('h3', { text: '¡Pausa! Piensa y responde' }));
      card.appendChild(U.el('p', { text: c.question }));
      var fb = U.el('p', { class: 'feedback', 'aria-live': 'polite' });
      (c.options || []).forEach(function (op, i) {
        card.appendChild(U.el('button', { type: 'button', class: 'btn opt-btn', text: op, onclick: function () {
          if (i === c.answer) fb.innerHTML = '<span class="mark-correct" aria-hidden="true"></span> ¡Muy bien! ' + U.esc(c.explain || '');
          else fb.innerHTML = '<span class="mark-retry" aria-hidden="true"></span> Casi. Pista: ' + U.esc(c.hint || '');
        } }));
      });
      card.appendChild(fb);
    }
    card.appendChild(U.el('button', { type: 'button', class: 'btn btn-primary', text: 'Continuar', onclick: function () {
      clearInterval(self._cd);
      self.hideOverlay();
      self.seek(sg.end);
      self.passed['seg' + sg.start] = true;
      self.play();
    } }));
    ov.appendChild(card);
    var b = card.querySelector('.btn-primary'); if (b) b.focus();
  };

  Player.prototype.showChapterEnd = function (k) {
    var self = this, ov = this.el.overlay, ch = this.tl.chapters[k];
    ov.innerHTML = ''; ov.hidden = false;
    var card = U.el('div', { class: 'card pause-card' }, [
      U.el('h3', { text: 'Fin del capítulo' }),
      U.el('button', { type: 'button', class: 'btn btn-primary', text: 'Continuar con: ' + ch.title, onclick: function () { self.hideOverlay(); self.play(); } })
    ]);
    ov.appendChild(card);
    card.querySelector('button').focus();
  };

  Player.prototype.showEnd = function () {
    var self = this, ov = this.el.overlay;
    ov.innerHTML = ''; ov.hidden = false;
    var b = U.el('button', { type: 'button', class: 'player-replay', 'aria-label': 'Ver de nuevo' }, [U.el('span', { text: 'Ver de nuevo' })]);
    try {
      var bc = NS.engine.layers.canvas(120, 120);
      S.mark(bc.getContext('2d'), 'button', { x: 8, y: 8, w: 104, h: 104 }, { variant: 'replay' });
      b.style.backgroundImage = 'url(' + bc.toDataURL() + ')';
    } catch (e) { /* ignore */ }
    b.addEventListener('click', function () { self.hideOverlay(); self.seek(0); self.play(); });
    ov.appendChild(b);
    b.focus();
  };

  Player.prototype.hover = function (ev) {
    if (!this.tl) return;
    var r = this.el.range.getBoundingClientRect();
    var u = E.clamp((ev.clientX - r.left) / r.width, 0, 1);
    var t = u * this.tl.duration;
    var pv = this.el.preview;
    pv.hidden = false;
    pv.style.left = (u * 100) + '%';
    var ch = TL.chapterAt(this.tl, t);
    this.el.plabel.textContent = (ch ? ch.title + ' · ' : '') + U.clock(t);
    var now = performance.now();
    if (this._hoverAt && now - this._hoverAt < 120) return;
    this._hoverAt = now;
    if (!this.previewRenderer) this.previewRenderer = new Renderer(this.video, {});
    var g = this.el.pc.getContext('2d');
    g.save(); g.scale(256 / W, 144 / H);
    this.previewRenderer.frame(g, this.tl, t, { subtitles: false });
    g.restore();
  };

  Player.prototype.key = function (ev) {
    var k = ev.key;
    if (k === ' ' || k === 'k' || k === 'K') { ev.preventDefault(); this.playing ? this.pause() : this.play(); }
    else if (k === 'ArrowRight' && ev.shiftKey) { ev.preventDefault(); this.chapterStep(1); }
    else if (k === 'ArrowLeft' && ev.shiftKey) { ev.preventDefault(); this.chapterStep(-1); }
    else if (k === 'ArrowRight') { ev.preventDefault(); this.jump(5); }
    else if (k === 'ArrowLeft') { ev.preventDefault(); this.jump(-5); }
    else if (k === 'c' || k === 'C') { this.settings.subtitles = !this.settings.subtitles; this.syncToggles(); if (!this.playing) this.draw(this.t); }
    else if (k === 'f' || k === 'F') { this.fullscreen(); }
  };
  Player.prototype.syncToggles = function () {
    var self = this;
    U.$$('.player-options input[type=checkbox]', this.el.fig).forEach(function (cb, i) {
      var key = ['subtitles', 'voice', 'interactive', 'chapterPause'][i];
      cb.checked = !!self.settings[key];
    });
  };
  Player.prototype.jump = function (d) {
    var wasPlaying = this.playing;
    var t = this.now() + d;
    if (wasPlaying) this.pause();
    this.seek(t);
    if (wasPlaying) this.play();
  };
  Player.prototype.chapterStep = function (dir) {
    this.init();
    var ch = TL.chapterAt(this.tl, this.now());
    var i = ch ? this.tl.chapters.indexOf(ch) : 0;
    var j = E.clamp(i + dir, 0, this.tl.chapters.length - 1);
    var wasPlaying = this.playing;
    if (wasPlaying) this.pause();
    this.gotoChapter(j, wasPlaying);
  };
  Player.prototype.fullscreen = function () {
    var f = this.el.fig;
    try {
      var pr = document.fullscreenElement ? document.exitFullscreen() : (f.requestFullscreen ? f.requestFullscreen() : null);
      if (pr && pr.catch) pr.catch(function () { /* full screen not allowed */ });
    } catch (e) { /* ignore */ }
  };
  Player.prototype.download = function () {
    var idx = NS.videoIndex || {};
    if (idx[this.video.id]) {
      var a = U.el('a', { href: 'assets/video/' + idx[this.video.id].file, download: idx[this.video.id].file });
      document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    if (NS.engine.recorder) NS.engine.recorder.record(this);
  };

  NS.engine.player = {
    W: W, H: H,
    Renderer: Renderer,
    transcriptHTML: transcriptHTML,
    instances: instances,
    mount: function (container, id, opts) { return new Player(container, id, opts); },
    pauseAll: function () { instances.forEach(function (p) { if (p.playing) p.pause(); }); },
    forget: function () { instances.length = 0; },
    videoById: videoById
  };
})(window.IAHI);
