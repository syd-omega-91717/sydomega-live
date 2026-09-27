-- Official dispatches: owner-only feed, working owner RPCs.
--
-- Measured live 2026-09-26 (rolled-back probe):
--   * published_dispatches() returned every is_published row. Member wire
--     posts default is_published=true, so a member's post appeared in the
--     official "SOVEREIGN DISPATCHES" feed (1 of 1 probe rows).
--   * post_dispatch() failed for the owner with 22P02: dispatches.id is a
--     bigint identity, read INTO a uuid variable. approvals.html could never
--     publish an official dispatch.
--   * set_dispatch_published(uuid, boolean) compared a bigint id to a uuid.
--
-- Official rows are the ones post_dispatch() writes: no author (user_id IS
-- NULL). A member cannot write one: dispatches_self_insert requires
-- user_id = auth.uid() or the owner. Member posts stay on the wire, whose
-- visibility is unchanged (dispatches_select).

CREATE OR REPLACE FUNCTION private.published_dispatches(p_limit integer DEFAULT 30)
 RETURNS SETOF public.dispatches
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT * FROM public.dispatches
   WHERE is_published = true AND user_id IS NULL
   ORDER BY created_at DESC
   LIMIT LEAST(GREATEST(p_limit,1),100);
$function$;

CREATE OR REPLACE FUNCTION private.post_dispatch(p_title text, p_body text DEFAULT NULL::text, p_category text DEFAULT 'DISPATCH'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE new_id bigint;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_title IS NULL OR length(trim(p_title))=0 THEN RETURN jsonb_build_object('ok',false,'error','empty_title'); END IF;
  INSERT INTO public.dispatches(title,body,category,is_published)
    VALUES (left(p_title,200), left(coalesce(p_body,''),8000),
            left(coalesce(nullif(p_category,''),'DISPATCH'),40), true)
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$function$;

DROP FUNCTION IF EXISTS public.set_dispatch_published(uuid, boolean);
DROP FUNCTION IF EXISTS private.set_dispatch_published(uuid, boolean);

CREATE FUNCTION private.set_dispatch_published(p_id bigint, p_pub boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE n int;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  UPDATE public.dispatches SET is_published = COALESCE(p_pub,true) WHERE id = p_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  RETURN jsonb_build_object('ok',true,'id',p_id,'published',COALESCE(p_pub,true));
END;
$function$;

CREATE FUNCTION public.set_dispatch_published(p_id bigint, p_pub boolean)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path = 'public', 'pg_temp'
AS $function$ SELECT private.set_dispatch_published($1, $2) $function$;

REVOKE EXECUTE ON FUNCTION private.set_dispatch_published(bigint, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_dispatch_published(bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.set_dispatch_published(bigint, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_dispatch_published(bigint, boolean) TO authenticated;
