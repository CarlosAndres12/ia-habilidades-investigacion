/* §8.3 «Foto de referencia de Artificial Analysis» (sesión 1, §1.3): the exact bar chart of
   aa.cerrados and aa.abiertos on one scale (0–60), the reference line and bracket of aa.brecha, the
   cards of aa.muse-spark and aa.indice-def, group buttons, and the activity table with CSV. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets['foto-aa'] = function () {
    var W = NS.data.widgets['foto-aa'];
    var F = NS.data.figuresById;
    var cer = F['aa.cerrados'], abi = F['aa.abiertos'], bre = F['aa.brecha'];
    var ch = NS.engine.charts, S = NS.style, C = NS.course;
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var mode = 0;
    var btns = U.el('div', { class: 'row', role: 'group', 'aria-label': W.title }, W.buttons.map(function (b, i) {
      return U.el('button', { type: 'button', class: 'chip', 'aria-pressed': i === 0 ? 'true' : 'false', text: b, onclick: function () { mode = i; U.$$('button', btns).forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); draw(); } });
    }));
    wrap.appendChild(btns);
    var c = U.el('canvas', { width: 1280, height: 640, role: 'img' });
    wrap.appendChild(U.el('figure', { class: 'canvas-figure' }, [c]));
    function items(f, role) { return f.partes.map(function (pt) { return { label: pt.etiqueta, value: ch.parseValue(pt.valor), valueText: pt.valor, role: role }; }); }
    function draw() {
      var ctx = c.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      S.background(ctx, 'figure', { W: 1280, H: 640, seed: 4 });
      var list = [];
      if (mode !== 2) list = list.concat([{ groupTitle: W.groups[0] }], items(cer, 'accent-3'));
      if (mode !== 1) list = list.concat([{ groupTitle: W.groups[1] }], items(abi, 'accent-6'));
      var r = ch.barsH(ctx, { x: 40, y: 40, w: 1180, labelW: 360, rowH: 26, gap: 8, scale: W.scale, items: list, p: 1, labelSize: 18 });
      if (mode === 0) {
        var best = ch.parseValue(bre.partes[1].valor), open = ch.parseValue(bre.partes[2].valor);
        var xb = r.px(best), xo = r.px(open);
        var y0 = r.rows[6] ? r.rows[6].y - 34 : 300, y1 = r.rows[r.rows.length - 1].y + 26;
        for (var yy = y0; yy < y1; yy += 14) S.stroke(ctx, [[xb, yy], [xb, yy + 7]], { weight: 'thin', taper: false });
        C.bracket(ctx, xo, xb, y0 + 10, { label: bre.partes[0].valor + ' ' + bre.partes[0].etiqueta, size: 17, h: 10, maxWidth: 460 });
      }
      c.setAttribute('aria-label', [mode !== 2 ? cer.cifra : '', mode !== 1 ? abi.cifra : '', mode === 0 ? bre.cifra : ''].filter(Boolean).join('. ') + '. ' + cer.alcance + '.');
    }
    draw();
    wrap.appendChild(U.el('p', { class: 'note' }, ['Fuente: ', ui.ext('aa-modelos'), ' · ' + NS.data.ui.consultedShort + ' ', ui.badge(cer.tipo), ' ', ui.badge(cer.estado)]));
    wrap.appendChild(ui.figureGrid(['aa.cerrados', 'aa.abiertos', 'aa.brecha', 'aa.muse-spark', 'aa.indice-def']));
    W.notes.forEach(function (t) { wrap.appendChild(U.el('p', { class: 'lead', text: t })); });
    // the activity table (content §1.3 columns, verbatim)
    wrap.appendChild(U.el('h5', { class: 'h4', text: W.tableTitle }));
    wrap.appendChild(ui.widgets.tabla({ columns: (NS.data.modelos || {}).actividad || [], rows: NS.store.get('w:foto-aa', []) || [], csvName: 'modelos-actividad-1-3', onChange: function (rows) { NS.store.set('w:foto-aa', rows); } }));
    return wrap;
  };
})(window.IAHI);
