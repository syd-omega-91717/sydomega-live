# Ω SYD OMEGA 91717 — Capability Provenance Contract

## Purpose

Give every World module a compact evidence panel so users can distinguish what the platform knows, what the current runtime measured, what is calculated, and what is not verified.

This is an experience layer over existing capability metadata. It does not create a second capability registry or second source of truth.

## Current evidence

The World engine owns the 18-module route registry and performs a deployed-origin HEAD reachability check.

The provenance panel reuses that registry and reports:
- module name
- product purpose
- gameful role
- route
- route evidence state
- evidence source
- freshness timestamp
- authorization boundary
- database-health boundary
- business-correctness boundary

## Reality semantics

- LIVE: directly observed from the current route check.
- CALCULATED: deterministic computation over an authoritative source.
- SIMULATED: scenario output, never production fact.
- USER-CREATED: member-authored content.
- LORE: fictional/cinematic content.
- UNAVAILABLE: the required evidence is not available.

The panel must never convert LIVE route into LIVE capability.

## Interaction

Selecting a World node updates the provenance panel. The interaction remains usable with keyboard navigation and without animation.

## Acceptance criteria

1. All 18 governed modules remain sourced from the existing World registry.
2. No duplicate module registry is introduced.
3. Route state is explicitly labeled.
4. Freshness is visible.
5. Unknown authorization/database/business state remains UNAVAILABLE.
6. No user, financial, credential, achievement, or ownership claim is inferred from route reachability.
7. The panel remains functional with reduced motion.