# Ω LIFE Product Surface

## Purpose

`omega_member_life_surface` is a read-only, authenticated member projection over existing authoritative tables. It does not create a second member database and it never fabricates missing domains.

## Persisted domains

- Identity: `profiles`
- Preferences: `member_preferences`
- Projects: `projects`, `project_members`
- Missions: `omega_missions`, `omega_member_mission_state`
- Quests: `omega_quests`, `omega_member_quest_state`, `member_quests`
- Tasks and learning: `task_completions`
- AI memory: `ai_memory`, `ai_memory_embeddings`
- Notifications: `notifications`, `notification_queue`
- Activity and evidence: `omega_platform_events`, `omega_platform_evidence`, `graph_evidence`
- Progression: `evolution_events`, `domain_mastery`, `quest_completions`, `leaderboard_entries`

## Explicitly unavailable

The current authoritative schema has no member-owned production tables for:

- skills
- goals
- ideas
- credentials
- achievement definitions / user achievements

These are returned as `UNAVAILABLE` rather than represented with synthetic records.

## Security

- View uses `security_invoker = true`.
- Only the `authenticated` role receives `SELECT`.
- The projection is constrained to `auth.uid()`.
- No browser-side writes are introduced.

## UI

`life.html` loads `omega-life-surface.js`, which reads the projection and renders observed member state alongside the existing Ω LIFE experience.

## Truth contract

`LIVE` means the projection was returned from persisted production sources. Counts are observations, not claims of business success, revenue, authority, or achievement.
