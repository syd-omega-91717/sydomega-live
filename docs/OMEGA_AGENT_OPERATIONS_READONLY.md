# Ω Agent Operations — Read-Only Gateway

This is the first live execution layer for the Agent Operations roadmap stage.

**Boundary:** AUTH → POLICY → VALIDATE INPUT → AUDIT AUTHORIZATION → EXECUTE READ-ONLY → VALIDATE RESULT → AUDIT COMPLETION.

Tools currently available:
- `member.context.read`
- `mission.state.read`
- `simulation.history.read`

All 12 canonical agents are explicitly bound in `agent-tools.json`. No prompt can add a tool.

No write, privileged, destructive, deployment, payment, shell, SQL, filesystem, credential or external-network tool exists in this first runtime. The Edge Function uses the caller JWT with an RLS-scoped Supabase client. Direct audit-row writes are denied; audit persistence uses a restricted authenticated RPC.

`AUTHORIZED` means policy allowed the request. `EXECUTED` means the read succeeded and the completion audit was persisted.

## Audit write boundary — 2026-09-29

The audit recorder is server-only. Authenticated browser clients do not receive EXECUTE on `omega_record_agent_operation(...)`. The Edge Function verifies the caller with the user-scoped client, then records the caller's user ID through a separate server-side Supabase service client. This prevents a signed-in member from forging agent-operation audit rows directly through the Data API.
