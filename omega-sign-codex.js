/* ============================================================================
   SYD OMEGA 91717 -- SIGN CODEX
   The real "everything connects" cross-reference. Given a sign name, opens
   the emblem panel showing that sign's complete, already-real record --
   element, god, gate, token, agent, house, medal, trophy, certificate,
   grade/level/phase -- pulled from the one canonical source (omega-canon.js),
   never duplicated or re-typed per page. Any page can call:

     window.openSignCodex('Aries');

   Requires window.OmegaCanon and window.OmegaEmblemPanel (both already
   loaded globally via bg.js). Waits for both if they're not ready yet.
   ============================================================================ */
(function () {
  'use strict';
  if (window.openSignCodex) return;

  var ELEMENT_COL = {
    Fire: '#E86A3A', Water: '#34C6E6', Wind: '#A9C2D8', Metal: '#C7CDD6', Sand: '#D9B86A',
    Soul: '#E8E8FF', Space: '#9B6BF0', Void: '#7B00FF'
  };

  function openSignCodex(signName) {
    function ready() {
      return window.OmegaCanon && window.OmegaCanon.ready && window.OmegaEmblemPanel;
    }
    function run() {
      var t = window.OmegaCanon.trackBySign(signName);
      if (!t) return;
      var col = ELEMENT_COL[t.element] || '#C9A84C';
      window.OmegaEmblemPanel.open({
        glyph: t.sign, color: col,
        title: t.sign,
        subtitle: 'TRACK ' + t.n + ' -- ' + t.element.toUpperCase(),
        badge: (window.__memberSign && String(window.__memberSign).toLowerCase() === t.sign.toLowerCase()) ? 'YOUR SIGN' : null,
        sections: [
          {
            label: 'CONNECTED IDENTITY', stats: [
              { k: 'Element', v: t.element },
              { k: 'Olympian', v: t.god },
              { k: 'Agent', v: t.agent },
              { k: 'Token', v: t.token },
              { k: 'Gate', v: t.gate },
              { k: 'House', v: t.house }
            ]
          },
          {
            label: 'PROGRESSION RECORD', stats: [
              { k: 'Grade', v: t.grade },
              { k: 'Level', v: t.level },
              { k: 'Phase', v: t.phase }
            ]
          },
          {
            label: 'AWARDS AT THIS TRACK', body:
              '<b>' + t.trophy + '</b> (trophy) &middot; <b>' + t.medal + '</b> (medal) &middot; <b>' + t.certificate + '</b> (certificate)'
          },
          {
            label: 'EXPLORE FURTHER', actions: [
              { label: 'Cosmos Hub', href: '/cosmos.html' },
              { label: 'Elements & Gates', href: '/elements.html' },
              { label: 'Houses Lattice', href: '/houses.html' }
            ]
          }
        ]
      });
    }
    if (ready()) { run(); return; }
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (ready()) { run(); clearInterval(iv); }
      else if (tries > 30) { clearInterval(iv); }
    }, 100);
  }

  window.openSignCodex = openSignCodex;
})();
