-- KYC document intake that actually saves -- dormant behind kyc_intake_enabled.
-- Decision record: docs/decisions/kyc-intake/PLAN.md (+ CODEX_REVIEW.md).
--
-- profile.html wrote kyc_status/kyc_doc_path/kyc_submitted_at directly, and
-- members hold no UPDATE on those columns (correctly: a member who could write
-- kyc_status could mark themselves verified), so every submission failed with
-- 42501. These functions are the only write path:
--   submit_kyc(p_doc_path)       member: records a submission for auth.uid()
--   review_kyc(p_member, verdict) owner: verified | rejected, only from submitted
--   kyc_queue()                  owner: the submitted rows to review
-- Shape as 20260926223027: private SECURITY DEFINER body, public SECURITY
-- INVOKER wrapper, EXECUTE revoked from public/anon. Each returns
-- {ok:false,error:<code>} instead of raising, so the page can say why.
--
-- guard_profile_privileges() still runs for these updates (auth.uid() is set)
-- and does not list kyc_*; test_kyc_intake.py holds that it stays that way.
--
-- Applied live 2026-09-27 as 20260927110344. The first apply carried the path
-- pattern [^/]{1,280}, which Postgres rejects at call time (repetition counts
-- stop at 255: 2201B, found by the test below); private.submit_kyc was
-- replaced in place with {1,255}, which is what this file holds.
-- Verified live in one block ending in RAISE, so everything rolled back
-- (SET LOCAL ROLE authenticated + request.jwt.claims; flag switched on and two
-- storage.objects rows inserted inside the block only):
--   flag off -> intake_closed; direct UPDATE of kyc_status -> 42501;
--   other member's folder -> bad_path; missing object -> no_document;
--   nested path -> bad_path; own real object -> ok, submitted;
--   member review_kyc / kyc_queue -> forbidden; pending member -> not_approved;
--   owner queue -> 1 row; bad verdict -> bad_verdict; verified -> ok;
--   second verdict -> not_submitted; resubmit after verified -> already_verified;
--   anon EXECUTE on the six functions -> 0. After: flag false, kyc none=9,
--   uploads 0 objects; security advisor unchanged (leaked-password only).

insert into public.platform_settings(key, bool_value, updated_at)
values ('kyc_intake_enabled', false, now())
on conflict (key) do nothing;

create or replace function private.submit_kyc(p_doc_path text)
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
     set kyc_status = 'submitted', kyc_doc_path = p_doc_path, kyc_submitted_at = now()
   where id = uid;
  return jsonb_build_object('ok', true, 'status', 'submitted',
    'replaced', case when prof.kyc_doc_path is distinct from p_doc_path then prof.kyc_doc_path end);
end $$;

create or replace function private.review_kyc(p_member uuid, p_verdict text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare cur text;
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  if p_verdict not in ('verified', 'rejected') then return jsonb_build_object('ok', false, 'error', 'bad_verdict'); end if;
  select kyc_status into cur from public.profiles where id = p_member for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_profile'); end if;
  if cur is distinct from 'submitted' then return jsonb_build_object('ok', false, 'error', 'not_submitted'); end if;
  update public.profiles set kyc_status = p_verdict where id = p_member;
  raise log 'OMEGA_KYC verdict: actor=% target=% verdict=%', auth.uid(), p_member, p_verdict;
  return jsonb_build_object('ok', true, 'status', p_verdict);
end $$;

create or replace function private.kyc_queue()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok', false, 'error', 'forbidden'); end if;
  return jsonb_build_object('ok', true, 'intake_enabled', coalesce(private.get_platform_flag('kyc_intake_enabled'), false),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'display_name', p.display_name, 'submitted_at', p.kyc_submitted_at, 'doc_path', p.kyc_doc_path)
        order by p.kyc_submitted_at)
      from public.profiles p where p.kyc_status = 'submitted'), '[]'::jsonb));
end $$;

create or replace function public.submit_kyc(p_doc_path text)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.submit_kyc(p_doc_path) $$;
create or replace function public.review_kyc(p_member uuid, p_verdict text)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.review_kyc(p_member, p_verdict) $$;
create or replace function public.kyc_queue()
returns jsonb language sql stable security invoker set search_path = public, pg_temp
as $$ select private.kyc_queue() $$;

revoke execute on function private.submit_kyc(text) from public, anon;
revoke execute on function private.review_kyc(uuid, text) from public, anon;
revoke execute on function private.kyc_queue() from public, anon;
revoke execute on function public.submit_kyc(text) from public, anon;
revoke execute on function public.review_kyc(uuid, text) from public, anon;
revoke execute on function public.kyc_queue() from public, anon;
grant execute on function private.submit_kyc(text) to authenticated;
grant execute on function private.review_kyc(uuid, text) to authenticated;
grant execute on function private.kyc_queue() to authenticated;
grant execute on function public.submit_kyc(text) to authenticated;
grant execute on function public.review_kyc(uuid, text) to authenticated;
grant execute on function public.kyc_queue() to authenticated;
