/* Session views #/sesion/1 … #/sesion/8 (spec §7): header, «Antes de la sesión», the video, the
   agenda, the topics in three parts («Explicación», «Implicaciones para la investigación»,
   «Práctica»), «Errores frecuentes de lectura», products, «Para profundizar», «Para el docente»,
   sources and the navigation between sessions. Everything is read from js/data. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  var PRACTICE = /^(\*\*)?(Demo|Actividad|Taller|Práctica|Discusión|Ejercicio|Encuesta|Debate|Dinámica|Mini auditoría|Preparación|Lectura|Caso)/;

  // split a topic's blocks into explanation and practice; implications come tagged from the data
  function split(part) {
    var explain = [], practice = [], state = 'explain', skipUl = false;
    (part.blocks || []).forEach(function (b) {
      // the part label already says «Explicación»: drop the content's own lead word
      if (b.type === 'p' && /^\*\*Explicación\.?\*\*\s*$/.test(b.text)) return;
      if (b.type === 'p' && /^\*\*Explicación\.\*\*\s+/.test(b.text)) b = { type: 'p', text: b.text.replace(/^\*\*Explicación\.\*\*\s+/, '') };
      if (skipUl && b.type === 'ul') { skipUl = false; return; }
      skipUl = false;
      if (b.type === 'p' && /^\*\*(Implicaciones|Por qué importa)/.test(b.text)) {
        if (/^\*\*Implicaciones/.test(b.text)) skipUl = true;
        state = state === 'explain' ? 'after' : state;
        return;
      }
      if (b.type === 'p' && PRACTICE.test(b.text)) state = 'practice';
      if (state === 'explain') explain.push(b); else practice.push(b);
    });
    return { explain: explain, practice: practice, implications: part.implications || [] };
  }
  ui.splitTopic = split;

  function topicKey(n, title) {
    var map = ((NS.data.widgets || {}).topics || {})[n] || {};
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) if (title.indexOf(keys[i]) === 0) return keys[i];
    return null;
  }
  function placementKey(n, title) {
    var map = ((NS.data.widgets || {}).placements || {})[n] || {};
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) if (title.indexOf(keys[i]) === 0) return keys[i];
    return null;
  }

  // a widget by its placement name ('juego:tipo-modelo', 'lista:B8', 'foto-aa'…)
  ui.widgetByName = function (name, ctx) {
    var W = ui.widgets;
    if (name.indexOf('juego:') === 0) return W.clasificar(name.slice(6));
    if (name.indexOf('lista:') === 0) return W.listaPlantilla(name.slice(6));
    var fn = W[name.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); })] || W[name];
    if (!fn) return null;
    try { return fn(ctx || {}); } catch (e) { console.error('widget ' + name, e); return null; }
  };

  function videoOf(n) { return (NS.data.videos || []).filter(function (v) { return String(v.session) === String(n); })[0]; }
  function videoLength(v) {
    var man = (NS.audioManifest || {})[v.id];
    if (man && man.duration) return U.clock(man.duration);
    var castW = {};
    (NS.data.cast || []).forEach(function (c) { castW[c.id] = { wordsPerSecond: c.wordsPerSecond || 2.4 }; });
    var tl = NS.engine.timeline.build(v, { cast: castW });
    return 'unos ' + Math.round(tl.duration / 60) + ' min';
  }
  ui.videoLength = videoLength;
  ui.videoOf = videoOf;

  function renderTopic(n, part, idx) {
    var T = NS.data.ui.session;
    var sec = U.el('section', { class: 'section topic', id: 'tema-' + (idx + 1), 'aria-labelledby': 'tema-' + (idx + 1) + '-h' });
    sec.appendChild(U.el('h2', { id: 'tema-' + (idx + 1) + '-h', text: part.title }));
    var sp = split(part);
    var tk = topicKey(n, part.title);
    var topic = tk ? NS.data.widgets.topics[n][tk] : {};
    // 1. Explicación
    sec.appendChild(ui.partLabel(T.parts[0]));
    sec.appendChild(ui.blocks(sp.explain, { tableCell: priceCell }));
    (topic.scenes || []).forEach(function (ref) { var f = ui.sceneFigure(ref); if (f) sec.appendChild(f); });
    if (topic.figs && topic.figs.length) sec.appendChild(ui.figureGrid(topic.figs));
    // 2. Implicaciones
    if (sp.implications.length) {
      sec.appendChild(ui.divider());
      sec.appendChild(ui.partLabel(T.parts[1]));
      sec.appendChild(U.el('div', { class: 'grid grid-2' }, sp.implications.map(ui.implicationCard)));
    }
    // 3. Práctica
    var pk = placementKey(n, part.title);
    var widgets = pk ? NS.data.widgets.placements[n][pk] : [];
    if (sp.practice.length || widgets.length) {
      sec.appendChild(ui.divider('spiral'));
      sec.appendChild(ui.partLabel(T.parts[2]));
      sec.appendChild(ui.blocks(sp.practice, { tableCell: priceCell }));
      widgets.forEach(function (w) { var el = ui.widgetByName(w, { session: n, topic: part.title }); if (el) sec.appendChild(el); });
    }
    return sec;
  }

  // cells with prices or plan limits come from the bank (spec §7 «Herramientas»)
  var PRICE = /US\$|COP |R\$|\/mes|gratis|Gratis|plan gratuito|ilimitad/;
  function priceCell(c, ri, ci, head) {
    if (!PRICE.test(c) || ci === 0) return null;
    return U.markup(c) + ' <span class="badge badge-inline-review">' + U.esc('Revisar antes de clase') + '</span>';
  }
  ui.priceCell = priceCell;

  NS.ui.views.session = {
    title: function (p) { var s = NS.data.sesiones[p.n]; return s ? 'Sesión ' + p.n + ' · ' + s.title : ''; },
    render: function (main, p) {
      var n = parseInt(p.n, 10);
      var S = NS.data.sesiones[n], sched = (NS.data.schedule || [])[n - 1] || {};
      var T = NS.data.ui.session;
      if (!S) { main.appendChild(U.el('p', { text: NS.data.ui.notFound })); return; }
      var video = videoOf(n);
      main.appendChild(U.el('p', { class: 'card-kicker', text: 'Sesión ' + n }));
      main.appendChild(U.el('h1', { text: 'Sesión ' + n + ' · ' + S.title }));
      main.appendChild(ui.blocks(S.intro));
      var beforePart = S.parts.filter(function (x) { return /^Antes de la sesión/.test(x.title); })[0];
      var chips = U.el('div', { class: 'row' });
      if (sched.before) chips.appendChild(U.el('span', { class: 'chip', text: n === 8 ? NS.data.ui.home.before8 : T.before + ': ' + sched.before.replace(/^asincrónico,\s*/, '') }));
      if (sched.product) chips.appendChild(U.el('span', { class: 'chip', html: T.product + ': ' + U.markup(sched.product) }));
      if (video) chips.appendChild(U.el('span', { class: 'chip', text: T.video + ': ' + videoLength(video) }));
      main.appendChild(chips);
      main.appendChild(U.el('div', { class: 'row no-print', style: { marginTop: '1rem' } }, [
        video ? U.el('a', { class: 'btn btn-primary', href: '#/sesion/' + n + '?v=1', text: T.watch, onclick: function (ev) { ev.preventDefault(); var v = document.getElementById('video-sesion'); if (v) v.scrollIntoView({ behavior: 'smooth' }); } }) : null,
        U.el('a', { class: 'btn', href: '#/sesion/' + n + '/clase', text: T.clase }),
        ui.printButton(T.print)
      ]));
      // table of contents
      var toc = U.el('ul', { class: 'toc no-print', 'aria-label': 'En esta página' });
      main.appendChild(toc);
      function tocAdd(id, label) { toc.appendChild(U.el('li', {}, [U.el('a', { class: 'chip', href: '#/sesion/' + n + '?s=' + id, 'data-target': id, text: label, onclick: function (ev) { ev.preventDefault(); var t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: 'smooth' }); } })])); }

      // «Antes de la sesión»
      if (beforePart) {
        var bs = ui.section(beforePart.title, { id: 'antes' });
        var items = [];
        beforePart.blocks.forEach(function (b) { if (b.type === 'ul' || b.type === 'ol') items = items.concat(b.items); });
        var others = beforePart.blocks.filter(function (b) { return b.type !== 'ul' && b.type !== 'ol'; });
        bs.appendChild(ui.blocks(others));
        bs.appendChild(ui.widgets.lista('antes-s' + n, items));
        main.appendChild(bs);
        tocAdd('antes', T.before);
      }
      // the video
      if (video) {
        var vs = ui.section(T.video + ': ' + video.title, { id: 'video-sesion' });
        vs.classList.add('no-print');
        var holder = U.el('div');
        vs.appendChild(holder);
        main.appendChild(vs);
        NS.engine.player.mount(holder, video.id, {});
        tocAdd('video-sesion', T.video);
      }
      // agenda
      var agendaPart = S.parts.filter(function (x) { return /^Agenda/.test(x.title); })[0];
      if (agendaPart) {
        var as = ui.section(agendaPart.title, { id: 'agenda' });
        as.appendChild(ui.blocks(agendaPart.blocks));
        var atk = topicKey(n, 'Agenda');
        if (atk) as.appendChild(ui.figureGrid(NS.data.widgets.topics[n][atk].figs || []));
        as.appendChild(U.el('a', { class: 'btn no-print', href: '#/sesion/' + n + '/clase', text: T.agendaOpen }));
        main.appendChild(as);
        tocAdd('agenda', 'Agenda');
      }
      // topics
      var skip = /^(Antes de la sesión|Agenda|Notas para el docente|Fuentes|Videos para profundizar|Recursos)/;
      var labParts = n === 6 ? /^(Parte [A-E]\.|Anexo de instalación|Problemas frecuentes)/ : (n === 7 ? /^(Parte [AB]\.|Cierre)/ : null);
      var labDone = false;
      S.parts.forEach(function (part, i) {
        if (skip.test(part.title)) return;
        if (labParts && labParts.test(part.title)) {
          if (labDone) return;
          labDone = true;
          var ls = U.el('section', { class: 'section topic', id: 'laboratorio' });
          var lw = ui.widgetByName(n === 6 ? 'laboratorio-1' : 'laboratorio-2', { session: n });
          if (lw) ls.appendChild(lw);
          main.appendChild(ls);
          tocAdd('laboratorio', n === 6 ? NS.data.widgets['laboratorio-1'].title : NS.data.widgets['laboratorio-2'].title);
          if (n === 7) {
            var ws = ui.section(NS.data.widgets.flujo.title, { id: 'flujo' });
            var fw = ui.widgetByName('flujo', { session: n }); if (fw) ws.appendChild(fw);
            main.appendChild(ws);
          }
          return;
        }
        var sec = renderTopic(n, part, i);
        main.appendChild(sec);
        tocAdd(sec.id, part.title.replace(/\s*\(\d+ min\)$/, ''));
      });
      // stamps of the session
      var stamps = ((NS.data.widgets || {}).stamps || {})[n] || [];
      if (stamps.length) main.appendChild(U.el('div', { class: 'stamp-row' }, stamps.map(ui.stamp)));
      // «Errores frecuentes de lectura»
      var errs = (NS.data.errores || {})[n] || [];
      if (errs.length) {
        var es = ui.section(T.errors, { id: 'errores' });
        errs.forEach(function (e) {
          es.appendChild(U.el('div', { class: 'usa-nouses' }, [
            U.el('article', { class: 'card no-blob no-uses' }, [U.el('p', { class: 'no-uses-label', text: T.errorsThink }), U.el('p', { text: '«' + e.said + '»' })]),
            U.el('article', { class: 'card no-blob usa' }, [U.el('p', { class: 'usa-label', text: T.errorsReal }), U.el('p', { text: e.correction })])
          ]));
        });
        main.appendChild(es);
        tocAdd('errores', T.errors);
      }
      // products
      var prods = ((NS.data.workbook || {}).products || {})[n] || [];
      var ps = ui.section(T.products, { id: 'productos' });
      if (sched.product) ps.appendChild(U.el('p', { html: U.markup(sched.product) }));
      ps.appendChild(U.el('ul', {}, prods.map(function (id) {
        var s = NS.ui.wb.section(id);
        return U.el('li', {}, [U.el('a', { href: '#/cuaderno?s=' + id, text: s.n + '. ' + s.title }), ' · ', U.el('span', { class: 'note', text: NS.ui.wb.done(id) ? NS.data.workbook.saved : NS.data.workbook.pending })]);
      })));
      main.appendChild(ps);
      tocAdd('productos', T.products);
      // «Para profundizar»
      var deeper = S.parts.filter(function (x) { return /^(Videos para profundizar|Recursos)/.test(x.title); });
      if (deeper.length) {
        var ds = ui.section(T.deeper, { id: 'profundizar' });
        deeper.forEach(function (d) { ds.appendChild(U.el('h3', { text: d.title })); ds.appendChild(ui.blocks(d.blocks)); });
        main.appendChild(ds);
        tocAdd('profundizar', T.deeper);
      }
      // «Para el docente»
      var notes = S.parts.filter(function (x) { return /^Notas para el docente/.test(x.title); })[0];
      if (notes) {
        var det = U.el('details', { class: 'teacher', id: 'docente' }, [U.el('summary', {}, [T.teacher + ' ', U.el('span', { class: 'badge', text: T.teacher })])]);
        det.appendChild(ui.blocks(notes.blocks));
        main.appendChild(det);
      }
      // sources
      var src = S.parts.filter(function (x) { return /^Fuentes/.test(x.title); })[0];
      var fs = ui.section(T.sources, { id: 'fuentes' });
      if (src) fs.appendChild(ui.blocks(src.blocks));
      fs.appendChild(sessionSources(n, video));
      main.appendChild(fs);
      // navigation
      main.appendChild(U.el('nav', { class: 'row row-between no-print', 'aria-label': 'Sesiones' }, [
        n > 1 ? U.el('a', { class: 'btn', href: '#/sesion/' + (n - 1), text: T.prev }) : U.el('span'),
        n < 8 ? U.el('a', { class: 'btn', href: '#/sesion/' + (n + 1), text: T.next }) : U.el('span')
      ]));
      // ?s=<section> scrolls there
      if (p.query && p.query.s) setTimeout(function () { var t = document.getElementById(p.query.s); if (t) t.scrollIntoView(); }, 60);
    },
    leave: function () { NS.engine.player.pauseAll(); }
  };

  // every source cited by the session's figures and links, deduplicated
  function sessionSources(n, video) {
    var keys = [];
    var add = function (k) { if (k && keys.indexOf(k) < 0) keys.push(k); };
    var topics = ((NS.data.widgets || {}).topics || {})[n] || {};
    Object.keys(topics).forEach(function (k) { (topics[k].figs || []).forEach(function (id) { var f = NS.data.figuresById[id]; if (f) f.fuentes.forEach(add); }); });
    if (video) video.scenes.forEach(function (s) { (s.figs || []).forEach(function (id) { var f = NS.data.figuresById[id]; if (f) f.fuentes.forEach(add); }); });
    U.markup(JSON.stringify(NS.data.sesiones[n])).replace(/data-src="([a-z0-9-]+)"/g, function (m, k) { add(k); return m; });
    var src = NS.data.sources || {};
    keys = keys.filter(function (k) { return src[k]; });
    return U.el('ul', { class: 'source-list' }, keys.map(function (k) {
      return U.el('li', {}, [src[k].url ? ui.ext(k, src[k].label) : src[k].label]);
    }));
  }
})(window.IAHI);
