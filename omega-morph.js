/* ============================================================================
   SYD OMEGA 91717 — MORPH (shared-element page transitions)
   Loaded synchronously at the top of every page's <head> by the block that
   scripts/omega-morph-sync.py keeps identical on all pages. It must run before
   the first paint: `pagereveal` fires at the incoming page's first rendering
   opportunity, and a deferred script (bg.js) is too late for it.

   Outgoing page: when the navigation it starts gets a view transition, the
   clicked card (or the link itself) is named `omega-morph`. Incoming page:
   the page title is given the same name, or, when no title is visible at
   first paint, a transparent full-viewport layer is. Same name on both sides
   = the browser morphs one into the other. Keyboard navigation has no
   pointerdown and crossfades. A name left behind in a bfcache'd page would
   duplicate the next one and void that transition, so pageshow clears it.
   Measured 2026-10-25 on 40 sampled pages: 11 had a visible <h1> at first
   paint, 22 no visible title at all.
   ============================================================================ */
(function () {
  'use strict';
  var NAME = 'omega-morph';
  var last = null;   // element under the most recent pointerdown
  var named = null;  // element this page named on its way out

  addEventListener('pointerdown', function (e) { last = e.target; }, true);

  addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !last || !last.closest) return;
    var a = last.closest('a[href]');
    var to = e.activation && e.activation.entry && e.activation.entry.url;
    if (!a || !to || a.href.split('#')[0] !== to.split('#')[0]) return;
    var el = a.closest('[data-omega-morph],.card,.kpi,.kpi-card') || a;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width > innerWidth * 0.9 || r.height > innerHeight * 0.8) return;
    el.style.viewTransitionName = NAME;
    named = el;
    try { sessionStorage.setItem(NAME, '1'); } catch (x) {}
  });

  addEventListener('pageshow', function (e) {
    if (e.persisted && named) { named.style.viewTransitionName = ''; named = null; }
  });

  addEventListener('pagereveal', function (e) {
    var flag = null;
    try { flag = sessionStorage.getItem(NAME); sessionStorage.removeItem(NAME); } catch (x) {}
    if (!e.viewTransition || flag !== '1') return;
    var h = document.querySelector('[data-omega-morph-target]') || document.querySelector('h1');
    var r = h && h.getBoundingClientRect();
    var made = false;
    if (!h || !r.width || !r.height || r.top > innerHeight) {
      h = document.createElement('div');
      h.style.cssText = 'position:fixed;inset:0;pointer-events:none';
      (document.body || document.documentElement).appendChild(h);
      made = true;
    }
    h.style.viewTransitionName = NAME;
    var clear = function () { if (made) h.remove(); else h.style.viewTransitionName = ''; };
    e.viewTransition.finished.then(clear, clear);
  });
})();
