### The Celestial Covenants: a sovereign visual concept page, and what had to stay out (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What was asked.** Build the franchise brief for *The Celestial Covenants* into the platform and make it a "sovereign visual graphic effect", not ordinary. The brief is marked Proprietary / Confidential / Internal & Investor Review.

**Decision recorded: what was published and what was not.** The repository is public and every served file is fetchable by URL (CLAUDE.md 8.2: the approval guard is a UI veil). So only the creative concept layer a press kit would show went in: title, tagline, the two key-art concepts, the palette, the fiction notice. Left out on purpose: trademark / copyright / insurance filing status, the risk register and crisis playbook, advisory-board terms and pay, pending scholar sign-offs, ratings plans, privacy retention figures, budget, press contacts, merchandise and the EULA text. `scripts/tests/test_celestial_covenants_truth.py` fails if any of those terms appear.

**What was built.** `celestial-covenants.html` + `omega-celestial-covenants.js`, MEDIA section of `nav.js`, `data-page`/dock like every other page. No image files, no third-party code, no network.
- 16:9 *Dual Covenants* stage: a diagonal Order/Abyss split with a gold-to-teal seam; a geometric Metatron (four wings, flat 2-D blade, orbiting sapphire sphere with a hard shadow); Queen Na'ila (obsidian figure, kelp gown with a flowing hem, translucent dove with a glowing wing line); chromatic-aberration title pulse; gold geometric motes on one side and bioluminescent bubbles on the other; pointer parallax; a brass lock toggle.
- 9:16 *Barhutiyyah Ring* phone concept: King Burqan (generated lightning hair, golden slit pupils), Al-Asad (an even fan of three-jointed bone fingers, a maw of four concentric toothed rings), scanline and gyro-style shimmer, HUD.

**Where the brief and the truth disagree, the page says so and builds only what is real.**
| brief | on the page |
|---|---|
| pupils track the user's gaze via device eye-tracking APIs | follow the **pointer** on this page; labelled "device eye-tracking is not used" |
| teeth pulse with device microphone input | not built; labelled; the page never requests a microphone |
| "ACTIVE" geofence / planetary hour | geofence shown as **spec, NOT ACTIVE, no AR runtime**; the readout is the weekday ruler only, since a true planetary hour needs location |
| mandatory legal EULA checkbox | **omitted**: a fake legal acceptance would be false |
| Lore-Safe Mode hides religious recitation | really hides every folklore-source mention on the page; default on; remembered in this browser only |
| DATA PURGE wipes session telemetry | really clears the page's one stored setting (there is no telemetry) |
No scripture appears and nothing is built on religious text.

**Platform behaviours met on the way.**
- `omega-readmore.js` clamped the cards behind MORE buttons, truncating the honesty statements. The documented opt-out `data-no-clamp` is set on the page root.
- First render had Burqan's face over the title stack, a tangled mane and a clipped glow; found by looking at screenshots, fixed, re-rendered.
- The harness hardcodes `chromium-1194`; this container has `chromium-1243`, so `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` was symlinked (system-level, outside the repo).

**Registering a new page: what it touched.** `nav.js` (map + MEDIA), `config/page-world-overrides.json` (district `citadel`, like `visual-atlas`), `config/page-character-manifest.json` (archetype `media`), `config/omega-page-contracts.json` + `config/omega-page-review-tasks.json` (one entry each, counts 243), `index.html` surfaces stat 243, `README.md` (two places), `OMEGA_SKILL_REGISTRY.md` (generated), the morph block (`omega-morph-sync.py`).
**Trap worth knowing:** `omega-page-contract-bootstrap.py --promote` regenerates *every* contract and **overwrote hand-recorded fields** (the insight redirect pages' curated `purpose`), failing `insight-legacy-route-tests`, and it re-derived about 700 lines of evidence for other pages. I reverted it and spliced in only this page's contract and task, in place. Do not run `--promote` for a one-page addition.

**Evidence.** `contract-suite.py`: 95 gates, 0 failing (new gate `celestial-covenants-truth`; the test also detects a planted `getUserMedia` / `innerHTML` and a planted confidential term). `check-inline-js.py`, `omega-registry.py --check`, `page-count-claims.py`: pass. Rendered in headless Chromium at 1440 and 390 widths, 0 page errors, 1 `h1`, no horizontal scroll, 15 bolts and 51 teeth built.
**Not claimed.** The "sovereign visual effect" is this page, not a restyle of the whole platform: a platform-wide repaint needs the render baseline and noise floor (CLAUDE.md 8.4), which was not done. No real-device AR, audio or location behaviour exists or was tested.

**Registrations the full local run (`ci-local.sh`) found that the contract suite alone did not** (each is one entry for this page, written in the file's own dialect so no unrelated line moves):
`config/omega-panel-eligibility.json` (**measured**, not typed: the census procedure run for this page, mounted as a panel inside `life.html`, loads with 2,840 characters and 0 page errors, host not navigated away -> `hostable`; derived through the tool's own `classify()` and `page_hash()`), `config/page-cores.json` (media core),
`config/omega-page-hub-ownership.json` (one row, `media.html` hub; `page_count` 243, `CANDIDATE_MERGE_PANEL` 200), `scripts/tests/test_omega_domain_hub_workspaces.py` (the specialist-route pin 184 -> 185 and 199 -> 200, test renamed from `test_184_...`),
and `scripts/tests/test_omega_experience_v6.py` (a typed `242` root-page count replaced by `len(root_pages)`, so adding a page no longer fails it for the wrong reason while it still requires every page to have a valid archetype).
**Second trap:** `omega-page-hub-ownership.py` regenerates all 243 rows and rewords the rationale on 209 of them; only this page's row was spliced in. Regenerated files (`omega-page-contract-bootstrap.json`, hub ownership, `page-estate.generated.json`) are rewritten by the gates on every run: do not commit that churn.
**Process slip, recorded:** a cleanup `git checkout config/...` reverted an uncommitted splice; caught because the diff stat came back empty, redone, and the dependent test re-run.

**Final evidence.** `contract-suite.py`: 95 gates, 0 failing. `ci-local.sh`: 36 steps pass; the 37th (2v) fails only because it needs a built `public/`, and after `vercel-build.sh` `omega-responsive-surface-contract.py` passes (251 pages). `verify-runtime.js --pages celestial-covenants.html`: PASS.
