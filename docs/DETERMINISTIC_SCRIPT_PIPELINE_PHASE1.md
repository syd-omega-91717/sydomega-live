# Deterministic browser-script pipeline — Phase 1 audit gate

**Status:** read-only inventory tooling; runtime execution-order changes are not yet integrated.
**Repository baseline:** 38f808e79bbe0be5cc3fb2a149c5e8d8870f9522.

## Scope correction

The live tree contains 391 JavaScript-family files across the repository, 304 root-level JS-family files, and 286 root-level omega-prefixed JS files. These are different populations. The historical performance study measured 170–182 script requests on individual pages and 165 scripts on every measured page. None of those figures establishes a canonical 176-file module set.

A direct static scan of current bg.js (blob 77dc12d5afc308b596082982cd2c81e29a24943a) finds 150 unique root-level script paths associated with its append helpers: 139 marked immediate and 11 marked idle by the existing helper-call pattern. This is a source-level loader inventory, not proof that every candidate is fetched on every page or that the helper's runtime conditions always execute. The inventory tool and browser measurements must reconcile those differences before scheduling changes.

The inventory tool enumerates root-level browser scripts, page consumers, bg.js loader references, local static import edges, global publication/reference signals, and observable side-effect patterns. It emits a stable topological order only for statically resolved local import/require edges. It does not rewrite script tags or change runtime behavior.

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
