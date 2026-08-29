/* ============================================================================
   SYD OMEGA 91717 -- MOTION SYSTEM
   The interaction and animation half of the design language. Reaches all
   pages through bg.js; no page markup changes, no build step.

   Four behaviours:
     1. ENTRANCE CHOREOGRAPHY -- surfaces rise and fade in, staggered along
        their reading order, as they enter the viewport.
     2. VALUE ROLL-UP         -- numeric readouts count up to their value the
        first time they are seen, so a dashboard reads as instrumentation
        coming online rather than as static text.
     3. POINTER TILT          -- cards lean very slightly toward the cursor.
     4. PRESS FEEDBACK        -- controls acknowledge a press.

   ── WHY THE WEB ANIMATIONS API, NOT CSS CLASSES ─────────────────────────
   The obvious way to build an entrance is `opacity:0` in CSS plus a class the
   observer adds. That is a trap in this repo: 36 of 43 `.tbl-wrap` instances
   live in `display:none` tab panels and never intersect, the approval guard
   hides `#app` until a profile check resolves and fires NO resize or
   intersection event when it lifts, and any JS error between hiding and
   revealing leaves content permanently invisible with no way back.

   So nothing here ever writes a persistent hidden state. Every entrance is
   `element.animate([...], {fill:'none'})` -- the resting state stays exactly
   what the page's own CSS says, the animation only borrows the element for
   its duration, and if this file never runs, throws, or is blocked, every
   page renders normally. Invisible content is not a possible outcome.

   ── WHY `rotate`/`scale` AND NOT `transform` ────────────────────────────
   `.card:hover` already sets `transform:translateY(-2px)`, `.kpi:hover` sets
   its own, and `#omega-depth-field` runs a keyframe animation that owns
   `transform` outright -- and a running animation beats a plain declaration,
   which is how an earlier parallax attempt silently did nothing. `rotate` and
   `scale` are independent animatable properties that COMPOSE with an animated
   or hovered `transform` instead of replacing it, so the tilt adds to the
   existing lift rather than fighting it.

   ── MOTION IS OPTIONAL, ALWAYS ──────────────────────────────────────────
   Under `prefers-reduced-motion: reduce` nothing below registers at all --
   no observers, no listeners, no timers. The query is also watched live, so
   changing the OS setting takes effect without a reload.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaMotion) return;
  window.__omegaMotion = 1;

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion:reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }

  /* Element.animate is the whole basis of the failure-safety argument above.
     Without it, do nothing at all rather than fall back to class toggling. */
  if (typeof Element === 'undefined' || !Element.prototype.animate) return;

  var EASE = 'cubic-bezier(.16,1,.3,1)';          /* expo-out: arrives fast, settles slow */

  /* ---------------------------------------------------------------------
     1. ENTRANCE CHOREOGRAPHY
     Stagger is capped and computed per batch, so a page with 200 cards does
     not schedule a 12-second cascade -- the last item in any batch starts no
     later than STAGGER_CAP after the first.
     ------------------------------------------------------------------- */
  var ENTER_SEL = '.card,.kpi,.kpi-card,.glass,.glass-cyan,.tbl-wrap,.sechead';
  var STAGGER_STEP = 42, STAGGER_CAP = 320;

  function enter(el, delay) {
    try {
      el.animate(
        [{ opacity: 0, transform: 'translateY(14px) scale(.985)' },
         { opacity: 1, transform: 'none' }],
        { duration: 520, delay: delay, easing: EASE, fill: 'none' }
      );
    } catch (e) {}
  }

  function observeEntrances() {
    if (!('IntersectionObserver' in window)) return;
    var batch = [], flush = null;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);          /* once only -- never re-animate on scroll back */
        batch.push(en.target);
      });
      if (batch.length && !flush) {
        flush = requestAnimationFrame(function () {
          flush = null;
          var n = batch.length;
          var step = n > 1 ? Math.min(STAGGER_STEP, STAGGER_CAP / (n - 1)) : 0;
          batch.forEach(function (el, i) { enter(el, i * step); });
          batch = [];
        });
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

    /* Two reveal systems already exist -- omega-content.js (.oc-hidden) and
       omega-animated.js (.oa-reveal/.oa-revealed) -- and both own `opacity`
       on the elements they manage via a persistent class. Animating opacity
       on top of that would mean three owners for one property and a visible
       double-fade. Verified working (a viewport-relative scan across 8 pages
       found 0 elements stuck invisible in view), so they are left alone and
       this entrance only takes elements nobody else has claimed. */
    function claimed(el) {
      return el.classList.contains('oc-hidden') ||
             el.classList.contains('oa-reveal') ||
             el.classList.contains('oa-revealed');
    }

    function scan() {
      var seen = 0;
      document.querySelectorAll(ENTER_SEL).forEach(function (el) {
        if (el.__omgSeen || claimed(el)) return;
        el.__omgSeen = 1; seen++;
        io.observe(el);
      });
      return seen;
    }

    scan();
    /* The approval guard reveals #app with no event of any kind, and several
       pages render their cards from a query that resolves later. A short
       re-scan window costs nothing and catches both. */
    var tries = 0;
    var iv = setInterval(function () { scan(); if (++tries > 12) clearInterval(iv); }, 500);
  }

  /* ---------------------------------------------------------------------
     2. VALUE ROLL-UP
     Only touches text that is unambiguously a formatted number, and always
     restores the ORIGINAL STRING verbatim at the end -- so currency symbols,
     thousands separators, percent signs and decimal places are never
     re-derived and cannot drift from what the page rendered.
     ------------------------------------------------------------------- */
  var NUM_SEL = '.kpi-n,.kpi-val,.bar-val,.stat-n,.astat-n';
  /* optional leading symbol, digits with separators, optional decimals,
     optional trailing symbol. Anything else is left alone. */
  var NUM_RX = /^([^\d\-+]{0,2})([+-]?[\d][\d,\s]*(?:\.\d+)?)(%|[A-Za-z]{0,3})$/;

  function rollUp(el) {
    var original = (el.textContent || '').trim();
    var m = NUM_RX.exec(original);
    if (!m) return;
    var target = parseFloat(m[2].replace(/[,\s]/g, ''));
    if (!isFinite(target) || target === 0) return;

    var decimals = (m[2].split('.')[1] || '').length;
    var grouped = m[2].indexOf(',') > -1;
    var start = performance.now(), DUR = 900;

    function frame(now) {
      var t = Math.min(1, (now - start) / DUR);
      /* expo-out, matching EASE, so the number settles like the surfaces do */
      var e = 1 - Math.pow(2, -10 * t);
      var v = target * (t === 1 ? 1 : e);
      if (t >= 1) { el.textContent = original; return; }   /* exact original, always */
      var s = v.toFixed(decimals);
      if (grouped) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      el.textContent = m[1] + s + m[3];
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function observeNumbers() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        rollUp(en.target);
      });
    }, { threshold: 0.4 });

    function scan() {
      document.querySelectorAll(NUM_SEL).forEach(function (el) {
        /* omega-content.js runs its own countUp() over a different selector
           list ('.metric .val', '.big', '.figure', '.count', '.balance',
           '[data-oc-count]') and marks what it took with __isNum. The two
           lists do not currently intersect; this guard keeps that true if
           either list grows, since two count-ups on one element would fight
           over textContent. */
        if (el.__omgNum || el.__isNum) return;
        el.__omgNum = 1;
        io.observe(el);
      });
    }
    scan();
    var tries = 0;
    var iv = setInterval(function () { scan(); if (++tries > 12) clearInterval(iv); }, 500);
  }

  /* ---------------------------------------------------------------------
     3. POINTER TILT
     One delegated listener on the document, rAF-throttled, one
     getBoundingClientRect per frame and only while a card is hovered --
     the same shape as the existing --mx/--my pointer highlight in bg.js.
     Writes `rotate`, which composes with the hover `transform` (see header).
     ------------------------------------------------------------------- */
  var TILT_SEL = '.card,.kpi,.kpi-card';
  var MAX_DEG = 2.4;

  function tilt() {
    var current = null, raf = null, px = 0, py = 0;

    function apply() {
      raf = null;
      if (!current) return;
      var r = current.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var dx = (px - (r.left + r.width / 2)) / (r.width / 2);
      var dy = (py - (r.top + r.height / 2)) / (r.height / 2);
      dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
      current.style.rotate = (-dy * MAX_DEG).toFixed(2) + 'deg';
      current.style.perspective = '900px';
    }

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;      /* no hover on touch; skip the work entirely */
      var el = e.target && e.target.closest ? e.target.closest(TILT_SEL) : null;
      if (el !== current) {
        if (current) { current.style.rotate = ''; current.style.perspective = ''; }
        current = el;
        if (current && !current.style.transition) {
          current.style.transition = 'rotate .18s ' + EASE;
        }
      }
      if (!current) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      if (current) { current.style.rotate = ''; current.style.perspective = ''; current = null; }
    }, true);
  }

  /* ---------------------------------------------------------------------
     4. PRESS FEEDBACK
     `scale`, again independent so it composes with any hover transform, and
     fill:'none' so a control never ends up stuck mid-press.
     ------------------------------------------------------------------- */
  function press() {
    document.addEventListener('pointerdown', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('.btn,button,[role="button"]') : null;
      if (!el) return;
      try {
        el.animate([{ scale: '1' }, { scale: '.965' }, { scale: '1' }],
                   { duration: 220, easing: EASE, fill: 'none' });
      } catch (err) {}
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     start / stop
     ------------------------------------------------------------------- */
  var started = false;
  function start() {
    if (started || reduced()) return;
    started = true;
    observeEntrances();
    observeNumbers();
    tilt();
    press();
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }
  ready(start);

  /* Live-watch the setting: turning reduced motion ON mid-session must stop
     new motion immediately, and turning it OFF must not require a reload. */
  if (mq) {
    var onChange = function () {
      if (mq.matches) {
        document.querySelectorAll(TILT_SEL).forEach(function (el) {
          el.style.rotate = ''; el.style.perspective = '';
        });
      } else { start(); }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
