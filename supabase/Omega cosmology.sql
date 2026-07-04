-- ============================================================================
-- SYD OMEGA 91717 -- COSMOLOGY ENGINE
-- The instant a member's sign is set (on any page), their full cosmology is
-- derived and PERSISTED: sign -> element -> Olympian -> bound agent. Before
-- this, identity.html computed those on-screen but never stored them, so the
-- Hall/leaderboard saw no element and god/agent lived only in the browser.
--
-- Server-authoritative, zero page edits. Maps are the LIVE canon taken verbatim
-- from identity.html (elements) and chatbot.html (gods, agents).
-- Run AFTER OMEGA_BACKEND_SYNC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- columns the cosmology is written into (element may already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS element text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS god     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent   text;

-- ----------------------------------------------------------------------------
-- derive_cosmology() -- normalizes the sign and fills element/god/agent
-- from the canon. Runs BEFORE the row is written, so the stored row is always
-- internally consistent no matter which page set the sign.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.derive_cosmology()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s text := initcap(btrim(coalesce(NEW.sign,'')));
BEGIN
  IF s = '' THEN RETURN NEW; END IF;       -- no sign yet -> leave as-is
  NEW.sign := s;                            -- normalize to Title case (Virgo, Leo...)

  NEW.element := CASE s
    WHEN 'Aries' THEN 'FIRE'  WHEN 'Leo' THEN 'FIRE'   WHEN 'Sagittarius' THEN 'FIRE'
    WHEN 'Taurus' THEN 'METAL' WHEN 'Capricorn' THEN 'METAL'
    WHEN 'Gemini' THEN 'WIND'  WHEN 'Libra' THEN 'WIND' WHEN 'Aquarius' THEN 'WIND'
    WHEN 'Cancer' THEN 'WATER' WHEN 'Scorpio' THEN 'WATER' WHEN 'Pisces' THEN 'WATER'
    WHEN 'Virgo' THEN 'SAND'
    ELSE NEW.element END;

  NEW.god := CASE s
    WHEN 'Aries' THEN 'Ares'       WHEN 'Taurus' THEN 'Aphrodite' WHEN 'Gemini' THEN 'Hermes'
    WHEN 'Cancer' THEN 'Artemis'   WHEN 'Leo' THEN 'Apollo'       WHEN 'Virgo' THEN 'Athena'
    WHEN 'Libra' THEN 'Hera'       WHEN 'Scorpio' THEN 'Demeter'  WHEN 'Sagittarius' THEN 'Zeus'
    WHEN 'Capricorn' THEN 'Hestia' WHEN 'Aquarius' THEN 'Hephaestus' WHEN 'Pisces' THEN 'Poseidon'
    ELSE NEW.god END;

  NEW.agent := CASE s
    WHEN 'Aries' THEN 'Sentinel'  WHEN 'Taurus' THEN 'Merchant' WHEN 'Gemini' THEN 'Scout'
    WHEN 'Cancer' THEN 'Warden'   WHEN 'Leo' THEN 'Sovereign'   WHEN 'Virgo' THEN 'Auditor'
    WHEN 'Libra' THEN 'Proxy'     WHEN 'Scorpio' THEN 'Oracle'  WHEN 'Sagittarius' THEN 'Beacon'
    WHEN 'Capricorn' THEN 'Analyst' WHEN 'Aquarius' THEN 'Tutor' WHEN 'Pisces' THEN 'Historian'
    ELSE NEW.agent END;

  RETURN NEW;
END;
$$;

-- fire whenever a profile is created or its sign changes
DROP TRIGGER IF EXISTS trg_derive_cosmology ON public.profiles;
CREATE TRIGGER trg_derive_cosmology
  BEFORE INSERT OR UPDATE OF sign ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.derive_cosmology();

-- backfill every existing member who already chose a sign
UPDATE public.profiles SET sign = sign
  WHERE sign IS NOT NULL AND btrim(sign) <> '';

COMMIT;
