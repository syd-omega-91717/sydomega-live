-- Gamification Phase 2: character progression, point-bought cosmetics, member quests.
--
-- Extends what is already live rather than adding a parallel system:
--   * progression is DERIVED from public.sovereign_points_ledger (lifetime points
--     earned), so there is no second XP store a client could write to;
--   * cosmetics are rows of the existing public.point_perks catalogue, bought with
--     the existing public.purchase_perk(); this migration only adds an equip slot;
--   * member quests are private, personal goals and award NO points -- a reward a
--     member sets for a quest they write themselves would let them mint currency.
--
-- Dormant: every new write path requires platform_settings.gamification_enabled,
-- which ships false (CLAUDE.md section 9). Reads stay open to the member's own data.

set local lock_timeout = '5s';

insert into public.platform_settings(key, bool_value)
  values ('gamification_enabled', false)
  on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Cosmetics: an equip slot on the existing perk catalogue
-- ---------------------------------------------------------------------------
alter table public.point_perks add column if not exists slot text;
alter table public.point_perks add column if not exists active boolean not null default true;
alter table public.point_perks drop constraint if exists point_perks_slot_check;
alter table public.point_perks add constraint point_perks_slot_check
  check (slot is null or slot in ('frame', 'aura', 'title'));

-- Every seeded item has a real, visible effect on character.html's identity card.
-- The four pre-existing perks keep slot = null and are not listed by the shop.
insert into public.point_perks(id, name, cost, description, slot) values
  ('frame_gold',      'Gold Card Frame',     40,  'A gold frame around your character identity card.',     'frame'),
  ('frame_cyan',      'Cyan Lattice Frame',  40,  'A cyan lattice frame around your character identity card.', 'frame'),
  ('frame_crimson',   'Crimson Frame',       60,  'A crimson frame around your character identity card.',  'frame'),
  ('aura_solar',      'Solar Aura',          80,  'A slow solar glow behind your character identity card.', 'aura'),
  ('aura_void',       'Void Aura',           120, 'A deep violet glow behind your character identity card.', 'aura'),
  ('title_seeker',    'Title: SEEKER',       25,  'Shows the title SEEKER on your character identity card.', 'title'),
  ('title_architect', 'Title: ARCHITECT',    150, 'Shows the title ARCHITECT on your character identity card.', 'title')
on conflict (id) do nothing;

alter table public.member_perks add column if not exists equipped boolean not null default false;
