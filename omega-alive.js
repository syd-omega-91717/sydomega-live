/* ============================================================================
   SYD OMEGA 91717 — ALIVE
   Every emblem turns, every mark breathes: on every page, and on marks that
   arrive after load too.

   Why this exists. Motion was applied once: bg.js step 8 adds .omega-spin-slow
   to whatever sigils exist at that moment, so anything drawn later (the nav
   rail's emblems, the galaxy core, emblem images, cards rendered from data)
   stayed a still picture. The owner's words, 2026-09-26: "make every solid
   image in the platform emblem and rotative and more alive".

   Two motions, both from the brand's own vocabulary:
     turn    -- round marks (emblem and sigil SVGs, emblem images) make a full
                slow turn, the pace of .omega-spin-slow / .oid-sigil (60-96s).
                Anything faster reads as a loading spinner.
     breathe -- single-glyph icons (the nav rail, alert and tile glyphs)
                swell and glow a little, staggered so they never pulse in step;
                on hover the glyph makes one quick turn.

   It animates the individual `rotate` and `scale` properties, never
   `transform`. Pages and other layers already own `transform` on these marks
   (nav.js scales .on-glyph on hover, omega-spatial-system.css tilts sigils),
   and an animation beats a declaration (CLAUDE.md 4.1): a transform keyframe
   would silently erase every one of them. `rotate`/`scale` compose on top.

   What it never touches: anything already animated (its computed
   animation-name is not none), controls and form fields, charts and canvases,
   text longer than one symbol, and big pictures (photos are content, not
   marks). Off-screen marks are paused (IntersectionObserver), and
   prefers-reduced-motion stops everything in CSS.

   Loaded on every page by bg.js (guard: data-omega-alive).
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaAlive) return;

  var MAX = 400;
  var TURN_SEL = [
    '[data-omega-emblem] svg', '.emblem-icon > svg', '[data-page-emblem] svg',
    '[data-alive-turn]', '.omega-emblem', 'svg[class*="sigil"]', 'svg[class*="emblem"]',
    '.odk-tile > svg', '.oid-mark svg', 'img[src*="emblem"]', 'img[src*="sigil"]', 'img[src*="crest"]', 'img[src*="seal"]'
  ].join(',');
  var GLYPH_SEL = [
    '[data-alive-mark]', '.on-glyph', '.alert-icon', '.odk-glyph', '.page-emblem',
    '[class*="glyph"]', '[class*="-icon"]:not(svg)', '[class*="emblem-mark"]'
  ].join(',');
  var NEVER = 'button:not(.on-icon),input,select,textarea,canvas,[contenteditable],' +
    '[data-no-alive],[class*="chart"],[class*="spark"],#omega-side .on-lbl,' +
    /* the nav's hover menus: ~258 emblems, hidden until hovered */
    '.on-tip';

  function injectStyle() {
    if (document.getElementById('omega-alive-css')) return;
    var st = document.createElement('style');
    st.id = 'omega-alive-css';
    st.textContent =
      '@keyframes omega-alive-turn{to{rotate:360deg}}' +
      '@keyframes omega-alive-breathe{0%,100%{scale:1;text-shadow:0 0 0 transparent}' +
        '50%{scale:1.1;text-shadow:0 0 12px currentColor}}' +
      '.omega-alive-turn{animation:omega-alive-turn var(--alive-turn,90s) linear infinite;' +
        'transform-box:fill-box;transform-origin:50% 50%}' +
      '.omega-alive-breathe{animation:omega-alive-breathe 5.6s ease-in-out infinite;' +
        'animation-delay:var(--alive-delay,0s);transition:rotate .9s cubic-bezier(.2,.8,.2,1)}' +
      ':hover>.omega-alive-breathe,.omega-alive-breathe:hover{rotate:360deg}' +
      /* --alive-base carries the element's own filter so the glow adds to it:
         omega-visual-evolution.css gives every canvas contrast/saturate. */
      '@keyframes omega-alive-glow{0%,100%{filter:var(--alive-base) drop-shadow(0 0 0 transparent)}' +
        '50%{filter:var(--alive-base) drop-shadow(0 0 14px var(--page-accent-glow,rgba(201,168,76,.4)))}}' +
      '.omega-alive-glow{animation:omega-alive-glow 7s ease-in-out infinite;animation-delay:var(--alive-delay,0s)}' +
      '[data-alive-off]{animation-play-state:paused!important}' +
      '@media (prefers-reduced-motion:reduce){.omega-alive-turn,.omega-alive-breathe,.omega-alive-glow{animation:none!important;transition:none!important}' +
        ':hover>.omega-alive-breathe,.omega-alive-breathe:hover{rotate:none}}';
    (document.head || document.documentElement).appendChild(st);
  }

  var count = 0;
  var io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.removeAttribute('data-alive-off');
          else e.target.setAttribute('data-alive-off', '');
        });
      })
    : null;

  function busy(el) {
    var a = getComputedStyle(el).animationName;
    return a && a !== 'none';
  }

  /* A stable per-element offset so neighbours never breathe in step. */
  function delayFor(el, i) {
    var s = (el.textContent || '') + i;
    var h = 0;
    for (var k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0;
    return (Math.abs(h) % 5600) / 1000;
  }

  function mark(el, cls, i) {
    el.setAttribute('data-alive', cls === 'omega-alive-turn' ? 'turn' : 'breathe');
    el.classList.add(cls);
    if (cls === 'omega-alive-breathe') {
      el.style.setProperty('--alive-delay', '-' + delayFor(el, i) + 's');
      /* scale and rotate do nothing on an inline box; lift only those. */
      if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    }
    else el.style.setProperty('--alive-turn', (72 + (i % 5) * 12) + 's');
    if (io) io.observe(el);
    count++;
  }

  function eligible(el) {
    if (el.hasAttribute('data-alive')) return false;
    if (el.closest(NEVER)) { el.setAttribute('data-alive', 'skip'); return false; }
    return true;
  }

  function scan() {
    if (count >= MAX) return;
    var turns = document.querySelectorAll(TURN_SEL);
    for (var i = 0; i < turns.length && count < MAX; i++) {
      var t = turns[i];
      if (!eligible(t)) continue;
      var r = t.getBoundingClientRect();
      if (!r.width || !r.height) continue;                 /* not rendered yet: next pass */
      /* A mark, not a picture: roughly square and at most 260px. */
      if (r.width > 260 || r.height > 260 || r.width / r.height > 1.4 || r.height / r.width > 1.4 || busy(t)) {
        t.setAttribute('data-alive', 'skip'); continue;
      }
      mark(t, 'omega-alive-turn', i);
    }
    var glyphs = document.querySelectorAll(GLYPH_SEL);
    for (var j = 0; j < glyphs.length && count < MAX; j++) {
      var g = glyphs[j];
      if (!eligible(g)) continue;
      if (g.children.length || g.querySelector('svg,img')) { g.setAttribute('data-alive', 'skip'); continue; }
      var txt = (g.textContent || '').trim();
      /* One symbol (a surrogate pair or a combining mark counts as one). */
      if (!txt || Array.from(txt).length > 2 || /[A-Za-z0-9]{2}/.test(txt)) { g.setAttribute('data-alive', 'skip'); continue; }
      var gr = g.getBoundingClientRect();
      if (!gr.width || !gr.height) continue;
      if (busy(g)) { g.setAttribute('data-alive', 'skip'); continue; }
      mark(g, 'omega-alive-breathe', j);
    }
  }

  /* STILL PICTURES. A scan of all 205 pages (2026-09-27) found ~30 canvases
     and SVG diagrams whose pixels never changed: network maps, rings, radars,
     charts. They get a slow breathing glow in the page's accent colour. They
     never turn: a canvas draws its own numbers and labels, and a turning
     chart cannot be read. "Still" is measured, not guessed: each canvas is
     sampled into a 12x12 thumbnail twice, 2.5s apart, and only an identical
     pair counts, so a canvas that already animates itself is left alone.
     An SVG diagram with no running animation and no text inside, roughly
     square, turns as well (an emblem); one with text only glows. */
  var probe = null;
  function thumb(c) {
    try {
      probe = probe || document.createElement('canvas');
      probe.width = probe.height = 12;
      var p = probe.getContext('2d');
      p.clearRect(0, 0, 12, 12);
      p.drawImage(c, 0, 0, 12, 12);
      return Array.prototype.join.call(p.getImageData(0, 0, 12, 12).data, ',');
    } catch (e) { return null; }                 /* tainted or zero-size: skip */
  }
  function big(el) {
    var r = el.getBoundingClientRect();
    return r.width >= 90 && r.height >= 90 && r.width && r.height ? r : null;
  }
  function glow(el, i) {
    if (el.hasAttribute('data-alive')) return;
    var f = getComputedStyle(el).filter;
    if (busy(el) || /drop-shadow/.test(f || '')) { el.setAttribute('data-alive', 'skip'); return; }
    el.style.setProperty('--alive-base', f && f !== 'none' ? f : ' ');
    el.setAttribute('data-alive', 'glow');
    el.classList.add('omega-alive-glow');
    el.style.setProperty('--alive-delay', '-' + ((i * 1.7) % 7).toFixed(1) + 's');
    if (io) io.observe(el);
    count++;
  }
  function stillPass() {
    var cands = [];
    document.querySelectorAll('canvas').forEach(function (c) {
      if (c.hasAttribute('data-alive') || c.closest('script,#omega-side,[data-no-alive]') || !big(c)) return;
      cands.push({ el: c, a: thumb(c) });
    });
    setTimeout(function () {
      cands.forEach(function (x, i) {
        if (x.a === null || count >= MAX) return;
        if (thumb(x.el) === x.a) glow(x.el, i);
      });
    }, 2500);
    var anim = typeof document.getAnimations === 'function' ? document.getAnimations() : [];
    var targets = anim.map(function (a) { return a.effect && a.effect.target; }).filter(Boolean);
    document.querySelectorAll('svg').forEach(function (svg, i) {
      if (count >= MAX || svg.hasAttribute('data-alive') || svg.parentElement.closest('svg')) return;
      if (svg.closest('#omega-side,.on-tip,button,[data-no-alive]')) return;
      var r = big(svg); if (!r) return;
      if (svg.querySelector('animate,animateTransform,animateMotion')) return;
      for (var k = 0; k < targets.length; k++) {
        var t = targets[k];
        if (t === svg || svg.contains(t) || (t.contains && t.contains(svg))) return;
      }
      if (r.width > 1000 && r.height > 600) return;   /* full-screen overlays */
      var square = r.width / r.height < 1.3 && r.height / r.width < 1.3;
      if (square && r.width <= 260 && !svg.querySelector('text')) mark(svg, 'omega-alive-turn', i);
      else glow(svg, i);
    });
  }

  var pending = 0;
  function schedule() {
    if (pending) return;
    pending = setTimeout(function () { pending = 0; scan(); }, 400);
  }

  function boot() {
    injectStyle();
    scan();
    /* Pictures draw after data arrives; give them time, then look once more
       later for anything rendered by a slow page. */
    setTimeout(stillPass, 3000);
    setTimeout(stillPass, 9000);
    if (typeof MutationObserver === 'function') {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes.length) { schedule(); return; }
        }
      }).observe(document.body, { childList: true, subtree: true });
      /* The approval guard reveals the page with a class on <body>; marks
         measured before it were 0x0 and were left for this pass. */
      new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  window.OmegaAlive = { scan: scan, count: function () { return count; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
