/* «Descargar video» (base §3): one full linear pass in real time, canvas.captureStream(24) plus the
   narration when it can be captured, into MediaRecorder with a 1 s timeslice. Without capturable
   voice (file:// or browser voice) it says so first and records without voice. */
(function (NS) {
  'use strict';
  var U = NS.util, TL = NS.engine.timeline;

  function pickType() {
    var types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
    for (var i = 0; i < types.length; i++) {
      try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) return types[i]; } catch (e) { /* ignore */ }
    }
    return '';
  }

  function record(player, fromT, toT, label) {
    if (!window.MediaRecorder || !player.el.canvas.captureStream) {
      U.announce('Este navegador no permite grabar el video.');
      alertBox(player, 'Este navegador no permite grabar el video. Pruebe con una versión reciente de Chrome, Edge o Firefox.');
      return;
    }
    var tl = player.tl;
    fromT = fromT || 0; toT = toT || tl.duration;
    var canVoice = player.narrator && player.narrator.mode === 'audio' && location.protocol !== 'file:';
    var mins = Math.ceil((toT - fromT) / 60);
    var msg = (canVoice ? '' : (location.protocol === 'file:'
      ? 'La página está abierta como archivo (file://) y el navegador no deja capturar la voz. '
      : 'La voz del navegador no se puede capturar. ')) +
      'La grabación tarda unos ' + mins + ' min: mantenga esta pestaña visible.';
    confirmBox(player, msg, canVoice ? 'Grabar' : 'Grabar sin voz', function () { start(player, fromT, toT, canVoice, label); });
  }

  function start(player, fromT, toT, canVoice, label) {
    var tl = player.tl;
    var canvas = player.el.canvas;
    var stream = canvas.captureStream(24);
    var audioCtx = null;
    if (canVoice) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var src = audioCtx.createMediaElementSource(player.narrator.audio);
        var dest = audioCtx.createMediaStreamDestination();
        src.connect(dest); src.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
      } catch (e) { canVoice = false; }
    }
    var type = pickType();
    var rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    var progress = U.el('p', { class: 'rec-progress', 'aria-live': 'polite', text: 'Grabando… 0 %' });
    player.el.fig.appendChild(progress);
    var t0 = performance.now();
    var linear = { subtitles: player.settings.subtitles, linear: true };
    if (canVoice) { player.narrator.audio.currentTime = fromT; player.narrator.audio.play(); }
    rec.start(1000);
    function step() {
      var t = fromT + (performance.now() - t0) / 1000;
      if (t >= toT) {
        rec.stop();
        return;
      }
      player.renderer.frame(player.el.ctx, tl, t, linear);
      progress.textContent = 'Grabando… ' + Math.round((t - fromT) / (toT - fromT) * 100) + ' %';
      requestAnimationFrame(step);
    }
    rec.onstop = function () {
      if (canVoice) player.narrator.audio.pause();
      if (audioCtx) audioCtx.close();
      var ext = (rec.mimeType || type || '').indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      U.download(player.video.slug + (label ? '-' + label : '') + '.' + ext, new Blob(chunks, { type: rec.mimeType || 'video/webm' }));
      progress.textContent = 'Grabación lista.';
      setTimeout(function () { progress.remove(); }, 4000);
      player.draw(player.t);
    };
    requestAnimationFrame(step);
  }

  function confirmBox(player, msg, okLabel, onOk) {
    var box = U.el('div', { class: 'card rec-confirm', role: 'dialog', 'aria-label': 'Descargar video' }, [
      U.el('p', { text: msg }),
      U.el('div', { class: 'row' }, [
        U.el('button', { type: 'button', class: 'btn btn-primary', text: okLabel, onclick: function () { box.remove(); onOk(); } }),
        U.el('button', { type: 'button', class: 'btn btn-quiet', text: 'Descargar este capítulo', onclick: function () {
          box.remove();
          var ch = TL.chapterAt(player.tl, player.t) || player.tl.chapters[0];
          start(player, ch.start, ch.end, player.narrator.mode === 'audio' && location.protocol !== 'file:', 'capitulo');
        } }),
        U.el('button', { type: 'button', class: 'btn btn-quiet', text: 'Cancelar', onclick: function () { box.remove(); } })
      ])
    ]);
    player.el.fig.appendChild(box);
    box.querySelector('button').focus();
  }
  function alertBox(player, msg) {
    var box = U.el('p', { class: 'card rec-confirm', role: 'status', text: msg });
    player.el.fig.appendChild(box);
    setTimeout(function () { box.remove(); }, 6000);
  }

  NS.engine.recorder = { record: record };
})(window.IAHI);
