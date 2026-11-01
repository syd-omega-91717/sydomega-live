/* Design Lab (design-lab.html): computes everything it shows from nav.js's page map
   (OmegaAxis.pages) and omega-agents.json. No other data source, no writes. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function sv(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function fail(id, msg) {
    var n = document.getElementById(id);
    if (!n) return;
    n.textContent = '';
    n.appendChild(el('p', { 'class': 'dl-err', role: 'alert' }, msg));
  }
  function slugOf(href) {
    var m = /\/([a-z0-9_-]+)\.html/i.exec(String(href || ''));
    return m ? m[1].toLowerCase() : '';
  }
  /* nav.js loads after this script, so wait for what it publishes. Never fail
     silently: a page that cannot read its data says so. */
  function waitAxis(cb, tries) {
    var A = window.OmegaAxis;
    if (A && typeof A.pages === 'function') return cb(A);
    if ((tries || 0) > 80) return cb(null);
    setTimeout(function () { waitAxis(cb, (tries || 0) + 1); }, 100);
  }

  var state = { axis: null, agents: null };
  function tryRender() {
    if (!state.axis || !state.agents) return;
    var sections = collect(state.axis);
    renderMetrics(sections, state.agents);
    renderBars(sections);
    renderFlow(sections, state.agents);
    renderAgents(sections, state.agents);
  }

  /* Unique destinations per section: by path, so /profile.html#kyc and
     /profile.html count once. Owner-only entries are excluded: members must not
     be shown a count that includes pages they cannot open. */
  function collect(A) {
    var order = [], by = {};
    A.pages().forEach(function (p) {
      if (!p || p.owner || typeof p.href !== 'string') return;
      var path = p.href.split('#')[0];
      var s = by[p.section];
      if (!s) { s = by[p.section] = { key: p.section, label: p.sectionLabel || p.section, col: p.col, paths: {}, n: 0 }; order.push(s); }
      if (!s.paths[path]) { s.paths[path] = 1; s.n++; }
    });
    return order;
  }

  function renderMetrics(sections, agents) {
    var host = document.getElementById('dl-metrics'); host.textContent = '';
    var total = {}, n = 0;
    sections.forEach(function (s) { for (var p in s.paths) if (!total[p]) { total[p] = 1; n++; } });
    var linked = {};
    agents.forEach(function (a) { var k = state.axis.sectionOf(slugOf(a.href)); if (k) linked[k] = 1; });
    [
      [String(sections.length), 'Sections', 'in the navigation'],
      [String(n), 'Destinations', 'unique pages reachable'],
      [String(agents.length), 'Agents', 'in the roster'],
      [String(Object.keys(linked).length), 'Agent-linked', 'sections an agent points into']
    ].forEach(function (m) {
      var t = el('div', { 'class': 'dl-metric' });
      t.appendChild(el('span', { 'class': 'dl-cap' }, m[1]));
      t.appendChild(el('span', { 'class': 'dl-num' }, m[0]));
      t.appendChild(el('span', { 'class': 'dl-sub' }, m[2]));
      host.appendChild(t);
    });
  }

  function renderBars(sections) {
    var host = document.getElementById('dl-bars'); host.textContent = '';
    var rows = sections.slice().sort(function (a, b) { return b.n - a.n; });
    var max = rows.length ? rows[0].n : 1;
    rows.forEach(function (s, i) {
      var r = el('div', { 'class': 'dl-bar' + (i === 0 ? ' dl-top' : '') });
      r.appendChild(el('span', { 'class': 'dl-bar-name', title: s.label }, s.label));
      var tr = el('span', { 'class': 'dl-track' });
      var f = el('span', { 'class': 'dl-fill' }); f.style.width = Math.max(2, Math.round(s.n / max * 100)) + '%';
      tr.appendChild(f); r.appendChild(tr);
      r.appendChild(el('span', { 'class': 'dl-bar-val' }, String(s.n)));
      host.appendChild(r);
    });
  }

  /* Agent -> section is derived, not assigned: each agent has its own href in
     omega-agents.json, and nav.js's page map says which section owns that page. */
  function agentSection(a) { return state.axis.sectionOf(slugOf(a.href)); }

  function renderFlow(sections, agents) {
    var host = document.getElementById('dl-flow'); host.textContent = '';
    var idx = {}; sections.forEach(function (s, i) { idx[s.key] = i; });
    var ag = agents.map(function (a) { return { a: a, k: agentSection(a) }; })
      .sort(function (x, y) { return (idx[x.k] == null ? 99 : idx[x.k]) - (idx[y.k] == null ? 99 : idx[y.k]); });

    var W = 1000, H = 580, cx = 500, cy = H / 2, lx = 200, rx = 800;
    var svg = sv('svg', { 'class': 'dl-flow-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': 'Navigation sections on the left connect through the Omega to the twelve agents on the right. The same links are listed below on narrow screens.' });
    var defs = sv('defs');
    var g = sv('radialGradient', { id: 'dl-core', cx: '50%', cy: '50%', r: '50%' });
    g.appendChild(sv('stop', { offset: '0%', 'stop-color': '#F7E0A0', 'stop-opacity': '.55' }));
    g.appendChild(sv('stop', { offset: '60%', 'stop-color': '#C9A84C', 'stop-opacity': '.18' }));
    g.appendChild(sv('stop', { offset: '100%', 'stop-color': '#C9A84C', 'stop-opacity': '0' }));
    defs.appendChild(g); svg.appendChild(defs);

    function yAt(i, n) { return n < 2 ? cy : 36 + i * ((H - 72) / (n - 1)); }
    var left = {}, drawn = {};
    sections.forEach(function (s, i) { left[s.key] = { x: lx, y: yAt(i, sections.length), s: s }; });
    // lines first, so nodes and labels sit on top
    ag.forEach(function (o, j) {
      var L = left[o.k]; if (!L) return;
      var y2 = yAt(j, ag.length);
      svg.appendChild(sv('path', { 'class': 'dl-line', stroke: L.s.col,
        d: 'M' + lx + ',' + L.y + ' C' + (cx - 40) + ',' + L.y + ' ' + (cx + 40) + ',' + y2 + ' ' + rx + ',' + y2 }));
      drawn[o.k] = 1;
    });
    sections.forEach(function (s) {            // sections with no agent: a faint stub into the core
      var L = left[s.key]; if (drawn[s.key]) return;
      svg.appendChild(sv('path', { d: 'M' + lx + ',' + L.y + ' C' + (cx - 140) + ',' + L.y + ' ' + (cx - 110) + ',' + cy + ' ' + (cx - 62) + ',' + cy,
        fill: 'none', stroke: s.col, 'stroke-width': '1', opacity: '.22' }));
    });
    svg.appendChild(sv('circle', { cx: cx, cy: cy, r: 96, fill: 'url(#dl-core)' }));
    svg.appendChild(sv('circle', { 'class': 'dl-ring', cx: cx, cy: cy, r: 60, fill: 'none', stroke: '#C9A84C',
      'stroke-width': '1.4', 'stroke-dasharray': '3 9', opacity: '.8' }));
    svg.appendChild(sv('circle', { cx: cx, cy: cy, r: 46, fill: '#1c1a15', stroke: '#E2C86D', 'stroke-width': '1.6' }));
    svg.appendChild(sv('text', { x: cx, y: cy + 15, 'text-anchor': 'middle', fill: '#F7E0A0', 'font-size': '44',
      'font-family': 'Cinzel Decorative, serif' }, 'Ω'));
    sections.forEach(function (s) {
      var L = left[s.key];
      svg.appendChild(sv('circle', { cx: lx, cy: L.y, r: 5, fill: s.col }));
      svg.appendChild(sv('text', { x: lx - 14, y: L.y + 4, 'text-anchor': 'end', fill: '#D8D5CB', 'font-size': '12',
        'font-family': 'Courier Prime, monospace', 'letter-spacing': '1.2' }, s.label));
    });
    ag.forEach(function (o, j) {
      var y = yAt(j, ag.length), L = left[o.k], col = L ? L.s.col : '#C9A84C';
      svg.appendChild(sv('circle', { cx: rx, cy: y, r: 5, fill: col }));
      svg.appendChild(sv('text', { x: rx + 14, y: y + 4, fill: '#E2C86D', 'font-size': '14',
        'font-family': 'Cinzel Decorative, serif' }, String(o.a.name)));
    });
    host.appendChild(svg);

    // narrow-screen version: the same relationships as real links
    var list = el('div', { 'class': 'dl-flow-list' });
    sections.forEach(function (s) {
      var mine = ag.filter(function (o) { return o.k === s.key; });
      if (!mine.length) return;
      var grp = el('div', { 'class': 'dl-group' });
      grp.appendChild(el('h3', null, s.label));
      mine.forEach(function (o) {
        var a = el('a', { href: String(o.a.href || '#') }, String(o.a.name) + ' → ' + String(o.a.role || ''));
        a.style.cssText = 'display:inline-flex;margin:0 14px 6px 0;color:#D8D5CB';
        grp.appendChild(a);
      });
      list.appendChild(grp);
    });
    var bare = sections.filter(function (s) { return !drawn[s.key]; }).length;
    if (bare) list.appendChild(el('p', { 'class': 'dl-cap' }, bare + ' sections have no agent pointing into them'));
    host.appendChild(list);
  }

  function renderAgents(sections, agents) {
    var host = document.getElementById('dl-agents'); host.textContent = '';
    agents.forEach(function (a) {
      var k = agentSection(a), sec = state.axis.section(k);
      var t = el('a', { 'class': 'dl-agent', href: String(a.href || '#') });
      if (sec && sec.col) t.style.setProperty('--dl-ac', sec.col);
      t.appendChild(el('b', null, String(a.name)));
      t.appendChild(el('em', null, [a.sign, a.element, a.god].filter(Boolean).join(' · ')));
      t.appendChild(el('span', null, String(a.role || '')));
      host.appendChild(t);
    });
  }

  waitAxis(function (A) {
    if (!A) { ['dl-metrics', 'dl-bars', 'dl-flow'].forEach(function (id) { fail(id, 'The navigation page map did not load.'); }); return; }
    state.axis = A; tryRender();
  });
  fetch('/omega-agents.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      var list = d && (d.agents || d);
      if (!Array.isArray(list) || !list.length) throw new Error('no agents in roster');
      state.agents = list; tryRender();
    })
    .catch(function (e) {
      fail('dl-agents', 'The agent roster could not be read (' + e.message + ').');
      fail('dl-flow', 'The agent roster could not be read (' + e.message + ').');
    });
}());
