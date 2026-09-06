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
create index if not exists ai_workspace_members_profile_id_idx on public.ai_workspace_members (profile_id);
create index if not exists billing_plan_features_feature_id_idx on public.billing_plan_features (feature_id);
create index if not exists graph_events_entity_id_idx on public.graph_events (entity_id);
create index if not exists graph_evidence_graph_entity_id_idx on public.graph_evidence (graph_entity_id);
create index if not exists graph_evidence_graph_relationship_id_idx on public.graph_evidence (graph_relationship_id);
create index if not exists graph_relationships_source_entity_id_idx on public.graph_relationships (source_entity_id);
create index if not exists graph_relationships_target_entity_id_idx on public.graph_relationships (target_entity_id);
create index if not exists organization_members_profile_id_idx on public.organization_members (profile_id);
create index if not exists publication_tag_map_tag_id_idx on public.publication_tag_map (tag_id);
create index if not exists role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index if not exists task_label_map_label_id_idx on public.task_label_map (label_id);

commit;
