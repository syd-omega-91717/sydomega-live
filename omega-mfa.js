/* ============================================================================
   SYD OMEGA 91717 -- TWO-FACTOR SIGN-IN (TOTP)

   Decision record: docs/decisions/owner-mfa/PLAN.md (threat model, flags,
   break-glass). This module is the client half only. Authorization is enforced
   by the database (private.is_platform_owner(), proposed), never here: a page
   can be bypassed with a direct REST call, RLS cannot.

   DORMANT. The Settings section that mounts this is wrapped in
   data-omega-flag="mfa_enrolment_enabled", and omega-flags.js fails closed, so
   until that flag row reads true nothing renders and mount() is never called.

   Mount:  <div data-omega-mfa></div>   (auto-mounted once revealed)
   API:    window.OmegaMFA.mount(el)    enrol / verify / remove, for the caller
           window.OmegaMFA.stepUp()     -> Promise<boolean>: prompts for a code
                                        when the session is aal1 and a verified
                                        factor exists (nextLevel aal2)

   Every Auth call resolves to {data, error} and does not throw (CLAUDE.md 8.1
   class 1), so each .error is checked before any state is shown. A false
   "two-factor is on" is the worst failure this module could have.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaMFA) return;

  var FLAG = 'mfa_enrolment_enabled';

  function client() {
    if (!window.OmegaSB || typeof window.OmegaSB.get !== 'function') {
      return Promise.reject(new Error('Supabase client unavailable'));
    }
    return window.OmegaSB.get().then(function (sb) {
      if (!sb || !sb.auth || !sb.auth.mfa) throw new Error('Two-factor API unavailable');
      return sb;
    });
  }

  /* Supabase resolves to {data,error}; turn an error into a rejection so one
     .catch() per flow reports it, and nothing downstream sees a null data. */
  function ok(r) {
    if (!r || r.error) throw (r && r.error) || new Error('No response');
    return r.data;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function button(label, primary) {
    var b = el('button', primary ? 'btn btn-fill' : 'btn', label);
    b.type = 'button';
    return b;
  }

  function codeInput() {
    var i = el('input', 'inp');
    i.type = 'text';
    i.inputMode = 'numeric';
    i.autocomplete = 'one-time-code';
    i.maxLength = 6;
    i.pattern = '[0-9]{6}';
    i.placeholder = '6-digit code';
    i.setAttribute('aria-label', 'Six-digit code from your authenticator app');
    return i;
  }

  function validCode(v) { return /^[0-9]{6}$/.test(String(v || '').trim()); }

  function injectStyle() {
    if (document.getElementById('omega-mfa-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-mfa-css';
    s.textContent =
      '.omfa{display:grid;gap:12px;max-width:520px}' +
      '.omfa-status{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px}' +
      '.omfa-status.on{color:var(--green,#4caf50)}.omfa-status.off{color:var(--muted,#8a8676)}' +
      '.omfa-msg{font-size:13px;min-height:1.2em}.omfa-msg.err{color:var(--crim,#e05a5a)}' +
      '.omfa-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
      '.omfa-qr{width:180px;height:180px;background:#fff;padding:8px;border-radius:4px}' +
      '.omfa-secret{font-family:var(--M,monospace);font-size:12px;word-break:break-all;' +
      'user-select:all;color:var(--ink,#e9e6dc)}' +
      '.omfa-factor{display:flex;justify-content:space-between;gap:8px;align-items:center;' +
      'padding:8px 0;border-top:1px solid rgba(201,168,76,.12)}' +
      '.omfa-dialog{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;' +
      'background:rgba(0,0,0,.6)}' +
      '.omfa-dialog>div{background:var(--void2,#0a0a0f);border:1px solid rgba(201,168,76,.3);' +
      'border-radius:6px;padding:20px;display:grid;gap:12px;width:min(360px,calc(100vw - 32px))}';
    document.head.appendChild(s);
  }

  /* ── ENROL / VERIFY / REMOVE ─────────────────────────────────────────── */
  function mount(root) {
    if (!root || root.__omfa) return;
    root.__omfa = true;
    injectStyle();
    root.textContent = '';
    var box = el('div', 'omfa');
    var status = el('div', 'omfa-status off', 'Checking two-factor status…');
    var list = el('div');
    var area = el('div');
    var msg = el('div', 'omfa-msg');
    msg.setAttribute('role', 'status');
    box.append(status, list, area, msg);
    root.appendChild(box);

    function say(text, isErr) {
      msg.textContent = text || '';
      msg.className = 'omfa-msg' + (isErr ? ' err' : '');
    }
    function fail(e) { say((e && e.message) || 'Something went wrong. Nothing was changed.', true); }

    function refresh() {
      area.textContent = '';
      list.textContent = '';
      return client().then(function (sb) {
        return sb.auth.mfa.listFactors().then(ok).then(function (d) {
          var all = (d && d.all) || [];
          var verified = all.filter(function (f) { return f.factor_type === 'totp' && f.status === 'verified'; });
          status.textContent = verified.length
            ? 'TWO-FACTOR IS ON · ' + verified.length + ' authenticator' + (verified.length > 1 ? 's' : '')
            : 'TWO-FACTOR IS OFF';
          status.className = 'omfa-status ' + (verified.length ? 'on' : 'off');
          verified.forEach(function (f) {
            var row = el('div', 'omfa-factor');
            row.appendChild(el('span', '', f.friendly_name || 'Authenticator app'));
            var rm = button('Remove');
            rm.addEventListener('click', function () { remove(sb, f.id); });
            row.appendChild(rm);
            list.appendChild(row);
          });
          var add = button(verified.length ? 'Add another authenticator' : 'Turn on two-factor', !verified.length);
          add.addEventListener('click', function () { enrol(sb, all); });
          area.appendChild(add);
        });
      }).catch(fail);
    }

    function enrol(sb, all) {
      say('');
      /* Clear this user's own abandoned, unverified TOTP factors first:
         repeated clicks would otherwise pile them up against the per-user cap. */
      var stale = all.filter(function (f) { return f.factor_type === 'totp' && f.status !== 'verified'; });
      var cleanup = stale.reduce(function (p, f) {
        return p.then(function () { return sb.auth.mfa.unenroll({ factorId: f.id }).then(ok); });
      }, Promise.resolve());
      cleanup.then(function () {
        return sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator ' + new Date().toISOString().slice(0, 10) });
      }).then(ok).then(function (d) {
        if (!d || !d.id || !d.totp) throw new Error('Enrolment returned no factor. Nothing was changed.');
        area.textContent = '';
        area.appendChild(el('p', '', 'Scan this with your authenticator app, then enter the 6-digit code it shows.'));
        var qr = el('img', 'omfa-qr');
        var src = String(d.totp.qr_code || '');
        /* An SVG inside <img> cannot run script; it is never injected as markup. */
        qr.src = src.indexOf('data:') === 0 ? src : 'data:image/svg+xml;utf-8,' + encodeURIComponent(src);
        qr.alt = 'QR code for your authenticator app';
        area.appendChild(qr);
        area.appendChild(el('p', '', 'Or enter this key by hand:'));
        area.appendChild(el('div', 'omfa-secret', d.totp.secret || ''));
        var row = el('div', 'omfa-row');
        var input = codeInput();
        var go = button('Verify', true);
        var cancel = button('Cancel');
        row.append(input, go, cancel);
        area.appendChild(row);
        input.focus();
        function submit() {
          if (!validCode(input.value)) { say('Enter the 6-digit code from the app.', true); return; }
          go.disabled = true;
          verify(sb, d.id, input.value.trim()).then(function () {
            say('Two-factor sign-in is on for this account.');
            return refresh();
          }).catch(function (e) { go.disabled = false; fail(e); });
        }
        go.addEventListener('click', submit);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
        cancel.addEventListener('click', function () {
          sb.auth.mfa.unenroll({ factorId: d.id }).then(ok).then(refresh).catch(fail);
        });
      }).catch(fail);
    }

    function remove(sb, id) {
      if (!window.confirm('Remove this authenticator? Sign-in will no longer ask for its code.')) return;
      say('');
      /* Supabase requires an aal2 session to remove a verified factor; step up
         first, then remove, and show the server's answer either way. */
      stepUp().then(function (up) {
        if (!up) throw new Error('Removal needs a current code from this authenticator.');
        return sb.auth.mfa.unenroll({ factorId: id }).then(ok);
      }).then(function () {
        say('Authenticator removed.');
        return refresh();
      }).catch(fail);
    }

    refresh();
  }

  function verify(sb, factorId, code) {
    return sb.auth.mfa.challenge({ factorId: factorId }).then(ok).then(function (c) {
      if (!c || !c.id) throw new Error('No challenge was issued. Try again.');
      return sb.auth.mfa.verify({ factorId: factorId, challengeId: c.id, code: code }).then(ok);
    }).then(function () {
      /* The aal claim lives in the JWT: make sure this tab holds the new one. */
      return sb.auth.refreshSession().then(ok);
    });
  }

  /* ── STEP-UP ─────────────────────────────────────────────────────────── */
  function stepUp() {
    return client().then(function (sb) {
      return sb.auth.mfa.getAuthenticatorAssuranceLevel().then(ok).then(function (lvl) {
        if (!lvl || lvl.currentLevel === 'aal2') return true;
        if (lvl.nextLevel !== 'aal2') return false; /* no verified factor to step up with */
        return sb.auth.mfa.listFactors().then(ok).then(function (d) {
          var f = ((d && d.totp) || []).filter(function (x) { return x.status === 'verified'; })[0];
          if (!f) return false;
          return prompt(sb, f.id);
        });
      });
    }).catch(function () { return false; });
  }

  function prompt(sb, factorId) {
    injectStyle();
    return new Promise(function (resolve) {
      var wrap = el('div', 'omfa-dialog');
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.setAttribute('aria-label', 'Two-factor confirmation');
      var card = el('div');
      var input = codeInput();
      var msg = el('div', 'omfa-msg');
      var row = el('div', 'omfa-row');
      var go = button('Confirm', true);
      var cancel = button('Cancel');
      row.append(go, cancel);
      card.append(el('b', '', 'Confirm it is you'),
        el('p', '', 'Enter the 6-digit code from your authenticator app.'), input, msg, row);
      wrap.appendChild(card);
      document.body.appendChild(wrap);
      input.focus();
      function done(v) { wrap.remove(); resolve(v); }
      function submit() {
        if (!validCode(input.value)) { msg.className = 'omfa-msg err'; msg.textContent = 'Enter the 6-digit code.'; return; }
        go.disabled = true;
        verify(sb, factorId, input.value.trim()).then(function () { done(true); })
          .catch(function (e) {
            go.disabled = false;
            msg.className = 'omfa-msg err';
            msg.textContent = (e && e.message) || 'That code was not accepted.';
          });
      }
      go.addEventListener('click', submit);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') done(false);
      });
      cancel.addEventListener('click', function () { done(false); });
    });
  }

  window.OmegaMFA = { mount: mount, stepUp: stepUp };

  /* Mount only once the flag is confirmed on. omega-flags.js is injected by
     bg.js and may arrive after this file, so wait for it briefly; if it never
     arrives the section stays hidden and nothing is mounted (fails closed). */
  function boot(tries) {
    var targets = document.querySelectorAll('[data-omega-mfa]');
    if (!targets.length) return;
    if (!window.OmegaFlags || typeof window.OmegaFlags.when !== 'function') {
      if (tries < 40) setTimeout(function () { boot(tries + 1); }, 250);
      return;
    }
    window.OmegaFlags.when(FLAG, function () {
      Array.prototype.forEach.call(targets, mount);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(0); });
  } else {
    boot(0);
  }
})();
