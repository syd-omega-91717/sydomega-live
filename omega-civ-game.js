/* omega-civ-game.js -- the screen and input of OMEGA: CIVILIZATION 91717, SLICE 0 (PROTOTYPE).
 *
 * All rules live in omega-civ-logic.js; this file only draws and listens. Everything is built with createElement and textContent (no
 * innerHTML, no inline script), every number on the hex map also appears in a table, every control is a real button, and the only
 * thing stored is the player's own save (a seed and a list of yearly actions) in this browser, checked by a checksum on the way back in. */
(function (root) {
  'use strict';
  var C = root.OmegaCivLogic;
  if (!C || !root.document) return;
  var STORE = 'omega_civ_v1', GENESIS = 91717;
  var REGIONS = [
    { name: 'Delta', x: 3, y: 3, c: '#c9a84c' }, { name: 'Ridge', x: 12, y: 3, c: '#4fe3ff' }, { name: 'Heartland', x: 8, y: 8, c: '#b69cff' },
    { name: 'Coast', x: 3, y: 12, c: '#5fd18a' }, { name: 'Steppe', x: 12, y: 12, c: '#ff9c6b' }
  ];
  var RES_LABEL = { energy: 'ENERGY', knowledge: 'KNOWLEDGE', trust: 'TRUST', biosphere: 'BIOSPHERE' };
  var RES_COLOR = { energy: '#c9a84c', knowledge: '#b69cff', trust: '#4fe3ff', biosphere: '#5fd18a' };
  var WHY = { held: 'You held Trust and Biosphere through year 12.', 'trust-collapse': 'Trust fell to zero: nobody would follow the state or ORION.',
    'biosphere-collapse': 'The Biosphere fell to zero: the world could no longer carry you.', 'below-threshold': 'You reached year 12, but Trust or Biosphere ended below ' + C.THRESHOLD + '.' };

  function $(id) { return root.document.getElementById(id); }
  function el(tag, cls, text) { var n = root.document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; if (tag === 'p') n.setAttribute('data-no-clamp', ''); return n; }   // the platform's read-more clamp must not cut a result
  function pct(p) { return Math.round(p * 100) + '%'; }
  function reduced() { try { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  function load() {
    var out = { seed: GENESIS, plan: [], played: 0, wins: 0, best: null };
    try {
      var d = JSON.parse(root.localStorage.getItem(STORE) || 'null');
      if (d && typeof d === 'object') {
        if (typeof d.played === 'number' && d.played >= 0 && d.played < 1e6) out.played = Math.floor(d.played);
        if (typeof d.wins === 'number' && d.wins >= 0 && d.wins <= out.played) out.wins = Math.floor(d.wins);
        if (typeof d.best === 'number' && d.best >= 0 && d.best <= 1) out.best = d.best;
        if (typeof d.seed === 'number' && Array.isArray(d.plan) && d.plan.length <= C.YEARS && d.sum === C.checksum(d.seed >>> 0, d.plan)) {
          var r = C.replay(d.seed >>> 0, d.plan);
          if (!r.error) { out.seed = d.seed >>> 0; out.plan = d.plan; }
        }
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return out;
  }
  function save(p, plan) {
    try { root.localStorage.setItem(STORE, JSON.stringify({ seed: p.seed, plan: plan, sum: C.checksum(p.seed, plan), played: p.played, wins: p.wins, best: p.best })); return true; } catch (e) { return false; }
  }

  function start() {
    var ui = { status: $('oc-status'), res: $('oc-res'), canvas: $('oc-map'), regions: $('oc-regions'), alloc: $('oc-alloc'), left: $('oc-left'), pol: $('oc-policies'),
      ask: $('oc-ask'), audit: $('oc-audit'), fc: $('oc-fc'), fcnote: $('oc-fcnote'), end: $('oc-end'), undo: $('oc-undo'), newg: $('oc-new'), log: $('oc-log'), result: $('oc-result'), msg: $('oc-msg') };
    if (!ui.canvas || !ui.alloc) return;
    var ctx = ui.canvas.getContext('2d'), prog = load(), g, alloc = [2, 1, 1, 2], toggle = null, wantAsk = false, wantAudit = false, lastMs = null, hist = [];

    function begin(seed, plan) {
      g = C.newGame(seed); hist = [snap()];
      var i, r;
      for (i = 0; i < plan.length; i++) { r = C.applyYear(g, plan[i]); g = r.game; hist.push(snap()); }
      toggle = null; wantAsk = false; wantAudit = false; ui.log.textContent = '';
      if (plan.length) addLog('Resumed at year ' + g.year + ' of ' + C.YEARS + '.');
      if (plan.length) alloc = plan[plan.length - 1].alloc.slice();
      refresh();
    }
    function snap() { return { year: g.year, res: JSON.parse(JSON.stringify(g.res)), plan: g.plan.slice() }; }
    function addLog(text, cls) { var li = el('li', cls || '', text); ui.log.insertBefore(li, ui.log.firstChild); while (ui.log.children.length > 40) ui.log.removeChild(ui.log.lastChild); }
    function say(text) { if (ui.msg) ui.msg.textContent = text; }
    function left() { return C.POINTS - alloc.reduce(function (a, b) { return a + b; }, 0); }

    /* ---- the world as it will be if this plan is committed, up to ORION's forecast (same order as the rules: toggle, audit, forecast) */
    function previewGame() {
      var c = JSON.parse(JSON.stringify(g));
      if (toggle) c.policies[toggle] = !c.policies[toggle];
      if (wantAsk && wantAudit) c.res.trust = Math.max(0, c.res.trust - C.AUDIT_COST);
      return c;
    }

    function drawRes() {
      ui.res.textContent = '';
      C.RES.forEach(function (k) {
        var v = g.res[k], row = el('div', 'oc-meter'), lab = el('span', 'oc-ml', RES_LABEL[k]), bar = el('span', 'oc-bar'), fill = el('span', 'oc-fill');
        fill.style.width = v + '%'; fill.style.background = RES_COLOR[k]; bar.appendChild(fill);
        var num = el('span', 'oc-mv', String(v));
        if ((k === 'trust' || k === 'biosphere') && v < C.THRESHOLD) num.className = 'oc-mv oc-low';
        row.setAttribute('role', 'group'); row.setAttribute('aria-label', RES_LABEL[k] + ' ' + v + ' of 100' + ((k === 'trust' || k === 'biosphere') ? ', needs ' + C.THRESHOLD : ''));
        row.appendChild(lab); row.appendChild(bar); row.appendChild(num); ui.res.appendChild(row);
      });
    }

    function drawAlloc() {
      ui.alloc.textContent = '';
      C.ACTIVITIES.forEach(function (a, i) {
        var row = el('div', 'oc-arow'), nm = el('span', 'oc-an', a.name.toUpperCase()), fx = el('span', 'oc-fx', effectText(a.d)), minus = el('button', 'oc-btn oc-pm', '−'), plus = el('button', 'oc-btn oc-pm', '+'), n = el('span', 'oc-n', String(alloc[i]));
        minus.type = 'button'; plus.type = 'button'; minus.setAttribute('aria-label', 'Remove a point from ' + a.name); plus.setAttribute('aria-label', 'Add a point to ' + a.name);
        minus.disabled = g.done || alloc[i] === 0; plus.disabled = g.done || left() === 0;
        minus.addEventListener('click', function () { if (alloc[i] > 0) { alloc[i]--; refresh(); } });
        plus.addEventListener('click', function () { if (left() > 0) { alloc[i]++; refresh(); } });
        row.appendChild(nm); row.appendChild(fx); row.appendChild(minus); row.appendChild(n); row.appendChild(plus); ui.alloc.appendChild(row);
      });
      ui.left.textContent = left() === 0 ? 'ALL ' + C.POINTS + ' SPENT' : left() + ' OF ' + C.POINTS + ' LEFT TO SPEND';
      ui.left.className = left() === 0 ? 'oc-ok' : 'oc-warn';
    }
    function effectText(d) { return Object.keys(d).map(function (k) { return (d[k] > 0 ? '+' : '') + d[k] + ' ' + k.slice(0, 3); }).join(' '); }

    function drawPolicies() {
      ui.pol.textContent = '';
      C.POLICIES.forEach(function (p) {
        var on = !!g.policies[p.id], will = toggle === p.id ? !on : on;
        var b = el('button', 'oc-btn oc-pol', p.name.toUpperCase() + (will ? ' · ON' : ' · OFF'));
        b.type = 'button'; b.setAttribute('aria-pressed', will ? 'true' : 'false');
        b.title = effectText(p.d) + (p.note ? ' · ' + p.note : '') + ' per year';
        b.setAttribute('aria-label', p.name + ', ' + (will ? 'on' : 'off') + '. ' + effectText(p.d) + ' per year' + (p.note ? '. ' + p.note : '') + (toggle === p.id ? '. Changed this year.' : ''));
        b.disabled = g.done || (toggle !== null && toggle !== p.id);
        b.addEventListener('click', function () { toggle = toggle === p.id ? null : p.id; say(toggle ? 'One policy change per year: ' + p.name + ' will be switched ' + (!on ? 'on' : 'off') + '.' : ''); refresh(); });
        ui.pol.appendChild(b);
      });
    }

    function drawForecast() {
      ui.fc.textContent = '';
      ui.ask.setAttribute('aria-pressed', wantAsk ? 'true' : 'false');
      ui.ask.textContent = wantAsk ? 'ORION: FORECASTING' : 'ASK ORION';
      ui.ask.disabled = g.done; ui.audit.disabled = g.done || !wantAsk;
      if (!wantAsk || g.done) { ui.fcnote.textContent = g.done ? '' : 'ORION states odds, not facts. Ask, and its forecast for this plan is recorded and scored when the years have passed.'; return; }
      var c = previewGame(), t0 = root.performance && root.performance.now ? root.performance.now() : 0, f = C.forecast(c, alloc);
      lastMs = root.performance && root.performance.now ? root.performance.now() - t0 : null;
      var head = el('tr'); ['EVENT', 'ODDS (NEXT ' + f.h + (f.h === 1 ? ' YEAR)' : ' YEARS)')].forEach(function (h) { head.appendChild(el('th', '', h)); }); ui.fc.appendChild(head);
      C.BAD.forEach(function (e) {
        var tr = el('tr'), td = el('td', 'oc-odds', pct(f.p[e])), bar = el('span', 'oc-obar'), fl = el('span', 'oc-ofill');
        fl.style.width = Math.round(f.p[e] * 100) + '%'; bar.appendChild(fl); td.appendChild(bar);
        tr.appendChild(el('td', '', C.EVENT_NAME[e])); tr.appendChild(td); ui.fc.appendChild(tr);
      });
      if (wantAudit) {
        var h2 = el('tr'); ['IN ' + f.h + (f.h === 1 ? ' YEAR' : ' YEARS'), 'LOW · MID · HIGH (10/50/90%)'].forEach(function (h) { h2.appendChild(el('th', '', h)); }); ui.fc.appendChild(h2);
        ['energy', 'trust', 'biosphere'].forEach(function (k) { var r = f.range[k], tr = el('tr'); tr.appendChild(el('td', '', RES_LABEL[k])); tr.appendChild(el('td', '', r[0] + ' · ' + r[1] + ' · ' + r[2])); ui.fc.appendChild(tr); });
      }
      ui.fcnote.textContent = 'From ' + f.n + ' imagined copies of this world, holding this plan' + (wantAudit ? '; audited: the spread of outcomes is shown (costs ' + C.AUDIT_COST + ' Trust)' : '; audit it to see the spread of outcomes (costs ' + C.AUDIT_COST + ' Trust)') + (lastMs != null ? ' · ' + lastMs.toFixed(1) + ' ms' : '') + '.';
    }

    function drawRegionsTable() {
      ui.regions.textContent = '';
      g.stress.forEach(function (s, i) { var li = el('li', s >= 50 ? 'oc-low' : '', REGIONS[i].name + ' · stress ' + s); li.style.borderLeftColor = REGIONS[i].c; ui.regions.appendChild(li); });
    }

    /* ---- the 16 x 16 hex map: five regions by nearest centre, shaded by stress */
    var hexes = [];
    (function () {
      var x, y, best, bd, i, d;
      for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
        var px = x + (y % 2 ? 0.5 : 0), py = y * 0.866; best = 0; bd = 1e9;
        for (i = 0; i < 5; i++) { d = Math.pow(px - REGIONS[i].x, 2) + Math.pow(py - REGIONS[i].y * 0.866, 2); if (d < bd) { bd = d; best = i; } }
        hexes.push({ x: x, y: y, r: best, shade: ((x * 7 + y * 13) % 5) / 40 });
      }
    })();
    function hexPath(cx, cy, s) { ctx.beginPath(); for (var k = 0; k < 6; k++) { var a = Math.PI / 180 * (60 * k - 30); ctx[k ? 'lineTo' : 'moveTo'](cx + s * Math.cos(a), cy + s * Math.sin(a)); } ctx.closePath(); }
    function alpha(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function drawMap() {
      var wrap = ui.canvas.parentNode, W = Math.max(240, Math.min(720, wrap.clientWidth || 320)), s = W / (16.5 * Math.sqrt(3)), H = Math.ceil(s * 1.5 * 15 + s * 2.1), dpr = Math.min(2, root.devicePixelRatio || 1);
      if (ui.canvas.width !== Math.round(W * dpr) || ui.canvas.height !== Math.round(H * dpr)) { ui.canvas.width = Math.round(W * dpr); ui.canvas.height = Math.round(H * dpr); ui.canvas.style.width = W + 'px'; ui.canvas.style.height = H + 'px'; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var bio = g.res.biosphere / 100, i;
      hexes.forEach(function (h) {
        var cx = s * Math.sqrt(3) * (h.x + (h.y % 2 ? 0.5 : 0) + 0.5), cy = s * 1.5 * h.y + s * 1.05, st = g.stress[h.r] / 100, col = REGIONS[h.r].c;
        hexPath(cx, cy, s * 0.94);
        ctx.fillStyle = alpha(col, 0.16 + h.shade + 0.10 * bio); ctx.fill();
        if (st > 0) { ctx.fillStyle = 'rgba(255,70,70,' + (0.55 * st).toFixed(3) + ')'; ctx.fill(); }
        ctx.strokeStyle = alpha(col, 0.35); ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.font = '700 ' + Math.max(10, Math.round(s * 0.9)) + 'px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (i = 0; i < 5; i++) {
        var cx2 = s * Math.sqrt(3) * (REGIONS[i].x + (REGIONS[i].y % 2 ? 0.5 : 0) + 0.5), cy2 = s * 1.5 * REGIONS[i].y + s * 1.05;
        ctx.fillStyle = '#05060a'; ctx.fillText(REGIONS[i].name.toUpperCase(), cx2 + 1, cy2 + 1); ctx.fillStyle = REGIONS[i].c; ctx.fillText(REGIONS[i].name.toUpperCase(), cx2, cy2);
      }
    }

    function drawResult() {
      ui.result.textContent = '';
      if (!g.done) { ui.result.hidden = true; return; }
      ui.result.hidden = false;
      var r = g.result, h = el('h2', 'oc-rh', r.won ? 'THE CIVILIZATION HELD' : 'THE CIVILIZATION FELL'), d = el('p', 'oc-rd', WHY[r.reason] + ' (Trust ' + g.res.trust + ', Biosphere ' + g.res.biosphere + ', Energy ' + g.res.energy + ', Knowledge ' + g.res.knowledge + ')');
      ui.result.appendChild(h); ui.result.appendChild(d);
      var b = C.brier(g.ledger), base = C.brierBaseline(g.ledger);
      if (b) {
        ui.result.appendChild(el('p', 'oc-rd', 'ORION made ' + b.n + ' scored forecasts. Brier score ' + b.brier.toFixed(3) + ' (0 is perfect, 0.25 is a coin flip); always guessing the average would have scored ' + base.brier.toFixed(3) + '. Its odds were ' + (b.brier < base.brier ? 'better than a constant guess' : 'no better than a constant guess this game (a short game is a small sample)') + '.'));
        var t = el('table', 'oc-tbl'), hr = el('tr'); ['ORION SAID', 'TIMES', 'IT HAPPENED'].forEach(function (x) { hr.appendChild(el('th', '', x)); }); t.appendChild(hr);
        C.reliability(g.ledger).forEach(function (bin) { if (!bin.n) return; var tr = el('tr'); tr.appendChild(el('td', '', pct(bin.lo) + '–' + pct(bin.hi))); tr.appendChild(el('td', '', String(bin.n))); tr.appendChild(el('td', '', pct(bin.happened))); t.appendChild(tr); });
        ui.result.appendChild(t);
      } else ui.result.appendChild(el('p', 'oc-rd', 'You never asked ORION, so there is nothing to score. Ask it next time and see whether its numbers are honest.'));
      var row = el('div', 'oc-row'), again = el('button', 'oc-btn', 'PLAY THIS SEED AGAIN'), next = el('button', 'oc-btn', 'NEW SEED');
      again.type = 'button'; next.type = 'button';
      again.addEventListener('click', function () { newGame(g.seed); }); next.addEventListener('click', function () { newGame(nextSeed()); });
      row.appendChild(again); row.appendChild(next); ui.result.appendChild(row);
      ui.result.setAttribute('tabindex', '-1');
    }

    function drawHistory() {
      var h = $('oc-hist'); if (!h) return; h.textContent = '';
      var hr = el('tr'); ['YEAR', 'ENERGY', 'KNOWLEDGE', 'TRUST', 'BIOSPHERE'].forEach(function (x) { hr.appendChild(el('th', '', x)); }); h.appendChild(hr);
      hist.forEach(function (s) { var tr = el('tr'); tr.appendChild(el('td', '', String(s.year))); C.RES.forEach(function (k) { tr.appendChild(el('td', '', String(s.res[k]))); }); h.appendChild(tr); });
    }

    function refresh() {
      ui.status.textContent = 'YEAR ' + Math.min(g.year + (g.done ? 0 : 1), C.YEARS) + ' OF ' + C.YEARS + ' · SEED ' + g.seed + (g.seed === GENESIS ? ' · GENESIS 91717' : '') + ' · WIN: TRUST AND BIOSPHERE ≥ ' + C.THRESHOLD + ' AT THE END';
      drawRes(); drawAlloc(); drawPolicies(); drawForecast(); drawRegionsTable(); drawMap(); drawResult(); drawHistory();
      ui.end.disabled = g.done || left() !== 0; ui.end.textContent = g.done ? 'GAME OVER' : (left() ? 'SPEND ' + left() + ' MORE' : 'END YEAR ' + (g.year + 1));
      ui.undo.disabled = g.plan.length === 0 && !g.done;
    }

    function nextSeed() { return GENESIS + 7919 * (prog.played + 1); }
    function commit() {
      if (g.done || left() !== 0) return;
      var act = { alloc: alloc.slice(), toggle: toggle, ask: wantAsk, audit: wantAsk && wantAudit }, r = C.applyYear(g, act);
      if (r.error) { say(r.error); return; }
      g = r.game; hist.push(snap());
      var names = r.hit.map(function (e) { return C.EVENT_NAME[e] + (r.regions[e] != null ? ' in ' + REGIONS[r.regions[e]].name : ''); });
      addLog('Year ' + g.year + ': ' + (names.length ? names.join('; ') : 'a quiet year') + (act.toggle ? ' · policy changed' : '') + (act.ask ? ' · ORION forecast filed' : ''), r.hit.some(function (e) { return e !== 'breakthrough'; }) ? 'oc-bad' : '');
      toggle = null; wantAsk = false; wantAudit = false; ui.audit.checked = false;
      if (g.done) { prog.played++; if (g.result.won) prog.wins++; if (g.result.score && (prog.best === null || g.result.score.brier < prog.best)) prog.best = g.result.score.brier; say(g.result.won ? 'The civilization held.' : 'The civilization fell.'); }
      if (!save(prog, g.plan)) say('This browser would not save your game; you can keep playing.');
      refresh(); if (g.done) { try { ui.result.focus(); } catch (e) { /* ignore */ } }
    }
    function undo() {
      if (g.plan.length === 0) return;
      var plan = g.plan.slice(0, -1), wasDone = g.done;
      if (wasDone) { prog.played = Math.max(0, prog.played - 1); if (g.result.won) prog.wins = Math.max(0, prog.wins - 1); }
      begin(g.seed, plan); save(prog, plan); say('Back to year ' + g.year + '.');
    }
    function newGame(seed) { alloc = [2, 1, 1, 2]; begin(seed, []); save(prog, []); say(seed === GENESIS ? 'Genesis 91717.' : 'New seed ' + seed + '.'); ui.alloc.querySelector('button') && ui.alloc.querySelector('button').focus(); }

    ui.ask.addEventListener('click', function () { wantAsk = !wantAsk; if (!wantAsk) { wantAudit = false; ui.audit.checked = false; } refresh(); });
    ui.audit.addEventListener('change', function () { wantAudit = !!ui.audit.checked; refresh(); });
    ui.end.addEventListener('click', commit); ui.undo.addEventListener('click', undo);
    ui.newg.addEventListener('click', function () { newGame(g.seed === GENESIS && !g.plan.length ? nextSeed() : GENESIS); });
    root.document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || g.done) return;
      var t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      var n = /^Digit[1-4]$/.test(e.code || '') ? Number(e.code.slice(5)) - 1 : '1234'.indexOf(e.key);   // Shift changes e.key to ! @ # $, so the physical key decides
      if (n >= 0) { if (e.shiftKey ? alloc[n] > 0 : left() > 0) { alloc[n] += e.shiftKey ? -1 : 1; refresh(); } e.preventDefault(); }
      else if (e.key === 'a' || e.key === 'A') { ui.ask.click(); e.preventDefault(); }
      else if (e.key === 'e' || e.key === 'E') { commit(); e.preventDefault(); }
    });
    var rt = 0; root.addEventListener('resize', function () { root.clearTimeout(rt); rt = root.setTimeout(drawMap, 120); });
    if (root.ResizeObserver) { try { new root.ResizeObserver(function () { root.clearTimeout(rt); rt = root.setTimeout(drawMap, 60); }).observe(ui.canvas.parentNode); } catch (e) { /* the resize listener covers it */ } }

    root.__civTest = root.location && /[?&]test=1/.test(root.location.search) ? { game: function () { return g; }, progress: function () { return prog; }, alloc: function () { return alloc.slice(); } } : undefined;
    begin(prog.seed, prog.plan);
    if (!prog.plan.length) say('Genesis 91717: twelve years. Spend six points, ask ORION, and end the year.');
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : this);
