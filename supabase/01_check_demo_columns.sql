-- ============================================================================
-- SYD OMEGA 91717 — 01_check_demo_columns.sql
--
-- The demo module selects four columns from profiles. If ANY of them is
-- missing, PostgREST returns 400, the client's res.data is null, and v1 gave
-- up silently — no console error, no modal, no clue. Run this in the Supabase
-- SQL Editor to see which exist.
-- ============================================================================

select
  c.column_name,
  c.data_type,
  'present' as status
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'profiles'
  and c.column_name in
      ('access_approved','subscription_status','is_owner','demo_watched_at')
order by c.column_name;

-- Anything NOT listed above is missing. Expected: all four.
-- If demo_watched_at is missing, run supabase/omega_demo_video.sql — without
-- it the demo cannot remember it was watched and will offer itself every visit.
-- (v2 falls back to this browser's local storage, which is per-device only.)


-- ---------------------------------------------------------------------------
-- Add whatever is missing. Idempotent, safe to re-run.
-- ---------------------------------------------------------------------------
begin;

alter table public.profiles
  add column if not exists demo_watched_at     timestamptz,
  add column if not exists subscription_status text,
  add column if not exists access_approved     boolean default false,
  add column if not exists is_owner            boolean default false;

do $g$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles'
               and column_name='demo_watched_at') then
    execute 'grant update (demo_watched_at) on public.profiles to authenticated';
  end if;
end $g$;

commit;


-- ---------------------------------------------------------------------------
-- Who is eligible to see the demo, and who has already seen it?
-- ---------------------------------------------------------------------------
select
  p.id,
  p.access_approved,
  p.is_owner,
  p.subscription_status,
  p.demo_watched_at,
  (p.is_owner = true
   or p.access_approved = true
   or p.subscription_status = 'active')          as eligible,
  (p.demo_watched_at is not null)                as already_watched
from public.profiles p
order by p.demo_watched_at nulls first
limit 25;


-- ---------------------------------------------------------------------------
-- Clear the watched mark so the demo plays again on next login.
-- For one member:
--     update public.profiles set demo_watched_at = null where id = '<uuid>';
-- For everyone (use deliberately):
--     update public.profiles set demo_watched_at = null;
--
-- Members also carry a browser-local fallback mark. To clear that, they run
-- window.OmegaDemo.reset() in the console, or you can just tell them the
-- Settings page "WATCH DEMO AGAIN" button ignores all gating.
-- ============================================================================
