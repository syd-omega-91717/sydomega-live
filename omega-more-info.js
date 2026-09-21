/* ══════════════════════════════════════════════════════════════════════════
   Ω MORE INFO — short lead text on the page, the full explanation one click away

   Several pages open with a long, verbose explanatory paragraph in a `.glass`
   panel before any real content. That is a lot of reading before a member
   reaches anything they can act on. This module lets a page keep its full,
   real copy (nothing here invents or shortens the underlying text) while
   showing only a short lead by default, with the full paragraph one click
   away -- collapsed, not deleted.

   MARKUP CONTRACT (opt-in, additive -- a page not using it is unaffected):

     <div data-omega-more>
       <p class="omi-lead">One-sentence summary, always visible.</p>
       <div class="omi-full" hidden>
         The original, full explanatory text goes here unchanged.
       </div>
     </div>

   This is a click-triggered DISCLOSURE toggle, not a scroll-entrance reveal --
   a different concern from `omega-content.js`'s `.oc-hidden` and
   `omega-animated.js`'s `.oa-reveal`, which both fire once on scroll-into-view
   and never re-hide. Never apply `.oc-hidden`/`.oa-reveal` to an
   `.omi-full`/`.omi-lead` element -- that would stack two reveal systems on
   one element, which CLAUDE.md's Ω-GVP notes already flags as a real,
   previously-shipped bug class (an animation's own keyframe silently beating
   this module's `hidden` attribute).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.OmegaMoreInfo) return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectStyle() {
    if (document.getElementById('omega-more-info-css')) return;
    var st = document.createElement('style');
    st.id = 'omega-more-info-css';
    st.textContent =
      '.omi-toggle{display:inline-flex;align-items:center;gap:5px;margin-top:8px;' +
      'font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--cyan);' +
      'background:none;border:1px solid rgba(0,229,255,.3);border-radius:2px;' +
      'padding:4px 9px;cursor:pointer;transition:.12s}' +
      '.omi-toggle:hover{background:rgba(0,229,255,.08);border-color:rgba(0,229,255,.5)}' +
      '.omi-toggle:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}' +
      '.omi-toggle-arrow{display:inline-block;transition:transform .18s}' +
      '.omi-toggle[aria-expanded="true"] .omi-toggle-arrow{transform:rotate(180deg)}' +
      '.omi-full{overflow:hidden;max-height:0;opacity:0;' +
      (REDUCED ? '' : 'transition:max-height .28s ease,opacity .2s ease,margin-top .28s ease;') +
      'margin-top:0}' +
      '.omi-full.omi-open{opacity:1;margin-top:10px}' +
      '@media(prefers-reduced-motion:reduce){.omi-full{transition:none}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function wire(host) {
    if (host.getAttribute('data-omega-more-wired')) return;
    host.setAttribute('data-omega-more-wired', '1');

    var full = host.querySelector('.omi-full');
    var lead = host.querySelector('.omi-lead');
    if (!full || !lead) return;

    full.hidden = false; /* controlled by max-height/opacity below, not [hidden] */

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'omi-toggle';
    btn.setAttribute('aria-expanded', 'false');
    var fullId = full.id || ('omi-full-' + Math.random().toString(36).slice(2, 9));
    full.id = fullId;
    btn.setAttribute('aria-controls', fullId);
    btn.innerHTML = '<span class="omi-toggle-label">MORE INFO</span><span class="omi-toggle-arrow" aria-hidden="true">▾</span>';
    lead.parentNode.insertBefore(btn, full);

    var open = false;
    function apply() {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.omi-toggle-label').textContent = open ? 'LESS INFO' : 'MORE INFO';
      if (open) {
        full.classList.add('omi-open');
        full.style.maxHeight = full.scrollHeight + 'px';
      } else {
        full.style.maxHeight = '0px';
        full.classList.remove('omi-open');
      }
    }
    btn.addEventListener('click', function () {
      open = !open;
      apply();
    });
    /* A window resize can change wrapped line count, which changes
       scrollHeight -- keep an open panel's max-height correct rather than
       clipping it after a viewport change. */
    window.addEventListener('resize', function () {
      if (open) full.style.maxHeight = full.scrollHeight + 'px';
    });
  }

  function scan() {
    var hosts = document.querySelectorAll('[data-omega-more]');
    for (var i = 0; i < hosts.length; i++) wire(hosts[i]);
  }

  function init() {
    injectStyle();
    scan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.OmegaMoreInfo = { scan: scan };
})();
