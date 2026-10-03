# Ω SYD OMEGA 91717 — Architecture Convergence Contract

## Purpose

This is the implementation contract for evolving the existing production estate without destructive wholesale replacement.

Inputs:
1. Existing runtime: the framework-free web estate, Supabase/Postgres/RLS/Edge Functions/Storage, Stripe paths, shared visual/runtime modules, tests and deployment configuration.
2. Target architecture: typed domain contracts, stronger service boundaries, AI orchestration, progression, media/gaming, mobile, observability, security, compliance and scale.

The target architecture is implemented by convergence, not by blindly rebuilding working systems.

## Non-negotiable rules
- One runtime authority per domain.
- Preserve verified behavior before replacing it.
- No duplicate authentication/session authority.
- No duplicate payment authority.
- No second WebGL renderer/context.
- No browser-exposed provider secrets.
- No client-only shadow of authoritative progression, entitlement or financial state.
- No schema migration is complete until live verification exists.
- No production claim without repository, deployment and backend evidence.
- Narrative/lore remains separate from operational claims.
- New architecture must reduce risk or increase capability.

## Domain authority map

| Domain | Current authority | Evolution target | Conflict rule |
|---|---|---|---|
| Navigation | nav.js + page routing | shared navigation contract | no competing global nav registry |
| WebGL / 3-D | omega-sculpture.js | data-driven realm scenes | one renderer/context owner |
| Canon | omega-canon.js + canonical data | typed canonical contract | no competing canon |
| Auth/session | Supabase auth path | hardened session gateway | no parallel session authority |
| Authorization | Supabase RLS + guardian/threat layers | policy + server enforcement | RLS remains data boundary |
| Progression | existing task/RPC model | 729-node progression engine | server/database authoritative |
| Payments | Stripe checkout/webhook | entitlement ledger | webhook/server authoritative |
| Content | existing media/publication pipeline | typed content graph | no duplicate content store |
| AI | Edge/provider gateway as it matures | provider gateway + agent orchestrator | provider keys server-side |
| Notifications | existing notification mechanisms | event-driven delivery | idempotent events |
| Storage | Supabase Storage | governed asset service | policy-controlled access |
| i18n | i18n.js | locale contract | no page-local translation engines |
| Analytics | existing telemetry/analytics | unified event taxonomy | privacy-aware events |

## Delivery ladder

### A — Evidence
Inventory repository, live backend, deployment and external integrations.
### B — Integrity
Consolidate schema/RLS/function authorities; eliminate silent writes; add type/runtime validation.
### C — Experience
Improve IA, readability, accessibility, loading/error/empty states and responsive behavior.
### D — Events
Connect existing mechanisms through idempotent domain events and notifications.
### E — AI
Introduce provider gateway, agent registry, memory/RAG, tool permissions and evaluation.
### F — Universe
Make games/media/characters/progression/3-D data-driven and interconnected.
### G — Commerce
Harden subscriptions, entitlements, creator economy, marketplace and certificates/passport.
### H — Scale
Add caching/queues where measured need exists, performance budgets, observability, backups and restore drills.
### I — Mobile
Build Expo from proven domain contracts rather than duplicating business logic.
### J — Enterprise release
Security, privacy, accessibility, compliance, dependency/SBOM, canary and rollback evidence.

## Status vocabulary
- VERIFIED — demonstrated with explicit evidence.
- IMPLEMENTED_UNVERIFIED — code exists but live verification is missing.
- PARTIAL — material implementation exists but the contract is incomplete.
- DORMANT — code/data exists but is not active in a meaningful runtime path.
- DUPLICATED — more than one competing authority exists.
- CONFLICTING — authorities disagree in behavior or schema.
- PLANNED — specified but not implemented.
- LORE — creative concept intentionally not represented as an operational capability.

## Definition of done
A domain is not complete because files exist. It is complete only when:
1. canonical authority is identified;
2. data contract is explicit;
3. security boundary is explicit;
4. runtime path is exercised;
5. failure path is tested;
6. observability is present;
7. deployment path is verified;
8. duplicate/legacy authorities are removed or explicitly quarantined;
9. documentation matches implementation;
10. rollback is possible.

## Immediate implementation rule
Every enhancement must identify: feature -> authority -> data -> security -> UI -> integration -> tests -> deployment evidence.
If any link is missing, the work is incomplete.