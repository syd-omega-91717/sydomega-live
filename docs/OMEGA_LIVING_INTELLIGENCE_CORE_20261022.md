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
- Show source kind/label, review status, sensitivity, consent state, expiry, and update time when available.
- The current persisted schema does not yet contain a first-class confidence score or `last_verified_at`. These are declared gaps, not synthesized values. Add them only after the pending/live migration manifest contradiction is resolved and replay/security tests pass.

### Ω Action and Advice Engine
- Route intentions to existing canonical goal, mission, and project workspaces.
- AI-generated advice, automatic reminders, and external side effects remain NOT CONNECTED until a governed provider and approval path are verified.
- A future action service must use server-side authorization, capability allowlists, bounded inputs, source citations, risk-tiered approval, idempotency, durable event/evidence records, and explicit result state.

### Ω Trust and Privacy Fabric
- Missing or unreadable consent is denied/unavailable, never silently granted.
- Sensitive context requires separate sensitive-data permission and item-level consent.
- Uploaded files remain untrusted until real malware/content scanning is implemented; `scan_state: UNAVAILABLE` is not a clean scan result.

## Generated photo / media integration

No verified generated-photo set was found by repository code search in this work. Do not invent filenames or point production HTML at nonexistent image paths. For each actual generated photo, verify exact file and usage rights, stable repository path/content type, responsive formats, alt text, provenance/attribution, absence of sensitive data, mobile rendering, and CI path checks. Upload or identify the actual image files before integration; do not claim an image is integrated until the committed asset and served route are verified.

## Acceptance gates

- Static contract tests and JavaScript syntax checks pass.
- Browser checks cover signed-out, authenticated-empty, authenticated-with-data, consent-denied, and source-unavailable states.
- No Supabase migration or production deployment is performed by a UI-only change.
- Merge remains blocked while required CI is red, migration manifests disagree, or Vercel deployment/account checks fail.
