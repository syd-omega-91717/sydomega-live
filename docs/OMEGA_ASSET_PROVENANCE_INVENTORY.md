# Ω SYD OMEGA 91717 — Asset Provenance & Universe Inventory

## Purpose

The universe needs a trustworthy inventory of its visual and spatial source material before assets are promoted into public experiences, 3D realms, video playback, game worlds, or generated-media workflows. This contract covers repository-hosted images, videos, audio, 3D models, environment maps, and textures, plus remote media URLs referenced by supported source files.

## Current implementation

Run:

```bash
python3 scripts/omega-asset-provenance-audit.py
python3 scripts/omega-asset-provenance-audit.py --output artifacts/omega-asset-provenance.json
python3 -m unittest scripts/tests/test_omega_asset_provenance_audit.py
```

The audit produces stable asset IDs from SHA-256 content hashes, file sizes, inferred MIME types, source paths, source-code references, and a separate inventory of remote URLs. It is read-only with respect to the repository and does not make network requests or upload files.

## Required trust labels

| Field | Meaning |
|---|---|
| `REPOSITORY_PRESENT` | Bytes exist in the scanned checkout. This does not prove deployment or runtime use. |
| `REMOTE_REFERENCE_ONLY` | A source file contains a URL. Reachability and content are not fetched. |
| `UNVERIFIED` rights/ownership | No independently verified rights record was supplied to this scanner. |
| `FILE_HASH_PROVES_BYTES_ONLY` | Hashes support change detection and duplicate investigation, not ownership or copyright claims. |

## External source candidates — not yet connected

These are candidates for adapters, not claims of existing integration or blanket permission to republish content.

| Domain | Candidate source / standard | Potential SYD OMEGA use | Required controls before activation |
|---|---|---|---|
| Astronomy imagery and video | [NASA Image and Video Library API](https://images.nasa.gov/) — search, asset manifests, metadata, and video captions | Planetary galleries, mission timelines, educational media, star/planet visual research | Preserve item ID, creator/credit, source URL, caption, media date, rights/usage terms, retrieval timestamp, and source response; review rights per item |
| Astronomy daily imagery | [NASA Open APIs](https://api.nasa.gov/) and the current [APOD endpoint](https://science.nasa.gov/wp-json/wp/v2/apod-basic) | Daily universe feature, date-indexed editorial cards | Track endpoint/version changes, cache with freshness, preserve attribution, handle rate limits and unavailable dates. Do not build new code against the legacy APOD endpoint: NASA's portal notes its migration and planned retirement on 2026-12-01 |
| AI / edited media provenance | [C2PA Content Credentials specifications](https://spec.c2pa.org/specifications/specifications/) | Preserve or inspect signed provenance manifests when present on generated, edited, or contributed images/video | Treat credential validation as one trust signal, not proof that the depicted claim is true; record validation outcome and verifier version; never invent provenance when absent |
| Upload and delivery security | [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Secure creator uploads and internal asset intake | Server-side allowlists, signature/content validation, generated object names, size quotas, authorization, private storage, malware/sandbox scanning where available, and safe retrieval |

**Integration state:** `PLANNED`. No provider is represented as wired, licensed, reachable, or production-verified by this inventory tool.

## Promotion requirements

Before an asset is used as an authoritative platform asset, creator upload, commercial media item, game reward, planet/realm source, NFT, or credential:

1. Record source and creator, acquisition method, license/permission, permitted territories, attribution requirements, and any expiry/revocation conditions.
2. Validate file signature and actual media type server-side; do not trust filename extensions or browser MIME claims.
3. Enforce authentication, authorization, quotas, file-size limits, generated storage paths, private-by-default access, and per-object RLS/Storage policies.
4. Record a content hash, dimensions/duration where applicable, moderation/security scan status, owner, lifecycle state, and deletion/retention policy.
5. Preserve source-provided provenance metadata when present. Record whether it was validated, missing, invalid, or unsupported; do not claim authenticity from an ordinary hash alone.
6. Generate thumbnails/previews in a controlled worker; keep provider credentials server-side and jobs idempotent.
7. Link the asset to its domain record and audit event; do not treat a file or a visual badge as proof of ownership, publication, reward, or credential issuance.
8. Verify upload, metadata persistence, playback/download, unauthorized access denial, deletion, and failure cleanup against the real backend before calling the workflow production-ready.

## Extension points

- **Planets / universe:** classify source assets as atlas, planet, starfield, terrain, environment map, model, texture, or lore illustration; connect them to canonical world/node IDs without turning lore into operational telemetry.
- **Gaming:** bind character skins, trophies, badges, and scene assets to authoritative game/evidence records. Visual presence alone never grants a reward.
- **Media:** connect asset records to the existing content/storage authorities; do not introduce a parallel content database.
- **Generated media:** preserve prompt/model/version/seed where available, input lineage, moderation outcome, provenance-manifest state, and the distinction between generated content and verified facts.
- **External providers:** use adapters with timeouts, idempotency, provenance, cost controls, rate-limit handling, and explicit unavailable/blocked states.
- **Planet and world datasets:** store source identifiers and retrieval timestamps separately from canonical world state; external scientific facts must not silently rewrite the platform's creative canon.

## Boundaries

This scanner does not inventory objects that exist only in Supabase Storage, query live providers, verify external links, establish copyright ownership, upload content, or prove production deployment. Those require authenticated provider checks and end-to-end tests. Missing evidence remains `UNVERIFIED`, never silently promoted to `LIVE`.
