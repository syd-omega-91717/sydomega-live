-- SYD OMEGA 91717 — Ad approval lifecycle + owner role (idempotent; safe to re-run)
alter table public.profiles add column if not exists is_owner boolean not null default false;
alter table public.media_reservations alter column status set default 'submitted';

-- owner can read ALL reservations (members still read their own via existing policy)
drop policy if exists "owner reads all media" on public.media_reservations;
create policy "owner reads all media" on public.media_reservations for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_owner));

-- owner can update status of any reservation
drop policy if exists "owner updates media" on public.media_reservations;
create policy "owner updates media" on public.media_reservations for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_owner))
  with check (true);
grant update on public.media_reservations to authenticated;

-- ANOINT THE OWNER: replace the email with the address you signed up with, then run this line.
-- update public.profiles set is_owner = true where id = (select id from auth.users where email = 's.y.dagher@gmail.com');
