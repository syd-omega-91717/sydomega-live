// SYD OMEGA 91717 — the one server-side answer to "may this caller read Studios canon?".
//
// Plain ES module (.mjs) on purpose, so Deno imports it and any Node runs it with no flag. Pure: no Deno, no network. The studio-canon function feeds it the caller's `profiles` row and acts on
// the verdict; scripts/tests/test_studio_canon_gate.py runs every case below under Node.
//
// It mirrors the client approval guard in bg.js (`access_approved === false && !is_owner && !is_trial` sends a visitor to
// /pending.html) and is stricter in three places, because this is the real boundary and bg.js is only a UI veil:
//   - no profile row, a read error, or an unreadable flag is a DENY, never an allow;
//   - a rejected account is denied even if access_approved is still true;
//   - a trial whose expiry has passed is denied even if the expiry job has not flipped access_approved yet.

/**
 * @typedef {{ is_owner?: boolean|null, access_approved?: boolean|null, is_rejected?: boolean|null,
 *             is_trial?: boolean|null, trial_expires_at?: string|null }} Profile
 * @typedef {{ ok: true } | { ok: false, status: 401|403|503,
 *             error: "not_authenticated"|"access_not_approved"|"profile_unavailable" }} Verdict
 */

/**
 * @param {string|null} userId
 * @param {Profile|null} profile
 * @param {boolean} profileError
 * @param {number} nowMs
 * @returns {Verdict}
 */
export function decideAccess(userId, profile, profileError, nowMs) {
  if (!userId) return { ok: false, status: 401, error: "not_authenticated" };
  if (profileError) return { ok: false, status: 503, error: "profile_unavailable" };
  if (!profile) return { ok: false, status: 403, error: "access_not_approved" };
  if (profile.is_owner === true) return { ok: true };
  if (profile.is_rejected === true) return { ok: false, status: 403, error: "access_not_approved" };
  if (profile.access_approved !== true) return { ok: false, status: 403, error: "access_not_approved" };
  if (profile.is_trial === true) {
    const exp = profile.trial_expires_at ? Date.parse(profile.trial_expires_at) : NaN;
    // A trial with no readable expiry cannot be shown to be live: deny.
    if (!Number.isFinite(exp) || exp <= nowMs) return { ok: false, status: 403, error: "access_not_approved" };
  }
  return { ok: true };
}

/**
 * Unreleased Studios canon is for the owner accounts only; an approved member is not enough.
 * Same fail-closed rules: no caller 401, a profile read error 503, no row or any value but literal true 403.
 * @param {string|null} userId
 * @param {Profile|null} profile
 * @param {boolean} profileError
 * @returns {Verdict | { ok: false, status: 403, error: "owner_only" }}
 */
export function decideOwner(userId, profile, profileError) {
  if (!userId) return { ok: false, status: 401, error: "not_authenticated" };
  if (profileError) return { ok: false, status: 503, error: "profile_unavailable" };
  if (!profile || profile.is_owner !== true) return { ok: false, status: 403, error: "owner_only" };
  return { ok: true };
}
