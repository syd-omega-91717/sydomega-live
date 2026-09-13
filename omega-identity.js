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

    /* outer ring, broken into 3-6 arcs with seeded gaps */
    var segs = 3 + Math.floor(r() * 4);
    var off = r() * Math.PI * 2;
    var gap = 0.18 + r() * 0.22;
    for (var i = 0; i < segs; i++) {
      var a0 = off + (i / segs) * Math.PI * 2;
      var a1 = a0 + (Math.PI * 2 / segs) * (1 - gap);
      el('path', { d: arc(50, 50, 44, a0, a1), fill: 'none', stroke: col,
                   'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.85 });
    }

    /* spokes — 6, 8 or 12, always a divisor-friendly count so it reads ordered */
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

    /* inner polygon, 3-7 sides */
    var sides = 3 + Math.floor(r() * 5);
    var pOff = r() * Math.PI * 2, pts = [];
    for (var k = 0; k < sides; k++) {
      var pa = pOff + (k / sides) * Math.PI * 2;
      pts.push((50 + 21 * Math.cos(pa)).toFixed(2) + ',' + (50 + 21 * Math.sin(pa)).toFixed(2));
    }
    el('polygon', { points: pts.join(' '), fill: 'none', stroke: col,
                    'stroke-width': 1.1, opacity: 0.62 });

    /* the constant: Ω at the centre, the one part that is never seeded */
    var t = el('text', {
      x: 50, y: 50, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: col, 'font-size': 22, 'font-family': 'var(--D, Georgia, serif)', opacity: 0.95
    });
    t.textContent = 'Ω';
    return svg;
  }

  /* ── title: the PAGE's name, never the section's ─────────────────────
     Measured in a render: with the section label as the fallback, the hero
     printed "COMMAND / COMMAND" and "COSMOS / COSMOS" -- eyebrow and title
     the same word, on the 164 pages that have no <h1>. The eyebrow is the
     SECTION; the title must be the PAGE, so the fallback is the page's own
     slug, spelled out. That is the page's real name, not an invented one:
     naming is not the same as fabricating a figure (8.1 class 9). */
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

  /* ── where the hero belongs: inside the content column, never after it ─
     .shell is a flex ROW (CLAUDE.md 4), so anything appended as a sibling of
     <main> becomes a third COLUMN and steals width -- 23 pages once rendered
     ~300px wide exactly that way. The hero goes INSIDE the content element. */
  function host() {
    /* MEASURED, not assumed: on dashboard.html and vault.html there is no
       `main.main`, and the first `main`/`#app` that matches CONTAINS
       #omega-side -- it is the shell, not the content column. Inserting the
       hero there would make it a sibling of the sidebar inside a flex ROW,
       which is precisely how 23 pages once rendered ~300px wide (CLAUDE.md
       §4). So a candidate that contains the nav is disqualified outright. */
    var cands = ['main.main', '.main', 'main', '#app', '.content', '.wrap'];
    for (var i = 0; i < cands.length; i++) {
      var el = document.querySelector(cands[i]);
      if (!el) continue;
      if (el.querySelector('#omega-side, .side, nav.side')) continue;  /* the shell */
      if (el.closest && el.closest('#omega-side')) continue;           /* inside the nav */
      return el;
    }
    return null;   /* no content column found -> publish the axis, add no hero */
  }

  function hasHero(h) {
    /* MEASURED: [data-omega-emblem] matches exactly ONCE on every one of the
       202 pages -- it is shared chrome, not a page hero. Counting it as one
       suppressed the hero on 202/202 pages in the first run of this module.
       So the test is scoped to the CONTENT COLUMN and names only elements
       that really are a page's own opening statement. */
    if (document.querySelector('.oid-hero')) return true;
    if (!h) return false;
    /* 26 pages carry their own hero under page-local names -- hero-band,
       hero-title, hero-eyebrow, okr-hero and the rest (measured). Stacking a
       second hero above one of those would be worse than adding none, so the
       substring match is deliberate here: this is the one place where a
       loose test is the safe one. */
    return !!h.querySelector(
      '.page-hero,.ohz-hero,[data-omega-sculpture],[data-omega-constellation],' +
      '[class*="hero"]');
  }

  var _done = false;

  function build() {
    if (_done) return;
    var sl = slug();
    var ax = axis(sl);

    /* 1. publish the axis -- this half always runs, on every page, even where
          a hero is not wanted. It is what makes 202 pages stop looking alike. */
    var root = document.documentElement;
    root.style.setProperty('--page-accent', ax.col);
    root.style.setProperty('--page-accent-soft', ax.col + '2E');
    root.style.setProperty('--page-accent-glow', ax.col + '66');
    root.setAttribute('data-omega-axis', ax.key);

    /* Wait for nav.js before committing to a hero: without OmegaNav the axis
       is a guess, and a hero built on a guess would need rebuilding. */
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
    /* Two lines that say the same word are worse than one line. */
    var sameWord = ttl && ax.label &&
        ttl.text.replace(/\s+/g, '').toUpperCase() === ax.label.replace(/\s+/g, '').toUpperCase();
    if (ax.label && !sameWord) {
      var eyebrow = document.createElement('div');
      eyebrow.className = 'oid-eyebrow';
      eyebrow.textContent = ax.label;
      copy.appendChild(eyebrow);
    }
    if (ttl) {
      /* The page's own <h1> keeps its semantics and moves into the hero --
         a second <h1> would be a duplicate heading for a screen reader. */
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
    /* nav.js is injected by bg.js and may land after this module. Re-try on a
       short poll with a hard stop -- graph-admin.html:83 polled every 100ms
       FOREVER for an accessor nobody published (8.1 class 4b); this one gives
       up after 5s and leaves the axis token it already set. */
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
