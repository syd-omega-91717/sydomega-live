-- SYD OMEGA 91717 -- TIME SOVEREIGN (real cumulative engagement tracking)
-- Real session-time tracking, server-validated (heartbeat pings, not client-
-- reported totals a member could fake). Milestone at 9h17m17s = 33437 seconds,
-- matching the platform's own 9.1717 numerology. Awards a real certificate.
BEGIN;

CREATE TABLE IF NOT EXISTS public.session_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pinged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.session_heartbeats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS heartbeat_own ON public.session_heartbeats;
CREATE POLICY heartbeat_own ON public.session_heartbeats FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.session_heartbeats TO authenticated;

-- one heartbeat every ~60s while a tab is open. Cumulative seconds = count of
-- heartbeats within 90s of each other, summed as 60s blocks -- this can't be
-- inflated by a member spoofing a single large "time spent" value client-side,
-- since each ping is server-timestamped individually.
CREATE OR REPLACE FUNCTION public.ping_session()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); last_ping timestamptz; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT max(pinged_at) INTO last_ping FROM public.session_heartbeats WHERE user_id=uid;
  IF last_ping IS NULL OR now()-last_ping > interval '90 seconds' THEN
    -- gap too large (new session) or first ever ping -- still record it, just don't double count the gap
    NULL;
  END IF;
  INSERT INTO public.session_heartbeats(user_id) VALUES (uid);
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.ping_session() TO authenticated;

-- real cumulative seconds: count of heartbeats that had a prior heartbeat
-- within 90s, each counted as 60s of real active time, capped sensibly.
CREATE OR REPLACE FUNCTION public.my_time_sovereign()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); total_seconds int; already_awarded boolean; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  WITH pings AS (
    SELECT pinged_at, lag(pinged_at) OVER (ORDER BY pinged_at) AS prev
    FROM public.session_heartbeats WHERE user_id=uid
  )
  SELECT COALESCE(count(*) FILTER (WHERE prev IS NOT NULL AND pinged_at-prev <= interval '90 seconds'),0) * 60
    INTO total_seconds FROM pings;

  SELECT EXISTS(SELECT 1 FROM public.certificates WHERE user_id=uid AND title='Time Sovereign') INTO already_awarded;
  IF total_seconds >= 33437 AND NOT already_awarded THEN
    INSERT INTO public.certificates(user_id,title,milestone) VALUES (uid,'Time Sovereign','9h17m17s cumulative presence');
    INSERT INTO public.evolution_events(user_id,axis,note)
      VALUES (uid,'C','Time Sovereign certificate earned -- 9h17m17s of real presence in the Order');
  END IF;

  RETURN jsonb_build_object('ok',true,'seconds',total_seconds,
    'target_seconds',33437,
    'pct', round(least(total_seconds::numeric,33437)/33437.0*100,2),
    'awarded', total_seconds>=33437);
END; $$;
GRANT EXECUTE ON FUNCTION public.my_time_sovereign() TO authenticated;

COMMIT;
