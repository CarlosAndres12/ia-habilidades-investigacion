/* Header, navigation (with the «Sesiones» and «Recursos» menus), «Modo clase» button and footer on
   every view (spec §7). All copy comes from js/data/ui.js and the session data. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;
  var shell = ui.shell = {};

  function sessionsMenu() {
    return (NS.data.schedule || []).map(function (s) { return { label: 'Sesión ' + s.n + ' · ' + s.title, href: '#/sesion/' + s.n, route: '#/sesion/' + s.n }; });
  }

  function menu(label, items, idx) {
    var id = 'menu-' + idx;
    var btn = U.el('button', { type: 'button', class: 'nav-menu-btn', 'aria-expanded': 'false', 'aria-controls': id, text: label + ' ▾' });
    var list = U.el('ul', { class: 'nav-menu', id: id, hidden: true }, items.map(function (it) {
      return U.el('li', {}, [U.el('a', { href: it.href, 'data-route': it.route || it.href, text: it.label })]);
    }));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      closeMenus();
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      list.hidden = open;
      if (!open) { var a = list.querySelector('a'); if (a) a.focus(); }
    });
    list.addEventListener('keydown', function (ev) {
      var links = U.$$('a', list), i = links.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); links[(i + 1) % links.length].focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      if (ev.key === 'Escape') { closeMenus(); btn.focus(); }
    });
    return U.el('li', { class: 'nav-has-menu' }, [btn, list]);
  }
  function closeMenus() {
    U.$$('.nav-menu-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    U.$$('.nav-menu').forEach(function (l) { l.hidden = true; });
  }

  shell.mount = function () {
    var T = NS.data.ui;
    var header = document.getElementById('site-header');
    var inner = U.el('div', { class: 'site-header-inner' });
    inner.appendChild(U.el('a', { class: 'brand', href: '#/' }, [U.el('span', { class: 'brand-mark', 'aria-hidden': 'true' }), U.el('span', { class: 'brand-text', text: T.siteTitle })]));
    var toggle = U.el('button', { type: 'button', class: 'btn btn-small nav-toggle', 'aria-expanded': 'false', 'aria-controls': 'site-nav', text: T.navMenu });
    inner.appendChild(toggle);
    var nav = U.el('nav', { class: 'site-nav', id: 'site-nav', 'aria-label': 'Navegación principal' });
    var ul = U.el('ul');
    T.nav.forEach(function (item, i) {
      if (item.menu === 'sesiones') ul.appendChild(menu(item.label, sessionsMenu(), i));
      else if (Array.isArray(item.menu)) ul.appendChild(menu(item.label, item.menu, i));
      else ul.appendChild(U.el('li', {}, [U.el('a', { href: item.href, 'data-route': item.href, text: item.label })]));
    });
    ul.appendChild(U.el('li', {}, [U.el('a', { href: '#/clase', class: 'btn btn-primary btn-small', id: 'nav-clase', 'data-route': '#/clase', text: T.navClass })]));
    nav.appendChild(ul);
    inner.appendChild(nav);
    header.appendChild(inner);
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (ev) { if (!ev.target.closest('.nav-has-menu')) closeMenus(); });
    document.addEventListener('iahi:route', function (ev) {
      closeMenus();
      nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
      // «Modo clase» opens the current session when there is one
      var r = ev.detail || {};
      var link = document.getElementById('nav-clase');
      link.setAttribute('href', r.params && r.params.n ? '#/sesion/' + r.params.n + '/clase' : '#/clase');
      document.body.classList.toggle('in-clase', r.view === 'clase');
    });
    shell.footer();
  };

  shell.footer = function () {
    var T = NS.data.ui, F = T.footer;
    var foot = document.getElementById('site-footer');
    foot.innerHTML = '';
    var clearBtn = U.el('button', { type: 'button', class: 'btn btn-quiet btn-small', text: F.clear });
    clearBtn.addEventListener('click', function () {
      ui.confirm(clearBtn, F.clearConfirm, F.clearYes, F.clearNo, function () {
        NS.store.clearAll();
        U.announce(F.cleared);
        clearBtn.insertAdjacentElement('afterend', U.el('p', { class: 'note', role: 'status', text: F.cleared }));
        if (NS.router) NS.router.render();
      });
    });
    foot.appendChild(U.el('div', { class: 'site-footer-inner' }, [
      U.el('p', { text: F.credit }),
      U.el('p', { html: '<strong>' + U.esc(F.version) + '</strong>' }),
      U.el('p', { text: F.who }),
      U.el('p', { text: F.transparency }),
      U.el('p', { text: F.declaration }),
      U.el('p', { text: T.consulted }),
      U.el('div', { class: 'row no-print' }, [
        clearBtn,
        U.el('a', { href: '#/acerca', text: F.about }),
        U.el('a', { href: '#/acerca?s=reproductor', text: F.playerGuide })
      ])
    ]));
  };
})(window.IAHI);
