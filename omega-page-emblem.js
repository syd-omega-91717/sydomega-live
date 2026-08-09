/* ============================================================================
   SYD OMEGA 91717 -- PAGE EMBLEM

   40 of 56 pages had no canvas, no emblem and no motion. The cinematic pages
   (matrix, cosmos, elements, vault, dashboard) carried rotating cubes and
   emblem rings; the service pages were flat.

   The tempting fix is to drop an identical spinning canvas onto all 40. That
   adds weight without meaning -- forty pages spinning the same shape says
   nothing about any of them.

   Instead each page renders a mark derived from what the page IS:
     - its LATTICE : twelve-fold pages draw a 12-point ring, nine-fold a 9-point
     - its AXIS    : knowledge / mastery / contribution set the accent colour
     - its GLYPH   : the page's own sigil at the centre

   Usage:  <div data-page-emblem="academy"></div>
   Respects prefers-reduced-motion: the mark still draws, it stops rotating.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaPageEmblem) return;

  var PAGES = {
    academy:[12,'a','\u2727'], research:[9,'a','\u2732'], intelligence:[9,'a','\u25C9'],
    prediction:[12,'a','\u2609'], travel:[9,'a','\u2708'], news:[12,'a','\u25C8'],
    search:[12,'a','\u2315'], houses:[12,'a','\u2302'], chatbot:[12,'a','\u2756'],
    pantheons:[12,'a','\u26A1'], agents:[12,'a','\u25C8'],
    gaming:[12,'b','\u25B6'], automation:[12,'b','\u2699'], health:[9,'b','\u2695'],
    marketplace:[12,'b','\u25C6'], blockchain:[12,'b','\u26D3'], contracts:[12,'b','\u270D'],
    trophies:[12,'b','\u265A'], compliance:[9,'b','\u2696'], income:[12,'b','\u03A9'],
    points:[9,'b','\u2726'], settings:[12,'b','\u2699'], subscriptions:[12,'b','\u25C9'],
    evolution:[12,'b','\u25B2'], ledger:[12,'b','\u2261'], approvals:[12,'b','\u2713'],
    events:[12,'c','\u2691'], social:[12,'c','\u25CE'], publishing:[12,'c','\u270E'],
    contributions:[12,'c','\u2724'], consultancy:[9,'c','\u269C'], family:[9,'c','\u2635'],
    factions:[12,'c','\u2694'], sovereigns:[12,'c','\u265B'], hall:[12,'c','\u2620'],
    city:[9,'c','\u25A6'], marketing:[12,'c','\u2600'], services:[12,'c','\u2723'],
    beacon:[12,'c','\u2691'], notifications:[12,'c','\u2609'],
    account:[12,'a','\u03A9'],
  achievements:[12,'b','\u265F'],
  advertising:[9,'c','\u25C6'],
  analytics:[12,'a','\u25E6'],
  ascension:[12,'b','\u2B06'],
  bloodline:[12,'c','\u2764'],
  character:[12,'a','\u263A'],
  charter:[12,'c','\u270F'],
  credentials:[12,'b','\u26BF'],
  exam:[12,'a','\u2726'],
  gates:[12,'b','\u25A6'],
  grades:[12,'b','\u25C8'],
  grid:[9,'b','\u25A6'],
  heritage:[12,'a','\u2735'],
  honors:[12,'b','\u2605'],
  horoscope:[12,'a','\u2648'],
  identity:[12,'a','\u25C9'],
  'interface-omni':[9,'b','\u2756'],
  investment:[12,'c','\u25B2'],
  kings:[28,'b','\u265A'],
  kyc:[9,'b','\u26BF'],
  levels:[12,'b','\u2BC5'],
  media:[12,'b','\u25B6'],
  membership:[12,'c','\u2602'],
  passport:[12,'a','\u25C9'],
  payments:[12,'c','\u25C6'],
  pending:[9,'a','\u231B'],
  phases:[12,'a','\u25c8'],
  portfolio:[12,'c','\u25C4'],
  profile:[12,'a','\u25C9'],
  'sovereign-covenant':[12,'c','\u2605'],
  terms:[12,'c','\u270D'],
  treasury:[12,'c','\u25C6'],
  triads:[9,'a','\u25B2'],
  universe:[12,'a','\u2609'],
  wallet:[12,'c','\u25C6'],
  chronicle:[12,'a','\u21BB'],
  'design-system':[9,'b','\u25EB'],
  maintenance:[9,'b','\u2699'],
  roadmap:[12,'a','\u2316'],
  series:[12,'b','\u25B6'],
  trailers:[12,'b','\u25B6'],
  vault:[12,'c','\u25C6'],
};
  var AXIS_COL = { a:'#00E5FF', b:'#C9A84C', c:'#3fb27f' };

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function draw(host, points, col, glyph) {
    var S = 132;
    var cv = document.createElement('canvas');
    cv.width = S * 2; cv.height = S * 2;
    cv.style.cssText = 'width:' + S + 'px;height:' + S + 'px;display:block;margin:0 auto';
    host.appendChild(cv);
    var ctx = cv.getContext('2d'), CX = S, CY = S, t = 0;

    function frame() {
      ctx.clearRect(0, 0, S * 2, S * 2);
      ctx.beginPath(); ctx.arc(CX, CY, S * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = col + '33'; ctx.lineWidth = 2; ctx.stroke();

      for (var i = 0; i < points; i++) {
        var a = (i / points) * Math.PI * 2 + t * 0.25;
        var x = CX + Math.cos(a) * S * 0.78, y = CY + Math.sin(a) * S * 0.78;
        var pulse = 3.2 + Math.sin(t * 1.6 + i) * 1.1;
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, pulse), 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 1.6 + i);
        ctx.fill(); ctx.globalAlpha = 1;
        var o = (((i + Math.floor(points / 2)) % points) / points) * Math.PI * 2 + t * 0.25;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(CX + Math.cos(o) * S * 0.78, CY + Math.sin(o) * S * 0.78);
        ctx.strokeStyle = col + '14'; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.save(); ctx.translate(CX, CY); ctx.rotate(-t * 0.4);
      ctx.beginPath();
      for (var k = 0; k < 3; k++) {
        var ang = (k / 3) * Math.PI * 2;
        ctx.lineTo(Math.cos(ang) * S * 0.34, Math.sin(ang) * S * 0.34);
      }
      ctx.closePath(); ctx.strokeStyle = col + '44'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();

      ctx.font = '700 ' + Math.round(S * 0.42) + 'px "Cinzel Decorative", serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = col; ctx.shadowBlur = 14 + 5 * Math.sin(t * 1.2);
      ctx.fillStyle = col; ctx.fillText(glyph, CX, CY + 2);
      ctx.shadowBlur = 0;

      if (!reduce) { t += 0.016; requestAnimationFrame(frame); }
    }
    frame();
  }

  function boot() {
    var hosts = document.querySelectorAll('[data-page-emblem]');
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (host.getAttribute('data-emblem-done')) continue;
      var key = host.getAttribute('data-page-emblem') ||
                (location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'dashboard');
      var cfg = PAGES[key] || [12, 'b', '\u03A9'];
      host.setAttribute('data-emblem-done', '1');
      draw(host, cfg[0], AXIS_COL[cfg[1]] || '#C9A84C', cfg[2]);
      var cap = document.createElement('div');
      cap.style.cssText = 'text-align:center;font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:2px;color:rgba(201,168,76,.6);margin-top:6px';
      cap.innerHTML = cfg[0] + '-FOLD &middot; <span data-canon-lattice="' + (cfg[0] === 9 ? 'nine' : 'twelve') + '"></span>';
      host.appendChild(cap);
    }
  }

  window.OmegaPageEmblem = { boot: boot, pages: PAGES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 900);
})();
