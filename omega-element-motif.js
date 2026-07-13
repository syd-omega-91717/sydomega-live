/* ============================================================================
   SYD OMEGA 91717 -- ELEMENT MOTIFS (shared, reusable)
   The nine thematically-distinct animated canvas motifs (fire looks like fire,
   water like water, etc.) -- originally built for elements.html. Extracted here
   so every page that shows the 9 elements (elements.html, cosmos.html, and any
   future one) uses the exact same real animation, not a duplicated or
   simplified copy. Respects prefers-reduced-motion. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaElementMotif) return;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hex(c, a) {
    if (c.charAt(0) === '#') {
      var n = parseInt(c.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    return c;
  }

  function drawMotif(ctx, motif, cx, cy, col, t, W, H) {
    if (motif === 'fire') {
      for (var i = 0; i < 18; i++) {
        var x = cx + (Math.random() - 0.5) * W * 0.8, y = H;
        var h2 = 60 + Math.random() * 80, w2 = 8 + Math.random() * 12;
        var g = ctx.createLinearGradient(x, y, x, y - h2);
        g.addColorStop(0, hex(col, 0.7)); g.addColorStop(0.6, hex(col, 0.3)); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.ellipse(x + Math.sin(t + i) * 4, y - h2 / 2, w2 / 2, h2 / 2, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (motif === 'water') {
      for (var w = 0; w < 3; w++) {
        ctx.beginPath();
        for (var x2 = 0; x2 <= W; x2 += 4) {
          var y2 = cy + (w - 1) * 22 + Math.sin(x2 * 0.025 + t + w * 1.2) * 18;
          x2 === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = hex(col, 0.35 - w * 0.08); ctx.lineWidth = 2 + w; ctx.stroke();
      }
      for (var b = 0; b < 6; b++) {
        var bx = (t * 15 + b * 55) % W, by = H - 20 - b * 18;
        ctx.beginPath(); ctx.arc(bx, by, 2 + b, 0, Math.PI * 2);
        ctx.strokeStyle = hex(col, 0.4); ctx.lineWidth = 1; ctx.stroke();
      }
    } else if (motif === 'wind') {
      for (var s = 0; s < 5; s++) {
        ctx.beginPath();
        for (var x3 = 0; x3 <= W; x3 += 3) {
          var y3 = 20 + s * 28 + Math.sin(x3 * 0.018 + t * (0.8 + s * 0.15) + s) * 14;
          x3 === 0 ? ctx.moveTo(x3, y3) : ctx.lineTo(x3, y3);
        }
        ctx.strokeStyle = hex(col, 0.2 + s * 0.06); ctx.lineWidth = 1; ctx.stroke();
      }
    } else if (motif === 'metal') {
      for (var r = 0; r < 5; r++) {
        var ang = t * 0.3 + r * (Math.PI * 2 / 5);
        var rx = cx + Math.cos(ang) * 50, ry = cy + Math.sin(ang) * 30;
        ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI * 2);
        ctx.fillStyle = hex(col, 0.6 + 0.3 * Math.sin(t + r)); ctx.fill();
      }
      ctx.beginPath(); ctx.rect(cx - 60, cy - 30, 120, 60);
      ctx.strokeStyle = hex(col, 0.15); ctx.lineWidth = 1; ctx.stroke();
    } else if (motif === 'sand') {
      for (var d = 0; d < 40; d++) {
        var dx = ((t * 8 + d * 37) % W), dy = cy - 20 + Math.sin(t * 0.5 + d) * 30;
        ctx.beginPath(); ctx.arc(dx, dy, 1.2 + Math.sin(t + d), 0, Math.PI * 2);
        ctx.fillStyle = hex(col, 0.4 + 0.3 * Math.random()); ctx.fill();
      }
    } else if (motif === 'soul') {
      var gS = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + Math.sin(t * 0.8) * 15);
      gS.addColorStop(0, hex(col, 0.5)); gS.addColorStop(0.4, hex(col, 0.15)); gS.addColorStop(1, 'transparent');
      ctx.fillStyle = gS; ctx.beginPath(); ctx.ellipse(cx, cy, 90, 60, 0, 0, Math.PI * 2); ctx.fill();
      for (var sp = 0; sp < 12; sp++) {
        var sa = t * 0.4 + sp * (Math.PI * 2 / 12);
        ctx.beginPath(); ctx.arc(cx + Math.cos(sa) * 55, cy + Math.sin(sa) * 35, 2, 0, Math.PI * 2);
        ctx.fillStyle = hex(col, 0.7); ctx.fill();
      }
    } else if (motif === 'space') {
      for (var st = 0; st < 30; st++) {
        var sx = ((st * 73 + t * 2) % W), sy = ((st * 47 + t * 1.3) % H);
        var ss = 0.5 + Math.sin(t * 2 + st) * 0.8;
        ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fillStyle = hex(col, 0.7); ctx.fill();
      }
      var g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
      g2.addColorStop(0, hex(col, 0.3)); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 70, 0, 0, Math.PI * 2); ctx.fill();
    } else if (motif === 'void') {
      ctx.fillStyle = 'rgba(13,0,20,0.6)'; ctx.fillRect(0, 0, W, H);
      var gv = ctx.createRadialGradient(cx + Math.cos(t * 0.3) * 20, cy + Math.sin(t * 0.4) * 15, 0, cx, cy, 90);
      gv.addColorStop(0, 'rgba(123,0,255,0.5)'); gv.addColorStop(0.5, 'rgba(60,0,120,0.2)'); gv.addColorStop(1, 'transparent');
      ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
    } else {
      var cols = ['#E86A3A', '#34C6E6', '#A9C2D8', '#C7CDD6', '#D9B86A', '#E8E8FF', '#9B6BF0', '#7B00FF', '#C9A84C'];
      for (var ci = 0; ci < cols.length; ci++) {
        var ca = t * 0.5 + ci * (Math.PI * 2 / cols.length);
        var cr = 50 + Math.sin(t + ci * 0.7) * 15;
        var gci = ctx.createRadialGradient(cx + Math.cos(ca) * cr, cy + Math.sin(ca) * cr, 0, cx, cy, 80);
        gci.addColorStop(0, hex(cols[ci], 0.35)); gci.addColorStop(1, 'transparent');
        ctx.fillStyle = gci; ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = 'rgba(201,168,76,0.7)'; ctx.font = 'bold 22px "Cinzel Decorative"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u03A9', cx, cy);
    }
  }

  // Public API: mount(canvas, motif, color, opts) -- opts: {locked, unlockAt, authority}
  function mount(canvas, motif, col, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var locked = !!opts.locked;
    var t = 0;

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      if (locked) {
        ctx.save();
        ctx.globalAlpha = 0.22 + (REDUCE ? 0 : Math.sin(t * 0.6) * 0.05);
        drawMotif(ctx, motif, cx, cy, col, t, W, H);
        ctx.restore();
        ctx.fillStyle = 'rgba(7,7,11,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy - 6, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(201,168,76,0.5)'; ctx.fillRect(cx - 7, cy - 6, 14, 12);
        ctx.fillStyle = 'rgba(7,7,11,0.9)'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        if (opts.unlockAt) {
          ctx.fillStyle = 'rgba(201,168,76,0.75)'; ctx.font = '11px "Courier Prime",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('AUTHORITY ' + opts.unlockAt + ' REQUIRED', W / 2, H / 2 + 34);
          if (opts.authority != null) {
            ctx.fillStyle = 'rgba(201,168,76,0.4)'; ctx.font = '9px "Courier Prime",monospace';
            ctx.fillText('YOUR AUTHORITY: ' + Number(opts.authority).toFixed(2), W / 2, H / 2 + 50);
          }
        }
      } else {
        drawMotif(ctx, motif, cx, cy, col, t, W, H);
      }
      if (!REDUCE) { t += 0.018; requestAnimationFrame(frame); }
    }
    frame();
  }

  window.OmegaElementMotif = { mount: mount };
})();
