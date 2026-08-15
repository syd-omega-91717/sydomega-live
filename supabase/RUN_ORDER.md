# supabase/ — apply order

This file is referenced by name from several `.sql` comments in this
directory (`targeted_fix.sql`, `omega_stats_repair.sql`, `runner_chunk_05.sql`,
`chunk_08_migrations.sql`, `migration_runner.sql`, `omega_governance.sql`) as
the authoritative migration-ordering guide — but until now it never actually
existed. A previous audit session found and fixed one *symptom* of that gap
(a dead link to it in `roadmap.html`, see `REPOSITORY_AUDIT.md` §6) without
creating the file itself, leaving the underlying operational risk the SQL
comments describe undocumented. This file closes that gap.

**This is documentation only — nothing here changes SQL, RLS, or client
code.** It exists to prevent one specific, real hazard:

## The hazard

`supabase/*.sql` is a flat, historically-accumulated bag (§5/§9 of the root
`CLAUDE.md`), applied manually to the live database. `CREATE OR REPLACE
FUNCTION` has no "already correct, skip me" guard — whichever file happens to
run *last* silently wins, with no error if an earlier, already-fixed function
gets clobbered by an older, broken definition sitting in an earlier-authored
file that just happens to be pasted/run later.

This has already caused real production incidents in this repo's history —
see the root `CLAUDE.md` §8 entries for `apply_subscription` (every Stripe
webhook silently failing) and `complete_task` (every task completion, axis
increment, and authority-score update silently no-oping platform-wide) for
what it looks like when this goes wrong.

`scripts/audit.py` check 8 ("DIVERGING CLIENT-CALLED RPC DEFINITIONS")
automates detection of this going forward — run it any time a new `.sql`
file is added to this directory. Its output now flags, per diverging
function, which file looks like the correct one to run last based on this
repo's own `*_fix.sql` naming convention (still confirm against a live
`pg_proc` query before relying on that, same as any source-only heuristic).

## The two-layer apply order

**Layer 1 — base schema.** Pick *one* of these (they overlap; don't run more
than one):
- The numbered bootstrap chunks in order: `chunk_00_drop_all.sql` (only if
  starting completely clean), then `chunk_01_migrations.sql` through
  `chunk_10_productivity.sql` in numeric order, or
- `migration_runner.sql` (the same chunk sequence, pre-concatenated into one
  file), or
- `omega_master_deploy.sql` (an independent single-file bootstrap covering
  much of the same ground).

Whichever you pick establishes the base schema — including several RPC
functions and tables that a later, targeted fix file corrects. Layer 1 alone
is **known to leave at least these live-breaking bugs in place** (see root
`CLAUDE.md` §8 for full detail on each):
- `apply_subscription` — two ambiguous overloads, every Stripe webhook call fails.
- `complete_task` — wrong live signature vs. every client call site, and no
  dedup guard even once signatures match.
- `expire_trial` / `check_trial_status` — diverging bodies across files.
- `my_matrix` / `my_lattice` / `authority_score` / `lattice_node` — return-type
  drift (`targeted_fix.sql`'s own header: `42P13: cannot change return type
  of existing function my_matrix()`).
- `order_stats` — counts medals from the wrong table.

**Layer 2 — targeted fixes, always applied *after* layer 1, in any order
relative to each other.** Every `*_fix.sql`, `*_repair.sql`, and
`targeted_fix.sql` file in this directory exists specifically to win the
last-write race against a layer-1 definition it corrects. As of this
writing that includes (non-exhaustive — treat `scripts/audit.py` check 8's
output as the live source of truth for what still diverges):

  `omega_apply_subscription_fix.sql`, `omega_complete_task_dedup_fix.sql`,
  `trial_fix.sql`, `fix_expire_trial.sql` / `surgical_fix_expire_trial.sql`,
  `targeted_fix.sql`, `omega_stats_repair.sql`, `omega_ai_memory_recall_fix.sql`,
  `omega_rls_fix.sql`, `omega_rls_scoping_fix.sql`, `omega_schema_repair.sql`,
  `omega_marketplace_fix.sql`, `omega_legacy_honors_fix.sql`,
  `omega_advertisements_insert_fix.sql`, `omega_leaderboard_snapshots_columns_fix.sql`,
  `omega_extend_trial_fix.sql`, `omega_user_assets_fix.sql`,
  `omega_notifications_fix.sql`.

For which of these have actually been applied to (and verified against) the
live production database vs. are still pending, see the root `CLAUDE.md` §8
— that is the single source of truth for live-application status; this file
is only about *ordering*, not status, so the two intentionally don't
duplicate each other's content (avoiding the two silently drifting apart).

## The rule this file exists to state

**Never run layer 1 (or any single chunk/bootstrap file from it) against a
database that has already had layer-2 fixes applied, without immediately
re-running the relevant layer-2 file(s) again afterward.** Re-running layer 1
alone will silently regress every fix layer 2 made — with no error, exactly
the `CREATE OR REPLACE`-last-wins hazard described above. If you're unsure
whether a fix already landed on the live DB, check `CLAUDE.md` §8 first, and
run `scripts/verify_fixes.sql` (or an equivalent `pg_proc`/`information_schema`
query) against the live database directly — file analysis alone cannot tell
you what's actually live.
