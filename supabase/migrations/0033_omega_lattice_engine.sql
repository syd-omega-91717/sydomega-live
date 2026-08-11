-- ============================================================================
-- SYD OMEGA 91717 -- LATTICE ENGINE (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Canon declares a lattice of 12 tracks x 12 phases x 9 x 9 x 9 = 104,976
-- nodes. The engine stored three numbers -- axis_a, axis_b, axis_c -- each
-- capped at 9. That expresses 729 positions: ONE cube. 0.69% of the declared
-- lattice. Track and phase existed in canon, in omega-canon.json, and all over
-- the interface, but not in the engine, so no member could ever occupy a node
-- outside the first cube. The spine was decorative.
--
-- WHAT THIS ADDS
--   matrix_track  1-12  which sign-track the member walks (from their sign)
--   matrix_phase  1-12  which phase within that track
--   node_index    1-104,976  absolute position in the lattice
--
-- HOW A MEMBER MOVES
-- Filling the 9x9x9 cube (all three axes reaching 9) completes a PHASE. The
-- phase advances and the axes reset to the canonical 0.001 start, so the next
-- cube begins. Completing phase 12 completes the TRACK. Twelve tracks is the
-- whole lattice.
--
-- WHY THE AXES RESET
-- They are coordinates INSIDE the current cube, not a lifetime score. Lifetime
-- work is preserved in task_completions, evolution_events, certificates,
-- trophies and medals -- none of which are touched here. Authority is still
-- sqrt(a^2+b^2+c^2) within the cube; total progress is node_index.
--
-- BASELINE CORRECTION
-- complete_task set missing axes to 1. omega_zero_start.sql sets the column
-- default to 0.001 and every page now falls back to 0.001. The engine was the
-- last place still claiming 1; corrected here.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS matrix_track int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS matrix_phase int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS node_index   int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phases_done  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tracks_done  int  DEFAULT 0;

-- Track is deterministic from the member's sign (canon: one track per sign).
CREATE OR REPLACE FUNCTION public.track_for_sign(p_sign text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    CASE lower(coalesce(p_sign,''))
      WHEN 'aries' THEN 1  WHEN 'taurus' THEN 2  WHEN 'gemini' THEN 3
      WHEN 'cancer' THEN 4 WHEN 'leo' THEN 5     WHEN 'virgo' THEN 6
      WHEN 'libra' THEN 7  WHEN 'scorpio' THEN 8 WHEN 'sagittarius' THEN 9
      WHEN 'capricorn' THEN 10 WHEN 'aquarius' THEN 11 WHEN 'pisces' THEN 12
    END, 1);
$$;

-- Absolute position in the 104,976-node lattice.
--   node = ((track-1)*12 + (phase-1)) * 729
--        + (ca-1)*81 + (cb-1)*9 + cc      where ca/cb/cc are ceil(axis) in 1..9
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1))) - 1) * 12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1))) - 1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int)) - 1) * 81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int)) - 1) * 9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.track_for_sign(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- Backfill existing members onto the lattice.
UPDATE public.profiles
   SET matrix_track = public.track_for_sign(sign),
       matrix_phase = COALESCE(matrix_phase, 1)
 WHERE matrix_track IS NULL OR matrix_track = 1;

UPDATE public.profiles
   SET node_index = public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c);

-- ---------------------------------------------------------------------------
-- The engine. Same signature and same return contract as before, so every
-- existing caller keeps working; the body now advances the full lattice.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax  text := lower(coalesce(p_axis,'a'));
  w   numeric := coalesce(p_weight, 0.25);
  a numeric; b numeric; c numeric;
  tr int; ph int;
  old_v numeric; new_v numeric;
  crossed boolean := false;
  phase_done boolean := false;
  track_done boolean := false;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric; node int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'error', 'not authenticated');
  END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;

  -- canonical start is 0.001, not 1 (omega_zero_start.sql)
  UPDATE public.profiles
     SET axis_a = COALESCE(axis_a, 0.001),
         axis_b = COALESCE(axis_b, 0.001),
         axis_c = COALESCE(axis_c, 0.001),
         matrix_track = COALESCE(matrix_track, public.track_for_sign(sign)),
         matrix_phase = COALESCE(matrix_phase, 1)
   WHERE id = uid;

  -- already banked -> report position, change nothing
  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id = uid AND task = p_task) THEN
    SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
      FROM public.profiles WHERE id = uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
    RETURN jsonb_build_object('applied', false, 'axis', ax,
      'value', CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,
      'track',tr,'phase',ph,
      'node', public.lattice_node(tr,ph,a,b,c),
      'lattice_total', 104976, 'unlocked', unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id, task, kind) VALUES (uid, p_task, p_kind);

  SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
    FROM public.profiles WHERE id = uid;

  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  crossed := floor(new_v) > floor(old_v);
  IF ax='a' THEN a := new_v; ELSIF ax='b' THEN b := new_v; ELSE c := new_v; END IF;

  -- credential on an integer crossing (unchanged behaviour)
  IF crossed THEN
    IF ax='a' THEN
      INSERT INTO public.certificates (user_id,title,milestone)
        VALUES (uid, COALESCE(p_title,'Knowledge Node'), 'Knowledge '||floor(new_v)::text);
      unlocked := unlocked || jsonb_build_object('type','certificate','at',floor(new_v));
    ELSIF ax='b' THEN
      INSERT INTO public.trophies (user_id,trophy_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','trophy','at',floor(new_v));
    ELSE
      INSERT INTO public.trophies (user_id,medal_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','medal','at',floor(new_v));
    END IF;
  END IF;

  -- CUBE COMPLETE -> advance the phase, reset the coordinates, begin the next cube
  -- CUBE COMPLETE -> advance. The apex (track 12, phase 12, cube full) is
  -- TERMINAL: without this the member wrapped back to phase 1 forever and
  -- node_index went DOWN -- progress appearing to reverse at the summit.
  IF a >= 9 AND b >= 9 AND c >= 9 THEN
    IF tr >= 12 AND ph >= 12 THEN
      -- apex reached: hold position, award once, never wrap
      a := 9; b := 9; c := 9;
      IF NOT EXISTS (SELECT 1 FROM public.task_completions
                      WHERE user_id = uid AND task = '__lattice_apex__') THEN
        INSERT INTO public.task_completions (user_id, task, kind)
          VALUES (uid, '__lattice_apex__', 'lattice');
        unlocked := unlocked || jsonb_build_object('type','apex','at',104976);
      END IF;
    ELSE
      phase_done := true;
      IF ph >= 12 THEN
        track_done := true;
        ph := 1;
        tr := tr + 1;
        UPDATE public.profiles SET tracks_done = COALESCE(tracks_done,0) + 1 WHERE id = uid;
        unlocked := unlocked || jsonb_build_object('type','track','at',tr);
      ELSE
        ph := ph + 1;
        unlocked := unlocked || jsonb_build_object('type','phase','at',ph);
      END IF;
      UPDATE public.profiles SET phases_done = COALESCE(phases_done,0) + 1 WHERE id = uid;
      a := 0.001; b := 0.001; c := 0.001;
    END IF;
  END IF;

  auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
  node := public.lattice_node(tr, ph, a, b, c);

  INSERT INTO public.evolution_events (user_id, axis, note)
    VALUES (uid, ax, COALESCE(p_title, p_kind||' / '||p_task));

  UPDATE public.profiles
     SET axis_a=a, axis_b=b, axis_c=c,
         matrix_track=tr, matrix_phase=ph, node_index=node
   WHERE id = uid;

  RETURN jsonb_build_object('applied', true, 'axis', ax, 'value', new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,
    'track',tr,'phase',ph,'node',node,'lattice_total',104976,
    'phase_completed',phase_done,'track_completed',track_done,
    'unlocked', unlocked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;

-- Member's own lattice standing.
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track', COALESCE(matrix_track,1), 'phase', COALESCE(matrix_phase,1),
    'a', COALESCE(axis_a,0.001), 'b', COALESCE(axis_b,0.001), 'c', COALESCE(axis_c,0.001),
    'authority', round(sqrt(COALESCE(axis_a,0.001)^2 + COALESCE(axis_b,0.001)^2 + COALESCE(axis_c,0.001)^2)::numeric,3),
    'node', public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c),
    'lattice_total', 104976,
    'phases_done', COALESCE(phases_done,0), 'tracks_done', COALESCE(tracks_done,0),
    'percent', round((public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c)::numeric / 104976) * 100, 4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

CREATE INDEX IF NOT EXISTS profiles_lattice_idx ON public.profiles (matrix_track, matrix_phase, node_index);

-- ============================================================================
-- VERIFY
--   select public.lattice_node(1,1,0.001,0.001,0.001);   -- expect 1
--   select public.lattice_node(12,12,9,9,9);             -- expect 104976
--   select public.my_lattice();
-- ============================================================================
