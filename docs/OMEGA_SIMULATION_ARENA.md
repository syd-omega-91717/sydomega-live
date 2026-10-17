# Ω SYD OMEGA 91717 — Simulation Arena

## Purpose
A controlled what-if environment implementing the next roadmap layer after Event Fabric → Evidence → Mission State → Realtime World.

## Runtime contract
`MODEL → VERSION → INPUT SNAPSHOT → DETERMINISTIC SEED → RESULT SNAPSHOT`

The page supports three deterministic scenario models:
- Realm Balance
- Mission Route
- Arena Resilience

The current engine is deliberately lightweight and fixed-seed. It is not a financial forecast, historical replay, authorization mechanism, achievement engine, or production-balance calculator.

## Persistence
Saved runs are member-owned rows in `public.omega_simulation_runs`.
- RLS permits SELECT only for the owning authenticated member.
- Direct INSERT/UPDATE/DELETE is denied.
- `omega_record_simulation_run(...)` validates the caller and snapshots, then inserts the row.
- The UI labels output `SIMULATED` and never treats it as production truth.

## Visual translation
The surface uses measured source-DNA patterns from the extended owner collections:
- concentric rings as the visual unit;
- gold/obsidian for authority/identity;
- cyan for intelligence/system state;
- cinematic stage language without making animation mandatory.

The source artwork itself is not required for the simulation to operate. This avoids shipping defective raw JPEGs as functional state while preserving the visual vocabulary extracted from them.

## Safety
No localStorage state, no client-side achievement grants, no permission mutation, no financial ledger mutation, no NFT/credential issuance and no claims of predictive certainty.

## Lifecycle
`SPECIFIED → IMPLEMENTED → PERSISTED → SECURED → TESTED`

Deployment and live browser verification remain separate evidence requirements.


## Server-side write guardrails — pending review

The pending migration `20261017114500_member_rpc_write_guardrails_20261017.sql` tightens the current RPC contract without changing the UI's simulation semantics:
- Accept only the three shipped model keys and model version `1.0.0`.
- Validate the deterministic seed, input ranges, output metrics, and trace length/range on the server.
- Limit saved simulation runs to 20 per authenticated member per hour.
- Serialize world-action writes per member, make duplicate retries race-safe, and cap action-start events at 120 per member per minute.
- Preserve the existing narrow `SECURITY DEFINER` boundary, pinned empty `search_path`, explicit `auth.uid()` checks, and deny-by-default direct table writes.

**Release status:** this migration is registered as `PENDING_REVIEW / NOT_APPLIED` and blocks production until reviewed, replayed, and explicitly applied. The repository record is not evidence that production has these new limits yet.