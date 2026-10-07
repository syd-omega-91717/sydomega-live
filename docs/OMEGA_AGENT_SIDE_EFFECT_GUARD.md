# Ω Agent Side-Effect Guard

## Canonical authorization chain

`AGENT TASK → AGENT STATE → EXPLICIT TOOL GRANT → TASK APPROVAL → CALL BUDGET → AUTHORIZATION DECISION → EXTERNAL EXECUTION`

The database guard is deliberately fail-closed.

## Rules
- Only the Supabase `service_role` may call the authorization wrapper.
- A task must exist and have a user subject.
- Task status must be `approved` or `running`.
- Agent status must be `INTEGRATED`, `TESTED`, `DEPLOYED`, or `VERIFIED`.
- The tool must have an enabled explicit row in `omega_agent_tool_grants`.
- The agent's denied-tool list always wins.
- When an allow-list is an array, the tool must be present.
- Grants requiring human approval require `approved_by` and `approved_at`.
- The per-task/per-tool `max_calls` budget is enforced from the canonical operation log.
- Only low/medium risk is currently accepted by this guard. High/critical external effects remain blocked until a separate policy is explicitly implemented.
- Blocked decisions are written to `omega_agent_operations`; no external side effect is performed.

## Current production reality
The live grant table currently has no rows, and the defined Ω agents are currently `DESIGNED`. Therefore this guard intentionally prevents agent external side effects.

This is a governance boundary, not evidence that agents are production-integrated.

## Security boundary
Provider credentials, secrets, financial transfers, credential access, surveillance, and other privileged external actions must not be inferred from an agent's natural-language intent. They require an explicit governed capability and authorization record.

## Next step
When a specific agent/tool integration is actually ready, create the narrowest possible grant, define its scope, require approval where appropriate, then execute through the guard and record the resulting event/evidence.
