/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-sparkline.js
   Renders the shipped-but-unadopted telemetry utilities from bg.js
   (.sparkline stroke styling, .trend.up/.down/.flat badges) from a real
   numeric series, so no page has to hand-roll SVG geometry.

   WHY A MODULE AND NOT PER-PAGE SVG
   bg.js styles `.sparkline` (stroke/glow on a polyline) but draws nothing —
   every adopting page would otherwise repeat the same min/max/scale/points
   arithmetic, and CLAUDE.md §4 is explicit that shared behaviour belongs in
   one place rather than drifting per page.

   WHY IT REFUSES TO DRAW
   A `.trend` badge asserts a direction: that a number moved against a real
   previous value. CLAUDE.md §8.1 class 9 (hercules.html drawing
   `Math.random()*100` as member progress; ad-network.html inventing revenue)
   is the bug this module is built not to repeat. So:
     - fewer than 2 finite values  -> nothing renders at all, mount hidden
     - the badge compares the last two REAL values, never a placeholder
     - equal values render `.trend.flat`, not an invented direction
     - a zero previous value renders the absolute delta, never a percent
       (there is no percentage change from zero)

   LOAD ORDER
   Pages set `data-spark-values` from their own render pass, which may run
   before or after this deferred module. Both orders work: the module scans
   once on load, and a MutationObserver watches that attribute thereafter.
   (omega-constellation.js observed childList only and needed an explicit
   scan() call from every adopter — this one does not.)

   MARKUP
     <div data-omega-spark data-spark-label="XP PER DAY"></div>
   then, from the page:
     el.setAttribute('data-spark-values', JSON.stringify([4,9,2,11]));
   optional attributes:
     data-spark-unit    suffix used in the accessible summary ("ml", "h")
     data-spark-trend   "off" to draw the line without the badge
     data-spark-line    "off" to draw the badge without the line
     data-spark-digits  decimal places in the accessible summary (default 0)
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaSpark) return;

  var W = 120, H = 28, PAD = 2;

  function nums(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var v = typeof raw[i] === 'number' ? raw[i] : parseFloat(raw[i]);
      if (typeof v === 'number' && isFinite(v)) out.push(v);
    }
    return out;
  }

  function points(vals) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = max - min;
    var stepX = vals.length > 1 ? (W - PAD * 2) / (vals.length - 1) : 0;
    var usable = H - PAD * 2;
    var out = [];
    for (var i = 0; i < vals.length; i++) {
      /* a flat series has no span to scale against: draw it down the middle
         rather than dividing by zero and pinning it to an edge */
      var t = span === 0 ? 0.5 : (vals[i] - min) / span;
      out.push((PAD + i * stepX).toFixed(1) + ',' + (PAD + usable - t * usable).toFixed(1));
    }
    return out;
  }

  function fmt(n, digits) {
    var a = Math.abs(n);
    if (a >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toFixed(digits);
  }

  /* The badge text. Returns null when there is nothing true to say. */
  function delta(prev, cur, digits) {
    if (!isFinite(prev) || !isFinite(cur)) return null;
    if (prev === cur) return { cls: 'flat', text: 'NO CHANGE' };
    if (prev === 0) {
      /* percentage change from zero is undefined, so state the amount */
      return { cls: cur > 0 ? 'up' : 'down', text: fmt(Math.abs(cur - prev), digits) };
    }
    var pct = ((cur - prev) / Math.abs(prev)) * 100;
    var shown = Math.abs(pct);
    return {
      cls: pct > 0 ? 'up' : 'down',
      text: (shown >= 100 ? Math.round(shown) : shown.toFixed(shown < 10 ? 1 : 0)) + '%'
    };
  }

  function render(el, values, opts) {
    if (!el) return false;
    opts = opts || {};
    var vals = nums(values);
    el.textContent = '';

    /* Nothing honest to draw from a single reading or none at all. */
    if (vals.length < 2) {
      el.hidden = true;
      el.removeAttribute('data-spark-drawn');
      return false;
    }
    el.hidden = false;

    var digits = parseInt(opts.digits != null ? opts.digits : el.getAttribute('data-spark-digits'), 10);
    if (!isFinite(digits) || digits < 0) digits = 0;
    var unit = opts.unit != null ? opts.unit : (el.getAttribute('data-spark-unit') || '');
    var label = opts.label != null ? opts.label : (el.getAttribute('data-spark-label') || 'RECENT VALUES');
    var wantLine = (opts.line != null ? opts.line : el.getAttribute('data-spark-line')) !== 'off';
    var wantTrend = (opts.trend != null ? opts.trend : el.getAttribute('data-spark-trend')) !== 'off';

    var wrap = document.createElement('span');
    wrap.className = 'osp';

    if (wantLine) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('role', 'img');
      /* The line carries data, so it gets a real description rather than
         aria-hidden: the range and the latest reading, in words. */
      svg.setAttribute('aria-label',
        label + ': ' + vals.length + ' readings, low ' + fmt(Math.min.apply(null, vals), digits) + unit +
        ', high ' + fmt(Math.max.apply(null, vals), digits) + unit +
        ', latest ' + fmt(vals[vals.length - 1], digits) + unit);

      var pts = points(vals);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('class', 'sparkline');
      line.setAttribute('points', pts.join(' '));
      svg.appendChild(line);

      var last = pts[pts.length - 1].split(',');
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'osp-dot');
      dot.setAttribute('cx', last[0]);
      dot.setAttribute('cy', last[1]);
      dot.setAttribute('r', '2');
      svg.appendChild(dot);

      wrap.appendChild(svg);
    }

    if (wantTrend) {
      var d = delta(vals[vals.length - 2], vals[vals.length - 1], digits);
      if (d) {
        var badge = document.createElement('span');
        badge.className = 'trend ' + d.cls;
        badge.textContent = d.text;
        wrap.appendChild(badge);
      }
    }

    if (!wrap.childNodes.length) { el.hidden = true; return false; }
    el.appendChild(wrap);
    el.setAttribute('data-spark-drawn', '1');
    return true;
  }

  function readAttr(el) {
    var raw = el.getAttribute('data-spark-values');
    if (raw == null || raw === '') { el.hidden = true; return; }
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    render(el, parsed);
  }

  function scan(root) {
    var host = root && root.querySelectorAll ? root : document;
    var list = host.querySelectorAll('[data-omega-spark]');
    for (var i = 0; i < list.length; i++) readAttr(list[i]);
    return list.length;
  }

  window.OmegaSpark = { render: render, scan: scan };

  function start() {
    scan();
    if (!window.MutationObserver || !document.body) return;
    var queued = false, pending = [];
    var obs = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === 'attributes') { pending.push(r.target); continue; }
        for (var j = 0; j < r.addedNodes.length; j++) {
          var n = r.addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.hasAttribute && n.hasAttribute('data-omega-spark')) pending.push(n);
          else if (n.querySelectorAll) {
            var inner = n.querySelectorAll('[data-omega-spark]');
            for (var k = 0; k < inner.length; k++) pending.push(inner[k]);
          }
        }
      }
      if (queued || !pending.length) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(function () {
        queued = false;
        var todo = pending; pending = [];
        for (var i = 0; i < todo.length; i++) {
          /* the render itself mutates the mount, so only re-read mounts
             whose values attribute is what changed */
          if (todo[i].isConnected !== false) readAttr(todo[i]);
        }
      });
    });
    obs.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['data-spark-values']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
