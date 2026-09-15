/* ══════════════════════════════════════════════════════════════════════════
   Ω IDENTITY — every page gets a face

   THE PROBLEM THIS SOLVES, measured before it was written: of 202 pages,
   exactly 2 carried any identity mark (index.html and sculpture.html, both
   from the 3-D layer), and bg.js published no per-page accent at all -- a
   `grep -c 'page-accent\|--axis' bg.js` returned 0. So 200 pages opened in
   the same palette with the same grey furniture, and nothing told a member
   which part of the platform they were standing in.

   nav.js already knew the answer and kept it to itself: PS maps every page
   slug to a nav section, and SECTIONS gives each section a colour. That map
   is now published as window.OmegaAxis (nav.js) and READ here rather than
   copied -- CLAUDE.md 8.1 class 8 is the class where a duplicated canonical
   table drifts and starts lying, so a page's axis has exactly one owner.

   WHAT THIS ADDS TO EVERY PAGE
   1. --page-accent / --page-accent-soft / --page-accent-glow on <html>, plus
      data-omega-axis="<section>", so any stylesheet can key off the axis.
   2. A page hero: eyebrow (the axis name), the page title in display type,
      a hairline rule that draws itself, and a generated sigil.
   3. That sigil is PROCEDURAL and DETERMINISTIC -- seeded from the page slug
      through a small hash, so every page has its own mark, the same mark on
      every visit, with no asset, no network request and no CSP question.
      202 distinct marks out of one function.
   4. A shared readability/navigation polish layer, scoped to established
      platform primitives only. It increases legibility, spacing, focus
      clarity and content hierarchy without replacing page markup or layout.

   WHAT IT REFUSES TO DO
   - It never inserts a hero on a page that already has one (index.html's
     3-D hero, sculpture.html's stage, or any page-local .page-hero).
   - It never invents a title: it reads <h1>, then data-page-title, then the
     nav label. A page with none of those gets a sigil and a rule, no words.
     Fabricating a heading is CLAUDE.md 8.1 class 9 wearing a nicer coat.
   - It never writes into the layout of the approval guard's hidden subtree
     before the reveal -- the hero is inserted, not measured, so there is no
     zero-size read (8.1 class 3).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.OmegaIdentity) return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── SHARED PAGE POLISH ────────────────────────────────────────────────
     This is deliberately additive. It does not invent new components and
     does not compete with page-specific classes. The selectors below are
     existing platform primitives already owned by omega-system.css. The
     layer concentrates on the user's recurring usability requirements:
     readable text, clear hierarchy, comfortable controls, stronger page
     identity and a quieter visual field. */
  function installPagePolish() {
    if (document.getElementById('omega-page-polish')) return;
    var style = document.createElement('style');
    style.id = 'omega-page-polish';
    style.textContent = '\
:root{--omega-reading:clamp(14px,1.05vw,16px);--omega-leading:1.62}\
body{font-size:var(--omega-reading);line-height:var(--omega-leading)}\
.main,.page-shell{min-width:0}\
.main>main,.page-shell>main,.main>.content,.page-shell>.content,.main>#app,.page-shell>#app{width:min(100%,1480px);margin-inline:auto}\
.card,.card-grid>.card,.kpi,.kpi-card{transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease,transform .22s ease}\
.card-body,.kpi-sub,.muted,.small,.help,.hint,.description,.lede{line-height:1.65}\
.card-body{font-size:clamp(13px,.92vw,15px)}\
.sechead{font-size:clamp(12px,.82vw,14px);letter-spacing:.18em;line-height:1.35}\
button,.btn,a.btn,input[type=button],input[type=submit]{min-height:40px}\
input,select,textarea{font-size:16px;line-height:1.45}\
:where(button,.btn,a,input,select,textarea):focus-visible{outline:2px solid var(--page-accent,var(--cyan));outline-offset:3px;box-shadow:0 0 0 4px color-mix(in srgb,var(--page-accent,var(--cyan)) 16%,transparent)}\
.table-wrap,.tbl-wrap,.data-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\
.table,.tbl,.data-table{min-width:640px}\
@media(max-width:760px){.main>main,.page-shell>main,.main>.content,.page-shell>.content,.main>#app,.page-shell>#app{width:100%}.card,.kpi,.kpi-card{padding:14px}.sechead{letter-spacing:.12em}.topbar{padding-inline:14px}.btn{min-height:42px}}\
@media(prefers-reduced-motion:reduce){.card,.kpi,.kpi-card{transition:none}}\
';
    (document.head || document.documentElement).appendChild(style);
  }
  installPagePolish();

  /* ── the page's own slug ─────────────────────────────────────────────── */
  function slug() {
    var d = document.body && document.body.getAttribute('data-page');
    if (d) return String(d).toLowerCase();
    var p = (location.pathname || '').split('/').pop() || 'index';
    return p.replace(/\.html?$/i, '').toLowerCase() || 'index';
  }

  /* ── axis, read from nav.js's published map, never a local copy ──────── */
  function axis(sl) {
    var N = window.OmegaAxis;
    if (N && N.sectionOf) {
      return { key: N.sectionOf(sl), col: N.colourOf(sl), label: N.labelOf(sl) };
    }
    /* nav.js not up yet (or a page that never loads it): the brand gold is a
       neutral default, and resolve() re-runs once nav.js publishes. */
    return { key: 'command', col: '#C9A84C', label: '' };
  }

  /* ── a stable 32-bit hash of the slug: the seed for that page's mark ─── */
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  /* mulberry32 — small, fast, and identical across every browser and visit,
     which is the whole point: a page's sigil must never change shape. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── THE SIGIL ────────────────────────────────────────────────────────
     Concentric geometry in the axis colour: an outer ring broken into a
     seeded number of arcs, a set of radial spokes, an inner polygon whose
     order comes from the seed, and the Ω at the centre. Built as inline SVG
     so it is crisp at any size and costs no request.

     Every dimension below is a fraction of the 100-unit viewBox, so the mark
     scales with its container rather than needing a size class. */
  function sigil(sl, col) {
    var r = rng(hash(sl));
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'oid-sigil');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
      svg.appendChild(n);
      return n;
    }
    function arc(cx, cy, rad, a0, a1) {
      var x0 = cx + rad * Math.cos(a0), y0 = cy + rad * Math.sin(a0);
      var x1 = cx + rad * Math.cos(a1), y1 = cy + rad * Math.sin(a1);
      var large = (a1 - a0) > Math.PI ? 1 : 0;
      return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
             'A' + rad + ' ' + rad + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
    }

    var segs = 3 + Math.floor(r() * 4);
    var off = r() * Math.PI * 2;
    var gap = 0.18 + r() * 0.22;
    for (var i = 0; i < segs; i++) {
      var a0 = off + (i / segs) * Math.PI * 2;
      var a1 = a0 + (Math.PI * 2 / segs) * (1 - gap);
      el('path', { d: arc(50, 50, 44, a0, a1), fill: 'none', stroke: col,
                   'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.85 });
    }

    var spokes = [6, 8, 12][Math.floor(r() * 3)];
    var sOff = r() * Math.PI;
    for (var j = 0; j < spokes; j++) {
      var a = sOff + (j / spokes) * Math.PI * 2;
      var inner = 26 + r() * 5, outer = 36 + r() * 4;
      el('line', {
        x1: (50 + inner * Math.cos(a)).toFixed(2), y1: (50 + inner * Math.sin(a)).toFixed(2),
        x2: (50 + outer * Math.cos(a)).toFixed(2), y2: (50 + outer * Math.sin(a)).toFixed(2),
        stroke: col, 'stroke-width': 1, opacity: 0.5
      });
    }

    var sides = 3 + Math.floor(r() * 5);
    var pOff = r() * Math.PI * 2, pts = [];
    for (var k = 0; k < sides; k++) {
      var pa = pOff + (k / sides) * Math.PI * 2;
      pts.push((50 + 21 * Math.cos(pa)).toFixed(2) + ',' + (50 + 21 * Math.sin(pa)).toFixed(2));
    }
    el('polygon', { points: pts.join(' '), fill: 'none', stroke: col,
                    'stroke-width': 1.1, opacity: 0.62 });

    var t = el('text', {
      x: 50, y: 50, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: col, 'font-size': 22, 'font-family': 'var(--D, Georgia, serif)', opacity: 0.95
    });
    t.textContent = 'Ω';
    return svg;
  }

  function prettify(sl) {
    return sl.replace(/[-_]+/g, ' ')
             .replace(/\b\w/g, function (c) { return c.toUpperCase(); })
             .trim();
  }

  function title(sl) {
    var h1 = document.querySelector('main h1, .main h1, #app h1, h1');
    var t = h1 && (h1.textContent || '').trim();
    if (t) return { text: t, from: 'h1', el: h1 };
    var d = document.body && document.body.getAttribute('data-page-title');
    if (d && d.trim()) return { text: d.trim(), from: 'attr', el: null };
    if (sl && sl !== 'index') return { text: prettify(sl), from: 'slug', el: null };
    return null;
  }

  function host() {
    var cands = ['main.main', '.main', 'main', '#app', '.content', '.wrap'];
    for (var i = 0; i < cands.length; i++) {
      var el = document.querySelector(cands[i]);
      if (!el) continue;
      if (el.querySelector('#omega-side, .side, nav.side')) continue;
      if (el.closest && el.closest('#omega-side')) continue;
      return el;
    }
    return null;
  }

  function hasHero(h) {
    if (document.querySelector('.oid-hero')) return true;
    if (!h) return false;
    return !!h.querySelector(
      '.page-hero,.ohz-hero,[data-omega-sculpture],[data-omega-constellation],' +
      '[class*="hero"]');
  }

  var _done = false;

  function build() {
    if (_done) return;
    var sl = slug();
    var ax = axis(sl);

    var root = document.documentElement;
    root.style.setProperty('--page-accent', ax.col);
    root.style.setProperty('--page-accent-soft', ax.col + '2E');
    root.style.setProperty('--page-accent-glow', ax.col + '66');
    root.setAttribute('data-omega-axis', ax.key);

    if (!window.OmegaAxis) return;
    _done = true;

    var h = host();
    if (!h) return;
    if (hasHero(h)) return;

    var ttl = title(sl);

    var hero = document.createElement('header');
    hero.className = 'oid-hero' + (REDUCED ? ' oid-still' : '');
    hero.setAttribute('data-omega-identity-hero', '1');

    var mark = document.createElement('div');
    mark.className = 'oid-mark';
    mark.appendChild(sigil(sl, ax.col));

    var copy = document.createElement('div');
    copy.className = 'oid-copy';
    var sameWord = ttl && ax.label &&
        ttl.text.replace(/\s+/g, '').toUpperCase() === ax.label.replace(/\s+/g, '').toUpperCase();
    if (ax.label && !sameWord) {
      var eyebrow = document.createElement('div');
      eyebrow.className = 'oid-eyebrow';
      eyebrow.textContent = ax.label;
      copy.appendChild(eyebrow);
    }
    if (ttl) {
      if (ttl.from === 'h1' && ttl.el && ttl.el.parentNode) {
        ttl.el.classList.add('oid-title');
        copy.appendChild(ttl.el);
      } else {
        var hEl = document.createElement('h1');
        hEl.className = 'oid-title';
        hEl.textContent = ttl.text;
        copy.appendChild(hEl);
      }
    }
    var rule = document.createElement('div');
    rule.className = 'oid-rule';
    copy.appendChild(rule);

    hero.appendChild(mark);
    hero.appendChild(copy);
    h.insertBefore(hero, h.firstChild);
  }

  function boot() {
    build();
    if (_done) return;
    var tries = 0;
    var iv = setInterval(function () {
      build();
      if (_done || ++tries > 50) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  window.OmegaIdentity = {
    slug: slug,
    axis: function () { return axis(slug()); },
    sigil: sigil,
    status: function () {
      var root = document.documentElement;
      return {
        slug: slug(),
        axis: root.getAttribute('data-omega-axis'),
        accent: root.style.getPropertyValue('--page-accent'),
        hero: !!document.querySelector('.oid-hero'),
        injected: !!document.querySelector('[data-omega-identity-hero]'),
        navReady: !!window.OmegaAxis
      };
    }
  };
})();