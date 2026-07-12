/* ============================================================================
   SYD OMEGA 91717 -- 9D ENGINE (completes the nine visual passes)
   Adds the four passes not yet live:
     (1) PARALLAX DEPTH   -- layers shift with pointer/scroll for real depth
     (4) HOLOGRAPHIC GLOW -- shader-like moving sheen on titles + emblems
     (6) CINEMATIC TRANSITIONS -- fade-through-void on every page navigation
     (8) REACTIVE AMBIENT AUDIO -- subtle tones on interaction (respects sound)
   (armillary, particles, glass, breathing motion, element-tint already live.)
   Global via bg.js. Reduced-motion + sound-preference safe. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omega9D) return;
  window.__omega9D = 1;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- (4) holographic glow + transition styles ---- */
  var css = [
    '@keyframes om9holo{0%{background-position:0% 50%}100%{background-position:300% 50%}}',
    '.om9-holo{background:linear-gradient(100deg,#C9A84C 0%,#E2C86D 20%,#00E5FF 40%,#E2C86D 60%,#C9A84C 80%,#E2C86D 100%);background-size:300% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:om9holo 8s linear infinite}',
    '#om9-veil{position:fixed;inset:0;z-index:9997;background:radial-gradient(ellipse at 50% 40%,#0d0d16,#020206 70%);opacity:0;pointer-events:none;transition:opacity .5s ease}',
    '#om9-veil.on{opacity:1;pointer-events:all}',
    '#omega-atmosphere{will-change:transform}'
  ].join('');
  var st = document.createElement('style'); st.id = 'om9-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* ---- (1) PARALLAX DEPTH ---- */
  function parallax() {
    if (REDUCED) return;
    var atmo = document.getElementById('omega-atmosphere');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      if (atmo) atmo.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px) scale(1.06)';
      raf = requestAnimationFrame(loop);
    }
    addEventListener('mousemove', function (e) {
      tx = (e.clientX / innerWidth - 0.5) * 26;
      ty = (e.clientY / innerHeight - 0.5) * 26;
    }, { passive: true });
    addEventListener('scroll', function () {
      ty = -(scrollY % 400) / 400 * 14;
    }, { passive: true });
    loop();
  }

  /* ---- (4) apply holographic sheen to hero titles + sigils ---- */
  function holo() {
    if (REDUCED) return;
    var sel = '.brand, .topbar .t, .hero .cur, #cur-grade, #cur-name, .gate .g';
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.__holo && el.textContent.trim()) { el.__holo = 1; el.classList.add('om9-holo'); }
    });
  }

  /* ---- (6) CINEMATIC TRANSITIONS: fade through the void on navigation ---- */
  function transitions() {
    if (REDUCED) return;
    var veil = document.createElement('div'); veil.id = 'om9-veil';
    document.body.appendChild(veil);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href[0] === '#' || a.target === '_blank' || href.indexOf('http') === 0 || href.indexOf('mailto') === 0) return;
      if (a.hasAttribute('data-no-transition')) return;
      e.preventDefault();
      veil.classList.add('on');
      setTimeout(function () { location.href = href; }, 480);
    }, true);
  }

  /* ---- (8) REACTIVE AMBIENT AUDIO: subtle tones on interaction ---- */
  function audio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var ctx = null;
    function on() { try { return localStorage.getItem('omega_sound') !== 'off'; } catch (e) { return true; } }
    function tone(freq, dur, vol) {
      if (!on()) return;
      try {
        if (!ctx) ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.value = 0; o.connect(g); g.connect(ctx.destination);
        var t = ctx.currentTime;
        g.gain.linearRampToValueAtTime(vol || 0.04, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.18));
        o.start(t); o.stop(t + (dur || 0.18));
      } catch (e) {}
    }
    // a soft 9.17-tuned chime on primary actions
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('button, .btn, a.card, .om-card, .osh-b');
      if (t) tone(458.5, 0.16, 0.035); // ~9.17 x 50
    }, true);
    window.addEventListener('omega-sound', function (ev) { if (ev.detail && ev.detail.on) tone(550.2, 0.22, 0.045); });
  }

  function boot() {
    parallax(); holo(); transitions(); audio();
    try { new MutationObserver(function () { holo(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
