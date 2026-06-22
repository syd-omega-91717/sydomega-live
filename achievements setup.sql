BEGIN;
CREATE TABLE IF NOT EXISTS trophies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_num INTEGER NOT NULL CHECK (trophy_num BETWEEN 1 AND 12),
  trophy_name TEXT NOT NULL,
  element TEXT,
  tier TEXT DEFAULT 'OMEGA',
  axis_required TEXT DEFAULT 'a',
  threshold NUMERIC(7,3) DEFAULT 0.001,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trophy_num)
);
CREATE TABLE IF NOT EXISTS medals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medal_num INTEGER NOT NULL CHECK (medal_num BETWEEN 1 AND 12),
  medal_name TEXT NOT NULL,
  category TEXT,
  tier TEXT DEFAULT 'GOLD',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, medal_num)
);
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cert_num INTEGER NOT NULL CHECK (cert_num BETWEEN 1 AND 12),
  cert_name TEXT NOT NULL,
  domain TEXT,
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
ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases_completed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_trophies" ON trophies;
DROP POLICY IF EXISTS "own_medals" ON medals;
DROP POLICY IF EXISTS "own_certs" ON certificates;
DROP POLICY IF EXISTS "own_phases" ON phases_completed;
CREATE POLICY "own_trophies" ON trophies FOR ALL USING (auth.uid()=user_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
CREATE POLICY "own_medals" ON medals FOR ALL USING (auth.uid()=user_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
CREATE POLICY "own_certs" ON certificates FOR ALL USING (auth.uid()=user_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
CREATE POLICY "own_phases" ON phases_completed FOR ALL USING (auth.uid()=user_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND is_owner=TRUE));
DO $$
DECLARE v_uid UUID;
  trophy_names TEXT[] := ARRAY['THE GENESIS MARK','THE KNOWLEDGE CROWN','THE MASTERY SEAL','THE CONTRIBUTION SIGIL','THE ELEMENTAL BADGE','THE CELESTIAL MARK','THE SOVEREIGN CREST','THE BLOODLINE TROPHY','THE ECONOMIC SEAL','THE ORACLE CROWN','THE OMEGA GUARDIAN','THE ABSOLUTE APEX'];
  medal_names TEXT[] := ARRAY['FIRST LIGHT MEDAL','KNOWLEDGE PIONEER','MASTER OF CRAFT','ECONOMIC BUILDER','CELESTIAL NAVIGATOR','ORDER ARCHITECT','FAMILY GUARDIAN','CONSULTATION MASTER','RESEARCH PIONEER','PREDICTION ORACLE','HERITAGE KEEPER','OMEGA SOVEREIGN'];
  cert_names TEXT[] := ARRAY['GENESIS CERTIFICATE','KNOWLEDGE FOUNDATION','MASTERY LEVEL I','MASTERY LEVEL II','ECONOMIC ANALYST','CELESTIAL NAVIGATOR','SOVEREIGN ARCHITECT','HERITAGE SCHOLAR','ORACLE PROPHET','ORDER CONSULTANT','PLATFORM MASTER','OMEGA SOVEREIGN CERTIFICATE'];
  phase_names TEXT[] := ARRAY['SAND GENESIS','GLASS AWAKENING','IRON FORGING','STEEL TEMPERING','TITANIUM ASCENT','CARBON PRECISION','GOLD SOVEREIGNTY','PLATINUM LEGACY','DIAMOND APPROACH','DIAMOND CLARITY','OMEGA THRESHOLD','OMEGA MASTER'];
BEGIN
  SELECT id INTO v_uid FROM profiles WHERE is_owner=TRUE LIMIT 1;
  IF v_uid IS NULL THEN RETURN; END IF;
  FOR i IN 1..12 LOOP
    INSERT INTO trophies(user_id,trophy_num,trophy_name,element,tier,earned_at)
    VALUES(v_uid,i,trophy_names[i],CASE WHEN i%5=1 THEN 'FIRE' WHEN i%5=2 THEN 'WATER' WHEN i%5=3 THEN 'SAND' WHEN i%5=4 THEN 'METAL' ELSE 'WIND' END,'OMEGA',NOW()-((12-i)*INTERVAL '7 days'))
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
COMMIT;
