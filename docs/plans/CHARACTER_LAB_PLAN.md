# Character Lab — design plan (HIGH-RISK: new table, RLS, new RPC, flag)

> **REVISION 2026-11-15 (after merge, same day) — §2, §4 and §5.1 below are SUPERSEDED. Read this first.**
> Reading `0004_omega_nested_matrix.sql` and `omega-canon.json` after the plan merged showed the plan was wrong in two ways:
> 1. **The collection already exists.** `public.matrix_progress` holds one row per member per sign (12 tracks, `PRIMARY KEY (user_id, track)`),
>    each with its own axes `a,b,c` and `phase`; `my_matrix()` returns all 12 and seeds missing rows; `matrix_tracks` is the 12-sign table.
>    The proposed `member_characters` table is therefore **not needed**, and no migration is proposed any more for the Lab.
>    "Collected" is derivable: a sign is *started* when any of its axes has moved off the starting value 1.
> 2. **The recommended unlock rule had no basis.** It said "the axis tied to the character's element", but the canon's axes are
>    Knowledge / Mastery / Contribution (`omega-canon.json` `axes`), not elements. There is no axis-to-element mapping to build on.
>
> What shipped instead (no schema): a read-only roster of the 12 characters with the member's per-sign progress from `my_matrix()`,
> on the MATRIX tab of `character.html` (`omega-character-card.js`, `data-omega-character-roster`). Phase-1 rows only, as `matrix.html` does.
>
> **New finding, unverified live:** `advance_matrix(p_track, p_axis)` is `SECURITY DEFINER` and granted to `authenticated`
> (`0004_omega_nested_matrix.sql:92`; only `PUBLIC` was revoked in `20260818000551`). It advances any track's axis by one for the caller
> with no check that a real event happened, so a signed-in member could raise every sign's axes by calling it repeatedly (§8.1 class 6b/9).
> No page calls it (`automation.html` names it in an option). Whether it is still callable live, or was superseded, **was not checked
> (live access refused)**. Gating real evolution to recorded events is the genuine remaining HIGH-RISK change; it needs the owner's
> read-only check first. Tracked in `GAP_ANALYSIS.md` §S.
>
> Still open from §5: visibility of a member's roster to others (default stays private: own rows + owner).


Status: **PROPOSAL, nothing built, nothing applied.** Written 2026-11-15 for the owner's decision.
**Not adversarially reviewed**: the Codex review step of `grill-me-codex` could not run (Codex usage limit
reached on every PR this week). Treat every claim below as the author's, not a reviewer's. A human or a
later Codex pass should review before any migration is written.

## 1. Goal

Every member has a **main character** (their sign, already live as the card in `character.html`, #1292) and can
**collect other characters** (the other 11 signs) that **evolve** as the member really acts on the platform. One
place, the **Lab**, shows the collection and its history. Nothing in it is invented: a character appears only
when a recorded event unlocked it, and its level is read from recorded events.

Explicit non-goals: no purchase path, no tokens, no member-authored characters, no AI-generated "ideas",
no film-to-game engine (see §7).

## 2. What already exists (measured 2026-11-15, not assumed)

| Need | Existing thing | Evidence |
|---|---|---|
| The 12 characters | `omega-canon.json` `tracks` (sign, god, element, agent, house, gate…) via `OmegaCanon.trackBySign` | read in session |
| Main character + progress | `profiles.sign/axis_a/b/c/nodes_cleared/medals_earned…`; card `omega-character-card.js` | #1292, merged |
| Real "evolution" record | `public.evolution_events(id,user_id,axis,note,delta,created_at)`, written inside the task-completion RPC next to the axis update | `0001_omega_master_deploy.sql:77,309`; `live-schema.json` lists a `delta` column |
| Per-member character text | `public.character_records` (one row per user: name, dominant_trait, legacy_statement), RLS `character_own`, GRANT S/I/U | `0002_omega_personal_logs.sql:142-151` |
| Quests / achievements | `member_quests`, `omega_user_achievements`, `omega_member_quest_state` | `live-schema.json` |
| Flag store | `public.platform_settings` (`tokens_enabled=false` is the pattern) | `0006_omega_tokens.sql:14` |

Consequence: **evolution needs no new event table.** `evolution_events` already is the append-only history of
real actions. The only genuinely new data is "which extra characters this member has unlocked".

## 3. Threat surface (CLAUDE.md §8.1 classes applied)

1. **Client-forged unlocks** (class 6b, `WITH CHECK(true)` spoofing). If the client can INSERT into the
   collection table, any member can unlock all 12. → Members get **SELECT only**; unlocks are written by a
   server-side function from recorded events.
2. **A GRANT and a policy that do not meet** (class 6a/6c). New table needs *both* the table-level GRANT
   SELECT to `authenticated` *and* the RLS policy; the new function must `REVOKE EXECUTE … FROM PUBLIC` before
   `GRANT … TO authenticated`.
3. **Silent no-op writes** (class 1). The page only reads; the unlock function returns its result and the
   caller checks `.error` before showing anything.
4. **Wrong column / conflict target** (classes 2, 7). Columns checked against `live-schema.json`; one unique
   index `(user_id, track_n)` and an `ON CONFLICT (user_id, track_n) DO NOTHING` that names exactly it.
5. **Duplicate copies of the 12** (class 8). The Lab reads `OmegaCanon` only; it contains no sign, god or
   element literal. A test pins that.
6. **Fabricated progress** (class 9). Level of a collected character = a count/sum from `evolution_events`
   rows for that character's axis, shown only if >0; empty collection shows an empty state, not placeholders.
7. **Stored XSS.** No member-authored text is rendered by the Lab. `evolution_events.note` is member/RPC text:
   render with `textContent` only.
8. **Monetisation drift.** Flag stays false and the copy stays future-tense until the owner turns it on; no
   price, token or purchase code in this feature.

## 4. Approach (smallest thing that is real)

**Table (the only new schema)** — new timestamped migration, never edits an applied one:

```
public.member_characters(
  user_id   uuid not null references auth.users(id) on delete cascade,
  track_n   int  not null check (track_n between 1 and 12),
  source    text not null,            -- 'main' | 'axis_milestone' | 'quest' | 'film'  (closed set, CHECK)
  unlocked_at timestamptz not null default now(),
  primary key (user_id, track_n)
)
```
RLS on. Policy: `SELECT USING (user_id = auth.uid() OR public.is_platform_owner())`. **No INSERT/UPDATE/DELETE
policy and no such GRANT for `authenticated`.** `GRANT SELECT … TO authenticated` only.

**RPC** `public.unlock_characters()` — `SECURITY DEFINER`, `search_path` pinned, `REVOKE … FROM PUBLIC`,
`GRANT EXECUTE … TO authenticated`. It takes **no parameters** (so a caller cannot name a character): it reads
the caller's own `auth.uid()`, applies the unlock rules (§5) to the caller's own recorded rows, inserts any
missing rows with `ON CONFLICT (user_id, track_n) DO NOTHING`, and returns the rows added. Idempotent.
Also inserts the main character (`source='main'`) from `profiles.sign` if present.

**Flag**: `platform_settings('character_lab_enabled', bool_value=false)`; the RPC returns nothing and the Lab
tab stays hidden while it is false.

**UI**: no new page. A **LAB tab inside `character.html`** (the page is already the member's character; it has
a tab bar), read-only: grid of 12 slots, collected ones from `OmegaCanon` + `member_characters`, uncollected
ones shown locked with the *rule* that unlocks them, recent `evolution_events` as the history. Reuses
`omega-character-card.js` for each collected character.

**Interaction with the rest of the platform**: only through events that already exist (task completion →
`evolution_events` → next `unlock_characters()` call). No new write paths from pages.

## 5. Decisions needed from the owner (not mine to make)

1. **Unlock rule.** Recommended: a character unlocks when the member's *axis tied to that character's element*
   first crosses a milestone recorded in `evolution_events` (reuses the existing milestone logic), so
   collecting follows real progress. Alternatives: finishing the character's film; completing the sign's
   Hercules labor; owner grants manually. Pick one primary rule; others can be added as `source` values later.
2. **Main character source.** Today `profiles.sign` comes from the birth date (updatable by the member). Keep
   that. A member-chosen main character would be a different, riskier change (members could pick freely).
3. **Visibility to other members.** Default: private (own row + owner). Showing a collection on a public
   profile is a separate privacy decision and is **not** in this plan.

## 6. Risks and what is unverified

- The live-database queries that would confirm `evolution_events.delta` is populated, row counts, and whether
  stored `profiles.authority` matches the formula were **refused (permission)**. Whether history is rich enough
  to drive unlocks is **unknown**; if most rows have no `delta`/axis, the unlock rule must be chosen from what
  exists. First step before any migration: have the owner run a read-only count of `evolution_events` by axis.
- `live-grants.json` has no entry under the `public.`-qualified names I looked up for these tables, so their
  current GRANTs are **not confirmed**. Verify with the live catalog before relying on them.
- Applying a migration deploys on merge to `main` within ~1 minute (CLAUDE.md §8.2); the migration must be
  reviewed as live. The Supabase connector's `DROP` rule is not needed here (no drops).
- RLS must be tested by real impersonation (`SET LOCAL ROLE authenticated` + `request.jwt.claims`), non-owner vs
  owner, per §8.4 — not `set_config('role',…)`.

## 7. Out of scope (stated so it is not assumed)

- **Film → game.** There is no game engine and no film↔game data model; `gaming.html` is exams. The only
  small, honest link is "finishing a film is one `source` for an unlock". Anything playable is a separate
  product proposal.
- **Member-created characters and free-text "new ideas."** Needs content review and XSS-safe storage; separate.
- **Animation/scripted dialogue** per character: a content-writing task, separate from this schema.
- Converting the other ~28 files that hand-type the 12 signs to `OmegaCanon`: separate, safe, incremental PRs.

## 8. Success criteria (all measurable)

1. Migration applies on a fresh database replay (the `Fresh database replay` CI job) and `scripts/audit.py`
   check 4 (RLS on every table) passes.
2. Impersonation test: a non-owner can SELECT only their own rows; INSERT/UPDATE/DELETE as `authenticated`
   fail with `42501`; `unlock_characters()` called twice adds rows once; a second member's call never touches
   the first member's rows.
3. With the flag false the Lab tab is not rendered and the RPC returns no rows; with it true (owner decision)
   it renders from rows only.
4. A page-level test proves the Lab contains no sign/god/element literal and no `innerHTML`.
5. `./scripts/ci-local.sh` all blocking checks pass; `supabase/live-schema.json` regenerated in the same change.

## 9. Build order once approved

1. Owner decisions in §5 + the read-only `evolution_events` count (§6).
2. Review of this plan (human or Codex) → `PLAN.md`/`CODEX_REVIEW.md` per the skill, if wanted.
3. Migration + RPC + flag (dormant) in one PR, impersonation-tested; owner merges.
4. LAB tab (read-only) in a second PR, behind the flag.
