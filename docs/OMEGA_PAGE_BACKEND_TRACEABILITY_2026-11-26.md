# Ω SYD OMEGA — Page-to-Backend Traceability Snapshot

**Captured:** 2026-11-26  
**Audited source:** `715a7d3a9de66e805699e99945ee311f4da46d33` (`main`)  
**Scope:** Dashboard, Profile, Focus, Mindmap, Atlas, Approvals, Expenses, Movies  
**Method:** Static source tracing across page HTML, directly loaded page modules, relevant shared persistence code, SQL migration definitions, and existing repository tests.

## Evidence rules

This report distinguishes four different claims:

- **Source-wired:** a page or page-owned module contains a concrete handler and backend call.
- **Schema-declared:** a matching table/function is present in repository SQL. This does not prove the live object, grants, RLS, or runtime call.
- **Previously live-verified:** a provider-side check is recorded in the current project handoff; it is not a fresh end-to-end test of every page in this snapshot.
- **Unverified:** browser behaviour, real member impersonation, provider response, or data recovery has not been demonstrated in this pass.

A source call is not proof of a successful workflow. Do not convert an empty state, local calculation, static asset, or generated preview into a live capability claim.

## Page-to-backend trace

| Surface | Source path | Persistence / backend path | Current evidence and limits |
|---|---|---|---|
| Dashboard | `dashboard.html` | Authenticated profile and member reads; task/activity/telemetry and other platform relations; aggregate RPC `omega_dashboard_public_metrics` | The page calls the aggregate RPC and validates numeric values before rendering. The current live privilege check recorded in the handoff found the public wrapper SECURITY INVOKER, authenticated EXECUTE allowed, anon EXECUTE denied; private helper SECURITY DEFINER with an empty search_path and authenticated-only EXECUTE. This verifies the RPC privilege boundary, not every dashboard panel or all its queries. The page also stores some personal panels locally. See [dashboard RPC call](../dashboard.html#L1444) and [dashboard metric validation](../dashboard.html#L1323). |
| Profile | `profile.html` plus `omega-profile-settings.js` | Profile, certificates, character/leaderboard/evolution data; nine RPC calls in the generated matrix; owner actions route through server-side owner/MFA-checked RPCs | Source wiring exists, but this is a large mixed surface: identity, preferences, credentials, KYC, appearance, account operations, and owner controls have different authorization requirements. The page must not be treated as one verified workflow. The settings module exposes explicit cloud restore from `member_state`; it skips local keys unless overwrite is explicitly requested. See [certificate read](../profile.html#L1648), [profile lattice RPC](../profile.html#L1715), and [cloud restore control](../omega-profile-settings.js#L12). |
| Focus | `focus.html` | Local `omega_focus_sessions` / distraction history plus append-only insert into `focus_sessions` | Saving writes the browser record first, then calls `mirrorFocusSession` without awaiting it. The insert checks `.error` and logs a warning, but there is no durable retry queue for a failed `focus_sessions` insert. The shared member-state mirror can separately back up eligible `omega*` keys, but that is a backup path—not proof that the normalized table insert succeeded. Focus metrics are calculated from browser-local session data. See [local save](../focus.html#L340) and [table insert](../focus.html#L366). |
| Mindmap | `mindmap.html` | Local key `omega_mindmaps`; eligible for shared `member_state` mirror | No page-owned table/RPC/Edge call. The key is covered by the shared mirror because it is `omega`-prefixed and is not on the mirror exclusion list. Restore is explicit from Settings; this is not automatic two-way sync. The page itself has no dedicated export path. See [local key](../mindmap.html#L190) and [save](../mindmap.html#L403). |
| Atlas | `atlas.html` | Local key `omega_atlas_v2`; eligible for shared `member_state` mirror | Same model as Mindmap: no page-owned backend call, but the `omega_atlas_v2` key is eligible for the shared mirror and explicit restore. Do not describe this as direct database persistence or automatic cross-device sync. See [key and save](../atlas.html#L200). |
| Approvals | `approvals.html` + `approvals.js` + `approvals-ui.js` | `profiles` read, owner RPCs for member access, contracts, reservations, audit/errors, KYC; private Storage bucket access for identity documents | The page loads `/approvals.js` as an external module. That module implements the owner gate, member loading, action RPCs, KYC queue/review, signed document URLs, and purge confirmation. The generated `EVIDENCE_MATRIX.md` incorrectly labels `approvals.html` STATIC because `scripts/evidence-audit.py` scans only inline page scripts. This is an audit-tool blind spot, not evidence that Approvals has no backend. The owner check in the browser is only a visibility gate; mutations must remain protected by server-side owner and MFA checks. See [module include](../approvals.html#L285), [member RPC](../approvals.js#L154), [KYC queue](../approvals.js#L357), and [server-gated boot check](../approvals.js#L461). |
| Expenses | `expenses.html` | Browser-local finance records; explicit `OmegaLocalBackup` export/import | No page-owned table/RPC/Edge call. Finance keys are intentionally excluded from cloud mirroring by `NO_MIRROR` in `omega-member-state.js`, reflecting the privacy decision recorded in the project. The page offers a local JSON backup for budget data. Do not add these keys to `member_state` or introduce cloud finance persistence without an explicit owner decision and a separate RLS/privacy review. See [budget backup control](../expenses.html#L80) and [finance mirror exclusions](../omega-member-state.js#L134). |
| Movies | `movies.html` | Authenticated profile read; preview media served from repository assets | The page is explicitly labelled **VISUAL CONCEPT REELS**: twelve procedural preview loops, not completed feature films. The profile query is an access gate, not a film catalogue backend. The media-status test exists to protect this distinction. See [status disclosure](../movies.html#L85) and [profile gate](../movies.html#L397). |

## Cross-cutting persistence findings

### 1. `member_state` is a one-way backup mirror, not synchronization

- `omega-member-state.js` collects keys beginning with `omega`, excluding explicit ephemeral keys, finance keys, and analytics keys.
- It uploads changed values with an upsert on `(user_id,key)`, polls every 30 seconds, and attempts a sync on tab hide/pagehide.
- It does not hydrate pages automatically. `OmegaMemberState.restore()` is an explicit pull-down operation and skips keys already present in the browser unless overwrite is requested.
- Migration `0095_omega_member_state.sql` defines the table, own-row SELECT/INSERT/UPDATE/DELETE RLS policies, authenticated grants, and no anon grant. The migration comments deliberately deny the platform owner a blanket read policy.

Relevant source: [mirror collector](../omega-member-state.js#L190), [upsert](../omega-member-state.js#L212), [explicit restore](../omega-member-state.js#L321), [table and RLS](../supabase/migrations/0095_omega_member_state.sql#L42).

### 2. Deletion is not represented in the mirror

The collector skips a key when `localStorage.getItem(key)` returns null. The inspected implementation has no tombstone or corresponding server-row deletion operation in the mirror path. Therefore, deleting a local key does not itself prove that its server backup was deleted; a later explicit restore may reintroduce an older value.

**Required correction:** design an explicit per-key deletion/tombstone contract and migrate deliberate data-clear operations to it. Do **not** delete server rows merely because a browser has no local key: an empty browser is also the normal starting point for cache recovery, and absence-based deletion would destroy the backup. Add regression tests for local removal, remote tombstone, restore, and fresh-device recovery before changing the behaviour.

A source sweep found concrete removal/migration paths whose keys are eligible for the mirror because `PREFIX = 'omega'` and they are not in the current `SKIP` or `NO_MIRROR` lists:

- `weekly.html` removes `omega_wr_draft_<week>` after saving the completed review.
- `omega-theme-elemental.js` exposes `OmegaTheme.clearState()`, which removes `omega_theme_state`.
- `omega-celestial-covenants.js` removes `omega_covenants_lore_safe` when resetting the preference.
- `network.html` migrates and removes `omega_network_contacts` and `omega_network_interactions`.
- `nutrition.html` migrates and removes `omega_water_track`.
- `bg.js` purges `omega_lux_mode`; `omega-demo-video.js` removes `omega_demo_watched_at` during reset.

The prefix is broader than `omega_`: it also makes names such as `omega-v1:<cache-key>` and `omega:ad:impressions` eligible. The latter is described in its page UI as browser-only, so the mirror's current eligibility rule and the product's stated data boundary do not match. This does not prove every such key was uploaded for every user; it proves the code will collect it when present, signed in, not excluded, and within the row-size limit.

Before implementing deletion, classify every current key namespace into member data, ephemeral/cache, browser-only telemetry, finance-local, and deprecated migration data. Then implement explicit deletion semantics and exclusions without deleting existing users' remote rows by assumption.

### 3. Focus has two separate persistence paths

The normalized `focus_sessions` insert and the `member_state` backup of local `omega_focus_sessions` are separate writes with separate failure modes. A warning in the console is not a retry mechanism. The next implementation should define whether the normalized table is authoritative analytics history, whether the browser backup is recovery-only, and how failed inserts are reconciled without duplicates.

### 4. Finance is intentionally local-only

The finance exclusion list prevents the shared mirror from uploading the listed finance keys. The local export path is the current recovery mechanism. This is a deliberate privacy boundary; changing it requires an owner decision, threat model, retention rules, and member-scoped RLS tests.

## Audit-tool integrity gaps

1. **External page-module coverage is implemented.** PR #1576 merged to `main` at `101a5ad7c8827ac19e9799ebdce0456682d35057` after all 18/18 workflow runs passed. The scanner now includes directly loaded local `.js`/`.mjs` modules, excludes platform-global bootstrap/runtime scripts, and separates Supabase Storage buckets from Postgres relations. It does not follow module imports or scripts dynamically injected by `bg.js`. The regenerated artifact reports 237 pages: BUILT 107, PARTIAL 39, LOCAL_ONLY 45, STATIC 38, BROKEN 1, UNREACHABLE 7. Approvals is source-classified as wired (1 table, 1 Storage bucket, 10 RPCs, 1 auth call). The remaining BROKEN source reference is Cosmic Ledger's `lesson_completions`, which exists in the live database but lacks a repository migration. PR #1577 refreshes the committed matrix; its blocking checks must pass before that generated inventory is accepted.
2. **Page inventory count reconciled in the scanner branch.** The committed `EVIDENCE_MATRIX.md` on the audited base was stale at 242. The regenerated matrix on PR #1576 reports 237 pages, matching `config/omega-page-census.json` (237). The regenerated artifact—not the old committed matrix—is the current source evidence; commit the refreshed matrix only after the scanner PR passes and is accepted.
3. **Dashboard/Profile counts changed when page-owned modules were included.** The regenerated PR #1576 snapshot reports Dashboard as 12 tables, 6 RPCs, 1 Edge Function, 6 auth calls, and 2 localStorage writes; Profile as 5 tables, 11 RPCs, 19 auth calls, and 4 localStorage writes. These are source-scan counts, not proof of successful runtime calls. The previous committed counts omitted page-owned module calls and must be replaced from the exact accepted tree.

Relevant scanner source: [page module aggregation](../scripts/evidence-audit.py#L409), [root HTML enumeration](../scripts/evidence-audit.py#L582), [documented inline-script limitation](../FEATURE_IDEAS.md#L2937).

## Additional source/live-schema reconciliation

The regenerated scanner also identifies `cosmic-ledger.html` as using `lesson_completions` through `omega-sculpture.js`, while no `CREATE TABLE` definition or migration for that relation is present in the repository SQL inventory. This is a **source-of-truth / migration reproducibility gap**, not a confirmed live outage:

- The committed `supabase/live-schema.json` snapshot (captured 2026-11-22) includes `public.lesson_completions` with `id`, `user_id`, `lesson`, and `completed_at`.
- A read-only live SQL inspection on 2026-11-26 confirmed RLS enabled; an authenticated SELECT policy restricted to `auth.uid() = user_id`; authenticated SELECT only; no anon grant; a unique `(user_id, lesson)` constraint; and `ON DELETE CASCADE` to `auth.users`.
- The live `id` column is `bigint NOT NULL` with no default, and members have no write grant. The inspected page path is read-only, and `scripts/tests/test_omega_sky_contract.py` asserts that `task_completions`, `lesson_completions`, and `certificates` reads are filtered by the signed-in `user_id`.

Do not label this as a proven runtime failure, add member write grants, or invent a replacement schema. Reconstruct a canonical migration from the verified live definition only after reviewing the intended lifecycle and confirming whether the table is retained or retired.

## Prioritized implementation sequence

| Priority | Work | Acceptance evidence |
|---|---|---|
| P0 | Keep the corrected scanner and generated matrix synchronized | PR #1576 merged with 18/18 checks; PR #1577 must pass and commit the 237-page matrix with Storage and external-module evidence |
| P1 | Inventory every `omega*` key namespace, then add explicit mirror tombstones/deletion semantics | Tests prove intentional deletion stays deleted after restore, while a fresh empty browser can still restore undeleted keys; cache/telemetry/finance exclusions are independently tested |
| P1 | Define Focus session reconciliation | Failure injection for normalized insert; idempotent retry/replay; no duplicate sessions; visible degraded state or durable recovery |
| P2 | Verify Profile and Approvals with separate owner/member sessions | Browser tests for signed-out, ordinary member, approved member, owner without AAL2, owner with AAL2; prove both allowed and denied paths |
| P2 | Verify Mindmap/Atlas backup and restore | Save on device A, restore on clean device B, preserve local conflicts, test oversized values and mirror errors |
| P2 | Reconcile Cosmic Ledger's `lesson_completions` migration source | Fresh-install migration replay creates the read-only table with authenticated own-row SELECT RLS and no anon/member write grant, or the page removes the legacy dependency |\n| P2 | Keep media truth labels and test playback independently | Existing concept-reel labels remain; preview playback, mobile behaviour, and asset availability verified separately |

## First practical step

First, complete review and merge of **PR #1577** so the corrected 237-page matrix is committed. Then build the member-state key lifecycle inventory and deletion regression tests before changing persistence semantics. Do not auto-delete remote rows based only on an empty browser cache.

**Boundary:** this snapshot is a source-level traceability audit. It does not claim that every page action, provider call, storage operation, database policy, or user workflow has been exercised in production.
