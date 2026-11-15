-- Member public card: username, nickname, avatar, bio ("thoughts"), and a birthday visibility choice.
--
-- PRIVACY MODEL (the rule this file enforces)
--   * Everything about a member is PRIVATE by default. profiles stays readable by its owner and the platform owner only
--     (policy profiles_select, 20260923030958). This file does not widen that policy.
--   * Other members can see ONE thing: the output of public.get_public_card(), and only for a member who chose
--     is_public = true. The function names the fields it returns; nothing else leaves the table.
--   * Never returned, whatever the member chooses: email, phone, dob, birth_year (unless birthday_visibility = 'full'),
--     nationality, country, profession, display_name, kyc_*, stripe_*, subscription_*, tier, pledge/creed.
--   * A card that does not exist, is private, or belongs to a deactivated/rejected/unapproved member all return NULL, so a
--     caller cannot tell "no such member" from "private member".
--   * Birthday: 'private' (default) returns nothing; 'month_day' returns "MM-DD" with no year; 'full' returns the date.
--
-- Status: PROPOSAL. Deliberately NOT in supabase/migrations/ and NOT in supabase/pending-migrations.json (see
-- 20261115200000_omega_lock_birth_date_after_first_entry.sql for why). The UI that uses it ships dormant behind the
-- platform_settings flag public_cards_enabled (default false) and must not be switched on until this is applied.
--
-- Known gap this does NOT close: the 'avatars' storage bucket is public-read (0022_storage.sql), so an avatar is visible to
-- anyone holding its URL even when the profile is private. Fixing that means a private bucket plus signed URLs, a separate change.

create schema if not exists private;

alter table public.profiles
  add column if not exists username text,
  add column if not exists nickname text,
  add column if not exists birthday_visibility text not null default 'private';

-- shape rules on the NEW columns only (they are null/default on every existing row, so these validate nothing historic)
alter table public.profiles drop constraint if exists profiles_username_shape;
alter table public.profiles add constraint profiles_username_shape check (
  username is null or (
    username ~ '^[a-z0-9_]{3,24}$'
    and username !~ '^(admin|owner|root|support|system|sovereign|omega|syd|staff|moderator|mod|official|null|undefined)$'
  )
);

alter table public.profiles drop constraint if exists profiles_nickname_shape;
alter table public.profiles add constraint profiles_nickname_shape check (
  nickname is null or (char_length(btrim(nickname)) between 1 and 40 and nickname !~ '[<>[:cntrl:]]')
);

alter table public.profiles drop constraint if exists profiles_birthday_visibility_check;
alter table public.profiles add constraint profiles_birthday_visibility_check
  check (birthday_visibility in ('private', 'month_day', 'full'));

-- a bio is shown to other members, so bound it and keep markup out of it. A trigger, not a CHECK: even a NOT VALID check is
-- enforced on EVERY later update of the row, so a member whose existing bio is long or contains < > would be refused when they
-- changed something unrelated (proved on the throwaway database: 3 of 3 legacy-bio cases failed under the CHECK).
alter table public.profiles drop constraint if exists profiles_bio_shape;

create or replace function private.validate_bio()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.bio is not null and (char_length(new.bio) > 280 or new.bio ~ '[<>]') then
    raise exception 'bio_not_allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_bio() from public, anon, authenticated;

drop trigger if exists trg_validate_bio_ins on public.profiles;
create trigger trg_validate_bio_ins
  before insert on public.profiles
  for each row
  when (new.bio is not null)
  execute function private.validate_bio();

drop trigger if exists trg_validate_bio on public.profiles;
create trigger trg_validate_bio
  before update of bio on public.profiles
  for each row
  when (new.bio is distinct from old.bio)
  execute function private.validate_bio();

create unique index if not exists profiles_username_lower_uq on public.profiles (username) where username is not null;

-- avatar_url accepted any string. Once the public card shows it to OTHER members, an arbitrary URL would make every viewer's
-- browser fetch from a host the member chose (leaking the viewer's IP address), and a non-https value is not an image at all.
-- Only an object under this member's own folder of the avatars bucket is allowed. Trigger, not a CHECK: a CHECK would also run on every unrelated update of a row
-- whose existing avatar (for example one copied from a sign-in provider) does not match.
create or replace function private.validate_avatar_url()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.avatar_url is null or new.avatar_url = '' then
    new.avatar_url := null;
    return new;
  end if;
  if new.avatar_url !~ ('^https://ydqhzvvoyufiiqvzcjns\.supabase\.co/storage/v1/object/public/avatars/' || new.id::text || '/[A-Za-z0-9._/-]{1,200}$') then
    raise exception 'avatar_url_not_allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_avatar_url() from public, anon, authenticated;

-- two triggers: a WHEN clause cannot test tg_op, and `old` does not exist on INSERT
drop trigger if exists trg_validate_avatar_url_ins on public.profiles;
create trigger trg_validate_avatar_url_ins
  before insert on public.profiles
  for each row
  when (new.avatar_url is not null)
  execute function private.validate_avatar_url();

drop trigger if exists trg_validate_avatar_url on public.profiles;
create trigger trg_validate_avatar_url
  before update of avatar_url on public.profiles
  for each row
  when (new.avatar_url is distinct from old.avatar_url)
  execute function private.validate_avatar_url();

-- the member may edit these columns on their own row (profiles_update already scopes the row to auth.uid())
grant update (username, nickname, birthday_visibility) on public.profiles to authenticated;

insert into public.platform_settings (key, bool_value, updated_at)
values ('public_cards_enabled', false, now())
on conflict (key) do nothing;

-- The ONLY door through which another member sees a profile.
create or replace function public.get_public_card(p_username text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
           'username', p.username,
           'nickname', p.nickname,
           'avatar_url', p.avatar_url,
           'bio', p.bio,
           'sign', p.sign,
           'birthday', case p.birthday_visibility
                         when 'month_day' then to_char(p.birth_date, 'MM-DD')
                         when 'full'      then to_char(p.birth_date, 'YYYY-MM-DD')
                         else null
                       end
         )
  from public.profiles p
  where auth.uid() is not null
    and coalesce((select bool_value from public.platform_settings where key = 'public_cards_enabled'), false)
    and p.username = lower(btrim(p_username))
    and p.is_public is true
    and coalesce(p.access_approved, false)
    and p.deactivated_at is null
    and p.is_rejected is not true
    and p.pending_deletion is not true
$$;

revoke all on function public.get_public_card(text) from public, anon;
grant execute on function public.get_public_card(text) to authenticated;
