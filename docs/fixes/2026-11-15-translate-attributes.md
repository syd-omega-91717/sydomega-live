# Tooltips, titles and placeholders could not be translated; two placeholders had a hook that nothing read (2026-11-15)

**Class:** markup that looks wired and does nothing (CLAUDE.md 8.1, shape of class 1 and 9), found while making the plain-language header explanations (#1305) available in the platform's six languages.

## Found
- `apply()` in `i18n.js` translated three things: element text (`data-i18n`), input placeholders and image alt, all through the single `data-i18n` attribute. A tooltip, a `title`, an `aria-label` or a placeholder on a non-input had no path.
- `profile.html` carried `data-i18n-placeholder` on two fields (`profile_placeholder_character_name`, `profile_placeholder_legacy_statement`). `grep` found **no script that reads that attribute**, and **neither key existed in `T_EN` or in any of the six packs**. Both placeholders were English in every language.
- Unrelated and already on `main`: `prof_label_public_identity` was missing from all six packs (1199 of 1200). The "all 6 packs at 100%" line in `CLAUDE.md` section 8.3 was stale.

## Shipped
- `i18n.js`: four hooks, `data-i18n-placeholder`, `-title`, `-aria-label`, `-tooltip`, each writing its attribute from the dictionary in **every** language including English (so switching back restores it). A tooltip that is already mounted is updated in place with `_tippy.setContent`.
- 6 new keys in `T_EN` and in all six packs: `tip_auth`, `tip_gate`, `tip_element`, the two placeholders, plus the missing `prof_label_public_identity`. Packs are back to 100% (1205 of 1205 each).
- `dashboard.html`: the three explanations carry `data-i18n-tooltip`.
- `scripts/i18n-contract.py` check **E** (blocking): every static hook key resolves in `T_EN`, and the English authored on that element equals the dictionary entry, because the engine now writes the dictionary text over it.
- `scripts/tests/test_i18n_attributes.py` (4 tests; they fail on the original engine and packs).

## Measured (real render, headless)
- `omega_lang=ar`: `dir=rtl`; all three tooltip attributes and their mounted tippy content in Arabic; **one** box on hover, in Arabic; the two profile placeholders in Arabic. 0 console errors.
- `omega_lang=zh`: same, in Chinese.
- Language switched with the page open, `en -> fr -> en`: attribute and mounted tooltip update in place, one box each time, and English is restored byte-for-byte from the dictionary. 0 console errors.
- Gates: `scripts/tests` and `tests` OK, `audit.py` 0 critical, i18n-contract no violations, csp and xss ratchets, module-contract, schema-dictionary, page-count-claims, registry and idea-ledger all pass.

## Not claimed
- **The translations are mine, not a native speaker's.** I reused the platform's existing terms (gate, element, authority) per language, but they have not been reviewed by anyone fluent. Hindi, Dutch and Chinese in particular should be read by a person before being treated as final.
- Only three tooltips and two placeholders use the new hooks. The other `data-tooltip` texts (about 25 across 9 pages) remain English.
- Right-to-left layout of the tooltip box itself was not inspected visually; only its text and the page direction were checked.
