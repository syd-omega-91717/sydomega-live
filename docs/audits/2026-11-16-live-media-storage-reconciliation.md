# Live Media & Storage Reconciliation — 2026-11-16

## Scope and method

This is a provider-side, read-only snapshot of Supabase project `ydqhzvvoyufiiqvzcjns`, combined with the repository media inventory. It records counts and access-control state only; no private object paths, user IDs, filenames, prompts, signed URLs, or media bytes are included.

Repeat the live query in `scripts/audits/supabase-media-storage-reconciliation.sql` after schema, bucket, upload, or media-catalog changes. The query is aggregate-only and performs no writes.

## Live Storage state

| Bucket | Visibility | Objects | Total bytes |
|---|---|---:|---:|
| `avatars` | Public | 0 | 0 |
| `uploads` | Private | 0 | 0 |

- Both `storage.buckets` and `storage.objects` have RLS enabled.
- Storage policy definitions are present for avatar and upload operations.
- The `uploads` bucket is private and owner-scoped; its signed-delivery path is handled by the `content-delivery` Edge Function.
- No Storage objects currently exist in either bucket.

## Live database media state

| Relation | Rows | Key finding |
|---|---:|---|
| `public.storage_files` | 0 | No file metadata records |
| `public.omega_creative_assets` | 0 | No governed creative asset records |
| `public.omega_media_jobs` | 0 | No media processing jobs |
| `public.media_reservations` | 0 | No reservations |
| `public.media_items` | 36 | All 36 rows are `pending`; all lack thumbnail and video URLs |
| `public.user_assets` | 0 | No user-owned asset records |

The 36 catalog rows are not published media. Their pending state must remain intact until real, rights-cleared media is connected.

## Media catalog access correction

Before migration `20261116214052_media_items_authenticated_select`, the authenticated role had no `SELECT` grant on `public.media_items`, despite an existing RLS SELECT policy and a frontend read path. This prevented the client from reaching the policy at all.

The migration grants `SELECT` to `authenticated` only. Live verification after application confirms:

- `authenticated` SELECT: enabled
- `anon` SELECT: not granted
- RLS: enabled
- Existing RLS policy: unchanged; members see only `status='live'`, while the owner predicate remains MFA-aware

The exact migration and refreshed provider snapshots are in PR #1337. The grant does not publish any of the 36 pending rows.

## Repository media inventory

The repository contains 532 tracked media files: 501 images and 31 MP4 videos. PR #1336 added a local gallery and a hash-bound review manifest. New or changed content starts as visual review `PENDING` and rights `UNVERIFIED`. The manifest does not establish copyright ownership.

## Prioritized remaining work

1. Complete visual review of all 532 repository assets and record reviewer, timestamp, findings, and SHA-256-bound identity.
2. Obtain independent source, creator, licence/permission, attribution, territory, and expiry evidence for every asset intended for publication.
3. Map approved repository assets to canonical `media_items` records; do not infer matches from filenames alone.
4. Upload only approved assets to private Storage using the governed ingest path; create matching `storage_files` metadata and provenance records.
5. Add thumbnail/video delivery references and test signed URLs, expiry, RLS denials, deletion, and cleanup.
6. Promote a catalog row to `live` only after the content and rights checks pass.

## Security-advisor context

The live Security Advisor currently reports:
- One warning: leaked-password protection disabled. This is a Supabase Auth setting requiring dashboard-level action in this session.
- Three INFO findings for RLS-enabled tables with no policies in private/internal schemas. Catalog checks show no `anon` or `authenticated` SELECT grants on those tables; these remain fail-closed. Do not add blanket policies.
- The performance advisor reports 326 unused indexes. Do not drop them without workload, query-plan, and index-usage evidence.

This snapshot is not a full production certification. It does not prove every page, provider, upload journey, or playback flow is operational.
