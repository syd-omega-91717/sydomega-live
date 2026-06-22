BEGIN;

-- Ensure all required columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_a NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_b NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_c NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS material_tier TEXT DEFAULT 'SAND';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;

-- Sync emails from auth
UPDATE profiles p SET email = u.email
FROM auth.users u WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- SET SLEIMAN AS OWNER WITH FULL ACCESS
UPDATE profiles SET
  is_owner = TRUE, access_approved = TRUE, is_trial = FALSE,
  trial_expires_at = NULL, is_rejected = FALSE,
  axis_a = 9.000, axis_b = 9.000, axis_c = 9.000,
  material_tier = 'OMEGA MASTER', membership_tier = 9,
  display_name = 'Major Sleiman Youssef Dagher'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')
);

-- APPROVE member for exactly 9.1717 minutes
CREATE OR REPLACE FUNCTION approve_member(p_uid UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_caller_owner BOOLEAN; v_exp TIMESTAMPTZ;
BEGIN
  SELECT is_owner INTO v_caller_owner FROM profiles WHERE id = auth.uid();
  IF NOT v_caller_owner THEN
    RAISE EXCEPTION 'Only the Architect can approve members';
  END IF;
  v_exp := NOW() + INTERVAL '9.1717 minutes';
  UPDATE profiles SET
    access_approved = TRUE, is_trial = TRUE,
    trial_expires_at = v_exp, is_rejected = FALSE
  WHERE id = p_uid;
  RETURN json_build_object('success', TRUE, 'expires_at', v_exp, 'minutes', 9.1717);
END;
$$;

-- REJECT member
CREATE OR REPLACE FUNCTION reject_member(p_uid UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_caller_owner BOOLEAN;
BEGIN
  SELECT is_owner INTO v_caller_owner FROM profiles WHERE id = auth.uid();
  IF NOT v_caller_owner THEN
    RAISE EXCEPTION 'Only the Architect can reject members';
  END IF;
  UPDATE profiles SET
    access_approved = FALSE, is_trial = FALSE,
    trial_expires_at = NULL, is_rejected = TRUE
  WHERE id = p_uid;
  RETURN json_build_object('success', TRUE, 'rejected', TRUE);
END;
$$;

-- REVOKE active session
CREATE OR REPLACE FUNCTION revoke_member(p_uid UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_caller_owner BOOLEAN;
BEGIN
  SELECT is_owner INTO v_caller_owner FROM profiles WHERE id = auth.uid();
  IF NOT v_caller_owner THEN
    RAISE EXCEPTION 'Only the Architect can revoke access';
  END IF;
  UPDATE profiles SET
    access_approved = FALSE, is_trial = FALSE,
    trial_expires_at = NULL
  WHERE id = p_uid;
  RETURN json_build_object('success', TRUE);
END;
$$;

-- GET ALL MEMBERS (owner only - security definer bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_members()
RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = TRUE) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, axis_a, axis_b, axis_c,
    access_approved, is_trial, is_rejected, material_tier, membership_tier, is_owner)
  VALUES (NEW.id, NEW.email, 0.001, 0.001, 0.001,
    FALSE, FALSE, FALSE, 'SAND', 1, FALSE)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Protect owner from any modifications
CREATE OR REPLACE FUNCTION protect_owner()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.axis_a := 9.000; NEW.axis_b := 9.000; NEW.axis_c := 9.000;
    NEW.material_tier := 'OMEGA MASTER'; NEW.membership_tier := 9;
    NEW.access_approved := TRUE; NEW.is_trial := FALSE;
    NEW.trial_expires_at := NULL; NEW.is_rejected := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_guard ON profiles;
CREATE TRIGGER owner_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "self_read" ON profiles;
DROP POLICY IF EXISTS "owner_all" ON profiles;
DROP POLICY IF EXISTS "self_update" ON profiles;
CREATE POLICY "self_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "self_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "owner_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = TRUE)
);

COMMIT;
