# Governed publication attachment reference — 2026-11-18

## Decision
New Publishing attachments use the existing private content pipeline without a database schema migration. The reference is stored in the existing `publications.file_path` text field as:

`omega-content://storage_files/<uuid>`

This is a typed content reference, not a Storage object path. The storage path remains server-side in `public.storage_files`.

## Read compatibility
- Values beginning with the exact `omega-content://storage_files/` prefix are parsed as governed content references and must contain a valid UUID.
- Other non-empty values remain legacy Storage paths and are read only through the existing owner-path validator and short-lived signed URL fallback.
- Invalid typed references fail closed and are not passed to Storage URL signing.

## Write and delivery
- New uploads use `OmegaContentTasks.upload()` and require `PENDING_REVIEW` plus a server-returned storage_files UUID before the publication row is inserted.
- Downloads use `content-delivery`, which verifies the authenticated owner and issues a 15-minute signed attachment URL.
- If the publication insert fails or is ambiguous after content registration, the private content is preserved; the client does not delete Storage objects or server metadata blindly.

## Explicit limitations
Registration records actual size, detected common file signature, SHA-256, and an audit event. It does not establish malware clearance, rights, publication approval, public visibility, or entitlement. KYC remains separate.
