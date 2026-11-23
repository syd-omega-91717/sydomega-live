/* ============================================================================
   SYD OMEGA 91717 -- THE EIGHTEEN-NODE MAP (an illustration)

   A flat, drawn map of the platform's eighteen governed modules: the Omega
   signet in the middle, eighteen numbered nodes in three rings of six, a spoke
   from the signet to each.  Mount it with  <div data-omega-node-map></div>.

   IT IS AN ILLUSTRATION, AND SAYS SO.  The picture states what the platform is
   made of; it does not measure anything.  Ring placement and the spokes are
   composition, not architecture: there is no traffic, latency, uptime, region
   or hierarchy in it, and nothing moves along a spoke (movement would read as
   data flowing).  Live route status for these same modules is on world.html,
   which owns it; this file never fetches.

   THE LIST IS NOT COPIED.  The eighteen come from window.OmegaWorldEngine.modules
   (omega-world-engine.js), the same registry the 3-D world scene reads, so the
   illustration cannot drift from the platform (CLAUDE.md 8.1 class 8).  If the
   registry is not there the map says so and draws nothing -- it never invents
   a list.

   THE DOORS ARE A REAL LIST.  The SVG is a picture (role="img"); the numbered
   legend beside it is eighteen real <a> links, in order.  Hovering or focusing
   a legend entry lights its node; clicking a node follows the same link.
   Reduced motion: nothing animates.  Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaNodeMap) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1240, H = 1000, CX = 620, CY = 500;
  var RINGS = [150, 285, 420];            /* three rings of six */
  var START = [-90, -60, -75];            /* degrees; each ring is offset so a label never lands on a neighbouring ring's node (verify-node-map.js measures it) */
  var NODE_R = 31;

  var CSS = '' +
    '.onm{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start}' +
    '@media(min-width:1100px){.onm{grid-template-columns:minmax(0,1.9fr) minmax(260px,1fr)}}' +
    '.onm-fig{margin:0;border:1px solid var(--line,rgba(201,168,76,.13));border-radius:3px;overflow:hidden;' +
      'background:radial-gradient(120% 90% at 50% 40%,rgba(201,168,76,.08),rgba(0,0,0,0) 62%),#05050B}' +
    '.onm-svg{display:block;width:100%;height:auto}' +
    '.onm-note{padding:12px 16px;border-top:1px solid var(--line,rgba(201,168,76,.13));' +
      'font:13px/1.6 var(--R,Rajdhani,sans-serif);letter-spacing:.04em;color:var(--muted,#8796A1)}' +
    '.onm-note b{color:var(--solar,#E2C86D);font-weight:700}' +
    '.onm-note a{display:inline;padding:0;margin:0;color:var(--cyan,#00E5FF)}' +
    '.onm-list{list-style:none;margin:0;padding:0;display:grid;gap:6px;counter-reset:none}' +
    '.onm-list a{display:grid;grid-template-columns:2.4ch minmax(0,1fr);gap:10px;align-items:baseline;padding:8px 12px;' +
      'border:1px solid var(--line,rgba(201,168,76,.13));border-left:3px solid var(--onm-c,#C9A84C);border-radius:2px;' +
      'text-decoration:none;color:var(--ink,#E9E6DC);background:rgba(5,5,11,.6)}' +
    '.onm-list a:hover,.onm-list a:focus-visible,.onm-list a.onm-on{background:rgba(201,168,76,.10);outline:none;' +
      'border-color:var(--onm-c,#C9A84C)}' +
    '.onm-list i{font:700 13px var(--M,"Courier Prime",monospace);font-style:normal;color:var(--onm-c,#C9A84C)}' +
    '.onm-list b{display:block;font:700 15px/1.2 var(--R,Rajdhani,sans-serif);letter-spacing:.08em}' +
    '.onm-list span{display:block;font:13px/1.35 var(--R,Rajdhani,sans-serif);color:var(--muted,#8796A1)}' +
    '.onm-missing{padding:18px;border:1px dashed var(--line,rgba(201,168,76,.3));color:var(--muted,#8796A1);' +
      'font:13px/1.5 var(--M,"Courier Prime",monospace)}' +
    '.onm-node{cursor:pointer}' +
    '.onm-node circle.onm-disc{transition:fill .18s,stroke-width .18s}' +
    '.onm-node.onm-on circle.onm-disc{fill:var(--onm-c);fill-opacity:.28;stroke-width:4}' +
    '.onm-lbl{paint-order:stroke;stroke:#05050B;stroke-width:6px;stroke-linejoin:round}' +
    '@media(max-width:640px){.onm-lbl{display:none}}' +
    '@media(prefers-reduced-motion:no-preference){.onm-halo{animation:onm-breathe 6s ease-in-out infinite}}' +
    '@keyframes onm-breathe{0%,100%{opacity:.35}50%{opacity:.7}}';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function html(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hex(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#C9A84C'; }
  function polar(ring, i) {
    var a = (START[ring] + (i % 6) * 60) * Math.PI / 180;
    return { x: CX + Math.cos(a) * RINGS[ring], y: CY + Math.sin(a) * RINGS[ring], cos: Math.cos(a) };
  }
  function css() {
    if (document.getElementById('omega-node-map-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-node-map-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function registry() {
    var m = window.OmegaWorldEngine && window.OmegaWorldEngine.modules;
    return Array.isArray(m) ? m.slice(0, 18) : [];
  }

  function render(host) {
    css();
    host.textContent = '';
    var mods = registry();
    if (!mods.length) {
      host.appendChild(html('div', 'onm-missing', 'The module registry did not load, so there is nothing to draw. This map never substitutes a list of its own.'));
      host.setAttribute('data-onm-state', 'missing');
      return 0;
    }
    host.setAttribute('data-onm-state', 'ready');

    var wrap = html('div', 'onm');
    var fig = html('figure', 'onm-fig');
    var NARROW = '(max-width:640px)', crop = { x: 140, w: 960 };
    var svg = el('svg', {
      'class': 'onm-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': 'Illustration: the eighteen governed platform modules drawn as numbered nodes in three rings of six around the Omega signet. A drawing of what the platform is made of, not a live status display. The same modules are listed as links beside it.'
    }, fig);

    function fit() {
      var narrow = window.matchMedia && window.matchMedia(NARROW).matches;
      svg.setAttribute('viewBox', narrow ? crop.x + ' 0 ' + crop.w + ' ' + H : '0 0 ' + W + ' ' + H);
    }
    fit();
    if (window.matchMedia) {
      var mq = window.matchMedia(NARROW);
      if (mq.addEventListener) mq.addEventListener('change', fit); else if (mq.addListener) mq.addListener(fit);
    }

    /* rings, then spokes, then nodes -- paint order is the stacking order */
    RINGS.forEach(function (r) {
      el('circle', { cx: CX, cy: CY, r: r, fill: 'none', stroke: 'rgba(201,168,76,.16)', 'stroke-width': 1.5, 'stroke-dasharray': '2 7' }, svg);
    });
    var pos = mods.map(function (m, i) { return polar(Math.floor(i / 6), i); });
    mods.forEach(function (m, i) {
      el('line', { x1: CX, y1: CY, x2: pos[i].x, y2: pos[i].y, stroke: hex(m.accent), 'stroke-opacity': .22, 'stroke-width': 1.5, 'data-onm-spoke': i + 1 }, svg);
    });

    /* the signet: an Omega in a ring (a stroked glyph drawn as text, escaped) */
    el('circle', { 'class': 'onm-halo', cx: CX, cy: CY, r: 92, fill: 'none', stroke: '#C9A84C', 'stroke-opacity': .5, 'stroke-width': 2 }, svg);
    el('circle', { cx: CX, cy: CY, r: 64, fill: '#0A0A12', stroke: '#C9A84C', 'stroke-width': 3 }, svg);
    var om = el('text', { x: CX, y: CY + 22, 'text-anchor': 'middle', 'font-size': 62, fill: '#E2C86D', 'font-family': 'Cinzel Decorative, Georgia, serif', 'aria-hidden': 'true' }, svg);
    om.textContent = '\u03A9';

    var legend = html('ol', 'onm-list');
    legend.setAttribute('aria-label', 'The eighteen modules');
    var nodes = [];

    mods.forEach(function (m, i) {
      var p = pos[i], c = hex(m.accent), n = i + 1;
      var g = el('g', { 'class': 'onm-node', 'data-onm-node': n, 'data-module': String(m.id || ''), style: '--onm-c:' + c }, svg);
      el('circle', { 'class': 'onm-disc', cx: p.x, cy: p.y, r: NODE_R, fill: '#0A0A12', stroke: c, 'stroke-width': 3 }, g);
      var num = el('text', { x: p.x, y: p.y + 6, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 700, fill: '#F2EEDF', 'font-family': 'Courier Prime, monospace' }, g);
      num.textContent = pad(n);
      var right = p.cos >= -0.01;
      var lbl = el('text', {
        'class': 'onm-lbl', x: p.x + (right ? NODE_R + 10 : -(NODE_R + 10)), y: p.y + 6,
        'text-anchor': right ? 'start' : 'end', 'font-size': 20, 'font-weight': 700, fill: c, 'font-family': 'Rajdhani, sans-serif', 'letter-spacing': '1.5'
      }, g);
      lbl.textContent = String(m.name || m.id || '');

      var li = document.createElement('li');
      var a = html('a');
      a.href = m.href || '#';
      a.style.setProperty('--onm-c', c);
      a.setAttribute('data-onm-link', n);
      a.appendChild(html('i', null, pad(n)));
      var body = html('div');
      body.appendChild(html('b', null, String(m.name || m.id || '')));
      if (m.purpose) body.appendChild(html('span', null, String(m.purpose)));
      a.appendChild(body);
      li.appendChild(a);
      legend.appendChild(li);
      nodes.push({ g: g, a: a });

      function on(v) { g.classList.toggle('onm-on', v); a.classList.toggle('onm-on', v); }
      a.addEventListener('mouseenter', function () { on(true); });
      a.addEventListener('mouseleave', function () { on(false); });
      a.addEventListener('focus', function () { on(true); });
      a.addEventListener('blur', function () { on(false); });
      g.addEventListener('mouseenter', function () { on(true); });
      g.addEventListener('mouseleave', function () { on(false); });
      g.addEventListener('click', function () { a.click(); });
    });

    var note = html('figcaption', 'onm-note');
    var b = html('b', null, 'Illustration. ');
    note.appendChild(b);
    note.appendChild(document.createTextNode('The rings and spokes are drawn for composition: they show no traffic, status, region or rank. Whether each route answers right now is checked on '));
    var wa = html('a', null, 'The Omega World');
    wa.href = '/world.html';
    note.appendChild(wa);
    note.appendChild(document.createTextNode('.'));
    fig.appendChild(note);

    wrap.appendChild(fig);
    wrap.appendChild(legend);
    host.appendChild(wrap);
    return nodes.length;
  }

  function mountAll() {
    var hosts = document.querySelectorAll('[data-omega-node-map]'), i, n = 0;
    for (i = 0; i < hosts.length; i++) n += render(hosts[i]) ? 1 : 0;
    return n;
  }

  window.OmegaNodeMap = { render: render, mountAll: mountAll, count: function () { return registry().length; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
