# LIFE core — plan (HIGH-RISK: new schema, health data)

Status: **APPROVED and APPLIED, dormant (2026-10-17).** The owner chose: a new table, members
only (no owner read), build and apply with the flag off. Migration `20261017234857_life_entries`
is live, `life_core_enabled = false`. The client is `omega-life-log.js` on `life.html`.
Review: the `grill-me-codex` Codex round could not run (Codex usage limit, failed on PRs
#983–#985). The threat model below was written against CLAUDE.md §8.1 instead; the owner's
approval stands in for the Codex verdict.

## Goal

Turn the 20 LIFE pages into **one daily log** whose entries are real, queryable rows, so the
platform can show trends ("sleep vs mood", streaks) from data it actually holds.

## What exists today (measured 2026-10-17)

| fact | evidence |
|---|---|
| 17 of 20 LIFE pages keep their data in `localStorage` | `EVIDENCE_MATRIX.md` (LOCAL_ONLY) |
| A backup already copies those keys up | `omega-member-state.js` mirrors every `omega*` key (minus a skip list) into `public.member_state` as one jsonb blob per key, **up only** |
| Live, that backup holds 28 keys for 2 members | `member_state`: e.g. `omega_habit_logs_v2` (6 KB), `omega_rituals`, `omega_affirmations`, `omega_okr_data` |
| Those blobs are not queryable as data | one row per key, the whole array in `value`; no per-day rows, no types |
| Purpose-built tables exist but are empty | `habit_logs`, `health_logs`, `okr_objectives`, `okr_key_results`, `oaths`: 0 rows each |
| The journal is end-to-end encrypted | `journal.html`: ciphertext + salt in localStorage, session key in **sessionStorage** (never mirrored). Server holds only ciphertext — keep it that way |

**Weakness this fixes:** member health/life data is either trapped in one browser or stored as
blobs nothing can read. Every "insight" feature built on it would be guessing.

## Threat surface

- New member-writable table holding **health-adjacent data** (sleep, mood, weight, fasting).
- No new RPC, no Edge Function, no service-role path.
- One new `platform_settings` flag.

## Approach

### 1. One table, one migration (`supabase/migrations/<ts>_life_entries.sql`)

```sql
create table public.life_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in
               ('mood','sleep','water','workout','meditate','breath','gratitude','body','fasting','habit')),
  day         date not null,
  value       numeric,                       -- the one number a tile shows (unit fixed per kind)
  note        text check (char_length(note) <= 2000),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 8192),
  source      text not null default 'life' check (source in ('life','import')),
  client_ref  text check (char_length(client_ref) <= 120),
  created_at  timestamptz not null default now(),
  constraint life_entries_import_once unique (user_id, kind, client_ref)
);
create index life_entries_member_kind_day on public.life_entries (user_id, kind, day desc);

alter table public.life_entries enable row level security;
create policy life_entries_own_select on public.life_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy life_entries_own_insert on public.life_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy life_entries_own_update on public.life_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy life_entries_own_delete on public.life_entries for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.life_entries from public, anon;
grant select, insert, update, delete on public.life_entries to authenticated;

insert into public.platform_settings(key, bool_value) values ('life_core_enabled', false)
  on conflict (key) do nothing;
```

The applied SQL is `supabase/migrations/20261017234857_life_entries.sql`, and it is the source
of truth where it differs from the sketch above. It also revokes from `service_role`, so no Edge
Function reads these rows. It creates the policies behind `if not exists` guards instead of
dropping and recreating them.

Units per `kind` live in **one** client module (`omega-life-log.js`; `omega-life.js` already
existed for another purpose), never copied. They follow what the trackers already record:
mood valence 1–10 (as `mood.html`) · sleep hours · water ml · workout sessions (workout.html
stores no duration) · meditate minutes · breath minutes · gratitude items · body kg ·
fasting hours · habit done.

### 2. One page: `life.html` becomes the daily log (existing host, no new page)

- A day strip (today and the last 13 days) and 10 tiles, one per `kind`. One tap logs the common
  case (a glass of water, mood 1–5, a habit done); a long press opens the detail sheet.
- A 14-day sparkline per tile (`omega-sparkline.js`; it draws nothing under two real days).
- **Dormant until the flag is on:** while `life_core_enabled` is false, the page reads and
  displays but every write control is disabled with the reason shown, and each tile links to
  its existing tracker page. (CLAUDE.md §9 dormancy rule; `data-omega-flag`.)

### 3. Import — explicit, once, idempotent

An "Import from this browser" button parses the known local keys (`omega_mood_log`,
`omega_sleep_log`, `omega_water_log`, …) into rows with `source='import'` and
`client_ref = '<kind>:<original id or ts>'`, and upserts them with `onConflict:
'user_id,kind,client_ref'` + `ignoreDuplicates`. Re-running it adds nothing. It never
deletes or rewrites localStorage. **The journal is never imported.**

### 4. Fold the old pages — last, not first

The 17 tracker pages stay in the sidebar until the flag has been on for real use. Folding them
earlier would hide working pages behind a dormant one.

## Key decisions (owner)

1. **Approach** — a new queryable table (this plan) vs. no schema change, reading the
   existing `member_state` blobs. Recommended: **new table**; blobs cannot answer "average sleep
   this week" without parsing every array client-side, and they hold one stale copy per browser.
2. **Can the owner read members' life entries?** The platform's usual pattern adds
   `is_platform_owner()` to read policies. Recommended: **no** — this is health-adjacent
   personal data and nothing in the product needs the owner to see it. The policies above
   reflect that.
3. **Which trackers in v1** — the 10 numeric kinds above. Out: journal (encrypted), stoic,
   affirmations, rituals, oaths, targets/OKRs, weekly review (text-heavy or already have tables).

## Risks, checked against CLAUDE.md §8.1

| class | how this plan closes it |
|---|---|
| 1 silent write | every insert/update/delete checks `.error` before the tile changes; a failed write leaves the old value and says so |
| 2 wrong column | `supabase/live-schema.json` regenerated in the same change; `schema-dictionary.py` gates the page |
| 6 grant vs policy | table GRANT and all four RLS policies in one migration; verified by **real impersonation** (`SET LOCAL ROLE authenticated` + `request.jwt.claims`) for member A, member B and anon, rolled back; `live-grants.json` regenerated |
| 7 upsert target | the import's conflict target is a plain (non-partial) unique constraint; `upsert-conflict-check.py` gates it |
| 8 divergent copies | units and kinds live only in `omega-life-log.js` |
| 9 fabricated data | an empty tile says "no entries"; nothing seeded, no demo rows |
| XSS | notes rendered with `textContent` / the contract-tested `esc()` |
| abuse / size | length and jsonb-size `check`s; one row per log action |
| privacy | no owner read; journal excluded; nothing leaves the member's own rows |

## Out of scope

Deleting old tracker pages or their localStorage; any AI analysis of entries; sharing;
export (a separate, later item); turning the flag on (owner action).

## Success criteria

- Migration applies live; impersonation shows member A sees only A's rows (count equal to A's
  inserts), member B sees none of A's, anon gets `42501`.
- `life.html` renders 10 tiles; with the flag off, no write control is active.
- With the flag on in a rolled-back session, one tap writes one row and the tile updates only
  after `.error` is null.
- Import twice → row count unchanged on the second run.
- `./scripts/ci-local.sh` green; `verify-runtime.js` passes on `life.html`.
