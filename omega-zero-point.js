/* ============================================================================
   SYD OMEGA 91717 -- ZERO-POINT AWAKENING (first-visit intro)
   Upgrades the existing #omega-genesis overlay that bg.js shows once per browser.
   Sequence (4.6 s, all procedural -- no image, video or audio asset, so there is
   no media-rights record to register): pitch black -> a single point of light ->
   the camera pulls back through a 144-spoke field of points and three rings ->
   the Omega resolves and pulses.

   How it joins bg.js (two small hooks, both fail safe):
   - bg.js injects this file only when the intro will actually show (first visit,
     motion not reduced). If the file never arrives the legacy Omega-and-rings
     intro plays exactly as before.
   - bg.js's own 3.1 s timer ends the legacy intro unless `g.__omegaHold` is set;
     this module sets it, then calls `g._omegaDone()` (bg.js's own fade-out) when
     finished. A hard cap guarantees the overlay can never be left stuck.
   Skip: click (bg.js), Escape, Enter or Space. Reduced motion never reaches this
   file (bg.js does not show the intro at all).
   Sound: OFF. A "SOUND" button opts in to a quiet 528 Hz tone; browsers block
   autoplay, so nothing is ever played without that tap. Pure ASCII (glyphs via
   \u escapes). Exposes window.OmegaZeroPoint.render(ms) so a test can sample any
   frame deterministically.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaZeroPoint) return;

  var DUR = 4600, CAP = DUR + 900, SPOKES = 144, RINGS_N = 10;
  var CAPTION = 'THE CODE . THE FREQUENCY . THE LEGACY';
  var cv = null, cx = null, W = 0, H = 0, DPR = 1, raf = 0, t0 = 0, capTimer = 0, finished = false;
  var audio = null, g = null, frozen = false, captionBox = null, lastT = -1;

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, t) { var x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); }
  function easeOut(x) { x = clamp(x); return 1 - Math.pow(1 - x, 4); }

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }

  /* One frame at time t (ms since start). Pure function of t + canvas size. */
  function render(t) {
    if (!cx) return;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = '#05050a'; cx.fillRect(0, 0, W, H);
    var mx = W / 2, my = H * 0.46, R = Math.min(W, H) * 0.42;

    /* 1. a single point of light, from 0.6 s, with a slow breath */
    var lit = smooth(600, 1300, t);
    var breath = 1 + 0.18 * Math.sin(t / 170);
    if (lit > 0) {
      var pr = (10 + 26 * easeOut((t - 600) / 1200)) * breath;
      var gr = cx.createRadialGradient(mx, my, 0, mx, my, pr * 3);
      gr.addColorStop(0, 'rgba(255,244,214,' + (0.95 * lit) + ')');
      gr.addColorStop(0.25, 'rgba(226,200,109,' + (0.6 * lit) + ')');
      gr.addColorStop(1, 'rgba(201,168,76,0)');
      cx.fillStyle = gr; cx.beginPath(); cx.arc(mx, my, pr * 3, 0, 6.2832); cx.fill();
    }

    /* 2. the pull-back: world scale k falls from 8 to 1, so the field arrives from beyond the edges */
    var p = (t - 1300) / 1900;
    var k = 8 - 7 * easeOut(p);
    var fieldA = smooth(1300, 1900, t) * (1 - smooth(3900, 4500, t) * 0.55);
    if (fieldA > 0) {
      var spin = t * 0.00004;
      cx.fillStyle = 'rgba(226,200,109,1)';
      for (var j = 1; j <= RINGS_N; j++) {
        var rr = (j / RINGS_N) * R * k;
        if (rr > Math.hypot(W, H)) break;          /* past the corner: nothing visible, skip the whole ring */
        var a = fieldA * (0.18 + 0.5 * (1 - j / RINGS_N));
        var dot = 0.7 + 1.1 * (1 - j / RINGS_N);
        cx.globalAlpha = a;
        for (var i = 0; i < SPOKES; i++) {
          var ang = (i / SPOKES) * 6.2832 + spin * (j % 2 ? 1 : -1);
          var x = mx + Math.cos(ang) * rr, y = my + Math.sin(ang) * rr;
          if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
          cx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
        }
      }
      cx.globalAlpha = 1;
      cx.lineWidth = 1;
      [0.35, 0.7, 1].forEach(function (f, n) {
        var rr2 = R * f * k;
        cx.strokeStyle = 'rgba(201,168,76,' + (fieldA * (0.32 - n * 0.08)) + ')';
        cx.beginPath(); cx.arc(mx, my, rr2, 0, 6.2832); cx.stroke();
      });
    }

    /* 3. the Omega resolves at the centre and pulses */
    var oa = smooth(2600, 3500, t);
    if (oa > 0) {
      var fs = Math.round(Math.min(W, H) * 0.3 * (1 + 0.03 * Math.sin((t - 3000) / 260)));
      cx.save();
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.font = '900 ' + fs + 'px "Cinzel Decorative", Georgia, serif';
      cx.shadowColor = 'rgba(201,168,76,' + (0.75 * oa) + ')'; cx.shadowBlur = fs * 0.35;
      cx.fillStyle = 'rgba(201,168,76,' + oa + ')';
      cx.fillText('\u03A9', mx, my);
      cx.restore();
    }

    /* 4. caption */
    var ca = smooth(3400, 4000, t);
    if (ca > 0) {
      cx.save();
      cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      /* fit to the viewport: shrink letter-spacing, then the font, until the line has 16 px of margin each side.
         (At 12 px / 6 px spacing it is ~400 px wide, wider than a 375 px phone, and canvas text clips silently.) */
      var fsz = 12, sp = 6, wdt;
      for (;;) {
        cx.font = fsz + 'px "Courier Prime", monospace';
        if ('letterSpacing' in cx) cx.letterSpacing = sp + 'px';
        wdt = cx.measureText(CAPTION).width;
        if (wdt <= W - 32 || (fsz <= 9 && sp <= 1)) break;
        if (sp > 1) sp -= 1; else fsz -= 1;
      }
      var cy = Math.min(H - 40, my + R * 0.62);
      cx.fillStyle = 'rgba(133,131,123,' + ca + ')';
      cx.fillText(CAPTION, mx, cy);
      captionBox = { left: mx - wdt / 2, right: mx + wdt / 2, fontPx: fsz, spacing: sp };
      cx.restore();
    }
  }

  function stopAudio() {
    if (!audio) return;
    try {
      var now = audio.ctx.currentTime;
      audio.gain.gain.cancelScheduledValues(now);
      audio.gain.gain.setTargetAtTime(0, now, 0.08);
      var c = audio.ctx; setTimeout(function () { try { c.close(); } catch (e) { } }, 600);
    } catch (e) { }
    audio = null;
  }

  function finish() {
    if (finished) return; finished = true;
    if (raf) cancelAnimationFrame(raf);
    if (capTimer) clearTimeout(capTimer);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    stopAudio();
    if (g && typeof g._omegaDone === 'function') g._omegaDone();
    else if (g && g.parentNode) g.parentNode.removeChild(g);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); }
  }
  function onResize() { size(); render(performance.now() - t0); }

  function toggleSound(btn) {
    if (audio) { stopAudio(); btn.textContent = 'SOUND OFF'; btn.setAttribute('aria-pressed', 'false'); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var ctx = new AC(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 528;
      gain.gain.value = 0; osc.connect(gain); gain.connect(ctx.destination); osc.start();
      gain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.6);   /* a quiet swell, never a jolt */
      audio = { ctx: ctx, gain: gain };
      btn.textContent = 'SOUND ON'; btn.setAttribute('aria-pressed', 'true');
    } catch (e) { audio = null; }
  }

  function loop(now) {
    if (finished) return;
    if (frozen) { raf = requestAnimationFrame(loop); return; }   /* paused: hold the frame; Escape/Enter/Space/click still end it */
    var t = now - t0;
    render(t); lastT = t;
    if (t >= DUR) { finish(); return; }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    g = document.getElementById('omega-genesis');
    if (!g || g.__omegaHold) return;                 /* intro already gone (module arrived late) or already upgraded */
    g.__omegaHold = true;
    Array.prototype.forEach.call(g.querySelectorAll('.gr,.gx,.gt'), function (n) { n.style.display = 'none'; });
    g.setAttribute('role', 'img'); g.setAttribute('aria-label', 'SYD OMEGA 91717 - intro. Press Escape to skip.');
    cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    g.insertBefore(cv, g.firstChild);
    cx = cv.getContext('2d');
    size(); t0 = performance.now(); render(0);
    /* ask for the display face now so the Omega is not drawn in a fallback font when it resolves at 2.6 s */
    try { if (document.fonts && document.fonts.load) document.fonts.load('900 64px "Cinzel Decorative"', '\u03A9').catch(function () { }); } catch (e) { }

    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'SOUND OFF'; btn.setAttribute('aria-pressed', 'false');
    btn.style.cssText = 'position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));' +
      'background:none;border:1px solid rgba(201,168,76,.35);color:#85837b;font:11px "Courier Prime",monospace;letter-spacing:3px;' +
      'padding:10px 14px;min-height:44px;cursor:pointer';
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggleSound(btn); });
    g.appendChild(btn);

    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    capTimer = setTimeout(finish, CAP);              /* a hidden tab pauses rAF: this still guarantees the overlay is removed */
    raf = requestAnimationFrame(loop);
  }

  window.OmegaZeroPoint = {
    duration: DUR,
    /* test hook: size the overlay canvas and draw the frame at `ms` */
    render: function (ms) { if (cx) { size(); render(ms); } return !!cx; },
    /* test hook: hold the intro on its current frame (no drawing, no timed ending, cap timer cleared) so a check does not race the 4.6 s
       clock on a slow machine. Skip keys and click still end it, so a visitor can never be stuck behind a paused intro. */
    pause: function () { if (!cx || finished) return false; frozen = true; if (capTimer) { clearTimeout(capTimer); capTimer = 0; } return true; },
    active: function () { return !!cx && !finished; },
    /* animation time (ms) of the last frame the live loop drew; < duration proves the intro ended early, whatever the machine speed */
    lastFrame: function () { return lastT; },
    caption: function () { return captionBox && { left: captionBox.left, right: captionBox.right, width: W, fontPx: captionBox.fontPx, spacing: captionBox.spacing }; }
  };

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
