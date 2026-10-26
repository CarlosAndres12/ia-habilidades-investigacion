/* Runtime narration (base §4.6).
   Audio-track mode: when assets/audio/manifest.js lists the video and its mp3 loads, the audio
   element is the master clock (the player smooths it). Browser-voice fallback: speechSynthesis,
   one voice per role in the order of spec §5.5, one subtitle chunk per utterance; if an utterance
   is still speaking when its slot ends, the player holds the frame until it finishes. */
(function (NS) {
  'use strict';
  var voicesReady = null;
  function loadVoices() {
    if (voicesReady) return voicesReady;
    voicesReady = new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) { resolve([]); return; }
      var got = window.speechSynthesis.getVoices();
      if (got && got.length) { resolve(got); return; }
      var done = false;
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        if (done) return; done = true; resolve(window.speechSynthesis.getVoices());
      });
      setTimeout(function () { if (!done) { done = true; resolve(window.speechSynthesis.getVoices() || []); } }, 2500);
    });
    return voicesReady;
  }

  // Pick a voice per role: person's name + locale first, then other names, then same language.
  function pickVoices(voices, cast) {
    var used = {};
    var out = {};
    Object.keys(cast).forEach(function (rid) {
      var c = cast[rid];
      var fb = c.fallback || {};
      var tries = (fb.names || []);
      var v = null;
      for (var i = 0; i < tries.length && !v; i++) {
        var t = tries[i];
        v = voices.filter(function (vv) {
          return vv.name.indexOf(t.name) >= 0 && (!t.lang || (vv.lang || '').replace('_', '-').toLowerCase().indexOf(t.lang.toLowerCase()) === 0) && !used[vv.name];
        })[0] || null;
      }
      if (!v) v = voices.filter(function (vv) { return /^es/i.test(vv.lang) && !used[vv.name]; })[0] || null;
      if (!v) v = voices.filter(function (vv) { return /^es/i.test(vv.lang); })[0] || null;
      if (v) used[v.name] = true;
      out[rid] = { voice: v, pitch: fb.pitch || 1, rate: fb.rate || 1 };
    });
    return out;
  }

  function Narrator(video, opts) {
    this.video = video;
    this.opts = opts || {};
    this.mode = 'silent';
    this.audio = null;
    this.spoken = {};
    this.speaking = false;
    this.speakingUntil = 0;
    this.enabled = true;
    this.rate = 1;
    this.voices = null;
  }

  Narrator.prototype.init = function () {
    var self = this;
    var man = (NS.audioManifest || {})[this.video.id];
    var castMap = {};
    (NS.data.cast || []).forEach(function (c) { if (c.voice) castMap[c.id] = c; });
    if (man && man.file && !this.opts.forceBrowser) {
      return new Promise(function (resolve) {
        var a = new Audio();
        a.preload = 'auto';
        a.src = 'assets/audio/' + man.file;
        var settled = false;
        a.addEventListener('canplaythrough', function () { if (settled) return; settled = true; self.audio = a; self.mode = 'audio'; self.manifest = man; resolve(self); }, { once: true });
        a.addEventListener('error', function () { if (settled) return; settled = true; self.initBrowser(castMap).then(resolve); }, { once: true });
        setTimeout(function () { if (!settled) { settled = true; self.initBrowser(castMap).then(resolve); } }, 4000);
        a.load();
      });
    }
    return this.initBrowser(castMap);
  };

  Narrator.prototype.initBrowser = function (castMap) {
    var self = this;
    if (!('speechSynthesis' in window)) { this.mode = 'silent'; return Promise.resolve(this); }
    return loadVoices().then(function (voices) {
      self.voices = pickVoices(voices || [], castMap);
      self.mode = voices && voices.length ? 'browser' : 'silent';
      return self;
    });
  };

  Narrator.prototype.reset = function () {
    this.spoken = {};
    this.cancel();
  };
  Narrator.prototype.cancel = function () {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    this.speaking = false;
  };

  // Browser mode: speak the chunk active at t once.
  Narrator.prototype.tick = function (tl, t, playing) {
    if (this.mode !== 'browser' || !this.enabled || !playing) return;
    var ch = NS.engine.timeline.chunkAt(tl, t);
    if (!ch) return;
    var key = ch.line.start.toFixed(3) + ':' + ch.index;
    if (this.spoken[key]) return;
    if (t > ch.end - 0.05) return;           // too late: do not speak a chunk after its slot
    this.spoken[key] = true;
    var v = (this.voices || {})[ch.voice] || {};
    var text = ch.text;
    if (NS.engine.speakable) text = NS.engine.speakable(text);
    var u = new SpeechSynthesisUtterance(text);
    if (v.voice) { u.voice = v.voice; u.lang = v.voice.lang; } else u.lang = 'es-CO';
    u.pitch = v.pitch || 1;
    u.rate = (v.rate || 1) * this.rate;
    var self = this;
    self.speaking = true;
    u.onend = u.onerror = function () { self.speaking = false; };
    try { window.speechSynthesis.speak(u); } catch (e) { self.speaking = false; }
  };

  // Should the player hold the frame? (browser voice still speaking past the end of its chunk)
  Narrator.prototype.holding = function (tl, t) {
    if (this.mode !== 'browser' || !this.enabled || !this.speaking) return false;
    var ch = NS.engine.timeline.chunkAt(tl, t);
    if (ch) return false;
    return true;
  };

  NS.engine.Narrator = Narrator;
  NS.engine.loadVoices = loadVoices;

  // Minimal speakable text for the browser fallback (the tools use tools/lib/normalize-es.mjs).
  NS.engine.speakable = function (s) {
    return String(s)
      .replace(/«|»/g, '')
      .replace(/EE\. UU\./g, 'Estados Unidos')
      .replace(/\bIA\b/g, 'i a')
      .replace(/(\d) %/g, '$1 por ciento')
      .replace(/US\$(\d[\d.,]*) millones/g, '$1 millones de dólares')
      .replace(/(\d)\.(\d{3})/g, '$1$2');
  };
})(window.IAHI);
