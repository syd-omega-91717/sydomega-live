/* omega-origins-game.js -- the game loop of MYTH OF THE STONES: ORIGINS, Vertical Slice 0.
 *
 * PROTOTYPE. One valley, one quest ("The Hum in the Valley"), one boss, browser-only saves. It is not a
 * release, it has no multiplayer, it touches no payment or token system, and it writes nothing to the
 * server: progress lives in this browser's localStorage only (try/catch around every access, so the game
 * still runs if storage is blocked). Design: docs/studios/franchises/myth-of-the-stones/games/origins/GDD.md.
 *
 * Rules come from omega-origins-logic.js, drawing from omega-origins-scene.js, sound from omega-origins-audio.js,
 * menus from omega-origins-ui.js. This file only wires them: input, the fixed 60 Hz step, enemies, the quest.
 * Browser global: window.OmegaOriginsGame.start(stage, canvas). Append ?test=1 to expose window.__originsTest. */
(function (root) {
  'use strict';
  var L = root.OmegaOriginsLogic, A = root.OmegaOriginsAudio, S3 = root.OmegaOriginsScene, UI = root.OmegaOriginsUI;
  var AUTO_KEY = 'omega_origins_auto', SLOT_KEY = 'omega_origins_slot_', OPT_KEY = 'omega_origins_options';
  var STEP = 1 / 60, TAU = Math.PI * 2;

  function lsGet(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function hasWebGL() {
    try { var c = document.createElement('canvas'); return !!(root.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function wrapAngle(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

  function start(stage, canvas) {
    var ui, scene, THREE, G = null, running = false, lastT = 0, acc = 0, clock = 0;
    var testMode = /[?&]test=1/.test(root.location.search);
    var mobile = (root.matchMedia && root.matchMedia('(pointer:coarse)').matches) || root.innerWidth < 760;
    var prefersReduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var options = { difficulty: 'normal', reduced: prefersReduced, contrast: false, largeText: false };
    try { var o0 = JSON.parse(lsGet(OPT_KEY) || 'null'); if (o0) for (var k0 in o0) options[k0] = o0[k0]; } catch (e) { /* defaults */ }

    if (!hasWebGL()) {
      ui = UI.create(stage, { toggle: function () {}, close: function () {}, toggleSound: function () {}, press: function () {}, stick: function () {}, next: function () {}, save: function () {}, load: function () {}, newGame: function () {}, option: function () {} }, L);
      ui.nogl(); return null;
    }

    var keys = {}, inp = { mx: 0, mz: 0, sx: 0, sz: 0 }, pressed = {}, yawTarget = 0;
    var R, P, enemies = [], projectiles = [], modal = 'title', dlg = null, hitstop = 0, nextId = 1, bossRef = null, diff = L.DIFFICULTY[options.difficulty];

    function setDiff() { diff = L.DIFFICULTY[options.difficulty] || L.DIFFICULTY.normal; }
    function resetRuntime() {
      R = { facing: Math.PI, roll: 0, rollT: 0, rollX: 0, rollZ: 0, swingT: -1, hitDone: false, iframes: 0, staminaDelay: 0, abilityCd: 0, dodgeCd: 0, atkCd: 0, speed: 0, lastDmg: 12, dead: false, flash: 0 };
    }

    /* ---------- state ---------- */
    function applyState(s, fresh) {
      G = s; P = G.player; resetRuntime(); clearEnemies(); setDiff();
      if (G.quest.stage === 'encounter') spawnWave();
      else if (G.quest.stage === 'boss' && !G.world.bossDown) spawnBoss();
      scene.setStoneState(G.quest.stage === 'hum' ? 'dormant' : (G.quest.stage === 'done' || G.quest.stage === 'choice' ? 'read' : 'awake'));
      if (G.quest.stage === 'hum') { P.x = S3.START.x; P.z = S3.START.z; }
      objectiveRefresh(); A.humLevel(G.quest.stage === 'hum' ? 0.2 : 0.7);
    }
    function snapshot() { return G; }
    function checkpoint() { lsSet(AUTO_KEY, L.serialize(G)); }
    function slotInfo() {
      var info = {};
      [1, 2, 3].forEach(function (n) {
        var t = lsGet(SLOT_KEY + n); if (!t) return;
        var r = L.parseSave(t); info[n] = r.ok ? 'Lv ' + r.state.player.level + ', ' + r.state.quest.stage : 'damaged';
      });
      return info;
    }

    /* ---------- enemies ---------- */
    function clearEnemies() { enemies.forEach(function (e) { e.handle.remove(); }); enemies = []; projectiles = []; bossRef = null; ui.boss(0, false); }
    function spawn(type, x, z) {
      var def = L.ENEMIES[type], hp = L.enemyMaxHp(type, diff);
      var e = { id: nextId++, type: type, x: x, z: z, hp: hp, hpMax: hp, state: 'idle', timer: 0, facing: 0, windupMax: 0, shotDone: false, phase: 1, kx: 0, kz: 0, dead: false, deadT: 0, handle: scene.addEnemy(type, x, z), cdBark: 0 };
      enemies.push(e); return e;
    }
    function spawnWave() {
      var cx = S3.SHRINE.x, cz = S3.SHRINE.z;
      [['wraith', -0.6], ['wraith', 0.6], ['wraith', 2.2], ['wraith', 4.0], ['archer', 1.2], ['archer', 3.2]].forEach(function (d, i) {
        var a = d[1] * 1.0 + 3.14, r = 11 + (i % 2) * 3;
        spawn(d[0], cx + Math.cos(a) * r, cz + Math.sin(a) * r).state = 'idle';
      });
    }
    function spawnBoss() {
      var b = spawn('boss', S3.SHRINE.x, S3.SHRINE.z - 8); bossRef = b; b.state = 'chase'; A.boss(); scene.shake(0.8);
    }
    function aliveCount() { var n = 0; enemies.forEach(function (e) { if (!e.dead) n++; }); return n; }

    /* ---------- feedback ---------- */
    function floatAt(x, y, z, text, cls) { var s = scene.project(x, y, z); if (s.visible) ui.float(s.x, s.y, text, cls); }
    function say(lines, cb) { dlg = { lines: lines, i: 0, cb: cb }; modal = 'dialogue'; ui.dialogue(lines[0].who, lines[0].text); }
    function nextLine() {
      if (!dlg) return;
      dlg.i++;
      if (dlg.i >= dlg.lines.length) { var cb = dlg.cb; dlg = null; ui.endDialogue(); modal = 'play'; if (cb) cb(); }
      else ui.dialogue(dlg.lines[dlg.i].who, dlg.lines[dlg.i].text);
    }
    function xpGain(n) {
      var before = P.level; P.xp += n; P.level = L.levelForXp(P.xp);
      if (P.level > before) { P.hp = Math.min(P.hpMax, P.hp + 30); ui.toast('Level ' + P.level + '. You have ' + L.skillPointsFree(P) + ' free skill point(s).'); A.levelUp(); }
    }

    /* ---------- combat ---------- */
    function hurtPlayer(dmg, sx, sz) {
      if (R.dead || R.iframes > 0) return false;
      P.hp = Math.max(0, P.hp - dmg); R.iframes = 0.55; R.flash = 0.2;
      scene.flashPlayer(); scene.shake(0.5); ui.flashDamage(); A.hurt();
      floatAt(P.x, 2.6, P.z, '-' + dmg, 'og-fhurt');
      if (P.hp <= 0) { R.dead = true; modal = 'dead'; ui.dead(respawn); }
      return true;
    }
    function respawn() {
      var t = lsGet(AUTO_KEY), r = t ? L.parseSave(t) : null;
      var s = r && r.ok ? r.state : L.newState(91717);
      s.player.hp = s.player.hpMax; s.player.stamina = 100;
      ui.hideSheet(); applyState(s); modal = 'play'; ui.toast('Back at the last checkpoint.');
    }
    function damageEnemy(e, base, crit) {
      var dmg = L.damage(base, L.gearBonus(P), crit, 0);
      e.hp -= dmg; e.handle.flash(); scene.burst(e.x, 1.4, e.z, crit ? 14 : 8, crit ? '#ffd36b' : '#ffe6a0');
      floatAt(e.x, e.type === 'boss' ? 6 : 3, e.z, String(dmg), crit ? 'og-fcrit' : 'og-fdmg'); A.hit();
      if (e.type !== 'boss') { var d = Math.hypot(e.x - P.x, e.z - P.z) || 1; e.kx = (e.x - P.x) / d * 5; e.kz = (e.z - P.z) / d * 5; }
      if (e.state === 'windup' && e.type !== 'boss' && dmg >= 9) { e.state = 'stunned'; e.timer = 0.45; e.handle.telegraph(0, 0, e.x, e.z); }
      if (e.hp <= 0) killEnemy(e);
      return dmg;
    }
    function killEnemy(e) {
      e.dead = true; e.handle.die(); e.handle.telegraph(0, 0, e.x, e.z); A.kill(); scene.burst(e.x, 1.6, e.z, 22, '#ffd36b');
      var def = L.ENEMIES[e.type]; xpGain(def.xp); G.tithes += e.type === 'boss' ? 50 : 5;
      var rng = L.makeRng(G.rng); var roll = rng.next(); G.rng = rng.state;
      var drop = e.type === 'wraith' && roll < 0.25 ? 'salve' : (e.type === 'archer' && roll < 0.2 ? 'draught' : null);
      if (drop) { var r = L.addItem(P.inv, drop, 1); P.inv = r.inv; ui.toast('Dropped: ' + L.ITEMS[drop].name); A.pickup(); }
      if (e.type === 'boss') { G.world.bossDown = true; bossRef = null; ui.boss(0, false); stageEvent('boss_defeated'); }
      else if (G.quest.stage === 'encounter' && aliveCount() === 0) stageEvent('wave_cleared');
    }
    function doAttack() {
      var cost = 8;
      if (R.swingT >= 0 || R.atkCd > 0 || R.roll > 0 || P.stamina < cost) return;
      var near = nearestEnemy(4.8);
      if (near) R.facing = Math.atan2(near.x - P.x, near.z - P.z);
      P.stamina -= cost; R.staminaDelay = 0.55; R.swingT = 0; R.hitDone = false; A.swing(); scene.slash(P.x, P.z, R.facing);
    }
    function resolveSwing() {
      var base = L.playerBaseDamage(P), rng = L.makeRng(G.rng), fx = Math.sin(R.facing), fz = Math.cos(R.facing), hits = 0;
      enemies.forEach(function (e) {
        if (e.dead) return;
        var dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz), reach = 2.9 + (e.type === 'boss' ? 1.8 : 0);
        if (d > reach) return;
        var cos = (dx * fx + dz * fz) / (d || 1);
        if (cos < 0.34 && d > 1.2) return;
        var crit = L.rollCrit(rng, 0.05);
        var dmg = damageEnemy(e, base, crit); R.lastDmg = dmg; hits++;
      });
      G.rng = rng.state;
      if (hits && !options.reduced) { hitstop = 0.05; scene.shake(0.25); }
    }
    function doDodge() {
      if (R.roll > 0 || R.dodgeCd > 0 || P.stamina < 20) return;
      var dx = inp.sx, dz = inp.sz, m = Math.hypot(dx, dz);
      if (m < 0.1) { dx = Math.sin(R.facing); dz = Math.cos(R.facing); m = 1; }
      R.rollX = dx / m; R.rollZ = dz / m; R.roll = 0.0001; R.rollT = 0.36; R.iframes = Math.max(R.iframes, 0.32);
      P.stamina = Math.max(0, P.stamina - 28); R.staminaDelay = 0.7; R.dodgeCd = 0.55 * L.weightPenalty(P.weight).dodgeCooldownMul; R.facing = Math.atan2(R.rollX, R.rollZ);
      A.dodge();
    }
    function doEcho() {
      if (!L.hasSkill(P, 'echo') || R.abilityCd > 0 || P.stamina < 15) return;
      R.abilityCd = 8 * L.weightPenalty(P.weight).abilityCooldownMul; P.stamina -= 15; R.staminaDelay = 0.6;
      L.addWeight(P, 8 * diff.weightRate); A.echo(); scene.ring(P.x, P.z, 5.6, '#9be9ff', 0.7, true); scene.shake(0.3);
      enemies.forEach(function (e) {
        if (e.dead) return; var d = Math.hypot(e.x - P.x, e.z - P.z);
        if (d <= 5.6 + (e.type === 'boss' ? 1.5 : 0)) damageEnemy(e, Math.max(6, R.lastDmg * 0.8), false);
      });
    }
    function doSalve() {
      for (var i = 0; i < P.inv.length; i++) {
        if (P.inv[i] && P.inv[i].id === 'salve') { var r = L.useItem(P, i); ui.toast(r.msg); if (r.ok) A.pickup(); return; }
      }
      ui.toast('No healing salve.');
    }
    function nearestEnemy(maxD) {
      var best = null, bd = maxD || 99;
      enemies.forEach(function (e) { if (e.dead) return; var d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; best = e; } });
      return best;
    }

    /* ---------- enemy brains ---------- */
    function meleeAttackers() { var n = 0; enemies.forEach(function (e) { if (!e.dead && e.type === 'wraith' && (e.state === 'windup' || e.state === 'recover')) n++; }); return n; }
    function stepEnemy(e, dt) {
      if (e.dead) { e.deadT += dt; e.handle.pose(e.x, e.z, e.facing, 0, clock); if (e.handle.isGone()) { e.handle.remove(); enemies.splice(enemies.indexOf(e), 1); } return; }
      var def = L.ENEMIES[e.type], dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 0.001;
      if (e.type === 'boss') {
        e.phase = L.bossPhase(e.hp, e.hpMax);
        if (e.phase >= 2 && !e.p2) { e.p2 = true; spawn('wraith', e.x + 4, e.z + 2); spawn('wraith', e.x - 4, e.z + 2); ui.toast('The Guardian calls the ash.'); scene.shake(0.7); }
        if (e.phase >= 3 && !e.p3) { e.p3 = true; spawn('archer', e.x + 5, e.z - 2); spawn('archer', e.x - 5, e.z - 2); ui.toast('The seams burn brighter.'); scene.shake(0.9); }
      }
      var out = L.enemyThink(e, dist, dt, e.type === 'boss' ? { telegraph: diff.telegraph * (e.phase === 3 ? 0.8 : 1) } : diff);
      if (out.state === 'windup' && e.state !== 'windup') {
        if (e.type === 'wraith' && meleeAttackers() >= 2) { out.state = 'chase'; out.timer = 0.3; }
        else { e.windupMax = def.windup * diff.telegraph * (e.type === 'boss' && e.phase === 3 ? 0.8 : 1); out.timer = e.windupMax; A.telegraph(); }
      }
      e.state = out.state; e.timer = out.timer;
      var spd = def.speed * (e.type === 'boss' ? 1 + 0.25 * (e.phase - 1) : 1);
      var mv = 0;
      if (e.state === 'chase') mv = out.move;
      if (mv !== 0) { e.x += (dx / dist) * spd * mv * dt; e.z += (dz / dist) * spd * mv * dt; }
      if (e.state !== 'windup' && e.state !== 'recover' && e.state !== 'stunned') e.facing = Math.atan2(dx, dz);
      e.x += e.kx * dt; e.z += e.kz * dt; e.kx *= 0.85; e.kz *= 0.85;
      var lim = S3.HALF - 3; e.x = Math.max(-lim, Math.min(lim, e.x)); e.z = Math.max(-lim, Math.min(lim, e.z));
      for (var j = 0; j < enemies.length; j++) {          /* keep bodies from stacking */
        var o = enemies[j]; if (o === e || o.dead) continue;
        var ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz), min = e.type === 'boss' || o.type === 'boss' ? 3 : 1.1;
        if (od < min && od > 0.001) { e.x += (ox / od) * (min - od) * 0.4; e.z += (oz / od) * (min - od) * 0.4; }
      }
      /* warning ring */
      if (e.state === 'windup') {
        var frac = 1 - e.timer / Math.max(0.001, e.windupMax), threshold = L.hasSkill(P, 'foresight') ? 0 : 0.4;
        var rad = e.type === 'boss' ? 4.6 : (e.type === 'archer' ? 1.4 : def.range + 0.7);
        if (frac >= threshold) e.handle.telegraph(rad, frac, e.x, e.z); else e.handle.telegraph(0, 0, e.x, e.z);
        e.handle.strike(frac > 0.6);
      } else { e.handle.telegraph(0, 0, e.x, e.z); e.handle.strike(false); }
      if (out.strike) {
        e.handle.strike(false);
        if (e.type === 'archer') {
          var d2 = Math.hypot(P.x - e.x, P.z - e.z) || 1;
          projectiles.push({ x: e.x, z: e.z, vx: (P.x - e.x) / d2 * 11, vz: (P.z - e.z) / d2 * 11, life: 2.2, dmg: L.enemyDamageTo(P, 'archer', diff, 1) });
        } else {
          var reach = e.type === 'boss' ? 4.6 : def.range + 0.7;
          if (e.type === 'boss') { scene.ring(e.x, e.z, 4.6, '#ff8a4a', 0.5, true); scene.shake(0.9); }
          if (Math.hypot(P.x - e.x, P.z - e.z) <= reach) hurtPlayer(L.enemyDamageTo(P, e.type, diff, e.phase), e.x, e.z);
        }
      }
      e.handle.pose(e.x, e.z, e.facing, mv ? 1 : 0, clock);
    }

    /* ---------- quest ---------- */
    function stageEvent(ev) {
      var before = G.quest.stage; G.quest = L.advanceQuest(G.quest, ev);
      if (G.quest.stage === before) return;
      var st = G.quest.stage;
      if (st === 'encounter') {
        scene.setStoneState('awake'); A.humLevel(0.7); checkpoint();
        say([{ who: 'Valley Keeper', text: 'Stay back from the stone, wanderer. It has been waking things for a week.' }, { who: 'Auren', text: 'It is the same note. It is calling something.' }], function () { spawnWave(); ui.toast('Ash Wraiths and Echo Archers close in.'); });
      } else if (st === 'boss') {
        checkpoint(); xpGain(0);
        say([{ who: 'Valley Keeper', text: 'That is not ash. That is older. It was never finished.' }], function () { spawnBoss(); });
      } else if (st === 'memory') {
        checkpoint(); scene.burst(S3.SHRINE.x, 3, S3.SHRINE.z, 30, '#9be9ff');
        say([{ who: 'Auren', text: 'It folds into rings. Seven of them lit. Two of them dark.' }, { who: 'Valley Keeper', text: 'The stone is quiet now. Go to it. Read it, if you can bear the weight.' }]);
      } else if (st === 'choice') {
        modal = 'choice'; ui.choice(function (c) { stageEvent(c === 'keep' ? 'choose_keep' : 'choose_share'); });
      } else if (st === 'done') {
        var notes = L.applyChoice(G, G.quest.choice); xpGain(100); scene.setStoneState('read'); checkpoint(); ui.hideSheet(); A.read();
        modal = 'done'; notes.push('Quest XP +100. Level ' + P.level + '.');
        ui.done(notes, function () { ui.hideSheet(); modal = 'play'; });
      }
      objectiveRefresh();
    }
    function readStone() {
      L.addWeight(P, 15 * diff.weightRate); A.read();
      say([{ who: 'The stone', text: 'A white city on a cliff above a green sea. Children running with paper lanterns.' }, { who: 'The stone', text: 'A man folds a paper bird for a small girl. He says it is the quietest thing in the world.' }, { who: 'The stone', text: 'Then the sky tears, and the road is grass, and the grass is dust.' }], function () { stageEvent('memory_read'); });
    }
    function openChest() {
      G.world.chest = true; var r = L.addItem(P.inv, 'charm', 1); P.inv = r.inv; var r2 = L.addItem(P.inv, 'salve', 2); P.inv = r2.inv;
      ui.toast("Chest: Warden's Charm and 2 Healing Salves."); A.pickup(); scene.burst(S3.SHRINE.x + 7.2, 1.5, S3.SHRINE.z + 3.5, 14, '#ffd36b');
    }
    function target() {
      var s = G.quest.stage;
      if (s === 'hum') return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Follow the hum north', sub: 'The note is coming from a shrine in the Forgotten Valley.' };
      if (s === 'encounter') return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Defeat what the stone has woken', sub: aliveCount() + ' remaining. Dodge the red rings.' };
      if (s === 'boss') return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Defeat the Unfinished Guardian', sub: 'Watch for its slam. Echo helps if you have learned it.' };
      if (s === 'memory') return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Read the stone', sub: 'Stand beside it and press F (or Use).' };
      if (s === 'choice') return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Decide what to do with the reading', sub: '' };
      return { x: S3.SHRINE.x, z: S3.SHRINE.z, text: 'Slice complete', sub: 'Explore the valley, open the chest, check the codex in your Bag.' };
    }
    function objectiveRefresh() { var t = target(); ui.objective(t.text, t.sub, 0, G.quest.stage !== 'done'); }

    /* ---------- the fixed step ---------- */
    function step(dt) {
      clock += dt; G.playSeconds += dt;
      if (hitstop > 0) { hitstop -= dt; return; }
      var pen = L.weightPenalty(P.weight);
      R.iframes = Math.max(0, R.iframes - dt); R.abilityCd = Math.max(0, R.abilityCd - dt); R.dodgeCd = Math.max(0, R.dodgeCd - dt); R.atkCd = Math.max(0, R.atkCd - dt); R.flash = Math.max(0, R.flash - dt);
      R.staminaDelay = Math.max(0, R.staminaDelay - dt);
      if (R.staminaDelay <= 0) P.stamina = Math.min(100, P.stamina + 24 * pen.staminaRegenMul * dt);
      if (P.weight > 0) P.weight = Math.max(0, P.weight - 0.35 * dt * 0.0);   /* Weight is shed only by choices and rest, never by waiting */
      /* intent */
      if (pressed.attack) doAttack(); if (pressed.dodge) doDodge(); if (pressed.echo) doEcho(); if (pressed.salve) doSalve();
      if (pressed.interact) interact();
      pressed = {};
      /* movement */
      var yaw = yawNow, mx = inp.mx, mz = inp.mz, wl = Math.hypot(mx, mz);
      if (wl > 1) { mx /= wl; mz /= wl; wl = 1; }
      var wx = Math.cos(yaw) * mx + Math.sin(yaw) * mz, wz = -Math.sin(yaw) * mx + Math.cos(yaw) * mz;
      inp.sx = wx; inp.sz = wz;
      var sp = 0;
      if (R.roll > 0) {
        R.rollT -= dt; R.roll = Math.min(1, 1 - R.rollT / 0.36); sp = 9.2; P.x += R.rollX * sp * dt; P.z += R.rollZ * sp * dt;
        if (R.rollT <= 0) R.roll = 0;
      } else {
        var slow = R.swingT >= 0 ? 0.35 : 1;
        sp = 5.4 * slow * wl; P.x += wx * 5.4 * slow * dt; P.z += wz * 5.4 * slow * dt;
        if (wl > 0.1 && R.swingT < 0) R.facing = Math.atan2(wx, wz);
      }
      var lim = S3.HALF - 3; P.x = Math.max(-lim, Math.min(lim, P.x)); P.z = Math.max(-lim, Math.min(lim, P.z));
      R.speed = Math.min(1, sp / 5.4);
      /* swing timing */
      if (R.swingT >= 0) {
        R.swingT += dt;
        if (!R.hitDone && R.swingT >= 0.14) { R.hitDone = true; resolveSwing(); }
        if (R.swingT >= 0.38) { R.swingT = -1; R.atkCd = 0.05; }
      }
      /* bodies */
      enemies.slice().forEach(function (e) { stepEnemy(e, dt); });
      enemies.forEach(function (e) {
        if (e.dead) return; var d = Math.hypot(e.x - P.x, e.z - P.z), min = e.type === 'boss' ? 2.6 : 1.0;
        if (d < min && d > 0.001) { var push = (min - d); P.x += (P.x - e.x) / d * push * 0.5; P.z += (P.z - e.z) / d * push * 0.5; }
      });
      /* projectiles */
      for (var i = projectiles.length - 1; i >= 0; i--) {
        var pr = projectiles[i]; pr.x += pr.vx * dt; pr.z += pr.vz * dt; pr.life -= dt;
        if (Math.hypot(pr.x - P.x, pr.z - P.z) < 0.9) { if (hurtPlayer(pr.dmg, pr.x, pr.z) || R.iframes > 0) { projectiles.splice(i, 1); continue; } }
        if (pr.life <= 0) projectiles.splice(i, 1);
      }
      /* the quest's first trigger */
      if (G.quest.stage === 'hum' && Math.hypot(P.x - S3.SHRINE.x, P.z - S3.SHRINE.z) < 17) stageEvent('reach_shrine');
      /* boss bar */
      if (bossRef && !bossRef.dead) ui.boss(bossRef.hp / bossRef.hpMax, true);
    }
    function interact() {
      var ds = Math.hypot(P.x - S3.SHRINE.x, P.z - S3.SHRINE.z), c = scene.chestPos(), dc = Math.hypot(P.x - c.x, P.z - c.z);
      if (G.quest.stage === 'memory' && ds < 6) { readStone(); return; }
      if (!G.world.chest && dc < 3 && L.STAGES.indexOf(G.quest.stage) >= 2) { openChest(); return; }
      if (G.quest.stage === 'hum' || ds >= 6) ui.toast('Nothing here to use.');
    }

    /* ---------- input ---------- */
    var yawNow = 0;
    var KEYMAP = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
    function recompute() {
      inp.mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + stickX; inp.mz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + stickY;
    }
    var stickX = 0, stickY = 0;
    root.addEventListener('keydown', function (e) {
      if (modal === 'title') return;
      if (e.target && /input|select|textarea/i.test(e.target.tagName) && e.code !== 'Escape') return;
      if (modal === 'dialogue' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyF')) { e.preventDefault(); nextLine(); return; }
      if (e.code === 'Escape') { e.preventDefault(); if (modal === 'play') H.toggle('menu'); else if (/inventory|skills|menu|options|controls/.test(modal)) H.close(); return; }
      if (modal !== 'play') return;
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; recompute(); e.preventDefault(); return; }
      if (e.repeat) return;
      if (e.code === 'KeyJ') pressed.attack = true;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') { pressed.dodge = true; e.preventDefault(); }
      else if (e.code === 'KeyE') pressed.echo = true;
      else if (e.code === 'KeyF' || e.code === 'Enter') pressed.interact = true;
      else if (e.code === 'KeyQ') pressed.salve = true;
      else if (e.code === 'KeyI') H.toggle('inventory');
      else if (e.code === 'KeyK') H.toggle('skills');
      else if (e.code === 'KeyM') H.toggleSound();
      else if (e.code === 'KeyZ') yawTarget -= 0.5;
      else if (e.code === 'KeyX') yawTarget += 0.5;
    });
    root.addEventListener('keyup', function (e) { if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = false; recompute(); } });
    root.addEventListener('blur', function () { keys = {}; stickX = stickY = 0; recompute(); });
    canvas.addEventListener('pointerdown', function (e) { if (e.button === 0 && modal === 'play') { A.unlock(); pressed.attack = true; } });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- menus ---------- */
    var H = {
      toggle: function (name) {
        if (modal === name) { H.close(); return; }
        if (modal !== 'play' && !/inventory|skills|menu|options|controls/.test(modal)) return;
        modal = name; refreshSheet(name);
      },
      close: function () { ui.hideSheet(); modal = 'play'; },
      toggleSound: function () { A.setMuted(!A.isMuted()); ui.setSoundLabel(A.isMuted()); },
      press: function (n) { if (modal === 'play') { A.unlock(); pressed[n] = true; } },
      stick: function (x, y) { stickX = x; stickY = y; recompute(); },
      next: function () { nextLine(); },
      save: function (n) { var ok = lsSet(SLOT_KEY + n, L.serialize(G)); ui.toast(ok ? 'Saved to slot ' + n + '.' : 'Saving is blocked in this browser.'); refreshSheet('menu'); },
      load: function (n) {
        var t = lsGet(SLOT_KEY + n), r = t ? L.parseSave(t) : null;
        if (!r || !r.ok) { ui.toast('Could not load slot ' + n + (r ? ': ' + r.error : '') + '.'); return; }
        ui.hideSheet(); applyState(r.state); modal = 'play'; ui.toast('Loaded slot ' + n + '.');
      },
      newGame: function () { ui.hideSheet(); applyState(L.newState(91717)); modal = 'play'; ui.toast('New game.'); },
      option: function (k, v) {
        options[k] = v; lsSet(OPT_KEY, JSON.stringify(options)); setDiff(); ui.applyOptions(options);
        if (k === 'reduced' && scene) scene.setReduced(v);
      }
    };
    function refreshSheet(name) {
      if (name === 'inventory') ui.inventory(P, L.ITEMS, function (i) { var r = L.useItem(P, i); ui.toast(r.msg); refreshSheet('inventory'); });
      else if (name === 'skills') ui.skills(P, L.SKILLS, function (id) { var r = L.learn(P, id); ui.toast(r.ok ? L.SKILLS[id].name + ' learned.' : r.why); refreshSheet('skills'); });
      else if (name === 'menu') ui.menu({ slots: slotInfo() });
      else if (name === 'options') ui.options(options);
      else if (name === 'controls') ui.controls();
    }

    /* ---------- boot ---------- */
    ui = UI.create(stage, H, L);
    ui.applyOptions(options); ui.setTouch(mobile); ui.setSoundLabel(false);
    var loop;
    import('/vendor/three.module.js').then(function (m) {
      THREE = m; scene = S3.create(THREE, canvas, { mobile: mobile, reducedMotion: options.reduced });
      var ro = new ResizeObserver(function () { var w = stage.clientWidth, h = stage.clientHeight; if (w > 0 && h > 0) scene.resize(w, h); }); ro.observe(stage);
      var w0 = stage.clientWidth, h0 = stage.clientHeight; if (w0 > 0 && h0 > 0) scene.resize(w0, h0);
      applyState(L.newState(91717), true);
      stage.setAttribute('data-og-ready', '1');
      showTitle();
      lastT = performance.now(); running = true;
      loop = function (now) {
        if (!running) return;
        var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
        if (modal === 'play') { acc += dt; while (acc >= STEP) { step(STEP); acc -= STEP; if (modal !== 'play') break; } } else acc = 0;
        frame(dt);
        root.requestAnimationFrame(loop);
      };
      root.requestAnimationFrame(loop);
    }).catch(function (err) { ui.toast('Could not start the 3-D engine.'); try { console.error(err); } catch (e) { /* ignore */ } });

    function showTitle() {
      modal = 'title'; var s = document.createElement('section'); s.className = 'og-sheet og-title'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'Myth of the Stones: Origins'); s.setAttribute('data-og-sheet', 'title');
      var h = document.createElement('h2'); h.className = 'og-h'; h.textContent = 'MYTH OF THE STONES: ORIGINS'; s.appendChild(h);
      var p = document.createElement('p'); p.className = 'og-lede'; p.textContent = 'Vertical Slice 0. A prototype of one valley, one quest and one boss. Nothing here is a finished game, and nothing is connected to payments or rewards.'; s.appendChild(p);
      var row = document.createElement('div'); row.className = 'og-col';
      function b(label, fn, cls) { var x = document.createElement('button'); x.type = 'button'; x.className = 'og-btn ' + (cls || ''); x.textContent = label; x.addEventListener('click', fn); row.appendChild(x); return x; }
      b('Begin', function () { A.unlock(); ui.hideSheet(); modal = 'play'; say([{ who: 'Auren', text: 'That note again. Nine point one seven one seven. It is coming from the north.' }]); }, 'og-big');
      var t = lsGet(AUTO_KEY); if (t) b('Continue from checkpoint', function () { var r = L.parseSave(t); if (r.ok) { A.unlock(); ui.hideSheet(); applyState(r.state); modal = 'play'; } else ui.toast('The checkpoint is damaged: ' + r.error); });
      b('Controls', function () { modal = 'controls'; ui.controls(); });
      s.appendChild(row);
      var layer = stage.querySelector('.og-layer'); layer.textContent = ''; layer.appendChild(s); layer.classList.remove('og-hide');
      var f = s.querySelector('button'); if (f) setTimeout(function () { f.focus(); }, 0);
    }
    var origToggle = H.toggle;
    H.toggle = function (n) { if (modal === 'controls' && n === 'menu') { showTitle(); return; } origToggle(n); };

    /* ---------- per-frame: draw and HUD ---------- */
    var fps = { n: 0, t: 0, v: 0 };
    function frame(dt) {
      yawNow += (yawTarget - yawNow) * Math.min(1, dt * 6);
      scene.update(dt, clock, { x: P.x, z: P.z, facing: R.facing, roll: R.roll, swing: R.swingT >= 0 ? Math.min(1, R.swingT / 0.38) : 0, speed: R.speed, weight: P.weight }, { yawTarget: yawTarget });
      scene.setProjectiles(projectiles);
      ui.hud(P, G.quest, L.skillPointsFree(P));
      var tg = target();
      var dx = tg.x - P.x, dz = tg.z - P.z;
      var sxv = dx * Math.cos(yawNow) - dz * Math.sin(yawNow), syv = -(dx * Math.sin(yawNow) + dz * Math.cos(yawNow));
      ui.objective(tg.text, tg.sub, Math.atan2(sxv, syv), G.quest.stage !== 'done' && Math.hypot(dx, dz) > 6);
      var ds = Math.hypot(P.x - S3.SHRINE.x, P.z - S3.SHRINE.z), c = scene.chestPos(), dc = Math.hypot(P.x - c.x, P.z - c.z);
      var pr = '';
      if (G.quest.stage === 'memory' && ds < 6) pr = 'Press F to read the stone';
      else if (!G.world.chest && dc < 3 && L.STAGES.indexOf(G.quest.stage) >= 2) pr = 'Press F to open the chest';
      ui.prompt(modal === 'play' ? pr : '');
      fps.n++; fps.t += dt; if (fps.t >= 1) { fps.v = fps.n / fps.t; fps.n = 0; fps.t = 0; }
    }

    /* ---------- test hook (only with ?test=1) ---------- */
    if (testMode) {
      var bot = false;
      root.__originsTest = {
        ready: function () { return !!scene && !!G; },
        begin: function () { if (modal === 'title') { A.setMuted(true); ui.hideSheet(); modal = 'play'; } },
        state: function () { return { modal: modal, stage: G.quest.stage, choice: G.quest.choice, hp: P.hp, hpMax: P.hpMax, level: P.level, xp: P.xp, weight: P.weight, x: P.x, z: P.z, enemies: aliveCount(), boss: bossRef ? bossRef.hp : null, inv: P.inv.filter(Boolean), skills: P.skills, rep: G.rep, ally: G.world.ally, playSeconds: G.playSeconds, fps: fps.v, scene: scene.info(), dead: R.dead }; },
        teleport: function (x, z) { P.x = x; P.z = z; },
        step: function (sec) { var n = Math.round(sec / STEP); for (var i = 0; i < n; i++) { if (bot) botThink(); if (modal === 'play') step(STEP); else if (bot) botModal(); } frame(STEP); },
        press: function (n) { pressed[n] = true; }, setInput: function (mx, mz) { inp.mx = mx; inp.mz = mz; },
        autoplay: function (on) { bot = on !== false; A.setMuted(true); },
        save: function (n) { H.save(n); }, load: function (n) { H.load(n); },
        corrupt: function (n) { var o = JSON.parse(lsGet(SLOT_KEY + n)); o.body = o.body.replace('"level":', '"level":9'); lsSet(SLOT_KEY + n, JSON.stringify(o)); },
        freeSkill: function () { return L.skillPointsFree(P); },
        learn: function (id) { return L.learn(P, id); },
        open: function (name) { H.toggle(name); }, close: function () { H.close(); },
        setOption: function (k, v) { H.option(k, v); },
        modalName: function () { return modal; }
      };
      var botCool = 0;
      var botModal = function () {
        if (modal === 'dialogue') nextLine();
        else if (modal === 'choice') stageEvent('choose_share');
        else if (modal === 'dead') respawn();
        else if (modal === 'done') { ui.hideSheet(); modal = 'play'; }
      };
      var botThink = function () {
        if (modal !== 'play') return;
        botCool -= STEP;
        if (L.skillPointsFree(P) > 0) { ['echo', 'foresight', 'steady', 'anchor'].some(function (id) { return L.learn(P, id).ok; }); }
        var tg = target(), near = nearestEnemy(60), dx, dz, d, wantAttack = false;
        if (P.hp < 38) { var hasS = L.countItem(P.inv, 'salve') > 0; if (hasS && botCool <= 0) { pressed.salve = true; botCool = 1; } }
        if (near && G.quest.stage !== 'hum') { dx = near.x - P.x; dz = near.z - P.z; d = Math.hypot(dx, dz); }
        else { dx = tg.x - P.x; dz = tg.z - P.z; d = Math.hypot(dx, dz); near = null; }
        var yaw = yawNow, mx = 0, mz = 0;
        if (G.quest.stage === 'memory' || G.quest.stage === 'done') { if (d < 3.5) { mx = 0; mz = 0; if (G.quest.stage === 'memory') pressed.interact = true; } else { mx = dx / d; mz = dz / d; } }
        else if (near) {
          var reach = near.type === 'boss' ? 3.6 : 2.2;
          if (near.state === 'windup' && near.timer < 0.3 && d < (near.type === 'boss' ? 6 : 3.2) && P.stamina >= 28) { pressed.dodge = true; }
          if (d > reach) { mx = dx / d; mz = dz / d; } else { wantAttack = true; }
          if (near.type === 'archer' && d > 2.2) { mx = dx / d; mz = dz / d; }
        } else if (d > 1) { mx = dx / d; mz = dz / d; }
        /* world -> input (inverse of the camera rotation) */
        inp.mx = Math.cos(yaw) * mx - Math.sin(yaw) * mz; inp.mz = Math.sin(yaw) * mx + Math.cos(yaw) * mz;
        if (wantAttack && P.stamina >= 8) pressed.attack = true;
        if (near && d < 5.5 && L.hasSkill(P, 'echo') && R.abilityCd <= 0 && enemies.length > 2) pressed.echo = true;
        if (!G.world.chest && L.STAGES.indexOf(G.quest.stage) >= 2 && G.quest.stage === 'memory') { var c = scene.chestPos(); if (Math.hypot(P.x - c.x, P.z - c.z) < 3) pressed.interact = true; }
      };
    }

    return { stop: function () { running = false; }, H: H };
  }

  root.OmegaOriginsGame = { start: start };
  /* the page supplies #og-stage and #og-canvas; start once they exist */
  function auto() { var st = document.getElementById('og-stage'), cv = document.getElementById('og-canvas'); if (st && cv && !st.getAttribute('data-og-started')) { st.setAttribute('data-og-started', '1'); start(st, cv); } }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto(); }
})(typeof window !== 'undefined' ? window : globalThis);
