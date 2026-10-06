# Ω Mission → Task Reality

The mission system now has a canonical task layer without replacing the existing mission state machine.

## Chain

`MISSION → TASK → AUTHORIZATION POLICY → ACTION → EVENT → EVIDENCE → OUTCOME → PROGRESSION`

### Mission task definition

`omega_mission_tasks` stores:

- mission relationship and version
- task key/title/description
- authorization policy
- risk level
- action route
- required event types
- required event metadata
- outcome rule
- lifecycle status

### Member task state

`omega_member_mission_tasks` stores the member-owned execution state:

`available → accepted → started → blocked/submitted → verified → completed`

Terminal states:

`failed / cancelled / expired`

Evidence references and authorization snapshots are persisted with the member task.

### Audit

`omega_mission_task_transitions` records every accepted state transition with:

- authenticated member
- prior/current state
- evidence references
- graph evidence references
- idempotency key
- reason
- timestamp

## Security

- Task definitions are readable only to authenticated users when active.
- Member task rows are readable only by their owner.
- Task mutation is server-authoritative through RPC.
- Evidence must belong to the authenticated member before submission/verification/completion.
- Invalid lifecycle transitions are rejected.
- Idempotency is supported.

## Current production state

The live catalog contains **9 active mission task definitions**, one derived from each active mission.

There are currently **0 member task executions** because there are currently **0 member mission states**. This is an observed empty execution state, not seeded activity.

