/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-owner-core.js  (control-center.html, owner only)

   OWNER: the estate's health on one board, from tables only the owner can
   read (RLS: private.is_platform_owner()). Nothing here writes; every
   control it points at keeps its own page.

     ERRORS    public.client_errors, last 7 days: count today and this
               week, a day-by-day bar, the five most frequent messages with
               how many pages they hit and when they were last seen. Measured
               2026-10-18: the top two (".insert(...).catch / .rpc(...).catch
               is not a function", 386 in 7 days) are already fixed in main
               and still fire because production serves pre-block code.
     MEMBERS   profiles: members, approved, waiting for approval
     ACTIVITY  public.platform_events in the last 24 hours
     FLAGS     public.platform_settings booleans, read-only; toggling stays
               on interface-omni.html

   A member who reaches this page sees nothing from this module: it renders
   only after profiles.is_owner is confirmed, and RLS would return no rows
   to anyone else regardless.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaOwnerCore) return;

  var DAY = 864e5;

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function ago(ts) {
    var m = Math.round((Date.now() - new Date(ts).getTime()) / 6e4);
    if (!isFinite(m)) return '—';
    if (m < 60) return m + 'm ago';
    if (m < 1440) return Math.round(m / 60) + 'h ago';
    return Math.round(m / 1440) + 'd ago';
  }

  function style() {
    if (document.getElementById('ooc-style')) return;
    var s = document.createElement('style');
    s.id = 'ooc-style';
    s.textContent = [
      '.ooc{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:18px 0}',
      '.ooc-card{display:grid;gap:8px;align-content:start;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}',
      '.ooc-card.wide{grid-column:1/-1}',
      '.ooc-h{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.18em;color:var(--muted,#9aa)}',
      '.ooc-big{display:flex;gap:18px;flex-wrap:wrap;align-items:baseline}',
      '.ooc-big b{font-family:var(--R,sans-serif);font-size:var(--fs-5,28px);line-height:1;color:var(--ink,#eee)}',
      '.ooc-big b.bad{color:var(--crim,#e06060)}',
      '.ooc-big span{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.12em;color:var(--muted,#9aa);margin-left:4px}',
      '.ooc-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;align-items:end;height:56px}',
      '.ooc-bars i{display:block;background:rgba(224,96,96,.7);border-radius:3px 3px 0 0;min-height:2px}',
      '.ooc-row{display:grid;grid-template-columns:auto 1fr auto;gap:2px 12px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06);align-items:baseline}',
      '.ooc-row b{font-family:var(--R,sans-serif);font-size:var(--fs-3,16px);color:var(--crim,#e06060)}',
      '.ooc-row code{font-family:var(--M,monospace);font-size:var(--fs-1,12px);color:var(--ink,#eee);overflow-wrap:anywhere}',
      '.ooc-row small{font-family:var(--M,monospace);font-size:var(--fs-1,12px);color:var(--muted,#9aa);white-space:nowrap}',
      '.ooc-flags{display:flex;flex-wrap:wrap;gap:6px}',
      '.ooc-flag{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.06em;padding:5px 9px;border-radius:99px;border:1px solid rgba(255,255,255,.14);color:var(--muted,#9aa)}',
      '.ooc-flag.on{border-color:rgba(63,178,127,.6);color:var(--green,#3fb27f)}',
      '.ooc a{color:var(--cyan,#4fc3d8);font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.12em}',
      '.ooc-err{font-family:var(--M,monospace);font-size:var(--fs-1,12px);color:var(--crim,#e06060)}'
    ].join('');
    document.head.appendChild(s);
  }

  function errorsCard(root, rows) {
    var c = el('section', 'ooc-card wide', null, root);
    el('div', 'ooc-h', 'CLIENT ERRORS · 7 DAYS', c);
    if (rows === null) { el('div', 'ooc-err', 'client_errors unavailable', c); return; }
    var now = Date.now(), d1 = rows.filter(function (r) { return now - new Date(r.created_at).getTime() < DAY; }).length;
    var big = el('div', 'ooc-big', null, c);
    var b1 = el('b', d1 ? 'bad' : null, String(d1), big); el('span', null, 'LAST 24H', b1.parentNode);
    big.appendChild(document.createTextNode(' '));
    el('b', null, String(rows.length), big); el('span', null, 'THIS WEEK', big);
    var byDay = [0, 0, 0, 0, 0, 0, 0];
    rows.forEach(function (r) { var k = Math.floor((now - new Date(r.created_at).getTime()) / DAY); if (k >= 0 && k < 7) byDay[6 - k]++; });
    var max = Math.max.apply(null, byDay.concat([1]));
    var bars = el('div', 'ooc-bars', null, c);
    bars.setAttribute('role', 'img');
    bars.setAttribute('aria-label', 'Errors per day, oldest first: ' + byDay.join(', '));
    byDay.forEach(function (n) { el('i', null, null, bars).style.height = Math.round(n / max * 100) + '%'; });
    var groups = {};
    rows.forEach(function (r) {
      var m = String(r.message || '(no message)').slice(0, 160);
      var g = groups[m] || (groups[m] = { m: m, n: 0, pages: {}, last: r.created_at });
      g.n++; g.pages[r.page || '?'] = 1;
      if (r.created_at > g.last) g.last = r.created_at;
    });
    Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5).forEach(function (g) {
      var row = el('div', 'ooc-row', null, c);
      el('b', null, String(g.n), row);
      el('code', null, g.m, row);
      el('small', null, Object.keys(g.pages).length + ' pages · ' + ago(g.last), row);
    });
    if (!rows.length) el('div', 'ooc-h', 'NO ERRORS RECORDED THIS WEEK', c);
  }

  function membersCard(root, ms, events24) {
    var c = el('section', 'ooc-card', null, root);
    el('div', 'ooc-h', 'MEMBERS', c);
    if (!ms) { el('div', 'ooc-err', 'profiles unavailable', c); return; }
    var members = ms.filter(function (m) { return !m.is_owner; });
    var approved = members.filter(function (m) { return m.access_approved; }).length;
    var waiting = members.filter(function (m) { return !m.access_approved && !m.is_rejected; }).length;
    var big = el('div', 'ooc-big', null, c);
    [[members.length, 'MEMBERS'], [approved, 'APPROVED'], [waiting, 'WAITING']].forEach(function (x, i) {
      var b = el('b', i === 2 && x[0] ? 'bad' : null, String(x[0]), big); el('span', null, x[1], big);
      if (i < 2) big.appendChild(document.createTextNode(' '));
      return b;
    });
    var a = el('a', null, 'REVIEW APPROVALS →', c); a.href = '/approvals.html';
    el('div', 'ooc-h', 'ACTIVITY · 24H', c);
    var act = el('div', 'ooc-big', null, c);
    el('b', null, events24 == null ? '—' : String(events24), act); el('span', null, 'PLATFORM EVENTS', act);
  }

  function flagsCard(root, flags) {
    var c = el('section', 'ooc-card', null, root);
    el('div', 'ooc-h', 'FLAGS', c);
    if (!flags) { el('div', 'ooc-err', 'platform_settings unavailable', c); return; }
    var box = el('div', 'ooc-flags', null, c);
    flags.filter(function (f) { return typeof f.bool_value === 'boolean'; }).sort(function (a, b) { return String(a.key).localeCompare(String(b.key)); }).forEach(function (f) {
      el('span', 'ooc-flag' + (f.bool_value ? ' on' : ''), (f.bool_value ? '● ' : '○ ') + f.key, box);
    });
    var a = el('a', null, 'CHANGE FLAGS →', c); a.href = '/interface-omni.html';
  }

  async function boot() {
    var root = document.querySelector('[data-omega-owner-core]');
    if (!root) return;
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) return;
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) return;
    var me = await sb.from('profiles').select('is_owner').eq('id', s.user.id).maybeSingle();
    if (me.error || !me.data || me.data.is_owner !== true) return;
    style();
    root.classList.add('ooc');
    var since7 = new Date(Date.now() - 7 * DAY).toISOString(), since1 = new Date(Date.now() - DAY).toISOString();
    var r = await Promise.all([
      sb.from('client_errors').select('message,page,created_at').gte('created_at', since7).order('created_at', { ascending: false }).limit(5000),
      sb.from('profiles').select('is_owner,access_approved,is_rejected'),
      sb.from('platform_events').select('id', { count: 'exact', head: true }).gte('created_at', since1),
      sb.from('platform_settings').select('key,bool_value')
    ]);
    root.textContent = '';
    errorsCard(root, r[0].error ? null : (r[0].data || []));
    membersCard(root, r[1].error ? null : (r[1].data || []), r[2].error ? null : r[2].count);
    flagsCard(root, r[3].error ? null : (r[3].data || []));
  }

  window.OmegaOwnerCore = {};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
