/* §8.14 «Diseño de una skill» (sesión 4, §4.3, y sesión 6, Parte D): the fields of §4.3, a live
   SKILL.md preview in the content's format, «Copiar SKILL.md», «Descargar SKILL.md», «Ver el ejemplo
   del curso» (ficha-articulo, verbatim), the peer check and the location note. Workbook section 7. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function example() {
    var d = NS.data.sesiones[6].parts.filter(function (p) { return /^Parte D/.test(p.title); })[0];
    var codes = d ? d.blocks.filter(function (b) { return b.type === 'code'; }) : [];
    return (codes.filter(function (c) { return /^---\nname:/.test(c.text); })[0] || {}).text || '';
  }
  ui.skillExample = example;

  function slug(s) { return U.slug(s || 'mi-skill') || 'mi-skill'; }

  ui.widgets.skill = function () {
    var W = NS.data.widgets.skill;
    var data = NS.ui.wb.get('skill', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var inputs = {};
    W.fields.forEach(function (f, i) {
      var id = 'sk-' + i + '-' + Math.floor(Math.random() * 1e5);
      var el = U.el(i === 0 ? 'input' : 'textarea', { id: id, type: i === 0 ? 'text' : null, rows: i === 2 ? '5' : '2' });
      el.value = data[f] || '';
      el.addEventListener('input', function () { data[f] = el.value; NS.ui.wb.set('skill', data); box.update(); });
      inputs[f] = el;
      wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f }), el]));
    });
    function md() {
      var F = W.fields, v = function (k) { return (inputs[k].value || '').trim(); };
      var steps = v(F[2]).split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s, i) { return /^\d+\./.test(s) ? s : (i + 1) + '. ' + s; });
      var lines = ['---', 'name: ' + slug(v(F[0])), 'description: ' + v(F[1]), '---', '# ' + (v(F[0]) || slug(v(F[0])))];
      lines = lines.concat(steps);
      if (v(F[3])) lines.push('', '## ' + F[3], v(F[3]));
      if (v(F[4])) lines.push('', '## ' + F[4], v(F[4]));
      if (v(F[5])) lines.push('', '## ' + F[5], v(F[5]));
      if (v(F[6])) lines.push('', '## ' + F[6], v(F[6]));
      return lines.join('\n');
    }
    var box = ui.copyBox('SKILL.md', md, { button: W.copy, extra: [U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: W.download, onclick: function () { U.download('SKILL.md', md(), 'text/markdown;charset=utf-8'); } })] });
    wrap.appendChild(box);
    var ex = U.el('div', { hidden: true }, [ui.copyBox('ficha-articulo · SKILL.md', example())]);
    wrap.appendChild(U.el('button', { type: 'button', class: 'btn btn-small', text: W.example, 'aria-expanded': 'false', onclick: function (ev) { ex.hidden = !ex.hidden; ev.target.setAttribute('aria-expanded', ex.hidden ? 'false' : 'true'); } }));
    wrap.appendChild(ex);
    // peer check
    var fs = U.el('fieldset', {}, [U.el('legend', { text: W.peer })]);
    var row = U.el('div', { class: 'row', role: 'radiogroup', 'aria-label': W.peer });
    [W.peerYes, W.peerNo].forEach(function (lab) {
      var b = U.el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': data.peer === lab ? 'true' : 'false', text: lab });
      b.addEventListener('click', function () { data.peer = lab; NS.ui.wb.set('skill', data); U.$$('button', row).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); });
      row.appendChild(b);
    });
    fs.appendChild(row);
    var nid = 'sk-peer-' + Math.floor(Math.random() * 1e5);
    var note = U.el('textarea', { id: nid, rows: '2' });
    note.value = data.peerNote || '';
    note.addEventListener('input', function () { data.peerNote = note.value; NS.ui.wb.set('skill', data); });
    fs.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: nid, text: W.peerNote }), note]));
    wrap.appendChild(fs);
    wrap.appendChild(U.el('p', { class: 'note', html: U.markup(W.location) }));
    return wrap;
  };
})(window.IAHI);
