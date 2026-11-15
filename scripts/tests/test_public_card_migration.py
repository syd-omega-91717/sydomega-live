"""Members' data is private by default; another member may see only what get_public_card() names, and only if that member opted in.

Behaviour was proved on a throwaway Postgres 16 with stubbed auth.uid()/profiles/platform_settings (28 of 28 cases; mutation copies that drop the is_public,
approval, deactivated, pending-deletion, signed-in or birthday-precision guard each fail the case written for it) - see docs/fixes/2026-11-15-public-member-card.md.
It was NOT run against Supabase. This file is the part CI can keep: the card's field list cannot quietly grow, the proposal stays OUT of supabase/migrations
(merging must not apply it), and the flag that gates the UI defaults to false.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAME = "20261115210000_omega_member_public_card.sql"
SQL = (ROOT / "docs" / "proposed-migrations" / NAME).read_text(encoding="utf-8")

# the whole list of keys another member can ever receive
ALLOWED_KEYS = {"username", "nickname", "avatar_url", "bio", "sign", "birthday"}
NEVER = ("email", "phone", "dob", "nationality", "country", "profession", "display_name", "kyc", "stripe", "subscription",
         "membership_tier", "creed", "pledge", "is_owner", "birth_date,")


def strip_comments(sql):
    return re.sub(r"--[^\n]*", "", sql)


def card_body(sql):
    m = re.search(r"function public\.get_public_card.*?\$\$(.*?)\$\$", strip_comments(sql), re.S | re.I)
    return m.group(1) if m else ""


def card_keys(sql):
    return set(re.findall(r"'([a-z_]+)'\s*,\s*(?:p\.|case\b)", card_body(sql), re.I))


def problems(sql):
    s = strip_comments(sql).lower()
    body = card_body(sql).lower()
    out = []
    if card_keys(sql) != ALLOWED_KEYS: out.append(f"card keys are {sorted(card_keys(sql))}, expected {sorted(ALLOWED_KEYS)}")
    for bad in NEVER:
        # birth_date may appear only inside the birthday CASE; every other sensitive name must be absent from the card body entirely
        if bad != "birth_date," and re.search(r"p\." + re.escape(bad), body): out.append(f"card reads p.{bad}")
    for need in ("p.is_public is true", "auth.uid() is not null", "p.deactivated_at is null", "p.pending_deletion is not true",
                 "coalesce(p.access_approved, false)", "p.is_rejected is not true", "public_cards_enabled"):
        if need not in body: out.append(f"card is missing guard: {need}")
    if "when 'month_day' then to_char(p.birth_date, 'mm-dd')" not in body: out.append("month_day birthday is not month and day only")
    if "else null" not in body: out.append("birthday does not default to nothing")
    if "birthday_visibility text not null default 'private'" not in s: out.append("birthday does not default to private")
    if "revoke all on function public.get_public_card(text) from public, anon" not in s: out.append("anon can call the card")
    if "grant execute on function public.get_public_card(text) to authenticated" not in s: out.append("card is not granted to authenticated")
    if "security definer" in re.sub(r"function public\.get_public_card.*", "", s, flags=re.S): out.append("only the card function may be security definer")
    if not re.search(r"values\s*\('public_cards_enabled',\s*false", s): out.append("flag does not default to false")
    if re.search(r"add constraint profiles_bio_shape", s): out.append("bio must be validated by a trigger: even a NOT VALID CHECK runs on every later update of the row")
    if "trg_validate_bio" not in s or "before update of bio" not in s: out.append("bio trigger missing")
    if re.search(r"policy\s+\w+\s+on\s+public\.profiles", s): out.append("must not add or change a profiles policy (that would widen who reads a row)")
    return out


class PublicCardMigration(unittest.TestCase):
    def test_card_shape_holds(self):
        self.assertEqual(problems(SQL), [])

    def test_scanner_has_teeth(self):
        # each mutation must be caught, so a green run means something
        for old, new, label in [
            ("'bio', p.bio,", "'bio', p.bio, 'email', p.email,", "extra key"),
            ("and p.is_public is true", "and true", "is_public guard"),
            ("and auth.uid() is not null", "and true", "signed-in guard"),
            ("when 'month_day' then to_char(p.birth_date, 'MM-DD')", "when 'month_day' then to_char(p.birth_date, 'YYYY-MM-DD')", "birthday precision"),
            ("values ('public_cards_enabled', false", "values ('public_cards_enabled', true", "flag default"),
            ("default 'private'", "default 'full'", "birthday default"),
        ]:
            with self.subTest(label):
                mutated = SQL.replace(old, new, 1) if old in SQL else SQL.replace(old.replace("and auth.uid()", "where auth.uid()"), new.replace("and true", "where true"), 1)
                self.assertNotEqual(mutated, SQL, f"mutation '{label}' did not apply")
                self.assertTrue(problems(mutated), f"mutation '{label}' was not caught")

    def test_proposal_is_not_in_the_migration_path(self):
        self.assertFalse(list((ROOT / "supabase" / "migrations").glob("*omega_member_public_card*")), "merging must not apply it")
        self.assertNotIn("omega_member_public_card", (ROOT / "supabase" / "pending-migrations.json").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
