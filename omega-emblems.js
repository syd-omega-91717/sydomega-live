/* ============================================================================
   SYD OMEGA 91717 -- 12 LIVING EMBLEMS
   A living, rotating, breathing emblem for each of the 12 zodiac figures:
   twin counter-rotating rings, a 12-fold tick motif, and the sign glyph
   pulsing in its element colour. Drop one anywhere with:
       <span data-omega-emblem="Aries"></span>
   or let it auto-render the signed-in member's own sign with:
       <span data-omega-sigil></span>
   Pure ASCII (glyphs as HTML entities), reduced-motion safe, self-contained.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaEmblems) return;
  window.__omegaEmblems = 1;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // sign -> { glyph entity, colour (element-anchored) }
  var SIGN = {
    Aries:      { g: '&#x2648;', c: '#E86A3A' }, // Fire
    Leo:        { g: '&#x264C;', c: '#E2A63A' }, // Fire
    Sagittarius:{ g: '&#x2650;', c: '#E8863A' }, // Fire
    Cancer:     { g: '&#x264B;', c: '#34C6E6' }, // Water
    Scorpio:    { g: '&#x264F;', c: '#2E6ED2' }, // Water
    Pisces:     { g: '&#x2653;', c: '#00E5FF' }, // Water
    Gemini:     { g: '&#x264A;', c: '#8FE3D4' }, // Wind
    Libra:      { g: '&#x264E;', c: '#A9C2D8' }, // Wind
    Aquarius:   { g: '&#x2652;', c: '#7FD9E0' }, // Wind
    Taurus:     { g: '&#x2649;', c: '#C8CDD6' }, // Metal
    Capricorn:  { g: '&#x2651;', c: '#9AA6B4' }, // Metal
    Virgo:      { g: '&#x264D;', c: '#D9B86A' }  // Sand
  };

  // one-time stylesheet
  var st = document.createElement('style');
  st.id = 'omega-emblems-css';
  st.textContent = [
    '.oe-wrap{display:inline-block;line-height:0;color:var(--oe,#C9A84C)}',
    '.oe-svg{width:100%;height:100%;overflow:visible;display:block}',
    '@keyframes oeSpin{to{transform:rotate(360deg)}}',
    '@keyframes oeSpinR{to{transform:rotate(-360deg)}}',
    '@keyframes oePulse{0%,100%{opacity:.35}50%{opacity:.8}}',
    '@keyframes oeGlyph{0%,100%{opacity:.85}50%{opacity:1}}',
    '.oe-spin{transform-origin:60px 60px;animation:oeSpin 34s linear infinite}',
    '.oe-spinr{transform-origin:60px 60px;animation:oeSpinR 42s linear infinite}',
    '.oe-pulse{animation:oePulse 8s ease-in-out infinite}',
    '.oe-glyph{animation:oeGlyph 8s ease-in-out infinite}',
    '@media(prefers-reduced-motion:reduce){.oe-spin,.oe-spinr,.oe-pulse,.oe-glyph{animation:none}}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);

  function ticks(r) {
    var out = '';
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * 6.2832;
      var x1 = (60 + Math.cos(a) * r).toFixed(1), y1 = (60 + Math.sin(a) * r).toFixed(1);
      var x2 = (60 + Math.cos(a) * (r - 4)).toFixed(1), y2 = (60 + Math.sin(a) * (r - 4)).toFixed(1);
      out += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="1" opacity="0.5"/>';
    }
    return out;
  }

  function svg(sign) {
    var s = SIGN[sign] || SIGN.Aries;
    return '<span class="oe-wrap" style="--oe:' + s.c + '" title="' + sign + '">'
      + '<svg viewBox="0 0 120 120" class="oe-svg" style="filter:drop-shadow(0 0 6px ' + s.c + '55)">'
      + '<g class="oe-spin"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 7" opacity="0.55"/></g>'
      + '<g class="oe-spinr"><circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.3"/>' + ticks(44) + '</g>'
      + '<circle class="oe-pulse" cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>'
      + '<text class="oe-glyph" x="60" y="61" text-anchor="middle" dominant-baseline="central" font-size="40" fill="currentColor" style="filter:drop-shadow(0 0 5px ' + s.c + ')">' + s.g + '</text>'
      + '</svg></span>';
  }

  // generalized ring for non-zodiac numbered/titled sequences (ascension
  // stages, phases, gates) -- same rotating-ring visual language as svg(),
  // but takes an arbitrary glyph/number and colour instead of a sign.
  // opts: { locked:boolean } dims the ring and fades the glyph for locked items.
  function ring(glyph, color, opts) {
    opts = opts || {};
    var c = color || '#C9A84C';
    var dim = opts.locked ? '.28' : '1';
    var fontSize = String(glyph).length > 2 ? 26 : 40;
    return '<span class="oe-wrap" style="--oe:' + c + ';opacity:' + dim + '">'
      + '<svg viewBox="0 0 120 120" class="oe-svg" style="filter:drop-shadow(0 0 6px ' + c + '55)">'
      + '<g class="oe-spin"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 7" opacity="0.55"/></g>'
      + '<g class="oe-spinr"><circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.3"/>' + ticks(44) + '</g>'
      + '<circle class="oe-pulse" cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>'
      + '<text class="oe-glyph" x="60" y="61" text-anchor="middle" dominant-baseline="central" font-size="' + fontSize + '" fill="currentColor" style="filter:drop-shadow(0 0 5px ' + c + ')">' + glyph + '</text>'
      + '</svg></span>';
  }

  function fill(el, sign) {
    if (el.__oe) return;
    el.__oe = 1;
    el.innerHTML = svg(sign);
  }

  function scanNamed() {
    var l = document.querySelectorAll('[data-omega-emblem]');
    for (var i = 0; i < l.length; i++) fill(l[i], l[i].getAttribute('data-omega-emblem'));
  }

  function scanSigil(sign) {
    var l = document.querySelectorAll('[data-omega-sigil]');
    for (var i = 0; i < l.length; i++) fill(l[i], sign);
  }

  // render the signed-in member's own emblem into any [data-omega-sigil]
  function detectAndSigil() {
    try {
      import('https://esm.sh/@supabase/supabase-js@2').then(function (m) {
        var sb = m.createClient(
          'https://ydqhzvvoyufiiqvzcjns.supabase.co',
          'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'
        );
        sb.auth.getSession().then(function (r) {
          var s = r && r.data && r.data.session;
          if (!s) { scanSigil('Aries'); return; }
          sb.from('profiles').select('sign').eq('id', s.user.id).maybeSingle().then(function (res) {
            var sign = (res && res.data && res.data.sign) || 'Aries';
            scanSigil(SIGN[sign] ? sign : 'Aries');
          }).catch(function () { scanSigil('Aries'); });
        }).catch(function () { scanSigil('Aries'); });
      }).catch(function () {});
    } catch (e) {}
  }

  function boot() {
    scanNamed();
    if (document.querySelector('[data-omega-sigil]')) detectAndSigil();
    try {
      new MutationObserver(function () {
        scanNamed();
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  // expose for pages that want to build a full 12-emblem gallery
  window.OmegaEmblem = { svg: svg, ring: ring, signs: Object.keys(SIGN) };
})();
