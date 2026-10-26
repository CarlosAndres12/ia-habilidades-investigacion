/* §8.25 «Temporizador de presentaciones» (sesión 8, «Modo clase»): an editable list of presentations
   with two commenters each, the segments of curso.presentacion plus «Preguntas», notices at 6 and 8
   minutes, the team variant and the gallery variant (curso.galeria). */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.presentaciones = function () {
    var W = NS.data.widgets.presentaciones;
    var data = NS.store.get('w:presentaciones', null) || { list: [], current: 0, gallery: false };
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var list = U.el('ol', { class: 'flow-list' });
    var timerBox = U.el('div');
    function save() { NS.store.set('w:presentaciones', data); }
    function timer() {
      timerBox.innerHTML = '';
      if (data.gallery) {
        timerBox.appendChild(U.el('p', { text: W.galleryText }));
        timerBox.appendChild(ui.figureCardHTML('curso.galeria'));
        timerBox.appendChild(ui.widgets.temporizador({ title: W.gallery, segments: W.galleryTimer }));
        return;
      }
      var p = data.list[data.current] || {};
      var segs = p.team ? [[W.team, 10]] : W.segments;
      timerBox.appendChild(ui.widgets.temporizador({ title: p.name || W.title, segments: segs, notices: p.team ? null : W.notices }));
    }
    function render() {
      list.innerHTML = '';
      data.list.forEach(function (p, i) {
        var li = U.el('li', { class: 'flow-step' + (i === data.current ? ' is-current' : '') });
        var name = U.el('input', { type: 'text', id: 'pr-n-' + i, value: p.name || '' });
        name.addEventListener('input', function () { p.name = name.value; save(); });
        li.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'pr-n-' + i, text: W.name + ' ' + (i + 1) }), name]));
        W.commenters.forEach(function (c, k) {
          var inp = U.el('input', { type: 'text', id: 'pr-c-' + i + '-' + k, value: (p.c || [])[k] || '' });
          inp.addEventListener('input', function () { p.c = p.c || []; p.c[k] = inp.value; save(); });
          li.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: 'pr-c-' + i + '-' + k, text: c }), inp]));
        });
        var team = U.el('input', { type: 'checkbox', id: 'pr-t-' + i });
        team.checked = !!p.team;
        team.addEventListener('change', function () { p.team = team.checked; save(); if (i === data.current) timer(); });
        li.appendChild(U.el('label', { for: 'pr-t-' + i, class: 'opt' }, [team, ' ' + W.team]));
        li.appendChild(U.el('div', { class: 'row' }, [
          U.el('button', { type: 'button', class: 'btn btn-small', text: W.title, 'aria-pressed': i === data.current ? 'true' : 'false', onclick: function () { data.current = i; save(); render(); timer(); } }),
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: NS.data.widgets.flujo.up, disabled: i === 0, onclick: function () { data.list.splice(i - 1, 0, data.list.splice(i, 1)[0]); save(); render(); } }),
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: NS.data.widgets.flujo.down, disabled: i === data.list.length - 1, onclick: function () { data.list.splice(i + 1, 0, data.list.splice(i, 1)[0]); save(); render(); } }),
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: NS.data.widgets.table.remove, onclick: function () { data.list.splice(i, 1); data.current = 0; save(); render(); timer(); } })
        ]));
        list.appendChild(li);
      });
    }
    var gal = U.el('input', { type: 'checkbox', id: 'pr-gallery' });
    gal.checked = !!data.gallery;
    gal.addEventListener('change', function () { data.gallery = gal.checked; save(); timer(); });
    wrap.appendChild(ui.figureCardHTML('curso.presentacion'));
    wrap.appendChild(U.el('label', { for: 'pr-gallery', class: 'opt' }, [gal, ' ' + W.gallery]));
    wrap.appendChild(list);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small', text: W.add, onclick: function () { data.list.push({ name: '', c: ['', ''], team: false }); save(); render(); } }));
    wrap.appendChild(timerBox);
    render(); timer();
    return wrap;
  };
})(window.IAHI);
