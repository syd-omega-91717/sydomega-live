/* ============================================================================
   SYD OMEGA 91717 -- GENESIS VISUAL ENGINE v2
   PER-ELEMENT ATMOSPHERE + LIVING ZODIAC CORE.
   The whole platform breathes in the MEMBER'S own element -- Fire burns
   crimson-gold, Water ripples blue, Wind glows teal, Metal shimmers steel,
   Sand warms amber -- and the member's zodiac sign glows as the rotating core.
   Reads the member's cosmology from their profile and re-themes live. Global
   (via bg.js), no per-page edits, reduced-motion safe, pure ASCII (glyphs via
   \u escapes). Falls back to the Sovereign gold/cyan palette + Omega core.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaGenesis) return;
  window.__omegaGenesis = 1;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PAL = {
    FIRE:      { ring: '201,168,76',  accent: '139,0,0',    core: '226,200,109', p: ['201,168,76', '139,0,0', '226,200,109'] },
    WATER:     { ring: '0,229,255',   accent: '40,110,210',  core: '120,210,255', p: ['0,229,255', '40,110,210', '160,230,255'] },
    WIND:      { ring: '120,220,205', accent: '210,240,255', core: '180,235,225', p: ['120,220,205', '210,240,255', '150,225,215'] },
    METAL:     { ring: '200,205,214', accent: '120,140,162', core: '222,228,236', p: ['200,205,214', '150,165,185', '230,235,242'] },
    SAND:      { ring: '217,184,106', accent: '201,168,76',  core: '232,206,150', p: ['217,184,106', '201,168,76', '232,206,150'] },
    SOUL:      { ring: '155,107,240', accent: '90,60,180',   core: '190,160,250', p: ['155,107,240', '120,80,210', '200,175,250'] },
    SPACE:     { ring: '90,120,230',  accent: '50,60,160',   core: '150,175,255', p: ['90,120,230', '60,80,190', '170,190,255'] },
    VOID:      { ring: '139,0,0',     accent: '40,0,10',     core: '180,50,50',   p: ['139,0,0', '90,10,20', '180,60,60'] },
    SOVEREIGN: { ring: '201,168,76',  accent: '0,229,255',   core: '226,200,109', p: ['201,168,76', '0,229,255', '226,200,109'] }
  };
  var SIGN_ELEMENT = {
    Aries: 'FIRE', Leo: 'FIRE', Sagittarius: 'FIRE',
    Cancer: 'WATER', Scorpio: 'WATER', Pisces: 'WATER',
    Gemini: 'WIND', Libra: 'WIND', Aquarius: 'WIND',
    Taurus: 'METAL', Capricorn: 'METAL', Virgo: 'SAND'
  };
  var SIGN_GLYPH = {
    Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
    Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
    Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653'
  };

  var STATE = { pal: PAL.SOVEREIGN, glyph: '\u03A9' };

  var css = [
    '@keyframes omgBreath{0%,100%{box-shadow:0 0 0 1px rgba(201,168,76,.04),0 0 16px -8px rgba(201,168,76,.07)}50%{box-shadow:0 0 0 1px rgba(201,168,76,.09),0 0 24px -6px rgba(226,200,109,.14)}}',
    '.card,.panel,.tier,.node,.sb,.metric,.box,.glass,.tile,.mod,.qa,.krow,.stat{backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);transition:transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .4s ease,border-color .3s ease}',
    '.card,.tier,.node,.tile,.mod{animation:omgBreath 11s ease-in-out infinite}',
    '.card:hover,.tier:hover,.node:hover,.tile:hover,.mod:hover,.qa:hover{transform:translateY(-3px) scale(1.006)}',
    '#omega-atmosphere{position:fixed;inset:0;z-index:0;pointer-events:none}',
    '.shell,.main,main,header,nav,footer,.side,.topbar,.head{position:relative;z-index:1}'
  ].join('');
  var style = document.createElement('style');
  style.id = 'omega-genesis-css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  /* Desynchronize the breathing glow across many simultaneous cards -- without
     this, every .card/.tier/.node/.tile/.mod on a content-dense page (e.g. a
     144-card grid) pulses in perfect unison, which reads as a flash/strobe
     rather than a calm ambient effect. A small random delay per element fixes
     that cheaply, re-applied whenever new cards get added to the page. */
  function destagger() {
    if (REDUCED) return;
    document.querySelectorAll('.card,.tier,.node,.tile,.mod').forEach(function (el) {
      if (el.__omgStaggered) return;
      el.__omgStaggered = 1;
      el.style.animationDelay = (Math.random() * 11).toFixed(2) + 's';
    });
  }

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

    var N = Math.max(46, Math.min(150, Math.floor(innerWidth * innerHeight / 10000)));
    var P = [];
    for (var i = 0; i < N; i++) {
      P.push({
        x: Math.random() * W, y: Math.random() * H,
        r: (Math.random() * 1.5 + 0.4) * DPR,
        vx: (Math.random() - 0.5) * 0.11 * DPR,
        vy: (Math.random() - 0.5) * 0.11 * DPR,
        ph: Math.random() * 6.2832,
        ci: Math.floor(Math.random() * 3)
      });
    }

    var t = 0, hidden = false;
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; });

    function frame() {
      if (!hidden) {
        var pal = STATE.pal;
        ctx.clearRect(0, 0, W, H);
        var cx = W * 0.5, cy = H * 0.4, base = Math.min(W, H) * 0.36;

        ctx.save();
        ctx.translate(cx, cy);
        for (var k = 0; k < 6; k++) {
          var rot = t * (0.00018 + k * 0.00007) * (k % 2 ? 1 : -1);
          ctx.save();
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, base * (0.5 + k * 0.17), base * (0.18 + k * 0.15), k * 0.5, 0, 6.2832);
          ctx.strokeStyle = 'rgba(' + (k % 2 ? pal.accent : pal.ring) + ',' + (0.075 + 0.03 * Math.sin(t * 0.001 + k)).toFixed(3) + ')';
          ctx.lineWidth = 1 * DPR;
          ctx.stroke();
          ctx.restore();
        }
        var pulse = 0.085 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.0016));
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, base * 0.55);
        g.addColorStop(0, 'rgba(' + pal.core + ',' + pulse.toFixed(3) + ')');
        g.addColorStop(0.5, 'rgba(' + pal.accent + ',' + (pulse * 0.4).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + pal.accent + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, base * 0.55, 0, 6.2832);
        ctx.fill();
        ctx.rotate(-t * 0.00012);
        ctx.font = (base * 0.34).toFixed(0) + 'px "Cinzel Decorative", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.10 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.0016));
        ctx.fillStyle = 'rgba(' + pal.core + ',1)';
        ctx.fillText(STATE.glyph, 0, 0);
        ctx.globalAlpha = 1;
        ctx.restore();

        for (var j = 0; j < P.length; j++) {
          var p = P[j];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
          var tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.002 + p.ph));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(' + pal.p[p.ci] + ',' + (0.5 * tw).toFixed(3) + ')';
          ctx.fill();
        }
      }
      t += 16;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function detect() {
    try {
      (window.OmegaSB?window.OmegaSB.get():import('https://esm.sh/@supabase/supabase-js@2').then(function(m){return m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');})).then(function (sb) {
        sb.auth.getSession().then(function (r) {
          var s = r && r.data && r.data.session;
          if (!s) return;
          sb.from('profiles').select('sign,element').eq('id', s.user.id).maybeSingle().then(function (res) {
            var d = res && res.data;
            if (!d) return;
            var el = (d.element || SIGN_ELEMENT[d.sign] || '').toString().toUpperCase();
            if (PAL[el]) STATE.pal = PAL[el];
            if (d.sign && SIGN_GLYPH[d.sign]) STATE.glyph = SIGN_GLYPH[d.sign];
          }).catch(function () {});
        }).catch(function () {});
      }).catch(function () {});
    } catch (e) {}
  }

  function boot() {
    reveal();
    detect();
    if (!REDUCED) {
      atmosphere();
      destagger();
      try { new MutationObserver(destagger).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
