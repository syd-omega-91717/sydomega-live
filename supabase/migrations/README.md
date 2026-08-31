# supabase/migrations — canonical, ordered migration history

This directory is the canonical, ordered, automatically-appliable
schema history for this project, in Supabase CLI convention
(`NNNN_<descriptive_name>.sql` for numbered migrations, `YYYYMMDD*` for
timestamped session migrations, applied via `supabase db push`).
It supersedes manual copy-paste of `supabase/*.sql` into the Supabase SQL editor.

## Migration Sync Point (2026-08-19)

This session introduced timestamped migration files (starting with `20260816*`)
to track Supabase API changes applied directly to the live database. A schema
sync point (`20260819082319_schema_sync_point.sql`) has been created to serve
as a reference marker for migration history alignment. All migrations up to and
including this point are considered applied to production.

**Resolution approach:** The local migrations directory now contains a complete
record of all changes applied in this session. Future migrations should follow
the timestamped convention (`YYYYMMDDhhmmss_descriptive_name.sql`) to maintain
clarity on session-based changes vs. numbered baseline migrations.

**Content source: every file here is a byte-for-byte, unedited copy of the
current loose file at `supabase/<name>.sql`.** No SQL statement was added,
removed, or rewritten — only file naming/numbering changed. This directory
and the loose files at `supabase/` root currently agree exactly; verified
by direct comparison of the files present at the time (see the dated
sections below for each later addition — this directory now holds 91
files, `0001`–`0091`; the exact count and its history are cumulative, not
restated at every step below).

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
4. `owner_apex_lock.sql` was originally placed last (`0087`) — its own
   header says "Run this in the Supabase SQL editor after all migrations
   complete." **Later removed entirely from this directory**; see
   "`owner_apex_lock.sql` removed from the automatic sequence entirely"
   further down.

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

- **`owner_apex_lock.sql`** — a personal, one-off, owner-authenticated
  data-seed script (hardcodes one specific account, sets it to maximum
  values on every axis), not a schema migration. Its own header says "Run
  this in the Supabase SQL editor after all migrations complete." Removed
  after GitHub's Supabase Preview check confirmed in practice that it can
  never succeed in an automated context — see "`owner_apex_lock.sql`
  removed from the automatic sequence entirely" further down.

  Note: `01_check_demo_columns.sql` (→ `0083_check_demo_columns.sql`) was
  *not* excluded despite the diagnostic-sounding name — it contains a real
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + `GRANT` alongside its
  diagnostic `SELECT`s, so it's a genuine idempotent schema change.

## A judgment call that was later resolved — see below

**`owner_apex_lock.sql`** (originally included as `0087`) contains no
`CREATE`/`ALTER` — only `UPDATE`/`INSERT` statements that set one
specific, hardcoded owner account (matched by email) to maximum values on
every axis/achievement column, plus a call to `grant_permanent_access()`.
It reads as a personal one-off data-seed script rather than a schema
migration, and isn't fully idempotent (the certificate `INSERT` has no
`ON CONFLICT` guard — repeat runs would insert duplicate certificate
rows). Originally included because it didn't meet the letter of any
exclusion criterion above, with the actual "does this belong in an
automated pipeline" call left open. **It was later removed** once GitHub's
Supabase Preview check demonstrated in practice that it can't ever
succeed in an automated context — see "`owner_apex_lock.sql` removed from
the automatic sequence entirely" further down for the full reasoning.

## Not addressed here (explicitly out of scope)

- **Duplicate table/function definitions across files** (the
  47-tables-in-more-than-one-file issue, `REPOSITORY_AUDIT.md` §4) —
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

## `owner_apex_lock.sql` removed from the automatic sequence entirely

`0087_owner_apex_lock.sql` was investigated earlier (see the "judgment
call" note above) and confirmed **not a bug**: it calls
`grant_permanent_access()`, which correctly checks `is_platform_owner()`
(itself keyed on `auth.uid()`, the calling session's authenticated
identity via JWT). A plain `psql`/SQL-editor session — or any automated
CI/preview context — has no JWT, so `auth.uid()` is `NULL` and the owner
check correctly denies it; verified this by re-running with
`request.jwt.claim.sub` set to a seeded owner's id, which succeeds.

That confirmed-correct behavior turned out to have a real, concrete
consequence: GitHub's "Supabase Preview" check (the actual Supabase
branching integration, not this project's own local reproduction)
attempted to apply the full migration sequence including `0087`, and
failed with exactly this error — `ERROR: Not authorised: only a platform
owner may grant permanent access (SQLSTATE 42501)`. Since no automated
context can ever authenticate as the real owner, **this file cannot ever
succeed there, on this PR or any future one** — it would fail this check
permanently, forever, regardless of what else changes in the repo.

The file's own header already says what it actually is: *"Run this in the
Supabase SQL editor after all migrations complete"* — a manual, one-off,
owner-authenticated administrative action (it hardcodes one specific
account and sets it to maximum values on every axis), not a repeatable
schema migration. That's the same category as `omega_dispatch_reset.sql`
and the `chunk_*.sql`/`migration_runner.sql` bootstrap bundle, both
already excluded from this directory for the same reason: not meant to
run as part of an automatic, unattended pipeline.

**Removed `supabase/migrations/0087_owner_apex_lock.sql`.** The loose
file `supabase/owner_apex_lock.sql` is untouched and still available —
the owner can run it manually, authenticated, in the Supabase SQL editor,
exactly as its header always instructed. `supabase/migrations/` now
contains **86 files** (`0001`–`0086`); no other file was renumbered.

With this file no longer part of the automatic sequence, **all 86 files
now apply cleanly on a fresh database — zero failures.**

(Two more files were added after this point without a corresponding note
here — `0087_omega_ai_memory_recall_fix.sql` and
`0088_omega_rls_index_coverage.sql` — bringing the total to 88 before the
addition documented immediately below. Noted here for anyone reconciling
this file's running commentary against the actual directory listing.)

## Three schema-fix files added: `0089`–`0091`

`supabase/omega_user_assets_fix.sql`, `supabase/omega_extend_trial_fix.sql`,
and `supabase/omega_notifications_fix.sql` (see each file's own header for
the bug it fixes — a table or RPC that client code queries but that never
had a `CREATE TABLE`/`CREATE FUNCTION` anywhere in `supabase/*.sql`, so the
Supabase JS client's `{data:null,error}` non-throwing behavior on a
missing relation silently produced an always-empty UI for every member)
existed as loose files at `supabase/` root but had never been copied into
this directory, unlike every other loose file. Added as
`0089_omega_user_assets_fix.sql`, `0090_omega_extend_trial_fix.sql`, and
`0091_omega_notifications_fix.sql` — byte-for-byte copies of the loose
files (`diff` confirms zero mismatches), appended at the end since all
three are additive (`CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE
FUNCTION`) with no dependency ordering concern beyond `is_platform_owner()`,
which is already defined by `0001`. `supabase/migrations/` now contains
**91 files** (`0001`–`0091`).

None of these three have been applied to any live database from this
session — no session in this project's history has held live Supabase
credentials. Applying them (`supabase db push`, or pasting each file into
the Supabase SQL editor) is still an owner action.

## `0092`: populate `notifications` on the five member-status RPCs

`0091` added the `public.notifications` table, but nothing anywhere
inserted a row into it — CLAUDE.md flagged this explicitly as separate,
undone-on-purpose work ("deciding which server-side events should
generate one is separate... work"). Added
`0092_omega_notify_triggers.sql`: `CREATE OR REPLACE` on the five
existing owner-gated member-status RPCs (`approve_member`,
`grant_permanent_access`, `reject_member`, `revoke_member`,
`extend_trial`), each otherwise byte-for-byte unchanged, with one
`INSERT INTO public.notifications` added before the `RETURN`. No new
business logic invented — these are the only events in the codebase that
are both already fully defined and unambiguous about who should be
notified and why. The `user_assets` population question (mission
outcomes, trade, sovereign grants) remains intentionally undone, since
none of those trigger events exist yet in this codebase.

Validated end-to-end against a locally spun-up throwaway PostgreSQL 16
instance (not the real project): a minimal schema stub
(`profiles`/`notifications`/`is_platform_owner()`/`trial_length()`/
`auth.uid()`) confirmed the file applies with zero errors, all five
functions execute and return their expected `jsonb`, each call inserts
exactly the intended `notification_type`/`message` row, and the existing
`is_platform_owner()`-false ("forbidden") short-circuit still returns
before any insert. Discarded after validation — this did not touch any
real project data. `supabase/migrations/` now contains **92 files**
(`0001`–`0092`). Not yet applied to any live database.

## `0093`/`0094`: two live-breaking bugs found and fixed via `pg_proc`
introspection against the real production database

The owner ran the read-only `pg_proc` query `GAP_ANALYSIS.md` §3.1 had been
asking for (`is_platform_owner`/`my_matrix`/`complete_task`/
`apply_subscription` — which side of each duplicated-function fork is
actually live) and pasted the results back. Findings:

- `is_platform_owner()` and `my_matrix()` — only the *correct* version of
  each is live (`platform_owners`-table-based owner check; the `phase`-
  including `my_matrix()` that `matrix.html:609`'s `r.phase===1` filter
  needs). Both concerns in §3.1 are resolved as non-issues — no fix needed,
  documented in `GAP_ANALYSIS.md`.
- `apply_subscription()` — **both** the 5-arg and 7-arg overloads are live
  simultaneously. `complete_task()` — only the
  `(p_task_name,p_task_type,p_axis_type,p_description,p_points)` version is
  live, but every client call site uses older, non-matching parameter names.
  Both reproduced against a scratch PostgreSQL 16 instance using the exact
  function bodies returned by the live `pg_proc` query (not guessed):
  `apply_subscription` errors `function ... is not unique` on the exact 5-
  named-arg call `supabase/functions/stripe-webhook/index.ts` makes on every
  webhook event; `complete_task` errors `function ... does not exist` on the
  exact call shape all 5 client call sites use
  (`omega-matrix.js`/`omega-workflow.js`×2/`omega-progress.js`/
  `publishing.html`). Net effect confirmed live right now: **every Stripe
  webhook call fails** (paying members never get activated) and **every
  task-completion/axis-progression call fails** (habits, publishing,
  workflows, dedication, gaming, academy, exam, contributions — the entire
  matrix-progression system has been silently frozen platform-wide).

  Fixing `complete_task`'s parameter names alone, without more, would have
  newly exposed a third bug the broken calls had been accidentally masking:
  the live function has no deduplication despite `omega-progress.js`'s own
  header comment and `publishing.html`'s user-facing copy both promising
  "keyed on (user, task)" / "farm-proof" behavior — reproduced by calling
  twice with an identical `task_name` and observing two separate axis
  increments and two `task_completions` rows. Fixed in the same file: an
  `EXISTS` check against `task_completions(user_id, task_name)` plus a
  supporting index, returning `applied:false` on a repeat call — matching
  what the 3 call sites that already read `d.applied` were always expecting.

  Added `0093_omega_apply_subscription_fix.sql` (drops the broken 7-arg
  overload; the 5-arg one was already correct) and
  `0094_omega_complete_task_dedup_fix.sql` (adds the dedup guard, keeps the
  same signature via `CREATE OR REPLACE` rather than adding a third
  overload). Both re-verified end-to-end in the scratch instance after the
  fix: `apply_subscription` resolves and updates the row cleanly with the
  webhook's exact call; `complete_task`'s first call on a task applies and
  returns `applied:true`, an immediate repeat call on the same task_name is
  a no-op returning `applied:false` with unchanged values, and
  `task_completions` ends up with exactly one row per task. Client-side
  param-name fixes for the 5 `complete_task` call sites (and 2 related
  return-field mismatches: `omega-matrix.js` read `d.a`/`d.b`/`d.c` where
  the live function has always returned `d.axis_a`/`d.axis_b`/`d.axis_c`)
  shipped in the same commit as these two migrations.

  `supabase/migrations/` now contains **94 files** (`0001`–`0094`). Neither
  has been applied to the live database yet — this is the single highest-
  priority pending action: production payments and all progression tracking
  are broken until these run.

## `0094` amended in place: a fourth bug found on the owner's first live apply attempt

The owner tried applying `0094_omega_complete_task_dedup_fix.sql` and hit
`ERROR: column "task_name" does not exist (42703)` on its first statement
(the `CREATE INDEX`). Queried `information_schema.columns` for the live
`public.task_completions`: `id bigint, user_id uuid, kind text, task text,
completed_at timestamptz, axis text, increment numeric, created_at
timestamptz` — an older, simpler shape than what the live `complete_task()`
function's own body (confirmed earlier via `pg_get_functiondef()`) inserts
into (`task_name`, `task_type`, `axis_type`, `points_earned`,
`axis_a_before`, etc.). The SQL bag has multiple genuinely different
`CREATE TABLE IF NOT EXISTS task_completions` definitions
(`matrix_engine.sql`'s richer shape vs. `migration_runner.sql`/
`omega_backend_sync.sql`/`omega_master_deploy.sql`'s simpler `task`/`kind`
shape) — whichever ran first on the live database won, and the real result
matches neither file exactly (has `axis`/`increment`, lacks `task_name`/
`points_earned`/the `axis_*_before/after` columns).

Reproduced against a scratch instance seeded with the *exact* reported live
columns: since a plpgsql function with no exception handler rolls back its
entire body on any unhandled error, this means `complete_task()` has never
actually committed anything for anyone on the live database — not just the
`task_completions` insert, but the `profiles` axis/authority/`nodes_earned`
update immediately before it in the same function body, since that update
was always part of the same failed, rolled-back transaction.

Because the owner's failed first attempt aborted on its very first
statement, nothing from the original `0094` had landed live (Postgres
rolled back the whole `BEGIN...COMMIT` block) — so `0094` was amended in
place rather than superseded by a new numbered file, matching this
project's own precedent for `0092` (first live attempt failed, corrected
in the same file). Added a non-destructive `ALTER TABLE ... ADD COLUMN IF
NOT EXISTS` for the missing columns before the index/function statements;
the old `kind`/`task`/`axis`/`increment` columns and any existing rows are
left untouched. Re-verified end-to-end in a fresh scratch instance seeded
with the owner's real reported schema: the amended file applies cleanly,
`complete_task()`'s first call on a task now applies and returns
`applied:true`, an identical repeat call is a no-op (`applied:false`), and
`profiles.axis_c`/`nodes_earned`/`authority` all update correctly.

`supabase/migrations/` still contains **94 files** (`0001`–`0094`) — `0094`
was amended, not added to. Not yet re-applied to the live database.

## Full 94-file sequence validated end-to-end for the first time — and a critical caveat this surfaced

Every prior "Execution validation" entry above tested a subset (87 files, then incremental
additions). Ran the complete current sequence (`0001`–`0094`, including `0093`/`0094`) against
a genuinely fresh PostgreSQL 16 instance, seeded with an improved Supabase-project stand-in
(the earlier stub's `auth.users` was missing several real Supabase/GoTrue columns —
`email_confirmed_at`, `last_sign_in_at`, etc. — which `0081_signup_pipeline.sql`'s
`pending_access_requests` view genuinely depends on; added them, not a repo bug, a stub gap).

**Result: all 94 files apply cleanly, in order, zero manual intervention, on a fresh database.**
This is the first time this exact file set has been confirmed to work end-to-end.

**Critical finding this run surfaced: a fresh replay of `migrations/` does not reproduce the
owner's actual live schema — proven concretely with `task_completions`.** Four files define
this table with `CREATE TABLE IF NOT EXISTS`: `0001_omega_master_deploy.sql` (first in
sequence — `id uuid`, `task text`, `kind text`, `completed_at`, `created_at`; no `axis`, no
`increment`), `0058_matrix_engine.sql` (the "rich" `task_name`/`axis_type`/`points_earned`
shape `complete_task()`'s live body was written against), and `0060_omega_backend_sync.sql`
(a third, near-identical-to-0001 shape). On a **fresh** database, `0001` always wins —
`IF NOT EXISTS` makes every later `CREATE TABLE task_completions` a silent no-op — so
`0058_matrix_engine.sql`'s richer definition is **dead code in the replay sequence**, never
actually reached. The end state after all 94 files: `id uuid`, a
`UNIQUE(user_id, task)` index (`0001`, reinforced by `0044`), two triggers (`0005`'s
`award_points_on_task`, `0069`'s `trig_task_to_feed`), plus `0094`'s added `task_name`/etc.
columns layered on top.

**None of that matches the owner's real, live `task_completions`**, queried directly via
`information_schema.columns` while fixing `0094` (see the entry above): `id bigint` (not
`uuid`), `kind`/`task`/`axis`/`increment`/`completed_at`/`created_at` (an `axis`/`increment`
pair that appears in *none* of the three `CREATE TABLE` definitions above), no unique index on
`(user_id, task)`, neither trigger. The live table was evidently created by some path this SQL
bag doesn't fully capture (possibly a manual/dashboard change, or an even older bootstrap not
present in any current file) — its exact origin is not reconstructable from source alone, and
guessing further would not be worth the risk of a wrong conclusion.

**Practical consequence — read this before running anything against production:** "all 94
files apply cleanly" is true and now verified, but only describes replaying the sequence onto
a **blank** database. It says nothing about what happens running the same sequence against the
**existing**, already-populated live database, where `CREATE TABLE IF NOT EXISTS` silently
skips (the table's already there, in a shape none of these files anticipated) while later
`ALTER`/trigger/index statements in the same files would still attempt to run against
whatever's actually live — and, as `task_completions` proves, "what's actually live" can differ
from every fresh-replay assumption in this SQL bag. **`supabase/migrations/` is now validated
and trustworthy for spinning up a new/staging/test Supabase project from scratch. It is not
validated as safe to run wholesale against the owner's existing production database`** — that
remains exactly the standing caveat CLAUDE.md already states ("run it against a scratch
Supabase project before pointing any real deployment at it"), now with a concrete, reproduced
example of why. The safe path for the real production database continues to be the individually
targeted, individually-verified-against-the-real-schema fix files (`0089`–`0094`, `0013`, and
`trial_access.sql`) — not a wholesale `supabase db push` of the full historical sequence.

This also means the "47 duplicate tables, safe today because idempotent" framing (`CLAUDE.md`
§5, `GAP_ANALYSIS.md` §3) needs a caveat: idempotent-and-safe is only guaranteed true relative
to *each other* on a fresh database. It says nothing about whether any of them match what's
actually live on a database with real history — as just proven for one specific, high-traffic
table. Consolidating the 47 duplicates down to one canonical definition per table (`GAP_ANALYSIS.md`
§6 item 8) should not be done by picking whichever file "looks most complete" — it needs the
same per-table live-schema check this session did for `task_completions`, one table at a time,
not a bulk sweep.

## Two timestamp-versioned files added: `20260816231218`, `20260816231240` — breaking the `NNNN_<name>.sql` convention on purpose

`omega_rls_scoping_fix.sql` and `omega_leaderboard_snapshots_columns_fix.sql` (both already
documented in `CLAUDE.md` §8 as written, scratch-DB-tested, and previously blocked on live
database access) were applied directly to the live production database (2026-08-17, via the
Supabase MCP connector's `apply_migration` tool, once a session held live credentials for the
first time). That tool is Supabase's own official migration-apply mechanism — it doesn't let the
caller pick a version string in the `NNNN` sequence this directory otherwise uses; it recorded
each migration on the remote's own tracking table under Supabase's default timestamp convention
(`YYYYMMDDHHMMSS_<name>`), landing as `20260816231218_omega_rls_scoping_fix` and
`20260816231240_omega_leaderboard_snapshots_columns_fix` — confirmed via `list_migrations` against
the live project (`ydqhzvvoyufiiqvzcjns`) both before applying (gap present) and after (both new
entries visible with these exact version strings).

This surfaced as a real, external CI failure: the repo's "Supabase Preview" GitHub Action check
started failing with "Remote migration versions not found in local migrations directory" —
correct behavior, since two versions existed on the remote's tracking table with no matching file
here. The fix is to add the missing local files under the exact version strings the remote already
recorded (`git mv`/renumbering them into the `NNNN` sequence is not an option — the remote's
tracking table is the source of truth for what version string a given migration is known by, and
there's no safe way to rewrite that after the fact without another live-database operation).
`20260816231218_omega_rls_scoping_fix.sql` and
`20260816231240_omega_leaderboard_snapshots_columns_fix.sql` are otherwise byte-for-byte the same
fix as their loose-file counterparts at `supabase/<name>.sql`.

**Practical consequence for future sessions with live Supabase access:** any migration applied via
`apply_migration` going forward will land on the remote under this same timestamp convention, not
the next `NNNN` in sequence — add the matching local file immediately in the same change (not a
followup), named with the exact version `list_migrations` reports, or the same CI check will fail
again. This is now the established pattern for anything applied live rather than pre-numbered into
this directory ahead of time.

## Full 151-file sequence replayed on a blank PostgreSQL 16 — 2026-08-30

The entry above records a 94-file run and warns that everything after `0094` was never part of
it. The whole directory has now been replayed end to end, so that gap is closed with a number
rather than left as a known-unknown.

Method: `initdb` a scratch PostgreSQL 16.13, create the minimum Supabase substrate a bare
Postgres lacks (roles `anon`/`authenticated`/`service_role`, schemas `auth`/`storage`/
`extensions`, `auth.users`, `auth.uid()`/`auth.role()`/`auth.email()`, `pgcrypto`,
`uuid-ossp`), then apply every file in `ls | sort` order with `-v ON_ERROR_STOP=1`.

**Result: 136 of 151 applied, 15 failed.** The 15 are listed below with the object each one
could not find.

**None of the 15 is a defect in this directory.** Every missing object exists on the live
project — verified in one query with `to_regclass` and `pg_proc`/`pg_type` lookups:
`storage.buckets`, `storage.objects`, `supabase_migrations.schema_migrations`,
`public.omega_knowledge_sources`, `public.advertisements`, `public.pending_access_requests`,
`public.ai_memory`, `public.council_deliberations`, the `vector` type, `public.notify_member()`,
`public.erase_ai_memory()`, and `auth.users.email_confirmed_at` are all present there. They are
absent only from a bare Postgres, because Supabase manages some of them and the flat
`supabase/*.sql` bag creates the rest.

Independently: 13 of the 15 are already recorded in the live
`supabase_migrations.schema_migrations`, which means they applied successfully against the real
schema. Only `0096_omega_anon_execute_hardening.sql` and `0103_trusted_source_registry.sql` were
never applied live, and both of their dependencies (`notify_member()`,
`omega_knowledge_sources`) exist there.

| migration | missing on blank PG | on production |
|---|---|---|
| `0022_storage.sql` | `storage.buckets` | present |
| `0059_omega_ai_memory.sql` | type `vector` | present |
| `0081_signup_pipeline.sql` | `auth.users.email_confirmed_at` | present |
| `0096_omega_anon_execute_hardening.sql` | `notify_member()` | present |
| `0103_trusted_source_registry.sql` | `omega_knowledge_sources` | present |
| `20260816231218_omega_rls_scoping_fix.sql` | `storage.objects` | present |
| `20260817233805_omega_advertisements_insert_fix.sql` | `advertisements` | present |
| `20260817234540_revoke_pending_access_requests_...sql` | `pending_access_requests` | present |
| `20260818000551_revoke_anon_execute_...sql` | `erase_ai_memory()` | present |
| `20260818063011_merge_second_pass_...sql` | `ai_memory` | present |
| `20260818072124_remove_throwaway_test_migration_records.sql` | `supabase_migrations.schema_migrations` | present |
| `20260818080246_rls_pass6_...sql` | `ai_memory` | present |
| `20260818082309_add_missing_fk_indexes_real_schema.sql` | column `lesson_id` | applied live |
| `20260818141500_omega_graphify_schema.sql` | column `degree` | applied live |
| `20260819071913_optimize_auth_rls_initplan_seven_policies.sql` | `council_deliberations` | present |

**What this replay was actually for.** The Supabase Preview check had been failing in a chain,
each fix revealing the next: *remote versions not found locally* → *duplicate primary keys
(SQLSTATE 23505, four colliding prefixes)* → *`relation "public.migrations_log" does not exist`*.
Rather than keep discovering one per merge, this replay enumerates everything at once.

It found exactly one object absent from **both** this repo and production: `public.migrations_log`,
which `20260819082319_schema_sync_point.sql` inserted into unguarded. That is the one real
defect, and it is fixed. Every other failure above is a bare-Postgres artifact.

**So the standing caveat is now narrower, not gone.** This sequence still must not be run against
a blank database expecting a working schema — 15 files need substrate the flat bag provides. What
is newly established is that it contains no unfixed ordering or dependency defect of its own, and
that the Preview database (which carries the production schema) has everything the 15 need.
