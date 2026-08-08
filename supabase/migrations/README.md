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
- **This sequence has not been executed against a live or test Postgres
  database.** Order and safety were derived from documentation, file
  headers, git history, and static inspection of the self-defensive
  drop-before-redefine pattern already present in the source files — not
  from actually running `supabase db push` (or equivalent) end to end.
  **Before pointing any real deployment at `supabase/migrations/`, run it
  against a fresh/scratch Supabase project first** and confirm it applies
  cleanly start to finish.
- `migration_runner.sql` and the `chunk_*.sql` files were left in place,
  unedited, and are now known-stale for at least the 30 files identified
  above. Whether to regenerate, correct, or remove them is a separate
  decision — flagging so they aren't mistaken for a trustworthy manual
  fallback in the meantime.
