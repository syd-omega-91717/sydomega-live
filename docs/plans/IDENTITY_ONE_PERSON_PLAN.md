# One person, one account — design and threat model (HIGH-RISK: identity, schema, payments)

Written 2026-11-15. **A plan, nothing built, nothing applied.** Not legal advice; the owner's jurisdiction and the members' countries are not known to me.
Not reviewed by Codex (usage limit), so every claim is the author's.

## The rule (the owner's)
Each real person gets one account, identified by a passport, national ID or driving licence, so the legal and security conditions attach to a known person.

## What exists (verified from source; live database not readable this session)
- `supabase/migrations/20260927110344_kyc_intake_rpcs.sql`: document intake through `submit_kyc()`, **dormant behind `kyc_intake_enabled` (default false)**.
- The document goes into the shared private bucket `uploads` (`0022_storage.sql`: read only from the member's own folder). That bucket also holds ordinary uploads; it is not a dedicated identity store.
- `profile.html` consent: "my document being stored only until it is reviewed". `kyc.html` says documents "are processed by a regulated third-party verification provider and **never stored on the sovereign database**". **These two contradict each other.** Today the flag is off; the contradiction becomes a false privacy statement the day it is turned on.
- `profile.html` itself says the provider integration is "pending legal counsel sign-off". That is the owner's existing gate; this plan does not override it.
- `profiles.birth_date` has **no lock**: `account.html` lets a member resubmit it, and a trigger recomputes sign, element, god and agent from it (`0001_omega_master_deploy.sql`, `derive_cosmology`). Changing the date changes the character.
- The owner holds two accounts (`CLAUDE.md` section 1). A uniqueness rule must exempt `is_owner`, or it locks the owner out.

## What a vendor can do (checked against Stripe's documentation, 2026-11-15)
Stripe Identity's "Access verification results" page lists `verified_outputs` with `first_name`, `last_name`, `dob`, `address` and `id_number`. The fetched text does **not** say whether `id_number` needs extra permission, does **not** mention built-in detection of the same person verifying twice, and I did **not** check price, country coverage or selfie/biometric terms. Treat all of those as unknown until read in the Stripe dashboard. Stripe is already the platform's payment processor, which is the reason to look at it first, not a recommendation I can support with measured fit.

## Design
1. **The platform never holds an identity document.** A vendor verifies; we keep a result. The intake in `profile.html` stays off and is removed once a vendor path exists.
2. **Store only:** status, `verified_at`, the vendor's session id, and two keyed fingerprints. Fingerprint = HMAC-SHA256, key in an Edge Function secret, never in the database or client, over (a) issuing country + normalised document number, (b) normalised full name + date of birth + country. No number, image or selfie is stored.
3. **A fingerprint match opens a review for the owner. It never bans automatically.** Reasons: the same person can hold a passport and a licence with different numbers, so (a) misses them; two different people can share a name and a birth date, so (b) can match them.
4. **Owner exemption:** the uniqueness index excludes `is_owner`.
5. **Birth date:** once a verification succeeds, `birth_date` is taken from the verified output and locked (owner can unlock). Before that, lock it after the first entry.
6. **No biometric database of our own.** If the vendor runs a selfie check, the vendor is the processor; consent wording and a data-processing agreement are counsel's.
7. **Dormant:** `platform_settings.identity_verification_enabled`, default false. Nothing is live before counsel signs off.
8. **Writes are checked:** every webhook handler and RPC reads `.error` before recording "verified" (CLAUDE.md 8.1 class 1). A vendor outage leaves the member pending, never approved.
9. **Privileges:** member `SELECT` on own row only, no member `INSERT/UPDATE/DELETE`, writes by the service role only, `REVOKE EXECUTE ... FROM PUBLIC` on any new function (class 6).

## What this cannot do
Stop someone with two genuine documents, someone using another person's documents (that needs a liveness check), or families who share a household. In some countries the national ID number is itself restricted data, which is why only a keyed fingerprint is kept. The fingerprints are still personal data: retention, and what happens when a person deletes their account and later returns, are open questions for counsel.

## Before any code
1. Counsel sign-off (the owner's own gate on `profile.html`).
2. Reconcile `kyc.html` with the intake copy, and decide what happens to the shared `uploads` bucket.
3. Vendor choice, and its cost per check against the lowest tier ($9.17). I have not verified any vendor price.
4. The owner's jurisdiction and the members' countries.

## Build order once approved (none started)
Copy reconciliation, then migration (`identity_verifications` with the two fingerprints, partial unique index excluding the owner, RLS, flag), then Edge Functions (start session, webhook; both listed in `supabase/config.toml` and parsed with `npx typescript` since CI does not check them), then UI states, then RLS tests by real impersonation (`SET LOCAL ROLE authenticated` plus claims), non-owner against owner.
