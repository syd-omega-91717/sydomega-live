/* omega-galactic-game.js -- the screen and input of LAST GALACTIC EMPIRE: SLICE 0 (PROTOTYPE).
 *
 * All rules live in omega-galactic-logic.js; this file only draws and listens. Everything is built with createElement and textContent (no
 * innerHTML, no inline script). Every fact on the map is also in a table, every control is a real button or select, and the only thing stored
 * is the player's own save (a seed and a list of seasonal actions) in this browser, checked by a checksum on the way back in. */
(function (root) {
  'use strict';
  var G = root.OmegaGalacticLogic;
  if (!G || !root.document) return;
  var STORE = 'omega_galactic_v1', FIRST_SEED = 91717;
  var COLOR = { C: '#c9a84c', R: '#4fe3ff', I: '#ff7a9c', N: '#7d8296' };
  var SHAPE = { C: 'square', R: 'diamond', I: 'triangle', N: 'circle' };
  var ENDING = {
    'stable-peace': ['A STABLE PEACE', 'Four quiet seasons, both neighbours trust the Court, and Drift stayed under ' + G.PEACE_DRIFT + '. The Empire kept its word without becoming what it feared.'],
    reform: ['THE VETO DISSOLVED', 'The Court gave up its own veto while the Reformers still trusted it. The institution reformed itself, which is the rarest thing an institution does.'],
    'capital-lost': ['THE CAPITAL FELL', 'An enemy fleet held the imperial capital alone. The Empire ended not with a decree but with a lost war.'],
    hardened: ['THE COURT HARDENED', 'Drift reached ' + G.HARD_DRIFT + '. Every law that kept the peace also taught the Court to keep it by force: it is now the thing it was founded to prevent. This is an ending, not a score.'],
    unresolved: ['UNRESOLVED', 'Forty seasons passed without a stable peace or a reform. The war goes on.']
  };
  function $(id) { return root.document.getElementById(id); }
  function el(tag, cls, text) { var n = root.document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; if (tag === 'p') n.setAttribute('data-no-clamp', ''); return n; }
  function sysName(i) { return G.SYSTEMS[i].n; }

  function load() {
    var out = { seed: FIRST_SEED, plan: [], played: 0, wins: 0 };
    try {
      var d = JSON.parse(root.localStorage.getItem(STORE) || 'null');
      if (d && typeof d === 'object') {
        if (typeof d.played === 'number' && d.played >= 0 && d.played < 1e6) out.played = Math.floor(d.played);
        if (typeof d.wins === 'number' && d.wins >= 0 && d.wins <= out.played) out.wins = Math.floor(d.wins);
        if (typeof d.seed === 'number' && Array.isArray(d.plan) && d.plan.length <= G.SEASONS && d.sum === G.checksum(d.seed >>> 0, d.plan)) {
          var r = G.replay(d.seed >>> 0, d.plan);
          if (!r.error) { out.seed = d.seed >>> 0; out.plan = d.plan; }
        }
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return out;
  }
  function save(p, plan) { try { root.localStorage.setItem(STORE, JSON.stringify({ seed: p.seed, plan: plan, sum: G.checksum(p.seed, plan), played: p.played, wins: p.wins })); return true; } catch (e) { return false; } }

  function start() {
    var ui = { status: $('gl-status'), meters: $('gl-meters'), canvas: $('gl-map'), sys: $('gl-sys'), fleets: $('gl-fleets'), laws: $('gl-laws'), answer: $('gl-answer'), cost: $('gl-cost'),
      end: $('gl-end'), undo: $('gl-undo'), newg: $('gl-new'), log: $('gl-log'), result: $('gl-result'), msg: $('gl-msg'), hist: $('gl-hist'), owners: $('gl-owners') };
    if (!ui.canvas || !ui.fleets) return;
    var ctx = ui.canvas.getContext('2d'), prog = load(), g, pend, selFleet = null, selSys = null, geo = { s: 1, ox: 0, oy: 0 };

    function fresh() { return { decree: null, orders: {}, doctrines: {}, reinforce: {}, answer: 0 }; }
    function begin(seed, plan) {
      g = G.newGame(seed); var i, r;
      for (i = 0; i < plan.length; i++) { r = G.applySeason(g, plan[i]); g = r.game; }
      pend = fresh(); selFleet = null; selSys = null; refresh();
    }
    function say(t) { if (ui.msg) ui.msg.textContent = t || ''; }
    function myFleets() { return g.fleets.filter(function (f) { return f.f === 'C'; }); }
    function toAction() {
      return { decree: pend.decree, answer: pend.answer,
        orders: Object.keys(pend.orders).map(function (k) { return { fleet: Number(k), to: pend.orders[k] }; }).filter(function (o) { var f = g.fleets.filter(function (x) { return x.id === o.fleet; })[0]; return f && f.at !== o.to; }),
        doctrines: Object.keys(pend.doctrines).map(function (k) { return { fleet: Number(k), doc: pend.doctrines[k] }; }),
        reinforce: Object.keys(pend.reinforce).filter(function (k) { return pend.reinforce[k]; }).map(Number) };
    }
    function spend(act) { return act.reinforce.length * G.FLEET_COST + act.answer * G.ANSWER_COST + (act.decree === 'veto' ? G.VETO_COST : 0); }

    /* ---- meters */
    function meter(label, v, max, color, marks, text) {
      var row = el('div', 'gl-meter'), bar = el('span', 'gl-bar'), fill = el('span', 'gl-fill');
      fill.style.width = Math.round(v * 100 / max) + '%'; fill.style.background = color; bar.appendChild(fill);
      (marks || []).forEach(function (m) { var t = el('span', 'gl-mark'); t.style.left = Math.round(m * 100 / max) + '%'; bar.appendChild(t); });
      row.setAttribute('role', 'group'); row.setAttribute('aria-label', label + ' ' + (text || v));
      row.appendChild(el('span', 'gl-ml', label)); row.appendChild(bar); row.appendChild(el('span', 'gl-mv', String(text || v)));
      return row;
    }
    function drawMeters() {
      ui.meters.textContent = '';
      ui.meters.appendChild(meter('DRIFT', g.drift, 100, g.drift >= G.PEACE_DRIFT ? '#ff7a5c' : '#c9a84c', [G.PEACE_DRIFT], g.drift + ' / ' + G.HARD_DRIFT));
      ui.meters.appendChild(meter('REFORMERS', g.trust.R, 100, COLOR.R, [G.HOSTILE_BELOW, G.PEACE_TRUST], g.trust.R + ''));
      ui.meters.appendChild(meter('INDEPENDENTS', g.trust.I, 100, COLOR.I, [G.HOSTILE_BELOW, G.PEACE_TRUST], g.trust.I + ''));
      var peace = el('div', 'gl-facts');
      peace.textContent = 'TREASURY ' + g.treasury.C + ' · QUIET SEASONS ' + g.peace + ' OF ' + G.PEACE_NEED + ' · OPEN GRIEVANCES ' + g.grievances.length + ' · OWNED ' + g.owner.filter(function (o) { return o === 'C'; }).length + ' OF 20';
      ui.meters.appendChild(peace);
    }

    /* ---- map */
    function px(i) { return { x: geo.ox + G.SYSTEMS[i].x * geo.s, y: geo.oy + G.SYSTEMS[i].y * geo.s }; }
    function shape(f, x, y, r) {
      ctx.beginPath();
      if (SHAPE[f] === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
      else if (SHAPE[f] === 'diamond') { ctx.moveTo(x, y - r * 1.3); ctx.lineTo(x + r * 1.3, y); ctx.lineTo(x, y + r * 1.3); ctx.lineTo(x - r * 1.3, y); ctx.closePath(); }
      else if (SHAPE[f] === 'triangle') { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r * 1.2, y + r); ctx.lineTo(x - r * 1.2, y + r); ctx.closePath(); }
      else ctx.arc(x, y, r, 0, 6.2832);
    }
    function drawMap() {
      var wrap = ui.canvas.parentNode, W = Math.max(280, Math.min(900, wrap.clientWidth || 340)), H = Math.round(W * 0.62), dpr = Math.min(2, root.devicePixelRatio || 1);
      if (ui.canvas.width !== Math.round(W * dpr) || ui.canvas.height !== Math.round(H * dpr)) { ui.canvas.width = Math.round(W * dpr); ui.canvas.height = Math.round(H * dpr); ui.canvas.style.width = W + 'px'; ui.canvas.style.height = H + 'px'; }
      geo.s = (W - 40) / 100; geo.ox = 20; geo.oy = 18;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var i, supply = G.supplySet(g, 'C');
      ctx.lineWidth = 1; G.EDGES.forEach(function (e) { var a = px(e[0]), b = px(e[1]); ctx.strokeStyle = 'rgba(160,170,200,0.22)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      var r = Math.max(5, geo.s * 2.4);
      for (i = 0; i < G.SYSTEMS.length; i++) {
        var p = px(i), o = g.owner[i], sel = selSys === i;
        if (o === 'C' && supply[i]) { ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.9, 0, 6.2832); ctx.fillStyle = 'rgba(201,168,76,0.07)'; ctx.fill(); }
        shape(o, p.x, p.y, r); ctx.fillStyle = COLOR[o] + (o === 'N' ? '55' : 'cc'); ctx.fill(); ctx.strokeStyle = sel ? '#ffffff' : COLOR[o]; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
        if (G.CAPITAL.C === i || G.CAPITAL.R === i || G.CAPITAL.I === i) { ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.6, 0, 6.2832); ctx.strokeStyle = COLOR[o]; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.fillStyle = '#d7dae6'; ctx.font = '600 ' + Math.max(9, Math.round(geo.s * 1.9)) + 'px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(i), p.x, p.y + r * 1.5);
      }
      // fleets: a bar with the strength, and the Court's orders as arrows
      myFleets().forEach(function (f) { var to = pend.orders[f.id]; if (to !== undefined && to !== f.at) { var a = px(f.at), b = px(to); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); } });
      var slot = {};
      g.fleets.forEach(function (f) {
        var p = px(f.at), k = (slot[f.at] = (slot[f.at] || 0) + 1) - 1, x = p.x + r * 1.3 + k * (geo.s * 3.6), y = p.y - r * 1.6;
        ctx.fillStyle = COLOR[f.f]; ctx.globalAlpha = 0.95; ctx.fillRect(x - 1, y - r * 0.8, Math.max(16, geo.s * 3.4), Math.max(11, geo.s * 2.4)); ctx.globalAlpha = 1;
        ctx.fillStyle = '#05060a'; ctx.font = '700 ' + Math.max(9, Math.round(geo.s * 1.9)) + 'px "Courier Prime", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(f.str), x + 1, y - r * 0.8 + Math.max(11, geo.s * 2.4) / 2);
        if (selFleet === f.id) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 2, y - r * 0.8 - 1, Math.max(16, geo.s * 3.4) + 2, Math.max(11, geo.s * 2.4) + 2); }
      });
    }
    function hit(e) {
      var rect = ui.canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top, best = -1, bd = 1e9, i;
      for (i = 0; i < G.SYSTEMS.length; i++) { var p = px(i), d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = i; } }
      return bd < Math.pow(Math.max(18, geo.s * 5), 2) ? best : -1;
    }

    /* ---- panels */
    function drawSys() {
      ui.sys.textContent = '';
      var i = selSys; if (i === null) { ui.sys.appendChild(el('p', 'gl-note', 'Select a system on the map or in the table to see it.')); return; }
      ui.sys.appendChild(el('h3', 'gl-h2', i + ' · ' + sysName(i).toUpperCase()));
      var here = g.fleets.filter(function (f) { return f.at === i; });
      ui.sys.appendChild(el('p', 'gl-note', 'Owner: ' + (g.owner[i] === 'N' ? 'unclaimed' : G.FACTION_NAME[g.owner[i]]) + ' · output ' + G.SYSTEMS[i].v + ' · jumps to ' + G.ADJ[i].map(function (n) { return n + ' ' + sysName(n); }).join(', ')));
      ui.sys.appendChild(el('p', 'gl-note', here.length ? 'Fleets here: ' + here.map(function (f) { return G.FACTION_NAME[f.f] + ' fleet ' + f.id + ' (strength ' + f.str + ', ' + f.doc + ')'; }).join('; ') : 'No fleets here.'));
    }
    function drawFleets() {
      ui.fleets.textContent = '';
      var supply = G.supplySet(g, 'C');
      myFleets().forEach(function (f) {
        var card = el('div', 'gl-fleet' + (selFleet === f.id ? ' gl-sel' : '')), head = el('div', 'gl-fhead'), sb = el('button', 'gl-btn gl-small', '#' + f.id);
        sb.type = 'button'; sb.setAttribute('aria-pressed', selFleet === f.id ? 'true' : 'false'); sb.setAttribute('aria-label', 'Select fleet ' + f.id);
        sb.addEventListener('click', function () { selFleet = selFleet === f.id ? null : f.id; selSys = f.at; refresh(); });
        head.appendChild(sb);
        head.appendChild(el('span', 'gl-ftxt', f.at + ' ' + sysName(f.at) + (supply[f.at] ? '' : ' (no supply)') + ' \u00b7 strength ' + f.str + (pend.reinforce[f.id] ? ' +' + G.FLEET_GAIN : '') + ' \u00b7 readiness ' + f.ready + '%'));
        card.appendChild(head);
        var ctl = el('div', 'gl-fctl'), dl = el('label', 'gl-lab', 'DOCTRINE'), ds = el('select', 'gl-sel-ctl'), did = 'gl-doc-' + f.id; ds.id = did; dl.setAttribute('for', did); ds.setAttribute('aria-label', 'Doctrine for fleet ' + f.id);
        G.DOCTRINES.forEach(function (x) { var o = el('option', '', x); o.value = x; if ((pend.doctrines[f.id] || f.doc) === x) o.selected = true; ds.appendChild(o); });
        ds.addEventListener('change', function () { pend.doctrines[f.id] = ds.value; refresh(); });
        var ml = el('label', 'gl-lab', 'ORDER'), ms = el('select', 'gl-sel-ctl'), mid = 'gl-ord-' + f.id; ms.id = mid; ml.setAttribute('for', mid); ms.setAttribute('aria-label', 'Order for fleet ' + f.id);
        var hold = el('option', '', 'hold'); hold.value = String(f.at); ms.appendChild(hold);
        G.ADJ[f.at].forEach(function (n) { var o = el('option', '', 'to ' + n + ' ' + sysName(n)); o.value = String(n); ms.appendChild(o); });
        ms.value = String(pend.orders[f.id] !== undefined ? pend.orders[f.id] : f.at);
        ms.addEventListener('change', function () { pend.orders[f.id] = Number(ms.value); refresh(); });
        var rl = el('label', 'gl-lab gl-chk'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!pend.reinforce[f.id]; cb.setAttribute('aria-label', 'Reinforce fleet ' + f.id + ' (cost ' + G.FLEET_COST + ')'); cb.disabled = g.owner[f.at] !== 'C';
        cb.addEventListener('change', function () { pend.reinforce[f.id] = cb.checked; refresh(); }); rl.appendChild(cb); rl.appendChild(root.document.createTextNode(' REINFORCE (' + G.FLEET_COST + ')'));
        [dl, ds, ml, ms, rl].forEach(function (n) { ctl.appendChild(n); }); card.appendChild(ctl); ui.fleets.appendChild(card);
      });
    }
    function drawLaws() {
      ui.laws.textContent = '';
      G.LAWS.forEach(function (l) {
        var on = !!g.laws[l.id], will = pend.decree === l.id ? !on : on, b = el('button', 'gl-btn gl-law', l.name.toUpperCase() + (will ? ' · ON' : ' · OFF'));
        b.type = 'button'; b.setAttribute('aria-pressed', will ? 'true' : 'false'); b.title = l.note; b.setAttribute('data-kind', l.kind);
        b.setAttribute('aria-label', l.name + ', ' + (will ? 'on' : 'off') + '. ' + l.note + '. Costs 2 Drift a season while it stands.' + (pend.decree === l.id ? ' Changed this season.' : ''));
        b.disabled = g.over || (pend.decree !== null && pend.decree !== l.id);
        b.addEventListener('click', function () { pend.decree = pend.decree === l.id ? null : l.id; refresh(); }); ui.laws.appendChild(b);
      });
      var vb = el('button', 'gl-btn gl-law', 'DISSOLVE THE VETO · ' + G.VETO_COST + ' TREASURY'); vb.type = 'button'; vb.setAttribute('aria-pressed', pend.decree === 'veto' ? 'true' : 'false');
      vb.title = 'Ends the campaign as a reform. Needs Reformer trust of ' + G.VETO_TRUST + ' or more.'; vb.disabled = g.over || g.trust.R < G.VETO_TRUST || g.treasury.C < G.VETO_COST || (pend.decree !== null && pend.decree !== 'veto');
      vb.addEventListener('click', function () { pend.decree = pend.decree === 'veto' ? null : 'veto'; refresh(); }); ui.laws.appendChild(vb);
    }
    function drawAnswer() {
      ui.answer.textContent = '';
      var n = g.grievances.length, row = el('div', 'gl-row'), minus = el('button', 'gl-btn gl-pm', '−'), plus = el('button', 'gl-btn gl-pm', '+');
      minus.type = 'button'; plus.type = 'button'; minus.setAttribute('aria-label', 'Answer one fewer grievance'); plus.setAttribute('aria-label', 'Answer one more grievance');
      minus.disabled = g.over || pend.answer === 0; plus.disabled = g.over || pend.answer >= n;
      minus.addEventListener('click', function () { if (pend.answer > 0) { pend.answer--; refresh(); } }); plus.addEventListener('click', function () { if (pend.answer < n) { pend.answer++; refresh(); } });
      row.appendChild(el('span', 'gl-note', 'ANSWER GRIEVANCES (' + G.ANSWER_COST + ' EACH, +2 TRUST): ' + pend.answer + ' OF ' + n)); row.appendChild(minus); row.appendChild(plus); ui.answer.appendChild(row);
      if (n) ui.answer.appendChild(el('p', 'gl-note', 'Open: ' + g.grievances.map(function (x) { return G.FACTION_NAME[x.f] + ' (season ' + x.season + ')'; }).join('; ')));
    }
    function drawOwners() {
      ui.owners.textContent = '';
      var head = el('tr'); ['#', 'SYSTEM', 'OWNER', 'OUT', 'FLEETS'].forEach(function (h) { head.appendChild(el('th', '', h)); }); ui.owners.appendChild(head);
      G.SYSTEMS.forEach(function (s, i) {
        var tr = el('tr', selSys === i ? 'gl-sel' : ''), b = el('button', 'gl-btn gl-small', String(i)); b.type = 'button'; b.setAttribute('aria-label', 'Show system ' + i + ' ' + s.n);
        b.addEventListener('click', function () { selSys = i; refresh(); }); var c0 = el('td'); c0.appendChild(b); tr.appendChild(c0);
        tr.appendChild(el('td', '', s.n)); tr.appendChild(el('td', '', g.owner[i] === 'N' ? 'unclaimed' : G.FACTION_NAME[g.owner[i]])); tr.appendChild(el('td', '', String(s.v)));
        tr.appendChild(el('td', '', g.fleets.filter(function (f) { return f.at === i; }).map(function (f) { return f.f + f.id + ':' + f.str; }).join(' ') || '—')); ui.owners.appendChild(tr);
      });
    }
    function drawLog() {
      ui.log.textContent = '';
      g.log.slice(0, 90).forEach(function (t) { var li = el('li', /^SEASON/.test(t) ? 'gl-season' : /^BATTLE/.test(t) ? 'gl-battle' : /^ /.test(t) ? 'gl-sub' : '', t); ui.log.appendChild(li); });
    }
    function drawHist() {
      ui.hist.textContent = '';
      var head = el('tr'); ['SEASON', 'DRIFT', 'REFORMERS', 'INDEPENDENTS', 'TREASURY', 'SYSTEMS'].forEach(function (h) { head.appendChild(el('th', '', h)); }); ui.hist.appendChild(head);
      g.history.forEach(function (h) { var tr = el('tr'); [h.season, h.drift, h.trustR, h.trustI, h.treasury, h.owned].forEach(function (v) { tr.appendChild(el('td', '', String(v))); }); ui.hist.appendChild(tr); });
    }
    function drawResult() {
      ui.result.textContent = '';
      if (!g.over) { ui.result.hidden = true; return; }
      ui.result.hidden = false;
      var e = ENDING[g.ending];
      ui.result.appendChild(el('h2', 'gl-rh', e[0])); ui.result.appendChild(el('p', 'gl-rd', e[1]));
      ui.result.appendChild(el('p', 'gl-rd', 'Season ' + g.season + ' · Drift ' + g.drift + ' · Reformers ' + g.trust.R + ' · Independents ' + g.trust.I + ' · you hold ' + g.owner.filter(function (o) { return o === 'C'; }).length + ' of 20 systems.'));
      var row = el('div', 'gl-row'), again = el('button', 'gl-btn', 'PLAY THIS SEED AGAIN'), next = el('button', 'gl-btn', 'NEW SEED'); again.type = 'button'; next.type = 'button';
      again.addEventListener('click', function () { newGame(g.seed); }); next.addEventListener('click', function () { newGame(nextSeed()); }); row.appendChild(again); row.appendChild(next); ui.result.appendChild(row);
      ui.result.setAttribute('tabindex', '-1');
    }

    function refresh() {
      var act = toAction(), err = g.over ? null : G.validateAction(g, act), left = g.treasury.C - spend(act);
      ui.status.textContent = g.over ? 'CAMPAIGN OVER · SEASON ' + g.season + ' OF ' + G.SEASONS : 'SEASON ' + (g.season + 1) + ' OF ' + G.SEASONS + ' · SEED ' + g.seed + ' · WIN: ' + G.PEACE_NEED + ' QUIET SEASONS, DRIFT UNDER ' + G.PEACE_DRIFT + ', BOTH TRUST ≥ ' + G.PEACE_TRUST + ', OR DISSOLVE THE VETO';
      ui.cost.textContent = 'TREASURY ' + g.treasury.C + ' · THIS SEASON ' + spend(act) + ' · LEFT ' + left;
      ui.cost.className = left < 0 ? 'gl-note gl-low' : 'gl-note';
      drawMeters(); drawLaws(); drawAnswer(); drawFleets(); drawSys(); drawOwners(); drawLog(); drawHist(); drawMap(); drawResult();
      ui.end.disabled = g.over || !!err; ui.end.textContent = g.over ? 'CAMPAIGN OVER' : 'END SEASON ' + (g.season + 1);
      ui.end.title = err || ''; if (err && !g.over) say(err); else if (!g.over && ui.msg.textContent === err) say('');
      ui.undo.disabled = g.plan.length === 0;
    }

    function nextSeed() { return FIRST_SEED + 7919 * (prog.played + 1); }
    function commit() {
      if (g.over) return;
      var r = G.applySeason(g, toAction()); if (r.error) { say(r.error); return; }
      g = r.game; pend = fresh();
      if (g.over) { prog.played++; if (g.won) prog.wins++; say(ENDING[g.ending][0] + '.'); }
      else say('Season ' + g.season + ' resolved. Read the log: every battle shows its arithmetic and every enemy move its reason.');
      if (!save(prog, g.plan)) say('This browser would not save your game; you can keep playing.');
      refresh(); if (g.over) { try { ui.result.focus(); } catch (e) { /* ignore */ } }
    }
    function undo() {
      if (!g.plan.length) return;
      var plan = g.plan.slice(0, -1); if (g.over) { prog.played = Math.max(0, prog.played - 1); if (g.won) prog.wins = Math.max(0, prog.wins - 1); }
      begin(g.seed, plan); save(prog, plan); say('Back to season ' + (g.season + 1) + '.');
    }
    function newGame(seed) { begin(seed, []); save(prog, []); say(seed === FIRST_SEED ? 'The first campaign.' : 'New seed ' + seed + '.'); }

    ui.canvas.addEventListener('click', function (e) {
      var i = hit(e); if (i < 0) return;
      var f = selFleet !== null ? g.fleets.filter(function (x) { return x.id === selFleet && x.f === 'C'; })[0] : null;
      if (f && (G.ADJ[f.at].indexOf(i) >= 0 || i === f.at)) { pend.orders[f.id] = i; say(i === f.at ? 'Fleet ' + f.id + ' holds.' : 'Fleet ' + f.id + ' ordered to ' + sysName(i) + '.'); }
      else { var mine = myFleets().filter(function (x) { return x.at === i; })[0]; if (mine) selFleet = mine.id; }
      selSys = i; refresh();
    });
    ui.end.addEventListener('click', commit); ui.undo.addEventListener('click', undo);
    ui.newg.addEventListener('click', function () { newGame(g.plan.length ? g.seed : nextSeed()); });
    root.document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if ((e.key === 'e' || e.key === 'E') && !g.over) { commit(); e.preventDefault(); }
    });
    var rt = 0; root.addEventListener('resize', function () { root.clearTimeout(rt); rt = root.setTimeout(drawMap, 120); });
    if (root.ResizeObserver) { try { new root.ResizeObserver(function () { root.clearTimeout(rt); rt = root.setTimeout(drawMap, 60); }).observe(ui.canvas.parentNode); } catch (e) { /* the resize listener covers it */ } }
    root.__galTest = root.location && /[?&]test=1/.test(root.location.search) ? { game: function () { return g; }, pending: function () { return pend; }, progress: function () { return prog; } } : undefined;
    begin(prog.seed, prog.plan);
    if (!prog.plan.length) say('The Court has three fleets and one decree a season. The Independent Worlds already distrust you. Read the log.');
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : this);
