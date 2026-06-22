BEGIN;

-- ================================================================
-- STEP 1: DESTROY THE GENERATED COLUMN (root cause of 42P17)
-- ================================================================
ALTER TABLE profiles DROP COLUMN IF EXISTS material_tier;

-- ================================================================
-- STEP 2: RE-ADD AS REGULAR COLUMN (never generated again)
-- ================================================================
ALTER TABLE profiles ADD COLUMN material_tier TEXT DEFAULT 'SAND';

-- ================================================================
-- STEP 3: ADD ALL MISSING COLUMNS USED BY COSMOLOGY PAGE
-- ================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS planet TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS olympian TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_num TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_reg_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_a NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_b NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_c NUMERIC(7,3) DEFAULT 0.001;

-- ================================================================
-- STEP 4: SET MAJOR SLEIMAN AT ABSOLUTE APEX -- ALL 9.000
-- ================================================================
UPDATE profiles SET
  is_owner        = TRUE,
  access_approved = TRUE,
  is_trial        = FALSE,
  trial_expires_at = NULL,
  axis_a          = 9.000,
  axis_b          = 9.000,
  axis_c          = 9.000,
  material_tier   = 'OMEGA MASTER',
  membership_tier = 9,
  display_name    = 'Major Sleiman Youssef Dagher',
  sign            = 'Virgo',
  zodiac_sign     = 'Virgo',
  element         = 'Sand',
  planet          = 'Mercury',
  olympian        = 'Demeter',
  agent           = 'Sovereign',
  token           = 'ARENITE',
  date_of_birth   = '1982-04-19',
  father_name     = 'Youssef',
  mother_name     = 'Ilham Nader',
  birth_place     = 'Tripoli, Lebanon',
  blood_type      = 'B+',
  order_num       = '30875',
  specialty       = 'Architecture',
  order_reg_date  = '2007-04-10',
  nationality     = 'Lebanese',
  kyc_status      = 'verified'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('s.y.dagher@gmail.com','slmndghr@gmail.com')
);

-- ================================================================
-- STEP 5: CORRECT ALL OTHER MEMBER AXES (genesis 0.001)
-- ================================================================
UPDATE profiles
SET material_tier = CASE
    WHEN is_owner = TRUE THEN 'OMEGA MASTER'
    WHEN LEAST(COALESCE(axis_a,0.001), COALESCE(axis_b,0.001), COALESCE(axis_c,0.001)) >= 8 THEN 'DIAMOND'
    WHEN LEAST(COALESCE(axis_a,0.001), COALESCE(axis_b,0.001), COALESCE(axis_c,0.001)) >= 6 THEN 'GOLD'
    WHEN LEAST(COALESCE(axis_a,0.001), COALESCE(axis_b,0.001), COALESCE(axis_c,0.001)) >= 3 THEN 'STEEL'
    WHEN LEAST(COALESCE(axis_a,0.001), COALESCE(axis_b,0.001), COALESCE(axis_c,0.001)) >= 1 THEN 'GLASS'
    ELSE 'SAND'
  END
WHERE is_owner IS NOT TRUE;

-- ================================================================
-- STEP 6: PROTECT OWNER -- TRIGGER THAT NEVER ALLOWS APEX REVERSAL
-- ================================================================
CREATE OR REPLACE FUNCTION protect_owner_lifetime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.access_approved  := TRUE;
    NEW.is_trial         := FALSE;
    NEW.trial_expires_at := NULL;
    NEW.axis_a           := 9.000;
    NEW.axis_b           := 9.000;
    NEW.axis_c           := 9.000;
    NEW.material_tier    := 'OMEGA MASTER';
    NEW.membership_tier  := 9;
  ELSE
    NEW.axis_a := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_a, 0.001)));
    NEW.axis_b := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_b, 0.001)));
    NEW.axis_c := GREATEST(0.001, LEAST(9.000, COALESCE(NEW.axis_c, 0.001)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_apex_guard ON profiles;
DROP TRIGGER IF EXISTS owner_lifetime_guard ON profiles;

CREATE TRIGGER owner_lifetime_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_lifetime();

-- ================================================================
-- STEP 7: NEW USER PROFILE AUTO-CREATION
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles
    (id, email, axis_a, axis_b, axis_c, access_approved, is_trial, material_tier, membership_tier, is_owner)
  VALUES
    (NEW.id, NEW.email, 0.001, 0.001, 0.001, FALSE, FALSE, 'SAND', 1, FALSE)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- STEP 8: ACHIEVEMENT TABLES (12 trophies + 12 medals + 12 certs + 12 phases)
-- ================================================================
CREATE TABLE IF NOT EXISTS trophies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_num INTEGER NOT NULL CHECK (trophy_num BETWEEN 1 AND 12),
  trophy_name TEXT,
  tier TEXT DEFAULT 'OMEGA',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trophy_num)
);
CREATE TABLE IF NOT EXISTS medals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medal_num INTEGER NOT NULL CHECK (medal_num BETWEEN 1 AND 12),
  medal_name TEXT,
  tier TEXT DEFAULT 'OMEGA',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, medal_num)
);
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cert_num INTEGER NOT NULL CHECK (cert_num BETWEEN 1 AND 12),
  cert_name TEXT,
  grade TEXT DEFAULT 'OMEGA',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cert_num)
);
CREATE TABLE IF NOT EXISTS phases_completed (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phase_num INTEGER NOT NULL CHECK (phase_num BETWEEN 1 AND 12),
  phase_name TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase_num)
);
CREATE TABLE IF NOT EXISTS task_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  axis TEXT DEFAULT 'a',
  increment NUMERIC(7,4) DEFAULT 0.001,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STEP 9: POPULATE OWNER WITH ALL 12 OF EVERYTHING
-- (12 phases + 12 trophies + 12 medals + 12 certificates)
-- ================================================================
DO $$
DECLARE
  v_uid UUID;
  trophy_names TEXT[] := ARRAY['THE GENESIS MARK','THE KNOWLEDGE CROWN','THE MASTERY SEAL','THE CONTRIBUTION SIGIL','THE ELEMENTAL BADGE','THE CELESTIAL MARK','THE SOVEREIGN CREST','THE BLOODLINE TROPHY','THE ECONOMIC SEAL','THE ORACLE CROWN','THE OMEGA GUARDIAN','THE ABSOLUTE APEX'];
  medal_names TEXT[] := ARRAY['FIRST LIGHT MEDAL','KNOWLEDGE PIONEER','MASTER OF CRAFT','ECONOMIC BUILDER','CELESTIAL NAVIGATOR','ORDER ARCHITECT','FAMILY GUARDIAN','CONSULTATION MASTER','RESEARCH PIONEER','PREDICTION ORACLE','HERITAGE KEEPER','OMEGA SOVEREIGN'];
  cert_names TEXT[] := ARRAY['GENESIS CERTIFICATE','KNOWLEDGE FOUNDATION','MASTERY LEVEL I','MASTERY LEVEL II','ECONOMIC ANALYST','CELESTIAL NAVIGATOR','SOVEREIGN ARCHITECT','HERITAGE SCHOLAR','ORACLE PROPHET','ORDER CONSULTANT','PLATFORM MASTER','OMEGA SOVEREIGN CERTIFICATE'];
  phase_names TEXT[] := ARRAY['SAND GENESIS','GLASS AWAKENING','IRON FORGING','STEEL TEMPERING','TITANIUM ASCENT','CARBON PRECISION','GOLD SOVEREIGNTY','PLATINUM LEGACY','DIAMOND APPROACH','DIAMOND CLARITY','OMEGA THRESHOLD','OMEGA MASTER'];
BEGIN
  SELECT id INTO v_uid FROM profiles WHERE is_owner = TRUE LIMIT 1;
  IF v_uid IS NULL THEN RETURN; END IF;
  FOR i IN 1..12 LOOP
    INSERT INTO trophies(user_id,trophy_num,trophy_name,tier,earned_at)
    VALUES(v_uid,i,trophy_names[i],'OMEGA',NOW()-((12-i)*INTERVAL '7 days'))
    ON CONFLICT(user_id,trophy_num) DO NOTHING;
    INSERT INTO medals(user_id,medal_num,medal_name,tier,earned_at)
    VALUES(v_uid,i,medal_names[i],'OMEGA',NOW()-((12-i)*INTERVAL '5 days'))
    ON CONFLICT(user_id,medal_num) DO NOTHING;
    INSERT INTO certificates(user_id,cert_num,cert_name,grade,issued_at)
    VALUES(v_uid,i,cert_names[i],'OMEGA',NOW()-((12-i)*INTERVAL '10 days'))
    ON CONFLICT(user_id,cert_num) DO NOTHING;
    INSERT INTO phases_completed(user_id,phase_num,phase_name,completed_at)
    VALUES(v_uid,i,phase_names[i],NOW()-((12-i)*INTERVAL '14 days'))
    ON CONFLICT(user_id,phase_num) DO NOTHING;
  END LOOP;
END;
$$;

-- ================================================================
-- STEP 10: complete_task RPC
-- ================================================================
CREATE OR REPLACE FUNCTION complete_task(p_uid UUID, p_axis TEXT, p_kind TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner BOOLEAN; v_new NUMERIC; v_auth NUMERIC;
BEGIN
  SELECT is_owner INTO v_owner FROM profiles WHERE id=p_uid;
  IF v_owner THEN RETURN json_build_object('success',TRUE,'owner',TRUE); END IF;
  IF p_axis='a' THEN
    UPDATE profiles SET axis_a=LEAST(9.000,COALESCE(axis_a,0.001)+0.001) WHERE id=p_uid RETURNING axis_a INTO v_new;
  ELSIF p_axis='b' THEN
    UPDATE profiles SET axis_b=LEAST(9.000,COALESCE(axis_b,0.001)+0.001) WHERE id=p_uid RETURNING axis_b INTO v_new;
  ELSE
    UPDATE profiles SET axis_c=LEAST(9.000,COALESCE(axis_c,0.001)+0.001) WHERE id=p_uid RETURNING axis_c INTO v_new;
  END IF;
  INSERT INTO task_completions(user_id,kind,axis,increment,completed_at)
  VALUES(p_uid,p_kind,p_axis,0.001,NOW());
  SELECT SQRT(POWER(axis_a,2)+POWER(axis_b,2)+POWER(axis_c,2)) INTO v_auth FROM profiles WHERE id=p_uid;
  RETURN json_build_object('success',TRUE,'new_value',v_new,'authority',ROUND(v_auth,3));
END;
$$;

-- ================================================================
-- STEP 11: get_all_members RPC (owner-only)
-- ================================================================
CREATE OR REPLACE FUNCTION get_all_members()
RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
END;
$$;

COMMIT;
