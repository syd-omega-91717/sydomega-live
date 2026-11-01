/* Family tree by generation (family.html). Reads only the rows family.html already loaded
   from public.family_nodes (name, relation, sign, is_heir) and the member's own display name.
   The table stores NO parent-child links, so this groups people into generations from the
   relation they chose and joins generations, never individuals: it does not claim lineage the
   data lacks. Text is written with textContent only (names are free text). */
(function () {
  'use strict';
  var GEN = { Grandfather: -2, Grandmother: -2, Father: -1, Mother: -1,
    Wife: 0, Husband: 0, Brother: 0, Sister: 0, Cousin: 0,
    Son: 1, Daughter: 1, Grandson: 2, Granddaughter: 2 };
  var ROWS = [[-2, 'GRANDPARENTS'], [-1, 'PARENTS'], [0, 'YOUR GENERATION'], [1, 'CHILDREN'], [2, 'GRANDCHILDREN']];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function person(name, rel, sign, heir, isYou) {
    var n = el('div', 'ft-n' + (heir ? ' ft-heir' : '') + (isYou ? ' ft-you' : ''));
    n.appendChild(el('b', null, name || 'UNNAMED'));
    n.appendChild(el('span', null, (rel || 'FAMILY').toUpperCase() + (sign ? ' · ' + sign : '')));
    if (heir) n.appendChild(el('em', null, 'HEIR'));
    return n;
  }
  function render(rows, myName) {
    var host = document.getElementById('fam-tree');
    if (!host) return;
    host.textContent = '';
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) {
      host.appendChild(el('p', 'ft-empty', 'No family nodes registered yet. Add your first node below and the tree will form here.'));
      return;
    }
    var by = {}, other = [], heirs = 0;
    rows.forEach(function (m) {
      if (m.is_heir) heirs++;
      var g = Object.prototype.hasOwnProperty.call(GEN, m.relation) ? GEN[m.relation] : null;
      if (g == null) other.push(m); else (by[g] = by[g] || []).push(m);
    });
    host.appendChild(el('p', 'ft-sum', rows.length + (rows.length === 1 ? ' NODE' : ' NODES') + ' · ' + heirs + (heirs === 1 ? ' HEIR' : ' HEIRS')));
    ROWS.forEach(function (r) {
      var list = by[r[0]] || [];
      if (r[0] === 0) list = [{ __you: true }].concat(list);
      if (!list.length) return;
      var row = el('section', 'ft-row');
      row.appendChild(el('h3', null, r[1]));
      var line = el('div', 'ft-line');
      list.forEach(function (m) {
        line.appendChild(m.__you ? person(myName || 'You', 'You', '', false, true) : person(m.name, m.relation, m.sign, m.is_heir));
      });
      row.appendChild(line);
      host.appendChild(row);
    });
    if (other.length) {
      var o = el('section', 'ft-row');
      o.appendChild(el('h3', null, 'OTHER RELATIONS'));
      var ol = el('div', 'ft-line');
      other.forEach(function (m) { ol.appendChild(person(m.name, m.relation, m.sign, m.is_heir)); });
      o.appendChild(ol); host.appendChild(o);
    }
    host.appendChild(el('p', 'ft-note', 'Generations come from the relation you chose. The registry stores no parent–child links, so lines join generations, not individuals.'));
  }
  window.FamilyTree = { render: render };
  /* family.html dispatches this after it loads the rows; keep the last payload for a late load. */
  document.addEventListener('family:nodes', function (e) { var d = e.detail || {}; window.__famNodes = d; render(d.rows, d.name); });
  if (window.__famNodes) render(window.__famNodes.rows, window.__famNodes.name);
}());
