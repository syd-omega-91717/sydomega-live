---
name: cinematic-media
description: Work on sydomega-live's video and "cinematic" motion surface — the welcome demo video and its wiring, the transition/2.5D/motion engines, and the cinema/trailers/studio pages. Use when adding or changing a video, a page transition, a scroll reveal, a count-up, a HUD/vignette layer, or when someone asks to "make it more cinematic" or produce a trailer/demo clip.
---

# CINEMATIC MEDIA

## What this repo actually has

There is **no video build pipeline** — no ffmpeg, no MediaRecorder capture,
no encode step anywhere in the repo. "Cinematic" here means two distinct
things, and one committed file:

1. **One welcome video.** `SYDOMEGA91717_DEMOD-1-.mp4` (3.7 MB) committed
   directly to git (no LFS; `.gitattributes` marks it `-diff -text`). It
   ships to production (`*.mp4` is *not* in `.vercelignore`) and is served
   from `/`.
2. **Motion engines** that give every page a produced feel, all reaching
   pages through `bg.js` with no markup changes:
   - `omega-cinematic.js` — page-transition curtain, `[data-reveal]` scroll
     reveals, `[data-countup]`, `[data-stagger]`, `[data-scan]`.
   - `omega-cinematic-engine.js` — fixed 2.5D HUD layer (vignette, scanlines,
     corner ticks, crosshair, a parallax particle canvas), desktop only,
     `prefers-reduced-motion` hides it entirely.
   - `omega-motion.js` — entrance choreography, value roll-up, pointer tilt,
     press feedback, built on the **Web Animations API** (see below).
   - `omega-demo-video.js` — the modal player and gating for #1.
3. **Content pages** framed cinematically but not video tools:
   `cinema.html` (mythology content, "sourced live from Wikipedia"),
   `trailers.html` (a hero page), `studio.html` (a creative-works pipeline
   tracker: draft → review → approved → archived), `media.html`.

## The demo video — three faults that kept v1 from ever playing

All three are recorded in `omega-demo-video.js`'s header and are the pattern
to not repeat:

1. **It wasn't on the landing page.** v1 loaded via a per-page `<script>` on
   41 of 105 pages; `dashboard.html` — where `account.html` redirects after
   login — was not one. Fix: registered in `bg.js`'s loader
   (`scripts/register-demo-video.py`, idempotent, `data-omega-demo` guard),
   which loads on 179/179 pages.
2. **It couldn't stream.** The `.mp4` had `moov` *after* `mdat`, so the
   browser had to download all 3.7 MB before the first frame. Fix: remux with
   `ffmpeg -movflags +faststart` — **no re-encode, no quality loss**.
   **Any new or replacement video MUST be faststart-remuxed before commit.**
3. **Every failure was swallowed** (`.catch(function(){})`, silent
   `if(!d)return`). Fix: columns are probed not assumed, every failure logs a
   reason, and there are diagnostics:
   ```
   await window.OmegaDemo.diagnose()   // why it did / didn't play
   window.OmegaDemo.replay()           // force open, ignore gating
   window.OmegaDemo.reset()            // clear the "watched" mark
   ```
   `demo-check.html` is the manual test page.

Gating keys in localStorage: `omega_demo_watched_at` (and
`subscription_status` / `demo_watched_at` columns in Supabase). The
`verify-in-browser` harness pre-seeds `omega_demo_watched_at` so the modal
doesn't block clicks in tests.

## Replacing or adding a video

This is an **out-of-repo production task** plus an in-repo wiring task:

1. Produce/edit the clip with whatever external tool. Keep it small — this
   repo has no LFS and the file goes straight into git history forever
   (`REPOSITORY_AUDIT.md` §4 tracks this as debt; adding a second large
   binary makes it worse — ask first).
2. `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4` and verify the
   `moov` atom is first.
3. Commit the file. Confirm it is reachable at its `/`-path and that
   `ci-local.sh`'s broken-asset check passes.
4. If it's the welcome video, keep the filename or update `VIDEO_SRC` in
   `omega-demo-video.js`; re-run `scripts/register-demo-video.py` if the
   loader wiring changed.
5. The hosted-video MCP tools (HeyGen HyperFrames, Adobe video, Vivideo
   prompt builder) produce **hosted artifacts with their own URLs** — they do
   not integrate with this static, self-hosted, `noindex` repo. Use them only
   if the user explicitly wants an external hosted deliverable, not as a way
   to add video to the site.

## Motion-engine traps (from `omega-motion.js` and CLAUDE.md §8.1)

- **Use the Web Animations API, not `opacity:0` + an IntersectionObserver
  class.** 36 of 43 `.tbl-wrap` live in `display:none` tab panels and never
  intersect; the approval guard hides `#app` until a profile check resolves
  and fires no event when it lifts; any JS error between hide and reveal
  leaves content permanently invisible. `omega-motion.js` already solves this
  — extend it, don't reinvent it in a page.
- **Everything must be usable with `prefers-reduced-motion: reduce`** —
  transitions become instant, the 2.5D HUD is removed, reveals still show
  their content. Never gate *content visibility* on an animation completing.
- **Transform + opacity only** for anything animated (GPU); no animating
  layout properties.
- **The 2.5D particle canvas and any CDN-backed effect read blank in the
  `verify-in-browser` sandbox** and are fine in production — don't "fix" them.
- Fixed HUD/overlay layers compete for the viewport with ~6 other fixed
  widgets (CLAUDE.md §8.4); hit-test with `document.elementFromPoint`, and
  run `verify-in-browser`'s `chrome` scan after any fixed-layer change.

## Verify

- `node --check` every touched `.js`; new `omega-*.js` wired into `bg.js`
  with a `data-omega-*` guard or `scripts/audit.py` flags it orphaned.
- `verify-in-browser`: `scan.js errors`, `taps`, `overflow`, `chrome`,
  `canvas` — record the headline number before and after.
- For the demo player specifically: load `demo-check.html`, run
  `OmegaDemo.diagnose()`, confirm the modal opens, plays, and is dismissable
  with the keyboard.

## Guardrails

- No build step, no encode step in the repo. Video production happens
  elsewhere; the repo only stores and wires the result.
- Faststart remux is mandatory for any `.mp4` that ships.
- Don't add a second large binary to git history without asking.
- Reduced-motion is a hard requirement, not a nice-to-have.
- Cinematic polish never blocks or hides content, and never ships a
  monetizable surface that isn't flag-gated (CLAUDE.md §9).
