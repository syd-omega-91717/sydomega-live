/* ============================================================================
   SYD OMEGA 91717 -- SUBSCRIPTION TIER GATE

   Companion to omega-gate.js. That file gates content on MATRIX position
   (earned). This one gates content on SUBSCRIPTION TIER (purchased). Same
   declarative pattern, so both read the same way in markup:

     <div data-tier="publishing">...</div>        needs the tier granting 'publishing'
     <div data-tier="gaming_full">...</div>       needs the tier granting 'gaming_full'

   The feature keys and the tier that grants each come from omega-canon.json
   (tiers[].unlocks + tier_features). Nothing is hard-coded here, so adding a
   feature to canon is enough -- no code change.

   WHY THIS EXISTS
   Canon defined 28 tier-gated features. Only 5 were ever enforced, each with
   its own ad-hoc check inside a single page. The other 23 were declared and
   ignored, so entitlement was inconsistent: two features sold at the same tier
   behaved differently depending on which page they lived on.

   ---------------------------------------------------------------------------
   ENFORCEMENT SWITCH -- read this before enabling
   ---------------------------------------------------------------------------
   Enforcement is OFF by default (canon.economy.tier_enforcement !== true).

   Paid tiers cannot currently be purchased: the checkout edge function refuses
   unless payments_enabled = true AND STRIPE_SECRET_KEY is set, both of which
   are held pending licensed legal counsel. Enforcing paywalls while no member
   can pay would lock everyone out permanently with no route forward -- the
   same dead end that already makes the Gaming Arena unreachable.

   While OFF, gated content stays fully usable and simply carries a small
   "TIER FEATURE" marker, so the entitlement model is visible and testable
   without punishing members. Set economy.tier_enforcement = true in
   omega-canon.json on the day payments go live, and every marker across the
   platform becomes a real lock at once.

   Owner (is_owner) always sees everything, in both modes.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaTierGate) return;
  window.__omegaTierGate = 1;

  var css = [
    '.otg-lock{position:relative!important}',
    '.otg-lock>*{filter:blur(6px);pointer-events:none;user-select:none}',
    '.otg-seal{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(6,6,12,.6);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);border-radius:inherit;font-family:"Courier Prime",monospace;text-align:center;padding:10px}',
    '.otg-seal .ic{font-size:24px;color:#C9A84C}',
    '.otg-seal .rq{font-size:11px;letter-spacing:2px;color:#E2C86D}',
    '.otg-seal .hint{font-size:10px;letter-spacing:1px;color:#8a8676}',
    '.otg-seal a{color:#C9A84C;text-decoration:none;border-bottom:1px solid rgba(201,168,76,.4)}',
    '.otg-tag{display:inline-flex;align-items:center;gap:5px;font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:1.5px;color:#8a8676;border:1px solid rgba(201,168,76,.25);border-radius:2px;padding:2px 7px;margin-left:8px;vertical-align:middle}',
    '.otg-tag i{width:4px;height:4px;border-radius:50%;background:#C9A84C;display:inline-block}'
  ].join('');
  var st = document.createElement('style');
  st.id = 'otg-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function seal(el, tierName, price, label) {
    if (el.querySelector(':scope > .otg-seal')) return;
    el.classList.add('otg-lock');
    var s = document.createElement('div');
    s.className = 'otg-seal';
    s.innerHTML = '<div class="ic">&#937;</div>'
      + '<div class="rq">' + (tierName ? tierName.toUpperCase() + ' TIER' : 'HIGHER TIER') + ' REQUIRED</div>'
      + '<div class="hint">' + (label || '') + '</div>'
      + '<div class="hint"><a href="/subscriptions.html">view membership tiers &rarr;</a></div>';
    el.appendChild(s);
  }

  function tag(el, tierName, price) {
    if (el.querySelector(':scope > .otg-tag')) return;
    var t = document.createElement('span');
    t.className = 'otg-tag';
    t.innerHTML = '<i></i>' + (tierName ? tierName.toUpperCase() : 'TIER') + ' FEATURE';
    t.title = 'Included from the ' + (tierName || '') + ' tier'
            + (price ? ' ($' + price + ')' : '')
            + '. Enforcement begins when the economy activates.';
    el.appendChild(t);
  }

  function run(canon, memberTier, isOwner) {
    var els = document.querySelectorAll('[data-tier]');
    if (!els.length) return;

    var enforce = !!(canon.economy && canon.economy.tier_enforcement === true);
    var tiers = canon.tiers || [];

    // feature -> lowest tier that grants it
    var grantedBy = {};
    for (var i = 0; i < tiers.length; i++) {
      var u = tiers[i].unlocks || [];
      for (var j = 0; j < u.length; j++) {
        if (!grantedBy[u[j]]) grantedBy[u[j]] = tiers[i];
      }
    }
    // Rank of the member's own tier.
    // membership_tier stores an INTEGER rank (1-12) -- confirmed by
    // OmegaCanon.tierUnlocks(memberTierNum) and gaming.html's
    // Number(pr.data.membership_tier). Matching it against tier NAMES never
    // succeeded, so every member resolved to rank 0 and would have been shown
    // as entitled to nothing. Accept a number first, fall back to a name for
    // any deployment that stores text.
    var myRank = Number(memberTier);
    if (!isFinite(myRank) || myRank <= 0) {
      myRank = 0;
      for (var k = 0; k < tiers.length; k++) {
        if (String(tiers[k].name || '').toUpperCase() === String(memberTier || '').toUpperCase()) {
          myRank = Number(tiers[k].n) || 0; break;
        }
      }
    }
    var labels = canon.tier_features || {};

    for (var n = 0; n < els.length; n++) {
      var el = els[n];
      var feat = el.getAttribute('data-tier') || '';
      var need = grantedBy[feat];
      if (!need) continue;                       // unknown feature -> never lock
      var has = isOwner || myRank >= Number(need.n);
      if (has) continue;
      if (enforce) seal(el, need.name, need.price, labels[feat] || feat);
      else tag(el, need.name, need.price);
    }
  }

  function boot() {
    if (!document.querySelector('[data-tier]')) return;
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var C = window.OmegaCanon;
      if (C && C.ready) {
        clearInterval(iv);
        var sbp = window.OmegaSB ? window.OmegaSB.get()
          : import('/vendor/supabase-js.js').then(function (m) {
              return m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co",
                                    "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
            });
        sbp.then(function (sb) {
          return sb.auth.getSession().then(function (r) {
            var s = r && r.data && r.data.session;
            if (!s) { run(C, null, false); return; }
            return sb.from('profiles').select('membership_tier,is_owner')
              .eq('id', s.user.id).maybeSingle()
              .then(function (res) {
                var d = (res && res.data) || {};
                run(C, d.membership_tier, d.is_owner === true);
              });
          });
        }).catch(function () { /* never block the page on entitlement */ });
      } else if (tries > 40) { clearInterval(iv); }
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1200);   // catch content rendered after first paint
})();
