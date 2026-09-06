# SYD OMEGA 91717 — Strix Adversarial Security Verification Contract

## Purpose

Strix is an **external security-verification layer** for SYD OMEGA 91717. It complements the repository's deterministic static security baseline with authorized dynamic/adversarial testing.

The integration is deliberately outside the application runtime. Strix must never become a dependency of `bg.js`, `nav.js`, browser bundles, Supabase runtime code, or the Vercel static artifact.

## Evidence model

OMEGA security evidence is separated into four states:

- **VERIFIED** — directly demonstrated by an automated test or runtime observation.
- **PARTIALLY_VERIFIED** — some controls are demonstrated, but required runtime conditions are missing.
- **UNVERIFIED** — documented or configured, but not demonstrated.
- **FAILED** — a required control was tested and did not pass.

A Strix report is evidence only for the target, commit/build, configuration, and scan scope actually tested.

## Authorization boundary

Never scan a live or third-party target unless explicit authorization exists for that target and scope.

Default sequence:

1. Repository/source scan.
2. Local or isolated staging runtime.
3. Controlled staging Supabase project/data.
4. Only then, if explicitly authorized, a bounded production assessment.

Production scans are **not** an implicit consequence of a merge or deployment.

## Recommended scan coverage

Prioritize the security boundaries most relevant to OMEGA:

### Authentication and session security

- authentication bypass
- session/token handling
- privilege escalation
- MFA/2FA enforcement paths
- logout/session invalidation

### Authorization and Supabase

- IDOR/BOLA
- row-level security bypass attempts
- role/owner boundary bypass
- function-level authorization
- excessive data exposure
- unsafe RPC/PostgREST access
- mass assignment

### Browser/client security

- reflected/stored/DOM XSS
- unsafe navigation and redirects
- CSP/security-header regressions
- mixed content
- sensitive browser exposure

### API and business logic

- OWASP API Security Top 10 classes applicable to the system
- rate-limit/resource-consumption weaknesses
- workflow/state manipulation
- subscription/entitlement bypass
- approval/owner-control bypass
- dormant monetization feature activation through unauthorized paths

### File and storage boundaries

- unauthorized Storage object access
- upload validation weaknesses
- path/object enumeration
- content-type and download handling

## Scan modes

Use the smallest scan that provides useful evidence:

- **Quick / diff-scoped:** pull requests and changed security-sensitive surfaces.
- **Standard:** release candidates against a controlled staging target.
- **Deep:** scheduled or explicitly authorized comprehensive assessment.

A scan must record the target, commit/build identifier, scope, scan mode, timestamp, and result artifacts.

## Secret handling

For self-hosted Strix, LLM credentials belong only in a secure environment such as GitHub Actions Secrets or a protected local environment.

Expected variables may include:

- `STRIX_LLM`
- `LLM_API_KEY`

Never place an OpenAI/Anthropic/provider key in:

- repository source
- HTML/JS browser bundles
- documentation examples containing real credentials
- Supabase client configuration
- chat messages
- committed `.env` files

The existing static security baseline remains authoritative for detecting credential-shaped material on browser-delivered surfaces.

## Failure policy

Do not suppress a validated security finding merely to obtain a green build.

- **Critical:** release-blocking; remediate and re-test.
- **High:** release-blocking unless a documented security owner accepts the risk.
- **Medium:** triage, remediate or formally accept with evidence.
- **Low/Informational:** track and improve where appropriate.

A finding is closed only after the remediation is re-tested and the original attack path is no longer reproducible.

## OMEGA proof integration

Strix output should be treated as an external evidence source for the OMEGA proof/evidence system, not as an authority that changes application state.

Minimum evidence record:

```text
engine=strix
engine_version=<recorded version>
target=<authorized target identifier>
commit=<tested commit/build>
scan_mode=<quick|standard|deep>
scope=<recorded scope>
started_at=<UTC timestamp>
completed_at=<UTC timestamp>
status=<completed|failed|blocked>
findings=<count by severity>
artifact=<SARIF/JSON/report reference>
```

The evidence layer must not claim that a target is secure merely because Strix completed successfully. Completion is not equivalent to absence of vulnerabilities.

## CI/CD integration boundary

The repository already has multiple release and contract workflows. Strix should be introduced as a **security verification gate**, not as another deployment mechanism.

Until workflow ownership is explicitly assigned, this document is the integration contract and the application remains Strix-independent. A future workflow implementation should:

1. run only on authorized repository/staging targets;
2. use least-privilege permissions;
3. keep provider keys in GitHub Secrets;
4. avoid triggering Vercel deployments;
5. preserve existing release/deployment ownership boundaries;
6. emit machine-readable evidence (preferably SARIF where supported);
7. fail only on the defined severity policy;
8. retain scan artifacts for auditability;
9. require remediation followed by re-scan for release-blocking findings.

## What this does not claim

This contract does **not** prove:

- that Strix is installed in the repository environment;
- that a Strix scan has been executed;
- that `www.sydomega.com` is secure;
- that Supabase RLS/Auth/Storage are secure in the live project;
- that Stripe or Edge Functions are secure;
- that all production endpoints are reachable;
- that a clean scan means zero vulnerabilities.

Those statements require corresponding runtime evidence.

## Relationship to the existing security baseline

`python scripts/omega_security_baseline.py` remains the deterministic source/configuration gate. It checks controls that can be proven without production credentials, including security headers/CSP, browser-delivered credential-shaped material, mixed content, `bg.js` syntax, PWA contract files, and feature-gating markers.

Strix is the next evidence layer: **static invariants → authorized dynamic/adversarial verification → remediation → re-test**.
