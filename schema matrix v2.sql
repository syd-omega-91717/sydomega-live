-- SYD OMEGA 91717 -- MATRIX PROGRESSION v2.0
-- CRITICAL: Matrix starts at 0.001, NOT 1
-- Each task completion adds exactly 0.001
-- Apex: 9.000 per axis = 9000 completions per axis
-- Owner (is_owner=true) is LOCKED at 9.000 on all axes permanently
-- Authority formula: sqrt(A^2 + B^2 + C^2), apex = 15.588

-- 1. Fix axis columns to support 3-decimal precision
ALTER TABLE profiles
  ALTER COLUMN axis_a SET DEFAULT 0.001,
  ALTER COLUMN axis_b SET DEFAULT 0.001,
  ALTER COLUMN axis_c SET DEFAULT 0.001;

-- Ensure numeric precision (4 decimal places, max 9.000)
ALTER TABLE profiles
  ALTER COLUMN axis_a TYPE NUMERIC(6,3),
  ALTER COLUMN axis_b TYPE NUMERIC(6,3),
  ALTER COLUMN axis_c TYPE NUMERIC(6,3);

-- 2. Set existing members who have axis=1 to 0.001 (genesis reset)
-- EXCEPT the owner who stays at 9.000
UPDATE profiles
SET axis_a = 0.001, axis_b = 0.001, axis_c = 0.001
WHERE is_owner = false
  AND axis_a = 1 AND axis_b = 1 AND axis_c = 1;

-- 3. Lock owner at absolute apex (9.000)
UPDATE profiles
SET axis_a = 9.000, axis_b = 9.000, axis_c = 9.000
WHERE is_owner = true;

-- 4. Add material_tier computed column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS material_tier TEXT GENERATED ALWAYS AS (
    CASE
      WHEN is_owner = true THEN 'OMEGA MASTER'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 9.000 THEN 'OMEGA MASTER'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 8.000 THEN 'DIAMOND'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 7.000 THEN 'PLATINUM'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 6.000 THEN 'GOLD'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 5.000 THEN 'CARBON'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 4.000 THEN 'TITANIUM'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 3.000 THEN 'STEEL'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 2.000 THEN 'IRON'
      WHEN LEAST(axis_a, axis_b, axis_c) >= 1.000 THEN 'GLASS'
      ELSE 'SAND'
    END
  ) STORED;

-- 5. Task completion function: adds exactly +0.001 per axis
CREATE OR REPLACE FUNCTION complete_task(
  p_uid UUID,
  p_axis TEXT,   -- 'a', 'b', or 'c'
  p_kind TEXT    -- task category
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles;
  v_increment NUMERIC := 0.001;
  v_new_val NUMERIC;
  v_authority NUMERIC;
BEGIN
  -- Block owner from task completions (already at apex)
  SELECT * INTO v_profile FROM profiles WHERE id = p_uid LIMIT 1;
  IF v_profile.is_owner THEN
    RETURN json_build_object('success', true, 'owner', true, 'message', 'Owner is at apex');
  END IF;

  -- Apply increment to correct axis (cap at 9.000)
  IF p_axis = 'a' THEN
    UPDATE profiles SET axis_a = LEAST(9.000, COALESCE(axis_a, 0.001) + v_increment)
    WHERE id = p_uid RETURNING axis_a INTO v_new_val;
  ELSIF p_axis = 'b' THEN
    UPDATE profiles SET axis_b = LEAST(9.000, COALESCE(axis_b, 0.001) + v_increment)
    WHERE id = p_uid RETURNING axis_b INTO v_new_val;
  ELSIF p_axis = 'c' THEN
    UPDATE profiles SET axis_c = LEAST(9.000, COALESCE(axis_c, 0.001) + v_increment)
    WHERE id = p_uid RETURNING axis_c INTO v_new_val;
  END IF;

  -- Log the completion
  INSERT INTO task_completions (user_id, kind, axis, increment, completed_at)
  VALUES (p_uid, p_kind, p_axis, v_increment, NOW())
  ON CONFLICT DO NOTHING;

  -- Compute new authority
  SELECT SQRT(POWER(axis_a,2) + POWER(axis_b,2) + POWER(axis_c,2))
  INTO v_authority FROM profiles WHERE id = p_uid;

  RETURN json_build_object(
    'success', true,
    'axis', p_axis,
    'new_value', v_new_val,
    'authority', ROUND(v_authority, 3),
    'increment', v_increment
  );
END;
$$;

-- 6. Add axis column to task_completions for proper tracking
ALTER TABLE task_completions
  ADD COLUMN IF NOT EXISTS axis TEXT DEFAULT 'a',
  ADD COLUMN IF NOT EXISTS increment NUMERIC(6,4) DEFAULT 0.001;

-- 7. Owner protection trigger: prevent non-owner from exceeding limits
CREATE OR REPLACE FUNCTION protect_axis_ceiling()
RETURNS TRIGGER AS $$
BEGIN
  -- Non-owners: cap at 9.000
  IF NEW.is_owner = false THEN
    NEW.axis_a := LEAST(9.000, COALESCE(NEW.axis_a, 0.001));
    NEW.axis_b := LEAST(9.000, COALESCE(NEW.axis_b, 0.001));
    NEW.axis_c := LEAST(9.000, COALESCE(NEW.axis_c, 0.001));
    -- Floor at genesis
    NEW.axis_a := GREATEST(0.001, NEW.axis_a);
    NEW.axis_b := GREATEST(0.001, NEW.axis_b);
    NEW.axis_c := GREATEST(0.001, NEW.axis_c);
  END IF;
  -- Owner: always locked at 9.000
  IF NEW.is_owner = true THEN
    NEW.axis_a := 9.000;
    NEW.axis_b := 9.000;
    NEW.axis_c := 9.000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS axis_ceiling_guard ON profiles;
CREATE TRIGGER axis_ceiling_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_axis_ceiling();

-- 8. 12x12 gate matrix table
CREATE TABLE IF NOT EXISTS gate_matrix (
  id SERIAL PRIMARY KEY,
  pillar_num INTEGER NOT NULL CHECK (pillar_num BETWEEN 1 AND 12),
  sub_num INTEGER NOT NULL CHECK (sub_num BETWEEN 1 AND 12),
  gate_name TEXT NOT NULL,
  axis_requirement TEXT NOT NULL,
  threshold NUMERIC(6,3) NOT NULL,
  unlocks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate 12x12 gate matrix (sample: all 144 entries)
-- Each of 12 pillars has 12 sub-gates
DO $$
DECLARE
  p INT; s INT;
  pillars TEXT[] := ARRAY['COMMAND','IDENTITY','ASCEND','COSMOS','UNIVERSE','VAULT','ORDER','SERVICES','INTEL','GENESIS','HERITAGE','OMEGA'];
  threshold NUMERIC;
BEGIN
  FOR p IN 1..12 LOOP
    FOR s IN 1..12 LOOP
      threshold := ROUND(((p-1)*12 + s)::NUMERIC / 16, 3); -- 0.063 to 9.000
      INSERT INTO gate_matrix (pillar_num, sub_num, gate_name, axis_requirement, threshold, unlocks)
      VALUES (
        p, s,
        pillars[p] || ' GATE ' || s,
        CASE WHEN s <= 4 THEN 'a' WHEN s <= 8 THEN 'b' ELSE 'c' END,
        threshold,
        'Unlocks ' || pillars[p] || ' sub-module ' || s
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON TABLE gate_matrix IS '12x12 sovereign gate matrix. 144 gates. Each requires 0.001 incremental axis progress.';
COMMENT ON TABLE profiles IS 'Matrix v2: axis range 0.001-9.000. 3-decimal precision. +0.001 per task.';
