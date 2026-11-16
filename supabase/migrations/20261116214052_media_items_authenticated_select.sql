-- Ω SYD OMEGA 91717 — authenticated media catalog read boundary
-- The existing SELECT RLS policy restricts members to live media and
-- delegates owner visibility to the MFA-aware private.is_platform_owner().
-- No anonymous access or write privilege is introduced.

begin;
grant select on table public.media_items to authenticated;
commit;
