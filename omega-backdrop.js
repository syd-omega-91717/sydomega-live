/* ============================================================================
   SYD OMEGA 91717 -- SOVEREIGN BACKDROP
   Replaces flat pure-black with a WARMER, richer deep base -- tinted to the
   MEMBER'S element (from their horoscope -> element -> agent), so the whole
   platform feels personal to their character. Each PAGE gets its own distinct
   shade within that element family (seeded from the page name), so pages feel
   varied yet cohesive -- never the same cold black everywhere. Still fully dark
   (no light mode, per canon), just alive and attached to the user. Respects a
   member's custom Appearance background if they set one. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaBackdrop) return;
  window.__omegaBackdrop = 1;

  // element -> base [hue, saturation%, lightness%] -- all deep/dark but tinted
  var EL = {
    FIRE:      [14, 42, 6.5],   // warm ember (Aries/Leo/Sagittarius)
    WATER:     [206, 46, 7],    // deep ocean (Cancer/Scorpio/Pisces)
    WIND:      [172, 30, 7],    // twilight teal (Gemini/Libra/Aquarius)
    METAL:     [218, 16, 7],    // cool graphite (Taurus/Capricorn)
    SAND:      [32, 38, 7],     // warm umber-gold (Virgo)
    SOUL:      [268, 34, 7],
    SPACE:     [230, 40, 7.5],
    VOID:      [0, 40, 6],
    NINTH:     [46, 55, 8],     // THE NINTH -- transcendent radiant gold
    SOVEREIGN: [248, 20, 6.5]   // warm charcoal-indigo (default -- softer than #000)
  };
  var SIGN_ELEMENT = {
    Aries: 'FIRE', Leo: 'FIRE', Sagittarius: 'FIRE',
    Cancer: 'WATER', Scorpio: 'WATER', Pisces: 'WATER',
    Gemini: 'WIND', Libra: 'WIND', Aquarius: 'WIND',
    Taurus: 'METAL', Capricorn: 'METAL', Virgo: 'SAND'
  };

  function hash(str) { var h = 0; for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; } return Math.abs(h); }

  function apply(element) {
    // respect a member's own Appearance background override
    try { if (localStorage.getItem('omega_bg')) return; } catch (e) {}
    var key = (element || 'SOVEREIGN').toUpperCase().replace('THE ','').replace(/\s+/g,'');
    var base = EL[key] || EL.SOVEREIGN;
    var h = base[0], s = base[1], l = base[2];
    // per-page variation: shift hue +-12 deg and lightness slightly, seeded by path
    var seed = hash(location.pathname || '/');
    var dh = (seed % 25) - 12;            // -12..+12 degrees
    var dl = ((seed >> 3) % 3) * 0.6;     // 0..1.2%
    var H = (h + dh + 360) % 360, L = l + dl;
    var c1 = 'hsl(' + H + ',' + s + '%,' + (L + 2.5).toFixed(1) + '%)';
    var c2 = 'hsl(' + H + ',' + s + '%,' + Math.max(2, L - 2).toFixed(1) + '%)';
    var c3 = 'hsl(' + H + ',' + Math.max(6, s - 10) + '%,' + Math.max(1.5, L - 3.5).toFixed(1) + '%)';
    var bg = 'radial-gradient(ellipse at 50% 22%, ' + c1 + ' 0%, ' + c2 + ' 45%, ' + c3 + ' 100%)';
    var st = document.getElementById('omega-backdrop-css') || document.createElement('style');
    st.id = 'omega-backdrop-css';
    st.textContent = 'html,body{background:' + c3 + ' !important}body{background:' + bg + ' fixed !important}';
    if (!st.parentNode) (document.head || document.documentElement).appendChild(st);
  }

  // instant paint with the sovereign default so there is never a black flash,
  // then refine to the member's element once known
  apply('SOVEREIGN');

  function detect() {
    try {
      import('https://esm.sh/@supabase/supabase-js@2').then(function (m) {
        var sb = m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');
        sb.auth.getSession().then(function (r) {
          var ss = r && r.data && r.data.session; if (!ss) return;
          sb.from('profiles').select('sign,element').eq('id', ss.user.id).maybeSingle().then(function (res) {
            var d = res && res.data; if (!d) return;
            var el = (d.element || SIGN_ELEMENT[d.sign] || 'SOVEREIGN').toString().toUpperCase();
            apply(el);
          }).catch(function () {});
        }).catch(function () {});
      }).catch(function () {});
    } catch (e) {}
  }
  if (document.body) detect(); else document.addEventListener('DOMContentLoaded', detect);
})();
