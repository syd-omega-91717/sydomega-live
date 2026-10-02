-- Account deletion and erasure never strand an identity document.
-- Neither function touched Storage: delete_account() removed the profile row
-- (and with it the only record of kyc_doc_path), so a pending or not-yet-
-- purged document stayed in `uploads` with nothing pointing at it -- invisible
-- to kyc_queue() and to the member. SQL cannot delete a Storage object
-- (storage.protect_delete), so both now refuse while the object exists and
-- hand back its path; the client deletes it through the Storage API (members
-- hold DELETE on their own folder) and calls again. Everything else in both
-- bodies is unchanged from live.

create or replace function private.delete_account()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
DECLARE uid uuid := auth.uid(); doc text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=uid),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  SELECT kyc_doc_path INTO doc FROM public.profiles WHERE id = uid;
  IF doc IS NOT NULL AND EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'uploads' AND o.name = doc) THEN
    RETURN jsonb_build_object('ok',false,'error','identity_document_stored','doc_path',doc);
  END IF;
  -- wipe the member's data across the platform
  DELETE FROM public.task_completions WHERE user_id = uid;
  DELETE FROM public.evolution_events WHERE user_id = uid;
  DELETE FROM public.trophies         WHERE user_id = uid;
  DELETE FROM public.medals           WHERE user_id = uid;
  DELETE FROM public.certificates     WHERE user_id = uid;
  DELETE FROM public.platform_owners  WHERE user_id = uid;
  DELETE FROM public.profiles         WHERE id = uid;
  -- attempt to remove the auth identity too (needs elevated rights; if the
  -- function owner lacks them, the data is already wiped and we flag for purge)
  BEGIN
    DELETE FROM auth.users WHERE id = uid;
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',true);
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',false,'note','data wiped; auth row purge pending');
  END;
END;
$$;

create or replace function private.request_account_erasure()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
DECLARE
  _uid uuid := auth.uid();
  _pr  record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT is_owner, kyc_doc_path INTO _pr FROM public.profiles WHERE id=_uid;
  IF _pr.is_owner THEN RETURN jsonb_build_object('ok',false,'error','owner_cannot_erase_self'); END IF;
  IF _pr.kyc_doc_path IS NOT NULL AND EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'uploads' AND o.name = _pr.kyc_doc_path) THEN
    RETURN jsonb_build_object('ok',false,'error','identity_document_stored','doc_path',_pr.kyc_doc_path);
  END IF;
  /* Soft delete first — mark for erasure */
  UPDATE public.profiles SET
    access_approved = false,
    is_trial        = false,
    display_name    = 'DELETED_USER_'||substr(_uid::text,1,8),
    bio             = NULL,
    avatar_url      = NULL,
    kyc_status      = CASE WHEN kyc_status = 'submitted' THEN 'none' ELSE kyc_status END,
    kyc_doc_purged_at = CASE WHEN kyc_doc_path IS NOT NULL THEN now() ELSE kyc_doc_purged_at END,
    kyc_doc_path    = NULL,
    erasure_requested_at = now()
  WHERE id=_uid;
  /* Log the erasure request */
  INSERT INTO public.sovereign_events(user_id,event_type,event_data,occurred_at)
  VALUES(_uid,'privacy.erasure_requested',jsonb_build_object('uid',_uid,'requested_at',now()),now());
  /* Revoke all consents */
  UPDATE public.consent_records SET revoked_at=now() WHERE user_id=_uid AND revoked_at IS NULL;
  /* Sign out */
  RETURN jsonb_build_object(
    'ok',true,
    'message','Erasure request received. Your data will be permanently deleted within 30 days per GDPR Article 17.',
    'uid',_uid
  );
END;
$$;
