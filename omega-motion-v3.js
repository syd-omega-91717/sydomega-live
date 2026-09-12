/* ============================================================================
   SYD OMEGA 91717 — MOTION SYSTEM v3 (EXTENDED)
   Domain-specific entrance patterns, reveal animations, semantic motion.

   Layers on top of omega-motion.js (v2) with:
   - Domain-aware entrance choreography (card, dashboard, data, hero types)
   - Reveal/dismiss patterns for state changes
   - Success/error feedback motions
   - Per-agent motion personalities (Weeks 25-32 roadmap)

   Loaded after omega-motion.js (v2). Both run; v3 extends without
   replacing. Works with data-omega-motion-type attributes on elements.
   ========================================================================== */

(function () {
  'use strict';
  if (window.__omegaMotionV3) return;
  window.__omegaMotionV3 = 1;

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion:reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }

  if (typeof Element === 'undefined' || !Element.prototype.animate) return;

  var EASE = 'cubic-bezier(.16,1,.3,1)';  /* expo-out */
  var EASE_IN = 'cubic-bezier(.42,0,1,.58)';  /* expo-in-out */

  /* ─────────────────────────────────────────────────────────────────────
     DOMAIN-SPECIFIC ENTRANCE CHOREOGRAPHY
     Each content type gets its own entrance personality, coordinating with
     data-omega-motion-type attributes. Backward compatible — elements
     without the attribute get the default v2 behavior.
     ───────────────────────────────────────────────────────────────────── */

  var MOTION_TYPES = {
    card: {
      keyframes: [
        { opacity: 0, transform: 'translateY(14px) scale(.985)' },
        { opacity: 1, transform: 'none' }
      ],
      timing: { duration: 520, easing: EASE }
    },
    dashboard: {
      keyframes: [
        { opacity: 0, transform: 'translateX(-16px) rotateY(8deg)' },
        { opacity: 1, transform: 'none' }
      ],
      timing: { duration: 640, easing: EASE }
    },
    data: {
      keyframes: [
        { opacity: 0, transform: 'scale(.88)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      timing: { duration: 480, easing: EASE }
    },
    table: {
      keyframes: [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' }
      ],
      timing: { duration: 440, easing: EASE }
    },
    hero: {
      keyframes: [
        { opacity: 0, transform: 'rotate(-2deg) scale(.95)' },
        { opacity: 1, transform: 'none' }
      ],
      timing: { duration: 720, easing: EASE }
    }
  };

  function enterDomainAware(el, delay) {
    try {
      var motionType = el.getAttribute('data-omega-motion-type') || 'card';
      var spec = MOTION_TYPES[motionType] || MOTION_TYPES.card;

      el.animate(spec.keyframes, {
        ...spec.timing,
        delay: delay,
        fill: 'none'
      });
    } catch (e) {}
  }

  function observeEntrancesDomainAware() {
    if (!('IntersectionObserver' in window)) return;
    var batch = [], flush = null;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        batch.push(en.target);
      });
      if (batch.length && !flush) {
        flush = requestAnimationFrame(function () {
          flush = null;
          var n = batch.length;
          var step = n > 1 ? Math.min(42, 320 / (n - 1)) : 0;
          batch.forEach(function (el, i) { enterDomainAware(el, i * step); });
          batch = [];
        });
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

    function claimed(el) {
      return el.classList.contains('oc-hidden') ||
             el.classList.contains('oa-reveal') ||
             el.classList.contains('oa-revealed');
    }

    function scan() {
      var sel = '[data-omega-motion-type]';
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.__omgSeenV3 || claimed(el)) return;
        el.__omgSeenV3 = 1;
        io.observe(el);
      });
    }

    scan();
    var tries = 0;
    var iv = setInterval(function () { scan(); if (++tries > 12) clearInterval(iv); }, 500);
  }

  /* ─────────────────────────────────────────────────────────────────────
     REVEAL/DISMISS PATTERNS
     State-change animations that communicate purpose, not just fade.
     Usage: el.animate(REVEAL.show, { duration: 300, easing: EASE })
     ───────────────────────────────────────────────────────────────────── */

  var REVEAL = {
    show: [
      { opacity: 0, transform: 'scale(.95)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    dismiss: [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(-8px) scale(.96)' }
    ],
    expand: [
      { opacity: 0, maxHeight: '0px' },
      { opacity: 1, maxHeight: '1000px' }
    ],
    collapse: [
      { opacity: 1, maxHeight: '1000px' },
      { opacity: 0, maxHeight: '0px' }
    ]
  };

  window.OmegaReveal = REVEAL;  /* Expose for on-demand use */

  /* ─────────────────────────────────────────────────────────────────────
     FEEDBACK ANIMATIONS
     Success, error, warning states get their own motion signature.
     ───────────────────────────────────────────────────────────────────── */

  function playSuccess(el) {
    if (reduced() || !el || !el.animate) return;
    try {
      el.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.08)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        { duration: 420, easing: EASE, fill: 'none' }
      );
    } catch (e) {}
  }

  function playError(el) {
    if (reduced() || !el || !el.animate) return;
    try {
      el.animate(
        [
          { transform: 'translateX(0)', opacity: 1 },
          { transform: 'translateX(-6px)', opacity: .8 },
          { transform: 'translateX(6px)', opacity: .8 },
          { transform: 'translateX(0)', opacity: 1 }
        ],
        { duration: 320, easing: 'cubic-bezier(.34,.1,.68,.1)', fill: 'none' }
      );
    } catch (e) {}
  }

  /* Listen for feedback events */
  document.addEventListener('omega:feedback', function (e) {
    if (!e.detail || !e.detail.element) return;
    var el = e.detail.element;
    if (e.detail.type === 'success') playSuccess(el);
    if (e.detail.type === 'error') playError(el);
  });

  window.OmegaPlayFeedback = { success: playSuccess, error: playError };

  /* ─────────────────────────────────────────────────────────────────────
     AGENT-SPECIFIC MOTION PERSONALITIES
     Placeholder for Week 25+ roadmap. Each agent gets motion voice.
     ───────────────────────────────────────────────────────────────────── */

  var AGENT_MOTION = {
    concierge: { speed: 'fast', character: 'decisive' },    /* snappy, purposeful */
    growth: { speed: 'medium', character: 'expansive' },    /* smooth, building */
    product: { speed: 'medium', character: 'adaptive' },    /* flexible, responsive */
    insights: { speed: 'slow', character: 'deliberate' },   /* measured, thoughtful */
    archive: { speed: 'slow', character: 'meditative' },    /* calm, reflective */
    guardian: { speed: 'fast', character: 'protective' }    /* sharp, alert */
  };

  window.OmegaAgentMotion = AGENT_MOTION;

  /* ─────────────────────────────────────────────────────────────────────
     VALUE ROLL-UP v2 (from omega-motion.js, unchanged)
     Kept for reference; v2's rollUp() handles the actual counting.
     ───────────────────────────────────────────────────────────────────── */

  /* ─────────────────────────────────────────────────────────────────────
     INITIALIZATION
     ───────────────────────────────────────────────────────────────────── */

  function start() {
    if (reduced()) return;
    observeEntrancesDomainAware();
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(start);

  /* Watch reduced-motion setting live */
  if (mq) {
    var onChange = function () {
      if (!mq.matches) start();
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

})();
