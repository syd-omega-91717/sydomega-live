-- KYC: retention, consent, withdrawal and the owner's intake switch.
-- Decision record: docs/decisions/kyc-intake/PLAN.md (Round 3 addendum).
-- Builds on 20260927110344_kyc_intake_rpcs.sql.
--
-- RETENTION RULE (the one the privacy notice states):
--   An identity document is kept only while it is waiting for review. When a
--   verdict (verified | rejected) is recorded the document is deleted; what is
--   kept is the verdict and its dates -- never the image. A member may withdraw
--   a pending submission at any time, which deletes the document too.
--
-- Deletion goes through the Storage API (deleting storage.objects rows in SQL
-- would orphan the bytes). The owner therefore needs DELETE on `uploads`; each
-- purge is then confirmed by the server: kyc_document_purged() clears the
-- record's path only once the object is really gone, and kyc_queue() keeps
-- listing any verdict whose document still exists, so nothing is orphaned
-- silently.

alter table public.profiles add column if not exists kyc_reviewed_at timestamptz;
alter table public.profiles add column if not exists kyc_doc_purged_at timestamptz;
alter table public.profiles add column if not exists kyc_consent_at timestamptz;

drop policy if exists "uploads owner delete" on storage.objects;
create policy "uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (select private.is_platform_owner()));

-- Consent is now part of the submission. The one-argument form is dropped so
-- nothing can submit without it.
drop function if exists public.submit_kyc(text);
drop function if exists private.submit_kyc(text);

create or replace function private.submit_kyc(p_doc_path text, p_consent boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  prof record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'signed_out'); end if;
  if not coalesce(private.get_platform_flag('kyc_intake_enabled'), false) then
    return jsonb_build_object('ok', false, 'error', 'intake_closed');
  end if;
  if p_consent is not true then return jsonb_build_object('ok', false, 'error', 'consent_required'); end if;
  if p_doc_path is null or p_doc_path !~ ('^' || uid::text || '/[^/]{1,255}$') then
    return jsonb_build_object('ok', false, 'error', 'bad_path');
  end if;
  if not exists (select 1 from storage.objects o
                  where o.bucket_id = 'uploads' and o.name = p_doc_path
                    and o.owner_id = uid::text) then
    return jsonb_build_object('ok', false, 'error', 'no_document');
  end if;

  select id, kyc_status, kyc_doc_path, access_approved, is_owner
    into prof from public.profiles where id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_profile'); end if;
  if not (coalesce(prof.access_approved, false) or coalesce(prof.is_owner, false)) then
    return jsonb_build_object('ok', false, 'error', 'not_approved');
  end if;
  if prof.kyc_status = 'verified' then
    return jsonb_build_object('ok', false, 'error', 'already_verified');
  end if;

  update public.profiles
     set kyc_status = 'submitted', kyc_doc_path = p_doc_path, kyc_submitted_at = now(),
         kyc_consent_at = now(), kyc_reviewed_at = null, kyc_doc_purged_at = null
   where id = uid;
  return jsonb_build_object('ok', true, 'status', 'submitted',
    'replaced', case when prof.kyc_doc_path is distinct from p_doc_path then prof.kyc_doc_path end);
end $$;

-- A verdict records its time and hands back the document path for deletion.
create or replace function private.review_kyc(p_member uuid, p_verdict text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare cur text; doc text;
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if p_verdict not in ('verified', 'rejected') then return jsonb_build_object('ok', false, 'error', 'bad_verdict'); end if;
  select kyc_status, kyc_doc_path into cur, doc from public.profiles where id = p_member for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_profile'); end if;
  if cur is distinct from 'submitted' then return jsonb_build_object('ok', false, 'error', 'not_submitted'); end if;
  update public.profiles set kyc_status = p_verdict, kyc_reviewed_at = now() where id = p_member;
  raise log 'OMEGA_KYC verdict: actor=% target=% verdict=%', auth.uid(), p_member, p_verdict;
  return jsonb_build_object('ok', true, 'status', p_verdict, 'purge', doc);
end $$;

-- Owner, after deleting the object through the Storage API: clears the path
-- only when the object is really gone.
create or replace function private.kyc_document_purged(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare cur text; doc text;
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  select kyc_status, kyc_doc_path into cur, doc from public.profiles where id = p_member for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_profile'); end if;
  if cur not in ('verified', 'rejected') then return jsonb_build_object('ok', false, 'error', 'no_verdict'); end if;
  if doc is not null and exists (select 1 from storage.objects o where o.bucket_id = 'uploads' and o.name = doc) then
    return jsonb_build_object('ok', false, 'error', 'still_stored');
  end if;
  update public.profiles set kyc_doc_path = null, kyc_doc_purged_at = coalesce(kyc_doc_purged_at, now())
   where id = p_member;
  return jsonb_build_object('ok', true);
end $$;

-- Member, after deleting their own pending document: withdraws the submission.
create or replace function private.withdraw_kyc()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid := auth.uid(); cur text; doc text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'signed_out'); end if;
  select kyc_status, kyc_doc_path into cur, doc from public.profiles where id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_profile'); end if;
  if cur is distinct from 'submitted' then return jsonb_build_object('ok', false, 'error', 'not_submitted'); end if;
  if doc is not null and exists (select 1 from storage.objects o where o.bucket_id = 'uploads' and o.name = doc) then
    return jsonb_build_object('ok', false, 'error', 'still_stored', 'doc_path', doc);
  end if;
  update public.profiles set kyc_status = 'none', kyc_doc_path = null, kyc_doc_purged_at = now() where id = uid;
  return jsonb_build_object('ok', true, 'status', 'none');
end $$;

-- Owner's review list: submissions to decide, and verdicts whose document
-- still has to be deleted.
create or replace function private.kyc_queue()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  return jsonb_build_object('ok', true,
    'intake_enabled', coalesce(private.get_platform_flag('kyc_intake_enabled'), false),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'display_name', p.display_name, 'submitted_at', p.kyc_submitted_at, 'doc_path', p.kyc_doc_path)
        order by p.kyc_submitted_at)
      from public.profiles p where p.kyc_status = 'submitted'), '[]'::jsonb),
    'purge', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'display_name', p.display_name, 'status', p.kyc_status, 'doc_path', p.kyc_doc_path))
      from public.profiles p where p.kyc_status in ('verified', 'rejected') and p.kyc_doc_path is not null), '[]'::jsonb));
end $$;

-- Owner opens or closes document intake.
create or replace function private.owner_set_kyc_intake(p_on boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if p_on is null then return jsonb_build_object('ok', false, 'error', 'bad_value'); end if;
  insert into public.platform_settings(key, bool_value, updated_at)
  values ('kyc_intake_enabled', p_on, now())
  on conflict (key) do update set bool_value = excluded.bool_value, updated_at = now();
  raise log 'OMEGA_KYC intake=% by %', p_on, auth.uid();
  return jsonb_build_object('ok', true, 'intake_enabled', p_on);
end $$;

create or replace function public.submit_kyc(p_doc_path text, p_consent boolean)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.submit_kyc(p_doc_path, p_consent) $$;
create or replace function public.kyc_document_purged(p_member uuid)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.kyc_document_purged(p_member) $$;
create or replace function public.withdraw_kyc()
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.withdraw_kyc() $$;
create or replace function public.owner_set_kyc_intake(p_on boolean)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.owner_set_kyc_intake(p_on) $$;

revoke execute on function private.submit_kyc(text, boolean) from public, anon;
revoke execute on function private.review_kyc(uuid, text) from public, anon;
revoke execute on function private.kyc_document_purged(uuid) from public, anon;
revoke execute on function private.withdraw_kyc() from public, anon;
revoke execute on function private.kyc_queue() from public, anon;
revoke execute on function private.owner_set_kyc_intake(boolean) from public, anon;
revoke execute on function public.submit_kyc(text, boolean) from public, anon;
revoke execute on function public.kyc_document_purged(uuid) from public, anon;
revoke execute on function public.withdraw_kyc() from public, anon;
revoke execute on function public.owner_set_kyc_intake(boolean) from public, anon;
grant execute on function private.submit_kyc(text, boolean) to authenticated;
grant execute on function private.review_kyc(uuid, text) to authenticated;
grant execute on function private.kyc_document_purged(uuid) to authenticated;
grant execute on function private.withdraw_kyc() to authenticated;
grant execute on function private.kyc_queue() to authenticated;
grant execute on function private.owner_set_kyc_intake(boolean) to authenticated;
grant execute on function public.submit_kyc(text, boolean) to authenticated;
grant execute on function public.kyc_document_purged(uuid) to authenticated;
grant execute on function public.withdraw_kyc() to authenticated;
grant execute on function public.owner_set_kyc_intake(boolean) to authenticated;
