/* omega-zw-logic.js -- the rules of ZODIAC WARS: ASCENSION, Slice 0 (a duel prototype, PROTOTYPE; not a released game).
 *
 * Pure functions only: no DOM, no canvas, no timers, no storage, no network. The simulation is a fixed 60 Hz step over plain data, driven by an
 * input log and a seed, so any duel can be replayed in a test and compared frame by frame (scripts/tests/test_zw_logic.py). The scene and the UI
 * never decide a result; they only read this state.
 *
 * Numbers are the design document's section 3 (docs/studios/franchises/zodiac-wars/games/ascension/GDD.md). All of them are tunable and none has been
 * playtested. Where the document leaves a choice open this file records the choice in a comment marked CHOICE.
 *
 *   health 100 | light 8 damage, 18 frames | heavy 22 damage, 40 frames, then 12 recovery
 *   guard blocks 70% while held; a perfect guard (first 6 frames) blocks 100% and opens the attacker for 20 frames
 *   overreach +10 per hit dealt or taken, +25 for a heavy; at 100 the Shadow stance runs 8 s (damage x1.5, guard disabled), then a 3 s stagger
 *   Aries (Kael Marren): pay up to 15 health to add that much damage to the next hit; the cost is shown first
 *   Libra (Adaeze Okonkwo-Reyes): a blocked hit is countered: half the blocked damage returns and the attacker's overreach falls by 15
 *
 * Slice 0 is a training dummy, then one duel against the Aries Shadow, The Unbled. Nothing here is multiplayer; the Unbled's choices come from a
 * seeded generator whose seed is on screen, so a duel contains no hidden randomness.
 *
 * Works as a browser global (window.OmegaZW) and as a CommonJS module for node tests. Status: PROTOTYPE; not a release. */
(function (root) {
  'use strict';

  var HZ = 60;
  var HEALTH = 100;
  var ARENA = 1000, REACH_PAD = 0;
  var SPEED = 4, UNBLED_SPEED = 3;
  var ATK = {
    light: { dmg: 8, total: 18, hit: 7, reach: 70, after: 0, ov: 10 },
    heavy: { dmg: 22, total: 40, hit: 24, reach: 90, after: 12, ov: 25 }
  };
  var GUARD_BLOCK = 0.7, PERFECT_FRAMES = 6, OPEN_FRAMES = 20, GUARD_RECOVER = 6;
  var SHADOW_FRAMES = 8 * HZ, STAGGER_FRAMES = 3 * HZ, SHADOW_MULT = 1.5;
  var OVERREACH_MAX = 100, COUNTER_DROP = 15, ARIES_PAY = 15, LIBRA_TEMPO = 10;
  var UNBLED_INTRO = 90;
  var INPUT = { LEFT: 1, RIGHT: 2, LIGHT: 4, HEAVY: 8, GUARD: 16, PAY: 32 };
  var HOUSES = {
    aries: { id: 'aries', name: 'ARIES', knight: 'Kael Marren', cost: 'HEALTH', oath: 'Say the cost before the pour.' },
    libra: { id: 'libra', name: 'LIBRA', knight: 'Adaeze Okonkwo-Reyes', cost: 'TEMPO', oath: 'Weigh it before it lands.' }
  };

  function rnd(s) {                     // mulberry32 over state.rng; returns [value in [0,1), next state]
    var a = (s.rng + 0x6D2B79F5) >>> 0, t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    s.rng = a;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function fighter(house, x, face) {
    return { house: house, x: x, face: face, hp: HEALTH, act: 'idle', t: 0, guardT: 0, oc: 0, sh: 0, stag: 0, bonus: 0, paid: 0, hit: false, cool: 0, cyc: 0 };
  }

  /* CHOICE: the player starts at x=300 facing right; the dummy and the Unbled at x=700. The arena is one line (1000 units); there is no jump in Slice 0. */
  function start(house, seed) {
    if (!HOUSES[house]) throw new Error('unknown House: ' + house);
    var s = { v: 1, frame: 0, seed: (seed >>> 0) || 1, rng: (seed >>> 0) || 1, house: house, stage: 0, over: null,
      p: fighter(house, 300, 1), e: fighter('dummy', 700, -1), ev: [] };
    return s;
  }

  function enterDuel(s) {
    s.stage = 1;
    s.p = Object.assign(fighter(s.house, 300, 1), {});
    s.e = fighter('unbled', 700, -1);
    s.e.cyc = 0;
    s.ev.push({ type: 'stage', stage: 1 });
  }

  function isShadow(f) { return f.sh > 0 || (f.house === 'unbled' && f.act !== 'stagger' && f.cyc >= UNBLED_INTRO && f.cyc < UNBLED_INTRO + SHADOW_FRAMES); }
  function canAct(f) { return f.act === 'idle'; }
  function dist(s) { return Math.abs(s.p.x - s.e.x); }

  /* What an attack will spend and deal, shown BEFORE it is committed (pillar 1). Never changes state. */
  function preview(s, who, kind, pay) {
    var f = s[who], a = ATK[kind], spend = 0, label = 'NO COST';
    if (f.house === 'aries') { spend = pay ? Math.max(0, Math.min(ARIES_PAY, f.hp - 1)) : 0; label = spend ? 'HEALTH -' + spend : 'HEALTH 0 (HOLD PAY TO ADD UP TO ' + ARIES_PAY + ')'; }
    else if (f.house === 'libra') { label = 'TEMPO ' + LIBRA_TEMPO + 'f ON A COUNTER'; }
    var raw = a.dmg + (spend || 0) + f.bonus;
    var dmg = Math.round(raw * (isShadow(f) ? SHADOW_MULT : 1));
    return { kind: kind, damage: dmg, spendHealth: spend, spendTempo: f.house === 'libra' ? LIBRA_TEMPO : 0, label: label, frames: a.total + a.after, hitFrame: a.hit };
  }

  function beginAttack(f, kind, pay) {
    f.act = kind; f.t = 1; f.hit = false; f.paid = 0;   /* the frame the button is pressed is frame 1 of the attack's frame data */
    if (f.house === 'aries' && pay) {      // pay before the pour: the cost is spent when the attack is committed
      var spend = Math.max(0, Math.min(ARIES_PAY, f.hp - 1));
      f.hp -= spend; f.bonus += spend; f.paid = spend;
    }
  }

  /* The Unbled's choices: advance on the player, strike on a seeded roll, never guard. Its stance cycles: 90 frames of intro, 8 s of pressure
     (damage x1.5, no guard), a 3 s stagger, and again. CHOICE: it is a Shadow, so it follows the Shadow rules for its whole fight. */
  function aiInput(s) {
    var e = s.e, p = s.p, bits = 0;
    if (s.stage === 0 || e.house === 'dummy') return 0;
    if (e.act !== 'idle' || e.cyc < UNBLED_INTRO || !isShadow(e)) return 0;
    if (e.cool > 0) return 0;
    var reach = ATK.heavy.reach;
    if (dist(s) > reach - 10) return (p.x < e.x) ? INPUT.LEFT : INPUT.RIGHT;
    var r = peek(s);
    return r < 0.4 ? INPUT.HEAVY : INPUT.LIGHT;
  }
  function peek(s) { var save = s.rng, v = rnd(s); s.rng = save; return v; }

  function faceOpponent(s) { s.p.face = s.e.x >= s.p.x ? 1 : -1; s.e.face = -s.p.face; }

  function clamp(x) { return Math.max(40, Math.min(ARENA - 40, x)); }

  function stepFighter(s, f, inp, speed) {
    var pay = (inp & INPUT.PAY) !== 0, aiRolled = false;
    if (f.cool > 0) f.cool--;
    switch (f.act) {
      case 'idle':
        if (f.house === 'unbled' && (inp & (INPUT.LIGHT | INPUT.HEAVY))) { rnd(s); aiRolled = true; }
        if (inp & INPUT.GUARD && f.sh <= 0 && f.house !== 'unbled') { f.act = 'guard'; f.t = 0; f.guardT = 1; }
        else if (inp & INPUT.HEAVY) beginAttack(f, 'heavy', pay);
        else if (inp & INPUT.LIGHT) beginAttack(f, 'light', pay);
        else if (inp & INPUT.LEFT) f.x = clamp(f.x - speed);
        else if (inp & INPUT.RIGHT) f.x = clamp(f.x + speed);
        break;
      case 'guard':
        if (f.sh > 0) { f.act = 'idle'; f.guardT = 0; }
        else if (inp & INPUT.GUARD) f.guardT++;
        else { f.act = 'recover'; f.t = 0; f.guardT = 0; f.rec = GUARD_RECOVER; }
        break;
      case 'light': case 'heavy':
        f.t++;
        if (f.t >= ATK[f.act].total) {
          var after = ATK[f.act].after;
          if (after) { f.act = 'recover'; f.t = 0; f.rec = after; } else { f.act = 'idle'; f.t = 0; }
          if (f.house === 'unbled') f.cool = 12 + Math.floor(peek(s) * 24);
        }
        break;
      case 'recover':
        f.t++;
        if (f.t >= (f.rec || 0)) { f.act = 'idle'; f.t = 0; f.rec = 0; }
        break;
      case 'open': case 'tempo':
        f.t++;
        if (f.t >= f.rec) { f.act = 'idle'; f.t = 0; f.rec = 0; }
        break;
      case 'stagger':
        f.stag--;
        if (f.stag <= 0) { f.act = 'idle'; f.stag = 0; f.t = 0; }
        break;
    }
    return aiRolled;
  }

  function damageOf(attacker, kind) {
    var f = attacker, raw = ATK[kind].dmg + f.bonus;
    return Math.round(raw * (isShadow(f) ? SHADOW_MULT : 1));
  }

  function addOverreach(f, n) {
    if (f.house === 'unbled' || f.house === 'dummy') return;
    if (f.sh > 0 || f.act === 'stagger') return;
    f.oc = Math.min(OVERREACH_MAX, f.oc + n);
  }

  function resolveHits(s) {
    var order = [['p', 'e'], ['e', 'p']], hits = [], i;
    for (i = 0; i < 2; i++) {
      var a = s[order[i][0]], d = s[order[i][1]];
      if ((a.act === 'light' || a.act === 'heavy') && a.t === ATK[a.act].hit && !a.hit) {
        a.hit = true;
        if (Math.abs(a.x - d.x) <= ATK[a.act].reach + REACH_PAD) hits.push({ a: order[i][0], d: order[i][1], kind: a.act });
        else s.ev.push({ type: 'whiff', who: order[i][0], kind: a.act });
      }
    }
    // Both hits are decided against the state at the start of this resolution, so two strikes on one frame trade.
    var snap = hits.map(function (h) { return { h: h, guarding: s[h.d].act === 'guard' && s[h.d].sh <= 0, gt: s[h.d].guardT, dmg: damageOf(s[h.a], h.kind), bonus: s[h.a].bonus }; });
    snap.forEach(function (x) {
      var h = x.h, a = s[h.a], d = s[h.d], dmg = x.dmg, blocked = 0, perfect = false, countered = 0;
      a.bonus = 0;
      if (x.guarding && x.gt <= PERFECT_FRAMES) {
        perfect = true; dmg = 0; blocked = x.dmg;
        a.act = 'open'; a.t = 0; a.rec = OPEN_FRAMES;
      } else if (x.guarding) {
        blocked = Math.round(x.dmg * GUARD_BLOCK); dmg = x.dmg - blocked;
        if (d.house === 'libra') {
          countered = Math.round(blocked / 2);
          a.hp = Math.max(0, a.hp - countered);
          a.oc = Math.max(0, a.oc - COUNTER_DROP);
          d.act = 'tempo'; d.t = 0; d.rec = LIBRA_TEMPO; d.guardT = 0;
        }
      }
      d.hp = Math.max(0, d.hp - dmg);
      if (!perfect && dmg + countered > 0) {
        addOverreach(a, ATK[h.kind].ov);
        addOverreach(d, ATK[h.kind].ov);
      }
      s.ev.push({ type: 'hit', who: h.a, to: h.d, kind: h.kind, damage: dmg, blocked: blocked, perfect: perfect, countered: countered });
    });
  }

  function stances(s) {
    [s.p].forEach(function (f) {
      if (f.sh > 0) {
        f.sh--;
        if (f.sh === 0) { f.act = 'stagger'; f.stag = STAGGER_FRAMES; f.t = 0; s.ev.push({ type: 'stagger', who: 'p' }); }
      } else if (f.oc >= OVERREACH_MAX && f.act !== 'stagger') {
        f.sh = SHADOW_FRAMES; f.oc = 0;
        if (f.act === 'guard') { f.act = 'idle'; f.guardT = 0; }
        s.ev.push({ type: 'shadow', who: 'p' });
      }
    });
    var e = s.e;
    if (e.house === 'unbled') {
      e.cyc++;
      var cycle = UNBLED_INTRO + SHADOW_FRAMES + STAGGER_FRAMES;
      if (e.cyc === UNBLED_INTRO + SHADOW_FRAMES) { e.act = 'stagger'; e.stag = STAGGER_FRAMES; e.t = 0; s.ev.push({ type: 'stagger', who: 'e' }); }
      if (e.cyc >= cycle) { e.cyc = UNBLED_INTRO; e.act = 'idle'; e.stag = 0; s.ev.push({ type: 'shadow', who: 'e' }); }
    }
  }

  /* Advance one frame. `input` is the player's bitmask for this frame. Mutates and returns s. */
  function step(s, input) {
    if (s.over) return s;
    s.ev = [];
    s.frame++;
    faceOpponent(s);
    stepFighter(s, s.p, input | 0, SPEED);
    var ai = aiInput(s);
    var rolled = stepFighter(s, s.e, ai, UNBLED_SPEED);
    resolveHits(s);
    stances(s);
    if (s.e.house === 'dummy') s.e.act = 'idle';
    if (s.p.hp <= 0 || s.e.hp <= 0) {
      if (s.p.hp <= 0) { s.over = 'lose'; s.ev.push({ type: 'over', result: 'lose' }); }
      else if (s.stage === 0) enterDuel(s);
      else { s.over = 'win'; s.ev.push({ type: 'over', result: 'win' }); }
    }
    return s;
  }

  /* FNV-1a over the whole state minus the per-frame event list: two runs are the same run iff every frame hashes alike. */
  function hash(s) {
    var o = JSON.stringify(s, function (k, v) { return k === 'ev' ? undefined : v; }), h = 0x811c9dc5 >>> 0, i;
    for (i = 0; i < o.length; i++) { h ^= o.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  /* Replay an input log from a seed. Returns { state, hashes } with one hash per frame. */
  function replay(house, seed, log) {
    var s = start(house, seed), hashes = [], i;
    for (i = 0; i < log.length && !s.over; i++) { step(s, log[i]); hashes.push(hash(s)); }
    return { state: s, hashes: hashes };
  }

  /* A scripted player used by the tests and by the page's DEMO button (nothing else): it reads only the state and presses only the real inputs. It perfect-guards what the
     Unbled throws (a guard pressed about four frames before the strike lands inside the six-frame window) and punishes every opening. */
  function bot(s) {
    var p = s.p, e = s.e, d = dist(s), toward = p.x < e.x ? INPUT.RIGHT : INPUT.LEFT, away = p.x < e.x ? INPUT.LEFT : INPUT.RIGHT;
    if (!canAct(p) && p.act !== 'guard') return 0;
    if (s.stage === 0 || e.house === 'dummy') return d > ATK.light.reach - 10 ? toward : INPUT.LIGHT;
    var attacking = (e.act === 'light' || e.act === 'heavy');
    var hitAt = attacking ? ATK[e.act].hit : 0;
    if (attacking && d <= ATK[e.act].reach + 6) {
      if (e.t >= hitAt - 4 && e.t < hitAt + 2) return INPUT.GUARD;
      if (p.act === 'guard') return INPUT.GUARD;
      return 0;
    }
    if (p.act === 'guard') return 0;
    if (e.act === 'stagger' || e.act === 'open') {
      if (d > ATK.heavy.reach - 12) return toward;
      return (e.act === 'stagger' && e.stag > 56) ? INPUT.HEAVY : INPUT.LIGHT;
    }
    if (d < ATK.heavy.reach + 24) return away;     // keep outside its reach while it is on the offence
    return 0;
  }

  var api = { HZ: HZ, HEALTH: HEALTH, ARENA: ARENA, ATK: ATK, INPUT: INPUT, HOUSES: HOUSES, SHADOW_FRAMES: SHADOW_FRAMES, STAGGER_FRAMES: STAGGER_FRAMES,
    PERFECT_FRAMES: PERFECT_FRAMES, OPEN_FRAMES: OPEN_FRAMES, GUARD_BLOCK: GUARD_BLOCK, SHADOW_MULT: SHADOW_MULT, UNBLED_INTRO: UNBLED_INTRO,
    start: start, step: step, preview: preview, hash: hash, replay: replay, bot: bot, isShadow: isShadow, dist: dist };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OmegaZW = api;
})(typeof window !== 'undefined' ? window : globalThis);
