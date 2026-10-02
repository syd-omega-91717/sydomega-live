-- SYD OMEGA 91717
-- Read-only public API functions should run as invoker, preserving the
-- caller's RLS boundary instead of bypassing it through SECURITY DEFINER.

begin;

alter function public.get_activity_feed(integer,integer) security invoker;
alter function public.get_activity_feed(integer,integer) set search_path = '';

alter function public.get_capability_health() security invoker;
alter function public.get_capability_health() set search_path = '';

commit;
