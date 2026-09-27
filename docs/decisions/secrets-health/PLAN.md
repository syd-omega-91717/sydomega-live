# Status: APPROVED-BY-CODEX

# Plan: prove a key rotation without ever showing a key (`secrets-health`)

Decision record for `grill-me-codex` (Mode 1, `type=auth`; a new public-callable Edge
Function). The audit trail is in `CODEX_REVIEW.md` next to this file. Owner request,
2026-09-27: "Rotating the keys that appeared in earlier documents. Find a smart way to hide
and rotate."

## Goal

Keys appeared in documents outside this repo. Treat every one as compromised. The repo and its
full history hold none (key-shape scan, `GAP_ANALYSIS.md`); they live only in Supabase secrets.
Rotation happens at each provider and is the owner's action. What the platform lacked was
**proof**: the Owner Deck's DONE button recorded a timestamp on the owner's word, and nothing
could tell a rotated key from the old one, or a pasted key that does not work.

## Approach

- **Hide:** the keys stay where they are: Supabase secrets, read only inside Edge Functions. No
  new place holds one. The function returns no key, no provider body and no log line containing
  one.
- **Check:** `secrets-health` (POST, JWT) runs one free, read-only call per provider against a
  fixed URL, for Anthropic, Stripe, Resend, Twelve Data and Supabase service. The Stripe webhook
  secret gets presence only. Each key reports `set`, `live`, the provider's HTTP `status`, and
  `fp`, the first 8 hex of SHA-256.
- **Prove:** `changed` compares `fp` with the fingerprints recorded at the last confirmation.
  `confirm` records the new fingerprints and the rotation time **with the service role, inside
  the function**, so the page cannot claim a rotation the server did not observe. It refuses while
  any set key is failing.
- **Owner check:** the caller's own JWT calls `owner_security_status()`, so the rule is exactly
  the database's, including aal2 once owner two-factor is enforced. A non-owner gets `forbidden`
  and learns nothing, not even which secrets exist.
- **Owner Deck:** the ROTATE KEYS row gains VERIFY, which shows per key rotated, same key, failing
  or not set. DONE now goes through `confirm`.

## Key decisions

- D1: a truncated hash, not a key suffix. The last 4 characters of a key are provider-visible
  metadata and partly guessable; 32 bits of SHA-256 of a high-entropy secret identify nothing.
- D2: the provider's status code only. Error bodies can echo request details.
- D3: fingerprints live in `platform_settings` (owner-only under RLS). `bool_value` stays
  false, so the member-callable `get_platform_flag()` reveals nothing, as with
  `owner_secrets_rotated_at`.
- D4: the webhook secret cannot be probed without sending a signed event. It gets presence and
  fingerprint only, reported as `live: null`, never as working.

## Out of scope

Rotating at the providers, which is owner action at each dashboard (runbook:
`docs/runbooks/key-rotation.md`). Scheduled checks.

## Success criteria

1. Non-owner or anonymous → 403 or 401, with no key names.
2. An owner sees each key's `set`, `live`, `status` and `fp`; the response carries no key material.
3. After a real rotation, `changed` is true for that key; a re-pasted old key reads `false`.
4. `confirm` refuses while a set key is failing, and records only on a successful write.
