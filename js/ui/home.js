/* Home (#/) · spec §7: hero (a silent 20-second canvas loop: a desk with a laptop showing a small
   video call, an open notebook whose ruled lines fill one by one, a stack of article cards and the
   small lamp), the six axes, «La ruta del curso», «Cómo funciona el curso», «Producto final». */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function drawHero(ctx, t) {
    var S = NS.style, C = NS.course, P = S.path, E = NS.engine.ease;
    S.background(ctx, 'hero', { W: 1280, H: 720, seed: 2, t: t });
    var loop = (t % 20) / 20;
    // desk
    S.shape(ctx, P.rect(120, 470, 1040, 40, 10), { role: 'accent-7', seed: 5, weight: 'regular' });
    S.shape(ctx, P.rect(160, 505, 960, 170, 8), { role: 'accent-8', seed: 6, weight: 'regular' });
    // laptop with a small video-call grid on its screen
    var lap = C.prop(ctx, 'laptop', { x: 470, y: 470, w: 380, seed: 4, screenRole: 'ground-2' });
    var sc = lap.screen, cols = 3, rows = 2, gw = (sc.w - 24) / cols, gh = (sc.h - 24) / rows;
    for (var i = 0; i < cols * rows; i++) {
      C.prop(ctx, 'tile', { x: sc.x + 8 + (i % cols) * (gw + 4), y: sc.y + 8 + Math.floor(i / cols) * (gh + 4), w: gw - 4, h: gh - 4, person: S.extraLook(40 + i), cameraOff: i === 4, seed: 90 + i, t: t, ground: 'ground' });
    }
    // open notebook whose ruled lines fill one by one
    var nb = C.prop(ctx, 'open-notebook', { x: 860, y: 400, w: 300, h: 150, seed: 7 });
    var filled = Math.floor(loop * 12);
    for (var k = 0; k < 12; k++) {
      var side = k < 6 ? nb.left : nb.right, row = k % 6;
      var y = side.y + 22 + row * 20;
      S.stroke(ctx, [[side.x + 14, y], [side.x + side.w - 16, y]], { weight: 'hair', role: 'ink-soft', taper: false, alpha: 0.5, seed: k });
      if (k < filled) S.stroke(ctx, [[side.x + 14, y - 3], [side.x + 14 + (side.w - 40) * (0.5 + 0.4 * ((k * 7) % 5) / 5), y - 4]], { weight: 'thin', taper: false, seed: 30 + k });
      else if (k === filled) S.stroke(ctx, [[side.x + 14, y - 3], [side.x + 14 + (side.w - 40) * 0.8 * E.inOut((loop * 12) % 1), y - 4]], { weight: 'thin', taper: false, seed: 30 + k });
    }
    // a stack of article cards and the small lamp to one side
    C.prop(ctx, 'card-stack', { x: 230, y: 470, w: 110, h: 76, n: 5 });
    C.lamp(ctx, 'lampara', { x: 1065, y: 432, r: 30, t: t });
  }

  NS.ui.views.home = {
    title: function () { return ''; },
    render: function (main) {
      var T = NS.data.ui, H = T.home;
      var hero = U.el('section', { class: 'hero' });
      var text = U.el('div', {}, [
        U.el('h1', { text: T.siteTitle }),
        U.el('p', { class: 'lead', text: T.siteSubtitle }),
        U.el('p', { class: 'lead', html: '<strong>' + U.esc(H.question) + '</strong>' }),
        U.el('p', { text: H.lead }),
        U.el('div', { class: 'row' }, [
          U.el('a', { class: 'btn btn-primary', href: '#/sesion/1', text: H.buttons[0] }),
          U.el('a', { class: 'btn', href: '#/programa', text: H.buttons[1] }),
          U.el('a', { class: 'btn', href: '#/cuaderno', text: H.buttons[2] })
        ])
      ]);
      var c = U.el('canvas', { width: 1280, height: 720, role: 'img', 'aria-label': 'Un escritorio con un computador portátil que muestra una videollamada, un cuaderno abierto que se llena, una pila de artículos y la pequeña lámpara de IA a un lado.' });
      hero.appendChild(text);
      hero.appendChild(c);
      main.appendChild(hero);
      main.appendChild(ui.legendRow((NS.data.legend || []).map(function (l) { return l.id; })));
      // the loop (still frame with reduced motion; paused off-screen)
      var ctx = c.getContext('2d'), raf = 0, t0 = performance.now(), visible = true;
      function frame() {
        if (!document.body.contains(c)) return;
        if (visible) drawHero(ctx, (performance.now() - t0) / 1000);
        raf = requestAnimationFrame(frame);
      }
      if (U.prefersReducedMotion()) drawHero(ctx, 8);
      else {
        if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(c);
        frame();
      }
      this._stop = function () { cancelAnimationFrame(raf); };

      // «Los seis ejes»
      var ejes = ui.section(H.ejesTitle, { id: 'ejes' });
      ejes.appendChild(U.el('div', { class: 'grid grid-3' }, (NS.data.legend || []).map(function (l) {
        return U.el('article', { class: 'card no-blob' }, [ui.legendChip(l.id), U.el('p', { text: l.question })]);
      })));
      ejes.appendChild(U.el('a', { class: 'btn', href: '#/ejes', text: H.ejesLink }));
      main.appendChild(ejes);

      // «La ruta del curso»
      var ruta = ui.section(H.routeTitle, { id: 'ruta' });
      var grid = U.el('div', { class: 'grid grid-4 session-cards' });
      (NS.data.schedule || []).forEach(function (s) {
        var v = ui.videoOf(s.n);
        var before = s.n === 8 ? H.before8 : 'Antes de la sesión: ' + (s.before || '').replace(/^asincrónico,\s*/, '').replace(/,.*$/, '');
        var saved = NS.ui.wb.productSaved(s.n);
        grid.appendChild(U.el('a', { class: 'card card-link ' + ['accent-1', 'accent-2', 'accent-3'][s.n % 3], href: '#/sesion/' + s.n }, [
          U.el('p', { class: 'session-num', text: String(s.n) }),
          U.el('h3', { text: 'Sesión ' + s.n + ' · ' + s.title }),
          U.el('p', { class: 'small', text: before }),
          U.el('p', { class: 'small', html: 'Producto: ' + U.markup(s.product || '') }),
          v ? U.el('p', { class: 'small', text: 'Video: ' + ui.videoLength(v) }) : null,
          U.el('span', { class: 'chip', text: saved ? H.saved : H.pending })
        ]));
      });
      ruta.appendChild(grid);
      main.appendChild(ruta);

      // «Cómo funciona el curso» (content Programa · Metodología, verbatim)
      var met = (NS.data.programa || []).filter(function (s) { return s.title && /^Metodología/.test(s.title); })[0];
      if (met) {
        var how = ui.section(H.howTitle, { id: 'como' });
        how.appendChild(ui.blocks(met.blocks));
        main.appendChild(how);
      }
      // «Producto final»
      var fin = ui.section(H.finalTitle, { id: 'final' });
      fin.appendChild(U.el('p', { text: H.finalText }));
      fin.appendChild(U.el('a', { class: 'btn', href: '#/proyecto', text: H.finalLink }));
      main.appendChild(fin);
      main.appendChild(ui.stamp('stamp-metodo'));
      main.appendChild(U.el('p', { class: 'note', text: T.consulted }));
    },
    leave: function () { if (this._stop) this._stop(); }
  };

  NS.ui.views.notfound = {
    title: function () { return ''; },
    render: function (main) {
      main.appendChild(U.el('h1', { text: NS.data.ui.notFound }));
      main.appendChild(U.el('a', { class: 'btn', href: '#/', text: NS.data.ui.backHome }));
    }
  };
})(window.IAHI);
