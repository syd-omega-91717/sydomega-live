# Ω SYD OMEGA 91717 — OWASP ASVS 5.0 Evidence Matrix

This matrix maps the current repository controls to ASVS 5.0 verification areas.
It is an evidence index, not a claim that every control is complete.

| ASVS area | Current evidence | Verification state | Remaining evidence |
|---|---|---|---|
| V1 Architecture | production/reachability/module contracts | Partial | architecture threat model + trust boundaries |
| V2 Authentication | auth runtime contracts; password guard tests | Partial | Supabase leaked-password protection; MFA/session journey evidence |
| V3 Session Management | auth/runtime code and Supabase integration | Partial | explicit session rotation/expiry test matrix |
| V4 Access Control | RLS audit; RBAC contracts; owner checks | Partial | full role × resource authorization matrix |
| V5 Validation/Sanitization | silent-failure and runtime contracts | Partial | centralized input validation inventory |
| V6 Stored/Reflected Injection | CodeQL + JS syntax + repository audits | Partial | browser payload test suite |
| V7 Cryptography | secret/credential scanning | Partial | cryptographic primitive inventory and key lifecycle evidence |
| V8 Error Handling | silent-failure audit | Partial | production error disclosure journey tests |
| V9 Data Protection | RLS/storage controls | Partial | retention/deletion/export evidence |
| V10 Communications | deployment/runtime controls | Partial | TLS/HSTS/CSP header evidence |
| V11 HTTP Security | production surface contract | Partial | complete security-header contract |
| V12 Configuration | CI, Renovate, workflow permissions | Partial | GitHub/Vercel/Supabase settings evidence |
| V13 Database | migrations, RLS, migration contracts | Partial | backup/restore drill + query-plan evidence for hot paths |
| V14 Business Logic | commerce/module contracts | Partial | idempotency/replay/rate-limit matrix |
| V15 Files/Resources | storage/RLS controls | Partial | upload type/size/content scanning evidence |
| V16 Digital Identity | profile/auth contracts | Partial | account recovery and identity-linking journeys |
| V17 API/Web Services | RPC security fix; reachability contracts | Partial | endpoint inventory + abuse/rate-limit evidence |
| V18 Configuration/Deployment | Vercel build contracts; GitHub workflows | Partial | authenticated production deployment evidence on current HEAD |

## Release gate

No ASVS row is considered complete merely because a scanner is green. Each row requires
a reproducible repository, runtime, or provider-side evidence artifact.
