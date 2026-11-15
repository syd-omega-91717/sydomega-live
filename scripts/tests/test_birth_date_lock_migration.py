"""The date of birth decides sign, element, god and agent (trg_derive_cosmology), so a member must not be able to change it after the first entry.

Behaviour was proved on a throwaway Postgres 16 with stubbed auth.uid(), profiles and is_platform_owner (9 of 9 cases; a copy with the trigger body removed fails the
3 locking cases) - see docs/fixes/2026-11-15-lock-birth-date.md. It was NOT run against Supabase. This file is the part CI can keep: the migration keeps its shape, it
stays OUT of supabase/migrations (merging must not apply it), and the page tells the member why a save was refused.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NAME = "20261115200000_omega_lock_birth_date_after_first_entry.sql"
PROPOSAL = ROOT / "docs" / "proposed-migrations" / NAME
SQL = PROPOSAL.read_text(encoding="utf-8")


def shape_problems(sql):
    s = re.sub(r"--[^\n]*", "", sql).lower()
    out = []
    if "before update of birth_date on public.profiles" not in s: out.append("trigger is not on birth_date")
    if not re.search(r"when\s*\(\s*old\.birth_date is not null\s+and\s+new\.birth_date is distinct from old\.birth_date\s*\)", s): out.append("trigger fires on first entry or unchanged values")
    if "auth.uid() is not null" not in s: out.append("server-side callers are not exempt")
    if "is_platform_owner" not in s: out.append("owner is not exempt")
    if "errcode = '42501'" not in s or "birth_date_locked" not in s: out.append("refusal is not SQLSTATE 42501 / birth_date_locked")
    if "security definer" in s: out.append("must run as the invoker")
    if "revoke all on function private.lock_birth_date_after_first_entry()" not in s: out.append("function is not revoked")
    return out


class BirthDateLock(unittest.TestCase):
    def test_migration_keeps_its_shape(self):
        self.assertEqual(shape_problems(SQL), [])

    def test_the_check_can_fail(self):
        """Zero problems only counts if a weakened copy is seen."""
        self.assertIn("trigger fires on first entry or unchanged values",
                      shape_problems(re.sub(r"when\s*\(.*?\)\s*execute", "execute", SQL, flags=re.S | re.I)))
        self.assertIn("owner is not exempt", shape_problems(SQL.replace("is_platform_owner", "x")))
        self.assertIn("must run as the invoker", shape_problems(SQL + "\nalter function f security definer;"))

    def test_stays_out_of_the_migration_path_until_the_owner_moves_it(self):
        """Merging must not be able to apply it, and must not disturb the gates that pin the pending registry to empty."""
        self.assertFalse((ROOT / "supabase" / "migrations" / NAME).exists())
        pending = json.loads((ROOT / "supabase" / "pending-migrations.json").read_text(encoding="utf-8"))["pending"]
        self.assertEqual([e for e in pending if e["file"] == NAME], [])

    def test_page_says_why_a_save_was_refused(self):
        page = (ROOT / "account.html").read_text(encoding="utf-8")
        i = page.index("birth_date_locked")
        self.assertIn("cannot be changed here", page[i:i + 300])
        # the generic message must still follow it, so every other failure keeps reporting its code
        self.assertIn("Could not save (", page[i:i + 600])


if __name__ == "__main__":
    unittest.main()
