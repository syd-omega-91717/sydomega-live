-- ============================================================================
-- SYD OMEGA 91717 -- RLS HARDENING (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Five tables holding per-member private data were created in
-- omega_backend_sync.sql WITHOUT Row Level Security:
--
--   certificates, trophies, evolution_events, task_completions, contribution_log
--
-- In Supabase every table in the `public` schema is exposed through PostgREST.
-- With RLS disabled, Supabase's default privileges let ANY holder of the anon
-- key read the entire table. The anon key is public -- it is embedded in the
-- source of every page on the site. So before this migration, any visitor could
-- read EVERY member's certificates, trophies, evolution history, task history,
-- and contribution log, regardless of the page-level access gates.
--
-- Page gating (login screens, #app hiding) does NOT protect these tables --
-- it only hides the page shell. This file is the fix that actually protects
-- the data.
--
-- SAFE TO APPLY -- verified before writing:
--   * Every RPC touching these tables (complete_task, order_stats,
--     public_leaderboard, expire_trial, delete_account, submit_exam_result,
--     my_time_sovereign) is SECURITY DEFINER, so it bypasses RLS and keeps
--     working unchanged -- including the Hall aggregate stats.
--   * Every direct frontend query on these tables already filters by
--     .eq('user_id', <own session id>), so the "own rows only" policies below
--     match existing behaviour exactly. Nothing in the UI should change.
-- ============================================================================

-- ---------------------------------------------------------------- certificates
alter table public.certificates enable row level security;

drop policy if exists "own certificates read" on public.certificates;
create policy "own certificates read" on public.certificates
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own certificates insert" on public.certificates;
create policy "own certificates insert" on public.certificates
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.certificates from anon;
grant select, insert on public.certificates to authenticated;

-- -------------------------------------------------------------------- trophies
alter table public.trophies enable row level security;

drop policy if exists "own trophies read" on public.trophies;
create policy "own trophies read" on public.trophies
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own trophies insert" on public.trophies;
create policy "own trophies insert" on public.trophies
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.trophies from anon;
grant select, insert on public.trophies to authenticated;

-- ------------------------------------------------------------ evolution_events
alter table public.evolution_events enable row level security;

drop policy if exists "own evolution read" on public.evolution_events;
create policy "own evolution read" on public.evolution_events
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own evolution insert" on public.evolution_events;
create policy "own evolution insert" on public.evolution_events
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.evolution_events from anon;
grant select, insert on public.evolution_events to authenticated;

-- ----------------------------------------------------------- task_completions
alter table public.task_completions enable row level security;

drop policy if exists "own tasks read" on public.task_completions;
create policy "own tasks read" on public.task_completions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own tasks insert" on public.task_completions;
create policy "own tasks insert" on public.task_completions
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.task_completions from anon;
grant select, insert on public.task_completions to authenticated;

-- ----------------------------------------------------------- contribution_log
alter table public.contribution_log enable row level security;

drop policy if exists "own contributions read" on public.contribution_log;
create policy "own contributions read" on public.contribution_log
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own contributions insert" on public.contribution_log;
create policy "own contributions insert" on public.contribution_log
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.contribution_log from anon;
grant select, insert on public.contribution_log to authenticated;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- Paste this into the Supabase SQL editor. Every row must show rls_enabled = t
-- and policy_count >= 2.
-- ============================================================================
-- select c.relname                as table_name,
--        c.relrowsecurity         as rls_enabled,
--        count(p.polname)         as policy_count
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   left join pg_policy p on p.polrelid = c.oid
--  where n.nspname = 'public'
--    and c.relname in ('certificates','trophies','evolution_events',
--                      'task_completions','contribution_log')
--  group by c.relname, c.relrowsecurity
--  order by c.relname;
