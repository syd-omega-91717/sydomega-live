# Ω Product Reality Read Models

## Purpose

Expose observed product state without creating a second source of truth.

The read models derive member and platform product indicators from existing canonical production tables: profiles, omega_platform_events, omega_platform_evidence, task_completions, omega_member_mission_state, ai_memory, ai_memory_embeddings, analytics_events, knowledge_spaces, knowledge_documents, marketplace_listings, marketplace_orders, payments, subscriptions, omega_missions, capability_registry, and stripe_webhook_events.

## Truth rules

- A count is observational, not a KPI claim.
- Zero means no observed production records.
- No seed activity is generated.
- No balances, revenue, achievements, users, orders, or transactions are fabricated.
- Member read models are restricted to authenticated access and derive member-owned records.
- Platform counts are derived from canonical tables and are not an authorization mechanism.
- Provider configuration and payment readiness remain separate from these read models.

## Member surface

life.html consumes omega_member_product_reality through omega-product-reality.js.

The surface exposes events, evidence, tasks, missions, active/completed missions, AI memory, embeddings, knowledge documents, marketplace listings/orders, payments, and subscriptions.

Each value is explicitly marked as observed production state.

## Why this is the next product step

The existing platform already has event, evidence, mission, AI, knowledge, marketplace and commerce structures. This change makes those structures consumable as one governed product read model without introducing a parallel data architecture.

## Verification

Run: node scripts/tests/test_omega_product_reality.js

Expected: OMEGA_PRODUCT_REALITY=PASS
