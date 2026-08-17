-- ============================================================================
-- SYD OMEGA 91717 — 0004_signup_pipeline.sql
--
-- Fixes: "my friend signed up, but I never got the notification to approve."
--
-- ----------------------------------------------------------------------------
-- WHY IT NEVER ARRIVED
-- ----------------------------------------------------------------------------
-- The notification chain is:
--
--     signUp() -> auth.users row -> ??? -> public.profiles row
--              -> Database Webhook -> notify-access Edge Function -> your inbox
--
-- The "???" step does not exist. There is NO trigger on auth.users anywhere in
-- the 92 SQL files. A `profiles` row is only created client-side in
-- account.html's reveal() function, AFTER the member signs in and enters their
-- date of birth.
--
-- So the real sequence today is:
--   1. Friend signs up.                    -> auth.users row created
--   2. No profiles row exists.             -> webhook never fires
--   3. You are never notified.             -> nothing in the approvals queue
--   4. Friend must sign IN and pass the DOB gate before you learn they exist.
--   5. Your friend cannot sign in. Deadlock.
--
-- Your friend is invisible to you because the notification is wired to a table
-- row that only appears after a step they cannot reach.
--
-- ----------------------------------------------------------------------------
-- THE FIX
-- ----------------------------------------------------------------------------
-- Create the profiles row at signup, server-side, via a trigger on auth.users.
-- The webhook then fires immediately and the member appears in your approvals
-- queue the moment they register — before any DOB gate, before confirmation.
--
-- The client-side reveal() path still works: it UPDATEs the row this trigger
-- created rather than inserting a new one. No client change is required for
-- this migration, though 0005 and the account.html patch improve it further.
--
-- SAFETY: idempotent. Backfills existing orphaned auth.users. Never overwrites
-- an existing profile. Trigger is written so a failure can NEVER block signup —
-- a broken notification must not stop people registering.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- SIGNATURE RECONCILIATION  (added after production returned 42P13)
--
-- Production already has some of these functions with DIFFERENT return types
-- than the source files describe — finding F-2 again. CREATE OR REPLACE cannot
-- change a return type, so it fails with:
--     ERROR: 42P13 cannot change return type of existing function
--
-- This block drops EVERY overload of each function by name, resolved from
-- pg_proc, so it works no matter what signature production actually has.
--
-- It does NOT use CASCADE. If a policy, trigger or default depends on one of
-- these, the drop is skipped with a NOTICE rather than silently destroying the
-- dependent object — you get told, and CREATE OR REPLACE below still succeeds
-- whenever the return type happens to match.
-- ---------------------------------------------------------------------------
do $reconcile$
declare
  fn   text;
  r    record;
  names text[] := array['handle_new_user', 'get_pending_requests'];
begin
  foreach fn in array names loop
    for r in
      select p.oid::regprocedure::text as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn
    loop
      begin
        execute 'drop function ' || r.sig;
        raise notice 'dropped % (will be recreated below)', r.sig;
      exception
        when dependent_objects_still_exist then
          raise notice 'kept % — other objects depend on it; relying on CREATE OR REPLACE', r.sig;
        when others then
          raise notice 'could not drop % — %', r.sig, sqlerrm;
      end;
    end loop;
  end loop;
end $reconcile$;



-- ---------------------------------------------------------------------------
-- 1. Make sure the columns the trigger writes actually exist. The 92 source
--    files disagree about the profiles schema (finding F-2), so add rather
--    than assume. ADD COLUMN IF NOT EXISTS is a no-op when present.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email            text,
  add column if not exists access_approved  boolean     default false,
  add column if not exists is_trial         boolean     default false,
  add column if not exists trial_expires_at timestamptz,
  add column if not exists requested_at     timestamptz default now(),
  add column if not exists created_at       timestamptz default now();


-- ---------------------------------------------------------------------------
-- 2. The trigger function.
--
--    EXCEPTION WHEN OTHERS is deliberate and important. This runs inside the
--    auth signup transaction: if it raises, Supabase fails the signup with an
--    opaque "Database error saving new user". A missing profile is a support
--    ticket; a failed signup is a lost member. Log and continue.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, email, access_approved, is_trial, requested_at)
    values (new.id, new.email, false, false, now())
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: could not create profile for % — %',
      new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 3. Backfill. Anyone who already signed up and vanished into the gap —
--    including, most likely, your friend — gets a profiles row now.
--    Run the SELECT first if you want to see who reappears.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, access_approved, is_trial, requested_at)
select u.id, u.email, false, false, coalesce(u.created_at, now())
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- 4. Owner-facing view of the queue, so approvals.html and you can both see
--    pending members including their auth state. This is the view to check
--    when someone says "I signed up and nothing happened".
-- ---------------------------------------------------------------------------
drop view if exists public.pending_access_requests cascade;
create view public.pending_access_requests as
select
  p.id,
  coalesce(p.email, u.email)                          as email,
  u.created_at                                        as signed_up_at,
  u.email_confirmed_at,
  (u.email_confirmed_at is not null)                  as email_confirmed,
  u.last_sign_in_at,
  p.access_approved,
  p.is_trial,
  p.trial_expires_at,
  case
    when p.access_approved then 'approved'
    when u.email_confirmed_at is null then 'awaiting email confirmation'
    when u.last_sign_in_at is null then 'confirmed, never signed in'
    else 'awaiting owner approval'
  end                                                 as status
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

revoke all on public.pending_access_requests from public, anon, authenticated;
-- Views run with the definer's rights by default in older Postgres, and this
-- view joins auth.users directly (email, signed_up_at, email_confirmed_at,
-- last_sign_in_at). Granting SELECT to `authenticated` here would let any
-- signed-in member -- approved or not, owner or not -- read every user's
-- auth data directly via sb.from('pending_access_requests').select('*'),
-- bypassing the owner-gated RPC below entirely. Deliberately not granted to
-- anyone except the implicit table owner; the RPC below is the only
-- client-facing accessor. (A prior version of this file granted SELECT to
-- authenticated here -- flagged as an ERROR-level finding by Supabase's own
-- security advisor and revoked live; see CLAUDE.md §8.)


-- ---------------------------------------------------------------------------
-- 5. Owner-only accessor. Use this from approvals.html rather than selecting
--    the view directly, because it checks the caller.
-- ---------------------------------------------------------------------------
create or replace function public.get_pending_requests()
returns setof public.pending_access_requests
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.omega_is_owner() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  return query select * from public.pending_access_requests;
end;
$$;

revoke all on function public.get_pending_requests() from public, anon;
grant execute on function public.get_pending_requests() to authenticated;

commit;


-- ============================================================================
-- AFTER APPLYING — find your friend.
--
--   select * from public.pending_access_requests order by signed_up_at desc;
--
-- Read the `status` column:
--
--   'awaiting email confirmation'  -> the account exists; the email never
--                                     arrived or was never clicked. See
--                                     db/00_diagnose_signin.sql.
--   'confirmed, never signed in'   -> confirmed but sign-in is failing;
--                                     almost always a password problem.
--   'awaiting owner approval'      -> they are through; approve them.
--   (no row at all)                -> signUp() never created a user. The
--                                     account does not exist. They must
--                                     register again.
--
-- To approve, as the owner:
--   select public.grant_permanent_access('<their-uuid>');   -- unlimited
--   select public.grant_trial_access('<their-uuid>');       -- 9m17s
--
-- ============================================================================
-- STILL REQUIRED, OUTSIDE SQL — the webhook itself.
--
-- setup.md describes deploying the notify-access Edge Function and creating a
-- Database Webhook by hand. If that was never completed, this migration makes
-- the queue correct but you still get no email. Verify:
--
--   Supabase Dashboard -> Database -> Webhooks
--     table: public.profiles, events: Insert + Update, POST to
--     https://ydqhzvvoyufiiqvzcjns.supabase.co/functions/v1/notify-access
--
--   Supabase Dashboard -> Edge Functions -> notify-access must be deployed
--   Supabase Dashboard -> Settings -> Secrets -> RESEND_API_KEY must be set
--
-- The function returns {"sent": false, "message": "RESEND_API_KEY not
-- configured yet."} when the key is missing — it fails silently by design, so
-- absence of errors is NOT evidence it is working. Test it directly:
--
--   curl -X POST https://ydqhzvvoyufiiqvzcjns.supabase.co/functions/v1/notify-access \
--        -H 'Content-Type: application/json' \
--        -d '{"type":"INSERT","record":{"display_name":"webhook test"}}'
-- ============================================================================
