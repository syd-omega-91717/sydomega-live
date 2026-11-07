/* omega-civ-logic.js -- the rules of OMEGA: CIVILIZATION 91717, SLICE 0 (a strategy simulation, PROTOTYPE).
 *
 * Pure functions only: no DOM, no timers, no storage, no network, no Math.random. A game is (seed, list of yearly actions); replaying the
 * same list gives the same twelve years, byte for byte, so a save is just that list and a replay is a proof. Everything is integer
 * arithmetic (probabilities are per-mille) on a seeded 32-bit generator (xoshiro128**, seeded through splitmix32).
 *
 * THE IDEA (the franchise's question, written as a mechanic): ORION forecasts, and a forecast is a claim, not a fact. Its forecast is not
 * scripted: it runs the very same year-step on N copies of the world with different seeds, holds your current plan, and reports how often
 * each bad event happened. Its stated odds are therefore honest by construction, and the game proves it by scoring every forecast it made
 * once the years it covered have passed (a Brier score, plus a reliability table). Its *ends* are ambiguous; its numbers are not.
 *
 * One turn is one year. Four resources (0..100): Energy, Knowledge, Trust, Biosphere. Each year you spread POINTS effort points over four
 * activities, may switch ONE of six standing policies on or off, and may ask ORION for a forecast of the next years (it covers
 * min(HORIZON, years left), so every forecast is scored before the game ends). You win by reaching year 12 with Biosphere and Trust both
 * at or above THRESHOLD; either falling to 0 ends it at once. VERIFY: an audit of the forecast (it needs a forecast that year) costs
 * AUDIT_COST Trust and is how the player earns the full picture (the spread of outcomes), not just the odds.
 *
 * Works as a browser global (window.OmegaCivLogic) and as a CommonJS module for node tests. Status: PROTOTYPE; not a release. */
(function (root) {
  'use strict';

  var YEARS = 12, HORIZON = 3, ENSEMBLE = 200, POINTS = 6, THRESHOLD = 50, AUDIT_COST = 3;
  var RES = ['energy', 'knowledge', 'trust', 'biosphere'];
  var START = { energy: 50, knowledge: 30, trust: 60, biosphere: 70 };

  /* What one point of effort does each year. */
  var ACTIVITIES = [
    { id: 'industry', name: 'Industry', d: { energy: 6, biosphere: -2 } },
    { id: 'research', name: 'Research', d: { knowledge: 4, energy: -1 } },
    { id: 'outreach', name: 'Outreach', d: { trust: 3 } },
    { id: 'restoration', name: 'Restoration', d: { biosphere: 3, energy: -1 } }
  ];
  /* Standing policies: they keep working after you stop attending to them, for good and ill. */
  var POLICIES = [
    { id: 'levy', name: 'Carbon Levy', d: { biosphere: 2, energy: -2, trust: -1 } },
    { id: 'data', name: 'Open Data', d: { trust: 2, knowledge: 1 } },
    { id: 'reserve', name: 'Emergency Reserve', d: { energy: -1 }, note: 'halves the Energy and Trust lost to a grid failure' },
    { id: 'assembly', name: 'Citizen Assembly', d: { trust: 1, energy: -1 }, note: 'halves the Trust lost to unrest' },
    { id: 'grants', name: 'Research Grants', d: { knowledge: 3, energy: -2 } },
    { id: 'corridors', name: 'Rewilding Corridors', d: { biosphere: 3, energy: -1, trust: -1 } }
  ];
  /* The yearly pressure of simply being a civilization. */
  var DRIFT = { energy: -6, knowledge: -1, trust: -3, biosphere: -3 };
  var TECH_AT = 50;   // with this much Knowledge, each point of Industry, Outreach and Restoration does one more of its main effect
  var EVENTS = ['grid_failure', 'drought', 'unrest', 'breakthrough'];
  var BAD = ['grid_failure', 'drought', 'unrest'];
  var EVENT_NAME = { grid_failure: 'Grid failure', drought: 'Drought', unrest: 'Unrest', breakthrough: 'Breakthrough' };

  /* ---------- the generator */
  function splitmix32(a) {
    return function () {
      a = (a + 0x9e3779b9) | 0; var t = a ^ (a >>> 16);
      t = Math.imul(t, 0x21f0aaad); t ^= t >>> 15; t = Math.imul(t, 0x735a2d97); t ^= t >>> 15; return t | 0;
    };
  }
  function rotl(x, k) { return (x << k) | (x >>> (32 - k)); }
  function rng(seed) {
    var sm = splitmix32(seed | 0), s0 = sm(), s1 = sm(), s2 = sm(), s3 = sm();
    function u32() {
      var r = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0, t = s1 << 9;
      s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 11);
      return r;
    }
    return { u32: u32, below: function (n) { return u32() % n; } };
  }
  /* One independent stream per (seed, tag, member, year). tag 0 is the real world; tag 1 is ORION's imagined copies. */
  function streamSeed(seed, tag, k, year) {
    return (seed ^ Math.imul(year + 1, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca6b) ^ Math.imul(tag + 1, 0xc2b2ae35)) | 0;
  }

  function clamp(v) { return v < 0 ? 0 : v > 100 ? 100 : v; }
  function activeList(policies) { return POLICIES.filter(function (p) { return policies[p.id]; }); }

  /* The year's pushes before chance: allocation, standing policies, drift. Returns new resources; never mutates. */
  function afterPlan(res, policies, alloc) {
    var o = {}, i, k;
    RES.forEach(function (r) { o[r] = res[r] + DRIFT[r]; });
    var tech = res.knowledge >= TECH_AT ? 1 : 0, main = { 0: 'energy', 2: 'trust', 3: 'biosphere' };
    for (i = 0; i < ACTIVITIES.length; i++) {
      for (k in ACTIVITIES[i].d) o[k] += ACTIVITIES[i].d[k] * alloc[i];
      if (tech && main[i]) o[main[i]] += alloc[i];
    }
    activeList(policies).forEach(function (p) { for (k in p.d) o[k] += p.d[k]; });
    RES.forEach(function (r) { o[r] = clamp(o[r]); });
    return o;
  }
  /* Per-mille chance of each event given the world after the plan. This is the ground truth the ensemble is checked against. */
  function eventProbs(o) {
    function cap(v, hi) { return v > hi ? hi : v < 0 ? 0 : v; }
    return {
      grid_failure: cap(30 + 22 * Math.max(0, 60 - o.energy), 900),
      drought: cap(30 + 18 * Math.max(0, 65 - o.biosphere), 900),
      unrest: cap(20 + 22 * Math.max(0, 55 - o.trust), 900),
      breakthrough: cap(40 + 5 * o.knowledge, 600)
    };
  }
  /* Resolve chance for one year. Draw order is fixed (event roll, then region if it fires) so a stream is reproducible. */
  function rollEvents(o, policies, stream) {
    var pr = eventProbs(o), hit = [], regions = {};
    var res = { energy: o.energy, knowledge: o.knowledge, trust: o.trust, biosphere: o.biosphere };
    EVENTS.forEach(function (e) {
      if (stream.below(1000) >= pr[e]) return;
      hit.push(e); regions[e] = stream.below(5);
      if (e === 'grid_failure') { var f = policies.reserve ? 2 : 1; res.energy -= 12 / f; res.trust -= 8 / f; }
      else if (e === 'drought') { res.biosphere -= 10; res.trust -= 6; }
      else if (e === 'unrest') { res.trust -= policies.assembly ? 6 : 12; res.energy -= 5; }
      else { res.knowledge += 8; res.energy += 5; }
    });
    RES.forEach(function (r) { res[r] = clamp(Math.round(res[r])); });
    return { res: res, hit: hit, regions: regions };
  }

  /* ---------- the game */
  function newGame(seed) {
    return { seed: seed >>> 0, year: 0, res: { energy: START.energy, knowledge: START.knowledge, trust: START.trust, biosphere: START.biosphere },
      policies: {}, stress: [0, 0, 0, 0, 0], ledger: [], eventLog: [], plan: [], done: false, result: null };
  }
  function copyGame(g) { return JSON.parse(JSON.stringify(g)); }

  function validAlloc(alloc) {
    if (!Array.isArray(alloc) || alloc.length !== ACTIVITIES.length) return false;
    var s = 0; for (var i = 0; i < alloc.length; i++) { if (alloc[i] !== Math.floor(alloc[i]) || alloc[i] < 0 || alloc[i] > POINTS) return false; s += alloc[i]; }
    return s === POINTS;
  }

  /* Quantile of an ascending array (nearest-rank on the (n-1) grid, no interpolation: integers in, integers out). */
  function quantile(sorted, q) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))] : null; }

  /* ORION's forecast: run N copies of THIS world forward h years, holding the plan, and count. Does not touch g. */
  function forecast(g, alloc, n) {
    n = n || ENSEMBLE;
    var h = Math.min(HORIZON, YEARS - g.year), counts = {}, finals = { energy: [], trust: [], biosphere: [] }, k, j;
    BAD.forEach(function (e) { counts[e] = 0; });
    for (k = 0; k < n; k++) {
      var res = g.res, seen = {};
      for (j = 0; j < h; j++) {
        var o = afterPlan(res, g.policies, alloc), r = rollEvents(o, g.policies, rng(streamSeed(g.seed, 1, k, g.year + j)));
        r.hit.forEach(function (e) { seen[e] = true; }); res = r.res;
      }
      BAD.forEach(function (e) { if (seen[e]) counts[e]++; });
      finals.energy.push(res.energy); finals.trust.push(res.trust); finals.biosphere.push(res.biosphere);
    }
    var out = { year: g.year, h: h, n: n, p: {}, range: {} };
    BAD.forEach(function (e) { out.p[e] = counts[e] / n; });
    Object.keys(finals).forEach(function (r) { finals[r].sort(function (a, b) { return a - b; }); out.range[r] = [quantile(finals[r], 0.1), quantile(finals[r], 0.5), quantile(finals[r], 0.9)]; });
    return out;
  }

  /* Advance one year with an action { alloc:[4 ints summing to POINTS], toggle: policy id | null, ask: bool }. Returns the new game
     (a copy) and what happened. An invalid action returns { error } and changes nothing. */
  function applyYear(g0, act) {
    if (g0.done) return { error: 'The game is over.' };
    if (!validAlloc(act && act.alloc)) return { error: 'Spend exactly ' + POINTS + ' points.' };
    if (act.audit && !act.ask) return { error: 'An audit needs a forecast to audit.' };
    if (act.toggle && !POLICIES.some(function (p) { return p.id === act.toggle; })) return { error: 'Unknown policy.' };
    var g = copyGame(g0), asked = null;
    if (act.toggle) g.policies[act.toggle] = !g.policies[act.toggle];
    if (act.audit) g.res.trust = clamp(g.res.trust - AUDIT_COST);
    if (act.ask) {
      var f = forecast(g, act.alloc);
      asked = f;
      BAD.forEach(function (e) { g.ledger.push({ year: g.year, event: e, p: f.p[e], h: f.h, outcome: null }); });
    }
    var o = afterPlan(g.res, g.policies, act.alloc), r = rollEvents(o, g.policies, rng(streamSeed(g.seed, 0, 0, g.year)));
    g.res = r.res; g.eventLog.push(r.hit);
    g.stress = g.stress.map(function (v) { return Math.max(0, v - 5); });
    r.hit.forEach(function (e) { if (e !== 'breakthrough') g.stress[r.regions[e]] = Math.min(100, g.stress[r.regions[e]] + 25); });
    g.plan.push({ alloc: act.alloc.slice(), toggle: act.toggle || null, ask: !!act.ask, audit: !!act.audit });
    g.year++;
    g.ledger.forEach(function (e) {
      if (e.outcome === null && g.year >= e.year + e.h) {
        var o2 = 0; for (var y = e.year; y < e.year + e.h; y++) if (g.eventLog[y].indexOf(e.event) >= 0) o2 = 1;
        e.outcome = o2;
      }
    });
    if (g.res.trust === 0 || g.res.biosphere === 0 || g.year >= YEARS) finish(g);
    return { game: g, hit: r.hit, regions: r.regions, forecast: asked };
  }
  function finish(g) {
    g.done = true;
    var won = g.year >= YEARS && g.res.trust >= THRESHOLD && g.res.biosphere >= THRESHOLD;
    g.result = { won: won, year: g.year, res: g.res, reason: won ? 'held' : (g.res.trust === 0 ? 'trust-collapse' : g.res.biosphere === 0 ? 'biosphere-collapse' : 'below-threshold'), score: brier(g.ledger) };
  }

  /* Brier score over the resolved forecasts: mean (p - outcome)^2; 0 is perfect, 0.25 is a coin flip, lower is better. */
  function brier(ledger) {
    var r = ledger.filter(function (e) { return e.outcome !== null; });
    if (!r.length) return null;
    var s = 0; r.forEach(function (e) { s += (e.p - e.outcome) * (e.p - e.outcome); });
    return { n: r.length, brier: s / r.length };
  }
  /* The same score for "always say the overall base rate": the bar a forecaster has to beat to be informative. */
  function brierBaseline(ledger) {
    var r = ledger.filter(function (e) { return e.outcome !== null; });
    if (!r.length) return null;
    var m = 0; r.forEach(function (e) { m += e.outcome; }); m /= r.length;
    var s = 0; r.forEach(function (e) { s += (m - e.outcome) * (m - e.outcome); });
    return { n: r.length, brier: s / r.length };
  }
  /* Reliability: of the times it said 0-20%, 20-40%, ..., how often did it happen. */
  function reliability(ledger) {
    var bins = [0, 1, 2, 3, 4].map(function (i) { return { lo: i * 0.2, hi: (i + 1) * 0.2, n: 0, said: 0, happened: 0 }; });
    ledger.forEach(function (e) {
      if (e.outcome === null) return;
      var b = bins[Math.min(4, Math.floor(e.p * 5))]; b.n++; b.said += e.p; b.happened += e.outcome;
    });
    return bins.map(function (b) { return { lo: b.lo, hi: b.hi, n: b.n, said: b.n ? b.said / b.n : null, happened: b.n ? b.happened / b.n : null }; });
  }

  /* Replay a recorded action list from a seed (the save format). Stops at the first invalid action. */
  function replay(seed, actions) {
    var g = newGame(seed), i;
    for (i = 0; i < actions.length; i++) { var r = applyYear(g, actions[i]); if (r.error) return { game: g, error: r.error, at: i }; g = r.game; }
    return { game: g };
  }

  /* A small deterministic checksum (FNV-1a) of a save, so a corrupted or edited save is refused rather than trusted. */
  function checksum(seed, actions) {
    var s = seed + ':' + actions.map(function (a) { return a.alloc.join('') + (a.toggle || '-') + (a.ask ? '1' : '0') + (a.audit ? 'v' : '-'); }).join('|'), h = 0x811c9dc5, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16);
  }

  /* ---------- scripted players, used by the tests and as the in-game "advisor" baseline */
  var BOT_POLICIES = { 1: 'assembly', 2: 'corridors', 3: 'reserve' };
  /* A sensible, deterministic plan: shore up whichever of Biosphere and Trust is weakest, keep Energy from collapsing, take three policies early. */
  function bot(g) {
    var r = g.res, a = [2, 1, 1, 2];
    if (r.energy < 35) a = [3, 1, 1, 1];
    else if (r.biosphere < 55) a = [1, 1, 1, 3];
    else if (r.trust < 55) a = [2, 1, 2, 1];
    return { alloc: a, toggle: BOT_POLICIES[g.year] || null, ask: g.year % 3 === 0 };
  }
  /* A player who ignores the numbers: a seeded random split and random policy flips. */
  function randomBot(g, seed) {
    var s = rng(streamSeed(seed >>> 0, 7, 0, g.year)), a = [0, 0, 0, 0], i;
    for (i = 0; i < POINTS; i++) a[s.below(4)]++;
    return { alloc: a, toggle: s.below(3) === 0 ? POLICIES[s.below(POLICIES.length)].id : null, ask: false };
  }
  function playBot(seed, chooser) {
    var g = newGame(seed), r;
    while (!g.done) { r = applyYear(g, chooser(g, seed)); if (r.error) throw new Error(r.error); g = r.game; }
    return g;
  }

  var api = { YEARS: YEARS, AUDIT_COST: AUDIT_COST, HORIZON: HORIZON, ENSEMBLE: ENSEMBLE, POINTS: POINTS, THRESHOLD: THRESHOLD, RES: RES, START: START, ACTIVITIES: ACTIVITIES, POLICIES: POLICIES,
    EVENTS: EVENTS, BAD: BAD, EVENT_NAME: EVENT_NAME, rng: rng, streamSeed: streamSeed, afterPlan: afterPlan, eventProbs: eventProbs, newGame: newGame,
    validAlloc: validAlloc, quantile: quantile, forecast: forecast, applyYear: applyYear, brier: brier, brierBaseline: brierBaseline, reliability: reliability,
    replay: replay, checksum: checksum, bot: bot, randomBot: randomBot, playBot: playBot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OmegaCivLogic = api;
})(typeof window !== 'undefined' ? window : this);
