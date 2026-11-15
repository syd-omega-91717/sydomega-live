# Eight personal identity values were typed into a static page (2026-11-15)

**Class:** fabricated or fixed data rendered as fact (CLAUDE.md 8.1 class 9), and 8.2: a static file is served to anyone who asks for it.

## Found
While reading how the platform handles identity documents, `profile.html` (Identity tab, `.id-field` rows) carried **eight typed values with no `id`**, so nothing filled them and every
visitor received the same text: father's name, mother's name, date of birth, place of birth, nationality, blood type, civil registry and region. The card is labelled as the owner's.
`git log -S"idf-label"` dates the card to 2026-06-22 and 2026-07-12. Two of the three that identify a person most (mother's name, date and place of birth) appear in **no other tracked file**;
father's name and nationality also match ordinary words elsewhere, so no claim is made about those.

Two consequences:
- **Disclosure.** The approval guard is a CSS reveal in the browser, not access control, so the values were in the file any visitor could fetch. `CLAUDE.md` 8.2 describes the repository as public; I did not check its visibility independently.
- **Falsehood.** Every other member who opened the tab was shown those values as their own details.

## Fixed (the served page)
The eight values are now `--` placeholders; the labels and i18n keys are unchanged. Rendered `profile.html`: 13 identity rows, 8 placeholders, 0 typed values left, 0 console errors.
`scripts/tests/test_no_personal_literals_in_static_pages.py` fails if any identity-card row carries a typed value, in `profile.html` or in any other root page. It holds no personal value itself (it checks shape, not content),
and it **fails on the original `profile.html`** (1 of 3; the others check the scanner finds the card and can see a planted value).

## Not fixed, and why
- **Git history.** The values remain in every commit since 2026-06-22 and in any clone or cache taken since. Deleting them from `HEAD` does not change that. Removing them from history needs a force-push, which `CLAUDE.md` 8.2
  forbids on a published branch, and it would not reach copies already made. That decision, and whether the repository should be public at all, is the owner's.
- **Practical consequence for the owner.** A mother's name, a date and place of birth are the usual answers to account-recovery questions. Anything protected by those answers should be treated as known to a stranger and changed.
- The owner's card now shows `--`. Showing real values to the owner alone would need columns and owner-only row security; that is a schema change and is not done here.

## Not measured
Whether any outside party has copied these values. Live data was not read.
