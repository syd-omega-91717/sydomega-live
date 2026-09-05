begin;

-- Avoid per-row re-evaluation of auth.uid() in the platform event RLS policy.
alter policy omega_platform_events_select_own on public.omega_platform_events
  using (actor_user_id = (select auth.uid()));

-- Add covering indexes for every valid foreign key that currently lacks one.
-- This is additive only: existing indexes are preserved and no unused indexes are dropped.
do $$
declare
  fk record;
  idx_name text;
  column_list text;
begin
  for fk in
    select
      c.oid as constraint_oid,
      c.conrelid,
      c.conname,
      c.conkey,
      c.connamespace
    from pg_constraint c
    where c.contype = 'f'
      and c.connamespace = 'public'::regnamespace
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and i.indisready
          and i.indnkeyatts >= array_length(c.conkey, 1)
          and (i.indkey::smallint[])[1:array_length(c.conkey, 1)] = c.conkey
      )
  loop
    idx_name := 'omega_fk_' || substr(md5(fk.conrelid::regclass::text || ':' || fk.conname), 1, 24);

    select string_agg(format('%I', a.attname), ', ' order by k.ord)
      into column_list
    from unnest(fk.conkey) with ordinality as k(attnum, ord)
    join pg_attribute a
      on a.attrelid = fk.conrelid
     and a.attnum = k.attnum
     and not a.attisdropped;

    if column_list is not null then
      execute format(
        'create index if not exists %I on %s (%s)',
        idx_name,
        fk.conrelid::regclass,
        column_list
      );
    end if;
  end loop;
end
$$;

commit;
