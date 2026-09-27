create or replace function public.get_public_schema_metrics()
returns table (
  public_tables bigint,
  rls_enabled bigint,
  rls_disabled bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*)::bigint as public_tables,
    count(*) filter (where c.relrowsecurity)::bigint as rls_enabled,
    count(*) filter (where not c.relrowsecurity)::bigint as rls_disabled
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p');
$$;

revoke execute on function public.get_public_schema_metrics() from public;
revoke execute on function public.get_public_schema_metrics() from anon;
grant execute on function public.get_public_schema_metrics() to authenticated;
