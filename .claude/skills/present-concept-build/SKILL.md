---
name: present-concept-build
description: Inventory-first change procedure for this repo — find the existing owner of a surface and extend it rather than building a parallel system, check the request against docs/CANONICAL_PRESENT_CONCEPT.md and docs/PRODUCTION_TRUTH_MATRIX.md for material conflicts, and refuse changes that weaken RLS, expose secrets, bypass payment/authorization or add unsafe autonomous behavior. Use before modifying the repository to add or change a platform capability, and whenever a request could duplicate or replace a working surface.
---

# Ω Present-Concept Build Skill

Before modifying the repository:

1. **Inventory** — locate existing routes, scripts, data contracts, migrations, Edge Functions, shared UI and deployment configuration related to the requested capability.
2. **Reuse** — extend the existing owner. Do not create a parallel system without an explicit migration plan.
3. **Compatibility** — preserve existing URLs, database contracts, security controls and visual language.
4. **Conflict check** — read `docs/CANONICAL_PRESENT_CONCEPT.md` and `docs/PRODUCTION_TRUTH_MATRIX.md`. Compare the requested change with current implementation and specifications. Never silently resolve a material conflict.
5. **Risk gate** — reject changes that expose secrets, weaken RLS, bypass authorization/payment verification, remove security headers, or introduce unsafe autonomous behavior.
6. **Implement minimally and completely** — make the smallest compatible change that advances the present platform; do not replace working surfaces with demos or scaffolds.
7. **Verify** — run the strongest available static, syntax, contract and runtime checks. Test affected dependencies, not only the changed file.
8. **Evidence** — update the production truth matrix when capability status changes.
9. **Diff audit** — inspect for accidental deletions, route loss, asset loss, migration errors, duplicated services and security regressions.
10. **Release classification** — use the truth labels in the canonical contract. Never claim production verification without production evidence.

## Architecture rule

Treat the current Vercel + recursive web surface + Supabase architecture as the present production baseline. Older React/Vite/12-service/Expo specifications may guide future migrations, but must not replace or fracture the current system without an explicit, tested migration.

## Product rule

Preserve Ω SYD OMEGA 91717's current identity: Ω emblem, dark-only, cinematic/futuristic presentation, 9/9.17/91717 motifs, readable typography, guided navigation, active data and the 18-module organization.

## Canon rule

When 9/12 or other canon values conflict, preserve verified current behavior and mark the conflict for decision rather than inventing a third interpretation.

## 999 rule

Treat the 999-point blueprint as a mixed production/R&D/lore source. Only safe, lawful and technically supportable capabilities become operational code. Lore remains lore.
