/* ==========================================================================
   Ω SYD OMEGA 91717 — TWO-FACTOR SIGN-IN GATE (omega-mfa-gate.js)

   docs/decisions/owner-mfa/PLAN.md named this as the precondition of owner
   enforcement: "stepUp() has no caller -- no sign-in path asks for the code".
   With owner_mfa_required on, an owner signing in with a password alone gets
   an aal1 session, is_platform_owner() returns false, and every owner power
   fails silently. This asks for the code instead.

   Rule, the one mature apps use: a session that holds a verified
   authenticator factor but has not yet confirmed a code this session
   (currentLevel aal1, nextLevel aal2) must enter it. The only ways out are a
   valid code or SIGN OUT. It applies to any account that enrolled, owner or
   member -- enrolling is the member's own choice.

   Where: every page bg.js GUARDS. It acts only when bg.js installed the
   approval guard (#omega-approval-guard), so it reuses bg.js's own
   public-page list instead of keeping a second copy (CLAUDE.md 8.1 class 8).

   Cost: one local call (getAuthenticatorAssuranceLevel reads the session's
   JWT). The 300-line omega-mfa.js loads only when a code is actually due.

   An outage never signs anyone out: stepUp({required:true}) resolves null on
   any failure before the prompt, and only an explicit SIGN OUT ends the
   session. The database stays the authority either way.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaMfaGate) return;
  window.__omegaMfaGate = true;

  function client() {
    try {
      if (window.OmegaSB && typeof window.OmegaSB.get === 'function') return Promise.resolve(window.OmegaSB.get());
    } catch (e) {}
    return Promise.resolve(window.__omegaSb || null);
  }

  function loadMfa() {
    if (window.OmegaMFA) return Promise.resolve(window.OmegaMFA);
    return new Promise(function (resolve) {
      var s = document.querySelector('script[data-omega-mfa-mod]');
      if (!s) {
        s = document.createElement('script');
        s.src = '/omega-mfa.js';
        s.setAttribute('data-omega-mfa-mod', '1');
        document.head.appendChild(s);
      }
      s.addEventListener('load', function () { resolve(window.OmegaMFA || null); });
      s.addEventListener('error', function () { resolve(null); });
    });
  }

  var running = false;
  function check() {
    if (running) return;
    if (!document.getElementById('omega-approval-guard')) return;   // public page
    running = true;
    client().then(function (sb) {
      if (!sb || !sb.auth || !sb.auth.mfa) return;
      return sb.auth.getSession().then(function (r) {
        if (!r || r.error || !r.data || !r.data.session) return;
        return sb.auth.mfa.getAuthenticatorAssuranceLevel().then(function (l) {
          var d = l && l.data;
          if (!d || l.error || d.currentLevel !== 'aal1' || d.nextLevel !== 'aal2') return;
          document.documentElement.setAttribute('data-omega-mfa-gate', 'due');
          return loadMfa().then(function (M) {
            if (!M || !M.stepUp) return;
            return M.stepUp({ required: true }).then(function (res) {
              if (res === true) { document.documentElement.setAttribute('data-omega-mfa-gate', 'passed'); return; }
              if (res === 'signout') {
                return sb.auth.signOut().then(function () {}, function () {}).then(function () {
                  location.replace('/account.html');
                });
              }
            });
          });
        });
      });
    }).catch(function () { /* an outage must never lock anyone out */ })
      .then(function () { running = false; });
  }

  window.OmegaMFAGate = { check: check };
  /* After the approval guard is installed; and again when the tab returns,
     since a session can be replaced (a fresh sign-in) in another tab. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
})();
