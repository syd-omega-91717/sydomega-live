### Members' data is private; a public card (username, nickname, avatar, bio, birthday choice) is proposed, not applied (2026-11-15)

**Status: PROPOSAL.** The SQL is in `docs/proposed-migrations/`, deliberately not in `supabase/migrations/` and not in `pending-migrations.json`. Merging this applies nothing. The one code change (`profile.html`) is hardening that needs no schema.

**Why.** The owner asked that all personal data stay private, with a choice to make the birthday public or private, plus avatar, username, nickname and a short "thoughts" text.
- Read from source (the live database refused the read this session): the latest `profiles_select` (`20260923030958`) is self-or-owner only, so personal data is already private by RLS and `profiles.is_public` exposes nothing. `map.html:256` selects `is_public = true` rows and receives none.
- `profiles` has no `username`, `nickname` or birthday-visibility column. `avatar_url` and `bio` exist and are member-writable; `avatar_url` accepts any string.
- The `avatars` bucket is public-read (`0022_storage.sql:9`): an avatar URL is visible to anyone who holds it, even for a private profile. **Not fixed here.**

**Fix.**
- `20261115210000_omega_member_public_card.sql` (proposal): `username`, `nickname`, `birthday_visibility` (default `private`); shape CHECKs; unique username; `bio` capped at 280 with no markup (`NOT VALID`, so old rows are not re-judged); an `avatar_url` trigger that accepts only the member's own folder of the avatars bucket; flag `public_cards_enabled` defaulting to false; and `public.get_public_card(username)`, the only door through which another member sees anyone. It returns six allow-listed keys and `null` for anything private, missing, rejected, unapproved, deactivated or pending deletion. No `profiles` policy is touched.
- `profile.html`: the avatar is set only from an https URL with CSS-significant characters percent-encoded. **This is hardening, not a patched exploit** (see below).
- `scripts/tests/test_public_card_migration.py` pins the key allow-list, every guard, the defaults, and that the proposal stays out of the migration path; its own scanner is mutation-tested.
- `docs/plans/PLATFORM_EVOLUTION_PLAN.md`: the rules, the voice/music position, the security gaps, what to borrow and refuse, the order of work.

**Verified.**
- Throwaway Postgres 16 (own cluster, port 5544), stubbed `auth.uid()`, `profiles` and `platform_settings`, loading the real file; re-runnable. **28 of 28** cases: flag off returns null; public member visible; private member null even if they chose a full birthday; `month_day` returns exactly `04-05`; `full` returns exactly the date; rejected, unapproved, deactivated, pending-deletion and signed-out callers get null; anon cannot call it; the card carries no email, phone or display name; another member's row is unreadable directly; bad, reserved, duplicate and uppercase usernames, markup in nickname or bio, an overlong bio, a bad visibility value, a CSS-injection avatar and another member's avatar folder are all refused; own-folder avatar accepted; a member with a legacy provider avatar can still edit their bio.
- **Mutation run.** Removing each guard in turn fails the case written for it: `is_public`, approval, deactivated, pending-deletion, signed-in, and month-day precision. Two weaknesses were found and fixed in the test before this was written: the birthday assertion used a substring match (`04-05` is inside `1993-04-05`), so a leaked year passed; and deactivated and pending-deletion had no case at all.
- A trigger bug was found by the first run (`WHEN` cannot test `tg_op`; `old` does not exist on INSERT) and fixed by splitting into insert and update triggers.
- Real Chromium render of the `profile.html` avatar expression with seven inputs: `javascript:`, `data:` and protocol-relative values are rejected; quote and parenthesis values are encoded; position and colour stay unchanged.
- `scripts/tests/test_public_card_migration.py`: 3 tests pass. `check-inline-js.py` clean.

**Correction.** I first described the `profile.html` avatar line as a CSS injection. A control run in the same browser showed the old expression was **not** exploitable: assigning through `style.backgroundImage` makes the browser drop a value that tries to smuggle in other declarations. The change stays as hardening, and the comments say so. The real reason to validate `avatar_url` is that the card will show it to other members, so an arbitrary URL would leak each viewer's IP address to a host the member chose.

**Not done / not verified.**
- **Not run on Supabase.** The stubs are mine; real `profiles` has triggers, grants and policies the harness does not (for example `derive_cosmology`, `trg_lock_birth_date` if applied). Before applying: a real impersonation probe on a non-production copy (`CLAUDE.md` §8.4) and a fresh replay.
- The editing UI is not built, on purpose: a page that selects columns before the migration is live empties the whole query (§8.1 class 2).
- The avatars bucket stays public-read. Username lookup is enumerable and has no rate limit.
- Existing members' `birthday_visibility` becomes `private` and `username` null on apply; nobody is exposed by applying it.
- Voices, music and songs: nothing built. Recorded songs need a rights register that does not exist.
- The deployed site could not be viewed from this session.
