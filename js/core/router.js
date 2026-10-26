/* Hash routes (SITE_SCOPE = routed). Views register in NS.ui.views[name] = { title(params), render(main, params), leave() }. */
(function (NS) {
  'use strict';
  var U = NS.util;
  var routes = [
    { re: /^#?\/?$/, view: 'home' },
    { re: /^#\/programa$/, view: 'programa' },
    { re: /^#\/ejes$/, view: 'ejes' },
    { re: /^#\/sesion\/([1-8])$/, view: 'session', keys: ['n'] },
    { re: /^#\/sesion\/([1-8])\/clase$/, view: 'clase', keys: ['n'] },
    { re: /^#\/clase$/, view: 'clase' },
    { re: /^#\/cuaderno$/, view: 'cuaderno' },
    { re: /^#\/plantillas$/, view: 'plantillas' },
    { re: /^#\/evidencia$/, view: 'evidencia' },
    { re: /^#\/herramientas$/, view: 'herramientas' },
    { re: /^#\/glosario$/, view: 'glosario' },
    { re: /^#\/fuentes$/, view: 'fuentes' },
    { re: /^#\/correcciones$/, view: 'correcciones' },
    { re: /^#\/proyecto$/, view: 'proyecto' },
    { re: /^#\/acerca$/, view: 'acerca' }
  ];
  var current = null;
  var router = NS.router = {};

  function parse(hash) {
    var h = (hash || '#/').split('?');
    var path = h[0] || '#/';
    var query = {};
    (h[1] || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      query[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
    });
    for (var i = 0; i < routes.length; i++) {
      var m = routes[i].re.exec(path);
      if (m) {
        var params = { query: query };
        (routes[i].keys || []).forEach(function (k, j) { params[k] = m[j + 1]; });
        return { view: routes[i].view, params: params, path: path };
      }
    }
    return { view: 'notfound', params: { query: query }, path: path };
  }

  router.go = function (hash) {
    if (location.hash === hash) router.render();
    else location.hash = hash;
  };

  router.render = function () {
    var r = parse(location.hash);
    var views = NS.ui.views || {};
    var view = views[r.view] || views.notfound;
    if (current && current.view && current.view.leave) {
      try { current.view.leave(); } catch (e) { console.warn(e); }
    }
    if (NS.engine.player && NS.engine.player.pauseAll) NS.engine.player.pauseAll();
    var main = document.getElementById('main');
    main.innerHTML = '';
    main.className = 'view view-' + r.view;
    current = { view: view, route: r };
    try {
      view.render(main, r.params);
      // the first use of each glossary term in the view becomes a chip with its definition
      if (NS.ui.glossify && ['glosario', 'clase', 'notfound'].indexOf(r.view) < 0) NS.ui.glossify(main);
    } catch (e) {
      console.error(e);
      main.appendChild(U.el('p', { class: 'error', text: 'No se pudo mostrar esta página.' }));
    }
    var title = view.title ? view.title(r.params) : '';
    document.title = (title ? title + ' · ' : '') + 'Curso de IA: habilidades para la investigación';
    U.$$('.site-nav a[data-route]').forEach(function (a) {
      var on = r.path.indexOf(a.getAttribute('data-route')) === 0 && (a.getAttribute('data-route') !== '#/' || r.path === '#/' || r.path === '');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!r.params.query.f) window.scrollTo(0, 0);
    var h1 = main.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); try { h1.focus({ preventScroll: true }); } catch (e) { h1.focus(); } }
    document.dispatchEvent(new CustomEvent('iahi:route', { detail: r }));
  };

  router.current = function () { return current ? current.route : parse(location.hash); };

  router.start = function () {
    window.addEventListener('hashchange', router.render);
    router.render();
  };
})(window.IAHI);
