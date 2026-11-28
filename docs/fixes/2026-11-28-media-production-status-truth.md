# Media production status correction

**Date:** 2026-11-28

## Evidence
The authoritative `config/omega-studio-productions.json` registry records `zodiac-wars-rise-of-aries` as `SCREENPLAY_DRAFT`, with no media files and no release. Its production package explicitly states that the screenplay is not approved, produced, or released and that no footage, voice, score, or artwork exists.

The older `media.html` slate described the corresponding first saga film as `IN PRODUCTION`; two further films were marked `PRE-PRODUCTION`, and three were marked `DEVELOPMENT`, without matching production records.

## Change
- Map `THE ORIGIN` to the registered `zodiac-wars-rise-of-aries` production record.
- Change its display status to `SCREENPLAY DRAFT`.
- Change the other eleven unregistered slate entries to `CONCEPT`.
- Replace the green active-production badge with a gold screenplay-draft badge.
- Add an explicit production-truth note above the film slate.
- Add a regression test that compares the page's status labels with the registry and package evidence.

No production record, screenplay, owner approval, release, or media asset was created or changed by this correction.
