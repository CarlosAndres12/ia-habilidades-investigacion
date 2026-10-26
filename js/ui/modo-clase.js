/* «Modo clase» (#/sesion/n/clase, #/clase) · spec §7: the start card with the screen-sharing and
   recording rules; the live slides (← → RePág AvPág, N notes, T timer, Esc leaves; the last slide of
   each session is remembered); the session clock over the agenda; the activity timers; the pause
   slide with a 10-minute countdown that never ends the pause on its own; videos only on request. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  var state = null;

  function chooser(main) {
    var T = NS.data.ui.clase;
    main.appendChild(U.el('h1', { text: T.choose }));
    main.appendChild(U.el('div', { class: 'grid grid-4' }, (NS.data.schedule || []).map(function (s) {
      return U.el('a', { class: 'card card-link', href: '#/sesion/' + s.n + '/clase' }, [U.el('p', { class: 'session-num', text: String(s.n) }), U.el('h2', { class: 'h3', text: s.title })]);
    })));
  }

  function parseMin(r) { var m = String(r || '').match(/(\d+)\s*[–-]\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : null; }

  NS.ui.views.clase = {
    title: function (p) { return NS.data.ui.clase.timer && p.n ? 'Modo clase · Sesión ' + p.n : 'Modo clase'; },
    render: function (main, p) {
      var T = NS.data.ui.clase;
      if (!p.n) { chooser(main); return; }
      var n = parseInt(p.n, 10);
      var S = NS.data.sesiones[n], sched = NS.data.schedule[n - 1];
      var list = NS.slides.list(n);
      var k = Math.min(list.length, Math.max(1, NS.store.get('clase:slide:' + n, 1) || 1));
      state = { n: n, k: k, raf: 0, clock: { running: false, base: 0, t0: 0 }, pauseT0: 0 };

      var wrap = U.el('div', { class: 'clase' });
      main.appendChild(wrap);
      // start card
      var start = U.el('div', { class: 'card no-blob clase-start', role: 'dialog', 'aria-label': 'Modo clase' }, [
        U.el('h1', { text: 'Modo clase · Sesión ' + n + ' · ' + S.title }),
        U.el('p', { class: 'lead', text: T.start1 }),
        U.el('p', { class: 'lead', text: T.start2 }),
        U.el('p', { class: 'note', text: T.keys }),
        U.el('div', { class: 'row' }, [
          U.el('button', { type: 'button', class: 'btn btn-primary', text: T.startBtn, onclick: function () { start.remove(); body.hidden = false; try { if (wrap.requestFullscreen) { var fp = wrap.requestFullscreen(); if (fp && fp.catch) fp.catch(function () { /* full screen not allowed */ }); } } catch (e) { /* ignore */ } canvas.focus(); draw(); } }),
          U.el('a', { class: 'btn btn-quiet', href: '#/sesion/' + n, text: T.exit })
        ])
      ]);
      wrap.appendChild(start);

      var body = U.el('div', { class: 'clase-body', hidden: true });
      wrap.appendChild(body);
      var top = U.el('div', { class: 'clase-top' }, [U.el('h1', { class: 'h3', text: 'Sesión ' + n + ' · ' + S.title }), U.el('a', { class: 'btn btn-small btn-quiet', href: '#/sesion/' + n, text: T.exit })]);
      body.appendChild(top);
      var grid = U.el('div', { class: 'clase-grid' });
      body.appendChild(grid);

      // ---- deck
      var deck = U.el('div', { class: 'clase-deck' });
      var canvas = U.el('canvas', { width: 1280, height: 720, tabindex: '0', role: 'img', 'aria-label': '' });
      var counter = U.el('span', { class: 'score', 'aria-live': 'polite' });
      var notesBtn = U.el('button', { type: 'button', class: 'btn btn-small', 'aria-expanded': 'false', text: T.notes + ' (N)' });
      var timerBtn = U.el('button', { type: 'button', class: 'btn btn-small', 'aria-expanded': 'false', text: T.timer + ' (T)' });
      var videoBtn = U.el('button', { type: 'button', class: 'btn btn-small', text: NS.data.widgets.seeVideo });
      var nav = U.el('div', { class: 'deck-nav' }, [
        U.el('button', { type: 'button', class: 'btn btn-small', 'aria-label': 'Diapositiva anterior', text: '←', onclick: function () { go(state.k - 1); } }),
        counter,
        U.el('button', { type: 'button', class: 'btn btn-small', 'aria-label': 'Diapositiva siguiente', text: '→', onclick: function () { go(state.k + 1); } }),
        notesBtn, timerBtn, videoBtn
      ]);
      var notes = U.el('div', { class: 'card no-blob clase-notes', hidden: true });
      var figs = U.el('div', { class: 'clase-figs' });
      var videoBox = U.el('div', { class: 'clase-video', hidden: true });
      deck.appendChild(canvas); deck.appendChild(nav); deck.appendChild(notes); deck.appendChild(videoBox); deck.appendChild(figs);
      grid.appendChild(deck);

      // ---- side: session clock over the agenda, activity timers
      var side = U.el('aside', { class: 'clase-side' });
      var clock = U.el('p', { class: 'clock', role: 'timer', text: '0:00' });
      var over = U.el('p', { class: 'note', 'aria-live': 'polite' });
      var clockBtn = U.el('button', { type: 'button', class: 'btn btn-primary btn-small', text: T.clockStart });
      var agenda = U.el('ol', { class: 'agenda-list' }, (sched.agenda || []).map(function (r) {
        return U.el('li', {}, [U.el('span', { class: 'agenda-min', text: r.minutes + ' · ' }), U.el('span', { html: U.markup(r.block) })]);
      }));
      side.appendChild(U.el('div', { class: 'card no-blob' }, [
        U.el('h2', { class: 'h4', text: 'Reloj de la sesión' }), clock,
        U.el('div', { class: 'row' }, [clockBtn, U.el('button', { type: 'button', class: 'btn btn-small', text: T.clockReset, onclick: function () { state.clock = { running: false, base: 0, t0: 0 }; clockBtn.textContent = T.clockStart; tickClock(); } })]),
        over, agenda
      ]));
      var timers = U.el('div', { class: 'clase-timers', hidden: true });
      ((NS.data.widgets.claseTimers || {})[n] || []).forEach(function (tm) {
        if (tm.debate) timers.appendChild(ui.widgets.temporizador({ title: tm.title, segments: NS.data.widgets.debate.timer }));
        else if (tm.presentations) timers.appendChild(ui.widgetByName('presentaciones', { clase: true }));
        else timers.appendChild(ui.widgets.temporizador({ title: tm.title, segments: tm.segments, notices: tm.notices }));
      });
      side.appendChild(timers);
      grid.appendChild(side);

      clockBtn.addEventListener('click', function () {
        var c = state.clock;
        if (c.running) { c.base += (performance.now() - c.t0) / 1000; c.running = false; clockBtn.textContent = T.clockStart; }
        else { c.t0 = performance.now(); c.running = true; clockBtn.textContent = T.clockPause; }
      });
      function elapsed() { var c = state.clock; return c.base + (c.running ? (performance.now() - c.t0) / 1000 : 0); }
      function tickClock() {
        var e = elapsed(), min = e / 60;
        clock.textContent = U.clock(e);
        var cur = -1;
        (sched.agenda || []).forEach(function (r, i) { var m = parseMin(r.minutes); if (m && min >= m[0] && min < m[1]) cur = i; });
        U.$$('li', agenda).forEach(function (li, i) { if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
        // the block of the current slide ran over its time
        var sl = list[state.k - 1], m2 = sl && parseMin(sl.minutes);
        over.textContent = m2 && state.clock.running && min > m2[1] ? T.over : '';
      }

      notesBtn.addEventListener('click', function () { toggleNotes(); });
      timerBtn.addEventListener('click', function () { toggleTimers(); });
      function toggleNotes() { notes.hidden = !notes.hidden; notesBtn.setAttribute('aria-expanded', notes.hidden ? 'false' : 'true'); }
      function toggleTimers() { timers.hidden = !timers.hidden; timerBtn.setAttribute('aria-expanded', timers.hidden ? 'false' : 'true'); if (!timers.hidden) { var b = timers.querySelector('button'); if (b) b.focus(); } }
      videoBtn.addEventListener('click', function () {
        var sl = list[state.k - 1];
        if (!sl.chapter) return;
        videoBox.hidden = false;
        videoBox.innerHTML = '';
        var pl = NS.engine.player.mount(videoBox, sl.chapter.video, { chapterPause: true });
        pl.init();
        pl.gotoChapter(sl.chapter.index, false);
        videoBox.scrollIntoView({ behavior: 'smooth' });
      });

      function go(k) {
        state.k = Math.max(1, Math.min(list.length, k));
        NS.store.set('clase:slide:' + n, state.k);
        state.pauseT0 = performance.now();
        videoBox.hidden = true; videoBox.innerHTML = ''; NS.engine.player.pauseAll();
        draw();
      }
      function draw() {
        var sl = list[state.k - 1];
        var ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        NS.slides.render(ctx, n + '-' + state.k, { t: sl.pause ? (performance.now() - state.pauseT0) / 1000 : 0 });
        canvas.setAttribute('aria-label', sl.title + '. ' + sl.points.join(' '));
        counter.textContent = state.k + ' / ' + list.length;
        videoBtn.hidden = !sl.chapter;
        notes.innerHTML = '';
        notes.appendChild(U.el('h3', { text: T.notes }));
        if (sl.notes.axes.length) notes.appendChild(ui.legendRow(sl.notes.axes));
        notes.appendChild(U.el('ul', {}, sl.notes.items.map(function (x) { return U.el('li', { html: U.markup(x) }); })));
        figs.innerHTML = '';
        if (sl.figs.length > (sl.scenes.length ? 1 : 2)) figs.appendChild(ui.figureGrid(sl.figs));
      }
      function loop() {
        if (!document.body.contains(canvas)) return;
        tickClock();
        var sl = list[state.k - 1];
        if (sl && sl.pause && !body.hidden) draw();
        state.raf = setTimeout(loop, 500);
      }
      state.keys = function (ev) {
        if (body.hidden) return;
        if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
        if (ev.key === 'ArrowRight' || ev.key === 'PageDown') { ev.preventDefault(); go(state.k + 1); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); go(state.k - 1); }
        else if (ev.key === 'n' || ev.key === 'N') toggleNotes();
        else if (ev.key === 't' || ev.key === 'T') toggleTimers();
        else if (ev.key === 'Escape') { if (document.fullscreenElement) { var xp = document.exitFullscreen(); if (xp && xp.catch) xp.catch(function () {}); } else location.hash = '#/sesion/' + n; }
      };
      document.addEventListener('keydown', state.keys);
      loop();
    },
    leave: function () {
      if (!state) return;
      clearTimeout(state.raf);
      if (state.keys) document.removeEventListener('keydown', state.keys);
      try { if (document.fullscreenElement) { var xp = document.exitFullscreen(); if (xp && xp.catch) xp.catch(function () {}); } } catch (e) { /* ignore */ }
      state = null;
    }
  };
})(window.IAHI);
