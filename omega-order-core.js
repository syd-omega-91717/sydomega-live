/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-order-core.js  (hall.html only)

   ORDER: the community on one board -- who is here, who leads, what is
   coming, what was said -- from the tables that hold it, each section ending
   in the one action that adds to it.

     ORDER      rpc order_stats(): members, approved, element spread
     LEADERS    rpc public_leaderboard(5): rank, name, authority
     GATHERINGS member_events with event_date today or later (RLS: readable
                by every member); RSVP stays on events.html, keyed by title
     VOICES     member_posts with status 'published' (RLS)

   Measured 2026-10-18: member_events, member_posts, social_* and the family
   tables all hold 0 rows. An empty section says so and offers its action --
   it never fills itself with sample people or invented events (CLAUDE.md
   8.1 class 9). Read-only.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaOrderCore) return;

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function link(parent, href, text) { var a = el('a', 'odc-act', text, parent); a.href = href; return a; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  function style() {
    if (document.getElementById('odc-style')) return;
    var s = document.createElement('style');
    s.id = 'odc-style';
    s.textContent = [
      '.odc{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:18px clamp(14px,3vw,36px) 22px}',
      '.odc-card{display:grid;gap:8px;align-content:start;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}',
      '.odc-h{font-family:var(--M,monospace);font-size:.64rem;letter-spacing:.18em;color:var(--muted,#9aa)}',
      '.odc-big{display:flex;align-items:baseline;gap:6px 14px;flex-wrap:wrap}',
      '.odc-big b{font-family:var(--R,sans-serif);font-size:1.9rem;line-height:1;color:var(--ink,#eee)}',
      '.odc-big span{font-family:var(--M,monospace);font-size:.6rem;letter-spacing:.12em;color:var(--muted,#9aa)}',
      '.odc-bar{display:grid;grid-template-columns:70px 1fr auto;gap:8px;align-items:center;font-family:var(--M,monospace);font-size:.62rem;color:var(--muted,#9aa)}',
      '.odc-bar i{display:block;height:6px;border-radius:3px;background:var(--gold,#d4af37)}',
      '.odc-li{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:baseline;padding:6px 0;border-top:1px solid rgba(255,255,255,.06);font-family:var(--R,sans-serif);color:var(--ink,#eee)}',
      '.odc-li small{font-family:var(--M,monospace);font-size:.6rem;color:var(--muted,#9aa)}',
      '.odc-li b{font-family:var(--M,monospace);font-size:.7rem;color:var(--gold,#d4af37)}',
      '.odc-empty{font-family:var(--M,monospace);font-size:.64rem;letter-spacing:.1em;color:var(--muted,#9aa)}',
      '.odc .odc-act{display:inline-flex!important;justify-self:start;align-items:center;min-height:40px;padding:8px 14px;border-radius:10px;border:1px solid rgba(212,175,55,.5);color:var(--ink,#eee);font-family:var(--M,monospace);font-size:.66rem;letter-spacing:.14em;text-decoration:none}'
    ].join('');
    document.head.appendChild(s);
  }

  function card(root, title) { var c = el('section', 'odc-card', null, root); el('div', 'odc-h', title, c); return c; }

  function order(root, st) {
    var c = card(root, 'THE ORDER');
    if (!st) { el('div', 'odc-empty', 'ORDER STATS UNAVAILABLE', c); return; }
    var big = el('div', 'odc-big', null, c);
    el('b', null, String(st.members || 0), big); el('span', null, 'MEMBERS', big);
    el('b', null, String(st.approved || 0), big); el('span', null, 'APPROVED', big);
    var els = st.elements && typeof st.elements === 'object' ? st.elements : {};
    var keys = Object.keys(els), max = Math.max.apply(null, keys.map(function (k) { return +els[k] || 0; }).concat([1]));
    keys.sort(function (a, b) { return (+els[b] || 0) - (+els[a] || 0); }).forEach(function (k) {
      var r = el('div', 'odc-bar', null, c);
      el('span', null, String(k).toUpperCase(), r);
      el('i', null, null, r).style.width = Math.round((+els[k] || 0) / max * 100) + '%';
      el('span', null, String(els[k]), r);
    });
    if (!keys.length) el('div', 'odc-empty', 'NO ELEMENTS RECORDED YET', c);
  }

  function leaders(root, lb) {
    var c = card(root, 'LEADERS · AUTHORITY');
    if (!Array.isArray(lb)) { el('div', 'odc-empty', 'LEADERBOARD UNAVAILABLE', c); return; }
    if (!lb.length) el('div', 'odc-empty', 'NO RANKED MEMBERS YET', c);
    lb.slice(0, 5).forEach(function (m, i) {
      var r = el('div', 'odc-li', null, c);
      el('b', null, '#' + (m.rank || i + 1), r);
      el('span', null, (m.name || 'Member') + (m.is_owner ? ' · OWNER' : ''), r);
      el('small', null, isFinite(+m.authority) ? (+m.authority).toFixed(2) : '—', r);
    });
    link(c, '/sovereigns.html', 'FULL RANKING ↗');
  }

  function gatherings(root, evs) {
    var c = card(root, 'GATHERINGS');
    if (evs === null) el('div', 'odc-empty', 'EVENTS UNAVAILABLE', c);
    else if (!evs.length) el('div', 'odc-empty', 'NO MEMBER EVENTS SCHEDULED', c);
    else evs.forEach(function (e) {
      var r = el('div', 'odc-li', null, c);
      el('b', null, String(e.event_date || '').slice(5, 10), r);
      el('span', null, e.title || 'Event', r);
      el('small', null, String(e.format || e.event_type || '').toUpperCase(), r);
    });
    link(c, '/events.html', evs && evs.length ? 'RSVP ↗' : 'PROPOSE AN EVENT ↗');
  }

  function voices(root, posts) {
    var c = card(root, 'VOICES');
    if (posts === null) el('div', 'odc-empty', 'POSTS UNAVAILABLE', c);
    else if (!posts.length) el('div', 'odc-empty', 'NOTHING POSTED YET', c);
    else posts.forEach(function (p) {
      var r = el('div', 'odc-li', null, c);
      el('b', null, String(p.post_type || 'POST').toUpperCase(), r);
      el('span', null, p.title || String(p.body || '').slice(0, 80), r);
      el('small', null, String(p.created_at || '').slice(5, 10), r);
    });
    link(c, '/feed.html', 'POST TO THE ORDER ↗');
  }

  async function boot() {
    var root = document.querySelector('[data-omega-order-core]');
    if (!root) return;
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) return;
    style();
    root.classList.add('odc');
    var r = await Promise.all([
      sb.rpc('order_stats').then(function (x) { return x.error || !x.data || Array.isArray(x.data) ? null : x.data; }),
      sb.rpc('public_leaderboard', { p_limit: 5 }).then(function (x) { return x.error ? null : x.data; }),
      sb.from('member_events').select('title,event_date,format,event_type').gte('event_date', today()).order('event_date', { ascending: true }).limit(4),
      sb.from('member_posts').select('post_type,title,body,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(4)
    ]);
    root.textContent = '';
    order(root, r[0]);
    leaders(root, r[1]);
    gatherings(root, r[2].error ? null : (r[2].data || []));
    voices(root, r[3].error ? null : (r[3].data || []));
  }

  window.OmegaOrderCore = {};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
