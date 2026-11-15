# Platform evolution plan: private by default, a public face by choice, voice and music, security, and what to borrow

Written 2026-11-15 from the owner's request: personal data private; birthday public-or-private; avatar, username, nickname and a "thoughts" text; voices, music and songs; the
highest security; learn from worldwide platforms; bring new ideas without conflicts or failures. Every claim below is either read from this repo (file cited) or marked **guess**.

## 1. The binding rules (these decide every feature below)

1. **Private is the default, and the default is enforced by the database, not the page.** `profiles_select` (`20260923030958`) lets a member read only their own row and the owner read all.
   Nothing in this plan widens that policy. Another member sees a person only through a `SECURITY DEFINER` function that names its output fields.
2. **A field is public only if (a) the member opted in, (b) the platform flag is on, and (c) the field is on the function's allow-list.** A static test pins the allow-list so it cannot grow quietly.
3. **Nothing sensitive ever decides access, price or quota** (`IDENTITY_ONE_PERSON_PLAN.md`, guarded by `test_entitlement_basis.py`).
4. **Ships dormant.** New member-facing surface sits behind a `platform_settings` flag that defaults to `false` (`CLAUDE.md` §9) and fails closed (`omega-flags.js`).
5. **No column is read by a page before the migration that creates it is live** (`CLAUDE.md` §8.1 class 2: one unknown column empties a whole PostgREST query). So the UI follows the migration, in a later PR.

## 2. Public face: username, nickname, avatar, thoughts, birthday

| item | decision | state |
|---|---|---|
| username | new column, unique, `^[a-z0-9_]{3,24}$`, reserved names refused | proposed, proved |
| nickname | new column, 1-40 chars, no markup or control characters | proposed, proved |
| thoughts (summary text) | **reuse `profiles.bio`**, which already exists and is already member-writable; capped at 280, no `<` or `>`, enforced by a trigger that fires only when the bio changes (a CHECK, even `NOT VALID`, would refuse a member with an old bio when they edit anything else) | proposed, proved |
| avatar | `avatar_url` must be an object under the member's own folder of the `avatars` bucket; enforced by trigger (a CHECK would re-run on every unrelated update of a row whose avatar came from a sign-in provider) | proposed, proved |
| birthday | `birthday_visibility`: `private` (default), `month_day` (returns `MM-DD`, no year), `full`. Age is never returned | proposed, proved |
| the door | `public.get_public_card(username)`: members only, flag-gated, returns `null` for missing, private, rejected, unapproved, deactivated or pending-deletion members, so "no such member" and "private member" look the same | proposed, proved |

Proof: `docs/proposed-migrations/20261115210000_omega_member_public_card.sql` on a throwaway Postgres 16, 31 cases (28 first, 3 added after a bug was found post-merge), and a mutation run: removing the `is_public`, approval, deactivated,
pending-deletion, signed-in or birthday-precision guard each fails the case written for it. Two of those guards were first unprotected (a weak `LIKE`-style assertion passed a leaked year,
and deactivated/pending-deletion had no case); the mutation run found both before this was written up. **Not run on Supabase**, whose read access was refused this session.

**Known gaps, stated plainly**
- The `avatars` bucket is **public-read** (`0022_storage.sql:9`). An avatar is therefore visible to anyone who holds its URL even when the profile is private. The fix is a private bucket with
  signed URLs, a separate change. Until then the honest copy is "your avatar image is public to anyone with its link".
- A username lookup lets an approved member test whether a name exists and is public. That is the point of a handle, but it is enumerable. A rate limit belongs on the call (the AI quota
  `omega_consume_ai_request_quota` shows the pattern); not built.
- The editing UI is **not built yet**, deliberately (rule 5). It is the next PR after the owner applies the migration.
- Choosing `birthday_visibility = 'full'` while `is_public = false` shows nothing. That is intended and tested.

## 3. Voices, music and songs

**What already exists (read, not assumed):** `omega-music.js` (Tone.js, a generative piece per element), `audio.js` (a generated ambient score, "zero external files"),
`omega-origins-audio.js` (synthesised, 9.1717 Hz motif), `omega-cinematic-audio.js` (video audio, falling back to procedural music and then browser `speechSynthesis`), `omega-voice.js`
(voice commands and text-to-speech). All of it respects reduced-motion and waits for a user gesture.

**What is not here and must not be faked:** recorded songs. Anything copyrighted needs the rightsholder's licence, and this repo has no register of rights. Recommendation, in order:
1. **Generated music per sign and element** (extends `omega-music.js`; no rights question because the platform authors it). This is the only option that is both "a song for every need" and safe today.
2. **Owner-supplied tracks** with a written rights record per file (who made it, licence, date), stored beside the file. A track without a record does not ship.
3. **Members' own uploads** only with a rights declaration and a takedown path, and only after the moderation and storage rules exist. **Not recommended before that.**
4. **Voices:** keep `speechSynthesis` (local, no data leaves the device). A cloud voice means sending member text to a third party; that is a privacy decision for the owner, not a default.
   A cloned voice of any real person is a no.

## 4. Security: what is true, and what "highest" honestly means

"Highest" is not a state a repo reaches; it is a bar you keep re-measuring. This repo already runs CodeQL, Semgrep, Trivy, Gitleaks full-history, a supply-chain scan, an RLS auditor,
a grant contract, a secrets scan, a CSP inventory and a fresh-database replay on every PR (27 checks on #1313). What the measurements say is still open:

| gap | evidence | owner-only? |
|---|---|---|
| personal values remain in git history of a **public** repo | #1309 removed the static literals; history is untouched | yes: rewrite history or make the repo private, and change any recovery answers that used those values |
| avatar bucket public-read | `0022_storage.sql:9` | build, then owner applies |
| `kyc.html` says documents are never stored while the intake stores them in the shared `uploads` bucket | `IDENTITY_ONE_PERSON_PLAN.md` open gaps | decision |
| Codex review fails on every PR (usage limit) | every PR since #1304 | yes: the limit |
| live database not readable from this session | `mcp__Supabase__execute_sql` refused | yes: access |
| owner accounts and MFA | not measured here | **guess:** confirm both owner accounts use a second factor and a recovery method that does not rely on the values above |

## 5. What to take from other platforms, and what to refuse

Each row names a mechanism, not a brand to copy. **guess** marks what I know from general knowledge and have not checked against the platform's current docs.

| platform | mechanism worth taking | fits here? | decision |
|---|---|---|---|
| Apple | Privacy "nutrition labels": a plain list of what is collected and why | yes: `privacy.html` exists | build a per-feature label generated from the same allow-lists the tests pin (**guess** on Apple's exact format) |
| Google | An activity/consent dashboard where the member sees and revokes what is shared | yes | **consent ledger**: every disclosure through `get_public_card` counted per member, visible to them; needs a table, so a later migration |
| Wikipedia | Visible edit history and sourced claims | partly | apply to canon text and the licence register, not to member profiles |
| Discord / Steam | Handles separate from legal names; per-field visibility | yes | this plan's username/nickname/birthday model |
| Duolingo | Streaks and small daily goals | yes, with a limit | allowed only if the data model records the completion (`CLAUDE.md` §8.1 class 9: no invented progress) |
| PUBG / Fortnite | Free base game, cosmetics, battle-pass seasons | yes for cosmetics | dormant behind `payments_enabled` until the company and payment processor exist |
| LinkedIn | Verified credentials on a profile | yes | certificates exist in canon; show them only by member choice |
| Multi-level / recruitment-tree payouts | income for bringing others in | **no** | refused earlier and again: the legal and consumer-protection risk is the platform's, and it rewards recruiting over the product |
| Pirated films, series, games | content library | **no** | no licence, no ship (§3) |

## 6. New ideas that fit this stack (each is small, dormant, and testable)

1. **Consent ledger** (above): members see who looked at their public card and which fields were released. Turns a privacy claim into something checkable.
2. **Selective-disclosure passport:** a member shares "I hold certificate X" without sharing their profile. Reads from canon certificates; one allow-listed RPC.
3. **Closed circles:** family/friends see more than the public does, only by mutual invitation. Default closed. Needs a relationships table and its own RLS proof; not before the card ships.
4. **Rights register** for every media file (§3.2), checked by a test the way `test_image_integrity.py` checks images.
5. **Voice of your sign:** the per-sign agent persona speaks through local `speechSynthesis`, with a settings switch and reduced-sound respected.

## 7. Order of work

1. This PR: migration proposal, proof, static test, plan. **No database change.**
2. Owner: review the proposal, then apply it by the same path as the birth-date lock (move to `supabase/migrations/`, register pending, replay, impersonation probe, controlled push).
3. Next PR, after apply: the editing UI in `profile.html`, behind `public_cards_enabled`, with `.error` checked on every write (§9).
4. Private avatar bucket and signed URLs.
5. Consent ledger.
6. Generated music per sign.

**Conflict rule for every step:** one owner per surface, run the full gate set, render the page, and read the failing log before diagnosing. A step that needs a database change ships as a proposal first.
