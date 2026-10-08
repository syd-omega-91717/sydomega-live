# COSMOS Native State Consolidation

## Purpose

COSMOS is being converted from a primarily discovery/cosmology surface into a workspace that also projects authenticated canonical member state.

## Canonical source

The native member projection reads the authenticated member's existing `profiles` row:

- `sign`
- `axis_a`
- `axis_b`
- `axis_c`
- `element`
- `display_name`

No new persistence model is introduced by this consolidation.

## Truth states

- **LIVE** — the authenticated profile exists and the canonical Cosmos projection fields are populated.
- **EMPTY** — the authenticated profile is absent or exists without a complete canonical Cosmos projection.
- **UNAVAILABLE** — the session/profile query cannot be completed.

The workspace does not create fallback sign, element, axis, authority, achievement, ownership, or membership values.

## Boundary

COSMOS is a projection/discovery workspace. Existing specialist pages remain authoritative for their own actions and mutations. This change does not grant authorization or alter profile records.

## Next consolidation candidates

After this projection is verified, the same contract can be applied selectively to VAULT, SERVICES, ARENA, GOVERN, INVEST, ACHIEVE, ARCHIVE, and MEDIA. ORDER already demonstrates the discovery-surface pattern.

## Release gate

This branch must pass the repository's normal CI/security/runtime gates. A failing deployment provider status must not be bypassed or represented as production-ready.
