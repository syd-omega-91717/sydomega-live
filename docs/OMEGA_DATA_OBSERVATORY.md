# Ω Data Observatory
## Purpose
A read-only member-facing operational surface over the canonical product-reality read models.

## Authoritative sources
- `omega_platform_product_reality`
- `omega_member_product_reality`
- Supabase Auth session for member scope

## Truth rules
- **LIVE**: the read model returned successfully from production.
- **CALCULATED**: coverage is derived from observed non-zero tracked domains.
- **OBSERVED ZERO**: no production records were observed; this is a gap, not synthetic activity.
- **UNAVAILABLE**: the source or authorization could not be read.
- The surface never writes product state, grants permissions, creates financial state, or upgrades simulation/lore to live truth.

## Product activation rule
An empty domain becomes production only after its authoritative provider/database record, authorization, failure handling, event/evidence linkage, automated verification, and production smoke evidence exist.

## Scope
The observatory covers platform missions, capabilities, events, evidence, knowledge, marketplace and Stripe webhook evidence plus member-scoped activity, missions, memory and commerce counts. It intentionally reports zeros rather than manufacturing KPIs.