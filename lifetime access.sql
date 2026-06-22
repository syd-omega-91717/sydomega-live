BEGIN;

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
  display_name    = 'Major Sleiman Youssef Dagher'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_lifetime_guard ON profiles;
CREATE TRIGGER owner_lifetime_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_lifetime();

COMMIT;
