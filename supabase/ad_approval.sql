-- SYD OMEGA 91717 -- Ad approval lifecycle + owner role (idempotent; safe to re-run)
-- PREREQUISITE: run omega_master_deploy.sql first (creates profiles + is_platform_owner()).
-- Fixed to use public.is_platform_owner() instead of a direct profiles.is_owner
-- check -- the direct check is the exact pattern that caused the RLS recursion
-- bug (42P17) omega_master_deploy.sql's Section 12 exists to fix; using it here
-- would reintroduce that risk.
alter table public.profiles add column if not exists is_owner boolean not null default false;
alter table public.media_reservations alter column status set default 'submitted';

-- owner can read ALL reservations (members still read their own via existing policy)
drop policy if exists "owner reads all media" on public.media_reservations;
create policy "owner reads all media" on public.media_reservations for select to authenticated
  using (auth.uid() = user_id or public.is_platform_owner());

-- owner can update status of any reservation
-- NOTE: omega_marketing.sql's set_reservation_status() function is the safer path
-- (validates status is one of submitted|reviewing|approved|rejected|live) -- this
-- direct UPDATE policy is kept for compatibility but doesn't validate the value.
drop policy if exists "owner updates media" on public.media_reservations;
create policy "owner updates media" on public.media_reservations for update to authenticated
  using (public.is_platform_owner())
  with check (true);
grant update on public.media_reservations to authenticated;

-- ANOINT THE OWNER: replace the email with the address you signed up with, then run this line.
-- update public.profiles set is_owner = true where id = (select id from auth.users where email = 's.y.dagher@gmail.com');
