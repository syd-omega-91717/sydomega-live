# Ω SYD OMEGA 91717 — Governed Visual Atlas

## Scope

The Visual Atlas is a reference surface for the repository's deeper visual collections. It deliberately separates **visual inspiration** from **production truth**.

Current census:

- 291 source visuals across the audited visual collections.
- 46 curated references exposed directly in the atlas.
- 16 deeper source collections are now represented.
- The original 62-asset Legacy Constellation remains a separate source layer.

## Newly represented source families

- Brand Identity / material language
- Certificate of Appreciation
- Certificates
- Cinematic game frames
- Horoscope signs
- Main-page logos
- Stage/medal logos
- Phase / level / grade marks
- Medals
- Mobile passport / card / key concepts
- HOMOGENIC NFT artwork
- SYD OMEGA NFT artwork
- HOMOGENIC token artwork
- SYD OMEGA token artwork
- HOMOGENIC phase artwork
- SYD OMEGA phase artwork

## Design translation

The source material is useful for:

- material and surface vocabulary;
- ceremonial framing;
- stage and progression composition;
- character and realm atmosphere;
- collectible presentation;
- mobile artifact/card composition;
- cinematic camera and scene references;
- emblem and identity systems.

The source material is **not** authoritative for:

- authorization;
- rank or membership entitlement;
- identity verification;
- KYC/AML status;
- credentials;
- NFT ownership;
- token balances;
- financial settlement;
- mission completion;
- achievements.

## Runtime rule

Production state continues to come from the platform's authoritative persisted contracts.

The atlas is lazy-loaded and decorative. A missing source image must not block navigation or authenticated state.

## Image-review boundary

The repository inventory, filenames, source paths, collection counts and runtime references were inspected. The connected repository interface does not provide a bulk pixel-forensic image-analysis surface in this workflow, so the atlas does not pretend that filenames constitute visual facts. Instead, it makes the full source families directly inspectable in the deployed platform and records their exact provenance.

Where visual semantics are inferred from a filename or collection role, the wording is intentionally limited to **reference**, **language**, or **composition** rather than asserting an objective property of the image.

## Invariants

- curated count must remain aligned with omega-visual-atlas.js;
- total source census must remain recorded in config/omega-source-dna.json;
- duplicate source paths are rejected by the atlas contract;
- source artwork cannot become a production entitlement by itself;
- core navigation/data loading must never depend on atlas artwork.
