/* omega-tooltip.js   SYD OMEGA 91717   v1
   Sovereign tooltip system powered by Tippy.js v6 (MIT licence).
   Auto-mounts on any [data-tooltip] element, re-scans on omega:populated.
   Placement: data-tooltip-placement="top|bottom|left|right" (default: top).
   Theme: void-dark background, gold border, Courier Prime monospace.
   Delay: 180ms show / 80ms hide — fast enough to feel live, slow enough
   not to fire on every stray hover. */
(function () {
  'use strict';
  if (window.__omegaTooltip) return;
  window.__omegaTooltip = 1;

  /* ─── SOVEREIGN CSS ─────────────────────────────────────────────── */
  (function injectStyles() {
    if (document.getElementById('omega-tooltip-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-tooltip-css';
    /* Tippy's built-in "light" theme is overridden entirely.
       We inject our own .tippy-box[data-theme~="omega"] rules. */
    s.textContent = [
      '.tippy-box[data-theme~="omega"]{',
      '  background:#08080D;',
      '  border:1px solid rgba(201,168,76,.35);',
      '  border-radius:2px;',
      '  font-family:"Courier Prime",monospace;',
      '  font-size:12px;',
      '  letter-spacing:1.5px;',
      '  color:#e9e6dc;',
      '  box-shadow:0 8px 32px rgba(0,0,0,.7),0 0 12px rgba(201,168,76,.08);',
      '  padding:0;',
      '  max-width:280px;',
      '}',
      '.tippy-box[data-theme~="omega"] .tippy-content{',
      '  padding:7px 11px;',
      '  line-height:1.6;',
      '}',
      /* Arrow — tinted gold */
      '.tippy-box[data-theme~="omega"] .tippy-arrow{color:rgba(201,168,76,.4)}',
      /* Accent line on top of box */
      '.tippy-box[data-theme~="omega"][data-placement^="bottom"]{border-top:2px solid rgba(201,168,76,.55)}',
      '.tippy-box[data-theme~="omega"][data-placement^="top"]{border-bottom:2px solid rgba(201,168,76,.55)}',
      '.tippy-box[data-theme~="omega"][data-placement^="left"]{border-right:2px solid rgba(201,168,76,.55)}',
      '.tippy-box[data-theme~="omega"][data-placement^="right"]{border-left:2px solid rgba(201,168,76,.55)}',
      /* Animated entrance */
      '.tippy-box[data-theme~="omega"][data-animation="shift-away"][data-state="hidden"]{opacity:0;transform:translateY(-4px)}',
      '.tippy-box[data-theme~="omega"][data-animation="shift-away"]{transition:opacity .14s ease,transform .14s ease}',
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  })();

  /* ─── TIPPY LOADER ──────────────────────────────────────────────── */
  var TIPPY_CDN = 'https://unpkg.com/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js';
  var _loaded = false, _queue = [];

  function loadTippy(cb) {
    if (window.tippy) { cb(); return; }
    if (_loaded) { _queue.push(cb); return; }
    _loaded = true;
    _queue.push(cb);
    var sc = document.createElement('script');
    sc.src = TIPPY_CDN;
    sc.crossOrigin = 'anonymous';
    sc.onload = function () {
      for (var i = 0; i < _queue.length; i++) {
        try { _queue[i](); } catch (e) {}
      }
      _queue = [];
    };
    sc.onerror = function () {
      /* CDN failed — fall back to native title-based tooltips (already
         in HTML as title="" when applicable). Graceful degradation. */
      _queue = [];
    };
    (document.head || document.body || document.documentElement).appendChild(sc);
  }

  /* ─── INIT / RE-SCAN ────────────────────────────────────────────── */
  function init() {
    loadTippy(function () {
      if (!window.tippy) return;
      var els = document.querySelectorAll('[data-tooltip]:not([data-tippy-content])');
      if (!els.length) return;
      els.forEach(function (el) {
        var text = el.getAttribute('data-tooltip');
        if (!text) return;
        /* transfer to Tippy's own attribute so we don't double-init */
        el.setAttribute('data-tippy-content', text);
        var placement = el.getAttribute('data-tooltip-placement') || 'top';
        window.tippy(el, {
          theme: 'omega',
          animation: 'shift-away',
          placement: placement,
          delay: [180, 80],
          arrow: true,
          allowHTML: false,
          touch: ['hold', 400], /* long-press on mobile */
          onShow: function (instance) {
            /* tiny gold pulse on trigger element */
            var ref = instance.reference;
            if (ref && !ref._ttglow) {
              ref._ttglow = true;
              ref.style.transition = 'box-shadow .12s';
              ref.style.boxShadow = '0 0 0 1px rgba(201,168,76,.35)';
              setTimeout(function () {
                ref.style.boxShadow = '';
                ref.style.transition = '';
                ref._ttglow = false;
              }, 700);
            }
          }
        });
      });
    });
  }

  /* ─── ENTRY POINTS ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-scan after profile data populates dynamic content */
  window.addEventListener('omega:populated', init);

  /* Public API — call after injecting new [data-tooltip] elements at runtime */
  window.OmegaTooltip = { init: init };
})();
