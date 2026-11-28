/* ============================================================================
   SYD OMEGA 91717 -- OWNER CERTIFICATE CONSOLE (approvals.html, operations tab)

   Issues a governed certificate (public.omega_certificates) to an existing member for an existing achievement, by calling
   public.omega_issue_certificate.  That function is the authority, not this file: it requires a signed-in owner
   (profiles.is_owner), an aal2 (two-factor) session, an existing subject and an existing active-definition achievement id, and it
   writes an event row.  Nothing here is trusted; a non-owner who loads this page gets the server's refusal, shown as it is.

   WHY THE OWNER ISSUES, NOT THE PLATFORM.  Stage progress is member-reported (the progression RPC takes a member-supplied task
   string), so a certificate derived from it would be a fabricated credential.  See docs/decisions/stage-certificates/PLAN.md.

   SUCCESS IS THE RETURNED ROW, NOT THE ABSENCE OF AN ERROR.  The function returns the new omega_certificates row; this file shows
   "issued" only when that row carries a certificate_number.  (approvals.js's rpcOnce cannot be reused: it counts a call as
   successful only when the result has ok:true, and this function returns a row.)

   Written with createElement/textContent only; no inline handlers (CSP inline ratchet).
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaCertificateConsole) return;

  var host = null, sb = null, state = { busy: false };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function whenClient(done, tries) {
    if (window.__omegaSb) return done(window.__omegaSb);
    if ((tries || 0) > 60) return done(null);
    setTimeout(function () { whenClient(done, (tries || 0) + 1); }, 150);
  }
  function loadMfa() {
    if (window.OmegaMFA) return Promise.resolve(window.OmegaMFA);
    return new Promise(function (resolve) {
      var s = document.querySelector('script[data-omega-mfa-mod]');
      if (!s) { s = document.createElement('script'); s.src = '/omega-mfa.js'; s.setAttribute('data-omega-mfa-mod', '1'); document.head.appendChild(s); }
      s.addEventListener('load', function () { resolve(window.OmegaMFA || null); });
      s.addEventListener('error', function () { resolve(null); });
      setTimeout(function () { resolve(window.OmegaMFA || null); }, 8000);
    });
  }

  /* Maps a server message to words the owner can act on.  Unknown messages are shown verbatim (never replaced by a success). */
  function explain(message) {
    var m = String(message || 'unknown_error');
    if (/aal2/i.test(m)) return 'Two-factor sign-in is required for this action. Confirm your authenticator code, then retry.';
    if (/owner_authorization_required/.test(m)) return 'Only the platform owner can issue certificates.';
    if (/certificate_subject_not_found/.test(m)) return 'That member no longer exists.';
    if (/achievement_not_found/.test(m)) return 'That achievement is not defined.';
    if (/certificate_number_already_exists/.test(m)) return 'A certificate with that number already exists.';
    return m;
  }

  /* One attempt; on an aal2 refusal, step up once and retry once. Returns {row} or {error}. */
  async function issue(args) {
    async function once() {
      var r = await sb.rpc('omega_issue_certificate', args);
      if (r.error) return { error: r.error.message || 'database_error' };
      var row = r.data && (Array.isArray(r.data) ? r.data[0] : r.data);
      if (!row || !row.certificate_number) return { error: 'No certificate was returned, so nothing is confirmed as issued.' };
      return { row: row };
    }
    var first = await once();
    if (!first.error || !/aal2/i.test(first.error)) return first;
    var mfa = await loadMfa();
    var up = mfa && mfa.stepUp ? await mfa.stepUp() : false;
    if (up !== true) return { error: 'aal2_required' };
    return once();
  }

  function option(select, value, label) { var o = document.createElement('option'); o.value = value; o.textContent = label; select.appendChild(o); }

  function build(members, achievements) {
    host.textContent = '';
    var form = el('div', 'd-form');
    var who = el('select'); who.id = 'cc-member'; who.setAttribute('aria-label', 'Member');
    option(who, '', 'Choose a member');
    members.forEach(function (m) { option(who, m.id, (m.display_name || 'Unnamed') + (m.email ? ' - ' + m.email : '')); });
    var what = el('select'); what.id = 'cc-achievement'; what.setAttribute('aria-label', 'Achievement');
    option(what, '', 'Choose an achievement');
    achievements.forEach(function (a) { option(what, a.achievement_id, (a.title || a.achievement_id) + ' (' + a.achievement_id + ')'); });
    var note = el('textarea'); note.id = 'cc-evidence'; note.setAttribute('aria-label', 'Evidence');
    note.placeholder = 'Evidence for this certificate (required, at least 10 characters): what was verified, by whom, and where the record is.';
    var go = el('button', 'd-send', 'ISSUE CERTIFICATE'); go.type = 'button'; go.id = 'cc-issue'; go.setAttribute('data-cert-action', 'issue');
    var out = el('div'); out.id = 'cc-result'; out.setAttribute('role', 'status'); out.setAttribute('aria-live', 'polite');
    form.appendChild(who); form.appendChild(what); form.appendChild(note); form.appendChild(go); form.appendChild(out);
    host.appendChild(form);
    host.appendChild(el('div', 'note', 'Issuing is owner-only and needs two-factor sign-in; the server enforces both. A certificate records that you verified evidence for an achievement. It does not move any score, and stage progress alone never creates one.'));
  }

  async function onIssue() {
    if (state.busy) return;
    var who = document.getElementById('cc-member'), what = document.getElementById('cc-achievement'), note = document.getElementById('cc-evidence');
    var out = document.getElementById('cc-result'), btn = document.getElementById('cc-issue');
    function say(text, bad) { out.textContent = text; out.style.color = bad ? 'var(--crim)' : 'var(--green)'; }
    var evidence = (note.value || '').trim();
    if (!who.value || !what.value) return say('Choose a member and an achievement first.', true);
    if (evidence.length < 10) return say('Evidence is required (at least 10 characters).', true);
    if (!window.confirm('Issue this certificate? It is recorded against the member and cannot be edited.')) return;
    state.busy = true; btn.disabled = true; say('Issuing...', false); out.style.color = 'var(--muted)';
    var result;
    try {
      result = await issue({ p_user_id: who.value, p_achievement_id: what.value, p_certificate_number: null, p_metadata: { source: 'owner_console', evidence_note: evidence.slice(0, 1000) } });
    } catch (e) { result = { error: (e && e.message) || 'request_failed' }; }
    state.busy = false; btn.disabled = false;
    if (result.error) return say('Not issued: ' + explain(result.error), true);
    say('Issued. Certificate number ' + result.row.certificate_number + ' (status ' + result.row.status + ').', false);
    note.value = '';
  }

  function boot() {
    host = document.getElementById('cert-console');
    if (!host) return;
    host.appendChild(el('div', 'note', 'Loading...'));
    whenClient(async function (client) {
      sb = client;
      if (!sb) { host.textContent = ''; host.appendChild(el('div', 'note', 'The database client did not load, so certificates cannot be issued from here.')); return; }
      var m = await sb.from('profiles').select('id,display_name,email').order('display_name', { ascending: true }).limit(500);
      var a = await sb.from('omega_achievement_definitions').select('achievement_id,title,lifecycle').eq('lifecycle', 'active').order('achievement_id', { ascending: true }).limit(200);
      if (m.error || a.error) { host.textContent = ''; host.appendChild(el('div', 'note', 'Could not load members or achievements: ' + ((m.error || a.error).message || 'error'))); return; }
      build(m.data || [], a.data || []);
    });
    host.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('[data-cert-action]') : null;
      if (b && b.getAttribute('data-cert-action') === 'issue') onIssue();
    });
  }

  window.OmegaCertificateConsole = { status: function () { return { mounted: !!host }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
