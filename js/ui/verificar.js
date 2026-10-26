/* §8.13 «Verificar una referencia» (protocolo B4; sesiones 4, 6 y 7): title and DOI, the five steps
   of B4 as checks with a note each; all five «Sí» → «¡Muy bien! Referencia verificada.»; any «No» →
   «Casi. Pista: …»; «Registrar» adds a row to the logbook. Also the workshop table of session 4. */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  ui.widgets.verificar = function () {
    var W = NS.data.widgets.verificar;
    var b4 = ui.template('B4');
    var stepsText = b4 ? (b4.blocks.filter(function (b) { return b.type === 'ol'; })[0] || { items: [] }).items : [];
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': W.title }, [U.el('h4', { text: W.title })]);
    var inputs = W.fields.map(function (f, i) {
      var id = 'vr-' + i + '-' + Math.floor(Math.random() * 1e5);
      var inp = U.el('input', { type: 'text', id: id });
      wrap.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f }), inp]));
      return inp;
    });
    var answers = [];
    var notes = [];
    var fb = U.el('p', { class: 'feedback', 'aria-live': 'polite' });
    W.steps.forEach(function (st, i) {
      var fs = U.el('fieldset', {}, [U.el('legend', { text: (i + 1) + '. ' + st })]);
      if (stepsText[i]) fs.appendChild(U.el('p', { class: 'note', html: U.markup(stepsText[i]) }));
      var row = U.el('div', { class: 'row', role: 'radiogroup', 'aria-label': st });
      [W.yes, W.no].forEach(function (lab, k) {
        var b = U.el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': 'false', text: lab });
        b.addEventListener('click', function () {
          answers[i] = k === 0;
          U.$$('button', row).forEach(function (x, j) { x.setAttribute('aria-checked', j === k ? 'true' : 'false'); });
          check();
        });
        row.appendChild(b);
      });
      fs.appendChild(row);
      var nid = 'vn-' + i + '-' + Math.floor(Math.random() * 1e5);
      var note = U.el('input', { type: 'text', id: nid });
      notes.push(note);
      fs.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: nid, text: W.note }), note]));
      wrap.appendChild(fs);
    });
    function check() {
      if (answers.some(function (a) { return a === false; })) ui.feedback(fb, false, W.retry);
      else if (answers.filter(function (a) { return a === true; }).length === W.steps.length) ui.feedback(fb, true, W.ok);
      else fb.innerHTML = '';
    }
    wrap.appendChild(fb);
    var status = U.el('span', { class: 'note', 'aria-live': 'polite' });
    wrap.appendChild(U.el('div', { class: 'row' }, [U.el('button', { type: 'button', class: 'btn btn-small', text: W.register, onclick: function () {
      var head = ui.b2Head().head;
      var row = head.map(function () { return ''; });
      var today = new Date();
      row[0] = U.fmtNumber(today.getDate()) + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + today.getFullYear();
      row[2] = W.title + ': ' + (inputs[0].value || '') + (inputs[1].value ? ' (' + inputs[1].value + ')' : '');
      row[5] = W.steps.map(function (s, i) { return s + ' ' + (answers[i] === true ? W.yes : (answers[i] === false ? W.no : '—')) + (notes[i].value ? ' (' + notes[i].value + ')' : ''); }).join('; ');
      NS.ui.wb.addLog(row);
      status.textContent = W.registered; U.announce(W.registered);
    } }), status]));
    wrap.appendChild(ui.stamp('stamp-fuente'));
    return wrap;
  };

  // the workshop of session 4: one row per tool (workbook section 6)
  ui.widgets['busqueda-comparada'] = function () {
    var sec = NS.ui.wb.section('busqueda');
    var data = NS.ui.wb.get('busqueda', {}) || {};
    var wrap = U.el('section', { class: 'widget card no-blob', 'aria-label': sec.title }, [U.el('h4', { text: sec.title })]);
    wrap.appendChild(ui.widgets.tabla({ columns: sec.columns, rows: data.rows || [], addLabel: sec.add, csvName: 'busqueda-comparada', onChange: function (rows) { var d = NS.ui.wb.get('busqueda', {}) || {}; d.rows = rows; NS.ui.wb.set('busqueda', d); } }));
    wrap.appendChild(ui.widgets.verificar());
    return wrap;
  };
})(window.IAHI);
