---
name: i18n
description: Work on sydomega-live's translation layer — i18n.js (the inlined English key set T_EN) and i18n/{ar,es,fr,hi,nl,zh}.json. Use before adding or renaming a data-i18n key, editing any dictionary value, adding a language pack, or touching i18n.js's apply()/t()/translate() path. scripts/i18n-contract.py gates this in CI (blocking).
---

# I18N

## Shape

- **`i18n.js`** holds `T_EN` (English) inlined as the canonical key set, plus
  the runtime: `OmegaI18n.t(key)` / `.translate()`, and `apply()` which walks
  `[data-i18n]` elements and sets text/attributes. Loaded platform-wide.
- **`i18n/<lang>.json`** — one flat `{key: value}` per language (`ar`, `es`,
  `fr`, `hi`, `nl`, `zh`). The merge loop is driven by `T_EN`: a pack only
  contributes values for keys `T_EN` already has; a key a pack has and `T_EN`
  does not is dead weight.
- Active language: `omega_lang` in `localStorage` (device-local). A missing
  pack key falls back to English **by design** — coverage is reported, not
  required.
- `scripts/omega-registry.py` commits each pack's key count to the platform
  census, so a silent key loss changes a committed number and fails `--check`.

## The four things `scripts/i18n-contract.py` blocks on (and why)

Each maps to a real defect that shipped green before the check existed:

| check | defect it caught |
|---|---|
| every `i18n/*.json` parses | `nl`/`zh`/`hi` shipped 14 keys short for weeks — one commit wrote translations but left the file unparseable, the next "fixed" the parse error by restoring the pre-translation blob and dropped the translations with it |
| every static `data-i18n` key resolves in `T_EN` | `apply()` does `if(T[key]){…}` — an unknown key is silently skipped in **every** language, so only a non-English reader sees the gap. `feed.html`'s topbar + 138 refs across 4 pages were like this |
| no pack has a key `T_EN` lacks | drift the other way — dead weight, since the merge loop is `T_EN`-driven |
| no value contains an HTML entity | every write path is textual (`nodeValue`, attributes), so `&mdash;` / `&#9670;` reach the screen as literal characters — a real render showed Arabic readers `… &mdash; …` |

## Workflows

**Add / rename a `data-i18n` key**
1. Add the key + English string to `T_EN` in `i18n.js` **first** — the
   contract fails the moment markup references a key `T_EN` lacks.
2. Use the punctuation character directly (`—`, `◆`), never an HTML entity.
3. Add the same key to all 6 packs (English fallback is fine as a placeholder
   until a real translation lands — the contract only forbids a pack key
   `T_EN` doesn't have, not a missing translation).
4. `python3 scripts/i18n-contract.py` — 0 violations.
5. `python3 scripts/omega-registry.py` — regenerate the census (key counts
   changed).

**Edit a dictionary value** — same entity rule; re-run the contract; if the
edit changed a count, regenerate the registry.

**Add a language pack**
1. New `i18n/<lang>.json` with **every** `T_EN` key (English values as a
   starting point).
2. Wire the language into `i18n.js`'s language list / picker.
3. Contract + registry regen. The census now tracks a 7th pack; a future
   loss of keys from it fails `--check`.

**Debug a page that isn't translating** — check the element has `data-i18n`
with a key that exists in `T_EN` (contract would have caught a static one, but
a key built at runtime like `'mat_' + id` won't be static); check
`OmegaI18n.apply()` ran after the content was injected (dynamically added
nodes need a re-apply); check `localStorage['omega_lang']` is the language you
expect (a stale value from a previous test is the classic false result —
`CLAUDE.md` §8.4, "a browser check that reuses one context").

## Guardrails

- `T_EN` is the source of truth; never add a key to a pack that isn't in
  `T_EN`.
- Punctuation as characters, never HTML entities, in any dictionary value or
  `T_EN` string.
- A missing translation is acceptable (falls back to English); a missing
  **key** (in `T_EN` or as an unresolvable `data-i18n`) is not.
- Any change that moves a pack's key count regenerates
  `OMEGA_SKILL_REGISTRY.md` in the same commit.
