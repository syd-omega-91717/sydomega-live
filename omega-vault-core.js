/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-vault-core.js  (invest.html only)

   VAULT: one view over the seven personal-finance trackers, which never
   shared a number. Each keeps its own browser store; wealth.html even warns
   "If an asset is entered there and here, it is counted twice". So this view
   does NOT add the stores up blindly. Every source shows its own total and
   the member chooses which ones count -- a chip toggle, remembered in
   omega_vault_sources -- and the sum follows the choice.

   Read-only. Every figure is computed from what the member entered, with the
   field names each page itself writes:
     wallet      omega_wallet            [{balance, currency}]
     investment  omega_investments       [{qty, price}]      value = qty*price
     treasury    omega_treasury_assets   [{value}] + omega_treasury_reserves
                                         {emerg, opp, legacy}
     wealth      omega_wealth_assets     {cash|invest|crypto|realestate|
                                         business|liabilities: [{value}]}
     revenue     omega_revenue           [{monthly, status}] status 'active'
     expenses    omega_expenses          [{amount, type income|expense, date}]
     budget      omega_budget_months     {'YYYY-MM': {income:[], expenses:[]}}
   An empty store reads "no entries", never 0 presented as a balance
   (CLAUDE.md 8.1 class 9). Nothing leaves the browser.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaVaultCore) return;

  var PICK = 'omega_vault_sources';
  var root;

  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function arr(k) { var v = read(k); return Array.isArray(v) ? v.filter(function (x) { return x && typeof x === 'object'; }) : []; }
  function n(v) { var x = Number(v); return isFinite(x) ? x : 0; }
  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function money(v) {
    var s = Math.abs(v) >= 1e6 ? (Math.round(Math.abs(v) / 1e5) / 10) + 'M' : Math.round(Math.abs(v)).toLocaleString('en-US');
    return (v < 0 ? '−$' : '$') + s;
  }
  function month() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1); }

  /* ---------- sources: each returns null when the store holds nothing ---------- */
  function sources() {
    var m = month(), out = [];

    var wal = arr('omega_wallet');
    var curs = {};
    wal.forEach(function (a) { curs[String(a.currency || 'USD').toUpperCase()] = true; });
    out.push({ id: 'wallet', kind: 'asset', label: 'WALLET', href: '/wallet.html',
      value: wal.length ? wal.reduce(function (s, a) { return s + n(a.balance); }, 0) : null,
      note: wal.length ? wal.length + ' account' + (wal.length === 1 ? '' : 's') + (Object.keys(curs).length > 1 || !curs.USD ? ' · ' + Object.keys(curs).join('/') + ' as entered' : '') : null });

    var inv = arr('omega_investments');
    out.push({ id: 'investment', kind: 'asset', label: 'INVESTMENTS', href: '/investment.html',
      value: inv.length ? inv.reduce(function (s, h) { return s + n(h.qty) * n(h.price); }, 0) : null,
      note: inv.length ? inv.length + ' holding' + (inv.length === 1 ? '' : 's') + ' at entered price' : null });

    var ta = arr('omega_treasury_assets'), tr = read('omega_treasury_reserves');
    var res = tr && typeof tr === 'object' ? n(tr.emerg) + n(tr.opp) + n(tr.legacy) : 0;
    out.push({ id: 'treasury', kind: 'asset', label: 'TREASURY', href: '/treasury.html',
      value: ta.length || res ? ta.reduce(function (s, a) { return s + n(a.value); }, 0) + res : null,
      note: ta.length || res ? ta.length + ' asset' + (ta.length === 1 ? '' : 's') + (res ? ' + reserves' : '') : null });

    var wa = read('omega_wealth_assets'), wv = null, wl = 0, wc = 0;
    if (wa && typeof wa === 'object' && !Array.isArray(wa)) {
      Object.keys(wa).forEach(function (k) {
        if (!Array.isArray(wa[k])) return;
        wa[k].forEach(function (x) { if (!x) return; wc++; if (k === 'liabilities') wl += Math.abs(n(x.value)); else wv = (wv || 0) + n(x.value); });
      });
      if (wc) wv = (wv || 0) - wl;
    }
    out.push({ id: 'wealth', kind: 'asset', label: 'WEALTH', href: '/wealth.html',
      value: wc ? wv : null, note: wc ? 'net of ' + money(wl) + ' liabilities' : null });

    var rv = arr('omega_revenue').filter(function (r) { return r.status === 'active'; });
    out.push({ id: 'revenue', kind: 'flow', label: 'REVENUE', href: '/revenue.html',
      value: rv.length ? rv.reduce(function (s, r) { return s + n(r.monthly); }, 0) : null,
      note: rv.length ? rv.length + ' active stream' + (rv.length === 1 ? '' : 's') + ' / mo' : null });

    var ex = arr('omega_expenses').filter(function (e) { return String(e.date || '').slice(0, 7) === m; });
    out.push({ id: 'expenses', kind: 'flow', label: 'EXPENSES', href: '/expenses.html',
      value: ex.length ? ex.reduce(function (s, e) { return s + (e.type === 'income' ? n(e.amount) : -Math.abs(n(e.amount))); }, 0) : null,
      note: ex.length ? ex.length + ' entr' + (ex.length === 1 ? 'y' : 'ies') + ' this month' : null });

    var bm = read('omega_budget_months'), bmm = bm && typeof bm === 'object' ? bm[m] : null, bi = 0, be = 0, bc = 0;
    if (bmm && typeof bmm === 'object') {
      (Array.isArray(bmm.income) ? bmm.income : []).forEach(function (x) { if (x) { bi += n(x.amount); bc++; } });
      (Array.isArray(bmm.expenses) ? bmm.expenses : []).forEach(function (x) { if (x) { be += Math.abs(n(x.amount)); bc++; } });
    }
    out.push({ id: 'budget', kind: 'flow', label: 'BUDGET', href: '/budget.html',
      value: bc ? bi - be : null, note: bc ? money(bi) + ' in · ' + money(be) + ' out this month' : null });

    return out;
  }

  function picked(all) {
    var p = read(PICK);
    if (p && typeof p === 'object' && !Array.isArray(p)) return p;
    var d = {};
    all.forEach(function (s) { d[s.id] = s.value != null; });
    return d;
  }

  function style() {
    if (document.getElementById('ovc-style')) return;
    var s = document.createElement('style');
    s.id = 'ovc-style';
    s.textContent = [
      '.ovc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0 22px}',
      '.ovc-col{display:grid;gap:8px;align-content:start;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}',
      '.ovc-h{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.18em;color:var(--muted,#9aa)}',
      '.ovc-sum{font-family:var(--R,sans-serif);font-size:var(--fs-5,28px);font-weight:700;line-height:1;color:var(--ink,#eee)}',
      '.ovc-sum.neg{color:var(--crim,#e06060)}',
      '.ovc-row{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);cursor:pointer;background:none;color:var(--ink,#eee);text-align:left;overflow:visible;min-height:44px}',
      '.ovc-row[aria-pressed="true"]{border-color:rgba(212,175,55,.5);background:rgba(212,175,55,.07)}',
      '.ovc-row:disabled{cursor:default;opacity:.55}',
      '.ovc-row i{width:14px;height:14px;border-radius:4px;border:1px solid rgba(255,255,255,.3)}',
      '.ovc-row[aria-pressed="true"] i{background:var(--gold,#d4af37);border-color:var(--gold,#d4af37)}',
      '.ovc-row span{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.14em}',
      '.ovc-row b{font-family:var(--R,sans-serif);font-size:1rem}',
      '.ovc-row small{grid-column:2/-1;font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.06em;color:var(--muted,#9aa)}',
      '.ovc-bar{grid-column:1/-1;height:3px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden}',
      '.ovc-bar u{display:block;height:100%;background:var(--gold,#d4af37);text-decoration:none}',
      '.ovc-bar u.neg{background:var(--crim,#e06060)}',
      '.ovc-warn{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.06em;color:var(--muted,#9aa)}',
      '.ovc-row a{color:var(--muted,#9aa);text-decoration:none;font-size:var(--fs-2,14px)}',
      '@media (max-width:760px){.ovc{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  function column(title, list, pick, kind) {
    var col = el('div', 'ovc-col', null, root);
    col.setAttribute('data-kind', kind);
    el('div', 'ovc-h', title, col);
    var on = list.filter(function (s) { return s.value != null && pick[s.id]; });
    var have = list.filter(function (s) { return s.value != null; });
    var sum = on.reduce(function (t, s) { return t + s.value; }, 0);
    var big = el('div', 'ovc-sum' + (sum < 0 ? ' neg' : ''), have.length ? money(sum) : '—', col);
    big.setAttribute('aria-live', 'polite');
    var max = Math.max.apply(null, have.map(function (s) { return Math.abs(s.value); }).concat([1]));
    list.forEach(function (s) {
      var has = s.value != null;
      var row = el('button', 'ovc-row', null, col);
      row.type = 'button';
      row.setAttribute('data-src', s.id);
      row.setAttribute('aria-pressed', has && pick[s.id] ? 'true' : 'false');
      row.disabled = !has;
      el('i', null, null, row).setAttribute('aria-hidden', 'true');
      el('span', null, s.label, row);
      el('b', null, has ? money(s.value) : 'no entries', row);
      if (s.note) el('small', null, s.note, row);
      if (has) { var bar = el('div', 'ovc-bar', null, row); el('u', s.value < 0 ? 'neg' : null, null, bar).style.width = Math.round(Math.abs(s.value) / max * 100) + '%'; }
      row.setAttribute('aria-label', s.label + ', ' + (has ? money(s.value) + (pick[s.id] ? ', counted' : ', not counted') : 'no entries'));
      row.addEventListener('click', function () {
        pick[s.id] = !pick[s.id];
        try { localStorage.setItem(PICK, JSON.stringify(pick)); } catch (e) { /* private mode */ }
        paint();
      });
    });
    var row2 = el('div', 'ovc-warn', null, col);
    if (on.length > 1) row2.textContent = 'Counting ' + on.length + ' trackers. If one ' + (kind === 'asset' ? 'holding' : 'income or bill') + ' sits in two of them, untick one.';
    else if (!have.length) row2.textContent = 'Nothing entered yet in these trackers.';
    var links = el('div', 'ovc-warn', null, col);
    list.forEach(function (s, i) {
      var a = el('a', null, s.label.toLowerCase() + ' ↗', links);
      a.href = s.href;
      a.style.marginRight = '10px';
      a.style.color = 'inherit';
      if (i < list.length - 1) links.appendChild(document.createTextNode(' '));
    });
  }

  function paint() {
    var all = sources(), pick = picked(all);
    root.textContent = '';
    column('NET WORTH · FROM YOUR TRACKERS', all.filter(function (s) { return s.kind === 'asset'; }), pick, 'asset');
    column('CASH FLOW · ' + month(), all.filter(function (s) { return s.kind === 'flow'; }), pick, 'flow');
  }

  function boot() {
    root = document.querySelector('[data-omega-vault-core]');
    if (!root) return;
    style();
    root.classList.add('ovc');
    paint();
    window.addEventListener('storage', paint);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });
  }

  window.OmegaVaultCore = { sources: sources };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
