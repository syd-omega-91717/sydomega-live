# Master deployment spec vs this repository (2026-11-06)

The owner pasted a "MASTER MASTER REPO DEPLOYMENT PACKAGE" that says the system is "secure and fully compiled" and
orders "deploy without deviation": a React/Vite + Express/Prisma/Redis monorepo, pushed to Render and Vercel. This file
checks each part of it against the repository as it is, so a later session does not have to redo that, and records what
was **not** built and why. Nothing here changes runtime code.

Status words: **MATCHES** (the repo already does this), **DIVERGES** (both exist and differ), **NOT BUILT**,
**NOT AS FACT** (a claim the repo cannot support and its own rules forbid presenting as live).

## 1. Architecture and deployment

| spec | status | evidence |
|---|---|---|
| Monorepo `apps/api`, `apps/web`, `apps/mobile`, Prisma, Redis, Docker Compose | **NOT BUILT, and not to be built** | `CLAUDE.md` §1 and §9: static site, Supabase backend, "no build step or framework migration without discussing it first". No `apps/`, no `prisma/`, no `docker-compose` in the tree. A migration would replace 236 pages and 415 migrations that already run. |
| "SYSTEM STATUS: SECURE & FULLY COMPILED" | **NOT TRUE** | Nothing is compiled; there is no compile step. Production state is unverified: the Supabase connector in the audit session had no permission on `ydqhzvvoyufiiqvzcjns`, and the production-facts workflow has not been run. |
| Deploy to Render + Vercel | **NOT THE PRODUCTION PATH** | Production has been Cloudflare Pages since 2026-10-18 (`docs/CLOUDFLARE_PAGES_CUTOVER.md`). The Vercel team is paused for Edge Requests; `vercel.json` disables auto-deploy on every branch. Merging to `main` already deploys (Cloudflare Pages, Supabase integration). |
| `npx prisma migrate dev --name init` | **WRONG TOOL** | Schema authority is `supabase/migrations/` (`CLAUDE.md` §5); two migrations are `PENDING_REVIEW` and must not be applied blind. |

## 2. Visual law

| spec | status | evidence |
|---|---|---|
| Gold `#C9A84C`, cyan `#00E5FF`, void `#0A0A0F` | **MATCHES** | `theme.js:13,18,32`, `css/omega-system.css:17-19` |
| Cinzel Decorative / Rajdhani / Courier Prime | **MATCHES** | `css/omega-system.css:42-44` (`--D`, `--R`, `--M`) |
| Crimson `#8B0000`, muted `#6B6B80`, emerald `#4ADE80` | **DIVERGES (crimson, muted); emerald is fine** | repo `--crim:#CF6760`, `--muted:#8796A1`, `--green:#3fb27f`. Contrast on `#0A0A0F` (computed): spec crimson **1.97:1** (below the 3:1 floor `verify-runtime.js` blocks on), spec muted **3.80:1** (passes the floor, fails 4.5:1 for body text), spec emerald **11.33:1** (fine as text). Repo values: crimson 5.42, muted 6.50, green 7.42. Use spec crimson for fills and borders only; spec emerald could be adopted if the owner prefers it. |
| Glass spec (blur 20, radius 14, gold 0.1 border) | **MATCHES in spirit** | `.glass` and `.card` in `bg.js` and `omega-visual-evolution.css`; exact numbers differ per surface, and the cascade is not `bg.js`'s to win (`CLAUDE.md` §4). |
| Tokens named `--omega-*` | **DO NOT ADD** | A second token set is `CLAUDE.md` §8.1 class 8 (divergent copies). Change both owners (`theme.js` and `css/omega-system.css`) or nothing ships. |
| No light mode, Ω as the only icon, no clock imagery | **Compatible** | `scripts/brand-glyph-check.py` gates glyphs; no light theme is shipped. |

## 3. The 12 agents (`omega-agents.json` is canonical)

The twelve **names** match. The **attributes do not**: the spec gives Sentinel "Metal / Geb", Analyst "Water / Enki",
Historian "Earth / Geb", Tutor "Air / Vayu", Merchant "Fire / Hephaestus" and so on. The repo gives each agent a zodiac
sign, element and Greek god, e.g. Sentinel = Aries / Fire / Ares, Merchant = Taurus / Metal / Aphrodite, Tutor = Aquarius /
Wind / Hephaestus, Historian = Pisces / Water / Poseidon. These are two different mappings of the same twelve names.
**Not changed.** Per `CLAUDE.md` §8.1 class 8 the roster has one owner; if the owner wants the spec's mapping, change
`omega-agents.json` and its readers in one reviewed PR. The spec's "60-second background execution cycle" and "emerald
status indicators" are not claims the repo supports: the agents are a naming and navigation system, "not a technical
multi-agent runtime" (`CLAUDE.md` §6).

## 4. Tiers, matrix, token ladder

| spec | status | evidence |
|---|---|---|
| 9 subscription tiers $9 to $999 | **PARTLY** | tier numbers 1-9 exist (`omega-canon.js:42` `tierUnlocks`, stage names in the progression migration). The prices and the names Sydomegain / Omegasydein / Zenith were not found as a billing catalogue; checkout is held `LOCAL_ONLY` and `tokens_enabled` is `false`. Adding prices to a live Stripe product is a payments change (`CLAUDE.md` §5, §9). |
| 729-node 9x9x9 matrix | **DECIDED 2026-11-06: 104,976** | The owner confirmed the matrix is 12x12x9x9x9 = **104,976**. The repo already says so: `matrix.html:222` ("The 104,976-Node Matrix"), `omega-canon.js:62-72` (asserts 104,976 at load), and `docs/IDEA_INTAKE.md:29` **rejected** "9x9x9 = 729-node matrix" on 2026-10-13. 729 is the **inner 9x9x9 cube** at each intersection (`matrix.html:267,369`, `omega-copilot.js:49`) and stays valid as that. A second lattice, nine-fold 9^5 = 59,049, also exists in the canon. The database table `omega_matrix_nodes` holds the 729 inner nodes (`config/omega-implementation-ledger.json` MATRIX-001, evidence 'verified live'); it does not store the 104,976 lattice, which is computed from the canon. Materialising 104,976 rows would be a schema and data decision, not a copy edit. Fixed here: the product catalogue and the concierge reference prompt no longer call 729 the total. |
| 9-grade token ladder ($0.01 to $917.17) | **PRESENT in schema and pages** | `supabase/migrations/0001_omega_master_deploy.sql`, `0050_omega_payments.sql`, `income.html`, `cosmos.html` mention it. It is dormant behind `tokens_enabled=false` (`supabase/chunk_03_migrations.sql:518-527`). |
| Founder card (name, level, credential number) | **PRESENT** | `profile.html`, `vault.html`, `sovereign-covenant.html`, `omega-user.js`. |

## 5. Not as fact: money, reserves, automation

These must not be built or displayed as live. The repo's own counsel brief already names them:

| spec claim | repo's own assessment |
|---|---|
| 51% founder stake, public float, peg, flash-crash "safety net" backed by Rhodium | `docs/COUNSEL_BRIEF.md:94`: "a token issued to the public, with value managed by the issuer, may be a security, e-money or a virtual asset" |
| Smart contracts sweeping 20% hourly into gold, silver and rhodium | `docs/COUNSEL_BRIEF.md:97`: "holding or investing customer funds; commodity dealing" |
| Reserves: gold 412,300 g, rhodium 125,000 g, silver 890,000 g, vault 467,756,700,000 | no custody evidence anywhere in the repo or this audit. `vault.html` already labels the reserve "PLANNED", "PENDING", "PHASE III", which is the honest state (§8.1 class 9 on fabricated data, `scripts/commerce-contract.py`). |
| Dead-man's switch transferring 100% admin control | a legal and security design (identity proof, false-trigger risk, jurisdiction), not a feature to flip on. |
| Autonomous hosting migration on "hostile interference" | not built; an automated failover that moves production without a human is an outage risk. |
| "Irrevocable" cryptographic property titles in a Genesis Block | not built; no on-chain component exists. |

## 6. What the owner can decide (and what was done)

Done in this change: this document only.

Needs a decision, one PR each: (a) which agent mapping is canonical; (b) ~~matrix size~~ decided: 104,976; (c) whether the nine tier prices go into the billing catalogue, behind a flag; (d) counsel sign-off on §5
before any of it is described to members as active.

Needs access: the production-facts workflow with `SUPABASE_ACCESS_TOKEN`; Cloudflare Web Analytics; rotating any real
credentials from the April spec.

## 7. Creative universe (started 2026-11-06)

The spec's seven franchises (22 planned films, seven game concepts) are now recorded in `config/omega-franchise-slate.json` and shown on the SLATE tab of `universe.html`, every one as **CONCEPT**: the repo has no scripts, footage or playable builds for them, and the spec's "complete scripts" and "AAA games" were not verifiable here. This slate is separate from the 12-film Olympian slate on `media.html` (F01-F12) and the series on `series.html`; **which canon wins, or how they merge, is an open owner decision.** A title moves past CONCEPT only when evidence is added to the JSON; `scripts/tests/test_franchise_slate.py` enforces it.

**Update (Zodiac Wars):** a draft canon bible now exists at `docs/canon/zodiac-wars/BIBLE.md` (founder's pitch verbatim, everything else proposed). It follows the platform's sign/element/god table and is pinned to it by `scripts/tests/test_zodiac_wars_canon.py`. It awaits the founder's approval; the other six franchises have no bible yet.

**Update (universe canon):** decided under delegation, reversible: one universe, with the 12-chapter saga on `media.html` as chronology and the seven franchises as windows onto it (`docs/canon/UNIVERSE.md`, `config/omega-universe-canon.json`). This settles the open question above as a proposal awaiting the founder's approval. Flagged, not changed: chapter 1 is marked IN PRODUCTION on `media.html` without evidence, and chapter 12 says 729 nodes.
