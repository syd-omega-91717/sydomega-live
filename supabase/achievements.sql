-- ============================================================
-- SYD OMEGA 91717 - achievements: DEFINITIVE REBUILD
-- Replaces achievements setup.sql in syd-omega-91717/sydomega-live.
--
-- Fixes:
--   23502 - null value in column "milestone" (NOT NULL)
--   42703 - column "cert_num" does not exist  (earlier symptom)
--
-- WHY REBUILD INSTEAD OF HEAL:
--   certificates / trophies / medals hold SEED scaffolding that
--   this script re-creates. They carry no irreplaceable user data,
--   and the live table had drifted across many fix-files into a
--   shape no single seed matched. Rebuilding to one known shape
--   ends the drift permanently. (For real user-data tables, use
--   ALTER ... ADD COLUMN IF NOT EXISTS instead - never DROP.)
--
-- Pure ASCII. Re-runnable.
-- ============================================================

DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS trophies     CASCADE;
DROP TABLE IF EXISTS medals       CASCADE;

CREATE TABLE certificates (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL,
  cert_num  INTEGER NOT NULL CHECK (cert_num BETWEEN 1 AND 12),
  cert_name TEXT NOT NULL,
  milestone INTEGER NOT NULL DEFAULT 0,   -- matrix node the cert marks
  grade     TEXT NOT NULL DEFAULT 'OMEGA' CHECK (grade IN ('BRONZE','SILVER','GOLD','OMEGA')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT certificates_user_cert_unique UNIQUE (user_id, cert_num)
);

CREATE TABLE trophies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  trophy_num  INTEGER NOT NULL CHECK (trophy_num BETWEEN 1 AND 12),
  trophy_name TEXT NOT NULL,
  milestone   INTEGER NOT NULL DEFAULT 0,
  tier        TEXT NOT NULL DEFAULT 'OMEGA' CHECK (tier IN ('BRONZE','SILVER','GOLD','OMEGA')),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trophies_user_trophy_unique UNIQUE (user_id, trophy_num)
);

CREATE TABLE medals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  medal_num  INTEGER NOT NULL CHECK (medal_num BETWEEN 1 AND 12),
  medal_name TEXT NOT NULL,
  milestone  INTEGER NOT NULL DEFAULT 0,
  tier       TEXT NOT NULL DEFAULT 'OMEGA' CHECK (tier IN ('BRONZE','SILVER','GOLD','OMEGA')),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medals_user_medal_unique UNIQUE (user_id, medal_num)
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_trophies_user     ON trophies(user_id);
CREATE INDEX idx_medals_user       ON medals(user_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trophies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cert_self   ON certificates;
CREATE POLICY cert_self   ON certificates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS trophy_self ON trophies;
CREATE POLICY trophy_self ON trophies     FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS medal_self  ON medals;
CREATE POLICY medal_self  ON medals       FOR SELECT USING (auth.uid() = user_id);

DO $$
DECLARE
  v_uid UUID;
  i INTEGER;
  cert_names   TEXT[] := ARRAY['Initiate','Adept','Architect','Sentinel','Oracle','Sovereign','Warden','Auditor','Beacon','Merchant','Historian','Athena Apex'];
  trophy_names TEXT[] := ARRAY['First Light','Ascendant','Forgemaster','Strategist','Pathfinder','Vanguard','Keeper','Arbiter','Herald','Broker','Chronicler','Apex Crown'];
  medal_names  TEXT[] := ARRAY['Spark','Tributary','Tempered','Allied','Wayfarer','Standard','Guardian','Witness','Signal','Exchange','Memory','Sovereign Seal'];
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 's.y.dagher@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN SELECT id INTO v_uid FROM auth.users ORDER BY created_at LIMIT 1; END IF;
  IF v_uid IS NULL THEN RAISE NOTICE 'No users found - skipping seed.'; RETURN; END IF;

  FOR i IN 1..12 LOOP
    INSERT INTO certificates(user_id, cert_num, cert_name, milestone, grade, issued_at)
    VALUES (v_uid, i, cert_names[i], i, 'OMEGA', NOW() - ((12 - i) * INTERVAL '10 days'))
    ON CONFLICT (user_id, cert_num) DO NOTHING;

    INSERT INTO trophies(user_id, trophy_num, trophy_name, milestone, tier)
    VALUES (v_uid, i, trophy_names[i], i, 'OMEGA')
    ON CONFLICT (user_id, trophy_num) DO NOTHING;

    INSERT INTO medals(user_id, medal_num, medal_name, milestone, tier)
    VALUES (v_uid, i, medal_names[i], i, 'OMEGA')
    ON CONFLICT (user_id, medal_num) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Rebuilt and seeded 12 certificates, 12 trophies, 12 medals.';
END $$;
