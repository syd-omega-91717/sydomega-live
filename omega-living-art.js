/* ============================================================================
   Ω LIVING ART — every real image on the platform breathes
   ----------------------------------------------------------------------------
   Owner direction (2026-10-04): "make every solid image alive". This module is
   that rule in code, so it does not depend on each page remembering it.

   Scope: <img> elements rendered at >= 72px, outside the nav (#omega-side),
   without data-no-alive. Each gets
     - a slow idle breath (scale/translate as INDIVIDUAL properties, so a
       pointer tilt on `transform` composes with it instead of erasing it —
       the same trap omega-alive.js documents for emblems),
     - a glow in the page's own accent on hover/focus,
     - a pointer-following 3-D tilt.
   The breath runs only while the image is on screen (IntersectionObserver) and
   never under prefers-reduced-motion. Size is read through ResizeObserver,
   never at DOMContentLoaded: the approval guard hides #app with no resize
   event, so an early measure reads 0 (CLAUDE.md 8.1 class 3).
   Injected by bg.js behind its own guard attribute, data-omega-living-art.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaLivingArt) return;

  var MIN = 72;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function css() {
    if (document.getElementById('ola-css')) return;
    var s = document.createElement('style');
    s.id = 'ola-css';
    s.textContent =
      '.ola-art{animation:ola-breathe 9s ease-in-out infinite;animation-play-state:paused;' +
      'transition:transform .35s cubic-bezier(.2,.7,.2,1),filter .45s ease;transform-style:preserve-3d}' +
      '.ola-art.ola-on{animation-play-state:running}' +
      '.ola-art:hover,.ola-art:focus-visible,.ola-art.ola-tilt{filter:drop-shadow(0 0 18px var(--page-accent-glow,rgba(201,168,76,.45))) brightness(1.06) saturate(1.08)}' +
      '@keyframes ola-breathe{0%,100%{scale:1;translate:0 0}50%{scale:1.025;translate:0 -3px}}' +
      '@media (prefers-reduced-motion:reduce){.ola-art{animation:none;transition:none}}';
    (document.head || document.documentElement).appendChild(s);
  }

  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('ola-on', e.isIntersecting); });
  }, { rootMargin: '80px' }) : null;
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) {
    es.forEach(function (e) {
      var w = e.contentRect.width, h = e.contentRect.height;
      if (w >= MIN && h >= MIN) { enable(e.target); ro.unobserve(e.target); }
    });
  }) : null;

  function eligible(img) {
    if (!img || img.tagName !== 'IMG') return false;
    if (seen && seen.has(img)) return false;
    if (img.hasAttribute('data-no-alive') || img.closest('[data-no-alive]')) return false;
    if (img.closest('#omega-side')) return false;
    return true;
  }

  function tilt(img) {
    if (reduced && reduced.matches) return;
    img.addEventListener('pointermove', function (ev) {
      var r = img.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      img.style.transform = 'perspective(700px) rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg)';
      img.classList.add('ola-tilt');
    }, { passive: true });
    img.addEventListener('pointerleave', function () {
      img.style.transform = '';
      img.classList.remove('ola-tilt');
    }, { passive: true });
  }

  function enable(img) {
    if (img.classList.contains('ola-art')) return;
    img.classList.add('ola-art');
    if (io) io.observe(img); else img.classList.add('ola-on');
    tilt(img);
  }

  function consider(img) {
    if (!eligible(img)) return;
    if (seen) seen.add(img);
    if (ro) ro.observe(img); else enable(img);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.tagName === 'IMG') consider(root);
    var list = root.querySelectorAll('img');
    for (var i = 0; i < list.length; i++) consider(list[i]);
  }

  function boot() {
    css();
    scan(document);
    if ('MutationObserver' in window) {
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          for (var i = 0; i < m.addedNodes.length; i++) {
            if (m.addedNodes[i].nodeType === 1) scan(m.addedNodes[i]);
          }
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  window.OmegaLivingArt = { scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
