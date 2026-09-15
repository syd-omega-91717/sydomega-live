/* ============================================================================
   SYD OMEGA 91717 -- EMBLEM PANEL
   Shared emblem-as-function panel. Dynamic values are rendered with DOM APIs
   and textContent; action URLs are validated before they become links.
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
    '.oep-sub{font-family:"Courier Prime",monospace;font-size:12px;color:#85837b;letter-spacing:2px;margin-top:6px}',
    '.oep-badge{position:absolute;top:16px;left:16px;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;color:#3fb27f;border:1px solid rgba(63,178,127,.4);padding:2px 8px}',
    '.oep-body{padding:20px 24px 28px}',
    '.oep-sec{margin-bottom:18px}',
    '.oep-label{font-family:"Courier Prime",monospace;font-size:12px;color:#00E5FF;letter-spacing:2px;margin-bottom:8px}',
    '.oep-text{font-size:13px;color:#e9e6dc;font-weight:300;line-height:1.7}',
    '.oep-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.oep-stat{border:1px solid rgba(201,168,76,.12);padding:8px 10px}',
    '.oep-stat .k{font-family:"Courier Prime",monospace;font-size:12px;color:#85837b;letter-spacing:1px}',
    '.oep-stat .v{font-family:"Cinzel Decorative",serif;font-size:13px;color:#E2C86D;margin-top:3px}',
    '.oep-actions{display:flex;flex-wrap:wrap;gap:8px}',
    '.oep-action{padding:9px 16px;border:1px solid #C9A84C;color:#C9A84C;background:transparent;text-decoration:none;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;cursor:pointer;display:inline-block}',
    '.oep-action:hover{background:rgba(201,168,76,.1)}',
    '@media(prefers-reduced-motion:reduce){#oep-panel{animation:none}}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('oep-styles')) return;
    var s = document.createElement('style');
    s.id = 'oep-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function appendTrustedMarkup(parent, markup) {
    if (!markup) return;
    var parsed = new DOMParser().parseFromString(String(markup), 'image/svg+xml');
    if (parsed.querySelector('parsererror')) return;
    Array.prototype.slice.call(parsed.documentElement.children).forEach(function (node) {
      parent.appendChild(document.importNode(node, true));
    });
  }

  function buildDOM() {
    if (document.getElementById('oep-overlay')) return;
    var ov = document.createElement('div'); ov.id = 'oep-overlay';
    var panel = document.createElement('div'); panel.id = 'oep-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'oep-title');
    var closeButton = document.createElement('button'); closeButton.id = 'oep-close'; closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Close'); closeButton.textContent = '\u00d7';
    var head = document.createElement('div'); head.className = 'oep-head';
    var badge = document.createElement('span'); badge.className = 'oep-badge'; badge.id = 'oep-badge'; badge.hidden = true;
    var emblem = document.createElement('span'); emblem.className = 'oep-emblem'; emblem.id = 'oep-emblem';
    var title = document.createElement('div'); title.className = 'oep-title'; title.id = 'oep-title';
    var sub = document.createElement('div'); sub.className = 'oep-sub'; sub.id = 'oep-sub';
    head.appendChild(badge); head.appendChild(emblem); head.appendChild(title); head.appendChild(sub);
    var body = document.createElement('div'); body.className = 'oep-body'; body.id = 'oep-body';
    panel.appendChild(closeButton); panel.appendChild(head); panel.appendChild(body); ov.appendChild(panel); document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    closeButton.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('open')) close();
      if (e.key === 'Tab' && ov.classList.contains('open')) trapFocus(e);
    });
  }

  function trapFocus(e) {
    var panel = document.getElementById('oep-panel');
    var focusable = panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function safeHref(value) {
    if (!value) return null;
    var raw = String(value).trim();
    if (!raw || /^(?:javascript|data|vbscript):/i.test(raw)) return null;
    try {
      var u = new URL(raw, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u.href;
    } catch (_) { return null; }
  }

  function fillEmblem(glyph, color) {
    var el = document.getElementById('oep-emblem');
    function fill() {
      if (!window.OmegaEmblem) return false;
      var isSign = window.OmegaEmblem.signs && window.OmegaEmblem.signs.indexOf(glyph) !== -1;
      var markup = isSign ? window.OmegaEmblem.svg(glyph) : window.OmegaEmblem.ring(glyph, color || '#C9A84C', {});
      el.replaceChildren(); appendTrustedMarkup(el, markup); return true;
    }
    if (fill()) return;
    var tries = 0;
    var t = setInterval(function () { tries++; if (fill() || tries > 20) clearInterval(t); }, 150);
  }

  function renderSections(sections) {
    var body = document.getElementById('oep-body'); body.replaceChildren();
    (sections || []).forEach(function (sec) {
      sec = sec || {};
      var wrap = document.createElement('div'); wrap.className = 'oep-sec';
      var label = document.createElement('div'); label.className = 'oep-label'; label.textContent = sec.label || ''; wrap.appendChild(label);
      if (sec.body) { var text = document.createElement('div'); text.className = 'oep-text'; text.textContent = String(sec.body); wrap.appendChild(text); }
      if (Array.isArray(sec.stats) && sec.stats.length) {
        var stats = document.createElement('div'); stats.className = 'oep-stats';
        sec.stats.forEach(function (item) {
          item = item || {}; var stat = document.createElement('div'); stat.className = 'oep-stat';
          var k = document.createElement('div'); k.className = 'k'; k.textContent = item.k || '';
          var v = document.createElement('div'); v.className = 'v'; v.textContent = item.v || '';
          stat.appendChild(k); stat.appendChild(v); stats.appendChild(stat);
        });
        wrap.appendChild(stats);
      }
      if (Array.isArray(sec.actions) && sec.actions.length) {
        var actions = document.createElement('div'); actions.className = 'oep-actions';
        sec.actions.forEach(function (action) {
          var a = action || {};
          if (a.href) {
            var href = safeHref(a.href); if (!href) return;
            var link = document.createElement('a'); link.className = 'oep-action'; link.href = href; link.textContent = a.label || '';
            var parsedHref = new URL(href, window.location.href);
            if (parsedHref.origin !== window.location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
            actions.appendChild(link);
          } else {
            var button = document.createElement('button'); button.type = 'button'; button.className = 'oep-action'; button.textContent = a.label || '';
            if (typeof a.onClick === 'function') button.addEventListener('click', a.onClick);
            actions.appendChild(button);
          }
        });
        wrap.appendChild(actions);
      }
      body.appendChild(wrap);
    });
  }

  function open(cfg) {
    cfg = cfg || {}; injectStyles(); buildDOM(); lastFocused = document.activeElement;
    document.getElementById('oep-title').textContent = cfg.title || '';
    document.getElementById('oep-sub').textContent = cfg.subtitle || '';
    var badge = document.getElementById('oep-badge'); badge.textContent = cfg.badge || ''; badge.hidden = !cfg.badge;
    fillEmblem(cfg.glyph, cfg.color); renderSections(cfg.sections);
    var ov = document.getElementById('oep-overlay'); ov.classList.add('open'); document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('oep-close').focus(); }, 0);
  }

  function close() {
    var ov = document.getElementById('oep-overlay'); if (!ov) return;
    ov.classList.remove('open'); document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  window.OmegaEmblemPanel = { open: open, close: close };
})();
