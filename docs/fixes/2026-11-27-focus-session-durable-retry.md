# Focus session durable mirror

## Contract
- Browser local history remains the immediate source of truth.
- New sessions receive a secure UUID (crypto.randomUUID, with a getRandomValues UUIDv4 fallback) before persistence.
- The existing public.focus_sessions.id UUID primary key becomes the idempotency key. No schema migration or RLS change is needed.
- A localStorage queue stores the exact row payload, owning auth user ID, retry count, next retry time, and last error before the network write.
- Supabase upsert uses onConflict=id with ignoreDuplicates=true (INSERT ... ON CONFLICT DO NOTHING), followed by an own-user row read. A retry cannot update an existing session.
- Queue items are never sent under a different authenticated user.
- Retry is triggered on initial load, successful save, online, pageshow, focus, and visibility return, with bounded exponential backoff.
- The queue has an explicit 2,000-item boundary; new records remain local-only rather than silently evicting older pending work. Corrupt queue data is not silently overwritten.
- Legacy records and sessions saved without an authenticated owner remain UNKNOWN / local-only; the UI does not claim they synced.

## Verification boundary
Static contract tests cover stable IDs, queue persistence order, append-only idempotency, owner binding, retry triggers, truthful status, corruption handling, and queue capacity. Browser offline/reload, duplicate replay, account-switch, and live Supabase integration tests remain required before merge.
