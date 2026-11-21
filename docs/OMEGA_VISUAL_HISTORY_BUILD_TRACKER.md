# OMEGA VISUAL + HISTORICAL BUILD TRACKER

This file records implementation targets recovered from the project history without treating specifications as evidence of implementation.

## Visual priority
- Canonical WebGL owner: `omega-sculpture.js`.
- Existing visual bridge: `omega-visual-runtime.js`.
- Existing additive spatial layer: `omega-spatial-realms.js`.
- Do not introduce a competing WebGL renderer.
- Expand visuals through data-driven scenes, navigation, interaction, and real destinations.

## Historical gaps to verify/build
- Globe / world-scale visualization.
- Trophy / achievement visualization.
- Ω identity / signet scene variants.
- 9x9x9 pillar / lattice visualization.
- Holographic seal / passport presentation.
- Particle-field / atmospheric layers.
- Cinematic loading and transition system.
- Data-driven leaderboard / podium presentation.
- AI streaming visual interface.
- Passport / credential card visual system.
- Rich chart/data visualization surfaces.
- Mobile visual composition.
- Deeper gaming and cinema world presentation.

## Security follow-up
Dynamic HTML interpolation remains an audit category. Each occurrence must be classified as static trusted markup, escaped/sanitized markup, or unsafe dynamic interpolation before modification.

## Verification rule
A target is marked implemented only after source evidence plus runtime/contract evidence. Provider-blocked items remain explicitly blocked.

## Verified implementation wave — 2026-11-21

- PR #1480 merged: the 9×9×9 matrix accent selection is deterministic; regression coverage rejects unseeded randomness in that scene.
- `movies.html` now labels its twelve legacy Zodiac/Sovereign visual entries as **archetype concept reels**, not twelve completed franchise films. The page explicitly distinguishes procedural preview loops from feature-film screenplays, production footage, voice, score and release state.
- The disclosure is responsive and remains visible above the 3-D carousel and poster wall.
- Regression tests: `scripts/tests/test_media_status_truth.py` checks the twelve-entry inventory, poster/video pairing, truth labels and mobile disclosure.

## Next visual build priorities

1. Finish human review of all 501 tracked images and frame-sampled review of all 31 tracked MP4s. The repository inventory and hashes are not visual review or rights clearance; the frozen baseline remains unreviewed.
2. Assign each reviewed asset a canonical role: franchise / series / episode / character / world / agent / UI reference / concept study / procedural preview. Do not map the twelve archetype posters to the seven Studios franchises without an explicit canon mapping.
3. Resolve poster typography clipping and repeated compositions; maintain title-safe zones, responsive crop focal points, readable contrast and accessible text alternatives.
4. Connect the seven Studios franchise records, their film/series/game records and existing scripts to a dedicated visual library. Render status from the canonical registry and production records; never infer publication from an image or video file.
5. Build a mobile-first 2-D composition for each 3-D scene instead of hiding all meaningful spatial content on narrow screens. Keep `omega-sculpture.js` as the sole WebGL owner.
6. Profile real GPU devices and thermal behavior before raising particle counts, DPR, bloom or frame-rate targets. Software-renderer timing is not GPU performance evidence.

## Release gates

- A visual review status is separate from rights review.
- Rights remain UNVERIFIED until evidence, creator, license, attribution and permitted-use scope are recorded and reviewed.
- CONCEPT_REEL / PROCEDURAL_PREVIEW is not SCREENPLAY_DRAFT, IN_PRODUCTION or PUBLISHED.
- No visual reward, trophy, character unlock or member achievement is granted by the presence of artwork.
- Every visual change must pass page contracts, accessibility checks, responsive browser review, reduced-motion checks and the repository's existing security/runtime gates.

## Production verification — main commit 72372a3 — 2026-11-21

- PR #1482 restored the shared `FILMS` navigation contract on both Movies and Series pages while preserving the concept-reel and short-form-series disclosures. All PR checks passed; the merge is on `main` at `72372a389382eafae946e38d1668ac9df461d3ae`.
- Push-triggered production verification then confirmed that both `https://sydomega.com` and `https://www.sydomega.com` served the exact merge SHA in `.well-known/omega-release.json`.
- The production release smoke reported 242/242 registered pages passed and 380 references passed; root and www returned HTTP 200. The verifier also required CSP and HSTS response headers.
- Supabase Auth and REST health endpoints responded with HTTP 401 without credentials. This proves the endpoints are reachable and rejecting unauthenticated requests; it does not prove authenticated application operations or end-to-end data workflows.
- The Vercel PR artifact-validation workflow passed, but its PR-triggered production-promotion steps were skipped. The verified public release above is the Cloudflare Pages path; do not record this as a Vercel deployment.

## Remaining media acceptance gates — unchanged

- Issue #1341 remains open: the 532-file baseline still requires human visual disposition and evidence-backed rights/provenance review. Inventory, hashes and representative video frames are not legal clearance.
- Issue #1340 remains open: the production media catalog and Storage delivery workflow still require MIME/signature validation, malware quarantine, approved catalog records and real production upload/download/delete evidence.
- No new media is approved for publication by the production route smoke. Keep the 532 baseline assets UNREVIEWED/UNVERIFIED until individual evidence-backed decisions are recorded.
