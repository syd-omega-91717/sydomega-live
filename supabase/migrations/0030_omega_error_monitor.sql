-- ============================================================================
-- SYD OMEGA 91717 -- CLIENT ERROR MONITORING (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Runtime failures on the live site are currently invisible. A member hits a
-- broken page, nothing is recorded, and the only way anyone finds out is if
-- they happen to screenshot it. Every real bug this project has fixed was
-- discovered that way -- which does not scale past one member.
--
-- Static analysis cannot catch these: a page whose script is syntactically
-- perfect still throws at runtime when an element is missing, a fetch fails,
-- or data arrives in an unexpected shape.
--
-- This is deliberately NOT a third-party service (Sentry, LogRocket). Those
-- require an account, a key, and send your members' activity to another
-- company. This writes to your own database, under your own RLS.
--
-- PRIVACY
-- Stores the error message, source file/line, page path, and -- when the
-- reporter is signed in -- their user id, so a report can be tied to the
-- account that hit it. It does NOT store form contents, tokens, or page text.
-- Only the owner can read the table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_errors (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid,               -- NULL when the error happened signed-out
  page        text,               -- location.pathname
  message     text NOT NULL,
  source      text,               -- script url
  line_no     int,
  col_no      int,
  stack       text,               -- truncated client-side
  kind        text,               -- 'error' | 'unhandledrejection'
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_errors_time_idx ON public.client_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS client_errors_page_idx ON public.client_errors (page, created_at DESC);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- Owner-only read. No SELECT for ordinary members: this is operational data.
DROP POLICY IF EXISTS "owner reads client errors" ON public.client_errors;
CREATE POLICY "owner reads client errors" ON public.client_errors
  FOR SELECT TO authenticated USING (public.is_platform_owner());

-- No INSERT policy: rows are written only through the SECURITY DEFINER
-- function below, which sanitises and rate-limits.
REVOKE ALL ON public.client_errors FROM anon;
GRANT SELECT ON public.client_errors TO authenticated;

-- ---------------------------------------------------------------- report ---
-- Callable by anyone (signed in or not) so errors on the login and pending
-- pages are captured too. Hard limits prevent a broken loop from flooding the
-- table: max 20 rows per user (or per page when signed out) in any 10 minutes.
CREATE OR REPLACE FUNCTION public.report_client_error(
  p_page text, p_message text, p_source text DEFAULT NULL,
  p_line int DEFAULT NULL, p_col int DEFAULT NULL,
  p_stack text DEFAULT NULL, p_kind text DEFAULT 'error',
  p_ua text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_count int;
BEGIN
  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_message');
  END IF;

  SELECT count(*) INTO v_count
    FROM public.client_errors
   WHERE created_at > now() - interval '10 minutes'
     AND ((v_uid IS NOT NULL AND user_id = v_uid)
       OR (v_uid IS NULL AND user_id IS NULL AND page = left(p_page, 300)));

  IF v_count >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  INSERT INTO public.client_errors
    (user_id, page, message, source, line_no, col_no, stack, kind, user_agent)
  VALUES (v_uid,
          left(p_page, 300),
          left(p_message, 500),
          left(p_source, 300),
          p_line, p_col,
          left(p_stack, 2000),
          left(COALESCE(p_kind, 'error'), 40),
          left(p_ua, 300));

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_client_error(text,text,text,int,int,text,text,text)
  TO authenticated, anon;

-- ------------------------------------------------------------ owner view ---
-- Grouped summary: which pages are failing, how often, and most recently.
CREATE OR REPLACE FUNCTION public.error_summary(p_hours int DEFAULT 168)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT page,
           message,
           kind,
           count(*)                    AS hits,
           count(DISTINCT user_id)     AS affected_members,
           max(created_at)             AS last_seen,
           min(created_at)             AS first_seen
      FROM public.client_errors
     WHERE created_at > now() - make_interval(hours => GREATEST(1, LEAST(COALESCE(p_hours,168), 2160)))
     GROUP BY page, message, kind
     ORDER BY count(*) DESC, max(created_at) DESC
     LIMIT 100
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.error_summary(int) TO authenticated;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- ============================================================================
-- select public.report_client_error('/test.html','verification row');
-- select page, message, created_at from public.client_errors order by id desc limit 5;
-- select public.error_summary(24);
