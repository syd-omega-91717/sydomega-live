# Ω Living Intelligence Core — 2026-10-22

## Objective

Consolidate the experience around one member-controlled intelligence context, one explicit life knowledge graph, one governed action/advice boundary, and one trust/privacy fabric. This is an additive evolution of the existing static HTML/JavaScript + Supabase architecture. It does not introduce a new framework, duplicate member database, or new provider call.

## Implementation contract

### Ω Personal Intelligence Core
- Reuse `omega_personal_context_items` and `omega_personal_context_preferences` as canonical sources.
- Account-level AI consent, per-item consent, and confirmed review status are required before a future AI workflow can consider a record.
- New surfaces must not copy private content into browser storage or analytics.

### Ω Life Knowledge Graph
- Nodes are private context items; edges are explicit rows from `omega_personal_context_links`.
- The client API can expose source kind/label, review status, sensitivity, consent state, expiry, and update time without returning record content.
- Important current limitation: the `summaryOnly` query used by the Intelligence summary intentionally selects a narrower field set and only link IDs. This dashboard therefore does not claim to display the complete graph or source provenance; it directs members to the canonical Ω LIFE editor for full relationship details. Widening that query needs a separate least-privilege review and passing privacy tests.
- The current persisted schema does not yet contain a first-class confidence score or `last_verified_at`. These are declared gaps, not synthesized values. Add them only after the pending/live migration manifest contradiction is resolved and replay/security tests pass.

### Ω Action and Advice Engine
- Route intentions to existing canonical goal, mission, and project workspaces.
- AI-generated advice, automatic reminders, and external side effects remain NOT CONNECTED until a governed provider and approval path are verified.
- A future action service must use server-side authorization, capability allowlists, bounded inputs, source citations, risk-tiered approval, idempotency, durable event/evidence records, and explicit result state.

### Ω Trust and Privacy Fabric
- Missing or unreadable consent is denied/unavailable, never silently granted.
- Sensitive context requires separate sensitive-data permission and item-level consent.
- Uploaded files remain untrusted until real malware/content scanning is implemented; `scan_state: UNAVAILABLE` is not a clean scan result.

## Existing image estate and generated-art integration

The repository already contains branded SVG assets (`assets/omega-banner.svg`, `assets/omega-sigil.svg`, `assets/omega-divider.svg`), the derived `/assets/legacy/sign-<sign>.webp` zodiac set, and the owner collections audited in `docs/OMEGA_VISUAL_ESTATE_AUDIT_20260929.md`. That audit counted 404 raster files, 313 unique by content hash, and 91 byte-identical duplicate copies; it also recorded baked checkerboards, watermarks, and caption defects in some source collections. These are artwork assets, not proof of an earned achievement, identity, or financial value.

This workspace references the canonical Omega banner and an existing derived zodiac asset rather than pretending a new photo was committed. The broader asset pass must reuse the existing visual audit and deterministic derivation strategy, avoid shipping defective source originals in new surfaces, and keep duplicate deletion/re-export of owner masters gated for owner approval. For every asset used, verify stable path/content type, responsive formats, alt text, provenance/rights, absence of sensitive data, mobile rendering, and CI path checks.

## Acceptance gates

- Static contract tests and JavaScript syntax checks pass.
- Browser checks cover signed-out, authenticated-empty, authenticated-with-data, consent-denied, and source-unavailable states.
- No Supabase migration or production deployment is performed by a UI-only change.
- Merge remains blocked while required CI is red, migration manifests disagree, or Vercel deployment/account checks fail.
