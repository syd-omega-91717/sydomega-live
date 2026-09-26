/* ============================================================================
   SYD OMEGA 91717 — OWNER DECK
   The one place that reaches every page, for the owner only.

   Mounts on [data-omega-owner-deck] (control-plane.html). Draws no copy of
   the page list: pages come from nav.js (OmegaAxis.pages(), the canonical
   page→section map) plus any the control-plane registry knows that the nav
   does not. Each tile carries the page's own sigil (OmegaIdentity.sigil), the
   same mark its hero shows, so the deck and the pages share one face.

   Owner only. bg.js marks the owner (body.omega-owner / __omegaIsOwner) after
   reading profiles.is_owner. Until then the deck shows a quiet placeholder;
   a non-owner gets a short refusal and the diagnostics are removed. This is
   presentation, not authorisation: the deck lists page links only, and every
   page's data stays behind RLS.

   Live previews were considered and rejected: vercel.json sends
   X-Frame-Options: DENY, which blocks same-origin frames too, and that
   clickjacking protection is worth more than a preview.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaOwnerDeck) return;

  var RECENT_KEY = 'omega_deck_recent';
  /* Pages outside both the nav and the control-plane registry: owner
     dashboards, verification pages, and the public/system pages. Listed so the
     deck really holds every page; scripts/tests/test_owner_deck.py fails if a
     page file is ever missing from nav + registry + this list. */
  var EXTRA = [
    ['analytics-dashboard', 'ANALYTICS'], ['cohorts-dashboard', 'COHORTS'],
    ['segmentation-dashboard', 'SEGMENTS'], ['predictions-dashboard', 'PREDICTIONS'],
    ['monitoring-dashboard', 'MONITORING'], ['investor-dashboard', 'INVESTOR'],
    ['investor-gate', 'INVESTOR GATE'], ['venture-pipeline', 'VENTURE PIPELINE'],
    ['omega-visual-command', 'VISUAL COMMAND'], ['agent', 'AGENT'],
    ['verify-deployment', 'VERIFY DEPLOY'], ['verify-modules', 'VERIFY MODULES'],
    ['healthz', 'HEALTH'], ['account', 'SIGN IN'], ['pending', 'PENDING'],
    ['offline', 'OFFLINE'], ['index', 'FRONT DOOR']
  ];
  var OWNER_SEC = { key: 'owner', label: 'OWNER', icon: '\u03A9', col: '#E8C766' };
  var WAIT_MS = 10000;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function isOwner() {
    return !!(window.__omegaIsOwner || (document.body && document.body.classList.contains('omega-owner')));
  }
  function readRecent() {
    try { var v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function pushRecent(href) {
    try {
      var r = readRecent().filter(function (h) { return h !== href; });
      r.unshift(href);
      localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8)));
    } catch (e) { /* per-viewer convenience only */ }
  }

  function injectStyle() {
    if (document.getElementById('odk-style')) return;
    var st = document.createElement('style');
    st.id = 'odk-style';
    st.textContent = [
      '.odk{--odk-line:rgba(201,168,76,.16);display:flex;flex-direction:column;gap:18px}',
      '.odk-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap}',
      '.odk-search{position:relative;flex:1 1 320px;min-width:0}',
      '.odk-search input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.35);border:1px solid var(--odk-line);border-radius:14px;padding:16px 56px 16px 20px;color:var(--ink,#E8E4D8);font-family:var(--R,sans-serif);font-size:18px;letter-spacing:.5px;outline:none;transition:border-color .2s,box-shadow .2s}',
      '.odk-search input:focus{border-color:rgba(201,168,76,.6);box-shadow:0 0 0 4px rgba(201,168,76,.12)}',
      '.odk-kbd{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-family:var(--M,monospace);font-size:12px;color:var(--muted,#8A8880);border:1px solid var(--odk-line);border-radius:6px;padding:2px 8px;pointer-events:none}',
      '.odk-count{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#8A8880);white-space:nowrap}',
      '.odk-count b{color:var(--gold,#C9A84C);font-family:var(--D,serif);font-size:22px;letter-spacing:0;margin-right:6px;font-weight:400}',
      '.odk-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}',
      '.odk-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--odk-line);background:rgba(255,255,255,.02);color:var(--muted,#8A8880);font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;cursor:pointer;transition:all .18s}',
      '.odk-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}',
      '.odk-chip span{opacity:.6}',
      '.odk-chip:hover{color:var(--ink,#E8E4D8);border-color:var(--c)}',
      '.odk-chip[aria-pressed="true"]{color:#0a0a0a;background:var(--c);border-color:var(--c)}',
      '.odk-chip[aria-pressed="true"] i{background:#0a0a0a}',
      '.odk-group{display:flex;flex-direction:column;gap:10px}',
      '.odk-gh{display:flex;align-items:center;gap:10px;font-family:var(--M,monospace);font-size:12px;letter-spacing:3px;color:var(--c)}',
      '.odk-gh::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--c),transparent);opacity:.35}',
      '.odk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px}',
      '.odk .odk-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:118px;padding:14px 8px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--c) 10%,transparent),rgba(255,255,255,.015));color:var(--ink,#E8E4D8);text-decoration:none;text-align:center;transition:transform .18s ease,border-color .18s,box-shadow .18s;outline:none}',
      '.odk .odk-tile:hover,.odk .odk-tile:focus-visible{transform:translateY(-3px);border-color:var(--c);box-shadow:0 10px 28px -12px var(--c),inset 0 0 0 1px color-mix(in srgb,var(--c) 30%,transparent)}',
      '.odk .odk-tile svg{width:46px;height:46px;transition:transform .5s ease}',
      '.odk .odk-tile:hover svg,.odk .odk-tile:focus-visible svg{transform:rotate(30deg) scale(1.06)}',
      '.odk-glyph{font-size:30px;line-height:46px;color:var(--c)}',
      '.odk-name{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.2px;line-height:1.3;overflow-wrap:anywhere}',
      '.odk-own{position:absolute;top:8px;right:10px;font-size:12px;color:var(--gold,#C9A84C)}',
      '.odk-empty,.odk-gate{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#8A8880);padding:28px 0;text-align:center}',
      '.odk-gate a{color:var(--gold,#C9A84C)}',
      '.odk-skel{height:118px;border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.07),rgba(255,255,255,.03));background-size:200% 100%;animation:odk-sh 1.4s linear infinite}',
      '@keyframes odk-sh{to{background-position:-200% 0}}',
      '@media (max-width:520px){.odk-grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}.odk .odk-tile{min-height:100px}.odk .odk-tile svg{width:38px;height:38px}.odk-search input{font-size:16px}}',
      '@media (prefers-reduced-motion:reduce){.odk .odk-tile,.odk .odk-tile svg,.odk-chip{transition:none}.odk .odk-tile:hover,.odk .odk-tile:focus-visible{transform:none}.odk .odk-tile:hover svg,.odk .odk-tile:focus-visible svg{transform:none}.odk-skel{animation:none}}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* Nav pages first (they carry a section); registry-only pages join the
     section the nav would give them. */
  function collect() {
    var ax = window.OmegaAxis;
    var pages = ax && typeof ax.pages === 'function' ? ax.pages() : [];
    var seen = {};
    pages.forEach(function (p) { seen[p.href] = 1; });
    var reg = window.OmegaControlPlane && window.OmegaControlPlane.registry;
    if (reg && ax) {
      Object.keys(reg).forEach(function (k) {
        var href = '/' + k + '.html';
        if (seen[href]) return;
        seen[href] = 1;
        var sk = ax.sectionOf(k), sec = ax.section(sk) || {};
        pages.push({ key: k, label: k.replace(/-/g, ' ').toUpperCase(), href: href, section: sk,
                     sectionLabel: sec.label || sk.toUpperCase(), icon: sec.icon || '◈',
                     col: sec.col || '#C9A84C', owner: false });
      });
    }
    EXTRA.forEach(function (e) {
      var href = '/' + e[0] + '.html';
      if (seen[href]) return;
      seen[href] = 1;
      pages.push({ key: e[0], label: e[1], href: href, section: OWNER_SEC.key,
                   sectionLabel: OWNER_SEC.label, icon: OWNER_SEC.icon, col: OWNER_SEC.col, owner: true });
    });
    return pages;
  }

  function tile(p) {
    var a = mk('a', 'odk-tile');
    a.href = p.href;
    a.style.setProperty('--c', p.col);
    a.setAttribute('data-key', p.key);
    a.title = p.label + ' · ' + p.sectionLabel;
    var id = window.OmegaIdentity;
    var mark = null;
    if (id && typeof id.sigil === 'function') {
      try { mark = id.sigil(p.key, p.col); } catch (e) { mark = null; }
    }
    if (!mark) mark = mk('span', 'odk-glyph', p.icon);
    a.appendChild(mark);
    a.appendChild(mk('span', 'odk-name', p.label));
    if (p.owner) a.appendChild(mk('span', 'odk-own', 'Ω'));
    return a;
  }

  function score(p, q) {
    var l = p.label.toLowerCase(), k = p.key.toLowerCase();
    if (k === q || l === q) return 100;
    if (k.indexOf(q) === 0 || l.indexOf(q) === 0) return 60;
    if (k.indexOf(q) > -1 || l.indexOf(q) > -1) return 30;
    if (p.sectionLabel.toLowerCase().indexOf(q) > -1) return 10;
    return 0;
  }

  function build(root, pages) {
    root.textContent = '';
    root.classList.add('odk');
    var sections = ((window.OmegaAxis && window.OmegaAxis.sections()) || []).concat([OWNER_SEC]);
    var state = { q: '', sec: 'all' };

    var head = mk('div', 'odk-head');
    var sw = mk('div', 'odk-search');
    var input = mk('input', 'odk-q');
    input.type = 'search';
    input.placeholder = 'Search ' + pages.length + ' pages';
    input.setAttribute('aria-label', 'Search every page');
    input.autocomplete = 'off';
    sw.appendChild(input);
    sw.appendChild(mk('span', 'odk-kbd', '/'));
    var count = mk('div', 'odk-count');
    head.appendChild(sw);
    head.appendChild(count);
    head.appendChild(calmToggle());
    root.appendChild(head);

    var chips = mk('div', 'odk-chips');
    chips.setAttribute('role', 'toolbar');
    chips.setAttribute('aria-label', 'Sections');
    function chip(key, label, col, n) {
      var b = mk('button', 'odk-chip');
      b.type = 'button';
      b.style.setProperty('--c', col);
      b.setAttribute('data-sec', key);
      b.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');
      b.appendChild(mk('i'));
      b.appendChild(document.createTextNode(label + ' '));
      b.appendChild(mk('span', null, String(n)));
      chips.appendChild(b);
    }
    chip('all', 'ALL', '#C9A84C', pages.length);
    sections.forEach(function (s) {
      var n = pages.filter(function (p) { return p.section === s.key; }).length;
      if (n) chip(s.key, s.label, s.col, n);
    });
    root.appendChild(chips);

    var body = mk('div', 'odk-body');
    root.appendChild(body);

    function render() {
      body.textContent = '';
      var q = state.q.trim().toLowerCase();
      var list = pages.filter(function (p) { return state.sec === 'all' || p.section === state.sec; });
      if (q) {
        list = list.map(function (p) { return { p: p, s: score(p, q) }; })
          .filter(function (x) { return x.s > 0; })
          .sort(function (a, b) { return b.s - a.s || a.p.label.localeCompare(b.p.label); })
          .map(function (x) { return x.p; });
      }
      count.textContent = '';
      var b = mk('b', null, String(list.length));
      count.appendChild(b);
      count.appendChild(document.createTextNode(list.length === 1 ? 'PAGE' : 'PAGES'));

      if (!list.length) { body.appendChild(mk('div', 'odk-empty', 'NO MATCH')); return; }

      if (!q && state.sec === 'all') {
        var recent = readRecent().map(function (h) {
          for (var i = 0; i < pages.length; i++) if (pages[i].href === h) return pages[i];
          return null;
        }).filter(Boolean);
        if (recent.length) body.appendChild(group('RECENT', '#C9A84C', recent));
        sections.forEach(function (s) {
          var g = list.filter(function (p) { return p.section === s.key; });
          if (g.length) body.appendChild(group(s.label, s.col, g));
        });
      } else {
        var grid = mk('div', 'odk-grid');
        list.forEach(function (p) { grid.appendChild(tile(p)); });
        body.appendChild(grid);
      }
    }
    function group(label, col, list) {
      var g = mk('section', 'odk-group');
      g.style.setProperty('--c', col);
      var h = mk('div', 'odk-gh', label);
      g.appendChild(h);
      var grid = mk('div', 'odk-grid');
      list.forEach(function (p) { grid.appendChild(tile(p)); });
      g.appendChild(grid);
      return g;
    }

    input.addEventListener('input', function () { state.q = input.value; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = body.querySelector('.odk-tile');
        if (first) { pushRecent(first.getAttribute('href')); location.href = first.getAttribute('href'); }
      } else if (e.key === 'Escape') {
        input.value = ''; state.q = ''; render();
      } else if (e.key === 'ArrowDown') {
        var t = body.querySelector('.odk-tile');
        if (t) { e.preventDefault(); t.focus(); }
      }
    });
    chips.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.odk-chip');
      if (!b) return;
      state.sec = b.getAttribute('data-sec');
      chips.querySelectorAll('.odk-chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
      });
      render();
    });
    body.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.odk-tile');
      if (a) pushRecent(a.getAttribute('href'));
    });
    /* Arrow keys walk the visible tiles in reading order, by rows. */
    body.addEventListener('keydown', function (e) {
      var cur = e.target.closest && e.target.closest('.odk-tile');
      if (!cur) return;
      var tiles = Array.prototype.slice.call(body.querySelectorAll('.odk-tile'));
      var i = tiles.indexOf(cur), next = -1;
      if (e.key === 'ArrowRight') next = i + 1;
      else if (e.key === 'ArrowLeft') next = i - 1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var r = cur.getBoundingClientRect(), down = e.key === 'ArrowDown', best = -1, bd = Infinity;
        tiles.forEach(function (t, j) {
          var tr = t.getBoundingClientRect();
          var dy = down ? tr.top - r.top : r.top - tr.top;
          if (dy < 4) return;
          var d = dy * 4 + Math.abs(tr.left - r.left);
          if (d < bd) { bd = d; best = j; }
        });
        next = best;
        if (next < 0 && !down) { e.preventDefault(); input.focus(); return; }
      } else return;
      if (next >= 0 && next < tiles.length) { e.preventDefault(); tiles[next].focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
    });

    render();
  }

  /* Calm mode lives in bg.js (window.OmegaCalm) so it applies on every page.
     The owner asked for a cleaner platform, so the first visit here turns it
     on; after that the stored choice wins and this switch reverses it. */
  function calmToggle() {
    var b = mk('button', 'odk-chip odk-calm');
    b.type = 'button';
    b.style.setProperty('--c', '#5EC8C8');
    b.appendChild(mk('i'));
    b.appendChild(document.createTextNode('CALM'));
    b.title = 'Hide ambient extras on every page';
    var C = window.OmegaCalm;
    if (!C) { b.disabled = true; return b; }
    var stored = null;
    try { stored = localStorage.getItem('omega_calm'); } catch (e) { stored = '1'; }
    if (stored === null) C.set(true);
    b.setAttribute('aria-pressed', C.on() ? 'true' : 'false');
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', C.set(!C.on()) ? 'true' : 'false');
    });
    return b;
  }

  function skeleton(root) {
    root.textContent = '';
    root.classList.add('odk');
    var g = mk('div', 'odk-grid');
    for (var i = 0; i < 12; i++) g.appendChild(mk('div', 'odk-skel'));
    root.appendChild(g);
  }

  function refuse(root) {
    root.textContent = '';
    var d = mk('div', 'odk-gate', 'OWNER ONLY · ');
    var a = mk('a', null, 'RETURN HOME');
    a.href = '/dashboard.html';
    d.appendChild(a);
    root.appendChild(d);
    document.querySelectorAll('[data-owner-only]').forEach(function (n) { n.remove(); });
  }

  function mount(root) {
    if (!root || root.__odk) return;
    root.__odk = true;
    injectStyle();
    skeleton(root);
    var t0 = Date.now();
    (function wait() {
      var ready = window.OmegaAxis && typeof window.OmegaAxis.pages === 'function';
      if (ready && isOwner()) {
        document.querySelectorAll('[data-owner-only]').forEach(function (n) { n.hidden = false; });
        build(root, collect());
        return;
      }
      if (Date.now() - t0 > WAIT_MS) { refuse(root); return; }
      setTimeout(wait, 150);
    })();
  }

  function boot() { document.querySelectorAll('[data-omega-owner-deck]').forEach(mount); }

  window.OmegaOwnerDeck = { mount: mount, pages: collect };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
