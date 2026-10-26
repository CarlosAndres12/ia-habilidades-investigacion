/* §8.24 «Mi flujo de trabajo» (sesiones 7 y 8): stages that can be added, reordered and deleted,
   each with «Etapa», «Herramienta», «Para qué», «Punto de control humano» (Sí / No, «¿Cuál?») and
   «Ejes que atiende»; the diagram drawn with the course's flow layout and a bandera-control on each
   stage with a human checkpoint; «Lo que decidimos no hacer con IA»; print and PNG. Section 12. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function drawDiagram(canvas, data) {
    var ctx = canvas.getContext('2d'), S = NS.style, C = NS.course;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    S.background(ctx, 'explain', { W: 1280, H: 720, seed: 5 });
    var st = (data.stages || []).filter(function (s) { return s.stage; });
    if (!st.length) return;
    var perRow = st.length > 5 ? Math.ceil(st.length / 2) : st.length;
    var res = C.flow(ctx, { x: 60, y: 120, w: 1160, labels: st.map(function (s) { return s.stage; }), subs: st.map(function (s) { return s.tool || ''; }), p: 1, boxH: 120, perRow: perRow, rowGap: 150, size: 20, subSize: 16, subGap: 34 });
    res.boxes.forEach(function (b, i) {
      var s = st[i];
      if (s.check) C.prop(ctx, 'bandera-control', { x: b.x + b.w - 18, y: b.y - 2, s: 0.55, showLabel: false });
      var xx = b.x + 8;
      (s.axes || []).forEach(function (a) { var r = C.legendChip(ctx, a, xx, b.y + b.h + 30, { label: false, r: 13 }); xx += (r.w || 30) + 4; });
    });
    S.text(ctx, (NS.data.rotulos || {}).banderaControl || '', 60, 690, { size: 16, weight: 700, role: 'ink-soft' });
    C.prop(ctx, 'bandera-control', { x: 40, y: 694, s: 0.3, showLabel: false });
  }

  ui.widgets.flujo = function () {
    var W = NS.data.widgets.flujo;
    var data = NS.ui.wb.get('flujo', {}) || {};
    data.stages = data.stages || [];
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var list = U.el('ol', { class: 'flow-list' });
    var canvas = U.el('canvas', { width: 1280, height: 720, role: 'img', 'aria-label': W.diagram });
    function save() { NS.ui.wb.set('flujo', data); drawDiagram(canvas, data); canvas.setAttribute('aria-label', W.diagram + ': ' + data.stages.map(function (s) { return s.stage + (s.tool ? ' (' + s.tool + ')' : '') + (s.check ? ', ' + W.fields.check : ''); }).join(' → ')); }
    function render() {
      list.innerHTML = '';
      if (!data.stages.length) list.appendChild(U.el('li', { class: 'note', text: W.empty }));
      data.stages.forEach(function (s, i) {
        var li = U.el('li', { class: 'flow-step' });
        li.appendChild(U.el('p', { class: 'card-kicker', text: (i + 1) + '.' }));
        [['stage', W.fields.stage], ['tool', W.fields.tool], ['purpose', W.fields.purpose]].forEach(function (f) {
          var id = 'fl-' + f[0] + '-' + i;
          var inp = U.el('input', { type: 'text', id: id, value: s[f[0]] || '' });
          inp.addEventListener('input', function () { s[f[0]] = inp.value; save(); });
          li.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f[1] }), inp]));
        });
        var cb = U.el('input', { type: 'checkbox', id: 'fl-check-' + i });
        cb.checked = !!s.check;
        var which = U.el('input', { type: 'text', id: 'fl-which-' + i, value: s.which || '' });
        cb.addEventListener('change', function () { s.check = cb.checked; save(); });
        which.addEventListener('input', function () { s.which = which.value; save(); });
        li.appendChild(U.el('div', { class: 'row' }, [U.el('label', { for: 'fl-check-' + i, class: 'opt' }, [cb, ' ' + W.fields.check + ' (' + W.yes + ')']),
          U.el('div', { class: 'field' }, [U.el('label', { for: 'fl-which-' + i, text: W.fields.which }), which])]));
        var axes = U.el('div', { class: 'legend-row legend-filter', role: 'group', 'aria-label': W.fields.axes });
        (NS.data.legend || []).forEach(function (l) {
          var b = ui.legendChip(l.id, { button: true, pressed: (s.axes || []).indexOf(l.id) >= 0 });
          b.addEventListener('click', function () {
            s.axes = s.axes || [];
            var k = s.axes.indexOf(l.id);
            if (k >= 0) s.axes.splice(k, 1); else s.axes.push(l.id);
            b.setAttribute('aria-pressed', k >= 0 ? 'false' : 'true');
            save();
          });
          axes.appendChild(b);
        });
        li.appendChild(U.el('p', { class: 'field-label', text: W.fields.axes }));
        li.appendChild(axes);
        li.appendChild(U.el('div', { class: 'row no-print' }, [
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.up, disabled: i === 0, onclick: function () { data.stages.splice(i - 1, 0, data.stages.splice(i, 1)[0]); save(); render(); } }),
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.down, disabled: i === data.stages.length - 1, onclick: function () { data.stages.splice(i + 1, 0, data.stages.splice(i, 1)[0]); save(); render(); } }),
          U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.remove, onclick: function () { data.stages.splice(i, 1); save(); render(); } })
        ]));
        list.appendChild(li);
      });
    }
    wrap.appendChild(list);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small no-print', text: W.add, onclick: function () { data.stages.push({ stage: '', tool: '', purpose: '', check: false, which: '', axes: [] }); save(); render(); var f = list.lastChild && list.lastChild.querySelector('input'); if (f) f.focus(); } }));
    wrap.appendChild(U.el('h5', { class: 'h4', text: W.diagram }));
    wrap.appendChild(U.el('figure', { class: 'canvas-figure' }, [canvas]));
    wrap.appendChild(ui.wbField(W.notDo, data.notDo, function (v) { data.notDo = v; NS.ui.wb.set('flujo', data); }, { rows: '3' }));
    wrap.appendChild(U.el('div', { class: 'row no-print' }, [
      U.el('button', { type: 'button', class: 'btn btn-small', text: W.print, onclick: function () { ui.printOnly(wrap); } }),
      U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.png, onclick: function () {
        try { canvas.toBlob(function (b) { if (b) U.download('mi-flujo-de-trabajo.png', b); }); } catch (e) { /* ignore */ }
      } })
    ]));
    render();
    drawDiagram(canvas, data);
    return wrap;
  };
})(window.IAHI);
