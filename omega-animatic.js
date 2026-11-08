/* omega-animatic.js -- procedural ANIMATICS for the Studios franchises (PROTOTYPE).
 *
 * An animatic is a timed moving storyboard: the cold open of a series' first episode, played as generative art with the actual spoken lines as
 * kinetic type and a synthesized score. It is NOT footage and NOT a trailer: no actors, no voices, no filmed shot exists, and the screen says so.
 *
 * Everything on screen is a pure function of time T (seconds) and a seed derived from the franchise id, so frame T always looks the same and any
 * frame can be rendered, tested and screenshotted without playing the film. Text is never copied into this file: the lines come from the episode
 * script and the titles from the registry-derived library payload, both of which only an owner session receives.
 *
 * Works as a browser global (window.OmegaAnimatic); the pure parts (coldOpen, plan) also load under node for tests. */
(function (root) {
  'use strict';

  var DURATION = 28, LINE_FROM = 4.5, LINE_TO = 21.5, TITLE_AT = 22.5, FADE_IN = 1.4, FADE_OUT = 1.3, BAR = 0.085;
  var TAU = Math.PI * 2;

  /* How each franchise LOOKS. Visual language only: the words come from the payload. */
  var VISUALS = {
    'zodiac-wars': { motif: 'rings', palette: ['#07080f', '#c9a84c', '#e8f4ff'], base: 55, sub: 9.1717 },
    'myth-of-the-stones': { motif: 'stones', palette: ['#070a0c', '#5fd18a', '#e9d9a6'], base: 98, sub: 0 },
    'the-omega-chronicles': { motif: 'forecast', palette: ['#06090f', '#4fe3ff', '#ffb347'], base: 55, sub: 9.1717 },
    'the-lost-civilizations': { motif: 'strata', palette: ['#0c0805', '#c98a4c', '#f3dcae'], base: 73.4, sub: 0 },
    'the-last-galactic-empire': { motif: 'starmap', palette: ['#05060d', '#c9a84c', '#ff7a9c'], base: 65.4, sub: 0 },
    'the-human-frontier': { motif: 'wall', palette: ['#0a0907', '#d8d2c2', '#ffb347'], base: 82.4, sub: 0 }
  };
  var ORDER = ['myth-of-the-stones', 'zodiac-wars', 'the-omega-chronicles', 'the-lost-civilizations', 'the-last-galactic-empire', 'the-human-frontier'];

  /* ---------- small helpers */
  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + clamp01(a).toFixed(3) + ')'; }

  /* ---------- the words: the first spoken lines of the cold open, taken from the Fountain script itself */
  var SCENE = /^(INT\.|EXT\.|INT\/EXT|I\/E)/;
  function isCue(line) { return line.length > 0 && line.length <= 42 && line === line.toUpperCase() && /[A-Z]/.test(line) && !SCENE.test(line) && !/^(ACT |TAG|FADE|CUT |SMASH|SUPER|INSERT|MAIN TITLES|CLOSING|THE END)/.test(line) && !/(TO:|TO BLACK\.)$/.test(line); }
  function coldOpen(text, max) {
    max = max || 4;
    var lines = String(text || '').split('\n'), out = [], i = 0, started = false;
    for (; i < lines.length; i++) if (/^FADE IN:/.test(lines[i].trim())) { started = true; i++; break; }
    if (!started) i = 0;
    for (; i < lines.length && out.length < max; i++) {
      var line = lines[i].trim();
      if (/^(MAIN TITLES|ACT ONE)/.test(line)) break;
      var cue = line.replace(/\s*\(.*\)\s*$/, '');
      if ((i === 0 || lines[i - 1].trim() === '') && isCue(cue) && i + 1 < lines.length && lines[i + 1].trim() !== '') {
        var speech = [], j = i + 1;
        for (; j < lines.length && lines[j].trim() !== ''; j++) { var s = lines[j].trim(); if (!/^\(.*\)$/.test(s)) speech.push(s); }
        if (speech.length) out.push({ who: cue, text: speech.join(' ') });
        i = j;
      }
    }
    return out;
  }

  /* ---------- the plan: titles, timed lines, palette. Pure, no DOM. */
  function plan(franchise, episodeText) {
    var v = VISUALS[franchise.id];
    if (!v) return null;
    var spoken = coldOpen(episodeText, 4), lines = spoken.length ? spoken : [{ who: '', text: franchise.premise }];
    var slot = (LINE_TO - LINE_FROM) / lines.length;
    return { id: franchise.id, title: franchise.title, seriesTitle: franchise.series.title, motif: v.motif, palette: v.palette, base: v.base, sub: v.sub, seed: hash(franchise.id), duration: DURATION,
      titleAt: TITLE_AT, fromScript: spoken.length > 0, lines: lines.map(function (l, k) { return { who: l.who, text: l.text, at: +(LINE_FROM + k * slot).toFixed(2), dur: +(slot - 0.5).toFixed(2) }; }) };
  }
  function activeLine(p, T) { for (var i = 0; i < p.lines.length; i++) if (T >= p.lines[i].at && T < p.lines[i].at + p.lines[i].dur) return p.lines[i]; return null; }

  /* ---------- motifs: each draws the picture for time T. State is rebuilt from the seed, never kept between frames. */
  function stars(c, W, H, T, p, rnd, n, amt) {
    for (var i = 0; i < n; i++) { var x = rnd() * W, y = rnd() * H, r = 0.4 + rnd() * 1.3, tw = 0.5 + 0.5 * Math.sin(T * (0.4 + rnd()) + i); c.fillStyle = rgba('#dfe6ff', amt * (0.25 + 0.6 * tw) * (r / 1.7)); c.fillRect(x, y, r, r); }
  }
  function mRings(c, W, H, T, p) {
    var rnd = mulberry(p.seed), cx = W / 2, cy = H * 0.52, R = Math.min(W, H * 1.15) * 0.43, a = smooth(0, 4, T), i;
    stars(c, W, H, T, p, rnd, 110, a);
    for (i = 0; i < 9; i++) {                                              // nine rings: five lit, four dark and stopped
      var r = R * (0.2 + 0.09 * i), lit = i < 5, ang = T * (0.16 + 0.05 * i) * (i % 2 ? -1 : 1);
      c.lineWidth = lit ? 1.6 : 1; c.setLineDash(lit ? [] : [3, 9]); c.strokeStyle = lit ? rgba(p.palette[1], a * 0.55) : rgba('#8a93b4', a * 0.3);
      c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); c.setLineDash([]);
      if (lit) { c.lineWidth = 4; c.strokeStyle = rgba(p.palette[1], a * 0.95); c.shadowColor = p.palette[1]; c.shadowBlur = 14; c.beginPath(); c.arc(cx, cy, r, ang, ang + 0.55 + 0.12 * i); c.stroke(); c.shadowBlur = 0; }
      else { c.fillStyle = rgba('#8a93b4', a * 0.55); c.beginPath(); c.arc(cx + r * Math.cos(1.1 + i), cy + r * Math.sin(1.1 + i), 2.6, 0, TAU); c.fill(); }
    }
    var d = smooth(6.5, 11, T), top = cy - R * 1.04, hw = 3 + 4 * d;      // the white door at the northern quarter, a hand's width open
    var g = c.createLinearGradient(0, top - R * 0.55, 0, top + 6); g.addColorStop(0, rgba(p.palette[2], 0)); g.addColorStop(1, rgba(p.palette[2], 0.55 * d));
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - hw * 5, top - R * 0.55); c.lineTo(cx + hw * 5, top - R * 0.55); c.lineTo(cx + hw, top + 6); c.lineTo(cx - hw, top + 6); c.closePath(); c.fill();
    c.fillStyle = rgba(p.palette[2], 0.95 * d); c.shadowColor = p.palette[2]; c.shadowBlur = 24 * d; c.fillRect(cx - hw / 2, top - 22, hw, 28); c.shadowBlur = 0;
    var h = smooth(15, 22, T);                                              // a single hand rests on the frame
    if (h > 0) { c.fillStyle = rgba(p.palette[2], 0.35 * h); c.beginPath(); c.arc(cx + hw * 3, top - 8, 7, 0, TAU); c.fill(); for (i = 0; i < 4; i++) { c.fillRect(cx + hw * 3 - 9 + i * 5, top - 22 - (i % 2) * 3, 3.2, 12); } }
  }
  function poly(c, cx, cy, r, n, rot) { c.beginPath(); for (var k = 0; k < n; k++) { var a = rot + (k / n) * TAU; c[k ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); } c.closePath(); }
  function mStones(c, W, H, T, p) {
    var rnd = mulberry(p.seed), cx = W / 2, cy = H * 0.52, a = smooth(0, 4, T), i, merge = smooth(17, 22.5, T), R = Math.min(W, H * 1.2) * (0.34 - 0.16 * merge);
    stars(c, W, H, T, p, rnd, 70, a * 0.7);
    for (i = 0; i < 6; i++) { var mx = (W * (0.1 + 0.8 * rnd()) + T * (6 + 6 * i)) % (W * 1.4) - W * 0.2, my = H * (0.35 + 0.5 * rnd()); var mg = c.createRadialGradient(mx, my, 0, mx, my, W * 0.28); mg.addColorStop(0, rgba(p.palette[1], 0.07 * a)); mg.addColorStop(1, rgba(p.palette[1], 0)); c.fillStyle = mg; c.fillRect(0, 0, W, H); }
    var pts = [];
    for (i = 0; i < 7; i++) {
      var on = smooth(4.5 + i * 1.7, 6.2 + i * 1.7, T), ang = -Math.PI / 2 + (i / 7) * TAU + T * 0.06, x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang) * 0.82, s = Math.min(W, H) * 0.045;
      pts.push([x, y, on]);
      var gl = c.createRadialGradient(x, y, 0, x, y, s * 4.5); gl.addColorStop(0, rgba(p.palette[2], 0.5 * on)); gl.addColorStop(1, rgba(p.palette[2], 0)); c.fillStyle = gl; c.beginPath(); c.arc(x, y, s * 4.5, 0, TAU); c.fill();
      poly(c, x, y, s, 3 + (i % 5), T * 0.2 * (i % 2 ? 1 : -1)); c.fillStyle = rgba('#10181a', 0.9 * a); c.fill(); c.lineWidth = 2; c.strokeStyle = rgba(on > 0.2 ? p.palette[2] : p.palette[1], (0.35 + 0.65 * on) * a); c.stroke();
    }
    c.lineWidth = 1; for (i = 0; i < 7; i++) { var q = pts[i], r2 = pts[(i + 1) % 7], w = Math.min(q[2], r2[2]); if (w > 0.4) { c.strokeStyle = rgba(p.palette[1], 0.35 * w * a); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(r2[0], r2[1]); c.stroke(); } }
  }
  function mForecast(c, W, H, T, p) {
    var rnd = mulberry(p.seed), N = 64, PATHS = 160, x0 = W * 0.09, x1 = W * 0.91, yTop = H * 0.2, yBot = H * 0.74, i, k, a = smooth(0, 3, T), q = smooth(2.5, 17, T);
    var grid = [], lo = [], hi = [], med = [], resid = [];
    for (i = 0; i < PATHS; i++) { var v = 0.5, row = []; for (k = 0; k < N; k++) { v += (rnd() - 0.5) * 0.045 + 0.0012 + 0.012 * Math.sin(k * 0.35); row.push(v); } grid.push(row); }
    for (k = 0; k < N; k++) { var col = grid.map(function (r) { return r[k]; }).sort(function (u, w) { return u - w; }); lo.push(col[Math.floor(PATHS * 0.1)]); hi.push(col[Math.floor(PATHS * 0.9)]); med.push(col[Math.floor(PATHS / 2)]); }
    function X(k2) { return x0 + (x1 - x0) * (k2 / (N - 1)); } function Y(v2) { return yBot - (v2 - 0.2) / 1.0 * (yBot - yTop); }
    c.strokeStyle = rgba('#8a93b4', 0.2 * a); c.lineWidth = 1; for (i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(x0, yTop + (yBot - yTop) * i / 4); c.lineTo(x1, yTop + (yBot - yTop) * i / 4); c.stroke(); }
    var upto = Math.floor((N - 1) * q);
    for (i = 0; i < PATHS; i += 2) { c.strokeStyle = rgba(p.palette[1], 0.07 * a); c.beginPath(); for (k = 0; k <= upto; k++) c[k ? 'lineTo' : 'moveTo'](X(k), Y(grid[i][k])); c.stroke(); }
    if (upto > 1) {
      c.fillStyle = rgba(p.palette[1], 0.15 * a); c.beginPath(); for (k = 0; k <= upto; k++) c[k ? 'lineTo' : 'moveTo'](X(k), Y(hi[k])); for (k = upto; k >= 0; k--) c.lineTo(X(k), Y(lo[k])); c.closePath(); c.fill();
      c.strokeStyle = rgba(p.palette[1], 0.95 * a); c.lineWidth = 3; c.shadowColor = p.palette[1]; c.shadowBlur = 10; c.beginPath(); for (k = 0; k <= upto; k++) c[k ? 'lineTo' : 'moveTo'](X(k), Y(med[k])); c.stroke(); c.shadowBlur = 0;
    }
    var rr = smooth(9, 14, T);                                             // the residual: a small steady wave that runs on past the edge of the data
    c.strokeStyle = rgba(p.palette[2], 0.9 * rr); c.lineWidth = 1.6; c.beginPath();
    for (var xx = 0; xx <= W; xx += 4) { var yy = H * 0.86 + Math.sin(xx * 0.035 + T * 0.4) * H * 0.018; c[xx ? 'lineTo' : 'moveTo'](xx, yy); } c.stroke();
    var lb = smooth(12, 15, T); c.fillStyle = rgba(p.palette[2], lb); c.font = '700 ' + Math.round(H * 0.045) + 'px "Courier Prime", monospace'; c.textAlign = 'right'; c.fillText('71%', x1, yTop - 8);
  }
  function glyph(c, x, y, s, rnd, alpha, col) {
    c.strokeStyle = rgba(col, alpha); c.lineWidth = 2; c.beginPath();
    for (var k = 0; k < 3; k++) { c.moveTo(x + rnd() * s, y + rnd() * s * 1.4); c.lineTo(x + rnd() * s, y + rnd() * s * 1.4); } c.stroke();
  }
  function mStrata(c, W, H, T, p) {
    var rnd = mulberry(p.seed), i, a = smooth(0, 3, T), cam = smooth(0, 15, T) * H * 0.9, cols = ['#7a5230', '#9c6d3e', '#6b4527', '#b58450', '#85592f', '#a37442'];
    for (i = 0; i < 12; i++) { var y = i * H * 0.32 - cam - H * 0.2, hh = H * (0.28 + 0.1 * rnd()); c.fillStyle = rgba(cols[i % cols.length], 0.55 * a); c.fillRect(0, y, W, hh); c.strokeStyle = rgba('#e9c895', 0.18 * a); c.beginPath(); c.moveTo(0, y); for (var x = 0; x <= W; x += 24) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); c.stroke(); }
    for (i = 0; i < 90; i++) { var sx = rnd() * W, sp = 20 + rnd() * 50, sy = (rnd() * H + T * sp) % H; c.fillStyle = rgba('#f3dcae', 0.35 * a * rnd()); c.fillRect(sx, sy, 1.6, 1.6); }
    var ch = smooth(9, 12, T), cw = W * 0.5, chh = H * 0.34, cx0 = W * 0.25, cy0 = H * 0.3;
    c.fillStyle = rgba('#0b0704', 0.8 * ch); c.fillRect(cx0, cy0, cw, chh); c.strokeStyle = rgba(p.palette[2], 0.7 * ch); c.lineWidth = 2; c.strokeRect(cx0, cy0, cw, chh);
    for (i = 0; i < 5; i++) { var sh = smooth(11 + i * 0.5, 12.5 + i * 0.5, T); c.strokeStyle = rgba(p.palette[2], 0.45 * sh); c.beginPath(); c.moveTo(cx0 + 10, cy0 + 14 + i * (chh - 28) / 4); c.lineTo(cx0 + cw * sh - 10, cy0 + 14 + i * (chh - 28) / 4); c.stroke(); for (var t2 = 0; t2 < 9; t2++) { c.fillStyle = rgba(p.palette[2], 0.55 * sh); c.fillRect(cx0 + 20 + t2 * (cw - 40) / 9, cy0 + 6 + i * (chh - 28) / 4, (cw - 60) / 11, 6); } }
    var gr = mulberry(p.seed ^ 77), gw = cw / 12;                         // one sentence, read a sign at a time
    for (i = 0; i < 9; i++) { var gl = smooth(14.5 + i * 0.55, 15.1 + i * 0.55, T); glyph(c, cx0 + gw * 1.4 + i * gw, cy0 + chh + 26, gw * 0.7, gr, gl, p.palette[2]); }
    var light = c.createLinearGradient(0, 0, 0, H * 0.5); light.addColorStop(0, rgba(p.palette[2], 0.16 * ch)); light.addColorStop(1, rgba(p.palette[2], 0)); c.fillStyle = light; c.fillRect(W * 0.4, 0, W * 0.2, H * 0.5);
  }
  function mStarmap(c, W, H, T, p) {
    var rnd = mulberry(p.seed), nodes = [], i, j, a = smooth(0, 3.5, T), tries = 0;
    stars(c, W, H, T, p, mulberry(p.seed ^ 5), 90, a * 0.6);
    while (nodes.length < 20 && tries++ < 400) { var nx = W * (0.08 + 0.84 * rnd()), ny = H * (0.14 + 0.62 * rnd()); if (nodes.every(function (n) { return Math.hypot(n[0] - nx, n[1] - ny) > W * 0.09; })) nodes.push([nx, ny]); }
    var col = function (n) { return n[0] < W * 0.36 ? '#4fe3ff' : n[0] > W * 0.64 ? '#ff7a9c' : '#c9a84c'; }, edges = [];
    for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) if (Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]) < W * 0.2) edges.push([i, j]);
    c.lineWidth = 1; edges.forEach(function (e, k) { var s = smooth(1 + k * 0.05, 2 + k * 0.05, T); c.strokeStyle = rgba('#8a93b4', 0.28 * s * a); c.beginPath(); c.moveTo(nodes[e[0]][0], nodes[e[0]][1]); c.lineTo(nodes[e[1]][0] * s + nodes[e[0]][0] * (1 - s), nodes[e[1]][1] * s + nodes[e[0]][1] * (1 - s)); c.stroke(); });
    nodes.forEach(function (n, k) { var s = smooth(1 + k * 0.12, 2.2 + k * 0.12, T); c.fillStyle = rgba(col(n), 0.9 * s); c.shadowColor = col(n); c.shadowBlur = 10; c.beginPath(); c.arc(n[0], n[1], 4 + (k === 0 ? 3 : 0), 0, TAU); c.fill(); c.shadowBlur = 0; });
    var fr = mulberry(p.seed ^ 9), f; for (f = 0; f < 9; f++) { var e = edges[Math.floor(fr() * edges.length)], ph = (T * (0.11 + fr() * 0.12) + fr()) % 1, sw = smooth(6, 8, T), fx = nodes[e[0]][0] + (nodes[e[1]][0] - nodes[e[0]][0]) * ph, fy = nodes[e[0]][1] + (nodes[e[1]][1] - nodes[e[0]][1]) * ph; c.fillStyle = rgba('#ffffff', 0.9 * sw); c.fillRect(fx - 3, fy - 1.5, 7, 3); c.fillStyle = rgba(col(nodes[e[0]]), 0.35 * sw); c.fillRect(fx - 3 - 12 * (e[1] > e[0] ? 1 : -1), fy - 1, 12, 2); }
    var d = smooth(5, 21, T), bx = W * 0.12, by = H * 0.83, bw = W * 0.76, bh = H * 0.016;                  // Drift fills as the season turns
    c.fillStyle = rgba('#8a93b4', 0.2 * a); c.fillRect(bx, by, bw, bh); c.fillStyle = rgba(d > 0.6 ? '#ff7a5c' : '#c9a84c', 0.95 * a); c.fillRect(bx, by, bw * (0.2 + 0.8 * d), bh);
    c.fillStyle = rgba('#d7dae6', 0.7 * a); c.font = '700 ' + Math.round(H * 0.026) + 'px "Courier Prime", monospace'; c.textAlign = 'left'; c.fillText('DRIFT', bx, by - 8);
    var hr = smooth(18, 21, T); if (hr > 0) { c.strokeStyle = rgba('#c9a84c', 0.8 * hr * (0.5 + 0.5 * Math.sin(T * 2))); c.lineWidth = 2; c.beginPath(); c.arc(nodes[0][0], nodes[0][1], 14 + 10 * hr, 0, TAU); c.stroke(); }
  }
  function mWall(c, W, H, T, p) {
    var rnd = mulberry(p.seed), i, a = smooth(0, 3, T), base = H * 0.78, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba('#1d1a14', a)); g.addColorStop(1, rgba('#0a0907', a)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    stars(c, W, H, T, p, mulberry(p.seed ^ 3), 50, a * 0.5);
    var x = 0, blocks = []; while (x < W) { var bw = W * (0.025 + rnd() * 0.04), bh = H * (0.12 + rnd() * 0.3); blocks.push([x, bw, bh]); x += bw; }
    blocks.forEach(function (b, k) { c.fillStyle = rgba('#14110c', 0.97 * a); c.fillRect(b[0], base - b[2], b[1] - 1, b[2]); c.strokeStyle = rgba('#d8d2c2', 0.12 * a); c.strokeRect(b[0], base - b[2], b[1] - 1, b[2]);
      for (var wy = base - b[2] + 8; wy < base - 6; wy += 11) for (var wx = b[0] + 4; wx < b[0] + b[1] - 6; wx += 8) { var when = 2 + ((k * 7 + wx * 0.37 + wy * 0.21) % 14); var on = smooth(when, when + 0.5, T); if (on > 0 && ((wx * 13 + wy * 7 + k) % 5) < 3) { c.fillStyle = rgba('#ffb347', 0.55 * on * a); c.fillRect(wx, wy, 3, 4); } } });
    c.fillStyle = rgba('#0a0907', a); c.fillRect(0, base, W, H - base);
    var lx = W * 0.07, ly = H * 0.1, lw = W * 0.2, lh = H * 0.44, lp = smooth(8, 11, T);                    // the ledger
    c.fillStyle = rgba('#0c0a07', 0.82 * lp); c.fillRect(lx, ly, lw, lh); c.strokeStyle = rgba('#d8d2c2', 0.5 * lp); c.strokeRect(lx, ly, lw, lh);
    for (i = 0; i < 9; i++) { var yy = ly + 16 + i * (lh - 30) / 9, st = smooth(9 + i * 0.35, 10 + i * 0.35, T); c.strokeStyle = rgba('#d8d2c2', 0.65 * st); c.beginPath(); c.moveTo(lx + 12, yy); c.lineTo(lx + 12 + (lw - 24) * st, yy); c.stroke(); for (var k2 = 0; k2 < 7; k2++) { c.fillStyle = rgba('#d8d2c2', 0.5 * st); c.fillRect(lx + 14 + k2 * 9, yy - 11, 2, 8); } }
    var cut = smooth(14, 15.2, T); c.strokeStyle = rgba('#ff7a5c', 0.9 * cut); c.lineWidth = 3; c.beginPath(); c.moveTo(lx + 8, ly + lh * 0.32); c.lineTo(lx + 8 + (lw - 16) * cut, ly + lh * 0.32); c.stroke();
    for (i = 0; i < 5; i++) { var fx = ((i * 0.27 + T * 0.012 * (1 + i * 0.2)) % 1.3 - 0.15) * W, fg = c.createRadialGradient(fx, base - H * 0.05 * i, 0, fx, base - H * 0.05 * i, W * 0.25); fg.addColorStop(0, rgba('#d8d2c2', 0.06 * a)); fg.addColorStop(1, rgba('#d8d2c2', 0)); c.fillStyle = fg; c.fillRect(0, 0, W, H); }
  }
  var MOTIFS = { rings: mRings, stones: mStones, forecast: mForecast, strata: mStrata, starmap: mStarmap, wall: mWall };

  /* ---------- one frame */
  function wrap(c, text, maxW) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function draw(c, W, H, T, p) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    var bg = c.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.6); bg.addColorStop(0, rgba(p.palette[1], 0.13)); bg.addColorStop(1, rgba(p.palette[1], 0));
    c.fillStyle = p.palette[0]; c.fillRect(0, 0, W, H); c.fillStyle = bg; c.fillRect(0, 0, W, H);                  // deep base, a soft glow where the eye lands
    c.save(); c.beginPath(); c.rect(0, H * BAR, W, H * (1 - 2 * BAR)); c.clip();
    var drift = 1 + 0.035 * smooth(0, DURATION, T);                       // a slow push-in across the whole film
    c.translate(W / 2, H / 2); c.scale(drift, drift); c.translate(-W / 2, -H / 2);
    MOTIFS[p.motif](c, W, H, T, p);
    c.restore();
    var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);   // vignette
    var tc = smooth(p.titleAt, p.titleAt + 1, T);
    if (tc > 0) { c.fillStyle = rgba('#000000', 0.5 * tc); c.fillRect(0, 0, W, H); }
    var ln = activeLine(p, T);
    if (ln) {
      var k = Math.min(smooth(ln.at, ln.at + 0.6, T), 1 - smooth(ln.at + ln.dur - 0.5, ln.at + ln.dur, T)), fs = Math.round(Math.min(W * 0.034, H * 0.062));
      c.font = '700 ' + fs + 'px "Courier Prime", monospace'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      var rows = wrap(c, ln.text, W * 0.74), y0 = H * 0.8 - (rows.length - 1) * fs * 0.6;
      rows.forEach(function (r, ri) { c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 14; c.fillStyle = rgba('#f4f1e6', k); c.fillText(r, W / 2 + (1 - k) * 18, y0 + ri * fs * 1.25); c.shadowBlur = 0; });
      if (ln.who) { c.font = '700 ' + Math.round(fs * 0.5) + 'px "Courier Prime", monospace'; c.fillStyle = rgba(p.palette[1], k * 0.9); c.fillText(ln.who.toUpperCase(), W / 2, y0 - fs * 1.3); }
    }
    if (tc > 0) {
      var ts = Math.round(Math.min(W * 0.062, H * 0.12)); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 ' + ts + 'px "Cinzel Decorative", "Cinzel", serif'; c.shadowColor = p.palette[1]; c.shadowBlur = 28 * tc; c.fillStyle = rgba('#f4f1e6', tc);
      var tl = wrap(c, p.title.toUpperCase(), W * 0.84); tl.forEach(function (r, ri) { c.fillText(r, W / 2, H * 0.46 + (ri - (tl.length - 1) / 2) * ts * 1.15); }); c.shadowBlur = 0;
      c.font = '700 ' + Math.round(ts * 0.3) + 'px "Courier Prime", monospace'; c.fillStyle = rgba(p.palette[1], tc * 0.95); c.fillText(p.seriesTitle.toUpperCase(), W / 2, H * 0.46 + (tl.length / 2 + 0.7) * ts * 1.15);
    }
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H * BAR); c.fillRect(0, H * (1 - BAR), W, H * BAR);   // 2.39:1 letterbox
    c.font = '700 ' + Math.round(Math.max(10, H * 0.022)) + 'px "Courier Prime", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(215,218,230,0.7)';
    c.fillText('ANIMATIC · PROCEDURAL · NOT FOOTAGE · NO VOICE ACTING', W / 2, H * (1 - BAR / 2));
    var fade = Math.min(smooth(0, FADE_IN, T), 1 - smooth(DURATION - FADE_OUT, DURATION, T));
    if (fade < 1) { c.fillStyle = 'rgba(0,0,0,' + (1 - fade).toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
  }

  /* ---------- sound: synthesized, silent until the viewer turns it on (browsers need a gesture), faded in and out with the film */
  function Score(p) {
    var ctx = null, master = null, nodes = [], started = false;
    return {
      start: function (offset) {
        var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false;
        if (!ctx) ctx = new AC(); if (ctx.resume) ctx.resume();
        var t0 = ctx.currentTime, left = Math.max(0.5, DURATION - offset);
        master = ctx.createGain(); master.gain.setValueAtTime(0, t0); master.gain.linearRampToValueAtTime(0.16, t0 + 3); master.gain.setValueAtTime(0.16, t0 + Math.max(3, left - 2)); master.gain.linearRampToValueAtTime(0, t0 + left); master.connect(ctx.destination);
        var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 4; lp.connect(master);
        [[p.base, 'sawtooth', 0.5], [p.base * 1.5, 'sine', 0.22], [p.base * 2, 'triangle', 0.14]].forEach(function (s) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = s[1]; o.frequency.value = s[0]; g.gain.value = s[2]; o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + left + 0.1); nodes.push(o); });
        if (p.sub) { var so = ctx.createOscillator(), sg = ctx.createGain(); so.type = 'sine'; so.frequency.value = p.sub; sg.gain.value = 0.9; so.connect(sg); sg.connect(master); so.start(t0); so.stop(t0 + left + 0.1); nodes.push(so); }
        p.lines.forEach(function (l) { if (l.at < offset) return; var o = ctx.createOscillator(), g = ctx.createGain(), at = t0 + l.at - offset; o.type = 'sine'; o.frequency.value = p.base * 4; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.09, at + 0.05); g.gain.exponentialRampToValueAtTime(0.0005, at + 1.6); o.connect(g); g.connect(master); o.start(at); o.stop(at + 1.7); nodes.push(o); });
        started = true; return true;
      },
      stop: function () { if (!started) return; nodes.forEach(function (o) { try { o.stop(); } catch (e) { /* already stopped */ } }); nodes = []; try { master.disconnect(); } catch (e) { /* ignore */ } started = false; },
      available: function () { return !!(root.AudioContext || root.webkitAudioContext); }
    };
  }

  var api = { DURATION: DURATION, TITLE_AT: TITLE_AT, ORDER: ORDER, VISUALS: VISUALS, coldOpen: coldOpen, plan: plan, activeLine: activeLine, draw: draw, Score: Score, hash: hash, mulberry: mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaAnimatic = api;
})(typeof window !== 'undefined' ? window : this);
