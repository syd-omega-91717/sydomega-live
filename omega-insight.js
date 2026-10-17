/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-insight.js  (insight.html only)

   INSIGHT: the member's evidence graph as one view with four lenses. The
   same nodes animate between layouts instead of living on six pages
   (graph-explorer, graph-timeline, graph-centrality, graph-anomalies,
   graph-evidence, graphify), which each read the same four tables.

   The graph is real and owned: public.project_task_completion_to_graph()
   projects every task completion into an `event` entity linked to its
   progression-axis `concept`, with one evidence row and one event
   (migration 20261004082748). RLS returns only the member's own rows (the
   owner sees all). Nothing here writes; verification and deletion stay on
   graph-admin.html, the owner's tool.

   ANOMALIES are computed checks with stated rules, never a score:
     orphan          entity with no relationship
     unverified      entity.verified is false
     low confidence  confidence_score below 0.5
     unreviewed      evidence not human_verified
   ========================================================================== */
import { createClient } from '/vendor/supabase-js.js';

var sb = window.__omegaSb || (window.__omegaSb = createClient(
  'https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

var W = 1000, H = 620, NS = 'http://www.w3.org/2000/svg';
var LENSES = [['graph', 'GRAPH'], ['time', 'TIMELINE'], ['central', 'CENTRALITY'], ['anomaly', 'ANOMALIES']];
var COL = { concept: '#C9A84C', event: '#00E5FF' };
var S = { lens: 'graph', ents: [], rels: [], evts: [], evid: [], byId: {}, deg: {}, flags: {}, pos: {}, sel: null, find: '' };
var $ = function (id) { return document.getElementById(id); };
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function day(iso) { return iso ? String(iso).slice(0, 10) : '–'; }
function name(e) { return e.display_name || e.canonical_name || 'Unnamed'; }
/* Hubs sit close together in the tighter lenses; the full name stays in the panel. */
function hubLabel(e) { return name(e).replace(/^progression\s+/i, '').toUpperCase(); }
function el(tag, attrs) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }

/* ── derived facts ──────────────────────────────────────────────────── */
function derive() {
  S.byId = {}; S.deg = {}; S.flags = {};
  S.ents.forEach(function (e) { S.byId[e.id] = e; S.deg[e.id] = 0; });
  S.rels.forEach(function (r) {
    if (S.deg[r.source_entity_id] != null) S.deg[r.source_entity_id]++;
    if (S.deg[r.target_entity_id] != null) S.deg[r.target_entity_id]++;
  });
  var unreviewed = {};
  S.evid.forEach(function (v) { if (!v.human_verified && v.graph_entity_id) unreviewed[v.graph_entity_id] = true; });
  S.ents.forEach(function (e) {
    var f = [];
    if (!S.deg[e.id]) f.push('orphan');
    if (!e.verified) f.push('unverified');
    if (e.confidence_score != null && Number(e.confidence_score) < 0.5) f.push('low confidence');
    if (unreviewed[e.id]) f.push('unreviewed evidence');
    S.flags[e.id] = f;
  });
}

/* ── layouts: every lens is a position per entity ───────────────────── */
function layout(lens) {
  var P = {}, concepts = S.ents.filter(function (e) { return e.entity_type === 'concept'; }),
      others = S.ents.filter(function (e) { return e.entity_type !== 'concept'; });
  if (lens === 'graph') {
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.24;
    concepts.forEach(function (c, i) {
      var a = (i / Math.max(1, concepts.length)) * Math.PI * 2 - Math.PI / 2;
      P[c.id] = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    });
    var hubOf = {};
    S.rels.forEach(function (r) {
      if (S.byId[r.target_entity_id] && S.byId[r.target_entity_id].entity_type === 'concept') hubOf[r.source_entity_id] = r.target_entity_id;
    });
    var groups = {};
    others.forEach(function (e) { var h = hubOf[e.id] || '_'; (groups[h] = groups[h] || []).push(e); });
    Object.keys(groups).forEach(function (h) {
      var g = groups[h], base = P[h] || [cx, cy], ring = h === '_' ? Math.min(W, H) * 0.44 : 96;
      g.forEach(function (e, i) {
        var a = (i / g.length) * Math.PI * 2 + (h === '_' ? 0 : Math.atan2(base[1] - cy, base[0] - cx) * 0.3);
        var r = ring + (i % 2) * 26;
        P[e.id] = h === '_' ? [cx + r * Math.cos(a), cy + r * Math.sin(a)] : [base[0] + r * Math.cos(a), base[1] + r * Math.sin(a)];
      });
    });
  } else if (lens === 'time') {
    var t = function (e) { return new Date(e.first_seen_at || e.last_updated_at || 0).getTime(); };
    var ts = S.ents.map(t).filter(function (x) { return x > 0; });
    var lo = Math.min.apply(null, ts), hi = Math.max.apply(null, ts), span = Math.max(1, hi - lo);
    var lanes = concepts.map(function (c) { return c.id; });
    var hub = {};
    S.rels.forEach(function (r) { hub[r.source_entity_id] = r.target_entity_id; });
    concepts.forEach(function (c, i) { P[c.id] = [60, 90 + i * ((H - 160) / Math.max(1, lanes.length - 1 || 1))]; });
    others.forEach(function (e, i) {
      var lane = lanes.indexOf(hub[e.id]); var y = lane < 0 ? H - 50 : P[lanes[lane]][1];
      P[e.id] = [140 + (t(e) - lo) / span * (W - 190), y + ((i % 3) - 1) * 14];
    });
  } else if (lens === 'central') {
    var ranked = S.ents.slice().sort(function (a, b) { return S.deg[b.id] - S.deg[a.id]; });
    var cols = Math.ceil(Math.sqrt(ranked.length * 1.6));
    ranked.forEach(function (e, i) {
      var row = Math.floor(i / cols), col = i % cols;
      P[e.id] = [90 + col * ((W - 180) / Math.max(1, cols - 1)), 90 + row * 110];
    });
  } else {
    var bad = S.ents.filter(function (e) { return S.flags[e.id].length; }), good = S.ents.filter(function (e) { return !S.flags[e.id].length; });
    [bad, good].forEach(function (set, k) {
      set.forEach(function (e, i) {
        var per = Math.max(1, Math.ceil(set.length / 2));
        P[e.id] = [(k ? W * 0.55 : 60) + (i % per) * ((W * 0.4) / per), 140 + Math.floor(i / per) * 120 + (k ? 0 : 0)];
      });
    });
  }
  return P;
}

function radius(e) {
  var base = e.entity_type === 'concept' ? 22 : 11;
  return S.lens === 'central' ? base + Math.min(26, S.deg[e.id] * 3) : base;
}

/* ── draw ───────────────────────────────────────────────────────────── */
function draw() {
  var nodes = $('ins-nodes'), edges = $('ins-edges'), labels = $('ins-labels');
  if (!nodes.childNodes.length) {
    S.rels.forEach(function (r) { edges.appendChild(el('line', { 'data-s': r.source_entity_id, 'data-t': r.target_entity_id })); });
    S.ents.forEach(function (e) {
      var g = el('g', { class: 'ins-node', tabindex: '0', role: 'button', 'data-id': e.id, 'aria-label': name(e) });
      g.appendChild(el('circle', { cx: 0, cy: 0, r: radius(e), fill: COL[e.entity_type] || '#AB82F2' }));
      nodes.appendChild(g);
      var l = document.createElement('div'); l.className = 'ins-lbl' + (e.entity_type === 'concept' ? ' axis' : ''); l.dataset.id = e.id;
      labels.appendChild(l);
    });
    nodes.onclick = function (ev) { var g = ev.target.closest('.ins-node'); if (g) select(g.dataset.id); };
    nodes.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { var g = ev.target.closest('.ins-node'); if (g) { ev.preventDefault(); select(g.dataset.id); } } };
  }
  S.pos = layout(S.lens);
  nodes.querySelectorAll('.ins-node').forEach(function (g) {
    var id = g.dataset.id, p = S.pos[id] || [W / 2, H / 2], e = S.byId[id];
    g.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
    g.querySelector('circle').setAttribute('r', radius(e));
    var q = S.find; g.classList.toggle('dim', !!q && name(e).toLowerCase().indexOf(q) < 0);
    g.classList.toggle('sel', id === S.sel);
    g.classList.toggle('flag', S.lens === 'anomaly' && S.flags[id].length > 0);
  });
  edges.classList.toggle('off', S.lens !== 'graph');
  edges.querySelectorAll('line').forEach(function (ln) {
    var a = S.pos[ln.dataset.s], b = S.pos[ln.dataset.t]; if (!a || !b) return;
    ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]); ln.setAttribute('x2', b[0]); ln.setAttribute('y2', b[1]);
    ln.classList.toggle('hot', ln.dataset.s === S.sel || ln.dataset.t === S.sel);
  });
  labels.querySelectorAll('.ins-lbl').forEach(function (l) {
    var p = S.pos[l.dataset.id]; if (!p) return;
    var e = S.byId[l.dataset.id], off = e.entity_type === 'concept' ? radius(e) + 16 : 0;
    l.style.left = (p[0] / W * 100) + '%'; l.style.top = ((p[1] + off) / H * 100) + '%';
    l.textContent = e.entity_type === 'concept' ? hubLabel(e) : (l.dataset.id === S.sel ? name(e) : '');
  });
  $('ins-axes').innerHTML = S.lens === 'time' ? '<line x1="130" y1="' + (H - 20) + '" x2="' + (W - 40) + '" y2="' + (H - 20) + '"/>' : '';
  $('ins-lens').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.lens === S.lens); });
}

function kpis() {
  var flagged = S.ents.filter(function (e) { return S.flags[e.id].length; }).length;
  var verified = S.evid.filter(function (v) { return v.human_verified; }).length;
  $('ins-kpis').innerHTML = [['ENTITIES', S.ents.length], ['LINKS', S.rels.length], ['EVENTS', S.evts.length],
    [S.evid.length ? 'EVIDENCE · ' + verified + ' REVIEWED' : 'EVIDENCE', S.evid.length], ['FLAGGED', flagged, flagged ? 'warn' : '']]
    .map(function (k) { return '<div class="ins-kpi ' + (k[2] || '') + '"><b>' + k[1] + '</b><span>' + k[0] + '</span></div>'; }).join('');
}

/* ── panel ──────────────────────────────────────────────────────────── */
function panelOverview() {
  var title = { graph: 'Your graph', time: 'In order', central: 'Most connected', anomaly: 'Needs attention' }[S.lens];
  var list = S.ents.slice();
  if (S.lens === 'central') list.sort(function (a, b) { return S.deg[b.id] - S.deg[a.id]; });
  else if (S.lens === 'time') list.sort(function (a, b) { return String(b.first_seen_at).localeCompare(String(a.first_seen_at)); });
  else if (S.lens === 'anomaly') list = list.filter(function (e) { return S.flags[e.id].length; });
  var rows = list.slice(0, 40).map(function (e) {
    var right = S.lens === 'central' ? S.deg[e.id] + ' links' : S.lens === 'anomaly' ? S.flags[e.id].join(', ') : day(e.first_seen_at);
    return '<button type="button" class="ins-li" data-omega-task-id="insight.node.select" data-id="' + esc(e.id) + '"><span>' + esc(name(e)) + '</span><em>' + esc(right) + '</em></button>';
  }).join('');
  $('ins-panel').innerHTML = '<h3>' + title + '</h3>' + (rows ? '<div class="ins-list">' + rows + '</div>' :
    '<div class="ins-row"><em>NOTHING</em><span>' + (S.lens === 'anomaly' ? 'No entity fails a check.' : 'No entities yet.') + '</span></div>');
  bindList();
}

function panelNode(id) {
  var e = S.byId[id]; if (!e) return panelOverview();
  var links = S.rels.filter(function (r) { return r.source_entity_id === id || r.target_entity_id === id; });
  var ev = S.evid.filter(function (v) { return v.graph_entity_id === id; });
  var evts = S.evts.filter(function (x) { return x.entity_id === id; });
  var flags = S.flags[id];
  var h = '<h3>' + esc(name(e)) + '</h3><div>' +
    '<span class="ins-tag">' + esc(e.entity_type) + '</span>' +
    '<span class="ins-tag ' + (e.verified ? 'ok' : 'warn') + '">' + (e.verified ? 'VERIFIED' : 'UNVERIFIED') + '</span>' +
    flags.filter(function (f) { return f !== 'unverified'; }).map(function (f) { return '<span class="ins-tag warn">' + esc(f.toUpperCase()) + '</span>'; }).join('') + '</div>';
  if (e.description && e.description !== name(e)) h += '<div class="ins-row"><em>ABOUT</em><span>' + esc(e.description) + '</span></div>';
  h += '<div class="ins-row"><em>FIRST SEEN</em><span>' + day(e.first_seen_at) + '</span></div>' +
       '<div class="ins-row"><em>CONFIDENCE</em><span>' + (e.confidence_score == null ? '–' : Number(e.confidence_score).toFixed(2)) + '</span></div>' +
       '<div class="ins-row"><em>SOURCE</em><span>' + esc(e.source_system || '–') + '</span></div>';
  if (links.length) h += '<div class="ins-row"><em>LINKED TO</em><div class="ins-list">' + links.map(function (r) {
    var other = S.byId[r.source_entity_id === id ? r.target_entity_id : r.source_entity_id];
    return other ? '<button type="button" class="ins-li" data-omega-task-id="insight.node.select" data-id="' + esc(other.id) + '"><span>' + esc(name(other)) + '</span><em>' + esc(r.relationship_type) + '</em></button>' : '';
  }).join('') + '</div></div>';
  if (ev.length) h += '<div class="ins-row"><em>EVIDENCE</em><span>' + ev.map(function (v) {
    return esc(v.source_type) + ' · ' + esc(v.extraction_method) + ' · ' + (v.human_verified ? 'reviewed' : 'not reviewed') + (v.extracted_text ? '<br>“' + esc(v.extracted_text) + '”' : '');
  }).join('<br>') + '</span></div>';
  if (evts.length) h += '<div class="ins-row"><em>EVENTS</em><span>' + evts.map(function (x) { return day(x.occurred_at) + ' · ' + esc(x.event_type); }).join('<br>') + '</span></div>';
  h += '<button type="button" class="btn" data-omega-task-id="insight.node.clear" id="ins-back">← ALL</button>';
  $('ins-panel').innerHTML = h;
  $('ins-back').onclick = function () { select(null); };
  bindList();
}

function bindList() {
  $('ins-panel').querySelectorAll('.ins-li').forEach(function (b) { b.onclick = function () { select(b.dataset.id); }; });
}
function select(id) { S.sel = id; draw(); if (id) panelNode(id); else panelOverview(); }

/* ── load ───────────────────────────────────────────────────────────── */
async function load() {
  var res = await Promise.all([
    sb.from('graph_entities').select('id,entity_type,canonical_name,display_name,description,first_seen_at,last_updated_at,confidence_score,source_system,verified').limit(500),
    sb.from('graph_relationships').select('id,source_entity_id,target_entity_id,relationship_type,strength,confidence_score').limit(2000),
    sb.from('graph_events').select('id,event_type,entity_id,occurred_at').order('occurred_at', { ascending: false }).limit(500),
    sb.from('graph_evidence').select('id,graph_entity_id,source_type,extraction_method,human_verified,extracted_text').limit(500)
  ]);
  var failed = res.filter(function (r) { return r.error; });
  if (failed.length) console.warn('[insight] some graph reads failed:', failed.map(function (r) { return r.error.message; }));
  S.ents = res[0].error ? [] : res[0].data || [];
  var ids = {}; S.ents.forEach(function (e) { ids[e.id] = 1; });
  S.rels = (res[1].error ? [] : res[1].data || []).filter(function (r) { return ids[r.source_entity_id] && ids[r.target_entity_id]; });
  S.evts = res[2].error ? [] : res[2].data || [];
  S.evid = res[3].error ? [] : res[3].data || [];
  derive(); kpis();
  $('ins-empty').hidden = S.ents.length > 0;
  draw(); panelOverview();
}

function boot() {
  $('ins-lens').innerHTML = LENSES.map(function (l) {
    return '<button type="button" role="tab" data-omega-task-id="insight.lens.' + l[0] + '" data-lens="' + l[0] + '" aria-selected="' + (l[0] === S.lens) + '">' + l[1] + '</button>';
  }).join('');
  $('ins-lens').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; S.lens = b.dataset.lens; draw(); if (!S.sel) panelOverview(); };
  $('ins-find').oninput = function () { S.find = this.value.trim().toLowerCase(); draw(); };
  load().catch(function (e) { console.warn('[insight] load failed', e); $('ins-empty').hidden = false; });
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
    boot();
  } catch (e) { document.getElementById('app').style.display = 'flex'; console.warn(e); }
})();
