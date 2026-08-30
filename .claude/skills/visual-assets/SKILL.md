---
name: visual-assets
description: Design or change any visual element of sydomega-live — SVG assets, sigils, emblems, share cards, page marks, palette, typography — so it matches the platform's canonical design language and its no-build, no-CDN-image, noindex constraints. Use when adding or editing anything under assets/, any omega-*emblem/sigil/share-card*.js module, page-local visual CSS, or when picking a colour, font, or icon.
---

# VISUAL ASSETS

## The canonical source is `bg.js`, not `design-system.html`

`bg.js` injects the real `:root` design tokens as a `<style>` tag on all 179
pages (CLAUDE.md §3, §4). That block is authoritative. `design-system.html` is
a *showcase* of the system and it has already drifted from `bg.js` — e.g. it
lists `--sp-xs: 6px / --sp-sm: 10px / --sp-md: 14px`, while `bg.js` ships
`--sp-xs:4px / --sp-sm:8px / --sp-md:12px / --sp-lg:18px / --sp-xl:28px`. When
they disagree, `bg.js` wins; fixing the showcase to match is a valid small
task, inventing a third set is not.

### Colour tokens (from `bg.js` `:root`, line ~105)

```
--void #0A0A0F   --gold #C9A84C   --solar #E2C86D   --cyan #00E5FF
--crim #C4453C   --green #3fb27f  --purple #9B6BF0
--muted #8a8676  --ink #e9e6dc
--line rgba(201,168,76,.15)   --line-cyan rgba(0,229,255,.12)
plus -deep / -light / -pale ramps for gold, cyan, green, purple
plus --overlay-gold / --overlay-cyan (+ -hover)
```

Gold is the sovereign accent, cyan the secondary/tech accent, purple the
"soul/space" accent, crimson for danger/revoke only. Backgrounds are near-black
on near-black; contrast comes from the gold `--line` hairline, not from fills.
**Use the token (`var(--gold)`), never the hex**, in any new CSS.

### Typography — three families, variable weight

```
--D  "Cinzel Decorative", serif   → headers, KPI numbers, sovereign names
--R  "Rajdhani", sans-serif       → body, descriptions, readable text
--M  "Courier Prime", monospace   → data, labels, metrics, code
```

Loaded once by `bg.js` from `fonts.googleapis.com` (`css2?family=Cinzel+Decorative…`).
That is the **only** external stylesheet the platform allows. Do not add
another font, another `<link>`, or a self-hosted face without a decision.

### Element palettes (identity system)

`omega-sigil-gen.js` defines the nine element palettes (Fire, Water, Wind,
Metal, Sand, Soul, Space, Void, "The All"), each `{primary, secondary, bg,
glow}`. These already drift between modules — Fire is `#FF6B35` in
`omega-sigil-gen.js` but `#E86A3A` in `omega-emblems.js`. If you touch element
colour, reconcile against `omega-sigil-gen.js` as the reference and note the
drift rather than adding a fourth value.

## Asset rules (no-build, CSP, noindex)

- **SVG only, and either inline or under `assets/`.** The repo ships 13 SVGs
  and zero raster files. `scripts/production-contract.py` and `ci-local.sh`'s
  broken-asset check fail on any `src=`/`href=` that doesn't resolve to a
  committed file — no hotlinking, no CDN images, no `<img>` to an external
  host. See the `image-pipeline` skill before adding any raster asset.
- **Decorative marks get `aria-hidden="true"`** and must not be the only
  carrier of meaning. `bg.js`, `omega-a11y.js`, and `interface-guidelines`
  enforce this; `verify-in-browser`'s scans catch tap-target and overflow
  regressions a new visual can introduce.
- **`prefers-reduced-motion`**: every animated mark in this repo still *draws*
  when motion is reduced — it stops rotating, it doesn't disappear. Match
  `omega-page-emblem.js` / `omega-emblems.js`, which do exactly this.
- **Canvas sizing**: a canvas measured from `offsetWidth` at
  `DOMContentLoaded` gets a zero buffer because the approval guard still hides
  `#app` (CLAUDE.md §8.1 class 3). Use a `ResizeObserver`. This has killed
  real canvases (`#galaxy-canvas`, `#eco-canvas`).
- **CDN-backed visuals can't be verified in the sandbox** — tsParticles, d3,
  three.js, Leaflet are all blocked. `#omega-particles-canvas` reads blank
  locally and is fine in production. Don't "fix" a blank CDN canvas.

## The existing visual modules (reuse before adding)

| Module | Public API | Draws |
|---|---|---|
| `omega-sigil-gen.js` | `OmegaSigil.generate/mount/download` | deterministic per-member SVG sigil from auth/element/axis/gate; auto-mounts `[data-sigil]` on `omega:user-loaded` |
| `omega-share-card.js` | `OmegaShareCard.render/download/share/showModal` | 1200×630 canvas identity card (PNG) |
| `omega-emblems.js` | `[data-omega-emblem="Aries"]`, `[data-omega-sigil]` | 12 zodiac emblems, counter-rotating rings |
| `omega-page-emblem.js` | `<div data-page-emblem="academy">` | per-page mark derived from the page's lattice/axis/glyph |
| `omega-emblem-panel.js`, `omega-page-emblem.js`, `omega-sign-codex.js` | — | supporting emblem UI |

Deterministic identity math (`AUTH = √(a³+b³+c³)·φ/e`, 12 gate thresholds)
is duplicated across `omega-share-card.js`, `omega-sigil-gen.js` and others,
and the threshold arrays **do not match** between them. If your change depends
on gate/auth values, pick one module's constants, cite it, and flag the
divergence — do not silently add another copy.

## Steps for a visual change

1. Identify the token/module that already owns this. Grep `omega-*emblem*`,
   `omega-sigil*`, `omega-share*`, and the `:root` block in `bg.js`.
2. Make the change in tokens or the owning module — not in page-local
   `<style>` (CLAUDE.md §3: shared components live in `bg.js`'s injected
   stylesheet).
3. `node --check` every touched `.js`. Wire any new `omega-*.js` into
   `bg.js`'s loader with the `data-omega-*` guard, or `scripts/audit.py`
   flags it orphaned.
4. Verify rendering with `verify-in-browser` (errors, taps, overflow,
   dupids, canvas scans) — source parsing does not prove a mark drew.
5. `python3 scripts/audit.py` — no new CRITICAL. If you added an SVG under
   `assets/`, confirm every page that references it still resolves.

## Guardrails

- No new build step, no CSS framework, no second web font, no external image
  host.
- `var(--token)` not raw hex; `bg.js` `:root` is the source of truth.
- Decorative = `aria-hidden` + not meaning-bearing + reduced-motion safe.
- Don't upgrade `design-system.html` claims to "verified/canonical" — it is a
  showcase that lags the tokens.
