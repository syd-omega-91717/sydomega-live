BEGIN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS planet TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS olympian TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
UPDATE profiles SET
  date_of_birth = '1982-04-19',
  zodiac_sign   = 'Virgo',
  sign          = 'Virgo',
  planet        = 'Mercury',
  olympian      = 'Demeter',
  agent         = 'Sovereign',
  token         = 'ARENITE',
  element       = 'Sand',
  nationality   = 'Lebanese',
  profession    = 'Architect & Engineer',
  display_name  = 'Major Sleiman Youssef Dagher'
WHERE id IN (SELECT id FROM auth.users WHERE email IN ('s.y.dagher@gmail.com','slmndghr@gmail.com'));
COMMIT;
