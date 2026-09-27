/* ============================================================================
   SYD OMEGA 91717 — READ MORE (progressive disclosure)
   Long explanatory paragraphs show their first two lines and a MORE toggle,
   so a page reads at a glance and nothing is deleted. Measured before this
   existed: 119 of 206 pages showed blocks of 90+ characters of running text,
   chronicle.html alone 6,423 characters of them.

   Loaded on every page by bg.js (guard: data-omega-readmore).

   What it clamps: a block (computed display:block) inside the content column
   whose OWN text is at least MIN_CHARS, and only when that text really runs
   past two lines once rendered. What it never touches:
     - legal and consent text, where hiding any part would be wrong
       (terms, privacy, sovereign-covenant, charter), and the AI chat;
     - forms, tables, dialogs, code, editable areas, the sidebar and rail;
     - anything marked [data-no-clamp] or inside it.

   Elements are measured only once rendered: the approval guard hides the
   content column until the profile is approved, and a hidden block measures
   0 (CLAUDE.md 8.1 class 3). Unrendered blocks are left for the next pass,
   which runs on DOM changes and on <body> class changes (the guard reveal).
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaReadMore) return;

  var MIN_CHARS = 100;   /* the real test is lines: fold only at 4+ rendered lines */
  var SKIP_PAGES = { terms: 1, privacy: 1, 'sovereign-covenant': 1, charter: 1, chatbot: 1, 'control-plane': 1 };
  var SKIP_INSIDE = 'form,table,dialog,pre,code,textarea,[contenteditable],[data-no-clamp],' +
    '#omega-side,#omega-context-rail,nav,header,footer,.omega-page-door,#omega-copilot,#ofb-ov,[role="dialog"]';

  var slug = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  if (SKIP_PAGES[slug]) { window.OmegaReadMore = { scan: function () {}, count: function () { return 0; } }; return; }

  function label(key, fallback) {
    var I = window.OmegaI18n;
    if (I && typeof I.t === 'function') {
      var v = I.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function injectStyle() {
    if (document.getElementById('orm-style')) return;
    var st = document.createElement('style');
    st.id = 'orm-style';
    st.textContent =
      '.orm-clamp{display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}' +
      '.orm-btn{display:inline-flex;align-items:center;gap:6px;margin:6px 0 2px;min-height:32px;padding:0 12px;' +
      'border:1px solid rgba(201,168,76,.28);border-radius:999px;background:rgba(201,168,76,.06);color:var(--gold,#C9A84C);' +
      'font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;cursor:pointer;transition:border-color .18s,background .18s}' +
      '.orm-btn:hover,.orm-btn:focus-visible{border-color:rgba(201,168,76,.7);background:rgba(201,168,76,.12);outline:none}' +
      '.orm-btn::before{content:"+";font-size:14px;line-height:1}' +
      '.orm-btn[aria-expanded="true"]::before{content:"\\2212"}' +
      '@media (prefers-reduced-motion:reduce){.orm-btn{transition:none}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function ownText(el) {
    var t = '';
    for (var i = 0; i < el.childNodes.length; i++) {
      var c = el.childNodes[i];
      if (c.nodeType === 3) t += c.nodeValue;
      else if (c.nodeType === 1 && /^(A|B|STRONG|EM|I|SPAN|SMALL|BR|MARK|SUP|SUB)$/.test(c.tagName)) t += c.textContent;
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  function root() {
    return document.querySelector('main') || document.getElementById('app') || document.body;
  }

  var seq = 0;
  var clamped = 0;

  function consider(el) {
    if (el.hasAttribute('data-orm')) return;
    if (el.closest(SKIP_INSIDE)) { el.setAttribute('data-orm', 'skip'); return; }
    /* A clamp must never hide a control or a picture, only running text. */
    if (el.querySelector('button,input,select,textarea,img,svg,canvas,video,iframe,[role="button"]')) {
      el.setAttribute('data-orm', 'controls'); return;
    }
    var text = ownText(el);
    if (text.length < MIN_CHARS) { el.setAttribute('data-orm', 'short'); return; }
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;                       /* not rendered yet: retry later */
    var cs = getComputedStyle(el);
    if (cs.display !== 'block' || cs.position === 'fixed' || cs.position === 'absolute') {
      el.setAttribute('data-orm', 'layout'); return;
    }
    el.classList.add('orm-clamp');
    /* Fold only when it saves more than the MORE button costs: at least two
       further lines hidden. A paragraph barely over two lines stays whole,
       or the page grows (measured: media.html +16px, houses.html +5px). */
    var lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 20;
    if (el.scrollHeight - el.clientHeight < lh * 2) {
      el.classList.remove('orm-clamp');
      el.setAttribute('data-orm', 'fits');
      return;
    }
    var id = el.id || ('orm-' + (++seq));
    if (!el.id) el.id = id;
    el.setAttribute('data-orm', 'on');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'orm-btn';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', id);
    b.textContent = label('ui_read_more', 'MORE');
    b.addEventListener('click', function () {
      var open = el.classList.toggle('orm-clamp') === false;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? label('ui_read_less', 'LESS') : label('ui_read_more', 'MORE');
    });
    el.insertAdjacentElement('afterend', b);
    clamped++;
  }

  function scan() {
    var r = root();
    if (!r) return;
    var list = r.querySelectorAll('p:not([data-orm]),div:not([data-orm])');
    for (var i = 0; i < list.length; i++) consider(list[i]);
  }

  var pending = 0;
  function schedule() {
    if (pending) return;
    pending = setTimeout(function () { pending = 0; scan(); }, 300);
  }

  function boot() {
    injectStyle();
    scan();
    if (typeof MutationObserver === 'function') {
      /* New content anywhere (pages render lore and data after load)... */
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType === 1 && !(n.classList && n.classList.contains('orm-btn'))) { schedule(); return; }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
      /* ...and the approval guard's reveal, which is a class on <body> only.
         Not the whole subtree: animated pages flip classes constantly. */
      new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  window.OmegaReadMore = { scan: scan, count: function () { return clamped; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
