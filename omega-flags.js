/* ============================================================================
   SYD OMEGA 91717 -- PLATFORM FLAG GATE

   CLAUDE.md section 9 requires every monetizable or legally-sensitive feature to
   ship dormant behind `public.platform_settings`, with user-facing copy in
   future tense until the flag is actually on. The mechanism for that existed --
   `get_platform_flag(p_key)` -- but nothing shared implemented it. Three pages
   (`vault`, `sovereign-covenant`, `compliance`) only MENTION the flag in prose,
   and exactly one page (`interface-omni`) ever calls the RPC, to toggle it.

   So the rule was enforced by whoever remembered it, and the ad network shipped
   without it: `ad-network.html` rendered "TOTAL REVENUE $0.10 / CREATOR SHARE
   $0.07" and "Creators earn 70% revenue share" to every approved member, for
   money that does not exist and a payout that has never run.

   This module makes the rule mechanical instead of remembered. Mark the element:

       <div data-omega-flag="ad_network_enabled"> ... </div>

   and it is hidden until that flag reads true, replaced by a dormancy notice
   naming the flag. One attribute, no per-page plumbing, and no way to render a
   revenue figure that the platform cannot actually pay.

   IT FAILS CLOSED, DELIBERATELY.
   Every path that is not a confirmed `true` -- RPC error, no session, offline,
   the Supabase client never resolving -- leaves the content hidden. A gate that
   opens when it cannot reach the database is not a gate. Note that Supabase
   resolves to `{data,error}` and does NOT throw (CLAUDE.md section 8.1 class 1),
   so `.error` is checked explicitly rather than relied on to reject.

   HIDDEN BEFORE FIRST PAINT, NOT AFTER.
   The CSS rule is injected synchronously at parse time, so gated content is
   never briefly visible while the RPC is in flight. Revealing it later is an
   attribute flip on the element itself. The one thing worse than a dormant
   feature looking live is a dormant feature flashing live and then vanishing.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaFlags) return;

  var SEL = '[data-omega-flag]';

  /* Injected synchronously: at this point the gated elements further down the
     document have not been parsed yet, so they never get a visible frame. */
  try {
    if (!document.getElementById('omega-flag-css')) {
      var st = document.createElement('style');
      st.id = 'omega-flag-css';
      st.textContent =
        SEL + ':not([data-omega-flag-on]){display:none!important}' +
        '.omega-flag-dormant{border:1px solid rgba(201,168,76,.18);' +
        'background:rgba(201,168,76,.04);border-radius:4px;padding:14px 16px;' +
        'font-family:var(--M,monospace);font-size:12px;line-height:1.7;' +
        'color:var(--muted,rgba(138,134,118,.7))}' +
        '.omega-flag-dormant b{display:block;font-size:12px;letter-spacing:2.5px;' +
        'color:var(--gold,#C9A84C);margin-bottom:6px;font-weight:400}' +
        '.omega-flag-dormant code{color:var(--ink,rgba(220,210,180,.8))}';
      (document.head || document.documentElement).appendChild(st);
    }
  } catch (e) { /* a missing notice style must not stop the gate itself */ }

  var cache = {};   /* key -> Promise<boolean>, one RPC per key per page */

  function read(key) {
    if (cache[key]) return cache[key];
    cache[key] = new Promise(function (resolve) {
      if (!window.OmegaSB || typeof window.OmegaSB.get !== 'function') {
        return resolve(false);
      }
      window.OmegaSB.get().then(function (sb) {
        if (!sb || typeof sb.rpc !== 'function') return resolve(false);
        return sb.rpc('get_platform_flag', { p_key: key }).then(function (r) {
          /* Supabase resolves with {data,error}; an error here is a closed gate,
             never an open one. */
          if (!r || r.error) return resolve(false);
          resolve(r.data === true);
        });
      }).catch(function () { resolve(false); });
    });
    return cache[key];
  }

  function notice(key) {
    var d = document.createElement('div');
    d.className = 'omega-flag-dormant';
    d.setAttribute('role', 'note');
    var b = document.createElement('b');
    b.textContent = 'PLANNED · NOT YET ACTIVE';
    d.appendChild(b);
    d.appendChild(document.createTextNode('This capability is built but dormant. It stays off until '));
    var c = document.createElement('code');
    c.textContent = 'platform_settings.' + key;
    d.appendChild(c);
    d.appendChild(document.createTextNode(
      ' is enabled by the platform owner. Nothing here is live, and no amount shown anywhere on the platform is payable while it is off.'));
    return d;
  }

  function apply(el) {
    if (!el || el.getAttribute('data-omega-flag-seen')) return;
    el.setAttribute('data-omega-flag-seen', '1');
    var key = el.getAttribute('data-omega-flag');
    if (!key) return;
    read(key).then(function (on) {
      if (on) {
        el.setAttribute('data-omega-flag-on', '1');
        return;
      }
      /* Off: leave the element hidden and put the reason where it would have
         been, so the page reads as deliberately dormant rather than broken.
         `data-omega-flag-quiet` suppresses the notice for a gated fragment
         inside a section that already explains its own dormancy. */
      if (el.hasAttribute('data-omega-flag-quiet') || !el.parentNode) return;
      var prev = el.previousElementSibling;
      if (prev && prev.classList.contains('omega-flag-dormant')) return;
      el.parentNode.insertBefore(notice(key), el);
    });
  }

  function scan(root) {
    var list = (root || document).querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) apply(list[i]);
  }

  window.OmegaFlags = {
    /* Promise<boolean>. Always resolves; false is the safe answer. */
    get: read,
    scan: scan,
    /* For a page that must branch in JS rather than hide a subtree. */
    when: function (key, onTrue, onFalse) {
      return read(key).then(function (on) {
        if (on) { if (onTrue) onTrue(); } else if (onFalse) { onFalse(); }
        return on;
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(); });
  } else {
    scan();
  }
})();
