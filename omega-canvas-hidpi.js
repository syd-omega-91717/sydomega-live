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
    var before = canvas.offsetWidth;
    canvas.width = Math.max(1, Math.round(cssW * d));
    canvas.height = Math.max(1, Math.round(cssH * d));
    /* A canvas with no CSS width is laid out at its own backing-store size, so the larger store would also be a larger
       box on screen (and the next call, measuring that box, would grow it again).  Pin the CSS size when the store
       changed the box, or, for a canvas that is not displayed yet, when its CSS width is still 'auto'. */
    var pin = !!(opts && opts.size) || canvas.__ocPin === true;   /* once pinned, always re-pin: a later call with a new size would otherwise see an unchanged box and leave the old CSS size */
    if (!pin && d > 1) {
      if (before > 0) pin = canvas.offsetWidth !== before;
      else { try { pin = window.getComputedStyle(canvas).width === 'auto'; } catch (e) { pin = false; } }
    }
    if (pin) {
      canvas.__ocPin = true;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    canvas.__ocW = cssW;
    canvas.__ocH = cssH;
    return ctx;
  }

  /* The common chart shape:  c.width = c.offsetWidth || 600;  with the height set by an attribute or by a literal.
     The logical height of an attribute-sized canvas is remembered on the first call, because after fit() the attribute
     holds the larger backing-store height and a second call would otherwise read it back as the CSS height. */
  function fitWidth(canvas, fallbackW, cssH, opts) {
    if (cssH == null) {
      if (canvas.__ocH == null) canvas.__ocH = canvas.height;
      cssH = canvas.__ocH;
    }
    var w = (opts && opts.client ? canvas.clientWidth : canvas.offsetWidth) || fallbackW;
    return fit(canvas, w, cssH, opts);
  }

  /* CSS-pixel size of the last fit(): what drawing code should use for W and H in place of canvas.width/height. */
  function size(canvas) {
    return { w: canvas.__ocW || canvas.width, h: canvas.__ocH || canvas.height };
  }

  window.OmegaCanvas = { ratio: ratio, fit: fit, fitWidth: fitWidth, size: size };
})();
