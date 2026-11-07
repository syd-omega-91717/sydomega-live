/* omega-origins-logic.js -- the rules of MYTH OF THE STONES: ORIGINS, Vertical Slice 0.
 *
 * Pure functions only: no DOM, no three.js, no timers, no storage. That is deliberate. Everything a fight
 * or a save depends on lives here so it can be tested with seeded replays in node
 * (scripts/tests/test_origins_logic.py) without a browser. The renderer and the game loop
 * (omega-origins-scene.js, omega-origins-game.js) call into this and never decide a rule themselves.
 *
 * Design source: docs/studios/franchises/myth-of-the-stones/games/origins/GDD.md. Status: PROTOTYPE.
 * Not a release; nothing here is connected to payments, tokens or any member-facing reward.
 *
 * Works as a browser global (window.OmegaOriginsLogic) and as a CommonJS module for node tests. */
(function (root) {
  'use strict';

  var SAVE_VERSION = 1;
  var INV_SLOTS = 12;
  var MAX_LEVEL = 5;
  var XP_TABLE = [0, 60, 150, 280, 450];

  /* ---------- seeded randomness: replayable fights ---------- */
  function makeRng(seed) {
    var s = (seed >>> 0) || 1;
    return {
      next: function () {
        s = (s + 0x6D2B79F5) >>> 0;
        var t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      get state() { return s; },
      set state(v) { s = (v >>> 0) || 1; }
    };
  }

  /* ---------- data ---------- */
  var ITEMS = {
    salve:   { id: 'salve',   name: 'Healing Salve',      type: 'consumable', stack: 5, heal: 40,
               text: 'A paste of valley herbs. Restores 40 health.' },
    draught: { id: 'draught', name: 'Ash Draught',        type: 'consumable', stack: 5, stamina: 60,
               text: 'Bitter and warm. Restores 60 stamina.' },
    blade:   { id: 'blade',   name: 'Valley Blade',       type: 'weapon',     stack: 1, gear: 0.15,
               text: 'A plain forged blade. +15% damage.' },
    charm:   { id: 'charm',   name: "Warden's Charm",     type: 'charm',      stack: 1, gear: 0.10,
               text: 'A worn bronze charm from the shrine. +10% damage.' },
    shard:   { id: 'shard',   name: 'Shard of Recall',    type: 'artifact',   stack: 1,
               text: 'A sliver of the shrine stone. It remembers more than you want it to.' },
    lantern: { id: 'lantern', name: "Keeper's Lantern",   type: 'artifact',   stack: 1,
               text: 'Given freely. It makes the dark a little shorter.' }
  };

  var SKILLS = {
    echo:      { id: 'echo',      name: 'Echo',      level: 2, text: 'Replay your last strike as a shockwave (key E). Adds Weight.' },
    foresight: { id: 'foresight', name: 'Foresight', level: 2, text: 'Enemy attacks show their warning ring 40% earlier.' },
    steady:    { id: 'steady',    name: 'Steady',    level: 3, text: 'Gain 30% less Weight from reading memories and using Echo.' },
    anchor:    { id: 'anchor',    name: 'Anchor',    level: 3, text: '+20 maximum health.' }
  };

  var DIFFICULTY = {
    story:  { enemyDamage: 0.6, enemyHealth: 0.8, telegraph: 1.5, weightRate: 0.6 },
    normal: { enemyDamage: 1.0, enemyHealth: 1.0, telegraph: 1.0, weightRate: 1.0 },
    hard:   { enemyDamage: 1.3, enemyHealth: 1.2, telegraph: 0.8, weightRate: 1.3 }
  };

  var ENEMIES = {
    wraith: { id: 'wraith', name: 'Ash Wraith',   hp: 28,  speed: 3.3, range: 1.9, aggro: 16, windup: 0.55, recover: 0.7,  damage: 9,  xp: 15, ranged: false },
    archer: { id: 'archer', name: 'Echo Archer',  hp: 20,  speed: 2.4, range: 13,  aggro: 20, windup: 0.8,  recover: 1.6,  damage: 7,  xp: 18, ranged: true },
    boss:   { id: 'boss',   name: 'The Unfinished Guardian', hp: 240, speed: 2.1, range: 4.2, aggro: 40, windup: 1.15, recover: 1.0, damage: 24, xp: 120, ranged: false }
  };

  var STAGES = ['hum', 'encounter', 'boss', 'memory', 'choice', 'done'];

  /* ---------- progression ---------- */
  function levelForXp(xp) {
    var lv = 1;
    for (var i = 1; i < XP_TABLE.length; i++) { if (xp >= XP_TABLE[i]) lv = i + 1; }
    return Math.min(MAX_LEVEL, lv);
  }
  function xpToNext(xp) {
    var lv = levelForXp(xp);
    return lv >= MAX_LEVEL ? 0 : XP_TABLE[lv] - xp;
  }
  function skillPointsEarned(level) { return Math.max(0, level - 1); }
  function skillPointsFree(p) {
    var spent = (p.skills || []).length;
    return Math.max(0, skillPointsEarned(p.level) - spent) + (p.bonusPoints || 0);
  }
  function canLearn(p, id) {
    var s = SKILLS[id];
    if (!s) return { ok: false, why: 'unknown skill' };
    if ((p.skills || []).indexOf(id) >= 0) return { ok: false, why: 'already learned' };
    if (p.level < s.level) return { ok: false, why: 'needs level ' + s.level };
    if (skillPointsFree(p) < 1) return { ok: false, why: 'no free skill points' };
    return { ok: true, why: '' };
  }
  function learn(p, id) {
    var c = canLearn(p, id);
    if (!c.ok) return c;
    p.skills = (p.skills || []).concat([id]);
    if ((p.bonusPoints || 0) > 0 && skillPointsEarned(p.level) - (p.skills.length - 1) <= 0) p.bonusPoints -= 1;
    if (id === 'anchor') { p.hpMax += 20; p.hp = Math.min(p.hpMax, p.hp + 20); }
    return { ok: true, why: '' };
  }
  function hasSkill(p, id) { return (p.skills || []).indexOf(id) >= 0; }

  /* ---------- combat maths ---------- */
  function gearBonus(p) {
    var b = 0;
    var eq = p.equip || {};
    if (eq.weapon && ITEMS[eq.weapon]) b += ITEMS[eq.weapon].gear || 0;
    if (eq.charm && ITEMS[eq.charm]) b += ITEMS[eq.charm].gear || 0;
    return b;
  }
  function playerBaseDamage(p) { return 12 + (p.level - 1) * 1.5; }
  function damage(base, gear, crit, mitigation) {
    var d = base * (1 + gear) * (crit ? 1.5 : 1) - (mitigation || 0);
    return Math.max(1, Math.round(d));
  }
  function rollCrit(rng, chance) { return rng.next() < chance; }
  function enemyDamageTo(player, enemyType, diff, phase) {
    var e = ENEMIES[enemyType];
    var d = e.damage * diff.enemyDamage;
    if (enemyType === 'boss' && phase === 3) d *= 1.25;
    return Math.max(1, Math.round(d));
  }
  function enemyMaxHp(type, diff) { return Math.round(ENEMIES[type].hp * diff.enemyHealth); }

  /* ---------- Weight (the price of Memory) ---------- */
  function addWeight(p, amount) {
    var a = amount;
    if (hasSkill(p, 'steady')) a *= 0.7;
    p.weight = Math.max(0, Math.min(100, (p.weight || 0) + a));
    return p.weight;
  }
  function weightPenalty(weight) {
    var w = Math.max(0, Math.min(100, weight)) / 100;
    return { dodgeCooldownMul: 1 + 0.6 * w, abilityCooldownMul: 1 + 0.8 * w, staminaRegenMul: 1 - 0.3 * w };
  }

  /* ---------- inventory ---------- */
  function emptyInventory() { var a = []; for (var i = 0; i < INV_SLOTS; i++) a.push(null); return a; }
  function addItem(inv, id, qty) {
    var def = ITEMS[id];
    if (!def) return { inv: inv, left: qty, error: 'unknown item' };
    var left = qty || 1;
    var out = inv.map(function (s) { return s ? { id: s.id, qty: s.qty } : null; });
    for (var i = 0; i < out.length && left > 0; i++) {
      if (out[i] && out[i].id === id && out[i].qty < def.stack) {
        var add = Math.min(def.stack - out[i].qty, left);
        out[i].qty += add; left -= add;
      }
    }
    for (var j = 0; j < out.length && left > 0; j++) {
      if (!out[j]) {
        var put = Math.min(def.stack, left);
        out[j] = { id: id, qty: put }; left -= put;
      }
    }
    return { inv: out, left: left };
  }
  function removeAt(inv, idx, qty) {
    var out = inv.map(function (s) { return s ? { id: s.id, qty: s.qty } : null; });
    if (!out[idx]) return out;
    out[idx].qty -= (qty || 1);
    if (out[idx].qty <= 0) out[idx] = null;
    return out;
  }
  function countItem(inv, id) {
    var n = 0;
    for (var i = 0; i < inv.length; i++) if (inv[i] && inv[i].id === id) n += inv[i].qty;
    return n;
  }
  /* Use or equip the item in slot idx. Mutates the player; returns a message. */
  function useItem(p, idx) {
    var slot = p.inv[idx];
    if (!slot) return { ok: false, msg: 'Empty slot.' };
    var def = ITEMS[slot.id];
    if (def.type === 'consumable') {
      if (def.heal) {
        if (p.hp >= p.hpMax) return { ok: false, msg: 'Already at full health.' };
        p.hp = Math.min(p.hpMax, p.hp + def.heal);
      }
      if (def.stamina) {
        if (p.stamina >= 100) return { ok: false, msg: 'Stamina is full.' };
        p.stamina = Math.min(100, p.stamina + def.stamina);
      }
      p.inv = removeAt(p.inv, idx, 1);
      return { ok: true, msg: def.name + ' used.' };
    }
    if (def.type === 'weapon' || def.type === 'charm') {
      var key = def.type;
      var cur = p.equip[key];
      if (cur === def.id) { p.equip[key] = null; return { ok: true, msg: def.name + ' unequipped.' }; }
      p.equip[key] = def.id;
      return { ok: true, msg: def.name + ' equipped.' };
    }
    return { ok: false, msg: def.name + ' cannot be used. It can be read in the codex.' };
  }

  /* ---------- quest: "The Hum in the Valley" ---------- */
  function newQuest() { return { stage: 'hum', choice: null }; }
  function advanceQuest(q, event) {
    var next = { stage: q.stage, choice: q.choice };
    if (q.stage === 'hum' && event === 'reach_shrine') next.stage = 'encounter';
    else if (q.stage === 'encounter' && event === 'wave_cleared') next.stage = 'boss';
    else if (q.stage === 'boss' && event === 'boss_defeated') next.stage = 'memory';
    else if (q.stage === 'memory' && event === 'memory_read') next.stage = 'choice';
    else if (q.stage === 'choice' && (event === 'choose_keep' || event === 'choose_share')) {
      next.stage = 'done'; next.choice = event === 'choose_keep' ? 'keep' : 'share';
    }
    return next;
  }
  /* The consequences of the one choice. Returns what changed so the UI can say it plainly. */
  function applyChoice(state, choice) {
    var p = state.player, notes = [];
    if (choice === 'keep') {
      addWeight(p, 25);
      p.bonusPoints = (p.bonusPoints || 0) + 1;
      var r = addItem(p.inv, 'shard', 1); p.inv = r.inv;
      state.rep.citadel += 5;
      notes.push('You keep the reading. Weight +25, one bonus skill point, Shard of Recall.');
    } else {
      p.weight = Math.max(0, (p.weight || 0) - 20);
      var r2 = addItem(p.inv, 'lantern', 1); p.inv = r2.inv;
      state.rep.keepers += 10;
      state.world.ally = 'keeper';
      notes.push("You share the reading. Weight -20, Keeper's Lantern. The Valley Keeper will walk with you.");
    }
    return notes;
  }

  /* ---------- enemy brain: a small finite-state machine ---------- */
  /* e = { type, state, timer, cooldown }. Returns { state, timer, strike, move } where move is -1 (away),
     0 (hold), 1 (toward), and strike is true on the single tick the attack lands. Pure: same input, same output. */
  function enemyThink(e, dist, dt, diff) {
    var def = ENEMIES[e.type];
    var st = e.state, timer = e.timer - dt, strike = false, move = 0;
    var wind = def.windup * (diff ? diff.telegraph : 1);
    if (st === 'stunned') {
      if (timer <= 0) { st = 'chase'; timer = 0; }
    } else if (st === 'idle') {
      if (dist <= def.aggro) { st = 'chase'; timer = 0; }
    } else if (st === 'chase') {
      var want = def.ranged ? def.range * 0.7 : def.range * 0.9;
      if (dist <= def.range && timer <= 0) { st = 'windup'; timer = wind; }
      else if (def.ranged && dist < def.range * 0.45) move = -1;
      else if (dist > want) move = 1;
    } else if (st === 'windup') {
      if (timer <= 0) { strike = true; st = 'recover'; timer = def.recover; }
    } else if (st === 'recover') {
      if (timer <= 0) { st = 'chase'; timer = 0; }
    }
    return { state: st, timer: Math.max(0, timer), strike: strike, move: move };
  }
  function bossPhase(hp, hpMax) {
    var f = hp / hpMax;
    return f > 0.66 ? 1 : (f > 0.33 ? 2 : 3);
  }

  /* ---------- save, load, migrate ---------- */
  function newState(seed) {
    return {
      v: SAVE_VERSION, seed: seed >>> 0 || 91717, rng: seed >>> 0 || 91717,
      player: {
        x: 0, z: 46, hp: 100, hpMax: 100, stamina: 100, weight: 0, xp: 0, level: 1,
        skills: [], bonusPoints: 0,
        inv: addItem(addItem(addItem(emptyInventory(), 'blade', 1).inv, 'salve', 2).inv, 'draught', 1).inv,
        equip: { weapon: 'blade', charm: null }
      },
      quest: newQuest(),
      world: { killed: [], chest: false, ally: null, bossDown: false },
      rep: { citadel: 0, keepers: 0, reunion: 0 },
      tithes: 0, playSeconds: 0
    };
  }
  function checksum(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function serialize(state) {
    var body = JSON.stringify(state);
    return JSON.stringify({ saveVersion: SAVE_VERSION, sum: checksum(body), body: body });
  }
  /* Older shapes are lifted to the current one; unknown newer versions are refused, not guessed at. */
  function migrate(state) {
    var s = state;
    if (!s || typeof s !== 'object') return null;
    if (!s.v) {              /* version 0: flat player fields and no reputation */
      var base = newState(s.seed || 91717);
      base.player.hp = s.hp != null ? s.hp : base.player.hp;
      base.player.xp = s.xp != null ? s.xp : 0;
      base.player.level = levelForXp(base.player.xp);
      if (s.quest) base.quest.stage = s.quest;
      s = base;
    }
    if (s.v > SAVE_VERSION) return null;
    s.player.skills = s.player.skills || [];
    s.player.bonusPoints = s.player.bonusPoints || 0;
    s.rep = s.rep || { citadel: 0, keepers: 0, reunion: 0 };
    s.world = s.world || { killed: [], chest: false, ally: null, bossDown: false };
    return s;
  }
  function parseSave(text) {
    var env;
    try { env = JSON.parse(text); } catch (e) { return { ok: false, error: 'not valid JSON' }; }
    if (!env || typeof env.body !== 'string') return { ok: false, error: 'missing body' };
    if (checksum(env.body) !== env.sum) return { ok: false, error: 'checksum mismatch (file edited or damaged)' };
    var state;
    try { state = JSON.parse(env.body); } catch (e2) { return { ok: false, error: 'body is not valid JSON' }; }
    var m = migrate(state);
    if (!m) return { ok: false, error: 'save is from a newer version of the game' };
    return { ok: true, state: m };
  }

  var api = {
    SAVE_VERSION: SAVE_VERSION, INV_SLOTS: INV_SLOTS, MAX_LEVEL: MAX_LEVEL, XP_TABLE: XP_TABLE,
    ITEMS: ITEMS, SKILLS: SKILLS, DIFFICULTY: DIFFICULTY, ENEMIES: ENEMIES, STAGES: STAGES,
    makeRng: makeRng, levelForXp: levelForXp, xpToNext: xpToNext, skillPointsEarned: skillPointsEarned,
    skillPointsFree: skillPointsFree, canLearn: canLearn, learn: learn, hasSkill: hasSkill,
    gearBonus: gearBonus, playerBaseDamage: playerBaseDamage, damage: damage, rollCrit: rollCrit,
    enemyDamageTo: enemyDamageTo, enemyMaxHp: enemyMaxHp, addWeight: addWeight, weightPenalty: weightPenalty,
    emptyInventory: emptyInventory, addItem: addItem, removeAt: removeAt, countItem: countItem, useItem: useItem,
    newQuest: newQuest, advanceQuest: advanceQuest, applyChoice: applyChoice,
    enemyThink: enemyThink, bossPhase: bossPhase,
    newState: newState, checksum: checksum, serialize: serialize, migrate: migrate, parseSave: parseSave
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaOriginsLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
