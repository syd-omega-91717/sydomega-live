/* omega-galactic-logic.js -- the rules of LAST GALACTIC EMPIRE: SLICE 0 (a grand-strategy game, PROTOTYPE).
 *
 * Pure functions only: no DOM, no timers, no storage, no network, no Math.random. A campaign is (seed, list of seasonal actions); replaying the
 * same list gives the same campaign byte for byte, so a save is that list and a replay is a proof. All arithmetic is integer.
 *
 * THE IDEA (the franchise's question, written as a mechanic): the Empire was founded to stop endless war, and every law that keeps the
 * peace also hardens the institution that keeps it. You are the Court. Each season you may change ONE standing law of the Charter, give
 * fleet orders, set doctrines, reinforce, and answer grievances. Every standing law raises DRIFT by 2 a season and every unanswered grievance
 * by 1; at 100 the Court has become the thing it fought (an ending, not a score). You win by a STABLE PEACE (four quiet seasons with Drift
 * under 60 and both neighbours' trust at 60 or more) or by REFORM (dissolving the Court's own veto once the Reformers trust you).
 *
 * EVERY OUTCOME IS EXPLAINED. A battle is not rolled: it is the same arithmetic every time, strength x readiness x supply x doctrine x
 * home ground, and the resolver returns the breakdown. Every AI move is chosen by named goals and writes its reason to the log.
 * Chance appears in one place only, the seeded grievances that arise from your laws.
 *
 * Works as a browser global (window.OmegaGalacticLogic) and as a CommonJS module for node tests. Status: PROTOTYPE; not a release. */
(function (root) {
  'use strict';

  var SEASONS = 40, PEACE_NEED = 4, PEACE_TRUST = 60, PEACE_DRIFT = 60, HARD_DRIFT = 100, FLEET_COST = 6, FLEET_GAIN = 4, ANSWER_COST = 2, VETO_COST = 10, VETO_TRUST = 60, HOSTILE_BELOW = 40;
  var FACTIONS = ['C', 'R', 'I'];
  var ADAPT = { R: 70, I: 85 };   // percent chance, each season, that a faction notices and counters the defenders' current doctrine
  var FACTION_NAME = { C: 'The Court', R: 'The Reformers', I: 'The Independent Worlds' };
  var CAPITAL = { C: 0, R: 8, I: 13 };
  var DOCTRINES = ['assault', 'guard', 'screen'];
  var COUNTERS = { guard: 'assault', assault: 'screen', screen: 'guard' };   // key beats value: guard beats assault, assault beats screen, screen beats guard

  /* The map: 20 systems. The capital is not named in canon (open question), so it is shown as "The imperial capital". */
  var SYSTEMS = [
    { n: 'The imperial capital', x: 50, y: 30, o: 'C', v: 3 }, { n: 'Marrow Gate', x: 40, y: 22, o: 'C', v: 2 }, { n: 'Sable Reach', x: 60, y: 22, o: 'C', v: 2 },
    { n: 'Orrin', x: 44, y: 40, o: 'C', v: 2 }, { n: 'Veyra', x: 58, y: 40, o: 'C', v: 2 }, { n: 'Halcyon', x: 50, y: 14, o: 'C', v: 1 }, { n: 'Tessaly', x: 50, y: 48, o: 'C', v: 1 },
    { n: 'Lumen', x: 22, y: 20, o: 'R', v: 2 }, { n: 'Concord Rise', x: 14, y: 32, o: 'R', v: 3 }, { n: 'Aster', x: 24, y: 42, o: 'R', v: 1 }, { n: 'Brindle', x: 30, y: 30, o: 'R', v: 2 }, { n: 'Fenwick', x: 12, y: 14, o: 'R', v: 1 },
    { n: 'Kestrel Reach', x: 78, y: 18, o: 'I', v: 2 }, { n: 'Free Haven', x: 88, y: 30, o: 'I', v: 3 }, { n: 'Dunmore', x: 80, y: 42, o: 'I', v: 1 }, { n: 'Cinder', x: 70, y: 30, o: 'I', v: 2 },
    { n: 'Ostrava', x: 92, y: 12, o: 'I', v: 1 }, { n: 'Marlowe', x: 68, y: 52, o: 'I', v: 1 },
    { n: 'Quill', x: 34, y: 10, o: 'N', v: 1 }, { n: 'Vesper', x: 30, y: 54, o: 'N', v: 1 }
  ];
  var EDGES = (function () {
    var e = [], i, j;
    for (i = 0; i < SYSTEMS.length; i++) for (j = i + 1; j < SYSTEMS.length; j++) {
      var dx = SYSTEMS[i].x - SYSTEMS[j].x, dy = SYSTEMS[i].y - SYSTEMS[j].y;
      if (dx * dx + dy * dy <= 22 * 22) e.push([i, j]);
    }
    return e;
  })();
  var ADJ = (function () { var a = SYSTEMS.map(function () { return []; }); EDGES.forEach(function (p) { a[p[0]].push(p[1]); a[p[1]].push(p[0]); }); a.forEach(function (l) { l.sort(function (x, y) { return x - y; }); }); return a; })();

  /* The Charter: standing laws. Each trades something for something; each also costs Drift (2 a season) just by standing. */
  var LAWS = [
    { id: 'levy', name: 'Martial Levy', kind: 'order', tre: 3, tr: { R: -2, I: -2 }, note: '+3 treasury a season; both neighbours lose trust' },
    { id: 'courts', name: 'Imperial Courts', kind: 'order', tre: 0, ready: 5, tr: { R: -2, I: 0 }, note: 'fleets in supply gain 5 more readiness a season; the Reformers lose trust' },
    { id: 'tithe', name: 'Grain Tithe', kind: 'order', tre: 2, tr: { R: 0, I: -3 }, note: '+2 treasury a season; the Independent Worlds lose trust' },
    { id: 'registry', name: 'Open Registry', kind: 'freedom', tre: -1, tr: { R: 3, I: 0 }, note: 'the fleet register is public: -1 treasury; the Reformers gain trust' },
    { id: 'charter', name: 'Free Worlds Charter', kind: 'freedom', tre: -2, tr: { R: 0, I: 3 }, note: '-2 treasury; the Independent Worlds gain trust' }
  ];

  /* ---------- the generator (same family as the other Slice 0 games) */
  function splitmix32(a) { return function () { a = (a + 0x9e3779b9) | 0; var t = a ^ (a >>> 16); t = Math.imul(t, 0x21f0aaad); t ^= t >>> 15; t = Math.imul(t, 0x735a2d97); t ^= t >>> 15; return t | 0; }; }
  function rotl(x, k) { return (x << k) | (x >>> (32 - k)); }
  function rng(seed) {
    var sm = splitmix32(seed | 0), s0 = sm(), s1 = sm(), s2 = sm(), s3 = sm();
    function u32() { var r = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0, t = s1 << 9; s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 11); return r; }
    return { u32: u32, below: function (n) { return u32() % n; } };
  }
  function seasonStream(seed, season) { return rng((seed ^ Math.imul(season + 1, 0x9e3779b1) ^ 0x5bd1e995) | 0); }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lawOn(g, id) { return !!g.laws[id]; }
  function activeLaws(g) { return LAWS.filter(function (l) { return g.laws[l.id]; }); }
  function copy(g) { return JSON.parse(JSON.stringify(g)); }
  function name(i) { return SYSTEMS[i].n; }

  function newGame(seed) {
    var fl = [], id = 1;
    function add(f, at, str, doc) { fl.push({ id: id++, f: f, at: at, str: str, ready: 100, doc: doc }); }
    add('C', 0, 12, 'guard'); add('C', 1, 8, 'guard'); add('C', 2, 8, 'guard');
    add('R', 8, 10, 'guard'); add('R', 10, 6, 'guard');
    add('I', 13, 9, 'guard'); add('I', 15, 7, 'guard'); add('I', 14, 5, 'guard');
    return { seed: seed >>> 0, season: 0, owner: SYSTEMS.map(function (s) { return s.o; }), fleets: fl, nextId: id, treasury: { C: 2, R: 6, I: 12 }, trust: { R: 40, I: 30 },
      laws: {}, drift: 20, grievances: [], peace: 0, battles: 0, log: [], plan: [], history: [], over: false, ending: null, won: false, veto: false };
  }

  /* ---------- supply and distance */
  /* A system is in a faction's supply if it is connected to that faction's capital through systems that faction owns. */
  function supplySet(g, f) {
    var seen = {}, q = [], i;
    if (g.owner[CAPITAL[f]] !== f) return seen;
    seen[CAPITAL[f]] = true; q.push(CAPITAL[f]);
    while (q.length) { var c = q.shift(); for (i = 0; i < ADJ[c].length; i++) { var n = ADJ[c][i]; if (!seen[n] && g.owner[n] === f) { seen[n] = true; q.push(n); } } }
    return seen;
  }
  /* Breadth-first distance from a system to the nearest system satisfying pred; returns { id, dist, next } with next the first step. */
  function nearest(from, pred) {
    var prev = {}, dist = {}, q = [from], i;
    dist[from] = 0;
    while (q.length) {
      var c = q.shift();
      if (c !== from && pred(c)) { var s = c; while (prev[s] !== from) s = prev[s]; return { id: c, dist: dist[c], next: s }; }
      for (i = 0; i < ADJ[c].length; i++) { var n = ADJ[c][i]; if (dist[n] === undefined) { dist[n] = dist[c] + 1; prev[n] = c; q.push(n); } }
    }
    return null;
  }

  /* ---------- the battle resolver: the same arithmetic every time. Power is in tenths. */
  function fleetPower(fl, supplied, enemyDoc, home) {
    var supply = supplied ? 100 : 70, doc = COUNTERS[fl.doc] === enemyDoc ? 125 : (COUNTERS[enemyDoc] === fl.doc ? 80 : 100), def = home ? 120 : 100;
    return Math.floor(fl.str * fl.ready * supply * doc * def / 1e7);
  }
  function dominantDoctrine(fleets) {
    var best = null; fleets.forEach(function (f) { if (!best || f.str > best.str) best = f; }); return best ? best.doc : 'guard';
  }
  /* sideA, sideB: { f, fleets:[{id,str,ready,doc}], supplied, home } . Returns the winner, both powers, the breakdown and the losses. Pure. */
  function resolveBattle(a, b) {
    var da = dominantDoctrine(a.fleets), db = dominantDoctrine(b.fleets), pa = 0, pb = 0, lines = [];
    a.fleets.forEach(function (f) { var p = fleetPower(f, a.supplied, db, a.home); pa += p; lines.push(FACTION_NAME[a.f] + ' fleet ' + f.id + ': strength ' + f.str + ' x readiness ' + f.ready + '% x supply ' + (a.supplied ? 100 : 70) + '% x doctrine ' + (COUNTERS[f.doc] === db ? 125 : (COUNTERS[db] === f.doc ? 80 : 100)) + '% x home ' + (a.home ? 120 : 100) + '% = ' + (p / 10).toFixed(1)); });
    b.fleets.forEach(function (f) { var p = fleetPower(f, b.supplied, da, b.home); pb += p; lines.push(FACTION_NAME[b.f] + ' fleet ' + f.id + ': strength ' + f.str + ' x readiness ' + f.ready + '% x supply ' + (b.supplied ? 100 : 70) + '% x doctrine ' + (COUNTERS[f.doc] === da ? 125 : (COUNTERS[da] === f.doc ? 80 : 100)) + '% x home ' + (b.home ? 120 : 100) + '% = ' + (p / 10).toFixed(1)); });
    var aWins = pa > pb || (pa === pb && a.home) || (pa === pb && !b.home && a.f < b.f), w = aWins ? a : b, l = aWins ? b : a, pw = aWins ? pa : pb, pl = aWins ? pb : pa;
    var r = pw + pl === 0 ? 50 : Math.floor(pw * 100 / (pw + pl));     // the winner's share of the combined power, in percent
    var loss = {}; l.fleets.forEach(function (f) { loss[f.id] = Math.min(f.str, Math.ceil(f.str * r / 100)); }); w.fleets.forEach(function (f) { loss[f.id] = Math.floor(f.str * (100 - r) / 200); });
    return { winner: w.f, loser: l.f, powers: aWins ? { w: pa, l: pb } : { w: pb, l: pa }, share: r, losses: loss, lines: lines };
  }

  function battleAt(g, sys, factionsHere, stateLog) {
    var supply = {}; FACTIONS.forEach(function (f) { supply[f] = supplySet(g, f); });
    function side(f) { return { f: f, fleets: g.fleets.filter(function (x) { return x.at === sys && x.f === f; }), supplied: !!supply[f][sys], home: g.owner[sys] === f }; }
    var sides = factionsHere.map(side);
    var pw = {}; sides.forEach(function (s) { pw[s.f] = 0; });
    sides.forEach(function (s) { var enemyDoc = dominantDoctrine(sides.filter(function (o) { return o !== s; })[0].fleets); s.fleets.forEach(function (f) { pw[s.f] += fleetPower(f, s.supplied, enemyDoc, s.home); }); });
    sides.sort(function (x, y) { return pw[y.f] - pw[x.f] || (y.home ? 1 : 0) - (x.home ? 1 : 0) || (x.f < y.f ? -1 : 1); });
    var champ = sides[0], i;
    for (i = 1; i < sides.length; i++) {
      var foe = sides[i], liveChamp = { f: champ.f, fleets: g.fleets.filter(function (x) { return x.at === sys && x.f === champ.f && x.str > 0; }), supplied: champ.supplied, home: champ.home };
      var liveFoe = { f: foe.f, fleets: g.fleets.filter(function (x) { return x.at === sys && x.f === foe.f && x.str > 0; }), supplied: foe.supplied, home: foe.home };
      if (!liveChamp.fleets.length || !liveFoe.fleets.length) continue;
      var r = resolveBattle(liveChamp, liveFoe);
      stateLog.push('BATTLE at ' + name(sys) + ': ' + FACTION_NAME[r.winner] + ' beat ' + FACTION_NAME[r.loser] + ' (' + (r.powers.w / 10).toFixed(1) + ' against ' + (r.powers.l / 10).toFixed(1) + ', winner share ' + r.share + '%).');
      r.lines.forEach(function (ln) { stateLog.push('   ' + ln); });
      g.fleets.forEach(function (f) { if (r.losses[f.id] !== undefined) f.str -= r.losses[f.id]; });
      var loserF = r.loser;
      // the loser retreats: survivors go to the lowest-numbered neighbour that is theirs, else one without other fleets; if none, they are lost
      g.fleets.filter(function (x) { return x.at === sys && x.f === loserF && x.str > 0; }).forEach(function (f) {
        var dest = null, n;
        for (n = 0; n < ADJ[sys].length && dest === null; n++) if (g.owner[ADJ[sys][n]] === loserF && !g.fleets.some(function (o) { return o.at === ADJ[sys][n] && o.f !== loserF && o.str > 0; })) dest = ADJ[sys][n];
        for (n = 0; n < ADJ[sys].length && dest === null; n++) if (!g.fleets.some(function (o) { return o.at === ADJ[sys][n] && o.f !== loserF && o.str > 0; })) dest = ADJ[sys][n];
        if (dest === null) { f.str = 0; stateLog.push('   fleet ' + f.id + ' has nowhere to retreat and is lost.'); } else { f.at = dest; stateLog.push('   fleet ' + f.id + ' retreats to ' + name(dest) + '.'); }
      });
    }
    g.fleets = g.fleets.filter(function (x) { return x.str > 0; });
  }

  /* ---------- the AI: named goals, one reason per move */
  /* adapt: whether this faction notices and counters the defenders' current doctrine this season (decided by the seeded stream, shown in the log);
     when it does not, it repeats the doctrine its fleet was already on. */
  function aiOrders(g, f, adapt) {
    if (adapt === undefined) adapt = true;
    var out = [], sup = supplySet(g, f), hostile = g.trust[f] < HOSTILE_BELOW;
    g.fleets.filter(function (x) { return x.f === f; }).forEach(function (fl) {
      var tgt, reason = null, to = null, cap = CAPITAL[f];
      var threat = ADJ[cap].some(function (n) { return g.fleets.some(function (o) { return o.at === n && o.f === 'C'; }); }) && fl.at !== cap && g.owner[cap] === f;
      if (threat) { var back = nearest(fl.at, function (c) { return c === cap; }); if (back) { to = back.next; reason = 'the Court has a fleet beside our capital: falling back to defend it'; } }
      else if (!sup[fl.at] && fl.ready < 50) { var home = nearest(fl.at, function (c) { return sup[c]; }); if (home) { to = home.next; reason = 'readiness ' + fl.ready + '% and out of supply: returning to supply'; } }
      else if (hostile && fl.str >= 6) {
        tgt = nearest(fl.at, function (c) { return g.owner[c] === 'C'; });
        if (tgt) { to = tgt.next; reason = 'trust in the Court is ' + g.trust[f] + ' (below ' + HOSTILE_BELOW + '): advancing on ' + name(tgt.id) + ', ' + tgt.dist + ' jump' + (tgt.dist > 1 ? 's' : '') + ' away'; }
      }
      if (to === null && !hostile) {
        tgt = nearest(fl.at, function (c) { return g.owner[c] === 'N' && !g.fleets.some(function (o) { return o.at === c; }); });
        if (tgt && tgt.dist <= 4) { to = tgt.next; reason = 'trust is ' + g.trust[f] + ': claiming the unclaimed system ' + name(tgt.id); }
      }
      if (to === null) reason = hostile && fl.str < 6 ? 'too weak to advance (strength ' + fl.str + '): holding' : 'no goal: holding at ' + name(fl.at);
      if (to !== null && to !== fl.at) out.push({ fleet: fl.id, to: to, reason: reason, f: f }); else out.push({ fleet: fl.id, to: fl.at, reason: reason, f: f });
      if (to !== null && to !== fl.at && g.owner[to] === 'C') {
        var defDoc = dominantDoctrine(g.fleets.filter(function (o) { return o.at === to && o.f === 'C'; })), mine = DOCTRINES.filter(function (d) { return COUNTERS[d] === defDoc; })[0];
        if (g.fleets.some(function (o) { return o.at === to && o.f === 'C'; })) {
          if (adapt) { out[out.length - 1].doc = mine; out[out.length - 1].reason += '; the defenders are on ' + defDoc + ', so ' + mine; }
          else { out[out.length - 1].doc = fl.doc; out[out.length - 1].reason += '; it did not adapt to the defenders\' ' + defDoc + ' and stays on ' + fl.doc; }
        }
        else out[out.length - 1].doc = 'assault';
      }
    });
    return out;
  }

  function validateAction(g, act) {
    if (!act || typeof act !== 'object') return 'No action.';
    if (act.decree) {
      if (act.decree === 'veto') { if (g.trust.R < VETO_TRUST || g.treasury.C < VETO_COST) return 'The Reformers must trust the Court (' + VETO_TRUST + ') and the treasury must hold ' + VETO_COST + ' to dissolve the veto.'; }
      else if (!LAWS.some(function (l) { return l.id === act.decree; })) return 'Unknown law.';
    }
    var cost = 0, ids = {};
    (act.orders || []).forEach(function (o) { ids[o.fleet] = (ids[o.fleet] || 0) + 1; });
    for (var k in ids) if (ids[k] > 1) return 'A fleet can take one order a season.';
    var bad = null;
    (act.orders || []).forEach(function (o) {
      var fl = g.fleets.filter(function (x) { return x.id === o.fleet && x.f === 'C'; })[0];
      if (!fl) bad = 'You can only order your own fleets.'; else if (o.to !== fl.at && ADJ[fl.at].indexOf(o.to) < 0) bad = 'A fleet moves one jump a season.';
    });
    if (bad) return bad;
    (act.doctrines || []).forEach(function (d) { var fl = g.fleets.filter(function (x) { return x.id === d.fleet && x.f === 'C'; })[0]; if (!fl || DOCTRINES.indexOf(d.doc) < 0) bad = 'Bad doctrine order.'; });
    if (bad) return bad;
    (act.reinforce || []).forEach(function (id) { var fl = g.fleets.filter(function (x) { return x.id === id && x.f === 'C'; })[0]; if (!fl || g.owner[fl.at] !== 'C') bad = 'Reinforce a fleet that is at a Court system.'; cost += FLEET_COST; });
    if (bad) return bad;
    cost += (act.answer || 0) * ANSWER_COST + (act.decree === 'veto' ? VETO_COST : 0);
    if (act.answer && (act.answer < 0 || act.answer !== Math.floor(act.answer) || act.answer > g.grievances.length)) return 'There are not that many open grievances.';
    if (cost > g.treasury.C) return 'The treasury holds ' + g.treasury.C + ' and this costs ' + cost + '.';
    return null;
  }

  /* One season. Returns { game } or { error }. */
  function applySeason(g0, act) {
    if (g0.over) return { error: 'The campaign is over.' };
    var err = validateAction(g0, act); if (err) return { error: err };
    var g = copy(g0), log = [], i, s = g.season;
    log.push('SEASON ' + (s + 1));
    // 1. the Court's decisions
    if (act.decree === 'veto') { g.treasury.C -= VETO_COST; g.veto = true; log.push('The Court dissolves its own veto. The Reformers trust it (' + g.trust.R + ').'); }
    else if (act.decree) { g.laws[act.decree] = !g.laws[act.decree]; log.push((g.laws[act.decree] ? 'Enacted: ' : 'Repealed: ') + LAWS.filter(function (l) { return l.id === act.decree; })[0].name + '.'); }
    (act.doctrines || []).forEach(function (d) { g.fleets.filter(function (x) { return x.id === d.fleet; })[0].doc = d.doc; });
    (act.reinforce || []).forEach(function (id) { var fl = g.fleets.filter(function (x) { return x.id === id; })[0]; fl.str += FLEET_GAIN; g.treasury.C -= FLEET_COST; log.push('Fleet ' + id + ' reinforced to strength ' + fl.str + '.'); });
    for (i = 0; i < (act.answer || 0); i++) { var gr = g.grievances.shift(); g.treasury.C -= ANSWER_COST; g.trust[gr.f] = clamp(g.trust[gr.f] + 2, 0, 100); log.push('Answered a grievance from ' + FACTION_NAME[gr.f] + ' (trust ' + g.trust[gr.f] + ').'); }
    if (g.veto) { return finalise(g, log, 'reform', true, act); }
    // 2. orders: the Court's, then each AI's with its reason
    var orders = (act.orders || []).map(function (o) { return { fleet: o.fleet, to: o.to, f: 'C' }; });
    // the AI commits its orders from the board as it stood at the start of the season (it cannot see what the Court decides this season)
    var pre = copy(g0), ast = rng((g.seed ^ Math.imul(s + 1, 0x27d4eb2f) ^ 0xa11) | 0), adapt = { R: ast.below(100) < ADAPT.R, I: ast.below(100) < ADAPT.I };
    ['R', 'I'].forEach(function (f) { aiOrders(pre, f, adapt[f]).forEach(function (o) {
      orders.push(o); var fl = g.fleets.filter(function (x) { return x.id === o.fleet; })[0]; if (!fl) return;
      fl.doc = o.doc || 'guard';
      if (o.to !== fl.at) log.push(FACTION_NAME[f] + ', fleet ' + o.fleet + ' to ' + name(o.to) + ': ' + o.reason + '.');
    }); });
    orders.forEach(function (o) { var fl = g.fleets.filter(function (x) { return x.id === o.fleet; })[0]; if (fl) { if (o.f === 'C' && o.to !== fl.at) log.push('The Court: fleet ' + fl.id + ' to ' + name(o.to) + '.'); fl.at = o.to; } });
    // 3. battles, in system order
    var fought = 0;
    for (i = 0; i < SYSTEMS.length; i++) {
      var here = FACTIONS.filter(function (f) { return g.fleets.some(function (x) { return x.at === i && x.f === f; }); });
      if (here.length > 1) { fought++; battleAt(g, i, here, log); }
    }
    // 4. capture: a system holding only another faction's fleets changes hands
    for (i = 0; i < SYSTEMS.length; i++) {
      var occ = FACTIONS.filter(function (f) { return g.fleets.some(function (x) { return x.at === i && x.f === f; }); });
      if (occ.length === 1 && g.owner[i] !== occ[0]) { log.push(FACTION_NAME[occ[0]] + ' takes ' + name(i) + (g.owner[i] === 'N' ? ' (unclaimed).' : ' from ' + FACTION_NAME[g.owner[i]] + '.')); g.owner[i] = occ[0]; }
    }
    // 5. supply and readiness
    var courts = lawOn(g, 'courts') ? 5 : 0;
    FACTIONS.forEach(function (f) { var sup = supplySet(g, f); g.fleets.forEach(function (fl) { if (fl.f !== f) return; if (sup[fl.at]) fl.ready = clamp(fl.ready + 10 + (f === 'C' ? courts : 0), 10, 100); else fl.ready = clamp(fl.ready - 10, 10, 100); }); });
    // 6. income; the AI factions spend on their weakest fleet
    FACTIONS.forEach(function (f) { var inc = 0; for (i = 0; i < SYSTEMS.length; i++) if (g.owner[i] === f) inc += SYSTEMS[i].v; if (f === 'C') activeLaws(g).forEach(function (l) { inc += l.tre; }); g.treasury[f] += Math.max(0, inc) - (f === 'C' && inc < 0 ? -inc : 0); });
    ['R', 'I'].forEach(function (f) { while (g.treasury[f] >= FLEET_COST) { var mine = g.fleets.filter(function (x) { return x.f === f && g.owner[x.at] === f; }).sort(function (a, b) { return a.str - b.str || a.id - b.id; })[0]; if (!mine) break; mine.str += FLEET_GAIN; g.treasury[f] -= FLEET_COST; } });
    // 7. grievances arise from the Court's laws (the only chance in the game), then trust moves
    var st = seasonStream(g.seed, s), nLaws = activeLaws(g).length;
    if (st.below(1000) < 150 + 50 * nLaws) { var who = st.below(2) ? 'R' : 'I'; g.grievances.push({ f: who, season: s + 1 }); log.push('A grievance is filed by ' + FACTION_NAME[who] + '.'); }
    ['R', 'I'].forEach(function (f) { var d = 0; activeLaws(g).forEach(function (l) { d += l.tr[f]; }); d -= 2 * g.grievances.filter(function (x) { return x.f === f; }).length; g.trust[f] = clamp(g.trust[f] + d, 0, 100); });
    // 8. Drift
    var dd = 2 * nLaws + g.grievances.length - 1; g.drift = clamp(g.drift + dd, 0, 100);
    log.push('Drift ' + (dd >= 0 ? '+' : '') + dd + ' (' + nLaws + ' standing law' + (nLaws === 1 ? '' : 's') + ' x 2, ' + g.grievances.length + ' open grievance' + (g.grievances.length === 1 ? '' : 's') + ', -1 relief) = ' + g.drift + '.');
    g.battles = fought; g.peace = fought ? 0 : g.peace + 1;
    var ending = null, won = false;
    if (g.owner[0] !== 'C') ending = 'capital-lost';
    else if (g.drift >= HARD_DRIFT) ending = 'hardened';
    else if (g.peace >= PEACE_NEED && g.drift < PEACE_DRIFT && g.trust.R >= PEACE_TRUST && g.trust.I >= PEACE_TRUST) { ending = 'stable-peace'; won = true; }
    else if (s + 1 >= SEASONS) ending = 'unresolved';
    return finalise(g, log, ending, won, act);
  }
  function finalise(g, log, ending, won, act) {
    g.season++; g.plan.push(act); g.log = log.concat(g.log).slice(0, 400);
    g.history.push({ season: g.season, laws: activeLaws(g).length, open: g.grievances.length, drift: g.drift, trustR: g.trust.R, trustI: g.trust.I, treasury: g.treasury.C, owned: g.owner.filter(function (o) { return o === 'C'; }).length });
    if (ending) { g.over = true; g.ending = ending; g.won = won; }
    return { game: g, log: log };
  }

  function replay(seed, actions) { var g = newGame(seed), i; for (i = 0; i < actions.length; i++) { var r = applySeason(g, actions[i]); if (r.error) return { game: g, error: r.error, at: i }; g = r.game; } return { game: g }; }
  function checksum(seed, actions) {
    var s = seed + ':' + JSON.stringify(actions), h = 0x811c9dc5, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16);
  }

  /* ---------- scripted players */
  /* A sensible Court: answer grievances, hold the frontier on guard, keep the Independent and Reformer trust up with the two freedom laws, reinforce. */
  function bot(g) {
    var act = { decree: null, orders: [], doctrines: [], reinforce: [], answer: 0 }, budget = g.treasury.C;
    if (g.season === 0 && !g.laws.charter) act.decree = 'charter';
    else if (g.season === 6 && !g.laws.registry) act.decree = 'registry';
    else if (g.drift >= 50 && g.laws.registry && g.season > 14) act.decree = 'registry';          // repeal one law to cool the Drift
    g.fleets.filter(function (f) { return f.f === 'C'; }).forEach(function (f) {      // the AI plans against the doctrine we are on now: pick the one that beats its answer
      var ai = DOCTRINES.filter(function (d) { return COUNTERS[d] === f.doc; })[0], me = DOCTRINES.filter(function (d) { return COUNTERS[d] === ai; })[0]; act.doctrines.push({ fleet: f.id, doc: me });
    });
    var n = Math.min(g.grievances.length, Math.floor(budget / ANSWER_COST)); act.answer = n; budget -= n * ANSWER_COST;
    g.fleets.filter(function (f) { return f.f === 'C'; }).sort(function (a, b) { return a.str - b.str || a.id - b.id; }).forEach(function (f) { if (budget >= FLEET_COST && g.owner[f.at] === 'C') { act.reinforce.push(f.id); budget -= FLEET_COST; } });
    return act;
  }
  /* The same Court that never touches a doctrine. */
  function naive(g) { var a = bot(g); a.doctrines = []; return a; }
  /* The Advisor: what a careful staff officer would tell the Court, with the reasoning and how far to trust it. Pure; the action is the scripted Court's. */
  function advise(g) {
    var lines = [], act = bot(g), ai, me;
    g.fleets.filter(function (f) { return f.f === 'C'; }).forEach(function (f) {
      ai = DOCTRINES.filter(function (d) { return COUNTERS[d] === f.doc; })[0]; me = DOCTRINES.filter(function (d) { return COUNTERS[d] === ai; })[0];
      lines.push('Fleet ' + f.id + ' is on ' + f.doc + '. An enemy that adapts will pick ' + ai + ' (' + ai + ' beats ' + f.doc + '), so be on ' + me + ' (' + me + ' beats ' + ai + ').');
    });
    lines.push('The Independent Worlds adapt about ' + ADAPT.I + '% of seasons and the Reformers about ' + ADAPT.R + '%. When they do not, they repeat their last doctrine, so this advice is a good bet, not a promise.');
    if (g.grievances.length) lines.push('Answer ' + act.answer + ' open grievance' + (act.answer === 1 ? '' : 's') + ': each left open costs 1 Drift and 2 trust a season.');
    if (act.decree) lines.push('Change the Charter: ' + (g.laws[act.decree] ? 'repeal ' : 'enact ') + LAWS.filter(function (l) { return l.id === act.decree; })[0].name + '.');
    if (act.reinforce.length) lines.push('Reinforce fleet' + (act.reinforce.length === 1 ? ' ' : 's ') + act.reinforce.join(', ') + ' (' + FLEET_COST + ' each).');
    return { lines: lines, action: act };
  }
  function idle(g) { return { decree: null, orders: [], doctrines: [], reinforce: [], answer: 0 }; }
  function play(seed, chooser) { var g = newGame(seed), r; while (!g.over) { r = applySeason(g, chooser(g)); if (r.error) throw new Error(r.error); g = r.game; } return g; }

  var api = { SEASONS: SEASONS, PEACE_NEED: PEACE_NEED, PEACE_TRUST: PEACE_TRUST, PEACE_DRIFT: PEACE_DRIFT, HARD_DRIFT: HARD_DRIFT, FLEET_COST: FLEET_COST, FLEET_GAIN: FLEET_GAIN, ANSWER_COST: ANSWER_COST, VETO_COST: VETO_COST, VETO_TRUST: VETO_TRUST,
    HOSTILE_BELOW: HOSTILE_BELOW, ADAPT: ADAPT, FACTIONS: FACTIONS, FACTION_NAME: FACTION_NAME, CAPITAL: CAPITAL, DOCTRINES: DOCTRINES, COUNTERS: COUNTERS, SYSTEMS: SYSTEMS, EDGES: EDGES, ADJ: ADJ, LAWS: LAWS,
    rng: rng, newGame: newGame, supplySet: supplySet, nearest: nearest, fleetPower: fleetPower, resolveBattle: resolveBattle, aiOrders: aiOrders, validateAction: validateAction,
    applySeason: applySeason, replay: replay, checksum: checksum, bot: bot, advise: advise, naive: naive, idle: idle, play: play };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaGalacticLogic = api;
})(typeof window !== 'undefined' ? window : this);
