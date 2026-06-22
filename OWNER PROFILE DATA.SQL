BEGIN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_num TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_reg_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registry_num TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

UPDATE profiles SET
  display_name      = 'Major Sleiman Youssef Dagher',
  sign              = 'Virgo',
  element           = 'Sand',
  father_name       = 'Youssef',
  mother_name       = 'Ilham Nader',
  birth_place       = 'Tripoli, Lebanon',
  blood_type        = 'B+',
  nationality       = 'Lebanese',
  order_name        = 'Ordre des Ingenieurs et Architectes - Beyrouth',
  order_num         = '30875',
  specialty         = 'Architecture',
  order_reg_date    = '2007-04-10',
  registry_num      = '2',
  village           = 'Mrach El Habbas',
  region            = 'South Lebanon, Jezzine',
  social_handle     = '@SYDOMEGA_AI',
  date_of_birth     = '1982-04-19',
  is_owner          = TRUE,
  access_approved   = TRUE,
  is_trial          = FALSE,
  trial_expires_at  = NULL,
  axis_a            = 9.000,
  axis_b            = 9.000,
  axis_c            = 9.000,
  material_tier     = 'OMEGA MASTER',
  membership_tier   = 9
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('s.y.dagher@gmail.com','slmndghr@gmail.com')
);
COMMIT;
