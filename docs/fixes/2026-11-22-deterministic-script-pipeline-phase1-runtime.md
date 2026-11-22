### Deterministic script pipeline Phase 1 runtime (opt-in, default OFF) (2026-11-22)

**Why.** `__omegaAppend` (bg.js) inserted ~150 dynamic classic scripts with the browser default `async=true`, so execution
order followed network completion, not source order; it returned no promise, observed no load/error, had no timeout and no
retry state (`docs/DETERMINISTIC_SCRIPT_PIPELINE_PHASE1.md`, "Current runtime loader audit"). Failure was invisible.

**Fix.** One block in `bg.js` (`Ω-SCRIPT-PIPELINE:begin/end`) plus two hooks in `__omegaAppend`. Behind
`localStorage['omega_script_pipeline']==='1'`, default OFF; flag OFF leaves `__omegaPipe` null, publishes nothing, and the
hooks are `if(P)` no-ops. Flag ON: non-critical dynamic scripts get `async=false` (insertion order = execution order); every
path has a state (`queued/loading/loaded/failed/timeout/present/blocked`); `window.OmegaScriptPipeline` offers shared
`load()` promises, `register()` hard dependencies (cycles rejected, optional edges fail open), `plan()` (stable lexical
topological order), `retry()` and `snapshot()`; `omega:script-pipeline` diagnostics carry pathname only. Critical paths
(bg/nav, `/vendor/`, auth/approval/gate/session/guard) keep legacy ordering and are never timed out or retried. `__omegaIdleAppend`
and the eleven-module batch are untouched. No CI check was edited or weakened (the `!dup()` count assertion in
`test_load_cost.py` was kept by keeping both inline call sites).

**Verified.** `node scripts/verify-script-pipeline.js` -> 22/22 (real loader block, headless Chromium, routed fixtures):
flag-OFF parity (fast script still wins), order a,b,c despite 300/50/0 ms latency, one promise + one request for concurrent
loads, abort -> `failed`/`load-error`, explicit retry executes once and is refused after success, timeout -> `timeout` with
retry refused and a recorded late load, hard dep failure blocks dependent (never requested), cycle rejected, critical retry
refused, existing tag -> `present`, no query string in diagnostics. The suite caught one real bug on first run (concurrent
`load()` returned distinct promises); fixed. `scripts/tests/test_bg_script_pipeline.py` + `test_bg_idle_modules.py` pass;
`python3 -m unittest discover -s scripts/tests` 2064 OK; `-s tests` OK. Real-page matrix (dashboard/profile signed-in, index
signed-out x desktop/mobile x reduced/normal motion x flag OFF/ON, Supabase stubbed): 24/24 renders, 0 page errors, identical
script request counts per page, nav + approval guard unchanged; flag ON ended 147 loaded + 1 present, 0 failed/timeout/blocked.

`./scripts/ci-local.sh`: 36 blocking checks pass, 1 fails: step 2v's responsive contract aborts with "public/ does not exist; run
scripts/vercel-build.sh first". That is an environment precondition, not this change. Building `public/` clears it but then
`test_omega_platform_experience_v6.py::test_all_252_html_documents_are_accounted_for` fails, and it fails identically on pristine HEAD
with `public/` present (checked via `git stash -u`), so the two cannot both pass in this container. Not fixed here; CI builds first.

**Not done / not verified.** Rollout is NOT enabled and nothing is claimed about production. (1) No same-profile
performance comparison on a throttled/real network: the matrix's FCP figures are single unthrottled runs inside the
noise floor and prove nothing. (2) `async=false` creates head-of-line blocking: one stalled non-critical script holds every
later ordered script until the browser gives up on it, and a timeout can only report, not cancel. This is a real cost
that must be measured under a slow-network profile before any enablement. (3) No module declares dependencies via
`register()` yet; the 150-path graph is unmapped, so only source-order execution is actually in effect. (4) Real Supabase,
RLS and a live approval flow were not exercised (stubbed). (5) No deployment evidence exists.
