/* ─────────────────────────────────────────────────────────────────────────
   Ω BOTTOM STACK — one measured inset for transient bottom banners.

   THE PROBLEM THIS SOLVES, MEASURED

   Four modules anchor fixed bars to the bottom of the viewport and coordinate
   only through hand-tuned constants: omega-controls.js:59 pins
   #omega-controls-dock at bottom:102px!important and omega-realtime.js:119
   pins #omega-ticker-strip at bottom:66px!important, both inside one
   @media(max-width:760px). Neither number tracks any bar's real height, so
   both are right at exactly one viewport. Rendered geometry, dashboard.html:

     1280x800  #omega-consent  bottom:0   h 80    (alone)
      900x700  #omega-consent  598-700    h 102
               #omega-controls-dock 612-664       -> 66px covered
      420x760  #omega-consent  626-760    h 134
               #omega-mob      687-760    h 73    -> covered entirely,
                                                     same z-index 9990
               #omega-controls-dock 614-658       -> 32px covered

   The 102px was tuned to clear #omega-mob's 73px. It was never tuned against
   #omega-consent, whose height is 80, 102 or 134 depending on how the copy
   wraps -- which is exactly why a constant cannot express this.

   THE DIRECTION OF THE FIX, AND WHY THIS ONE

   The persistent chrome (mobile nav, controls dock, ticker strip) is the
   page's furniture and is already positioned the way each page wants it. The
   banners that collide with it -- consent and the install invitation -- are
   transient. So the transient bars move and the furniture does not: this
   module publishes --omega-chrome-bottom, the measured height of whatever
   persistent bottom chrome is actually on screen, and those two banners set
   `bottom: var(--omega-chrome-bottom, 0px)`.

   Moving the furniture instead would have pushed a 134px consent bar plus a
   73px nav plus a 44px dock into 760px of viewport, and would have changed
   the resting layout of every page for a bar that clears on one tap. The
   fallback in the var() matters: omega-legal.js injects its CSS before this
   module runs, and a banner with no inset yet must still land somewhere sane.

   WHAT IT DOES NOT DO

   It does not reposition the furniture, does not touch z-index, and does not
   know about any specific page. A page or module that wants its own bar
   counted marks it `data-omega-bottom-chrome`.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.__OMEGA_BOTTOM_STACK__) return;
  window.__OMEGA_BOTTOM_STACK__ = true;

  var PROP = '--omega-chrome-bottom';       /* persistent furniture only */
  var PROP_T = '--omega-transient-bottom';  /* furniture + whatever banner is up */

  /* Persistent bottom furniture. The transient banners are deliberately NOT
     here -- measuring them would feed their own moved position back in. */
  var CHROME = '#omega-mob, #omega-controls-dock, #omega-ticker-strip, [data-omega-bottom-chrome]';

  /* The bars that come and go. They are positioned FROM --omega-chrome-bottom,
     and their own reach is published separately as --omega-transient-bottom so
     the floating right-edge ladder in bg.js can step over them. No cycle: not
     one member of that ladder is in CHROME, so moving it cannot change either
     measurement. */
  var TRANSIENT = '#omega-consent, #omega-install-banner, [data-omega-bottom-transient]';

  var _last = null, _lastT = null, _queued = false, _ro = null;

  function extentOf(el) {
    var cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return 0;
    if (cs.pointerEvents === 'none') return 0;          /* a backdrop is not furniture */
    if (parseFloat(cs.opacity || '1') < 0.05) return 0;
    var r = el.getBoundingClientRect();
    if (r.height < 4) return 0;
    /* Bottom-anchored, by the one test that actually means it: a resolved
       `bottom` length rather than `auto`. Requiring the bar to TOUCH the
       viewport floor was the first version of this check and it was wrong --
       #omega-controls-dock already sits at bottom:102px to clear the mobile
       nav, so it never touches the floor and scored zero, leaving the consent
       bar overlapping it by 44px at 420x760 and 52px at 900x700. A dock that
       is already offset upward is still part of the stack; what matters is
       how far it reaches up from the bottom edge, offset included. */
    if (cs.bottom === 'auto') return 0;
    if (r.bottom > window.innerHeight + 2) return 0;              /* below the fold */
    if (window.innerHeight - r.bottom > window.innerHeight * 0.35) return 0;  /* a top bar */
    if (r.height > window.innerHeight * 0.5) return 0;            /* a full-height panel is not a bar */
    return Math.max(0, Math.round(window.innerHeight - r.top));
  }

  function reachOf(list) {
    var out = 0;
    for (var i = 0; i < list.length; i++) {
      var e = extentOf(list[i]);
      if (e > out) out = e;
    }
    return out;
  }

  function measure() {
    _queued = false;
    var chrome, trans;
    try {
      chrome = document.querySelectorAll(CHROME);
      trans = document.querySelectorAll(TRANSIENT);
    } catch (e) { return; }

    var inset = reachOf(chrome);
    if (inset !== _last) {                              /* never write the same value */
      _last = inset;
      document.documentElement.style.setProperty(PROP, inset + 'px');
    }
    /* Read AFTER the chrome value is set: the banners are laid out from it, and
       a banner still sitting at its previous offset would understate the reach.
       The observers below re-fire when it moves, so this converges rather than
       relying on one pass being right. */
    /* max(inset, ...) ONLY while a banner is actually up. A transient bar is
       positioned FROM --omega-chrome-bottom and grows upward, so its reach is
       inherently >= inset and the floor is what keeps a banner mid-relayout
       from understating it. With no banner on screen reachOf() is 0, and the
       unconditional max published `inset` instead -- measured at 1280x800 on
       dashboard.html, --omega-transient-bottom rested at 94px with no banner
       anywhere, lifting every rung of the floating ladder 94px on every page
       for every member, permanently. The ladder exists to step over BANNERS;
       it was already measured clear of the furniture (#cp-btn x 1204..1256 vs
       the dock's 432..848 -- no x overlap at all). So publish the honest
       zero, which is what this module's own header always claimed it did:
       "0 when none, so the resting ladder is byte-for-byte the measured one".
       The code did not match the comment; the render is what settled it. */
    var tRaw = reachOf(trans);
    var tReach = tRaw > 0 ? Math.max(inset, tRaw) : 0;
    /* A boolean the cascade can actually branch on. A custom property cannot
       be tested in a media query or a selector, and @container style() is not
       broadly available, so "is a banner up" needs an attribute. bg.js's
       mobile ladder uses it to STEP ASIDE instead of stepping over: measured
       at 375x667 and 360x640, lifting the four floats over a 235px consent
       banner put #cp-btn at top -32 and -59 -- off the screen entirely, which
       is worse than the overlap it was fixing. Shifting works where there is
       room and stops working where there is not, and only the short viewports
       show which is which. */
    if (tRaw > 0) document.documentElement.setAttribute('data-omega-transient', '1');
    else document.documentElement.removeAttribute('data-omega-transient');
    if (tReach !== _lastT) {
      _lastT = tReach;
      document.documentElement.style.setProperty(PROP_T, tReach + 'px');
    }
    observeChrome(chrome, trans);
  }

  function schedule() {
    if (_queued) return;
    _queued = true;
    requestAnimationFrame(measure);
  }

  function observeChrome(els, trans) {
    /* A dock can change height without the DOM changing -- the controls dock
       wraps onto a second row at narrow widths. ResizeObserver catches that;
       resize alone does not, because the wrap happens at widths the media
       query does not announce. */
    if (typeof ResizeObserver !== 'function') return;
    if (_ro) _ro.disconnect();
    _ro = new ResizeObserver(schedule);
    for (var i = 0; i < els.length; i++) { try { _ro.observe(els[i]); } catch (e) {} }
    for (var j = 0; trans && j < trans.length; j++) { try { _ro.observe(trans[j]); } catch (e) {} }
  }

  function start() {
    measure();
    addEventListener('resize', schedule, { passive: true });
    addEventListener('orientationchange', schedule, { passive: true });
    /* The docks are injected by other modules at unpredictable times, and the
       approval guard reveals the shell with no resize event of its own
       (CLAUDE.md 8.1 class 3), so a DOM observer is the only reliable signal. */
    if (document.body) {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  }

  /* bg.js can load this before <body> exists (CLAUDE.md 8.1 class 5a): queue
     rather than dropping the work. */
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  window.OmegaBottomStack = {
    /* The measured inset in px, for anything that needs the number rather
       than the custom property. Null until the first measurement lands. */
    inset: function () { return _last; },
    transientInset: function () { return _lastT; },
    remeasure: schedule
  };
})();
