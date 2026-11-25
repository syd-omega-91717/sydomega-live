/* ============================================================================
   SYD OMEGA 91717 -- THE LADDER (levels + lattice grid + gates, one page)

   levels.html, grid.html and gates.html were three views of ONE ladder: the 12
   gates of OmegaCanon.authority.  Each carried its own copy (grid: the
   thresholds and the 12 signs, with abbreviations; gates: thresholds written to
   two decimals and one rung out, with 23.20 where the canon says 23.1972;
   levels: the canon's table).  CLAUDE.md 8.1 class 8.  This module reads the
   ladder from the canon, so nothing here is a copy:

     thresholds   OmegaCanon.authority.gates
     rank names   OmegaCanon.authority.gate_names
     signs        OmegaCanon.houses[].sign

   WHAT IS PAGE-OWN (and stays hard-coded): the 12 curriculum themes of the gates
   tab (Awareness, Discipline, ...), their descriptions and domain colours, and
   the roman numerals.  Gate n unlocks when AUTH reaches the canon threshold of
   the rung BELOW it (gate 1 is open from the start), except gate 12, which opens
   at APEX itself.  That is exactly what gates.html did, with the canon's numbers.

   MEMBER DATA: attempts and mastery stay in localStorage under the keys
   gates.html used (omega_gates, omega_gate_history), so existing logs survive.
   They never leave the browser.

   No inline handlers: tabs, PASSED / FAILED and MASTER use data attributes and
   one delegated listener.  A file, so the CSP inline ratchet holds.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaLadder) return;

  var KEY = 'omega_gates', HKEY = 'omega_gate_history';
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var LV_COLORS = ['#C9A84C', '#E2C86D', '#C9A84C', '#00E5FF', '#3fb27f', '#E86A3A', '#9B6BF0', '#C9A84C', '#E2C86D', '#00E5FF', '#3fb27f', '#E2C86D'];
  var THEMES = [
    ['Gate of Awareness', 'MIND', 'Know thyself — motivations, fears, patterns, blindspots. The first gate is always self-knowledge.'],
    ['Gate of Discipline', 'BODY', '30-day unbroken streak of a chosen practice. Prove that your will can govern your body.'],
    ['Gate of Knowledge', 'INTEL', 'Master a domain to the level where you can teach it. Demonstrate command of core concepts.'],
    ['Gate of Finance', 'WEALTH', 'Build a financial foundation: income, savings rate, net worth tracking, and a written wealth plan.'],
    ['Gate of Creation', 'CRAFT', 'Ship a complete creative work: book, product, system, or art. Creation at scale proves craft.'],
    ['Gate of Tribe', 'SOCIAL', 'Build a network of 50+ meaningful connections across 3+ domains. Prove sovereign social capital.'],
    ['Gate of Leadership', 'POWER', 'Lead a group or team through a real challenge to completion. Influence without force.'],
    ['Gate of Resilience', 'TRIAL', 'Survive and grow from a significant adversity. Document the lessons. Prove antifragility.'],
    ['Gate of Contribution', 'LEGACY', 'Create something that outlasts a single interaction — content, systems, or institutions others use.'],
    ['Gate of Legacy', 'LEGACY', 'Establish a legacy vehicle: foundation, published body of work, institution, or dynasty.'],
    ['Gate of Mastery', 'APEX', 'Achieve recognized excellence in your primary domain. External validation of internal mastery.'],
    ['Gate of Apex', 'APEX', 'The final gate. AUTH = APEX. Complete sovereignty across all axes, domains, and dimensions.']
  ];
  var DOMAIN_COLORS = { MIND: '#9B6BF0', BODY: '#4CAF50', INTEL: '#00E5FF', WEALTH: '#C9A84C', CRAFT: '#FF9800', SOCIAL: '#00BCD4', POWER: '#E2C86D', TRIAL: '#FF4444', LEGACY: '#4CAF50', APEX: '#FFD700' };

  var S = { auth: 0, a: 0, b: 0, c: 0, sign: '', ready: false, canon: null };
  var gateData = {}, attemptLog = [];

  function $(id) { return document.getElementById(id); }
  var esc = (window.OmegaEsc && OmegaEsc.esc) || (function () { return ''; });
  function sid(id, v) { var el = $(id); if (el) el.textContent = String(v == null ? '--' : v); }
  function load(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function thr() { return S.canon.gates.map(Number); }
  function names() { return S.canon.gate_names.slice(); }
  /* gate n opens at the canon threshold of the rung below it; gate 1 from the start; gate 12 at APEX itself */
  function unlockAt(n) { var t = thr(); return n === 1 ? 0 : n === 12 ? t[11] : t[n - 2]; }

  /* ---------------- static build (needs the canon) ---------------- */
  function buildStatic() {
    var T = thr(), N = names();
    var lg = $('level-grid');
    if (lg) lg.innerHTML = N.map(function (name, i) {
      var col = LV_COLORS[i];
      return '<div class="lv-card card" id="lvc-' + esc(i + 1) + '" style="--lvc:' + esc(col) + '">'
        + '<div style="font-family:var(--D);font-size:28px;color:' + esc(col) + '">' + esc(i + 1) + '</div>'
        + '<div style="font-family:var(--D);font-size:12px;color:var(--ink);margin:4px 0">' + esc(name) + '</div>'
        + '<div style="font-family:var(--M);font-size:12px;color:var(--muted);margin-bottom:6px">AUTH &ge; ' + esc(T[i]) + '</div>'
        + '<div style="font-family:var(--M);font-size:12px;padding:2px 8px;border:1px solid rgba(138,134,118,.3);border-radius:10px;color:var(--muted)" id="lvst-' + esc(i + 1) + '">LOCKED</div>'
        + '</div>';
    }).join('');
    var tl = $('thresh-list');
    if (tl) tl.innerHTML = N.map(function (name, i) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:6px 10px;border:1px solid var(--line);border-left:3px solid ' + esc(LV_COLORS[i]) + '">'
        + '<span style="font-family:var(--M);font-size:12px;min-width:30px;color:' + esc(LV_COLORS[i]) + '">LV ' + esc(i + 1) + '</span>'
        + '<span style="font-family:var(--D);font-size:12px;color:var(--ink);flex:1">' + esc(name) + '</span>'
        + '<span style="font-family:var(--M);font-size:12px;color:var(--muted)">AUTH &ge; ' + esc(T[i]) + '</span></div>';
    }).join('');
    var head = $('grd-head');
    if (head && !head.dataset.built) {
      head.dataset.built = '1';
      var signs = (window.OmegaCanon && OmegaCanon.houses || []).map(function (h) { return String(h.sign || ''); });
      signs.forEach(function (sg) {
        var d = document.createElement('div');
        d.title = sg; d.textContent = sg.slice(0, 3).toUpperCase();
        d.style.cssText = 'font-family:var(--M);font-size:12px;letter-spacing:1px;color:var(--muted);padding:7px 4px;text-align:center;border-bottom:1px solid var(--line)';
        head.appendChild(d);
      });
      head.style.gridTemplateColumns = 'repeat(' + (signs.length + 1) + ',minmax(24px,1fr))';
      S.signCount = signs.length;
    }
    var sel = $('a-gate');
    if (sel) sel.innerHTML = THEMES.map(function (g, i) { return '<option value="' + esc(i + 1) + '">Gate ' + esc(i + 1) + ': ' + esc(g[0]) + '</option>'; }).join('');
  }

  /* ---------------- levels ---------------- */
  function renderLevels() {
    var T = thr(), N = names(), auth = S.auth, idx = -1;
    T.forEach(function (t, i) { if (auth >= t) idx = i; });
    T.forEach(function (t, i) {
      var card = $('lvc-' + (i + 1)), st = $('lvst-' + (i + 1));
      if (auth >= t) {
        if (card) card.classList.add('earned');
        if (st) { st.textContent = 'EARNED'; st.style.cssText = 'font-family:var(--M);font-size:12px;padding:2px 8px;border:1px solid rgba(63,178,127,.4);border-radius:10px;color:var(--green);background:rgba(63,178,127,.08)'; }
      }
    });
    sid('my-lv-num', idx >= 0 ? idx + 1 : 1);
    sid('my-lv-name', idx >= 0 ? N[idx] : N[0]);
    sid('my-lv-next', idx + 1 < 12 ? 'NEXT: ' + N[idx + 1] + ' at AUTH ≥ ' + T[idx + 1] : 'APEX SOVEREIGN — LATTICE COMPLETE');
    var apex = Number(S.canon.apex) || T[11];
    var pct = (auth / apex * 100).toFixed(1), ring = $('my-auth-ring');
    if (ring) setTimeout(function () { ring.style.setProperty('--p', Math.min(100, pct) + '%'); }, 100);
    sid('my-auth-pct', pct + '%');
  }

  /* ---------------- grid ---------------- */
  function renderGrid() {
    var T = thr(), auth = S.auth, tb = $('grd-tbody'), cols = S.signCount || 12;
    var gateIdx = T.findIndex(function (t) { return auth < t; });
    if (gateIdx < 0) gateIdx = 11; else if (gateIdx > 0) gateIdx -= 1;
    sid('grd-my-sign', (S.sign || '--').toUpperCase());
    sid('grd-my-auth', auth.toFixed(3));
    sid('grd-my-gate', 'GATE ' + ROMAN[gateIdx]);
    if (tb) {
      var html = '';
      ROMAN.forEach(function (g, gi) {
        html += '<div class="tbl-row" style="display:grid;grid-template-columns:repeat(' + esc(cols + 1) + ',minmax(24px,1fr));gap:0;border-bottom:1px solid rgba(201,168,76,.06)"><div style="font-family:var(--M);font-size:12px;color:var(--cyan);white-space:nowrap;padding:3px 6px">' + esc(g) + '</div>';
        for (var k = 0; k < cols; k++) {
          var cls = auth >= T[gi] ? (gi === 11 ? 'gc-apex' : 'gc-done') : (auth >= T[Math.max(0, gi - 1)] && gi === Math.ceil(auth / T[11] * 11) ? 'gc-active' : 'gc-locked');
          html += '<div style="padding:3px"><div class="gc ' + esc(cls) + '">' + esc(g) + '</div></div>';
        }
        html += '</div>';
      });
      tb.innerHTML = html;
    }
    var pb = $('grd-path-bars');
    if (pb) {
      var ph = '';
      ROMAN.forEach(function (g, gi) {
        var done = auth >= T[gi], active = !done && (gi === 0 || auth >= T[gi - 1]);
        var color = done ? 'var(--solar)' : active ? 'var(--cyan)' : 'rgba(255,255,255,.06)';
        var tc = done ? 'var(--solar)' : active ? 'var(--cyan)' : 'var(--muted)';
        var lo = T[Math.max(0, gi - 1)], pct = done ? 100 : active ? Math.round((auth - lo) / (T[gi] - lo) * 100) : 0;
        ph += '<div style="display:flex;align-items:center;gap:10px"><span style="font-family:var(--M);font-size:12px;color:' + esc(tc) + ';width:70px">GATE ' + esc(g) + '</span>'
          + '<div style="flex:1;height:5px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden"><div style="width:' + esc(pct) + '%;height:100%;background:' + esc(color) + '"></div></div>'
          + '<span style="font-family:var(--M);font-size:12px;color:var(--muted);width:45px;text-align:right">' + esc(T[gi]) + '</span></div>';
      });
      pb.innerHTML = ph;
    }
  }

  /* ---------------- gates ---------------- */
  function statusOf(n) {
    if (gateData[n] && gateData[n].mastered) return 'mastered';
    return S.auth >= unlockAt(n) ? 'open' : 'locked';
  }
  function renderGates() {
    var grid = $('gate-grid'); if (!grid) return;
    var open = 0, mastered = 0, locked = 0;
    grid.innerHTML = THEMES.map(function (g, i) {
      var n = i + 1, st = statusOf(n), dc = DOMAIN_COLORS[g[1]] || '#888';
      if (st === 'mastered') mastered++; else if (st === 'open') open++; else locked++;
      var attempts = (gateData[n] && gateData[n].attempts) || 0, passes = (gateData[n] && gateData[n].passes) || 0;
      return '<div style="border:1px solid ' + esc(st === 'mastered' ? dc : st === 'open' ? 'rgba(201,168,76,.35)' : 'var(--line)') + ';background:rgba(10,10,15,' + esc(st === 'locked' ? '.3' : '.55') + ');padding:14px;border-radius:2px;opacity:' + esc(st === 'locked' ? '.5' : '1') + '">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        + '<div style="font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted)">GATE ' + esc(n) + '</div>'
        + '<div style="font-family:var(--M);font-size:12px;letter-spacing:1px;color:' + esc(dc) + ';border:1px solid ' + esc(dc) + ';padding:1px 5px">' + esc(g[1]) + '</div>'
        + (st === 'mastered' ? '<div style="font-family:var(--M);font-size:12px;color:var(--green);margin-left:auto">&#10003; MASTERED</div>'
          : st === 'open' ? '<div style="font-family:var(--M);font-size:12px;color:var(--gold);margin-left:auto">UNLOCKED</div>'
            : '<div style="font-family:var(--M);font-size:12px;color:var(--muted);margin-left:auto">&#9635; AUTH&ge;' + esc(unlockAt(n).toFixed(2)) + '</div>')
        + '</div>'
        + '<div style="font-family:var(--D);font-size:12px;color:' + esc(st === 'mastered' ? dc : st === 'open' ? 'var(--gold)' : 'var(--muted)') + ';margin-bottom:2px">' + esc(g[0]) + '</div>'
        + '<div style="font-family:var(--M);font-size:12px;color:var(--muted);margin-bottom:6px">RANK ' + esc(names()[i]) + '</div>'
        + '<div style="font-size:12px;color:var(--ink);opacity:.75;line-height:1.6;margin-bottom:8px">' + esc(g[2]) + '</div>'
        + (st !== 'locked' ? '<div style="display:flex;gap:8px;margin-top:6px">'
          + '<div style="font-family:var(--M);font-size:12px;color:var(--muted)">' + esc(attempts) + ' attempts</div>'
          + '<div style="font-family:var(--M);font-size:12px;color:var(--green)">' + esc(passes) + ' passed</div>'
          + (st === 'open' ? '<button type="button" data-master="' + esc(n) + '" style="margin-left:auto;background:rgba(63,178,127,.15);border:1px solid var(--green);color:var(--green);font-family:var(--M);font-size:12px;padding:3px 8px;cursor:pointer">MARK MASTERED</button>' : '')
          + '</div>' : '')
        + '</div>';
    }).join('');
    sid('k-open', open); sid('k-mastered', mastered); sid('k-locked', locked);
  }
  function renderHistory() {
    var el = $('history-list'); if (!el) return;
    if (!attemptLog.length) { el.innerHTML = '<div style="font-family:var(--M);font-size:12px;color:var(--muted);text-align:center;padding:20px">NO ATTEMPTS LOGGED YET</div>'; return; }
    el.innerHTML = [].concat(attemptLog).reverse().slice(0, 50).map(function (h) {
      var pass = h.outcome === 'pass';
      return '<div style="border:1px solid var(--line);border-left:3px solid ' + esc(pass ? 'var(--green)' : '#FF4444') + ';background:rgba(10,10,15,.45);padding:12px;border-radius:2px">'
        + '<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">'
        + '<div style="font-family:var(--M);font-size:12px;color:' + esc(pass ? 'var(--green)' : '#FF4444') + '">' + esc(pass ? 'PASSED' : 'FAILED') + '</div>'
        + '<div style="font-family:var(--D);font-size:12px;color:var(--gold)">' + esc(h.gateTitle) + '</div>'
        + '<div style="font-family:var(--M);font-size:12px;color:var(--muted);margin-left:auto">' + esc(h.date) + '</div></div>'
        + (h.notes ? '<div style="font-size:12px;color:var(--ink);opacity:.75">' + esc(h.notes) + '</div>' : '') + '</div>';
    }).join('');
  }

  function notice(msg) { var el = $('a-note'); if (el) el.textContent = msg || ''; }
  function masterGate(n) {
    if (!gateData[n]) gateData[n] = { attempts: 0, passes: 0 };
    gateData[n].mastered = true; gateData[n].masteredDate = new Date().toISOString().slice(0, 10);
    /* a write that does not land must not read as success (CLAUDE.md 8.1 class 1) */
    if (!save(KEY, gateData)) { delete gateData[n].mastered; notice('COULD NOT SAVE: this browser refused to store the mark. Nothing was recorded.'); return; }
    notice(''); renderGates();
  }
  function logAttempt(outcome) {
    var sel = $('a-gate'), n = parseInt(sel && sel.value, 10), g = THEMES[n - 1];
    if (!g) return;
    var notes = ($('a-notes') && $('a-notes').value || '').trim();
    var before = JSON.parse(JSON.stringify(gateData)), hbefore = attemptLog.slice();
    if (!gateData[n]) gateData[n] = { attempts: 0, passes: 0 };
    gateData[n].attempts++; if (outcome === 'pass') gateData[n].passes++;
    attemptLog.push({ gid: n, gateTitle: g[0], outcome: outcome, notes: notes, date: new Date().toISOString().slice(0, 10) });
    if (!save(KEY, gateData) || !save(HKEY, attemptLog)) { gateData = before; attemptLog = hbefore; notice('COULD NOT SAVE: this browser refused to store the attempt. Nothing was recorded.'); return; }
    notice(outcome === 'pass' ? 'LOGGED: PASSED' : 'LOGGED: FAILED');
    if ($('a-notes')) $('a-notes').value = '';
    renderGates(); renderHistory();
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['all', 'structure', 'my', 'grid', 'gates', 'attempt', 'history', 'science'];
  function setTab(name) {
    if (TABS.indexOf(name) < 0) return;
    Array.prototype.forEach.call(document.querySelectorAll('.tab-btn'), function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-panel'), function (p) { var on = p.id === 'tab-' + name; p.style.display = on ? 'block' : 'none'; p.classList.toggle('active', on); });
    try { if (history_replace) history_replace('#' + name); } catch (e) { /* the hash is a convenience */ }
  }
  var history_replace = function (h) { if (window.history && window.history.replaceState) window.history.replaceState(null, '', h); };

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-tab],[data-master],[data-attempt]') : null;
    if (!t) return;
    if (t.hasAttribute('data-tab')) setTab(t.getAttribute('data-tab'));
    else if (t.hasAttribute('data-master')) masterGate(parseInt(t.getAttribute('data-master'), 10));
    else if (t.hasAttribute('data-attempt')) logAttempt(t.getAttribute('data-attempt'));
  });

  /* ---------------- boot ---------------- */
  function ready() { return !!(window.OmegaCanon && OmegaCanon.authority && OmegaCanon.authority.gates && OmegaCanon.authority.gates.length === 12 && OmegaCanon.houses && OmegaCanon.houses.length); }
  function paint() {
    S.canon = OmegaCanon.authority; S.ready = true;
    gateData = load(KEY, {}); attemptLog = load(HKEY, []);
    buildStatic(); renderLevels(); renderGrid(); renderGates(); renderHistory();
  }
  function whenReady() {
    var tries = 0;
    (function poll() {
      if (ready()) return paint();
      if (++tries > 150) { var lg = $('level-grid'); if (lg && !lg.children.length) lg.textContent = 'LADDER UNAVAILABLE: the canon did not load.'; return; }
      setTimeout(poll, 100);
    })();
  }
  window.OmegaLadder = {
    /* called by the page once the member's profile is read: { auth, a, b, c, sign } */
    update: function (p) {
      S.auth = Number(p.auth) || 0; S.a = Number(p.a) || 0; S.b = Number(p.b) || 0; S.c = Number(p.c) || 0; S.sign = p.sign || '';
      sid('hdr-auth', S.auth.toFixed(4)); sid('stat-auth', S.auth.toFixed(4)); sid('stat-a', S.a.toFixed(3)); sid('stat-b', S.b.toFixed(3)); sid('stat-c', S.c.toFixed(3));
      sid('g-stat-auth', S.auth.toFixed(4)); sid('g-stat-a', S.a.toFixed(3)); sid('g-stat-b', S.b.toFixed(3)); sid('g-stat-c', S.c.toFixed(3));
      if (S.ready) { renderLevels(); renderGrid(); renderGates(); }
    },
    status: function () { return { ready: S.ready, auth: S.auth, tabs: TABS.slice(), signs: S.signCount || 0 }; },
    setTab: setTab
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { whenReady(); var h = (location.hash || '').slice(1); if (TABS.indexOf(h) > -1) setTab(h); });
  else { whenReady(); var h0 = (location.hash || '').slice(1); if (TABS.indexOf(h0) > -1) setTab(h0); }
})();
