do $$
declare
  idx record;
begin
  for idx in
    select n.nspname as schema_name, t.relname as table_name, i.relname as index_name
    from pg_index ix
    join pg_class i on i.oid = ix.indexrelid
    join pg_class t on t.oid = ix.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and i.relname like 'omega_fk_%'
      and exists (
        select 1
        from pg_index ix2
        join pg_class i2 on i2.oid = ix2.indexrelid
        where ix2.indrelid = ix.indrelid
          and ix2.indkey = ix.indkey
          and ix2.indexrelid <> ix.indexrelid
          and i2.relname not like 'omega_fk_%'
      )
  loop
    execute format('drop index if exists %I.%I', idx.schema_name, idx.index_name);
  end loop;
end
$$;
