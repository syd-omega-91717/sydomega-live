/* omega-reels.js -- procedural REELS: one 22-second animatic for each of the twelve agents in omega-agents.json.
 *
 * A reel is NOT footage and says so on screen. It is generative art in the agent's element, the agent's own greeting typed out, its voice words, its five
 * domains, its sign, element and god. Every string it draws comes from that one record (or is one of a few fixed labels); nothing is written for it here.
 * That is checked, not promised: scripts/tests/test_reels.py draws every reel through a recording canvas and fails if any drawn text is not in the record.
 *
 * Everything on screen is a pure function of the time T (seconds) and a seed from the agent's name, so frame T always looks the same, any frame can be tested
 * and screenshotted, and a scrubber is exact. The five element motifs here (fire, water, wind, metal, sand) are drawn by this file rather than by
 * omega-element-motif.js on purpose: that module is self-driven (a requestAnimationFrame loop per mount that cannot be cancelled), so a reel that switched agent
 * would leave a loop running into a detached canvas for every switch. The colour is the canon's (OmegaEmblem.color(sign)); the look is this file's own.
 *
 * Works as a browser global (window.OmegaReels, mounting into [data-omega-reels]) and as a CommonJS module for node tests (plan, draw, beats, DURATION). */
(function (root) {
  'use strict';

  var DURATION = 22;
  var BEATS = [['open', 0, 2.5], ['name', 2.5, 6], ['voice', 6, 12], ['domains', 12, 18], ['close', 18, 22]];
  var LABEL = 'PROCEDURAL ANIMATIC · NOT FOOTAGE';
  var FIXED = [LABEL, 'Ω SYD OMEGA 91717', 'SIGN', 'ELEMENT', 'GOD', 'VOICE', 'DOMAINS', '·', 'OPEN THE AGENT'];
  var MOTIFS = { fire: 1, water: 1, wind: 1, metal: 1, sand: 1 };
  var FALLBACK = '#c9a84c';

  function hash(s) { var h = 0x811c9dc5, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function smooth(a, b, t) { var x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function rgba(hex, a) { var n = parseInt(String(hex).replace('#', ''), 16); if (isNaN(n)) n = 0xc9a84c; return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* One agent record -> the plan a reel plays. Pure. The motif is the element's own name; an element the five motifs do not cover falls back to metal. */
  function plan(a) {
    var el = String(a.element || '').toLowerCase();
    return {
      id: String(a.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: String(a.name || ''), sign: String(a.sign || ''), element: String(a.element || ''), god: String(a.god || ''),
      role: String(a.role || ''), voice: String(a.voice || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean), greeting: String(a.greeting || ''),
      domains: (a.domains || []).slice(0, 5).map(String), href: String(a.href || ''), motif: MOTIFS[el] ? el : 'metal', seed: hash(String(a.name) + '|' + String(a.sign))
    };
  }

  function beatAt(T) { var i; for (i = 0; i < BEATS.length; i++) if (T < BEATS[i][2]) return BEATS[i][0]; return 'close'; }

  /* ---- backgrounds: five element motifs, each a pure function of T and the seed */
  function motif(ctx, p, T, W, H, col) {
    var r = rng(p.seed), i, n;
    if (p.motif === 'fire') {
      for (i = 0; i < 95; i++) {
        var x0 = r() * W, sp = 40 + r() * 90, off = r() * H * 1.2, rad = 2 + r() * 5.5, sway = 8 + r() * 26, ph = r() * 6.28;
        var y = H - ((T * sp + off) % (H * 1.15)), life = 1 - (H - y) / (H * 1.15);
        ctx.fillStyle = rgba(col, 0.85 * clamp(life, 0, 1)); ctx.beginPath(); ctx.arc(x0 + Math.sin(T * 1.3 + ph) * sway, y, rad * (0.4 + life), 0, 6.2832); ctx.fill();
      }
    } else if (p.motif === 'water') {
      for (n = 0; n < 3; n++) {
        var cx = W * (0.25 + r() * 0.5), cy = H * (0.3 + r() * 0.4);
        for (i = 0; i < 6; i++) { var rr = (T * 38 + i * 62 + n * 20) % 380; ctx.strokeStyle = rgba(col, 0.35 * (1 - rr / 380)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); }
      }
    } else if (p.motif === 'wind') {
      for (i = 0; i < 16; i++) {
        var yb = (i + 0.5) * H / 16, f = 0.006 + r() * 0.01, sp2 = 0.6 + r() * 1.4, amp = 8 + r() * 26, x;
        ctx.strokeStyle = rgba(col, 0.1 + 0.2 * r()); ctx.lineWidth = 1.2; ctx.beginPath();
        for (x = 0; x <= W; x += 24) { var yy = yb + Math.sin(x * f + T * sp2 + i) * amp; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.stroke();
      }
    } else if (p.motif === 'sand') {
      for (i = 0; i < 150; i++) { var a = i * 2.39996 + T * 0.16, rd = Math.sqrt(i) * 19; ctx.fillStyle = rgba(col, 0.1 + 0.35 * (1 - i / 150)); ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * rd, H / 2 + Math.sin(a) * rd * 0.62, 1.6 + (i % 4) * 0.5, 0, 6.2832); ctx.fill(); }
    } else {
      ctx.strokeStyle = rgba(col, 0.13); ctx.lineWidth = 1; ctx.beginPath();
      for (i = -H; i < W; i += 46) { ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.moveTo(i + H, 0); ctx.lineTo(i, H); }
      ctx.stroke();
      var sx = (T * 130) % (W + 260) - 130; ctx.fillStyle = rgba(col, 0.1); ctx.fillRect(sx, 0, 70, H);
    }
  }

  function wrap(ctx, text, maxW) {
    var words = text.split(' '), lines = [], cur = '', i, test;
    for (i = 0; i < words.length; i++) { test = cur ? cur + ' ' + words[i] : words[i]; if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = words[i]; } else cur = test; }
    if (cur) lines.push(cur);
    return lines;
  }

  /* Draw frame T of a plan into ctx (logical size W x H), colour col. Pure: the same arguments draw the same calls. The caller owns the transform (it scales the logical
     960 x 540 frame to the canvas); draw must not reset it, or the frame is drawn at device-pixel scale and cropped (it was, and the label fell off the canvas). */
  function draw(ctx, T, p, W, H, col) {
    col = col || FALLBACK;
    var fade = Math.min(smooth(0, 1, T), 1 - smooth(DURATION - 1.2, DURATION, T)), bar = H * 0.085, i;
    ctx.fillStyle = '#07070b'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = fade * (0.55 + 0.25 * smooth(2.5, 6, T)); motif(ctx, p, T, W, H, col); ctx.restore();
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85); vg.addColorStop(0, 'rgba(7,7,11,0)'); vg.addColorStop(1, 'rgba(7,7,11,0.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var disp = '"Cinzel Decorative", Georgia, serif', mono = '"Courier Prime", "Courier New", monospace';

    /* open: the ring draws, the sign appears inside it */
    var ringP = smooth(0, 2.2, T), ringA = 1 - smooth(5.2, 6.4, T);
    ctx.strokeStyle = rgba(col, 0.9 * ringA); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2 - 6, 112, -1.5708, -1.5708 + 6.2832 * ringP); ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.7 * smooth(0.6, 1.8, T) * ringA); ctx.font = '13px ' + mono; ctx.fillText('Ω SYD OMEGA 91717', W / 2, H / 2 - 150);
    ctx.fillStyle = rgba(col, smooth(1, 2.2, T) * ringA); ctx.font = '600 34px ' + disp; ctx.fillText(p.sign.toUpperCase(), W / 2, H / 2 - 6);

    /* name: letters arrive one by one, then the role */
    if (T >= 2.5) {
      var nm = p.name.toUpperCase(), lw = Math.min(70, (W - 160) / Math.max(nm.length, 1)), x0 = W / 2 - lw * (nm.length - 1) / 2, a2 = 1 - smooth(5.4, 6.2, T);
      ctx.font = '700 ' + Math.round(lw * 1.25) + 'px ' + disp;
      for (i = 0; i < nm.length; i++) { var la = smooth(2.5 + i * 0.12, 3 + i * 0.12, T); ctx.fillStyle = rgba('#ffffff', la * a2); ctx.fillText(nm.charAt(i), x0 + i * lw, H / 2 + 120 - (1 - la) * 22); }
      ctx.font = '15px ' + mono; ctx.fillStyle = rgba(col, smooth(4, 4.8, T) * a2); ctx.fillText(p.role.toUpperCase(), W / 2, H / 2 + 168);
    }

    /* voice: the agent's own greeting, typed; its voice words under it */
    if (T >= 6 && T < 12.6) {
      var va = smooth(6, 6.6, T) * (1 - smooth(11.6, 12.4, T)), typed = p.greeting.slice(0, Math.max(0, Math.floor((T - 6.4) * 20)));
      ctx.fillStyle = rgba(col, 0.9 * va); ctx.font = '12px ' + mono; ctx.fillText('VOICE', W / 2, H * 0.27);
      ctx.font = '28px ' + disp; ctx.fillStyle = rgba('#ffffff', va);
      var lines = wrap(ctx, p.greeting, W - 220), shown = 0, ln, part;
      for (i = 0; i < lines.length; i++) {
        ln = lines[i]; part = typed.slice(shown, shown + ln.length + 1).replace(/\s+$/, ''); shown += ln.length + 1;
        if (part) ctx.fillText(part, W / 2, H * 0.4 + i * 42);
      }
      for (i = 0; i < p.voice.length; i++) { ctx.font = '14px ' + mono; ctx.fillStyle = rgba(col, va * smooth(9 + i * 0.4, 9.6 + i * 0.4, T)); ctx.fillText(p.voice[i].toUpperCase(), W / 2 + (i - (p.voice.length - 1) / 2) * 190, H * 0.78); }
    }

    /* domains: five words arrive; sign, element and god beside them */
    if (T >= 12 && T < 18.6) {
      var da = 1 - smooth(17.6, 18.5, T);
      ctx.textAlign = 'left'; ctx.font = '12px ' + mono; ctx.fillStyle = rgba(col, da * smooth(12, 12.5, T)); ctx.fillText('DOMAINS', 90, H * 0.22);
      for (i = 0; i < p.domains.length; i++) { var dd = smooth(12.3 + i * 0.9, 13 + i * 0.9, T); ctx.font = '700 46px ' + disp; ctx.fillStyle = rgba('#ffffff', dd * da); ctx.fillText(p.domains[i].toUpperCase(), 90 + (1 - dd) * -40, H * 0.32 + i * 58); }
      var meta = [['SIGN', p.sign], ['ELEMENT', p.element], ['GOD', p.god]];
      for (i = 0; i < meta.length; i++) { var ma = smooth(13 + i * 0.7, 13.7 + i * 0.7, T) * da; ctx.font = '12px ' + mono; ctx.fillStyle = rgba(col, ma); ctx.fillText(meta[i][0], W - 330, H * 0.36 + i * 78); ctx.font = '600 30px ' + disp; ctx.fillStyle = rgba('#ffffff', ma); ctx.fillText(meta[i][1].toUpperCase(), W - 330, H * 0.36 + i * 78 + 32); }
      ctx.textAlign = 'center';
    }

    /* close: the name, and where the agent lives */
    if (T >= 18) {
      var ca = smooth(18, 18.8, T);
      ctx.font = '700 64px ' + disp; ctx.fillStyle = rgba('#ffffff', ca); ctx.fillText(p.name.toUpperCase(), W / 2, H / 2 - 10);
      ctx.font = '14px ' + mono; ctx.fillStyle = rgba(col, ca * smooth(19, 19.8, T)); ctx.fillText('OPEN THE AGENT', W / 2, H / 2 + 50);
      ctx.fillStyle = rgba('#ffffff', ca * smooth(19.4, 20.2, T) * 0.8); ctx.fillText(p.href, W / 2, H / 2 + 76);
    }
    ctx.restore();

    /* letterbox and the label that says what this is, always on */
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '11px "Courier Prime", "Courier New", monospace'; ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.fillText(LABEL, 20, H - bar / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = rgba(col, 0.9); ctx.fillText(p.name.toUpperCase() + ' · ' + Math.min(DURATION, T).toFixed(1) + ' / ' + DURATION + ' S', W - 20, H - bar / 2);
  }

  var api = { DURATION: DURATION, BEATS: BEATS, LABEL: LABEL, FIXED: FIXED, plan: plan, beatAt: beatAt, draw: draw, hash: hash };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ---------------------------------------------------------------- the page: a stage, twelve chips, play, scrub */
  var doc = root.document;
  if (!doc) { root.OmegaReels = api; return; }
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function h(tag, attrs, kids) { var e = doc.createElement(tag), k; for (k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }

  function mount(host) {
    if (!host || host.__omegaReels) return;
    host.__omegaReels = true;
    var msg = h('p', { 'class': 'rl-msg', role: 'status', 'aria-live': 'polite' }), chips = h('div', { 'class': 'rl-chips', role: 'group', 'aria-label': 'Choose an agent' });
    var cv = h('canvas', { 'class': 'rl-canvas', role: 'img', 'aria-label': 'A procedural animatic of the chosen agent.' }), stage = h('div', { 'class': 'rl-stage' }, [cv]);
    var play = h('button', { type: 'button', 'class': 'rl-btn', text: 'PAUSE' }), rst = h('button', { type: 'button', 'class': 'rl-btn', text: 'RESTART' });
    var scrub = h('input', { type: 'range', 'class': 'rl-scrub', min: '0', max: String(DURATION * 10), step: '1', value: '0', 'aria-label': 'Position in the reel' });
    var clock = h('span', { 'class': 'rl-clock', 'aria-hidden': 'true' });
    host.appendChild(chips); host.appendChild(stage); host.appendChild(h('div', { 'class': 'rl-row' }, [play, rst, scrub, clock])); host.appendChild(msg);
    var s = { plans: [], i: 0, T: 0, playing: false, last: 0, w: 0, RM: reduced() };

    function resize() {
      var w = Math.round(stage.clientWidth || 0);
      if (!(w > 0)) return false;
      if (s.w === w) return true;
      s.w = w; var d = Math.min(3, Math.max(1, root.devicePixelRatio || 1)), hh = Math.round(w * 9 / 16);
      cv.width = Math.round(w * d); cv.height = Math.round(hh * d); cv.style.width = w + 'px'; cv.style.height = hh + 'px';
      return true;
    }
    function paint() {
      if (!s.plans.length || !resize()) return;
      var p = s.plans[s.i], c = cv.getContext('2d'), k = cv.width / 960, col = (root.OmegaEmblem && root.OmegaEmblem.color) ? root.OmegaEmblem.color(p.sign) : FALLBACK;
      c.setTransform(k, 0, 0, k, 0, 0); draw(c, s.T, p, 960, 540, col);
      scrub.value = String(Math.round(s.T * 10)); clock.textContent = s.T.toFixed(1) + ' / ' + DURATION + ' S';
    }
    function loop(now) {
      root.requestAnimationFrame(loop);
      if (!s.last) s.last = now;
      var dt = Math.min(100, now - s.last) / 1000; s.last = now;
      if (s.playing && stage.clientWidth > 0) { s.T += dt; if (s.T >= DURATION) { s.T = DURATION; s.playing = false; play.textContent = 'REPLAY'; } }
      paint();
    }
    function pick(i) {
      s.i = i; s.T = s.RM ? 16 : 0; s.playing = !s.RM; play.textContent = s.playing ? 'PAUSE' : 'PLAY';
      Array.prototype.forEach.call(chips.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var p = s.plans[i]; cv.setAttribute('aria-label', 'A procedural animatic of ' + p.name + ', ' + p.role + '. Sign ' + p.sign + ', element ' + p.element + ', god ' + p.god + '. Its greeting: ' + p.greeting + ' Its domains: ' + p.domains.join(', ') + '. Not footage.');
      msg.textContent = p.name + ' · ' + p.role + '. A procedural animatic built from this agent’s own record in omega-agents.json: generative art, its greeting, its domains, sign, element and god. Not footage; no voice.';
    }
    play.addEventListener('click', function () { if (s.T >= DURATION) s.T = 0; s.playing = !s.playing; play.textContent = s.playing ? 'PAUSE' : 'PLAY'; });
    rst.addEventListener('click', function () { s.T = 0; s.playing = true; play.textContent = 'PAUSE'; });
    scrub.addEventListener('input', function () { s.T = Number(scrub.value) / 10; s.playing = false; play.textContent = 'PLAY'; });
    if (root.ResizeObserver) new root.ResizeObserver(function () { s.w = 0; }).observe(stage);
    root.OmegaReelsInstance = { state: function () { return { i: s.i, T: s.T, playing: s.playing, w: s.w, count: s.plans.length, name: s.plans[s.i] && s.plans[s.i].name }; }, seek: function (T) { s.T = T; s.playing = false; }, pick: pick };

    root.fetch('/omega-agents.json', { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      var list = (d && d.agents) || [];
      if (!list.length) throw new Error('no agents in omega-agents.json');
      s.plans = list.map(plan);
      s.plans.forEach(function (p, i) { var b = h('button', { type: 'button', 'class': 'rl-chip', 'aria-pressed': 'false', text: p.name.toUpperCase() }); b.addEventListener('click', function () { pick(i); }); chips.appendChild(b); });
      pick(0); root.requestAnimationFrame(loop);
    }).catch(function (e) {
      msg.textContent = 'The reels could not load the agent list (' + e.message + '). Nothing is shown in its place.';
    });
  }

  /* A tab button marked data-reels-tab="<panel id>" opens that panel through the page's own switchTab (looked up at click time). This is here, not an inline onclick,
     because the CSP inline ratchet (scripts/csp-inline-ratchet.py) forbids adding inline handlers. */
  function wireTabs() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-reels-tab]'), function (b) {
      b.addEventListener('click', function () { if (typeof root.switchTab === 'function') root.switchTab(b, b.getAttribute('data-reels-tab')); });
    });
  }
  function start() { wireTabs(); Array.prototype.forEach.call(doc.querySelectorAll('[data-omega-reels]'), mount); }
  root.OmegaReels = { plan: plan, draw: draw, DURATION: DURATION, BEATS: BEATS, LABEL: LABEL, mount: mount };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
