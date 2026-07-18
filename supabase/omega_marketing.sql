-- ============================================================================
-- SYD OMEGA 91717 -- MARKETING PLACEMENTS (marketing.html backend)
-- Members reserve ad/media placement. Every reservation is REVIEWED and
-- APPROVED by the Sovereign owner before it can go live -- nothing publishes
-- automatically. Matches marketing.html's insert exactly (media_reservations).
-- price_omega is a quoted reservation figure only; NO value moves (economy
-- dormant). Member sees own; owner reviews all.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.media_reservations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid(),
  zone        text,
  duration    text,
  title       text NOT NULL,
  message     text,
  price_omega numeric DEFAULT 0,
  file_path   text,
  status      text NOT NULL DEFAULT 'submitted',  -- submitted | reviewing | approved | rejected | live
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- self-heal older versions
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS price_omega numeric DEFAULT 0;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.media_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mr_insert ON public.media_reservations;
CREATE POLICY mr_insert ON public.media_reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS mr_select ON public.media_reservations;
CREATE POLICY mr_select ON public.media_reservations FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner reviews the queue / sets status (onlySovereign) ----------------------
CREATE OR REPLACE FUNCTION public.set_reservation_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('submitted','reviewing','approved','rejected','live') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.media_reservations SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_reservations()
RETURNS SETOF public.media_reservations LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.media_reservations
  WHERE public.is_platform_owner()
  ORDER BY (status='submitted') DESC, created_at DESC;
$$;

GRANT SELECT, INSERT ON public.media_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_reservation_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_reservations() TO authenticated;

COMMIT;
