# Deterministic browser-script pipeline — Phase 1 audit gate

**Status:** read-only inventory and loader-contract audit are merged; runtime execution-order changes are not yet integrated.
**Repository baseline for this follow-up:** 6db14d38505d7352f64e1cb257d965a62bc43dac.

## Scope correction

The live tree contains 391 JavaScript-family files across the repository, 304 root-level JS-family files, and 286 root-level omega-prefixed JS files. These are different populations. The historical performance study measured 170–182 script requests on individual pages and 165 scripts on every measured page. None of those figures establishes a canonical 176-file module set.

A direct static scan of current bg.js (blob 77dc12d5afc308b596082982cd2c81e29a24943a) finds 150 unique root-level script paths associated with its append helpers: 139 marked immediate and 11 marked idle by the existing helper-call pattern. This is a source-level loader inventory, not proof that every candidate is fetched on every page or that the helper's runtime conditions always execute. The inventory tool and browser measurements must reconcile those differences before scheduling changes.

The inventory tool enumerates root-level browser scripts, page consumers, bg.js loader references, local static import edges, global publication/reference signals, and observable side-effect patterns. It emits a stable topological order only for statically resolved local import/require edges. It does not rewrite script tags or change runtime behavior.

## Current runtime loader audit

The current bg.js is 3,329 lines / 220,172 characters at blob 77dc12d5afc308b596082982cd2c81e29a24943a. The current repository tree contains 391 JavaScript-family files, 304 root-level JavaScript-family files, 286 root-level omega-*.js files, and 243 root HTML pages. These are distinct populations and must not be described as one 176-script set.

A source scan of bg.js found 150 unique root script paths associated with the existing append-helper pattern: 139 immediate and 11 idle. This is not a browser request count. Existing module-load-audit.py and test_bg_idle_modules.py remain the established safety controls for candidate classification and the exact eleven-module idle batch.

The existing helpers provide useful safeguards:
- __omegaAppend() deduplicates an already-present script by pathname and uses a WeakSet to avoid repeatedly scanning the same elements.
- __omegaIdleAppend() waits for window.load, then uses requestIdleCallback with a 2,500 ms cap (or a 300 ms timer fallback).
- The idle batch is explicitly regression-tested because late listeners can miss one-shot lifecycle events.

The current append helper does not set el.async = false, return a shared load promise, attach load/error handlers, expose a load timeout, or maintain explicit retry state. The defer property assigned to dynamically created script elements does not itself establish ordered execution for those dynamically inserted classic scripts. Therefore the current loader is asynchronous and deduplicating, but deterministic execution order and failure/retry semantics are not yet established.

The updated inventory JSON now includes:
- bg_loader_sequence: source-order entries for root scripts whose src assignment is followed by the matching __omegaAppend or __omegaIdleAppend call;
- bg_loader_contract: source-level signals for ordered execution, promise creation/sharing, load/error callbacks, timeout/retry hooks, deduplication, and idle scheduling. A signal is not proof of runtime correctness.

These are static source observations. Browser execution order, fetch timing, actual load failures, and page behavior still require runtime tests.

## Runtime-lane handoff — proposed, not applied

bg.js and all omega-*.js runtime modules are reserved to the Claude Code lane. The following is a review proposal, not a committed runtime patch.

**First low-risk ordering experiment:** inside __omegaAppend(el), set el.async = false for dynamically inserted classic script elements before either append path can call appendChild(el). This uses the existing bg.js source order as the initial deterministic execution order while preserving the current call sites and duplicate guard. It does not create a dependency DAG, and it may change the timing of script execution; measure it on the same page/device matrix before rollout.

Candidate insertion point:

~~~js
function __omegaAppend(el){
  if (el && el.tagName === 'SCRIPT') el.async = false;
  // retain the existing duplicate guard and append paths unchanged
  ...
}
~~~

Do not treat that one-line change as the completed pipeline. Before a broader migration, the runtime owner should:
1. Confirm every injected script is a classic script and inventory page-authored script tags that may already exist.
2. Preserve the source order of all immediate append calls; keep the existing idle batch unchanged.
3. Add an explicit per-path state registry (queued, loading, loaded, failed) and a shared promise only for new promise-aware callers. Legacy callers must retain their existing behavior.
4. Handle load and network/CSP error distinctly; apply a bounded timeout; dispatch a structured diagnostic event without leaking URLs containing query secrets.
5. Permit explicit retry only after a failed network/CSP load, and prevent duplicate execution if a script has already completed or partially initialized.
6. Keep auth/approval/bootstrap dependencies synchronous or explicitly ordered; do not defer based only on absence of a global reference.
7. Test one-shot events, DOM-ready hooks, stylesheets, global publication, signed-out/approved sessions, and representative mobile/desktop pages.
8. Keep rollout disabled until browser regression and same-profile performance comparisons pass.

A load event alone does not prove that every statement in a script completed without a runtime exception. The runtime implementation must not report a module as healthy solely because the network request returned successfully.


## Runtime implementation contract

The eventual browser pipeline must preserve the current static HTML + bg.js + self-hosted vendor + Supabase + Vercel architecture. No framework, bundler, package dependency, service split, or build-system migration is part of this work.

1. **Inventory before scheduling.** Each script needs an owner, entrypoint/page consumers, load trigger, published globals, required globals, side effects, estimated transfer bytes, and evidence confidence.
2. **Dependency classes.** Distinguish hard static imports, ordered loader dependencies, global-symbol contracts, DOM/event side effects, CSS/token side effects, and unknown/dynamic references. Never collapse these into one guessed DAG.
3. **Deterministic scheduler.** Use stable topological ordering for hard dependencies only. Independent tasks use a stable lexical tie-breaker. Detect and block cycles; do not silently break them.
4. **Compatibility bridge.** Keep existing globals and data-omega duplicate-load guards intact. A legacy caller must receive the same global and initialization guarantee as before. A loader promise must settle once, share concurrent requests, reject on load/timeout errors, and support explicit retry without duplicating script execution.
5. **Execution policy.** Keep critical bootstrap and auth/approval guard synchronous in the current ordering. Defer only modules proven safe by static evidence plus browser tests. Do not defer merely because no global reader was found.
6. **Failure semantics.** A failed dependency blocks its dependents with an observable reason. Noncritical optional modules may fail open only where the existing feature contract explicitly permits it.
7. **Rollout and rollback.** Add an opt-in flag defaulting OFF. Compare old/new request count, transferred bytes, long tasks, first contentful paint, and feature-specific smoke tests on the same page/device matrix. Roll back by disabling the flag; do not remove the legacy path until evidence supports it.

## Mandatory validation matrix

- Static inventory is deterministic across repeated runs on the same commit.
- No hard dependency cycle is present in the activated subset.
- Every candidate has a browser-rendered test for first paint, auth/approval, navigation, feature action, and error/retry behavior.
- Test representative light and heavy pages, signed-out and approved sessions, desktop and mobile, reduced-motion and normal-motion.
- Measure before/after on the same hardware/browser/network profile; do not compare unlike runs.
- Existing repository contracts and CI remain blocking; no check is weakened or marked non-blocking to accommodate the change.

## Ownership / integration boundary

AGENTS.md assigns ChatGPT Python tooling under scripts and documentation, but reserves bg.js, nav.js, omega-prefixed runtime modules, workflow definitions, and deploy configuration to the Claude Code lane. Therefore this branch adds the read-only dependency graph and its tests plus this integration contract. The actual runtime scheduler must be integrated by the lane owner after reviewing the graph and browser test plan. No claim is made that asynchronous runtime loading has shipped.
