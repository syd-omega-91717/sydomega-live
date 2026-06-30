# SYD OMEGA 91717 -- BRINGING THE MATRIX TO LIFE

`OMEGA_EVOLUTION_RPC.sql` is the engine. Your pages were always wired to call it;
the functions just never existed, so every action failed in silence and the
matrix never moved. Run this file and the whole platform comes alive with
ZERO page edits.

------------------------------------------------------------
## DEPLOY (one step)

Supabase -> SQL Editor -> paste OMEGA_EVOLUTION_RPC.sql -> Run.
- Safe + re-runnable (CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS).
- Run it AFTER OMEGA_BACKEND_SYNC.sql (it expects those tables).
- No files to deploy, no pages to change.

------------------------------------------------------------
## CONFIRM THE FUNCTIONS LANDED (paste in SQL Editor)

  SELECT proname FROM pg_proc
  WHERE proname IN ('complete_task','log_evolution','get_all_members',
                    'approve_member','reject_member','revoke_member','order_stats')
  ORDER BY proname;

You should see all seven.

------------------------------------------------------------
## WATCH IT EVOLVE (in the live site, logged in)

1. Open academy.html -> clear a lesson node.
   -> "NODE CLEARED -- +0.25 KNOWLEDGE." Your Axis A rises and stays risen on reload.
2. Open gaming.html -> clear a stage -> Axis B (Mastery) rises +0.25.
3. Open contributions.html -> log an act -> Axis C (Contribution) rises +0.25.
4. Open intelligence.html -> the 9-dimension radar reflects your new authority.
5. Open account.html -> your evolution ledger lists every event.
6. (Owner) approvals.html -> see every member, approve/reject/revoke.
7. (Owner) hall.html -> the Order scoreboard (order_stats).

------------------------------------------------------------
## HOW IT WORKS (the rules, verified against live Postgres)

- baseline axis = 1, apex = 9; each cleared node = +0.25 on its axis
- a node banks once only (no farming) -- second click returns applied:false
- authority = sqrt(a^2 + b^2 + c^2); apex (9,9,9) = 15.588
- crossing an integer awards a credential on that axis:
    Axis A -> Certificate    Axis B -> Trophy    Axis C -> Medal
- crossing (3,3,3) / (6,6,6) / (9,9,9) together opens a Gate
- complete_task returns { applied, axis, value, a, b, c, authority, unlocked[] }
- owner-only functions (members, approve/reject/revoke) are gated by is_owner

------------------------------------------------------------
## TUNING THE ASCENT

At +0.25 per node, 32 nodes take an axis from 1 to 9. To make sovereignty a
longer climb, lower the default weight in complete_task (e.g. 0.10) -- but the
pages display "+0.25", so change that text too if you want them to match.

The matrix is now a living engine. Every act of knowledge, mastery, and
contribution moves a member through the 729 toward the apex.
