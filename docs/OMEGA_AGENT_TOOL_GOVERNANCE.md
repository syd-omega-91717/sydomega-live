# Ω SYD OMEGA 91717 — Agent Tool Governance

Inspired by LangChain tool contracts and Open Interpreter execution boundaries.

## Tool record

Every agent tool must declare:
- stable tool ID;
- human-readable purpose;
- input schema;
- output schema;
- required permission;
- risk level;
- external network access;
- filesystem access;
- database access;
- mutation capability;
- timeout;
- audit event;
- rollback/compensation behavior.

## Default-deny execution

An agent cannot execute arbitrary shell, Python, JavaScript, SQL, HTTP, filesystem or deployment operations merely because a prompt requests them.

Tool access is granted by explicit policy.

## Risk classes

- READ: retrieve non-sensitive information.
- ANALYZE: compute over already-authorized information.
- WRITE: modify user/project state.
- PRIVILEGED: use service credentials or administrative APIs.
- EXTERNAL: contact an external service.
- DESTRUCTIVE: delete, revoke, deploy, rotate or otherwise create irreversible impact.

Higher-risk tools require stronger authorization and audit evidence.

## Execution envelope

Every future tool runner should enforce:

AUTH → POLICY → VALIDATE INPUT → RATE LIMIT → TIMEOUT → EXECUTE → VALIDATE OUTPUT → AUDIT

No direct prompt-to-shell path.

## Open Interpreter-inspired boundary

Local code execution, when ever enabled, must run in an isolated worker with:
- no default host filesystem access;
- no default secrets;
- no unrestricted network;
- CPU/memory/time limits;
- explicit allowed commands;
- captured stdout/stderr;
- deterministic job ID;
- cancellation;
- audit trail.

## Agent orchestration

The existing 12 OMEGA agents remain the product-level identities. An orchestration library may be used internally later, but it must not become a second authority for:
- users;
- permissions;
- financial balances;
- achievements;
- credentials;
- ownership.

Those remain in existing authoritative systems.
