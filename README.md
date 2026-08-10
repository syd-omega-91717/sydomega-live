<p align="center">
  <img src="icon-512.png" alt="SYD OMEGA 91717 logo" width="140" height="140">
</p>

<h1 align="center">Ω SYD OMEGA 91717</h1>
<p align="center"><b>A private, membership-gated personal operating platform</b><br>
Habits &middot; Learning &middot; Finance Tracking &middot; Media &middot; Community</p>

<p align="center">
  <a href="https://github.com/syd-omega-91717/sydomega-live/actions/workflows/ci.yml"><img src="https://github.com/syd-omega-91717/sydomega-live/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <img src="https://img.shields.io/badge/build-static%20site-informational" alt="Static site, no build step">
  <img src="https://img.shields.io/badge/backend-Supabase-3ECF8E" alt="Supabase backend">
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="Proprietary license">
</p>

---

## Table of Contents

- [Overview](#overview)
- [What It Provides](#what-it-provides)
- [How It Works](#how-it-works)
- [Access Model](#access-model)
- [Technology Stack](#technology-stack)
- [Security, Privacy & Compliance](#security-privacy--compliance)
- [Project Status](#project-status)
- [Repository Structure](#repository-structure)
- [Continuous Integration](#continuous-integration)
- [License & Legal](#license--legal)
- [Contact](#contact)

## Overview

**SYD OMEGA 91717** is a single-owner, invite-and-approval-gated personal
platform that consolidates habit tracking, learning, finance tracking, media,
and community/social tools into one consistent, themed experience. Access is
not open to the public: prospective members request access, are placed in a
pending state, and are individually approved by the platform owner before
they can use the application.

The platform is organized around a consistent visual and narrative theme —
a zodiac / elemental / mythological branding system used purely as an
information-architecture and UX device (see [Feature Domains](#what-it-provides))
to group related tools under a memorable identity, not as a claim about the
underlying technology.

## What It Provides

The platform is organized into distinct functional domains, each grouped
under a themed navigation section:

| Domain | What it covers |
|---|---|
| **Command** | Dashboard, alerts, search, in-app AI concierge |
| **Identity** | Member profile, verification, settings |
| **Ascend** | Habit tracking, academy/learning modules, achievements, exams |
| **Cosmos** | The platform's branding/persona system (zodiac, elements, agent roster) |
| **Vault** | Portfolio, ledger, subscriptions, marketplace |
| **Order** | Family/heir management, community halls, factions |
| **Services** | Consultancy, publishing, production studio, marketing, events |
| **Intel** | Research, analytics, automation, governance/compliance tools |
| **Media / Universe** | Media library, creative content hub |

Each domain is delivered as a set of standalone pages sharing one common
design system, authentication layer, and navigation shell (see
[How It Works](#how-it-works)).

## How It Works

- **Static frontend, no build step.** Every page is a self-contained HTML
  document. There is no bundler, framework, or server-side rendering — what
  is committed to the repository is exactly what is deployed.
- **Shared platform shell.** A small set of loader scripts (`bg.js`, `nav.js`)
  are included by every page. They inject the shared design system, render
  the navigation, and enforce that content only renders once a session is
  confirmed *and* the member's access has been approved.
- **Supabase backend.** All data (profiles, progress, finance records,
  content, community data) is stored in Postgres and accessed directly from
  the client through the Supabase JS client. Authorization is enforced at
  the database layer via Postgres Row Level Security (RLS) policies, not by
  application code — this is the platform's actual security boundary.
- **Approval-gated onboarding.** New accounts start in a pending state.
  The platform owner reviews and approves (or rejects) each request before
  full application access is granted.
- **Serverless functions.** A small set of Supabase Edge Functions handle
  payment processing (Stripe checkout and webhooks) and the server-side AI
  concierge integration, keeping all secret keys off the client entirely.

## Access Model

This is **not** an open public sign-up product. There is exactly one owner
account with elevated administrative access across the platform, and all
other accounts are members who must be individually approved. If you have
received an invitation, use the account request flow in the application;
access outside of that process is not available.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML / CSS / vanilla JavaScript (no framework) |
| Hosting | [Vercel](https://vercel.com) (static file serving) |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Edge Functions) |
| Authorization | PostgreSQL Row Level Security (RLS) |
| Payments | [Stripe](https://stripe.com) (via Supabase Edge Functions) |
| AI | Server-side Anthropic API integration (Supabase Edge Function) |
| CI | GitHub Actions |

## Security, Privacy & Compliance

- **Row Level Security everywhere.** Every table that stores member data is
  protected by RLS policies; CI fails the build if a table is found without
  one.
- **No secrets in client code.** Payment keys, AI provider keys, and other
  service secrets are stored exclusively as Supabase/Vercel environment
  secrets and are never committed to the repository or shipped to the
  browser. CI scans every push for accidental exposure of privileged keys.
- **Data subject rights.** The in-app Privacy Centre implements consent
  management and data-subject request handling aligned with:
  - **GDPR (Regulation (EU) 2016/679)** — Articles 5, 6, 7, 15–22, and 25
    (lawful basis, consent, right of access, rectification, erasure,
    portability, and privacy-by-design).
  - **CCPA/CPRA (California Consumer Privacy Act, as amended)** — right to
    know, delete, and opt out; no sale of personal information.
  - Account erasure requests are logged and fulfilled within the
    disclosed retention window.
- **Payments.** Stripe integration follows Stripe's own PCI-compliant
  hosted-checkout model; card data never transits or is stored by this
  platform directly.

Full details are published in-app at `/privacy.html` and `/terms.html`.

## Project Status

This platform is under active, ongoing development by its owner. Some
subsystems are intentionally shipped **dormant** behind feature flags until
they are legally and operationally ready (for example, the in-app token
economy, gated by `platform_settings.tokens_enabled`) — user-facing copy for
any not-yet-active feature is written in the future tense until it is
switched on. This is a deliberate policy documented in [`CLAUDE.md`](CLAUDE.md),
which also tracks current known limitations and in-progress work.

## Repository Structure

```
/                    ~250 standalone .html pages, one per feature/page
bg.js                Shared design system, auth guard, and module loader
nav.js                Sidebar/navigation rendering
omega-*.js           Feature modules (auth, AI copilot, charts, progress, PWA, etc.)
omega-*.json         Static configuration and content data
supabase/*.sql       Database schema (tables, functions, RLS policies)
supabase/functions/  Edge Functions (checkout, Stripe webhook, AI concierge, etc.)
scripts/             Repository tooling (integrity audit, secret checks)
.github/workflows/   CI pipeline
```

See [`CLAUDE.md`](CLAUDE.md) for a complete engineering orientation,
[`REPOSITORY_AUDIT.md`](REPOSITORY_AUDIT.md) for a structural audit, and
[`CAPABILITY_INVENTORY.md`](CAPABILITY_INVENTORY.md) /
[`GAP_ANALYSIS.md`](GAP_ANALYSIS.md) for what is fully implemented versus
still in progress.

## Continuous Integration

Every push and pull request to `main` runs an automated pipeline that:

1. Syntax-checks every JavaScript file.
2. Runs a repository integrity audit (module graph, RLS coverage,
   duplicate-definition checks).
3. Verifies every local asset reference resolves to an existing file.
4. Scans for accidental exposure of privileged service credentials.
5. Type-checks all Edge Functions.
6. Validates the PWA manifest and service-worker asset lists.

A pull request is not mergeable unless this pipeline passes.

## License & Legal

This repository and the SYD OMEGA 91717 name, marks, cosmology, design
system, and codebase are the proprietary property of the platform owner.
No license is granted to copy, redistribute, or create derivative platforms
from this code. Membership in the deployed application grants a limited
license to use the platform under its published Terms & Conditions
(`/terms.html`) — it does not grant any rights to this source repository.

All rights reserved. See `/terms.html` and `/privacy.html` in the deployed
application for the full legal terms, including the platform's DMCA-style
notice-and-takedown process for copyright claims.

## Contact

For access requests, support, or legal inquiries, use the contact channels
published in the deployed application (`/terms.html`, `/privacy.html`).
This repository does not accept external pull requests or issues.
