/* ============================================================================
   SYD OMEGA 91717 -- HI-DPI CANVAS (charts drawn at the screen's real resolution)

   A chart written as  canvas.width = W; canvas.height = H  has one backing pixel
   per CSS pixel, so on a phone or retina display (2x to 3x) the browser stretches
   it and every line and every letter is soft.  Measured 2026-11-23: 72 of the 91
   files that draw on a 2-D canvas never mention devicePixelRatio.

   OmegaCanvas.fit(canvas, cssW, cssH [, {size:true}]) sets the backing store to
   cssW*ratio by cssH*ratio and applies a scale transform, so the caller keeps
   drawing in CSS pixels exactly as before and gets the context back.  It does not
   change the displayed size when the canvas is already sized by CSS (width:100% or
   max-width) because both attributes grow together and the aspect ratio is
   unchanged; for a canvas with no CSS size pass {size:true} and it is pinned to
   cssW x cssH so it does not double on screen.

   The ratio is capped at 3: a 4x backing store costs 16x the memory for a
   difference nobody can see.  A caller that redraws on every call gets a fresh
   transform each time (setTransform, never scale()), so nothing compounds.
   Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaCanvas) return;

  function ratio() {
    var d = +window.devicePixelRatio || 1;
    return Math.max(1, Math.min(d, 3));
  }

  function fit(canvas, cssW, cssH, opts) {
    var d = ratio();
    canvas.width = Math.max(1, Math.round(cssW * d));
    canvas.height = Math.max(1, Math.round(cssH * d));
    if (opts && opts.size) {
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return ctx;
  }

  window.OmegaCanvas = { ratio: ratio, fit: fit };
})();
