/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-identity-core.js  (profile.html only)

   IDENTITY: who you are, computed -- never asserted.

   1. THE HERO TELLS THE TRUTH. profile.html shipped "RANK 9.9.9" and four
      static badges -- OMEGA MASTER, ALL-TIME ACCESS, VERIFIED ARCHITECT,
      ABSOLUTE SOVEREIGN -- to every member, and no script ever changed them
      (CLAUDE.md 8.1 class 9). The markup now ships neutral and this module
      fills it from the member's own profiles row:
        rank   the gate reached, from OmegaCanon's authority ladder
               (omega-canon.json authority.gates / gate_names)
        badges tier, access state, KYC state, and OWNER only when is_owner
   2. READINESS. One strip of the account's real state, each item a link to
      the control that changes it: name, sign, two-factor (Supabase Auth
      factors; when the mfa_enrolment_enabled flag is off the item says so
      and is not counted against the member), identity verification
      (profiles.kyc_status) and visibility (profiles.is_public, informational).
   Read-only. Every write stays with the control it links to.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaIdentityCore) return;

  var KYC = {
    verified: { t: 'VERIFIED', ok: true },
    submitted: { t: 'IN REVIEW', ok: null },
    pending: { t: 'IN REVIEW', ok: null },
    rejected: { t: 'NOT ACCEPTED', ok: false },
    none: { t: 'NOT SUBMITTED', ok: false }
  };

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function style() {
    if (document.getElementById('oic-style')) return;
    var s = document.createElement('style');
    s.id = 'oic-style';
    s.textContent = [
      '.oic{display:grid;gap:10px;margin:16px 0 20px;padding:0 clamp(14px,3vw,36px)}',
      '.oic-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.oic-top b{font-family:var(--R,sans-serif);font-size:1.6rem;line-height:1;color:var(--ink,#eee)}',
      '.oic-top span{font-family:var(--M,monospace);font-size:.66rem;letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oic-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}',
      /* !important: a platform-wide a[href]{display:inline-flex} outranks a class (GAP_ANALYSIS). */
      '.oic .oic-item{display:grid!important;align-content:start;gap:3px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);text-decoration:none;color:var(--ink,#eee);min-height:44px}',
      '.oic-item.ok{border-color:rgba(63,178,127,.55);background:rgba(63,178,127,.07)}',
      '.oic-item.todo{border-color:rgba(212,175,55,.5);background:rgba(212,175,55,.06)}',
      '.oic-item strong{font-family:var(--M,monospace);font-size:.64rem;letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oic-item span{font-family:var(--R,sans-serif);font-size:.95rem}',
      '.oic-item small{font-family:var(--M,monospace);font-size:.58rem;letter-spacing:.08em;color:var(--muted,#9aa)}',
      '.oic-item.ok small{color:var(--green,#3fb27f)}',
      '.oic-item.todo small{color:var(--gold,#d4af37)}'
    ].join('');
    document.head.appendChild(s);
  }

  /* The highest gate whose threshold the authority has reached. */
  function gate(auth) {
    var canon = window.OmegaCanon && window.OmegaCanon.authority;
    var gates = canon && canon.gates, names = canon && canon.gate_names;
    if (!Array.isArray(gates) || !Array.isArray(names) || !isFinite(auth)) return null;
    var i = -1;
    for (var k = 0; k < gates.length; k++) if (auth >= gates[k]) i = k;
    return i < 0 ? { n: 0, name: 'GENESIS' } : { n: i + 1, name: names[i] };
  }

  function authority(p) {
    if (isFinite(+p.authority) && +p.authority > 0) return +p.authority;
    var a = +p.axis_a || 0.001, b = +p.axis_b || 0.001, c = +p.axis_c || 0.001;
    return Math.sqrt(a * a * a + b * b * b + c * c * c) * 1.6180339887 / 2.7182818285;
  }

  function badge(box, text, color) {
    var b = el('span', 'phm-badge', null, box);
    b.style.color = 'var(' + color + ')';
    b.style.borderColor = 'currentColor';
    var dot = el('div', 'pb-dot', null, b);
    dot.style.background = 'currentColor';
    b.appendChild(document.createTextNode(text));
  }

  function hero(p) {
    var g = p.is_owner ? { n: 12, name: 'APEX' } : gate(authority(p));
    var rank = document.querySelector('.ph-rank');
    if (rank) {
      rank.textContent = g ? g.name : '—';
      rank.title = g ? 'Gate ' + g.n + ' of 12' : '';
      rank.setAttribute('aria-label', g ? 'Gate ' + g.n + ', ' + g.name : 'Gate unknown');
    }
    var box = document.querySelector('.phm-badges');
    if (!box) return;
    box.textContent = '';
    if (p.is_owner) badge(box, 'OWNER', '--gold');
    var tier = p.subscription_tier || p.membership_tier;
    badge(box, tier ? String(tier).toUpperCase() + (p.subscription_status ? ' · ' + String(p.subscription_status).toUpperCase() : '') : 'NO PLAN', '--gold');
    var access = p.is_owner ? 'FULL ACCESS' : !p.access_approved ? 'ACCESS PENDING'
      : p.is_trial ? 'TRIAL' + (p.trial_expires_at ? ' · UNTIL ' + String(p.trial_expires_at).slice(0, 10) : '') : 'APPROVED MEMBER';
    badge(box, access, p.access_approved || p.is_owner ? '--green' : '--muted');
    var k = KYC[p.kyc_status || 'none'] || KYC.none;
    badge(box, 'ID ' + k.t, k.ok ? '--cyan' : '--muted');
    if (g) box.setAttribute('aria-label', 'Gate ' + g.n + ' ' + g.name);
  }

  function item(grid, label, value, state, href, hint) {
    var a = el('a', 'oic-item' + (state === true ? ' ok' : state === false ? ' todo' : ''), null, grid);
    a.href = href;
    el('strong', null, label, a);
    el('span', null, value, a);
    el('small', null, hint, a);
    return state;
  }

  function readiness(root, p, mfa) {
    root.textContent = '';
    var top = el('div', 'oic-top', null, root);
    var count = el('b', null, '', top);
    el('span', null, 'ACCOUNT READY', top);
    var grid = el('div', 'oic-items', null, root);
    var s = [];
    s.push(item(grid, 'NAME', p.display_name || 'not set', !!p.display_name, '/settings.html', p.display_name ? 'set' : 'add a display name'));
    s.push(item(grid, 'SIGN', p.sign || 'not set', !!p.sign, '/settings.html', p.sign ? [p.element, p.god].filter(Boolean).join(' · ') || 'set' : 'set your sign'));
    if (mfa === 'off-flag') item(grid, 'TWO-FACTOR', 'not offered yet', null, '/security.html', 'arrives when enabled');
    else s.push(item(grid, 'TWO-FACTOR', mfa === true ? 'on' : mfa === false ? 'off' : 'unknown', mfa === true ? true : mfa === false ? false : null, '/settings.html#two-factor', mfa === true ? 'protected' : mfa === false ? 'add an authenticator' : 'could not check'));
    var k = KYC[p.kyc_status || 'none'] || KYC.none;
    s.push(item(grid, 'IDENTITY', k.t.toLowerCase(), k.ok, '/profile.html#kyc', k.ok ? 'verified' : k.ok === null ? 'awaiting review' : 'verify to unlock gated features'));
    item(grid, 'VISIBILITY', p.is_public ? 'public' : 'private', null, '/settings.html', p.is_public ? 'your profile is listed' : 'only you see your profile');
    var scored = s.filter(function (x) { return x === true || x === false; });
    count.textContent = scored.filter(function (x) { return x; }).length + '/' + scored.length;
  }

  async function mfaState(sb) {
    var on = null;
    try { var f = await sb.rpc('get_platform_flag', { p_key: 'mfa_enrolment_enabled' }); on = !f.error && f.data === true; } catch (e) { on = false; }
    if (!on) return 'off-flag';
    try {
      var r = await sb.auth.mfa.listFactors();
      if (r.error) return null;
      var all = (r.data && r.data.all) || [];
      return all.some(function (x) { return x.factor_type === 'totp' && x.status === 'verified'; });
    } catch (e) { return null; }
  }

  async function boot() {
    var root = document.querySelector('[data-omega-identity-core]');
    style();
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) return;
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) return;
    var r = await sb.from('profiles')
      .select('display_name,sign,element,god,is_owner,access_approved,is_trial,trial_expires_at,membership_tier,subscription_tier,subscription_status,kyc_status,is_public,authority,axis_a,axis_b,axis_c')
      .eq('id', s.user.id).maybeSingle();
    if (r.error || !r.data) {
      var rank = document.querySelector('.ph-rank'); if (rank) rank.textContent = 'GATE —';
      if (root) { root.textContent = ''; el('div', 'oic-top', 'ACCOUNT STATE UNAVAILABLE', root); }
      return;
    }
    /* OmegaCanon loads async; the hero waits for it briefly, then renders. */
    for (var i = 0; i < 20 && !(window.OmegaCanon && window.OmegaCanon.authority); i++) await new Promise(function (res) { setTimeout(res, 150); });
    hero(r.data);
    if (root) { root.classList.add('oic'); readiness(root, r.data, await mfaState(sb)); }
  }

  window.OmegaIdentityCore = { gate: gate };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
