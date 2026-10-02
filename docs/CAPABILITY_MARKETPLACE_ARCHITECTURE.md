# Ω SYD OMEGA 91717 — Capability Marketplace & Intelligence Fabric

## Why this exists

The project already defines a broad ecosystem of modules, AI agents, services,
data systems, integrations, research, commerce and governance. The next
structural step is to stop treating these as isolated pages.

SYD OMEGA should become a **capability platform**.

A capability is a governed unit consumed by a human through an application
flow, another service through an API, an AI agent through a tool interface, an
automation through a workflow, or an enterprise customer through a contract.

The canonical registry is `config/omega-capability-catalog.json`.

## Capability classes

### Experience capabilities
Pages, dashboards, portals, profiles, command surfaces, search, publishing,
academy, achievements, media and communication.

### Business capabilities
Consultancy, reports, subscriptions, payments, referrals, marketplace,
enterprise licensing, partnerships, publishing and service booking.

### Data products
Identity, progression, 729-node matrix, governance, financial ledger,
portfolio, achievements, media metadata, research corpus, analytics,
knowledge graph and audit evidence.

A data product has an owner, purpose, schema, quality contract, sensitivity
classification, retention policy and permitted consumers.

### Intelligence capabilities
The 12-agent architecture becomes a governed workforce rather than 12
independent prompts. Each agent consumes registered tools and data products
through explicit permissions.

### Execution capabilities
Queues, workers, scheduled jobs, notifications, payment processing,
reconciliation, media processing, document generation, search indexing,
recommendations and approved agent actions.

### External integrations
Stripe, Supabase, Vercel, Cloudflare, model providers, communication
providers, media systems and other approved integrations are registered as
dependencies with health, credentials, limits, cost and failure behavior.

## New user-facing product: Omega Capability Store

Create a discoverable service marketplace inside the platform.

A user or enterprise can browse Services, Reports, AI assistants, Agents,
Data products, Research, Courses, Media tools, Automation and Integrations.

Every item exposes:

**What it does → who can use it → what it costs → what data it needs → what it
returns → expected latency → limits → privacy/security class → evidence →
support → status.**

This converts the platform from a collection of pages into an ecosystem with
a coherent commercial and technical supply side.

## Agent-facing discovery

Agents should never receive unrestricted access to the platform.

The registry answers:

1. What capabilities exist?
2. Which are approved?
3. Which are compatible with this agent?
4. Which are allowed for this user/session?
5. What data may be passed?
6. What will the action cost?
7. What approval is required?
8. What evidence will be recorded?

Default agent access is DENY.

## Service contracts

Every registered capability should eventually have:

- stable ID
- semantic version
- owner
- purpose
- lifecycle status
- audience
- authorization policy
- data classification
- input schema
- output schema
- dependencies
- emitted/consumed events
- rate limit
- cost model
- observability requirements
- evidence
- rollback procedure

## New platform primitives

### Identity Fabric
One identity layer across users, sessions, agents, services, enterprises and
external integrations.

### Policy Engine
Central authorization decisions for role, resource, action, data class, risk,
geography, subscription and approval state.

### Event Fabric
Canonical events for identity, commerce, progression, governance, AI,
content, notifications and operations.

### Ledger
Immutable financial and entitlement events with idempotency and reconciliation.

### Knowledge Fabric
Research documents, structured knowledge, semantic relationships, provenance,
embeddings and retrieval policies.

### AI Gateway
One governed interface to approved models and agents with routing, budgets,
quotas, privacy controls, evaluation and observability.

### Workflow Engine
Long-running jobs with retries, schedules, compensation, human approvals and
durable execution state.

### Observability Fabric
Unified traces, logs, metrics, audit records, business KPIs and AI telemetry.

### Trust Center
Public/private evidence for security, privacy, uptime, deployment state, data
practices, compliance controls and incident communication.

## Revenue expansion

The source documents already identify subscriptions, enterprise licensing,
partnerships, marketplace architecture and publishing.

The capability model lets those become measurable products:

- consumer subscriptions
- premium AI/agent usage
- enterprise workspaces
- paid consultancy
- report/research sales
- marketplace commissions
- API usage
- automation/workflow usage
- media/content services
- partner integrations
- enterprise data products

Do not activate financial products merely because they exist in the vision.
Each must pass legal, risk, payment, accounting and reconciliation gates.

## 729-node evolution

The 729-node system should become more than a progress display.

Each node can eventually be a typed learning/work/action object with
prerequisite graph, learning material, task, verification method, evidence,
score, achievement, entitlement, recommended next action, agent assistance and
analytics.

This turns progression into a reusable product engine.

## Research-to-product pipeline

Research should flow through:

**source → extraction → provenance → knowledge object → review → capability
proposal → implementation → evaluation → publication → monitoring.**

This gives the platform a compounding knowledge advantage without presenting
unverified research as truth.

## Enterprise customer model

Add an enterprise boundary around the same capability fabric:

- organization
- workspace
- members
- teams
- roles
- policies
- billing account
- quotas
- data residency
- audit stream
- approved models
- approved agents
- approved integrations
- service catalog
- support/SLA

## Major architectural shift

The goal is not more pages.

It is more reusable capabilities with fewer duplicated systems.

One payment service should power subscriptions, publishing, consultancy,
marketplace transactions and future products.

One identity/policy system should govern users, organizations, agents and
services.

One event fabric should connect commerce, progression, AI, communication and
operations.

One evidence model should explain what exists, what was tested and what is
actually live.

That is how the project can expand without becoming unmaintainable.
