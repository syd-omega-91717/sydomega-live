-- Ω SYD OMEGA 91717 — least-privilege member preferences RPC grants
-- These functions operate only on the authenticated caller's own preferences.
-- Anonymous callers have no supported use for either RPC; public EXECUTE was
-- inherited from PostgreSQL's default function privileges, not an explicit need.
-- Certificate verification remains intentionally public and is not changed here.

begin;

revoke execute on function public.get_member_preferences()
  from public, anon;
grant execute on function public.get_member_preferences()
  to authenticated;

revoke execute on function public.set_member_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean
) from public, anon;
grant execute on function public.set_member_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

commit;
