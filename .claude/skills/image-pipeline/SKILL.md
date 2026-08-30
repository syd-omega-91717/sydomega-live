---
name: image-pipeline
description: Produce, add, or change imagery for sydomega-live — procedural SVG, canvas-rendered PNG (share cards, QR, exports), PWA/favicon raster, and member-uploaded images in Supabase Storage. Use when generating a graphic, adding any image file, wiring an <img>, changing an icon, or when asked to "generate an image" — and to understand why there is no AI image generation in this repo and what to do instead.
---

# IMAGE PIPELINE

## The constraint: this repo ships almost no raster

13 SVGs under `assets/` and four PWA raster files
(`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico`).
That's it. Every other "image" the platform shows is **generated at runtime
in the browser**, not stored:

| Source | Output | Module |
|---|---|---|
| member identity (auth/element/axis/gate) | deterministic **SVG** sigil | `omega-sigil-gen.js` |
| member profile | 1200×630 **canvas → PNG** identity card | `omega-share-card.js` |
| any string / URL | **canvas → PNG** QR code | `omega-qr.js` |
| page/lattice/axis | animated **canvas** page mark | `omega-page-emblem.js`, `omega-emblems.js` |
| app state | **PNG/JSON** exports, local backups | `omega-export.js`, `omega-local-backup.js`, `omega-nexus-export.js` |

**Prefer procedural SVG.** It scales, themes with `var(--token)`, needs no
file, adds nothing to git, and can't 404. Reach for raster only for things
SVG genuinely can't do (photos, PWA icons, an OG-style share PNG).

## There is no AI image generation here, on purpose

- No image model, no image API key, no `<img src>` to any generation
  service. `vault.html`'s CSP (`default-src 'self' https://*.supabase.co
  https://esm.sh`) would block an off-host image anyway, and other pages rely
  on the broken-asset gate.
- `OMEGA_EXTERNAL_ECOSYSTEM_AUDIT.md` and CLAUDE.md §10.1 already **rejected**
  non-Anthropic provider SDKs and ad/creative toolchains for this repo (wrong
  provider, wrong runtime, no ad surface — the site is `noindex, nofollow`
  and invite-gated).
- The connected MCP image tools (Adobe Firefly/Photoshop actions, Gamma
  `generate_image`, Canva, Figma) create **hosted artifacts with their own
  URLs**. They are appropriate only when the user explicitly wants an
  external deliverable — never as a way to source an asset for this
  static, self-hosted site. An image produced that way still has to be
  downloaded, optimized, committed, and referenced by a resolvable path to
  live in the repo.
- You **cannot** fetch reference images during `verify-in-browser` — the
  sandbox blocks every external host.

## Member-uploaded images

Handled by `upload.js` → `window.OmegaStorage`:

```
OmegaStorage.upload(bucket, file)      // -> { path } or { error }, 5 GB cap, auth required
OmegaStorage.publicUrl(bucket, path)
OmegaStorage.signedUrl(bucket, path, seconds)
```

Files land in Supabase Storage under `<user-id>/<timestamp>_<safe-name>` and
are served from `*.supabase.co` (which `vault.html`'s CSP allows). Storage
bucket access is governed by Supabase Storage RLS — treat a new bucket like a
new table (RLS required, `grill-me-codex` if it's member-writable).
Member-supplied image URLs rendered back into the page must be escaped with
`esc()` like any other member data (stored-XSS history, CLAUDE.md §8.1).

## Adding a raster file to the repo (last resort)

1. Optimize hard — this repo has **no LFS**; the bytes enter git history
   permanently (`REPOSITORY_AUDIT.md` §4). PNG through `oxipng`/`pngquant`,
   or ship WebP. If it's over a few hundred KB, ask first.
2. Put it under `assets/`, reference it by a root-absolute path that
   resolves to the committed file.
3. `bash scripts/ci-local.sh` — the **broken-asset check** and
   `production-contract.py` fail on any unresolved `src`/`href`.
4. If it's a **PWA icon**, `manifest.json`, `sw.js`'s `CORE_ASSETS`
   precache list, and `ci-local.sh`'s `manifest_icons` / `sw_precache` steps
   must all still pass. Regenerate all sizes together; don't leave the
   manifest pointing at a size you didn't ship.
5. Decorative images get `alt=""` + `aria-hidden`; meaningful ones get real
   `alt`. `<img>` needs `max-width:100%` to not cause horizontal overflow
   (`verify-in-browser`'s `overflow` scan).

## Generating a graphic in-repo — the normal path

1. Can an existing module do it? `OmegaSigil`, `OmegaShareCard`, `OmegaQR`
   cover identity marks, share cards, and codes. Extend the module.
2. New procedural graphic → new `omega-<name>.js` that builds an SVG string
   or draws to a canvas, wired into `bg.js`'s loader with a `data-omega-<name>`
   guard (unreferenced module = `scripts/audit.py` orphan finding).
3. Use `bg.js` `:root` tokens for every colour (see the `visual-assets`
   skill for the palette and the `design-system.html`-vs-`bg.js` drift).
4. Canvas sizing: use a `ResizeObserver`, never `offsetWidth` at
   `DOMContentLoaded` — the approval guard hides `#app` and a zero-width
   buffer never paints (CLAUDE.md §8.1 class 3).
5. `node --check`; `verify-in-browser` `errors` + `canvas` scans;
   `python3 scripts/audit.py` — no new CRITICAL.

## Guardrails

- No build step, no image CDN, no AI image service wired into the site.
- Procedural SVG first; raster only when SVG can't do it, and only after the
  size question is answered.
- Every shipped `src`/`href` resolves to a committed file — the gate is
  blocking.
- Member image content is untrusted: escape URLs, bucket RLS required.
- MCP image tools are for external deliverables the user asked for, not for
  sourcing repo assets.
