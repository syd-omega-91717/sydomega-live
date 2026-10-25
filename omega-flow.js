/* ============================================================================
   SYD OMEGA 91717 — FLOW
   Two native browser capabilities the platform did not use, both progressive:
   a browser without them gets exactly the page it got before.

   1. Scroll beam. A 2px bar along the top edge that fills as the page is read,
      in the page's own axis colour (--page-accent, published by
      omega-identity.js from nav.js's section map). It is driven by a CSS
      scroll timeline (`animation-timeline: scroll(root)`), so the browser's
      compositor moves it: no scroll listener, no JavaScript per frame. Its
      resting state is scaleX(0), so a browser without scroll timelines, or a
      page too short to scroll (the timeline is then inactive), shows nothing.
      Measured 2026-10-25: the root element is the scroller on every page
      sampled; the only inner scroller is nav.js's .on-sections drawer.
      It rides one layer above the two ambient 2px scan lines already on that
      edge (nav.js #omega-top and theme.js #omega-status-bar, both z-index
      10000), so the scan keeps moving underneath and progress fills over it.

   2. Speculation Rules prefetch. When a pointer rests on a same-origin page
      link (eagerness "moderate"), Chrome fetches that page's HTML ahead of
      the click, so the existing cross-document view transition
      (`@view-transition{navigation:auto}` in bg.js) plays without the
      network wait. PREFETCH, deliberately not prerender: a prerendered page
      runs its scripts, and pages here write on load (telemetry, check-ins),
      which would record visits the member never made. A prefetch is one GET
      of a static file and runs nothing. Links that open elsewhere, download,
      carry a query string, are not a page (.html or /), or opt out with data-no-prefetch are excluded.

   Its own guard attribute, data-omega-flow (CLAUDE.md 8.1 class 5b).
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaFlow) return;

  var STYLE_ID = 'omega-flow-style';
  var BEAM_ID = 'omega-scroll-beam';
  var RULES_ID = 'omega-flow-rules';

  var SHEET = [
    '#' + BEAM_ID + '{position:fixed;top:0;left:0;right:0;height:3px;z-index:10001;pointer-events:none;',
    'transform:scaleX(0);transform-origin:0 50%;',
    'background:linear-gradient(90deg,transparent,var(--page-accent,#C9A84C) 35%,#fff);',
    'box-shadow:0 0 10px var(--page-accent-glow,rgba(201,168,76,.4))}',
    '@supports (animation-timeline:scroll()){',
    '#' + BEAM_ID + '{animation:omega-flow-beam linear both;animation-timeline:scroll(root block)}}',
    '@keyframes omega-flow-beam{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    '@media print{#' + BEAM_ID + '{display:none}}'
  ].join('');

  var RULES = {
    prefetch: [{
      source: 'document',
      where: { and: [
        /* search:'' matches an empty query only. The string form '/*\\?*' was
           tried and matched every link, so its negation prefetched nothing. */
        { or: [
          { href_matches: { pathname: '/*.html', search: '' } },
          { href_matches: { pathname: '/', search: '' } }
        ] },
        { not: { selector_matches: '[target],[download],[rel~=external],[rel~=nofollow],[data-no-prefetch]' } }
      ] },
      eagerness: 'moderate'
    }]
  };

  function speculationSupported() {
    try {
      return typeof HTMLScriptElement !== 'undefined' &&
        typeof HTMLScriptElement.supports === 'function' &&
        HTMLScriptElement.supports('speculationrules');
    } catch (e) { return false; }
  }

  var state = { beam: false, prefetch: false, timeline: false };

  function mount() {
    var head = document.head || document.documentElement;
    if (!document.getElementById(STYLE_ID)) {
      var st = document.createElement('style');
      st.id = STYLE_ID;
      st.textContent = SHEET;
      head.appendChild(st);
    }
    if (document.body && !document.getElementById(BEAM_ID)) {
      var beam = document.createElement('div');
      beam.id = BEAM_ID;
      beam.setAttribute('aria-hidden', 'true');
      document.body.appendChild(beam);
    }
    state.beam = !!document.getElementById(BEAM_ID);
    state.timeline = !!(window.CSS && typeof window.CSS.supports === 'function' &&
      window.CSS.supports('animation-timeline', 'scroll()'));

    if (speculationSupported() && !document.getElementById(RULES_ID)) {
      var s = document.createElement('script');
      s.type = 'speculationrules';
      s.id = RULES_ID;
      s.textContent = JSON.stringify(RULES);
      head.appendChild(s);
    }
    state.prefetch = !!document.getElementById(RULES_ID);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });

  window.OmegaFlow = {
    status: function () { return { beam: state.beam, timeline: state.timeline, prefetch: state.prefetch }; },
    rules: RULES
  };
})();
