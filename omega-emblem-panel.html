/* ============================================================================
   SYD OMEGA 91717 -- EMBLEM PANEL (the emblem-as-function pattern, built once,
   reused everywhere). An emblem is not decoration -- clicking it opens
   everything related to that concept in one place: a rich panel with the
   real rotating emblem, real data, and real actions, instead of navigating
   to a separate page. This is the shared engine every page plugs into.

   Usage:
     window.OmegaEmblemPanel.open({
       glyph: 'Aries' | '&#9670;',       // zodiac sign name (uses svg()) OR any glyph (uses ring())
       color: '#E86A3A',                 // required if glyph is not a zodiac sign
       title: 'SENTINEL',
       subtitle: 'SECURITY GUARDIAN . ARIES . FIRE',
       badge: 'ACTIVE',                  // optional small badge, top right
       sections: [                       // ordered content blocks
         { label: 'ROLE', body: 'Real description text...' },
         { label: 'STATS', stats: [{k:'Token',v:'PYRON'},{k:'Element',v:'Fire'}] },
         { label: 'ACTIONS', actions: [{label:'Open Full Page', href:'/agents.html'}] }
       ]
     });
     window.OmegaEmblemPanel.close();

   Respects prefers-reduced-motion. Closes on ESC, backdrop click, or the
   close button. Traps focus while open. Pure ASCII, no dependencies beyond
   omega-emblems.js (already loaded globally via bg.js).
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaEmblemPanel) return;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocused = null;

  var CSS = [
    '#oep-overlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(5,5,9,.82);backdrop-filter:blur(6px)}',
    '#oep-overlay.open{display:flex}',
    '#oep-panel{width:100%;max-width:520px;max-height:86vh;overflow-y:auto;background:#0d0d15;border:1px solid rgba(201,168,76,.3);box-shadow:0 0 60px rgba(0,0,0,.6);position:relative}',
    (REDUCE ? '' : '#oep-panel{animation:oepIn .22s ease-out}@keyframes oepIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}'),
    '#oep-close{position:absolute;top:12px;right:14px;background:transparent;border:1px solid rgba(201,168,76,.3);color:#C9A84C;width:30px;height:30px;font-size:16px;cursor:pointer;line-height:1;z-index:2}',
    '#oep-close:hover{background:rgba(201,168,76,.1)}',
    '.oep-head{text-align:center;padding:32px 24px 20px;border-bottom:1px solid rgba(201,168,76,.12);position:relative}',
    '.oep-emblem{width:84px;height:84px;margin:0 auto 14px;display:block}',
    '.oep-title{font-family:"Cinzel Decorative",serif;font-size:20px;color:#C9A84C;letter-spacing:2px}',
    '.oep-sub{font-family:"Courier Prime",monospace;font-size:10px;color:#85837b;letter-spacing:2px;margin-top:6px}',
    '.oep-badge{position:absolute;top:16px;left:16px;font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:2px;color:#3fb27f;border:1px solid rgba(63,178,127,.4);padding:2px 8px}',
    '.oep-body{padding:20px 24px 28px}',
    '.oep-sec{margin-bottom:18px}',
    '.oep-label{font-family:"Courier Prime",monospace;font-size:9px;color:#00E5FF;letter-spacing:2px;margin-bottom:8px}',
    '.oep-text{font-size:13px;color:#e9e6dc;font-weight:300;line-height:1.7}',
    '.oep-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.oep-stat{border:1px solid rgba(201,168,76,.12);padding:8px 10px}',
    '.oep-stat .k{font-family:"Courier Prime",monospace;font-size:8px;color:#85837b;letter-spacing:1px}',
    '.oep-stat .v{font-family:"Cinzel Decorative",serif;font-size:13px;color:#E2C86D;margin-top:3px}',
    '.oep-actions{display:flex;flex-wrap:wrap;gap:8px}',
    '.oep-action{padding:9px 16px;border:1px solid #C9A84C;color:#C9A84C;background:transparent;text-decoration:none;font-family:"Courier Prime",monospace;font-size:10px;letter-spacing:2px;cursor:pointer;display:inline-block}',
    '.oep-action:hover{background:rgba(201,168,76,.1)}',
    '@media(prefers-reduced-motion:reduce){#oep-panel{animation:none}}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('oep-styles')) return;
    var s = document.createElement('style'); s.id = 'oep-styles'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function buildDOM() {
    if (document.getElementById('oep-overlay')) return;
    var ov = document.createElement('div'); ov.id = 'oep-overlay';
    ov.innerHTML =
      '<div id="oep-panel" role="dialog" aria-modal="true" aria-labelledby="oep-title">' +
      '<button id="oep-close" aria-label="Close">&#215;</button>' +
      '<div class="oep-head">' +
      '<span class="oep-badge" id="oep-badge" style="display:none"></span>' +
      '<span class="oep-emblem" id="oep-emblem"></span>' +
      '<div class="oep-title" id="oep-title"></div>' +
      '<div class="oep-sub" id="oep-sub"></div>' +
      '</div>' +
      '<div class="oep-body" id="oep-body"></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('oep-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('open')) close();
      if (e.key === 'Tab' && ov.classList.contains('open')) trapFocus(e);
    });
  }

  function trapFocus(e) {
    var panel = document.getElementById('oep-panel');
    var focusable = panel.querySelectorAll('button, a[href], [tabindex]');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function fillEmblem(glyph, color) {
    var el = document.getElementById('oep-emblem');
    function fill() {
      if (!window.OmegaEmblem) return false;
      var isSign = window.OmegaEmblem.signs && window.OmegaEmblem.signs.indexOf(glyph) !== -1;
      el.innerHTML = isSign ? window.OmegaEmblem.svg(glyph) : window.OmegaEmblem.ring(glyph, color || '#C9A84C', {});
      return true;
    }
    if (fill()) return;
    var tries = 0;
    var t = setInterval(function () { tries++; if (fill() || tries > 20) clearInterval(t); }, 150);
  }

  function renderSections(sections) {
    var body = document.getElementById('oep-body');
    body.innerHTML = '';
    (sections || []).forEach(function (sec) {
      var wrap = document.createElement('div'); wrap.className = 'oep-sec';
      var html = '<div class="oep-label">' + sec.label + '</div>';
      if (sec.body) html += '<div class="oep-text">' + sec.body + '</div>';
      if (sec.stats && sec.stats.length) {
        html += '<div class="oep-stats">' + sec.stats.map(function (s) {
          return '<div class="oep-stat"><div class="k">' + s.k + '</div><div class="v">' + s.v + '</div></div>';
        }).join('') + '</div>';
      }
      if (sec.actions && sec.actions.length) {
        html += '<div class="oep-actions">' + sec.actions.map(function (a) {
          return a.href
            ? '<a class="oep-action" href="' + a.href + '">' + a.label + '</a>'
            : '<button class="oep-action" data-action-id="' + (a.id || '') + '">' + a.label + '</button>';
        }).join('') + '</div>';
      }
      wrap.innerHTML = html;
      body.appendChild(wrap);
    });
    // wire any button-actions (non-link) via onClick callbacks passed in sections
    (sections || []).forEach(function (sec) {
      (sec.actions || []).forEach(function (a) {
        if (a.onClick) {
          var btn = body.querySelector('[data-action-id="' + (a.id || '') + '"]');
          if (btn) btn.addEventListener('click', a.onClick);
        }
      });
    });
  }

  function open(cfg) {
    injectStyles(); buildDOM();
    lastFocused = document.activeElement;
    document.getElementById('oep-title').textContent = cfg.title || '';
    document.getElementById('oep-sub').textContent = cfg.subtitle || '';
    var badge = document.getElementById('oep-badge');
    if (cfg.badge) { badge.textContent = cfg.badge; badge.style.display = ''; } else { badge.style.display = 'none'; }
    fillEmblem(cfg.glyph, cfg.color);
    renderSections(cfg.sections);
    var ov = document.getElementById('oep-overlay');
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('oep-close').focus(); }, 0);
  }

  function close() {
    var ov = document.getElementById('oep-overlay');
    if (!ov) return;
    ov.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  window.OmegaEmblemPanel = { open: open, close: close };
})();
