/* =========================================================================
   Ω OMEGA — KEYBOARD-OPERABLE CLICK TARGETS
   =========================================================================

   WHY THIS EXISTS

   This estate drives a lot of navigation from `<div onclick="location.href=
   '/x.html'">`. A div is not focusable and does not fire a click on Enter, so
   every one of those is invisible to anyone who does not use a mouse -- a
   keyboard user, a switch user, most voice control, and anyone whose pointer
   is temporarily unavailable.

   MEASURED (2026-09-06, rendered, not grepped): 51 keyboard-inaccessible
   click targets across 8 sampled pages -- 44 on dashboard.html and exactly 1
   on every other page. That 1 was the sidebar brand mark, which is now a real
   <a> in nav.js. This module covers the rest.

   WHY AT RUNTIME AND NOT IN THE MARKUP

   The alternative was editing ~145 elements across ~165 files. That is a
   sweep, and CLAUDE.md 8.1 is a catalogue of what estate-wide sweeps cost
   here. One module is reviewable in one diff and revertible in one commit,
   and it also covers markup injected later by other modules, which a
   source sweep never could.

   WHAT IT DOES NOT DO

   It does not invent interactivity. It only makes elements that ALREADY
   declare an onclick handler reachable by the keyboard. An element that is
   already operable -- a native control, or a div someone gave both tabindex
   and a key handler -- is left completely alone.

   Focus visibility is not this module's job and is not duplicated here:
   bg.js already styles `[tabindex]:focus-visible` with a cyan outline, so
   anything this module makes focusable gets a visible ring for free.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__omegaA11yControls) return;
  window.__omegaA11yControls = 1;

  /* Elements the browser already makes focusable and Enter/Space operable. */
  var NATIVE = { A: 1, BUTTON: 1, INPUT: 1, SELECT: 1, TEXTAREA: 1, SUMMARY: 1 };

  /* An onclick that sends the browser somewhere is a link; anything else that
     merely runs script is a button. The distinction is not cosmetic -- it sets
     what a screen reader announces and which keys are expected to activate it
     (ARIA: link = Enter only, button = Enter and Space). */
  var NAVIGATES = /location\s*\.\s*(href|assign|replace)|location\s*=|window\s*\.\s*open/;

  function alreadyOperable(el) {
    var ti = el.getAttribute('tabindex');
    var focusable = ti !== null && ti !== '-1';
    var keyed = el.hasAttribute('onkeydown') || el.hasAttribute('onkeypress');
    return focusable && keyed;
  }

  function onKey(ev) {
    var el = ev.currentTarget;
    var isLink = el.getAttribute('role') === 'link';
    if (ev.key === 'Enter') {
      ev.preventDefault();
      el.click();
      return;
    }
    /* Space activates a button but scrolls the page on a link, so honour the
       role rather than treating every upgraded element the same. */
    if (!isLink && (ev.key === ' ' || ev.key === 'Spacebar')) {
      ev.preventDefault();
      el.click();
    }
  }

  function upgrade(root) {
    var nodes;
    try { nodes = (root || document).querySelectorAll('[onclick]'); }
    catch (e) { return 0; }
    var n = 0;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (NATIVE[el.tagName]) continue;
      if (el.hasAttribute('data-omega-kb')) continue;   /* already handled */
      if (alreadyOperable(el)) continue;                /* author did it properly */

      el.setAttribute('data-omega-kb', '1');
      if (el.getAttribute('tabindex') === null) el.setAttribute('tabindex', '0');
      if (!el.getAttribute('role')) {
        el.setAttribute('role', NAVIGATES.test(el.getAttribute('onclick') || '') ? 'link' : 'button');
      }
      /* A control with no accessible name is announced as just "link" or
         "button". Fall back to title, which this estate uses widely, before
         leaving one unnamed. */
      if (!el.getAttribute('aria-label') && !(el.textContent || '').trim() && el.title) {
        el.setAttribute('aria-label', el.title);
      }
      el.addEventListener('keydown', onKey);
      n++;
    }
    return n;
  }

  /* Modules inject markup well after DOMContentLoaded here (nav.js, the
     copilot, the emblem panel), so a single pass would miss whatever arrives
     late. Observe, but coalesce into one rAF so a chatty module cannot turn
     this into a hot loop. */
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; upgrade(document); });
  }

  function start() {
    upgrade(document);
    try {
      new MutationObserver(schedule)
        .observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) { /* observation is an enhancement; the first pass already ran */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* Exposed so a page that builds its own controls can re-run it directly
     rather than waiting for the observer. */
  window.OmegaA11yControls = { upgrade: upgrade };
})();
