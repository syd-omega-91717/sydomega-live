# SYD OMEGA 91717 — Architecture Evolution Contract

## Purpose

This document is the engineering source of truth for improving the platform without breaking the currently deployed architecture.

## Current implementation boundary

The production web surface is treated as a framework-free static application. Supabase is the authoritative managed data/auth platform. New capabilities must integrate with this boundary unless a measured migration is approved and verified.

The older blueprints describe a React/Vite, Express, Redis, Prisma, multi-service and mobile architecture. Those documents remain product/architecture requirements and historical design intent; they are not evidence that those components currently exist in production.

## Evolution rules

1. Preserve existing working behavior before introducing replacement architecture.
2. Prefer modular boundaries over premature distributed services.
3. Introduce queues, workers, event streams, Redis, containers, Kubernetes or mobile clients only when a concrete requirement and operational contract justify them.
4. Every new capability requires implementation, automated verification, integration verification where applicable, documentation, and rollback strategy.
5. No production secret belongs in source, documentation examples, or frontend bundles.
6. Security controls are fail-closed for privileged and irreversible operations.
7. AI agents operate through explicit capability/tool bindings and approval boundaries.
8. External providers are adapters, not architectural dependencies embedded throughout the application.
9. UI improvements must preserve accessibility, responsive behavior and reduced-motion support.
10. Every release must produce deterministic build artifacts before deployment.

## Target capability layers

### Experience
- Unified visual system
- Responsive navigation
- Accessibility and reduced motion
- Localization
- Progressive enhancement
- Error/loading/empty states

### Application
- Identity and authorization
- Module contracts
- Payments and commerce
- Search and discovery
- Media and gaming
- Notifications
- User/profile/family data

### Intelligence
- Intelligence Fabric
- Governed agent registry
- Model routing
- Policy firewall
- Evidence/proof engine
- Retrieval and knowledge services
- Human approval boundaries

### Data
- Supabase PostgreSQL
- RLS and least privilege
- Migration discipline
- Index governance
- Audit/event records
- Backup and recovery evidence

### Operations
- GitHub Actions
- Static artifact validation
- Security scanning
- Production smoke tests
- Observability
- Controlled Vercel deployment
- Rollback and incident procedures

## Release gate

A change is release-eligible only when:

`source integrity -> architecture contract -> application tests -> artifact build -> security checks -> integration checks -> production verification`

is green for the applicable scope.

A green CI check does not by itself prove third-party production services, payments, AI providers, or disaster recovery. Those require explicit integration evidence.

## Trusted extension policy

New connectors, plugins, libraries and skills are admitted only when:

- the provider is identifiable and reputable;
- the official documentation is available;
- permissions are minimized;
- secrets are stored outside source control;
- the integration can be isolated behind an adapter;
- automated tests cover failure and timeout behavior;
- removal does not corrupt core data;
- licensing is compatible with the project.

The project should prefer official first-party integrations and established open-source projects with active maintenance over unverified packages or copied code.
