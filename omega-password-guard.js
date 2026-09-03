/* omega-password-guard.js — password strength + known-breach check at the
 * point a member sets a password.
 *
 * WHY THIS EXISTS
 *
 * The Supabase security advisor reports `auth_leaked_password_protection`
 * disabled. That feature checks new passwords against HaveIBeenPwned before
 * Auth accepts them. It is a project-level Auth setting, and Supabase's own
 * documentation states plainly: "Leaked password protection is available on
 * the Pro Plan and above." Checked live on 2026-09-03, organisation
 * vztvuckpdsoriyvpdkzx is on plan `free`, so the toggle is not merely off —
 * it is absent, and no SQL or Management API call can reach it.
 *
 * The corpus behind it is not gated, though. HaveIBeenPwned's Pwned Passwords
 * range API is free, needs no key, and is the same data Supabase queries. So
 * the advisory's THREAT — a member choosing a password that already appears in
 * a breach corpus — is closed here instead, at the two places this platform
 * sets a password: account.html (sign up) and reset.html (recovery).
 *
 * WHAT THIS IS NOT
 *
 * It is a client-side check, and it is honest about that. Anyone calling the
 * Supabase Auth API directly bypasses it entirely; only the Pro-plan server
 * setting is unbypassable. What it does cover is the real threat model for an
 * invite-gated platform with a handful of members: a member picking a
 * compromised or weak password through the platform's own UI. Do not record
 * the advisory as resolved on the strength of this file.
 *
 * K-ANONYMITY — the full password never leaves the browser
 *
 * SHA-1 the password locally, send only the FIRST FIVE hex characters of the
 * digest, and receive every suffix sharing that prefix (typically 300-900 of
 * them). The comparison happens here. HaveIBeenPwned never learns the
 * password, the hash, or which suffix matched. SHA-1 is the API's required
 * digest and is not being relied on for security — the hash is a lookup key,
 * not a credential store.
 *
 * FAILURE BEHAVIOUR, and why it fails OPEN
 *
 * If the range API is unreachable, or crypto.subtle is unavailable, the check
 * cannot run. It then returns `checked: false` and does NOT block: making
 * account creation a hard dependency on a third-party service would trade a
 * password-quality risk for a total-signup-outage risk, and Supabase's own
 * implementation allows the password through when the service is down too.
 *
 * What it must never do is claim a check it did not perform. CLAUDE.md 8.1's
 * most repeated bug class in this repo is a UI reporting success it never
 * verified, so `breached` is a THREE-state value: true, false, or null for
 * "not established". A caller that renders "not found in any breach" on a null
 * is reintroducing exactly that bug.
 *
 * Strength rules follow Supabase's own free-tier guidance on the same docs
 * page: a long minimum, and a mix of character classes.
 */
(function (root) {
  'use strict';

  var MIN_LENGTH = 12;
  var RANGE_API = 'https://api.pwnedpasswords.com/range/';
  var TIMEOUT_MS = 6000;

  var CLASSES = [
    { id: 'lowercase', re: /[a-z]/ },
    { id: 'uppercase', re: /[A-Z]/ },
    { id: 'digit', re: /[0-9]/ },
    { id: 'symbol', re: /[^A-Za-z0-9]/ }
  ];
  var MIN_CLASSES = 3;

  /* Pure, synchronous, no network — kept separate so it is testable on its own
   * and so a caller can render live feedback as the member types without
   * issuing a request per keystroke. */
  function strength(password, email) {
    var reasons = [];
    var pw = typeof password === 'string' ? password : '';

    if (pw.length < MIN_LENGTH) {
      reasons.push('Use at least ' + MIN_LENGTH + ' characters (currently ' + pw.length + ').');
    }

    var present = CLASSES.filter(function (c) { return c.re.test(pw); });
    if (present.length < MIN_CLASSES) {
      reasons.push('Mix at least ' + MIN_CLASSES + ' of: lowercase, uppercase, digits, symbols (currently ' +
        present.length + ').');
    }

    // A password built from the address it protects is guessable from the
    // account name alone, however long it is.
    if (email && typeof email === 'string' && email.indexOf('@') > 0) {
      var local = email.split('@')[0].toLowerCase();
      if (local.length >= 3 && pw.toLowerCase().indexOf(local) !== -1) {
        reasons.push('Do not build the password out of your email address.');
      }
    }

    // A single repeated character passes a naive length test.
    if (pw.length >= MIN_LENGTH && /^(.)\1+$/.test(pw)) {
      reasons.push('One character repeated is not a password.');
    }

    return { ok: reasons.length === 0, reasons: reasons, classes: present.length };
  }

  function toHex(buffer) {
    var view = new Uint8Array(buffer), out = '';
    for (var i = 0; i < view.length; i++) {
      out += (view[i] < 16 ? '0' : '') + view[i].toString(16);
    }
    return out.toUpperCase();
  }

  function sha1Hex(text) {
    var subtle = root.crypto && root.crypto.subtle;
    if (!subtle || typeof TextEncoder === 'undefined') {
      return Promise.reject(new Error('crypto.subtle unavailable'));
    }
    return subtle.digest('SHA-1', new TextEncoder().encode(text)).then(toHex);
  }

  /* Resolves to {breached, count, checked}. Never rejects: an unreachable API
   * is an unknown, not a failure the caller has to catch. */
  function breachCheck(password) {
    var unknown = { breached: null, count: 0, checked: false };
    if (!password) return Promise.resolve(unknown);

    return sha1Hex(password).then(function (hash) {
      var prefix = hash.slice(0, 5), suffix = hash.slice(5);

      // No custom headers: a simple GET avoids a CORS preflight, which is one
      // more thing that can fail between here and an answer.
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

      return fetch(RANGE_API + prefix, controller ? { signal: controller.signal } : undefined)
        .then(function (res) {
          if (timer) clearTimeout(timer);
          if (!res.ok) throw new Error('range API HTTP ' + res.status);
          return res.text();
        })
        .then(function (body) {
          var lines = body.split('\n');
          for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].trim().split(':');
            if (parts[0] === suffix) {
              return { breached: true, count: parseInt(parts[1], 10) || 0, checked: true };
            }
          }
          return { breached: false, count: 0, checked: true };
        })
        .catch(function () { if (timer) clearTimeout(timer); return unknown; });
    }).catch(function () { return unknown; });
  }

  /* The one call a page should make before submitting a password.
   *
   * Resolves to {allow, reasons[], breached, count, checked}. `allow` is false
   * only for a rule this platform can actually stand behind: too weak, or
   * positively found in the corpus. An unestablished breach result allows —
   * and reports checked:false so the caller can say so rather than imply a
   * clean bill of health. */
  function evaluate(password, email) {
    var s = strength(password, email);
    if (!s.ok) {
      return Promise.resolve({
        allow: false, reasons: s.reasons, breached: null, count: 0, checked: false
      });
    }
    return breachCheck(password).then(function (b) {
      if (b.breached === true) {
        return {
          allow: false,
          reasons: ['This password appears in ' + b.count.toLocaleString() +
                    ' known data breaches. Choose one you have never used elsewhere.'],
          breached: true, count: b.count, checked: true
        };
      }
      return { allow: true, reasons: [], breached: b.breached, count: 0, checked: b.checked };
    });
  }

  var api = {
    MIN_LENGTH: MIN_LENGTH,
    MIN_CLASSES: MIN_CLASSES,
    strength: strength,
    breachCheck: breachCheck,
    evaluate: evaluate
  };

  root.OmegaPasswordGuard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
