-- Bring the legacy news read model into the versioned migration history.
-- No content rows are seeded: production's existing single row remains provider/data evidence,
-- while clean environments start empty until a governed source is configured.
begin;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text default 'INTELLIGENCE',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid='public.news'::regclass
      and polname='omega_deny_by_default'
  ) then
    create policy omega_deny_by_default
      on public.news
      for all
      using (false)
      with check (false);
  end if;
end;
$$;

revoke all on table public.news from public, anon, service_role;
grant select on table public.news to authenticated;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='news'
      and column_name in ('id','title','body','category','is_published','created_at')
    group by table_schema,table_name
    having count(*)=6
  ) then
    raise exception 'news_schema_columns_incomplete';
  end if;
  if not exists (
    select 1 from pg_class
    where oid='public.news'::regclass and relrowsecurity
  ) then
    raise exception 'news_rls_not_enabled';
  end if;
  if not exists (
    select 1 from pg_policy
    where polrelid='public.news'::regclass
      and polname='omega_deny_by_default'
      and pg_get_expr(polqual,polrelid)='false'
      and pg_get_expr(polwithcheck,polrelid)='false'
  ) then
    raise exception 'news_deny_by_default_policy_missing';
  end if;
  if has_table_privilege('anon','public.news','SELECT')
     or has_table_privilege('service_role','public.news','SELECT')
     or not has_table_privilege('authenticated','public.news','SELECT') then
    raise exception 'news_table_acl_invalid';
  end if;
end;
$$;

commit;
