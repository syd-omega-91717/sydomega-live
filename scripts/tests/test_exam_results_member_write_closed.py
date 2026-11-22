"""Members must not be able to write exam results or mint certificates, axis progress and points from client-supplied scores.

submit_exam_result(p_exam_id, p_score, p_total, p_cert_name) is SECURITY DEFINER and granted to authenticated, and exam_results has INSERT granted to authenticated
(0003_omega_exams.sql); trg_award_exam_points (0005) pays 25 points per passed row. Proved on a throwaway Postgres 16 (proof file beside the proposal): 100/100 accepted,
50 forged certificates, Knowledge axis 1 -> 9, 2,500 points before; 0/100 after. This keeps what CI can: the guarded revokes, that the proposal stays out of the migration
path until applied, and the repository facts its safety rests on (no caller, no other writer).
"""
import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = "20261122140000_close_exam_results_member_write.sql"


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


SQL = read(os.path.join(ROOT, "docs", "proposed-migrations", NAME))
CODE = re.sub(r"\s+", " ", re.sub(r"--[^\n]*", "", SQL)).lower()
# the only migrations allowed to mention the writers: where they are defined, redefined and granted
# 20260818000551 only runs REVOKE ... FROM PUBLIC on my_exam_results()/submit_exam_result(): it neither calls nor writes, and it leaves the GRANT TO authenticated from 0003 in
# place (a revoke from PUBLIC does not remove a role-specific grant), which is why the hole survives it.
# 20261007001000 creates private.submit_exam_result, a stub that always refuses; nothing in migrations/ routes public.submit_exam_result to it, so it neither writes exam_results nor
# protects the public function (read, not assumed: the public function is defined once, in 0003).
DEFINING = {"0003_omega_exams.sql", "0005_omega_sovereign_points.sql", "20260818000551_revoke_anon_execute_and_harden_search_path.sql",
            "20261007001000_omega_sensitive_action_aal2_20261007.sql"}


def client_files():
    return (glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "*.js")) + glob.glob(os.path.join(ROOT, "*.mjs"))
            + glob.glob(os.path.join(ROOT, "supabase", "functions", "**", "*.ts"), recursive=True))


class ExamResultsMemberWriteClosed(unittest.TestCase):
    def test_both_writers_are_revoked_behind_existence_guards(self):
        self.assertIn("to_regclass('public.exam_results') is not null", CODE)
        self.assertIn("to_regprocedure('public.submit_exam_result(text,integer,integer,text)') is not null", CODE)
        self.assertRegex(CODE, r"revoke insert, update, delete on public\.exam_results from public, anon, authenticated;")
        self.assertRegex(CODE, r"revoke execute on function public\.submit_exam_result\(text, integer, integer, text\) from public, anon, authenticated, service_role;")
        self.assertNotIn("grant ", CODE, "the proposal must not grant anything")

    def test_select_is_kept_so_members_can_still_read_their_history(self):
        self.assertNotRegex(CODE, r"revoke[^;]*\bselect\b")

    def test_the_proposal_stays_out_of_the_migration_path_until_applied(self):
        self.assertFalse(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*close_exam_results*")), "merging must not apply it")
        self.assertNotIn("close_exam_results", read(os.path.join(ROOT, "supabase", "pending-migrations.json")))
        self.assertTrue(os.path.isfile(os.path.join(ROOT, "docs", "proposed-migrations", NAME.replace(".sql", ".proof.sql"))), "the throwaway proof ships with it")

    def test_nothing_in_the_client_or_edge_functions_writes_exam_results_or_calls_the_rpc(self):
        hits = []
        for f in client_files():
            s = read(f)
            if re.search(r"""rpc\(\s*['"]submit_exam_result['"]""", s) or re.search(r"""from\(\s*['"]exam_results['"]\s*\)\s*\.\s*(insert|upsert|update|delete)""", s):
                hits.append(os.path.relpath(f, ROOT))
        self.assertEqual(hits, [], "a caller exists: revoking would break it, re-read the proposal")

    def test_the_live_exam_flow_uses_the_server_graded_path(self):
        page = read(os.path.join(ROOT, "courses.html"))
        self.assertIn("submit_exam_attempt", page)
        self.assertNotIn("submit_exam_result", page)

    def test_no_other_migration_writes_exam_results_or_calls_the_function(self):
        callers = []
        for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql"))):
            name = os.path.basename(f)
            if name in DEFINING:
                continue
            body = re.sub(r"--[^\n]*", "", read(f))
            if re.search(r"(?is)\b(insert\s+into|update|delete\s+from)\s+(public\.)?exam_results\b", body) or re.search(r"submit_exam_result\s*\(", body, re.I):
                callers.append(name)
        self.assertEqual(callers, [], "another migration writes exam_results or calls the function: the proposal assumed none does")

    def test_public_function_is_defined_once_and_never_redirected_to_the_disabled_private_stub(self):
        defs = [os.path.basename(f) for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql")))
                if re.search(r"(?i)create\s+(or\s+replace\s+)?function\s+public\.submit_exam_result\s*\(", read(f))]
        self.assertEqual(defs, ["0003_omega_exams.sql"], "public.submit_exam_result was redefined: re-read the proposal, the proof used the 0003 body")
        for f in glob.glob(os.path.join(ROOT, "supabase", "migrations", "*.sql")):
            body = re.sub(r"--[^\n]*", "", read(f))
            self.assertNotRegex(body, r"(?is)public\.submit_exam_result[^;]*private\.submit_exam_result", os.path.basename(f))

    def test_the_scanners_have_teeth(self):
        self.assertTrue(re.search(r"""rpc\(\s*['"]submit_exam_result['"]""", "sb.rpc('submit_exam_result',{p_exam_id:'x'})"))
        self.assertTrue(re.search(r"""from\(\s*['"]exam_results['"]\s*\)\s*\.\s*(insert|upsert|update|delete)""", "sb.from('exam_results').insert({passed:true})"))
        weakened = CODE.replace("from public, anon, authenticated;", "from public;", 1)
        self.assertNotRegex(weakened, r"revoke insert, update, delete on public\.exam_results from public, anon, authenticated;")
        weakened = CODE.replace("authenticated, service_role;", "service_role;", 1)
        self.assertNotRegex(weakened, r"revoke execute on function public\.submit_exam_result\(text, integer, integer, text\) from public, anon, authenticated, service_role;")


if __name__ == "__main__":
    unittest.main()
