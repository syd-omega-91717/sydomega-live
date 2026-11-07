/* omega-bridge-game.js -- the screen, the input and the sound of THE TWO-HAND BRIDGE (PROTOTYPE).
 *
 * The rules live in omega-bridge-logic.js and are proven in node; this file only draws them, reads keys, taps and swipes, and keeps the
 * player's progress. It decides no rule. Canvas 2D (no WebGL), every graphic and sound is generated in code, text is set with
 * textContent, and nothing leaves the browser: the only storage is this player's own best move counts in localStorage.
 * Nothing here flashes: no element changes brightness faster than a slow fade, so there is no flicker to trigger anyone. */
(function (root) {
  'use strict';
  var L = root.OmegaBridgeLogic;
  var STORE = 'omega_bridge_v1';
  var COLOR = { a: '#c9a84c', b: '#4fe3ff', c: '#b69cff', d: '#5fd18a' };
  var ROMAN = { a: 'I', b: 'II', c: 'III', d: 'IV' };
  var WHY = {
    'too-heavy': 'Too heavy for the thread.', closed: 'That span is closed. Both of you must hold its cradles.',
    occupied: 'Someone is standing there.', wall: 'A wall.', chasm: 'A chasm.', edge: 'The edge.', won: 'Solved.'
  };
  var KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };

  function $(id) { return document.getElementById(id); }
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---- progress: this browser only, validated on read so a damaged or edited value can never break the page */
  function load() {
    var out = { best: {}, level: 0, muted: false };
    try {
      var raw = root.localStorage.getItem(STORE), d = raw ? JSON.parse(raw) : null;
      if (d && typeof d === 'object') {
        L.LEVELS.forEach(function (lv) { var v = d.best && d.best[lv.id]; if (typeof v === 'number' && v >= 1 && v <= 9999 && v === Math.floor(v)) out.best[lv.id] = v; });
        if (typeof d.level === 'number' && d.level >= 0 && d.level < L.LEVELS.length) out.level = Math.floor(d.level);
        out.muted = d.muted === true;
      }
    } catch (e) { /* storage unavailable or unreadable: play without saving */ }
    return out;
  }
  function save(p) { try { root.localStorage.setItem(STORE, JSON.stringify(p)); return true; } catch (e) { return false; } }

  function start() {
    var canvas = $('ob-canvas'), stage = $('ob-stage'), ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!canvas || !ctx) { var m = $('ob-msg'); if (m) m.textContent = 'This browser cannot draw the level.'; return; }
    var prog = load(), idx = prog.level, game, plan, T = 40, dpr = 1, raf = 0, last = 0, shake = 0;
    var vis = { A: { x: 0, y: 0 }, T: { x: 0, y: 0 } }, openT = {}, won = false, audio = null, msgTimer = 0;
    var ui = { who: $('ob-who'), count: $('ob-count'), msg: $('ob-msg'), win: $('ob-win'), levels: $('ob-levels'), sound: $('ob-sound') };

    /* ---- sound: a few short tones, created on the first key or tap, off when muted */
    function tone(freq, dur, when, vol, type) {
      if (prog.muted) return;
      try {
        if (!audio) { var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return; audio = new AC(); }
        if (audio.state === 'suspended' && audio.resume) audio.resume();
        var t0 = audio.currentTime + (when || 0), o = audio.createOscillator(), g = audio.createGain();
        o.type = type || 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + dur + 0.05);
      } catch (e) { /* no audio: the game is fully playable without it */ }
    }
    var SFX = {
      step: function () { tone(196, 0.07, 0, 0.025, 'triangle'); },
      swap: function () { tone(330, 0.06, 0, 0.03, 'triangle'); },
      bump: function () { tone(110, 0.1, 0, 0.04, 'sawtooth'); },
      open: function () { tone(392, 0.5, 0, 0.05); tone(587, 0.6, 0.12, 0.05); tone(784, 0.8, 0.24, 0.04); },
      win: function () { [392, 494, 587, 784].forEach(function (f, i) { tone(f, 0.7, i * 0.11, 0.05); }); }
    };

    function say(text, keep) {
      if (!ui.msg) return;
      ui.msg.textContent = text; root.clearTimeout(msgTimer);
      if (!keep) msgTimer = root.setTimeout(function () { if (ui.msg.textContent === text) ui.msg.textContent = ''; }, 3200);
    }

    /* ---- layout: measured with a ResizeObserver because the page is hidden until approval and no resize event follows the reveal */
    function fit() {
      if (!plan) return;
      var w = stage.clientWidth || 0; if (w < 40) return;
      dpr = Math.min(root.devicePixelRatio || 1, 2);
      T = Math.max(10, Math.min(64, Math.floor(w / plan.w)));   // the whole level always fits the width; the widest is 24 columns
      var cw = T * plan.w, ch = T * plan.h;
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    }

    /* ---- level control */
    function setLevel(i) {
      idx = Math.max(0, Math.min(L.LEVELS.length - 1, i)); prog.level = idx; save(prog);
      game = L.newGame(L.LEVELS[idx]); plan = game.plan; won = false;
      vis.A = { x: plan.start.A % plan.w, y: Math.floor(plan.start.A / plan.w) }; vis.T = { x: plan.start.T % plan.w, y: Math.floor(plan.start.T / plan.w) };
      openT = {}; plan.letters.forEach(function (k) { openT[k] = 0; });
      ui.win.hidden = true; say(idx === 0 ? 'Put one of you on each cradle.' : '', true); renderLevels(); sync(); fit(); wake();
    }
    function renderLevels() {
      var box = ui.levels; box.textContent = '';
      L.LEVELS.forEach(function (lv, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ob-btn ob-lv' + (i > 0 && lv.chapter !== L.LEVELS[i - 1].chapter ? ' ob-chapter' : '');
        b.textContent = lv.name.split('.')[0] + (prog.best[lv.id] ? ' ✓' : '');
        b.setAttribute('aria-label', lv.name + (prog.best[lv.id] ? ', solved in ' + prog.best[lv.id] + ' moves' : ''));
        b.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
        b.addEventListener('click', function () { setLevel(i); canvas.focus(); });
        box.appendChild(b);
      });
    }
    function sync() {
      var s = game.state, lv = L.LEVELS[idx];
      ui.who.textContent = (s.active === 'A' ? 'AUREN' : 'TORIN') + (s.active === 'A' ? ' · HEAVY' : ' · LIGHT');
      ui.count.textContent = s.moves + ' / PAR ' + lv.par;
    }

    /* ---- actions */
    function act(kind, dir) {
      if (won && kind !== 'undo' && kind !== 'restart') return;
      var r;
      if (kind === 'move') {
        r = game.move(dir);
        if (!r.moved) { shake = 1; SFX.bump(); say(WHY[r.blocked] || 'Blocked.'); wake(); return; }
        SFX.step();
        if (r.opened.length) { SFX.open(); say('Span ' + r.opened.map(function (k) { return ROMAN[k]; }).join(', ') + ' open.'); }
        if (game.state.won) finish();
      } else if (kind === 'swap') { if (game.swap()) { SFX.swap(); say((game.state.active === 'A' ? 'Auren' : 'Torin') + '.'); } }
      else if (kind === 'undo') { if (game.undo()) { won = false; ui.win.hidden = true; recheckOpen(); SFX.swap(); } }
      else if (kind === 'restart') { game.restart(); won = false; ui.win.hidden = true; openT = {}; plan.letters.forEach(function (k) { openT[k] = 0; }); say('', true); SFX.swap(); }
      sync(); wake();
    }
    function recheckOpen() { var o = game.state.open; plan.letters.forEach(function (k) { if (!o[k]) openT[k] = 0; }); }
    function finish() {
      won = true; var lv = L.LEVELS[idx], n = game.state.moves, first = !prog.best[lv.id], better = !first && n < prog.best[lv.id];
      if (first || better) { prog.best[lv.id] = n; save(prog); }
      renderLevels(); SFX.win();
      var box = ui.win; box.textContent = '';
      var h = document.createElement('p'); h.className = 'ob-win-h'; h.textContent = n <= lv.par ? 'SOLVED · PAR' : 'SOLVED'; box.appendChild(h);
      var d = document.createElement('p'); d.className = 'ob-win-d'; d.textContent = n + ' moves · par ' + lv.par + (prog.best[lv.id] < n ? ' · best ' + prog.best[lv.id] : ''); box.appendChild(d);
      var row = document.createElement('div'); row.className = 'ob-row';
      function btn(label, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ob-btn'; b.textContent = label; b.addEventListener('click', fn); row.appendChild(b); return b; }
      var again = btn('AGAIN', function () { act('restart'); canvas.focus(); });
      if (idx < L.LEVELS.length - 1) { var nx = btn('NEXT', function () { setLevel(idx + 1); canvas.focus(); }); box.appendChild(row); box.hidden = false; nx.focus(); }
      else { box.appendChild(row); box.hidden = false; again.focus(); }
      say('Solved in ' + n + ' moves.', true);
    }

    /* ---- input */
    canvas.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;   // a held key must not fire a step every few milliseconds
      var k = e.key, dir = KEYS[k];
      if (dir) { e.preventDefault(); act('move', dir); }
      else if (k === ' ' || k === 'q' || k === 'Q' || k === 'x' || k === 'X') { e.preventDefault(); act('swap'); }
      else if (k === 'z' || k === 'Z' || k === 'Backspace') { e.preventDefault(); act('undo'); }
      else if (k === 'r' || k === 'R') { e.preventDefault(); act('restart'); }
      else if ((k === 'n' || k === 'N' || k === 'Enter') && won && idx < L.LEVELS.length - 1) { e.preventDefault(); setLevel(idx + 1); }
      else if (k >= '1' && k <= '9' && Number(k) <= L.LEVELS.length) { e.preventDefault(); setLevel(Number(k) - 1); }
      else if (k === '0' && L.LEVELS.length >= 10) { e.preventDefault(); setLevel(9); }
      else if (k === 'm' || k === 'M') { e.preventDefault(); toggleSound(); }
    });
    function bindBtn(id, fn) { var b = $(id); if (b) b.addEventListener('click', function () { fn(); canvas.focus(); }); }
    bindBtn('ob-swap', function () { act('swap'); }); bindBtn('ob-undo', function () { act('undo'); }); bindBtn('ob-restart', function () { act('restart'); });
    bindBtn('ob-up', function () { act('move', 'U'); }); bindBtn('ob-down', function () { act('move', 'D'); });
    bindBtn('ob-left', function () { act('move', 'L'); }); bindBtn('ob-right', function () { act('move', 'R'); });
    function toggleSound() { prog.muted = !prog.muted; save(prog); paintSound(); if (!prog.muted) SFX.swap(); }
    function paintSound() { if (ui.sound) { ui.sound.textContent = prog.muted ? 'SOUND OFF' : 'SOUND ON'; ui.sound.setAttribute('aria-pressed', prog.muted ? 'false' : 'true'); } }
    if (ui.sound) ui.sound.addEventListener('click', function () { toggleSound(); canvas.focus(); });

    /* tap the other character to swap to it; tap a neighbouring tile to step; swipe to step */
    var down = null;
    canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; canvas.focus(); });
    canvas.addEventListener('pointerup', function (e) {
      if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
      var r = canvas.getBoundingClientRect(), tx = Math.floor((e.clientX - r.left) / T), ty = Math.floor((e.clientY - r.top) / T), s = game.state;
      if (Math.abs(dx) > 24 || Math.abs(dy) > 24) { act('move', Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); return; }
      var other = s.active === 'A' ? s.t : s.a, me = s.active === 'A' ? s.a : s.t, ox = other % plan.w, oy = Math.floor(other / plan.w), mx = me % plan.w, my = Math.floor(me / plan.w);
      if (tx === ox && ty === oy) { act('swap'); return; }
      if (tx === mx + 1 && ty === my) act('move', 'R'); else if (tx === mx - 1 && ty === my) act('move', 'L');
      else if (ty === my + 1 && tx === mx) act('move', 'D'); else if (ty === my - 1 && tx === mx) act('move', 'U');
    });
    canvas.addEventListener('pointercancel', function () { down = null; });

    /* ---- drawing */
    function tile(x, y) { return (x < 0 || y < 0 || x >= plan.w || y >= plan.h) ? '#' : plan.tiles[y * plan.w + x]; }
    function isSpan(c) { return c >= 'A' && c <= 'D'; }
    function isCradle(c) { return c >= 'a' && c <= 'd'; }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function alpha(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

    function drawTile(x, y, now) {
      var c = tile(x, y), px = x * T, py = y * T, s = game.state, idxT = y * plan.w + x;
      if (c === '#') { ctx.fillStyle = '#0d1019'; ctx.fillRect(px, py, T, T); ctx.strokeStyle = '#161b2b'; ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1); return; }
      if (c === ' ' || c === '=' || isSpan(c)) {            // void, and the ground under a thread or a span
        ctx.fillStyle = '#04050a'; ctx.fillRect(px, py, T, T);
        ctx.strokeStyle = 'rgba(79,227,255,0.05)'; ctx.beginPath();
        for (var k = 1; k < 4; k++) { ctx.moveTo(px + (T * k) / 4, py); ctx.lineTo(px + (T * k) / 4, py + T); }
        ctx.stroke();
      } else {                                              // floor, cradle, stone, start tiles
        ctx.fillStyle = '#151a2a'; ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#1a2033'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      }
      if (c === '=') {
        var vert = (isCradle(tile(x, y - 1)) || tile(x, y - 1) === '=') && !(isCradle(tile(x - 1, y)) || tile(x - 1, y) === '=' || isCradle(tile(x + 1, y)) || tile(x + 1, y) === '=');
        ctx.strokeStyle = '#4fe3ff'; ctx.lineWidth = 2; ctx.shadowColor = '#4fe3ff'; ctx.shadowBlur = 6; ctx.beginPath();
        if (vert) { ctx.moveTo(px + T / 2, py); ctx.lineTo(px + T / 2, py + T); } else { ctx.moveTo(px, py + T / 2); ctx.lineTo(px + T, py + T / 2); }
        ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
      }
      if (isSpan(c)) {
        var k2 = c.toLowerCase(), o = openT[k2] || 0, col = COLOR[k2];
        if (o < 1) { ctx.setLineDash([4, 4]); ctx.strokeStyle = alpha(col, 0.55 * (1 - o)); ctx.strokeRect(px + 3.5, py + 3.5, T - 7, T - 7); ctx.setLineDash([]); ctx.fillStyle = alpha(col, 0.07 * (1 - o)); ctx.fillRect(px + 4, py + 4, T - 8, T - 8); }
        if (o > 0) { ctx.fillStyle = alpha('#9fd8e8', 0.42 * o); ctx.fillRect(px + 1, py + 3, T - 2, T - 6); ctx.fillStyle = alpha('#ffffff', 0.35 * o); ctx.fillRect(px + 1, py + 3, T - 2, 2); ctx.strokeStyle = alpha(col, 0.8 * o); ctx.strokeRect(px + 1.5, py + 3.5, T - 3, T - 7); }
      }
      if (isCradle(c)) {
        var col2 = COLOR[c], on = (s.a === idxT || s.t === idxT), op = s.open[c];
        ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.34, 0, 6.2832);
        ctx.fillStyle = alpha(col2, on || op ? 0.3 : 0.08); ctx.fill();
        ctx.strokeStyle = col2; ctx.lineWidth = 2.5; if (on || op) { ctx.shadowColor = col2; ctx.shadowBlur = 8; } ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
        if (T >= 18) { ctx.fillStyle = col2; ctx.font = '700 ' + Math.round(T * 0.26) + 'px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ROMAN[c], px + T / 2, py + T / 2 + 1); }
      }
      if (c === '*') {
        var cx = px + T / 2, cy = py + T / 2, r = T * 0.3, bob = reduced() ? 0 : Math.sin(now / 900) * 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy - r + bob); ctx.lineTo(cx + r * 0.8, cy + bob); ctx.lineTo(cx, cy + r + bob); ctx.lineTo(cx - r * 0.8, cy + bob); ctx.closePath();
        ctx.fillStyle = '#4ccf8a'; ctx.shadowColor = '#4ccf8a'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#bff5d6'; ctx.stroke();
      }
    }

    function drawWalker(who, now) {
      var p = vis[who], s = game.state, active = s.active === who, cx = (p.x + 0.5) * T, cy = (p.y + 0.5) * T, r = T * (who === 'A' ? 0.3 : 0.24);
      ctx.save();
      if (who === 'A') { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = '#e2c86d'; ctx.fill(); ctx.strokeStyle = '#7a5f1c'; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.15); ctx.lineTo(cx + r * 1.05, cy); ctx.lineTo(cx, cy + r * 1.15); ctx.lineTo(cx - r * 1.05, cy); ctx.closePath(); ctx.fillStyle = '#9ad6e8'; ctx.fill(); ctx.strokeStyle = '#2d6f82'; ctx.lineWidth = 2; ctx.stroke(); }
      if (T >= 18) { ctx.fillStyle = '#10131f'; ctx.font = '700 ' + Math.round(T * 0.28) + 'px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(who === 'A' ? 'A' : 'T', cx, cy + 1); }
      if (active) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, T * 0.42, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
        var by = reduced() ? 0 : Math.sin(now / 500) * 2; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx, cy - T * 0.5 + by); ctx.lineTo(cx - 4, cy - T * 0.58 + by); ctx.lineTo(cx + 4, cy - T * 0.58 + by); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function draw(now) {
      if (!plan) return;
      var sx = shake > 0.01 && !reduced() ? (Math.random() - 0.5) * 5 * shake : 0;
      ctx.save(); ctx.translate(sx, 0);
      ctx.fillStyle = '#04050a'; ctx.fillRect(-8, 0, T * plan.w + 16, T * plan.h);
      for (var y = 0; y < plan.h; y++) for (var x = 0; x < plan.w; x++) drawTile(x, y, now);
      drawWalker(game.state.active === 'A' ? 'T' : 'A', now); drawWalker(game.state.active, now);
      ctx.restore();
    }

    /* ---- a frame loop: full speed while something is moving, a slow idle redraw for the stone's bob and the marker, nothing at all
       under reduced motion or in a hidden tab */
    var busy = false, idleTimer = 0;
    function frame(ts) {
      raf = 0;
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000), s = game.state;
      last = ts; busy = false;
      var tgt = { A: { x: s.a % plan.w, y: Math.floor(s.a / plan.w) }, T: { x: s.t % plan.w, y: Math.floor(s.t / plan.w) } };
      ['A', 'T'].forEach(function (w) {
        var p = vis[w], t = tgt[w], k = reduced() ? 1 : Math.min(1, dt * 18);
        p.x += (t.x - p.x) * k; p.y += (t.y - p.y) * k;
        if (Math.abs(t.x - p.x) < 0.01 && Math.abs(t.y - p.y) < 0.01) { p.x = t.x; p.y = t.y; } else busy = true;
      });
      plan.letters.forEach(function (k) {
        var goal = s.open[k] ? 1 : 0, o = openT[k]; if (o === goal) return;
        openT[k] = reduced() ? goal : (goal > o ? Math.min(goal, o + dt * 2.2) : Math.max(goal, o - dt * 4)); busy = true;
      });
      if (shake > 0) { shake = Math.max(0, shake - dt * 5); if (shake > 0) busy = true; }
      draw(ts);
      if (busy) raf = root.requestAnimationFrame(frame);
      else if (!reduced() && !document.hidden) idleTimer = root.setTimeout(function () { idleTimer = 0; wake(); }, 90);
    }
    function wake() {
      if (idleTimer) { root.clearTimeout(idleTimer); idleTimer = 0; }
      if (!raf) { last = 0; raf = root.requestAnimationFrame(frame); }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) root.cancelAnimationFrame(raf); raf = 0; if (idleTimer) root.clearTimeout(idleTimer); idleTimer = 0; } else wake();
    });

    paintSound();
    if (root.ResizeObserver) { new root.ResizeObserver(function () { fit(); }).observe(stage); } else { root.addEventListener('resize', fit); }
    setLevel(idx);
    root.__bridgeTest = root.location && /[?&]test=1/.test(root.location.search) ? { game: function () { return game; }, act: act, setLevel: setLevel, idx: function () { return idx; }, won: function () { return won; }, progress: function () { return prog; } } : undefined;
  }

  root.OmegaBridgeGame = { start: start };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window);
