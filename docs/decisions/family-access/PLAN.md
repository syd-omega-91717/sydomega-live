# Status: REVISE (rounds 1-2 folded in; round 3 reviews the implementation diff)

## Goal

The owner's decision (2026-10-12, blueprint points 12, 13, 455, N142): the owner can grant
**free, permanent access to adult family members** (spouse, adult children) and link those
accounts to the owner's as *family*. Family members' names must never appear in a list other
members can see. Out of scope by the same decision: minors, location hiding, web-scrubbing,
any "priority" engine, and any payment exception in Stripe (billing is dormant:
`payments_enabled=false`, `stripe_integration_enabled=false`).

## Facts (live project ydqhzvvoyufiiqvzcjns, 2026-10-12)

- `profiles` RLS: SELECT and UPDATE are `auth.uid() = id OR private.is_platform_owner()`, so
  a member never reads another member's row directly.
- `authenticated` holds column UPDATE grants on 14 member-owned columns only (avatar_url, bio,
  display_name, dob, …). `access_approved`, `membership_tier` and any new column are not in
  that list. `guard_profile_privileges()` also blocks a non-owner from raising
  `access_approved` / `is_trial` / `is_owner` and other privilege columns.
- Owner actions use the invoker-wrapper pattern: `public.<fn>` (SECURITY INVOKER) calls
  `private.<fn>` (SECURITY DEFINER), which checks `public.is_platform_owner()` and
  `auth.jwt()->>'aal' = 'aal2'` before mutating (`private.grant_permanent_access` is the model).
- Names reach other members by exactly two paths:
  1. `private.public_leaderboard(p_limit)` (SECURITY DEFINER): every approved member's
     `display_name`.
  2. `supabase/functions/snapshot-leaderboard`: a service-role read of `profiles`, which
     bypasses RLS and writes `leaderboard_snapshots.display_name`. It has 0 rows (never run).
  `private.get_all_members` and `private.membership_report` are owner-only; the
  `omega_member_life_surface` view is self-scoped.
- 9 profiles, 4 approved, 1 owner (0 MFA factors). `family_nodes` has 0 rows. 5 profiles
  have a `dob` or `birth_date`.

## Threat surface (the 8 classes + auth/schema extensions)

| # | class | applies because | handled by |
|---|---|---|---|
| 6 | unguarded RPC | a new owner action grants access | owner + aal2 check first, before any write; REVOKE from PUBLIC/anon, GRANT to authenticated |
| auth | privilege escalation | a member could try to set `family_of` on themselves to gain access, or to hide from the leaderboard | no column grant on `family_of`; `guard_profile_privileges` extended to reject any non-owner change of `family_of` |
| auth | linking an owner / self | the owner's own row, or another owner | function refuses `is_owner` targets and `p_uid = auth.uid()` |
| 2 | silent-failure write | UI must not show success unless the RPC returned `ok:true` | approvals.js uses the existing `rpcResult` path, which reads `.error` and `ok` |
| 3 | RLS gap | a new column on an RLS table | no policy change; existing self-or-owner policies cover it |
| 8 | edge: minors | the owner decided adults only | refuse when `dob`/`birth_date` says under 18 (`minor_by_dob`); when both are null the owner attests in the confirm dialog, and the audit row records `owner_attested_adult` |
| 8 | edge: re-grant / unlink | owner grants twice, or wants to unlink | the grant is idempotent; `revoke_family_link` clears the link only (access stays until the owner uses the existing `revoke_member`) |
| privacy | family names in member-visible lists | the decision's one hard requirement | `public_leaderboard` adds `AND family_of IS NULL`; `snapshot-leaderboard` adds `.is("family_of", null)`; a probe asserts both |
| schema | FK cascade | the owner's account deleted | `references public.profiles(id) on delete set null`; `check (family_of <> id)` |
| 7 | race | none material: one owner, single-row updates | — |
| 1 | stored XSS | approvals renders names already through textContent | no new rendering of member text |
| 4 | column mismatch | new column `family_of` | live-schema.json regenerated in the same change; schema-dictionary gate |
| 5 | module boundary | approvals.js attaches listeners, no inline handlers | — |

## Approach

1. **Migration `<ts>_omega_family_access.sql`:** additive only, no DROP.
   - `alter table public.profiles add column if not exists family_of uuid references public.profiles(id) on delete set null`, plus `check (family_of is null or family_of <> id)` and an index on `family_of`.
   - `guard_profile_privileges()` gains `family_of` in its owner-only list (CREATE OR REPLACE, body otherwise byte-identical to live).
   - `private.grant_family_access(p_uid uuid)` (SECURITY DEFINER, `search_path = ''`):
     owner → aal2 → refuses self, owners and unknown targets → refuses a target whose dob or
     birth_date is under 18 → sets `access_approved=true, is_trial=false, is_rejected=false,
     trial_expires_at=null, family_of=auth.uid()` → notification → `access_grant_audit` row
     (`grant_family_access`, detail notes whether age came from a date of birth or owner
     attestation) → `{ok:true}`.
   - `private.revoke_family_link(p_uid uuid)`: owner → aal2 → `family_of = null` → audit.
   - `public.grant_family_access` / `public.revoke_family_link`: SECURITY INVOKER wrappers.
     REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated on both public and private.
   - `private.public_leaderboard`: CREATE OR REPLACE with one added predicate,
     `AND family_of IS NULL`, the rest copied from live.
2. **`supabase/functions/snapshot-leaderboard/index.ts`:** `.is("family_of", null)` on the
   profiles read. Source change only; deploying it is a separate, explicit step.
3. **approvals.js:** a "GRANT AS FAMILY (ADULT)" action beside the existing grant, behind a
   confirm that states "adults only — you confirm this person is 18+". It reuses `rpcResult`,
   so it steps up to MFA (or routes to `settings.html#two-factor` when no factor exists).
4. **Records:** `supabase/live-grants.json`, `supabase/live-schema.json`,
   `remote-migrations.json`, FIXES_LOG.md, GAP_ANALYSIS.md, blueprint-truth-map (12, 13, 455,
   N142 → SHIPPED once verified live).

## Key decisions

- **A column on `profiles`, not a new table.** One link per person, to one owner; no join, and
  existing RLS already scopes it.
- **Free means "granted access", not a $0 price.** No Stripe object is created. If billing is
  ever enabled, family members stay outside it because their access is the grant, not a
  subscription.
- **The age check is best-effort and honest about it.** The platform cannot verify age; the
  owner attests, and a recorded dob under 18 hard-refuses.
- **The leaderboard exclusion is server-side.** Filtering on the client would still ship the
  names to every member's browser.

## Risks / open questions

- The owner has 0 MFA factors, so the action cannot run until two-factor is set up. That is by
  design; every owner action shares the gate.
- The snapshot Edge Function exclusion takes effect only once deployed. It has never run, so
  nothing is exposed today; deploying it is listed for the owner.
- Members can still see a family member's name wherever that person chooses to post
  (feed, social). The requirement covers lists; a person's own posts are theirs.

## Out of scope

Minors and parental consent; location hiding; web monitoring or scrubbing; a family "priority"
compute engine; Stripe coupons; succession (points 73, 652, 969, N155 remain NEEDS_DECISION).

## Success criteria

- Live probe as a non-owner: `grant_family_access` returns `forbidden`; setting `family_of`
  directly fails 42501; owner at aal1 gets `aal2_required`; anon gets 42501.
- Live probe as owner@aal2 inside a rolled-back transaction: grant succeeds on an adult target,
  refuses an under-18 dob, refuses self and owner; the target vanishes from `public_leaderboard`.
- grant-contract, schema-dictionary, rpc-consolidation and the contract suite pass.

## Round 1 revisions (reviewer verdict REVISE, 2026-10-12)

Re-enumerated live: every `public`/`private` function whose body reads `profiles` and
`display_name`, with SECURITY DEFINER flag and `authenticated` EXECUTE.

| function | definer? | member-callable | names of other members? |
|---|---|---|---|
| `private.public_leaderboard(int)` | yes | yes | **yes** — add `AND family_of IS NULL` |
| `get_points_leaderboard(int)` | no (invoker) | yes | no: runs under `profiles` RLS (self-or-owner), others' names read null; the probe asserts it |
| `get_activity_feed(int,int)` | no (invoker) | yes | same as above; add the predicate anyway (defence in depth) |
| `private.get_all_members`, `membership_report`, `kyc_queue`, `access_audit_log` | yes | yes | owner-gated in body |
| `export_my_data`, `request_account_erasure` | yes | yes | self only |
| `omega_runtime_dispatch` | yes | **no** | — |

Views: only `omega_member_life_surface` (self-scoped). Tables holding copies of names:
`leaderboard_snapshots` (0 rows, `SELECT` policy `true` for every member, has `user_id`).

Changes to the approach:
1. **Snapshots:** `grant_family_access` deletes the target's `leaderboard_snapshots` rows, and
   the snapshot Edge Function filters `family_of IS NULL` on write. Rows written before a grant
   cannot survive it.
2. **Bodies from live, not the repo:** the repo defines `public.public_leaderboard` while live
   has `private.public_leaderboard`, so every CREATE OR REPLACE body is taken from
   `pg_get_functiondef` at apply time, plus the one added predicate.
3. **Guard:** `guard_profile_privileges` gains `new.family_of is distinct from old.family_of`.
   It is BEFORE UPDATE only. That is safe because `authenticated` has no INSERT on
   `profiles` (live-grants `S---`; signup rows come from the auth trigger). It is recorded here
   as an invariant: a future INSERT grant must extend the guard to INSERT.
4. **Age:** called "owner attestation" everywhere. The audit row stores the `dob`/`birth_date`
   seen at grant time, because both are member-writable.
5. **Re-link:** granting a target already linked to a different owner refuses
   (`already_linked`) rather than overwriting; same owner is a no-op returning `ok`.
6. **Owner deletion:** `on delete set null` returns the person to the leaderboard. Recorded
   as accepted (an owner account is not deleted in practice), and logged by the guard.
7. **Grants:** REVOKE ALL FROM PUBLIC, anon on the `private.*` and `public.*` functions; GRANT
   EXECUTE to authenticated on both; `search_path = ''` with every reference qualified.
8. **rpc-consolidation-gate:** run on the branch before claiming it passes. It hashes only
   the header, so a redefinition in a new migration is expected to pass; verify, don't assume.
9. **Feed:** `activity_feed` rows with `is_public = true` expose a family member's activity
   (not their name) by `user_id`. Acknowledged; the person's own posts are theirs to share.

## Round 2 revisions (2026-10-12)

- `private.get_all_members` (live body) also returns `family_of`, with no filter. approvals.js
  shows a FAMILY chip and an UNLINK action, both inside `OmegaGuardian.gate('admin', …)` like
  the existing grant and revoke.
- `grant_family_access` on a member already linked to *any* owner account writes the access
  fields again and leaves the link. `revoke_member` keeps the link, and the chip shows it.
  Any owner may unlink.
- Refusals write `access_grant_audit` rows with `allowed=false`. `detail` is a JSON string
  holding `{dob, birth_date, age_basis}`.
- The `leaderboard_snapshots` DELETE runs as the function owner. Check `proowner` and
  `relforcerowsecurity` live before relying on it.
- Guard and `public_leaderboard` bodies come from live `pg_get_functiondef`. The diff against
  live is asserted to be exactly the added predicate.
- New UI strings get keys in `i18n.js` T_EN and all 6 packs.


## Round 3 security refinement (2026-10-13)

When a member has no DOB/birth_date, the family-grant RPC requires `p_attested_adult=true`. The owner console sends this only after the explicit adult confirmation. A direct RPC call omitting the flag is refused and audited. A recorded DOB under 18 is refused regardless of the attestation flag.
