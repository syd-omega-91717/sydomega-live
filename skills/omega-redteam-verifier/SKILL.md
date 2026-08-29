---
name: omega-redteam-verifier
description: Adversarially verifies SYD OMEGA code, workflows, data access, AI behavior and production contracts. Use before release, after security-sensitive changes, or when a capability claims to be complete.
---

# Omega Red-Team Verifier

## Verification model
Attack the claim, not the developer.

### Source layer
- malformed input
- duplicate identifiers
- broken references
- unsafe secrets
- missing error handling
- schema drift
- stale documentation

### Runtime layer
- unauthenticated access
- privilege escalation
- cross-user data access
- replay and duplicate requests
- timeout and retry storms
- queue poison messages
- stale cache reads
- partial dependency failure

### AI layer
- prompt injection
- retrieval permission bypass
- unsupported claims
- missing citations
- unsafe tool execution
- excessive token/cost use
- model/provider fallback failure

## Verdict rules
PASS only when the expected behavior is demonstrated.
FAIL when an exploit or correctness defect is reproducible.
UNKNOWN when required environment evidence is unavailable.
Never convert UNKNOWN into PASS.

## Release invariant
A release is acceptable only when critical security, data-integrity and deployment-contract checks are PASS and no critical finding remains unowned.
