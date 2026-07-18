-- ============================================================================
-- SYD OMEGA 91717 -- VERIFIED MEMBERS BEGIN AT ZERO
-- Real bug: axis_a/b/c defaulted to 1, meaning every new signup started with
-- authority 1.73 -- already past the Genesis Gate (Gate I) threshold before
-- taking a single real action. This contradicts matrix.html's own documented
-- claim ("NEW MEMBERS: Start at coordinate 0.001, 0.001, 0.001") and the
-- platform's actual intent: members begin at zero and earn everything through
-- real use. The Architect/Owner is explicitly, permanently exempted -- always
-- anointed to absolute apex (9,9,9) regardless of this default.
-- Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ALTER COLUMN axis_a SET DEFAULT 0.001;
ALTER TABLE public.profiles ALTER COLUMN axis_b SET DEFAULT 0.001;
ALTER TABLE public.profiles ALTER COLUMN axis_c SET DEFAULT 0.001;

-- Safe backfill: only reset members who are EXACTLY at the old default
-- (1.000, 1.000, 1.000) AND have zero real evolution events recorded --
-- meaning they are still genuinely untouched, not someone who coincidentally
-- earned their way back to exactly 1,1,1 through real actions. Never touches
-- the owner (is_owner is always exempt).
UPDATE public.profiles p SET axis_a = 0.001, axis_b = 0.001, axis_c = 0.001
WHERE p.is_owner IS NOT TRUE
  AND p.axis_a = 1 AND p.axis_b = 1 AND p.axis_c = 1
  AND NOT EXISTS (SELECT 1 FROM public.evolution_events e WHERE e.user_id = p.id);

-- Re-confirm the owner is untouched and permanently at absolute apex,
-- regardless of any default change above (belt-and-suspenders, matches the
-- existing ANOINT pattern -- update the email if it's changed).
UPDATE public.profiles SET axis_a = 9.000, axis_b = 9.000, axis_c = 9.000
WHERE id IN (SELECT id FROM auth.users WHERE email IN ('s.y.dagher@gmail.com','slmndghr@gmail.com'));

COMMIT;

-- verification query -- run manually to check the result
-- SELECT id, display_name, axis_a, axis_b, axis_c, is_owner FROM public.profiles ORDER BY axis_a DESC LIMIT 20;
