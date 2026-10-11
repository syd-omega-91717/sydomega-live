begin;

-- Remove only indexes introduced by the broad experimental FK pass.
-- Existing project indexes are untouched.
do $$
declare
  idx record;
begin
  for idx in
    select n.nspname as schema_name, c.relname as index_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'i'
      and c.relname like 'omega_fk_%'
  loop
    execute format('drop index if exists %I.%I', idx.schema_name, idx.index_name);
  end loop;
end
$$;

-- Add only the foreign-key indexes explicitly identified by the advisor.
-- Guarded (2026-10-04): several of these tables are created out-of-band, so
-- a fresh `supabase db reset` reached this line before they existed.
do $$
declare r record;
begin
  for r in select * from (values
    ('ai_workspace_members_profile_id_idx','ai_workspace_members','profile_id'),
    ('billing_plan_features_feature_id_idx','billing_plan_features','feature_id'),
    ('graph_events_entity_id_idx','graph_events','entity_id'),
    ('graph_evidence_graph_entity_id_idx','graph_evidence','graph_entity_id'),
    ('graph_evidence_graph_relationship_id_idx','graph_evidence','graph_relationship_id'),
    ('graph_relationships_source_entity_id_idx','graph_relationships','source_entity_id'),
    ('graph_relationships_target_entity_id_idx','graph_relationships','target_entity_id'),
    ('organization_members_profile_id_idx','organization_members','profile_id'),
    ('publication_tag_map_tag_id_idx','publication_tag_map','tag_id'),
    ('role_permissions_permission_id_idx','role_permissions','permission_id'),
    ('task_label_map_label_id_idx','task_label_map','label_id')
  ) v(idx, tbl, col) loop
    if to_regclass('public.' || r.tbl) is not null then
      execute format('create index if not exists %I on public.%I (%I)', r.idx, r.tbl, r.col);
    end if;
  end loop;
end
$$;

commit;
