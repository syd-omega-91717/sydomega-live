/* omega-zw-game.js -- the screen, the input and the sound of ZODIAC WARS: ASCENSION, Slice 0 (PROTOTYPE).
 *
 * The rules live in omega-zw-logic.js and are proven in node; this file only draws them, reads keys, taps and a gamepad, and plays sound. It decides
 * no rule. Canvas 2D, procedural vector fighters (no art file, no downloaded asset), every sound synthesised, text set with textContent, nothing leaves
 * the browser and nothing is stored. The simulation runs at a fixed 60 Hz and is drawn with interpolation, so a frame rate of 30 or 144 plays the same duel.
 * Nothing flashes: no element changes brightness faster than a slow fade. Shadow and Light differ by SHAPE and MOTION (jagged edge, tremor, a gap
 * where the body should be), not only by colour. Reduced motion removes the tremor, the sparks and the screen push. */
(function (root) {
  'use strict';
  var Z = root.OmegaZW;
  var W = 1000, H = 420, FLOOR = 330;
  var I = Z.INPUT;
  var HOUSE_COL = { aries: { body: '#e8662c', edge: '#ffd27a', name: 'KAEL MARREN' }, libra: { body: '#9fd8ee', edge: '#e8f4ff', name: 'ADAEZE OKONKWO-REYES' } };
  var EMBER = '#ff7a3c';
  var K = 1.45;   /* drawn size of a fighter's body against the 1000 x 420 arena (it was 1.0: about 128 px tall and easy to lose) */

  function $(id) { return document.getElementById(id); }
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  function start() {
    var canvas = $('zw-canvas'), stage = $('zw-stage'), ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!canvas || !ctx) { var m = $('zw-msg'); if (m) m.textContent = 'This browser cannot draw the arena.'; return; }

    var g = { demo: false, house: 'aries', seed: 91717, s: null, log: [], mode: 'play', rlog: null, ri: 0, keys: 0, pad: 0, touch: 0, acc: 0, last: 0, prev: { p: 0, e: 0 }, fx: [],
      sound: true, ac: null, hum: null, boxW: 0, raf: 0, shake: 0, flash: 0 };
    var RM = reduced();

    function reset(seed) {
      g.demo = false; g.seed = seed >>> 0 || 1; g.s = Z.start(g.house, g.seed); g.log = []; g.mode = 'play'; g.rlog = null; g.ri = 0; g.fx = []; g.acc = 0; g.last = 0;
      g.prev.p = g.s.p.x; g.prev.e = g.s.e.x;
      $('zw-seed').textContent = 'SEED ' + g.seed;
      $('zw-replay').hidden = true;
      say('Training dummy. Strike it to begin the duel.');
      sync();
    }

    function say(t) { var m = $('zw-msg'); if (m) m.textContent = t; }

    /* ---- sound: a 55 Hz drone pulsing at 9.1717 Hz (CHOICE: a 9 Hz sine alone is below hearing, so the canon number is the pulse, not the pitch) */
    function audio() {
      if (!g.sound || g.ac) return g.ac;
      try {
        var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
        var ac = new AC(), o = ac.createOscillator(), a = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.type = 'sine'; o.frequency.value = 55; a.gain.value = 0.02; lfo.frequency.value = 9.1717; lg.gain.value = 0.012;
        lfo.connect(lg); lg.connect(a.gain); o.connect(a); a.connect(ac.destination); o.start(); lfo.start();
        g.ac = ac; g.hum = a;
      } catch (e) { g.ac = null; }
      return g.ac;
    }
    function blip(freq, dur, type, vol) {
      var ac = g.sound && g.ac; if (!ac) return;
      try {
        var o = ac.createOscillator(), a = ac.createGain(), t = ac.currentTime;
        o.type = type || 'triangle'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.5), t + dur);
        a.gain.setValueAtTime(vol || 0.05, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(a); a.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* a sound that cannot play never stops the duel */ }
    }

    /* ---- events from the rules become words, sparks and sounds */
    function react(ev) {
      var s = g.s;
      ev.forEach(function (e) {
        if (e.type === 'hit') {
          var tx = s[e.to].x, tag = e.perfect ? 'PERFECT GUARD: ' + (e.who === 'p' ? 'the Unbled' : 'you') + ' ' + (e.who === 'p' ? 'is' : 'are') + ' open.'
            : (e.blocked ? 'Blocked, ' + e.damage + ' through.' : (e.who === 'p' ? 'You hit for ' + e.damage + '.' : 'You are hit for ' + e.damage + '.'));
          if (e.countered) tag += ' Countered for ' + e.countered + '.';
          say(tag);
          if (!RM) { g.fx.push({ x: tx, y: FLOOR - 90 * K, t: 0, kind: e.perfect ? 'ring' : 'spark', big: e.kind === 'heavy' }); g.shake = e.perfect ? 0 : (e.kind === 'heavy' ? 7 : 3); }
          blip(e.perfect ? 880 : (e.kind === 'heavy' ? 120 : 220), e.perfect ? 0.35 : 0.14, e.perfect ? 'sine' : 'square', e.perfect ? 0.06 : 0.04);
        } else if (e.type === 'whiff') { blip(300, 0.08, 'sine', 0.015); }
        else if (e.type === 'shadow') { say(e.who === 'p' ? 'YOUR SHADOW STIRS: damage x1.5, no guard, for 8 seconds, then a 3-second stagger.' : 'The Unbled presses: damage x1.5, no guard.'); blip(70, 0.5, 'sawtooth', 0.05); }
        else if (e.type === 'stagger') { say(e.who === 'p' ? 'STAGGER: you cannot act for 3 seconds.' : 'The Unbled staggers. Strike now.'); blip(160, 0.3, 'sine', 0.04); }
        else if (e.type === 'stage') { say('The Unbled. The Aries Shadow: it hits harder and cannot defend. It will not wait.'); blip(70, 0.7, 'sawtooth', 0.05); }
        else if (e.type === 'over') {
          say(e.result === 'win' ? 'THE UNBLED FALLS. Slice 0 complete (a prototype, not a release).' : 'YOU FALL. Restart to try again.');
          $('zw-replay').hidden = g.mode !== 'play';
        }
      });
    }

    /* ---- input: keyboard, gamepad and touch all end up in one bitmask per 60 Hz tick */
    var KEY = { a: I.LEFT, ArrowLeft: I.LEFT, d: I.RIGHT, ArrowRight: I.RIGHT, j: I.LIGHT, z: I.LIGHT, k: I.HEAVY, x: I.HEAVY, l: I.GUARD, c: I.GUARD, u: I.PAY, v: I.PAY };
    function bit(e) { var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key; return KEY[k] || 0; }
    root.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var b = bit(e); if (!b) { if (e.key === 'r' || e.key === 'R') { reset(g.seed); } return; }
      var t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      g.keys |= b; audio(); e.preventDefault();
    });
    root.addEventListener('keyup', function (e) { var b = bit(e); if (b) g.keys &= ~b; });
    root.addEventListener('blur', function () { g.keys = 0; g.touch = 0; });
    function pollPad() {
      var pads = (navigator.getGamepads && navigator.getGamepads()) || [], p = null, i, m = 0;
      for (i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { p = pads[i]; break; }
      if (!p) { g.pad = 0; return; }
      var ax = p.axes[0] || 0; if (ax < -0.4 || (p.buttons[14] && p.buttons[14].pressed)) m |= I.LEFT; if (ax > 0.4 || (p.buttons[15] && p.buttons[15].pressed)) m |= I.RIGHT;
      if (p.buttons[2] && p.buttons[2].pressed) m |= I.LIGHT; if (p.buttons[3] && p.buttons[3].pressed) m |= I.HEAVY;
      if ((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[5] && p.buttons[5].pressed)) m |= I.GUARD; if (p.buttons[1] && p.buttons[1].pressed) m |= I.PAY;
      g.pad = m;
    }
    [['zw-left', I.LEFT], ['zw-right', I.RIGHT], ['zw-light', I.LIGHT], ['zw-heavy', I.HEAVY], ['zw-guard', I.GUARD], ['zw-pay', I.PAY]].forEach(function (p) {
      var el = $(p[0]); if (!el) return;
      function down(e) { g.touch |= p[1]; el.setAttribute('aria-pressed', 'true'); audio(); try { el.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); }
      function up() { g.touch &= ~p[1]; el.setAttribute('aria-pressed', 'false'); }
      el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
      el.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { g.touch |= p[1]; e.preventDefault(); } });
      el.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') g.touch &= ~p[1]; });
    });

    function tick() {
      var inp;
      if (g.mode === 'replay') { inp = g.rlog[g.ri++]; if (g.ri >= g.rlog.length) { g.mode = 'replay-done'; } }
      else {
        /* DEMO: a scripted player (the same one the tests use) plays on this seed. Any real control takes over at once, mid-duel, and the demo ends. */
        if (g.demo && (g.keys | g.pad | g.touch)) { g.demo = false; say('You have the controls.'); }
        inp = g.demo ? (Z.bot(g.s) | 0) : g.driver ? (g.driver(g.s) | 0) : (g.keys | g.pad | g.touch);
        g.log.push(inp);   /* g.driver: a test hook, asked once per 60 Hz tick (nothing in the page sets it) */
      }   /* g.driver: a test hook, asked once per 60 Hz tick (nothing in the page sets it) */
      g.prev.p = g.s.p.x; g.prev.e = g.s.e.x;
      Z.step(g.s, inp || 0);
      if (g.s.ev.length) react(g.s.ev);
    }

    /* ---- drawing */
    function size() {
      var w = Math.round(stage.clientWidth || 0);
      if (!(w > 0)) return false;
      var h = Math.round(w * H / W);
      if (g.boxW === w) return true;
      g.boxW = w;
      var d = Math.min(3, Math.max(1, root.devicePixelRatio || 1));
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      return true;
    }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function fighter(f, x, who, tms) {
      var s = g.s, shadow = Z.isShadow(f) || f.house === 'unbled', isU = f.house === 'unbled', dummy = f.house === 'dummy';
      var col = isU ? { body: '#05060a', edge: EMBER } : dummy ? { body: '#6a5a48', edge: '#a89880' } : HOUSE_COL[f.house];
      var y = FLOOR, dir = f.face, a = f.act, t = f.t, tremor = (shadow && !RM) ? Math.sin(tms / 38) * 2 : 0;
      ctx.save(); ctx.translate(x + tremor, y); ctx.scale(dir, 1);
      /* body: a capsule; the Shadow is an ABSENCE with a jagged ember edge, the Light a clean solid */
      var lean = a === 'light' ? Math.min(1, t / 7) * 14 : a === 'heavy' ? (t < 24 ? -Math.min(1, t / 20) * 16 : 28) : a === 'stagger' ? -10 : 0;
      ctx.rotate(lean * Math.PI / 720);
      ctx.fillStyle = col.body; ctx.strokeStyle = col.edge; ctx.lineWidth = shadow ? 3 : 2;
      ctx.save(); ctx.scale(K, K);   /* the body is drawn K times larger so it reads at arena scale; the arm below is NOT scaled, so its length stays the rule's reach */
      ctx.beginPath(); ctx.moveTo(-18, 0);
      if (shadow) { for (var k = 0; k < 7; k++) ctx.lineTo(-18 + (k % 2 ? 4 : -4), -k * 16 - 8); ctx.lineTo(0, -128); for (k = 6; k >= 0; k--) ctx.lineTo(18 + (k % 2 ? -4 : 4), -k * 16 - 8); }
      else { ctx.lineTo(-20, -86); ctx.quadraticCurveTo(0, -122, 20, -86); ctx.lineTo(18, 0); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -126, 14, 0, 7); ctx.fillStyle = col.body; ctx.fill(); ctx.stroke();
      ctx.restore();
      /* the arm/weapon: its length is the attack's real reach, so the picture and the rule agree */
      if (a === 'light' || a === 'heavy') {
        var A = Z.ATK[a], prog = Math.min(1, t / A.hit), ext = t >= A.hit - 1 && t <= A.hit + 3 ? A.reach : A.reach * 0.2 * prog;
        ctx.lineWidth = a === 'heavy' ? 7 : 4; ctx.strokeStyle = col.edge; ctx.beginPath(); ctx.moveTo(10 * K, -90 * K); ctx.lineTo(ext, -90 * K - (a === 'heavy' ? 10 : 0)); ctx.stroke();   /* the tip is `ext` from the body's centre: at full extension exactly the rule's reach */
      }
      if (a === 'guard') { ctx.lineWidth = f.guardT <= Z.PERFECT_FRAMES ? 6 : 3; ctx.strokeStyle = f.guardT <= Z.PERFECT_FRAMES ? '#ffffff' : col.edge; ctx.beginPath(); ctx.arc(26 * K, -86 * K, 46 * K, -1.2, 1.2); ctx.stroke(); }
      if (a === 'open') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.strokeRect(-30 * K, -150 * K, 60 * K, 156 * K); ctx.setLineDash([]); }
      ctx.restore();
    }

    function bar(x, y, w, v, max, col, label, right) {
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, w, 12);
      ctx.fillStyle = col; var fw = Math.max(0, Math.min(1, v / max)) * w; ctx.fillRect(right ? x + w - fw : x, y, fw, 12);
      ctx.fillStyle = '#dfe8f0'; ctx.font = '12px Courier New, monospace'; ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(label, right ? x + w : x, y - 4);
    }

    function draw(tms) {
      if (!size()) return;
      var s = g.s, d = Math.min(3, Math.max(1, root.devicePixelRatio || 1)), k = canvas.width / W;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      var sx = (!RM && g.shake > 0) ? (Math.sin(tms / 20) * g.shake) : 0; if (g.shake > 0) g.shake = Math.max(0, g.shake - 0.4);
      ctx.save(); ctx.translate(sx, 0);
      /* the Ares Foundry floor, Mars: a forge arch, an anvil, a dark red floor */
      var gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120806'); gr.addColorStop(0.7, '#2a1208'); gr.addColorStop(1, '#0b0504');
      ctx.fillStyle = gr; ctx.fillRect(-20, 0, W + 40, H);
      ctx.fillStyle = '#1a0d08'; ctx.fillRect(-20, FLOOR, W + 40, H - FLOOR); ctx.strokeStyle = 'rgba(255,122,60,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, FLOOR); ctx.lineTo(W + 20, FLOOR); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,122,60,.18)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W / 2, FLOOR + 60, 430, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.fillStyle = '#0d0605'; ctx.fillRect(80, FLOOR - 40, 70, 40); ctx.fillRect(60, FLOOR - 56, 110, 18); ctx.fillRect(850, FLOOR - 28, 90, 28);
      var alpha = Math.min(1, g.acc / (1000 / 60)), px = lerp(g.prev.p, s.p.x, alpha), ex = lerp(g.prev.e, s.e.x, alpha);
      fighter(s.e, ex, 'e', tms); fighter(s.p, px, 'p', tms);
      g.fx = g.fx.filter(function (f) { f.t += 1; return f.t < 24; });
      g.fx.forEach(function (f) {
        ctx.strokeStyle = f.kind === 'ring' ? '#ffffff' : '#ffd27a'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - f.t / 24;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8 + f.t * (f.big ? 3 : 2), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      });
      ctx.restore();
      /* HUD: health, overreach, the shadow clock, and the visible frame data */
      var pn = HOUSE_COL[s.house].name, en = s.e.house === 'unbled' ? 'THE UNBLED' : 'TRAINING DUMMY';
      bar(20, 30, 360, s.p.hp, Z.HEALTH, '#e8c66a', pn + '  ' + s.p.hp, false);
      bar(620, 30, 360, s.e.hp, Z.HEALTH, '#c0413a', en + '  ' + s.e.hp, true);
      bar(20, 62, 360, s.p.sh > 0 ? s.p.sh : s.p.oc, s.p.sh > 0 ? Z.SHADOW_FRAMES : 100, s.p.sh > 0 ? EMBER : '#9b6bf0', s.p.sh > 0 ? 'SHADOW ' + (s.p.sh / 60).toFixed(1) + 's' : 'OVERREACH ' + s.p.oc, false);
      ctx.textAlign = 'left'; ctx.fillStyle = '#9aa7b4'; ctx.font = '12px Courier New, monospace';
      ctx.fillText(frameTxt(s.p), 20, 96); ctx.textAlign = 'right'; ctx.fillText(frameTxt(s.e), 980, 62 + 0);
    }
    function frameTxt(f) {
      var A = Z.ATK[f.act];
      return f.act.toUpperCase() + (A ? ' ' + Math.min(f.t, A.total) + '/' + (A.total + A.after) : (f.act === 'stagger' ? ' ' + (f.stag / 60).toFixed(1) + 's' : (f.act === 'guard' ? ' ' + f.guardT + (f.guardT <= Z.PERFECT_FRAMES ? ' PERFECT' : '') : '')));
    }

    function sync() {
      var s = g.s, pv = Z.preview(s, 'p', 'light', (g.keys | g.pad | g.touch) & I.PAY), hv = Z.preview(s, 'p', 'heavy', (g.keys | g.pad | g.touch) & I.PAY);
      var t = 'LIGHT ' + pv.damage + ' dmg, ' + pv.frames + 'f  |  HEAVY ' + hv.damage + ' dmg, ' + hv.frames + 'f  |  COST: ' + pv.label;
      var el = $('zw-preview'); if (el && el.textContent !== t) el.textContent = t;
      var st = $('zw-who'); var w = 'STAGE ' + (s.stage + 1) + ' OF 2 · ' + (s.stage === 0 ? 'TRAINING DUMMY' : 'THE UNBLED') + ' · ' + HOUSE_COL[s.house].name + (g.demo ? ' · DEMO: SCRIPTED PLAYER, NOT A PERSON' : '');   /* the take-over instruction is in the message line (aria-live) so this stays short on a phone */
      if (st && st.textContent !== w) st.textContent = w;
    }

    function loop(now) {
      g.raf = root.requestAnimationFrame(loop);
      if (!g.last) g.last = now;
      var dt = Math.min(100, now - g.last); g.last = now; g.acc += dt;
      pollPad();
      var STEP = 1000 / Z.HZ;
      while (g.acc >= STEP) { g.acc -= STEP; if (!g.s.over && g.mode !== 'replay-done') tick(); }
      if (g.mode === 'replay-done' && g.s.over) { g.mode = 'play'; $('zw-replay').hidden = false; }
      draw(now); sync();
    }

    /* ---- controls */
    function house(h) { g.house = h; ['aries', 'libra'].forEach(function (x) { var b = $('zw-h-' + x); if (b) b.setAttribute('aria-pressed', x === h ? 'true' : 'false'); }); reset(g.seed); }
    $('zw-h-aries').addEventListener('click', function () { house('aries'); });
    $('zw-h-libra').addEventListener('click', function () { house('libra'); });
    $('zw-restart').addEventListener('click', function () { reset(g.seed); });
    $('zw-demo').addEventListener('click', function () { reset(g.seed); g.demo = true; say('DEMO: a scripted player, not a person, plays this seed. Press any control to take over.'); audio(); });
    $('zw-newseed').addEventListener('click', function () { reset(Math.floor(Math.random() * 1e9) + 1); });
    $('zw-replay').addEventListener('click', function () {
      var log = g.log.slice(), seed = g.seed, h = g.house; g.s = Z.start(h, seed); g.mode = 'replay'; g.rlog = log; g.ri = 0; g.acc = 0; g.fx = []; $('zw-replay').hidden = true;
      g.prev.p = g.s.p.x; g.prev.e = g.s.e.x; say('REPLAY of your last duel from seed ' + seed + ': the same inputs make the same duel, frame for frame.');
    });
    $('zw-sound').addEventListener('click', function () { g.sound = !g.sound; this.setAttribute('aria-pressed', String(g.sound)); this.textContent = g.sound ? 'SOUND ON' : 'SOUND OFF'; if (g.ac) { try { g.sound ? g.ac.resume() : g.ac.suspend(); } catch (e) { } } if (g.sound) audio(); });
    if (root.ResizeObserver) new root.ResizeObserver(function () { g.boxW = 0; }).observe(stage);

    root.OmegaZWGame = { state: function () { return g.s; }, feed: function (inp) { g.keys = inp; }, drive: function (fn) { g.driver = typeof fn === 'function' ? fn : null; }, reset: reset, log: function () { return g.log.slice(); } };
    reset(g.seed);
    g.raf = root.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window);
