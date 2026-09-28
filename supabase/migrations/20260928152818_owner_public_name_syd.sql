-- Owner public identity: S.Y.D (2026-09-28).
-- 0039_lifetime_access.sql seeded profiles.display_name = 'Major Sleiman Youssef
-- Dagher', and every member-facing surface that reads display_name (profile
-- character card, share card, leaderboards) rendered it. The owner's rule:
-- the full name "Sleiman Youssef Dagher" (no "Major") appears only on owner/
-- admin surfaces, which take it from omega-user.js OWNER.full_name; everywhere
-- else the public name is the abbreviation S.Y.D.
update public.profiles
   set display_name = 'S.Y.D'
 where is_owner = true
   and display_name is distinct from 'S.Y.D';
