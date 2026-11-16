-- Ω SYD OMEGA 91717 — replay compatibility for enterprise API-key metadata
-- Source migration 0062 uses key_name/is_active; the verified live provider
-- and enterprise.html use name/active. Preserve existing values by renaming
-- legacy columns on clean replay. On current production, both target columns
-- already exist, so this migration is expected to be a no-op.
-- No API-key values are read, copied, logged, or exposed by this migration.

begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'key_name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'name'
  ) then
    alter table public.api_keys rename column key_name to name;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'is_active'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'active'
  ) then
    alter table public.api_keys rename column is_active to active;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'name'
  ) then
    alter table public.api_keys add column name text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'active'
  ) then
    alter table public.api_keys add column active boolean default true;
  end if;
end
$$;

commit;
