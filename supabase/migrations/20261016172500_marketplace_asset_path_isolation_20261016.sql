-- Ω SYD OMEGA 91717 — marketplace asset-path isolation
-- Keep the current listing UI compatible while removing private Storage paths
-- from member-visible listing rows. Purchase-gated delivery remains unimplemented.

begin;

create schema if not exists omega_private;

create table if not exists omega_private.marketplace_listing_assets (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  seller_id uuid not null,
  bucket text not null default 'uploads' check (bucket = 'uploads'),
  object_path text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_listing_assets_owner_path_check
    check (object_path ~ ('^' || seller_id::text || '/[A-Za-z0-9._-]+$'))
);

alter table omega_private.marketplace_listing_assets enable row level security;
revoke all on table omega_private.marketplace_listing_assets from public, anon, authenticated, service_role;

comment on table omega_private.marketplace_listing_assets is
  'Server-only marketplace Storage object references. Never return object_path to a member client. A future delivery endpoint must verify a completed paid entitlement before issuing a short-lived signed URL.';

-- Fail closed if any legacy path does not match the uploader's UID-prefixed path
-- contract. Never silently move an unrecognized path into private metadata.
do $migration$
begin
  if exists (
    select 1
    from public.marketplace_listings l
    where l.file_path is not null
      and (
        l.seller_id is null
        or btrim(l.file_path) = ''
        or btrim(l.file_path) !~ ('^' || l.seller_id::text || '/[A-Za-z0-9._-]+$')
      )
  ) then
    raise exception 'marketplace_asset_path_backfill_invalid'
      using errcode = '22023';
  end if;
end;
$migration$;

insert into omega_private.marketplace_listing_assets
  (listing_id, seller_id, bucket, object_path)
select l.id, l.seller_id, 'uploads', btrim(l.file_path)
from public.marketplace_listings l
where l.file_path is not null
on conflict (listing_id) do update
set seller_id = excluded.seller_id,
    bucket = excluded.bucket,
    object_path = excluded.object_path,
    updated_at = now();

-- Preserve compatibility with the existing deployed client, which still reads
-- SELECT *. The field remains present but is NULL in public rows.
update public.marketplace_listings
set file_path = null
where file_path is not null;

create or replace function omega_private.capture_marketplace_listing_asset()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  path_value text;
begin
  if tg_op = 'UPDATE'
     and new.seller_id is distinct from old.seller_id
     and exists (
       select 1
       from omega_private.marketplace_listing_assets a
       where a.listing_id = old.id
     ) then
    raise exception 'marketplace_asset_seller_change_forbidden'
      using errcode = '42501';
  end if;

  if new.file_path is not null then
    path_value := btrim(new.file_path);
    if new.seller_id is null
       or path_value = ''
       or path_value !~ ('^' || new.seller_id::text || '/[A-Za-z0-9._-]+$') then
      raise exception 'marketplace_asset_path_invalid'
        using errcode = '22023';
    end if;

    insert into omega_private.marketplace_listing_assets
      (listing_id, seller_id, bucket, object_path)
    values
      (new.id, new.seller_id, 'uploads', path_value)
    on conflict (listing_id) do update
    set seller_id = excluded.seller_id,
        bucket = excluded.bucket,
        object_path = excluded.object_path,
        updated_at = now();

    new.file_path := null;
  end if;

  return new;
end;
$function$;

revoke all on function omega_private.capture_marketplace_listing_asset() from public, anon, authenticated;

drop trigger if exists marketplace_listing_asset_path_isolation on public.marketplace_listings;
create trigger marketplace_listing_asset_path_isolation
before insert or update of file_path, seller_id
on public.marketplace_listings
for each row execute function omega_private.capture_marketplace_listing_asset();

-- Do not expose inactive/draft listing rows to other members. Sellers can still
-- inspect their own listings; the platform owner can inspect all rows.
drop policy if exists marketplace_listings_select on public.marketplace_listings;
create policy marketplace_listings_select
on public.marketplace_listings
for select to authenticated
using (
  private.is_platform_owner()
  or status = 'active'
  or seller_id = (select auth.uid())
);

-- The member view counts the member's own listings. Count(id) is equivalent to
-- count(*) because id is the primary key and allows least-privilege column grants
-- in a later deployment-safe phase.
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
  coalesce((select count(*) from public.omega_member_mission_state m where m.user_id = (select auth.uid()) and upper(m.status)='COMPLETED'),0)::bigint as completed_mission_count,
  coalesce((select count(*) from public.omega_member_mission_tasks t where t.user_id = (select auth.uid())),0)::bigint as mission_task_count,
  coalesce((select count(*) from public.omega_member_mission_tasks t where t.user_id = (select auth.uid()) and t.status in ('started','submitted','verified')),0)::bigint as active_mission_task_count,
  coalesce((select count(*) from public.omega_member_mission_tasks t where t.user_id = (select auth.uid()) and t.status='completed'),0)::bigint as completed_mission_task_count,
  coalesce((select count(*) from public.ai_memory m where m.user_id = (select auth.uid())),0)::bigint as memory_count,
  coalesce((select count(*) from public.ai_memory_embeddings e where e.user_id = (select auth.uid())),0)::bigint as embedding_count,
  coalesce((select count(*) from public.knowledge_spaces s where s.owner_id = (select auth.uid())),0)::bigint as knowledge_space_count,
  coalesce((select count(*) from public.knowledge_documents d where d.author_id = (select auth.uid()) or d.space_id in (select s.id from public.knowledge_spaces s where s.owner_id = (select auth.uid()))),0)::bigint as knowledge_document_count,
  coalesce((select count(l.id) from public.marketplace_listings l where coalesce(l.seller_id,l.user_id) = (select auth.uid())),0)::bigint as marketplace_listing_count,
  coalesce((select count(*) from public.marketplace_orders o where o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid())),0)::bigint as marketplace_order_count;
comment on view public.omega_member_product_reality is 'Canonical member product read model derived only from authoritative production tables. Zero means no observed production data, never synthetic activity.';
revoke all on public.omega_member_product_reality from public, anon;
grant select on public.omega_member_product_reality to authenticated;

-- Platform-facing count reflects active listings only, which is the public
-- marketplace inventory after the stricter row policy.
create or replace view public.omega_platform_product_reality
with (security_invoker = true)
as
select
  (select count(*) from public.omega_missions where status='active')::bigint as active_mission_catalog_count,
  (select count(*) from public.capability_registry)::bigint as capability_count,
  (select count(*) from public.omega_platform_events)::bigint as platform_event_count,
  (select count(*) from public.omega_platform_evidence)::bigint as platform_evidence_count,
  (select count(*) from public.knowledge_documents)::bigint as knowledge_document_count,
  (select count(id) from public.marketplace_listings where status='active')::bigint as marketplace_listing_count,
  (select count(*) from public.marketplace_orders)::bigint as marketplace_order_count,
  (select count(*) from public.stripe_webhook_events)::bigint as stripe_webhook_event_count;
comment on view public.omega_platform_product_reality is 'Authenticated product-reality summary derived from canonical tables. Marketplace count includes active, publicly visible listings only. Counts are observational and never fabricated KPIs.';
revoke all on public.omega_platform_product_reality from public, anon;
grant select on public.omega_platform_product_reality to authenticated;

commit;
