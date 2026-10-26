/* Timer (spec §8.0 «temporizador»): labeled segments, large digits in the body face, «Iniciar»,
   «Pausar», «Reiniciar», a quiet visual notice at each segment's end (sound off by default, with
   «Activar sonido»). opts: { title, segments: [[label, minutes]…], notices: { minute: text } }. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  var audio = null;
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 660; g.gain.value = 0.06;
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.25);
    } catch (e) { /* no sound available */ }
  }

  ui.widgets.temporizador = function (opts) {
    var W = NS.data.widgets.timer;
    var segs = opts.segments.map(function (s) { return { label: s[0], secs: Math.round(s[1] * 60) }; });
    var total = segs.reduce(function (a, s) { return a + s.secs; }, 0);
    var elapsed = 0, running = false, t0 = 0, base = 0, raf = 0, sound = false, firedNotices = {};
    var wrap = U.el('section', { class: 'widget timer card no-blob', 'aria-label': opts.title || W.start });
    if (opts.title) wrap.appendChild(U.el('h4', { text: opts.title }));
    var label = U.el('p', { class: 'timer-label' });
    var display = U.el('p', { class: 'timer-display', 'aria-live': 'off', role: 'timer' });
    var notice = U.el('p', { class: 'timer-notice', 'aria-live': 'polite' });
    var bar = U.el('div', { class: 'timer-bar', 'aria-hidden': 'true' });
    var segEls = segs.map(function (s) {
      var el = U.el('span', { class: 'timer-seg', style: { flexGrow: String(s.secs) }, title: s.label + ' · ' + U.clock(s.secs) });
      bar.appendChild(el);
      return el;
    });
    var list = U.el('ol', { class: 'agenda-list timer-list' }, segs.map(function (s) { return U.el('li', {}, [U.el('span', { class: 'agenda-min', text: U.clock(s.secs) + ' · ' }), s.label]); }));
    var startBtn = U.el('button', { type: 'button', class: 'btn btn-primary', text: W.start });
    var resetBtn = U.el('button', { type: 'button', class: 'btn', text: W.reset });
    var soundBtn = U.el('button', { type: 'button', class: 'btn btn-quiet', text: W.sound, 'aria-pressed': 'false' });
    function current() {
      var acc = 0;
      for (var i = 0; i < segs.length; i++) { if (elapsed < acc + segs[i].secs) return { i: i, left: acc + segs[i].secs - elapsed }; acc += segs[i].secs; }
      return { i: segs.length - 1, left: 0 };
    }
    var lastSeg = -1;
    function draw() {
      var c = current();
      label.textContent = segs[c.i].label;
      display.textContent = U.clock(c.left);
      segEls.forEach(function (el, i) { el.classList.toggle('is-current', i === c.i); el.classList.toggle('is-past', i < c.i); });
      U.$$('li', list).forEach(function (li, i) { if (i === c.i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      if (lastSeg !== -1 && c.i !== lastSeg) {
        notice.textContent = W.segmentEnd.replace('{s}', segs[lastSeg].label) + ' · ' + W.next.replace('{s}', segs[c.i].label);
        if (sound) beep();
      }
      lastSeg = c.i;
      if (opts.notices) Object.keys(opts.notices).forEach(function (m) {
        if (!firedNotices[m] && elapsed >= Number(m) * 60) { firedNotices[m] = true; notice.textContent = opts.notices[m]; if (sound) beep(); }
      });
      if (elapsed >= total && running) { stop(); notice.textContent = W.segmentEnd.replace('{s}', segs[segs.length - 1].label); if (sound) beep(); }
    }
    function tick() { if (!running) return; elapsed = Math.min(total, base + (performance.now() - t0) / 1000); draw(); raf = requestAnimationFrame(tick); }
    function start() { if (elapsed >= total) return; running = true; t0 = performance.now(); base = elapsed; startBtn.textContent = W.pause; tick(); }
    function stop() { running = false; cancelAnimationFrame(raf); startBtn.textContent = W.start; }
    startBtn.addEventListener('click', function () { if (running) stop(); else start(); });
    resetBtn.addEventListener('click', function () { stop(); elapsed = 0; base = 0; firedNotices = {}; lastSeg = -1; notice.textContent = ''; draw(); });
    soundBtn.addEventListener('click', function () { sound = !sound; soundBtn.setAttribute('aria-pressed', sound ? 'true' : 'false'); soundBtn.textContent = sound ? W.soundOff : W.sound; });
    wrap.appendChild(label); wrap.appendChild(display); wrap.appendChild(bar); wrap.appendChild(notice);
    wrap.appendChild(U.el('div', { class: 'row', style: { justifyContent: 'center' } }, [startBtn, resetBtn, soundBtn]));
    wrap.appendChild(list);
    document.addEventListener('iahi:route', stop, { once: true });
    draw();
    wrap.stop = stop;
    return wrap;
  };
})(window.IAHI);
