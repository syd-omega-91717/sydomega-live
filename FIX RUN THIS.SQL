BEGIN;
ALTER TABLE profiles DROP COLUMN IF EXISTS material_tier;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS material_tier TEXT DEFAULT 'SAND';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ALTER COLUMN axis_a TYPE NUMERIC(7,3) USING COALESCE(axis_a::NUMERIC, 0.001);
ALTER TABLE profiles ALTER COLUMN axis_b TYPE NUMERIC(7,3) USING COALESCE(axis_b::NUMERIC, 0.001);
ALTER TABLE profiles ALTER COLUMN axis_c TYPE NUMERIC(7,3) USING COALESCE(axis_c::NUMERIC, 0.001);
ALTER TABLE profiles ALTER COLUMN axis_a SET DEFAULT 0.001;
ALTER TABLE profiles ALTER COLUMN axis_b SET DEFAULT 0.001;
ALTER TABLE profiles ALTER COLUMN axis_c SET DEFAULT 0.001;
UPDATE profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');
UPDATE profiles SET
  is_owner = TRUE,
  axis_a = 9.000, axis_b = 9.000, axis_c = 9.000,
  access_approved = TRUE, material_tier = 'OMEGA MASTER',
  display_name = 'Major Sleiman Youssef Dagher'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
UPDATE profiles SET
  axis_a = GREATEST(0.001, COALESCE(axis_a, 0.001)),
  axis_b = GREATEST(0.001, COALESCE(axis_b, 0.001)),
  axis_c = GREATEST(0.001, COALESCE(axis_c, 0.001)),
  material_tier = CASE
    WHEN LEAST(axis_a,axis_b,axis_c) >= 8 THEN 'DIAMOND'
    WHEN LEAST(axis_a,axis_b,axis_c) >= 6 THEN 'GOLD'
    WHEN LEAST(axis_a,axis_b,axis_c) >= 3 THEN 'STEEL'
    WHEN LEAST(axis_a,axis_b,axis_c) >= 1 THEN 'GLASS'
    ELSE 'SAND' END
WHERE is_owner IS NOT TRUE;
CREATE TABLE IF NOT EXISTS task_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  axis TEXT DEFAULT 'a',
  increment NUMERIC(7,4) DEFAULT 0.001,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION protect_owner_apex() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.axis_a := 9.000; NEW.axis_b := 9.000; NEW.axis_c := 9.000;
    NEW.material_tier := 'OMEGA MASTER'; NEW.access_approved := TRUE;
  END IF;
  NEW.axis_a := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_a, 0.001)));
  NEW.axis_b := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_b, 0.001)));
  NEW.axis_c := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_c, 0.001)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS owner_apex_guard ON profiles;
CREATE TRIGGER owner_apex_guard BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_owner_apex();
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, axis_a, axis_b, axis_c, access_approved, material_tier)
  VALUES (NEW.id, NEW.email, 0.001, 0.001, 0.001, FALSE, 'SAND')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE OR REPLACE FUNCTION complete_task(p_uid UUID, p_axis TEXT, p_kind TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner BOOLEAN; v_new NUMERIC; v_auth NUMERIC;
BEGIN
  SELECT is_owner INTO v_owner FROM profiles WHERE id = p_uid;
  IF v_owner THEN RETURN json_build_object('success',TRUE,'owner',TRUE); END IF;
  IF p_axis='a' THEN
    UPDATE profiles SET axis_a=LEAST(9.000,COALESCE(axis_a,0.001)+0.001) WHERE id=p_uid RETURNING axis_a INTO v_new;
  ELSIF p_axis='b' THEN
    UPDATE profiles SET axis_b=LEAST(9.000,COALESCE(axis_b,0.001)+0.001) WHERE id=p_uid RETURNING axis_b INTO v_new;
  ELSE
    UPDATE profiles SET axis_c=LEAST(9.000,COALESCE(axis_c,0.001)+0.001) WHERE id=p_uid RETURNING axis_c INTO v_new;
  END IF;
  INSERT INTO task_completions(user_id,kind,axis,increment,completed_at) VALUES(p_uid,p_kind,p_axis,0.001,NOW());
  SELECT SQRT(POWER(axis_a,2)+POWER(axis_b,2)+POWER(axis_c,2)) INTO v_auth FROM profiles WHERE id=p_uid;
  RETURN json_build_object('success',TRUE,'axis',p_axis,'new_value',v_new,'authority',ROUND(v_auth,3));
END;
$$;
CREATE OR REPLACE FUNCTION get_all_members() RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
END;
$$;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own" ON profiles;
DROP POLICY IF EXISTS "owner_read_all" ON profiles;
DROP POLICY IF EXISTS "members_update_own" ON profiles;
DROP POLICY IF EXISTS "owner_write_all" ON profiles;
CREATE POLICY "members_read_own" ON profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "owner_read_all" ON profiles FOR SELECT USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
CREATE POLICY "members_update_own" ON profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "owner_write_all" ON profiles FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
COMMIT;
