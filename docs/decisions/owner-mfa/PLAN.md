# Status: AWAITING-HUMAN-REVIEW

# Plan: Two-factor sign-in (TOTP), owner enforcement dormant behind a flag

Decision record for `grill-me-codex` (Mode 1, `type=auth`). The audit trail is in
`CODEX_REVIEW.md` next to this file. The owner approved starting this on 2026-09-26
("Do both"). Nothing in this plan turns enforcement on: both flags ship `false`, and
the server-side migration is **proposed, not applied**.

## Goal

The two owner accounts hold schema-wide authority: 161 RLS policies and 33
functions route through `private.is_platform_owner()`. Today that authority rests on
a password alone.

Measured live on 2026-09-26:
- `auth.mfa_factors` has **0** rows project-wide.
- No client code calls `auth.mfa.*`, so enrolment is impossible.
- The security advisor also flags leaked-password protection as off (#375).

A phished or reused owner password is therefore full platform compromise. The goal
is that owner authority requires a second factor (AAL2), with a recovery path that
cannot lock the owner out of the platform.

## Threat surface (the 8 classes plus `type=auth`)

| class | applies | where |
|---|---|---|
| 1 Stored XSS | yes | The factor's friendly name and TOTP secret are rendered. The QR code is an SVG data URI from Supabase. |
| 2 Silent-failure writes | **yes** | `enroll` / `challenge` / `verify` / `unenroll` all resolve to `{data,error}`. A missed `.error` shows "2FA on" while nothing is enrolled, which is the worst failure available here. |
| 3 RLS gaps | yes | Enforcement lives in `is_platform_owner()`. 24 functions check ownership without it (below). |
| 4 Column names | low | No table writes from the client. Supabase Auth owns `auth.mfa_*`. |
| 5 Module boundary | yes | New module, no inline handlers (the CSP ratchet enforces this). |
| 6 Unguarded RPC | no | No new public RPC. The flag reads go through the existing `get_platform_flag`. |
| 7 Races | yes | Repeated "enable" clicks create multiple *unverified* factors. The session AAL stays stale until refresh. |
| 8 Edge cases | **yes** | Lost device, clock skew, the flag turned on before enrolment, a stale JWT, both owners locked out. |
| auth: privilege escalation | yes | A member must not gain anything. An owner at AAL1 must lose owner powers once the flag is on. |
| auth: session | yes | The `aal` claim lives in the JWT. After verify, supabase-js must refresh the session or the claim stays `aal1`. |

## Approach

**Phase 1 (this change, dormant):**
1. **`omega-mfa.js`** (new module, CSP-clean):
   - `OmegaMFA.mount(el)` renders status, enrol (QR + manual secret), verify, and remove.
   - `OmegaMFA.stepUp()` prompts for a code when the session is AAL1 but has a verified factor (`nextLevel = aal2`).
   - Every Auth call checks `.error` before any success state.
2. **`settings.html` → Account tab:** a *Two-factor sign-in* section wrapped in `data-omega-flag="mfa_enrolment_enabled"`.
   - `omega-flags.js` fails closed.
   - The flag row does not exist, so the section stays hidden and the module never mounts.
3. **Proposed migration (`proposed_migration.sql`, NOT applied)**, owner enforcement at the database:
   - `private.is_platform_owner()` becomes: owner row exists **and** (`owner_mfa_required` is off **or** `auth.jwt()->>'aal' = 'aal2'`).
   - It seeds both flags `false`.

**Phase 2 (before `owner_mfa_required` may be turned on):**
4. Route the 24 functions that test `profiles.is_owner` / `platform_owners` directly through `is_platform_owner()`. Otherwise enforcement is partial. Measured live list:
   - `private.`: complete_task, get_all_members, grant_trial_access, my_lattice, order_stats, public_leaderboard, deactivate_account, delete_account, evaluate_policy, has_active_access, membership_report, my_matrix, omega_is_owner, ratify_existing_permanent_access, reject_member, request_account_erasure, revoke_member, revoke_permanent_access
   - `public.`: derive_cosmology, enforce_access_defaults, compute_leaderboard_snapshot, guard_profile_privileges, protect_owner_lifetime, sync_platform_owner

   Several are triggers or "is this row the owner's" checks, not "is the caller the owner". Each needs reading, not a blanket rewrite.
5. `approvals.html` calls `OmegaMFA.stepUp()` before owner actions, so an AAL1 owner is asked for a code instead of seeing silent `owner_only` refusals.

## Key decisions

- **D1 — Enforce in the database, not the page.** A client-side AAL check is UX only. RLS and owner RPCs are the authorization boundary (CLAUDE.md §1), so the AAL2 test goes in `is_platform_owner()`, the one function 161 policies and 33 functions already call.
- **D2 — Owners only, members optional.** Members may enrol once the UI flag is on. Nothing member-facing requires AAL2 in phase 1.
- **D3 — TOTP only.** No SMS: SIM-swap exposure, provider cost, and no SMS provider configured. No WebAuthn yet: supabase-js exposes TOTP.
- **D4 — Two flags, both off.**
  - `mfa_enrolment_enabled` gates the UI.
  - `owner_mfa_required` gates enforcement.
  - Order of switch-on: UI on → both owners enrol (two devices each) → phase 2 lands → enforcement on.
- **D5 — Break-glass is the SQL editor.** With enforcement on and a device lost, the owner signs in to the Supabase dashboard (its own account and MFA, separate from this app) and sets `owner_mfa_required=false`, or deletes the lost factor. Nothing in the app can bypass AAL2, by design.
- **D6 — No new RPC.** Enrolment is Supabase Auth's API. Adding a server path would only add attack surface.
- **D7 — QR as `<img src>`, never `innerHTML`.** An SVG in an `<img>` cannot run script. The secret and friendly name use `textContent`. The CSP already allows `img-src data:`.

## Risks / open questions

- **Lock-out.** Enforcement on while an owner holds no verified factor means that owner silently loses owner powers (RLS denies; the login still works). Mitigations: D4 ordering, D5, and a pre-flight query in the success criteria.
- **Stale claim.** Supabase re-issues the JWT on `verify`. If a tab keeps an older session, owner calls fail until refresh. `stepUp()` calls `refreshSession()` after verify.
- **Unverified factor build-up.** Clicking enrol twice leaves an unverified factor. `mount()` removes this user's unverified TOTP factors before enrolling a new one.
- **Performance.** `is_platform_owner()` gains a flag lookup, a single-row PK read. It is STABLE, and the policies already wrap it as an init-plan `(select ...)`.
- **Phase 2 is real work.** 24 functions, each read individually. Until it lands, turning enforcement on protects the 161 policies and 33 functions, not everything.

## Out of scope

- Enforcing AAL2 for members.
- Recovery codes (Supabase has no native backup codes).
- WebAuthn / passkeys.
- Session-length policy.
- Leaked-password protection: a dashboard toggle, owner action #375.

## Success criteria

1. With both flags off, nothing member-visible changes. The Settings section is not rendered (`data-omega-flag` fails closed), and `is_platform_owner()` returns exactly what it does today (verified by impersonation before and after, once the migration is applied).
2. With `mfa_enrolment_enabled=true`, a member can enrol, verify and remove a TOTP factor, and every failed Auth call shows its error, not success.
3. Before `owner_mfa_required=true`, this returns 0 rows:
   ```sql
   SELECT p.user_id FROM platform_owners p
   WHERE NOT EXISTS (SELECT 1 FROM auth.mfa_factors f
                     WHERE f.user_id = p.user_id AND f.status = 'verified');
   ```
4. With enforcement on:
   - an owner JWT at `aal1` gets `is_platform_owner() = false`;
   - the same owner at `aal2` gets `true`;
   - members are unchanged.

   All three are verified with the `SET LOCAL ROLE` + `request.jwt.claims` method (CLAUDE.md §8.4), with `aal` set explicitly in the claims.
