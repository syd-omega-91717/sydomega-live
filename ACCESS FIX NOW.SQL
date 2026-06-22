BEGIN;

INSERT INTO profiles (id, email, is_owner, access_approved, is_trial, trial_expires_at, axis_a, axis_b, axis_c, material_tier, membership_tier, display_name, sign, element)
SELECT
  u.id,
  u.email,
  TRUE,
  TRUE,
  FALSE,
  NULL,
  9.000,
  9.000,
  9.000,
  'OMEGA MASTER',
  9,
  'Major Sleiman Youssef Dagher',
  'Virgo',
  'Sand'
FROM auth.users u
WHERE u.email IN ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')
ON CONFLICT (id) DO UPDATE SET
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
  element         = 'Sand';

COMMIT;
