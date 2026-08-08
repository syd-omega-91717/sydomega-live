# supabase/migrations — canonical, ordered migration history

This directory is the new canonical, ordered, automatically-appliable
schema history for this project, in Supabase CLI convention
(`NNNN_<descriptive_name>.sql`, 4-digit zero-padded sequence, applied via
`supabase db push` / `migration up`). It supersedes manual copy-paste of
`supabase/*.sql` into the Supabase SQL editor as the way this schema gets
applied going forward.

**Content source: every file here is a byte-for-byte, unedited copy of the
current loose file at `supabase/<name>.sql`.** No SQL statement was added,
removed, or rewritten — only file naming/numbering changed. This directory
and the loose files at `supabase/` root currently agree exactly; verified
by direct comparison of all 87 files, zero mismatches.

## How the order was derived

**Files `0001`–`0054`** follow the sequence embedded in
`supabase/migration_runner.sql` (a hand-maintained "paste this into the
Supabase SQL editor" bundle whose header describes its ordering as
"Validated end-to-end on clean PostgreSQL 16"). That relative ordering of
55 files was trusted and reused here — but **not the file bodies
themselves**. A first pass of this reorganization copied bodies from
`migration_runner.sql`'s embedded blocks; on review, 30 of those 55 blocks
turned out to be **stale**, not just reformatted, relative to the current
loose files:

- Most commonly, an outdated `is_platform_owner()` that read
  `profiles.is_owner` directly — the exact recursion-prone implementation
  the current loose files (`access_gate.sql`, `omega_evolution_rpc.sql`,
  `omega_master_deploy.sql`, `omega_backend_sync.sql`) deliberately
  replaced with a `platform_owners` lookup table specifically to avoid
  `"infinite recursion detected in policy for relation profiles"`.
  `omega_master_deploy.sql`'s own comment on its first (superseded)
  definition says explicitly: *"if you ever split this master file back
  into pieces, do not resurrect this version as authoritative."* The
  first pass of this reorganization did exactly that, by construction —
  caught and corrected.
- In `omega_evolution_rpc.sql` specifically, `complete_task()`'s embedded
  copy used an entirely earlier milestone algorithm (integer-crossing
  only) versus the current loose file's curated-milestone system
  (`milestones_for_axis()`, a separate `medals` table). Not a formatting
  difference — different application behavior.

**Correction applied:** all 87 files in this directory were re-synced to
their current loose-file content byte-for-byte (verified: `checked=87
mismatches=0`). `migration_runner.sql`'s *order* is still used as a
sequencing guide for the 55 files it names; its *content* is not used
anywhere in this directory. `migration_runner.sql` itself should be
treated as stale/superseded — see "Not addressed here."

One of the 55 (`omega_dispatch_reset.sql`) was dropped from the sequence
entirely; see "Deliberately excluded" below. That leaves 54 files,
numbered `0001` through `0054`.

**Files `0055`–`0086`** are the remaining loose `.sql` files that were
never folded into `migration_runner.sql` at all (so there was no
staleness question for these — they were always sourced from the loose
files). Ordered by, in priority order:

1. Explicit "Run AFTER / Run BEFORE / Requires" hints in the file's own
   header comments, where present (e.g. `0079_privilege_lockdown.sql`'s
   own header says "APPLY THIS BEFORE ANYTHING ELSE IN THIS BUNDLE," so it
   was placed ahead of `0080_rls_closure.sql` despite the original
   `0002`/`0003` numerals on disk; the original `0005`/`0006`/`0007`
   loose files each declare a dependency and are ordered accordingly).
2. Files carrying a pre-existing numeric prefix on disk at
   `supabase/0002_...` through `supabase/0008_...` and
   `supabase/00_.../01_...` — treated as someone's later, more deliberate
   ordering attempt — placed after the non-prefixed stragglers
   (`0079`–`0086`).
3. Everything else ordered alphabetically by original filename (git
   history showed nearly all landed in one initial squashed-import commit
   with no finer-grained signal), except two files with genuine later
   commits (`omega_interest_graph.sql`, `omega_formula_patch.sql`),
   placed after the alphabetical group per real git order. Cross-file
   `REFERENCES public.*` was checked across this batch; no dependency
   ordering risk found among them.
4. `owner_apex_lock.sql` (`0087`, last) — its own header says "Run this in
   the Supabase SQL editor after all migrations complete."

## Why replaying this sequence on a fresh database is expected to be safe

Every file uses `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE
FUNCTION` / idempotent `INSERT ... ON CONFLICT`. For functions whose
signature changes across the sequence (the scenario that causes Postgres
error `42P13`), the files that redefine them multiple times
(`complete_task` appears in `0001`, `0033`, `0035`, `0044`, `0058`) rely on
a dynamic `DO $drop$ ... DROP FUNCTION IF EXISTS public.<name>(<actual
pg_catalog signature>) ... $$` block that looks up and drops whatever
overload currently exists before redefining — this pattern is already
present in the loose files themselves (see `0044_omega_evolution_rpc.sql`,
top), not something added by this reorganization. This was **not verified
by actually executing the sequence against a live or test database** —
see "Not addressed here."

## Deliberately excluded

- **`omega_dispatch_reset.sql`** — runs `DROP TABLE IF EXISTS
  public.dispatches CASCADE`. In the original `migration_runner.sql`
  order, `omega_dispatch.sql` (which CREATEs `dispatches`) runs earlier,
  so a blind unconditional replay of the full original sequence would
  drop the table just created. Its own header confirms: "run this ONLY if
  OMEGA_DISPATCH.sql still errors on a legacy dispatches table." Manual,
  conditional troubleshooting tool — must never be added here.

- **`migration_runner.sql`** and **`chunk_00_drop_all.sql` through
  `chunk_10_productivity.sql`** — the legacy manual SQL-editor-paste
  bootstrap tool this directory supersedes. Confirmed stale (see above),
  so also no longer a trustworthy manual fallback for the 30 files it
  disagrees with the loose files on. Left in place at `supabase/` root for
  historical reference only; must not be wired into any automated path.

- **`runner_chunk_05.sql`** — an earlier, abandoned chunking attempt that
  re-embeds `omega_stats_repair.sql`/`omega_authority_v2.sql` (both
  already present here as `0053`/`0054`, sourced from the loose files).

- **`supabase/index.sql`** — not SQL; it's the Deno/TypeScript source for
  the `concierge` Edge Function, misplaced with a `.sql` extension. The
  real function lives at `supabase/functions/concierge/`.

- **`00_diagnose_signin.sql`**, **`migration_status_check.sql`** —
  diagnostic-only (all `SELECT`, own headers confirm no schema change).
  Meant to be run ad hoc while debugging, not replayed as schema history.

  Note: `01_check_demo_columns.sql` (→ `0083_check_demo_columns.sql`) was
  *not* excluded despite the diagnostic-sounding name — it contains a real
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + `GRANT` alongside its
  diagnostic `SELECT`s, so it's a genuine idempotent schema change.

## A judgment call worth explicit review

**`owner_apex_lock.sql` (`0087`)** contains no `CREATE`/`ALTER` — only
`UPDATE`/`INSERT` statements that set one specific, hardcoded owner
account (matched by email) to maximum values on every axis/achievement
column, plus a call to `grant_permanent_access()`. It reads as a personal
one-off data-seed script rather than a schema migration, and isn't fully
idempotent (the certificate `INSERT` has no `ON CONFLICT` guard — repeat
runs would insert duplicate certificate rows). Included because it doesn't
meet the letter of any exclusion criterion above, but whether a personal
data-seed script belongs in an automated schema-migration pipeline at all
is a call for you to make, not one this reorganization made silently.

## Not addressed here (explicitly out of scope)

- **Duplicate table/function definitions across files** (the
  47-tables-in-more-than-one-file issue from `REPO_AUDIT.md` §4) —
  unresolved. Nothing here was deduplicated or merged; this
  reorganization establishes order and correct current content, not a
  reduction of redundancy. Expected safe to replay per the idempotent
  patterns already documented in root `CLAUDE.md` §5, but not verified
  line-by-line for every one of the 87 files.
- `migration_runner.sql` and the `chunk_*.sql` files were left in place,
  unedited, and are now known-stale for at least the 30 files identified
  above. Whether to regenerate, correct, or remove them is a separate
  decision — flagging so they aren't mistaken for a trustworthy manual
  fallback in the meantime.

## Execution validation

This sequence has now been run end to end against a real PostgreSQL 16
instance (not a hosted Supabase project — no Supabase account/API token
was available in the environment this was validated from) built up with a
minimal stand-in for the platform pieces a real Supabase project provides
for free: an `auth` schema with `auth.users` and `auth.uid()`, the
`anon`/`authenticated`/`service_role` roles, a `storage` schema with
`storage.buckets`/`storage.objects`/`storage.foldername()`, and the
`pgvector` extension. This is not a full emulation (no real Auth/Storage
services, no PostgREST, no real JWT verification), but it exercises the
actual SQL.

**Result: 84 of 87 files apply cleanly on a fresh database, in order,
zero manual intervention.** Getting there surfaced two real ordering bugs,
now fixed by pure renumbering (no SQL content changed):

- `omega_sovereign_points.sql` references `public.exam_results` (created
  by `omega_exams.sql`) and `public.matrix_progress` (created by
  `omega_nested_matrix.sql`), but originally sat before both in the
  derived order. Renumbered so `omega_exams.sql` → `omega_nested_matrix.sql`
  → `omega_sovereign_points.sql`, shifting `0003`–`0007` accordingly.

**A fresh/empty database is not the only real starting state.** Applying
`migrations/` to an *existing* Supabase project (one already carrying years
of hand-pasted schema changes, not a blank one) surfaced a real bug a
truly-empty scratch database can't: `omega_nested_matrix.sql` creates
`public.my_matrix()` with its original 8-column return shape and no
defensive drop. Three later files —
`omega_authority_v2.sql` (whose own header already says *"my_matrix()
cannot change its RETURN TABLE without a DROP first"*), the
`step1_drop.sql`/`step2_create.sql` pair, and `targeted_fix.sql` (whose
header documents this exact error, `SQLSTATE 42P13`) — each correctly
drop-then-recreate it with a newer shape (adds `phase`, widens `a/b/c` to
`numeric`). If the target database already has that newer shape (as a real,
actively-used project would, from those fix files having been pasted in by
hand at some point), replaying `omega_nested_matrix.sql`'s un-defended
`CREATE OR REPLACE` from the start of the sequence collides with it and
fails with exactly this error. **Reproduced locally** (pre-seed a scratch
database with the newer signature, then run `omega_nested_matrix.sql`
as it was) and **fixed**: added `DROP FUNCTION IF EXISTS
public.my_matrix();` immediately before its `CREATE OR REPLACE`, matching
the same defensive pattern the three later fix files already use for this
exact function. Verified the fix resolves the reproduction, and that the
full 87-file sequence still applies the same (84/87) on a genuinely fresh
database — this change only affects behavior when a conflicting `my_matrix()`
already exists. Applied identically to both `supabase/migrations/0004_...`
and the loose `supabase/omega_nested_matrix.sql`, keeping the two in sync.

This is a narrower instance of the same class of risk as the `expire_trial()`
finding below — a function redefined multiple times across the file
history, where only the *later* redefinitions were made defensive. Other
functions redefined more than once across the file set have not been
individually re-audited for the same gap; `my_matrix()` was fixed because
it was the one actually observed failing.

**Three files still fail on a fresh apply — investigated individually,
not patched:**

1. **`0018_trial_access.sql`: `cannot change return type of existing
   function` on `expire_trial(uuid)`.** `0001_omega_master_deploy.sql`
   defines `expire_trial(p_uid uuid) RETURNS jsonb`; `0018` redefines the
   same signature as `RETURNS void`, which Postgres rejects without an
   explicit `DROP FUNCTION` first. This function is redefined **nine
   times** across the full file set (`0001`, `0018`, `0027`, `0028`,
   `0041`, `0057` — literally named `fix_expire_trial.sql` — `0074`
   —`surgical_fix_expire_trial.sql`, `0079`, `0082`, `0084`), which reads
   as real, iterative production history rather than one clean intended
   version. Checked whether this matters functionally: `bg.js` (loaded on
   every page) calls `sb.rpc('expire_trial',...)` and never reads the
   return value, so the `jsonb` vs `void` choice doesn't affect app
   behavior — but the sequence still can't replay past this point
   unmodified. Determining the actually-correct final signature requires
   knowing what's live on the real production database; not guessed at
   here.
2. **`0077_omega_interest_graph.sql`: `column "created_at" does not
   exist"` while creating an index.** `0056_entreprise_schema_v2.sql` and
   `0077_omega_interest_graph.sql` both define `public.interest_signals`
   with genuinely incompatible schemas (`recorded_at` vs `created_at`
   timestamp column, `public.profiles` vs `auth.users` as the `user_id`
   FK target, different check constraints). Since both use `CREATE TABLE
   IF NOT EXISTS`, whichever runs first "wins" and the other's
   column-specific statements later in its own file (like this index)
   fail against the shape that actually exists. This is the concrete,
   now-proven version of the duplicate-table-definitions problem
   REPO_AUDIT.md §4 already flagged in the abstract (47 tables, including
   this one, defined in more than one file) — previously described there
   as "expected safe" per the idempotent `IF NOT EXISTS` pattern; this is
   a demonstrated case where that expectation doesn't hold. The only
   writer, `record_interest_signal()` (in `0077`), doesn't name the
   timestamp column explicitly, so it would insert fine against either
   shape — but the schema itself is genuinely forked. **Which shape is
   actually live in production can only be checked against the real
   database** (e.g. `select column_name from information_schema.columns
   where table_name='interest_signals'`); not resolved here.
3. **`0087_owner_apex_lock.sql`: "Not authorised: only a platform owner
   may grant permanent access."** Confirmed this is **not a bug**: it
   calls `grant_permanent_access()`, which correctly checks
   `is_platform_owner()` (itself keyed on `auth.uid()`, i.e. the calling
   session's authenticated identity via JWT). A plain `psql`/SQL-editor
   session has no JWT context, so `auth.uid()` is `NULL` and the owner
   check correctly denies it — verified by re-running with
   `request.jwt.claim.sub` set to a seeded owner's id, which succeeds
   (`is_platform_owner()` → `true`, `grant_permanent_access()` completes).
   The security check is working as designed; this file needs to be run
   in a context where the caller is actually authenticated as the owner.

No SQL statement's *content* was changed by this validation pass — only
the two-file reordering above. The two real findings (2) and (1) are
pre-existing in the source files, not introduced by this reorganization,
and are left for a human with access to the real production database to
resolve correctly.
