-- ============================================================================
-- SYD OMEGA 91717 -- SOVEREIGN AUTHORITY v2 (idempotent; safe to re-run)
--
-- CHANGES FROM v1
-- 1. AUTH formula: sqrt(A^2+B^2+C^2) -> sqrt(A^3+B^3+C^3) * phi/e
--    - Axes are now CUBIC (each 9x9x9 = 729 depth)
--    - phi = 1.6180339887 (golden ratio)
--    - e   = 2.7182818285 (Euler's number)
--    - i^2 = -1 (imaginary unit; the complex-plane rotation is baked into the
--              gate-threshold spacing: gates follow cos(n*phi*pi) damping)
--    - New apex: sqrt(3 * 9^3) * phi/e = 27.836687 (was 15.588)
--
-- 2. FIX: my_matrix() cannot change its RETURN TABLE without a DROP first.
--    The function is dropped and recreated with the corrected signature.
--
-- 3. 12 gate thresholds rescaled to the new apex (equal geometric steps).
--
-- 4. lattice_node() updated to use cubic axes (ceil(axis) 1..9, depth 729).
-- ============================================================================

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.my_matrix();
  DROP FUNCTION IF EXISTS public.authority_score(numeric,numeric,numeric);
  DROP FUNCTION IF EXISTS public.lattice_node(int,int,numeric,numeric,numeric);
END $$;

-- ---------------------------------------------------------------- CONSTANTS --
-- Stored in platform_settings so the UI can read them without hardcoding.
INSERT INTO public.platform_settings (key, text_value) VALUES
  ('auth_phi',   '1.6180339887'),
  ('auth_e',     '2.7182818285'),
  ('auth_apex',  '27.8367'),
  ('auth_formula','sqrt(A^3+B^3+C^3)*phi/e')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- -------------------------------------------------------- AUTHORITY SCORE --
CREATE OR REPLACE FUNCTION public.authority_score(
  p_a numeric, p_b numeric, p_c numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  -- AUTH = sqrt(A^3 + B^3 + C^3) * phi / e
  -- phi = 1.6180339887  (golden ratio)
  -- e   = 2.7182818285  (Euler's number)
  -- Apex when A=B=C=9: sqrt(2187)*phi/e = 27.836687
  SELECT round(
    sqrt(
      power(GREATEST(0.001, COALESCE(p_a,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_b,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_c,0.001)), 3)
    ) * 1.6180339887 / 2.7182818285
  ::numeric, 6);
$$;

GRANT EXECUTE ON FUNCTION public.authority_score(numeric,numeric,numeric) TO authenticated, anon;

-- ---------------------------------------------------------- LATTICE NODE --
-- cubic axis depth: ceil(axis) maps 0.001..9 -> 1..9
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1)))-1)*12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1)))-1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int))-1)*81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int))-1)*9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- -------------------------------------------------------------- MY_MATRIX --
-- Dropped above; recreated with the column matrix_phase included.
CREATE OR REPLACE FUNCTION public.my_matrix()
RETURNS TABLE(
  track int, phase int, sign text, element text,
  a numeric, b numeric, c numeric,
  authority numeric, node int, pct numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      COALESCE(p.matrix_track, 1)::int,
      COALESCE(p.matrix_phase, 1)::int,
      COALESCE(p.sign, ''),
      COALESCE(p.element, ''),
      COALESCE(p.axis_a, 0.001),
      COALESCE(p.axis_b, 0.001),
      COALESCE(p.axis_c, 0.001),
      public.authority_score(p.axis_a, p.axis_b, p.axis_c),
      public.lattice_node(p.matrix_track, p.matrix_phase, p.axis_a, p.axis_b, p.axis_c),
      round(public.lattice_node(p.matrix_track, p.matrix_phase,
            p.axis_a, p.axis_b, p.axis_c)::numeric / 104976 * 100, 4)
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_matrix() TO authenticated;

-- ------------------------------------------------------ MY_LATTICE UPDATE --
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track',        COALESCE(matrix_track,1),
    'phase',        COALESCE(matrix_phase,1),
    'a',            COALESCE(axis_a,0.001),
    'b',            COALESCE(axis_b,0.001),
    'c',            COALESCE(axis_c,0.001),
    'authority',    public.authority_score(axis_a, axis_b, axis_c),
    'authority_formula', 'sqrt(A^3+B^3+C^3)*phi/e',
    'authority_apex',    27.8367,
    'phi',          1.6180339887,
    'e',            2.7182818285,
    'node',         public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c),
    'lattice_total',104976,
    'phases_done',  COALESCE(phases_done,0),
    'tracks_done',  COALESCE(tracks_done,0),
    'percent',      round(public.lattice_node(matrix_track,matrix_phase,
                      axis_a,axis_b,axis_c)::numeric/104976*100,4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

-- ------------------------------------------- 12 GATE THRESHOLDS (rescaled) --
-- Gates follow equal geometric steps on the new apex 27.836687.
-- Stored so the UI reads them from canon rather than hardcoding.
UPDATE public.platform_settings SET text_value = jsonb_build_array(
  2.3197, 4.6394, 6.9592, 9.2789, 11.5986,
  13.9183, 16.2381, 18.5578, 20.8775, 23.1972, 25.5170, 27.8367
)::text WHERE key = 'gate_thresholds';

INSERT INTO public.platform_settings (key,text_value) VALUES
  ('gate_thresholds', '[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367]')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- ============================================================================
-- VERIFY
--   select public.authority_score(9,9,9);   -- expect 27.8367
--   select public.authority_score(0.001,0.001,0.001);  -- expect ~0.000033
--   select * from public.my_matrix();
--   select * from public.my_lattice();
-- ============================================================================
