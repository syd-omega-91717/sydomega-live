---
name: omega-production-verification
description: Evidence-first verification workflow for Ω SYD OMEGA 91717 covering static checks, browser behavior, Supabase contracts, Vercel deployment state, links, security, and release evidence.
---

# Ω PRODUCTION VERIFICATION

## Mission

Prove what works. Separate repository evidence, runtime evidence, and production evidence. Never infer production readiness from source code alone.

## Verification layers

### Layer 1 — Repository integrity

Run the repository's existing audit and contract checks first. Prefer the project's own scripts over generic replacements. Confirm:
- JavaScript syntax;
- asset references;
- secrets/service-role scans;
- schema dictionary;
- i18n contract;
- capability/evidence gates;
- PWA assets;
- Edge Function syntax where applicable.

### Layer 2 — Browser

When a dev server or deployment is available, verify the real rendered page:
1. open the home route;
2. wait for network idle;
3. confirm body has meaningful content;
4. inspect console/runtime errors;
5. inspect interactive controls;
6. exercise primary navigation;
7. test a representative deep route;
8. capture screenshots when visual work is involved.

Use `agent-browser` / Playwright or the repository's existing verification harness. Do not claim a browser PASS from HTML inspection alone.

### Layer 3 — Backend

For Supabase-backed features:
- verify the configured project identity;
- verify queries against the repository's live-schema snapshot;
- verify reads and writes return explicit errors;
- verify RLS assumptions;
- verify Edge Function source syntax;
- never expose service-role credentials;
- never apply production migrations from this skill.

### Layer 4 — Vercel

For Vercel work, distinguish:
- repository binding;
- production branch;
- build command/output directory;
- environment variable names and scope;
- integration resources;
- deployment status;
- domain assignment;
- actual HTTP response.

A successful GitHub commit is not a Vercel deployment. A Vercel deployment is not production-verified until the production URL is exercised.

### Layer 5 — User journey

Verify the minimum critical journey:

`entry → gateway/auth → approved/member surface → navigation → data surface → primary action → persistence/result`

For public pages, verify that signed-out access remains public. For gated pages, verify that the gate does not flash protected content before approval.

## Failure classification

- **BUILD** — source/build problem.
- **RUNTIME** — browser/application problem.
- **DATA** — schema/RLS/persistence problem.
- **DEPLOY** — Vercel/Git/integration problem.
- **DOMAIN** — DNS/custom-domain problem.
- **SECURITY** — secret/auth/policy issue.
- **EVIDENCE GAP** — implementation exists but could not be exercised.

## Reporting

Use a compact matrix:

| Surface | Evidence | Result |
|---|---|---|
| Repo | exact check | PASS/FAIL |
| Browser | exact route | PASS/FAIL |
| Backend | exact operation | PASS/FAIL/UNVERIFIED |
| Vercel | exact deployment | PASS/FAIL/UNVERIFIED |
| Domain | exact URL | PASS/FAIL/UNVERIFIED |
| Critical journey | exact steps | PASS/FAIL/UNVERIFIED |

## Release gate

Do not call the project production-ready unless the requested release scope has:
- no blocking repository failures;
- browser evidence for the critical surface;
- backend evidence for data-dependent features;
- a READY deployment when deployment is in scope;
- working production domain when domain is in scope;
- no unresolved security-critical issue;
- explicit documentation of any remaining unverified item.
