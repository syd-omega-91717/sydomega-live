/* ============================================================================
   SYD OMEGA 91717 -- CANON BADGE
   A small, honest label distinguishing three real content categories on this
   platform, so a viewer never has to guess which is which:

   'mechanic' -- PLATFORM MECHANIC. Computed from your real account data and
                 actually affects your real standing (authority, gates, tier).
   'lore'     -- SYMBOLIC LORE. Consistently defined and real as *content*,
                 but decorative -- it does not compute or gate anything.
   'fiction'  -- CREATIVE FICTION. Narrative/worldbuilding. Not a
                 representation of your account, your future, or anything
                 factual, astronomical, or predictive.

   Usage: <span data-canon="lore"></span> anywhere in the page, then call
   window.OmegaCanonBadge.mount() once after the page's real content has
   rendered (or let bg.js call it automatically -- see bottom of this file).
   Also exposes window.OmegaCanonBadge.render(kind) to get the raw HTML
   string for cases building content via innerHTML templates.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaCanonBadge) return;

  var DEFS = {
    mechanic: { label: 'PLATFORM MECHANIC', color: '#3fb27f', glow: 'rgba(63,178,127,.18)',
      title: 'Computed from your real account data. This actually affects your standing.' },
    lore: { label: 'SYMBOLIC LORE', color: '#9B6BF0', glow: 'rgba(155,107,240,.18)',
      title: 'Real, consistent content on this platform -- but decorative. It does not gate or compute anything.' },
    fiction: { label: 'CREATIVE FICTION', color: '#E86A3A', glow: 'rgba(232,106,58,.18)',
      title: 'Narrative worldbuilding. Not a representation of your account, the future, or anything factual.' }
  };

  var CSS = [
    '.ocb{display:inline-flex;align-items:center;gap:5px;font-family:"Courier Prime",monospace;',
    'font-size:8px;letter-spacing:1.5px;padding:3px 8px;border-radius:2px;border:1px solid;',
    'cursor:default;white-space:nowrap;vertical-align:middle}',
    '.ocb .ocb-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('ocb-styles')) return;
    var s = document.createElement('style'); s.id = 'ocb-styles'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function render(kind) {
    var d = DEFS[kind];
    if (!d) return '';
    return '<span class="ocb" title="' + d.title + '" style="color:' + d.color +
      ';border-color:' + d.color + '55;background:' + d.glow + '">' +
      '<span class="ocb-dot" style="background:' + d.color + '"></span>' + d.label + '</span>';
  }

  function mount(root) {
    injectStyles();
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-canon]');
    for (var i = 0; i < nodes.length; i++) {
      var kind = nodes[i].getAttribute('data-canon');
      if (DEFS[kind]) nodes[i].innerHTML = render(kind);
    }
  }

  window.OmegaCanonBadge = { render: render, mount: mount, defs: DEFS };

  // auto-mount once on initial load, and again shortly after (covers content
  // that renders asynchronously after this script first runs)
  function auto() { mount(document); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }
  setTimeout(auto, 800);
  setTimeout(auto, 2000);
})();
