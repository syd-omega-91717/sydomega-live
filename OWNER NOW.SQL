BEGIN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS material_tier TEXT DEFAULT 'SAND';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_a NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_b NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS axis_c NUMERIC(7,3) DEFAULT 0.001;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
UPDATE profiles p SET email=u.email FROM auth.users u WHERE u.id=p.id AND (p.email IS NULL OR p.email='');
UPDATE profiles SET
  is_owner=TRUE,access_approved=TRUE,is_trial=FALSE,trial_expires_at=NULL,
  axis_a=9.000,axis_b=9.000,axis_c=9.000,material_tier='OMEGA MASTER',
  membership_tier=9,sign='Virgo',element='Sand',
  display_name='Major Sleiman Youssef Dagher'
WHERE id IN(SELECT id FROM auth.users WHERE email IN('s.y.dagher@gmail.com','slmndghr@gmail.com'));
CREATE OR REPLACE FUNCTION protect_owner()RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner=TRUE THEN
    NEW.axis_a:=9.000;NEW.axis_b:=9.000;NEW.axis_c:=9.000;
    NEW.material_tier:='OMEGA MASTER';NEW.membership_tier:=9;
    NEW.access_approved:=TRUE;NEW.is_trial:=FALSE;NEW.trial_expires_at:=NULL;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS owner_guard ON profiles;
CREATE TRIGGER owner_guard BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_owner();
COMMIT;
