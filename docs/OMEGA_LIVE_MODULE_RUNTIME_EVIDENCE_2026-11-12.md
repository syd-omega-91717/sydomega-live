# Ω SYD OMEGA 91717 — Live Runtime and Migration Evidence

**Observed:** 2026-11-12  
**Main baseline:** `776c541d0727c61050056c0ad62da62089cc1678`  
**Remediation PR:** [#1244 — production gates and consultancy schema parity](https://github.com/syd-omega-91717/sydomega-live/pull/1244)  
**PR state at capture:** draft; no merge or production deployment.

This record separates provider catalog evidence, repository source evidence, CI evidence and actions still pending. A migration-ledger row is not treated as proof of clean replay or end-to-end operation.

## Verified against the connected Supabase project

- Migration ledger: **419 unique applied versions**, latest `20261112091500_omega_search_index_schema_reconciliation`.
- The three migrations previously listed as pending are now provider-recorded as applied:
  - `20261112091300_omega_idempotency_payload_integrity`
  - `20261112091400_omega_stripe_refund_state_fk_index`
  - `20261112091500_omega_search_index_schema_reconciliation`
- Seven live helper definitions contain the expected immutable payload-conflict guards: consultancy intake, service orders, agent tasks, notifications, platform events (event and audit records), achievement verification and sovereign progression events. Their audited security-definer functions pin an empty search path and retain their role-specific execute boundaries.
- Owner/subject-scoped idempotency indexes and null-owner system indexes were present in the live catalog. The Stripe refund-state index on `last_reversal_transaction_id` was present.
- `public.search_index` has the reconciled ten-column shape, zero rows, and an owner/shared-only authenticated read policy. The broad `USING (true)` policy is no longer present.
- The live dispatcher contains all **53 canonical module-read branches plus the dedicated consultancy intake write branch (54/54)**. This is SQL branch coverage only.
- All **22** configured Edge Functions were observed active and matched to repository entrypoints byte-for-byte in the earlier same-day reconciliation.
- `public.consult_requests` was observed with zero rows, zero null user IDs and zero null domains. Its live ID type is `BIGINT`; `domain`, `user_id`, `message`, `status`, `commission_rate` and `confidentiality_accepted` are required. The provider defaults include commission rate `9.17`, status `received`, confidentiality acceptance `false`, and `created_at=now()`.

## Clean-replay defect found

The first full migration replay for PR #1242 failed when the consultancy read probe attempted to select `consult_requests.domain`. Source review identified the historical chain defect:

1. The early baseline creates `consult_requests` with a UUID primary key and without the `domain` column.
2. The later consultancy migration contains `CREATE TABLE IF NOT EXISTS` with a fuller definition. Because the table already exists, that statement does not add the missing column; its subsequent `ALTER TABLE` list also omits `domain`.
3. Production has a different but valid historical shape: the primary key is BIGINT and `domain` is required.
4. The live `omega_private.create_consult_intake` definition returned BIGINT and did not return the generated ID on its successful path. That is incompatible with the UUID shape in a fresh replay and breaks the success path even where the live ID is BIGINT.

The consultancy schema fix preserves both UUID and BIGINT source IDs as text, restores the missing successful return and does not rewrite existing IDs or fabricate request rows. On the next replay run, the complete migration chain and migration-security audit passed. The 54-action probe then reached `MEDIA.library.read` and failed because the derived `media_items` projection omitted `created_at` even though its outer aggregate ordered by `m.created_at`. PR #1244 now adds `created_at` to that projection. The next probe run passed the media read and found a second dispatcher defect: `COMMUNICATION.presence.read` orders by `member_presence.last_seen_at`, but the canonical table column is `last_seen`. The pending migration now orders by `p.last_seen`; the full probe must be rerun before this migration can be applied.

## Remediation in PR #1244

The pending migration `20261112091600_omega_consultancy_runtime_schema_parity.sql`:

- adds the missing `domain` column if absent;
- checks for null required values before enforcing the provider-observed required fields/defaults;
- preserves the underlying UUID or BIGINT ID type;
- returns `id::text` from the helper and restores the successful `RETURN`;
- changes the dispatcher request-ID variable to text;
- retains `created_at` in the `MEDIA.library.read` derived projection used by the outer aggregate;
- replaces the search-index policy's per-row `auth.uid()` expression with the initplan-safe `(select auth.uid())` expression;
- preserves service-role-only execute access for the consultancy helper and runtime dispatcher.

This migration is marked `PENDING_REVIEW / NOT_APPLIED`. It has not changed production schema or data. It must pass fresh full replay and the complete runtime regression probe before any provider application.

## Advisor findings

- Security: leaked-password protection remains disabled. Three RLS-enabled/no-policy findings concern private-schema tables with no `anon`, `authenticated` or `service_role` table privileges; these are fail-closed and must not be “fixed” with broad policies.
- Performance: the refund-state foreign-key index finding is cleared. One `auth_rls_initplan` finding remains on `search_index_read`; PR #1244 addresses it. The advisor reports **326 unused indexes**; no automatic drops are authorized.
- Health: zero database lint findings were reported.

## Release state and remaining actions

- PR #1244 repairs the duplicated Cloudflare exact-SHA retry/route-smoke loops and narrows Semgrep to parser-stable source formats without disabling blocking findings. The dedicated inline-JavaScript and workflow contracts remain responsible for HTML inline scripts and workflow YAML.
- The public release is **NOT LIVE-VERIFIED**. No successful exact-main-SHA manifest, CSP/HSTS, core-route and 241-page smoke result has been observed after these fixes.
- The new schema migration remains the only pending local migration and continues to block production.
- The Supabase owner must enable leaked-password protection. An authorized GitHub administrator must configure main-branch protection. Any credential-like values from source documents that were ever active must be rotated at their issuing providers.
- Do not activate KYC/AML, financial execution, token issuance, custody, biometric processing or account erasure from blueprint language alone; their existing legal, consent, security and operational approval gates remain in force.

**Acceptance rule:** no “10/10”, production-ready or fully deployed claim until the pending migration passes isolated replay, all required checks are green, the reviewed PR is merged, and Cloudflare verifies the exact merge SHA on the public production domain.
