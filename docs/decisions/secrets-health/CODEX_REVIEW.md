# Codex review — `secrets-health` (Mode 1, `type=auth`)

## Round 1 — VERDICT: REVISE

1. **Class 6, auth.** A `verify_jwt` gate proves a session, not an owner. **Fix:** gate on
   `owner_security_status()` through the caller's JWT, so the aal2 rule applies with no second
   copy of the owner rule (class 8).
2. **Leak surface.** Relaying a provider's error JSON can echo request details, and a thrown
   `fetch` error can carry the URL. The Twelve Data key must not go in a query string. **Fix:**
   return the status code only, catch all errors to `status: null`, and send the Twelve Data key
   in the `Authorization: apikey` header.
3. **Class 1, silent write.** `confirm` must not report `recorded` unless the upsert returned no
   error. **Fix:** check `write.error` and return `record_failed`.
4. **Forgery.** A client-side "rotated" flag is the gap being closed. **Fix:** only the function,
   holding the service role, writes the fingerprints.
5. **SSRF.** No caller-supplied URL; the endpoints are fixed. Checked, no change.

## Round 2 — VERDICT: APPROVED

Findings 1–4 are in `supabase/functions/secrets-health/index.ts`. Residual risk: a 32-bit
fingerprint could confirm a guessed key only to someone already holding the key. Accepted.
