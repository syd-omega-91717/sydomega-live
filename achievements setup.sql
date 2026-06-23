-- ============================================================
-- SYD OMEGA 91717 - achievements setup.sql  (PERMANENT FIX)
-- Replaces the broken version in syd-omega-91717/sydomega-live.
-- Fixes ERROR 42703: column "cert_num" does not exist.
-- Non-destructive. Idempotent. Safe to re-run. Pure ASCII.
--
-- Why the old file kept failing:
--   It used CREATE TABLE IF NOT EXISTS. The certificates table
--   already existed without cert_num, so the rebuild was skipped
--   on every run and the seed failed on the missing column.
--
-- This version heals the table by ALTER instead of recreate,
-- so it works whether the table exists or not and never drops data.
-- ============================================================

-- 1) Ensure the table exists (no-op if it already does)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
);

-- 2) Ensure every column exists (heals schema drift)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS cert_num  INTEGER;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS cert_name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS grade     TEXT DEFAULT 'OMEGA';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Ensure the (user_id, cert_num) unique pair exists.
--    ON CONFLICT requires this constraint to be present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certificates_user_cert_unique'
  ) THEN
    ALTER TABLE certificates
      ADD CONSTRAINT certificates_user_cert_unique UNIQUE (user_id, cert_num);
  END IF;
END $$;

-- 4) Seed owner's 12 certificates. Cannot fail on missing column/constraint now.
DO $$
DECLARE
  v_uid UUID;
  i INTEGER;
  cert_names TEXT[] := ARRAY[
    'Initiate','Adept','Architect','Sentinel','Oracle','Sovereign',
    'Warden','Auditor','Beacon','Merchant','Historian','Athena Apex'];
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 's.y.dagher@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN
    SELECT id INTO v_uid FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'No users found - skipping seed. Create a user, then re-run.';
    RETURN;
  END IF;

  FOR i IN 1..12 LOOP
    INSERT INTO certificates(user_id, cert_num, cert_name, grade, issued_at)
    VALUES (v_uid, i, cert_names[i], 'OMEGA', NOW() - ((12 - i) * INTERVAL '10 days'))
    ON CONFLICT (user_id, cert_num) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Seeded 12 certificates for %.', v_uid;
END $$;
