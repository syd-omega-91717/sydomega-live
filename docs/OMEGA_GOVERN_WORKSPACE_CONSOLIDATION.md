# Ω GOVERN Workspace Consolidation

## Purpose

`/govern.html` is the canonical user-facing discovery surface for platform governance and operations.

It does **not** replace specialist routes or move authority into the browser. It reduces navigation branching while preserving existing deep links.

## Canonical capability groups

- Governance: `/governance.html`
- Decision Engine: `/council.html`
- Observatory: `/observatory.html`
- Analytics: `/analytics.html`
- Monitoring: `/monitoring-dashboard.html`
- Compliance: `/compliance.html`
- Recovery: `/recovery.html`
- Control Center: `/control-center.html`
- Owner Deck: `/control-plane.html`
- Enterprise: `/enterprise.html`
- Privacy: `/privacy.html`
- Architecture: `/architecture.html`
- Platform Navigator: `/omega-platform-navigator.html`
- Maintenance: `/maintenance.html`
- Agent Operations: `/agent-operations.html`
- Platform Kernel: `/platform-kernel.html`

## Truth boundary

The workspace is a navigation and orientation layer. It must not manufacture uptime, incidents, risk scores, compliance status, backups, provider readiness, financial values, agent authority, or deployment state.

Existing server-side authorization remains authoritative:

- RLS
- owner checks
- AAL2 requirements
- service-role-only paths
- agent tool grants
- provider artifact proof
- deployment/CI gates

## Consolidation rule

A specialist page is not deleted merely because it appears in the workspace. It remains a deep-link target until its capability has been absorbed, tested, authorized, instrumented, and verified in production.

## Media canonicalization

`/media.html` is the canonical MEDIA destination. `/cinema.html`, `/movies.html`, `/publications.html`, `/series.html`, `/trailers.html`, `/universe.html`, `/visual-atlas.html`, and related specialist routes remain available as capability-specific destinations.

## Success criteria

1. Users reach governance capabilities from one predictable workspace.
2. Persistent navigation exposes the workspace rather than a flat list of operational leaf pages.
3. Existing deep links continue to work.
4. No authorization boundary is weakened.
5. No synthetic operational status is introduced.
6. The production deployment remains separately verified; a green repository branch is not evidence that the production domain has deployed it.