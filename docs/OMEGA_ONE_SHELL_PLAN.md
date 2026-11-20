# Ω One-Shell Plan — one persistent app, every page a view

Date: 2026-11-20. Status: **plan, nothing built yet.** Owner decisions recorded below; every number is measured and says how.

## 1. Decisions (from the owner)

1. **Shape:** one persistent shell; pages load as *views inside it* with transitions and shared state. Not a literal single HTML file.
2. **Visual target:** the owner's reference art in `assets/concept/` (`board-01`, `board-02`, `reel-01`, `franchise-01`): one composed, luminous-gold, interconnected blueprint, with the Ω at the centre and every domain wired to the others.

## 2. Why not one HTML file (measured, `docs/OMEGA_ONE_SHELL_PLAN.md` §8 method)

242 pages, 5.2 MB HTML, 0.8 MB inline JS, 1.0 MB inline CSS, 143 inline module scripts. Top-level `const/let/class` names declared in >1 page: **320**; function names in >1 page: **60**; element ids on >1 page: **239**. One document means every one of those collides, and every visitor downloads 5+ MB first. Rejected.

## 3. What already exists (so this is not a rewrite)

| piece | what it gives | source |
|---|---|---|
| in-place page engine | fetches a page, moves its `<main>` into a host, wraps classic scripts so top-level names cannot collide, records timers/listeners and tears them down | `omega-panels.js` (514 lines) |
| 15 workspace hubs | page → hub membership, 177 of 242 pages assigned | `omega-single-page-workspaces.js` `WORKSPACES` |
| panel allow-list | pages already shown as tabs, each gated by a measured comparison | `omega-single-page-workspaces.js` `PANELS` |
| composed home | the reference art's layout on the dashboard, every number from a real source | `omega-ecosystem-home.js`, `omega-command-wall.js` |
| luminous mark | `data-sculpt-glow="radiant"`: gold signet, halo, rays, embers, seeded | `omega-sculpture.js` |
| shared transitions | cross-document view transitions | `omega-morph.js` |

**Framing is not available.** An iframe viewer was built and removed: production sends `X-Frame-Options: DENY` and `frame-ancestors 'none'` (gated by `security-headers-contract.py`), and a frame loaded a second copy of the platform. The engine moves content instead of framing it. Do not reopen that.

## 4. Census: can every page be hosted in place today? (`scripts/panel-census.js`)

241 pages (all except `life.html`, the host), each mounted as a panel, 2.5 s, headless Chromium, Supabase stubbed.

- **222 clean (92%)**: loads, shows content, 0 page errors, host not navigated.
- **19 not clean**, and most are not defects:
  - 11 are redirect stubs that forward elsewhere (`graph-*`, `graphify`, `observatory`, `enterprise`, `settings`, `sovereign-covenant`): correct to stay links.
  - 4 are public/auth pages that must stay standalone: `404`, `terms`, `pending`, `reset`. `account` likewise (navigates away).
  - **4 real failures to fix:** `honors`, `matrix`, `media` ("could not load here") and `sovereign-ai` (`_profile is not defined`).
- **Limits of this number.** It proves "loads with content and no error", not "behaves the same". The repo's own bar for enabling a panel is stronger (same controls, same storage written, no errors, content present). 80 pages are already enabled as panels (`PANELS`, distinct pages); the other 97 hub pages (177 listed in a hub) need that comparison before they become default views, and 50 pages are neither in a hub list nor a hub themselves (242 − 177 − 15 hub pages). Payments, KYC, consent and privacy pages stay out until reviewed.

## 5. What "directly related" can honestly mean (measured)

- Hyperlinks: only 113 of 242 pages link to any other page (374 links); 42 of 210 hub→hub pairs have a real link. **Too sparse to draw a connected map from links alone.**
- Shared data: 83 of 242 pages touch a specific table/RPC in client code (excluding `profiles` and 3 plumbing RPCs); 305 page pairs share one, 52 share two (`task_completions` 21 pages, `evolution_events` 9, `certificates` 8). Real, but covers about a third of the platform.
- So the lines in the reference art need a **declared relation model**: hub membership is the backbone (already exists), data-sharing is evidence drawn only where it is measured, and anything else is a curated edge the owner approves. **No edge is invented**, and an edge with no source is not drawn (CLAUDE.md §8.1 class 9; `omega-command-wall.js` header lists what the boards draw that must not be).

## 6. Target architecture

```
        ┌──────────────── persistent shell (never reloads) ────────────────┐
        │ nav · orrery (#omega-fx, dimmed <760px) · 3-D layer · bottom stack │
        │                                                                  │
        │  MAP view  ──click node──►  VIEW (omega-panels engine, in place)  │
        │  (blueprint home)  ◄─back/hash─  #/workspace/page                 │
        └──────────────────────────────────────────────────────────────────┘
```

- **Route = hash**, `#/<hub>/<page>`; direct URLs `/<page>.html` keep working unchanged (stable deep links, SEO-free `noindex` site).
- **Eligibility registry** `config/omega-panel-eligibility.json`, generated from the census plus the parity comparison; the shell hosts a page in place only if it is listed, otherwise it renders a link. Ineligible pages are never silently broken.
- **No `bg.js` change in the first stages** (it is the single point of failure). The shell is a new module loaded by one new page.

## 7. Stages, each independently shippable and verified in a render

| stage | deliverable | acceptance (measured) |
|---|---|---|
| **0** (this PR) | this plan + `scripts/panel-census.js` | census reproducible; numbers above |
| **1** | fix the 4 real failures; extract `OmegaPanels.open(url, host)` so any host can use the engine; eligibility registry + CI check | the 4 pages load clean; registry matches a fresh census; no existing hub changes behaviour |
| **2** | `shell` page: hash router, persistent chrome, hosts eligible pages in place, teardown leak test (open/close 20 pages, listeners and timers return to baseline), history/back and focus management | route round-trip test; no page error across the 222; memory/listener baseline held |
| **3** | blueprint **map** home: radiant Ω signet centre, the 15 hubs as nodes, edges only from §5 sources, click → view with view-transition | every edge cites its source in `config/omega-relations.json`; map renders at 375/768/1440 with no overflow; reduced-motion static state |
| **4** | visual pass to the reference art: luminous line flow along edges, panel chrome, depth | reference checklist (§9) scored in a render; before/after noise-floored diff |
| **5** | promote eligible pages to open in the shell by default from nav; legacy URLs still resolve | nav click on 20 sampled pages stays in the shell; `/x.html` deep links unchanged |

## 8. Method notes

Census: `scripts/panel-census.js`, one browser per page, 35 s cap (a page script that never returns hung an earlier single-browser run). Relation counts: regex over each page plus the local scripts it loads (`.from('t')`, `.rpc('f')`, `href="/x.html"`); a regex over source is a candidate list, not a verdict (CLAUDE.md §8.4).

## 9. Reference checklist for stage 4 (to be agreed before stage 4 starts)

From `board-01`/`board-02`: (a) one luminous gold Ω at the centre with halo and rays; (b) domain nodes on orbits/branches around it, each a real link; (c) fine gold connector lines with flow, labelled by relation; (d) dense panel chrome with small data panels, each backed by a real source; (e) a 3-D matrix/cube element; (f) dark ground, gold/cyan accents only. **Not drawn, because no source exists:** the boards' invented figures (revenue, "9,171,717 Ω", uptime curves, "100% consensus", ports, latencies), the 9-stage ladder (rejected in `docs/IDEA_INTAKE.md`), owner-override states.

## 10. Risks

- `bg.js`/approval guard timing (§8.1 class 3): a hosted page measured before the guard lifts reads 0; the engine already waits, and stage 2 asserts it.
- Memory/leaks from long sessions in one document: stage 2's teardown test is the gate.
- Auth/privacy: payments, KYC, consent, privacy, owner-only pages stay standalone links until separately reviewed.
- Scope: this is multi-week. Each stage ships alone; stop after any stage and the platform is better and unbroken.
