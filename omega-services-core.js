/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-services-core.js  (services.html only)

   SERVICES: one catalogue of what a member can ask the platform for, each
   with the member's own requests and their real status, each ending in the
   form that files a new one. Read-only; filing stays on its own page.

     CONSULTANCY  consult_requests      (RLS: own rows)  domain · status
     CONTRACTS    commission_contracts  (RLS: own rows)  reference · status
     TRAVEL       travel_journeys       (RLS: own rows)  destination

   Measured 2026-10-18: all three tables hold 0 rows; a member with none
   sees "none yet" and the action, never a sample request.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaServicesCore) return;

  var KINDS = [
    { id: 'consult', label: 'CONSULTANCY', glyph: '◇', table: 'consult_requests', cols: 'domain,status,created_at', href: '/consultancy.html', act: 'BOOK ADVICE',
      line: function (r) { return [r.domain, r.status]; } },
    { id: 'contract', label: 'CONTRACTS', glyph: '§', table: 'commission_contracts', cols: 'reference,counterparty,status,created_at', href: '/contracts.html', act: 'DRAFT A CONTRACT',
      line: function (r) { return [r.reference || r.counterparty, r.status]; } },
    { id: 'travel', label: 'TRAVEL', glyph: '✈︎', table: 'travel_journeys', cols: 'destination,purpose,created_at', href: '/travel.html', act: 'PLAN A JOURNEY',
      line: function (r) { return [r.destination, r.purpose]; } }
  ];

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function style() {
    if (document.getElementById('osv-style')) return;
    var s = document.createElement('style');
    s.id = 'osv-style';
    s.textContent = [
      '.osv{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:16px clamp(14px,3vw,36px) 20px}',
      '.osv-card{display:grid;gap:8px;align-content:start;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}',
      '.osv-h{display:flex;gap:8px;align-items:center;font-family:var(--M,monospace);font-size:.66rem;letter-spacing:.18em;color:var(--muted,#9aa)}',
      '.osv-h span:first-child{font-size:1.1rem;color:var(--gold,#d4af37);letter-spacing:0}',
      '.osv-big{display:flex;align-items:baseline;gap:8px}',
      '.osv-big b{font-family:var(--R,sans-serif);font-size:1.9rem;line-height:1;color:var(--ink,#eee)}',
      '.osv-big span{font-family:var(--M,monospace);font-size:.6rem;letter-spacing:.12em;color:var(--muted,#9aa)}',
      '.osv-li{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06);font-family:var(--R,sans-serif);font-size:.9rem;color:var(--ink,#eee)}',
      '.osv-li small{font-family:var(--M,monospace);font-size:.6rem;letter-spacing:.08em;color:var(--gold,#d4af37);text-transform:uppercase}',
      '.osv-empty{font-family:var(--M,monospace);font-size:.62rem;letter-spacing:.1em;color:var(--muted,#9aa)}',
      '.osv .osv-act{display:inline-flex!important;justify-self:start;align-items:center;min-height:42px;padding:9px 16px;border-radius:10px;border:1px solid var(--gold,#d4af37);background:rgba(212,175,55,.12);color:var(--ink,#eee);font-family:var(--M,monospace);font-size:.68rem;letter-spacing:.14em;text-decoration:none}'
    ].join('');
    document.head.appendChild(s);
  }

  function card(root, k, res) {
    var c = el('section', 'osv-card', null, root);
    c.setAttribute('data-kind', k.id);
    var h = el('div', 'osv-h', null, c);
    el('span', null, k.glyph, h).setAttribute('aria-hidden', 'true');
    el('span', null, k.label, h);
    if (res.error) {
      el('div', 'osv-empty', res.signedOut ? 'SIGN IN TO SEE YOUR REQUESTS' : 'REQUESTS UNAVAILABLE', c);
    } else {
      var rows = res.data || [];
      var big = el('div', 'osv-big', null, c);
      el('b', null, String(rows.length), big);
      el('span', null, rows.length ? 'YOURS' : 'NONE YET', big);
      rows.slice(0, 3).forEach(function (r) {
        var parts = k.line(r), li = el('div', 'osv-li', null, c);
        el('span', null, parts[0] || '—', li);
        el('small', null, parts[1] || String(r.created_at || '').slice(0, 10), li);
      });
    }
    var a = el('a', 'osv-act', k.act + ' ↗', c);
    a.href = k.href;
  }

  async function boot() {
    var root = document.querySelector('[data-omega-services-core]');
    if (!root) return;
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) return;
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    style();
    root.classList.add('osv');
    var uid = s && s.user ? s.user.id : null;
    var res = await Promise.all(KINDS.map(function (k) {
      if (!uid) return Promise.resolve({ error: true, signedOut: true });
      return sb.from(k.table).select(k.cols).eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
    }));
    root.textContent = '';
    KINDS.forEach(function (k, i) { card(root, k, res[i]); });
  }

  window.OmegaServicesCore = { kinds: KINDS.map(function (k) { return k.id; }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
