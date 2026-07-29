-- ============================================================================
-- SYD OMEGA 91717 — 00_diagnose_signin.sql
--
-- Run in the Supabase SQL Editor. Read-only: this file changes nothing.
-- Replace 'friend@example.com' below with your friend's actual email.
--
-- Answers, in order: does the account exist, is the email confirmed, is there
-- a profile row, and are they in the approvals queue.
-- ============================================================================

\set target_email 'friend@example.com'


-- ---------------------------------------------------------------------------
-- 1. THE MOST IMPORTANT QUESTION: does the account exist at all?
--
--    "Invalid login credentials" from Supabase means one of exactly two things:
--      (a) no auth user exists with that email, or
--      (b) the password is wrong.
--
--    It does NOT mean "email not confirmed" — that returns a different error,
--    "Email not confirmed". So if this query returns a row, the account exists
--    and the problem is the password. If it returns nothing, the signup never
--    completed and they must register again.
-- ---------------------------------------------------------------------------
select
  id,
  email,
  created_at                                   as signed_up_at,
  email_confirmed_at,
  (email_confirmed_at is not null)             as email_confirmed,
  last_sign_in_at,
  (last_sign_in_at is not null)                as has_ever_signed_in,
  banned_until,
  deleted_at
from auth.users
where lower(email) = lower(:'target_email');


-- ---------------------------------------------------------------------------
-- 2. Near-miss check. Typos in the email at signup are extremely common, and
--    they produce exactly this symptom: the account exists, but not under the
--    address being typed at login.
-- ---------------------------------------------------------------------------
select id, email, created_at, email_confirmed_at
from auth.users
where email ilike '%' || split_part(:'target_email', '@', 1) || '%'
   or email ilike '%' || split_part(:'target_email', '@', 2) || '%'
order by created_at desc
limit 20;


-- ---------------------------------------------------------------------------
-- 3. Is there a profile row? Before 0004_signup_pipeline.sql there is no
--    trigger creating one, so this is almost certainly empty — which is
--    exactly why you were never notified. The webhook fires on
--    public.profiles, and no row was ever inserted.
-- ---------------------------------------------------------------------------
select p.*
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower(:'target_email');


-- ---------------------------------------------------------------------------
-- 4. Everyone stuck in the gap: an auth user with no profile row. These people
--    signed up successfully and are invisible to you.
-- ---------------------------------------------------------------------------
select u.id, u.email, u.created_at, u.email_confirmed_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
order by u.created_at desc;


-- ---------------------------------------------------------------------------
-- 5. Recent signups overall, for context.
-- ---------------------------------------------------------------------------
select
  u.email,
  u.created_at,
  (u.email_confirmed_at is not null) as confirmed,
  (u.last_sign_in_at is not null)    as signed_in,
  (p.id is not null)                 as has_profile,
  p.access_approved
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc
limit 25;


-- ============================================================================
-- READING THE RESULTS
-- ============================================================================
--
-- Query 1 returns NOTHING
--   The account does not exist. signUp() never created a user, or it was
--   created against a different email (check query 2). They must register
--   again. Watch the on-screen message this time — account.html displays
--   Supabase's error, but it is easy to miss.
--
-- Query 1 returns a row, email_confirmed_at IS NULL
--   The account exists but was never confirmed. Two possible causes:
--
--   a) THE EMAIL WAS NEVER SENT. Most likely cause overall. Supabase's
--      built-in SMTP is rate-limited to a very small number of messages per
--      hour project-wide and is explicitly not intended for production. When
--      the limit is hit, signUp() still returns success and no email goes out.
--      Check Dashboard -> Logs -> Auth for send failures, and
--      Dashboard -> Authentication -> Emails for your SMTP setting.
--      FIX: configure a real SMTP provider. You already have a Resend account
--      set up for notify-access — use the same one for Auth emails.
--
--   b) THE LINK WAS BROKEN. account.html calls signUp({ email, password })
--      with no emailRedirectTo, so the confirmation link points at whatever
--      Site URL is configured in the dashboard. If that is still a localhost
--      or preview URL, the link 404s.
--      Check: Dashboard -> Authentication -> URL Configuration -> Site URL
--      should be your production origin. The account.html patch in this
--      bundle sets emailRedirectTo explicitly so it stops depending on that.
--
--   IMMEDIATE UNBLOCK — confirm them by hand, no email needed:
--      Dashboard -> Authentication -> Users -> find them -> "Confirm email"
--   Or send a fresh link:
--      Dashboard -> Authentication -> Users -> "Send magic link"
--
-- Query 1 returns a row, email_confirmed_at IS SET, last_sign_in_at IS NULL
--   Confirmed but never successfully signed in. This is a password problem.
--   Have them use "Forgot password", or send a magic link from the dashboard.
--   Note reset.html exists in the repository for this flow.
--
-- Query 1 shows banned_until or deleted_at set
--   The account is suspended or soft-deleted. Clear it in the dashboard.
--
-- Query 3 empty but query 1 has a row
--   This is the notification bug. Apply 0004_signup_pipeline.sql — it creates
--   the missing trigger AND backfills every orphaned user, so your friend
--   appears in the approvals queue immediately.
--
-- ============================================================================
-- AFTER 0004 IS APPLIED — approve them
--
--   select * from public.pending_access_requests order by signed_up_at desc;
--
--   -- 9 minutes 17 seconds:
--   select public.grant_trial_access('<their-uuid>');
--
--   -- unlimited:
--   select public.grant_permanent_access('<their-uuid>');
--
-- Both require you to be signed in as a platform owner after
-- 0003_privilege_lockdown.sql. From the SQL Editor you are running as
-- service_role, which bypasses the check, so these will work there regardless.
-- ============================================================================
