-- Ω SYD OMEGA 91717 — read-only live media / Storage reconciliation
-- Run with an administrative, read-only Supabase SQL session.
-- This query returns aggregate metadata only: no object names, paths, user IDs,
-- prompts, filenames, signed URLs, or media bytes are exposed.
-- It performs no DDL, DML, uploads, deletes, or network requests.

with bucket_inventory as (
  select
    b.id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types,
    b.type,
    b.versioning_status,
    count(o.id)::bigint as object_count,
    coalesce(sum(case
      when o.metadata->>'size' ~ '^[0-9]+$' then (o.metadata->>'size')::bigint
      else 0
    end), 0)::bigint as total_bytes,
    count(o.id) filter (where o.owner_id is null)::bigint as ownerless_objects,
    count(o.id) filter (where o.archived_at is not null)::bigint as archived_objects
  from storage.buckets b
  left join storage.objects o on o.bucket_id = b.id
  group by b.id, b.name, b.public, b.file_size_limit,
           b.allowed_mime_types, b.type, b.versioning_status
),
storage_file_inventory as (
  select
    count(*)::bigint as rows,
    count(*) filter (where storage_path is null or btrim(storage_path) = '')::bigint as missing_path,
    count(*) filter (where checksum is null or btrim(checksum) = '')::bigint as missing_checksum,
    coalesce(jsonb_agg(jsonb_build_object('visibility', visibility, 'rows', n)
      order by visibility), '[]'::jsonb) as by_visibility
  from (
    select visibility, count(*)::bigint as n
    from public.storage_files
    group by visibility
  ) grouped
  cross join (select count(*)::bigint as total from public.storage_files) total
  cross join lateral (
    select
      (select count(*)::bigint from public.storage_files) as rows,
      (select count(*)::bigint from public.storage_files where storage_path is null or btrim(storage_path) = '') as missing_path,
      (select count(*)::bigint from public.storage_files where checksum is null or btrim(checksum) = '') as missing_checksum
  ) unused
),
media_catalog as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'media_type', media_type,
    'status', status,
    'rows', n,
    'missing_thumbnail_url', missing_thumbnail,
    'missing_video_url', missing_video
  ) order by media_type, status), '[]'::jsonb) as rows
  from (
    select media_type, status, count(*)::bigint as n,
      count(*) filter (where thumbnail_url is null or btrim(thumbnail_url) = '')::bigint as missing_thumbnail,
      count(*) filter (where video_url is null or btrim(video_url) = '')::bigint as missing_video
    from public.media_items
    group by media_type, status
  ) grouped
),
creative_assets as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'asset_type', asset_type,
    'status', status,
    'truth_state', truth_state,
    'rows', n,
    'missing_storage_path', missing_path,
    'missing_hash', missing_hash,
    'missing_license', missing_license
  ) order by asset_type, status, truth_state), '[]'::jsonb) as rows
  from (
    select asset_type, status, truth_state, count(*)::bigint as n,
      count(*) filter (where storage_path is null or btrim(storage_path) = '')::bigint as missing_path,
      count(*) filter (where content_sha256 is null or btrim(content_sha256) = '')::bigint as missing_hash,
      count(*) filter (where license is null or btrim(license) = '')::bigint as missing_license
    from public.omega_creative_assets
    group by asset_type, status, truth_state
  ) grouped
),
media_jobs as (
  select coalesce(jsonb_agg(jsonb_build_object('job_type', job_type, 'status', status, 'rows', n)
    order by job_type, status), '[]'::jsonb) as rows
  from (
    select job_type, status, count(*)::bigint as n
    from public.omega_media_jobs
    group by job_type, status
  ) grouped
),
storage_rls as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.relname,
    'rls_enabled', c.relrowsecurity,
    'force_rls', c.relforcerowsecurity
  ) order by c.relname), '[]'::jsonb) as rows
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage' and c.relname in ('buckets', 'objects')
),
storage_policies as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', tablename,
    'name', policyname,
    'roles', roles,
    'command', cmd
  ) order by tablename, policyname), '[]'::jsonb) as rows
  from pg_policies
  where schemaname = 'storage' and tablename in ('buckets', 'objects')
)
select jsonb_build_object(
  'generated_at', now(),
  'storage_buckets', coalesce((select jsonb_agg(to_jsonb(bucket_inventory) order by name) from bucket_inventory), '[]'::jsonb),
  'storage_files', (select jsonb_build_object(
    'rows', count(*)::bigint,
    'missing_path', count(*) filter (where storage_path is null or btrim(storage_path) = '')::bigint,
    'missing_checksum', count(*) filter (where checksum is null or btrim(checksum) = '')::bigint,
    'by_visibility', coalesce((select jsonb_agg(jsonb_build_object('visibility', visibility, 'rows', n) order by visibility)
      from (select visibility, count(*)::bigint as n from public.storage_files group by visibility) x), '[]'::jsonb)
  ) from public.storage_files),
  'media_items', (select rows from media_catalog),
  'creative_assets', (select rows from creative_assets),
  'media_jobs', (select rows from media_jobs),
  'media_reservations', (select jsonb_build_object(
    'rows', count(*)::bigint,
    'with_file_path', count(*) filter (where file_path is not null and btrim(file_path) <> '')::bigint
  ) from public.media_reservations),
  'catalog_access', jsonb_build_object(
    'authenticated_select', has_table_privilege('authenticated', 'public.media_items', 'SELECT'),
    'anon_select', has_table_privilege('anon', 'public.media_items', 'SELECT'),
    'rls_enabled', (select relrowsecurity from pg_class where oid = 'public.media_items'::regclass)
  ),
  'storage_rls', (select rows from storage_rls),
  'storage_policies', (select rows from storage_policies)
) as media_storage_reconciliation;
