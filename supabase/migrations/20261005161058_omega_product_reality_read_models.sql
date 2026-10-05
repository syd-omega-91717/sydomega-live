-- Ω PRODUCT REALITY READ MODELS
create or replace view public.omega_member_product_reality
with (security_invoker = true)
as
select
  (select auth.uid()) as user_id,
  coalesce((select count(*) from public.omega_platform_events e where e.actor_user_id = (select auth.uid())),0)::bigint as event_count,
  coalesce((select count(*) from public.omega_platform_evidence e where e.owner_user_id = (select auth.uid())),0)::bigint as evidence_count,
  coalesce((select count(*) from public.task_completions t where t.user_id = (select auth.uid())),0)::bigint as task_completion_count,
  coalesce((select count(*) from public.omega_member_mission_state m where m.user_id = (select auth.uid())),0)::bigint as mission_count,
  coalesce((select count(*) from public.omega_member_mission_state m where m.user_id = (select auth.uid()) and upper(m.status) in ('ACTIVE','IN_PROGRESS')),0)::bigint as active_mission_count,
  coalesce((select count(*) from public.omega_member_mission_state m where m.user_id = (select auth.uid()) and upper(m.status) = 'COMPLETED'),0)::bigint as completed_mission_count,
  coalesce((select count(*) from public.ai_memory m where m.user_id = (select auth.uid())),0)::bigint as memory_count,
  coalesce((select count(*) from public.ai_memory_embeddings e where e.user_id = (select auth.uid())),0)::bigint as embedding_count,
  coalesce((select count(*) from public.knowledge_spaces s where s.owner_id = (select auth.uid())),0)::bigint as knowledge_space_count,
  coalesce((select count(*) from public.knowledge_documents d where d.author_id = (select auth.uid()) or d.space_id in (select s.id from public.knowledge_spaces s where s.owner_id = (select auth.uid()))),0)::bigint as knowledge_document_count,
  coalesce((select count(*) from public.marketplace_listings l where coalesce(l.seller_id,l.user_id) = (select auth.uid())),0)::bigint as marketplace_listing_count,
  coalesce((select count(*) from public.marketplace_orders o where o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid())),0)::bigint as marketplace_order_count,
  coalesce((select count(*) from public.marketplace_orders o where o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid())),0)::bigint as marketplace_order_count;
comment on view public.omega_member_product_reality is 'Canonical member product read model derived only from authoritative production tables. Zero means no observed production data, never synthetic activity.';
revoke all on public.omega_member_product_reality from public, anon;
grant select on public.omega_member_product_reality to authenticated;

create or replace view public.omega_platform_product_reality
with (security_invoker = true)
as
select
  (select count(*) from public.omega_missions where status='active')::bigint as active_mission_catalog_count,
  (select count(*) from public.capability_registry)::bigint as capability_count,
  (select count(*) from public.omega_platform_events)::bigint as platform_event_count,
  (select count(*) from public.omega_platform_evidence)::bigint as platform_evidence_count,
  (select count(*) from public.knowledge_documents)::bigint as knowledge_document_count,
  (select count(*) from public.marketplace_listings)::bigint as marketplace_listing_count,
  (select count(*) from public.marketplace_orders)::bigint as marketplace_order_count,
  (select count(*) from public.stripe_webhook_events)::bigint as stripe_webhook_event_count;
comment on view public.omega_platform_product_reality is 'Authenticated product-reality summary derived from canonical tables. Counts are observational and never fabricated KPIs.';
revoke all on public.omega_platform_product_reality from public, anon;
grant select on public.omega_platform_product_reality to authenticated;