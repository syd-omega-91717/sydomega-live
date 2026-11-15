# 31 portrait and coin images were line-ending-mangled and rendered as noise (2026-11-15)

**Class:** a file that exists and listed fine, but does not do its job (CLAUDE.md 8.1, shape of class 1/9).

## Found
Decoding the owner's demo video and then the art the platform references. A contact sheet of
`BlockChain_Market_Analysis_syd_omega_91717/` showed one whole row as green/blue static.
`ffmpeg -v error -i <file> -f null -` over every image in the working tree (excluding `.git`, `public/`, `vendor/`):
**493 scanned, 31 failing** - all 30 files of `Phases_HOMOGENIC_OMEGA_91717/` and
`Omega_Crypto_Coin_token_HOMOGENIC_OMEGA_91717/Omega_Crypto_Coin_Token_S.Y.D_Omega_91717.jpeg`. The sibling folders were intact (0/40 failed).
First scan used `xargs` and silently skipped a filename containing an apostrophe; the 31 is from a rerun in Python without it.

## Cause (measured, byte-level)
Each corrupt file equals its intact twin in the `*_syd_omega_91717` folder **except**: every CR (`0D`) and every LF (`0A`)
became one CRLF (`0D 0A`), and one extra `0D 0A` follows the JPEG end marker `FF D9`. Raw CR count == LF count == CRLF count
(173/173/173 in the first file; 926 in the coin), the signature of a text-mode newline normalisation. Added in one commit
(`e0c6790ee`, "Add files via upload"). My first two repair attempts were wrong (deleting the CR, then mapping CR to LF); the
line-ending merge is not invertible from the corrupt bytes alone, so the repair is **only** valid because the twin exists.

## Proof the repair is lossless
For all 31 files: stripping the trailing CRLF and aligning corrupt-vs-twin (a CR, LF or CRLF in the twin consumes exactly one
CRLF in the corrupt file; every other byte must be equal) **aligned 31/31**. Each corrupt file is therefore the twin under a known
transform, so copying the twin loses nothing. This also means the HOMOGENIC art is the same artwork as the twin, not a different variant.

## Fixed
- Replaced the 31 files with their twins' bytes. After: **493 scanned, 0 failing decode.**
- `.gitattributes`: `*.jpg *.jpeg *.png *.gif *.webp` marked `-diff -text` so git never treats them as text.
- `scripts/tests/test_image_integrity.py`: every committed JPEG must end at `FFD9` and every PNG at `IEND` (no ffmpeg needed).
  It passes on the repaired tree and **fails on the real pre-fix bytes** from `origin/main` (checked for the largest file and the coin),
  so a zero result is evidence the check can see the bug.

## Not claimed
- Which tool did the text-mode conversion is **unknown** (the commit message says a web upload; git `autocrlf` is the other suspect).
  The `.gitattributes` rule covers git; it cannot cover an uploader. The test is what catches a recurrence.
- Nothing was rendered in a browser for this change; the evidence is decode success and byte equality, not a screenshot of the atlas.
- `public/` is generated and gitignored; it picks the repaired files up on the next build.
