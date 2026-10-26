/* Boot. Waits for the fonts the canvas uses (3 s timeout, then the system stack) before any frame or
   text measurement, then either mounts a bare render mode for the tools or the routed site.
   ?render=<videoId>   bare canvas; window.renderFrame(t), videoDuration, videoChapters, videoTimeline
   ?render=slide:<n>   one live slide of «Modo clase» (n = session-slide, e.g. slide:3-2)
   ?render=estilo      the style test sheet (&page=2 for the second page) */
(function (NS) {
  'use strict';
  var U = NS.util;
  var FACES = [
    '400 20px "Atkinson Hyperlegible"', '700 20px "Atkinson Hyperlegible"', 'italic 400 20px "Atkinson Hyperlegible"',
    '760 40px "Fraunces"', '720 30px "Fraunces"'
  ];

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var all = Promise.all(FACES.map(function (f) { return document.fonts.load(f).catch(function () { return null; }); }));
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    return Promise.race([all, timeout]).catch(function () { /* system stack */ });
  }

  function bareCanvas(label) {
    document.body.innerHTML = '';
    document.body.className = 'render-mode';
    document.body.style.margin = '0';
    var c = document.createElement('canvas');
    c.width = 1280; c.height = 720;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', label || '');
    c.style.display = 'block';
    document.body.appendChild(c);
    return c;
  }

  function renderVideo(id, params) {
    var video = NS.engine.player.videoById(id);
    var c = bareCanvas(video ? video.title : id);
    if (!video) { window.renderError = 'Video no encontrado: ' + id; return; }
    var castW = {};
    (NS.data.cast || []).forEach(function (cc) { castW[cc.id] = { wordsPerSecond: cc.wordsPerSecond || 2.4 }; });
    var tl = NS.engine.timeline.build(video, { cast: castW, manifest: (NS.audioManifest || {})[id] || null });
    var r = new NS.engine.player.Renderer(video, {});
    var ctx = c.getContext('2d');
    window.renderFrame = function (t, o) {
      o = o || {};
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1280, 720);
      r.frame(ctx, tl, t, { subtitles: o.subtitles !== false, linear: true });
      return true;
    };
    window.videoDuration = tl.duration;
    window.videoChapters = tl.chapters.map(function (ch) { return { title: ch.title, start: ch.start, end: ch.end }; });
    window.videoTimeline = {
      id: id,
      duration: tl.duration,
      scenes: tl.scenes.map(function (s) {
        return { id: s.id, type: s.type, start: s.start, end: s.end, lines: s.lines.map(function (l) { return { voice: l.voice, start: l.start, end: l.end, text: l.text }; }) };
      }),
      segments: tl.segments.map(function (g) { return { type: g.type, after: g.after, start: g.start, end: g.end }; })
    };
    window.renderFrame(params.t ? parseFloat(params.t) : 0);
    window.renderReady = true;
  }

  function renderSlide(key) {
    var c = bareCanvas('Diapositiva ' + key);
    var ctx = c.getContext('2d');
    window.renderFrame = function (t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1280, 720);
      if (NS.slides && NS.slides.render) NS.slides.render(ctx, key, { t: t || 0, p: 1 });
      return true;
    };
    window.videoDuration = 1;
    window.renderFrame(0);
    window.renderReady = true;
  }

  function renderStyle(params) {
    var c = bareCanvas('Hoja de estilo');
    var page = params.page || '1';
    window.renderPage = function (n) {
      var ctx = c.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 1280, 720);
      NS.style.testsheet(c, n);
      return true;
    };
    window.renderPage(page);
    window.renderReady = true;
  }

  function boot() {
    var params = U.params();
    fontsReady().then(function () {
      try {
        if (params.render === 'estilo') return renderStyle(params);
        if (params.render && params.render.indexOf('slide:') === 0) return renderSlide(params.render.slice(6));
        if (params.render) return renderVideo(params.render, params);
        if (NS.style.decoratePage) NS.style.decoratePage();
        if (NS.ui.shell && NS.ui.shell.mount) NS.ui.shell.mount();
        NS.router.start();
      } catch (e) {
        console.error(e);
        window.renderError = String(e && e.stack || e);
      }
    });
  }

  boot();
})(window.IAHI);
