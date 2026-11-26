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

### 3. Focus has two separate persistence paths

The normalized `focus_sessions` insert and the `member_state` backup of local `omega_focus_sessions` are separate writes with separate failure modes. A warning in the console is not a retry mechanism. The next implementation should define whether the normalized table is authoritative analytics history, whether the browser backup is recovery-only, and how failed inserts are reconciled without duplicates.

### 4. Finance is intentionally local-only

The finance exclusion list prevents the shared mirror from uploading the listed finance keys. The local export path is the current recovery mechanism. This is a deliberate privacy boundary; changing it requires an owner decision, threat model, retention rules, and member-scoped RLS tests.

## Audit-tool integrity gaps

1. **External page modules are omitted from page classification.** `scan_client()` reads only the HTML file. `approvals.html` loads `approvals.js`, yet the generated matrix says it has no backend call. `FEATURE_IDEAS.md` already records this exact limitation and lists other affected pages. Extend the scanner to inspect page-owned local script modules while excluding platform-global bootstrap/runtime scripts; add fixtures proving external module RPC/table calls are attributed to the page.
2. **Generated inventory scopes need reconciliation.** `EVIDENCE_MATRIX.md` reports 242 root HTML pages, while `config/omega-page-census.json` records 237. Confirm whether the census intentionally excludes five files or is stale; do not publish one number as the universal page count until scopes match.
3. **Dashboard evidence counts need regeneration/reconciliation.** The current matrix reports 12 tables and 2 RPCs for Dashboard. A literal scan of the current `dashboard.html` source produced a different set/count. Re-run the generator from the exact audited tree and reconcile the committed artifact before relying on those totals.

Relevant scanner source: [page-only scan](../scripts/evidence-audit.py#L393), [root HTML enumeration](../scripts/evidence-audit.py#L531), [documented inline-script limitation](../FEATURE_IDEAS.md#L2937).

## Prioritized implementation sequence

| Priority | Work | Acceptance evidence |
|---|---|---|
| P0 | Correct the evidence scanner to follow page-owned external JS modules and regenerate the matrix | Fixture tests for external module table/RPC calls; generated matrix matches the same commit; Approvals no longer classified STATIC |
| P1 | Add explicit mirror tombstones/deletion semantics | Tests prove delete does not resurrect on restore, while a fresh empty browser can still restore undeleted keys |
| P1 | Define Focus session reconciliation | Failure injection for normalized insert; idempotent retry/replay; no duplicate sessions; visible degraded state or durable recovery |
| P2 | Verify Profile and Approvals with separate owner/member sessions | Browser tests for signed-out, ordinary member, approved member, owner without AAL2, owner with AAL2; prove both allowed and denied paths |
| P2 | Verify Mindmap/Atlas backup and restore | Save on device A, restore on clean device B, preserve local conflicts, test oversized values and mirror errors |
| P2 | Keep media truth labels and test playback independently | Existing concept-reel labels remain; preview playback, mobile behaviour, and asset availability verified separately |

## First practical step

Fix the **evidence scanner** first. Until it includes page-owned external modules and its generated counts are reconciled, it cannot be trusted as the source of truth for the full page estate. Then add the member-state deletion regression test before changing persistence semantics.

**Boundary:** this snapshot is a source-level traceability audit. It does not claim that every page action, provider call, storage operation, database policy, or user workflow has been exercised in production.
