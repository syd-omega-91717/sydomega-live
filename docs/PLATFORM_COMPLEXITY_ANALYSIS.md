# What makes the platform heavy, and what can merge (2026-11-05)

Measured in headless Chromium against a local copy of `main` (signed-in stub), 14 pages. Bytes are raw (no
compression), so production transfer is smaller; the **counts** do not shrink. Timing was not measured reliably.
Nothing below deletes a feature, a function or data.

## 1. Why it feels heavy (measured)

| per page | typical | extreme |
|---|---|---|
| requests | ~200 | 213 (`dashboard`) |
| script files | 170 to 182 | 182 |
| script bytes | 2.0 to 3.0 MB | 3.0 MB |
| stylesheets applied | 92 to 102 | 102 |
| page elements | 3,000 to 4,500 | 6,255 (`media`) |
| fixed-position layers | 47 to 52 | 52 |
| `<canvas>` elements | 4 to 14 | 84 (`profile`, `settings`), 83 (`dashboard`) |

- **165 script files (1.99 MB) load on every page measured**, including a plain tracker like `journal`
  (172 files, 2.0 MB). `bg.js` injects about 156 modules unconditionally, one hand-written line each.
- Largest on every page: `bg.js` 208 KB, `tsparticles-slim` 141 KB, `nav.js` 90 KB, `i18n.js` 68 KB,
  `page-world-actions.json` 107 KB. `three.module.js` (655 KB) also loads on `dashboard`, `profile`, `vault`,
  `cosmos`, `media` and `settings`.
- Page count is not the weight. The same 2 MB is paid by a 280-word page and a 1,900-word one.

## 2. Levers, biggest first

| # | lever | payoff | risk |
|---|---|---|---|
| 1 | Load a module when a page needs it, not on every page. Start with ones that act only on a click or after first paint (confetti, share card, tour, copilot) | most of the 165 files and ~2 MB | medium: a module nothing waits on is safe; one another module calls at load is not. Needs a per-module "who calls this" table first |
| 2 | Load `three.js` only where a 3-D mount exists (it loads on `settings`) | 655 KB on 6 of 10 pages | low to medium |
| 3 | Cut decorative layers: 47 fixed layers and up to 84 canvases per page | memory and paint cost on phones | low: they are decoration |
| 4 | Fewer stylesheets: ~95 per page, most injected by modules | parse cost | medium |
| 5 | Merge pages into hubs (section 3) | fewer places to look; no byte saving by itself | low: URLs kept |

Levers 1 to 4 are separate PRs, each measured before and after on the same ten pages.
Lever 1 is the one that changes how heavy the platform is.

## 3. Merge map (tabs inside one hub; every feature, function, data source and URL kept)

Found by data use (pages that read the same tables) and by name cluster.

| cluster | pages now | evidence | becomes |
|---|---|---|---|
| Honors | `achievements`, `trophies`, `honors`, `awards` | first three read the same `certificates` + `medals` | 1 page, 4 tabs |
| Owner tools | `command`, `command-center`, `control-center`, `control-plane`, `platform-kernel`, `world-shell`, `interface-omni`, `ops`, `monitoring-dashboard`, `data-observatory`, `maintenance`, `verify-modules`, `verify-deployment`, `healthz` | 15 pages, 9 under 120 words, none for members | the Owner Deck, as tabs; out of the member menu |
| Studio | `design-system`, `design-showcase`, `design-lab`, `lab`, `creation-studio`, `project-studio`, `studio`, `creator` | 8 pages, one purpose | 1 page, tabs |
| Money | `wallet`, `treasury`, `ledger`, `payments`, `subscriptions`, `income`, `expenses`, `budget`, `revenue`, `wealth`, `invest`, `investment`, `portfolio` | 13 pages; 8 read no table | 3 tabs: Accounts, Plan, Invest (`marketplace` stays) |
| Identity documents | `identity`, `passport`, `credentials`, `kyc`, `membership`, `character` | already hosted as modules of `profile` | keep; make the standalone pages thin |
| Graph | 6 `graph-*` pages + `graphify` | already folded into `insight` in the menu | done |
| Progression lattice | `levels`, `grades`, `phases`, `ascension`, `kings`, `triads`, `grid` | owner decision 2026-10-19: own pages back in the menu | leave unless reversed |

About 35 of 236 pages (15%) would stop being separate destinations. Each merge keeps the old URL working
(redirect or hash) so no link, bookmark or embedded hub module breaks.

## 4. Done in this change

Menu faults found while measuring: the `order`, `archive` and `govern` hubs had no dock, `intel` lit the wrong door,
and a stale navigation test failed on `main` and ran in no workflow. All fixed and covered (see
`docs/fixes/2026-11-05-nav-dock-fixes.md`).

## 5. Needs the owner

- Go-ahead for lever 1 (the biggest) and the order of the merges in section 3.
- Cloudflare Web Analytics, so removals and ordering can use real traffic. None exists since 2026-10-19.
- `SUPABASE_ACCESS_TOKEN` in the `supabase-production` environment, to read production and clear the pending migrations.

## 6. Where main-thread time goes (measured 2026-11-06)

V8 CPU profile (`Profiler` over CDP), 390 px mobile, 4x CPU throttle, signed-in stub, local server, headless Chromium,
6 s after `load`. **One run per page, not a median**: read the shares, not the milliseconds. Self-time by script.

| script | `dashboard` | `journal` | what it is |
|---|---|---|---|
| `bg.js` | 993 ms (19.9%) | 635 ms (32.0%) | loader, injected CSS, ambient canvases, icon glyph loop |
| `omega-genesis.js` | 515 ms (10.3%) | 132 ms (6.6%) | per-element atmosphere canvas (`frame`, `overscan`) |
| `vendor/three.module.js` | 489 ms (9.8%) | not loaded | the dashboard's own 3-D mount |
| `vendor/tsparticles-slim.js` | 361 ms (7.2%) | 273 ms (13.7%) | particle field |
| `omega-a11y.js` | 301 ms (6.0%) | 155 ms (7.8%) | touch-target pass (`:508`) |
| total script self-time | 4996 ms | 1988 ms | 129 / 122 scripts with samples |

Inside `bg.js` on `journal`: `drawOne` (`:2512`, the animated icon glyphs) 269 ms, `core` / `starfield` / `resize`
(the background canvas, `:1769-2009`) about 175 ms together, `applyScroll` 38 ms. Inside `omega-genesis.js`: `frame` 104 ms,
`overscan` 62 ms.

**Reading it.**
- The cheap wins are already taken: `omega-genesis.js` draws at 30 fps and skips hidden tabs (`:118-129`), the icon loop
  has a frame budget (`bg.js` after `drawOne`), `omega-a11y.js` caches controls it has measured (`:495-506`).
- What is left is decoration: four animated full-viewport or per-glyph layers (`bg.js` canvases, `omega-genesis`,
  tsparticles, the icon loop) account for roughly half of script time on a plain tracker page. Cutting one is a visual
  decision, not a refactor: pausing the particle field off-screen, or skipping it on small screens, or dropping the
  per-glyph `shadowBlur`.
- Idle-loading more modules would not move this: the 15 modules `scripts/module-load-audit.py` calls SAFE are about
  40 KB of 1,472 KB. Two attempts to defer modules already broke behaviour (`docs/fixes/2026-11-06-*`).
- `three.js` is not a lever: `journal` loads none, `dashboard` loads it for its own mount.

**Not measured.** A real phone, a real network, GPU paint cost (headless paints in software), or run-to-run noise.

### 6.1 Tried and rejected (2026-11-06): the icon-glyph loop

`bg.js` `drawOne` (the animated icon glyphs, about 8 canvases on `journal`) was the largest single function in the profile (260 to 320 ms at 4x CPU). Two cheap hypotheses were tested at the same setting (390 px mobile, 4x CPU, 7 s after load, three runs each, committed `bg.js` against the change, `drawOne` self-time):

| change | before (ms) | after (ms) | verdict |
|---|---|---|---|
| skip the per-glyph `shadowBlur` glow in light mode | 322 / 268 / 262 | 222 / 259 / 271 | noise (medians 268 vs 259) |
| set `ctx.font`, `textAlign`, `textBaseline` once instead of every frame | 218 / 208 / 286 | 220 / 232 / 237 | noise |

Neither was shipped. Removing the glow would have made the icons visibly flatter for no measured gain, and the font hoist changed nothing. Run-to-run spread (208 to 322 ms for the same code) is wider than either effect, so the cost is probably in the per-frame path drawing and text rasterisation that headless software rendering exaggerates, not in a single call. A real gain needs a different approach, for example drawing each glyph once to an offscreen sprite and animating its transform, which is a larger change that was not attempted. The remaining candidate from section 6 is the `bg.js` background canvases (`starfield`, `core`, `resize`, about 175 ms together).
