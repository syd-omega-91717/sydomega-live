-- SYD OMEGA 91717 — access approval gate (idempotent; safe to re-run)
alter table public.profiles add column if not exists is_owner boolean not null default false;
alter table public.profiles add column if not exists access_approved boolean not null default false;
alter table public.profiles add column if not exists access_requested_at timestamptz;
alter table public.profiles add column if not exists email text;

-- owner check that does NOT recurse through RLS (security definer)
create or replace function public.is_app_owner() returns boolean
  language sql security definer stable as $$
  select coalesce((select is_owner from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_app_owner() to authenticated;

-- owner may read & update ALL profiles (members keep their own-row policies)
drop policy if exists "owner reads profiles" on public.profiles;
create policy "owner reads profiles" on public.profiles for select to authenticated using (public.is_app_owner());
drop policy if exists "owner updates profiles" on public.profiles;
create policy "owner updates profiles" on public.profiles for update to authenticated using (public.is_app_owner()) with check (true);

-- ANOINT + ADMIT YOURSELF so you are never locked out. Replace the email, then run this line:
-- update public.profiles set is_owner=true, access_approved=true where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
