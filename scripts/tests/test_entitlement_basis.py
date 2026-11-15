"""What may decide a member's access, price or quota (docs/plans/IDENTITY_ONE_PERSON_PLAN.md, "entitlement basis").

Sensitive personal attributes (origin, nationality, religion, parents' names, place of birth, blood type, civil registry) must never reach an Edge Function
or a SQL function that decides access, price, quota, tier or eligibility. Checked 2026-11-15: none does. This keeps it that way. It is a static check on
names, so it is a floor, not a proof: it cannot see a value copied into another column first.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SENSITIVE = re.compile(
    r"nationalit|ethnic|religio|father_?name|mother_?name|maiden_?name|place_?of_?birth|birth_?place|blood_?type|civil_?regist|national_?origin|\borigin_country\b",
    re.I)
DECIDES = re.compile(r"entitle|tier|access|price|checkout|quota|eligib|approve|subscript|permission|grant_|can_", re.I)
FUNC = re.compile(r"create\s+(?:or\s+replace\s+)?function\s+(?:[\w\"]+\.)?([\w\"]+)", re.I)


def sql_functions(text):
    """(name, body) for every function in a migration: from its CREATE up to the next CREATE (crude, deliberately wide)."""
    marks = [(m.start(), m.group(1).strip('"')) for m in FUNC.finditer(text)]
    nxt = [m.start() for m in re.finditer(r"\bcreate\s", text, re.I)]
    out = []
    for start, name in marks:
        end = next((n for n in nxt if n > start), len(text))
        out.append((name, text[start:end]))
    return out


def violations_in_sql(text):
    return [name for name, body in sql_functions(text) if DECIDES.search(name) and SENSITIVE.search(body)]


class EntitlementBasis(unittest.TestCase):
    def test_edge_functions_never_read_sensitive_attributes(self):
        files = [p for p in (ROOT / "supabase" / "functions").rglob("*.ts")]
        self.assertGreater(len(files), 10, "scanner found no Edge Functions: the check would pass on nothing")
        bad = [str(p.relative_to(ROOT)) for p in files if SENSITIVE.search(p.read_text(encoding="utf-8", errors="ignore"))]
        self.assertEqual(bad, [])

    def test_access_price_quota_functions_never_read_sensitive_attributes(self):
        migrations = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))
        self.assertGreater(len(migrations), 50)
        funcs = 0
        bad = []
        for m in migrations:
            text = m.read_text(encoding="utf-8", errors="ignore")
            funcs += sum(1 for n, _ in sql_functions(text) if DECIDES.search(n))
            bad += ["%s:%s" % (m.name, n) for n in violations_in_sql(text)]
        self.assertGreater(funcs, 10, "no access/price functions found: the check would pass on nothing")
        self.assertEqual(bad, [])

    def test_the_check_can_fail(self):
        """Zero findings only counts if a planted violation is seen, and an innocent one is not."""
        planted = "create or replace function public.can_buy_tier(p uuid) returns bool as $$ select nationality = 'X' from profiles $$;"
        self.assertEqual(violations_in_sql(planted), ["can_buy_tier"])
        innocent = "create or replace function public.can_buy_tier(p uuid) returns bool as $$ select is_adult from profiles $$;"
        self.assertEqual(violations_in_sql(innocent), [])
        # "Maiden" is the sign Virgo in screenplay text (supabase/functions/studio-library); only the attribute name is sensitive.
        self.assertIsNone(SENSITIVE.search("Ram. Bull. Twins. Crab. Lion. Maiden. Scales."))
        self.assertIsNotNone(SENSITIVE.search("select mother_maiden_name from profiles"))
        unrelated = "create or replace function public.profile_label(p uuid) returns text as $$ select nationality from profiles $$;"
        self.assertEqual(violations_in_sql(unrelated), [])


if __name__ == "__main__":
    unittest.main()
