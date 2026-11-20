### No licence, no ship: a rights record is now required for every new audio, video or image file (2026-11-15)

**Why.** The platform serves media members see and hear, and the owner has asked about adding songs, films, series and games. `docs/OMEGA_ASSET_PROVENANCE_INVENTORY.md` and `scripts/omega-asset-provenance-audit.py` hash every file and mark rights `UNVERIFIED`, but they only report. Nothing recorded who made a file or under what licence, and nothing stopped a file of unknown origin (a ripped film, a commercial song, a game asset) from being committed and deployed. 519 media files are tracked today (`git ls-files`, outside `vendor/`, `docs/`, `supabase/`, `scripts/`, `.claude/`, `public/`): 488 images and 31 audio/video files (30 MP4 under `assets/` plus the root demo MP4); none is audio-only.

**Fix.**
- `scripts/media-rights-gate.py` (registered in `contract-suite.py`, so the existing CI step and `ci-local.sh` run it; no workflow was edited). Every tracked media file is either in the frozen `baseline` of `docs/media-rights.json`, or has a record with `path`, `source`, `creator`, `licence`, `evidence` and `added`. A new file with neither fails. The licence must be one of `owner-original`, `owner-generated`, `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `PD`, `MIT`, `Apache-2.0`, `licensed-commercial`; CC-BY needs an `attribution` line; any licence that is not the owner's own needs `evidence` that is an http(s) URL a reviewer can open; a record for a file that no longer exists is a finding.
- **The 519 existing files are baselined as `unreviewed`.** That is a statement of ignorance, not clearance, and the register says so. The baseline may only shrink (move a file to `records` with its real details); `test_the_baseline_cannot_grow_quietly` pins the ceiling at 519, so blessing a new file by adding it to the baseline means editing a test a reviewer will see.
- One observation recorded, not a claim: a "Veo" watermark is visible on `assets/concept/reel-01.jpg`, so those reels appear to come from a generative video tool whose terms govern their use. Unconfirmed; the owner should check.

**Verified.**
- `scripts/tests/test_media_rights_gate.py` (17): a baselined file passes; a new file with no record fails; every media kind is covered (`.mp3 .wav .ogg .m4a .flac .mp4 .webm .mov .jpg .png .webp .gif`); `vendor/`, `docs/`, `scripts/`, `supabase/`, `.claude/`, `public/` and non-media files are left alone; each required field, a bad date, an unknown licence, CC-BY without attribution, a non-URL evidence for someone else's licence, a stale record and a duplicate record are each refused.
- **Mutation run, eight rules switched off one at a time: all eight now fail the tests.** The first version missed one: the licence allow-list could be removed unseen, because the "unknown licence" test was also refused by the URL-evidence rule and passed for the wrong reason. The test now gives a valid URL so only the allow-list can refuse it.
- End to end on the real repo: a staged `assets/ripped-song.mp3` with no record fails the gate; a record saying `licence: unknown` fails (two findings); a complete record passes (520 files, 1 with a record). I removed the test file and its record afterwards.
- `test_script_help_contract.py` passes (the script answers `--help`); the real repo passes the gate (519 files).

**Not done / not verified.**
- **The gate proves a claim was written down, not that it is true.** A wrong licence typed in passes. It forces a human to put the claim in a diff a reviewer sees.
- The 519 existing files are not reviewed. Several are plainly the owner's own generated artwork, but I cannot tell from here which tool made which file or under what terms.
- A file added through an upload at run time (Supabase Storage) is outside git and outside this gate. The upload path's own controls are listed in `docs/OMEGA_ASSET_PROVENANCE_INVENTORY.md` ("Promotion requirements") and are not implemented here.
- Fonts, 3D models and other asset kinds are not covered; only audio, video and images.


## Subsequent register corrections — 2026-11-20

The first-pass inventory counted 519 files. The later correction added 13 legacy SVGs that had been omitted, bringing the frozen unreviewed baseline and its test ceiling to 532. The 2026-11-16 provenance inventory is a dated snapshot, not a live count.

On 2026-11-18, `assets/omega-genesis-world.svg` was added as a separate `owner-generated` rights record. The current register therefore contains 532 unreviewed baseline paths plus one individually recorded path. The baseline remains unreviewed; registration must never be described as blanket rights clearance.
