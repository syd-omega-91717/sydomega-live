# Ω SYD OMEGA 91717 — Domain / Role / Data / Task Registry

This registry converts the manifesto into executable ownership. A domain is not considered complete merely because a page exists; it must have a real data path and operational task set.

| Domain | Primary role | Existing production data | Required task stream |
|---|---|---|---|
| Identity | Trust boundary | `profiles`, `sessions`, `devices`, `roles`, `permissions`, `access_audit` | authentication, authorization, session security, audit |
| Subscription | Commercial lifecycle | `subscriptions`, `billing_plans`, `billing_invoices`, `billing_features` | plan lifecycle, entitlements, invoices, renewal evidence |
| Search | Discovery | `search_index`, `interest_signals`, `content_recommendations` | indexing, ranking, freshness, safe filtering |
| Payments | Transaction processing | `payments`, `wallet_transactions`, `webhook_logs` | reconciliation, webhook verification, transaction evidence |
| Consultancy | Professional services | `consult_requests`, `expert_bookings`, `meetings`, `meeting_participants` | intake, assignment, scheduling, delivery, audit |
| Gaming | Progression and competition | `matrix_progress`, `leaderboard_snapshots`, `medals`, `trophies`, `task_completions` | missions, progression, scoring, rewards, anti-abuse |
| Character | Identity/creative layer | `character_records`, `bloodline_nodes`, `family_nodes` | character state, relationships, progression, provenance |
| Media | Streaming/content operations | `media_items`, `media_reservations`, `content_versions`, `content_recommendations` | ingest, metadata, rights, playback state, recommendations |
| Achievement | Recognition | `medals`, `trophies`, `sovereign_points_ledger`, `point_perks` | qualification, awards, ledger integrity, redemption |
| Family | Relationship graph | `family_nodes`, `bloodline_nodes` | graph integrity, privacy, consent, lineage provenance |
| Horoscope / Personal Signals | Personalization | `interest_signals`, `member_state`, `user_journeys` | opt-in personalization, explainability, privacy controls |
| News | Information publishing | `news`, `publications`, `publication_versions`, `publication_comments` | source provenance, editorial workflow, corrections |
| Investment / Simulation | Decision support | `sim_trades`, `token_balances`, `wallet_accounts`, `wallet_transactions` | simulation/live separation, risk, reconciliation, audit |
| Notification | Communication | `notifications`, `notification_queue`, `notification_templates`, `weekly_digest_queue` | delivery, retry, preference enforcement, observability |
| Knowledge | Evidence graph | `knowledge_nodes`, `knowledge_edges`, `knowledge_documents`, `knowledge_attachments`, `knowledge_spaces` | provenance, versioning, retrieval, review |
| Research | Research lifecycle | `research_hypotheses`, `publications`, `graph_evidence`, `data_lineage` | hypothesis, evidence, citation, review, publication |
| Education | Learning | `academy_courses`, `academy_lessons`, `academy_progress`, `academy_exams`, `academy_exam_results`, `certificates` | curriculum, tutoring, assessment, certification |
| AI | Agent intelligence | `ai_agents`, `ai_conversations`, `ai_messages`, `ai_memory`, `ai_prompts`, `ai_jobs` | routing, guardrails, memory, evaluation, traceability |
| Governance | Policy | `governance_policies`, `policy_rules`, `policy_eval_log`, `gate_matrix`, `gate_evaluations` | policy evaluation, approvals, release gates, evidence |
| Security | Defense | `security_policies`, `threat_events`, `incidents`, `system_incidents`, `audit_logs` | detection, response, containment, recovery, evidence |
| Enterprise | Organization operations | `organizations`, `enterprise_accounts`, `organization_members`, `enterprise_audit` | tenancy, permissions, billing, audit, support |
| Marketplace | Commerce | `marketplace_listings`, `marketplace_orders`, `marketplace_reviews`, `marketplace_categories` | listing, discovery, order lifecycle, reviews, payout controls |
| Platform Operations | Reliability | `system_health`, `system_metrics`, `platform_metrics`, `slo_metrics`, `sla_metrics`, `error_budget_policy`, `circuit_breakers` | SLOs, alerts, error budgets, recovery, capacity |
| Projects / Workflows | Execution | `projects`, `project_files`, `project_activity`, `workflows`, `workflow_runs`, `workflow_steps`, `workflow_executions` | planning, execution, evidence, retries, completion |
| Storage | Assets | `storage_files`, `storage_shares`, `user_assets` | upload, scanning, access, lifecycle, export |
| Social | Community | `member_posts`, `social_connections`, `social_broadcasts`, `messages`, `member_presence` | publish, moderation, messaging, presence, abuse controls |

## Agent ownership

- Sentinel → Security, Identity, threat and incident evidence
- Analyst → Analytics, finance, operational metrics
- Historian → Knowledge, history, provenance
- Tutor → Education and assessments
- Merchant → Marketplace, commerce, subscriptions
- Proxy → Integrations and workflow execution
- Oracle → Forecasting and scenario analysis
- Scout → Discovery, research and trusted-source acquisition
- Warden → Governance, policy and compliance gates
- Auditor → Independent verification and evidence
- Beacon → Observability, reliability and operations
- Sovereign → Cross-domain orchestration and strategic coherence

## Rule
Every new page, API, agent, dataset, feature or workflow must map to one domain, one owner role, one authoritative data path and one executable task stream before it is accepted into production.
