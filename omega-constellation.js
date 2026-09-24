/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN CONSTELLATION (omega-constellation.js)

   The platform's signature diagram: a ring of living emblems orbiting a
   central Ω, joined to it by hairline spokes. One mark per member of a
   twelve-fold (or nine-fold) set, each a real link — the emblem IS the door
   into its page.

   MOUNT
     <div data-omega-constellation="agents"></div>
     <div data-omega-constellation="signs" data-cn-title="THE TWELVE"></div>
     <div data-omega-constellation="custom"
          data-cn-nodes='[{"name":"...","sub":"...","sign":"Aries","href":"/cosmos"}]'></div>

   ATTRIBUTES
     data-omega-constellation  agents | signs | custom   (required)
     data-cn-title             centre label under the Ω   (default: set name)
     data-cn-sub               centre sublabel
     data-cn-nodes             JSON array, for "custom"

   WHY IT IS BUILT THIS WAY — three decisions, each avoiding a bug class this
   repo has actually shipped:

   1. THE NODES ARE HTML, NOT SVG TEXT. Only the spokes and the orbit ring are
      SVG. A label drawn as SVG <text> inside a viewBox scales with the box, so
      at a phone width the same markup that reads 15px on a desktop renders
      around 7px — under the 12px floor `scripts/type-scale.py` enforces, and
      invisible to it, since the gate matches `font-size:Npx` declarations and
      an SVG font-size attribute is a bare number. HTML labels are real text at
      real px: they honour the floor, they are selectable, `i18n.js` can
      translate them, and each node is a genuine <a> with its own focus ring
      and tap target rather than a click handler on a shape.

   2. IT DRAWS NO EMBLEM OF ITS OWN. Each node emits
      `<span data-omega-emblem="Aries">` and lets `omega-emblems.js` — which
      owns the 12 living marks, their rings and their colours — fill it. That
      module auto-scans on boot AND holds a MutationObserver, so this works
      whichever of the two loads first, with no polling and no ordering
      contract. Copying its artwork here would have been a second divergent
      copy of a canonical table (CLAUDE.md §8.1 class 8) — the exact bug that
      already left `omega-emblems.js` and `omega-sigil-gen.js` disagreeing
      about the colour of Fire.

   3. NO CANVAS, SO NO ZERO-SIZED BUFFER. Layout is percentage-positioned
      inside an `aspect-ratio:1` box and a `viewBox` SVG, so the geometry is
      resolution-independent and needs no measurement at all. A canvas sized
      from `offsetWidth` at DOMContentLoaded reads 0 here, because bg.js's
      approval guard still hides the page and its reveal fires no resize event
      (CLAUDE.md §8.1 class 3) — that has killed two real canvases in this
      repo. Nothing in this module reads a rendered dimension.

   The wrap scrolls horizontally below its own minimum width rather than
   letting the page scroll, which is what `verify-runtime.js` asserts.
   Reduced motion stops the orbit; every mark still draws.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaConstellation) return;
  window.__omegaConstellation = 1;

  var TAU = Math.PI * 2;

  /* The twelve signs in zodiacal order — the order the platform's own
     agent roster, houses and triads all use. Kept here as an ORDER only;
     every glyph and colour still comes from omega-emblems.js. */
  var SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  /* Used only when /omega-agents.json cannot be fetched — the same shape and
     the same fallback posture `agents.html` already takes for the same file.
     Names, signs and gods only: nothing here is a metric, so an offline
     render shows the real roster or nothing, never an invented number. */
  var FALLBACK_AGENTS = [
    { name: 'Sentinel', sign: 'Aries', element: 'Fire', god: 'Ares', href: '/privacy.html' },
    { name: 'Merchant', sign: 'Taurus', element: 'Metal', god: 'Aphrodite', href: '/vault.html#reserve' },
    { name: 'Scout', sign: 'Gemini', element: 'Wind', god: 'Hermes', href: '/search.html' },
    { name: 'Warden', sign: 'Cancer', element: 'Water', god: 'Artemis', href: '/family.html' },
    { name: 'Sovereign', sign: 'Leo', element: 'Fire', god: 'Apollo', href: '/command.html' },
    { name: 'Auditor', sign: 'Virgo', element: 'Sand', god: 'Athena', href: '/compliance.html' },
    { name: 'Proxy', sign: 'Libra', element: 'Wind', god: 'Hera', href: '/contracts.html' },
    { name: 'Oracle', sign: 'Scorpio', element: 'Water', god: 'Demeter', href: '/prediction.html' },
    { name: 'Beacon', sign: 'Sagittarius', element: 'Fire', god: 'Zeus', href: '/vision.html' },
    { name: 'Analyst', sign: 'Capricorn', element: 'Metal', god: 'Hestia', href: '/intelligence.html' },
    { name: 'Tutor', sign: 'Aquarius', element: 'Wind', god: 'Hephaestus', href: '/academy.html' },
    { name: 'Historian', sign: 'Pisces', element: 'Water', god: 'Poseidon', href: '/family.html#heritage' }
  ];

  /* ── STYLE ──────────────────────────────────────────────────────────────
     A private `.ocn-` namespace. bg.js is stylesheet 1 of 53 and loses every
     equal-specificity tie (CLAUDE.md §4) — but only for a selector some later
     sheet also writes. These names exist nowhere else in the repo, so this
     module owns them outright and needs no !important anywhere. */
  var CSS = [
    /* THE SIZE IS A CONSTRAINT, NOT A PREFERENCE. Twelve nodes on a circle
       of radius R (as a fraction of the box width) have 2*pi*R/12 of arc each,
       and a node wider than that arc overlaps its neighbour -- which on an <a>
       means the wrong link catches the pointer. The first version used a 26%
       node at R=.345: arc .181W against a .26W node, so every one of the 12
       overlapped at EVERY width, measured 12/12 in a render. A node label is
       real text at a real 12px floor, so the box cannot shrink below what the
       longest sub line needs ("WIND . HEPHAESTUS", ~125px) -- which fixes the
       minimum WIDTH instead.

       And arc is the wrong measure anyway: overlap is tested on axis-aligned
       BOXES, so what matters is the centre-to-centre delta between adjacent
       nodes, which for 12 on a circle is dx = dy = R*W*(cos30-cos60) -- 108px
       at W=860. A 146x125 node overlapped its neighbour 38x16px at four
       shoulder positions, measured. Both dimensions must come under that
       delta, so: the box hugs its content instead of taking a fixed 17%, the
       mark is a fixed 64px rather than a percentage of a box that no longer
       has a fixed width, and W rises to 900 (delta 113.6px) against a
       ~125x113 node -- which clears vertically, and a pair needs BOTH axes to
       overlap. */
    '.ocn{position:relative;width:100%;max-width:900px;margin:0 auto;',
    'aspect-ratio:1}',
    /* The wrap, not the page, takes the overflow. verify-runtime.js asserts
       the document never scrolls sideways; a min-width inside an auto-scroll
       container is the sanctioned way to keep a wide diagram legible. */
    '.ocn-scroll{overflow-x:auto;overflow-y:hidden;padding:4px 0}',
    '.ocn-scroll>.ocn{min-width:860px}',

    '.ocn-web{position:absolute;inset:0;width:100%;height:100%;overflow:visible;',
    'pointer-events:none}',
    '.ocn-orbit{fill:none;stroke:rgba(201,168,76,.30);stroke-width:.45;stroke-dasharray:1.4 2.2}',
    '.ocn-orbit2{fill:none;stroke:rgba(0,229,255,.16);stroke-width:.3}',
    '.ocn-spoke{stroke:rgba(201,168,76,.26);stroke-width:.34}',
    '@keyframes ocn-turn{to{transform:rotate(360deg)}}',
    '.ocn-turning{transform-origin:50% 50%;animation:ocn-turn 120s linear infinite}',

    /* Nodes. translate(-50%,-50%) centres each on its computed point, so the
       percentage maths never has to know the node's own size. */
    '.ocn-node{position:absolute;transform:translate(-50%,-50%);',
    'width:max-content;max-width:17%;',
    'display:flex;flex-direction:column;align-items:center;gap:4px;',
    'text-align:center;text-decoration:none;color:inherit;border-radius:var(--r,4px);',
    'padding:2px;transition:var(--tx,.2s ease)}',
    '.ocn-node:hover,.ocn-node:focus-visible{transform:translate(-50%,-50%) scale(1.07)}',
    '.ocn-node:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}',
    '.ocn-mark{display:block;width:64px;height:64px;flex:none;margin:0 auto}',
    '.ocn-mark .oe-wrap{display:block;width:100%;height:100%}',
    '.ocn-name{font-family:var(--M);font-size:12px;letter-spacing:1.2px;',
    'color:var(--ink);line-height:1.2;white-space:nowrap}',
    '.ocn-sub{font-family:var(--M);font-size:12px;letter-spacing:.6px;',
    'color:var(--muted);line-height:1.25;white-space:nowrap}',
    'a.ocn-node:hover .ocn-name{color:var(--solar)}',

    /* Centre. Deliberately not a .card: this sits inside another surface and
       a second bordered panel would read as a nested box. */
    '.ocn-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);',
    'width:26%;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}',
    '.ocn-core-mark{font-family:var(--D);font-size:clamp(30px,6vw,54px);color:var(--gold);',
    'line-height:1;text-shadow:0 0 26px rgba(201,168,76,.55)}',
    '.ocn-core-title{font-family:var(--M);font-size:12px;letter-spacing:2.5px;color:var(--solar)}',
    '.ocn-core-sub{font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--muted)}',

    '@media(prefers-reduced-motion:reduce){.ocn-turning{animation:none}}',
    /* No width override on small screens: the box is a fixed 820px inside its
       own scroller there, so widening a node would re-create the overlap the
       geometry note above exists to prevent. */
    '.ocn-mark{will-change:transform}'
  ].join('');

  function injectCss() {
    if (document.getElementById('omega-constellation-css')) return;
    var st = document.createElement('style');
    st.id = 'omega-constellation-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ── DATA ───────────────────────────────────────────────────────────────
     `agents` reads the real roster the platform already ships and that
     `agents.html` already consumes. Everything rendered is a name the file
     states; no count, score or status is derived. */
  function loadAgents() {
    return fetch('/omega-agents.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = j && (j.agents || j);
        return (Array.isArray(list) && list.length) ? list : FALLBACK_AGENTS;
      })
      .catch(function () { return FALLBACK_AGENTS; });
  }

  function nodesFor(set, el) {
    if (set === 'signs') {
      return Promise.resolve(SIGN_ORDER.map(function (s) {
        return { name: s.toUpperCase(), sub: '', sign: s };
      }));
    }
    if (set === 'custom') {
      var raw = el.getAttribute('data-cn-nodes');
      try {
        var parsed = JSON.parse(raw || '[]');
        return Promise.resolve(Array.isArray(parsed) ? parsed : []);
      } catch (e) { return Promise.resolve([]); }
    }
    return loadAgents().then(function (list) {
      return list.slice(0, 12).map(function (a) {
        return {
          name: (a.name || '').toUpperCase(),
          sub: [a.element, a.god].filter(Boolean).join(' · ').toUpperCase(),
          /* The sign is not repeated in the visible sub line -- the emblem IS
             the sign, and printing it again wrapped a third of the nodes onto
             a second line and made the ring read ragged. It moves into the
             label instead, so the fact survives for assistive tech. */
          label: [a.name, a.sign, a.element, a.god].filter(Boolean).join(', '),
          sign: a.sign,
          /* FEATURE_IDEAS.md #31: each agent's real destination page, added to
             omega-agents.json itself (a per-agent property, not a second copy
             of nav.js's routing table -- CLAUDE.md 8.1 class 8) so this ring
             becomes an actual navigable map of the platform instead of 12
             emblems that all pointed at the same page. Falls back to
             /agents.html for a roster entry with no href (the hardcoded
             FALLBACK_AGENTS below, and any future agent added without one). */
          href: a.href || '/agents.html'
        };
      });
    });
  }

  /* ── RENDER ─────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Navigation targets are data, not code. Constellation links are intended
     to stay inside the SYD OMEGA platform; reject javascript:/data:/vbscript:
     and protocol-relative targets before they ever reach an href attribute. */
  function safeHref(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    if (raw.charAt(0) === '#' || raw.charAt(0) === '/') {
      return raw.indexOf('//') === 1 ? '' : raw;
    }
    try {
      var u = new URL(raw, window.location.origin);
      return u.origin === window.location.origin && (u.protocol === 'http:' || u.protocol === 'https:')
        ? u.pathname + u.search + u.hash
        : '';
    } catch (e) { return ''; }
  }

  /* Orbit radius as a fraction of the box WIDTH (not half-width): a node
     centre sits at 50% +/- R*100%. At .345 the outer edge of a 17% node reaches
     43% -- inside the box -- and the inner edge clears the 26%-wide core. */
  var R = 0.345;

  function point(i, n) {
    var a = -TAU / 4 + (i / n) * TAU;      // first node at 12 o'clock
    return { x: 50 + R * 100 * Math.cos(a), y: 50 + R * 100 * Math.sin(a) };
  }

  function web(n) {
    var spokes = '';
    for (var i = 0; i < n; i++) {
      var p = point(i, n);
      /* Stop the spoke short of both the core mark and the node so the line
         reads as a tether, not a strike-through. */
      var a = -TAU / 4 + (i / n) * TAU;
      var x1 = 50 + 13 * Math.cos(a), y1 = 50 + 13 * Math.sin(a);
      var x2 = p.x - 7 * Math.cos(a), y2 = p.y - 7 * Math.sin(a);
      spokes += '<line class="ocn-spoke" x1="' + x1.toFixed(2) + '" y1="' + y1.toFixed(2)
        + '" x2="' + x2.toFixed(2) + '" y2="' + y2.toFixed(2) + '"/>';
    }
    return '<svg class="ocn-web" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
      + '<g class="ocn-turning">'
      + '<circle class="ocn-orbit" cx="50" cy="50" r="' + (R * 100).toFixed(2) + '"/>'
      + '</g>'
      + '<circle class="ocn-orbit2" cx="50" cy="50" r="' + (R * 100 - 6).toFixed(2) + '"/>'
      + '<circle class="ocn-orbit2" cx="50" cy="50" r="21"/>'
      + spokes + '</svg>';
  }

  function nodeHtml(node, i, n) {
    var p = point(i, n);
    var href = safeHref(node.href);
    var tag = href ? 'a' : 'div';
    var attrs = 'class="ocn-node" style="left:' + p.x.toFixed(2) + '%;top:' + p.y.toFixed(2) + '%"';
    if (href) attrs += ' href="' + esc(href) + '"';
    if (node.label) attrs += ' aria-label="' + esc(node.label) + '"';
    /* The emblem is filled by omega-emblems.js, which owns the artwork. It is
       decoration: the name beside it carries the meaning, so it is hidden
       from assistive tech rather than described twice. */
    var mark = node.sign
      ? '<span class="ocn-mark" data-omega-emblem="' + esc(node.sign) + '" aria-hidden="true"></span>'
      : '';
    return '<' + tag + ' ' + attrs + '>' + mark
      + '<span class="ocn-name">' + esc(node.name) + '</span>'
      + (node.sub ? '<span class="ocn-sub">' + esc(node.sub) + '</span>' : '')
      + '</' + tag + '>';
  }

  function render(el, nodes, opts) {
    var n = nodes.length;
    if (!n) { el.setAttribute('data-cn-state', 'empty'); return; }
    var core = '<div class="ocn-core">'
      + '<span class="ocn-core-mark" aria-hidden="true">Ω</span>'
      + (opts.title ? '<span class="ocn-core-title">' + esc(opts.title) + '</span>' : '')
      + (opts.sub ? '<span class="ocn-core-sub">' + esc(opts.sub) + '</span>' : '')
      + '</div>';
    var inner = '<div class="ocn" role="list">'
      + web(n)
      + nodes.map(function (nd, i) { return nodeHtml(nd, i, n); }).join('')
      + core + '</div>';
    el.classList.add('ocn-scroll');
    el.innerHTML = inner;
    el.setAttribute('data-cn-state', 'ready');
    /* Each node is a list item for screen readers; the ring is visual order,
       and the DOM order already matches it. */
    var items = el.querySelectorAll('.ocn-node');
    for (var i = 0; i < items.length; i++) items[i].setAttribute('role', 'listitem');
  }

  function mount(el) {
    if (el.__ocn) return;
    el.__ocn = 1;
    var set = el.getAttribute('data-omega-constellation') || 'agents';
    var opts = {
      title: el.getAttribute('data-cn-title') || '',
      sub: el.getAttribute('data-cn-sub') || ''
    };
    nodesFor(set, el).then(function (nodes) { render(el, nodes, opts); });
  }

  function scan() {
    injectCss();
    var l = document.querySelectorAll('[data-omega-constellation]');
    for (var i = 0; i < l.length; i++) mount(l[i]);
  }

  function boot() {
    scan();
    try {
      /* Pages that build their panels after a fetch add the mount point late.
         Same posture as omega-emblems.js, which observes for the same reason. */
      new MutationObserver(scan).observe(document.documentElement,
        { childList: true, subtree: true });
    } catch (e) { }
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  window.OmegaConstellation = { mount: mount, scan: scan, signs: SIGN_ORDER };
})();
