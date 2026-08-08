-- ============================================================================
-- SYD OMEGA 91717 — 0006_chronometers.sql
--
-- Two chronometers, both SERVER-AUTHORITATIVE.
--
--   1. APPROVAL WINDOW — 9m17s (557s). Starts when the member RECEIVES the
--      approval confirmation, not when the owner clicks grant. A member
--      approved while asleep should not lose their window to the clock.
--
--   2. DAILY ENGAGEMENT — 9h17m17s (33,437s) per day. Accrues while the member
--      is actively present. Pauses on sign-out, on tab hidden, and on idle.
--      Resumes on return. This is a terms-and-conditions obligation tied to
--      rewards, so it must be as tamper-resistant as the platform can make it.
--
-- ----------------------------------------------------------------------------
-- WHY THE SERVER OWNS BOTH CLOCKS
-- ----------------------------------------------------------------------------
-- 33,437 seconds is 38.7% of a 24-hour day. That is a demanding obligation with
-- rewards attached, which makes it worth faking. If the browser reported
-- elapsed time, a member could grant themselves a full day with one line in the
-- console — the same class of mistake as the old client-driven expire_trial.
--
-- So the client never sends a duration. It sends only a heartbeat meaning "I am
-- still here right now". The server measures the gap between heartbeats against
-- its own clock and credits at most MAX_BEAT_GAP per beat. A member who
-- disappears for an hour and returns is credited one gap, not an hour.
--
-- Requires 0003_privilege_lockdown.sql (omega_is_owner) and
--          0005_trial_917.sql (trial_duration).
--
-- Idempotent. Safe to re-run.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- SIGNATURE RECONCILIATION — production may already carry these names with
-- different return types (see D-017). Drop every overload by real signature.
-- ---------------------------------------------------------------------------
do $reconcile$
declare
  fn text; r record;
  names text[] := array[
    'engagement_target','start_trial_countdown','engagement_heartbeat',
    'engagement_pause','get_engagement_status','engagement_day'
  ];
begin
  foreach fn in array names loop
    for r in
      select p.oid::regprocedure::text as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn
    loop
      begin
        execute 'drop function ' || r.sig;
        raise notice 'dropped % (recreated below)', r.sig;
      exception
        when dependent_objects_still_exist then
          raise notice 'kept % — dependents exist', r.sig;
        when others then
          raise notice 'could not drop % — %', r.sig, sqlerrm;
      end;
    end loop;
  end loop;
end $reconcile$;


-- ===========================================================================
-- PART 1 — APPROVAL WINDOW (9m17s), started on confirmation
-- ===========================================================================

alter table public.profiles
  add column if not exists trial_granted_at timestamptz,
  add column if not exists trial_started_at timestamptz;

comment on column public.profiles.trial_granted_at is
  'When the owner approved. The clock does NOT run from here.';
comment on column public.profiles.trial_started_at is
  'When the member first acknowledged the approval. The 9m17s runs from here.';


-- The member calls this the first time they see their approval. Idempotent:
-- once started, calling again returns the same expiry and never extends it.
create or replace function public.start_trial_countdown()
returns table (
  started_at        timestamptz,
  expires_at        timestamptz,
  seconds_remaining integer,
  already_running   boolean
)
language plpgsql security definer set search_path = public as $$
declare
  me      uuid := auth.uid();
  p       record;
  now_ts  timestamptz := now();
begin
  if me is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  select id, access_approved, is_trial, trial_started_at, trial_expires_at
    into p
  from public.profiles where id = me;

  if not found then
    raise exception 'No profile row. Apply 0004_signup_pipeline.sql.'
      using errcode = 'P0002';
  end if;

  if coalesce(p.access_approved, false) = false then
    raise exception 'Not approved yet.' using errcode = '42501';
  end if;

  -- Permanent members have no countdown at all.
  if coalesce(p.is_trial, false) = false then
    return query select null::timestamptz, null::timestamptz, null::integer, false;
    return;
  end if;

  -- Already running: return the existing expiry. Never extend — otherwise a
  -- member could refresh to reset their window.
  if p.trial_started_at is not null and p.trial_expires_at is not null then
    return query
      select p.trial_started_at, p.trial_expires_at,
             greatest(0, ceil(extract(epoch from (p.trial_expires_at - now_ts)))::integer),
             true;
    return;
  end if;

  update public.profiles set
    trial_started_at = now_ts,
    trial_expires_at = now_ts + public.trial_duration()
  where id = me;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('start_trial_countdown', me, me, true,
          'countdown started; expires ' || (now_ts + public.trial_duration())::text);

  return query
    select now_ts,
           now_ts + public.trial_duration(),
           ceil(extract(epoch from public.trial_duration()))::integer,
           false;
end;
$$;

revoke all on function public.start_trial_countdown() from public, anon;
grant execute on function public.start_trial_countdown() to authenticated;


-- grant_trial_access is redefined to record the grant WITHOUT starting the
-- clock. The window now begins when the member confirms, per the requirement.
create or replace function public.grant_trial_access(p_uid uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
begin
  if not public.omega_is_owner() then
    raise warning 'OMEGA_DENIED grant_trial_access: actor=% target=%',
      auth.uid(), p_uid;
    raise exception 'Not authorised: only a platform owner may grant trial access.'
      using errcode = '42501';
  end if;

  update public.profiles set
    access_approved  = true,
    is_trial         = true,
    trial_granted_at = now(),
    trial_started_at = null,   -- clock starts on the member's confirmation
    trial_expires_at = null
  where id = p_uid
    and (is_owner is null or is_owner = false);

  if not found then
    raise exception 'No such member, or the target is an owner.' using errcode = 'P0002';
  end if;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('grant_trial_access', auth.uid(), p_uid, true,
          'granted; 9m17s starts when the member confirms');

  return null;   -- no expiry yet, by design
end;
$$;

revoke all on function public.grant_trial_access(uuid) from public, anon;
grant execute on function public.grant_trial_access(uuid) to authenticated;


-- ===========================================================================
-- PART 2 — DAILY ENGAGEMENT (9h17m17s = 33,437s)
-- ===========================================================================

create or replace function public.engagement_target()
returns interval language sql immutable as $$
  select interval '33437 seconds';   -- 9 hours 17 minutes 17 seconds
$$;
grant execute on function public.engagement_target() to authenticated, anon;


-- Which day a moment belongs to. UTC by default.
-- CHANGE THE TIMEZONE HERE if the platform day should follow local time —
-- e.g. 'Asia/Beirut'. This is a single point of change deliberately: a day
-- boundary that differs between client and server produces disputes about
-- rewards, and disputes about rewards are expensive.
create or replace function public.engagement_day(at timestamptz default now())
returns date language sql immutable as $$
  select (at at time zone 'UTC')::date;
$$;
grant execute on function public.engagement_day(timestamptz) to authenticated;


create table if not exists public.daily_engagement (
  user_id             uuid        not null,
  day                 date        not null,
  seconds_accumulated integer     not null default 0,
  last_beat_at        timestamptz,
  first_beat_at       timestamptz,
  completed_at        timestamptz,
  beat_count          integer     not null default 0,
  primary key (user_id, day)
);

create index if not exists daily_engagement_user_day_idx
  on public.daily_engagement (user_id, day desc);

alter table public.daily_engagement enable row level security;

drop policy if exists daily_engagement_self_read on public.daily_engagement;
create policy daily_engagement_self_read on public.daily_engagement
  for select using (auth.uid() = user_id or public.omega_is_owner());
-- No insert/update policy: rows are written ONLY by the SECURITY DEFINER
-- functions below. A member cannot write their own hours.


-- ---------------------------------------------------------------------------
-- THE HEARTBEAT.
--
-- The client sends no duration — only "I am here". The server credits
-- LEAST(actual gap, MAX_BEAT_GAP). With the client beating every 30s and a cap
-- of 45s, normal use accrues honestly, while a member who closes the laptop for
-- three hours returns to find 45 seconds credited, not three hours.
--
-- Recommended client interval: 30 seconds while visible and not idle.
-- ---------------------------------------------------------------------------
create or replace function public.engagement_heartbeat()
returns table (
  day                 date,
  seconds_accumulated integer,
  seconds_target      integer,
  seconds_remaining   integer,
  completed           boolean,
  credited_this_beat  integer,
  server_time         timestamptz
)
language plpgsql security definer set search_path = public as $$
-- The RETURNS TABLE column `day` collides with daily_engagement.day inside
-- INSERT/ON CONFLICT/WHERE. Resolve bare identifiers to the COLUMN; the OUT
-- values are all returned through `rec`, so nothing else is affected.
#variable_conflict use_column
declare
  me            uuid := auth.uid();
  now_ts        timestamptz := now();
  today         date;
  MAX_BEAT_GAP  constant integer := 45;   -- seconds credited per beat, maximum
  rec           record;
  credit        integer := 0;
  target        integer := ceil(extract(epoch from public.engagement_target()))::integer;
begin
  if me is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;

  today := public.engagement_day(now_ts);

  insert into public.daily_engagement (user_id, day, seconds_accumulated,
                                       last_beat_at, first_beat_at, beat_count)
  values (me, today, 0, null, now_ts, 0)
  on conflict (user_id, day) do nothing;

  select * into rec from public.daily_engagement
  where user_id = me and day = today for update;

  -- A null last_beat_at means this is the first beat of the day, or the session
  -- was explicitly paused. Either way credit nothing — we only credit time we
  -- can prove the member was present for.
  if rec.last_beat_at is not null then
    credit := least(
      MAX_BEAT_GAP,
      greatest(0, floor(extract(epoch from (now_ts - rec.last_beat_at)))::integer)
    );
  end if;

  update public.daily_engagement set
    seconds_accumulated = least(target, seconds_accumulated + credit),
    last_beat_at        = now_ts,
    beat_count          = beat_count + 1,
    completed_at        = case
                            when completed_at is not null then completed_at
                            when seconds_accumulated + credit >= target then now_ts
                            else null
                          end
  where user_id = me and day = today
  returning * into rec;

  return query select
    rec.day,
    rec.seconds_accumulated,
    target,
    greatest(0, target - rec.seconds_accumulated),
    (rec.completed_at is not null),
    credit,
    now_ts;
end;
$$;

revoke all on function public.engagement_heartbeat() from public, anon;
grant execute on function public.engagement_heartbeat() to authenticated;


-- Explicit pause: sign-out, tab hidden, idle timeout. Clearing last_beat_at
-- means the next beat credits nothing, so the gap while away is never counted.
create or replace function public.engagement_pause()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return; end if;
  update public.daily_engagement
     set last_beat_at = null
   where user_id = me and day = public.engagement_day(now());
end;
$$;

revoke all on function public.engagement_pause() from public, anon;
grant execute on function public.engagement_pause() to authenticated;


create or replace function public.get_engagement_status(p_uid uuid default auth.uid())
returns table (
  day                 date,
  seconds_accumulated integer,
  seconds_target      integer,
  seconds_remaining   integer,
  percent_complete    numeric,
  completed           boolean,
  completed_at        timestamptz,
  running             boolean,
  server_time         timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    public.engagement_day(now()),
    coalesce(d.seconds_accumulated, 0),
    ceil(extract(epoch from public.engagement_target()))::integer,
    greatest(0, ceil(extract(epoch from public.engagement_target()))::integer
                - coalesce(d.seconds_accumulated, 0)),
    round(100.0 * coalesce(d.seconds_accumulated, 0)
          / ceil(extract(epoch from public.engagement_target()))::numeric, 2),
    (d.completed_at is not null),
    d.completed_at,
    (d.last_beat_at is not null and d.last_beat_at > now() - interval '90 seconds'),
    now()
  from (select p_uid as uid) q
  left join public.daily_engagement d
    on d.user_id = q.uid and d.day = public.engagement_day(now())
  where p_uid = auth.uid() or public.omega_is_owner();
$$;

revoke all on function public.get_engagement_status(uuid) from public, anon;
grant execute on function public.get_engagement_status(uuid) to authenticated;


-- Owner view: who met the daily obligation, and who did not.
create or replace function public.engagement_report(p_day date default null)
returns table (
  user_id             uuid,
  email               text,
  seconds_accumulated integer,
  percent_complete    numeric,
  completed           boolean,
  completed_at        timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare target integer := ceil(extract(epoch from public.engagement_target()))::integer;
begin
  if not public.omega_is_owner() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  return query
    select d.user_id,
           p.email,
           d.seconds_accumulated,
           round(100.0 * d.seconds_accumulated / target::numeric, 2),
           (d.completed_at is not null),
           d.completed_at
    from public.daily_engagement d
    left join public.profiles p on p.id = d.user_id
    where d.day = coalesce(p_day, public.engagement_day(now()))
    order by d.seconds_accumulated desc;
end;
$$;

revoke all on function public.engagement_report(date) from public, anon;
grant execute on function public.engagement_report(date) to authenticated;

commit;


-- ============================================================================
-- VERIFY
--
--   select extract(epoch from public.engagement_target());   -- 33437
--   select extract(epoch from public.trial_duration());      -- 557
--
--   select * from public.engagement_heartbeat();   -- first beat credits 0
--   select pg_sleep(3);
--   select * from public.engagement_heartbeat();   -- credits ~3
--
--   select * from public.engagement_pause();
--   select pg_sleep(5);
--   select * from public.engagement_heartbeat();   -- credits 0 after a pause
--
-- ----------------------------------------------------------------------------
-- DESIGN NOTES WORTH YOUR ATTENTION
--
-- 1. 33,437s is 38.7% of a 24-hour day, every day. That is a heavy obligation
--    and members will fail it often. Decide deliberately what failing means —
--    no reward, a streak reset, or loss of access are very different products.
--    Nothing here punishes a miss; that policy is yours to write.
--
-- 2. The day boundary is UTC. For members in Beirut that means the day resets
--    at 03:00 local in summer. If the platform day should follow local time,
--    change engagement_day() — it is deliberately the single point of change.
--
-- 3. MAX_BEAT_GAP is 45s against a 30s client interval. Raising the client
--    interval without raising the cap silently under-credits everyone.
-- ============================================================================
