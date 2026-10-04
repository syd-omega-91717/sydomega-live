/* ============================================================================
   SYD OMEGA 91717 -- ARCADE
   Six real, playable canvas games for gaming.html ("Games & Exams"), which
   until now only described games in text cards.

     ascend   ASCEND         merge tiles to 2048        (sliding-tile merge)
     serpent  SERPENT        eat, grow, never touch     (snake)
     oracle   ORACLE WORD    five letters, six tries    (word deduction)
     zodiac   ZODIAC MEMORY  twelve pairs of signs      (concentration)
     aegis    AEGIS BREAKER  shatter the wall           (brick breaker)
     hades    HADES FIELD    clear the field            (mine sweeping)

   API (window.OmegaArcade):
     list()        -> [{id,name,tagline,best,bestLabel}]
     open(id)      -> fullscreen player (focus trapped; Esc / close button;
                      auto-pause on blur and visibilitychange for timed games)
     close()
     thumbs(el)    -> grid of six tiles, each with a live attract-mode preview
                      (paused off-screen via IntersectionObserver; one still
                      frame under prefers-reduced-motion)
     status()      -> loop state, for verification
   Auto-mounts thumbs() on every [data-omega-arcade="thumbs"] element.

   Platform rules this follows (CLAUDE.md):
   - Canvases are sized by ResizeObserver x devicePixelRatio, never measured at
     DOMContentLoaded: the approval guard reveals #app with no resize event
     (8.1 class 3).
   - Every requestAnimationFrame loop stops when its surface closes or leaves
     the screen.
   - Best scores live in localStorage['omega_arcade_best'], every access in
     try/catch. A first meaningful result goes through
     window.OmegaProgress.record(), which checks the RPC's .error itself
     (8.1 class 1) and dedups per task.
   - DOM is built with createElement/textContent only. Zodiac glyphs are
     U+2648..U+2653 each followed by U+FE0E (text presentation, not emoji).
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaArcade) return;

  var GOLD = '#C9A84C', GOLD_HI = '#E8CB74', CYAN = '#00E5FF', VOID = '#05060a',
      INK = '#e9e6dc', MUTED = '#8a8676', CRIM = '#ff4d6a';
  var FD = "'Cinzel Decorative', 'Cinzel', serif";
  var FR = "'Rajdhani', 'Segoe UI', sans-serif";
  var FM = "'Courier Prime', 'Courier New', monospace";
  var FSYM = "'Segoe UI Symbol', 'DejaVu Sans', 'Noto Sans Symbols', 'Apple Symbols', serif";
  var VS15 = '︎';
  var BEST_KEY = 'omega_arcade_best';

  /* ------------------------------------------------------------------ util */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rint(n) { return Math.floor(Math.random() * n); }
  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function reducedMotion() {
    try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function icon(name) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    var d = {
      close: 'M6 6L18 18M18 6L6 18',
      restart: 'M19 12a7 7 0 1 1-2.05-4.95M19 4v4.5h-4.5',
      pause: 'M8 5v14M16 5v14',
      play: 'M8 5l11 7-11 7z',
      up: 'M12 6l7 10H5z', down: 'M12 18L5 8h14z', left: 'M6 12l10-7v14z', right: 'M18 12L8 19V5z'
    }[name];
    var p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    var filled = /^(play|up|down|left|right)$/.test(name);
    p.setAttribute('fill', filled ? 'currentColor' : 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', filled ? '1' : '2.4');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    s.appendChild(p);
    return s;
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  /* Size a canvas's drawing buffer to its CSS box x devicePixelRatio. */
  function fit(canvas, w, h, setStyle) {
    var d = Math.min(window.devicePixelRatio || 1, 2.5);
    var W = Math.max(1, Math.round(w * d)), H = Math.max(1, Math.round(h * d));
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    if (setStyle) { canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return ctx;
  }
  /* The void: near-black, a gold breath from above, a fixed scatter of stars. */
  var STARS = (function () {
    var r = mulberry32(91717), a = [];
    for (var i = 0; i < 46; i++) a.push([r(), r(), r() * 1.2 + 0.3, r()]);
    return a;
  })();
  function bg(ctx, w, h, t) {
    ctx.fillStyle = VOID;
    ctx.fillRect(0, 0, w, h);
    var g = ctx.createRadialGradient(w * 0.5, -h * 0.15, 0, w * 0.5, -h * 0.15, Math.max(w, h) * 1.1);
    g.addColorStop(0, 'rgba(201,168,76,0.16)');
    g.addColorStop(0.5, 'rgba(0,229,255,0.04)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i];
      var tw = 0.35 + 0.35 * Math.sin((t || 0) * 1.3 + s[3] * 6.28);
      ctx.fillStyle = 'rgba(233,230,220,' + (tw * 0.6).toFixed(3) + ')';
      ctx.fillRect(s[0] * w, s[1] * h, s[2], s[2]);
    }
  }
  function txt(ctx, s, x, y, size, color, font, align, base) {
    /* font may carry a weight prefix ('700 ' + FR): CSS font shorthand needs
       weight BEFORE size, and an invalid string silently falls back to 10px. */
    var f = font || FR, w = /^(\d{3}) (.*)$/.exec(f);
    ctx.font = w ? w[1] + ' ' + size + 'px ' + w[2] : size + 'px ' + f;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = base || 'middle';
    ctx.fillText(s, x, y);
  }

  /* ---------------------------------------------------------- best scores */
  function readBest() {
    try {
      var v = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) { return {}; }
  }
  function getBest(k) {
    var v = readBest()[k];
    return typeof v === 'number' && isFinite(v) ? v : null;
  }
  function offerBest(k, v, lower) {
    var all = readBest(), cur = all[k];
    var better = typeof cur !== 'number' || (lower ? v < cur : v > cur);
    if (better) {
      all[k] = v;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(all)); } catch (e) { /* private mode */ }
    }
    return better;
  }

  /* ------------------------------------------------------------- progress */
  var achieved = {};
  function ensureProgress(cb) {
    if (window.OmegaProgress) { cb(); return; }
    /* bg.js already injects omega-progress.js on every page under this same
       guard attribute; this only covers a page where bg.js did not run. Same
       module, so sharing its guard is correct (8.1 class 5). */
    if (!document.querySelector('script[data-omega-progress]')) {
      var s = document.createElement('script');
      s.src = '/omega-progress.js';
      s.defer = true;
      s.setAttribute('data-omega-progress', '1');
      (document.head || document.documentElement).appendChild(s);
    }
    var tries = 0;
    (function wait() {
      if (window.OmegaProgress) { cb(); return; }
      if (++tries > 60) return;
      setTimeout(wait, 250);
    })();
  }
  function achieve(game) {
    if (achieved[game.id]) return;
    achieved[game.id] = true;
    ensureProgress(function () {
      try {
        var p = window.OmegaProgress && window.OmegaProgress.record({
          kind: 'mastery', task: 'arcade:' + game.id, axis: 'b',
          title: 'Arcade · ' + game.name, weight: 0.08
        });
        if (p && p.then) p.then(null, function () { /* record() never rejects; belt and braces */ });
      } catch (e) { /* progress is best-effort; the game result stands */ }
    });
  }

  /* =========================================================== 1. ASCEND */
  var A_ANIM = 110;
  function aNew(t) {
    var s = { g: [], score: 0, ghosts: [], anim: -1e9, won: false, over: false, hit2048: false };
    for (var i = 0; i < 16; i++) s.g.push(null);
    aSpawn(s, t); aSpawn(s, t);
    return s;
  }
  function aSpawn(s, t) {
    var e = [];
    for (var i = 0; i < 16; i++) if (!s.g[i]) e.push(i);
    if (!e.length) return;
    var i2 = e[rint(e.length)], r = i2 >> 2, c = i2 & 3;
    s.g[i2] = { v: Math.random() < 0.9 ? 2 : 4, r: r, c: c, fr: r, fc: c, born: t, pop: -1e9, merged: false };
  }
  function aCanMove(s) {
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
      var t = s.g[r * 4 + c];
      if (!t) return true;
      if (c < 3 && s.g[r * 4 + c + 1] && s.g[r * 4 + c + 1].v === t.v) return true;
      if (r < 3 && s.g[(r + 1) * 4 + c] && s.g[(r + 1) * 4 + c].v === t.v) return true;
    }
    return false;
  }
  /* dir: 0 up, 1 right, 2 down, 3 left. Returns true when anything moved. */
  function aMove(s, dir, t) {
    var vr = [-1, 0, 1, 0][dir], vc = [0, 1, 0, -1][dir], moved = false, i;
    s.ghosts = [];
    for (i = 0; i < 16; i++) {
      var q = s.g[i];
      if (q) { q.fr = q.r; q.fc = q.c; q.merged = false; }
    }
    var rows = [0, 1, 2, 3], cols = [0, 1, 2, 3];
    if (vr === 1) rows.reverse();
    if (vc === 1) cols.reverse();
    for (var ri = 0; ri < 4; ri++) for (var ci = 0; ci < 4; ci++) {
      var r = rows[ri], c = cols[ci], tile = s.g[r * 4 + c];
      if (!tile) continue;
      var nr = r, nc = c, merged = false;
      for (;;) {
        var tr = nr + vr, tc = nc + vc;
        if (tr < 0 || tr > 3 || tc < 0 || tc > 3) break;
        var o = s.g[tr * 4 + tc];
        if (!o) { nr = tr; nc = tc; continue; }
        if (o.v === tile.v && !o.merged) {
          s.g[r * 4 + c] = null;
          s.ghosts.push({ v: tile.v, fr: tile.fr, fc: tile.fc, r: tr, c: tc });
          s.ghosts.push({ v: o.v, fr: o.fr, fc: o.fc, r: tr, c: tc });
          var m = { v: tile.v * 2, r: tr, c: tc, fr: tr, fc: tc, born: -1e9, pop: t + A_ANIM, merged: true };
          s.g[tr * 4 + tc] = m;
          s.score += m.v;
          if (m.v === 2048) s.hit2048 = true;
          moved = merged = true;
        }
        break;
      }
      if (!merged && (nr !== r || nc !== c)) {
        s.g[r * 4 + c] = null;
        s.g[nr * 4 + nc] = tile;
        tile.r = nr; tile.c = nc;
        moved = true;
      }
    }
    if (moved) {
      s.anim = t;
      aSpawn(s, t + A_ANIM);
      if (!aCanMove(s)) s.over = true;
    }
    return moved;
  }
  var A_COL = ['#2b2416', '#3d311b', '#5b4520', '#7c5b22', '#a07726', '#C9A84C', '#E8CB74',
               '#0d6f7f', '#0aa5be', '#00E5FF', '#8af5ff', '#ffffff'];
  function aDraw(ctx, s, x0, y0, size, t) {
    var gap = size * 0.03, cell = (size - gap * 5) / 4;
    rrect(ctx, x0, y0, size, size, size * 0.03);
    ctx.fillStyle = 'rgba(16,15,22,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    var r, c;
    for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) {
      rrect(ctx, x0 + gap + c * (cell + gap), y0 + gap + r * (cell + gap), cell, cell, cell * 0.08);
      ctx.fillStyle = 'rgba(201,168,76,0.06)';
      ctx.fill();
    }
    var p = clamp((t - s.anim) / A_ANIM, 0, 1), e = easeOut(p);
    function tile(v, fr, fc, tr, tc, scale) {
      var rr = lerp(fr, tr, e), cc = lerp(fc, tc, e);
      var x = x0 + gap + cc * (cell + gap), y = y0 + gap + rr * (cell + gap);
      var k = Math.max(1, Math.round(Math.log(v) / Math.LN2));
      var col = A_COL[Math.min(k - 1, A_COL.length - 1)];
      var sz = cell * scale, off = (cell - sz) / 2;
      ctx.save();
      if (k >= 6) { ctx.shadowColor = k >= 8 ? CYAN : GOLD; ctx.shadowBlur = cell * 0.28; }
      rrect(ctx, x + off, y + off, sz, sz, sz * 0.09);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
      var digits = String(v).length;
      var fs = sz * (digits <= 2 ? 0.46 : digits === 3 ? 0.38 : digits === 4 ? 0.3 : 0.24);
      ctx.font = '700 ' + fs + 'px ' + FR;
      ctx.fillStyle = k >= 5 ? '#0a0a0f' : INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v), x + cell / 2, y + cell / 2 + fs * 0.04);
    }
    if (p < 1) for (var g = 0; g < s.ghosts.length; g++) {
      var q = s.ghosts[g];
      tile(q.v, q.fr, q.fc, q.r, q.c, 1);
    }
    for (var i = 0; i < 16; i++) {
      var tl = s.g[i];
      if (!tl) continue;
      if (tl.merged && t < tl.pop) continue;
      if (tl.born > t) continue;
      var sc = 1;
      var bornAge = t - tl.born;
      if (bornAge >= 0 && bornAge < 120) sc = 0.3 + 0.7 * easeOut(bornAge / 120);
      var popAge = t - tl.pop;
      if (popAge >= 0 && popAge < 150) sc = 1 + 0.13 * Math.sin(Math.PI * popAge / 150);
      tile(tl.v, tl.fr, tl.fc, tl.r, tl.c, sc);
    }
  }
  var ASCEND = {
    id: 'ascend', name: 'ASCEND', tagline: 'Merge to 2048', color: GOLD, glow: 'rgba(201,168,76,.35)',
    timed: false, help: 'ARROWS · WASD · SWIPE',
    aspect: function () { return 1; },
    bestLabel: function () { var b = getBest('ascend'); return b == null ? null : 'BEST ' + b; },
    create: function (h) {
      var s, swipe = null;
      function hud() {
        var b = getBest('ascend');
        h.hud('SCORE ' + s.score + (b != null ? ' · BEST ' + b : ''));
      }
      function restart() { s = aNew(now()); h.clearMsg(); hud(); }
      function go(dir) {
        if (s.over || h.hasMsg()) return;
        if (aMove(s, dir, now())) {
          offerBest('ascend', s.score, false);
          hud();
          if (s.hit2048 && !s.won) {
            s.won = true;
            achieve(ASCEND);
            h.msg('ASCENDED', '2048 reached · score ' + s.score, [
              { label: 'KEEP PLAYING', primary: true, fn: function () { h.clearMsg(); } },
              { label: 'NEW GAME', fn: restart }
            ]);
            h.announce('2048 reached');
          } else if (s.over) {
            h.msg('NO MOVES', 'Score ' + s.score, [{ label: 'PLAY AGAIN', primary: true, fn: restart }]);
            h.announce('No moves left. Score ' + s.score);
          }
        }
      }
      h.on(h.canvas, 'pointerdown', function (e) { swipe = { x: e.clientX, y: e.clientY }; });
      h.on(h.canvas, 'pointerup', function (e) {
        if (!swipe) return;
        var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        swipe = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) go(dx > 0 ? 1 : 3); else go(dy > 0 ? 2 : 0);
      });
      h.on(h.canvas, 'pointercancel', function () { swipe = null; });
      restart();
      return {
        restart: restart,
        key: function (e) {
          var m = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 }[e.key];
          if (m == null) return false;
          go(m);
          return true;
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          var size = Math.min(w, hh) - 8;
          aDraw(ctx, s, (w - size) / 2, (hh - size) / 2, size, now());
        },
        _state: function () { return s; }
      };
    },
    attract: function (st, ctx, w, h, t) {
      var ms = t * 1000;
      if (!st.s) { st.s = aNew(ms); st.next = ms + 500; }
      if (ms >= st.next) {
        st.next = ms + 520;
        if (st.s.over) st.s = aNew(ms);
        else {
          var order = [rint(4), rint(4), 0, 1, 2, 3];
          for (var i = 0; i < order.length; i++) if (aMove(st.s, order[i], ms)) break;
        }
      }
      bg(ctx, w, h, t);
      var size = Math.min(w, h) * 0.86;
      aDraw(ctx, st.s, (w - size) / 2, (h - size) / 2, size, ms);
    }
  };

  /* ========================================================== 2. SERPENT */
  var S_N = 20;
  function snakeColor(i, n) {
    var k = n <= 1 ? 0 : i / (n - 1);
    var r = Math.round(lerp(232, 0, k)), g = Math.round(lerp(203, 229, k)), b = Math.round(lerp(116, 255, k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function drawSnakeBoard(ctx, x0, y0, size, n, body, food, t, dir) {
    var cell = size / n;
    rrect(ctx, x0, y0, size, size, 6);
    ctx.fillStyle = 'rgba(12,12,18,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(201,168,76,0.07)';
    for (var gy = 0; gy < n; gy++) for (var gx = 0; gx < n; gx++) {
      if ((gx + gy) % 2) continue;
      ctx.fillRect(x0 + gx * cell, y0 + gy * cell, cell, cell);
    }
    if (food) {
      var pulse = 0.75 + 0.25 * Math.sin(t * 6);
      var fx = x0 + (food.x + 0.5) * cell, fy = y0 + (food.y + 0.5) * cell, fr = cell * 0.38 * pulse;
      ctx.save();
      ctx.shadowColor = CYAN; ctx.shadowBlur = cell * 0.9;
      ctx.fillStyle = CYAN;
      ctx.beginPath();
      ctx.moveTo(fx, fy - fr); ctx.lineTo(fx + fr, fy); ctx.lineTo(fx, fy + fr); ctx.lineTo(fx - fr, fy);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (var i = body.length - 1; i >= 0; i--) {
      var sgm = body[i], pad = i === 0 ? cell * 0.06 : cell * 0.12;
      ctx.save();
      if (i === 0) { ctx.shadowColor = GOLD; ctx.shadowBlur = cell * 0.7; }
      rrect(ctx, x0 + sgm.x * cell + pad, y0 + sgm.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3);
      ctx.fillStyle = snakeColor(i, body.length);
      ctx.fill();
      ctx.restore();
    }
    if (body.length && dir) {
      var hd = body[0], cx = x0 + (hd.x + 0.5) * cell, cy = y0 + (hd.y + 0.5) * cell;
      var px = -dir.y, py = dir.x;
      ctx.fillStyle = '#0a0a0f';
      for (var k = -1; k <= 1; k += 2) {
        ctx.beginPath();
        ctx.arc(cx + dir.x * cell * 0.16 + px * k * cell * 0.17, cy + dir.y * cell * 0.16 + py * k * cell * 0.17, cell * 0.075, 0, 6.283);
        ctx.fill();
      }
    }
  }
  var SERPENT = {
    id: 'serpent', name: 'SERPENT', tagline: 'Eat, grow, never touch', color: '#7ff0c8', glow: 'rgba(127,240,200,.3)',
    timed: true, help: 'ARROWS · WASD · SWIPE',
    aspect: function () { return 1; },
    bestLabel: function () { var b = getBest('serpent'); return b == null ? null : 'BEST LENGTH ' + b; },
    create: function (h) {
      var s, swipe = null;
      function placeFood() {
        var occ = {}, free = [];
        s.snake.forEach(function (p) { occ[p.x + ',' + p.y] = 1; });
        for (var y = 0; y < S_N; y++) for (var x = 0; x < S_N; x++) if (!occ[x + ',' + y]) free.push({ x: x, y: y });
        s.food = free.length ? free[rint(free.length)] : null;
      }
      function hud() {
        var b = getBest('serpent');
        h.hud('LENGTH ' + s.snake.length + (b != null ? ' · BEST ' + b : ''));
      }
      function restart() {
        s = { snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }], prev: null, dir: { x: 1, y: 0 },
              q: [], food: null, acc: 0, iv: 0.14, started: false, over: false };
        placeFood();
        h.clearMsg();
        hud();
      }
      function turn(dx, dy) {
        if (s.over || h.hasMsg()) return;
        var last = s.q.length ? s.q[s.q.length - 1] : s.dir;
        s.started = true;
        if ((last.x === -dx && last.y === -dy) || (last.x === dx && last.y === dy)) return;
        if (s.q.length < 3) s.q.push({ x: dx, y: dy });
      }
      function tick() {
        if (s.q.length) s.dir = s.q.shift();
        var hd = s.snake[0], nx = hd.x + s.dir.x, ny = hd.y + s.dir.y;
        var eat = s.food && nx === s.food.x && ny === s.food.y;
        var hit = nx < 0 || ny < 0 || nx >= S_N || ny >= S_N;
        var check = eat ? s.snake : s.snake.slice(0, -1);
        for (var i = 0; !hit && i < check.length; i++) if (check[i].x === nx && check[i].y === ny) hit = true;
        if (hit) {
          s.over = true;
          s.prev = null;
          offerBest('serpent', s.snake.length, false);
          hud();
          h.msg('COLLAPSED', 'Length ' + s.snake.length, [{ label: 'PLAY AGAIN', primary: true, fn: restart }]);
          h.announce('Game over. Length ' + s.snake.length);
          return;
        }
        s.prev = s.snake.map(function (p) { return { x: p.x, y: p.y }; });
        s.snake.unshift({ x: nx, y: ny });
        if (eat) {
          s.iv = Math.max(0.06, s.iv - 0.004);
          placeFood();
          offerBest('serpent', s.snake.length, false);
          if (s.snake.length >= 20) achieve(SERPENT);
          hud();
        } else s.snake.pop();
      }
      h.on(h.canvas, 'pointerdown', function (e) { swipe = { x: e.clientX, y: e.clientY }; });
      h.on(h.canvas, 'pointerup', function (e) {
        if (!swipe) return;
        var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        swipe = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
      });
      /* On-screen pad for touch: shown by CSS under (pointer:coarse). */
      var pad = el('div', 'oxa-dpad');
      [['up', 0, -1, 'Up'], ['left', -1, 0, 'Left'], ['down', 0, 1, 'Down'], ['right', 1, 0, 'Right']].forEach(function (d) {
        var b = el('button', 'oxa-ib oxa-pad-' + d[0]);
        b.type = 'button';
        b.setAttribute('aria-label', d[3]);
        b.appendChild(icon(d[0]));
        h.on(b, 'pointerdown', function (e) { e.preventDefault(); turn(d[1], d[2]); });
        h.on(b, 'click', function (e) { if (e.detail === 0) turn(d[1], d[2]); });
        pad.appendChild(b);
      });
      h.controls.appendChild(pad);
      restart();
      return {
        restart: restart,
        isActive: function () { return s.started && !s.over; },
        key: function (e) {
          var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
                    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] }[e.key];
          if (!m) return false;
          turn(m[0], m[1]);
          return true;
        },
        step: function (dt) {
          if (!s.started || s.over) return;
          s.acc += dt;
          while (s.acc >= s.iv && !s.over) { s.acc -= s.iv; tick(); }
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          var size = Math.min(w, hh) - 8, k = s.started && !s.over && s.prev ? clamp(s.acc / s.iv, 0, 1) : 1;
          var body = s.snake.map(function (p, i) {
            var f = s.prev ? (s.prev[i] || s.prev[s.prev.length - 1]) : p;
            return { x: lerp(f.x, p.x, k), y: lerp(f.y, p.y, k) };
          });
          drawSnakeBoard(ctx, (w - size) / 2, (hh - size) / 2, size, S_N, body, s.food, t / 1000, s.dir);
          if (!s.started && !h.hasMsg()) {
            txt(ctx, 'MOVE TO BEGIN', w / 2, hh / 2 + size * 0.2, Math.max(12, size * 0.04), GOLD, FM);
          }
        },
        _state: function () { return s; }
      };
    },
    attract: function (st, ctx, w, h, t) {
      var N = 12;
      function reset() {
        st.body = [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }];
        st.dir = { x: 1, y: 0 };
        st.food = { x: 8, y: 3 };
      }
      if (!st.body) { reset(); st.next = t; }
      if (t - st.next > 2) st.next = t;   /* resumed after a long pause: do not fast-forward */
      while (t >= st.next) {
        st.next += 0.12;
        var hd = st.body[0], best = null, bd = 1e9;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          if (d[0] === -st.dir.x && d[1] === -st.dir.y) return;
          var nx = hd.x + d[0], ny = hd.y + d[1];
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
          for (var i = 0; i < st.body.length - 1; i++) if (st.body[i].x === nx && st.body[i].y === ny) return;
          var dist = Math.abs(nx - st.food.x) + Math.abs(ny - st.food.y) + Math.random() * 0.5;
          if (dist < bd) { bd = dist; best = d; }
        });
        if (!best || st.body.length > 26) { reset(); continue; }
        st.dir = { x: best[0], y: best[1] };
        var n = { x: hd.x + best[0], y: hd.y + best[1] };
        st.body.unshift(n);
        if (n.x === st.food.x && n.y === st.food.y) {
          var tries = 0;
          do { st.food = { x: rint(N), y: rint(N) }; tries++; }
          while (tries < 50 && st.body.some(function (p) { return p.x === st.food.x && p.y === st.food.y; }));
        } else st.body.pop();
      }
      bg(ctx, w, h, t);
      var size = Math.min(w, h) * 0.88;
      drawSnakeBoard(ctx, (w - size) / 2, (h - size) / 2, size, N, st.body, st.food, t, st.dir);
    }
  };

  /* ====================================================== 3. ORACLE WORD */
  var ANSWERS = ('about above adult after again agree ahead alike alive allow alone along among anger angle angry ' +
    'apart apple apply arrow aside avoid aware basic beach begin being below bench birth black blank ' +
    'blend blind block board brain brave bread break brief bring broad brown brush build built burst ' +
    'cabin candy carry catch cause chain chair chart check chest chief child claim class clean clear ' +
    'climb clock close cloth cloud coast count court cover cream cross crowd curve daily dance depth ' +
    'digit doubt dream dress drink drive eager early earth eight empty enemy enjoy enter entry equal ' +
    'error event every exact exist extra faith false fence field fifth fight final flame flesh floor ' +
    'flour force forth found frame fresh front fruit giant given glass globe glory grade grain graph ' +
    'grass great green group guard guess guide happy heart heavy honor horse hotel house human image ' +
    'index inner joint judge juice knife label large laugh layer learn least level light lucky lunch ' +
    'magic major match metal meter might minor model money month motor mouse mouth music noise north ' +
    'ocean offer opera orbit order other outer owner paint paper party peace piano piece pilot pitch ' +
    'place plain plane plant plate point power press price pride prime prize proud queen quick quiet ' +
    'radio raise ranch range reach ready right river rough round route royal ruler scale scene score ' +
    'sense serve seven shade shape share sharp sheep shell shine shirt shore short sight skill sleep ' +
    'slide smile smoke snake solar solid solve sound south space speak speed spell spend staff stage ' +
    'stand start state steam steel stick still stone storm story stove straw study style sugar sweet ' +
    'table taste teach thank theme thick thing think three throw title topic total tower trace track ' +
    'trade trail train trial tribe trick truck trust truth uncle under union upper usual value vapor ' +
    'visit voice watch water whale wheat wheel white whole woman world worth wound write young youth').split(' ');
  var GUESS_BLOB = 'aaronabaciabackabateabbeyabbotabetsabhorabideablerabodeabortaboutaboveabuseabyssachedachesacidsacingacnesacornacresacridactedactoracuteadageadamsadaptaddedadderadeptadieuadiosadminadmitadobeadoptadoreadornadultadzesaerieaffixafireafootaforeafoulafteragainagateagaveagentagileagingaglowagonyagreeaheadaidedaidesailedaimedairedaislealackalarmalbumalderaleckalephalertalgaealiasalibialicealienalignalikealiveallahallanallayallenalleyallotallowalloyaloesaloftalohaalonealongaloofaloudalphaaltaralteraltos' +
    'alumsamassamazeamberambleamebaamendamigoaminoamissamityamongampleamplyamuckamuseangelangerangleangryanimeanionaniseankleannasannexannieannoyannulannumanodeanticanvilaortaapaceapartaphidapingapnicappleapplyaprilapronaptlyarborarcedardorareasarenaargonarguearisearmedarmoraromaarosearrayarrowarsonarubaasciiashenashesasianasideaskedaskewaspenaspicassayassesassetasterastiratlasatollatomsatoneatticaudioauditaugeraughtauntsautosavailavantaversavertavoidawaitawakeawardawareawashawaysawfulawokeaxialaxiom' +
    'axlesaxonsazurebabesbacksbaconbadgebadlybagelbaggybailsbaitsbakedbakerbakesbaledbalerbalesbalkyballsbalmybalsabanalbandsbandybanesbangsbanjobanksbarbsbardsbaredbarerbaresbargebarksbarnsbaronbarrybasalbasedbaserbasesbasicbasilbasinbasisbasksbassobastebatchbatedbathebathsbatonbawdybawlsbayedbayoubeachbeadsbeadybeaksbeamsbeansbeardbearsbeastbeatsbeausbeautbeechbeefsbeepsbeersbeetsbefitbeganbegetbeginbegunbeigebeingbelchbellebellsbellybelowbeltsbenchbendsberetberryberthberylbesetbestsbettybevelbible' +
    'bidedbidesbidetbiersbigotbikedbikesbilgebillsbillybindsbingebingobirchbirdsbirthbisonbitesblackbladeblairblakeblameblandblankblareblastblazebleakbleatbleedblendblessblestblimpblindblinkblissblitzbloatblobsblockblocsblogsblokeblondbloodbloomblotsblownblowsbluedbluerbluesbluffbluntblurbblursblurtblushboardboarsboastboatsbobbybodesbogeybogiebogusboilsbollsboltsbombsbondsbonedbonerbonesbongobongsbonnybonusboobybooedbooksboomsboostboothbootsbootyboozeboraxboredborerboresboricborneboronbosombossybough' +
    'boundboutsbowedbowelbowerbowiebowlsboxedboxerboxesbracebradsbragsbraidbrainbrakebrandbransbrashbrassbratsbravebravobrawlbrawnbraysbrazebreadbreakbreambreedbrevebrewsbrianbriarbribebrickbridebriefbrierbrimsbrinebringbrinkbrinybriskbroadbroilbrokebroncbroodbrookbroombrothbrownbrowsbrucebrungbruntbrushbrutebryanbucksbuddybudgebuffsbuggybuglebuildbuiltbulbsbulgebulgybulksbulkybullsbullybumpsbumpybunchbunksbunnybuntsbuoysburkeburlyburnsburntburroburrsburstbusedbusesbushybustsbuttebuttsbuxombuyerbylaw' +
    'bytescabincablecacaocachecacticadetcadrecafescagedcagescakedcakescallscalmscalyxcamelcameocampscanalcandycanedcanescannycanoecanoncanstcantocapedcapercapescaratcardscaredcarescaretcareycargocarlocarnecarolcarpscarrycartscarvecasedcasescaseycasiocaskscastecastscatchcatercausecavedcavescawedceasecedarcededcedescellocellscentschafechaffchainchairchalkchampchantchaoschapscharmchartchasechasmchatscheapcheatcheckcheekcheepcheerchefschesschestchevychewschewychickchidechiefchildchilechilichillchimechimp' +
    'chinachinechinkchinschipschirpchivechoirchokechopschordchorechosechowschrischuckchugschumschunkchurnchutecidercigarciliacinchcindycircaciscocitedcitescivetciviccivilclackclaimclampclamsclangclankclansclapsclaraclarkclashclaspclassclawsclayscleanclearcleatclefscleftclerkclickcliffclimbclingclinkclipscloakclockclodsclogsclompclonecloseclothclotscloudcloutcloveclownclubscluckcluedcluesclumpclungclunkcoachcoalscoastcoaticoatscobracoccicockscockycocoacocoscodedcodescodexcoedscohencohoscoilscoinscokes' +
    'coldscoliccolincoloncolorcoltscomascombocombscomercomescometcomfycomiccommaconchcondoconescongacongoconicconstcooedcookscookycoolscoonscoopscopedcopescopracopsecoralcordscoredcorescorkscornscornycorpscostacostscouchcoughcouldcountcoupecoupscourtcovercovescovetcoveycowedcowercowlscoylycoypucrabscrackcraftcragscraigcrampcramscranecrankcrapscrashcratecravecrawlcrazecrazycreakcreamcredocreedcreekcreepcrepecreptcresscrestcrewscribscriedcriercriescrimecrimpcrispcroakcrockcronecronycrookcrooncropscross' +
    'croupcrowdcrowncrowscrudecruelcruetcrumbcrushcrustcubedcubescubiccubitcuffscullscultscumincupidcurbscurdscuredcurescuriocurlscurlycurrycursecurvecurvycuspscutercutiecybercyclecyniccystsczarsczechdaddydailydairydaisydalesdallydamesdamnsdampsdancedandydannydareddaresdarksdarnsdartsdateddatesdatumdaubsdauntdaviddavisdawnsdazeddazesdeadsdealsdealtdeansdearsdearydeathdebtsdebugdebutdecaldecaydecksdecordecoydecrydeedsdeemsdeepsdeferdeigndeitydelaydelhidellsdeltadelvedemondemurdenimdensedentsdepotdepth' +
    'derbyderekdesksdeterdeveldevildevondeweydialsdianadianediarydiceddicesdickedidstdiegodietsdiffsdigitdikeddikesdillsdillydimesdimlydineddinerdinesdingydinkydintsdiodedirgedirksdirtsdirtydiscodiscsdisksditchdittydivandiveddiverdivesdizzydocksdodgedodosdoersdoffsdogiedogmadoilydoingdoleddolesdollsdollydoltsdomeddomesdonnadonordoomsdoorsdopeddopesdoseddosesdoteddotesdottydoubtdoughdousedoverdovesdowdydoweldownsdownydowrydozeddozendozesdraftdragsdraindrakedramadrankdrapedrawldrawndrawsdreaddreamdregs' +
    'dressdrieddrierdriesdriftdrilldrinkdripsdrivedrolldronedrooldroopdropsdrossdrovedrowndrugsdrumsdrunkdryerdrylydubaiducalducatducksductsdudesduelsduetsdukesdullsdullydummydumpsdumpyduncedunesdunksdunnodupeddupesdupledusksduskydustsdustydutchdwarfdwelldweltdyingdylaneagereagleearlsearlyearnseartheasedeaseleaseseateneatereavesebbedebonyebookechoseddieedgaredgededgeredgesedicteditseerieeggedegretegypteidereightejectekingelbowelderelectelegyelfineliteellenelliselopeeludeelveselvisemacsemailembedember' +
    'emeryemilyemirsemitsemptyenactendedendifendowenemaenemyenjoyenrolensueenterentryenvoyephodepicsepochepsonequalequiperaseerecterodeerrederroreruptessayessexesteretherethicethosethyletudeeurosevadeevansevenseventeveryevictevilsevokeexactexaltexamsexcelexertexileexistexitsexpelextolextraexulteyingeyriefablefacedfacesfacetfactofactsfadedfadesfailsfaintfairsfairyfaithfakedfakesfallsfalsefamedfancyfangsfaradfarcefaredfaresfarmsfastsfatalfatedfatesfattyfaultfaunafavorfawnsfearsfeastfeatsfeedsfeelsfeign' +
    'feintfellafellsfeltsfemurfencefernsfernyferryfetchfetedfetesfetusfeudsfeverfewerfiberfibrefiefsfieldfiendfieryfifesfifthfiftyfightfilchfiledfilesfiletfillsfillyfilmefilmsfilmyfilthfinalfinchfindsfinedfinerfinesfiordfiredfiresfirmsfirstfirthfishyfistsfitlyfivesfixedfixesfjordflagsflailflairflakeflakyflameflankflapsflareflashflaskflatsflawsflaysfleasfleckfleesfleetfleshflickfliedflierfliesflingflintflipsflirtflitsfloatflockfloesflogsfloodfloorflopsfloraflossflourfloutflownflowsfloydfluesflufffluid' +
    'flukeflungflunkflushfluteflybyflyerfoalsfoamsfoamyfocalfocusfogeyfoggyfoilsfoldsfoliofolksfollyfontsfoodsfoolsforayforcefordsforgeforgoforksformsforteforthfortsfortyforumfotosfoulsfoundfountfoursfowlsfoxedfoxesfoyerfrailframefrancfrankfraudfraysfreakfreedfreerfreesfreshfretsfriarfriedfriesfrillfriskfrockfrogsfrondfrontfrostfrothfrownfrozefruitfudgefuelsfuguefullyfumedfumesfundsfungifunkyfunnyfurlsfurorfurryfusedfusesfussyfuzzygablegailygainsgaitsgalasgalesgallsgambagamesgammagamutgangsgapedgapes' +
    'garbsgardegasesgaspsgatesgaudygaugegauntgaussgauzegauzygavelgawksgawkygayergaylygazedgazesgearsgeckogeesegenesgeniegenregentsgenusgeodegermsgetupghanaghostghoulgiantgiddygiftsgildsgillsgiltsgimmegirdsgirlsgirthgistsgivengivergivesgladeglandglareglassglazegleamgleanglennglensglideglintgloatglobegloomgloryglossgloveglowsgluedgluesglutsglyphgnashgnatsgnawsgnomegoadsgoalsgoatsgodlygoethgoinggoldsgolfsgollygonergongsgonnagoodsgoodygooeygoofygoonsgoosegoredgorgegottagougegourdgownsgrabsgracegradegrads' +
    'graftgraingramsgrandgrantgrapegraphgraspgrassgrategravegravygraysgrazegreatgreedgreekgreengreetgreysgridsgriefgrillgrimegrimygrindgrinsgripegripsgristgritsgroangroingroomgropegrossgroupgrovegrowlgrowngrowsgrubsgruelgruffgrumpgruntguardguessguestguideguildguileguiltguisegulchgulfsgullsgullygulpsgumbogummygunnyguppygushygustogustsgustygypsygyroshabithackshadsthaikuhailshairshairyhaitihallohallshaloshaltshalvehandshandyhangshappyhardyharemharesharmsharpsharryharshhaspshastehastyhatchhatedhateshauls' +
    'haunthavenhaveshavochawkshayeshazelhazesheadsheadyhealsheapsheardhearsheartheathheatsheaveheavyhedgeheedsheelsheftsheftyheirshelenhellohellshelmshelpshempshencehenryherbsherdsheresheronheroshertzhewedhexedhexeshideshighshikedhikerhikeshillshillyhiltshindshinduhingehintshippohippyhiredhireshitchhiveshoardhoaryhobbyhoboshockshoganhoistholdsholedholeshollyhomerhomeshomeyhondahonedhoneyhonkshonorhoodshoofshookshookyhoopshootshopedhopeshordehornshorsehosedhoseshostshotelhotlyhoundhourshousehovelhover' +
    'howdyhowlshowtohuffshuffyhugerhulkshullohullshumanhumidhumorhumphhumpshumpyhumushunchhunkshuntshurlshurryhurtshuskshuskyhutchhydrahyenahymenhymnsiciericilyicingiconsidahoidealideasidiomidiotidledidleridlesidolsidylliglooimageimamsimpelimplyinaneinboxincurindexindiaindieineptinertinferingotinkedinlayinletinnerinputinsetintelinterintroioniciraqiirateirishirkedironsironyisaacislamislesisletissueitalyitchyitemsiviesivoryjacksjacobjadedjailsjambsjamesjamiejanetjapanjasonjauntjawedjeansjeepsjeersjello' +
    'jellsjellyjennyjerksjerkyjerryjessejestsjesusjettyjeweljibedjibesjiffyjihadjimmyjingojohnsjoinsjointjoistjokedjokerjokesjollyjoltsjonesjoustjowlsjoycejudgejudosjuicejuicyjuliajuliejumbojumpsjumpyjunksjunkyjuntajurorjuteskaleskaratkarenkarmakathykatiekayakkeelskeepskeithkellykelpskennykenyakernskerryketchkevinkeyedkhakikickskillskilnskiltskindakindskingskinkskinkykioskkiteskittykleinknackknavekneadkneelkneesknellkneltknifeknitsknobsknockknollknotsknownknowskoalakodakkookykoreakrillkudoslabellabor' +
    'lacedlaceslacksladenladlelairslaitylakeslambslamedlamerlameslampslancelandslaneslankalankylapellapselarchlardslargelarkslarrylarvalaserlassolastslatchlaterlatexlathelathslatinlaudslaughlauralavaslaverlawnslaxlylayerleachleadsleafsleafyleaksleakyleansleantleapsleaptlearnleaseleashleastleaveledgeleechleedsleeksleersleftslegallemmalemmelemonlemurlendsleoneleperletupleveelevelleverlevislewislexusliarslibellibralicksliftslightlikedlikenlikeslilacliltslimbslimeslimitlimpslindalinedlinenlinerlineslingo' +
    'linkslintslinuxlionslispslistsliterlithelivedlivenliverliveslividllamalloydloadsloafsloamsloamyloansloathlobbylobeslocallockslocuslodeslodgeloessloftsloftyloganlogicloginlogosloinslollslollylonerlongslookslookyloomsloonsloopslooselootslopedlopeslopezlordsloresloserloseslotuslouislouselousyloutslovedloverloveslowedlowerlowlyloyallucaslucialucidlucksluckylullslumpslumpylunarlunchlungelungslurchluredluresluridlurkslustslustyluteslycoslyinglymphlynchlyreslyricmacromadammadlymagicmagmamaidsmailsmaims' +
    'mainemainsmaizemajormakermakesmalesmallsmaltamaltsmamasmambomammamammymanedmanesmangamangomangymaniamanicmanlymannamanormaplemarchmarcomardimaresmariamariemariomarksmarrymarshmartsmasksmasonmastsmatchmatedmatermatesmateymathsmaulsmauvemaximmaybemayormazdamazesmealsmealymeansmeantmeanymeatsmeatymebbemeccamedalmediamedicmeetsmeleemelonmeltsmemosmendsmenusmeowsmercymergemeritmerrymesasmessymetalmetedmetermetesmetremetromewedmeyermiamimicasmicromiddymidstmightmikesmilanmilermilesmilksmilkymillsmimic' +
    'mincemindsminedminerminesminimminksminormintsminusmiredmiresmirthmisermistsmistymitermitesmittsmixedmixermixesmoansmoatsmochamocksmodalmodelmodemmodesmoistmolarmoldsmoldymolesmoltsmommymoneymonicmonksmontemonthmoodsmoodymooedmoonsmooremoorsmoosemopedmopesmoralmoraymoresmornsmoronmosesmossymotelmotesmotetmothsmotifmotormottomouldmoundmountmournmousemousymouthmovedmovermovesmoviemowedmowermpegsmsgidmucksmucusmuddymuggymulchmulesmullsmultimummymumpsmunchmuralmurksmurkymusedmusesmushymusicmusksmusky' +
    'mustsmustymutedmutesmuttsmyersmyrrhmysqlmythsnadirnailsnaivenakednamednamesnancynapesnasalnastynatalnattynavalnavelnearsnecksneedsneedyneighneonsnepalnervenestsnevernewelnewernewlynewsynewtsnicernichenicksnieceniftynigernightnikonninesninthnoblenoblynodesnoisenoisynokianomadnooksnoonsnoosenormsnorthnosednosesnotchnotednotesnotrenounsnovaenovasnovelnudgenukesnursenuttynylonnymphoakenoasesoasisoathsobeseobeysoboesoccuroceanochreoctalodderoddlyodorsofferoftenogresoiledokapiokaysoldenolderoliveomaha' +
    'omegaomensomitsoniononsetoomphoozedoozesopalsopensoperaopiumoptedopticorbitorderorganorlonoscarotherotteroughtounceoustsoutdoouterovalsovaryovensovertovuleowingownedowneroxideozonepacedpacerpacespackspactspaddypadrepaganpagedpagespailspainspaintpairspaledpalerpalespallspalmspalsypandapanelpanespangspanicpansypantspapalpapaspapawpaperpapuaparchparedparesparisparkaparksparrypartspartypastapastepastypatchpathspatiopattypausepavedpavespawedpawnspaxilpeacepeachpeakspealspearlpearspeatypecanpeckspedal' +
    'peekspeelspeepspeerspeltspenalpencepennypeonspeonypeppyperchperilperksperkyperryperthpeskypesospestspetalpeterpetitpettypeweephasephloxphonephonyphotophpbbpianopicaspickspickypiecepierspietypiggypigmypikespiledpilespillspilotpimpspinchpinedpinespineypinkspinkypintopintspiouspipedpiperpipespiquepitchpithspithypivotpixelpixiepizzaplaceplaidplainplaitplaneplankplansplantplateplaysplazapleadpleaspleatpliedpliesplodsplopsplotsplowspluckplugsplumbplumeplumpplumsplushpoachpoemspoetspointpoisepokedpoker' +
    'pokespokeypolarpoledpolespoliopolkapollspolyppondspoochpoolspopespoppyporchporedporesportsposedposespossepostspouchpoundpourspoutspowerprankprayspreenpresspreyspriceprickpridepriedpriesprimaprimeprintpriorprismprivyprizeprobeprodspromoproneprongproofpropsproseproudproveprowlprowsproxyprudeprunepsalmpuckspudgypuffspuffypullspulpspulpypulsepumaspumpspunchpunkspuntspupaepupaspupilpuppypureepurerpurgepurrspurseputtsputtypygmypylonpyresqatarquackquadsquaffquailquakequalmquartquaysqueenquellqueryquest' +
    'queuequickquietquillquiltquintquipsquipuquirequirkquirtquitequitsquotaquotequothrabbirabidracedracerracesracksradarradiiradioradixradonraftsragedragesraidsrailsrainsrainyraiserajahrakedrakesrallyralphrampsranchrandyrangerangyranksrapidrarerraspsratedratesratiorattyravedravelravenravesrayonrazedrazesrazorreachreactreadsreadyrealmrealsreamsreapsrearsrebelrebutrecurreedsreedyreefsreelsreferrefitregalrehabreignreinsrelaxrelayrelicremitremixrendsrenewrentsrepayrepelreplyresetresinrestsretrorevelrevue' +
    'rhinorhoderhymerickyriderridesridgerifleriftsrightrigidrigorriledrillsrindsringsrinksrinseriotsripenriperrisenriserrisesrisksriskyritesrivalriverrivetroachroadsroamsroarsroastrobedrobesrobinrobotrocksrockyrodeorogerroguerolesrollsromanrompsrondoroofsrooksroomsroomyroostrootsropedroperropesrosesrosinrotorrougeroughroundrouserouteroutsrovedroverrovesrowdyrowedroyalruddyruderruffsrugbyruinsruledrulerrulesrummyrumorrumpsrunesrungsrunicruntsruntyrupeeruralrusesrustsrustysabersablesabresackssadlysafer' +
    'safessagassagemsagessailssaintsaithsakessaladsalemsalessallysalonsaltssaltysalvesalvosambasamoasandssandysanersantasanyosarahsarissassysatinsatyrsaucesaucysaudisautesavedsaversavessavorsavvysawedsbjctscabsscadsscaldscalescalpscalyscampscansscantscarescarfscarsscaryscenescentschwascoffscoldscoopscootscopescorescornscottscourscoutscowlscowsscramscrapscrewscripscrubscubascuffscullscumssealsseamssearsseatssectssedansedersedgeseedsseedyseeksseemsseepsseersseineseizesellssendssenseserfssergeserifserum' +
    'serveservosetupsevenseversewedsewersexesshackshadeshadyshaftshakeshakyshaleshallshaltshameshamsshankshapesharesharksharpshaveshawlsheafshearshedssheensheepsheersheetsheikshelfshellshiedshiesshiftshimsshineshinsshinyshipsshirkshirtshoalshockshoesshoneshookshoosshootshopsshoreshornshortshotsshoutshoveshownshowsshowyshredshrewshrubshrugshuckshunsshuntshushshutsshyershylysidedsidessidlesiegesievesiftssighssightsigmasignssilkssilkysillssillysilossiltssimonsincesinewsingesinghsingssinkssinussiredsiree' +
    'sirensiressirupsisalsissysitedsitessixessixthsixtysizedsizesskateskeetskeinskewsskiedskierskiesskiffskillskimpskimsskinsskipsskirtskitsskoalskulkskullskunkskypeslabsslackslagsslainslakeslamsslangslantslapsslashslateslatsslayssledssleeksleepsleetsleptslewssliceslickslideslimeslimyslingslinkslipsslitsslobssloopslopeslopssloshslothslotsslowssluesslugsslumpslumsslungslunkslurpslursslushslyerslylysmacksmallsmartsmashsmearsmellsmeltsmilesmirksmitesmithsmocksmokesmokysmotesnacksnagssnailsnakesnakysnaps' +
    'snaresnarlsneaksneersniffsnipesnipssnobssnoopsnoresnortsnoutsnowssnowysnubssnuffsoakssoapssoapysoarssobersockssodassofassoggysoilssolarsoledsolessolidsolossolvesonarsongssonicsonnysootssootysorersoressorrysortasortssoulssoundsoupssoupysourssouthsowedsowerspacespadespainspakespankspanssparcsparesparksparsspasmspatespatsspawnspeakspearspeckspecsspeedspellspeltspendspentspermspewsspicespicyspiedspiesspikespikyspillspiltspinespinsspinyspirespitespitssplatsplitspoilspokespookspoolspoonsporesportspots' +
    'spoutsprayspreesprigspritspudsspunkspurnspursspurtsquabsquadsquatsquawsquidstabsstackstaffstagestagsstaidstainstairstakestalestalkstallstampstandstankstarestarkstarsstartstatestatsstavestayssteadsteakstealsteamsteedsteelsteepsteersteinstemsstepssternstevestewsstickstiesstiffstilestillstiltstingstinkstintstirsstockstoicstolestompstonestonystoodstoolstoopstopsstorestorkstormstorystoutstovestowsstrapstrawstraystrepstrewstripstrumstrutstubsstuckstudsstudystuffstumpstungstunkstunsstuntstylesuavesucks' +
    'sudansuedesuetssugarsuingsuitesuitssulfasulkssulkysumacsunnysunupsupersurersurfssurgesurlysusanswabsswampswankswansswapsswardswarmswashswathswatsswaysswearsweatsweepsweetswellsweptswiftswillswimsswineswingswipeswirlswishswissswoonswoopswordsworeswornswungsynodsyriasyruptabbytabletabootabortacittackstacostaffytahoetailstainttakentakertakestalcstalestalkstallytalontamedtamertamestamiltampatangotangytankstapedtapertapestapirtardytarestarrytartstaskstastetastytaunttawnytaxedtaxestaxisteachtealsteams' +
    'tearsteaseteddyteemsteensteenyteethtellstellytempotempstempttendstenontenortensetenthtentstepeetepidtermsternsterraterryterseteststestytexastextsthankthatsthawsthefttheirthemetherethesethetathickthiefthighthinethingthinkthinsthirdthongthornthosethreethrewthrobthrowthudsthugsthumbthumpthymetiaratibiatickstidaltidestierstigertighttildetiledtilestillstiltstimedtimertimestimidtinestingetinnytintstionstippytipsytiredtirestitantitertithetitletoadstoasttodaytogastoilstokentokyotollstombstommytonaltoned' +
    'tonertonestongstonictoolstoothtootstopaztopictorchtorsototaltotedtotemtotestouchtoughtourstovestowedtoweltowertownstoxictoxintoyedtracetracktracttracytradetrailtraintraittramptramstranstrapstrashtrawltraystreadtreattreedtreestrekstrendtresstriadtrialtribetricetricktriedtriestriketrilltrimstriostripetripstritetrolltrooptrothtrotstrouttrucetrucktruertrulytrunktrusstrusttruthtsarstubastubbytubertubestuckstuftstuliptulletulsatummytumortunastunedtunertunestunicturboturfsturnstuskstutortwaintwangtweed' +
    'twicetwigstwikitwilltwinetwinstwirltwisttyingtylertypedtypesudderulcerultraumberumbraumpedunaryunbaruncleuncutunderundidundueunfitunifyunionuniteunitsunityuntieuntilunwedunzipuppedupperupseturbanurgedurgesurineusageusersusherusingusualusurputilsuttervaguevalesvaletvalidvalorvaluevalvevanesvaporvasesvaultvauntvealsveersvegasveilsveinsveldtvendsvenomventsvenueverbsverdevergeversaversevervevestsvexedvexesvialsvicarvicesvideoviewsvigilvigorvilervillavinesvinylviolaviperviralvireovirusvisasvisesvisit' +
    'visorvistavitaevitalvitrovividvixenvocalvodkavoguevoicevoidsvoilavoilevoltsvolvovomitvotedvotervotesvouchvowedvowelvsnetvyingwadedwadeswadiswaferwaftswagedwagerwageswagonwaifswailswaistwaitswaivewakedwakenwakeswaleswalkswallswaltzwandswanedwaneswanlywannawantawantswardswareswarmswarnswarpswartswartywaspswastewatchwaterwattswavedwaverwaveswaxedwaxenwaxerwaxeswayneweanswearswearyweavewedgeweedsweedyweeksweepsweighweirdwelchweldswellswelshweltswenchwendswendywhackwhalewharfwhatswheatwheelwhelkwhelp' +
    'wherewhetswheyswhichwhiffwhilewhimswhinewhipswhirlwhirrwhirswhiskwhistwhitewhitswhizzwholewhompwhoopwhosewickswidenwiderwidowwidthwieldwildswileswileywillswiltswincewinchwindswindywineswingswinkswipedwiperwipeswiredwireswiserwispswispywitchwittywiveswokenwomanwombswomenwoodswoodywooedwoofswoolswoolywoozywordswordyworksworldwormswormyworryworseworstworthwouldwoundwovenwowedwrackwrapswrathwreakwreckwrenswrestwringwristwritewritswrongwrotewrungwrylyxanaxxenonxeroxxhtmlxylemyachtyahooyanksyardsyarns' +
    'yawnsyearnyearsyeastyellayellsyelpsyemenyesesyieldyodelyogasyokedyokelyokesyolksyoungyoursyouthyowlsyuccayukonyulesyummyzdnetzealszebrazeroszestszonedzoneszoomszowie';
  var GUESS_SET = null;
  function validWord(w) {
    if (!GUESS_SET) {
      GUESS_SET = {};
      for (var i = 0; i + 5 <= GUESS_BLOB.length; i += 5) GUESS_SET[GUESS_BLOB.substr(i, 5)] = 1;
      ANSWERS.forEach(function (a) { GUESS_SET[a] = 1; });
    }
    return GUESS_SET[String(w).toLowerCase()] === 1;
  }
  /* Wordle-style evaluation with correct duplicate handling: exact matches are
     taken first, then each remaining guess letter is "present" only while the
     answer still has an unconsumed copy of it. c = correct, p = present,
     a = absent. scoreGuess('papal','apple') -> p p c a p. */
  function scoreGuess(guess, answer) {
    guess = String(guess).toLowerCase(); answer = String(answer).toLowerCase();
    var res = ['a', 'a', 'a', 'a', 'a'], left = {}, i;
    for (i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) res[i] = 'c';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (i = 0; i < 5; i++) {
      if (res[i] === 'c') continue;
      if (left[guess[i]] > 0) { res[i] = 'p'; left[guess[i]]--; }
    }
    return res;
  }
  var DAILY_PERM = shuffle(ANSWERS.map(function (_, i) { return i; }), mulberry32(917170));
  function dayKey(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }
  function dailyAnswer(d) {
    d = d || new Date();
    var days = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
    var n = ANSWERS.length, k = ((days % n) + n) % n;
    return ANSWERS[DAILY_PERM[k]];
  }
  var O_COL = { c: GOLD, p: '#0b8fa3', a: '#24232c' };
  var O_TXT = { c: '#0a0a0f', p: '#ffffff', a: '#9d998a' };
  /* rows: [{w:'crane', r:['c',...] or null, at: revealStart(ms) }], cur: typed letters */
  function oDraw(ctx, rows, cur, curRow, x0, y0, bw, bh, t, shake, popAt) {
    var gap = Math.max(4, bw * 0.02);
    var tile = Math.min((bw - gap * 4) / 5, (bh - gap * 5) / 6);
    var ox = x0 + (bw - (tile * 5 + gap * 4)) / 2, oy = y0 + (bh - (tile * 6 + gap * 5)) / 2;
    for (var r = 0; r < 6; r++) {
      var row = rows[r], sx = 0;
      if (r === curRow && shake && t - shake < 420) sx = Math.sin((t - shake) / 30) * tile * 0.12 * (1 - (t - shake) / 420);
      for (var c = 0; c < 5; c++) {
        var x = ox + c * (tile + gap) + sx, y = oy + r * (tile + gap);
        var ch = row ? row.w[c] : (r === curRow ? (cur[c] || '') : '');
        var state = null, scaleY = 1;
        if (row && row.r) {
          var start = row.at + c * 250, k = clamp((t - start) / 360, 0, 1);
          if (k <= 0) state = null;
          else if (k < 0.5) { scaleY = 1 - k * 2; }
          else { state = row.r[c]; scaleY = (k - 0.5) * 2; }
          if (k >= 1) { state = row.r[c]; scaleY = 1; }
        }
        var sc = 1;
        if (!row && r === curRow && c === cur.length - 1 && popAt && t - popAt < 110) sc = 1 + 0.1 * Math.sin(Math.PI * (t - popAt) / 110);
        var hh2 = tile * scaleY * sc, ww = tile * sc;
        var tx = x + (tile - ww) / 2, ty = y + (tile - hh2) / 2;
        ctx.save();
        rrect(ctx, tx, ty, ww, Math.max(0.5, hh2), tile * 0.08);
        if (state) {
          if (state === 'c') { ctx.shadowColor = GOLD; ctx.shadowBlur = tile * 0.3; }
          ctx.fillStyle = O_COL[state];
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(14,14,20,0.92)';
          ctx.fill();
          ctx.strokeStyle = ch ? 'rgba(232,203,116,0.75)' : 'rgba(201,168,76,0.25)';
          ctx.lineWidth = ch ? 2 : 1;
          ctx.stroke();
        }
        ctx.restore();
        if (ch && scaleY > 0.15) {
          ctx.save();
          ctx.translate(x + tile / 2, y + tile / 2);
          ctx.scale(sc, scaleY * sc);
          txt(ctx, ch.toUpperCase(), 0, tile * 0.03, tile * 0.56, state ? O_TXT[state] : INK, '700 ' + FR);
          ctx.restore();
        }
      }
    }
  }
  var ORACLE = {
    id: 'oracle', name: 'ORACLE WORD', tagline: 'Five letters, six tries', color: CYAN, glow: 'rgba(0,229,255,.3)',
    timed: false, help: 'TYPE · ENTER · DEL',
    aspect: function () { return 5 / 6; },
    bestLabel: function () { var b = getBest('oracle'); return b == null ? null : 'BEST ' + b + '/6'; },
    create: function (h) {
      var s, mode = 'daily', keys = {}, modeBtns = {};
      var SAVE = 'omega_arcade_oracle';
      var REVEAL = 250 * 4 + 420;
      function loadDaily() {
        try {
          var v = JSON.parse(localStorage.getItem(SAVE) || 'null');
          if (v && v.day === dayKey() && Array.isArray(v.guesses)) return v.guesses;
        } catch (e) { /* ignore */ }
        return [];
      }
      function saveDaily() {
        if (mode !== 'daily') return;
        try {
          localStorage.setItem(SAVE, JSON.stringify({ day: dayKey(), guesses: s.rows.map(function (r) { return r.w; }) }));
        } catch (e) { /* ignore */ }
      }
      function hud() {
        var b = getBest('oracle');
        h.hud((mode === 'daily' ? 'DAILY ' + dayKey() : 'PRACTICE') + (b != null ? ' · BEST ' + b + '/6' : ''));
      }
      function paintKeys() {
        var st = {}, rank = { a: 1, p: 2, c: 3 };
        s.rows.forEach(function (row) {
          if (!row.r || !row.shown) return;
          for (var i = 0; i < 5; i++) {
            var L = row.w[i], v = row.r[i];
            if (!st[L] || rank[v] > rank[st[L]]) st[L] = v;
          }
        });
        Object.keys(keys).forEach(function (k) {
          var v = st[k.toLowerCase()];
          if (v) keys[k].setAttribute('data-s', v); else keys[k].removeAttribute('data-s');
        });
      }
      function finish(row, instant) {
        var won = row.w === s.answer, game = s;
        if (won || s.rows.length >= 6) s.done = true;
        /* The daily word is one of omega-daily.js's rituals; tell it the day's
           puzzle is finished (also when restored from today's saved guesses). */
        if (s.done && mode === 'daily') {
          try {
            document.dispatchEvent(new CustomEvent('omega-arcade:daily', {
              detail: { game: 'oracle', day: dayKey(), won: won, guesses: s.rows.length }
            }));
          } catch (e) { /* old browser */ }
        }
        h.later(function () {
          if (game !== s) return;   /* a new puzzle started meanwhile */
          row.shown = true;
          paintKeys();
          if (won) {
            var n = s.rows.length;
            if (!instant) { offerBest('oracle', n, true); achieve(ORACLE); }
            hud();
            h.msg(['GENIUS', 'MAGNIFICENT', 'IMPRESSIVE', 'SPLENDID', 'GREAT', 'PHEW'][n - 1],
              'Solved in ' + n + '/6', [{ label: 'PRACTICE WORD', primary: true, fn: function () { newGame('practice'); } }]);
            h.announce('Solved in ' + n + ' of 6');
          } else if (s.rows.length >= 6) {
            h.msg('THE ORACLE SPOKE', 'The word was ' + s.answer.toUpperCase(),
              [{ label: 'PRACTICE WORD', primary: true, fn: function () { newGame('practice'); } }]);
            h.announce('Out of guesses. The word was ' + s.answer);
          }
        }, instant ? 0 : REVEAL);
      }
      function newGame(m) {
        mode = m || mode;
        s = { answer: mode === 'daily' ? dailyAnswer() : ANSWERS[rint(ANSWERS.length)],
              rows: [], cur: '', done: false, shake: 0, pop: 0, lockUntil: 0 };
        h.clearMsg();
        if (mode === 'daily') {
          var past = loadDaily();
          for (var i = 0; i < past.length && i < 6 && !s.done; i++) {
            var w = String(past[i] || '').toLowerCase();
            if (!/^[a-z]{5}$/.test(w)) break;
            var row = { w: w, r: scoreGuess(w, s.answer), at: -1e9, shown: true };
            s.rows.push(row);
            if (w === s.answer || s.rows.length >= 6) finish(row, true);
          }
        }
        Object.keys(modeBtns).forEach(function (k) { modeBtns[k].setAttribute('aria-pressed', String(k === mode)); });
        paintKeys();
        hud();
      }
      function type(k) {
        if (s.done || h.hasMsg() || now() < s.lockUntil) return;
        if (k === 'ENTER') { submit(); return; }
        if (k === 'DEL') { s.cur = s.cur.slice(0, -1); return; }
        if (/^[A-Z]$/.test(k) && s.cur.length < 5) { s.cur += k.toLowerCase(); s.pop = now(); }
      }
      function submit() {
        if (s.cur.length < 5) { s.shake = now(); h.toast('Five letters'); return; }
        if (!validWord(s.cur)) { s.shake = now(); h.toast('Not in the word list'); h.announce('Not in the word list'); return; }
        var row = { w: s.cur, r: scoreGuess(s.cur, s.answer), at: now(), shown: false };
        s.rows.push(row);
        s.cur = '';
        s.lockUntil = now() + REVEAL - 60;
        saveDaily();
        var names = { c: 'correct', p: 'present', a: 'absent' };
        h.announce(row.w.toUpperCase().split('').map(function (L, i) { return L + ' ' + names[row.r[i]]; }).join(', '));
        if (row.w === s.answer || s.rows.length >= 6) finish(row, false);
        else {
          var game = s;
          h.later(function () { if (game === s) { row.shown = true; paintKeys(); } }, REVEAL);
        }
      }
      /* controls: mode switch + on-screen keyboard */
      var modes = el('div', 'oxa-row');
      [['daily', 'DAILY'], ['practice', 'PRACTICE']].forEach(function (m) {
        var b = el('button', 'oxa-btn', m[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        h.on(b, 'click', function () { newGame(m[0]); });
        modeBtns[m[0]] = b;
        modes.appendChild(b);
      });
      h.controls.appendChild(modes);
      var kb = el('div', 'oxa-kb');
      kb.setAttribute('role', 'group');
      kb.setAttribute('aria-label', 'Keyboard');
      ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'].forEach(function (rowS) {
        var row = el('div', 'oxa-kr');
        rowS.split('').forEach(function (ch) {
          var k = ch === '+' ? 'ENTER' : ch === '-' ? 'DEL' : ch;
          var b = el('button', 'oxa-key' + (k.length > 1 ? ' oxa-wide' : ''), k);
          b.type = 'button';
          b.tabIndex = -1;
          b.setAttribute('aria-label', k === 'DEL' ? 'Delete letter' : k === 'ENTER' ? 'Submit guess' : k);
          /* Keep focus on the board: a focused on-screen key would otherwise
             re-fire on the next physical Enter. */
          h.on(b, 'mousedown', function (e) { e.preventDefault(); });
          h.on(b, 'click', function () { type(k); });
          if (k.length === 1) keys[k] = b;
          row.appendChild(b);
        });
        kb.appendChild(row);
      });
      h.controls.appendChild(kb);
      newGame('daily');
      return {
        restart: function () { newGame('practice'); },
        key: function (e) {
          if (e.key === 'Enter') { type('ENTER'); return true; }
          if (e.key === 'Backspace') { type('DEL'); return true; }
          if (/^[a-zA-Z]$/.test(e.key)) { type(e.key.toUpperCase()); return true; }
          return false;
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          oDraw(ctx, s.rows, s.done ? '' : s.cur, s.done ? -1 : s.rows.length, 6, 6, w - 12, hh - 12, now(), s.shake, s.pop);
        },
        _state: function () { return s; }
      };
    },
    attract: function (st, ctx, w, h, t) {
      var ans = 'omega', words = ['stare', 'globe', 'omega'];
      var cyc = 7.5, k = t % cyc, base = t - k;
      var rows = words.map(function (wd, i) {
        return { w: wd, r: scoreGuess(wd, ans), at: (base + 0.4 + i * 1.6) * 1000 };
      }).filter(function (r) { return r.at <= t * 1000 + 50; });
      bg(ctx, w, h, t);
      var bh = h * 0.92, bw = bh * 5 / 6;
      if (bw > w * 0.92) { bw = w * 0.92; bh = bw * 6 / 5; }
      oDraw(ctx, rows, '', -1, (w - bw) / 2, (h - bh) / 2, bw, bh, t * 1000, 0, 0);
    }
  };

  /* ==================================================== 4. ZODIAC MEMORY */
  var ELEM = ['#ff8a4c', GOLD_HI, CYAN, '#8f9bff'];   /* fire, earth, air, water */
  function zGlyph(i) { return String.fromCharCode(0x2648 + i) + VS15; }
  function zDrawCard(ctx, x, y, w, h, sign, f, done, t, focus) {
    var sx = Math.abs(Math.cos(f * Math.PI));
    var face = f > 0.5;
    var cw = w * Math.max(0.02, sx), cx = x + (w - cw) / 2;
    ctx.save();
    if (face && done) { ctx.shadowColor = ELEM[sign % 4]; ctx.shadowBlur = w * 0.25; }
    rrect(ctx, cx, y, cw, h, Math.min(w, h) * 0.1);
    if (face) {
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#16151f'); g.addColorStop(1, '#0b0b12');
      ctx.fillStyle = g;
    } else {
      var g2 = ctx.createLinearGradient(cx, y, cx + cw, y + h);
      g2.addColorStop(0, '#3a2f17'); g2.addColorStop(1, '#14110a');
      ctx.fillStyle = g2;
    }
    ctx.fill();
    ctx.lineWidth = focus ? 2.5 : 1;
    ctx.strokeStyle = focus ? CYAN : (face ? ELEM[sign % 4] : 'rgba(201,168,76,0.6)');
    ctx.stroke();
    ctx.restore();
    if (sx < 0.08) return;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(sx, 1);
    var m = Math.min(w, h);
    if (face) {
      txt(ctx, zGlyph(sign), 0, m * 0.02, m * 0.52, ELEM[sign % 4], FSYM);
    } else {
      ctx.strokeStyle = 'rgba(232,203,116,0.55)';
      ctx.lineWidth = 1;
      var rr = m * 0.26;
      ctx.beginPath();
      ctx.moveTo(0, -rr); ctx.lineTo(rr, 0); ctx.lineTo(0, rr); ctx.lineTo(-rr, 0); ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.55, 0, 6.283);
      ctx.stroke();
      txt(ctx, 'Ω', 0, m * 0.01, m * 0.2, GOLD, FD);
    }
    ctx.restore();
  }
  var ZODIAC = {
    id: 'zodiac', name: 'ZODIAC MEMORY', tagline: 'Twelve pairs of signs', color: '#8f9bff', glow: 'rgba(143,155,255,.3)',
    timed: true, help: 'TAP · ARROWS + ENTER',
    aspect: function (W, H) { return W / H > 1.15 ? 6 / 4 * 0.86 : 4 / 6 / 0.86; },
    bestLabel: function () { var b = getBest('zodiac'); return b == null ? null : 'BEST ' + b + ' MOVES'; },
    create: function (h) {
      var s, layout = null, kbd = false;
      function hud() {
        var b = getBest('zodiac');
        h.hud('MOVES ' + s.moves + ' · ' + fmtTime(s.time) + (b != null ? ' · BEST ' + b : ''));
      }
      function restart() {
        var deck = [];
        for (var i = 0; i < 12; i++) deck.push(i, i);
        shuffle(deck);
        s = { cards: deck.map(function (sg) { return { s: sg, up: false, done: false, f: 0 }; }),
              first: -1, second: -1, lock: 0, moves: 0, time: 0, started: false, won: false, cur: 0, lastHud: -1 };
        h.clearMsg();
        hud();
      }
      function flip(i) {
        if (s.won || h.hasMsg() || i < 0 || i >= 24) return;
        if (s.second >= 0) return;   /* waiting for a mismatch to turn back */
        var c = s.cards[i];
        if (c.up || c.done) return;
        s.started = true;
        c.up = true;
        if (s.first < 0) { s.first = i; return; }
        s.second = i;
        s.moves++;
        var a = s.cards[s.first];
        if (a.s === c.s) {
          a.done = c.done = true;
          s.first = s.second = -1;
          h.announce('Pair found');
          if (s.cards.every(function (q) { return q.done; })) {
            s.won = true;
            offerBest('zodiac', s.moves, true);
            achieve(ZODIAC);
            hud();
            h.later(function () {
              h.msg('ALIGNED', s.moves + ' moves · ' + fmtTime(s.time), [{ label: 'PLAY AGAIN', primary: true, fn: restart }]);
            }, 450);
            h.announce('All pairs found in ' + s.moves + ' moves');
          }
        } else s.lock = 0.8;
        hud();
      }
      function hit(px, py) {
        if (!layout) return -1;
        for (var i = 0; i < 24; i++) {
          var r = layout.rects[i];
          if (px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3]) return i;
        }
        return -1;
      }
      h.on(h.canvas, 'click', function (e) {
        var b = h.canvas.getBoundingClientRect();
        kbd = false;
        flip(hit(e.clientX - b.left, e.clientY - b.top));
      });
      restart();
      return {
        restart: restart,
        isActive: function () { return s.started && !s.won; },
        key: function (e) {
          var cols = layout ? layout.cols : 4;
          var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
          if (d != null) { kbd = true; s.cur = clamp(s.cur + d, 0, 23); return true; }
          if (e.key === 'Enter' || e.key === ' ') { kbd = true; flip(s.cur); return true; }
          return false;
        },
        step: function (dt) {
          if (s.started && !s.won) {
            s.time += dt;
            if (Math.floor(s.time) !== s.lastHud) { s.lastHud = Math.floor(s.time); hud(); }
          }
          if (s.lock > 0) {
            s.lock -= dt;
            if (s.lock <= 0) {
              s.cards[s.first].up = false; s.cards[s.second].up = false;
              s.first = s.second = -1;
            }
          }
          s.cards.forEach(function (c) {
            var target = c.up || c.done ? 1 : 0;
            c.f = target > c.f ? Math.min(1, c.f + dt * 4.5) : Math.max(0, c.f - dt * 4.5);
          });
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          var wide = w / hh > 1.1, cols = wide ? 6 : 4, rows = wide ? 4 : 6;
          var gap = Math.max(5, Math.min(w, hh) * 0.018);
          var cw = (w - gap * (cols + 1)) / cols, ch = (hh - gap * (rows + 1)) / rows;
          layout = { cols: cols, rects: [] };
          for (var i = 0; i < 24; i++) {
            var cx = gap + (i % cols) * (cw + gap), cy = gap + Math.floor(i / cols) * (ch + gap);
            layout.rects.push([cx, cy, cw, ch]);
            var c = s.cards[i];
            zDrawCard(ctx, cx, cy, cw, ch, c.s, c.f, c.done, t, kbd && s.cur === i);
          }
        },
        _state: function () { return s; },
        _rect: function (i) { return layout && layout.rects[i]; }
      };
    },
    attract: function (st, ctx, w, h, t) {
      if (!st.cards) {
        var d = [];
        for (var i = 0; i < 12; i++) d.push(i);
        st.cards = shuffle(d).map(function (sg) { return { s: sg, f: 0, target: 0 }; });
        st.next = t; st.last = t;
      }
      var dt = clamp(t - st.last, 0, 0.1); st.last = t;
      if (t >= st.next) {
        st.next = t + 0.45;
        var c = st.cards[rint(12)];
        c.target = c.target ? 0 : 1;
      }
      bg(ctx, w, h, t);
      var cols = 4, rows = 3, gap = Math.min(w, h) * 0.04;
      var cw = (w - gap * (cols + 1)) / cols, ch = (h - gap * (rows + 1)) / rows;
      st.cards.forEach(function (cd, i) {
        cd.f = cd.target > cd.f ? Math.min(1, cd.f + dt * 4) : Math.max(0, cd.f - dt * 4);
        zDrawCard(ctx, gap + (i % cols) * (cw + gap), gap + Math.floor(i / cols) * (ch + gap), cw, ch, cd.s, cd.f, cd.f > 0.99, t, false);
      });
    }
  };

  /* ==================================================== 5. AEGIS BREAKER */
  var B_W = 480, B_H = 640, B_R = 7, B_PY = 596, B_PH = 12;
  function bBricks(L) {
    var cols = 10, rows = Math.min(4 + L, 9), bw = (B_W - 40) / cols, bh = 20, out = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var mod = L % 3;
      if (mod === 2 && (r + c) % 2 === 1 && r > 0) continue;
      if (mod === 0 && Math.abs(c - 4.5) + Math.abs(r - (rows - 1) / 2) > rows / 2 + 2.5) continue;
      var hits = r < Math.min(L - 1, 3) ? 2 : 1;
      out.push({ x: 20 + c * bw + 2, y: 70 + r * (bh + 6), w: bw - 4, h: bh, hits: hits, max: hits, row: r, rows: rows });
    }
    return out;
  }
  function bColor(b) {
    var k = b.rows <= 1 ? 0 : b.row / (b.rows - 1);
    var r = Math.round(lerp(232, 0, k)), g = Math.round(lerp(190, 229, k)), bl = Math.round(lerp(90, 255, k));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function bCollideBrick(ball, br) {
    var cx = clamp(ball.x, br.x, br.x + br.w), cy = clamp(ball.y, br.y, br.y + br.h);
    var dx = ball.x - cx, dy = ball.y - cy;
    if (dx * dx + dy * dy > B_R * B_R) return false;
    var ox = Math.min(ball.x + B_R - br.x, br.x + br.w - (ball.x - B_R));
    var oy = Math.min(ball.y + B_R - br.y, br.y + br.h - (ball.y - B_R));
    if (ox < oy) ball.vx = ball.x < br.x + br.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
    else ball.vy = ball.y < br.y + br.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
    return true;
  }
  /* One physics substep; returns 'lost' | brick-index hit | null. */
  function bSub(s, dt) {
    var b = s.ball;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < B_R) { b.x = B_R; b.vx = Math.abs(b.vx); }
    if (b.x > B_W - B_R) { b.x = B_W - B_R; b.vx = -Math.abs(b.vx); }
    if (b.y < B_R + 36) { b.y = B_R + 36; b.vy = Math.abs(b.vy); }
    var pw = s.pw;
    if (b.vy > 0 && b.y + B_R >= B_PY && b.y - B_R <= B_PY + B_PH && b.x >= s.px - pw / 2 - B_R && b.x <= s.px + pw / 2 + B_R) {
      var rel = clamp((b.x - s.px) / (pw / 2), -1, 1), ang = rel * 1.05, sp = Math.hypot(b.vx, b.vy);
      b.vx = sp * Math.sin(ang); b.vy = -sp * Math.cos(ang);
      b.y = B_PY - B_R;
      s.flash = 1;
    }
    if (b.y > B_H + B_R * 2) return 'lost';
    for (var i = 0; i < s.bricks.length; i++) if (bCollideBrick(b, s.bricks[i])) return i;
    return null;
  }
  function bDraw(ctx, s, w, h) {
    var sc = Math.min(w / B_W, h / B_H), ox = (w - B_W * sc) / 2, oy = (h - B_H * sc) / 2;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(sc, sc);
    rrect(ctx, 0, 0, B_W, B_H, 8);
    ctx.fillStyle = 'rgba(10,10,16,0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201,168,76,0.18)';
    ctx.beginPath(); ctx.moveTo(10, 36); ctx.lineTo(B_W - 10, 36); ctx.stroke();
    s.bricks.forEach(function (br) {
      ctx.save();
      ctx.shadowColor = bColor(br); ctx.shadowBlur = 8;
      rrect(ctx, br.x, br.y, br.w, br.h, 4);
      ctx.fillStyle = bColor(br);
      ctx.globalAlpha = br.hits < br.max ? 0.55 : 1;
      ctx.fill();
      ctx.restore();
      if (br.max > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1.2;
        rrect(ctx, br.x + 3, br.y + 3, br.w - 6, br.h - 6, 3);
        ctx.stroke();
      }
    });
    var tr = s.trail || [];
    for (var i = 0; i < tr.length; i++) {
      ctx.fillStyle = 'rgba(0,229,255,' + (0.05 + i * 0.03).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(tr[i][0], tr[i][1], B_R * (0.4 + i * 0.06), 0, 6.283); ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = CYAN; ctx.shadowBlur = 14;
    ctx.fillStyle = '#e8fdff';
    ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, B_R, 0, 6.283); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = GOLD; ctx.shadowBlur = 12 + (s.flash || 0) * 18;
    var g = ctx.createLinearGradient(s.px - s.pw / 2, 0, s.px + s.pw / 2, 0);
    g.addColorStop(0, '#7c5b22'); g.addColorStop(0.5, GOLD_HI); g.addColorStop(1, '#7c5b22');
    rrect(ctx, s.px - s.pw / 2, B_PY, s.pw, B_PH, 6);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(0,229,255,0.85)';
    ctx.fillRect(s.px - s.pw * 0.18, B_PY + B_PH / 2 - 1, s.pw * 0.36, 2);
    if (s.lives != null) {
      txt(ctx, 'LVL ' + s.level, 16, 18, 14, GOLD, FM, 'left');
      for (var l = 0; l < s.lives; l++) {
        ctx.fillStyle = CYAN;
        ctx.beginPath(); ctx.arc(B_W - 20 - l * 18, 18, 5, 0, 6.283); ctx.fill();
      }
      txt(ctx, String(s.score), B_W / 2, 18, 15, INK, '700 ' + FR);
    }
    ctx.restore();
    return { sc: sc, ox: ox, oy: oy };
  }
  var AEGIS = {
    id: 'aegis', name: 'AEGIS BREAKER', tagline: 'Shatter the wall', color: '#ffb36b', glow: 'rgba(255,179,107,.3)',
    timed: true, help: 'MOUSE · DRAG · ARROWS · SPACE',
    aspect: function () { return B_W / B_H; },
    bestLabel: function () { var b = getBest('aegis'); return b == null ? null : 'BEST ' + b; },
    create: function (h) {
      var s, view = { sc: 1, ox: 0, oy: 0 }, held = { l: false, r: false };
      function speed() { return 330 + 32 * (s.level - 1); }
      function hud() {
        var b = getBest('aegis');
        h.hud('SCORE ' + s.score + ' · LVL ' + s.level + ' · LIVES ' + s.lives + (b != null ? ' · BEST ' + b : ''));
      }
      function serve() {
        s.state = 'serve';
        s.ball = { x: s.px, y: B_PY - B_R - 1, vx: 0, vy: 0 };
        s.trail = [];
      }
      function launch() {
        if (s.state !== 'serve' || h.hasMsg()) return;
        var ang = (Math.random() * 0.8 - 0.4), sp = speed();
        s.ball.vx = sp * Math.sin(ang); s.ball.vy = -sp * Math.cos(ang);
        s.state = 'play';
      }
      function restart() {
        s = { level: 1, lives: 3, score: 0, px: B_W / 2, pw: 88, target: null, bricks: bBricks(1), state: 'serve', flash: 0, trail: [] };
        serve();
        h.clearMsg();
        hud();
      }
      function toLogical(e) {
        var b = h.canvas.getBoundingClientRect();
        return (e.clientX - b.left - view.ox) / view.sc;
      }
      h.on(h.canvas, 'pointermove', function (e) { s.target = toLogical(e); });
      h.on(h.canvas, 'pointerdown', function (e) {
        s.target = toLogical(e);
        try { h.canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        launch();
      });
      restart();
      return {
        restart: restart,
        isActive: function () { return s.state === 'play' || s.state === 'serve'; },
        key: function (e) {
          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { held.l = true; s.target = null; return true; }
          if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { held.r = true; s.target = null; return true; }
          if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { launch(); return true; }
          return false;
        },
        keyup: function (e) {
          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') held.l = false;
          if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') held.r = false;
        },
        onPause: function () { held.l = held.r = false; },
        step: function (dt) {
          if (s.state === 'over') return;
          if (held.l) s.px -= 560 * dt;
          if (held.r) s.px += 560 * dt;
          if (s.target != null) s.px = s.target;
          s.px = clamp(s.px, s.pw / 2, B_W - s.pw / 2);
          s.flash = Math.max(0, (s.flash || 0) - dt * 4);
          if (s.state === 'serve') { s.ball.x = s.px; s.ball.y = B_PY - B_R - 1; return; }
          var sp = Math.hypot(s.ball.vx, s.ball.vy), n = Math.max(1, Math.ceil(sp * dt / 4)), sdt = dt / n;
          for (var i = 0; i < n; i++) {
            var r = bSub(s, sdt);
            if (r === 'lost') {
              s.lives--;
              if (s.lives <= 0) {
                s.state = 'over';
                offerBest('aegis', s.score, false);
                hud();
                h.msg('SHIELD BROKEN', 'Score ' + s.score + ' · level ' + s.level, [{ label: 'PLAY AGAIN', primary: true, fn: restart }]);
                h.announce('Game over. Score ' + s.score);
              } else { serve(); hud(); h.toast('LIVES ' + s.lives); }
              return;
            }
            if (r !== null) {
              var br = s.bricks[r];
              br.hits--;
              if (br.hits <= 0) {
                s.bricks.splice(r, 1);
                s.score += 10 * s.level;
                offerBest('aegis', s.score, false);
                hud();
              }
              if (!s.bricks.length) {
                s.level++;
                if (s.level >= 2) achieve(AEGIS);
                s.bricks = bBricks(s.level);
                serve();
                hud();
                h.toast('LEVEL ' + s.level);
                h.announce('Level ' + s.level);
                return;
              }
            }
          }
          s.trail.push([s.ball.x, s.ball.y]);
          if (s.trail.length > 8) s.trail.shift();
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          view = bDraw(ctx, s, w, hh);
          if (s.state === 'serve' && !h.hasMsg()) {
            ctx.save();
            ctx.translate(view.ox, view.oy); ctx.scale(view.sc, view.sc);
            txt(ctx, 'TAP · SPACE TO LAUNCH', B_W / 2, B_PY - 60, 15, GOLD, FM);
            ctx.restore();
          }
        },
        _state: function () { return s; }
      };
    },
    attract: function (st, ctx, w, h, t) {
      if (!st.s) {
        st.s = { level: 1, lives: null, score: 0, px: B_W / 2, pw: 96, bricks: bBricks(1), trail: [], flash: 0,
                 ball: { x: B_W / 2, y: 420, vx: 190, vy: -330 } };
        st.last = t;
      }
      var s = st.s, dt = clamp(t - st.last, 0, 0.05); st.last = t;
      s.px = clamp(lerp(s.px, s.ball.x, 0.18), s.pw / 2, B_W - s.pw / 2);
      var n = Math.max(1, Math.ceil(380 * dt / 4));
      for (var i = 0; i < n; i++) {
        var r = bSub(s, dt / n);
        if (r === 'lost') { s.ball = { x: B_W / 2, y: 420, vx: 190, vy: -330 }; break; }
        if (r !== null) { s.bricks.splice(r, 1); if (!s.bricks.length) s.bricks = bBricks(rint(3) + 1); }
      }
      s.trail.push([s.ball.x, s.ball.y]);
      if (s.trail.length > 8) s.trail.shift();
      s.flash = Math.max(0, s.flash - dt * 4);
      bg(ctx, w, h, t);
      bDraw(ctx, s, w, h);
    }
  };

  /* ====================================================== 6. HADES FIELD */
  function hNeighbors(N, i) {
    var r = Math.floor(i / N), c = i % N, out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < N && cc < N) out.push(rr * N + cc);
    }
    return out;
  }
  /* Mines are placed on the FIRST reveal, never on safeIdx or its neighbours
     (when the board has room), so the first click always opens ground. */
  function placeMines(N, M, safeIdx, rnd) {
    rnd = rnd || Math.random;
    var banned = {};
    banned[safeIdx] = 1;
    if (N * N - 9 >= M) hNeighbors(N, safeIdx).forEach(function (j) { banned[j] = 1; });
    var pool = [];
    for (var i = 0; i < N * N; i++) if (!banned[i]) pool.push(i);
    shuffle(pool, rnd);
    return pool.slice(0, M);
  }
  function hNew(N, M) {
    var cells = [];
    for (var i = 0; i < N * N; i++) cells.push({ m: false, n: 0, open: false, flag: false, boom: false });
    return { N: N, M: M, cells: cells, placed: false, over: false, won: false, opened: 0, time: 0, started: false, flags: 0 };
  }
  function hPlace(s, safeIdx, rnd) {
    placeMines(s.N, s.M, safeIdx, rnd).forEach(function (j) { s.cells[j].m = true; });
    for (var i = 0; i < s.cells.length; i++) {
      s.cells[i].n = hNeighbors(s.N, i).filter(function (j) { return s.cells[j].m; }).length;
    }
    s.placed = true;
  }
  /* Reveal with flood fill. Returns 'boom' | 'win' | 'ok' | null (no-op). */
  function hReveal(s, i, rnd) {
    if (s.over || s.won) return null;
    var c = s.cells[i];
    if (!c || c.open || c.flag) return null;
    if (!s.placed) hPlace(s, i, rnd);
    s.started = true;
    if (c.m) {
      c.boom = true; c.open = true; s.over = true;
      s.cells.forEach(function (q) { if (q.m) q.open = true; });
      return 'boom';
    }
    var q = [i];
    while (q.length) {
      var k = q.shift(), cc = s.cells[k];
      if (cc.open || cc.flag) continue;
      cc.open = true; s.opened++;
      if (cc.n === 0) hNeighbors(s.N, k).forEach(function (j) { if (!s.cells[j].open && !s.cells[j].m) q.push(j); });
    }
    if (s.opened === s.N * s.N - s.M) {
      s.won = true;
      s.cells.forEach(function (x) { if (x.m && !x.flag) { x.flag = true; s.flags++; } });
      return 'win';
    }
    return 'ok';
  }
  function hChord(s, i) {
    var c = s.cells[i];
    if (!c.open || c.n === 0 || s.over || s.won) return null;
    var nb = hNeighbors(s.N, i);
    var f = nb.filter(function (j) { return s.cells[j].flag; }).length;
    if (f !== c.n) return null;
    var res = null;
    nb.forEach(function (j) {
      var r = hReveal(s, j);
      if (r === 'boom' || r === 'win') res = r;
      else if (r && !res) res = r;
    });
    return res;
  }
  var H_NUM = ['', CYAN, '#7ff0c8', GOLD_HI, '#ffb36b', CRIM, '#5fd3e8', INK, MUTED];
  function hDraw(ctx, s, x0, y0, size, t, cursor) {
    var N = s.N, cell = size / N, pad = Math.max(0.6, cell * 0.06);
    rrect(ctx, x0 - 3, y0 - 3, size + 6, size + 6, 6);
    ctx.fillStyle = 'rgba(12,12,18,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (var i = 0; i < N * N; i++) {
      var c = s.cells[i], x = x0 + (i % N) * cell, y = y0 + Math.floor(i / N) * cell;
      rrect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.12);
      if (c.open) {
        ctx.fillStyle = c.boom ? 'rgba(255,77,106,0.55)' : 'rgba(30,28,38,0.95)';
        ctx.fill();
        if (c.m) {
          var mx = x + cell / 2, my = y + cell / 2, mr = cell * 0.22;
          ctx.save();
          ctx.shadowColor = CRIM; ctx.shadowBlur = cell * 0.5;
          ctx.strokeStyle = CRIM; ctx.lineWidth = Math.max(1, cell * 0.06);
          for (var a = 0; a < 4; a++) {
            var an = a * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(mx - Math.cos(an) * mr * 1.5, my - Math.sin(an) * mr * 1.5);
            ctx.lineTo(mx + Math.cos(an) * mr * 1.5, my + Math.sin(an) * mr * 1.5);
            ctx.stroke();
          }
          ctx.fillStyle = '#1a0a10';
          ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.283); ctx.fill();
          ctx.strokeStyle = CRIM; ctx.stroke();
          ctx.restore();
        } else if (c.n > 0) {
          txt(ctx, String(c.n), x + cell / 2, y + cell / 2 + cell * 0.03, cell * 0.58, H_NUM[c.n], '700 ' + FR);
        }
      } else {
        var g = ctx.createLinearGradient(x, y, x, y + cell);
        g.addColorStop(0, '#2c2618'); g.addColorStop(1, '#17140d');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,168,76,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (c.flag) {
          var fx = x + cell * 0.38, fy = y + cell * 0.22, fh = cell * 0.56;
          ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, cell * 0.06);
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + fh); ctx.stroke();
          ctx.save();
          ctx.shadowColor = GOLD; ctx.shadowBlur = cell * 0.35;
          ctx.fillStyle = GOLD_HI;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + cell * 0.34, fy + cell * 0.14); ctx.lineTo(fx, fy + cell * 0.28); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
      if (cursor === i) {
        ctx.strokeStyle = CYAN; ctx.lineWidth = 2;
        rrect(ctx, x + 1, y + 1, cell - 2, cell - 2, cell * 0.14);
        ctx.stroke();
      }
    }
  }
  var HADES = {
    id: 'hades', name: 'HADES FIELD', tagline: 'Clear the field', color: CRIM, glow: 'rgba(255,77,106,.3)',
    timed: true, help: 'TAP OPEN · RIGHT-CLICK / HOLD FLAG',
    aspect: function () { return 1; },
    bestLabel: function () {
      var b = getBest('hades:9'), b2 = getBest('hades:16');
      if (b == null && b2 == null) return null;
      return 'BEST ' + (b != null ? fmtTime(b) + ' 9×9' : fmtTime(b2) + ' 16×16');
    },
    create: function (h) {
      var s, size = 9, layout = null, cursor = -1, flagMode = false, lp = null, lastType = 'mouse', sizeBtns = {}, flagBtn;
      function hud() {
        var b = getBest('hades:' + size);
        h.hud('MINES ' + (s.M - s.flags) + ' · ' + fmtTime(s.time) + (b != null ? ' · BEST ' + fmtTime(b) : ''));
      }
      function restart(n) {
        if (n) size = n;
        s = hNew(size, size === 9 ? 10 : 40);
        s.lastHud = -1;
        cursor = -1;
        h.clearMsg();
        Object.keys(sizeBtns).forEach(function (k) { sizeBtns[k].setAttribute('aria-pressed', String(+k === size)); });
        hud();
      }
      function result(r) {
        if (r === 'boom') {
          hud();
          h.msg('CONSUMED', 'The field claimed you', [{ label: 'TRY AGAIN', primary: true, fn: function () { restart(); } }]);
          h.announce('Mine. Game over');
        } else if (r === 'win') {
          offerBest('hades:' + size, Math.floor(s.time), true);
          achieve(HADES);
          hud();
          h.msg('FIELD CLEARED', fmtTime(s.time) + ' · ' + size + '×' + size, [{ label: 'PLAY AGAIN', primary: true, fn: function () { restart(); } }]);
          h.announce('Field cleared in ' + fmtTime(s.time));
        }
      }
      function toggleFlag(i) {
        if (i < 0 || s.over || s.won || h.hasMsg()) return;
        var c = s.cells[i];
        if (c.open) return;
        c.flag = !c.flag;
        s.flags += c.flag ? 1 : -1;
        hud();
      }
      function act(i) {
        if (i < 0 || h.hasMsg()) return;
        if (flagMode && !s.cells[i].open) { toggleFlag(i); return; }
        var r = s.cells[i].open ? hChord(s, i) : hReveal(s, i);
        hud();
        result(r);
      }
      function cellAt(e) {
        if (!layout) return -1;
        var b = h.canvas.getBoundingClientRect();
        var x = e.clientX - b.left - layout.x0, y = e.clientY - b.top - layout.y0;
        if (x < 0 || y < 0 || x >= layout.size || y >= layout.size) return -1;
        return Math.floor(y / layout.cell) * s.N + Math.floor(x / layout.cell);
      }
      function cancelLp() { if (lp) { clearTimeout(lp.timer); lp = null; } }
      h.on(h.canvas, 'pointerdown', function (e) {
        lastType = e.pointerType || 'mouse';
        cancelLp();
        if (e.button !== 0 && lastType === 'mouse') return;
        var i = cellAt(e);
        lp = { i: i, x: e.clientX, y: e.clientY, fired: false, cancelled: false, timer: 0 };
        if (lastType !== 'mouse') {
          var me = lp;
          me.timer = setTimeout(function () {
            if (lp !== me || !P.open) return;
            me.fired = true;
            toggleFlag(me.i);
            try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) { /* ignore */ }
          }, 420);
          P.timers.push(me.timer);
        }
      });
      h.on(h.canvas, 'pointermove', function (e) {
        if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.timer); lp.cancelled = true; }
      });
      h.on(h.canvas, 'pointerup', function (e) {
        if (!lp) return;
        var me = lp;
        cancelLp();
        if (me.fired || me.cancelled) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        cursor = -1;
        act(cellAt(e));
      });
      h.on(h.canvas, 'pointercancel', cancelLp);
      h.on(h.canvas, 'contextmenu', function (e) {
        e.preventDefault();
        if (lastType !== 'mouse') return;   /* touch long-press already flagged */
        toggleFlag(cellAt(e));
      });
      var row = el('div', 'oxa-row');
      [9, 16].forEach(function (n) {
        var b = el('button', 'oxa-btn', n + '×' + n);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', n + ' by ' + n + ' field');
        h.on(b, 'click', function () { restart(n); });
        sizeBtns[n] = b;
        row.appendChild(b);
      });
      flagBtn = el('button', 'oxa-btn', 'FLAG MODE');
      flagBtn.type = 'button';
      flagBtn.setAttribute('aria-pressed', 'false');
      h.on(flagBtn, 'click', function () { flagMode = !flagMode; flagBtn.setAttribute('aria-pressed', String(flagMode)); });
      row.appendChild(flagBtn);
      h.controls.appendChild(row);
      restart(9);
      return {
        restart: function () { restart(); },
        isActive: function () { return s.started && !s.over && !s.won; },
        key: function (e) {
          var N = s.N;
          var d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
          if (d) {
            if (cursor < 0) cursor = Math.floor(N * N / 2);
            else {
              var r = clamp(Math.floor(cursor / N) + d[1], 0, N - 1), c = clamp(cursor % N + d[0], 0, N - 1);
              cursor = r * N + c;
            }
            return true;
          }
          if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0) { var fm = flagMode; flagMode = false; act(cursor); flagMode = fm; return true; }
          if ((e.key === 'f' || e.key === 'F') && cursor >= 0) { toggleFlag(cursor); return true; }
          return false;
        },
        step: function (dt) {
          if (s.started && !s.over && !s.won) {
            s.time += dt;
            if (Math.floor(s.time) !== s.lastHud) { s.lastHud = Math.floor(s.time); hud(); }
          }
        },
        draw: function (ctx, w, hh, t) {
          bg(ctx, w, hh, t / 1000);
          var sz = Math.min(w, hh) - 10;
          layout = { x0: (w - sz) / 2, y0: (hh - sz) / 2, size: sz, cell: sz / s.N };
          hDraw(ctx, s, layout.x0, layout.y0, sz, t, cursor);
        },
        _state: function () { return s; },
        _cellCenter: function (i) {
          if (!layout) return null;
          return [layout.x0 + (i % s.N + 0.5) * layout.cell, layout.y0 + (Math.floor(i / s.N) + 0.5) * layout.cell];
        }
      };
    },
    attract: function (st, ctx, w, h, t) {
      if (!st.s || t - st.t0 > 8 || t < st.t0) {
        st.s = hNew(9, 10);
        hPlace(st.s, 40, mulberry32(Math.floor(t * 10) + 7));
        st.order = [];
        var seen = {}, q = [40];
        while (q.length) {
          var k = q.shift();
          if (seen[k]) continue;
          seen[k] = 1;
          if (!st.s.cells[k].m) st.order.push(k);
          hNeighbors(9, k).forEach(function (j) { if (!seen[j]) q.push(j); });
        }
        st.t0 = t;
      }
      var n = Math.floor((t - st.t0) * 14);
      for (var i = 0; i < st.order.length; i++) st.s.cells[st.order[i]].open = i < n;
      st.s.cells.forEach(function (c) { c.flag = c.m && n > 30; });
      bg(ctx, w, h, t);
      var sz = Math.min(w, h) * 0.86;
      hDraw(ctx, st.s, (w - sz) / 2, (h - sz) / 2, sz, t, -1);
    }
  };

  var GAMES = [ASCEND, SERPENT, ORACLE, ZODIAC, AEGIS, HADES];
  var BY_ID = {};
  GAMES.forEach(function (g) { BY_ID[g.id] = g; });

  /* ================================================================ style */
  var CSS = [
    '.oxa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0 0 6px;min-width:0}',
    '@media(max-width:480px){.oxa-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}',
    '.oxa-tile{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;min-width:0;min-height:44px;padding:8px 8px 10px;margin:0;',
    'background:linear-gradient(160deg,rgba(201,168,76,.08),rgba(0,229,255,.03));border:1px solid rgba(201,168,76,.28);',
    'border-radius:8px;color:var(--ink,#e9e6dc);cursor:pointer;text-align:left;font:inherit;',
    'transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}',
    '.oxa-tile:hover{transform:translateY(-2px);border-color:var(--oxa-c);box-shadow:0 10px 28px rgba(0,0,0,.45),0 0 22px var(--oxa-g)}',
    '.oxa-tile:focus-visible{outline:2px solid var(--cyan,#00E5FF);outline-offset:3px;border-color:var(--oxa-c)}',
    '.oxa-tv{position:relative;width:100%;aspect-ratio:4/3;border-radius:5px;overflow:hidden;background:#05060a}',
    '.oxa-tv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.oxa-tplay{position:absolute;right:6px;bottom:6px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'background:rgba(5,6,10,.78);border:1px solid var(--oxa-c);color:var(--oxa-c)}',
    '.oxa-tplay svg{width:14px;height:14px}',
    '.oxa-tn{font-family:var(--D,"Cinzel Decorative",serif);font-size:13px;letter-spacing:1px;color:var(--oxa-c);line-height:1.25;overflow-wrap:anywhere}',
    '.oxa-tb{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1px;color:var(--muted,#8a8676);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.oxa-ov{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;color:var(--ink,#e9e6dc);',
    'background:radial-gradient(ellipse at 50% -10%,rgba(201,168,76,.12),transparent 60%),#04050a;',
    'padding:max(8px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));animation:oxa-in .22s ease-out;overflow:hidden}',
    '.oxa-bar{display:flex;align-items:center;gap:8px;min-height:48px;width:100%;max-width:980px;margin:0 auto;min-width:0}',
    '.oxa-ttl{font-family:var(--D,"Cinzel Decorative",serif);font-size:clamp(13px,2.4vw,20px);letter-spacing:1.5px;color:var(--oxa-c);white-space:nowrap;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}',
    '.oxa-hud{flex:1 1 0;min-width:0;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1px;text-align:right;line-height:1.35;max-height:2.7em;overflow:hidden}',
    '.oxa-ib{width:44px;height:44px;flex:0 0 44px;display:inline-flex;align-items:center;justify-content:center;padding:0;margin:0;border-radius:50%;',
    'border:1px solid rgba(201,168,76,.4);background:rgba(10,10,15,.75);color:var(--gold,#C9A84C);cursor:pointer;touch-action:manipulation}',
    '.oxa-ib:hover{border-color:var(--gold,#C9A84C);background:rgba(201,168,76,.12)}',
    '.oxa-ib:focus-visible,.oxa-btn:focus-visible{outline:2px solid var(--cyan,#00E5FF);outline-offset:2px}',
    '.oxa-ib svg{width:18px;height:18px}',
    '.oxa-stage{position:relative;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;width:100%;max-width:980px;margin:4px auto 0}',
    '.oxa-cv{display:block;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;border-radius:10px;outline:none;',
    'box-shadow:0 0 0 1px rgba(201,168,76,.28),0 22px 60px rgba(0,0,0,.6)}',
    '.oxa-cv:focus-visible{box-shadow:0 0 0 2px var(--cyan,#00E5FF),0 22px 60px rgba(0,0,0,.6)}',
    '.oxa-ctl{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:560px;margin:8px auto 0;flex:0 0 auto}',
    '.oxa-ctl:empty{display:none}',
    '.oxa-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;width:100%}',
    '.oxa-btn{min-height:44px;min-width:44px;padding:0 16px;margin:0;border-radius:22px;border:1px solid rgba(201,168,76,.45);background:rgba(10,10,15,.75);',
    'color:var(--gold,#C9A84C);font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1.4px;cursor:pointer;touch-action:manipulation}',
    '.oxa-btn[aria-pressed="true"],.oxa-btn.oxa-pri{background:var(--gold,#C9A84C);border-color:var(--gold,#C9A84C);color:#0a0a0f}',
    '.oxa-kb{display:flex;flex-direction:column;gap:6px;width:100%}',
    '.oxa-kr{display:flex;gap:5px;justify-content:center;width:100%}',
    '.oxa-key{flex:1 1 0;min-width:0;max-width:46px;height:52px;padding:0;margin:0;border-radius:6px;border:1px solid rgba(201,168,76,.22);',
    'background:rgba(34,33,44,.95);color:var(--ink,#e9e6dc);font-family:var(--R,Rajdhani,sans-serif);font-weight:700;font-size:17px;cursor:pointer;touch-action:manipulation}',
    '.oxa-key.oxa-wide{flex:1.6 1 0;max-width:76px;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.5px}',
    '.oxa-key[data-s="c"]{background:#C9A84C;border-color:#C9A84C;color:#0a0a0f}',
    '.oxa-key[data-s="p"]{background:#0b8fa3;border-color:#0b8fa3;color:#fff}',
    '.oxa-key[data-s="a"]{background:#15141b;border-color:#15141b;color:#8d897b}',
    '.oxa-dpad{display:none;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,52px);gap:6px;justify-content:center}',
    '.oxa-dpad .oxa-ib{width:56px;height:52px;flex:none;border-radius:12px}',
    '.oxa-pad-up{grid-column:2;grid-row:1}.oxa-pad-left{grid-column:1;grid-row:2}.oxa-pad-down{grid-column:2;grid-row:2}.oxa-pad-right{grid-column:3;grid-row:2}',
    '@media (pointer:coarse){.oxa-dpad{display:grid}}',
    '.oxa-help{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1.2px;color:var(--muted,#8a8676);text-align:center;margin:6px 0 0;flex:0 0 auto}',
    '.oxa-msg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:2;pointer-events:none}',
    '.oxa-msg.on{display:flex}',
    '.oxa-mb{pointer-events:auto;text-align:center;max-width:min(92%,360px);padding:18px 22px;border-radius:12px;background:rgba(6,7,12,.93);',
    'border:1px solid rgba(201,168,76,.5);box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 30px rgba(201,168,76,.15)}',
    '.oxa-mt{font-family:var(--D,"Cinzel Decorative",serif);font-size:20px;letter-spacing:2px;color:var(--gold,#C9A84C)}',
    '.oxa-ms{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1.3px;margin:8px 0 14px;line-height:1.6}',
    '.oxa-tst{position:absolute;top:10px;left:50%;transform:translate(-50%,-6px);z-index:3;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;',
    'padding:8px 14px;border-radius:6px;background:rgba(233,230,220,.95);color:#0a0a0f;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1px;white-space:nowrap}',
    '.oxa-tst.on{opacity:1;transform:translate(-50%,0)}',
    '.oxa-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    '@keyframes oxa-in{from{opacity:0}to{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.oxa-ov{animation:none}.oxa-tile{transition:none}.oxa-tile:hover{transform:none}.oxa-tst{transition:none}}',
    'html.oxa-lock,html.oxa-lock body{overflow:hidden!important}',
    /* The player sits above the platform chrome (status bar, rails, HUD at
       z 9990-10001); the progression toast must still show over it. */
    'html.oxa-lock .omp-toast{z-index:2147482001}'
  ].join('');
  function injectCss() {
    if (document.getElementById('oxa-css')) return;
    var s = document.createElement('style');
    s.id = 'oxa-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* =============================================================== player */
  var P = { open: false, raf: 0, frames: 0, paused: false, listeners: [], timers: [] };

  function close() {
    if (!P.open) return;
    P.open = false;
    if (P.raf) cancelAnimationFrame(P.raf);
    P.raf = 0;
    P.paused = false;
    try { if (P.inst && P.inst.destroy) P.inst.destroy(); } catch (e) { /* ignore */ }
    P.listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    P.timers.forEach(function (t) { clearTimeout(t); });
    P.listeners = []; P.timers = [];
    if (P.ro) { P.ro.disconnect(); P.ro = null; }
    if (P.root && P.root.parentNode) P.root.parentNode.removeChild(P.root);
    document.documentElement.classList.remove('oxa-lock');
    var back = P.returnFocus;
    P.inst = null; P.root = null; P.game = null; P.returnFocus = null;
    refreshThumbs();
    thumbLoop();
    if (back && back.focus && back.isConnected) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }

  function open(id) {
    var game = BY_ID[id];
    if (!game) return false;
    if (P.open) close();
    injectCss();
    P.open = true; P.paused = false; P.game = game; P.listeners = []; P.timers = []; P.size = null; P.last = 0;
    P.returnFocus = document.activeElement;

    function on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      P.listeners.push([target, type, fn, opts]);
    }

    var root = el('div', 'oxa-ov');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', game.name);
    root.setAttribute('data-oxa-game', game.id);
    root.style.setProperty('--oxa-c', game.color);
    var bar = el('div', 'oxa-bar');
    var ttl = el('div', 'oxa-ttl', game.name);
    var hudEl = el('div', 'oxa-hud');
    var btnRestart = el('button', 'oxa-ib');
    btnRestart.type = 'button';
    btnRestart.setAttribute('aria-label', 'Restart');
    btnRestart.appendChild(icon('restart'));
    var btnPause = null;
    if (game.timed) {
      btnPause = el('button', 'oxa-ib');
      btnPause.type = 'button';
      btnPause.setAttribute('aria-label', 'Pause');
      btnPause.appendChild(icon('pause'));
    }
    var btnClose = el('button', 'oxa-ib');
    btnClose.type = 'button';
    btnClose.setAttribute('aria-label', 'Close game');
    btnClose.appendChild(icon('close'));
    bar.appendChild(ttl); bar.appendChild(hudEl); bar.appendChild(btnRestart);
    if (btnPause) bar.appendChild(btnPause);
    bar.appendChild(btnClose);

    var stage = el('div', 'oxa-stage');
    var canvas = el('canvas', 'oxa-cv');
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', game.name + ' board. ' + game.help);
    var msgEl = el('div', 'oxa-msg');
    var toastEl = el('div', 'oxa-tst');
    toastEl.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas); stage.appendChild(msgEl); stage.appendChild(toastEl);
    var ctl = el('div', 'oxa-ctl');
    var help = el('div', 'oxa-help', game.help);
    var sr = el('div', 'oxa-sr');
    sr.setAttribute('aria-live', 'polite');
    root.appendChild(bar); root.appendChild(stage); root.appendChild(ctl); root.appendChild(help); root.appendChild(sr);
    document.body.appendChild(root);
    document.documentElement.classList.add('oxa-lock');
    P.root = root;

    function setPauseIcon(paused) {
      if (!btnPause) return;
      btnPause.textContent = '';
      btnPause.appendChild(icon(paused ? 'play' : 'pause'));
      btnPause.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    }
    var toastTimer = 0;
    var host = {
      canvas: canvas,
      controls: ctl,
      on: on,
      hud: function (t) { if (hudEl.textContent !== t) hudEl.textContent = t; },
      announce: function (t) { sr.textContent = ''; host.later(function () { sr.textContent = t; }, 30); },
      toast: function (t) {
        toastEl.textContent = t;
        toastEl.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1300);
        P.timers.push(toastTimer);
      },
      later: function (fn, ms) {
        var tid = setTimeout(function () { if (P.open && P.root === root) fn(); }, ms);
        P.timers.push(tid);
        return tid;
      },
      hasMsg: function () { return msgEl.classList.contains('on') || P.paused; },
      msg: function (title, sub, actions) {
        msgEl.textContent = '';
        var box = el('div', 'oxa-mb');
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-label', title);
        box.appendChild(el('div', 'oxa-mt', title));
        if (sub) box.appendChild(el('div', 'oxa-ms', sub));
        var row = el('div', 'oxa-row');
        var first = null;
        (actions || []).forEach(function (a) {
          var b = el('button', 'oxa-btn' + (a.primary ? ' oxa-pri' : ''), a.label);
          b.type = 'button';
          b.addEventListener('click', function (e) {
            e.stopPropagation();
            a.fn();
            if (P.open && P.root === root) { start(); canvas.focus({ preventScroll: true }); }
          });
          if (!first) first = b;
          row.appendChild(b);
        });
        box.appendChild(row);
        msgEl.appendChild(box);
        msgEl.classList.add('on');
        if (first && root.contains(document.activeElement)) first.focus({ preventScroll: true });
      },
      clearMsg: function () { msgEl.classList.remove('on'); msgEl.textContent = ''; }
    };

    function draw() {
      if (!P.size || !P.inst) return;
      var ctx = fit(canvas, P.size[0], P.size[1], false);
      P.inst.draw(ctx, P.size[0], P.size[1], now());
    }
    function loop(ts) {
      P.raf = 0;
      if (!P.open || P.root !== root) return;
      var dt = P.last ? Math.min(0.05, (ts - P.last) / 1000) : 0;
      P.last = ts;
      P.frames++;
      if (!P.paused && P.inst.step) P.inst.step(dt);
      draw();
      if (!P.paused) P.raf = requestAnimationFrame(loop);
    }
    function start() { if (!P.raf && P.open && P.root === root && !P.paused) { P.last = 0; P.raf = requestAnimationFrame(loop); } }
    function pause() {
      if (P.paused || !game.timed) return;
      P.savedMsg = msgEl.classList.contains('on') ? Array.prototype.slice.call(msgEl.childNodes) : null;
      host.msg('PAUSED', null, [{ label: 'RESUME', primary: true, fn: resume }]);
      P.paused = true;
      if (P.raf) { cancelAnimationFrame(P.raf); P.raf = 0; }
      if (P.inst.onPause) P.inst.onPause();
      setPauseIcon(true);
      draw();
      host.announce('Paused');
    }
    function resume() {
      if (!P.paused) return;
      P.paused = false;
      host.clearMsg();
      if (P.savedMsg) { P.savedMsg.forEach(function (n) { msgEl.appendChild(n); }); msgEl.classList.add('on'); }
      P.savedMsg = null;
      setPauseIcon(false);
      start();
    }
    function autoPause() {
      if (P.open && P.root === root && game.timed && !P.paused && P.inst.isActive && P.inst.isActive()) pause();
    }

    P.inst = game.create(host);

    function focusables() {
      return Array.prototype.filter.call(root.querySelectorAll('button,[tabindex="0"]'), function (n) {
        return !n.disabled && n.tabIndex >= 0 && n.getClientRects().length > 0;
      });
    }
    on(document, 'keydown', function (e) {
      if (!P.open || P.root !== root) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      var onButton = t && t.tagName === 'BUTTON' && !(t.classList && t.classList.contains('oxa-key'));
      if (onButton && (e.key === 'Enter' || e.key === ' ')) return;
      if (P.paused) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'p' || e.key === 'P') { e.preventDefault(); resume(); }
        return;
      }
      if (game.timed && (e.key === 'p' || e.key === 'P') && P.inst.isActive && P.inst.isActive()) { e.preventDefault(); pause(); return; }
      if (P.inst.key && P.inst.key(e)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    on(document, 'keyup', function (e) { if (P.open && P.root === root && P.inst.keyup) P.inst.keyup(e); }, true);
    on(window, 'blur', autoPause);
    on(document, 'visibilitychange', function () { if (document.hidden) autoPause(); });
    on(canvas, 'contextmenu', function (e) { e.preventDefault(); });
    on(btnClose, 'click', close);
    on(btnRestart, 'click', function () {
      if (P.paused) { P.paused = false; P.savedMsg = null; setPauseIcon(false); }
      P.inst.restart();
      start();
      canvas.focus({ preventScroll: true });
    });
    if (btnPause) on(btnPause, 'click', function () { if (P.paused) resume(); else if (P.inst.isActive && P.inst.isActive()) pause(); });

    /* ResizeObserver, never a DOMContentLoaded measurement (8.1 class 3). */
    function layout() {
      if (!P.open || P.root !== root) return;
      var W = stage.clientWidth, H = stage.clientHeight;
      if (W < 10 || H < 10) return;
      var a = game.aspect(W, H), cw = Math.min(W, H * a), ch = cw / a;
      var cap = 760 * Math.max(1, a);
      if (cw > cap) { cw = cap; ch = cw / a; }
      cw = Math.floor(cw); ch = Math.floor(ch);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      P.size = [cw, ch];
      if (P.paused || !P.raf) draw();
    }
    if (window.ResizeObserver) {
      P.ro = new ResizeObserver(layout);
      P.ro.observe(stage);
    } else {
      on(window, 'resize', layout);
    }
    layout();
    stopThumbs();
    start();
    try { canvas.focus({ preventScroll: true }); } catch (e) { canvas.focus(); }
    return true;
  }

  /* =============================================================== thumbs */
  var T = { items: [], raf: 0, io: null, frames: 0 };
  function thumbActive() {
    return !P.open && !document.hidden && !reducedMotion() && T.items.some(function (it) { return it.visible && it.size; });
  }
  function drawStatic(it) {
    if (!it.size) return;
    var ctx = fit(it.canvas, it.size[0], it.size[1], false);
    var st = {};
    for (var tt = 0; tt <= 6; tt += 0.1) it.game.attract(st, ctx, it.size[0], it.size[1], tt);
  }
  function thumbFrame(ts) {
    T.raf = 0;
    T.items = T.items.filter(function (it) { return it.canvas.isConnected; });
    if (!thumbActive()) return;
    T.frames++;
    var t = ts / 1000;
    T.items.forEach(function (it) {
      if (!it.visible || !it.size) return;
      var ctx = fit(it.canvas, it.size[0], it.size[1], false);
      it.game.attract(it.st, ctx, it.size[0], it.size[1], t);
    });
    T.raf = requestAnimationFrame(thumbFrame);
  }
  function thumbLoop() { if (!T.raf && thumbActive()) T.raf = requestAnimationFrame(thumbFrame); }
  function stopThumbs() { if (T.raf) cancelAnimationFrame(T.raf); T.raf = 0; }
  function refreshThumbs() {
    T.items.forEach(function (it) {
      var b = it.game.bestLabel();
      it.best.textContent = b || 'NEW';
      it.button.setAttribute('aria-label', 'Play ' + it.game.name + '. ' + it.game.tagline + '. ' + (b ? b.toLowerCase() : 'not played yet'));
    });
  }

  function thumbs(host) {
    if (!host || !host.appendChild) return null;
    injectCss();
    T.items = T.items.filter(function (it) {
      var keep = it.canvas.isConnected && !host.contains(it.canvas);
      if (!keep) { if (it.ro) it.ro.disconnect(); if (T.io) T.io.unobserve(it.wrap); }
      return keep;
    });
    host.textContent = '';
    var grid = el('div', 'oxa-grid');
    grid.setAttribute('role', 'list');
    if (!T.io && window.IntersectionObserver) {
      T.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          T.items.forEach(function (x) { if (x.wrap === en.target) x.visible = en.isIntersecting; });
        });
        if (thumbActive()) thumbLoop(); else stopThumbs();
      }, { rootMargin: '40px' });
    }
    GAMES.forEach(function (g) {
      var li = el('div');
      li.setAttribute('role', 'listitem');
      li.style.minWidth = '0';
      var b = el('button', 'oxa-tile');
      b.type = 'button';
      b.setAttribute('data-oxa-open', g.id);
      b.style.setProperty('--oxa-c', g.color);
      b.style.setProperty('--oxa-g', g.glow);
      var wrap = el('div', 'oxa-tv');
      var cv = el('canvas');
      cv.setAttribute('aria-hidden', 'true');
      wrap.appendChild(cv);
      var play = el('span', 'oxa-tplay');
      play.setAttribute('aria-hidden', 'true');
      play.appendChild(icon('play'));
      wrap.appendChild(play);
      var nm = el('div', 'oxa-tn', g.name);
      var best = el('div', 'oxa-tb');
      b.appendChild(wrap); b.appendChild(nm); b.appendChild(best);
      b.addEventListener('click', function () { open(g.id); });
      li.appendChild(b);
      grid.appendChild(li);
      var it = { game: g, canvas: cv, wrap: wrap, best: best, button: b, st: {}, visible: !window.IntersectionObserver, size: null, ro: null };
      T.items.push(it);
      if (window.ResizeObserver) {
        it.ro = new ResizeObserver(function () {
          var w = wrap.clientWidth, h = wrap.clientHeight;
          if (w < 4 || h < 4) return;
          it.size = [w, h];
          drawStatic(it);
          thumbLoop();
        });
        it.ro.observe(wrap);
      }
      if (T.io) T.io.observe(wrap);
    });
    host.appendChild(grid);
    refreshThumbs();
    if (!T.vis) {
      T.vis = true;
      document.addEventListener('visibilitychange', function () { if (document.hidden) stopThumbs(); else thumbLoop(); });
    }
    return grid;
  }

  function list() {
    return GAMES.map(function (g) {
      var key = g.id === 'hades' ? 'hades:9' : g.id;
      return { id: g.id, name: g.name, tagline: g.tagline, best: getBest(key), bestLabel: g.bestLabel() };
    });
  }

  function status() {
    return {
      open: P.open && P.game ? P.game.id : null,
      paused: !!P.paused,
      looping: !!P.raf,
      frames: P.frames,
      thumbsLooping: !!T.raf,
      thumbFrames: T.frames,
      thumbs: T.items.length
    };
  }

  window.OmegaArcade = {
    list: list,
    open: open,
    close: close,
    thumbs: thumbs,
    status: status,
    /* Pure functions exposed for verification only. */
    _test: {
      scoreGuess: scoreGuess, validWord: validWord, dailyAnswer: dailyAnswer,
      answers: ANSWERS.length, placeMines: placeMines, hNew: hNew, hReveal: hReveal, hNeighbors: hNeighbors,
      aNew: aNew, aMove: aMove,
      inst: function () { return P.inst; }
    }
  };

  function autoMount() {
    var els = document.querySelectorAll('[data-omega-arcade="thumbs"]');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].getAttribute('data-oxa-mounted')) { els[i].setAttribute('data-oxa-mounted', '1'); thumbs(els[i]); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
