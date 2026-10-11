# Ω Relearn · Sigil · Mana Civilization Layer

## Status

DESIGN_PROPOSAL with executable contract primitives.

This layer does not claim production persistence, authorization, cryptographic credential issuance, financial value, or legal status. Production promotion remains subject to the existing Ω Production Assurance gate.

## Why this layer exists

The historical source corpus describes a progression system built around the 9-stage path, 9×9×9 / 729 matrix, certificates, signets/stickers, personalized elements, agents, heritage, and user progression.

The current architecture already provides safer authoritative primitives: Human Agency, Mission State, Event Fabric, Evidence Graph, Capability Registry, Civilization Atlas, Execution Graph, and Production Assurance.

This layer connects those ideas without creating parallel identity, event, evidence, mission, capability, progression, or world systems.

## 1. Ω RELEARN

Relearn is a governed improvement cycle:

CAPTURE → REFLECT → UNDERSTAND → RETRY → VERIFY → INTEGRATE

Inputs:
- task outcomes;
- mission state;
- evidence;
- user reflection;
- agent feedback;
- prior learning.

Outputs:
- retry plan;
- capability delta;
- progression signal;
- verified learning event.

An AI recommendation cannot by itself upgrade a user's progression.

## 2. Ω SIGIL

A Sigil is the visual language of a user's evolving platform identity.

It may represent:
- user-authored identity;
- verified milestones;
- verified credentials;
- earned achievements;
- explicitly declared civilization affiliations.

It must not silently encode sensitive traits or psychological conclusions.

Lifecycle:

CREATED → EARNED → EVOLVED → ARCHIVED

A Sigil is not an authentication credential. Authentication remains Supabase Auth; authorization remains the existing policy/capability layer.

## 3. Ω MANA

Mana is deliberately not money.

It is a transparent UX abstraction for currently available capacity across:

- Focus
- Learning
- Creative
- Collaboration
- Execution

The calculation uses declared, authorized, or verified inputs and exposes source counts.

Mana cannot:
- grant authorization;
- determine creditworthiness;
- determine health;
- determine employment eligibility;
- determine legal status;
- determine social worth;
- become a hidden ranking mechanism.

Spending mana is a governed action and therefore requires authorization. Recovery may require evidence.

## 4. User → Civilization representation

The user can be represented through the existing atlas hierarchy:

PERSON → PROJECT → TASK → SERVICE → CITY → REGION → COUNTRY → WORLD

Relationships:

- BELONGS_TO
- CONTRIBUTES_TO
- LEARNS_FROM
- SERVES
- COLLABORATES_WITH
- REPRESENTS
- AFFILIATES_WITH

Visibility:

PRIVATE → SHARED → CIVILIZATION_AGGREGATE → PUBLIC

Civilization representation never implies legal citizenship, sovereignty, ownership, rank, or authority.

## 5. System integration

Human Agency owns intent, preferences, boundaries and consent.

Relearn consumes outcomes/evidence and produces learning signals.

Sigil consumes declared identity and verified milestones.

Mana consumes authorized/verified capacity inputs and produces a calculated capacity view.

Missions and tasks remain execution state.

Event Fabric remains the event source.

Evidence Graph remains provenance.

Capability Registry remains the authorization capability source.

Data Lineage remains provenance.

Civilization Atlas remains world/city/service hierarchy.

729 progression remains progression geometry.

Execution Graph remains dependency/action reasoning.

Production Assurance remains the promotion gate.

## 6. Event contract

Relearn:
- learning_captured
- relearn_started
- relearn_verified

Sigil:
- sigil_created
- sigil_evolved
- sigil_archived

Mana:
- mana_calculated
- mana_spent
- mana_recovered

Persisted events require the authenticated actor, schema version, source references, truth state, and idempotency key.

## 7. Unified user loop

IDENTITY → SIGIL → GOAL → MISSION → ACTION → EVENT → EVIDENCE → RELEARN → MANA → PROGRESSION → CIVILIZATION CONTRIBUTION → SIGIL EVOLUTION

The representation is deliberately evidence-driven: visual status never substitutes for authoritative state.

## 8. Production promotion gates

Before these concepts become LIVE:

1. Persist schemas/migrations in Supabase.
2. Add RLS and privacy tests.
3. Review and register event names against the existing event allowlist.
4. Attach evidence and data lineage.
5. Bind progression changes to authoritative mission/task completion.
6. Build user-facing Profile/Sigil/Mana surfaces.
7. Add accessibility and mobile checks.
8. Add export/deletion semantics.
9. Add production smoke tests.
10. Pass Ω Production Assurance and deployment verification.

Until those gates are satisfied, these primitives remain explicitly DESIGN_PROPOSAL, CALCULATED, or VERIFIED according to their local truth state.
