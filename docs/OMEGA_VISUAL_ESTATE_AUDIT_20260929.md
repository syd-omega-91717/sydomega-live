# Ω Visual Estate Audit — owner collections (2026-09-29)

Scope: `BlockChain_Market_Analysis_syd_omega_91717/`, `Trophies_S.Y.D_Omega_91717/`,
`Zodiac_signs/`. Every image was hashed (`sha256sum`) and every unique image was
rendered to contact sheets in the harness Chromium and inspected. Reference counts
are greps of shipped `.html/.js/.css/.json` outside the collections themselves.
Everything below is measured; nothing is inferred from file names alone.

## 1. What is there

| measure | value |
|---|---|
| raster files | **404** |
| unique by content hash | **313** |
| byte-identical duplicate copies | **91** (11.8 MB) |
| total size | ~49 MB (45 MB + 2.3 MB + 1.6 MB) |
| shipped to production | all of it — `scripts/vercel-build.sh` copies by extension, not by directory |
| referenced by any page or module | **5 folders**: `Phases_syd_omega_91717`, `Trophies_S.Y.D_Omega_91717` (root), `horoscope_sign`, `medals`, `certificates` |

Folders that are byte-identical twins (the capitalised copy and the lower-case one):

| pair | identical files |
|---|---|
| `Logo_Phases_Levels_Grades_S.Y.D_Omega_91717` ⇔ `logo_phases_levels_grades` | 26 |
| `BlockChain…/Trophies_S.Y.D_Omega_91717` ⇔ `/Trophies_S.Y.D_Omega_91717` | 20 |
| `Horoscope_Sign_S.Y.D_Omega_91717` ⇔ `horoscope_sign` | 12 |
| `Logo_Medal_Stage_1_to_9_S.Y.D_Omega_91717` ⇔ `logo_stage_1to9.png` (a directory) | 10 |
| `Medals_S.Y.D_Omega_91717` ⇔ `medals` | 8 |
| `Mobile_app_Design_…` ⇔ `mobile_app_design_…` | 6 |
| `Certificates_S.Y.D_Omega_91717` ⇔ `certificates` | 3 |
| `NFT_HOMOGENIC_OMEGA_91717` ⇔ `NFT_syd_omega_91717` | 2 |

`components/` holds 12 React `.tsx`/`.jsx` components and their `.css`. This platform
has no framework (CLAUDE.md §1); nothing imports them. `.tsx` is excluded by
`.vercelignore`, but the `.css` files ship.

## 2. Defects found in the art itself

These are properties of the source pixels. Code cannot correct them honestly; they
need re-exported art from the owner.

| asset | defect | where it shows |
|---|---|---|
| `horoscope_sign/*` (12), `Logo_Medal_Stage_*` (10), 4 of `Zodiac_signs/` | "transparency" is a checkerboard **baked into the JPEG** | anywhere the raw file is used on the dark UI — white tiles. The World gallery did exactly this until 2026-09-29 (now uses `/assets/legacy/sign-*.webp`) |
| Stage 8 medal | spelled **"SOVERRIGN"** | Passport (`profile.html`) for every stage-8 member |
| Stage 1–4, 6, 7 medals | the generator's **filename caption is rendered into the image** (`logo_stage.2.png` under the Stage 4 "MASTER" medal) | faint residue under the Passport cutouts |
| `Zodiac_signs/` | 12 files, **11 signs**: Aries twice (`(8)`, `(9)`), **no Taurus**; names are WhatsApp timestamps | unused — the complete, named set is `horoscope_sign/` |
| many files | a generator watermark (✦) in the bottom-right corner | every card that shows the raw file |
| most files | `WhatsApp Image … .jpeg` / `IMG-2026…-WA0nnn.jpg` names — recompressed chat exports, not masters | provenance and quality ceiling |

## 3. Design language the collections establish (use it; do not re-invent it)

- **Two families, not one.** Gold-on-obsidian (heraldic: crowns, shields, laurels,
  S.Y.D monogram) for *authority and identity*; cyan-holographic (circuit glyphs,
  HUD rings, glass discs) for *intelligence and systems*. `--gold`/`--cyan` in the
  token set already encode exactly this split.
- **The ring is the unit.** Phases, medals, zodiac discs and trophies are all a
  subject centred in concentric rings. `omega-constellation.js`, `.omg-ring` and the
  sculpture `signet` already speak this grammar — new UI should compose rings, not
  add rectangles.
- **Tier colour is canonical in the art**: copper → silver → gold → emerald for
  Casual → Verified → Premium → Emerald Sovereign (`Phases_syd_omega_91717`,
  `IMG-20260101-WA0178..0190`). `omega-legacy-constellation.js`'s `colors` map
  already follows it.
- **The lion-cube** (Casual/Emerald/Premium phase 1–5) is the platform's recurring
  mascot mark; the eye-in-shield is the security mark (Sentinel/Warden domain).

## 4. Truth boundary (unchanged, restated because the art invites crossing it)

NFT, coin/token, credit-card and certificate artwork depicts concepts. It is **not**
evidence of issuance, value, ownership, credentials or payment. `tokens_enabled` and
`payments_enabled` are `false` live; any surface using this art must keep the
`SOURCE ASSET · NOT AN EARNED RECORD` labelling `omega-legacy-constellation.js` uses.

## 5. Roadmap — highest leverage first

1. **Owner: re-export masters** for the stage medals (fix "SOVEREIGN", drop the
   baked captions) and the 12 signs, as PNG with real alpha, no watermark. Then
   re-derive `/assets/legacy/` from them. Nothing else here removes the defects in §2.
2. **Remove the 91 duplicate copies (11.8 MB)** — keep the folder each consumer
   reads; `git mv`/delete the twin; run `test_legacy_assets.py` and the broken-asset
   gate. Low risk, but it touches owner files, so it needs the owner's go-ahead.
3. **One derived-asset pipeline.** `/assets/legacy/` was produced by hand in the
   harness (FIXES_LOG, 2026-09-28). Commit the derivation as a script under
   `scripts/` (like `build-og-image.js`) so a re-exported master regenerates every
   cutout deterministically, then point Phases and Trophies at 512px WebP
   derivatives too (the World gallery currently loads ~2.3 MB of trophy JPEGs).
4. **Earned-state rendering, not gallery rendering.** The art is strongest when it
   *reflects a record*: the Passport already shows the member's sign + stage medal
   from `profiles.sign` and the axis-derived stage. The same rule extends to
   `achievements.html` (medal art only for rows in `trophies`/`medals`) and the
   Mission State layer (phase art for a server-confirmed transition). Never from
   the artwork alone.
5. **Stop shipping `components/`** (React sources) — add the directory to the
   `vercel-build.sh` exclusions or delete it after the owner confirms.
