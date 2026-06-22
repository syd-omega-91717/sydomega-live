BEGIN;

-- STEP 1: Ensure all required columns exist on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_a NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_b NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_c NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS material_tier TEXT DEFAULT 'SAND';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 2: Sync emails from auth.users into profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- STEP 3: Set is_owner = TRUE for the first registered account (YOU)
-- This sets the earliest created account as the Architect
UPDATE profiles SET
  is_owner = TRUE,
  axis_a = 9.000,
  axis_b = 9.000,
  axis_c = 9.000,
  access_approved = TRUE,
  material_tier = 'OMEGA MASTER',
  display_name = 'Major Sleiman Youssef Dagher'
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);

-- STEP 4: Ensure all other profiles have genesis axes
UPDATE profiles
SET axis_a = GREATEST(0.001, COALESCE(axis_a, 0.001)),
    axis_b = GREATEST(0.001, COALESCE(axis_b, 0.001)),
    axis_c = GREATEST(0.001, COALESCE(axis_c, 0.001)),
    access_approved = COALESCE(access_approved, FALSE)
WHERE is_owner IS NOT TRUE;

-- STEP 5: Owner protection trigger
CREATE OR REPLACE FUNCTION protect_owner_apex()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.axis_a := 9.000;
    NEW.axis_b := 9.000;
    NEW.axis_c := 9.000;
    NEW.material_tier := 'OMEGA MASTER';
    NEW.access_approved := TRUE;
  END IF;
  NEW.axis_a := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_a, 0.001)));
  NEW.axis_b := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_b, 0.001)));
  NEW.axis_c := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_c, 0.001)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_apex_guard ON profiles;
CREATE TRIGGER owner_apex_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_apex();

-- STEP 6: Auto-create profile on new auth signup + sync email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, axis_a, axis_b, axis_c, access_approved, material_tier)
  VALUES (NEW.id, NEW.email, 0.001, 0.001, 0.001, FALSE, 'SAND')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 7: task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  axis TEXT DEFAULT 'a',
  increment NUMERIC(7,4) DEFAULT 0.001,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 8: complete_task RPC
CREATE OR REPLACE FUNCTION complete_task(p_uid UUID, p_axis TEXT, p_kind TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner BOOLEAN; v_new NUMERIC; v_auth NUMERIC;
BEGIN
  SELECT is_owner INTO v_owner FROM profiles WHERE id = p_uid;
  IF v_owner THEN
    RETURN json_build_object('success', TRUE, 'owner', TRUE);
  END IF;
  IF p_axis = 'a' THEN
    UPDATE profiles SET axis_a = LEAST(9.000, COALESCE(axis_a,0.001)+0.001) WHERE id=p_uid RETURNING axis_a INTO v_new;
  ELSIF p_axis = 'b' THEN
    UPDATE profiles SET axis_b = LEAST(9.000, COALESCE(axis_b,0.001)+0.001) WHERE id=p_uid RETURNING axis_b INTO v_new;
  ELSE
    UPDATE profiles SET axis_c = LEAST(9.000, COALESCE(axis_c,0.001)+0.001) WHERE id=p_uid RETURNING axis_c INTO v_new;
  END IF;
  INSERT INTO task_completions(user_id, kind, axis, increment, completed_at)
    VALUES(p_uid, p_kind, p_axis, 0.001, NOW());
  SELECT SQRT(POWER(axis_a,2)+POWER(axis_b,2)+POWER(axis_c,2)) INTO v_auth FROM profiles WHERE id=p_uid;
  RETURN json_build_object('success',TRUE,'axis',p_axis,'new_value',v_new,'authority',ROUND(v_auth,3));
END;
$$;

-- STEP 9: Security definer function for owner to read ALL profiles
CREATE OR REPLACE FUNCTION get_all_members()
RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner BOOLEAN;
BEGIN
  SELECT is_owner INTO v_owner FROM profiles WHERE id = auth.uid();
  IF NOT v_owner THEN
    RAISE EXCEPTION 'Access denied. Owner only.';
  END IF;
  RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
END;
$$;

-- STEP 10: RLS - ensure owner can read/write everything
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_own" ON profiles;
DROP POLICY IF EXISTS "owner_read_all" ON profiles;
DROP POLICY IF EXISTS "owner_write_all" ON profiles;
DROP POLICY IF EXISTS "members_update_own" ON profiles;

CREATE POLICY "members_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "owner_read_all" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = TRUE)
);
CREATE POLICY "members_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "owner_write_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = TRUE)
);

-- STEP 11: task_completions RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_tasks" ON task_completions;
DROP POLICY IF EXISTS "owner_all_tasks" ON task_completions;
CREATE POLICY "user_own_tasks" ON task_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "owner_all_tasks" ON task_completions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = TRUE)
);

COMMIT;
