-- Forward cleanup for a temporary proposal layer that was superseded by the read-only agent-execute gateway.
-- The earlier migrations remain versioned because they were applied to production; this migration restores the intended canonical state.
drop function if exists public.omega_submit_agent_action_proposal(text,text,jsonb);
drop function if exists public.omega_decide_agent_action_proposal(uuid,boolean,text);
drop function if exists private.omega_submit_agent_action_proposal(text,text,jsonb);
drop function if exists private.omega_decide_agent_action_proposal(uuid,boolean,text);
drop table if exists public.omega_agent_action_proposals cascade;
drop table if exists public.omega_agent_tool_registry cascade;
delete from public.policy_rules where policy_id in ('agent:risk_read','agent:risk_analyze','agent:risk_write','agent:risk_privileged','agent:risk_external','agent:risk_destructive');
