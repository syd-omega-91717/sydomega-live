-- ============================================================================
-- SYD OMEGA 91717 -- NESTED MATRIX (12 x 9x9x9 = 8,748 nodes)
-- The deeper structure: each of the 12 tracks is a FULL 9x9x9 (729) matrix.
-- A member holds a position (a,b,c) in EACH of the 12 tracks. The profile's
-- axis_a/b/c remain the aggregate spine; this adds the per-track depth.
--   12 tracks  x  729 nodes  =  8,748 total nodes.
-- Node index within a track = (a-1)*81 + (b-1)*9 + (c-1) + 1  (1..729).
-- Non-recursive RLS. Validated.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.matrix_tracks (
  track int PRIMARY KEY CHECK (track BETWEEN 1 AND 12),
  sign  text NOT NULL, element text
);
INSERT INTO public.matrix_tracks(track,sign,element) VALUES
 (1,'Aries','Fire'),(2,'Taurus','Metal'),(3,'Gemini','Wind'),(4,'Cancer','Water'),
 (5,'Leo','Fire'),(6,'Virgo','Sand'),(7,'Libra','Wind'),(8,'Scorpio','Water'),
 (9,'Sagittarius','Fire'),(10,'Capricorn','Metal'),(11,'Aquarius','Wind'),(12,'Pisces','Water')
 ON CONFLICT (track) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.matrix_progress (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  track   int  NOT NULL REFERENCES public.matrix_tracks(track),
  a int NOT NULL DEFAULT 1 CHECK (a BETWEEN 1 AND 9),
  b int NOT NULL DEFAULT 1 CHECK (b BETWEEN 1 AND 9),
  c int NOT NULL DEFAULT 1 CHECK (c BETWEEN 1 AND 9),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track)
);
ALTER TABLE public.matrix_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrix_tracks   ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_rw ON public.matrix_progress;
CREATE POLICY mp_rw ON public.matrix_progress USING (auth.uid()=user_id OR public.is_platform_owner()) WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS mt_read ON public.matrix_tracks;
CREATE POLICY mt_read ON public.matrix_tracks FOR SELECT USING (true);

-- node index (1..729) within a track
CREATE OR REPLACE FUNCTION public.matrix_node(a int,b int,c int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT (a-1)*81 + (b-1)*9 + (c-1) + 1 $$;

-- read my full nested matrix: 12 tracks, each with (a,b,c), node, % of 729
CREATE OR REPLACE FUNCTION public.my_matrix()
RETURNS TABLE(track int, sign text, element text, a int, b int, c int, node int, pct numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.matrix_progress(user_id,track)
    SELECT auth.uid(), t.track FROM public.matrix_tracks t
    ON CONFLICT (user_id,track) DO NOTHING;
  RETURN QUERY
    SELECT t.track,t.sign,t.element,p.a,p.b,p.c,
           public.matrix_node(p.a,p.b,p.c),
           round(public.matrix_node(p.a,p.b,p.c)/729.0*100,1)
    FROM public.matrix_tracks t
    JOIN public.matrix_progress p ON p.track=t.track AND p.user_id=auth.uid()
    ORDER BY t.track;
END;
$$;

-- advance one axis within one track (an evolution event on that lens)
CREATE OR REPLACE FUNCTION public.advance_matrix(p_track int, p_axis text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.matrix_progress;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  INSERT INTO public.matrix_progress(user_id,track) VALUES (auth.uid(),p_track)
    ON CONFLICT (user_id,track) DO NOTHING;
  UPDATE public.matrix_progress SET
     a = CASE WHEN lower(p_axis)='a' THEN least(9,a+1) ELSE a END,
     b = CASE WHEN lower(p_axis)='b' THEN least(9,b+1) ELSE b END,
     c = CASE WHEN lower(p_axis)='c' THEN least(9,c+1) ELSE c END,
     updated_at = now()
   WHERE user_id=auth.uid() AND track=p_track RETURNING * INTO r;
  RETURN jsonb_build_object('ok',true,'track',p_track,'a',r.a,'b',r.b,'c',r.c,'node',public.matrix_node(r.a,r.b,r.c));
END;
$$;

GRANT SELECT ON public.matrix_tracks, public.matrix_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_matrix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_matrix(int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.matrix_node(int,int,int) TO authenticated, anon;

COMMIT;

-- proof of scale
SELECT (SELECT count(*) FROM public.matrix_tracks) AS tracks,
       729 AS nodes_per_track,
       (SELECT count(*) FROM public.matrix_tracks)*729 AS total_nodes;
