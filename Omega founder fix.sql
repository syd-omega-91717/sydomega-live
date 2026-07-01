-- ============================================================================
-- SYD OMEGA 91717 -- FOUNDER CORRECTION
-- Corrects the Sovereign's record and guarantees owner access.
--   1. Sign: ARIES (born 19 April 1982) -> element Fire, Olympian Ares,
--      agent Sentinel. (Replaces the earlier Virgo/Sand entry.)
--   2. Flags the account is_owner = true with permanent access, so the
--      founder's Access Control console (the ACCESS tab in profile.html)
--      becomes visible and get_all_members returns the member roster.
-- Founder: Major Sleiman Youssef Dagher -- s.y.dagher@gmail.com
-- Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- make sure the columns exist (works no matter which SQL you have run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sign            text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS element         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS god             text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent           text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date      date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner        boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trial        boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_rejected     boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- the correction: Aries + owner + permanent access, matched by the founder's
-- login email (covers both known addresses). Explicit element/god/agent so it
-- is correct even if the cosmology trigger is not installed; if it IS, the
-- trigger derives the identical values from sign = 'Aries'.
UPDATE public.profiles SET
  sign            = 'Aries',
  birth_date      = DATE '1982-04-19',
  element         = 'FIRE',
  god             = 'Ares',
  agent           = 'Sentinel',
  is_owner        = true,
  access_approved = true,
  is_trial        = false,
  is_rejected     = false,
  trial_expires_at = NULL
WHERE id IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com')
);

COMMIT;

-- ---------------------------------------------------------------------------
-- verify (run this SELECT after; you should see one row, ARIES / FIRE / owner)
-- ---------------------------------------------------------------------------
SELECT u.email, p.sign, p.element, p.god, p.agent, p.birth_date,
       p.is_owner, p.access_approved
FROM public.profiles p JOIN auth.users u ON u.id = p.id
WHERE lower(u.email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com');
