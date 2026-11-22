"""advance_matrix(int, text) let any signed-in member raise any track's axes and mint points; the proposed migration closes it.

Proven on a throwaway Postgres 16 with the live shape (invoker wrapper over a definer function): 324 calls accepted on both the public and the
private path and 576 points minted before; 0 of 324 and 0 points after. The migration is existence-guarded because a fresh replay defines only
public.advance_matrix. This file keeps what CI can: both revokes, no grant, that it stays out of the migration path until applied, and the two
repository facts its safety rests on - NOTHING calls the function, and NOTHING else writes matrix_progress. See docs/fixes/2026-11-15-close-advance-matrix.md.
"""
import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = "20261122110000_close_advance_matrix.sql"
def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


SQL = read(os.path.join(ROOT, "docs", "proposed-migrations", NAME))
CODE = re.sub(r"--[^\n]*", "", SQL).lower()

# the only SQL files allowed to mention the function: where it is defined/granted/revoked, and one explanatory comment
DEFINING = {"0003_omega_exams.sql", "0004_omega_nested_matrix.sql", "20260818000551_revoke_anon_execute_and_harden_search_path.sql"}
# the only writers of matrix_progress: my_matrix() seeds the default row, advance_matrix is the one UPDATE
WRITERS = {("0004_omega_nested_matrix.sql", "insert"), ("0004_omega_nested_matrix.sql", "update")}



class AdvanceMatrixClosed(unittest.TestCase):
    def test_the_migration_revokes_both_public_and_private_entry_points(self):
        # each revoke is guarded by to_regprocedure so a fresh replay (which has no private copy) does not abort
        self.assertRegex(CODE, r"to_regprocedure\('public\.advance_matrix\(integer,text\)'\) is not null")
        self.assertRegex(CODE, r"to_regprocedure\('private\.advance_matrix\(integer,text\)'\) is not null")
        self.assertRegex(CODE, r"revoke execute on function public\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")
        self.assertRegex(CODE, r"revoke execute on function private\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")
        self.assertNotIn("grant execute", CODE, "the migration must not grant anything")

    def test_the_proposal_stays_out_of_the_migration_path_until_it_is_applied_live(self):
        # main's pinned policy (test_main_merge_integrity, test_migration_pending_boundary): the pending registry is empty and every source
        # migration is already in the provider ledger. So it moves into supabase/migrations/ together with its remote-migrations.json entry,
        # after the owner applies it. Merging this file applies nothing.
        self.assertFalse(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*close_advance_matrix*")), "merging must not apply it")
        self.assertNotIn("close_advance_matrix", read(os.path.join(ROOT, "supabase", "pending-migrations.json")))
        self.assertTrue(os.path.isfile(os.path.join(ROOT, "docs", "proposed-migrations", NAME.replace(".sql", ".proof.sql"))), "the throwaway proof ships with it")

    def test_nothing_in_the_client_or_the_edge_functions_calls_it(self):
        hits = []
        files = (glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "*.js")) + glob.glob(os.path.join(ROOT, "*.mjs"))
                 + glob.glob(os.path.join(ROOT, "supabase", "functions", "**", "*.ts"), recursive=True))
        for f in files:
            s = read(f)
            if re.search(r"""rpc\(\s*['"]advance_matrix['"]""", s):
                hits.append(os.path.relpath(f, ROOT))
        self.assertEqual(hits, [], "a caller exists: revoking would break it, re-read the proposal")

    def test_automation_only_stores_the_name_as_text(self):
        # the one place the name appears in a page is an <option value>, written to automation_rules.action_key
        page = read(os.path.join(ROOT, "automation.html"))
        self.assertEqual(len(re.findall(r"advance_matrix", page)), 1)
        self.assertIn('<option value="advance_matrix">', page)
        # ...and nothing reads action_key and runs it
        for f in glob.glob(os.path.join(ROOT, "supabase", "functions", "**", "*.ts"), recursive=True) + glob.glob(os.path.join(ROOT, "*.js")):
            self.assertNotRegex(read(f), r"action_key", os.path.relpath(f, ROOT))

    def test_no_sql_function_calls_it(self):
        callers = []
        for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql"))):
            name = os.path.basename(f)
            if name in DEFINING or name.startswith("20261115") or name == NAME:
                continue
            body = re.sub(r"--[^\n]*", "", read(f))
            if re.search(r"advance_matrix\s*\(", body, re.I):
                callers.append(name)
        self.assertEqual(callers, [], "a SQL function calls it; the proposal assumed none does")
        # the defining files may only DEFINE, GRANT or REVOKE it; the exam migration's mention is a comment
        exams = re.sub(r"--[^\n]*", "", read(os.path.join(ROOT, "supabase", "migrations", "0003_omega_exams.sql")))
        self.assertNotRegex(exams, r"advance_matrix")

    def test_nothing_else_writes_matrix_progress(self):
        found = set()
        for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql"))):
            body = re.sub(r"--[^\n]*", "", read(f))
            for m in re.finditer(r"(?is)\b(update|insert\s+into)\s+(?:public\.)?matrix_progress\b", body):
                found.add((os.path.basename(f), m.group(1).split()[0].lower()))
        self.assertEqual(found, WRITERS,
                         "a new writer of matrix_progress exists: the fix says there is no event-checked path, so re-read it")

    def test_the_scanners_have_teeth(self):
        # a planted caller, a planted writer, and either weakened revoke must be seen
        self.assertTrue(re.search(r"""rpc\(\s*['"]advance_matrix['"]""", "sb.rpc('advance_matrix',{p_track:1})"))
        self.assertTrue(re.search(r"(?is)\b(update|insert\s+into)\s+(?:public\.)?matrix_progress\b", "UPDATE public.matrix_progress SET a=9"))
        weakened_public = SQL.replace(
            "revoke execute on function public.advance_matrix(integer, text) from public, anon, authenticated, service_role;",
            "revoke execute on function public.advance_matrix(integer, text) from public;", 1)
        weakened_private = SQL.replace(
            "revoke execute on function private.advance_matrix(integer, text) from public, anon, authenticated, service_role;",
            "revoke execute on function private.advance_matrix(integer, text) from public;", 1)
        self.assertNotRegex(re.sub(r"--[^\n]*", "", weakened_public).lower(),
                            r"revoke execute on function public\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")
        self.assertNotRegex(re.sub(r"--[^\n]*", "", weakened_private).lower(),
                            r"revoke execute on function private\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")


if __name__ == "__main__":
    unittest.main()
