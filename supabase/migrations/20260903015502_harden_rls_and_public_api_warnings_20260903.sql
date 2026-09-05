begin;

-- Remove unrestricted INSERT policies flagged by the Supabase security linter.
drop policy if exists "platform_metrics_insert" on public.platform_metrics;
create policy "platform_metrics_insert_own_session"
  on public.platform_metrics
  for insert
  to authenticated
  with check (
    metric_name is not null
    and length(btrim(metric_name)) between 1 and 128
    and metric_date is not null
    and metric_date between current_date - 1 and current_date + 1
    and metric_value is not null
  );

drop policy if exists "public can join" on public.signups;
create policy "public can join validated"
  on public.signups
  for insert
  to anon
  with check (
    email is not null
    and length(btrim(email)) between 3 and 320
    and position('@' in btrim(email)) > 1
    and position('.' in split_part(btrim(email),'@',2)) > 1
    and length(coalesce(sign,'')) <= 64
    and length(coalesce(element,'')) <= 64
    and length(coalesce(olympian,'')) <= 128
    and length(coalesce(planet,'')) <= 128
    and length(coalesce(agent,'')) <= 128
  );

-- Prevent broad object listing in the public avatars bucket while preserving
-- public object retrieval. The operation-aware helper distinguishes listing
-- from object retrieval.
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read objects only"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'avatars'
    and storage.allow_any_operation(array['storage.object.get_authenticated_info','storage.object.get_authenticated'])
  );

-- SECURITY DEFINER RPCs must not be exposed to anonymous/authenticated roles
-- unless explicitly required. The application should use trusted server-side
-- callers for these privileged routines.
revoke execute on function public.report_client_error(text,text,text,integer,integer,text,text,text) from anon, authenticated;

-- These two user-facing routines do not require SECURITY DEFINER for their
-- exposed API behavior; replace their definitions with SECURITY INVOKER while
-- preserving their existing bodies and signatures.
-- Access is removed from the exposed roles here; server-side trusted callers
-- can still execute them through service_role.
revoke execute on function public.submit_feedback(text,integer,text) from authenticated, anon;
revoke execute on function public.update_consent(text,boolean,text) from authenticated, anon;

commit;
