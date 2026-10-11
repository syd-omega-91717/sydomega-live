# Ω LIFE Surface

## Purpose

life.html is the member-facing convergence surface for the existing Ω Human Agency and Ω Relearn · Sigil · Mana contracts.

It does not create a new identity, event, evidence, mission, capability, or progression system.

## Canonical sources

The read-only surface consumes:

- profiles for member-authored identity/context.
- task_completions for verified task/learning signals.
- omega_platform_events for the canonical event stream.
- capability_registry for registered capabilities.
- omega_member_mission_state for member mission state.
- evolution_events for existing progression/evolution evidence.

## Truth rules

- Member data is LIVE when read from the authoritative production source.
- Mana is CALCULATED and displays its source counts.
- Sigil is CALCULATED and visual only.
- Relearn signals are represented from existing verified task outcomes; this page does not fabricate a relearn record.
- Missing authentication/source data becomes UNAVAILABLE or PARTIAL.
- City/region/world representation does not imply legal citizenship, sovereignty, ownership, rank or authority.

## Security rules

- Session identity comes from Supabase Auth.
- Reads are scoped by the authenticated user where member-owned.
- No browser secret beyond the canonical publishable client is introduced.
- No writes are performed by this surface.
- No innerHTML or fabricated fallback state is used.
- The surface does not grant authority, entitlements, credentials or financial capacity.

## Promotion boundary

This is a read-only production UI integration, not proof that persistence for relearn_record, sigil or mana_state is complete. Those objects remain governed contracts until their server-authoritative persistence, RLS, event/evidence registration, export/deletion behavior, automated tests and production evidence exist.
