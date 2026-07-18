/* ============================================================================
   SYD OMEGA 91717 -- MEMBERSHIP CARD (shared component)

   Shows a member what they chose, when it started, and when it ends.
   Mount it anywhere with a single element:

     <div data-membership-card></div>

   Renders in three places from ONE implementation:
     - dashboard.html  (first thing after sign-in)
     - settings.html   (where members expect account matters)
     - profile.html    (their record of what they hold)

   Deliberately one component rather than three copies. Member approval was
   previously implemented twice and the two versions drifted; billing state is
   exactly the kind of thing that must read identically everywhere.

   Data comes from my_subscription() -- tier, status, period_start, period_end,
   trial state and whether payments are live. No figure is invented: if a date
   is absent it says so rather than estimating.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaMembership) return;
  window.__omegaMembership = 1;

  var css = [
    '.omc{border:1px solid rgba(201,168,76,.18);background:linear-gradient(160deg,rgba(201,168,76,.06),rgba(10,10,15,.5));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:3px;padding:18px;font-family:"Rajdhani",sans-serif}',
    '.omc-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px}',
    '.omc-label{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2.5px;color:#8a8676}',
    '.omc-tier{font-family:"Cinzel Decorative",serif;font-size:20px;color:#C9A84C;line-height:1.1}',
    '.omc-status{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:1.5px;padding:3px 9px;border:1px solid;border-radius:2px}',
    '.omc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}',
    '.omc-cell{border:1px solid rgba(201,168,76,.12);border-radius:2px;padding:10px 12px;background:rgba(10,10,15,.35)}',
    '.omc-k{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:1.5px;color:#8a8676;margin-bottom:5px}',
    '.omc-v{font-size:14px;color:#e9e6dc;font-weight:600}',
    '.omc-note{font-size:11.5px;color:#8a8676;line-height:1.8;margin-top:12px}',
    '.omc-cta{display:inline-block;margin-top:12px;font-family:"Courier Prime",monospace;font-size:10px;letter-spacing:2px;padding:10px 18px;background:linear-gradient(90deg,#C9A84C,#E2C86D);color:#0A0A0F;text-decoration:none;border-radius:2px;font-weight:700}',
    '.omc-cta.ghost{background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,.4)}'
  ].join('');
  var st = document.createElement('style');
  st.id = 'omc-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function fmtDate(v) {
    if (!v) return null;
    try {
      var d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return null; }
  }

  function daysLeft(v) {
    if (!v) return null;
    try {
      var ms = new Date(v).getTime() - Date.now();
      if (isNaN(ms)) return null;
      return Math.ceil(ms / 86400000);
    } catch (e) { return null; }
  }

  function statusStyle(status, isTrial) {
    if (isTrial) return ['TRIAL', '#E2C86D', 'rgba(226,200,109,.4)'];
    switch (String(status || '').toLowerCase()) {
      case 'active':   return ['ACTIVE', '#3fb27f', 'rgba(63,178,127,.4)'];
      case 'trialing': return ['TRIALING', '#E2C86D', 'rgba(226,200,109,.4)'];
      case 'past_due': return ['PAST DUE', '#C0392B', 'rgba(192,57,43,.45)'];
      case 'canceled':
      case 'cancelled':return ['CANCELLED', '#8a8676', 'rgba(138,134,118,.35)'];
      default:         return ['NONE', '#8a8676', 'rgba(138,134,118,.35)'];
    }
  }

  function tierName(v) {
    /* membership_tier is an INTEGER rank (1-12). Displaying it raw would show
       "3" instead of "ADEPT". Resolve through canon when available; fall back
       to whatever was given if canon has not loaded or the value is a name. */
    if (v === null || v === undefined || v === '') return null;
    var n = Number(v);
    var C = window.OmegaCanon;
    if (isFinite(n) && n > 0 && C && C.tiers && C.tiers.length) {
      for (var i = 0; i < C.tiers.length; i++) {
        if (Number(C.tiers[i].n) === n) return C.tiers[i].name;
      }
    }
    return isFinite(n) && n > 0 ? ('TIER ' + n) : String(v);
  }

  function render(el, s) {
    var isTrial = s.is_trial === true;
    var tier = tierName(s.membership_tier) || s.tier || 'none';
    var hasPaid = s.status && String(s.status).toLowerCase() !== 'none';
    var st = statusStyle(s.status, isTrial);

    var startTxt = fmtDate(s.period_start);
    var endRaw   = isTrial ? s.trial_expires_at : s.period_end;
    var endTxt   = fmtDate(endRaw);
    var left     = daysLeft(endRaw);

    var html =
      '<div class="omc-head">' +
        '<div><div class="omc-label">MEMBERSHIP</div>' +
        '<div class="omc-tier">' + String(tier).toUpperCase() + '</div></div>' +
        '<span class="omc-status" style="color:' + st[1] + ';border-color:' + st[2] + '">' + st[0] + '</span>' +
      '</div>' +
      '<div class="omc-grid">' +
        '<div class="omc-cell"><div class="omc-k">STARTED</div><div class="omc-v">' +
          (startTxt || '&mdash;') + '</div></div>' +
        '<div class="omc-cell"><div class="omc-k">' + (isTrial ? 'TRIAL ENDS' : 'RENEWS') + '</div><div class="omc-v">' +
          (endTxt || '&mdash;') + '</div></div>' +
        '<div class="omc-cell"><div class="omc-k">TIME REMAINING</div><div class="omc-v">' +
          (left === null ? '&mdash;' : (left > 0 ? left + ' day' + (left === 1 ? '' : 's') : 'expired')) +
        '</div></div>' +
      '</div>';

    if (!hasPaid && !isTrial) {
      html += '<div class="omc-note">You are on the base <b style="color:#C9A84C">' +
              String(tier).toUpperCase() + '</b> standing. ' +
              (s.payments_enabled === true
                ? 'Choose a tier to unlock the systems it carries.'
                : 'The economy is not active yet -- no tier can be purchased and nothing is charged. Your access is unaffected.') +
              '</div>' +
              '<a class="omc-cta' + (s.payments_enabled === true ? '' : ' ghost') +
              '" href="/subscriptions.html">VIEW MEMBERSHIP TIERS &rarr;</a>';
    } else if (!startTxt) {
      html += '<div class="omc-note">No start date is recorded for this membership. ' +
              'Dates are written when the economy processes a subscription.</div>';
    } else {
      html += '<a class="omc-cta ghost" href="/subscriptions.html">MANAGE MEMBERSHIP &rarr;</a>';
    }

    el.className = 'omc';
    el.innerHTML = html;
  }

  function boot() {
    var mounts = document.querySelectorAll('[data-membership-card]');
    if (!mounts.length) return;

    var sbp = window.OmegaSB ? window.OmegaSB.get()
      : import('https://esm.sh/@supabase/supabase-js@2').then(function (m) {
          return m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co",
                                "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
        });

    sbp.then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        if (!r || !r.data || !r.data.session) return;      // signed out: render nothing
        return sb.rpc('my_subscription').then(function (res) {
          if (res.error) throw res.error;
          var s = res.data || {};
          for (var i = 0; i < mounts.length; i++) render(mounts[i], s);
        });
      });
    }).catch(function (e) {
      for (var i = 0; i < mounts.length; i++) {
        mounts[i].className = 'omc';
        mounts[i].innerHTML = '<div class="omc-label">MEMBERSHIP</div>' +
          '<div class="omc-note">Membership details are unavailable right now. ' +
          'If this persists, run <code style="color:#C9A84C">supabase/omega_subscription_dates.sql</code>.</div>';
      }
      console.log('membership', e);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1000);
})();
