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

This is a narrower instance of the same class of risk as the `0018` finding
below — a function redefined multiple times across the file history, where
only some of the redefinitions were made defensive.

## Systematic sweep for the same bug class, and a second real fix

Given two of these (`my_matrix()`, and a second one below) were reported
from a live Supabase Preview run, every function created in more than one
migration file was compared pairwise for same-argument-types-but-different-
return-type collisions (the specific shape that triggers `42P13`), cross-
checked against actual execution to rule out false positives from the
static pattern-matching (e.g. whitespace-only argument formatting
differences, and drop-in-a-preceding-file splits like `step1_drop.sql` /
`step2_create.sql`). Two more real, undefended conflicts turned up, both
inside `0018_trial_access.sql`, both colliding with what
`omega_master_deploy.sql` (`0001`) already creates earlier in the same
sequence — **these failed even on a completely fresh database**, not only
an already-upgraded one:

- **`grant_trial_access(uuid)`** — reported directly via a live Supabase
  Preview run (`ERROR: cannot change return type of existing function`,
  `SQLSTATE 42P13`, at the `CREATE OR REPLACE FUNCTION grant_trial_access`
  statement). `0018` defines it `RETURNS void`; `trial_917.sql` (`0082`)
  and `chronometers.sql` (`0084`) later redefine it `RETURNS timestamptz`.
  `0082` already self-defends (a dynamic `DROP FUNCTION` block covering
  this name among others), so the only real gap was `0018` itself lacking
  defense against a database that already has the later signature — true
  of the reporting project, false of the empty scratch database this
  directory was first validated against. **Reproduced locally** (pre-seed
  a scratch database with the `timestamptz` signature, then run `0018` as
  it was — same `SQLSTATE`, same message) and **fixed**: added
  `DROP FUNCTION IF EXISTS grant_trial_access(UUID);` before its
  `CREATE OR REPLACE`.
- **`expire_trial(uuid)`** and **`grant_permanent_access(uuid)`** — both
  previously documented below as open, unfixed failures. `0001` creates
  both `RETURNS jsonb`; `0018` redefines both `RETURNS void` with no
  defense, which fails regardless of the database's prior state, since
  `0001` runs immediately before it in the same sequence. Confirmed `bg.js`
  never reads either function's return value, so `jsonb` vs `void` doesn't
  affect app behavior — but the sequence couldn't replay past this point at
  all before this fix. **Fixed**: added the same `DROP FUNCTION IF EXISTS`
  guard before each, in `0018`.

All three fixes applied identically to `supabase/migrations/0018_trial_access.sql`
and the loose `supabase/trial_access.sql` (confirmed byte-identical after).
**Result: 85 of 87 files now apply cleanly on a genuinely fresh database**
(up from 84), and separately confirmed the `grant_trial_access` fix resolves
the exact reported error when replayed against a database already holding
the later signature.

Two other functions redefined with argument-list differences across files
(`apply_subscription`, `lattice_node`) were checked and are **not** at risk
— in both cases every occurrence's actual argument types and return type
are identical; the static scan's initial flag was a whitespace-formatting
artifact, not a real signature change. Functions not created in more than
one file, or whose repeated definitions never change signature, were not
individually re-audited beyond this sweep.

## A third real error, and a wider sweep for the same idempotency gap in DDL

`0036_conversations.sql` was reported failing (`ERROR: relation
"conversations" already exists`, `SQLSTATE 42P07`) against a project that
already had the table. Unlike the `42P13` function-signature bugs above,
this one predates any of this reorganization's numbering — the file's
`CREATE TABLE conversations (...)` / `CREATE TABLE messages (...)`
statements never had an `IF NOT EXISTS` guard, unlike every other table
creation in this codebase (`chunk_06_migrations.sql`'s independent
embedded copy of the same two tables already has the guard; the canonical
loose file and `migration_runner.sql` never did). **Reproduced locally**
(pre-create `conversations` in a scratch database, then run the file as it
was — identical error) and **fixed**: added `IF NOT EXISTS` to both
`CREATE TABLE` statements, applied identically to
`supabase/migrations/0036_...` and the loose `supabase/conversations.sql`.

Worth noting, not fixed here: neither table has any RLS policy in this
file (a separate file 50 migrations later, `rls_missing_tables.sql`,
conditionally closes that gap), and **no file in the entire 87-file set
grants `conversations`/`messages` access to the `anon`/`authenticated`
roles at all** — meaning these tables are unreachable via the Supabase
client API (PostgREST requires an explicit `GRANT`) regardless of RLS
state, for the whole sequence. So the missing-RLS window isn't a live
security exposure, but it may mean whatever client feature these tables
back isn't actually wired up to work yet — out of scope to fix blind.

Given this was a different bug class than the `42P13` ones (a missing
`IF NOT EXISTS` on `CREATE TABLE`, not a missing `DROP FUNCTION` before a
signature change), the same kind of sweep was run for every other
idempotency gap in DDL across all 87 files:

- **`CREATE TABLE` without `IF NOT EXISTS`**: only `conversations.sql`
  (fixed above). Three other regex matches were comment text
  ("...the `CREATE TABLE` above...", "...`CREATE TABLE` bodies...."), not
  real statements.
- **`CREATE INDEX` without `IF NOT EXISTS`**: none found.
- **`CREATE TRIGGER` without a preceding `DROP TRIGGER IF EXISTS`**: none
  found.
- **`CREATE TYPE`** (which has no `IF NOT EXISTS` form in Postgres at
  all): none found.
- **`CREATE POLICY` colliding with an identically-named policy on the same
  table from an earlier file, without a drop**: initial static scan
  flagged `omega_rls_fix.sql` (`0051`) redefining four policies
  (`profiles_select`, `profiles_update`, `profiles_insert`,
  `platform_owners_read`) that `omega_master_deploy.sql` (`0001`) already
  creates — checked against the actual file and this is a **false
  positive**: `0051` drops every existing policy on those two tables
  dynamically (`DO` block iterating `pg_policies`, `EXECUTE format('DROP
  POLICY IF EXISTS %I ON ...')`), which the regex-based scan doesn't
  recognize as a name-specific drop but is in fact more thorough than one.
  Confirmed safe by the fact this file has never failed in any of the
  clean-database test runs above (`85/87`, unaffected before and after
  this check).

## A fourth real error: a table that exists out-of-band, in a shape this repo doesn't know

`0059_omega_ai_memory.sql` was reported failing (`ERROR: column "user_id"
does not exist`, `SQLSTATE 42703`, at `CREATE INDEX IF NOT EXISTS
idx_mem_user ON public.ai_memory(user_id, ...)`). This is a third distinct
bug class from the two above: unlike `interest_signals` (two files in
*this repo* define the same table incompatibly), **no other file anywhere
in the repository creates `ai_memory`** — grepped the entire tree,
including `chunk_*.sql` and `migration_runner.sql`, confirmed. The file's
own `CREATE TABLE IF NOT EXISTS public.ai_memory(...)` correctly declares
`user_id`; the only explanation consistent with the error is that the
reporting project already has an `ai_memory` table created by some means
this repository has no record of (Supabase dashboard UI, an uncommitted
one-off script, or similar) — `CREATE TABLE IF NOT EXISTS` is a no-op
against it, and the subsequent `CREATE INDEX` then references a column
that table doesn't actually have.

There is no way to know that table's real shape from the repo alone, so
this **can't** be fixed by picking a "correct" schema the way the
`interest_signals` case could theoretically be resolved by checking which
of two known candidates is live. Instead, applied the same defensive
pattern this codebase already uses for exactly this situation —
`omega_master_deploy.sql`'s own comment: *"a table may already exist in a
divergent shape ... in which case the CREATE TABLE above was skipped and
the policy below would fail"*, guarded there with
`ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id uuid;`. Added the
equivalent for every column `0059`'s indexes/policies/trigger depend on
(`user_id`, `memory_key`, `memory_type`, `agent_name`, `updated_at`)
immediately after the `CREATE TABLE`, before anything references them.
**Reproduced locally** (created a minimal `ai_memory` stand-in missing
`user_id`, confirmed the exact error, then confirmed the fix resolves it)
and applied identically to `supabase/migrations/0059_...` and the loose
`supabase/omega_ai_memory.sql`.

Swept all 87 files for the same pattern (a `CREATE INDEX` referencing a
column that's only guaranteed by that file's own `CREATE TABLE IF NOT
EXISTS`, with no defensive `ALTER TABLE ADD COLUMN IF NOT EXISTS` guard)
— **zero other candidates found**; `ai_memory` was the only case.

This bug class is fundamentally different from the previous two in one
important way: it depends on state — what tables a given real project
already has, in what shape — that genuinely cannot be determined from this
repository alone. The sweep above rules out *this specific* unguarded-
column pattern across all 87 files, but it can't rule out every table in
this set turning out to already exist somewhere in an unexpected shape;
that can only be discovered by actually running the migration against the
real project and reporting what comes back, the same way this one was
found.

## `interest_signals` resolved — a fifth real error confirmed which shape is live

The `interest_signals` duplicate-schema fork documented above as
unresolved ("which shape is actually live in production can only be
checked against the real database") **was resolved by exactly that** — a
live Supabase Preview run on `0077_omega_interest_graph.sql` reported
`ERROR: column "created_at" does not exist (SQLSTATE 42703)` at
`CREATE INDEX ... interest_signals_user_idx ... (user_id, signal_type,
created_at DESC)`. Since `0077`'s own `CREATE TABLE` declares
`created_at`, and `CREATE TABLE IF NOT EXISTS` only no-ops against a table
that already exists, this confirms the reporting project's live
`interest_signals` table is `entreprise_schema_v2.sql`'s shape (`0056`) —
`recorded_at`, not `created_at`.

**Fixed**, now that the ambiguity is resolved: reproduced locally (built
the exact `0056`-shaped table, confirmed `0077` as originally written hits
the identical error) and added
`ALTER TABLE public.interest_signals ADD COLUMN IF NOT EXISTS created_at
timestamptz NOT NULL DEFAULT now();` right after `0077`'s `CREATE TABLE`,
before the index — same defensive pattern as the `ai_memory` fix above.
Checked `0056`'s full column list against everything `0077` needs
(`user_id`, `signal_type`, `content_id`, `content_type`, `axis_type`,
`weight`): all already present and compatible in both shapes, so
`created_at` was the only genuinely missing column requiring a guard.
Verified the fix resolves the reproduction, and the full 87-file sequence
now applies **86 of 87 clean on a fresh database** (up from 85) — `0077`
no longer fails there either. Applied identically to
`supabase/migrations/0077_...` and the loose
`supabase/omega_interest_graph.sql`.

**One file still fails on a fresh apply — investigated, not a bug:**

1. **`0087_owner_apex_lock.sql`: "Not authorised: only a platform owner
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

`0087` is the only remaining failure on a fresh database, and it's a
confirmed-correct security check, not a bug — nothing left open from this
validation effort.
