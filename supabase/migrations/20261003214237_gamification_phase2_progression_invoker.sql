-- Gamification Phase 2 (6/6): my_progression reads only the caller's own rows,
-- all readable under existing RLS (spl_own, mp_own, perks_read), so it does not
-- need elevated rights. Matches 20261002075646's convention.

alter function public.my_progression() security invoker;
