-- SYD OMEGA 91717
-- Harden high-risk public SECURITY DEFINER RPCs identified by body review.
begin;
revoke execute on function public.award_points(uuid,integer,text,text) from authenticated, anon, public;
revoke execute on function public.compute_leaderboard_snapshot() from authenticated, anon, public;
revoke execute on function public.my_time_sovereign() from authenticated, anon, public;
commit;
