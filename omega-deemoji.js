/* ============================================================================
   SYD OMEGA 91717 -- DE-EMOJI (global emblem enforcer)
   Canon: no colored emojis anywhere. Many pages use "emoji-capable" symbols
   (swords, gear, scales, warning, heart, atom, recycle, yin-yang, lightning,
   writing-hand) that browsers render as COLORED emoji by default. This forces
   them to TEXT presentation (variation selector U+FE0E) so they render as clean
   MONOCHROME emblems in the sovereign gold, on every page -- including pages
   edited by other tools. Legit glyphs (checkmarks, stars, arrows, zodiac) are
   left untouched. Pure ASCII, reduced-motion safe, idempotent.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaDeEmoji) return;
  window.__omegaDeEmoji = 1;

  // codepoints that default to EMOJI presentation and must be forced to text
  var EMOJI = {};
  [0x26A0, 0x2694, 0x2692, 0x2696, 0x2699, 0x2764, 0x2763, 0x267B, 0x269B,
   0x267F, 0x262F, 0x270D, 0x26A1, 0x2620, 0x2622, 0x2623, 0x2648, 0x2638,
   0x2668, 0x2744, 0x2747, 0x2733, 0x2734, 0x2721, 0x2695, 0x269C, 0x26AB,
   0x26AA, 0x2B50, 0x2705, 0x274C, 0x2757, 0x2753, 0x2795, 0x2796
  ].forEach(function (c) { EMOJI[c] = 1; });
  var VS15 = '\uFE0E'; // text-presentation selector

  function fix(text) {
    var out = '', changed = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], cp = text.charCodeAt(i);
      out += ch;
      if (EMOJI[cp]) {
        var nxt = text.charCodeAt(i + 1);
        if (nxt !== 0xFE0E && nxt !== 0xFE0F) { out += VS15; changed = true; }
      }
    }
    return changed ? out : null;
  }

  function walk(root) {
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = tw.nextNode())) {
      var p = n.parentNode; if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) continue;
      if (/[\u2600-\u27BF\u2B00-\u2BFF]/.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(function (t) { var f = fix(t.nodeValue); if (f !== null) t.nodeValue = f; });
  }

  // style: emoji-capable emblems inherit the sovereign gold, monochrome
  var st = document.createElement('style'); st.id = 'omega-deemoji-css';
  st.textContent = 'body{font-variant-emoji:text}';
  (document.head || document.documentElement).appendChild(st);

  function boot() {
    walk(document.body);
    try {
      var deb;
      new MutationObserver(function (muts) {
        clearTimeout(deb);
        deb = setTimeout(function () { walk(document.body); }, 150);
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
