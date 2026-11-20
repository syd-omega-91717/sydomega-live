# sovereign-core: cinematic layer per omega-cinematic-system spec

Date: 2026-11-20

The page was a static composition: three CSS rings that never moved, a text "Ω" as the core, and four
decorative `<span>` nodes. Spec target: `.claude/skills/omega-cinematic-system/SKILL.md` (Omega Orb, orbital
ring as navigation cue, no new animation engine, reduced-motion static state, no invented data).

- Core: `data-omega-sculpture="signet"` mounts the platform's existing 3-D layer (no second WebGL owner;
  `audit-webgl-ownership.py` PASS). It draws its own 2-D fallback without WebGL.
- Rings: `rotate` keyframes (120s / 84s reverse / 56s), compositor-only, composing with each ring's own
  tilt `transform`. Disabled by the page's existing `prefers-reduced-motion` rule.
- Nodes CORE / AI / WORLD / DATA are now real links (`/dashboard`, `/agents`, `/world`, `/analytics`) with
  accessible names, hover/focus lift. No invented status/pulse: none is backed by real state.
- Bottom padding reads `--omega-chrome-bottom` instead of a constant.

## Evidence (headless Chromium, stubbed Supabase, software GL)

- Desktop 1440x900: signet canvas live (`fallback:false`), buffer 258x260 >= box 258x260; ring `rotate`
  moved 16.5deg -> 24.1deg, 336.4 -> 325.6 (reverse ring), 35.5 -> 51.6 over 2.5 s; no overflow; 0 page errors.
- Mobile 375: buffer 396x400 >= box 198x200; no overflow.
- `prefers-reduced-motion: reduce`: animation `none` on all rings, page intact (`.shell`=1).
- `audit.py` 0 critical / 8 warnings, `module-contract.py`, `check-inline-js.py`, `reachability-contract.py`,
  `verify-runtime.js` PASS.

## Not verified / observed but left alone

- Sculpture reports `degraded:true` under software GL; real-GPU frame rate unmeasured.
- On mobile the platform's ambient orrery layer draws planets and a floating Ω across the page header
  (a shared background layer, not this page). Not changed here.
- Webfonts are stubbed in the harness; typography judged with fallback faces.
