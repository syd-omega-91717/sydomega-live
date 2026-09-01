/* ============================================================================
   SYD OMEGA 91717 -- GATEWAY

   Navigation here was text and only text: a sidebar of 15 sections and 223
   written labels, with no page anywhere that shows the platform as a whole.
   Every page already draws its own mark -- omega-page-emblem.js gives each one
   a lattice (12-fold / 9-fold), an axis, and a glyph derived from what the
   page IS -- but that mark was decoration inside a page you had already
   reached. It was never the way in.

   This module makes the mark the door. Each destination renders as its own
   emblem plus its name, and the whole tile is the link.

   WHY IT DOES NOT JUST USE data-page-emblem
   omega-page-emblem.js's draw() opens a requestAnimationFrame loop per mark
   that never stops. That is correct for one emblem on a page. On a grid of
   ~165 it would run 165 permanent loops, each clearing and repainting a
   264x264 canvas every frame, and the page would crawl. So every tile here is
   drawn ONCE, statically (`animate:false`), and the motion is a CSS transform
   on hover/focus -- GPU-composited, one tile at a time, and it stops cleanly
   when the pointer leaves. Same visual vocabulary, none of the cost.

   ONE SOURCE OF TRUTH
   The destination list and every mark's identity come from
   OmegaPageEmblem.pages. This module holds no page list of its own -- adding
   a page to that registry is what puts it in the gateway. A second hand-kept
   list is exactly the duplication this page exists to remove.

   SYSTEM PAGES ARE NOT DESTINATIONS. 404, enter, offline, reset, terms and
   pending are states the platform puts you in, not places you choose to go,
   so they are excluded here and deliberately carry no registry entry.

   DEGRADES RATHER THAN DIES. bg.js defer-loads its modules, so this one can
   run before omega-page-emblem.js has published its global. It waits a bounded
   number of frames and then renders the tiles WITHOUT marks rather than
   leaving an empty page -- a late module must never cost the member the
   navigation itself.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaGateway) return;

  var EXCLUDE = {
    '404': 1, enter: 1, offline: 1, reset: 1, terms: 1, pending: 1,
    account: 1, gateway: 1, sovereign: 1
  };

  var AXES = [
    { k: 'a', label: 'KNOWLEDGE',    col: '#00E5FF' },
    { k: 'b', label: 'MASTERY',      col: '#C9A84C' },
    { k: 'c', label: 'CONTRIBUTION', col: '#3fb27f' }
  ];

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function nameOf(slug) {
    return slug.replace(/-/g, ' ').toUpperCase();
  }

  function tile(slug, cfg, PE) {
    var a = document.createElement('a');
    a.className = 'gw-tile';
    a.href = '/' + slug + '.html';
    a.setAttribute('data-gw', slug);

    var mark = document.createElement('span');
    mark.className = 'gw-mark';
    /* The canvas carries no information a screen reader can use -- the tile's
       own text is its accessible name -- so it is hidden from the tree. */
    mark.setAttribute('aria-hidden', 'true');
    a.appendChild(mark);

    var nm = document.createElement('span');
    nm.className = 'gw-name';
    nm.textContent = nameOf(slug);
    a.appendChild(nm);

    if (PE && typeof PE.draw === 'function' && cfg) {
      var col = (PE.axisColour && PE.axisColour[cfg[1]]) || '#C9A84C';
      try {
        PE.draw(mark, cfg[0], col, cfg[2], { size: 68, animate: false });
      } catch (e) { /* a mark that fails to draw must not cost the link */ }
    }
    return a;
  }

  function build(host, PE) {
    var pages = (PE && PE.pages) || {};
    var total = 0;
    var frag = document.createDocumentFragment();

    for (var ai = 0; ai < AXES.length; ai++) {
      var ax = AXES[ai];
      var slugs = [];
      for (var slug in pages) {
        if (!Object.prototype.hasOwnProperty.call(pages, slug)) continue;
        if (EXCLUDE[slug]) continue;
        if (pages[slug][1] !== ax.k) continue;
        slugs.push(slug);
      }
      if (!slugs.length) continue;
      slugs.sort();

      var sec = document.createElement('section');
      sec.className = 'gw-axis';

      var hd = document.createElement('h2');
      hd.className = 'gw-axis-hd';
      hd.style.color = ax.col;
      hd.textContent = ax.label;
      var cnt = document.createElement('span');
      cnt.className = 'gw-count';
      cnt.textContent = slugs.length;
      hd.appendChild(cnt);
      sec.appendChild(hd);

      var grid = document.createElement('div');
      grid.className = 'gw-grid';
      for (var i = 0; i < slugs.length; i++) {
        grid.appendChild(tile(slugs[i], pages[slugs[i]], PE));
        total++;
      }
      sec.appendChild(grid);
      frag.appendChild(sec);
    }

    host.innerHTML = '';
    host.appendChild(frag);
    return total;
  }

  /* Filter. The point of the gateway is to reach a place fast; with ~165
     destinations, scanning beats scrolling. Hides non-matching tiles and
     collapses an axis that ends up empty, so the result never reads as a
     broken grid. */
  function wireFilter(input, host, status) {
    if (!input) return;
    function apply() {
      var q = (input.value || '').trim().toLowerCase();
      var shown = 0;
      var axes = host.querySelectorAll('.gw-axis');
      for (var i = 0; i < axes.length; i++) {
        var tiles = axes[i].querySelectorAll('.gw-tile');
        var vis = 0;
        for (var j = 0; j < tiles.length; j++) {
          var slug = tiles[j].getAttribute('data-gw') || '';
          var hit = !q || slug.indexOf(q) !== -1;
          tiles[j].hidden = !hit;
          if (hit) { vis++; shown++; }
        }
        axes[i].hidden = vis === 0;
        /* The axis count must track the filter. Showing "KNOWLEDGE 65" above
           eight visible tiles is the kind of number that quietly stops being
           true -- the whole point of deriving it rather than writing it down. */
        var badge = axes[i].querySelector('.gw-count');
        if (badge) badge.textContent = vis;
      }
      /* With no query this shows the total rather than going blank. An empty
         status here read as an unfinished page: boot() set the count and this
         first pass immediately wiped it. */
      if (status) {
        var all = host.querySelectorAll('.gw-tile').length;
        status.textContent = q ? shown + ' of ' + all + ' match'
                               : all + ' destinations';
      }
    }
    input.addEventListener('input', apply);
    apply();
  }

  function boot() {
    var host = document.getElementById('gw-root');
    if (!host) return;
    var status = document.getElementById('gw-status');
    var input = document.getElementById('gw-filter');

    /* bg.js defer-loads omega-page-emblem.js, so it may not have published yet.
       Wait a bounded number of frames, then render regardless. */
    var tries = 0;
    (function wait() {
      var PE = window.OmegaPageEmblem;
      if ((PE && PE.pages) || tries > 90) {
        var n = build(host, PE);
        if (status && !input.value) {
          status.textContent = n + ' destinations';
        }
        wireFilter(input, host, status);
        return;
      }
      tries++;
      requestAnimationFrame(wait);
    })();
  }

  window.OmegaGateway = { boot: boot, reduce: reduce };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
