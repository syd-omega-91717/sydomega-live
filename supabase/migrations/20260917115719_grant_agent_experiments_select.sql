-- Ω SYD OMEGA 91717
-- autonomous-insights.html reads public.agent_experiments (owner-only
-- dashboard) but the table has an RLS policy (agent_experiments_read,
-- qual: is_platform_owner()) and no table-level GRANT at all. A GRANT is
-- checked before row security (CLAUDE.md 8.1 class 6c), so every
-- read -- owner included -- fails 42501 and the page's
-- `const { data } = await sb.from(...)` silently renders the
-- "No experiments running yet" empty state instead of a real error.
-- The RLS qual already restricts visible rows to the owner; granting
-- SELECT to authenticated does not widen that.

grant select on public.agent_experiments to authenticated;
