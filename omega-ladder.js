/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-ladder.js  (ladder.html only)

   LADDER: the 12 gates of authority as one climb. It replaces grades, levels,
   phases, ascension and grid, which drew the same 12 rungs five ways -- four
   of them from a hard-coded threshold curve (2.32, 3.98, 5.95 ...) that is
   not the canon's (2.3197, 4.6394, 6.9592 ...), so a member's gate depended
   on which page they opened (CLAUDE.md 8.1 class 8).

   Every number comes from its owner:
     thresholds, phi, e   OmegaCanon.structure (omega-canon.json)
     gate names           OmegaCanon.authority.gate_names
     honors per rung      OmegaCanon.tracks[n].medal / trophy / certificate
     the member           rpc('my_matrix') + own certificates / medals / trophies
   The WHAT-IF panel is a simulation and is labelled as one; it writes nothing.
   ========================================================================== */
import { createClient } from '/vendor/supabase-js.js';

var sb = window.__omegaSb || (window.__omegaSb = createClient(
  'https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

var S = { th: [], names: [], tracks: [], phi: 0, e: 0, apex: 0, axes: [], me: null, sim: null, sel: 0, won: { medal: {}, trophy: {}, certificate: {} } };
var $ = function (id) { return document.getElementById(id); };
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* authority = sqrt(A^3 + B^3 + C^3) x phi / e -- the canon's formula, the one
   compute_authority() implements server-side. Used only for the simulation;
   the member's own value always comes from my_matrix. */
function authority(a, b, c) { return Math.sqrt(a * a * a + b * b * b + c * c * c) * S.phi / S.e; }
/* index of the highest gate reached, -1 below the first */
function gateOf(auth) { var g = -1; for (var i = 0; i < S.th.length; i++) if (auth >= S.th[i]) g = i; return g; }
function yOf(auth) { return Math.max(0, Math.min(100, auth / S.apex * 100)); }
function cap(s) { s = String(s || ''); return s.charAt(0) + s.slice(1).toLowerCase(); }

function buildRungs() {
  /* omg-no-tilt: bg.js lifts hovered buttons with translateZ(8px); adjacent
     rungs then overlap in the hit test and a click lands on the neighbour. */
  $('lad-rungs').innerHTML = S.th.map(function (t, i) {
    return '<button type="button" class="lad-rung omg-no-tilt" data-i="' + i + '" data-omega-task-id="ladder.rung.select" style="--h:' + yOf(t).toFixed(2) + '%"' +
      ' aria-label="Gate ' + (i + 1) + ', ' + esc(S.names[i]) + ', at authority ' + t + '">' +
      '<b>' + (i + 1) + '</b><i>' + esc(cap(S.names[i])) + '</i></button>';
  }).join('');
  $('lad-rungs').onclick = function (e) { var b = e.target.closest('.lad-rung'); if (b) { S.sel = +b.dataset.i; paint(); } };
}

function paintNow() {
  var a = S.me ? Number(S.me.authority) : null;
  var g = a == null ? -1 : gateOf(a);
  $('lad-auth').textContent = a == null ? '–' : a.toFixed(4);
  $('lad-gate').textContent = g < 0 ? 'BELOW GATE 1' : 'GATE ' + (g + 1) + ' · ' + S.names[g];
  if (a != null && g < S.th.length - 1) {
    var lo = g < 0 ? 0 : S.th[g], hi = S.th[g + 1];
    $('lad-next').textContent = (hi - a).toFixed(4) + ' TO ' + S.names[g + 1];
    $('lad-prog').style.width = Math.max(0, Math.min(100, (a - lo) / (hi - lo) * 100)).toFixed(1) + '%';
  } else if (a != null) { $('lad-next').textContent = 'APEX REACHED'; $('lad-prog').style.width = '100%'; }
  $('lad-mark').style.setProperty('--y', (a == null ? 0 : yOf(a)) + '%');
  $('lad-mark').hidden = a == null;
  var n = function (o) { return Object.keys(o).length; };
  $('lad-honors').innerHTML = [['MEDALS', n(S.won.medal)], ['TROPHIES', n(S.won.trophy)], ['CERTS', n(S.won.certificate)]]
    .map(function (x) { return '<div><b>' + x[1] + '<small style="font-size:12px;color:var(--muted)">/12</small></b><span>' + x[0] + '</span></div>'; }).join('');
  document.querySelectorAll('.lad-rung').forEach(function (r) {
    var i = +r.dataset.i;
    r.classList.toggle('done', i <= g);
    r.classList.toggle('here', i === g + 1);
    r.setAttribute('aria-pressed', i === S.sel);
  });
}

function paintPanel() {
  var i = S.sel, t = S.tracks[i] || {}, a = S.me ? Number(S.me.authority) : null;
  var gap = a == null ? '' : a >= S.th[i] ? 'Reached.' : (S.th[i] - a).toFixed(4) + ' authority to go.';
  var hon = [['MEDAL', 'medal'], ['TROPHY', 'trophy'], ['CERTIFICATE', 'certificate']].map(function (h) {
    var won = !!S.won[h[1]][i + 1];
    return '<div class="lad-hon' + (won ? ' won' : '') + '"><b>' + h[0] + (won ? ' · EARNED' : '') + '</b><span>' + esc(t[h[1]] || '') + '</span></div>';
  }).join('');
  $('lad-panel').innerHTML = '<div class="lad-p-h"><b>' + esc(S.names[i]) + '</b><span>GATE ' + (i + 1) + ' · ' + S.th[i] + '</span></div>' +
    (gap ? '<div class="lad-gap">' + gap + '</div>' : '') + '<div class="lad-trio">' + hon + '</div>';
}

function buildSim() {
  var start = S.me ? [Number(S.me.a), Number(S.me.b), Number(S.me.c)] : [0.001, 0.001, 0.001];
  S.sim = start.slice();
  $('lad-sliders').innerHTML = S.axes.map(function (name, k) {
    return '<label class="lad-sl"><span>' + esc(name) + '</span>' +
      '<input type="range" min="0" max="9" step="0.01" value="' + start[k] + '" data-k="' + k + '" aria-label="' + esc(name) + ' (simulated)">' +
      '<output>' + start[k].toFixed(2) + '</output></label>';
  }).join('');
  $('lad-sliders').oninput = function (e) {
    var k = e.target.dataset.k; if (k == null) return;
    S.sim[k] = Number(e.target.value); e.target.nextElementSibling.textContent = S.sim[k].toFixed(2); paintSim(true);
  };
  $('lad-reset').onclick = function () { buildSim(); paintSim(false); };
}

function paintSim(moved) {
  var a = authority(S.sim[0], S.sim[1], S.sim[2]), g = gateOf(a);
  $('lad-sim-auth').textContent = a.toFixed(4);
  $('lad-sim-gate').textContent = 'SIMULATED · ' + (g < 0 ? 'BELOW GATE 1' : 'GATE ' + (g + 1) + ' ' + S.names[g]);
  var ghost = $('lad-ghost'); ghost.hidden = !moved; ghost.style.setProperty('--y', yOf(a) + '%');
}

function paint() { paintNow(); paintPanel(); }

async function loadMember(uid) {
  var res = await Promise.all([
    sb.rpc('my_matrix'),
    sb.from('medals').select('medal_num').eq('user_id', uid),
    sb.from('trophies').select('trophy_num').eq('user_id', uid),
    sb.from('certificates').select('cert_num').eq('user_id', uid)
  ]);
  if (!res[0].error) S.me = (res[0].data || [])[0] || null;
  [['medal', 'medal_num', res[1]], ['trophy', 'trophy_num', res[2]], ['certificate', 'cert_num', res[3]]].forEach(function (x) {
    if (x[2].error) return;
    (x[2].data || []).forEach(function (r) { if (r[x[1]] != null) S.won[x[0]][r[x[1]]] = true; });
  });
}

function start(uid) {
  var C = window.OmegaCanon, st = C.structure || {};
  S.th = (st.gate_thresholds || []).map(Number);
  S.names = ((C.authority && C.authority.gate_names) || []).slice();
  S.tracks = (C.tracks || []).slice(0, 12);
  S.phi = Number(st.authority_phi); S.e = Number(st.authority_e);
  S.apex = Number(st.authority_apex) || S.th[S.th.length - 1];
  S.axes = (st.axes_names || ['A', 'B', 'C']).map(function (n) { return String(n).replace(/\s*\([ABC]\)$/, '').toUpperCase(); });
  if (S.th.length !== 12 || S.names.length !== 12 || !S.phi || !S.e) { console.error('[ladder] canon incomplete'); return; }
  buildRungs();
  loadMember(uid).catch(function (e) { console.warn('[ladder] member record unavailable', e); }).then(function () {
    var g = S.me ? gateOf(Number(S.me.authority)) : -1;
    S.sel = Math.min(11, g + 1);
    buildSim(); paint(); paintSim(false);
  });
}

(async function () {
  try {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) { location.replace('/account.html'); return; }
    var pr = (await sb.from('profiles').select('*').eq('id', s.user.id).maybeSingle()).data || {};
    if (!pr.is_owner && !pr.access_approved) { location.replace('/pending.html'); return; }
    if (!pr.is_owner && pr.is_trial && pr.trial_expires_at && new Date(pr.trial_expires_at) <= new Date()) { location.replace('/pending.html?expired=1'); return; }
    document.getElementById('app').style.display = 'flex';
    if (window.__omegaPopulate) window.__omegaPopulate(pr, s.user);
    window.__omegaUserLoaded = true;
    var tries = 0;
    (function wait() {
      if (window.OmegaCanon && window.OmegaCanon.onReady) window.OmegaCanon.onReady(function () { start(s.user.id); });
      else if (++tries < 200) setTimeout(wait, 50);
      else console.warn('[ladder] OmegaCanon never loaded');
    })();
  } catch (e) { document.getElementById('app').style.display = 'flex'; console.warn(e); }
})();
