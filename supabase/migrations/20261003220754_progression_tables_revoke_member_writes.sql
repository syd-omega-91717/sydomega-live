-- Progression tables are written only through track_quest_progress (SECURITY
-- DEFINER, 20261003220624). No page writes them directly -- quest-progress,
-- domain-mastery, leaderboard and covenant only read -- so these grants served
-- only self-forgery. A GRANT is checked before RLS, so the member write
-- policies left on these tables (quest_completions_member_insert/_update,
-- domain_mastery_member_update, leaderboard_member_update,
-- covenant_member_update) are now inert; dropping them is open hygiene
-- (GAP_ANALYSIS.md section S).

revoke insert, update on table public.quest_completions from authenticated;
revoke insert, update on table public.domain_mastery from authenticated;
revoke update on table public.leaderboard_entries from authenticated;
revoke update on table public.covenant_progress from authenticated;
