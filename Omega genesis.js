/* ============================================================================
   SYD OMEGA 91717 -- GENESIS VISUAL ENGINE
   One global layer that makes every page ALIVE: a slow rotating sovereign
   armillary, a drifting particle atmosphere, a Fire/Aries core that breathes,
   a cinematic void-reveal on load, and depth-glass on panels. Loaded once
   (via bg.js) so all 75 pages come alive together. Pure ASCII. No emoji.
   Performance-guarded (capped particles, rAF, pauses when tab hidden) and
   fully reduced-motion safe.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaGenesis) return;
  window.__omegaGenesis = 1;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GOLD  = '201,168,76';
  var SOLAR = '226,200,109';
  var CYAN  = '0,229,255';
  var FIRE  = '139,0,0';

  /* ---- 1. cinematic CSS: depth-glass, breathing borders, hover lift ------ */
  var css = [
    '@keyframes omgBreath{0%,100%{box-shadow:0 0 0 1px rgba(' + GOLD + ',.05),0 0 22px -8px rgba(' + GOLD + ',.10)}50%{box-shadow:0 0 0 1px rgba(' + GOLD + ',.14),0 0 34px -6px rgba(' + SOLAR + ',.22)}}',
    // depth-glass on the common panel classes used across the platform
    '.card,.panel,.tier,.node,.sb,.metric,.box,.glass,.tile,.mod,.qa,.krow,.stat{' +
      'backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);' +
      'transition:transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .4s ease,border-color .3s ease}',
    // a slow sovereign breath on framed cards
    '.card,.tier,.node,.tile,.mod{animation:omgBreath 7s ease-in-out infinite}',
    // interactive lift -- the platform feels responsive/alive under the hand
    '.card:hover,.tier:hover,.node:hover,.tile:hover,.mod:hover,.qa:hover{' +
      'transform:translateY(-3px) scale(1.006)}',
    // the atmosphere canvas sits behind content
    '#omega-atmosphere{position:fixed;inset:0;z-index:0;pointer-events:none}',
    // keep real content above the atmosphere
    '.shell,.main,main,header,nav,footer,.side,.topbar,.head{position:relative;z-index:1}'
  ].join('');
  var style = document.createElement('style');
  style.id = 'omega-genesis-css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  /* ---- 2. cinematic void-reveal on load (safe: fails to nothing) --------- */
  function reveal() {
    var v = document.createElement('div');
    v.style.cssText = 'position:fixed;inset:0;z-index:9998;background:radial-gradient(ellipse at 50% 40%,#0d0d16,#020206 70%);pointer-events:none;transition:opacity 1.1s ease';
    document.body.appendChild(v);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        v.style.opacity = '0';
        setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 1200);
      });
    });
  }

  /* ---- 3. living atmosphere (armillary + particles + breathing core) ----- */
  function atmosphere() {
    if (document.getElementById('omega-atmosphere')) return;
    var c = document.createElement('canvas');
    c.id = 'omega-atmosphere';
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W, H;
    function size() {
      W = c.width = Math.floor(innerWidth * DPR);
      H = c.height = Math.floor(innerHeight * DPR);
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
    }
    size();
    addEventListener('resize', size);

    // particle field -- density scaled to screen, capped for performance
    var N = Math.max(28, Math.min(96, Math.floor(innerWidth * innerHeight / 15000)));
    var P = [];
    for (var i = 0; i < N; i++) {
      var pick = Math.random();
      P.push({
        x: Math.random() * W, y: Math.random() * H,
        r: (Math.random() * 1.5 + 0.4) * DPR,
        vx: (Math.random() - 0.5) * 0.11 * DPR,
        vy: (Math.random() - 0.5) * 0.11 * DPR,
        ph: Math.random() * 6.2832,
        col: pick < 0.66 ? GOLD : (pick < 0.85 ? CYAN : SOLAR)
      });
    }

    var t = 0, hidden = false;
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; });

    function frame() {
      if (!hidden) {
        ctx.clearRect(0, 0, W, H);
        var cx = W * 0.5, cy = H * 0.4;
        var base = Math.min(W, H) * 0.36;

        // rotating sovereign armillary -- concentric tilted rings
        ctx.save();
        ctx.translate(cx, cy);
        for (var k = 0; k < 4; k++) {
          var rot = t * (0.00018 + k * 0.00007) * (k % 2 ? 1 : -1);
          ctx.save();
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, base * (0.5 + k * 0.17), base * (0.18 + k * 0.15), k * 0.5, 0, 6.2832);
          ctx.strokeStyle = 'rgba(' + (k % 2 ? CYAN : GOLD) + ',' + (0.05 + 0.02 * Math.sin(t * 0.001 + k)).toFixed(3) + ')';
          ctx.lineWidth = 1 * DPR;
          ctx.stroke();
          ctx.restore();
        }
        // Fire/Aries core -- a breathing gold-crimson glow at the centre
        var pulse = 0.06 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.0016));
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, base * 0.55);
        g.addColorStop(0, 'rgba(' + SOLAR + ',' + pulse.toFixed(3) + ')');
        g.addColorStop(0.5, 'rgba(' + FIRE + ',' + (pulse * 0.4).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + FIRE + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, base * 0.55, 0, 6.2832);
        ctx.fill();
        ctx.restore();

        // drifting, twinkling particles
        for (var j = 0; j < P.length; j++) {
          var p = P[j];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
          var tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.002 + p.ph));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(' + p.col + ',' + (0.5 * tw).toFixed(3) + ')';
          ctx.fill();
        }
      }
      t += 16;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---- 4. boot ---------------------------------------------------------- */
  function boot() {
    reveal();
    if (!REDUCED) atmosphere();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
