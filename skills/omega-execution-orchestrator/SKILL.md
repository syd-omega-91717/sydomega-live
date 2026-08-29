---
name: omega-execution-orchestrator
description: Orchestrates SYD OMEGA engineering work from evidence-backed planning through implementation, verification, deployment, rollback and post-deployment review. Use for any project-level build, repair, integration, release or architecture task.
---

# Omega Execution Orchestrator

## Mission
Turn a requested capability into an executable, observable and reversible production change without treating documentation as implementation evidence.

## Operating loop
1. Inspect the existing repository, database schema, workflows and deployment contract.
2. Identify the smallest correct building block and reuse existing infrastructure before adding services.
3. Define acceptance tests before implementation.
4. Implement code, data, security and telemetry together.
5. Run deterministic local/source checks.
6. Run integration and browser checks when the target environment is reachable.
7. Record evidence with commit/run identifiers.
8. Deploy only after gates pass.
9. Verify the deployed surface.
10. Roll back automatically when release invariants fail.

## Decision rules
- Evidence outranks assumptions.
- Existing architecture outranks speculative replacement architecture.
- A failed or zero-step CI check is not equivalent to a passed test.
- Never expose secrets or service-role credentials to browser code.
- Every state-changing operation must be idempotent where retries are possible.
- Every externally visible capability must have an owner, data source, failure strategy and observability signal.

## Required output of each execution
- changed files
- database changes
- security impact
- tests executed
- deployment result
- runtime evidence
- rollback path
- unresolved dependency, if any
