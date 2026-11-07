/* omega-bridge-logic.js -- the rules of MYTH OF THE STONES: THE TWO-HAND BRIDGE (a puzzle level, PROTOTYPE).
 *
 * Pure functions only: no DOM, no canvas, no timers, no storage, no network. Everything a move depends on lives here so it can be
 * replayed and proven under node (scripts/tests/test_bridge_logic.py) without a browser: every level is solved by the built-in
 * solver, its par is the solver's minimum, and a recorded solution is replayed move by move.
 *
 * THE RULE (the film's two-hands principle, written as a mechanic): a span opens only while it is held from both ends. Two
 * cradles share a letter; when one character stands on each cradle of a pair, that pair opens and its bridge stays open.
 * One character alone can never open anything. Auren is heavy and cannot cross a thread; Torin is light and can. So the light
 * one crosses first, and the heavy one holds the near end.
 *
 * Tile legend (rows are equal-length strings):
 *   #  wall            (space) void, the chasm            .  floor
 *   =  thread: only the light character may cross
 *   a-d  cradle, each letter exactly twice (a pair)       A-D  bridge span, walkable once its pair has opened
 *   @  Auren's start (floor)   &  Torin's start (floor)   *  the stone: Auren reaching it wins
 *
 * Works as a browser global (window.OmegaBridgeLogic) and as a CommonJS module for node tests. Status: PROTOTYPE; not a release. */
(function (root) {
  'use strict';

  var DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  var DIR_KEYS = ['U', 'D', 'L', 'R'];
  var PAIR_LETTERS = 'abcd';

  /* par is the solver's minimum number of steps (swapping who you control is free); the tests fail if it drifts, if any level is
     unsolvable, if any pair of cradles is not actually needed, or if a level can be beaten with every pair disabled. */
  var LEVELS = [
    { id: 'span', chapter: 1, name: 'I. First Span', par: 14, rows: [
      '###########',
      '#...AAA...#',
      '#.@a===a*.#',
      '#.&.   ...#',
      '###########'] },
    { id: 'narrows', chapter: 1, name: 'II. The Narrows', par: 21, rows: [
      '##############',
      '####.AAAA..###',
      '#&@.a====a.*##',
      '##############'] },
    { id: 'relay', chapter: 1, name: 'III. The Relay', par: 28, rows: [
      '#################',
      '#...AAA...BBB...#',
      '#.@a===a.b===b*.#',
      '#.&.   ...   ...#',
      '#################'] },
    { id: 'return', chapter: 1, name: 'IV. The Return', par: 28, rows: [
      '#################',
      '#....AAA...BBB..#',
      '#.@.a===a.b   .*#',
      '#.&b.   ...   ..#',
      '#################'] },
    { id: 'hold', chapter: 1, name: 'V. The Long Hold', par: 48, rows: [
      '########################',
      '#....AAA...BBB....CCC..#',
      '#.@.a===a.b   ...c   .*#',
      '#.&b.   ...   ...=   ..#',
      '#################c######',
      '########################'] },
    { id: 'near', chapter: 2, name: 'VI. Far and Near', par: 39, rows: [
      '#################',
      '#a..AAAb..BBB.*a#',
      '#&..===b..===...#',
      '#@..   ...   ...#',
      '#################'] },
    { id: 'crossed', chapter: 2, name: 'VII. Crossed Hands', par: 40, rows: [
      '#################',
      '#...AAAb.bBBB...#',
      '#..@===...===..*#',
      '#a&.   ...   a..#',
      '#################'] },
    { id: 'three', chapter: 2, name: 'VIII. Three Spans', par: 48, rows: [
      '#######################',
      '#&@aAAA...BBB...CCCc..#',
      '#...===..b===c..===.*.#',
      '#.a.   .b.   ...   ...#',
      '#######################'] },
    { id: 'crowded', chapter: 2, name: 'IX. The Crowded Island', par: 49, rows: [
      '#######################',
      '#...AAA...BBBb..CCC...#',
      '#..a===...===...===c..#',
      '#.&@   acb   ...   *..#',
      '#######################'] },
    { id: 'great', chapter: 2, name: 'X. The Great Hold', par: 58, rows: [
      '#######################',
      '#..aAAA..bBBB..cCCC...#',
      '#...===...===...===.c*#',
      '#&@.   ..b   ..a   ...#',
      '#######################'] }
  ];

  function parse(level) {
    var rows = level.rows, h = rows.length, w = rows[0].length, i, x, y, ch;
    var p = { id: level.id, name: level.name, w: w, h: h, tiles: [], pairs: {}, spans: {}, start: { A: -1, T: -1 }, goal: -1 };
    for (y = 0; y < h; y++) {
      if (rows[y].length !== w) throw new Error('level ' + level.id + ': row ' + y + ' has length ' + rows[y].length + ', expected ' + w);
      for (x = 0; x < w; x++) {
        ch = rows[y].charAt(x); i = y * w + x;
        if (ch === '@') { p.start.A = i; ch = '.'; }
        else if (ch === '&') { p.start.T = i; ch = '.'; }
        else if (ch === '*') { p.goal = i; }
        else if (PAIR_LETTERS.indexOf(ch) >= 0) { (p.pairs[ch] = p.pairs[ch] || []).push(i); }
        else if (ch >= 'A' && ch <= 'D') { (p.spans[ch.toLowerCase()] = p.spans[ch.toLowerCase()] || []).push(i); }
        else if ('# .='.indexOf(ch) < 0) throw new Error('level ' + level.id + ': unknown tile "' + ch + '"');
        p.tiles.push(ch);
      }
    }
    if (p.start.A < 0 || p.start.T < 0 || p.goal < 0) throw new Error('level ' + level.id + ': needs @, & and *');
    p.letters = Object.keys(p.pairs).sort();
    p.letters.forEach(function (k) {
      if (p.pairs[k].length !== 2) throw new Error('level ' + level.id + ': cradle ' + k + ' must appear exactly twice');
      if (!p.spans[k] || !p.spans[k].length) throw new Error('level ' + level.id + ': pair ' + k + ' has no span');
    });
    Object.keys(p.spans).forEach(function (k) { if (!p.pairs[k]) throw new Error('level ' + level.id + ': span ' + k.toUpperCase() + ' has no cradles'); });
    return p;
  }

  function openMask(p, open) { var m = 0; p.letters.forEach(function (k, j) { if (open[k]) m |= 1 << j; }); return m; }

  function initialState(p) {
    var open = {}; p.letters.forEach(function (k) { open[k] = false; });
    return { a: p.start.A, t: p.start.T, active: 'A', open: open, moves: 0, won: false };
  }

  function copy(s) { var o = {}; Object.keys(s.open).forEach(function (k) { o[k] = s.open[k]; }); return { a: s.a, t: s.t, active: s.active, open: o, moves: s.moves, won: s.won }; }

  /* Can this character stand on tile i, given the current state? Does not consider the other character. */
  function canStand(p, s, who, i) {
    var c = p.tiles[i];
    if (c === '#' || c === ' ') return false;
    if (c === '=') return who === 'T';
    if (c >= 'A' && c <= 'D') return !!s.open[c.toLowerCase()];
    return true;
  }

  /* Both characters on the two cradles of a pair opens it for good. Returns the letters opened by this call. */
  function settle(p, s) {
    var opened = [];
    p.letters.forEach(function (k) {
      if (s.open[k] || (p.disabled && p.disabled[k])) return;
      var c = p.pairs[k];
      if ((s.a === c[0] && s.t === c[1]) || (s.a === c[1] && s.t === c[0])) { s.open[k] = true; opened.push(k); }
    });
    return opened;
  }

  /* One step by the active character. Returns { state, moved, opened, blocked } and never mutates its input. */
  function step(p, s, dir) {
    var d = DIRS[dir], out = { state: s, moved: false, opened: [], blocked: null };
    if (!d || s.won) { out.blocked = s.won ? 'won' : 'dir'; return out; }
    var who = s.active, from = who === 'A' ? s.a : s.t, other = who === 'A' ? s.t : s.a;
    var x = from % p.w + d[0], y = Math.floor(from / p.w) + d[1];
    if (x < 0 || y < 0 || x >= p.w || y >= p.h) { out.blocked = 'edge'; return out; }
    var to = y * p.w + x;
    if (to === other) { out.blocked = 'occupied'; return out; }
    if (!canStand(p, s, who, to)) {
      var c = p.tiles[to];
      out.blocked = c === '=' ? 'too-heavy' : (c >= 'A' && c <= 'D') ? 'closed' : (c === ' ' ? 'chasm' : 'wall');
      return out;
    }
    var n = copy(s);
    if (who === 'A') n.a = to; else n.t = to;
    n.moves += 1;
    out.opened = settle(p, n);
    if (n.a === p.goal) n.won = true;
    out.state = n; out.moved = true;
    return out;
  }

  function swap(s) { if (s.won) return s; var n = copy(s); n.active = s.active === 'A' ? 'T' : 'A'; return n; }

  /* A game with an undo history. Every successful move or swap is one undo step. */
  function newGame(level) {
    var p = parse(level), hist = [], cur = initialState(p);
    return {
      plan: p,
      get state() { return cur; },
      get canUndo() { return hist.length > 0; },
      move: function (dir) { var r = step(p, cur, dir); if (r.moved) { hist.push(cur); cur = r.state; } return r; },
      swap: function () { if (cur.won) return false; hist.push(cur); cur = swap(cur); return true; },
      undo: function () { if (!hist.length) return false; cur = hist.pop(); return true; },
      restart: function () { hist = []; cur = initialState(p); }
    };
  }

  /* Minimum steps to win by breadth-first search over (positions, who is active, open pairs). A swap costs 0 and a step costs 1, so
     each distance layer is first closed under swaps (every state gets its swapped twin) and only then expanded by steps; that keeps
     the answer minimal. Returns { moves, actions } or null if unsolvable; actions is a string of U D L R and S (swap) that wins in
     exactly `moves` steps. opts.disable = 'ab' makes those pairs unable to open, which is how a test proves every pair is needed. */
  function solve(level, opts) {
    var p = parse(level), W = p.w * p.h;
    if (opts && opts.disable) { p.disabled = {}; opts.disable.split('').forEach(function (k) { p.disabled[k] = true; }); }
    function key(s) { return (((s.a * W + s.t) * 2 + (s.active === 'A' ? 0 : 1)) * 16) + openMask(p, s.open); }
    var start = initialState(p), seen = {}, prev = {}, layer = [start], found = null, i, j;
    seen[key(start)] = true;
    while (layer.length && !found) {
      var closed = layer.slice();
      for (i = 0; i < layer.length; i++) {
        var tw = swap(layer[i]), kt = key(tw);
        if (!seen[kt]) { seen[kt] = true; prev[kt] = { from: key(layer[i]), act: 'S' }; closed.push(tw); }
      }
      var next = [];
      for (i = 0; i < closed.length && !found; i++) {
        var s = closed[i], k = key(s);
        for (j = 0; j < 4; j++) {
          var r = step(p, s, DIR_KEYS[j]);
          if (!r.moved) continue;
          var kn = key(r.state);
          if (seen[kn]) continue;
          seen[kn] = true; prev[kn] = { from: k, act: DIR_KEYS[j] };
          if (r.state.won) { found = r.state; break; }
          next.push(r.state);
        }
      }
      layer = next;
    }
    if (!found) return null;
    var acts = [], kk = key(found);
    while (prev[kk]) { acts.push(prev[kk].act); kk = prev[kk].from; }
    acts.reverse();
    return { moves: found.moves, actions: acts.join('') };
  }

  /* Replay an action string on a fresh game; returns the game. */
  function replay(level, actions) {
    var g = newGame(level), i, a;
    for (i = 0; i < actions.length; i++) { a = actions.charAt(i); if (a === 'S') g.swap(); else g.move(a); }
    return g;
  }

  var api = { LEVELS: LEVELS, DIRS: DIRS, parse: parse, initialState: initialState, step: step, swap: swap, canStand: canStand, newGame: newGame, solve: solve, replay: replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaBridgeLogic = api;
})(typeof window !== 'undefined' ? window : this);
