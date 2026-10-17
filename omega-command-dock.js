/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-command-dock.js  (dashboard.html)

   COMMAND: three pages folded into one dock on the page members already use
   (dashboard carries ~70% of all views). Mount: <section data-omega-command-dock>.

     ASK     the concierge Edge Function     (was chatbot.html)
     POINTS  own task_completions + my_matrix (was points.html)
     INBOX   own delivered in_app omega_notifications (was notifications.html)

   Rules this module keeps, each a bug class this repo has shipped:
   - every write checks .error before the UI changes (CLAUDE.md 8.1 class 1);
   - nothing is invented: no seeded "welcome" messages, no fallback points
     value, an empty inbox says it is empty (8.1 class 9);
   - the concierge reply is rendered as text, never as HTML.
   ========================================================================== */
import { createClient } from '/vendor/supabase-js.js';

(function () {
  'use strict';
  if (window.__omegaCommandDock) return;
  window.__omegaCommandDock = 1;

  var sb = window.__omegaSb || (window.__omegaSb = createClient(
    'https://ydqhzvvoyufiiqvzcjns.supabase.co', 'sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));
  var AXES = { knowledge: '#C9A84C', mastery: '#00E5FF', contribution: '#3fb27f' };
  var S = { tab: 'ask', uid: null, profile: {}, agent: null, inbox: [], log: [], matrix: null, busy: false };
  var host;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!(s >= 0)) return '';
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm';
    if (s < 86400) return Math.round(s / 3600) + 'h';
    return Math.round(s / 86400) + 'd';
  }

  var CSS = [
    '.ocd{display:flex;flex-direction:column;gap:12px;padding:16px}',
    '.ocd-tabs{display:flex;gap:6px;flex-wrap:wrap}',
    '.ocd-tabs button{position:relative;font-family:var(--M);font-size:12px;letter-spacing:1.5px;padding:8px 14px;background:rgba(255,255,255,.03);',
    '  color:var(--muted);border:1px solid rgba(255,255,255,.1);border-radius:2px;cursor:pointer;transition:color .2s,border-color .2s}',
    '.ocd-tabs button[aria-selected="true"]{color:var(--gold);border-color:var(--gold);background:rgba(201,168,76,.1)}',
    '.ocd-badge{margin-left:8px;padding:0 6px;border-radius:9px;background:var(--gold);color:#05070a;font-weight:700}',
    '.ocd-pane{min-height:150px}',
    '.ocd-ask{display:flex;gap:8px}',
    '.ocd-ask input{flex:1;min-width:0}',
    '.ocd-chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.ocd-chips button{font-family:var(--R);font-size:14px;padding:5px 10px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:none;color:var(--ink);cursor:pointer}',
    '.ocd-chips button:hover{border-color:var(--gold)}',
    '.ocd-thread{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto}',
    '.ocd-msg{padding:9px 12px;border-radius:2px;font-family:var(--R);font-size:15px;line-height:1.45;white-space:pre-wrap}',
    '.ocd-msg.me{align-self:flex-end;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);max-width:85%}',
    '.ocd-msg.ai{align-self:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);max-width:92%}',
    '.ocd-msg.sys{align-self:center;font-family:var(--M);font-size:12px;letter-spacing:1px;color:var(--muted);border:0}',
    '.ocd-who{display:flex;align-items:center;gap:8px;font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--muted)}',
    '.ocd-who [data-omega-emblem]{width:28px;height:28px;display:block}',
    '.ocd-axes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '.ocd-ax{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:2px}',
    '.ocd-ax b{display:block;font-family:var(--M);font-size:12px;letter-spacing:1.5px;font-weight:400;color:var(--muted)}',
    '.ocd-ax span{font-family:var(--D);font-size:22px}',
    '.ocd-ax .bar-track{height:4px;margin-top:6px}',
    '.ocd-rows{display:flex;flex-direction:column;gap:4px;margin-top:10px}',
    '.ocd-row{display:grid;grid-template-columns:8px minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:7px 10px;',
    '  border:1px solid rgba(255,255,255,.06);border-radius:2px;font-family:var(--R);font-size:14px;background:none;color:var(--ink);text-align:left;width:100%}',
    '.ocd-row i{width:8px;height:8px;border-radius:50%}',
    '.ocd-row em{font-style:normal;font-family:var(--M);font-size:12px;color:var(--muted)}',
    '.ocd-row.unread{border-color:rgba(201,168,76,.35);cursor:pointer}',
    '.ocd-row.unread:hover{background:rgba(201,168,76,.06)}',
    '.ocd-empty{font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--muted);padding:24px 0;text-align:center}',
    '@media (max-width:480px){.ocd-axes{grid-template-columns:1fr}}'
  ].join('\n');

  function frame() {
    if (!document.getElementById('ocd-css')) { var st = el('style'); st.id = 'ocd-css'; st.textContent = CSS; document.head.appendChild(st); }
    /* omg-no-tilt: bg.js's hover tilt (rotateX/rotateY 2deg) slants a card this
       wide by ~45px, one row's height -- each point value read against the row
       below it. bg.js checks this class on every mouseenter. */
    host.classList.add('card', 'ocd', 'omg-no-tilt');
    host.innerHTML = '<div class="ocd-tabs" role="tablist" aria-label="Command dock"></div><div class="ocd-pane" role="tabpanel"></div>';
    host.querySelector('.ocd-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.tab; paint();
    });
  }

  function tabs() {
    var unread = S.inbox.filter(function (n) { return !n.read_at; }).length;
    var defs = [['ask', 'ASK'], ['points', 'POINTS'], ['inbox', 'INBOX', unread]];
    host.querySelector('.ocd-tabs').innerHTML = defs.map(function (d) {
      return '<button type="button" role="tab" data-omega-task-id="dashboard.dock.' + d[0] + '" data-tab="' + d[0] + '" aria-selected="' + (S.tab === d[0]) + '">' +
        d[1] + (d[2] ? '<span class="ocd-badge">' + d[2] + '</span>' : '') + '</button>';
    }).join('');
  }

  function paint() {
    tabs();
    var pane = host.querySelector('.ocd-pane'); pane.innerHTML = '';
    ({ ask: paintAsk, points: paintPoints, inbox: paintInbox })[S.tab](pane);
  }

  /* ── ASK ─────────────────────────────────────────────────────────── */
  var thread = [];
  function paintAsk(pane) {
    var who = el('div', 'ocd-who');
    if (S.agent) { who.innerHTML = '<span data-omega-emblem="' + esc(S.agent.sign) + '"></span>'; who.appendChild(document.createTextNode(S.agent.name.toUpperCase() + ' · ' + S.agent.role.toUpperCase())); }
    else who.textContent = 'CONCIERGE';
    pane.appendChild(who);
    var t = el('div', 'ocd-thread'); t.setAttribute('aria-live', 'polite');
    thread.forEach(function (m) { t.appendChild(el('div', 'ocd-msg ' + m.who, m.text)); });
    pane.appendChild(t);
    if (!thread.length) {
      var chips = el('div', 'ocd-chips');
      var dom = (S.agent && S.agent.domains) || [];
      ['What should I do today to raise my authority?', dom[0] ? 'Help me with ' + dom[0] : null, 'Explain my element']
        .filter(Boolean).forEach(function (q) {
          var c = el('button', null, q); c.type = 'button'; c.setAttribute('data-omega-task-id', 'dashboard.dock.ask-suggestion');
          c.onclick = function () { ask(q); }; chips.appendChild(c);
        });
      pane.appendChild(chips);
    }
    var f = el('form', 'ocd-ask');
    f.innerHTML = '<input class="inp" name="q" maxlength="2000" autocomplete="off" placeholder="Ask the concierge" aria-label="Ask the concierge">' +
      '<button class="btn btn-fill" type="submit" data-omega-task-id="dashboard.dock.ask-send">SEND</button>';
    f.onsubmit = function (e) { e.preventDefault(); var q = f.q.value.trim(); if (q) { f.q.value = ''; ask(q); } };
    pane.appendChild(f);
    t.scrollTop = t.scrollHeight;
  }

  async function ask(q) {
    if (S.busy) return;
    S.busy = true; thread.push({ who: 'me', text: q }, { who: 'sys', text: 'THINKING…' }); paint();
    var text;
    try {
      var r = await sb.functions.invoke('concierge', { body: { message: q, context: {
        sign: S.profile.sign || 'unknown', agent: S.agent ? S.agent.name : null,
        a: S.matrix ? String(S.matrix.a) : null, b: S.matrix ? String(S.matrix.b) : null, c: S.matrix ? String(S.matrix.c) : null } } });
      if (r.error) throw r.error;
      if (r.data && r.data.reply) text = { who: 'ai', text: r.data.reply };
      else if (r.data && r.data.enabled === false) text = { who: 'sys', text: 'CONCIERGE IS NOT CONFIGURED YET' };
      else text = { who: 'sys', text: (r.data && r.data.message) || 'NO REPLY' };
    } catch (e) {
      console.warn('[command-dock] concierge failed', e);
      text = { who: 'sys', text: 'CONCIERGE UNAVAILABLE — TRY AGAIN' };
    }
    thread.pop(); thread.push(text); thread = thread.slice(-8);
    S.busy = false; if (S.tab === 'ask') paint();
  }

  /* ── POINTS ──────────────────────────────────────────────────────── */
  function paintPoints(pane) {
    var sums = { knowledge: 0, mastery: 0, contribution: 0 };
    S.log.forEach(function (t) { var k = t.axis_type; if (k in sums && t.points_earned != null) sums[k] += Number(t.points_earned) || 0; });
    var level = S.matrix ? { knowledge: S.matrix.a, mastery: S.matrix.b, contribution: S.matrix.c } : null;
    var g = el('div', 'ocd-axes');
    Object.keys(AXES).forEach(function (k) {
      var lv = level ? Number(level[k]) || 0 : null;
      var box = el('div', 'ocd-ax'); box.style.borderColor = AXES[k] + '55';
      box.innerHTML = '<b>' + k.toUpperCase() + '</b><span style="color:' + AXES[k] + '">' + (lv == null ? '–' : lv.toFixed(2)) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + (lv == null ? 0 : Math.min(100, lv / 9 * 100)).toFixed(1) + '%;background:' + AXES[k] + '"></div></div>' +
        '<div class="ocd-row" style="border:0;padding:6px 0 0;grid-template-columns:1fr auto"><em>EARNED (LAST ' + S.log.length + ')</em><em>+' + sums[k].toFixed(3) + '</em></div>';
      g.appendChild(box);
    });
    pane.appendChild(g);
    if (!S.log.length) { pane.appendChild(el('div', 'ocd-empty', 'NO VERIFIED ACTIONS YET')); return; }
    var rows = el('div', 'ocd-rows');
    S.log.slice(0, 8).forEach(function (t) {
      var r = el('div', 'ocd-row'), col = AXES[t.axis_type] || 'var(--muted)';
      r.innerHTML = '<i style="background:' + col + '"></i><span>' + esc(t.task_name || t.description || t.task || 'Verified action') + '</span>' +
        '<em style="color:' + col + '">' + (t.points_earned == null ? '' : '+' + Number(t.points_earned).toFixed(3)) + '</em><em>' + ago(t.completed_at) + '</em>';
      rows.appendChild(r);
    });
    pane.appendChild(rows);
  }

  /* ── INBOX ───────────────────────────────────────────────────────── */
  function paintInbox(pane) {
    if (!S.inbox.length) { pane.appendChild(el('div', 'ocd-empty', 'INBOX CLEAR')); return; }
    var rows = el('div', 'ocd-rows');
    S.inbox.forEach(function (n) {
      var r = el(n.read_at ? 'div' : 'button', 'ocd-row' + (n.read_at ? '' : ' unread'));
      if (!n.read_at) { r.type = 'button'; r.setAttribute('data-omega-task-id', 'dashboard.dock.inbox-read'); r.onclick = function () { markRead(n); }; }
      var sev = { critical: '#FF4444', high: '#FF9800', medium: 'var(--gold)' }[n.severity] || 'var(--muted)';
      r.innerHTML = '<i style="background:' + sev + '"></i><span><b>' + esc(n.title) + '</b> ' + esc(n.body || '') + '</span><em></em><em>' + ago(n.created_at) + '</em>';
      rows.appendChild(r);
    });
    pane.appendChild(rows);
  }

  async function markRead(n) {
    var at = new Date().toISOString();
    var r = await sb.from('omega_notifications').update({ read_at: at }).eq('notification_id', n.notification_id);
    if (r.error) { console.warn('[command-dock] mark read failed:', r.error.message); return; }
    n.read_at = at; paint();
  }

  /* ── LOAD ────────────────────────────────────────────────────────── */
  async function load() {
    var s = (await sb.auth.getSession()).data.session; if (!s) return;
    S.uid = s.user.id;
    var res = await Promise.all([
      sb.from('profiles').select('sign').eq('id', S.uid).maybeSingle(),
      sb.rpc('my_matrix'),
      sb.from('task_completions').select('task_name,description,task,axis_type,points_earned,completed_at')
        .eq('user_id', S.uid).order('completed_at', { ascending: false }).limit(50),
      sb.from('omega_notifications').select('notification_id,title,body,severity,read_at,created_at')
        .eq('user_id', S.uid).eq('channel', 'in_app').eq('status', 'delivered').order('created_at', { ascending: false }).limit(30),
      fetch('/omega-agents.json').then(function (r) { return r.json(); }).catch(function () { return null; })
    ]);
    if (!res[0].error && res[0].data) S.profile = res[0].data;
    if (!res[1].error) S.matrix = (res[1].data || [])[0] || null;
    if (!res[2].error) S.log = res[2].data || [];
    if (!res[3].error) S.inbox = res[3].data || [];
    var agents = (res[4] && res[4].agents) || [];
    S.agent = agents.filter(function (a) { return a.sign === S.profile.sign; })[0] || null;
    if (S.inbox.some(function (n) { return !n.read_at; })) S.tab = 'inbox';
    paint();
  }

  function boot() {
    host = document.querySelector('[data-omega-command-dock]'); if (!host) return;
    frame(); paint();
    load().catch(function (e) { console.warn('[command-dock] load failed', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
