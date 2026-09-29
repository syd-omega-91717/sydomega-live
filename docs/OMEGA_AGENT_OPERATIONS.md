# Ω SYD OMEGA 91717 — Governed Agent Operations

## Purpose
This layer implements the roadmap boundary after Simulation Arena:

`AGENT → TOOL → POLICY → PROPOSAL → APPROVAL → AUDIT`

It deliberately stops before execution. There is no arbitrary shell, HTTP, filesystem, deployment, financial, credential or permission executor connected to this page.

## Tool registry
The live catalog contains six governed proposal types:
- World state read
- Mission state read
- Evidence/provenance read
- Deterministic simulation
- Governed data-export request
- Deployment-verification request

Each record carries risk, permission, network/filesystem/database access, mutation flag, approval requirement, execution status, audit event type and rollback policy.

## Policy
Risk maps to existing policy-engine rules:
- READ → `agent:risk_read`
- ANALYZE → `agent:risk_analyze`
- WRITE → `agent:risk_write`
- PRIVILEGED → `agent:risk_privileged`
- EXTERNAL → `agent:risk_external`
- DESTRUCTIVE → `agent:risk_destructive`

The proposal RPC validates the tool against the server registry and calls `evaluate_policy`. Destructive requests are blocked. All accepted proposals are persisted as member-owned records.

## Approval
Only the canonical platform owner can approve or reject a pending proposal. Approval is recorded as `APPROVED_FOR_FUTURE_EXECUTOR`, explicitly not as execution.

## Audit
Proposal creation emits `action_started` through the existing `omega_platform_events` fabric. Policy evaluation is recorded in `policy_eval_log`. Owner decisions emit `action_completed`.

## Security
- RLS enabled.
- Members can read only their own proposals.
- Owner can review all proposals.
- Direct proposal table writes are revoked.
- Public RPCs are authenticated bridges to private SECURITY DEFINER helpers.
- Input snapshots are object-only and capped at 12 KB.
- No browser service-role or secret keys.
- No arbitrary executor exists.

## Verification state
Implemented and live schema-applied. The browser surface still requires authenticated runtime verification. Tool execution remains intentionally unavailable until a separate executor contract exists.
