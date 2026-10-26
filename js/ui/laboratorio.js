/* §8.20 «Guía del Laboratorio 1» (sesión 6) and §8.22 «Guía del Laboratorio 2» (sesión 7): the lab
   parts as steps with the content's steps, copyable prompts, verification, «Por qué importa para
   investigar» with its legend items and a field saved to the workbook; the remote organization, the
   tool cards, AGENTS.md, the installation annex in three tabs and «Problemas frecuentes». */
(function (NS) {
  'use strict';
  var U = NS.util, ui = NS.ui;

  function parts(n, re) { return NS.data.sesiones[n].parts.filter(function (p) { return re.test(p.title); }); }
  function implicationsOf(part) { return (part.implications || []).map(ui.implicationCard); }
  // the part's blocks without the «Por qué importa» paragraph (shown as implication cards)
  function body(part, copyLabel) {
    var frag = document.createDocumentFragment();
    var skipUl = false;
    part.blocks.forEach(function (b) {
      if (b.type === 'p' && /^\*\*Por qué importa/.test(b.text)) { skipUl = true; return; }
      if (skipUl && b.type === 'ul') { skipUl = false; return; }
      skipUl = false;
      if (b.type === 'code') frag.appendChild(ui.copyBox('', b.text, { button: copyLabel }));
      else frag.appendChild(ui.blocks([b]));
    });
    return frag;
  }

  function stepper(steps, opts) {
    var wrap = U.el('div', { class: 'stepper' });
    var tabs = U.el('ol', { class: 'tabs stepper-tabs', role: 'tablist', 'aria-label': opts.label });
    var panels = [];
    var cur = Math.min(steps.length - 1, NS.store.get('lab:' + opts.key, 0) || 0);
    steps.forEach(function (st, i) {
      var b = U.el('button', { type: 'button', role: 'tab', class: 'chip', 'aria-selected': 'false', text: st.title });
      b.addEventListener('click', function () { show(i); });
      tabs.appendChild(U.el('li', {}, [b]));
      var p = U.el('div', { role: 'tabpanel', class: 'step-panel', hidden: true });
      p.appendChild(U.el('h4', { text: st.title }));
      p.appendChild(st.content());
      var nav = U.el('div', { class: 'row row-between no-print' }, [
        i > 0 ? U.el('button', { type: 'button', class: 'btn btn-small btn-quiet', text: opts.prev, onclick: function () { show(i - 1); tabs.querySelectorAll('button')[i - 1].focus(); } }) : U.el('span'),
        i < steps.length - 1 ? U.el('button', { type: 'button', class: 'btn btn-small', text: opts.next, onclick: function () { show(i + 1); tabs.querySelectorAll('button')[i + 1].focus(); } }) : U.el('span')
      ]);
      p.appendChild(nav);
      panels.push(p);
    });
    function show(i) {
      cur = i; NS.store.set('lab:' + opts.key, i);
      U.$$('button[role=tab]', tabs).forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
    }
    wrap.appendChild(tabs);
    panels.forEach(function (p) { wrap.appendChild(p); });
    show(cur);
    return wrap;
  }

  function labFields(pt) {
    var sec = NS.ui.wb.section('lab1');
    var data = NS.ui.wb.get('lab1', {}) || {};
    data[pt] = data[pt] || {};
    var fs = U.el('fieldset', { class: 'no-print-border' }, [U.el('legend', { text: NS.data.workbook.sections[8].title + ' · ' + pt })]);
    sec.fields.forEach(function (f) {
      if (f === 'Tipo de error encontrado') {
        var id = 'l1e-' + pt;
        var sel = U.el('select', { id: id }, [U.el('option', { value: '', text: '—' })].concat(sec.errors.map(function (e) { return U.el('option', { value: e, text: e }); })));
        sel.value = data[pt][f] || '';
        sel.addEventListener('change', function () { var d = NS.ui.wb.get('lab1', {}) || {}; d[pt] = d[pt] || {}; d[pt][f] = sel.value; NS.ui.wb.set('lab1', d); });
        fs.appendChild(U.el('div', { class: 'field' }, [U.el('label', { for: id, text: f }), sel]));
      } else fs.appendChild(ui.wbField(f, data[pt][f], function (v) { var d = NS.ui.wb.get('lab1', {}) || {}; d[pt] = d[pt] || {}; d[pt][f] = v; NS.ui.wb.set('lab1', d); }, { rows: '2' }));
    });
    return fs;
  }

  ui.widgets['laboratorio-1'] = function () {
    var W = NS.data.widgets['laboratorio-1'];
    var wrap = U.el('section', { class: 'widget', 'aria-label': W.title }, [U.el('h2', { text: W.title })]);
    // the remote organization (with the signal sign) and the tool options are the session's topics
    // right above this guide (session view), so the guide starts with the parts
    // the stepper A–E
    var labParts = parts(6, /^Parte [A-E]\./);
    var steps = labParts.map(function (p, i) {
      var letter = p.title.charAt(6);
      return { title: W.parts[i] || p.title, content: function () {
        var box = U.el('div');
        box.appendChild(U.el('p', { class: 'note', text: p.title }));
        box.appendChild(body(p, W.copy));
        if (p.implications && p.implications.length) box.appendChild(U.el('div', { class: 'grid grid-2' }, implicationsOf(p)));
        if (letter === 'B') { var sc = ui.sceneFigure(NS.data.widgets.labScenes.B); if (sc) box.appendChild(sc); }
        if (letter === 'D') {
          var agents = (p.blocks.filter(function (b) { return b.type === 'code' && /^# Proyecto/.test(b.text); })[0] || {}).text || '';
          box.appendChild(U.el('div', { class: 'row' }, [
            U.el('button', { type: 'button', class: 'btn btn-small', text: W.agentsMd, onclick: function () { U.download('AGENTS.md', agents, 'text/markdown;charset=utf-8'); } }),
            U.el('a', { class: 'btn btn-small btn-quiet', href: '#/cuaderno?s=skill', text: NS.data.widgets.skill.title })
          ]));
        }
        box.appendChild(labFields(letter));
        return box;
      } };
    });
    wrap.appendChild(stepper(steps, { key: 'lab1', label: W.title, prev: W.prev, next: W.next }));
    wrap.appendChild(ui.stamp('stamp-carpeta'));
    // installation annex in three tabs
    var anexo = parts(6, /^Anexo de instalación/)[0];
    if (anexo) {
      wrap.appendChild(U.el('h3', { text: W.installTitle }));
      var groups = [], cur = null;
      anexo.blocks.forEach(function (b) {
        if (b.type === 'p' && /^\*\*[^*]+\*\*$/.test(b.text)) { cur = { label: b.text.replace(/\*\*/g, ''), blocks: [] }; groups.push(cur); }
        else if (cur) cur.blocks.push(b);
        else { groups.push({ label: '', blocks: [b] }); }
      });
      var labelled = groups.filter(function (g) { return g.label; });
      wrap.appendChild(ui.tabs(labelled.map(function (g, i) { return { label: W.installTabs[i] || g.label, content: function () { var d = U.el('div'); d.appendChild(U.el('p', { class: 'note', text: g.label })); d.appendChild(ui.blocks(g.blocks)); return d; } }; }), { label: W.installTitle }));
    }
    wrap.appendChild(ui.widgets.problemas());
    return wrap;
  };

  ui.widgets['laboratorio-2'] = function () {
    var W = NS.data.widgets['laboratorio-2'];
    var wrap = U.el('section', { class: 'widget', 'aria-label': W.title }, [U.el('h2', { text: W.title })]);
    var A = parts(7, /^Parte A\./)[0], B = parts(7, /^Parte B\./)[0], close = parts(7, /^Cierre/)[0];
    var steps = [];
    if (A) steps.push({ title: W.partA, content: function () {
      var box = U.el('div');
      box.appendChild(ui.figureGrid(['curso.parte-a-lab2', 'curso.pdfs-lab2', 'lab2.notebook']));
      var sc = ui.sceneFigure(NS.data.widgets.labScenes.A2); if (sc) box.appendChild(sc);
      A.blocks.forEach(function (b) {
        if (b.type === 'table' || (b.type === 'p' && /^\*\*(Matriz de antecedentes|Por qué importa)/.test(b.text))) return;
        if (b.type === 'ul' && A.implications && b.items.some(function (it) { return /^\*\*(Reproducibilidad|Validez|Integridad|Transparencia|Equidad|Ética)/.test(it); })) return;
        if (b.type === 'code') box.appendChild(ui.copyBox('', b.text, { button: NS.data.widgets['laboratorio-1'].copy }));
        else box.appendChild(ui.blocks([b]));
      });
      box.appendChild(U.el('h4', { text: W.matrixTitle }));
      var sec = NS.ui.wb.section('antecedentes');
      var verify = U.el('div', { hidden: true });
      box.appendChild(ui.widgets.tabla({ columns: sec.columns, rows: NS.ui.wb.get('antecedentes', []) || [], checkbox: sec.checkbox, addLabel: W.addRow, csvName: 'matriz-antecedentes',
        onChange: function (rows) { NS.ui.wb.set('antecedentes', rows); },
        onCheck: function (ri, on) { if (on && verify.hidden) { verify.hidden = false; verify.appendChild(ui.widgets.verificar()); verify.scrollIntoView({ behavior: 'smooth' }); } } }));
      box.appendChild(verify);
      if (A.implications) box.appendChild(U.el('div', { class: 'grid grid-2' }, implicationsOf(A)));
      return box;
    } });
    if (B) steps.push({ title: W.partB, content: function () {
      var box = U.el('div');
      box.appendChild(U.el('h4', { text: W.chooseRoute }));
      // split the part into its three routes
      var routes = [], cur = null;
      B.blocks.forEach(function (b) {
        if (b.type === 'p' && /^\*\*Ruta \d/.test(b.text)) { cur = { lead: b, blocks: [] }; routes.push(cur); }
        else if (cur) cur.blocks.push(b);
      });
      var sc = ui.sceneFigure(NS.data.widgets.labScenes.B2); if (sc) box.appendChild(sc);
      box.appendChild(ui.tabs(routes.map(function (r, i) {
        return { label: W.routes[i] || ('Ruta ' + (i + 1)), content: function () {
          var d = U.el('div');
          d.appendChild(ui.blocks([r.lead]));
          r.blocks.forEach(function (b) {
            if (b.type === 'code') d.appendChild(ui.copyBox('', b.text, { button: NS.data.widgets['laboratorio-1'].copy }));
            else if (b.type === 'p' && /^\*\*Por qué importa/.test(b.text)) {
              var imp = (B.implications || [])[i];
              d.appendChild(imp ? ui.implicationCard(imp) : ui.blocks([b]));
            } else if (b.type === 'p' && /cloud/.test(b.text)) d.appendChild(U.el('p', { class: 'card no-blob', role: 'note', text: W.ollama }));
            else d.appendChild(ui.blocks([b]));
          });
          if (i === 1) { d.appendChild(ui.figureCardHTML('curso.libro-codigos')); var s2 = ui.sceneFigure(NS.data.widgets.labScenes.B2c); if (s2) d.appendChild(s2); d.appendChild(ui.widgets.acuerdo()); }
          if (i === 2) d.appendChild(ui.figureGrid(['lab2.ram-local', 'lab2.modelos-locales']));
          return d;
        } };
      }), { label: W.chooseRoute }));
      var sec = NS.ui.wb.section('ruta');
      var data = NS.ui.wb.get('ruta', {}) || {};
      box.appendChild(U.el('fieldset', {}, [U.el('legend', { text: sec.n + '. ' + sec.title })].concat(sec.fields.map(function (f) {
        return ui.wbField(f, data[f], function (v) { var dd = NS.ui.wb.get('ruta', {}) || {}; dd[f] = v; NS.ui.wb.set('ruta', dd); }, { rows: '2' });
      }))));
      return box;
    } });
    if (close) steps.push({ title: W.closing, content: function () {
      var box = U.el('div');
      box.appendChild(ui.blocks(close.blocks));
      box.appendChild(U.el('a', { class: 'btn', href: '#/sesion/7?s=flujo', text: W.closingLink }));
      return box;
    } });
    wrap.appendChild(stepper(steps, { key: 'lab2', label: W.title, prev: NS.data.widgets['laboratorio-1'].prev, next: NS.data.widgets['laboratorio-1'].next }));
    wrap.appendChild(ui.stamp('stamp-interpretacion'));
    return wrap;
  };
})(window.IAHI);
