"""advance_matrix(int, text) lets any signed-in member raise any track's axes and mint points; the proposal closes it.

The original throwaway Postgres 16 proof tested the public-wrapper revoke only (324 calls accepted before, refused after). It did not test the private function's direct authenticated permission. The corrected dual-revoke still needs a fresh throwaway replay and has not been applied on Supabase; see docs/fixes/2026-11-15-close-advance-matrix.md.
This file keeps what CI can: both entry-point revokes, that the proposal stays out of the migration path, and the two repository facts its safety rests on - NOTHING calls the function,
and NOTHING else writes matrix_progress. Live grant facts are recorded separately; the corrected dual-revoke still needs a fresh throwaway replay before owner approval.
"""
import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = "20261122105012_20261122110000_close_advance_matrix_member_execution.sql"
def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


SQL = read(os.path.join(ROOT, "supabase", "migrations", NAME))
# comments stripped, whitespace collapsed: the applied migration wraps its REVOKEs over several lines
CODE = re.sub(r"\s+", " ", re.sub(r"--[^\n]*", "", SQL)).lower()

# the only SQL files allowed to mention the function: where it is defined/granted/revoked, and one explanatory comment
DEFINING = {"0003_omega_exams.sql", "0004_omega_nested_matrix.sql", "20260818000551_revoke_anon_execute_and_harden_search_path.sql"}
# the only writers of matrix_progress: my_matrix() seeds the default row, advance_matrix is the one UPDATE
WRITERS = {("0004_omega_nested_matrix.sql", "insert"), ("0004_omega_nested_matrix.sql", "update")}



class AdvanceMatrixClosed(unittest.TestCase):
    def test_the_proposal_revokes_both_public_and_private_entry_points(self):
        self.assertRegex(CODE, r"revoke execute on function public\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")
        self.assertRegex(CODE, r"revoke execute on function private\.advance_matrix\(integer, text\) from public, anon, authenticated, service_role;")
        self.assertNotIn("grant execute", CODE, "the proposal must not grant anything")

    def test_the_closure_is_applied_and_recorded_not_pending(self):
        # the closure was applied live (PR 1520): it is in the migration path, recorded in the provider ledger, and not pending
        import json
        version = NAME.split("_")[0]
        remote = json.loads(read(os.path.join(ROOT, "supabase", "remote-migrations.json")))["versions"]
        self.assertIn(version, [str(v) for v in remote], "an applied migration must be in the provider ledger snapshot")
        self.assertNotIn(version, read(os.path.join(ROOT, "supabase", "pending-migrations.json")))
        self.assertFalse(glob.glob(os.path.join(ROOT, "docs", "proposed-migrations", "*close_advance_matrix*")), "the superseded proposal must not linger")

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
        # the option that used to store the name was removed with the closure; no page may offer it
        self.assertEqual(len(re.findall(r"advance_matrix", page)), 0)
        # ...and nothing reads action_key and runs it
        for f in glob.glob(os.path.join(ROOT, "supabase", "functions", "**", "*.ts"), recursive=True) + glob.glob(os.path.join(ROOT, "*.js")):
            self.assertNotRegex(read(f), r"action_key", os.path.relpath(f, ROOT))

    def test_no_sql_function_calls_it(self):
        callers = []
        for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql"))):
            name = os.path.basename(f)
            if name in DEFINING or name == NAME or name.startswith("20261115"):
                continue
            body = re.sub(r"--[^\n]*", "", read(f))
            if re.search(r"advance_matrix\s*\(", body, re.I):
                callers.append(name)
        self.assertEqual(callers, [], "a SQL function calls it; the closure assumed none does")
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
                         "a new writer of matrix_progress exists: the proposal says there is no event-checked path, so re-read it")

    def test_the_scanners_have_teeth(self):
        # a planted caller, a planted writer, and either weakened revoke must be seen
        self.assertTrue(re.search(r"""rpc\(\s*['"]advance_matrix['"]""", "sb.rpc('advance_matrix',{p_track:1})"))
        self.assertTrue(re.search(r"(?is)\b(update|insert\s+into)\s+(?:public\.)?matrix_progress\b", "UPDATE public.matrix_progress SET a=9"))
        full = "from public, anon, authenticated, service_role;"
        pub = r"revoke execute on function public\.advance_matrix\(integer, text\) " + full
        prv = r"revoke execute on function private\.advance_matrix\(integer, text\) " + full
        # the real text must match, so a weakened copy failing to match proves the pattern bites rather than never matching
        self.assertRegex(CODE, pub)
        self.assertRegex(CODE, prv)
        self.assertEqual(CODE.count(full), 2, "exactly the two revokes carry the full role list")
        weakened_public = CODE.replace(full, "from public;", 1)   # first occurrence is the public function's
        weakened_private = CODE[::-1].replace(full[::-1], "from public;"[::-1], 1)[::-1]  # last occurrence is the private function's
        self.assertNotRegex(weakened_public, pub)
        self.assertNotRegex(weakened_private, prv)


if __name__ == "__main__":
    unittest.main()
